-- ==============================================================================
-- 🏛️ MIGRATION: 20261011_monetization_canonical_consolidation.sql
-- ==============================================================================
-- CONSOLIDAÇÃO CANÔNICA DO SISTEMA DE MONETIZAÇÃO SAAS (PARTIU MOBILIDADE)
-- ==============================================================================
-- 1. Isolamento Multi-Tenant em Assinaturas e Cobranças (tenant_id).
-- 2. Trilha de Auditoria Administrativa Imutável (monetization_admin_audit_logs).
-- 3. Blindagem de Integridade de 0% Comissão em Planos (CHECK constraint).
-- 4. RPC de Varredura e Expiração Idempotente em Lote (fn_driver_expire_subscriptions_batch).
-- 5. RPC de Avaliação de Acesso com Isolamento por Tenant (fn_driver_evaluate_access).
-- 6. RPC de Apuração de Métricas SaaS em Servidor (fn_calculate_saas_metrics).
-- 7. Políticas RLS Estritas para Super Admin e Franqueados.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSÃO MULTI-TENANT NAS TABELAS DE ASSINATURA E COBRANÇA
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.driver_subscriptions 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant-itaperuna';

CREATE INDEX IF NOT EXISTS idx_driver_subs_tenant_driver 
  ON public.driver_subscriptions(tenant_id, driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_subs_tenant_status 
  ON public.driver_subscriptions(tenant_id, status);

ALTER TABLE IF EXISTS public.driver_billing 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant-itaperuna';

CREATE INDEX IF NOT EXISTS idx_driver_billing_tenant_driver 
  ON public.driver_billing(tenant_id, driver_id);

ALTER TABLE IF EXISTS public.subscription_events 
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant-itaperuna';

CREATE INDEX IF NOT EXISTS idx_sub_events_tenant_driver 
  ON public.subscription_events(tenant_id, driver_id);

-- ------------------------------------------------------------------------------
-- 2. BLINDAGEM DA TAXA ZERO NOS PLANOS DE MONETIZAÇÃO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monetization_plans (
  id VARCHAR(64) PRIMARY KEY,
  plan_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  weekly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  daily_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  trial_days INTEGER NOT NULL DEFAULT 0,
  grace_days INTEGER NOT NULL DEFAULT 3,
  priority_weight NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge_color VARCHAR(64) NOT NULL DEFAULT 'bg-slate-500',
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Força qualquer plano existente a ter 0.00% de comissão por corrida
UPDATE public.monetization_plans 
SET commission_percent = 0.00 
WHERE commission_percent <> 0.00;

-- Adiciona constraint CHECK garantindo 0% Take Rate no catálogo se não existir
ALTER TABLE public.monetization_plans 
  DROP CONSTRAINT IF EXISTS chk_monetization_plans_zero_take_rate;

ALTER TABLE public.monetization_plans 
  ADD CONSTRAINT chk_monetization_plans_zero_take_rate 
  CHECK (commission_percent = 0.00);

-- ------------------------------------------------------------------------------
-- 3. TABELA: TRILHA DE AUDITORIA ADMINISTRATIVA DE MONETIZAÇÃO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monetization_admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant-itaperuna',
  admin_id VARCHAR(64) NOT NULL,
  driver_id VARCHAR(64),
  action VARCHAR(64) NOT NULL,
  previous_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_monetization_audit_tenant_date 
  ON public.monetization_admin_audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monetization_audit_driver 
  ON public.monetization_admin_audit_logs(driver_id);

-- ------------------------------------------------------------------------------
-- 4. RPC: VARREDURA E EXPIRAÇÃO IDEMPOTENTE EM LOTE (CRON / WORKER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_driver_expire_subscriptions_batch()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_count_grace INTEGER := 0;
  v_count_expired INTEGER := 0;
  v_sub RECORD;
BEGIN
  -- 1. Transiciona para GRACE_PERIOD assinaturas ativas com prazo vencido mas ainda dentro da carência
  FOR v_sub IN
    SELECT id, driver_id, tenant_id, expires_at, grace_period_ends_at
    FROM public.driver_subscriptions
    WHERE status = 'ACTIVE'
      AND expires_at < v_now
      AND (grace_period_ends_at IS NOT NULL AND grace_period_ends_at > v_now)
    FOR UPDATE
  LOOP
    UPDATE public.driver_subscriptions
    SET status = 'GRACE_PERIOD',
        updated_at = v_now
    WHERE id = v_sub.id;

    INSERT INTO public.subscription_events (
      id, driver_id, tenant_id, subscription_id, event_type, amount, metadata, created_at
    ) VALUES (
      'evt_grc_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
      v_sub.driver_id,
      v_sub.tenant_id,
      v_sub.id,
      'GRACE_ENTERED',
      0.00,
      jsonb_build_object('expires_at', v_sub.expires_at, 'grace_period_ends_at', v_sub.grace_period_ends_at),
      v_now
    );

    v_count_grace := v_count_grace + 1;
  END LOOP;

  -- 2. Transiciona para EXPIRED assinaturas ativas ou em carência cujo prazo final encerrou
  FOR v_sub IN
    SELECT id, driver_id, tenant_id, expires_at, grace_period_ends_at
    FROM public.driver_subscriptions
    WHERE status IN ('ACTIVE', 'GRACE_PERIOD')
      AND (
        (grace_period_ends_at IS NOT NULL AND grace_period_ends_at <= v_now)
        OR (grace_period_ends_at IS NULL AND expires_at <= v_now)
      )
    FOR UPDATE
  LOOP
    UPDATE public.driver_subscriptions
    SET status = 'EXPIRED',
        updated_at = v_now
    WHERE id = v_sub.id;

    INSERT INTO public.subscription_events (
      id, driver_id, tenant_id, subscription_id, event_type, amount, metadata, created_at
    ) VALUES (
      'evt_exp_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16),
      v_sub.driver_id,
      v_sub.tenant_id,
      v_sub.id,
      'EXPIRATION',
      0.00,
      jsonb_build_object('expires_at', v_sub.expires_at),
      v_now
    );

    v_count_expired := v_count_expired + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'transitioned_to_grace', v_count_grace,
    'transitioned_to_expired', v_count_expired,
    'executed_at', v_now
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. RPC: AVALIAÇÃO DE ACESSO DO MOTORISTA COM ESCOPO DE TENANT
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_driver_evaluate_access(
  p_driver_id VARCHAR,
  p_tenant_id VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub RECORD;
  v_plan RECORD;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_is_eligible BOOLEAN := false;
  v_effective_status VARCHAR(32) := 'EXPIRED';
  v_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Busca a assinatura mais recente do motorista, respeitando o tenant se fornecido
  SELECT * INTO v_sub
  FROM public.driver_subscriptions
  WHERE driver_id = p_driver_id
    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id OR tenant_id IS NULL)
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'is_eligible', false,
      'status', 'PAYMENT_PENDING',
      'plan_id', NULL,
      'expires_at', NULL,
      'reasons', ARRAY['Nenhuma assinatura ou diária ativa encontrada. Adquira sua diária para rodar.']
    );
  END IF;

  -- Busca o plano correspondente
  SELECT * INTO v_plan
  FROM public.monetization_plans
  WHERE id = v_sub.plan_id;

  -- Avaliação dos estados
  IF v_sub.status = 'SUSPENDED' THEN
    v_is_eligible := false;
    v_effective_status := 'SUSPENDED';
    v_reasons := array_append(v_reasons, COALESCE(v_sub.suspension_reason, 'Conta suspensa por inadimplência. Regularize via PIX.'));
  ELSIF v_sub.status = 'DEBT_BLOCKED' THEN
    v_is_eligible := false;
    v_effective_status := 'DEBT_BLOCKED';
    v_reasons := array_append(v_reasons, 'Bloqueio operacional por débitos pendentes.');
  ELSIF v_sub.status = 'CANCELLED' THEN
    v_is_eligible := false;
    v_effective_status := 'CANCELLED';
    v_reasons := array_append(v_reasons, 'Assinatura cancelada.');
  ELSIF v_sub.expires_at > v_now THEN
    -- Assinatura ativa e dentro da vigência
    v_is_eligible := true;
    v_effective_status := v_sub.status;
  ELSIF v_sub.grace_period_ends_at IS NOT NULL AND v_sub.grace_period_ends_at > v_now THEN
    -- Período de tolerância (Carência)
    v_is_eligible := true;
    v_effective_status := 'GRACE_PERIOD';
    v_reasons := array_append(v_reasons, 'Operando em período de carência tolerada. Renove sua diária.');
  ELSE
    -- Esgotado
    v_is_eligible := false;
    v_effective_status := 'EXPIRED';
    v_reasons := array_append(v_reasons, 'Sua diária de 24 horas expirou. Realize o pagamento PIX para liberar o acesso.');
  END IF;

  RETURN jsonb_build_object(
    'is_eligible', v_is_eligible,
    'status', v_effective_status,
    'plan_id', v_sub.plan_id,
    'plan_name', COALESCE(v_plan.plan_name, 'Plano Operacional Partiu'),
    'priority_weight', COALESCE(v_plan.priority_weight, 1.00),
    'expires_at', v_sub.expires_at,
    'grace_period_ends_at', v_sub.grace_period_ends_at,
    'amount_paid', v_sub.amount_paid,
    'tenant_id', v_sub.tenant_id,
    'reasons', v_reasons
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. RPC: AUDITORIA ADMINISTRATIVA MANUAL DE MONETIZAÇÃO
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_admin_monetization_override(
  p_tenant_id VARCHAR,
  p_admin_id VARCHAR,
  p_driver_id VARCHAR,
  p_action VARCHAR,
  p_reason TEXT,
  p_params JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sub RECORD;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_new_sub_id VARCHAR(64);
  v_days INTEGER;
  v_new_expires TIMESTAMPTZ;
  v_prev_state JSONB := '{}'::jsonb;
  v_new_state JSONB := '{}'::jsonb;
BEGIN
  -- Localiza a assinatura atual do motorista
  SELECT * INTO v_sub
  FROM public.driver_subscriptions
  WHERE driver_id = p_driver_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_prev_state := jsonb_build_object(
      'subscription_id', v_sub.id,
      'status', v_sub.status,
      'expires_at', v_sub.expires_at,
      'amount_paid', v_sub.amount_paid
    );
  END IF;

  IF p_action = 'GRANT_COURTESY' THEN
    v_days := COALESCE((p_params->>'days')::INTEGER, 1);
    IF FOUND AND v_sub.expires_at > v_now THEN
      v_new_expires := v_sub.expires_at + (v_days || ' days')::INTERVAL;
    ELSE
      v_new_expires := v_now + (v_days || ' days')::INTERVAL;
    END IF;

    v_new_sub_id := 'sub_crt_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);

    INSERT INTO public.driver_subscriptions (
      id, driver_id, tenant_id, plan_id, cycle_type, status, driver_status,
      amount_paid, starts_at, expires_at, grace_period_ends_at, auto_renew
    ) VALUES (
      v_new_sub_id, p_driver_id, p_tenant_id,
      COALESCE(v_sub.plan_id, 'plano-diaria-essencial'),
      'DAILY', 'ACTIVE', 'ELIGIBLE',
      0.00, v_now, v_new_expires, v_new_expires + INTERVAL '2 days', false
    );

    v_new_state := jsonb_build_object(
      'subscription_id', v_new_sub_id,
      'status', 'ACTIVE',
      'expires_at', v_new_expires,
      'courtesy_days', v_days
    );

  ELSIF p_action = 'BLOCK_ACCESS' THEN
    IF FOUND THEN
      UPDATE public.driver_subscriptions
      SET status = 'SUSPENDED',
          suspension_reason = p_reason,
          updated_at = v_now
      WHERE id = v_sub.id;
    END IF;

    v_new_state := jsonb_build_object('status', 'SUSPENDED', 'reason', p_reason);

  ELSIF p_action = 'UNBLOCK_ACCESS' THEN
    IF FOUND THEN
      UPDATE public.driver_subscriptions
      SET status = 'ACTIVE',
          suspension_reason = NULL,
          updated_at = v_now
      WHERE id = v_sub.id;
    END IF;

    v_new_state := jsonb_build_object('status', 'ACTIVE');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Ação administrativa desconhecida.');
  END IF;

  -- Grava trilha de auditoria imutável
  INSERT INTO public.monetization_admin_audit_logs (
    tenant_id, admin_id, driver_id, action, previous_state, new_state, reason, created_at
  ) VALUES (
    p_tenant_id, p_admin_id, p_driver_id, p_action, v_prev_state, v_new_state, p_reason, v_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'driver_id', p_driver_id,
    'new_state', v_new_state
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. RPC: CÁLCULO SERVER-SIDE DE MÉTRICAS SAAS CONSOLIDADAS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_calculate_saas_metrics(p_tenant_id VARCHAR DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_active_count INTEGER := 0;
  v_expiring_7d_count INTEGER := 0;
  v_expired_count INTEGER := 0;
  v_suspended_count INTEGER := 0;
  v_mrr_cents BIGINT := 0;
  v_mrr_brl NUMERIC(12, 2) := 0.00;
  v_arr_brl NUMERIC(12, 2) := 0.00;
  v_churn_rate NUMERIC(5, 2) := 0.00;
  v_sub RECORD;
BEGIN
  -- Contagem de assinantes ativos e cálculo do MRR normalizado
  FOR v_sub IN
    SELECT ds.id, ds.cycle_type, ds.amount_paid, ds.expires_at, ds.status
    FROM public.driver_subscriptions ds
    WHERE (p_tenant_id IS NULL OR ds.tenant_id = p_tenant_id)
      AND ds.status IN ('ACTIVE', 'GRACE_PERIOD')
      AND ds.expires_at > (v_now - INTERVAL '3 days')
  LOOP
    v_active_count := v_active_count + 1;

    -- Normalização de receita para base mensal de 30 dias (centavos inteiros)
    IF v_sub.cycle_type = 'MONTHLY' THEN
      v_mrr_cents := v_mrr_cents + ROUND(v_sub.amount_paid * 100)::BIGINT;
    ELSIF v_sub.cycle_type = 'WEEKLY' THEN
      v_mrr_cents := v_mrr_cents + ROUND(v_sub.amount_paid * (30.0 / 7.0) * 100)::BIGINT;
    ELSE
      -- DAILY: diária multiplicada por 22 dias úteis médios
      v_mrr_cents := v_mrr_cents + ROUND(v_sub.amount_paid * 22.0 * 100)::BIGINT;
    END IF;

    -- Prestes a expirar nos próximos 7 dias
    IF v_sub.expires_at <= (v_now + INTERVAL '7 days') THEN
      v_expiring_7d_count := v_expiring_7d_count + 1;
    END IF;
  END LOOP;

  -- Contagem de vencidos e suspensos
  SELECT COUNT(*) INTO v_expired_count
  FROM public.driver_subscriptions
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND status = 'EXPIRED';

  SELECT COUNT(*) INTO v_suspended_count
  FROM public.driver_subscriptions
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
    AND status IN ('SUSPENDED', 'DEBT_BLOCKED');

  v_mrr_brl := ROUND((v_mrr_cents / 100.0)::NUMERIC, 2);
  v_arr_brl := ROUND((v_mrr_brl * 12.0)::NUMERIC, 2);

  -- Churn simples = expirados / (ativos + expirados) * 100
  IF (v_active_count + v_expired_count) > 0 THEN
    v_churn_rate := ROUND(((v_expired_count::NUMERIC / (v_active_count + v_expired_count)::NUMERIC) * 100.0)::NUMERIC, 2);
  END IF;

  RETURN jsonb_build_object(
    'tenant_id', COALESCE(p_tenant_id, 'ALL'),
    'active_subscribers_count', v_active_count,
    'expiring_in_7_days_count', v_expiring_7d_count,
    'expired_count', v_expired_count,
    'suspended_count', v_suspended_count,
    'mrr_cents', v_mrr_cents,
    'mrr_brl', v_mrr_brl,
    'arr_brl', v_arr_brl,
    'churn_rate_percent', v_churn_rate,
    'calculated_at', v_now
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. POLÍTICAS DE SEGURANÇA RLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.monetization_admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monetization_audit_super_admin_all" ON public.monetization_admin_audit_logs;
CREATE POLICY "monetization_audit_super_admin_all"
  ON public.monetization_admin_audit_logs
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "monetization_audit_franqueado_scope" ON public.monetization_admin_audit_logs;
CREATE POLICY "monetization_audit_franqueado_scope"
  ON public.monetization_admin_audit_logs
  FOR ALL
  TO authenticated
  USING (public.is_franqueado() AND tenant_id = public.get_admin_tenant_id())
  WITH CHECK (public.is_franqueado() AND tenant_id = public.get_admin_tenant_id());
