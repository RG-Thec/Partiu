-- ==============================================================================
-- 🚀 PARTIU MOBILIDADE — MIGRATION: DURABLE DISPATCH & SECURITY HARDENING (P0/P1)
-- Data: 2026-09-15
-- ==============================================================================
-- 1. Tabela de Auditoria e Observabilidade de Despacho (dispatch_audit_logs)
-- 2. Procedure de Avanço de Onda Atômica Server-Side (dispatch_advance_wave)
-- 3. Procedure de Varredura Concorrente com SKIP LOCKED (dispatch_sweep_and_advance_expired_waves)
-- 4. Trigger de Proteção de Colunas Estruturais em public.rides (trg_protect_rides_system_columns)
-- 5. Blindagem RLS de UPDATE na tabela public.rides
-- 6. Revogação de privilégios PUBLIC e anon em todas as RPCs críticas
-- ==============================================================================

-- 1. TABELA DE AUDITORIA E OBSERVABILIDADE DE DESPACHO
CREATE TABLE IF NOT EXISTS public.dispatch_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id TEXT NOT NULL,
  current_wave INTEGER NOT NULL DEFAULT 1,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  dispatch_attempt INTEGER NOT NULL DEFAULT 1,
  candidate_id TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_audit_logs_ride_id ON public.dispatch_audit_logs(ride_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_audit_logs_created_at ON public.dispatch_audit_logs(created_at);

ALTER TABLE public.dispatch_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dispatch_audit_logs_admin_read" ON public.dispatch_audit_logs;
CREATE POLICY "dispatch_audit_logs_admin_read" ON public.dispatch_audit_logs
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%gestor%')
    )
  );


-- 2. PROCEDURE ATÔMICA SERVER-SIDE: dispatch_advance_wave
-- Avança a onda da corrida de forma idempotente, serializada e independente de cliente
CREATE OR REPLACE FUNCTION public.dispatch_advance_wave(
  p_ride_id TEXT,
  p_timeout_seconds INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ride public.rides%ROWTYPE;
  v_current_wave INTEGER;
  v_next_wave INTEGER;
  v_next_radius_meters DOUBLE PRECISION;
  v_candidate_id TEXT := NULL;
  v_candidate_name TEXT := NULL;
  v_candidate_phone TEXT := NULL;
  v_new_status TEXT;
  v_previous_status TEXT;
  v_attempt INTEGER;
BEGIN
  -- Permite que a execução interna por esta RPC ultrapasse a proteção do trigger de colunas
  PERFORM set_config('partiu.internal_system_call', 'true', true);

  -- 1. Lock serializado da linha da corrida
  SELECT * INTO v_ride
  FROM public.rides
  WHERE id = p_ride_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'codigo', 'RIDE_NOT_FOUND',
      'mensagem', 'Corrida não encontrada.'
    );
  END IF;

  v_previous_status := v_ride.status;

  -- 2. Idempotência e validação de estado ativo de despacho
  IF v_ride.status IN ('ACCEPTED', 'DRIVER_ASSIGNED', 'A_CAMINHO', 'EM_VIAGEM', 'COMPLETED', 'CANCELLED', 'TIMEOUT') THEN
    RETURN jsonb_build_object(
      'sucesso', true,
      'codigo', 'RIDE_ALREADY_RESOLVED',
      'status', v_ride.status,
      'current_wave', COALESCE(v_ride.dispatch_wave, v_ride.current_wave, 1),
      'mensagem', 'Corrida já atribuída ou encerrada. Nenhuma mutação efetuada.'
    );
  END IF;

  v_current_wave := COALESCE(v_ride.dispatch_wave, v_ride.current_wave, 1);
  v_attempt := COALESCE(v_ride.dispatch_attempt, 0) + 1;

  -- 3. Verifica se todas as 3 ondas expiraram -> Estado Terminal TIMEOUT
  IF v_current_wave >= 3 THEN
    v_new_status := 'TIMEOUT';

    UPDATE public.rides
    SET status = 'TIMEOUT',
        offered_driver_id = NULL,
        offer_expires_at = NULL,
        updated_at = NOW()
    WHERE id = p_ride_id;

    INSERT INTO public.dispatch_audit_logs (
      ride_id, current_wave, previous_status, new_status, dispatch_attempt, candidate_id, reason
    ) VALUES (
      p_ride_id, v_current_wave, v_previous_status, 'TIMEOUT', v_attempt, NULL, 'MAX_WAVES_EXCEEDED_TIMEOUT'
    );

    RETURN jsonb_build_object(
      'sucesso', true,
      'codigo', 'DISPATCH_TIMEOUT',
      'ride_id', p_ride_id,
      'status', 'TIMEOUT',
      'current_wave', v_current_wave
    );
  END IF;

  -- 4. Incremento para próxima onda
  v_next_wave := v_current_wave + 1;
  IF v_next_wave = 2 THEN
    v_next_radius_meters := 4500.0;
  ELSE
    v_next_radius_meters := 7500.0;
  END IF;

  -- 5. Busca do próximo condutor elegível disponível no raio expandido
  -- Exclui o motorista da onda anterior para evitar re-ofertar ao mesmo condutor imediatamente
  SELECT dl.driver_id INTO v_candidate_id
  FROM public.driver_locations dl
  WHERE dl.status = 'ONLINE'
    AND dl.driver_id IS DISTINCT FROM v_ride.offered_driver_id
    AND dl.driver_id IS DISTINCT FROM v_ride.driver_id
    AND (
      v_ride.pickup_latitude IS NULL OR
      (6371000 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(v_ride.pickup_latitude)) *
          cos(radians(dl.latitude)) *
          cos(radians(dl.longitude) - radians(v_ride.pickup_longitude)) +
          sin(radians(v_ride.pickup_latitude)) *
          sin(radians(dl.latitude))
        ))
      )) <= v_next_radius_meters
    )
  ORDER BY
    CASE WHEN dl.status = 'ONLINE' THEN 0 ELSE 1 END,
    dl.updated_at DESC
  LIMIT 1;

  -- 6. Se encontrou candidato para a nova onda, efetua oferta
  IF v_candidate_id IS NOT NULL THEN
    v_new_status := 'OFFERED';

    UPDATE public.rides
    SET status = 'OFFERED',
        offered_driver_id = v_candidate_id,
        offered_at = NOW(),
        offer_expires_at = NOW() + (p_timeout_seconds || ' seconds')::INTERVAL,
        dispatch_wave = v_next_wave,
        current_wave = v_next_wave,
        current_radius_meters = v_next_radius_meters,
        dispatch_attempt = v_attempt,
        wave_updated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_ride_id;

    INSERT INTO public.dispatch_audit_logs (
      ride_id, current_wave, previous_status, new_status, dispatch_attempt, candidate_id, reason
    ) VALUES (
      p_ride_id, v_next_wave, v_previous_status, 'OFFERED', v_attempt, v_candidate_id, 'ADVANCED_TO_NEXT_WAVE'
    );

    RETURN jsonb_build_object(
      'sucesso', true,
      'codigo', 'WAVE_ADVANCED',
      'ride_id', p_ride_id,
      'status', 'OFFERED',
      'current_wave', v_next_wave,
      'offered_driver_id', v_candidate_id,
      'offer_expires_at', (NOW() + (p_timeout_seconds || ' seconds')::INTERVAL)
    );
  ELSE
    -- Sem candidatos na onda atual -> encerra em TIMEOUT de busca
    v_new_status := 'TIMEOUT';

    UPDATE public.rides
    SET status = 'TIMEOUT',
        offered_driver_id = NULL,
        offer_expires_at = NULL,
        dispatch_wave = v_next_wave,
        current_wave = v_next_wave,
        updated_at = NOW()
    WHERE id = p_ride_id;

    INSERT INTO public.dispatch_audit_logs (
      ride_id, current_wave, previous_status, new_status, dispatch_attempt, candidate_id, reason
    ) VALUES (
      p_ride_id, v_next_wave, v_previous_status, 'TIMEOUT', v_attempt, NULL, 'NO_CANDIDATES_AVAILABLE_IN_WAVE'
    );

    RETURN jsonb_build_object(
      'sucesso', true,
      'codigo', 'NO_CANDIDATES_TIMEOUT',
      'ride_id', p_ride_id,
      'status', 'TIMEOUT',
      'current_wave', v_next_wave
    );
  END IF;
END;
$$;


-- 3. PROCEDURE DE VARREDURA CONCORRENTE: dispatch_sweep_and_advance_expired_waves
-- Executa varredura com SKIP LOCKED: suporta múltiplos workers simultâneos sem contenção ou avanço duplicado
CREATE OR REPLACE FUNCTION public.dispatch_sweep_and_advance_expired_waves(
  p_batch_size INTEGER DEFAULT 25,
  p_timeout_seconds INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ride_record RECORD;
  v_processed_count INTEGER := 0;
  v_advanced_rides JSONB := '[]'::JSONB;
  v_advance_result JSONB;
BEGIN
  -- Permite que operações internas desta transação contornem proteções do trigger
  PERFORM set_config('partiu.internal_system_call', 'true', true);

  -- Seleciona corridas expiradas utilizando SKIP LOCKED para serialização perfeita
  FOR v_ride_record IN
    SELECT id, status, offered_driver_id, dispatch_wave, offer_expires_at
    FROM public.rides
    WHERE status = 'OFFERED'
      AND offer_expires_at IS NOT NULL
      AND offer_expires_at <= NOW()
    ORDER BY offer_expires_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    v_advance_result := public.dispatch_advance_wave(v_ride_record.id, p_timeout_seconds);
    v_processed_count := v_processed_count + 1;
    v_advanced_rides := v_advanced_rides || jsonb_build_object(
      'ride_id', v_ride_record.id,
      'result', v_advance_result
    );
  END LOOP;

  RETURN jsonb_build_object(
    'sucesso', true,
    'processed_count', v_processed_count,
    'advanced_rides', v_advanced_rides,
    'swept_at', NOW()
  );
END;
$$;


-- 4. TRIGGER DE PROTEÇÃO DE COLUNAS ESTRUTURAIS EM public.rides
-- Impede que qualquer cliente altere fare_price, driver_id, status ou metadados de despacho via REST
CREATE OR REPLACE FUNCTION public.fn_protect_rides_system_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_jwt_role TEXT;
  v_is_internal TEXT;
  v_auth_uid TEXT;
BEGIN
  -- Identifica o papel do chamador no JWT
  v_jwt_role := COALESCE(auth.jwt() ->> 'role', '');
  v_auth_uid := COALESCE(auth.uid()::text, '');
  v_is_internal := current_setting('partiu.internal_system_call', true);

  -- Se for service_role ou chamada interna do sistema (RPC SECURITY DEFINER com flag ativa), permite
  IF v_jwt_role = 'service_role' OR v_is_internal = 'true' THEN
    RETURN NEW;
  END IF;

  -- 1. Colunas financeiras e de precificação estritamente imutáveis para clientes
  IF OLD.fare_price IS DISTINCT FROM NEW.fare_price THEN
    RAISE EXCEPTION 'COLUNA_IMUTAVEL: fare_price não pode ser alterado diretamente pelo cliente.';
  END IF;

  IF OLD.platform_fee IS DISTINCT FROM NEW.platform_fee THEN
    RAISE EXCEPTION 'COLUNA_IMUTAVEL: platform_fee não pode ser alterado diretamente pelo cliente.';
  END IF;

  IF OLD.driver_earnings IS DISTINCT FROM NEW.driver_earnings THEN
    RAISE EXCEPTION 'COLUNA_IMUTAVEL: driver_earnings não pode ser alterado diretamente pelo cliente.';
  END IF;

  -- 2. Colunas de despacho e ondas estritamente gerenciadas pelo servidor
  IF OLD.offered_driver_id IS DISTINCT FROM NEW.offered_driver_id THEN
    RAISE EXCEPTION 'COLUNA_IMUTAVEL: offered_driver_id é gerenciado exclusivamente pelo servidor.';
  END IF;

  IF OLD.offer_expires_at IS DISTINCT FROM NEW.offer_expires_at THEN
    RAISE EXCEPTION 'COLUNA_IMUTAVEL: offer_expires_at é gerenciado exclusivamente pelo servidor.';
  END IF;

  IF OLD.dispatch_wave IS DISTINCT FROM NEW.dispatch_wave OR OLD.current_wave IS DISTINCT FROM NEW.current_wave THEN
    RAISE EXCEPTION 'COLUNA_IMUTAVEL: o avanço de ondas de despacho é de autoridade exclusiva do servidor.';
  END IF;

  IF OLD.dispatch_attempt IS DISTINCT FROM NEW.dispatch_attempt THEN
    RAISE EXCEPTION 'COLUNA_IMUTAVEL: dispatch_attempt não pode ser modificado pelo cliente.';
  END IF;

  -- 3. Atribuição de motorista requer a procedure oficial atômica
  IF OLD.driver_id IS DISTINCT FROM NEW.driver_id THEN
    RAISE EXCEPTION 'ATRIBUICAO_INVALIDA: A atribuição de condutor deve ser realizada exclusivamente via RPC partiu_aceitar_corrida_atomica.';
  END IF;

  -- 4. Validação de transição de status iniciada por cliente
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Se o chamador for o passageiro
    IF v_auth_uid = OLD.passenger_id THEN
      -- Passageiro só pode CANCELAR uma corrida que ainda não foi concluída
      IF NEW.status = 'CANCELLED' THEN
        IF OLD.status IN ('REQUESTED', 'SEARCHING_R1', 'SEARCHING_R2', 'SEARCHING_R3', 'PROCURANDO', 'OFERTADA', 'OFFERED', 'ACCEPTED', 'DRIVER_ASSIGNED', 'A_CAMINHO') THEN
          RETURN NEW;
        ELSE
          RAISE EXCEPTION 'STATUS_INVALIDO: Não é possível cancelar uma corrida neste estágio.';
        END IF;
      ELSE
        RAISE EXCEPTION 'STATUS_NAO_AUTORIZADO: Passageiro não pode alterar o status da corrida para %', NEW.status;
      END IF;
    END IF;

    -- Se o chamador for o motorista atribuído
    IF v_auth_uid = OLD.driver_id THEN
      -- Motorista só pode transicionar entre estados válidos da viagem
      IF OLD.status IN ('ACCEPTED', 'DRIVER_ASSIGNED', 'A_CAMINHO') AND NEW.status IN ('CHEGOU', 'DRIVER_ARRIVED', 'EM_VIAGEM', 'IN_PROGRESS', 'CANCELLED') THEN
        RETURN NEW;
      ELSIF OLD.status IN ('CHEGOU', 'DRIVER_ARRIVED') AND NEW.status IN ('EM_VIAGEM', 'IN_PROGRESS', 'CANCELLED') THEN
        RETURN NEW;
      ELSIF OLD.status IN ('EM_VIAGEM', 'IN_PROGRESS') AND NEW.status IN ('CONCLUIDA', 'COMPLETED') THEN
        RETURN NEW;
      ELSE
        RAISE EXCEPTION 'TRANSICAO_INVALIDA_CONDUTOR: Transição de % para % não é permitida.', OLD.status, NEW.status;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_rides_system_columns ON public.rides;
CREATE TRIGGER trg_protect_rides_system_columns
  BEFORE UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_protect_rides_system_columns();


-- 5. BLINDAGEM RLS DE UPDATE NA TABELA public.rides
DROP POLICY IF EXISTS "Corridas: passageiro ou condutor atualiza corrida" ON public.rides;
DROP POLICY IF EXISTS "passengers_and_assigned_drivers_can_update_rides" ON public.rides;

CREATE POLICY "passengers_and_assigned_drivers_can_update_rides"
ON public.rides FOR UPDATE TO authenticated
USING (
  (auth.uid())::text = passenger_id OR
  (auth.uid())::text = driver_id
);


-- 6. HARDENING DE PERMISSÕES DE RPCS (REVOGAÇÃO DE PUBLIC E ANON)
-- Revoga todos os privilégios concedidos por padrão ao público e anônimos

-- 6.1. Aceite Atômico
DO $$ BEGIN
  REVOKE ALL ON FUNCTION public.partiu_aceitar_corrida_atomica(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.partiu_aceitar_corrida_atomica(TEXT, TEXT, TEXT, TEXT) FROM anon;
  GRANT EXECUTE ON FUNCTION public.partiu_aceitar_corrida_atomica(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  REVOKE ALL ON FUNCTION public.dispatch_claim_ride_atomic(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.dispatch_claim_ride_atomic(TEXT, TEXT, TEXT, TEXT) FROM anon;
  GRANT EXECUTE ON FUNCTION public.dispatch_claim_ride_atomic(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- 6.2. Avanço de Onda
DO $$ BEGIN
  REVOKE ALL ON FUNCTION public.dispatch_advance_wave(TEXT, INTEGER) FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.dispatch_advance_wave(TEXT, INTEGER) FROM anon;
  GRANT EXECUTE ON FUNCTION public.dispatch_advance_wave(TEXT, INTEGER) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- 6.3. Varredura Concorrente (Exclusiva de service_role e scheduler)
DO $$ BEGIN
  REVOKE ALL ON FUNCTION public.dispatch_sweep_and_advance_expired_waves(INTEGER, INTEGER) FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.dispatch_sweep_and_advance_expired_waves(INTEGER, INTEGER) FROM anon;
  REVOKE ALL ON FUNCTION public.dispatch_sweep_and_advance_expired_waves(INTEGER, INTEGER) FROM authenticated;
  GRANT EXECUTE ON FUNCTION public.dispatch_sweep_and_advance_expired_waves(INTEGER, INTEGER) TO service_role;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- 6.4. Rate Limiting
DO $$ BEGIN
  REVOKE ALL ON FUNCTION public.partiu_check_rate_limit(TEXT, TEXT, INTEGER) FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.partiu_check_rate_limit(TEXT, TEXT, INTEGER) FROM anon;
  GRANT EXECUTE ON FUNCTION public.partiu_check_rate_limit(TEXT, TEXT, INTEGER) TO authenticated, service_role;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;


-- 7. GARANTIA DE PUBLICAÇÃO REALTIME COM ISOLAMENTO
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

DROP POLICY IF EXISTS "drivers_can_read_assigned_offers" ON public.rides;
CREATE POLICY "drivers_can_read_assigned_offers" ON public.rides
FOR SELECT TO authenticated
USING (
  offered_driver_id = auth.uid()::text 
  OR driver_id = auth.uid()::text
  OR passenger_id = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND (p.role ILIKE '%admin%' OR p.role ILIKE '%gestor%')
  )
);
