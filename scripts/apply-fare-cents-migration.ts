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
  console.error("❌ Defina DATABASE_URL no arquivo .env");
  process.exit(1);
}

async function runMigration() {
  console.log("🚀 Executando migração 20261011_sync_rides_fare_cents.sql...");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  try {
    await client.connect();
    console.log("✅ Conectado ao PostgreSQL com sucesso!");

    const sqlPath = path.resolve(process.cwd(), "supabase/migrations/20261011_sync_rides_fare_cents.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    await client.query(sql);
    console.log("✅ Migração executada com sucesso!");

    // Verificação forense
    const checkRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'rides' 
        AND column_name = 'fare_cents';
    `);

    if (checkRes.rows.length > 0) {
      console.log(`✅ Coluna public.rides.fare_cents verificada: tipo ${checkRes.rows[0].data_type}`);
    } else {
      console.warn("⚠️ Coluna fare_cents não encontrada após a migração.");
    }

    const triggerRes = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE event_object_table = 'rides' 
        AND trigger_name = 'trg_sync_rides_fare_cents';
    `);

    if (triggerRes.rows.length > 0) {
      console.log(`✅ Trigger ${triggerRes.rows[0].trigger_name} instalado e ativo!`);
    } else {
      console.warn("⚠️ Trigger não encontrado após a migração.");
    }
  } catch (err: any) {
    console.error("❌ Erro durante a migração:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
