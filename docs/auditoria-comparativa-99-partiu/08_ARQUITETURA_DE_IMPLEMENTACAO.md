# 08 - ARQUITETURA TÉCNICA E MAPEAMENTO DE ARQUIVOS AFETADOS

> **Mapeamento de Engenharia:** Identificação cirúrgica dos arquivos, classes, tipos e migrações do PARTIU que seriam tocados em cada frente recomendada.

---

### Mapeamento Concreto de Código

#### 1. Frente de Sincronismo Híbrido (Push FCM + Polling)
* **Arquivos do Frontend:**
  * `src/services/RealtimeConnectionManager.ts`: Implementar temporizador adaptativo de reconciliação (`SCENE_CODE_POLL_ORDER_STATUS`) que ativa se o status não mudar em 3 segundos.
  * `src/services/DriverLocationService.ts`: Garantir envio de keep-alive periódico.
* **Arquivos do Backend (Supabase):**
  * `supabase/functions/dispatch-ride/index.ts`: Injetar chamada à API do Firebase Cloud Messaging (FCM) enviando payload de dados com `ride_id`, `fare` e `pickup_address`.
  * Nova RPC: `p_get_order_status_spare` para consulta leve e rápida de status sem sobrecarga de banco.

#### 2. Frente de Saneamento dos Catálogos de Monetização
* **Arquivos do Frontend:**
  * `src/services/subscription/PixBillingService.ts`: Remover `DEFAULT_MONETIZATION_PLANS` em memória e passar a ler estritamente de `supabase.from('monetization_plans').select('*')`.
  * `src/lib/superadmin-config.ts`: Depreciar valores estáticos em `configMonetizacaoInicial` e sincronizar com o banco.
  * `src/lib/revenue/subscription-engine.ts` e `src/lib/white-label/white-label-engine.ts`: Remover definições concorrentes de planos com comissão legada.

#### 3. Frente de Geofencing de Chegada e No-Show
* **Arquivos do Frontend:**
  * `src/services/LiveTrackingEngine.ts`: Adicionar método `checkPickupProximity(driverCoords, pickupCoords, radiusMeters = 150)`.
  * `src/routes/app/motorista.tsx`: Adicionar transição automática de estado para `ARRIVED` ao receber evento de proximidade e iniciar componente visual de contagem regressiva de 5 minutos.
* **Arquivos do Backend:**
  * Tabela `rides`: Adicionar coluna `driver_arrived_at timestamp with time zone` para validação server-side da tolerância.

#### 4. Frente de Reatribuição Transparente por Cancelamento do Condutor
* **Arquivos do Backend:**
  * `supabase/migrations/20261021_partiu_on_service_reassign.sql`: Nova RPC atômica `partiu_cancelar_motorista_e_reatribuir` que limpa o `driver_id`, reseta o status para `DISPATCHING` e reinicia o `DispatchQueueBuilder`.
* **Arquivos do Frontend:**
  * `src/routes/app/passageiro.tsx`: Tratar o evento `ONSERVICE_CANCEL_ORDER_REASSIGN_SUCCESS`, exibindo alerta informativo e mantendo o radar de busca ativo sem resetar o destino.

#### 5. Frente de Bifurcação da Taxa de Cancelamento
* **Arquivos do Backend:**
  * Trigger / RPC de cancelamento: Calcular diferença temporal entre `accepted_at` e `cancelled_at`.
  * Se $\Delta t \le 120\text{s}$, registrar cancelamento com taxa zero (`ORDER_STATUS_CANCEL_TRIP_NOPAY`).
  * Se $\Delta t > 120\text{s}$ ou `driver_arrived_at IS NOT NULL`, lançar taxa fixa (ex: R$ 6,00) a ser debitada na próxima corrida do passageiro e repassada ao condutor.
