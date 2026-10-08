-- ==============================================================================
-- 🌐 MIGRATION: GESTÃO DE DOMÍNIOS CUSTOMIZADOS WHITE-LABEL & PWA (TWA / APK)
-- ==============================================================================
-- Tabela oficial para isolamento de domínios por franquia (Multi-Tenant Edge),
-- rastreamento de apontamentos DNS (CNAME/A) e governança RBAC restrita:
-- - SUPER ADMIN: Auditoria e aprovação global de todos os domínios e DNS.
-- - FRANQUEADO: Acesso restrito ao domínio da sua própria praça (tenant_id).
-- - ANON: Leitura pública restrita a domínios com status 'ATIVO' para roteamento Edge.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL,
  tenant_nome VARCHAR,
  domain VARCHAR NOT NULL UNIQUE,
  cname_target VARCHAR NOT NULL DEFAULT 'cname.partiumobe.com.br',
  status VARCHAR NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'ATIVO', 'DNS_FALHOU', 'REVOGADO')),
  ssl_status VARCHAR NOT NULL DEFAULT 'PENDENTE' CHECK (ssl_status IN ('PENDENTE', 'ATIVO', 'ERRO')),
  verified_at TIMESTAMPTZ,
  dns_records JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Índices de alta performance para resolução rápida no Edge / SSR
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON public.tenant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant_id ON public.tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_status ON public.tenant_domains(status);

-- Gatilho para atualização automática de updated_at
CREATE OR REPLACE FUNCTION public.handle_tenant_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenant_domains_updated_at ON public.tenant_domains;
CREATE TRIGGER trg_tenant_domains_updated_at
BEFORE UPDATE ON public.tenant_domains
FOR EACH ROW
EXECUTE FUNCTION public.handle_tenant_domains_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

-- 1. Leitura Pública para Edge / SSR (Apenas domínios ativos e aprovados)
DROP POLICY IF EXISTS "tenant_domains_public_active_read" ON public.tenant_domains;
CREATE POLICY "tenant_domains_public_active_read"
  ON public.tenant_domains
  FOR SELECT
  TO anon, authenticated
  USING (status = 'ATIVO');

-- 2. Super Admin: Acesso Irrestrito Total (Leitura, Inserção, Atualização, Exclusão)
DROP POLICY IF EXISTS "tenant_domains_super_admin_all" ON public.tenant_domains;
CREATE POLICY "tenant_domains_super_admin_all"
  ON public.tenant_domains
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 3. Franqueado: Gestão isolada do domínio da sua própria praça
DROP POLICY IF EXISTS "tenant_domains_franqueado_scope" ON public.tenant_domains;
CREATE POLICY "tenant_domains_franqueado_scope"
  ON public.tenant_domains
  FOR ALL
  TO authenticated
  USING (
    public.is_franqueado() AND tenant_id = public.get_admin_tenant_id()
  )
  WITH CHECK (
    public.is_franqueado() AND tenant_id = public.get_admin_tenant_id()
  );

-- Inserção de Seeds Iniciais (Itaperuna Sede e Campos dos Goytacazes)
INSERT INTO public.tenant_domains (tenant_id, tenant_nome, domain, cname_target, status, ssl_status, verified_at)
VALUES
  ('tenant-itaperuna', 'PARTIU Itaperuna (Sede)', 'app.partiumobe.com.br', 'cname.partiumobe.com.br', 'ATIVO', 'ATIVO', clock_timestamp()),
  ('tenant-campos', 'GO Mobilidade Campos', 'app.mobe-saopaulo.com.br', 'cname.partiumobe.com.br', 'ATIVO', 'ATIVO', clock_timestamp())
ON CONFLICT (domain) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  tenant_nome = EXCLUDED.tenant_nome,
  status = EXCLUDED.status,
  ssl_status = EXCLUDED.ssl_status,
  updated_at = clock_timestamp();
