# Plano de Reestruturação da Monetização

Plano técnico de engenharia, arquitetura-alvo, matriz de dependências, estratégias de migração e critérios de validação para consolidação do ecossistema de monetização SaaS do Partiu.

---

## 1. Arquitetura atual comprovada

A arquitetura financeira e operacional de monetização do Partiu opera sobre um modelo SaaS híbrido distribuído entre o cliente web/mobile, Edge Functions do Supabase e o banco de dados relacional PostgreSQL.

```
+---------------------------------------------------------------------------------------+
|                                    CAMADA CLIENTE                                     |
|                                                                                       |
|  [Cockpit Motorista]        [Admin Monetização]            [Matching & Despacho]      |
|  SubscriptionContext        AdminMonetizacaoPage           MatchingEngine.ts          |
|  DailyFeePaymentScreen      driverSubscriptionService      isDriverEligible           |
+--------------------------+------------------------------+-----------------------------+
                           |                              |
                           v                              v
+---------------------------------------------------------------------------------------+
|                                CAMADA DE SERVIÇOS & CACHE                             |
|                                                                                       |
|  PixBillingService          driverSubscriptionService      subscriptionEngine         |
|  - evaluateDriverAccess     - generateDailyFeePix          - loadFromStorage (local)  |
|  - createDriverBilling      - isDriverUnlocked             - recordDebt               |
|  - inMemorySubscriptions    - localStorage                 - INITIAL_DRIVER_PLANS     |
+--------------------------+------------------------------+-----------------------------+
                           |                              |
                           v                              v
+---------------------------------------------------------------------------------------+
|                               CAMADA EDGE FUNCTIONS (DENO)                            |
|                                                                                       |
|  [generate-driver-payment]                                  [payment-webhook]         |
|  - Auth Guard (JWT verificado)                             - HMAC-SHA256 & Replay     |
|  - Consulta public.monetization_plans                      - Fail-closed security     |
|  - API Mercado Pago / Asaas / EMV Local                    - Invoca RPC de ativação   |
+--------------------------+------------------------------+-----------------------------+
                           |                              |
                           v                              v
+---------------------------------------------------------------------------------------+
|                                 CAMADA BANCO DE DADOS                                 |
|                                                                                       |
|  public.monetization_plans     public.driver_billing        public.driver_subscriptions|
|  public.subscription_events    admin_gateway_secrets        white_label_tenant_configs |
|                                                                                       |
|  RPCs Críticas:                                                                       |
|  - fn_driver_evaluate_access (avaliação determinística de validade no Postgres)      |
|  - fn_process_driver_pix_confirmation (transação atômica, lock FOR UPDATE)            |
|  - trg_enforce_zero_ride_commission (trigger em public.rides forçando 0% comissão)    |
+---------------------------------------------------------------------------------------+
```

### Componentes de software mapeados no repositório

1. **Catálogo Canônico e Gateway Manager:**
   - [`src/services/subscription/PixBillingService.ts`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/services/subscription/PixBillingService.ts): Orquestrador de faturamento Pix, interface com RPCs do banco e mantenedor de cache in-process.
   - [`src/services/payment/PaymentProviderAdapter.ts`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/services/payment/PaymentProviderAdapter.ts): Camada de abstração com Strategy Pattern contendo integrações com Mercado Pago, Asaas e gerador local EMV padrão BACEN com CRC-16.

2. **Gerenciador de Acesso Operacional e Diárias:**
   - [`src/lib/ecosystem/driver-subscription-service.ts`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/lib/ecosystem/driver-subscription-service.ts): Serviço de apoio ao motorista, emissão de diárias com cálculo de veículos (`CARRO` e `MOTO`), suporte a abatimento de créditos operacionais e cálculo ad-hoc de métricas SaaS.

3. **Motores Concorrentes de Assinaturas e Carteira (Split-Brain Local):**
   - [`src/lib/revenue/subscription-engine.ts`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/lib/revenue/subscription-engine.ts): Motor desacoplado operando sobre `localStorage` com catálogo estático (`INITIAL_DRIVER_PLANS`), campos de comissão percentual e registro de débitos.
   - [`src/lib/revenue/billing-engine.ts`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/lib/revenue/billing-engine.ts): Emissão de faturas mensais e rotina `calculateNetWithdrawal` que deduz mensalidades de saques em carteira.
   - [`src/lib/superadmin-config.ts`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/lib/superadmin-config.ts): Configurações estáticas globais e parâmetros de monetização do Super Admin.
   - [`src/lib/white-label/white-label-engine.ts`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/src/lib/white-label/white-label-engine.ts): Configuração multi-tenant de marcas contendo planos legados com comissão percentual ativa.

4. **Edge Functions Server-Side:**
   - [`supabase/functions/generate-driver-payment/index.ts`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/supabase/functions/generate-driver-payment/index.ts): Emissão segura com JWT obrigatório, isolamento de credenciais via `admin_gateway_secrets` e comunicação direta com Mercado Pago e contingência Asaas.
   - [`supabase/functions/payment-webhook/index.ts`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/supabase/functions/payment-webhook/index.ts): Endpoint de liquidação bancária com autenticação HMAC-SHA256, verificação fail-closed e chamada à RPC transacional.

5. **Infraestrutura Relacional e Procedural no PostgreSQL:**
   - [`supabase/migrations/20260909_partiu_driver_access_engine_v4.sql`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/supabase/migrations/20260909_partiu_driver_access_engine_v4.sql): Tabelas `monetization_plans`, `driver_subscriptions`, `driver_billing`, `subscription_events` e RPCs `fn_driver_evaluate_access` e `fn_process_driver_pix_confirmation`.
   - [`supabase/migrations/20261007_partiu_pure_saas_subscription_zero_take_rate.sql`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/supabase/migrations/20261007_partiu_pure_saas_subscription_zero_take_rate.sql): Trigger de proteção `trg_rides_zero_commission` forçando `platform_fee := 0.00` na tabela `rides`.

---

## 2. Fluxo de dados de cada modalidade de cobrança existente

### Modalidade 1: Pix Dinâmico Server-Side (Mercado Pago / Asaas)
- **Status:** Ativo e funcional.
- **Fluxo:**
  1. Motorista seleciona plano ou diária na interface (`SubscriptionContext` ou `DailyFeePaymentScreen`).
  2. Requisição POST enviada para `supabase/functions/generate-driver-payment` acompanhada de JWT Bearer.
  3. A Edge Function valida a identidade do condutor contra a tabela `profiles` e recupera o plano de `public.monetization_plans`.
  4. Consulta segredos bancários privados na tabela `admin_gateway_secrets`.
  5. Realiza handshake HTTP com a API REST do Mercado Pago (`https://api.mercadopago.com/v1/payments`) ou contingência Asaas (`https://api.asaas.com/v3/payments`).
  6. Registra a intenção de faturamento na tabela `public.driver_billing` com status `PENDING`.
  7. Retorna `copiaECola`, `qrCodeUrl`, `txId` e prazo de 30 minutos para o cliente.

### Modalidade 2: Pix com Geração Local (EMV CRC-16)
- **Status:** Ativo como contingência resiliente.
- **Fluxo:**
  1. Se a Edge Function ou o gateway externo estiver indisponível, o cliente invoca `buildStandardEmvPix` em `src/services/payment/PaymentProviderAdapter.ts` ou `driverSubscriptionService.generateDailyFeePix`.
  2. O algoritmo calcula o payload EMV padrão BACEN (IDs 00, 26, 52, 53, 54, 58, 59, 60, 62) e gera o checksum polinomial CRC-16 (0x1021).
  3. Retorna o QR Code SVG gerado localmente.
  4. **Restrição identificada:** A geração do código ocorre em memória, sem emissão paralela de registro no `driver_billing` quando executada isoladamente via fallback de cliente.

### Modalidade 3: Pix Manual com Comprovante
- **Status:** Parcial, restrito à interface administrativa.
- **Fluxo:**
  1. No painel administrativo (`src/routes/app.admin.monetizacao.tsx`), o operador visualiza a fila de recargas de carteira gerenciada por `driver-wallet-service.ts`.
  2. O operador clica em aprovar (`aprovarRecargaPix`) ou rejeitar (`rejeitarRecargaPix`).
  3. O serviço atualiza o saldo na chave `partiu_driver_wallets` do `localStorage`.
  4. **Restrição identificada:** Não há envio do arquivo de comprovante para bucket do Supabase Storage e não há sincronização com o banco relacional.

### Modalidade 4: Cartão de Crédito Recorrente
- **Status:** Simulação mockada.
- **Fluxo:**
  1. Métodos em `src/services/PaymentMethodService.ts` geram identificador simulado `tok_pax_${timestamp}_${random}`.
  2. Nenhuma transação bancária é realizada.

---

## 3. Mapa dos catálogos e das fontes de preço

Existe fragmentação confirmada entre quatro catálogos de planos:

| Identificador do Plano | Catálogo A: DB / PixBillingService | Catálogo B: Super Admin / Franqueado | Catálogo C: Revenue OS Local | Catálogo D: White Label Engine |
| :--- | :--- | :--- | :--- | :--- |
| **Diária Carro** | R$ 14,90 (plano-diaria-essencial) | R$ 19,90 | R$ 14,90 (plano-bronze) | R$ 1,50 (plano-bronze) |
| **Diária Moto** | R$ 14,90 (plano unificado) | R$ 11,90 | Não diferenciado | Não diferenciado |
| **Semanal Carro** | R$ 79,00 | R$ 99,00 | R$ 49,90 | R$ 6,90 |
| **Semanal Moto** | R$ 79,00 | R$ 59,00 | Não diferenciado | Não diferenciado |
| **Mensal Carro** | R$ 299,00 | R$ 349,00 | R$ 149,90 | R$ 19,90 |
| **Mensal Moto** | R$ 299,00 | R$ 199,00 | Não diferenciado | Não diferenciado |
| **Plano Ouro Mensal** | R$ 199,90 (plano-mensal-ouro) | N/A | R$ 99,90 (plano-ouro) | R$ 99,90 (plano-ouro) |
| **Trial Gratuito** | 3 dias (plano-trial-boas-vindas) | 3 a 7 dias (trialAtivo) | 7 dias (plano-livre) | Ilimitado (comissão 5%) |
| **Comissão por Corrida** | **0.0%** | **0.0%** | **0.0%** (com comentários legados) | **1.0% a 5.0%** |

### Regra de precedência necessária para consolidação
1. **Configuração Customizada da Franquia:** Caso o tenant possua parametrização ativa em `white_label_tenant_configs.monetization`, suas tarifas de Diária, Semanal e Mensal por tipo de veículo prevalecem para os motoristas daquela praça.
2. **Catálogo Canônico do Banco de Dados:** Tabela `public.monetization_plans` atua como fonte primária global e fallback para praças sem personalização.
3. **Neutralização de Catálogos Locais:** Deprecar e unificar os catálogos estáticos em `subscription-engine.ts` e `white-label-engine.ts`, fazendo-os consumir a fonte canônica.

---

## 4. Mapa das tabelas e dos estados de assinatura

### Tabelas do Banco de Dados

1. `public.monetization_plans`
   - **Chave Primária:** `id VARCHAR(64)`
   - **Campos Principais:** `plan_name`, `description`, `monthly_fee`, `weekly_fee`, `daily_fee`, `commission_percent`, `trial_days`, `grace_days`, `priority_weight`, `features`, `badge_color`, `is_popular`, `is_default`, `active`.
   - **Restrição de Integridade:** `commission_percent` deve ser rigorosamente `0.00`.

2. `public.driver_subscriptions`
   - **Chave Primária:** `id VARCHAR(64)`
   - **Chaves Estrangeiras:** `plan_id REFERENCES public.monetization_plans(id)`
   - **Campos Principais:** `driver_id`, `cycle_type`, `status`, `driver_status`, `amount_paid`, `starts_at`, `expires_at`, `grace_period_ends_at`, `accumulated_debt`, `suspension_reason`, `auto_renew`.
   - **Enum de Status do Banco:** `ACTIVE`, `TRIAL`, `GRACE_PERIOD`, `EXPIRED`, `SUSPENDED`, `PAYMENT_PENDING`, `DEBT_BLOCKED`, `CANCELLED`.

3. `public.driver_billing`
   - **Chave Primária:** `id VARCHAR(64)`
   - **Chaves Estrangeiras:** `plan_id REFERENCES public.monetization_plans(id)`
   - **Campos Principais:** `driver_id`, `cycle_type`, `amount`, `gateway`, `gateway_reference`, `pix_code`, `qr_code_url`, `status`, `expires_at`, `paid_at`, `metadata`.
   - **Enum de Status de Cobrança:** `PENDING`, `PAID`, `EXPIRED`, `CANCELLED`.

4. `public.subscription_events`
   - **Chave Primária:** `id VARCHAR(64)`
   - **Campos Principais:** `driver_id`, `subscription_id`, `billing_id`, `event_type`, `amount`, `metadata`, `created_at`.
   - **Tipos de Eventos:** `PAYMENT_RECEIVED`, `RENEWAL`, `ACTIVATION`, `UPGRADE`, `DOWNGRADE`, `GRACE_ENTERED`, `SUSPENSION`, `EXPIRATION`, `MANUAL_OVERRIDE`.

5. `public.white_label_tenant_configs`
   - **Chave Primária:** `tenant_id VARCHAR(64)`
   - **Campos Principais:** `monetization JSONB`, `brand_center JSONB`, `updated_at`.

### Máquina de Estados da Assinatura

```
              +--------------------------+
              |       CADASTRO NOVO      |
              +-------------+------------+
                            |
           [Elegível ao trial grátis (3 dias)]
                            |
                            v
              +--------------------------+
              |          TRIAL           |
              +-------------+------------+
                            |
                 [Vigência do trial finda]
                            |
                            v
+-------------------> +--------------------------+ <----------------------+
|                     |     PAYMENT_PENDING      |                        |
|                     +-------------+------------+                        |
|                                   |                                     |
|                       [Pagamento Pix Confirmado]                        |
|                                   |                                     |
|                                   v                                     |
|                     +--------------------------+                        |
|   [Renovação Pix]   |          ACTIVE          |                        |
|         +---------- |     (Acesso Liberado)    |                        |
|         |           +-------------+------------+                        |
|         |                         |                                     |
|         v              [Expiração do período]                           |
|  (Estende prazo)                  |                                     |
|         |                         v                                     |
|         |           +--------------------------+                        |
|         |           |       GRACE_PERIOD       |                        |
|         |           |   (Carência Operacional) |                        |
|         |           +-------------+------------+                        |
|         |                         |                                     |
|         |               [Carência esgotada]                             |
|         |                         |                                     |
|         |                         v                                     |
|         |           +--------------------------+                        |
|         |           |         EXPIRED          |                        |
|         |           |    (Cockpit Bloqueado)   |                        |
|         |           +-------------+------------+                        |
|         |                         |                                     |
+---------+-------------------------+                                     |
                                    |                                     |
                           [Inadimplência grave]                          |
                                    |                                     |
                                    v                                     |
                      +--------------------------+                        |
                      |        SUSPENDED         |                        |
                      |   (Suspensão Financeira) +------------------------+
                      +--------------------------+  [Quitação via Pix]
```

---

## 5. Fluxo financeiro da criação da cobrança até a confirmação

1. **Emissão da Intenção de Pagamento:**
   - Cliente aciona `generate-driver-payment`.
   - Edge Function valida JWT do condutor.
   - Gera `billingId` determinístico.
   - Comunica com gateway adquirente (Mercado Pago ou Asaas).
   - Insere registro em `public.driver_billing` com status `PENDING`.

2. **Recepção e Validação do Webhook:**
   - Gateway dispara POST para `supabase/functions/payment-webhook`.
   - Validador criptográfico checa cabeçalhos (`x-signature`, `x-webhook-signature`, `x-webhook-token`).
   - Se chave de assinatura estiver configurada, valida hash HMAC-SHA256 comparando com o corpo bruto (`rawBody`).
   - Em caso de ausência de segredos configurados, aciona bloqueio fail-closed com HTTP 500 para evitar ativação espúria.
   - Em caso de evento do Mercado Pago, consulta a API bancária para confirmar se o pagamento consta com status `approved`.

3. **Processamento Transacional e Ativação no PostgreSQL:**
   - Edge Function invoca a RPC `public.fn_process_driver_pix_confirmation(p_billing_id, p_gateway_reference, p_amount)`.
   - A RPC executa `SELECT * FROM public.driver_billing ... FOR UPDATE` (bloqueio pessimista impedindo concorrência).
   - Se o status já for `PAID`, retorna sucesso imediatamente garantindo idempotência.
   - Se estiver pendente:
     - Atualiza `public.driver_billing` para `PAID` com `paid_at = clock_timestamp()`.
     - Calcula `v_expires_at` somando o intervalo do ciclo (`INTERVAL '24 hours'` para diária, `'7 days'` para semanal, `'30 days'` para mensal).
     - Insere ou renova registro em `public.driver_subscriptions` com status `ACTIVE`.
     - Insere linha de auditoria em `public.subscription_events`.
   - O Supabase Realtime propaga o evento na tabela `driver_subscriptions` para o app do motorista, que desbloqueia o cockpit em menos de 2 segundos.

---

## 6. Fluxo de avaliação de acesso do motorista

A autorização do motorista para ficar online e receber viagens segue a seguinte ordem lógica:

```
[Requisição de Despacho / Cockpit]
               |
               v
    [Verifica se há motorista]
               |
               v
  [RPC fn_driver_evaluate_access] <--- Fonte Canônica do Servidor
               |
        +------+------+
        |             |
  (Elegível)    (Inelegível)
        |             |
        |             +--> Retorna is_eligible: false, status (EXPIRED, SUSPENDED, PAYMENT_PENDING)
        |                  Cockpit exibe tela de bloqueio com botão de Pix
        v
  [Verifica Documentação do Perfil]
  (profiles.documents_approved === true)
        |
        +------+------+
        |             |
     (Aprovado)  (Pendente)
        |             |
        |             +--> Retorna Bloqueio por Documentos
        v
  [Motorista Liberado no MatchingEngine]
  (Calcula DispatchScore com peso do plano ativo)
```

**Ponto crítico corrigido:** O desvio onde o cliente checava `driverSubscriptionService.getActiveSubscription(driverId)` no `localStorage` antes de chamar o servidor deve ser eliminado. O servidor (RPC `fn_driver_evaluate_access`) é a única fonte da verdade.

---

## 7. Divergências entre o relatório original e o código atual

1. **Nome do diretório da Edge Function de Webhook:**
   - *Relatório original:* Citava `supabase/functions/driver-payment-webhook/index.ts`.
   - *Código real comprovado:* O diretório correto no repositório é [`supabase/functions/payment-webhook/index.ts`](file:///c:/Users/Suporte/Desktop/NOVO%20PARTIU-MOBE/supabase/functions/payment-webhook/index.ts).

2. **Duração do Trial Gratuito:**
   - *Relatório original:* Citava 3 dias.
   - *Código real comprovado:* O plano `plano-trial-boas-vindas` em `monetization_plans` define 3 dias, mas `superadmin-config.ts` define 7 dias (`trialDias: 7`) e `subscription-engine.ts` define 7 dias (`trialDays: 7`).

3. **Multi-Tenancy na Tabela de Assinaturas:**
   - *Relatório original:* Declarava que as tabelas de assinatura eram totalmente multi-tenant.
   - *Código real comprovado:* A tabela `public.driver_subscriptions` não possui coluna `tenant_id` na migration base `20260909_partiu_driver_access_engine_v4.sql`. O isolamento entre franquias é feito por perfil de motorista ou via `white_label_tenant_configs`, criando risco de consulta cross-tenant caso não isolado por `tenant_id`.

4. **Persistência de Métricas Financeiras:**
   - *Relatório original:* Citava que `partiu_driver_revenue_metrics` existe sem ingestão.
   - *Código real comprovado:* Confirmado. A tabela existe na migration `20260908_partiu_driver_revenue_system.sql`, mas nenhuma rotina do backend insere registros históricos nela.

---

## 8. Problemas confirmados, classificados por severidade

### Severidade Crítica (P0)

1. **Split-Brain e Múltiplos Catálogos Concorrentes de Planos [Confirmado]:**
   - *Evidência:* Quatro catálogos divergentes em `monetization_plans`, `superadmin-config.ts`, `subscription-engine.ts` e `white-label-engine.ts`.
   - *Impacto:* Valores apresentados ao condutor no cockpit divergem dos valores configurados pelo franqueado e cobrados na Edge Function.

2. **Dependência Crítica de `localStorage` para Decisão de Acesso e Planos [Confirmado]:**
   - *Evidência:* `PixBillingService.ts`, linhas 249-263 checa `driverSubscriptionService.getActiveSubscription` no `localStorage` antes da RPC. Se o motorista tiver uma chave local com status `ACTIVE`, o cliente considera liberado sem consultar o banco.
   - *Impacto:* Risco de burla de pagamento em dispositivos móveis através de manipulação de armazenamento local.

3. **Inexistência de Jobs Agendados de Expiração e Vencimento [Confirmado]:**
   - *Evidência:* Nenhuma cron job ou worker do Supabase configurado para transicionar estados `ACTIVE` -> `GRACE_PERIOD` -> `EXPIRED` ou emitir notificações preventivas antes do vencimento.
   - *Impacto:* Assinaturas vencidas só são detectadas quando o motorista tenta abrir o app ou quando o servidor é provocado. Motoristas não recebem alerta de renovação pró-ativa.

### Severidade Alta (P1)

4. **Lógica de Comissão Residual e Conflitante com a Taxa Zero [Confirmado]:**
   - *Evidência:* `src/lib/finops-pix-engine.ts:108-129` calcula 5% de taxa de cooperativa; `src/lib/superadmin-config.ts:240` mantém `taxaAdministrativaPercent: 12.0`; `src/routes/app.admin.configuracoes.tsx:462` persiste `platform_fee_percent: 10.0`; `src/lib/revenue/billing-engine.ts:181-248` deduz mensalidades de saques de corridas.
   - *Impacto:* Embora a trigger `trg_rides_zero_commission` force 0% na tabela `rides`, motores periféricos geram desinformação e potenciais deduções indevidas em carteiras.

5. **Ausência de Isolamento por `tenant_id` em `driver_subscriptions` e `monetization_plans` [Confirmado]:**
   - *Evidência:* `public.driver_subscriptions` e `public.monetization_plans` são tabelas globais sem chave estrangeira para `white_label_tenants`.
   - *Impacto:* Franqueados não conseguem customizar pacotes e diárias sem afetar outras cidades ou sofrer colisões em consultas diretas.

6. **Métricas de Observabilidade Processadas Exclusivamente no Navegador [Confirmado]:**
   - *Evidência:* `driverSubscriptionService.getExecutiveSaaSMetrics` calcula MRR, ARR e Churn percorrendo listas em memória no cliente. A tabela `partiu_driver_revenue_metrics` não possui pipeline de ingestão.
   - *Impacto:* Impossibilidade de obter relatórios consolidados confiáveis para investidores e franqueados.

### Severidade Média (P2)

7. **Provedores de Pagamento Simulados (Stubs) no Adaptador [Confirmado]:**
   - *Evidência:* `PaymentProviderAdapter.ts` simula Stripe, Pagar.me, PagBank e Efí gerando chaves estáticas e strings de simulação.
   - *Impacto:* Falha silenciosa caso um administrador tente ativar um gateway que não seja Mercado Pago ou Asaas.

8. **Ausência de Trilha de Auditoria para Ações Manuais do Suporte [Confirmado]:**
   - *Evidência:* Concessão de cortesias e bloqueios em `driverSubscriptionService` atualizam o estado em memória sem gravar registros imutáveis em `subscription_events` com ID do operador.
   - *Impacto:* Falta de conformidade e rastreabilidade para investigações de fraudes internas.

---

## 9. Dependências entre as correções

```
+-------------------------------------------------------------+
| ETAPA 1: Migração de Banco de Dados (Schema Canônico)       |
| - Adiciona tenant_id em driver_subscriptions                |
| - Tabela canonical_monetization_plans & histórico de preços |
| - RPC de expiração automática idempotente                   |
| - Trilha de auditoria administrativa completa               |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| ETAPA 2: Blindagem da Regra de Taxa Zero                    |
| - Neutraliza deduções percentuais em motores de corrida     |
| - Desacopla débitos de mensalidade de saques de corridas    |
| - Atualiza testes de unidade contábeis                      |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| ETAPA 3: Consolidação da Camada de Serviços                 |
| - Unifica PixBillingService e driverSubscriptionService     |
| - Elimina precedência de localStorage na decisão de acesso  |
| - Consome fonte canônica por tenant com precedência correta |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| ETAPA 4: Confiabilidade de Pagamentos & Webhook             |
| - Validação HMAC estrita com bloqueio fail-closed           |
| - Sincronização atômica na RPC do Postgres                  |
| - Eliminação de mocks em fluxos de produção                 |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| ETAPA 5: Observabilidade e Métricas Persistidas             |
| - Cálculo server-side reproduzível (MRR, Churn, Conversão)  |
| - Ingestão histórica diária de KPIs                         |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| ETAPA 6: Bateria de Testes Automatizados e Certificação     |
| - Execução da suíte completa de testes                      |
| - Testes de integração, multi-tenant e segurança            |
+-------------------------------------------------------------+
```

---

## 10. Plano de migração, testes e reversão

### Estratégia de Migração (Aditiva e Segura)
1. **Migration Aditiva no Supabase:**
   - Criar arquivo `supabase/migrations/20261011_monetization_canonical_consolidation.sql`.
   - Adicionar coluna `tenant_id` na tabela `driver_subscriptions` com valor padrão `'tenant-itaperuna'`.
   - Adicionar índice composto `idx_driver_subs_tenant_driver` em `(tenant_id, driver_id)`.
   - Criar tabela `monetization_admin_audit_logs` para registrar ações manuais de suporte (cortesias, bloqueios, alterações de plano).
   - Criar RPC `fn_driver_expire_subscriptions_batch()` para varredura e expiração atômica de assinaturas vencidas.
   - Criar RPC `fn_calculate_saas_metrics(p_tenant_id VARCHAR)` para cálculo consistente e server-side de MRR, ARR, assinantes ativos e churn.
   - Blindar todas as tabelas com RLS protegendo isolamento multi-tenant.

2. **Estratégia de Reversão (Rollback):**
   - As alterações no banco são estritamente aditivas (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`).
   - Nenhuma tabela ou coluna existente será removida durante a migração.
   - Caso seja necessário reverter, as RPCs antigas podem ser restauradas reaplicando o script `20260909_partiu_driver_access_engine_v4.sql`.

3. **Plano de Testes:**
   - Criar suíte de testes automatizados dedicados: `test/monetization-ecosystem-consolidation.test.ts`.
   - Validar cenários de:
     - Precedência de preços (Tenant customizado vs Catálogo Global).
     - Blindagem de 0% de comissão em corridas convencionais.
     - Decisão de acesso server-side imune a adulteração em `localStorage`.
     - Idempotência de confirmação de pagamento.
     - Cálculo matemático exato de MRR, ARR e churn.
     - Isolamento estrito entre franquias.
   - Executar suíte completa através de `npm test`.

---

Documento elaborado sob a responsabilidade técnica do Principal Software Architect.
