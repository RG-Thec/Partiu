# 04 - ANÁLISE COMPARATIVA APROFUNDADA DO MOTOR DE CORRIDAS E DESPACHO

> **Foco de Engenharia:** Comparação do ciclo de vida, despacho serial, concorrência, telemetria e resiliência de conexão entre 99 e PARTIU.

---

### 1. Comparativo das Máquinas de Estados

```
                    CICLO 99 (13 ESTADOS FORENSES)                      │                CICLO ATUAL DO PARTIU
────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────
1. ORDER_STATUS_WAIT_RESPONSE (Criação e matching)                      │ 1. PENDING (Aguardando motoristas)
2. ORDER_STATUS_WAIT_RESPONSE_ASSIGN_DOING (Oferta individual em janela)│ 2. DISPATCHING (Cascata de 10s por candidato)
3. ORDER_STATUS_WAIT_RESPONSE_ASSIGN_SUCCESS (Aceite do motorista)      │ 3. ACCEPTED (Motorista aceitou via RPC atômica)
4. ORDER_STATUS_ASSIGN_TIMEOUT (Tempo esgotado -> próx. motorista)      │ 4. TIMEOUT / ADVANCE (Avança índice da fila)
5. ORDER_STATUS_DOING_WAIT (Deslocamento para coleta)                   │ 5. EN_ROUTE (Motorista a caminho do ponto de embarque)
6. ORDER_STATUS_DOING_DRIVER_ARRIVAL (Chegada no geofence de 150m)      │ 6. ARRIVED (Chegada - atualmente manual)
7. ORDER_STATUS_DOING_TRAVEL_START_SOON (Embarque confirmado)           │ 7. IN_PROGRESS (Corrida iniciada com passageiro a bordo)
8. ORDER_STATUS_DOING (Viagem em trânsito)                              │ 8. IN_PROGRESS (Em deslocamento para destino)
9. WAYPOINT_TRIP_STATE_ARRIVED / PASSED (Paradas intermediárias)        │ 9. [Paradas sem estado formal persistido no banco]
10. ORDER_STATUS_NOT_PAY (Chegada ao destino, pendente de liquidação)   │ 10. COMPLETED (Viagem encerrada)
11. ORDER_STATUS_PAY_FINISH (Liquidação concluída com sucesso)          │ 11. PAID (Liquidação financeira confirmada)
12. ORDER_STATUS_CANCEL_TRIP_NOPAY / PAID (Bifurcação de taxa)          │ 12. CANCELLED (Sem diferenciação de taxa de deslocamento)
13. ORDER_STATUS_CLOSE_ORDER_NO_DRIVER_SERVICE (Esgotado sem motoristas)│ 13. EXHAUSTED (Fila concluída sem aceite)
```

---

### 2. Análise do Motor de Despacho (Matching e Concorrência)

#### A. Ordenação e Heurística de Candidatos
* **Na 99:** A ordenação é executada inteiramente em microsserviços proprietários de backend baseados em aprendizado de máquina e redes neurais de alocação de frota combinatória.
* **No PARTIU:** O PARTIU possui um serviço de alta precisão implementado em `MatchingEngine.ts` que calcula o `DispatchScore` transparente:
  $$\text{DispatchScore} = 0.40 \cdot S_{\text{dist}} + 0.25 \cdot S_{\text{eta}} + 0.15 \cdot S_{\text{plano}} + 0.10 \cdot S_{\text{aceite}} + 0.05 \cdot S_{\text{nota}} - 0.05 \cdot S_{\text{cancel}}$$
* **Vantagem Competitiva do PARTIU:** Os motoristas parceiros sabem exatamente por que recebem chamadas: motoristas assinantes do plano Ouro e com baixas taxas de cancelamento recebem prioridade objetiva.

#### B. Prevenção de Concorrência e *Race Conditions*
* **Na 99:** Controle transacional no cluster de despacho em nuvem.
* **No PARTIU:** A RPC PostgreSQL `partiu_aceitar_corrida_atomica` utiliza `SELECT ... FOR UPDATE` no registro da corrida. Se dois condutores clicarem no milissegundo de transição, apenas o primeiro tem a transação confirmada, devolvendo erro amigável ao segundo condutor.

---

### 3. A Grande Lacuna: Resiliência de Sincronismo (Push vs. WebSocket)

A maior discrepância técnica identificada entre os dois sistemas reside no transporte de dados de tempo real:
* **Problema no PARTIU:** 
  O PARTIU confia na permanência da conexão WebSocket gerenciada pelo Supabase Realtime. Em dispositivos Android, quando o aplicativo entra em segundo plano ou o aparelho entra em *Doze Mode* para economizar energia, o sistema operacional corta as conexões TCP de segundo plano. O motorista perde o chamado e a corrida expira sem que o condutor veja.
* **Solução Comprovada na 99 (`DIDI_TRAVEL_EVENT_PUSH_ORDER_STATUS` + `SCENE_CODE_POLL_ORDER_STATUS`):**
  1. O despachante envia um **Push FCM de Alta Prioridade** com payload de dados. O Android acorda o processo em background e toca o toque de chamada instantaneamente.
  2. Caso o aparelho esteja com conectividade ruim, o aplicativo dispara requisições HTTP de reconciliação em intervalos adaptativos (polling de segurança a cada 3s).
* **Plano de Correção para o PARTIU:**
  Implementar na Edge Function de despacho o disparo de push notification silenciosa via Firebase Cloud Messaging (FCM) para o token do motorista sorteado, associado a um mecanismo de polling leve no cliente como fallback.
