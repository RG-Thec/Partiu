-- Migration: 20260915_p0_rpc_auth_hardening.sql
-- Description:
-- 1. Replace partiu_aceitar_corrida_atomica with auth.uid() validation
-- 2. Update dispatch_claim_ride_atomic alias function
-- 3. Fix permissions for RPCs (revoke anon, grant authenticated)
-- 4. Add dispatch state columns to rides
-- 5. Add server-side rate limiting function
-- 6. Fix RLS policy on rides for drivers

-- 1. Replace partiu_aceitar_corrida_atomica with auth.uid() validation
CREATE OR REPLACE FUNCTION public.partiu_aceitar_corrida_atomica(
  p_corrida_id TEXT,
  p_motorista_id TEXT DEFAULT NULL,
  p_motorista_nome TEXT DEFAULT 'Motorista Parceiro',
  p_motorista_telefone TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ride public.rides%ROWTYPE;
  v_is_uuid BOOLEAN;
  v_driver_id TEXT;
BEGIN
  -- SECURITY: Use auth.uid() as primary driver identity. Never trust client input if authenticated
  v_driver_id := auth.uid()::text;
  IF v_driver_id IS NULL THEN
    v_driver_id := NULLIF(p_motorista_id, '');
  END IF;

  IF v_driver_id IS NULL THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'codigo', 'AUTH_REQUIRED',
      'mensagem', 'Autenticação obrigatória para aceitar corrida.'
    );
  END IF;

  v_is_uuid := p_corrida_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  BEGIN
    SELECT * INTO STRICT v_ride
    FROM public.rides
    WHERE id = p_corrida_id
    FOR UPDATE NOWAIT;

    -- Validate status
    IF v_ride.status NOT IN ('REQUESTED', 'SEARCHING_R1', 'SEARCHING_R2', 'SEARCHING_R3', 'PROCURANDO', 'OFERTADA', 'OFFERED') THEN
      RETURN jsonb_build_object(
        'sucesso', false,
        'codigo', 'STATUS_INVALIDO',
        'mensagem', 'Esta corrida já foi atribuída a outro condutor ou cancelada.'
      );
    END IF;

    -- SECURITY: Validate offer ownership — driver can only accept rides offered to them
    IF v_ride.offered_driver_id IS NOT NULL AND v_ride.offered_driver_id <> v_driver_id THEN
      RETURN jsonb_build_object(
        'sucesso', false,
        'codigo', 'OFFER_NOT_YOURS',
        'mensagem', 'Esta oferta foi direcionada a outro condutor.'
      );
    END IF;

    -- Update rides atomically using auth.uid()
    UPDATE public.rides
    SET driver_id = v_driver_id,
        driver_name = COALESCE(NULLIF(p_motorista_nome, ''), v_ride.driver_name, 'Motorista Parceiro'),
        driver_phone = COALESCE(NULLIF(p_motorista_telefone, ''), v_ride.driver_phone),
        status = 'ACCEPTED',
        offered_driver_id = NULL,
        offer_expires_at = NULL,
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_corrida_id
    RETURNING * INTO v_ride;

    -- Mirror to partiu_corridas
    BEGIN
      UPDATE public.partiu_corridas
      SET status = 'A_CAMINHO',
          motorista_id = v_driver_id,
          updated_at = NOW()
      WHERE codigo_viagem = p_corrida_id
         OR (v_is_uuid AND id = p_corrida_id::uuid);
    EXCEPTION
      WHEN undefined_table THEN NULL;
    END;

    -- Update driver telemetry
    UPDATE public.driver_locations
    SET status = 'ON_TRIP',
        current_ride_id = p_corrida_id,
        updated_at = NOW()
    WHERE driver_id = v_driver_id;

    RETURN jsonb_build_object(
      'sucesso', true,
      'codigo', 'ACEITO_COM_SUCESSO',
      'corrida_id', v_ride.id,
      'status', v_ride.status,
      'driver_id', v_ride.driver_id,
      'driver_name', v_ride.driver_name
    );

  EXCEPTION
    WHEN lock_not_available THEN
      RETURN jsonb_build_object(
        'sucesso', false,
        'codigo', 'LOCK_CONCORRENTE',
        'mensagem', 'Outro motorista parceiro acabou de aceitar esta corrida no mesmo instante!'
      );
    WHEN no_data_found THEN
      BEGIN
        IF v_is_uuid THEN
          UPDATE public.partiu_corridas
          SET status = 'A_CAMINHO',
              motorista_id = v_driver_id,
              updated_at = NOW()
          WHERE id = p_corrida_id::uuid AND status IN ('SOLICITADA', 'PROCURANDO')
          RETURNING id INTO v_is_uuid;
        ELSE
          UPDATE public.partiu_corridas
          SET status = 'A_CAMINHO',
              motorista_id = v_driver_id,
              updated_at = NOW()
          WHERE codigo_viagem = p_corrida_id AND status IN ('SOLICITADA', 'PROCURANDO')
          RETURNING true INTO v_is_uuid;
        END IF;

        IF FOUND THEN
          RETURN jsonb_build_object(
            'sucesso', true,
            'codigo', 'ACEITO_LEGADO',
            'corrida_id', p_corrida_id,
            'driver_id', v_driver_id
          );
        END IF;
      EXCEPTION
        WHEN undefined_table THEN NULL;
      END;

      RETURN jsonb_build_object(
        'sucesso', false,
        'codigo', 'NAO_ENCONTRADA',
        'mensagem', 'Corrida não encontrada ou já expirada.'
      );
  END;
END;
$$;

-- 2. Update the alias function too
CREATE OR REPLACE FUNCTION public.dispatch_claim_ride_atomic(
  p_ride_id TEXT,
  p_driver_id TEXT DEFAULT NULL,
  p_driver_name TEXT DEFAULT 'Motorista Parceiro',
  p_driver_phone TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.partiu_aceitar_corrida_atomica(
    p_ride_id,
    p_driver_id,
    p_driver_name,
    p_driver_phone
  );
END;
$$;

-- 3. Fix permissions — REVOKE anon, GRANT only authenticated + service_role
DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.partiu_aceitar_corrida_atomica(TEXT, TEXT, TEXT, TEXT) FROM anon;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.dispatch_claim_ride_atomic(TEXT, TEXT, TEXT, TEXT) FROM anon;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

GRANT EXECUTE ON FUNCTION public.partiu_aceitar_corrida_atomica(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_claim_ride_atomic(TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 4. Add dispatch state columns to rides (IF NOT EXISTS)
DO $$ BEGIN
  ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dispatch_wave INTEGER DEFAULT 0;
  ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dispatch_started_at TIMESTAMPTZ;
  ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dispatch_attempt INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 5. Add server-side rate limiting function for ride requests
CREATE OR REPLACE FUNCTION public.partiu_check_rate_limit(
  p_user_id TEXT,
  p_action TEXT DEFAULT 'ride_request',
  p_max_per_minute INTEGER DEFAULT 3
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_action = 'ride_request' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.rides
    WHERE passenger_id = p_user_id
      AND created_at >= NOW() - INTERVAL '1 minute';
  ELSIF p_action = 'dispatch' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.rides
    WHERE passenger_id = p_user_id
      AND dispatch_started_at >= NOW() - INTERVAL '1 minute';
  ELSE
    v_count := 0;
  END IF;
  
  RETURN v_count < p_max_per_minute;
END;
$$;

GRANT EXECUTE ON FUNCTION public.partiu_check_rate_limit(TEXT, TEXT, INTEGER) TO authenticated, service_role;

-- 6. Fix the RLS policy (remove the OR auth.uid() IS NULL clause that allows anon access)
DROP POLICY IF EXISTS drivers_can_read_assigned_offers ON public.rides;

CREATE POLICY drivers_can_read_assigned_offers ON public.rides
FOR SELECT
TO authenticated
USING (
  offered_driver_id = auth.uid()::text 
  OR driver_id = auth.uid()::text
  OR passenger_id = auth.uid()::text
);
