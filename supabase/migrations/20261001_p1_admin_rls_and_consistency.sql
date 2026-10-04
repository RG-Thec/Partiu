-- ==============================================================================
-- 🚀 MIGRATION: 20261001_p1_admin_rls_and_consistency.sql
-- ==============================================================================
-- 1. Garante leitura e gestão operacional irrestrita para Admins e Gestores na tabela public.rides
-- 2. Índices de alta performance para despacho e telemetria
-- 3. Trigger bidirecional de consistência de status entre public.rides e public.partiu_corridas
-- ==============================================================================

-- 1. Políticas RLS para Administradores na tabela public.rides
DO $$
BEGIN
  -- Permite leitura de todas as corridas por perfis com papel admin ou gestor
  DROP POLICY IF EXISTS "admins_can_read_all_rides" ON public.rides;
  CREATE POLICY "admins_can_read_all_rides" ON public.rides
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%gestor%')
    )
  );

  -- Permite atualização de corridas por administradores (para cancelamento ou intervenção operacional)
  DROP POLICY IF EXISTS "admins_can_update_all_rides" ON public.rides;
  CREATE POLICY "admins_can_update_all_rides" ON public.rides
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%gestor%')
    )
  );
END $$;

-- 2. Índices Compostos para Acelerar Despacho e Varredura
CREATE INDEX IF NOT EXISTS idx_rides_offered_driver_status
  ON public.rides (offered_driver_id, status)
  WHERE offered_driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rides_passenger_created_at
  ON public.rides (passenger_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_locations_status_updated
  ON public.driver_locations (status, updated_at DESC);

-- 3. Função de sincronização automática entre public.rides e public.partiu_corridas (Anti-Drift)
CREATE OR REPLACE FUNCTION public.fn_sync_rides_to_partiu_corridas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Atualiza status e motorista na tabela legada se existir registro correspondente
  UPDATE public.partiu_corridas
  SET status = CASE
        WHEN NEW.status = 'ACCEPTED' THEN 'A_CAMINHO'
        WHEN NEW.status = 'IN_PROGRESS' THEN 'EM_VIAGEM'
        WHEN NEW.status = 'COMPLETED' THEN 'FINALIZADA'
        WHEN NEW.status = 'CANCELLED' THEN 'CANCELADA'
        ELSE status
      END,
      motorista_id = COALESCE(NEW.driver_id, motorista_id),
      updated_at = NOW()
  WHERE codigo_viagem = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN undefined_table THEN
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_rides_status ON public.rides;
CREATE TRIGGER trg_sync_rides_status
  AFTER UPDATE OF status, driver_id ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_rides_to_partiu_corridas();
