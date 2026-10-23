# 00 - RESUMO EXECUTIVO: AUDITORIA COMPARATIVA 99 × PARTIU
## DIAGNÓSTICO TÉCNICO, ADERÊNCIA AO NEGÓCIO E ESTRATÉGIA DE EVOLUÇÃO

> **Data da Auditoria:** 21 de Outubro de 2026  
> **Comitê Técnico:** Arquitetura de Sistemas Distribuídos, Engenharia Reversa Móvel, Produto, Unit Economics & FinOps, QA e Segurança.  
> **Fontes Primárias:** 
> 1. Auditoria Forense do APK da 99 (`com.taxis99`, v4250, SHA-256 `E42ABB98...`, 17 DEXs, 16 relatórios em `C:\Users\Suporte\Desktop\99 Apk\AUDITORIA_REA`).
> 2. Inspeção Estática e Dinâmica do Código-Fonte do PARTIU (`NOVO PARTIU-MOBE`, React 19 / Vite / TanStack Router, Supabase, PostGIS, 42 rotas, suíte de 55 suítes de testes unitários).
> **Modo de Operação:** Auditoria, Investigação, Comparação e Planejamento Estratégico (Somente Leitura sobre o código executável; ZERO implementação nesta fase).

---

### 1. Veredicto Executivo Geral

O projeto **PARTIU** apresenta uma maturidade arquitetural e de engenharia surpreendentemente robusta no núcleo web/serverless, possuindo diferenciais que **superam o modelo da 99 em transparência financeira e alinhamento com motoristas**:
1. **Modelo Pure SaaS (Taxa Zero de Comissão):** Enquanto a 99 retém entre 15% e 30% do valor bruto de cada corrida em um modelo de intermediação tradicional, o PARTIU consolidou no banco de dados um modelo de assinatura de acesso diário/semanal/mensal com 0.0% de comissão por corrida (`trg_rides_zero_commission`), gerando repasse imediato e previsibilidade total ao parceiro.
2. **Arquitetura de Mapas Agnóstica:** O PARTIU já possui uma camada abstrata de provedor de mapas (`MapProviderFactory`) com suporte a Mapbox GL e Google Maps por tenant white-label, e suporte a lançamento externo de rotas no Waze via deep link.
3. **Segurança de Entregas Superior:** O módulo de entregas do PARTIU implementa validação de Duplo PIN (coleta e entrega com código de 4 dígitos e cadeia de custódia cega), mais avançado que a validação simples de PIN observada na 99.

Por outro lado, o PARTIU apresenta **quatro vulnerabilidades operacionais críticas** quando comparado à resiliência de engenharia da 99:
1. **Fragilidade de Sincronismo em Redes Móveis:** O PARTIU depende primariamente de WebSockets (Supabase Realtime via Postgres CDC). Sem um canal de **Push FCM silencioso primário** e **Polling adaptativo de contingência**, conexões de motoristas em redes 3G/4G instáveis sofrem quedas silenciosas, gerando corridas "fantasmas" ou travadas.
2. **Ausência de Geofencing Automático de Chegada e No-Show:** Na 99, cruzar o raio de 100m do ponto de coleta altera o estado automaticamente para chegada, dispara alerta no passageiro e inicia a tolerância de espera. No PARTIU, o processo ainda depende do clique manual do condutor.
3. **Incoerências de Catálogo de Monetização:** Existem 4 definições divergentes de valores de planos entre arquivos de configuração (`PixBillingService`, `superadmin-config.ts`, `subscription-engine.ts` e `white-label-engine.ts`), exigindo unificação normativa imediata.
4. **Falta de Reatribuição Transparente por Cancelamento do Condutor:** Se o motorista cancela a caminho, a 99 mantém o pedido do passageiro vivo e busca o próximo carro em rota prioritária (`EVENT_ONSERVICE_CANCEL_ORDER_REASSIGN_SUCCESS`); no PARTIU, o cancelamento frequentemente derruba a experiência do passageiro.

---

### 2. O Que o PARTIU Já Tem de Equivalente ou Superior

| Domínio | Capacidade Observada na 99 | Situação Real Comprovada no PARTIU | Veredicto Comparativo |
| :--- | :--- | :--- | :--- |
| **Identidade** | Bloqueio de pedido por CPF irregular | Validação sintática e unicidade estrita por CPF com nome imutável | **Equivalente e Blindado** (Suíte 47 aprovada) |
| **Navegação Externa** | Deep link direto para o Waze | Função `getWazeUrl` com formatação canônica de lat/lng | **Equivalente** (`navigation-launcher.ts`) |
| **Corrida de Rua** | Módulo OpenRide (embarque direto) | Taxímetro Virtual Inteligente com início, pausa, recálculo e PIX | **Superior no PARTIU** (`VirtualTaximeterService`) |
| **Entregas** | Validação por código PIN na entrega | Duplo PIN com validação de coleta, entrega e link WhatsApp | **Superior no PARTIU** (`DeliveryDualPinService`) |
| **Mapas** | Multi-mapas (Google Maps + Hawaii SDK) | `MapProviderFactory` (Mapbox GL + Google Maps) | **Equivalente e Desacoplado** |
| **Telemetria** | Suavização de rotação (*bearing*) | `LiveTrackingEngine` (LERP 60fps e anti-teleport snap) | **Equivalente em Lógica** (Requer polimento visual) |
| **Monetização** | Comissão percentual (15% a 30%) | Pure SaaS com 0% de comissão e planos de diária/semanal/mensal | **Estrategicamente Superior** para atração de condutores |

---

### 3. As 5 Principais Oportunidades Prioritárias para o PARTIU

1. **[P0] Redundância de Sincronismo (Push FCM Silencioso + Polling Adaptativo de Fallback):** Eliminar a dependência exclusiva de WebSockets, replicando o modelo híbrido da 99 (`SCENE_CODE_POLL_ORDER_STATUS_UPDATE_INTERVAL`) para garantir que nenhuma corrida seja perdida por oscilação de sinal 4G.
2. **[P0] Saneamento e Unificação Canônica dos Catálogos de Monetização:** Eliminar as discrepâncias entre planos diários/semanais/mensais, definindo uma única tabela no Supabase como fonte da verdade para o motor de faturamento PIX.
3. **[P1] Geofencing Automático de Chegada e Tolerância de Espera com No-Show:** Detectar chegada a 150m, alertar passageiro por som/vibração e cronometrar 5 minutos de espera para habilitar cobrança de taxa de cancelamento justa.
4. **[P1] Reatribuição Transparente em Cancelamento do Condutor a Caminho:** Evitar o cancelamento total do pedido se o motorista desistir, buscando instantaneamente o próximo condutor na fila de proximidade PostGIS.
5. **[P2] Despacho de Corridas Consecutivas (*Back-to-Back Dispatch*):** Enviar nova oferta ao motorista quando ele estiver a menos de 2 km / 3 min de concluir a corrida atual, reduzindo o tempo ocioso em até 35%.

---

### 4. O Que Descartar Categoricamente (Conflito com a Anti-Visão)
* **99 Negocia / Flex (Leilão de Tarifas):** A 99 adota o leilão aberto de valores onde motoristas disputam corridas por preços menores. Essa mecânica viola frontalmente a Seção 6 do [docs/ux/vision.md](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/docs/ux/vision.md): *"O PARTIU recusa categoricamente se tornar: Um leilão predatório de corridas onde motoristas são induzidos a disputar valores abaixo do custo operacional"*. Deve ser **rejeitado**.
