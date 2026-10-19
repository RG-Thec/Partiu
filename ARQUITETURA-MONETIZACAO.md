# Arquitetura do Sistema de Monetização SaaS

Documentação técnica definitiva do modelo de monetização, fonte canônica de planos, modelo de dados relacional, ciclo de vida de assinaturas, regras de acesso e motor de observabilidade da plataforma Partiu.

---

## 1. Fonte de verdade dos planos e preços

A plataforma opera sob o modelo de **Assinatura SaaS Pré-Paga com 0% de comissão por corrida (Zero Take Rate)**.

### Regra canônica de precedência de catálogo

Para garantir suporte à operação multi-tenant sem divergências entre franquias, a resolução de preços e planos segue a seguinte hierarquia estrita:

1. **Nível 1 (Prevalência Local do Franqueado):**
   - Caso o tenant possua customização ativa em `public.white_label_tenant_configs.monetization`, os valores definidos para Diária, Semanal e Mensal (diferenciados por `CARRO` e `MOTO`) prevalecem sobre os valores globais para os motoristas daquela jurisdição territorial.
   - Chave Pix recebedora: `white_label_tenant_configs.monetization.chavePixAdmin`.

2. **Nível 2 (Catálogo Canônico do Banco de Dados PostgreSQL):**
   - Tabela `public.monetization_plans`.
   - Utilizada como fonte primária global para novas praças e como base de cálculo na Edge Function `generate-driver-payment`.
   - Protegida pela constraint `chk_monetization_plans_zero_take_rate` forçando `commission_percent = 0.00`.

3. **Nível 3 (Contingência In-Process Offline):**
   - Objeto `DEFAULT_MONETIZATION_PLANS` no arquivo `src/services/subscription/PixBillingService.ts`.
   - Utilizado exclusivamente quando o aplicativo opera sem conexão com o Supabase ou em ambiente de testes unitários isolados.

### Tabela canônica de planos padrão

| Identificador             | Nome do Plano                  | Ciclo     | Duração  | Carência | Comissão | Preço BRL                              |
| :------------------------ | :----------------------------- | :-------- | :------- | :------- | :------- | :------------------------------------- |
| `plano-diaria-essencial`  | Diária Essencial (Partiu Flex) | `DAILY`   | 24 horas | 2 dias   | 0.0%     | R$ 14,90 / dia                         |
| `plano-semanal-pro`       | Semanal Pro (7 Dias)           | `WEEKLY`  | 7 dias   | 3 dias   | 0.0%     | R$ 69,90 / sem (R$ 249,00 / mês)       |
| `plano-mensal-ouro`       | Mensal Ouro (30 Dias)          | `MONTHLY` | 30 dias  | 5 dias   | 0.0%     | R$ 199,90 / mês (R$ 9,90 / dia equiv.) |
| `plano-trial-boas-vindas` | Degustação Boas-Vindas         | `TRIAL`   | 3 dias   | 1 dia    | 0.0%     | R$ 0,00                                |

---

## 2. Modelo de dados e entidades relacionais

```
+-----------------------------------+         +-------------------------------------+
|      monetization_plans           |         |       driver_subscriptions          |
+-----------------------------------+         +-------------------------------------+
| id (PK, VARCHAR)                  |<----+   | id (PK, VARCHAR)                    |
| plan_name (VARCHAR)               |     |   | driver_id (VARCHAR)                 |
| monthly_fee (NUMERIC)             |     |   | tenant_id (VARCHAR)                 |
| weekly_fee (NUMERIC)              |     +---| plan_id (FK, VARCHAR)               |
| daily_fee (NUMERIC)               |         | cycle_type (DAILY/WEEKLY/MONTHLY)   |
| commission_percent = 0.00 (CHECK) |         | status (VARCHAR)                    |
| trial_days (INT)                  |         | starts_at (TIMESTAMPTZ)             |
| grace_days (INT)                  |         | expires_at (TIMESTAMPTZ)            |
| priority_weight (NUMERIC)         |         | grace_period_ends_at (TIMESTAMPTZ)  |
| active (BOOLEAN)                  |         | accumulated_debt (NUMERIC)          |
+-----------------------------------+         +------------------+------------------+
                                                                 |
                                                                 | gera
                                                                 v
+-----------------------------------+         +-------------------------------------+
|        driver_billing             |         |       subscription_events           |
+-----------------------------------+         +-------------------------------------+
| id (PK, VARCHAR)                  |         | id (PK, VARCHAR)                    |
| driver_id (VARCHAR)               |         | driver_id (VARCHAR)                 |
| tenant_id (VARCHAR)               |         | tenant_id (VARCHAR)                 |
| plan_id (FK, VARCHAR)             |         | subscription_id (VARCHAR)           |
| cycle_type (VARCHAR)              |         | billing_id (VARCHAR)                |
| amount (NUMERIC)                  |         | event_type (VARCHAR)                |
| status (PENDING/PAID/EXPIRED)     |         | amount (NUMERIC)                    |
| gateway (MERCADO_PAGO/ASAAS)      |         | metadata (JSONB)                    |
| gateway_reference (VARCHAR)       |         | created_at (TIMESTAMPTZ)            |
| pix_code (TEXT)                   |         +-------------------------------------+
| paid_at (TIMESTAMPTZ)             |
+-----------------------------------+
```

### Novas tabelas consolidadas

1. `public.monetization_admin_audit_logs`
   - **Objetivo:** Registro imutável de ações manuais executadas pela equipe de suporte ou franqueados.
   - **Campos:** `id UUID`, `tenant_id VARCHAR`, `admin_id VARCHAR`, `driver_id VARCHAR`, `action VARCHAR`, `previous_state JSONB`, `new_state JSONB`, `reason TEXT`, `created_at TIMESTAMPTZ`.

---

## 3. Estados de assinatura e transições

O ciclo de vida da assinatura no Partiu é gerido pelos seguintes estados determinísticos:

| Estado            | Significado Operacional                                        | Acesso ao Cockpit     | Despacho de Corridas |
| :---------------- | :------------------------------------------------------------- | :-------------------- | :------------------- |
| `TRIAL`           | Período de degustação gratuita inicial (3 dias)                | Liberado              | Habilitado           |
| `ACTIVE`          | Assinatura regular quitada e dentro do prazo de vigência       | Liberado              | Habilitado           |
| `GRACE_PERIOD`    | Prazo vencido, operando na carência de tolerância (2 a 5 dias) | Liberado com aviso    | Habilitado           |
| `PAYMENT_PENDING` | Ordem Pix emitida aguardando liquidação bancária               | Bloqueado             | Desabilitado         |
| `EXPIRED`         | Vigência encerrada e carência esgotada                         | Bloqueado com paywall | Desabilitado         |
| `SUSPENDED`       | Conta bloqueada por inadimplência ou decisão administrativa    | Bloqueado             | Desabilitado         |
| `DEBT_BLOCKED`    | Bloqueio preventivo por saldo devedor em carteira              | Bloqueado             | Desabilitado         |
| `CANCELLED`       | Assinatura cancelada por encerramento de vínculo               | Bloqueado             | Desabilitado         |

### Processamento autônomo de expirações

- Executado via RPC PostgreSQL `fn_driver_expire_subscriptions_batch()`.
- Varre registros com `clock_timestamp() > expires_at` e transiciona para `GRACE_PERIOD` ou `EXPIRED` de forma idempotente, registrando eventos na tabela `subscription_events`.

---

## 4. Fluxo de pagamentos e liquidação Pix

```
[Motorista Seleciona Plano]
              |
              v
[Edge Function: generate-driver-payment]
  - Valida JWT Bearer
  - Busca credenciais em admin_gateway_secrets
  - Cria ordem na API do Mercado Pago / Asaas
  - Insere registro PENDING em public.driver_billing
  - Retorna Copia e Cola e QR Code SVG
              |
              v
[Pagamento via App Bancário do Condutor]
              |
              v
[Webhook: payment-webhook]
  - Valida HMAC-SHA256 fail-closed
  - Consulta status oficial via API Mercado Pago (approved)
  - Invoca RPC: fn_process_driver_pix_confirmation
              |
              v
[PostgreSQL: fn_process_driver_pix_confirmation]
  - Bloqueio pessimista: SELECT ... FOR UPDATE
  - Atualiza driver_billing para PAID
  - Cria ou estende driver_subscriptions para ACTIVE
  - Grava evento PAYMENT_RECEIVED em subscription_events
              |
              v
[Supabase Realtime]
  - Emite payload no canal do motorista
  - Cockpit desbloqueia instantaneamente com celebração tátil
```

---

## 5. Regras de acesso e autoridade server-side

1. **Eliminação de bypass local:**
   - O aplicativo do motorista não utiliza o estado do `localStorage` para liberar o recebimento de corridas.
   - A função `pixBillingService.evaluateDriverAccess(driverId, tenantId)` consulta obrigatoriamente a RPC `fn_driver_evaluate_access` no PostgreSQL.
   - Apenas em caso de perda completa de conectividade o cliente entra em contingência temporária documentada.

2. **Matching Engine:**
   - O motor de pareamento (`src/services/MatchingEngine.ts`) exige que `isDriverEligible` retorne verdadeiro.
   - Motoristas nos estados `EXPIRED`, `SUSPENDED`, `DEBT_BLOCKED` ou `PAYMENT_PENDING` são suprimidos da fila de despacho geoespacial antes de qualquer cálculo de proximidade.

---

## 6. Métricas financeiras e observabilidade

As métricas deixam de depender de agregações em memória no navegador e passam a ser apuradas diretamente no servidor via RPC `fn_calculate_saas_metrics(p_tenant_id)`:

1. **MRR (Monthly Recurring Revenue):**
   - Soma das mensalidades ativas normalizadas para base de 30 dias em centavos inteiros:
     $$\text{MRR} = \sum \text{Mensal} + \sum \left(\text{Semanal} \times \frac{30}{7}\right) + \sum \left(\text{Diária} \times 22\right)$$

2. **ARR (Annual Run Rate):**
   - Projeção anualizada formal:
     $$\text{ARR} = \text{MRR} \times 12$$

3. **Taxa de Churn:**
   - Percentual de assinantes vencidos em relação à base total observada no período:
     $$\text{Churn} = \frac{\text{Assinaturas Expiradas}}{\text{Assinaturas Ativas} + \text{Assinaturas Expiradas}} \times 100$$
