-- ==============================================================================
-- 🛡️ PARTIU MOBILIDADE — MIGRATION: P0/P1 SECURITY & RLS HARDENING (2026-10-07)
-- ==============================================================================
-- 1. BLINDAGEM DE FATURAS SAAS: Ativação de RLS em driver_subscription_invoices
-- 2. BLINDAGEM LGPD: Fechamento de brechas públicas em partiu_passageiros e partiu_motoristas
-- 3. ISOLAMENTO DE SEGREDOS: Criação da tabela admin_gateway_secrets para tokens MP
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA driver_subscription_invoices: HABILITAÇÃO E POLÍTICAS RLS
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.driver_subscription_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_invoices_select_policy" ON public.driver_subscription_invoices;
CREATE POLICY "sub_invoices_select_policy"
  ON public.driver_subscription_invoices FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = driver_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

DROP POLICY IF EXISTS "sub_invoices_insert_policy" ON public.driver_subscription_invoices;
CREATE POLICY "sub_invoices_insert_policy"
  ON public.driver_subscription_invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text = driver_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

DROP POLICY IF EXISTS "sub_invoices_update_policy" ON public.driver_subscription_invoices;
CREATE POLICY "sub_invoices_update_policy"
  ON public.driver_subscription_invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

-- ------------------------------------------------------------------------------
-- 2. TABELAS partiu_passageiros E partiu_motoristas: BLINDAGEM LGPD CONTRA DUMP
-- ------------------------------------------------------------------------------
-- 2.1 partiu_passageiros: Restringe leitura e escrita ao próprio titular ou admin
ALTER TABLE IF EXISTS public.partiu_passageiros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "passageiros_select_policy" ON public.partiu_passageiros;
DROP POLICY IF EXISTS "passageiros_insert_policy" ON public.partiu_passageiros;
DROP POLICY IF EXISTS "passageiros_update_policy" ON public.partiu_passageiros;
DROP POLICY IF EXISTS "passageiros_delete_policy" ON public.partiu_passageiros;

CREATE POLICY "passageiros_select_policy"
  ON public.partiu_passageiros FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

CREATE POLICY "passageiros_insert_policy"
  ON public.partiu_passageiros FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

CREATE POLICY "passageiros_update_policy"
  ON public.partiu_passageiros FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

CREATE POLICY "passageiros_delete_policy"
  ON public.partiu_passageiros FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

-- 2.2 partiu_motoristas: Restringe leitura e escrita ao próprio condutor ou admin
ALTER TABLE IF EXISTS public.partiu_motoristas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "motoristas_select_policy" ON public.partiu_motoristas;
DROP POLICY IF EXISTS "motoristas_insert_policy" ON public.partiu_motoristas;
DROP POLICY IF EXISTS "motoristas_update_policy" ON public.partiu_motoristas;
DROP POLICY IF EXISTS "motoristas_delete_policy" ON public.partiu_motoristas;

CREATE POLICY "motoristas_select_policy"
  ON public.partiu_motoristas FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

CREATE POLICY "motoristas_insert_policy"
  ON public.partiu_motoristas FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

CREATE POLICY "motoristas_update_policy"
  ON public.partiu_motoristas FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

CREATE POLICY "motoristas_delete_policy"
  ON public.partiu_motoristas FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

-- ------------------------------------------------------------------------------
-- 3. ISOLAMENTO E BLINDAGEM DE SEGREDOS DE GATEWAY (MERCADO PAGO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_gateway_secrets (
  id VARCHAR(64) PRIMARY KEY DEFAULT 'global',
  mercadopago_access_token TEXT,
  mercadopago_webhook_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

ALTER TABLE public.admin_gateway_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_gateway_secrets_policy" ON public.admin_gateway_secrets;
CREATE POLICY "admin_gateway_secrets_policy"
  ON public.admin_gateway_secrets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
    )
  );

-- Migra tokens prévios para a tabela isolada se existirem em app_settings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'app_settings' AND column_name = 'mercadopago_access_token'
  ) THEN
    INSERT INTO public.admin_gateway_secrets (id, mercadopago_access_token, mercadopago_webhook_secret)
    SELECT id, mercadopago_access_token, mercadopago_webhook_secret
    FROM public.app_settings
    WHERE id = 'global' AND (mercadopago_access_token IS NOT NULL OR mercadopago_webhook_secret IS NOT NULL)
    ON CONFLICT (id) DO UPDATE SET
      mercadopago_access_token = COALESCE(EXCLUDED.mercadopago_access_token, admin_gateway_secrets.mercadopago_access_token),
      mercadopago_webhook_secret = COALESCE(EXCLUDED.mercadopago_webhook_secret, admin_gateway_secrets.mercadopago_webhook_secret),
      updated_at = clock_timestamp();

    -- Higieniza app_settings para que nunca mais vaze tokens em selects abertos
    UPDATE public.app_settings
    SET mercadopago_access_token = NULL,
        mercadopago_webhook_secret = NULL
    WHERE id = 'global';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. RPCs DE GOVERNANÇA SEGURA DE CREDENCIAIS DE GATEWAY
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_save_admin_gateway_secrets(
  p_access_token TEXT,
  p_webhook_secret TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Validação estrita de autorização
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem atualizar segredos bancários.';
  END IF;

  INSERT INTO public.admin_gateway_secrets (id, mercadopago_access_token, mercadopago_webhook_secret, updated_at)
  VALUES ('global', p_access_token, p_webhook_secret, clock_timestamp())
  ON CONFLICT (id) DO UPDATE SET
    mercadopago_access_token = EXCLUDED.mercadopago_access_token,
    mercadopago_webhook_secret = EXCLUDED.mercadopago_webhook_secret,
    updated_at = clock_timestamp();

  RETURN jsonb_build_object('success', true, 'message', 'Credenciais de gateway salvas com segurança.');
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_get_admin_gateway_secrets()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_token TEXT;
  v_secret TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%owner%' OR p.role ILIKE '%gestor%')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem consultar credenciais de gateway.';
  END IF;

  SELECT mercadopago_access_token, mercadopago_webhook_secret
  INTO v_token, v_secret
  FROM public.admin_gateway_secrets
  WHERE id = 'global';

  RETURN jsonb_build_object(
    'mercadopago_access_token', COALESCE(v_token, ''),
    'mercadopago_webhook_secret', COALESCE(v_secret, '')
  );
END;
$$;

COMMENT ON TABLE public.admin_gateway_secrets IS 'Armazena segredos de produção de gateways sob RLS estrito acessível apenas por administradores e service role.';
