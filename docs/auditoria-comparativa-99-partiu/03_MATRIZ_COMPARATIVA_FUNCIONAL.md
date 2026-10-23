# 03 - MATRIZ COMPARATIVA FUNCIONAL SISTEMÁTICA: 99 × PARTIU

> **Metodologia de Análise:** Comparação exaustiva cruzando evidências de engenharia reversa do APK 99 (`C:\Users\Suporte\Desktop\99 Apk\AUDITORIA_REA`) com a base de código real verificável do PARTIU.

---

### Domínio 1: Experiência do Passageiro (Rider)

| # | Funcionalidade | Evidência 99 (Confiança) | Situação PARTIU | Evidência PARTIU | Diferença Funcional | Valor Pax / Motorista | Impacto Monetização | Esforço / Risco | Recomendação Final |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1.1** | **Cadastro e CPF Único** | `EVENT_ONE_KEY_SEND_ORDER_BLOCKING_BY_CPF` [CONFIRMADO] | Implementado e validado | `DriverFleetService.ts` + Suíte 47 | PARTIU valida CPF com algoritmo oficial e trava nome imutável | Alto (Segurança) / Alto (Confiabilidade) | Previne fraude e contas fantasmas | Baixo / Baixo | **Manter e Consolidar** |
| **1.2** | **Busca de Endereços & POIs** | `SugMapPoiSelectFragment` [CONFIRMADO] | Implementado | `MapboxMapProvider.geocode` | 99 usa motor Hawaii próprio; PARTIU usa Mapbox Geocoding | Alto (Rapidez) / Neutro | Custo de API por busca Mapbox | Baixo / Baixo | **Manter** |
| **1.3** | **Múltiplas Paradas (Waypoints)** | `ISugWayPointPageView` e estados de Waypoints [CONFIRMADO] | Parcialmente implementado | Modelos de rota suportam paradas; UI incompleta | 99 tem recálculo automático em trânsito; PARTIU exige refinamento | Alto (Conveniência) / Médio (Mais ganhos) | Aumenta valor da corrida | Médio / Médio | **Incorporar no Roadmap** |
| **1.4** | **Cotação Multi-Categoria** | `estimate_get_multi_estimate_price_new` [CONFIRMADO] | Implementado e validado | `partiu-pricing-routing-v4.test.ts` | 99 cota Pop, Comfort, Negocia, Entrega; PARTIU cota Pop, Comfort, Moto, Entrega | Alto (Poder de escolha) / Alto | Permite segmentação de margem | Baixo / Baixo | **Manter e Refinar** |
| **1.5** | **Preço Travado (Lock Price)** | `LOCK_PRICE_TAG_TYPE` [CONFIRMADO] | Implementado | Cálculo em centavos fixado na criação da corrida | Ambos travam o preço da corrida no momento do aceite | Alto (Previsibilidade) / Alto (Sem brigas) | Reduz cancelamento por surpresa | Baixo / Baixo | **Manter** |
| **1.6** | **99 Negocia / Leilão (Flex)** | `FlexOfferPriceActivity` [CONFIRMADO] | Ausente | Rejeitado por definição | 99 permite leilão predatório; PARTIU foca em tarifa justa | Baixo / Prejudica motoristas | Canibaliza tarifa e receita | Alto / Alto | **Rejeitar (Anti-Visão)** |
| **1.7** | **Acompanhamento LERP (60fps)** | `cameraBearing`, `calculateBearing` [CONFIRMADO] | Implementado e validado | `LiveTrackingEngine.ts` | 99 usa interpolador nativo; PARTIU usa LERP + snap anti-teleporte | Alto (Fluidez visual) / Neutro | Retenção visual no app | Médio / Baixo | **Manter e Ajustar UI** |
| **1.8** | **Reatribuição Transparente** | `EVENT_ONSERVICE_CANCEL_ORDER_REASSIGN_SUCCESS` [FORTEMENTE INDICADO] | Parcial | Lógica existe no banco, mas UI do pax reseta | 99 mantém passageiro buscando sem perder pedido se motorista cancela | Crítico (Retenção) / Alto | Evita churn de passageiro | Médio / Médio | **Incorporar Prioritariamente** |
| **1.9** | **Bifurcação de Cancelamento** | `CANCEL_TRIP_NOPAY` vs `PAID` [CONFIRMADO] | Parcial / Interface sem regra completa | Cancelamento direto sem cálculo de taxa de deslocamento | 99 isenta nos 2 primeiros minutos e cobra se motorista deslocou; PARTIU cancela plano | Alto (Justiça) / Crítico (Remunera deslocamento) | Retém condutores e gera taxa | Médio / Médio | **Incorporar Prioritariamente** |
| **1.10** | **Gravação de Áudio (Jarvis)** | `TripRecordingActivity` [CONFIRMADO] | Ausente | Apenas botão SOS telefônico | 99 grava áudio criptografado na cabine; PARTIU apenas liga 190 | Muito Alto (Proteção de mulheres) / Alto | Diferencial competitivo regional | Médio / Médio | **Incorporar em Fase Futura** |

---

### Domínio 2: Experiência do Motorista (Driver)

| # | Funcionalidade | Evidência 99 (Confiança) | Situação PARTIU | Evidência PARTIU | Diferença Funcional | Valor Pax / Motorista | Impacto Monetização | Esforço / Risco | Recomendação Final |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **2.1** | **Disponibilidade e Status** | `DRIVER_ORDER_STATE_CHANGED` [CONFIRMADO] | Implementado e validado | `DriverLocationService.setOperatingState` | Ambos controlam OFFLINE, ONLINE_IDLE, ON_TRIP | Neutro / Crítico (Controle) | Base para faturamento e despacho | Baixo / Baixo | **Manter** |
| **2.2** | **Alerta Sonoro de Chamada** | `wait_driver_page` [CONFIRMADO] | Implementado e validado | `CallAlertService.ts` + Suíte 30 | Ambos tocam áudio e vibram em loop de contagem regressiva | Neutro / Crítico (Aviso no trânsito) | Reduz tempo de aceite | Baixo / Baixo | **Manter** |
| **2.3** | **Assistente de Voz (TTS)** | `uni_api` audio service [CONFIRMADO] | Implementado e validado | `DriverVoiceAssistantService.ts` | PARTIU lê nome do pax e destino via Web Speech API | Alto / Crítico (Segurança ao volante) | Aumenta engajamento | Baixo / Baixo | **Manter** |
| **2.4** | **Navegação Waze Integrada** | `https://waze.com/ul?ll=...` [CONFIRMADO] | Implementado e validado | `src/utils/navigation-launcher.ts` | Ambos disparam rota pronta no Waze com `navigate=yes` | Alto / Crítico (Preferência nacional) | Economiza bateria e dados | Baixo / Baixo | **Manter e Promover na UI** |
| **2.5** | **Geofencing de Chegada** | `ORDER_STATUS_DOING_DRIVER_ARRIVAL` [CONFIRMADO] | Parcial | Código em teste, mas exige toque manual na tela | 99 dispara chegada automático a 150m e inicia timer; PARTIU é manual | Alto / Alto (Evita brigas de embarque) | Habilita cobrança justa de no-show | Baixo / Baixo | **Incorporar Prioritariamente** |
| **2.6** | **Tolerância de Espera (No-Show)** | Cronômetro de 5 min [FORTEMENTE INDICADO] | Ausente na UI | Não há cronômetro de espera ativo no cockpit | 99 libera cancelamento pago após 5 min no ponto; PARTIU não cobra | Justo / Crítico (Valoriza hora parada) | Gera receita de cancelamento | Baixo / Baixo | **Incorporar Prioritariamente** |
| **2.7** | **Corridas Consecutivas (*Back-to-Back*)** | `EVENT_POINT_PASSED_OF_CONTINUOUS_ORDERS` [FORTEMENTE INDICADO] | Ausente | Nenhuma implementação encontrada | 99 despacha nova corrida nos últimos 2 km da atual; PARTIU exige finalizar | Reduz espera / Elimina tempo ocioso | Aumenta volume de corridas | Médio / Médio | **Incorporar em Onda 2** |
| **2.8** | **Trava de Débito (Debt Cutoff)** | Bloqueio financeiro interno [FORTEMENTE INDICADO] | Implementado e validado | `DriverWalletEngine.ts` (Trava aos R$ 50,00) | PARTIU possui aviso preventivo aos 80% e bloqueio estrito com PIX Copia e Cola | Neutro / Crítico (Saúde financeira) | Assegura adimplência do SaaS | Baixo / Baixo | **Manter e Proteger** |

---

### Domínio 3: Motor de Corridas e Despacho (Dispatch Engine)

| # | Funcionalidade | Evidência 99 (Confiança) | Situação PARTIU | Evidência PARTIU | Diferença Funcional | Valor Pax / Motorista | Impacto Monetização | Esforço / Risco | Recomendação Final |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **3.1** | **Fórmula de Despacho (Score)** | Heurística em nuvem [NÃO OBSERVÁVEL] | Implementado e validado | `MatchingEngine.ts` (40% Dist, 25% ETA, etc.) | PARTIU possui fórmula determinística auditável e aberta | Alto / Alto (Critério transparente) | Bonifica planos superiores (Ouro) | Baixo / Baixo | **Manter** |
| **3.2** | **Despacho em Cascata Serial** | `ORDER_STATUS_WAIT_RESPONSE_ASSIGN_DOING` [CONFIRMADO] | Parcialmente implementado | `DispatchQueueBuilder.ts` (Janela de 10s) | Ambos enviam para 1 motorista por vez com contagem regressiva | Neutro / Crítico (Foco na direção) | Evita corrida de dedo predatória | Baixo / Baixo | **Corrigir Mock nos Testes** |
| **3.3** | **Lock Atômico de Aceite** | Transacional em nuvem [CONFIRMADO] | Implementado e validado | RPC `partiu_aceitar_corrida_atomica` (`FOR UPDATE`) | Ambos impedem condição de corrida de dois motoristas pegarem o mesmo pedido | Confiabilidade / Confiabilidade | Evita conflitos e reembolsos | Baixo / Baixo | **Manter** |
| **3.4** | **Sincronismo Híbrido (Push + Polling)** | Push FCM + `SCENE_CODE_POLL_ORDER_STATUS` [CONFIRMADO] | Ausente / WebSocket único | `RealtimeConnectionManager.ts` | 99 tem redundância dupla; PARTIU perde estado se socket cair no 4G | Crítico (Estabilidade) / Crítico | Reduz suporte e cancelamento falso | Médio / Médio | **Incorporar Prioritariamente** |
| **3.5** | **Deadband Inteligente de GPS** | Filtro de telemetria [CONFIRMADO] | Implementado e validado | `DriverLocationService.ts` (30m / 5s) | Ambos economizam bateria e evitam flood no banco de dados | Neutro / Alto (Economia de bateria) | Reduz custos de infraestrutura | Baixo / Baixo | **Manter** |

---

### Domínio 4: Monetização e Modelo de Negócios

| # | Funcionalidade | Evidência 99 (Confiança) | Situação PARTIU | Evidência PARTIU | Diferença Funcional | Valor Pax / Motorista | Impacto Monetização | Esforço / Risco | Recomendação Final |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **4.1** | **Comissão por Corrida** | Take Rate de 15% a 30% [CONFIRMADO] | 0.0% por trigger de banco | `trg_rides_zero_commission` | 99 cobra do motorista a cada viagem; PARTIU repassa 100% | Neutro / Incomparável (88-100% de ganho) | Receita previsível via assinatura | Baixo / Baixo | **Manter Diferencial PARTIU** |
| **4.2** | **Assinatura SaaS / Diária de Acesso** | Ausente na 99 (Apenas comissão) | Implementado e validado | `PixBillingService.ts`, `driver-subscription-service.ts` | PARTIU cobra diária (R$ 14,90), semanal ou mensal via PIX | Neutro / Altíssima atratividade | Receita recorrente descolada de volume | Baixo / Baixo | **Unificar Catálogos** |
| **4.3** | **Taxímetro Virtual de Rua** | Módulo OpenRide [CONFIRMADO] | Implementado e validado | `VirtualTaximeterService.ts` | Ambos permitem pegar passageiro na rua; PARTIU gera PIX instantâneo | Confiabilidade / Ganho extra legalizado | Monetiza corridas fora do app | Baixo / Baixo | **Manter** |
