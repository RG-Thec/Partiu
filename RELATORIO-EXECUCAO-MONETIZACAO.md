# Relatório de Execução da Reestruturação do Ecossistema de Monetização

## 1. Resumo Executivo da Execução

Este documento formaliza a conclusão da reestruturação técnica e consolidação do ecossistema de monetização do Partiu. A intervenção eliminou a dispersão e as inconsistências catalogadas no relatório forense `ESTADO-ATUAL-MONETIZACAO.md`, garantindo alinhamento total ao modelo de negócio: **SaaS puro para motoristas com 0% de retenção (taxa zero) sobre corridas convencionais de mobilidade urbana**.

A intervenção cobriu:
1. Unificação da hierarquia de planos com precedência determinística: customização do tenant > catálogo canônico persistido (`monetization_plans`) > fallback em memória.
2. Blindagem arquitetural da regra de 0% de comissão em banco de dados (`chk_monetization_plans_zero_take_rate`) e no código-fonte de todos os motores periféricos.
3. Centralização da autoridade de vigência e ciclo de vida das assinaturas no backend através de RPCs PostgreSQL (`fn_driver_evaluate_access`, `fn_driver_expire_subscriptions_batch`), eliminando bypasses em armazenamento local de navegador.
4. Idempotência em transações financeiras Pix e separação estrita entre saldos operacionais de corridas e débitos de mensalidade de acesso.
5. Persistência de auditoria imutável para ações de suporte e superadministração (`monetization_admin_audit_logs`).
6. Cálculo analítico e consolidado de métricas SaaS no PostgreSQL (`fn_calculate_saas_metrics`).

---

## 2. Diagnóstico das Causas-Raiz e Decisões de Engenharia

### 2.1 Fragmentação e Divergência de Catálogos (Split-Brain)
- **Causa-Raiz:** Diversos arquivos (`PixBillingService.ts`, `white-label-engine.ts`, `billing-engine.ts`, `superadmin-config.ts`, `generate-driver-payment/index.ts`) continham definições estáticas paralelas de planos com durações e preços díspares (por exemplo, planos semanais de R$ 34,90 a R$ 49,90 e diárias de R$ 9,90 a R$ 14,90). Além disso, o free trial apresentava cobranças residuais indevidas em algumas rotas.
- **Decisão Técnica:** Estabeleceu-se uma hierarquia de três níveis com isolamento multi-tenant:
  1. Nível 1 (Máxima prioridade): Configuração explícita do franqueado (`white_label_tenant_configs.monetization.planos`).
  2. Nível 2 (Canônico padrão): Tabela relacional persistida `monetization_plans`.
  3. Nível 3 (Contingência offline): Catálogo canônico imutável de fallback em `PixBillingService.ts`.
  Planos de trial gratuito foram travados em R$ 0,00 com 3 dias de vigência. Planos pagos foram travados com `trial_days = 0`.

### 2.2 Resíduos de Comissão sobre Corridas em Motores Periféricos
- **Causa-Raiz:** Motores e interfaces mantinham configurações herdadas de comissão percentual variando entre 1% e 12% (`monetization.planos` no `white-label-engine.ts` e `configSuperAdminInicial` no `superadmin-config.ts`).
- **Decisão Técnica:** 
  1. Aplicação de `CONSTRAINT chk_monetization_plans_zero_take_rate CHECK (commission_percent = 0.00)` na tabela de planos.
  2. Atualização dos defaults de white-label e superadministrador para 0.0% de taxa administrativa, 0.0% de taxa cooperativa e repasse integral de 100% ao motorista.
  3. Atualização do formulário administrativo em `app.admin.configuracoes.tsx` para taxa zero por padrão.

### 2.3 Bypass de Cliente e Ausência de Autoridade Central no Ciclo de Vida
- **Causa-Raiz:** O método `evaluateDriverAccess` consultava chaves locais (`localStorage`) antes de verificar a nuvem, permitindo que motoristas manipulassem datas no navegador para obter acesso indevido sem validação do backend. Adicionalmente, as rotinas de expiração e cortesia dependiam de cliques manuais em tela.
- **Decisão Técnica:**
  1. Refatoração de `PixBillingService.evaluateDriverAccess` para consultar prioritariamente a RPC `fn_driver_evaluate_access` no PostgreSQL.
  2. Criação da RPC `fn_driver_expire_subscriptions_batch` para execução autônoma via cron/pg_cron no banco de dados.
  3. Criação da RPC `fn_admin_monetization_override` com persistência obrigatória na tabela `monetization_admin_audit_logs`.

### 2.4 Acoplamento entre Débito de Assinatura e Saques de Corridas
- **Causa-Raiz:** No arquivo `billing-engine.ts`, o parâmetro `autoDeductOnWithdrawal` vinha configurado como `true`, gerando retenção automática do saldo de corridas para abater débitos de mensalidade.
- **Decisão Técnica:** O parâmetro padrão foi alterado para `autoDeductOnWithdrawal: false`. O saldo de corridas do motorista permanece intocado. O acesso é bloqueado de forma fail-closed caso a assinatura expire, sem retenções indiretas não acordadas.

---

## 3. Inventário Completo de Arquivos e Linhas Modificados

### 3.1 Migração de Banco de Dados
- **`supabase/migrations/20261011_monetization_canonical_consolidation.sql`** (Novo)
  - Criação da tabela `monetization_plans` e inserção dos planos canônicos (Diário R$ 9,90, Semanal R$ 39,90, Quinzenal R$ 69,90, Mensal R$ 119,90, Anual R$ 1.190,00 e Trial Gratuito R$ 0,00).
  - Adição da coluna `tenant_id` e índices compostos em `driver_subscriptions`, `driver_billing` e `subscription_events`.
  - Criação da tabela `monetization_admin_audit_logs` para auditoria administrativa imutável.
  - Implementação das funções RPC: `fn_driver_expire_subscriptions_batch`, `fn_driver_evaluate_access`, `fn_admin_monetization_override` e `fn_calculate_saas_metrics`.
  - Configuração de políticas de segurança Row Level Security (RLS) para isolamento por tenant.

### 3.2 Motores e Serviços de Backend e Frontend
- **`src/services/subscription/PixBillingService.ts`**
  - Refatoração do catálogo canônico com validação estrita de trial e preços em centavos e reais.
  - Inclusão obrigatória de `tenant_id` em cobranças e registros de faturamento.
  - Refatoração de `evaluateDriverAccess` para consultar `fn_driver_evaluate_access` com fail-closed quando online.
  - Remoção de qualquer dependência primária de `localStorage` para validação de acesso.
- **`src/lib/ecosystem/driver-subscription-service.ts`**
  - Conexão dos métodos administrativos (`grantCourtesyDays`, `renewManually`, `blockDriverAccess`, `unblockDriverAccess`) à RPC segura `fn_admin_monetization_override`.
  - Criação da função `fetchServerSaaSMetrics(tenantId)` para consulta das métricas calculadas diretamente no PostgreSQL.
- **`src/lib/superadmin-config.ts`**
  - Ajuste de `configSuperAdminInicial`: `taxaAdministrativaPercent: 0.0`, `taxaCooperativaPercent: 0.0`, `repasseMotoristaPercent: 100`.
  - Suporte explícito a `gateway` e `gatewayProvider` em `ConfigMonetizacaoWhiteLabel`.
- **`src/lib/white-label/white-label-engine.ts`**
  - Normalização dos planos padrão de mobilidade: `comissaoPercentual: 0.0` em todos os níveis.
- **`src/lib/revenue/billing-engine.ts`**
  - Desativação de desconto compulsório em saques: `autoDeductOnWithdrawal: false`.
- **`src/routes/app.admin.configuracoes.tsx`**
  - Configuração padrão de `wlComissao` para `"0.0"`.
  - Atualização do rótulo na interface para "Comissão por Corrida (% Taxa Zero)".
- **`src/routes/app.admin.monetizacao.tsx`**
  - Integração de `fetchServerSaaSMetrics` para carregar MRR, ARR, churn e motoristas ativos calculados no servidor.
- **`src/routes/app.admin.whitelabel.tsx`**
  - Importação de `useCallback` e tipagem estrita de busca e paginação de tenants.
- **`src/components/driver/DriverSubscriptionScreen.tsx`**
  - Tipagem defensiva na leitura de `tenantMonetization` para evitar falhas em tempo de execução.

### 3.3 Testes e Documentação
- **`test/monetization-ecosystem-consolidation.test.ts`** (Novo)
  - 8 testes cobrindo catálogo canônico, taxa zero, ciclo Pix, idempotência, avaliação de acesso, auditoria e métricas.
- **`test/run-all-tests.mjs`**
  - Registro da nova suíte na pipeline unificada de testes.
- **`ESTADO-ATUAL-MONETIZACAO.md`** (Novo)
  - Auditoria forense inicial do código legado.
- **`PLANO-REESTRUTURACAO-MONETIZACAO.md`** (Novo)
  - Plano de arquitetura, grafo de dependências e estratégia de mitigação de riscos.
- **`ARQUITETURA-MONETIZACAO.md`** (Novo)
  - Especificação detalhada da arquitetura canônica final.
- **`MATRIZ-TESTES-MONETIZACAO.md`** (Novo)
  - Matriz de testes de regressão, segurança, concorrência e idempotência.
- **`RUNBOOK-MONETIZACAO.md`** (Novo)
  - Guia operacional com procedimentos para incidentes, webhooks, contingência de gateways e suporte.
- **`RELATORIO-EXECUCAO-MONETIZACAO.md`** (Novo)
  - Este relatório de fechamento de engenharia.

---

## 4. Detalhamento da Migração de Banco de Dados

Arquivo: `supabase/migrations/20261011_monetization_canonical_consolidation.sql`

1. **Tabela `monetization_plans`:**
   - Campos: `id`, `tenant_id`, `plan_id`, `name`, `billing_cycle`, `price_cents`, `price_reais`, `commission_percent`, `trial_days`, `is_active`, `created_at`, `updated_at`.
   - Restrição `chk_monetization_plans_zero_take_rate`: Garante `commission_percent = 0.00`.
   - Restrição `chk_monetization_plans_trial_logic`: Garante que planos com `trial_days > 0` possuam `price_cents = 0`.
2. **Índices de Performance e Isolamento:**
   - `idx_driver_subscriptions_tenant_driver` em `driver_subscriptions(tenant_id, driver_id)`.
   - `idx_driver_subscriptions_status_expiry` em `driver_subscriptions(status, current_period_end)`.
   - `idx_driver_billing_tenant_status` em `driver_billing(tenant_id, status)`.
3. **Auditoria Administrativa:**
   - Tabela `monetization_admin_audit_logs` gravando `actor_id`, `actor_role`, `driver_id`, `tenant_id`, `action_type`, `previous_state`, `new_state`, `reason`, `ip_address`, `created_at`.
4. **Funções RPC:**
   - `fn_driver_evaluate_access(p_driver_id, p_tenant_id)`: Retorna `can_drive`, `access_status`, `reason`, `days_remaining` com isolamento por tenant.
   - `fn_driver_expire_subscriptions_batch()`: Atualiza assinaturas vencidas para `EXPIRED` e registra eventos em lote de forma idempotente.
   - `fn_admin_monetization_override(p_driver_id, p_tenant_id, p_action, p_additional_days, p_reason, p_actor_id, p_actor_role)`: Aplica ações de cortesia, renovação ou bloqueio, registrando o log de auditoria na mesma transação atômica.
   - `fn_calculate_saas_metrics(p_tenant_id)`: Agrega MRR normalizado, ARR, total de motoristas ativos, inadimplentes, em trial e taxa de churn.

---

## 5. Blindagens Implementadas contra Regressão

| Vulnerabilidade Anterior | Risco de Negócio | Mecanismo de Blindagem Implementado | Camada de Proteção |
| :--- | :--- | :--- | :--- |
| Planos com comissão de 1% a 12% | Descumprimento da promessa de taxa zero aos motoristas | `CHECK (commission_percent = 0.00)` e código normalizado em todos os motores | Banco de dados e Aplicação |
| Bypass de validade no cliente (`localStorage`) | Motorista trafegando sem pagar mensalidade alterando data no navegador | `fn_driver_evaluate_access` com fail-closed obrigatório via RPC | Backend PostgreSQL |
| Cobrança residual em plano de trial | Desconfiança e atrito no primeiro uso | `CHECK` relacional e validação no `PixBillingService` (`trial_days > 0 => R$ 0,00`) | Banco de dados e Aplicação |
| Saque de corridas retendo mensalidade | Reclamações de apropriação indevida de saldo de corridas | `autoDeductOnWithdrawal: false` por padrão em `billing-engine.ts` | Aplicação |
| Bloqueio ou cortesia sem rastro | Fraude interna ou suporte concedendo dias sem justificativa | `fn_admin_monetization_override` exigindo motivo e gerando log imutável | Banco de dados |
| Processamento repetido de webhook Pix | Extensão indevida de vigência por reentrega de mensagem | Idempotência transacional por `idempotency_key` e `txid` | Aplicação e Banco de dados |

---

## 6. Resultados da Execução dos Testes e Validação

A bateria de testes automatizados foi executada e validada:
- **Suíte de Testes Automatizados:** 404 testes executados via `npm test` (`test/run-all-tests.mjs`).
  - Total de testes: **404**
  - Testes com sucesso: **404**
  - Falhas: **0**
- **Verificação de Tipagem Estática (TypeScript):** `npx tsc --noEmit` executado com **0 erros**.
- **Compilação de Produção (Vite Build):** `npm run build` gerou os pacotes de produção sem avisos impeditivos nem quebras de dependência.

---

## 7. Riscos Residuais, Limitações e Mitigações

1. **Execução Agendada da Expiração em Nuvem:**
   - *Situação:* A função `fn_driver_expire_subscriptions_batch()` foi criada com execução transacional e idempotente no PostgreSQL. Em ambientes locais ou sem a extensão `pg_cron` habilitada no Supabase, a chamada periódica precisa ser disparada por um agendador externo (Supabase Edge Function via CRON ou cron job no servidor de aplicação).
   - *Mitigação:* A função `fn_driver_evaluate_access()` verifica o carimbo de data/hora dinamicamente em tempo real. Mesmo que o lote de expiração não tenha rodado no minuto exato do vencimento, o motorista é bloqueado imediatamente na tentativa de acesso caso `current_period_end < now()`.
2. **Migrações de Ambientes de Produção:**
   - *Situação:* A migração SQL precisa ser aplicada ao banco de dados Supabase de produção através do dashboard ou do Supabase CLI (`supabase db push`).
   - *Mitigação:* A migração foi projetada de forma estritamente idempotente com cláusulas `IF NOT EXISTS`, `OR REPLACE` e `ON CONFLICT DO NOTHING`.

---

## 8. Procedimentos de Rollout e Rollback para Produção

### Procedimento de Rollout
1. Aplicar a migração `supabase/migrations/20261011_monetization_canonical_consolidation.sql` no banco de dados do projeto.
2. Confirmar a existência e o estado dos planos via query:
   ```sql
   SELECT plan_id, name, price_reais, commission_percent, trial_days FROM monetization_plans WHERE is_active = true;
   ```
3. Realizar o deploy da aplicação frontend e funções serverless.
4. Executar verificação de faturamento simulando a consulta de acesso de um motorista com a RPC `fn_driver_evaluate_access`.

### Procedimento de Rollback
Caso ocorra qualquer instabilidade imprevista no ambiente:
1. Reverter o deploy dos arquivos de aplicação para a versão anterior via Git.
2. Como a migração SQL apenas adiciona novas tabelas, colunas opcionais (`tenant_id`) e funções RPC sem remover dados pré-existentes, não há necessidade de rollback destrutivo de schema.
3. Se necessário remover restrições adicionadas:
   ```sql
   ALTER TABLE monetization_plans DROP CONSTRAINT IF EXISTS chk_monetization_plans_zero_take_rate;
   ```
