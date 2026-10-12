-- ==============================================================================
-- 🛡️ MIGRATION: 20261012_remediate_p0_security.sql
-- PROJETO: PARTIU — Mobilidade Urbana Enterprise V6.0
-- REMEDIAÇÃO FORENSE DE VULNERABILIDADES P0 IDENTIFICADAS NA AUDITORIA
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. STORAGE: BLINDAGEM ESTREITA LGPD PARA DOCUMENTOS (CNH & CRLV)
-- ------------------------------------------------------------------------------

-- Remover políticas públicas legadas
DROP POLICY IF EXISTS "CNH upload liberado" ON storage.objects;
DROP POLICY IF EXISTS "CNH leitura liberada" ON storage.objects;
DROP POLICY IF EXISTS "CNH upload seguro" ON storage.objects;
DROP POLICY IF EXISTS "CNH leitura restrita" ON storage.objects;

CREATE POLICY "CNH upload seguro" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cnh' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR auth.role() = 'service_role'
  )
);

CREATE POLICY "CNH leitura restrita" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'cnh' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
    )
    OR auth.role() = 'service_role'
  )
);

DROP POLICY IF EXISTS "CRLV upload liberado" ON storage.objects;
DROP POLICY IF EXISTS "CRLV leitura liberada" ON storage.objects;
DROP POLICY IF EXISTS "CRLV upload seguro" ON storage.objects;
DROP POLICY IF EXISTS "CRLV leitura restrita" ON storage.objects;

CREATE POLICY "CRLV upload seguro" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'crlv' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR auth.role() = 'service_role'
  )
);

CREATE POLICY "CRLV leitura restrita" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'crlv' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
    )
    OR auth.role() = 'service_role'
  )
);

-- ------------------------------------------------------------------------------
-- 2. CORRIDAS: FECHAMENTO DE POLÍTICAS RLS ABERTAS (rides & partiu_corridas)
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.rides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público leituras rides" ON public.rides;
DROP POLICY IF EXISTS "Acesso público inserções rides" ON public.rides;
DROP POLICY IF EXISTS "Acesso público updates rides" ON public.rides;
DROP POLICY IF EXISTS "rides_read_policy" ON public.rides;
DROP POLICY IF EXISTS "rides_write_policy" ON public.rides;

CREATE POLICY "rides_read_policy" ON public.rides
FOR SELECT USING (
  auth.role() = 'service_role'
  OR auth.uid()::text = passenger_id
  OR auth.uid()::text = driver_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
  )
);

CREATE POLICY "rides_insert_policy" ON public.rides
FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
  OR (auth.role() = 'authenticated' AND auth.uid()::text = passenger_id)
);

CREATE POLICY "rides_update_policy" ON public.rides
FOR UPDATE USING (
  auth.role() = 'service_role'
  OR auth.uid()::text = passenger_id
  OR auth.uid()::text = driver_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
  )
);

-- partiu_corridas
ALTER TABLE IF EXISTS public.partiu_corridas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partiu_corridas_select_aberto" ON public.partiu_corridas;
DROP POLICY IF EXISTS "partiu_corridas_insert_aberto" ON public.partiu_corridas;
DROP POLICY IF EXISTS "partiu_corridas_update_aberto" ON public.partiu_corridas;
DROP POLICY IF EXISTS "partiu_corridas_read_policy" ON public.partiu_corridas;

CREATE POLICY "partiu_corridas_read_policy" ON public.partiu_corridas
FOR SELECT USING (
  auth.role() = 'service_role'
  OR auth.uid() = passageiro_id
  OR auth.uid() = motorista_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
  )
);

-- ------------------------------------------------------------------------------
-- 3. CHAT EFÊMERO: FECHAMENTO DE POLÍTICAS RLS (chat_messages & partiu_ride_messages)
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso público chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_participant_access" ON public.chat_messages;

CREATE POLICY "chat_messages_participant_access" ON public.chat_messages
FOR ALL USING (
  auth.role() = 'service_role'
  OR auth.uid()::text = sender_id
  OR EXISTS (
    SELECT 1 FROM public.rides r 
    WHERE r.id = chat_messages.ride_id 
      AND (r.passenger_id = auth.uid()::text OR r.driver_id = auth.uid()::text)
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
  )
);

-- ------------------------------------------------------------------------------
-- 4. CARTEIRAS & LIVRO-RAZÃO: FECHAMENTO DE POLÍTICAS RLS (partiu_wallets & ledger)
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.partiu_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de carteiras" ON public.partiu_wallets;
DROP POLICY IF EXISTS "partiu_wallets_owner_read" ON public.partiu_wallets;

CREATE POLICY "partiu_wallets_owner_read" ON public.partiu_wallets
FOR SELECT USING (
  auth.role() = 'service_role'
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
  )
);

ALTER TABLE IF EXISTS public.partiu_ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de ledger" ON public.partiu_ledger_entries;
DROP POLICY IF EXISTS "partiu_ledger_owner_read" ON public.partiu_ledger_entries;

CREATE POLICY "partiu_ledger_owner_read" ON public.partiu_ledger_entries
FOR SELECT USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.partiu_wallets w 
    WHERE w.id = partiu_ledger_entries.wallet_id AND w.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
  )
);

-- ------------------------------------------------------------------------------
-- 5. APP BRANDING: PROTEGER CONFIGURAÇÕES DE FRANQUIA CONTRA OVERRIDE NÃO AUTORIZADO
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.app_branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin: Gestão Total de Branding" ON public.app_branding;
DROP POLICY IF EXISTS "app_branding_public_read" ON public.app_branding;
DROP POLICY IF EXISTS "app_branding_admin_write" ON public.app_branding;

-- Leitura pública para carregar tema e marca
CREATE POLICY "app_branding_public_read" ON public.app_branding
FOR SELECT USING (true);

-- Escrita restrita a administradores e franqueados
CREATE POLICY "app_branding_admin_write" ON public.app_branding
FOR ALL TO authenticated
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
  )
  OR (
    auth.jwt() ->> 'tenant_id' = app_branding.tenant_id
  )
);

-- ------------------------------------------------------------------------------
-- 6. SUPORTE, SOS E TELEMETRIA ATIVA
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_tickets_select_all" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_user_access" ON public.support_tickets;

CREATE POLICY "support_tickets_user_access" ON public.support_tickets
FOR ALL USING (
  auth.role() = 'service_role'
  OR auth.uid()::text = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
  )
);

ALTER TABLE IF EXISTS public.partiu_sos_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partiu_sos_events_all" ON public.partiu_sos_events;
DROP POLICY IF EXISTS "partiu_sos_events_protected" ON public.partiu_sos_events;

CREATE POLICY "partiu_sos_events_protected" ON public.partiu_sos_events
FOR ALL USING (
  auth.role() = 'service_role'
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gestor', 'SUPER_ADMIN')
  )
);

-- ------------------------------------------------------------------------------
-- 7. PROCEDURES: BLINDAR search_path CONTRA INJEÇÃO
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'partiu_solicitar_corrida') THEN
    ALTER FUNCTION public.partiu_solicitar_corrida SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'partiu_validar_pin_embarque') THEN
    ALTER FUNCTION public.partiu_validar_pin_embarque SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'partiu_concluir_corrida_split') THEN
    ALTER FUNCTION public.partiu_concluir_corrida_split SET search_path = public, pg_temp;
  END IF;
END $$;
