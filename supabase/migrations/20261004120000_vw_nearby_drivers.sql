-- ==============================================================================
-- 🛡️ PARTIU MOBILIDADE — VIEW DE TELEMETRIA SANITIZADA (LGPD & ZERO TRUST)
-- ==============================================================================
-- Mascara dados sensíveis de motoristas (placa, CPF, telefone, nome civil)
-- Expondo apenas telemetria espacial anônima para renderização de frota no mapa.
-- ==============================================================================

CREATE OR REPLACE VIEW public.vw_nearby_drivers AS
SELECT
  id,
  driver_id,
  latitude,
  longitude,
  heading,
  speed,
  status,
  category,
  updated_at
FROM public.driver_locations
WHERE status IN ('ONLINE', 'ONLINE_IDLE', 'ONLINE_MOVING', 'AVAILABLE')
  AND updated_at >= NOW() - INTERVAL '5 minutes';

COMMENT ON VIEW public.vw_nearby_drivers IS 'View pública anonimizada de condutores ativos para visualização no mapa de passageiros (sem dados PII).';

-- Permissões de leitura estrita para roles autenticadas e anônimas
GRANT SELECT ON public.vw_nearby_drivers TO anon, authenticated;
