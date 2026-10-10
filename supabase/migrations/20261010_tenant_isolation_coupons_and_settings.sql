-- ==============================================================================
-- 🎟️ PARTIU MOBILIDADE — MIGRATION: TENANT ISOLATION (COUPONS & SETTINGS)
-- ==============================================================================
-- 1. ISOLAMENTO MULTI-TENANT DE CUPONS DE DESCONTO:
--    Adiciona coluna tenant_id na tabela campaigns_coupons para que cada
--    franqueado crie e controle cupons exclusivamente dentro da sua praça.
-- 2. POLÍTICAS RLS (Row Level Security):
--    - Super Admin: Acesso irrestrito a todos os cupons de todas as praças.
--    - Franqueado: Acesso estritamente aos cupons com seu tenant_id.
--    - Usuários/Passageiros: Leitura de cupons ativos da sua praça.
-- ==============================================================================

DO $$
BEGIN
  -- 1. Tabela campaigns_coupons
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns_coupons') THEN
    -- Adicionar coluna tenant_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'campaigns_coupons' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE public.campaigns_coupons ADD COLUMN tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant-itaperuna';
    END IF;

    -- Índice de alta performance para busca e filtros de tenant
    CREATE INDEX IF NOT EXISTS idx_campaigns_coupons_tenant ON public.campaigns_coupons(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_coupons_code_tenant ON public.campaigns_coupons(code, tenant_id);

    -- Habilitar RLS
    ALTER TABLE public.campaigns_coupons ENABLE ROW LEVEL SECURITY;

    -- Remover políticas legadas se existirem
    DROP POLICY IF EXISTS "campaigns_coupons_super_admin_all" ON public.campaigns_coupons;
    DROP POLICY IF EXISTS "campaigns_coupons_franqueado_scope" ON public.campaigns_coupons;
    DROP POLICY IF EXISTS "campaigns_coupons_public_select" ON public.campaigns_coupons;

    -- Super Admin: Acesso total (leitura e escrita)
    CREATE POLICY "campaigns_coupons_super_admin_all"
    ON public.campaigns_coupons
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

    -- Franqueado: Visualiza e gerencia apenas cupons do seu tenant_id
    CREATE POLICY "campaigns_coupons_franqueado_scope"
    ON public.campaigns_coupons
    FOR ALL
    TO authenticated
    USING (
      public.is_franqueado() AND tenant_id = public.get_admin_tenant_id()
    )
    WITH CHECK (
      public.is_franqueado() AND tenant_id = public.get_admin_tenant_id()
    );

    -- Passageiros e Clientes (Autenticados ou Anônimos): Leitura de cupons ativos
    CREATE POLICY "campaigns_coupons_public_select"
    ON public.campaigns_coupons
    FOR SELECT
    TO anon, authenticated
    USING (
      is_active = true AND 
      (valid_until IS NULL OR valid_until >= clock_timestamp())
    );
  END IF;

  -- 2. Políticas RLS em white_label_tenant_configs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'white_label_tenant_configs') THEN
    ALTER TABLE public.white_label_tenant_configs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "white_label_tenant_configs_super_admin_all" ON public.white_label_tenant_configs;
    DROP POLICY IF EXISTS "white_label_tenant_configs_franqueado_scope" ON public.white_label_tenant_configs;
    DROP POLICY IF EXISTS "white_label_tenant_configs_public_read" ON public.white_label_tenant_configs;

    CREATE POLICY "white_label_tenant_configs_super_admin_all"
    ON public.white_label_tenant_configs
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "white_label_tenant_configs_franqueado_scope"
    ON public.white_label_tenant_configs
    FOR ALL
    TO authenticated
    USING (
      public.is_franqueado() AND tenant_id = public.get_admin_tenant_id()
    )
    WITH CHECK (
      public.is_franqueado() AND tenant_id = public.get_admin_tenant_id()
    );

    CREATE POLICY "white_label_tenant_configs_public_read"
    ON public.white_label_tenant_configs
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;
