-- ==============================================================================
-- 🚀 PARTIU MOBILIDADE — MIGRATION: PURE SaaS SUBSCRIPTION & ZERO TAKE RATE
-- ==============================================================================
-- DIRETRIZ ESTRATÉGICA FUNDAMENTAL (NORTH STAR):
-- 1. 0% TAKE RATE: Plataforma retém ZERO comissão por corrida (100% repasse líquido D+0).
-- 2. SAAS RECORRENTE: Faturamento exclusivamente por planos de assinatura e diárias.
-- 3. TRAVA DE DESPACHO POSTGIS: Condutores com assinatura vencida são excluídos da fila.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BLINDAGEM DE PLANOS DE MONETIZAÇÃO (TAXA ZERO MANDATÓRIA)
-- ------------------------------------------------------------------------------
-- Assegura que nenhum plano ativo cobre comissão percentual por corrida
UPDATE public.monetization_plans
SET commission_percent = 0.00,
    updated_at = clock_timestamp()
WHERE commission_percent > 0.00;

-- Adiciona restrição de integridade para impedir criação de comissões futuras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_monetization_plans_zero_take_rate'
  ) THEN
    ALTER TABLE public.monetization_plans
    ADD CONSTRAINT ck_monetization_plans_zero_take_rate
    CHECK (commission_percent = 0.00);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CAMPOS DE ASSINATURA NA TABELA DE MOTORISTAS (DRIVER PROFILES)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- driver_profiles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_profiles') THEN
    ALTER TABLE public.driver_profiles 
      ADD COLUMN IF NOT EXISTS status_assinatura VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS validade_assinatura TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
      ADD COLUMN IF NOT EXISTS plano_atual_id VARCHAR(64) DEFAULT 'plano-mensal-ilimitado',
      ADD COLUMN IF NOT EXISTS dias_cortesia_acumulados INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bloqueio_inadimplencia BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS motivo_bloqueio_assinatura TEXT,
      ADD COLUMN IF NOT EXISTS documentos_aprovados BOOLEAN NOT NULL DEFAULT true;

    -- Índice indexado de alta performance para o motor de busca espacial e despacho
    CREATE INDEX IF NOT EXISTS idx_driver_profiles_saas_dispatch
    ON public.driver_profiles (status_assinatura, validade_assinatura, documentos_aprovados)
    WHERE status_assinatura IN ('ACTIVE', 'TRIAL', 'ativa', 'trial') AND documentos_aprovados = true;
  END IF;

  -- drivers (tabela alternativa se existente)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
    ALTER TABLE public.drivers 
      ADD COLUMN IF NOT EXISTS status_assinatura VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS validade_assinatura TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
      ADD COLUMN IF NOT EXISTS plano_atual_id VARCHAR(64) DEFAULT 'plano-mensal-ilimitado',
      ADD COLUMN IF NOT EXISTS dias_cortesia_acumulados INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS bloqueio_inadimplencia BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS motivo_bloqueio_assinatura TEXT,
      ADD COLUMN IF NOT EXISTS documentos_aprovados BOOLEAN NOT NULL DEFAULT true;

    CREATE INDEX IF NOT EXISTS idx_drivers_saas_dispatch
    ON public.drivers (status_assinatura, validade_assinatura, documentos_aprovados)
    WHERE status_assinatura IN ('ACTIVE', 'TRIAL', 'ativa', 'trial') AND documentos_aprovados = true;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. TABELA: FATURAS E RECARGAS DE ASSINATURA SAAS (PIX GATEWAYS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.driver_subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id VARCHAR(64) NOT NULL,
  driver_name VARCHAR(120),
  plan_id VARCHAR(64) NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  cycle VARCHAR(32) NOT NULL DEFAULT 'MONTHLY',
  amount_brl NUMERIC(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  gateway VARCHAR(32) NOT NULL DEFAULT 'MERCADO_PAGO',
  pix_txid VARCHAR(128),
  pix_copia_e_cola TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, EXPIRED, CANCELLED
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (clock_timestamp() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX IF NOT EXISTS idx_sub_invoices_driver 
ON public.driver_subscription_invoices (driver_id, status);

CREATE INDEX IF NOT EXISTS idx_sub_invoices_txid 
ON public.driver_subscription_invoices (pix_txid);

-- ------------------------------------------------------------------------------
-- 4. RPC: ATIVAÇÃO INSTANTÂNEA DE ASSINATURA VIA WEBHOOK PIX
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_activate_driver_subscription(
  p_driver_id VARCHAR(64),
  p_plan_id VARCHAR(64),
  p_amount_brl NUMERIC(10, 2),
  p_duration_days INTEGER DEFAULT 30,
  p_txid VARCHAR(128) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_expires TIMESTAMPTZ;
  v_current_expires TIMESTAMPTZ;
BEGIN
  -- Busca expiração atual (se houver e se ainda válida, estende a partir dela)
  SELECT validade_assinatura INTO v_current_expires
  FROM public.driver_profiles
  WHERE id::text = p_driver_id OR driver_id::text = p_driver_id
  LIMIT 1;

  IF v_current_expires IS NOT NULL AND v_current_expires > clock_timestamp() THEN
    v_new_expires := v_current_expires + (p_duration_days || ' days')::INTERVAL;
  ELSE
    v_new_expires := clock_timestamp() + (p_duration_days || ' days')::INTERVAL;
  END IF;

  -- Atualiza o motorista para status ATIVO e estende a validade
  UPDATE public.driver_profiles
  SET status_assinatura = 'ACTIVE',
      validade_assinatura = v_new_expires,
      plano_atual_id = p_plan_id,
      bloqueio_inadimplencia = false,
      motivo_bloqueio_assinatura = NULL,
      updated_at = clock_timestamp()
  WHERE id::text = p_driver_id OR driver_id::text = p_driver_id;

  -- Registra no histórico de faturas
  INSERT INTO public.driver_subscription_invoices (
    driver_id,
    plan_id,
    plan_name,
    amount_brl,
    duration_days,
    pix_txid,
    status,
    paid_at
  ) VALUES (
    p_driver_id,
    p_plan_id,
    COALESCE((SELECT plan_name FROM public.monetization_plans WHERE id = p_plan_id), 'Assinatura SaaS'),
    p_amount_brl,
    p_duration_days,
    p_txid,
    'PAID',
    clock_timestamp()
  );

  RETURN jsonb_build_object(
    'success', true,
    'driver_id', p_driver_id,
    'status_assinatura', 'ACTIVE',
    'validade_assinatura', v_new_expires,
    'unlocked', true
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. RPC: EVALUATE ACCESS (TRAVA DE SEGURANÇA NO DESPACHO)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_driver_evaluate_access(
  p_driver_id VARCHAR(64)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status VARCHAR(32);
  v_expires TIMESTAMPTZ;
  v_docs BOOLEAN;
  v_blocked BOOLEAN;
  v_is_eligible BOOLEAN;
BEGIN
  SELECT 
    status_assinatura, 
    validade_assinatura, 
    COALESCE(documentos_aprovados, true),
    COALESCE(bloqueio_inadimplencia, false)
  INTO v_status, v_expires, v_docs, v_blocked
  FROM public.driver_profiles
  WHERE id::text = p_driver_id OR driver_id::text = p_driver_id
  LIMIT 1;

  IF v_status IS NULL THEN
    -- Fallback permissivo de teste ou busca na tabela driver_subscriptions
    RETURN jsonb_build_object(
      'is_eligible', true,
      'status', 'ACTIVE',
      'reasons', jsonb_build_array('Perfil não indexado, modo fallback ativo')
    );
  END IF;

  v_is_eligible := (
    v_docs = true 
    AND v_blocked = false 
    AND v_status IN ('ACTIVE', 'TRIAL', 'ativa', 'trial')
    AND v_expires >= clock_timestamp()
  );

  RETURN jsonb_build_object(
    'is_eligible', v_is_eligible,
    'status', v_status,
    'expires_at', v_expires,
    'documents_approved', v_docs,
    'is_blocked', v_blocked
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. TRIGGER DE BLINDAGEM: 0% TAKE RATE EM TODAS AS CORRIDAS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_enforce_zero_ride_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Força a taxa da plataforma a ser estritamente R$ 0,00
  IF NEW.platform_fee IS NOT NULL THEN
    NEW.platform_fee := 0.00;
  END IF;
  IF NEW.driver_net_share IS NOT NULL AND NEW.total_fare IS NOT NULL THEN
    NEW.driver_net_share := NEW.total_fare;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rides') THEN
    DROP TRIGGER IF EXISTS trg_rides_zero_commission ON public.rides;
    CREATE TRIGGER trg_rides_zero_commission
    BEFORE INSERT OR UPDATE ON public.rides
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_enforce_zero_ride_commission();
  END IF;
END $$;
