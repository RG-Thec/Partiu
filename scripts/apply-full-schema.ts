import fs from "fs";
import path from "path";
import pg from "pg";

let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!connectionString) {
  try {
    const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf-8");
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) connectionString = match[1];
  } catch {}
}
if (!connectionString) {
  console.error("❌ Defina DATABASE_URL no arquivo .env ou como variável de ambiente.");
  process.exit(1);
}

async function applyFullSchema() {
  console.log("================================================================================");
  console.log("🚀 PARTIU — APLICAÇÃO TOTAL DO SCHEMA DE PRODUÇÃO NO SUPABASE");
  console.log("================================================================================");

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  await client.connect();
  console.log("✅ Conectado ao PostgreSQL 17 com sucesso!");

  // 1. Pré-ajustes de colunas para garantir compatibilidade entre versões de migrations
  console.log("\n🔧 Aplicando pré-ajustes de compatibilidade...");
  await client.query(`
    -- Extensões obrigatórias
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "postgis";

    -- profiles (adiciona colunas que migrações subsequentes referenciam)
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'passenger';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'aprovado';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 5.0;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0;

    -- outbox_events
    ALTER TABLE IF EXISTS public.outbox_events ADD COLUMN IF NOT EXISTS organization_id UUID;
    ALTER TABLE IF EXISTS public.outbox_events ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE IF EXISTS public.outbox_events ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0;
    ALTER TABLE IF EXISTS public.outbox_events ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 5;
    ALTER TABLE IF EXISTS public.outbox_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
    ALTER TABLE IF EXISTS public.outbox_events ADD COLUMN IF NOT EXISTS error_log TEXT;
    ALTER TABLE IF EXISTS public.outbox_events ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);
    ALTER TABLE IF EXISTS public.outbox_events ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100);

    -- trips & trip_passengers
    ALTER TABLE IF EXISTS public.trips ADD COLUMN IF NOT EXISTS driver_id UUID;
    UPDATE public.trips SET driver_id = driver_user_id WHERE driver_id IS NULL AND driver_user_id IS NOT NULL;
    ALTER TABLE IF EXISTS public.trip_passengers ADD COLUMN IF NOT EXISTS passenger_id UUID;
    UPDATE public.trip_passengers SET passenger_id = passenger_user_id WHERE passenger_id IS NULL AND passenger_user_id IS NOT NULL;

    -- banners
    ALTER TABLE IF EXISTS public.banners ALTER COLUMN id TYPE VARCHAR(64) USING id::text;
    ALTER TABLE IF EXISTS public.banners ALTER COLUMN titulo DROP NOT NULL;
    ALTER TABLE IF EXISTS public.banners ALTER COLUMN titulo SET DEFAULT '';
    ALTER TABLE IF EXISTS public.banners ALTER COLUMN subtitulo DROP NOT NULL;
    ALTER TABLE IF EXISTS public.banners ALTER COLUMN imagem_url DROP NOT NULL;
    ALTER TABLE IF EXISTS public.banners ALTER COLUMN link_destino DROP NOT NULL;
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS link_url TEXT NOT NULL DEFAULT '/app';
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS category VARCHAR(32) NOT NULL DEFAULT 'PASSENGER';
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS subtitle TEXT;
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS badge TEXT;
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS imagem_url TEXT;
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS link_destino TEXT;
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS ordem INTEGER;
    ALTER TABLE IF EXISTS public.banners ADD COLUMN IF NOT EXISTS ativo BOOLEAN;

    -- support_tickets
    CREATE TABLE IF NOT EXISTS public.support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS ticket_number TEXT;
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS user_id TEXT;
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS user_name TEXT;
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS user_phone TEXT;
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'PASSENGER';
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS ride_id TEXT;
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'GENERAL';
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS subject TEXT;
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN';
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'MEDIUM';
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS admin_notes TEXT;
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
    ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

    -- user_payment_methods
    CREATE TABLE IF NOT EXISTS public.user_payment_methods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'pix',
      is_default BOOLEAN NOT NULL DEFAULT false,
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- app_settings
    CREATE TABLE IF NOT EXISTS public.app_settings (
      id VARCHAR(64) PRIMARY KEY DEFAULT 'global',
      daily_fee_car NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
      daily_fee_moto NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
      base_fare_ride NUMERIC(10, 2) NOT NULL DEFAULT 6.00,
      base_fare_delivery NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
      price_per_km NUMERIC(10, 2) NOT NULL DEFAULT 1.80,
      price_per_minute NUMERIC(10, 2) NOT NULL DEFAULT 0.30,
      is_delivery_active BOOLEAN NOT NULL DEFAULT true,
      is_ride_active BOOLEAN NOT NULL DEFAULT true,
      currency_symbol VARCHAR(8) NOT NULL DEFAULT 'R$',
      pix_key VARCHAR(128) NOT NULL DEFAULT 'financeiro@partiumobilidade.com.br',
      pix_receiver_name VARCHAR(128) NOT NULL DEFAULT 'PARTIU MOBILIDADE URBANA LTDA',
      pix_receiver_city VARCHAR(64) NOT NULL DEFAULT 'ITAPERUNA',
      mercadopago_access_token TEXT DEFAULT '',
      mercadopago_public_key TEXT DEFAULT '',
      mercadopago_webhook_secret TEXT DEFAULT '',
      mercadopago_sandbox BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS app_name TEXT NOT NULL DEFAULT 'PARTIU';
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#0088FF';
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS secondary_color TEXT NOT NULL DEFAULT '#003366';
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#00C6FF';
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS search_radius_km NUMERIC(4,1) NOT NULL DEFAULT 6.0;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS search_timeout_seconds INT NOT NULL DEFAULT 60;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS maintenance_message TEXT DEFAULT 'Sistema em atualização operacional programada. Voltamos em instantes.';
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS whatsapp_support TEXT DEFAULT '(22) 99605-1620';
    ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS phone_emergency TEXT DEFAULT '190';

    INSERT INTO public.app_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;
  `);
  console.log("✅ Pré-ajustes aplicados com sucesso!");

  // 2. Execução das migrations pendentes
  const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // Resetar migrations que falharam para tentar novamente
  await client.query(`DELETE FROM public._partiu_migrations_history WHERE success = false;`);
  const { rows: appliedRows } = await client.query(`SELECT name FROM public._partiu_migrations_history WHERE success = true;`);
  const appliedSet = new Set(appliedRows.map((r: any) => r.name));

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    if (appliedSet.has(file)) {
      skippedCount++;
      continue;
    }

    console.log(`\n⏳ Aplicando [${file}]...`);
    const filePath = path.join(migrationsDir, file);
    let sql = fs.readFileSync(filePath, "utf-8");

    // Remove UTF-8 BOM
    sql = sql.replace(/^\uFEFF/, "").trim();

    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO public._partiu_migrations_history (name, success) VALUES ($1, true)
         ON CONFLICT (name) DO UPDATE SET success = true, applied_at = NOW(), error_message = NULL;`,
        [file]
      );
      console.log(`✅ [${file}] APLICADA COM SUCESSO!`);
      successCount++;
    } catch (err: any) {
      console.error(`❌ Erro em [${file}]:`, err.message);
      await client.query(
        `INSERT INTO public._partiu_migrations_history (name, success, error_message) VALUES ($1, false, $2)
         ON CONFLICT (name) DO UPDATE SET success = false, applied_at = NOW(), error_message = $2;`,
        [file, err.message]
      );
      errorCount++;
    }
  }

  // 3. Garantir Realtime em todas as tabelas operacionais
  console.log("\n📡 Configurando publicação supabase_realtime...");
  const realtimeTables = [
    "rides",
    "partiu_corridas",
    "partiu_motoristas",
    "active_drivers",
    "profiles",
    "alertas_sos",
    "app_settings",
    "ride_ratings",
    "support_tickets",
    "driver_subscriptions",
    "banners"
  ];

  for (const table of realtimeTables) {
    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.${table};`);
      console.log(`  ✅ Realtime ativo: ${table}`);
    } catch (rtErr: any) {
      if (rtErr.message.includes("already in publication") || rtErr.message.includes("já existe")) {
        console.log(`  ℹ️ Realtime já ativo: ${table}`);
      } else {
        console.warn(`  ⚠️ Realtime ${table}:`, rtErr.message);
      }
    }
  }

  // 4. Estatísticas finais
  const { rows: tableRows } = await client.query(`
    SELECT count(*)::int as total 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name NOT LIKE '_partiu_%';
  `);

  const { rows: rpcRows } = await client.query(`
    SELECT count(*)::int as total 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public';
  `);

  console.log("\n================================================================================");
  console.log(`📊 STATUS FINAL DO BANCO DE PRODUÇÃO:`);
  console.log(`   - Novas migrations executadas com sucesso: ${successCount}`);
  console.log(`   - Migrations mantidas (já aplicadas): ${skippedCount}`);
  console.log(`   - Falhas restantes: ${errorCount}`);
  console.log(`   - Total de Tabelas Públicas: ${tableRows[0].total}`);
  console.log(`   - Total de Funções / Procedures (RPCs): ${rpcRows[0].total}`);
  console.log("================================================================================");

  await client.end();
}

applyFullSchema().catch(console.error);
