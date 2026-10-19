# Runbook Operacional de Monetização e Suporte

Procedimentos operacionais padrão (SOP) para investigação, diagnóstico e resolução de incidentes no sistema de faturamento, liquidação Pix e acesso de condutores da plataforma Partiu.

---

## 1. Cobranças Pix pendentes e não confirmadas

### Sintoma

O motorista efetuou o pagamento do Pix via banco ou chave copia e cola, porém o aplicativo continua exibindo a tela de bloqueio com status `PAYMENT_PENDING` ou `EXPIRED`.

### Diagnóstico

1. **Identificação da fatura:**
   - Acesse a tabela `public.driver_billing` no Supabase filtrando pelo `driver_id` ou telefone do condutor:
     ```sql
     SELECT id, driver_id, plan_id, amount, status, gateway, gateway_reference, created_at, expires_at
     FROM public.driver_billing
     WHERE driver_id = 'UUID_DO_MOTORISTA'
     ORDER BY created_at DESC
     LIMIT 5;
     ```
2. **Verificação do Gateway bancário:**
   - Se `gateway = 'MERCADO_PAGO'`: consulte o status do pagamento no painel do Mercado Pago utilizando o `gateway_reference` ou o campo `external_reference` (`bill_...`).
   - Se o status no Mercado Pago constar como `approved` e no banco como `PENDING`, houve falha na entrega do webhook.

### Resolução

1. **Confirmação manual via RPC (Seguro e Idempotente):**
   - Execute a RPC de processamento informando o `id` da cobrança:
     ```sql
     SELECT public.fn_process_driver_pix_confirmation(
       p_billing_id := 'bill_ID_DA_COBRANCA',
       p_gateway_reference := 'ID_MERCADO_PAGO_SE_HOUVER',
       p_amount := 14.90
     );
     ```
   - A RPC atualizará a cobrança para `PAID`, ativará a assinatura em `public.driver_subscriptions` e emitirá evento em tempo real.
2. **Caso a ordem não exista no banco (pagamento offline em chave estática):**
   - No painel administrativo em `/app/admin/monetizacao`, localize a conta do motorista e utilize o botão "Renovar Manualmente" ou "Conceder Cortesia" especificando a justificativa e o identificador do comprovante.

---

## 2. Falhas na entrega ou validação de webhooks

### Sintoma

Os pagamentos são liquidados pelos usuários, mas nenhum evento de ativação é registrado em `public.subscription_events`.

### Diagnóstico

1. **Verificação dos logs da Edge Function:**
   - No dashboard do Supabase, acesse **Edge Functions** -> `payment-webhook` -> **Logs**.
   - Verifique códigos HTTP de retorno:
     - **HTTP 401 Unauthorized:** A assinatura HMAC enviada pelo gateway diverge do segredo configurado ou o cabeçalho `x-signature` está ausente.
     - **HTTP 500 Internal Server Error:** A variável `PAYMENT_WEBHOOK_SECRET` ou `SUPABASE_SERVICE_ROLE_KEY` não está definida no ambiente da função, acionando o bloqueio fail-closed.
2. **Verificação dos segredos do gateway:**
   - Consulte a tabela `public.admin_gateway_secrets`:
     ```sql
     SELECT id, mercadopago_webhook_secret IS NOT NULL AS has_mp_secret
     FROM public.admin_gateway_secrets
     WHERE id = 'global';
     ```

### Resolução

1. Atualize o segredo do webhook no painel administrativo em `/app/admin/monetizacao` na aba Gateways ou via Supabase Secrets:
   ```bash
   supabase secrets set PAYMENT_WEBHOOK_SECRET="seu_secret_aqui"
   ```
2. Solicite a reentrega do webhook no painel do Mercado Pago (Webhooks -> Reenviar notificação). O sistema processará o evento de forma idempotente.

---

## 3. Discrepâncias de valor ou moeda

### Sintoma

O webhook entrega um valor diferente daquele configurado no plano contratado (por exemplo: condutor alterou manualmente o valor no aplicativo bancário).

### Diagnóstico

1. A RPC `fn_process_driver_pix_confirmation` recebe o parâmetro `p_amount`.
2. Verifique se o valor pago é inferior ao valor do plano em `public.monetization_plans`:
   ```sql
   SELECT b.id, b.amount AS valor_esperado, s.amount_paid AS valor_recebido
   FROM public.driver_billing b
   JOIN public.driver_subscriptions s ON s.driver_id = b.driver_id
   WHERE b.id = 'bill_ID_DA_COBRANCA';
   ```

### Resolução

1. Se o valor pago for inferior à tarifa mínima da diária:
   - A conta não deve ser ativada como diária cheia de 24h.
   - Aplique crédito proporcional via painel administrativo ou realize o estorno bancário pela plataforma do adquirente.

---

## 4. Expirações e incidentes de acesso indevido

### Sintoma

Motoristas com diárias válidas relatam bloqueio indevido no cockpit, ou motoristas vencidos continuam recebendo chamadas no despacho.

### Diagnóstico

1. **Avaliação determinística via SQL:**
   - Execute a RPC de verificação diretamente no banco:
     ```sql
     SELECT public.fn_driver_evaluate_access('UUID_DO_MOTORISTA');
     ```
   - Inspecione os campos `is_eligible`, `status`, `expires_at` e `reasons`.
2. **Verificação de sincronização de relógio:**
   - Verifique se a hora do servidor PostgreSQL está alinhada (`SELECT clock_timestamp();`).
3. **Verificação no Matching Engine:**
   - Caso o banco retorne `is_eligible: false` e o motorista ainda receba viagens, verifique o cache do `MatchingEngine` no servidor de despacho ou se o motorista está com status em cache na fila Redis/H3.

### Resolução

1. Forçar varredura de expiração em lote:
   ```sql
   SELECT public.fn_driver_expire_subscriptions_batch();
   ```
2. Caso o motorista tenha sido bloqueado por engano, execute o desbloqueio via painel ou via RPC administrativa:
   ```sql
   SELECT public.fn_admin_monetization_override(
     p_tenant_id := 'tenant-itaperuna',
     p_admin_id := 'suporte-operacional',
     p_driver_id := 'UUID_DO_MOTORISTA',
     p_action := 'UNBLOCK_ACCESS',
     p_reason := 'Correção de falso positivo após confirmação de comprovante'
   );
   ```

---

## 5. Auditoria de ações administrativas e conformidade

### Consulta de trilha de auditoria

Para auditar intervenções manuais realizadas em motoristas de uma franquia:

```sql
SELECT
  created_at,
  admin_id,
  driver_id,
  action,
  reason,
  previous_state,
  new_state
FROM public.monetization_admin_audit_logs
WHERE tenant_id = 'tenant-itaperuna'
ORDER BY created_at DESC
LIMIT 50;
```

As ações registradas incluem `GRANT_COURTESY`, `BLOCK_ACCESS`, `UNBLOCK_ACCESS` e `MANUAL_RENEWAL`.
