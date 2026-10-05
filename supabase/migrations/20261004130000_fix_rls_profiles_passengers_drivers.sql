-- ==============================================================================
-- 20261004130000_fix_rls_profiles_passengers_drivers.sql
-- Correção crítica de RLS e Ativação Instantânea de Contas:
-- 1. Elimina recursão infinita (code 42P17) na tabela profiles.
-- 2. Habilita políticas de leitura, inserção e atualização nas tabelas
--    partiu_passageiros e partiu_motoristas para cadastro em produção.
-- 3. Configura gatilho de auto-confirmação instantânea de e-mail no GoTrue
--    (auth.users) para permitir login imediato pós-cadastro sem bloqueio de SMTP.
-- ==============================================================================

-- 1. AUTO-CONFIRMAÇÃO INSTANTÂNEA EM AUTH.USERS
CREATE OR REPLACE FUNCTION public.fn_auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_user ON auth.users;
CREATE OR REPLACE TRIGGER trg_auto_confirm_user
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_confirm_user();

-- 2. PROFILES: Limpar políticas recursivas e duplicadas
DROP POLICY IF EXISTS "Perfis: administradores têm controle total" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Perfis: leitura pública de perfis ativos" ON public.profiles;
DROP POLICY IF EXISTS "Perfis: usuário edita o próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuario atualiza seu perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuario insere seu perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuario ve seu perfil" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() IS NULL OR auth.uid() = id);

CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR is_admin(auth.uid()));

CREATE POLICY "profiles_delete_policy"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id OR is_admin(auth.uid()));

-- 3. PARTIU_PASSAGEIROS: Permitir cadastro, consulta e atualização
ALTER TABLE public.partiu_passageiros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "passageiros_select_policy" ON public.partiu_passageiros;
DROP POLICY IF EXISTS "passageiros_insert_policy" ON public.partiu_passageiros;
DROP POLICY IF EXISTS "passageiros_update_policy" ON public.partiu_passageiros;
DROP POLICY IF EXISTS "passageiros_delete_policy" ON public.partiu_passageiros;

CREATE POLICY "passageiros_select_policy"
  ON public.partiu_passageiros FOR SELECT
  USING (true);

CREATE POLICY "passageiros_insert_policy"
  ON public.partiu_passageiros FOR INSERT
  WITH CHECK (true);

CREATE POLICY "passageiros_update_policy"
  ON public.partiu_passageiros FOR UPDATE
  USING (auth.uid() = user_id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "passageiros_delete_policy"
  ON public.partiu_passageiros FOR DELETE
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- 4. PARTIU_MOTORISTAS: Permitir cadastro, consulta e atualização
ALTER TABLE public.partiu_motoristas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "motoristas_select_policy" ON public.partiu_motoristas;
DROP POLICY IF EXISTS "motoristas_insert_policy" ON public.partiu_motoristas;
DROP POLICY IF EXISTS "motoristas_update_policy" ON public.partiu_motoristas;
DROP POLICY IF EXISTS "motoristas_delete_policy" ON public.partiu_motoristas;

CREATE POLICY "motoristas_select_policy"
  ON public.partiu_motoristas FOR SELECT
  USING (true);

CREATE POLICY "motoristas_insert_policy"
  ON public.partiu_motoristas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "motoristas_update_policy"
  ON public.partiu_motoristas FOR UPDATE
  USING (auth.uid() = user_id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "motoristas_delete_policy"
  ON public.partiu_motoristas FOR DELETE
  USING (auth.uid() = user_id OR is_admin(auth.uid()));
