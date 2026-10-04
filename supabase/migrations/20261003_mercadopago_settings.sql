-- ==============================================================================
-- 💳 MIGRATION: Integração com Gateway Mercado Pago & Gestão via Painel Admin
-- Data: 2026-10-03
-- Objetivo: Permitir que o gestor configure Access Token, Public Key e Webhook
--           do Mercado Pago diretamente pelo Painel Administrativo.
-- ==============================================================================

ALTER TABLE public.app_settings 
  ADD COLUMN IF NOT EXISTS active_gateway TEXT NOT NULL DEFAULT 'MERCADO_PAGO',
  ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mercadopago_public_key TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mercadopago_webhook_secret TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mercadopago_sandbox BOOLEAN NOT NULL DEFAULT false;

-- Garante que a linha global exista com os novos campos
INSERT INTO public.app_settings (
  id, 
  active_gateway, 
  mercadopago_sandbox, 
  pix_key, 
  pix_receiver_name, 
  pix_receiver_city
)
VALUES (
  'global', 
  'MERCADO_PAGO', 
  false, 
  'financeiro@partiumobilidade.com.br', 
  'PARTIU MOBILIDADE URBANA LTDA', 
  'ITAPERUNA'
)
ON CONFLICT (id) DO UPDATE SET
  active_gateway = EXCLUDED.active_gateway,
  updated_at = clock_timestamp();

COMMENT ON COLUMN public.app_settings.active_gateway IS 'Gateway PIX primário ativo: MERCADO_PAGO, ASAAS ou MANUAL';
COMMENT ON COLUMN public.app_settings.mercadopago_access_token IS 'Access Token de produção/sandbox do Mercado Pago (APP_USR-...)';
COMMENT ON COLUMN public.app_settings.mercadopago_public_key IS 'Public Key de produção/sandbox do Mercado Pago (APP_USR-...)';
COMMENT ON COLUMN public.app_settings.mercadopago_webhook_secret IS 'Segredo do Webhook para conferência de integridade de notificações do Mercado Pago';
