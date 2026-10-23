-- ==============================================================================
-- 🚀 PARTIU MOBILIDADE — SCRIPT DE INFRAESTRUTURA DE PRODUÇÃO (V6.2 DEFINITIVO)
-- ==============================================================================

-- 1. EXTENSÕES DO POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------
-- 2. FUNÇÃO CANÔNICA DE TIMESTAMP AUTOMÁTICO (updated_at)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. PERFIS DE USUÁRIOS (INTEGRAÇÃO COM AUTH.USERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) DEFAULT 'tenant-itaperuna';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT 'Usuário PARTIU';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'passenger';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Gatilho automático que cria o perfil público no momento do signup no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário PARTIU'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'passenger')
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. GOVERNANÇA MULTI-TENANT & FRANQUIAS (WHITE_LABEL_TENANTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.white_label_tenants (
  tenant_id VARCHAR(64) PRIMARY KEY,
  operation_name VARCHAR(128) NOT NULL DEFAULT 'PARTIU Operação',
  city_id VARCHAR(64) NOT NULL DEFAULT 'cidade-padrao',
  city_name VARCHAR(128) NOT NULL DEFAULT 'Cidade Operacional',
  state_uf VARCHAR(2) NOT NULL DEFAULT 'RJ',
  manager_name VARCHAR(128) NOT NULL DEFAULT 'Diretoria Executiva',
  manager_email VARCHAR(128) NOT NULL DEFAULT 'dono@partiu.app',
  manager_phone VARCHAR(32) NOT NULL DEFAULT '(22) 99605-1620',
  cnpj VARCHAR(32),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.white_label_tenants ADD COLUMN IF NOT EXISTS admin_email VARCHAR(128);
ALTER TABLE public.white_label_tenants ADD COLUMN IF NOT EXISTS admin_password VARCHAR(128);
ALTER TABLE public.white_label_tenants ADD COLUMN IF NOT EXISTS plan_status VARCHAR(32) NOT NULL DEFAULT 'ATIVO';
ALTER TABLE public.white_label_tenants ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE public.white_label_tenants ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- Seed da Franquia Matriz Oficial (Holding)
INSERT INTO public.white_label_tenants (
  tenant_id,
  operation_name,
  city_id,
  city_name,
  state_uf,
  manager_name,
  manager_email,
  manager_phone,
  is_active
) VALUES (
  'tenant-itaperuna',
  'PARTIU Matriz Oficial',
  'itaperuna-rj',
  'Itaperuna',
  'RJ',
  'Diretoria Executiva PARTIU',
  'dono@partiu.app',
  '(22) 99605-1620',
  true
)
ON CONFLICT (tenant_id) DO UPDATE SET
  operation_name = EXCLUDED.operation_name,
  city_name = EXCLUDED.city_name,
  state_uf = EXCLUDED.state_uf,
  is_active = true,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS public.white_label_tenant_configs (
  tenant_id VARCHAR(64) PRIMARY KEY REFERENCES public.white_label_tenants(tenant_id) ON DELETE CASCADE,
  schema_version INT NOT NULL DEFAULT 1,
  brand_center JSONB NOT NULL DEFAULT '{}'::jsonb,
  design_system JSONB NOT NULL DEFAULT '{}'::jsonb,
  typography JSONB NOT NULL DEFAULT '{}'::jsonb,
  home_page JSONB NOT NULL DEFAULT '{}'::jsonb,
  menu_builder JSONB NOT NULL DEFAULT '{}'::jsonb,
  business_models JSONB NOT NULL DEFAULT '{}'::jsonb,
  monetization JSONB NOT NULL DEFAULT '{}'::jsonb,
  cms JSONB NOT NULL DEFAULT '{}'::jsonb,
  geo JSONB NOT NULL DEFAULT '{}'::jsonb,
  native_app JSONB NOT NULL DEFAULT '{}'::jsonb,
  full_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_branding (
  tenant_id VARCHAR(64) PRIMARY KEY,
  app_name VARCHAR(100) NOT NULL DEFAULT 'PARTIU',
  primary_color VARCHAR(10) NOT NULL DEFAULT '#FF6B00',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS company_name VARCHAR(120) DEFAULT 'PARTIU Mobilidade Urbana';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(10) DEFAULT '#FFB800';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS accent_color VARCHAR(10) DEFAULT '#EA580C';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS background_color VARCHAR(10) DEFAULT '#FAFAFA';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS surface_color VARCHAR(10) DEFAULT '#FFFFFF';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS text_primary VARCHAR(10) DEFAULT '#0F172A';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS text_secondary VARCHAR(10) DEFAULT '#64748B';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '/favicon.svg';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '/favicon.svg';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS header_gradient_start VARCHAR(10) DEFAULT '#FF6B00';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS header_gradient_end VARCHAR(10) DEFAULT '#EA580C';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS footer_sync_with_header BOOLEAN DEFAULT true;
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS footer_gradient_start VARCHAR(10) DEFAULT '#FF6B00';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS footer_gradient_end VARCHAR(10) DEFAULT '#EA580C';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS border_radius VARCHAR(10) DEFAULT '16px';
ALTER TABLE public.app_branding ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'Plus Jakarta Sans';

INSERT INTO public.app_branding (tenant_id, app_name, primary_color, secondary_color, accent_color)
VALUES ('default', 'PARTIU', '#FF6B00', '#FFB800', '#EA580C'),
       ('tenant-itaperuna', 'PARTIU Itaperuna', '#FF6B00', '#FFB800', '#EA580C')
ON CONFLICT (tenant_id) DO NOTHING;

-- ==============================================================================
-- 5. CONFIGURAÇÕES OPERACIONAIS GLOBAIS (APP_SETTINGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS app_name TEXT NOT NULL DEFAULT 'PARTIU';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#FF6B00';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS base_fare_ride NUMERIC(10,2) NOT NULL DEFAULT 5.50;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS base_fare_delivery NUMERIC(10,2) NOT NULL DEFAULT 5.00;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS price_per_km NUMERIC(10,2) NOT NULL DEFAULT 2.10;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS price_per_minute NUMERIC(10,2) NOT NULL DEFAULT 0.35;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS min_fare NUMERIC(10,2) NOT NULL DEFAULT 8.00;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS search_radius_km NUMERIC(4,1) NOT NULL DEFAULT 4.0;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS search_timeout_seconds INT NOT NULL DEFAULT 60;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS free_cancellation_seconds INT NOT NULL DEFAULT 180;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS cancellation_fee NUMERIC(10,2) NOT NULL DEFAULT 5.00;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS whatsapp_support TEXT DEFAULT '(22) 99605-1620';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS phone_emergency TEXT DEFAULT '190';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS pix_key TEXT DEFAULT 'financeiro@partiumobilidade.com.br';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS active_gateway TEXT DEFAULT 'MERCADO_PAGO';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS mercadopago_public_key TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS mercadopago_webhook_secret TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS mercadopago_sandbox BOOLEAN DEFAULT false;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT false;

INSERT INTO public.app_settings (id, app_name, primary_color, base_fare_ride)
VALUES ('global', 'PARTIU', '#FF6B00', 5.50)
ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 6. MOTORISTAS HOMOLOGADOS E VEÍCULOS (PARTIU_MOTORISTAS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.partiu_motoristas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) DEFAULT 'tenant-itaperuna';
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS nome VARCHAR(120) NOT NULL DEFAULT 'Motorista';
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS telefone VARCHAR(20) NOT NULL DEFAULT '(00) 00000-0000';
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS email VARCHAR(120);
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS cnh_numero VARCHAR(20);
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS cnh_categoria VARCHAR(10) DEFAULT 'B';
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS cnh_validade DATE;
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS possui_ear BOOLEAN DEFAULT true;
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS veiculo_marca_modelo VARCHAR(80) DEFAULT 'Veículo';
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS veiculo_placa VARCHAR(10);
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS veiculo_ano INT DEFAULT 2020;
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS veiculo_cor VARCHAR(30) DEFAULT 'Preto';
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS categoria_veiculo VARCHAR(20) DEFAULT 'CARRO';
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.00;
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS taxa_aceitacao NUMERIC(5,2) DEFAULT 100.00;
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS taxa_cancelamento NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS total_viagens INT DEFAULT 0;
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS chave_pix VARCHAR(120);
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS tipo_chave_pix VARCHAR(20) DEFAULT 'CPF';
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS status_aprovacao VARCHAR(20) DEFAULT 'pendente';
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;
ALTER TABLE public.partiu_motoristas ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_motoristas_status ON public.partiu_motoristas(status_aprovacao);
CREATE INDEX IF NOT EXISTS idx_motoristas_online ON public.partiu_motoristas(is_online);

DROP TRIGGER IF EXISTS trg_motoristas_updated_at ON public.partiu_motoristas;
CREATE TRIGGER trg_motoristas_updated_at
  BEFORE UPDATE ON public.partiu_motoristas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 7. TELEMETRIA GPS EM TEMPO REAL (DRIVER_LOCATIONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.driver_locations (
  driver_id TEXT PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) DEFAULT 'tenant-itaperuna';
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS heading DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS speed DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION NOT NULL DEFAULT 10;
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'CARRO';
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS current_ride_id TEXT;

CREATE INDEX IF NOT EXISTS idx_driver_locations_status ON public.driver_locations(status, category, updated_at);

DROP TRIGGER IF EXISTS trg_driver_locations_updated_at ON public.driver_locations;
CREATE TRIGGER trg_driver_locations_updated_at
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 8. TABELA CANÔNICA DE CORRIDAS (RIDES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rides (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) DEFAULT 'tenant-itaperuna';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS passenger_id TEXT NOT NULL DEFAULT 'anon';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS passenger_name TEXT NOT NULL DEFAULT 'Passageiro';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS passenger_phone TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup_address TEXT NOT NULL DEFAULT 'Origem';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dropoff_address TEXT NOT NULL DEFAULT 'Destino';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dropoff_lat DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dropoff_lng DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'REQUESTED';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS vehicle_category TEXT NOT NULL DEFAULT 'CARRO';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS price_estimated_brl NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS price_final_brl NUMERIC(10,2);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS distance_km NUMERIC(6,2) NOT NULL DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS duration_minutes INT NOT NULL DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS driver_id TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS driver_phone TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS driver_coords JSONB;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS polyline TEXT;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pin VARCHAR(4) NOT NULL DEFAULT '0000';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pin_validated_at TIMESTAMPTZ;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'pix';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS is_female_only BOOLEAN DEFAULT false;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS is_delivery BOOLEAN DEFAULT false;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS paradas JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_rides_status_created ON public.rides(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON public.rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_tenant ON public.rides(tenant_id);

DROP TRIGGER IF EXISTS trg_rides_updated_at ON public.rides;
CREATE TRIGGER trg_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 9. TRIP RADAR & OFERTAS CONCORRENTES (DRIVER_OFFERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.driver_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id TEXT NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ride_driver_offer UNIQUE (ride_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_offers_status ON public.driver_offers(ride_id, status);

-- ==============================================================================
-- 10. MENSAGERIA EM TEMPO REAL ENTRE CORRIDAS (PARTIU_RIDE_MESSAGES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.partiu_ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'PASSENGER',
  message_type TEXT NOT NULL DEFAULT 'TEXT',
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partiu_ride_messages ADD COLUMN IF NOT EXISTS ride_id TEXT;
ALTER TABLE public.partiu_ride_messages ADD COLUMN IF NOT EXISTS sender_id TEXT;
ALTER TABLE public.partiu_ride_messages ADD COLUMN IF NOT EXISTS sender_type TEXT DEFAULT 'PASSENGER';
ALTER TABLE public.partiu_ride_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'TEXT';
ALTER TABLE public.partiu_ride_messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.partiu_ride_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ride_messages_ride_created ON public.partiu_ride_messages(ride_id, created_at ASC);

-- ==============================================================================
-- 11. FINOPS, CONTAS E LEDGER DE DUPLA ENTRADA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(30) NOT NULL DEFAULT 'ASSET',
  balance_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partiu_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL DEFAULT 'MOTORISTA',
  balance_cents BIGINT NOT NULL DEFAULT 0,
  cashback_accumulated_cents BIGINT NOT NULL DEFAULT 0,
  is_bloqueada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) NOT NULL DEFAULT 'TX_INITIAL',
  entry_type VARCHAR(10) NOT NULL DEFAULT 'CREDIT',
  account_id VARCHAR(50) NOT NULL DEFAULT 'ACC_SYSTEM',
  amount_cents BIGINT NOT NULL DEFAULT 0,
  description VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.financial_ledger_entries ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
ALTER TABLE public.financial_ledger_entries ADD COLUMN IF NOT EXISTS entry_type VARCHAR(10);
ALTER TABLE public.financial_ledger_entries ADD COLUMN IF NOT EXISTS account_id VARCHAR(50);
ALTER TABLE public.financial_ledger_entries ADD COLUMN IF NOT EXISTS amount_cents BIGINT;
ALTER TABLE public.financial_ledger_entries ADD COLUMN IF NOT EXISTS description VARCHAR(255);
ALTER TABLE public.financial_ledger_entries ADD COLUMN IF NOT EXISTS wallet_id UUID;
ALTER TABLE public.financial_ledger_entries ADD COLUMN IF NOT EXISTS ride_id TEXT;

CREATE INDEX IF NOT EXISTS idx_ledger_tx ON public.financial_ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_account ON public.financial_ledger_entries(account_id);

-- Planos SaaS de Motorista (Taxa Zero de Corrida)
CREATE TABLE IF NOT EXISTS public.monetization_plans (
  id VARCHAR(64) PRIMARY KEY,
  plan_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  weekly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  daily_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  commission_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (commission_percent = 0.00),
  trial_days INTEGER NOT NULL DEFAULT 0,
  grace_days INTEGER NOT NULL DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.monetization_plans (id, plan_name, monthly_fee, weekly_fee, daily_fee, commission_percent, trial_days)
VALUES ('plano-mensal-pro', 'Assinatura Mensal PARTIU Pro', 149.90, 45.00, 9.90, 0.00, 7)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.driver_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant-itaperuna',
  driver_id TEXT NOT NULL,
  plan_id VARCHAR(64) REFERENCES public.monetization_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'SUSPENDED', 'EXPIRED')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_subs_driver ON public.driver_subscriptions(driver_id, status);

-- ==============================================================================
-- 12. NOTIFICAÇÕES & CUPONS (DEFENSIVO: is_read & "read")
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Notificação',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_user_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'sistema';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS "read" BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- Tabela Oficial de Campanhas e Cupons de Desconto
CREATE TABLE IF NOT EXISTS public.campaigns_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(32) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  discount_type VARCHAR(16) NOT NULL DEFAULT 'PERCENT',
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  min_trip_cents BIGINT NOT NULL DEFAULT 0,
  max_redemptions INT DEFAULT 1000,
  redeemed_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_until TIMESTAMPTZ,
  tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant-itaperuna',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.campaigns_coupons ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64) NOT NULL DEFAULT 'tenant-itaperuna';
ALTER TABLE public.campaigns_coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_campaigns_coupons_code ON public.campaigns_coupons(code);
CREATE INDEX IF NOT EXISTS idx_campaigns_coupons_tenant ON public.campaigns_coupons(tenant_id);

INSERT INTO public.campaigns_coupons (code, description, discount_type, discount_value, min_trip_cents, is_active)
VALUES 
  ('PARTIU10', 'R$ 10 de desconto na sua corrida', 'PERCENT', 10.00, 1000, true),
  ('PARTIU20', '20% OFF na sua próxima corrida', 'PERCENT', 20.00, 0, true)
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 13. PROVISIONAMENTO DOS BUCKETS DO SUPABASE STORAGE
-- ==============================================================================
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES 
    ('driver-documents', 'driver-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('vehicle-photos', 'vehicle-photos', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('brand-assets', 'brand-assets', true, 5242880, ARRAY['image/svg+xml', 'image/png', 'image/jpeg', 'image/x-icon'])
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ==============================================================================
-- 14. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partiu_ride_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.white_label_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns_coupons ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "app_branding_public_read" ON public.app_branding;
CREATE POLICY "app_branding_public_read" ON public.app_branding FOR SELECT USING (true);

DROP POLICY IF EXISTS "tenants_public_read" ON public.white_label_tenants;
CREATE POLICY "tenants_public_read" ON public.white_label_tenants FOR SELECT USING (true);

DROP POLICY IF EXISTS "app_settings_public_read" ON public.app_settings;
CREATE POLICY "app_settings_public_read" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "driver_locations_select" ON public.driver_locations;
CREATE POLICY "driver_locations_select" ON public.driver_locations FOR SELECT USING (true);

DROP POLICY IF EXISTS "driver_locations_update_self" ON public.driver_locations;
CREATE POLICY "driver_locations_update_self" ON public.driver_locations FOR ALL USING (true);

-- Políticas Operacionais de Corridas e Mensagens
DROP POLICY IF EXISTS "rides_all_operational" ON public.rides;
CREATE POLICY "rides_all_operational" ON public.rides FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "driver_offers_all" ON public.driver_offers;
CREATE POLICY "driver_offers_all" ON public.driver_offers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "partiu_ride_messages_all" ON public.partiu_ride_messages;
CREATE POLICY "partiu_ride_messages_all" ON public.partiu_ride_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "campaigns_coupons_public_select" ON public.campaigns_coupons;
CREATE POLICY "campaigns_coupons_public_select" ON public.campaigns_coupons FOR SELECT USING (true);

-- Permissões de Escrita Administrativas
DROP POLICY IF EXISTS "app_settings_admin_write" ON public.app_settings;
CREATE POLICY "app_settings_admin_write" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "app_branding_all_access" ON public.app_branding;
CREATE POLICY "app_branding_all_access" ON public.app_branding FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tenants_all_access" ON public.white_label_tenants;
CREATE POLICY "tenants_all_access" ON public.white_label_tenants FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 15. PUBLICAÇÃO EM TEMPO REAL (SUPABASE REALTIME)
-- ==============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_offers;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.partiu_ride_messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;