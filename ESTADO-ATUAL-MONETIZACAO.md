# Estado Atual da Monetização

Auditoria técnica do sistema de monetização da plataforma de mobilidade urbana (modelo de assinatura SaaS para motoristas). Mapeamento estrito do código implementado, sem suposições e sem refatorações.

---

## 1. Modelo de cobrança

### Pontos de cálculo de valores cobrados do motorista

1. **Cálculo da Diária, Semanal e Mensal por Categoria de Veículo:**
   - **Arquivo:** `src/lib/ecosystem/driver-subscription-service.ts`, linhas 301-314 (`generateDailyFeePix`).
   - **Comportamento:** O método calcula o valor monetário a ser cobrado do motorista de acordo com o tipo de veículo (`CARRO` ou `MOTO`) e o ciclo (`DAILY`, `WEEKLY`, `MONTHLY`). Consulta primeiro a parametrização do franqueado (`tenantMonetization?.diariaMoto`, `tenantMonetization?.diariaCarro`, etc.) e, na ausência, utiliza a configuração global de `getMonetizacaoConfig()`.
   - **Abatimento de créditos operacionais:** Linhas 315-328 de `src/lib/ecosystem/driver-subscription-service.ts` abatem créditos operacionais acumulados (`partiu_driver_daily_credits_${driverId}`) com piso mínimo de R$ 1,00.

2. **Cálculo de Fatura SaaS por Ciclo no Motor de Faturamento Pix:**
   - **Arquivo:** `src/services/subscription/PixBillingService.ts`, linhas 338-344 (`createDriverBilling`).
   - **Comportamento:** Seleciona o valor cobrado do plano com base no ciclo: `cycleType === "MONTHLY" ? plan.monthly_fee : cycleType === "WEEKLY" ? plan.weekly_fee : plan.daily_fee`.

3. **Cálculo de Mensalidades em Centavos e Débitos de Assinatura:**
   - **Arquivo:** `src/lib/revenue/subscription-engine.ts`, linhas 276-282 (`createPlan`) e linhas 302-306 (`updatePlan`).
   - **Comportamento:** Converte o valor em BRL para centavos inteiros (`monthlyFeeCents = Math.round(monthlyFeeBrl * 100)`), calcula a diária derivada (`monthlyFeeBrl / 20`) e semanal derivada (`monthlyFeeBrl / 3.5`).

4. **Emissão de Faturas Mensais e Dedução Automática em Saques:**
   - **Arquivo:** `src/lib/revenue/billing-engine.ts`, linhas 148-175 (`generateSubscriptionInvoice`) e linhas 181-248 (`calculateNetWithdrawal`).
   - **Comportamento:** Ao gerar a fatura mensal, converte o valor para centavos e registra dívida na assinatura via `subscriptionEngine.recordDebt`. No ato do saque, `calculateNetWithdrawal` deduz mensalidades e pendências operacionais do saldo disponível antes de liberar a transferência PIX.

5. **Cálculo Server-Side na Edge Function de Pagamento:**
   - **Arquivo:** `supabase/functions/generate-driver-payment/index.ts`, linhas 73-78.
   - **Comportamento:** Determina o montante cobrado a partir da consulta ao banco `monetization_plans`: `cycle_type === "MONTHLY" ? plan.monthly_fee : cycle_type === "WEEKLY" ? plan.weekly_fee : plan.daily_fee`.

6. **Definição de Duração e Intervalo no PostgreSQL:**
   - **Arquivo:** `supabase/migrations/20260909_partiu_driver_access_engine_v4.sql`, linhas 330-337 (`fn_process_driver_pix_confirmation`).
   - **Comportamento:** Atribui o intervalo de validade do plano no banco: `INTERVAL '30 days'` para `MONTHLY`, `INTERVAL '7 days'` para `WEEKLY` e `INTERVAL '24 hours'` para `DAILY`.

---

### Planos de assinatura existentes no código

No repositório existem quatro catálogos de planos coexistindo em arquivos distintos:

#### Catálogo A: Banco de Dados Canônico e PixBillingService

- **Arquivos:** `supabase/migrations/20260909_partiu_driver_access_engine_v4.sql`, linhas 33-103 e `src/services/subscription/PixBillingService.ts`, linhas 64-131 (`monetization_plans` e `DEFAULT_MONETIZATION_PLANS`).
- **Planos:**
  1. `plano-diaria-essencial` ("Diária Essencial - Partiu Flex"):
     - Preço diário: R$ 14,90 (duração 24 horas consecutivas).
     - Preço semanal: R$ 79,00 (duração 7 dias).
     - Preço mensal: R$ 299,00 (duração 30 dias).
     - Carência: 2 dias. Trial: 0 dias. Comissão: 0.0%.
  2. `plano-semanal-pro` ("Semanal Pro"):
     - Preço diário: R$ 12,50.
     - Preço semanal: R$ 69,90 (duração 7 dias). Regra de desconto: economia declarada de 33% frente à diária equivalente.
     - Preço mensal: R$ 249,00.
     - Carência: 3 dias. Trial: 0 dias. Comissão: 0.0%.
  3. `plano-mensal-ouro` ("Mensal Ouro"):
     - Preço diário: R$ 9,90.
     - Preço semanal: R$ 55,00.
     - Preço mensal: R$ 199,90 (duração 30 dias).
     - Carência: 5 dias. Trial: 0 dias. Comissão: 0.0%.
  4. `plano-trial-boas-vindas` ("Trial Grátis de Boas-Vindas"):
     - Preço: R$ 0,00.
     - Duração: 3 dias. Carência: 1 dia. Comissão: 0.0%.

#### Catálogo B: Parametrização Super Admin e Franqueados

- **Arquivo:** `src/lib/superadmin-config.ts`, linhas 180-218 (`ConfigMonetizacaoWhiteLabel` e `configMonetizacaoInicial`).
- **Planos e Tarifas:**
  1. Diária: Carro R$ 19,90 / Moto R$ 11,90 (duração 24 horas).
  2. Semanal: Carro R$ 99,00 / Moto R$ 59,00 (duração 7 dias).
  3. Mensal: Carro R$ 349,00 / Moto R$ 199,00 (duração 30 dias).
  4. Degustação (Trial): 3 dias gratuitos (`trialDias: 3`, `trialAtivo: true`).

#### Catálogo C: Revenue OS Local

- **Arquivo:** `src/lib/revenue/subscription-engine.ts`, linhas 84-183 (`INITIAL_DRIVER_PLANS`).
- **Planos:**
  1. `plano-livre`: Mensalidade R$ 0,00, trial de 7 dias, comissão 0.0%.
  2. `plano-bronze`: Diária R$ 14,90, semanal R$ 49,90, mensal R$ 149,90, comissão 0.0%.
  3. `plano-prata`: Diária R$ 12,50, semanal R$ 69,90 (desconto de 30%), mensal R$ 199,90, comissão 0.0%.
  4. `plano-ouro`: Diária R$ 4,90, semanal R$ 29,90, mensal R$ 99,90, comissão 0.0%.

#### Catálogo D: White Label Engine Base

- **Arquivo:** `src/lib/white-label/white-label-engine.ts`, linhas 363-426 (`monetization.planos`).
- **Planos:**
  1. `plano-livre`: R$ 0,00/mês, comissão 5.0%.
  2. `plano-bronze`: R$ 19,90/mês, diária R$ 1,50, semanal R$ 6,90, comissão 3.0%.
  3. `plano-prata`: R$ 49,90/mês, diária R$ 3,50, semanal R$ 16,90, comissão 1.0%.
  4. `plano-ouro`: R$ 99,90/mês, diária R$ 6,90, semanal R$ 34,90, comissão 0.0%.
  5. `plano-platina`: R$ 149,90/mês, diária R$ 9,90, semanal R$ 49,90, comissão 0.0%.

> **Constatação de durações ausentes:** Não existem planos trimestrais, semestrais ou anuais implementados em nenhuma parte do código.

---

### Verificação de cobrança por corrida (take rate e comissão)

A plataforma possui uma diretriz formal de 0% Take Rate reforçada por trigger de banco de dados (`trg_rides_zero_commission` em `supabase/migrations/20261007_partiu_pure_saas_subscription_zero_take_rate.sql`, linhas 228-253, forçando `platform_fee := 0.00` e `driver_net_share := total_fare`).

No entanto, foram identificados **fluxos e estruturas ativas com retenção de comissão por corrida**:

1. **Retenção de Comissão no Motor FinOps Pix:**
   - **Arquivo:** `src/lib/finops-pix-engine.ts`, linhas 108-129 (`calcularSplitFinanceiro`).
   - **Código:** Define `DEFAULT_COOP_FEE_PERCENT = 5.0` (5%) e taxa fixa de PSP de R$ 0,45 (`DEFAULT_PSP_FIXED_FEE = 0.45`). O método calcula `taxaCoop = (valorPassagem * percentualTaxa) / 100` e subtrai da remuneração líquida do motorista (`repasseLiquido = valorPassagem - taxaCoop`).

2. **Comissão Administrativa nas Configurações Gerais:**
   - **Arquivo:** `src/lib/superadmin-config.ts`, linhas 240, 558, 561-562.
   - **Código:** Define `taxaAdministrativaPercent: 12.0`, `taxaCooperativaPercent: 12` e `repasseMotoristaPercent: 88`.

3. **Comissão Padrão por Vertical de Negócio:**
   - **Arquivo:** `src/lib/white-label/white-label-engine.ts`, linhas 255, 266, 277, 287, 297, 307, 317, 327, 337, 347.
   - **Código:** As verticais de negócio contêm o campo `comissaoPadraoPercentual` ativo variando de 2.5% a 5.0% (ex: `MOBILITY_CAR`: 5.0%, `MOBILITY_MOTO`: 5.0%, `DELIVERY_FLASH`: 5.0%, `VANS_COLLECTIVE`: 3.0%, `TOURISM_CHARTER`: 2.5%).

4. **Persistência de Comissão de Plataforma em Tenants:**
   - **Arquivo:** `src/routes/app.admin.configuracoes.tsx`, linhas 462, 537, 568.
   - **Código:** Lê e salva a coluna `platform_fee_percent` (com valor padrão de 10.0%) na tabela `white_label_tenants` do Supabase.

5. **Tabela de Comissões por Corrida no Banco de Dados:**
   - **Arquivo:** `supabase/migrations/20260908_partiu_driver_revenue_system.sql`, linhas 166-194.
   - **Código:** Tabela `public.partiu_driver_commissions` com colunas `commission_percent`, `platform_commission_cents` e `total_platform_deduction_cents`.

---

## 2. Ciclo de vida da assinatura

### Mapeamento do fluxo de estados

1. **Cadastro:**
   - Cria o registro do motorista.
   - No `subscription-engine.ts`, linhas 344-373, motoristas sem assinatura recebem automaticamente uma assinatura padrão no `plano-bronze` com 30 dias de ciclo.
   - Na migration `20261007_partiu_pure_saas_subscription_zero_take_rate.sql`, linhas 42-44, o perfil é criado com `status_assinatura = 'ACTIVE'` e validade de 7 dias por padrão.

2. **Trial Gratuito (Degustação):**
   - **Função 1:** `driverSubscriptionService.activateTrial` em `src/lib/ecosystem/driver-subscription-service.ts`, linhas 496-504. Consulta `trialAtivo` e `trialDias` da franquia, gerando uma liberação com valor R$ 0,00 e duração de `trialDias * 24` horas.
   - **Função 2:** `subscriptionEngine.startTrialPeriod` em `src/lib/revenue/subscription-engine.ts`, linhas 414-435. Atribui `trialDays = 7` e `status = "ACTIVE"`.
   - **Plano SQL:** `plano-trial-boas-vindas` em `supabase/migrations/20260909_partiu_driver_access_engine_v4.sql`, linhas 88-103.

3. **Ativação:**
   - **Via Webhook Pix:** RPC `fn_process_driver_pix_confirmation` em `supabase/migrations/20260909_partiu_driver_access_engine_v4.sql`, linhas 343-361. Marca a cobrança em `driver_billing` como `PAID`, insere registro em `driver_subscriptions` com status `ACTIVE` e insere evento em `subscription_events`.
   - **Via RPC Direta:** RPC `fn_activate_driver_subscription` em `supabase/migrations/20261007_partiu_pure_saas_subscription_zero_take_rate.sql`, linhas 104-170. Atualiza `driver_profiles` com `status_assinatura = 'ACTIVE'`, estende `validade_assinatura` e insere fatura `PAID` em `driver_subscription_invoices`.
   - **Via Frontend / Serviço:** `driverSubscriptionService.confirmDailyFeePayment` em `src/lib/ecosystem/driver-subscription-service.ts`, linhas 403-491. Persiste localmente e insere em `driver_subscriptions`.

4. **Renovação:**
   - **Renovação Manual pelo Suporte:** `driverSubscriptionService.renewManually` em `src/lib/ecosystem/driver-subscription-service.ts`, linhas 658-698. Estende o prazo pelo número de dias informado e gera pagamento registrado.
   - **Renovação por Saldo:** `useDriverDailyPass.renovarComSaldo` em `src/hooks/driver/useDriverDailyPass.ts`, linhas 100-145. Deduz o valor da diária do saldo operacional do condutor e chama `confirmDailyFeePayment`.
   - **Nova Cobrança Pix:** O motorista gera nova cobrança via `driverSubscriptionService.generateDailyFeePix` ou `pixBillingService.createDriverBilling`.

5. **Vencimento:**
   - Ocorre quando a data atual ultrapassa `expires_at` ou `nextBillingDate`.
   - Avaliado na RPC `fn_driver_evaluate_access` (`supabase/migrations/20260909_partiu_driver_access_engine_v4.sql`, linhas 248-262) e na função `driverSubscriptionService.isDriverUnlocked` (`src/lib/ecosystem/driver-subscription-service.ts`, linhas 217-220).

6. **Carência (Grace Period):**
   - **No Banco de Dados:** RPC `fn_driver_evaluate_access` em `supabase/migrations/20260909_partiu_driver_access_engine_v4.sql`, linhas 252-257. Se `expires_at` expirou mas `grace_period_ends_at > clock_timestamp()`, retorna `is_eligible: true` com status `GRACE_PERIOD`.
   - **No SubscriptionEngine:** `subscriptionEngine.evaluateSubscriptionStatus` em `src/lib/revenue/subscription-engine.ts`, linhas 458-470. Se houver débito e o ciclo venceu dentro de `gracePeriodDays` (3 dias), altera o status para `GRACE_PERIOD` e emite notificação.

7. **Bloqueio e Suspensão:**
   - **Bloqueio Administrativo:** `driverSubscriptionService.blockDriverAccess` em `src/lib/ecosystem/driver-subscription-service.ts`, linhas 700-727. Altera a conta para `BLOCKED`, cancela as assinaturas ativas em cache e armazena o motivo do bloqueio.
   - **Bloqueio por Inadimplência:** `subscriptionEngine.evaluateSubscriptionStatus` em `src/lib/revenue/subscription-engine.ts`, linhas 471-481. Transiciona para `SUSPENDED` quando o período de carência expira com débitos abertos.
   - **Trava de Despacho Operacional:** A RPC `fn_driver_evaluate_access` retorna `is_eligible: false`. No banco, o índice espacial `idx_driver_profiles_saas_dispatch` (`supabase/migrations/20261007_partiu_pure_saas_subscription_zero_take_rate.sql`, linhas 50-53) filtra motoristas fora de `status_assinatura IN ('ACTIVE', 'TRIAL')` ou com validade expirada.

---

### Mapeamento de tabelas, enums e serviços por estado

| Estado         | Tabela no Banco de Dados                                 | Campo / Enum                                             | Serviço / Função Responsável                                                  |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Cadastro**   | `public.driver_profiles` / `public.drivers`              | `status_assinatura` (`ACTIVE`)                           | `supabaseAuthService` e migration `20261007`                                  |
| **Trial**      | `public.driver_subscriptions`                            | `cycle_type = 'TRIAL'`, `status = 'ACTIVE'`              | `driverSubscriptionService.activateTrial`                                     |
| **Ativação**   | `public.driver_subscriptions` / `public.driver_billing`  | `status = 'ACTIVE'`, `status = 'PAID'`                   | `fn_process_driver_pix_confirmation`                                          |
| **Renovação**  | `public.driver_subscriptions`                            | `status = 'ACTIVE'`, nova `expires_at`                   | `driverSubscriptionService.renewManually` / `fn_activate_driver_subscription` |
| **Vencimento** | `public.driver_subscriptions`                            | `status = 'EXPIRED'`                                     | `fn_driver_evaluate_access` (avaliado just-in-time)                           |
| **Carência**   | `public.driver_subscriptions`                            | `status = 'GRACE_PERIOD'`                                | `fn_driver_evaluate_access` e `subscriptionEngine.evaluateSubscriptionStatus` |
| **Bloqueio**   | `public.driver_subscriptions` / `public.driver_profiles` | `status = 'SUSPENDED'` / `bloqueio_inadimplencia = true` | `driverSubscriptionService.blockDriverAccess` / `subscriptionEngine`          |

---

### Jobs agendados (cron, workers, filas)

> **Declaração explícita de ausência:** **NÃO EXISTEM** cron jobs agendados, triggers temporais (`pg_cron`) ou workers em background no servidor dedicados ao ciclo de vida de assinaturas (notificação prévia de vencimento, expiração automática ou bloqueio por inadimplência).
>
> A detecção de expiração e bloqueio é executada **exclusivamente sob demanda (just-in-time)** quando o motorista abre o app ou tenta aceitar uma corrida (`fn_driver_evaluate_access`, `driverSubscriptionService.isDriverUnlocked`), ou por cálculos in-process em tempo de execução no frontend.

---

## 3. Motor de pagamentos

### Métodos de pagamento integrados e status real

1. **Pix Dinâmico:**
   - **Status:** Funcional com múltiplos caminhos.
   - **Implementação Real:**
     - **Mercado Pago Oficial:** `supabase/functions/generate-driver-payment/index.ts`, linhas 119-166. Realiza chamada HTTP `POST` para `https://api.mercadopago.com/v1/payments` utilizando `mercadopago_access_token` e `X-Idempotency-Key`.
     - **Asaas Oficial:** `supabase/functions/generate-driver-payment/index.ts`, linhas 169-209. Realiza chamada HTTP `POST` para `https://api.asaas.com/v3/payments` com `billingType: "PIX"` e consulta QR Code em `/payments/{id}/pixQrCode`.
     - **Fallback EMV Local BACEN:** `supabase/functions/generate-driver-payment/index.ts`, linhas 212-244 e `src/services/payment/PaymentProviderAdapter.ts`, linhas 79-116 (`buildStandardEmvPix` e `computePixCrc16`). Gera o payload oficial do Banco Central e gera imagem de QR Code via biblioteca `qrcode`.

2. **Pix Manual com Envio e Aprovação de Comprovante:**
   - **Status:** Parcial.
   - **Implementação:** `src/lib/driver-wallet-service.ts`, linhas 42-54 (`PedidoRecargaPix` com `comprovanteNota`) e `src/routes/app.admin.monetizacao.tsx`, linhas 102, 1083-1115 (`aprovarRecargaPix` e `rejeitarRecargaPix`). Os pedidos e status de aprovação manual operam vinculados ao `localStorage` (`partiu_pix_recharge_orders`), sem armazenamento de arquivo físico de comprovante no Supabase Storage.

3. **Cartão Recorrente:**
   - **Status:** Apenas planejado e mockado.
   - **Implementação:**
     - Em `src/services/PaymentMethodService.ts`, linhas 126-140, a tokenização do cartão é uma simulação matemática que gera uma string estática `tok_pax_${timestamp}_${rand}` e salva no `localStorage` e na tabela `user_payment_methods`.
     - Em `src/lib/revenue/billing-engine.ts`, linha 70, o método `CARD` é listado na cascata teórica de cobrança, mas não existe nenhuma chamada real a gateways para transacionar cartão de crédito de forma avulsa ou recorrente.

---

### Webhooks recebidos de gateways de pagamento

#### 1. Endpoint Server-Side: `supabase/functions/payment-webhook/index.ts`

- **Origens mapeadas:** Mercado Pago, Asaas e Efí Bank.
- **Payload esperado:**
  - Mercado Pago: `{ type: "payment", data: { id: "123456" }, action: "payment.created" }`.
  - Asaas: `{ event: "PAYMENT_CONFIRMED", payment: { id: "pay_123", value: 19.90, externalReference: "bill_abc" } }`.
  - Efí Bank: `{ pix: [ { txid: "tx_123", valor: "19.90" } ] }`.
- **Validação de assinatura e segurança:**
  - Linhas 49-76: Valida autorização via `SUPABASE_SERVICE_ROLE_KEY` no header `Authorization` ou `apikey`.
  - Linhas 78-107: Valida assinatura criptográfica no header `x-webhook-signature` através de `crypto.subtle.verify` com HMAC-SHA256 utilizando `mercadopago_webhook_secret` ou `PAYMENT_WEBHOOK_SECRET`.
  - Fail-closed: Linhas 108-116 retornam HTTP 500 se nenhum segredo estiver configurado no servidor.
- **Ações disparadas no sistema:**
  - Se for Mercado Pago, realiza consulta síncrona na API `https://api.mercadopago.com/v1/payments/{id}` para confirmar status `approved`.
  - Executa a RPC PostgreSQL `fn_process_driver_pix_confirmation(p_billing_id, p_gateway_reference, p_amount)`.

#### 2. Engine HMAC de Referência: `src/lib/payment-webhook-engine.ts`

- **Validação:** Linhas 87-143 (`verificarWebhookHmac`). Utiliza `crypto.createHmac("sha256")`, verifica janela de tolerância de 300 segundos contra Replay Attacks e realiza comparação em tempo constante via `crypto.timingSafeEqual`.
- **Ação:** Linhas 164-177 atualizam a tabela `payment_intents` para `SUCCEEDED`.

#### 3. Motor Transacional Idempotente: `src/lib/fintech-hardened/idempotent-pix.ts`

- **Validação:** Linhas 52-64 (`verifyWebhookSignature`).
- **Ação:** Linhas 69-127 (`processPixInSettlement`). Verifica duplicidade por `endToEndId`, debita conta clearing e credita custódia escrow no `transactionalLedger`.

---

### Tratamento de falhas, idempotência e reconciliação

1. **Reentrega de Webhook:**
   - Na RPC `fn_process_driver_pix_confirmation` (`supabase/migrations/20260909_partiu_driver_access_engine_v4.sql`, linhas 301-323), a cobrança é buscada com trava de concorrência `FOR UPDATE`. Se já estiver com status `PAID`, retorna sucesso imediatamente com `{ success: true, code: 'ALREADY_PAID' }`, garantindo que reentregas dos gateways não alterem saldos nem dupliquem períodos de acesso.

2. **Idempotência:**
   - **Na emissão:** `supabase/functions/generate-driver-payment/index.ts`, linha 126 envia `X-Idempotency-Key: billingId` para o Mercado Pago.
   - **No processamento:** `src/lib/fintech-hardened/idempotent-pix.ts`, linhas 70-77 mantém mapa em memória `settledEndToEndIds` retornando `{ idempotentReplay: true }` caso o mesmo `endToEndId` seja recebido novamente.

3. **Reconciliação Manual:**
   - Implementada na tela `src/routes/app.admin.monetizacao.tsx`, linhas 1083-1140: o administrador visualiza pedidos de recarga pendentes e pode aprovar manualmente (`aprovarRecargaPix`), rejeitar (`rejeitarRecargaPix`) ou renovar a assinatura forçadamente (`renewManually`).

---

## 4. Modelo de dados

### Tabelas e coleções envolvidas

#### 1. Tabelas Ativas no Supabase (Driver Access Engine V4 & SaaS Pure Migration)

- `public.monetization_plans`:
  - **Campos principais:** `id`, `plan_name`, `description`, `monthly_fee`, `weekly_fee`, `daily_fee`, `commission_percent`, `trial_days`, `grace_days`, `priority_weight`, `features`, `badge_color`, `is_popular`, `is_default`, `active`.
  - **Migration:** `20260909_partiu_driver_access_engine_v4.sql`, linha 12.
- `public.driver_subscriptions`:
  - **Campos principais:** `id`, `driver_id`, `plan_id`, `cycle_type`, `status`, `driver_status`, `amount_paid`, `starts_at`, `expires_at`, `grace_period_ends_at`, `accumulated_debt`, `suspension_reason`, `auto_renew`.
  - **Migration:** `20260909_partiu_driver_access_engine_v4.sql`, linha 124.
- `public.driver_billing`:
  - **Campos principais:** `id`, `driver_id`, `plan_id`, `cycle_type`, `amount`, `gateway`, `gateway_reference`, `pix_code`, `qr_code_url`, `status`, `expires_at`, `paid_at`, `metadata`.
  - **Migration:** `20260909_partiu_driver_access_engine_v4.sql`, linha 151.
- `public.subscription_events`:
  - **Campos principais:** `id`, `driver_id`, `subscription_id`, `billing_id`, `event_type`, `amount`, `metadata`, `created_at`.
  - **Migration:** `20260909_partiu_driver_access_engine_v4.sql`, linha 176.
- `public.driver_subscription_invoices`:
  - **Campos principais:** `id`, `driver_id`, `driver_name`, `plan_id`, `plan_name`, `cycle`, `amount_brl`, `duration_days`, `gateway`, `pix_txid`, `pix_copia_e_cola`, `status`, `paid_at`, `expires_at`.
  - **Migration:** `20261007_partiu_pure_saas_subscription_zero_take_rate.sql`, linha 76.
- `public.driver_profiles` e `public.drivers` (Campos SaaS adicionados):
  - **Campos principais:** `status_assinatura`, `validade_assinatura`, `plano_atual_id`, `dias_cortesia_acumulados`, `bloqueio_inadimplencia`, `motivo_bloqueio_assinatura`, `documentos_aprovados`.
  - **Migration:** `20261007_partiu_pure_saas_subscription_zero_take_rate.sql`, linhas 41-70.
- `public.admin_gateway_secrets`:
  - **Campos principais:** `id`, `mercadopago_access_token`, `mercadopago_webhook_secret`, `created_at`, `updated_at`.
  - **Migration:** `20261003_mercadopago_settings.sql`.

#### 2. Tabelas do Modelo Híbrido Anterior (Driver Revenue System V1)

- `public.partiu_driver_plans` (`20260908_partiu_driver_revenue_system.sql`, linha 18).
- `public.partiu_driver_subscriptions` (`20260908_partiu_driver_revenue_system.sql`, linha 124).
- `public.partiu_driver_wallets` (`20260908_partiu_driver_revenue_system.sql`, linha 149).
- `public.partiu_driver_commissions` (`20260908_partiu_driver_revenue_system.sql`, linha 166).
- `public.partiu_driver_transactions` (`20260908_partiu_driver_revenue_system.sql`, linha 198).
- `public.partiu_driver_invoices` (`20260908_partiu_driver_revenue_system.sql`, linha 227).
- `public.partiu_driver_debts` (`20260908_partiu_driver_revenue_system.sql`, linha 248).
- `public.partiu_driver_protection_fund` (`20260908_partiu_driver_revenue_system.sql`, linha 264).
- `public.partiu_driver_revenue_metrics` (`20260908_partiu_driver_revenue_system.sql`, linha 298).

#### 3. Estruturas Locais e Chaves de LocalStorage

- `partiu_driver_subscriptions_store`: cache de assinaturas ativas em `driver-subscription-service.ts`.
- `partiu_driver_subscription_accounts_store`: cache de contas SaaS de motoristas em `driver-subscription-service.ts`.
- `partiu_driver_plans_v1`: catálogo de planos em `subscription-engine.ts`.
- `partiu_driver_subscriptions_v1`: assinaturas em `subscription-engine.ts`.
- `partiu_driver_invoices_v1`: faturas locais em `billing-engine.ts`.
- `partiu_driver_wallets`: carteiras de motoristas em `driver-wallet-service.ts`.
- `partiu_pix_recharge_orders`: pedidos de recarga Pix manuais em `driver-wallet-service.ts`.
- `partiu_superadmin_config_v2`: configuração de monetização das franquias em `superadmin-config.ts`.

---

### Inconsistências identificadas

1. **Duplicidade Estrutural de Tabelas (Split-Brain de Esquema):**
   - Existem duas tabelas para planos de assinatura: `monetization_plans` e `partiu_driver_plans`.
   - Existem duas tabelas para assinaturas: `driver_subscriptions` e `partiu_driver_subscriptions`, além de campos espelhados em `driver_profiles` (`status_assinatura`, `validade_assinatura`).
   - Existem três tabelas para faturamento/cobranças: `driver_billing`, `driver_subscription_invoices` e `partiu_driver_invoices`.

2. **Ausência de Soft Delete em Dados Financeiros:**
   - Nenhuma das tabelas financeiras (`driver_billing`, `driver_subscriptions`, `driver_subscription_invoices`, `partiu_driver_transactions`, `partiu_driver_invoices`) possui coluna `deleted_at`. O cancelamento é feito exclusivamente por mutação de campo string (`status = 'CANCELLED'`).

3. **Dependência Crítica de LocalStorage:**
   - Telas centrais do cockpit do motorista e painel de administração utilizam chaves de `localStorage` como fonte de leitura imediata com fallback para o Supabase, gerando inconsistências caso o motorista troque de aparelho ou limpe os dados do navegador.

---

## 5. Segurança e conformidade

### Validação de assinaturas em webhooks

1. **Edge Function `payment-webhook`:**
   - **Arquivo:** `supabase/functions/payment-webhook/index.ts`, linhas 78-107.
   - **Segurança:** Utiliza `crypto.subtle.verify` com algoritmo HMAC-SHA256 comparando a assinatura recebida no header contra o segredo armazenado em variáveis de ambiente ou na tabela `admin_gateway_secrets`. Possui bloqueio automático fail-closed (HTTP 500) se as chaves não estiverem configuradas.

2. **Módulos TypeScript de Webhook:**
   - **Arquivos:** `src/lib/payment-webhook-engine.ts`, linhas 87-143 e `src/lib/fintech-hardened/idempotent-pix.ts`, linhas 52-64.
   - **Segurança:** Utilizam `crypto.timingSafeEqual` para comparação em tempo constante, prevenindo ataques de temporização (Timing Attacks), e impõem janela máxima de tolerância de 300 segundos contra Replay Attacks.

3. **Vulnerabilidade em Adapters Client-Side:**
   - **Arquivo:** `src/services/payment/PaymentProviderAdapter.ts`, linhas 158, 200, 302, 330, 353, 376.
   - **Risco:** Nos provedores client-side, a validação de assinatura de webhook é simulada: `verifyWebhookSignature(_payload, sig, sec) { return Boolean(sig && sec); }`. Qualquer requisição com strings preenchidas é aceita se executada por esses métodos.

---

### Armazenamento de dados sensíveis e exposição em logs

1. **Dados de Cartão de Crédito:**
   - **Arquivo:** `src/services/PaymentMethodService.ts`, linhas 6-9, 117-124, 147-154.
   - **Conformidade:** O sistema adota política de zero custódia. O número completo do cartão (PAN) e o código CVV não são persistidos no banco de dados. Apenas o token gerado e os últimos 4 dígitos (`last_four_digits`) são gravados na tabela `user_payment_methods`.

2. **Segredos e Tokens de Gateways:**
   - **Arquivo:** `supabase/migrations/20261003_mercadopago_settings.sql`.
   - **Conformidade:** O token de acesso e webhook secret do Mercado Pago foram extraídos da tabela pública `app_settings` e movidos para a tabela `admin_gateway_secrets`, protegida por RLS com acesso restrito a `service_role`.

3. **Exposição em Logs:**
   - Em `supabase/functions/generate-driver-payment/index.ts`, linhas 160-164, erros retornados pela API do Mercado Pago são logados via `console.warn` incluindo o texto de erro retornado pela adquirente.

---

### Trilha de auditoria para bloqueios e liberações manuais

1. **Auditoria de Eventos de Assinatura no Banco:**
   - **Arquivo:** `supabase/migrations/20260909_partiu_driver_access_engine_v4.sql`, linhas 176-198 e 363-377.
   - **Implementação:** A tabela `subscription_events` registra eventos como `PAYMENT_RECEIVED`, `RENEWAL`, `ACTIVATION`, `SUSPENSION`.

2. **Lacuna em Ações Administrativas de Suporte:**
   - **Arquivo:** `src/lib/ecosystem/driver-subscription-service.ts`, linhas 617-747 (`grantCourtesyDays`, `renewManually`, `blockDriverAccess`, `unblockDriverAccess`).
   - **Risco:** As funções de concessão de dias de cortesia, bloqueio administrativo e desbloqueio executadas pelo Super Admin gravam o histórico exclusivamente no array em `localStorage` (`partiu_driver_subscription_accounts_store`). **Não gravam registros em tabela de auditoria imutável no Supabase**, tornando essas decisões operacionais vulneráveis a perda de histórico ou adulteração local.

---

## 6. Métricas e observabilidade

### KPIs calculados pelo sistema

1. **Métricas SaaS no DriverSubscriptionService:**
   - **Arquivo:** `src/lib/ecosystem/driver-subscription-service.ts`, linhas 749-787 (`getExecutiveSaaSMetrics`).
   - **KPIs calculados:**
     - **MRR (Monthly Recurring Revenue):** Soma de `lastPaymentBrl` (ou R$ 199,90 como fallback) de todas as contas com status `ACTIVE`.
     - **ARR (Annual Recurring Revenue):** Calculado como `mrrBrl * 12`.
     - **Assinantes Ativos:** Contagem de contas em status `ACTIVE` ou `TRIAL`.
     - **Prestes a Vencer:** Contagem de contas ativas com `daysRemaining <= 7`.
     - **Inadimplentes ou Bloqueados:** Contagem de contas em status `GRACE_PERIOD`, `BLOCKED` ou `EXPIRED`.
     - **GMV Total Processado:** Calculado como `completedTrips * 18.5`.
     - **Economia da Frota vs Concorrentes:** Calculado como `totalGmvProcessedBrl * 0.22`.
     - **Taxa de Renovação (%):** Proporção de ativos sobre o total de contas.
     - **Taxa de Churn (%):** Proporção de inadimplentes/bloqueados sobre o total de contas.

2. **Métricas da Carteira no DriverSubscriptionService:**
   - **Arquivo:** `src/lib/ecosystem/driver-subscription-service.ts`, linhas 519-590 (`getSaaSMetrics`).
   - **KPIs calculados:** Faturamento diário (`totalRevenueToday`), faturamento mensal (`totalRevenueMonth`), total de motoristas ativos e total de motoristas expirados calculados por iteração direta no array `subscriptions`.

3. **Métricas no RevenueDashboardEngine:**
   - **Arquivo:** `src/lib/revenue/revenue-dashboard.ts`, linhas 47-112 (`calculateMetrics`).
   - **KPIs calculados:** MRR, ARR, GMV, Receita de Assinaturas, Margem Líquida da Plataforma, LTV estimado e relação LTV/CAC sobre uma frota simulada de 50 veículos.

---

### Mecanismo de apuração dos cálculos

> **Constatação de observabilidade:**
>
> - Os cálculos de KPIs **existem exclusivamente como queries e reduções ad-hoc in-process no frontend** (funções TypeScript operando sobre coleções em memória e `localStorage`).
> - Na migration `supabase/migrations/20260908_partiu_driver_revenue_system.sql`, linhas 298-318, foi criada a tabela `public.partiu_driver_revenue_metrics` contendo colunas para MRR, ARR, GMV, Churn, LTV e CAC. Contudo, **não existe nenhuma trigger, view materializada ou job agendado no PostgreSQL inserindo snapshots históricos diários** nessa tabela.
> - A **taxa de conversão de trial** (conversão de condutores em degustação para planos pagos) **não é calculada em nenhum ponto do código**.

---

## 7. Lacunas e riscos técnicos

### Funcionalidades incompletas, stubs e mocks identificados

1. **Provedores de Pagamento Mockados no PaymentProviderAdapter:**
   - **Arquivo:** `src/services/payment/PaymentProviderAdapter.ts`, linhas 121-160 (Asaas), 166-202 (Efí Bank), 310-331 (Stripe), 333-354 (Pagar.me), 356-377 (PagBank).
   - **Situação:** Exceto o Mercado Pago (que invoca a Edge Function), todos os outros cinco provedores são implementações stub que geram EMV localmente utilizando chaves Pix estáticas (ex: `stripe@partiu.com`, `pagarme@partiu.com`), sem realizar requisições HTTP para as APIs bancárias correspondentes.

2. **Tokenização de Cartão Mockada no PaymentMethodService:**
   - **Arquivo:** `src/services/PaymentMethodService.ts`, linhas 126-140.
   - **Situação:** Comentado explicitamente como `Simulação do handshake criptográfico com Gateway`. O token gerado é uma string aleatória (`tok_pax_...`), sem comunicação real com gateway adquirente e sem capacidade de processar transações com bandeiras.

3. **Mocks de Contas e Carteiras no DriverWalletService:**
   - **Arquivo:** `src/lib/driver-wallet-service.ts`, linhas 97-150 (`WALLETS_INICIAIS`) e linhas 152-176 (`PEDIDOS_RECARGA_INICIAIS`).
   - **Situação:** O serviço carrega listas fixas com dados fictícios caso o `localStorage` esteja vazio.

---

### Acoplamentos arriscados

1. **Acoplamento Crítico entre Despacho de Corridas e Verificação Financeira:**
   - **Arquivos:** `supabase/migrations/20261007_partiu_pure_saas_subscription_zero_take_rate.sql`, linhas 50-70 (`idx_driver_profiles_saas_dispatch`), `supabase/migrations/20260909_partiu_driver_access_engine_v4.sql`, linhas 203-276 (`fn_driver_evaluate_access`) e `src/lib/ecosystem/driver-subscription-service.ts`, linhas 217-220 (`isDriverUnlocked`).
   - **Risco:** A trava de diária e status de assinatura está acoplada no núcleo da fila de despacho e cálculo de proximidade geoespacial. Qualquer latência ou falha de leitura no Supabase durante a chamada à RPC `fn_driver_evaluate_access` causa exclusão imediata do motorista do radar de corridas, mesmo com diária paga.

2. **Divergência de Modelos e Fontes de Verdade (Split-Brain de Cobrança):**
   - **Arquivos:** `src/lib/ecosystem/driver-subscription-service.ts` vs `src/services/subscription/PixBillingService.ts` vs `src/lib/driver-wallet-service.ts` vs `src/lib/revenue/billing-engine.ts`.
   - **Risco:** Quatro serviços distintos operam fluxos financeiros com regras e caches independentes:
     - `driverSubscriptionService`: gerencia diárias de 24h em `partiu_driver_subscriptions_store`.
     - `PixBillingService`: gerencia cobranças de planos na tabela `driver_billing`.
     - `driverWalletService`: gerencia saldo em carteira e recargas manuais em `partiu_driver_wallets`.
     - `billingEngine`: gerencia deduções de saques e faturas mensais em `partiu_driver_invoices_v1`.

---

## Resumo Executivo

### O que está pronto e funcional

- **Geração de Pix Dinâmico Server-Side:** Edge Function integrada com a API oficial do Mercado Pago e contingência Asaas, com emissão de QR Code e Copia e Cola.
- **Fallback Resiliente de EMV BACEN:** Algoritmo local compatível com o Banco Central que calcula o CRC-16 e gera QR Code mesmo sem gateway online.
- **Validação Criptográfica de Webhooks:** Endpoint server-side com checagem de assinatura HMAC-SHA256, proteção anti-replay de timestamp e bloqueio fail-closed.
- **Idempotência no Processamento de Pagamentos:** RPC PostgreSQL com bloqueio pessimista `FOR UPDATE` evitando duplicação em reentregas de webhooks.
- **Isolamento de Credenciais Bancárias:** Tabela protegida por RLS (`admin_gateway_secrets`) isolando chaves privadas de adquirentes do cliente web.

### O que está parcial

- **Ciclo de Vida de Assinatura Multi-Tenant:** Implementado funcionalmente no frontend e banco, mas fragmentado entre três tabelas concorrentes e com alta dependência de `localStorage`.
- **Pix Manual com Comprovante:** Interface de listagem, aprovação e rejeição administrativa pronta, porém os dados operam em armazenamento local sem persistência de arquivos no Supabase Storage.
- **Trilha de Auditoria Administrativa:** Ações via webhook geram eventos em `subscription_events`, mas bloqueios e cortesias executados manualmente pelo suporte não são gravados no banco.

### O que não existe

- **Jobs Agendados de Expiração e Notificação:** Inexistência de cron jobs ou workers em background no servidor para expirar planos ou disparar notificações de vencimento de forma autônoma.
- **Cobrança Recorrente por Cartão de Crédito:** Inexistência de integração real com adquirentes para tokenização e cobrança automática em cartão, operando apenas como simulação mockada.
