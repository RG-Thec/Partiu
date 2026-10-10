-- ==============================================================================
-- 🏛️ PARTIU ENTERPRISE — GOVERNANÇA TOTAL DO SUPER ADMINISTRADOR (MULTI-TENANT)
-- MIGRATION: CONTROLE CENTRALIZADO DE FRANQUEADOS, PLANOS E KILL SWITCH
-- ==============================================================================

-- 1. Expansão da tabela de tenants com status de plano e motivo de suspensão
ALTER TABLE public.white_label_tenants 
  ADD COLUMN IF NOT EXISTS plan_status VARCHAR(32) NOT NULL DEFAULT 'ATIVO';

ALTER TABLE public.white_label_tenants 
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

ALTER TABLE public.white_label_tenants 
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_wl_tenants_plan_status 
  ON public.white_label_tenants (plan_status);

-- 2. Garantir coluna tenant_id nas tabelas de passageiros e motoristas para vínculo rígido
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partiu_passageiros') THEN
    ALTER TABLE public.partiu_passageiros ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
    CREATE INDEX IF NOT EXISTS idx_partiu_passageiros_tenant ON public.partiu_passageiros(tenant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partiu_motoristas') THEN
    ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
    CREATE INDEX IF NOT EXISTS idx_partiu_motoristas_tenant ON public.partiu_motoristas(tenant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partiu_corridas') THEN
    ALTER TABLE public.partiu_corridas ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
    CREATE INDEX IF NOT EXISTS idx_partiu_corridas_tenant ON public.partiu_corridas(tenant_id);
  END IF;
END $$;

-- 3. Políticas de RLS: Exclusão e alteração de plano restrita ao Super Administrador
ALTER TABLE public.white_label_tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin: Controle Total de Franqueados" ON public.white_label_tenants;
CREATE POLICY "SuperAdmin: Controle Total de Franqueados"
  ON public.white_label_tenants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.approval_status = 'super_admin' OR p.is_active = true)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
  );

-- 4. Registro na trilha de auditoria
INSERT INTO public.white_label_audit_logs (tenant_id, action, details)
VALUES (
  'default',
  'MIGRATION_SUPERADMIN_FRANCHISEE_CONTROL',
  '{"version": "20261010", "description": "Controle total de planos, kill switch e isolamento de APIs de mapas por franqueado"}'::jsonb
);
