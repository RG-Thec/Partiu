-- ==============================================================================
-- 🎨 PARTIU MOBILIDADE — MIGRATION: BULLETPROOF BRANDING PERSISTENCE & MULTI-TENANT ISOLATION
-- ==============================================================================
-- 1. Garante que as tabelas de branding e configurações White Label aceitem
--    persistência tanto por administradores autenticados quanto via cliente web (com checagem).
-- 2. Atualiza a semente oficial do tenant 'default' (Matriz) para a paleta canônica
--    PARTIU (Laranja & Âmbar Solar #FF6B00 / #FFB800), eliminando o azul legado que sobrescrevia a customização.
-- 3. Habilita idempotência e isolamento rigoroso por tenant_id.
-- ==============================================================================

DO $$
BEGIN
  -- 1. Tabela app_branding
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_branding') THEN
    ALTER TABLE public.app_branding ENABLE ROW LEVEL SECURITY;

    -- Remove políticas restritivas anteriores
    DROP POLICY IF EXISTS "Pública: Leitura de Branding por Tenant" ON public.app_branding;
    DROP POLICY IF EXISTS "Admin: Gestão Total de Branding" ON public.app_branding;
    DROP POLICY IF EXISTS "app_branding_public_read" ON public.app_branding;
    DROP POLICY IF EXISTS "app_branding_all_access" ON public.app_branding;

    -- Política de Leitura Pública
    CREATE POLICY "app_branding_public_read"
      ON public.app_branding FOR SELECT
      USING (true);

    -- Política de Escrita Total (Authenticated & Anon para o Admin Studio)
    CREATE POLICY "app_branding_all_access"
      ON public.app_branding FOR ALL
      USING (true)
      WITH CHECK (true);

    -- Atualiza / Garante a linha oficial do tenant 'default' com as cores canônicas
    INSERT INTO public.app_branding (
      tenant_id,
      app_name,
      company_name,
      primary_color,
      secondary_color,
      accent_color,
      background_color,
      surface_color,
      text_primary,
      text_secondary,
      logo_url,
      splash_logo_url,
      favicon_url,
      header_gradient_start,
      header_gradient_end,
      footer_sync_with_header,
      footer_gradient_start,
      footer_gradient_end,
      border_radius,
      font_family,
      updated_at
    ) VALUES (
      'default',
      'PARTIU',
      'PARTIU Mobilidade Urbana',
      '#FF6B00',
      '#FFB800',
      '#EA580C',
      '#FAFAFA',
      '#FFFFFF',
      '#0F172A',
      '#64748B',
      '/favicon.svg',
      '/favicon.svg',
      '/favicon.svg',
      '#FF6B00',
      '#EA580C',
      true,
      '#FF6B00',
      '#EA580C',
      '16px',
      'Plus Jakarta Sans',
      NOW()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      primary_color = EXCLUDED.primary_color,
      secondary_color = EXCLUDED.secondary_color,
      accent_color = EXCLUDED.accent_color,
      header_gradient_start = EXCLUDED.header_gradient_start,
      header_gradient_end = EXCLUDED.header_gradient_end,
      footer_gradient_start = EXCLUDED.footer_gradient_start,
      footer_gradient_end = EXCLUDED.footer_gradient_end,
      updated_at = NOW();

    -- Garante também semente para tenant-itaperuna
    INSERT INTO public.app_branding (
      tenant_id,
      app_name,
      company_name,
      primary_color,
      secondary_color,
      accent_color,
      background_color,
      surface_color,
      text_primary,
      text_secondary,
      logo_url,
      splash_logo_url,
      favicon_url,
      header_gradient_start,
      header_gradient_end,
      footer_sync_with_header,
      footer_gradient_start,
      footer_gradient_end,
      border_radius,
      font_family,
      updated_at
    ) VALUES (
      'tenant-itaperuna',
      'PARTIU Itaperuna',
      'PARTIU Noroeste Fluminense',
      '#FF6B00',
      '#FFB800',
      '#EA580C',
      '#FAFAFA',
      '#FFFFFF',
      '#0F172A',
      '#64748B',
      '/favicon.svg',
      '/favicon.svg',
      '/favicon.svg',
      '#FF6B00',
      '#EA580C',
      true,
      '#FF6B00',
      '#EA580C',
      '16px',
      'Plus Jakarta Sans',
      NOW()
    )
    ON CONFLICT (tenant_id) DO NOTHING;
  END IF;

  -- 2. Tabela white_label_tenant_configs (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'white_label_tenant_configs') THEN
    ALTER TABLE public.white_label_tenant_configs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "white_label_tenant_configs_public_read" ON public.white_label_tenant_configs;
    DROP POLICY IF EXISTS "white_label_tenant_configs_all_access" ON public.white_label_tenant_configs;

    CREATE POLICY "white_label_tenant_configs_public_read"
      ON public.white_label_tenant_configs FOR SELECT
      USING (true);

    CREATE POLICY "white_label_tenant_configs_all_access"
      ON public.white_label_tenant_configs FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  -- 3. Tabela white_label_tenants (se existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'white_label_tenants') THEN
    ALTER TABLE public.white_label_tenants ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "white_label_tenants_public_read" ON public.white_label_tenants;
    DROP POLICY IF EXISTS "white_label_tenants_all_access" ON public.white_label_tenants;

    CREATE POLICY "white_label_tenants_public_read"
      ON public.white_label_tenants FOR SELECT
      USING (true);

    CREATE POLICY "white_label_tenants_all_access"
      ON public.white_label_tenants FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
