-- ==============================================================================
-- 🛡️ PARTIU MOBILIDADE — MIGRATION: RBAC PURIFICATION (SUPER ADMIN & FRANQUEADO)
-- ==============================================================================
-- DIRETRIZ ESTRATÉGICA FUNDAMENTAL (NORTH STAR):
-- 1. ESTRITAMENTE DUAS MODALIDADES DE ACESSO ADMINISTRATIVO:
--    a) SUPER ADMIN (Matriz / Holding): Acesso total, irrestrito e global a todos os tenants.
--    b) FRANQUEADO (Operador Regional): Acesso local e restrito estritamente ao seu tenant_id.
-- 2. EXPURGO TOTAL DE PAPÉIS INTERMEDIÁRIOS:
--    Eliminação de 'operador', 'suporte', 'gerente_frota', 'auditor', etc.
-- 3. ISOLAMENTO MULTI-TENANT POR RLS (Row Level Security):
--    Franqueados têm zero visibilidade ou autonomia fora da sua praça designada.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CRIAÇÃO OU ATUALIZAÇÃO DA TABELA CANÔNICA DE USUÁRIOS ADMINISTRATIVOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  nome VARCHAR(255),
  role VARCHAR(32) NOT NULL DEFAULT 'franqueado',
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  tenant_id VARCHAR(64),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Habilitar RLS imediatamente
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. MIGRAÇÃO DE DADOS EXISTENTES & NORMALIZAÇÃO PARA OS 2 NOVOS PAPÉIS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- Migrar da tabela user_roles legado caso exista e admin_users esteja vazia ou incompleta
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    INSERT INTO public.admin_users (user_id, email, role, is_super_admin, tenant_id, ativo)
    SELECT 
      ur.user_id,
      COALESCE(u.email, 'admin_' || ur.user_id || '@partiu.app') AS email,
      CASE 
        WHEN LOWER(ur.role) IN ('super_admin', 'superadmin', 'owner', 'admin', 'matriz') THEN 'super_admin'
        ELSE 'franqueado'
      END AS role,
      CASE 
        WHEN LOWER(ur.role) IN ('super_admin', 'superadmin', 'owner', 'admin', 'matriz') THEN true
        ELSE false
      END AS is_super_admin,
      CASE 
        WHEN LOWER(ur.role) IN ('super_admin', 'superadmin', 'owner', 'admin', 'matriz') THEN NULL
        ELSE COALESCE(ur.tenant_id, 'ten_matriz')
      END AS tenant_id,
      true AS ativo
    FROM public.user_roles ur
    LEFT JOIN auth.users u ON u.id = ur.user_id
    ON CONFLICT (email) DO UPDATE 
    SET 
      role = EXCLUDED.role,
      is_super_admin = EXCLUDED.is_super_admin,
      tenant_id = EXCLUDED.tenant_id,
      updated_at = clock_timestamp();
  END IF;

  -- Normalizar quaisquer registros em admin_users para apenas 'super_admin' ou 'franqueado'
  UPDATE public.admin_users
  SET 
    role = 'super_admin',
    is_super_admin = true,
    tenant_id = NULL,
    updated_at = clock_timestamp()
  WHERE LOWER(role) IN ('super_admin', 'superadmin', 'owner', 'admin', 'matriz');

  UPDATE public.admin_users
  SET 
    role = 'franqueado',
    is_super_admin = false,
    tenant_id = COALESCE(tenant_id, 'ten_matriz'),
    updated_at = clock_timestamp()
  WHERE LOWER(role) NOT IN ('super_admin');

END $$;

-- ------------------------------------------------------------------------------
-- 3. APLICAÇÃO DE RESTRIÇÕES E CONSTRAINTS DE INTEGRIDADE ESTREITAS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- 3.1. Restrição de Papéis Permitidos (Estritamente 2 opções)
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_admin_users_purified_roles') THEN
    ALTER TABLE public.admin_users DROP CONSTRAINT ck_admin_users_purified_roles;
  END IF;
  ALTER TABLE public.admin_users
  ADD CONSTRAINT ck_admin_users_purified_roles
  CHECK (role IN ('super_admin', 'franqueado'));

  -- 3.2. Consistência entre a coluna role e a flag booleana is_super_admin
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_admin_users_role_consistency') THEN
    ALTER TABLE public.admin_users DROP CONSTRAINT ck_admin_users_role_consistency;
  END IF;
  ALTER TABLE public.admin_users
  ADD CONSTRAINT ck_admin_users_role_consistency
  CHECK (
    (role = 'super_admin' AND is_super_admin = true) OR
    (role = 'franqueado' AND is_super_admin = false)
  );

  -- 3.3. Fronteira de Tenant: Super Admin pode ter tenant nulo; Franqueado EXIGE tenant_id válido
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_admin_users_tenant_boundary') THEN
    ALTER TABLE public.admin_users DROP CONSTRAINT ck_admin_users_tenant_boundary;
  END IF;
  ALTER TABLE public.admin_users
  ADD CONSTRAINT ck_admin_users_tenant_boundary
  CHECK (
    (is_super_admin = true) OR
    (is_super_admin = false AND tenant_id IS NOT NULL AND length(trim(tenant_id)) > 0)
  );
END $$;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role, is_super_admin);
CREATE INDEX IF NOT EXISTS idx_admin_users_tenant ON public.admin_users(tenant_id);

-- ------------------------------------------------------------------------------
-- 4. FUNÇÕES SQL DE AUTENTICAÇÃO E AUTORIZAÇÃO (SECURITY DEFINER)
-- ------------------------------------------------------------------------------

-- 4.1. Verifica se o usuário atual é SUPER ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_is_super BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Checagem direta na tabela canônica admin_users
  SELECT is_super_admin INTO v_is_super
  FROM public.admin_users
  WHERE (user_id = p_user_id OR id = p_user_id) AND ativo = true
  LIMIT 1;

  IF v_is_super IS TRUE THEN
    RETURN true;
  END IF;

  -- 2. Fallback de verificação por claim JWT
  IF (auth.jwt() ->> 'role') = 'super_admin' OR (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 4.2. Verifica se o usuário atual é FRANQUEADO
CREATE OR REPLACE FUNCTION public.is_franqueado(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Se for super admin, não é estritamente franqueado
  IF public.is_super_admin(p_user_id) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE (user_id = p_user_id OR id = p_user_id)
      AND role = 'franqueado'
      AND ativo = true
  );
END;
$$;

-- 4.3. Recupera o tenant_id do usuário administrativo autenticado
CREATE OR REPLACE FUNCTION public.get_admin_tenant_id(p_user_id UUID DEFAULT auth.uid())
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_tenant_id VARCHAR;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Super admin não é limitado por tenant
  IF public.is_super_admin(p_user_id) THEN
    RETURN NULL;
  END IF;

  SELECT tenant_id INTO v_tenant_id
  FROM public.admin_users
  WHERE (user_id = p_user_id OR id = p_user_id) AND ativo = true
  LIMIT 1;

  IF v_tenant_id IS NOT NULL THEN
    RETURN v_tenant_id;
  END IF;

  -- Fallback para JWT claims
  RETURN auth.jwt() ->> 'tenant_id';
END;
$$;

-- Conceder execução pública às funções auxiliares
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_franqueado(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_tenant_id(UUID) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS RLS PURIFICADAS (SUPER ADMIN = GLOBAL, FRANQUEADO = POR TENANT)
-- ------------------------------------------------------------------------------

-- 5.1. Tabela: admin_users
DROP POLICY IF EXISTS "admin_users_super_admin_all" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_franqueado_select_own" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_read_all" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_write_all" ON public.admin_users;

-- Super Admin: Acesso total de leitura e escrita
CREATE POLICY "admin_users_super_admin_all"
ON public.admin_users
FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Franqueado: Visualiza apenas o seu próprio registro administrativo
CREATE POLICY "admin_users_franqueado_select_own"
ON public.admin_users
FOR SELECT
TO authenticated
USING (
  public.is_franqueado() AND 
  (user_id = auth.uid() OR id = auth.uid() OR tenant_id = public.get_admin_tenant_id())
);

-- 5.2. Tabela: rides / partiu_corridas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partiu_corridas') THEN
    ALTER TABLE public.partiu_corridas ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "partiu_corridas_super_admin_all" ON public.partiu_corridas;
    DROP POLICY IF EXISTS "partiu_corridas_franqueado_scope" ON public.partiu_corridas;

    CREATE POLICY "partiu_corridas_super_admin_all"
    ON public.partiu_corridas
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "partiu_corridas_franqueado_scope"
    ON public.partiu_corridas
    FOR ALL
    TO authenticated
    USING (
      public.is_franqueado() AND (
        praca_id = public.get_admin_tenant_id() OR
        tenant_id = public.get_admin_tenant_id()
      )
    )
    WITH CHECK (
      public.is_franqueado() AND (
        praca_id = public.get_admin_tenant_id() OR
        tenant_id = public.get_admin_tenant_id()
      )
    );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rides') THEN
    ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "rides_super_admin_all" ON public.rides;
    DROP POLICY IF EXISTS "rides_franqueado_scope" ON public.rides;

    CREATE POLICY "rides_super_admin_all"
    ON public.rides
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "rides_franqueado_scope"
    ON public.rides
    FOR ALL
    TO authenticated
    USING (
      public.is_franqueado() AND (
        tenant_id = public.get_admin_tenant_id()
      )
    )
    WITH CHECK (
      public.is_franqueado() AND (
        tenant_id = public.get_admin_tenant_id()
      )
    );
  END IF;
END $$;

-- 5.3. Tabela: drivers / driver_profiles / partiu_motoristas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_profiles') THEN
    ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "driver_profiles_super_admin_all" ON public.driver_profiles;
    DROP POLICY IF EXISTS "driver_profiles_franqueado_scope" ON public.driver_profiles;

    CREATE POLICY "driver_profiles_super_admin_all"
    ON public.driver_profiles
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "driver_profiles_franqueado_scope"
    ON public.driver_profiles
    FOR ALL
    TO authenticated
    USING (
      public.is_franqueado() AND (
        tenant_id = public.get_admin_tenant_id() OR
        praca_id = public.get_admin_tenant_id()
      )
    )
    WITH CHECK (
      public.is_franqueado() AND (
        tenant_id = public.get_admin_tenant_id() OR
        praca_id = public.get_admin_tenant_id()
      )
    );
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partiu_motoristas') THEN
    ALTER TABLE public.partiu_motoristas ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "partiu_motoristas_super_admin_all" ON public.partiu_motoristas;
    DROP POLICY IF EXISTS "partiu_motoristas_franqueado_scope" ON public.partiu_motoristas;

    CREATE POLICY "partiu_motoristas_super_admin_all"
    ON public.partiu_motoristas
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "partiu_motoristas_franqueado_scope"
    ON public.partiu_motoristas
    FOR ALL
    TO authenticated
    USING (
      public.is_franqueado() AND (
        praca_id = public.get_admin_tenant_id() OR
        tenant_id = public.get_admin_tenant_id()
      )
    )
    WITH CHECK (
      public.is_franqueado() AND (
        praca_id = public.get_admin_tenant_id() OR
        tenant_id = public.get_admin_tenant_id()
      )
    );
  END IF;
END $$;

-- 5.4. Tabela: driver_subscriptions / assinaturas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_subscriptions') THEN
    ALTER TABLE public.driver_subscriptions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "driver_subscriptions_super_admin_all" ON public.driver_subscriptions;
    DROP POLICY IF EXISTS "driver_subscriptions_franqueado_scope" ON public.driver_subscriptions;

    CREATE POLICY "driver_subscriptions_super_admin_all"
    ON public.driver_subscriptions
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "driver_subscriptions_franqueado_scope"
    ON public.driver_subscriptions
    FOR ALL
    TO authenticated
    USING (
      public.is_franqueado() AND (
        tenant_id = public.get_admin_tenant_id()
      )
    )
    WITH CHECK (
      public.is_franqueado() AND (
        tenant_id = public.get_admin_tenant_id()
      )
    );
  END IF;
END $$;

-- 5.5. Tabela: monetization_plans / pricing_rules (Super Admin escreve, Franqueado consulta)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monetization_plans') THEN
    ALTER TABLE public.monetization_plans ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "monetization_plans_super_admin_all" ON public.monetization_plans;
    DROP POLICY IF EXISTS "monetization_plans_franqueado_select" ON public.monetization_plans;

    CREATE POLICY "monetization_plans_super_admin_all"
    ON public.monetization_plans
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

    CREATE POLICY "monetization_plans_franqueado_select"
    ON public.monetization_plans
    FOR SELECT
    TO authenticated
    USING (public.is_franqueado());
  END IF;
END $$;

-- ==============================================================================
-- 🚀 FIM DA MIGRATION: SISTEMA RBAC PURIFICADO EM DUAS MODALIDADES ESTRITAS
-- ==============================================================================
