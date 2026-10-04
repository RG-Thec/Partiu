-- ==============================================================================
-- 🔒 MIGRATION: Correção de RLS — Remove permissão anon de INSERT em rides e
--    driver_locations. Apenas usuários autenticados e identificados podem operar.
-- Data: 2026-10-03
-- Motivo: Auditoria de Prontidão de Produção (itens B3 e A4)
-- ==============================================================================

-- ─── 1. RIDES: Remover INSERT anon ───────────────────────────────────────────
-- ANTES: auth.role() = 'anon' OR auth.role() = 'authenticated'
-- DEPOIS: Somente o passageiro autenticado (cujo uid == passenger_id) pode inserir.
-- Edge Functions usam service_role_key e bypassam RLS, então continuam funcionando.

DROP POLICY IF EXISTS "Corridas: passageiro cria corrida" ON public.rides;
CREATE POLICY "Corridas: passageiro cria corrida"
  ON public.rides FOR INSERT
  WITH CHECK (
    auth.uid()::text = passenger_id
  );


-- ─── 2. DRIVER_LOCATIONS: Remover permissão anon de ALL ─────────────────────
-- ANTES: FOR ALL com auth.role() = 'anon' — qualquer anônimo podia manipular posições.
-- DEPOIS: Motorista autenticado atualiza apenas sua própria posição.

DROP POLICY IF EXISTS "Telemetria: motorista atualiza sua própria posição" ON public.driver_locations;
CREATE POLICY "Telemetria: motorista atualiza sua própria posição"
  ON public.driver_locations FOR ALL
  USING (
    auth.uid()::text = driver_id
  );


-- ─── 3. RIDES SELECT: Corrigir leitura aberta para corridas em busca ────────
-- A policy original permitia SELECT irrestrito para status REQUESTED/SEARCHING,
-- o que vazava dados de passageiros para qualquer usuário. Restringimos a:
-- - Passageiro dono da corrida
-- - Motorista atribuído
-- - Admin
-- - Motoristas autenticados podem ver corridas em REQUESTED/SEARCHING (para aceitar)

DROP POLICY IF EXISTS "Corridas: leitura para participantes" ON public.rides;
CREATE POLICY "Corridas: leitura para participantes"
  ON public.rides FOR SELECT
  USING (
    auth.uid()::text = passenger_id
    OR auth.uid()::text = driver_id
    OR (
      auth.role() = 'authenticated'
      AND status IN ('REQUESTED', 'SEARCHING_R1', 'SEARCHING_R2', 'SEARCHING_R3', 'OFFERED')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
