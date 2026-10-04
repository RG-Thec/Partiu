-- ==============================================================================
-- 🚀 PARTIU PRODUCTION NETWORK: REAL DISPATCH, ATOMIC CLAIM & RLS HARDENING
-- ==============================================================================
-- 1. Atualiza RPC partiu_aceitar_corrida_atomica para incluir status 'OFFERED'
-- 2. Cria alias dispatch_claim_ride_atomic
-- 3. Políticas RLS na tabela public.rides para visualização de ofertas direcionadas
-- 4. Inclusão das tabelas na publicação supabase_realtime
-- ==============================================================================

-- 1. RPC ATÔMICA UNIVERSAL: partiu_aceitar_corrida_atomica (com suporte a OFFERED)
DROP FUNCTION IF EXISTS public.partiu_aceitar_corrida_atomica(text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.partiu_aceitar_corrida_atomica(uuid, uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.partiu_aceitar_corrida_atomica(
  p_corrida_id TEXT,
  p_motorista_id TEXT,
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
BEGIN
  v_is_uuid := p_corrida_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  -- 1. Tentativa de obter lock exclusivo na tabela canônica public.rides
  BEGIN
    SELECT * INTO STRICT v_ride
    FROM public.rides
    WHERE id = p_corrida_id
    FOR UPDATE NOWAIT;

    -- Validar se a corrida ainda está disponível para aceite
    IF v_ride.status NOT IN ('REQUESTED', 'SEARCHING_R1', 'SEARCHING_R2', 'SEARCHING_R3', 'PROCURANDO', 'OFERTADA', 'OFFERED') THEN
      RETURN jsonb_build_object(
        'sucesso', false,
        'codigo', 'STATUS_INVALIDO',
        'mensagem', 'Esta corrida já foi atribuída a outro condutor ou cancelada.'
      );
    END IF;

    -- Atualizar public.rides atomicamente
    UPDATE public.rides
    SET driver_id = p_motorista_id,
        driver_name = COALESCE(NULLIF(p_motorista_nome, ''), v_ride.driver_name, 'Motorista Parceiro'),
        driver_phone = COALESCE(NULLIF(p_motorista_telefone, ''), v_ride.driver_phone),
        status = 'ACCEPTED',
        offered_driver_id = NULL,
        offer_expires_at = NULL,
        accepted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_corrida_id
    RETURNING * INTO v_ride;

    -- Espelha atualização em partiu_corridas se a tabela existir
    BEGIN
      UPDATE public.partiu_corridas
      SET status = 'A_CAMINHO',
          motorista_id = p_motorista_id,
          updated_at = NOW()
      WHERE codigo_viagem = p_corrida_id
         OR (v_is_uuid AND id = p_corrida_id::uuid);
    EXCEPTION
      WHEN undefined_table THEN NULL;
    END;

    -- Atualizar telemetria/status do condutor para ocupado
    UPDATE public.driver_locations
    SET status = 'ON_TRIP',
        current_ride_id = p_corrida_id,
        updated_at = NOW()
    WHERE driver_id = p_motorista_id;

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
      -- Se não encontrou em public.rides, busca em public.partiu_corridas
      BEGIN
        IF v_is_uuid THEN
          UPDATE public.partiu_corridas
          SET status = 'A_CAMINHO',
              motorista_id = p_motorista_id,
              updated_at = NOW()
          WHERE id = p_corrida_id::uuid AND status IN ('SOLICITADA', 'PROCURANDO')
          RETURNING id INTO v_is_uuid;
        ELSE
          UPDATE public.partiu_corridas
          SET status = 'A_CAMINHO',
              motorista_id = p_motorista_id,
              updated_at = NOW()
          WHERE codigo_viagem = p_corrida_id AND status IN ('SOLICITADA', 'PROCURANDO')
          RETURNING true INTO v_is_uuid;
        END IF;

        IF FOUND THEN
          RETURN jsonb_build_object(
            'sucesso', true,
            'codigo', 'ACEITO_LEGADO',
            'corrida_id', p_corrida_id,
            'driver_id', p_motorista_id
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

-- 2. ALIAS RPC: dispatch_claim_ride_atomic
DROP FUNCTION IF EXISTS public.dispatch_claim_ride_atomic CASCADE;

CREATE OR REPLACE FUNCTION public.dispatch_claim_ride_atomic(
  p_ride_id TEXT,
  p_driver_id TEXT,
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

-- 3. PERMISSÕES DE EXECUÇÃO
GRANT EXECUTE ON FUNCTION public.partiu_aceitar_corrida_atomica(TEXT, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.dispatch_claim_ride_atomic(TEXT, TEXT, TEXT, TEXT) TO authenticated, anon, service_role;

-- 4. POLÍTICAS RLS DEFENSIVAS NA TABELA RIDES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rides' AND policyname = 'drivers_can_read_assigned_offers'
  ) THEN
    CREATE POLICY drivers_can_read_assigned_offers ON public.rides
    FOR SELECT
    TO authenticated
    USING (
      offered_driver_id = auth.uid()::text 
      OR driver_id = auth.uid()::text
      OR passenger_id = auth.uid()::text
      OR auth.uid() IS NULL
    );
  END IF;
END $$;

-- 5. ASSEGURA SUPABASE REALTIME EM RIDES E DRIVER_LOCATIONS
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
