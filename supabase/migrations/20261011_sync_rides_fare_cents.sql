-- ==============================================================================
-- 🏛️ MIGRATION: 20261011_sync_rides_fare_cents.sql
-- ==============================================================================
-- Objetivo: Unificação monetária em Minor Units (centavos inteiros) na tabela public.rides.
-- Garante paridade matemática rigorosa com a tabela public.partiu_corridas (valor_bruto_cents).
-- Implementa sincronização bidirecional automática via trigger em nível de banco de dados.
-- ==============================================================================

-- 1. Adiciona coluna fare_cents se não existir
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS fare_cents INTEGER;

-- 2. Backfill de dados existentes com arredondamento seguro
UPDATE public.rides
SET fare_cents = ROUND(fare_brl * 100)::INTEGER
WHERE fare_cents IS NULL AND fare_brl IS NOT NULL;

-- 3. Função de sincronização bidirecional
CREATE OR REPLACE FUNCTION fn_sync_rides_fare_cents()
RETURNS TRIGGER AS $$
BEGIN
  -- Se fare_cents foi informado/alterado, sincroniza fare_brl
  IF NEW.fare_cents IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.fare_cents IS DISTINCT FROM NEW.fare_cents OR NEW.fare_brl IS NULL) THEN
    NEW.fare_brl := ROUND((NEW.fare_cents / 100.0)::NUMERIC, 2);
  -- Se fare_brl foi informado/alterado, sincroniza fare_cents
  ELSIF NEW.fare_brl IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.fare_brl IS DISTINCT FROM NEW.fare_brl OR NEW.fare_cents IS NULL) THEN
    NEW.fare_cents := ROUND(NEW.fare_brl * 100)::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Instalação do Trigger BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS trg_sync_rides_fare_cents ON public.rides;
CREATE TRIGGER trg_sync_rides_fare_cents
BEFORE INSERT OR UPDATE ON public.rides
FOR EACH ROW
EXECUTE FUNCTION fn_sync_rides_fare_cents();

-- 5. Índice de alta performance para conciliação contábil
CREATE INDEX IF NOT EXISTS idx_rides_fare_cents ON public.rides (fare_cents);
