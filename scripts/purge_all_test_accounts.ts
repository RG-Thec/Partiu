import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(process.cwd(), ".env");
const envText = fs.readFileSync(envPath, "utf8");

const env: Record<string, string> = {};
envText.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      let val = trimmed.slice(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      env[trimmed.slice(0, idx).trim()] = val;
    }
  }
});

const client = new Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const PRESERVED_ADMIN_EMAILS = [
  "superadmin@partiu.app",
  "admin@partiumobe.com.br",
  "admin@partiu.app",
  "dono@partiu.app",
];

async function safeDelete(table: string, condition: string = "", params: any[] = []) {
  try {
    const check = await client.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
      [table],
    );
    if (check.rows.length === 0) return 0;
    const q = condition
      ? `DELETE FROM public."${table}" WHERE ${condition}`
      : `DELETE FROM public."${table}"`;
    const res = await client.query(q, params);
    console.log(`Deleted ${res.rowCount} rows from public."${table}"`);
    return res.rowCount;
  } catch (err: any) {
    console.warn(`Could not delete from public."${table}":`, err.message);
    return 0;
  }
}

async function purge() {
  await client.connect();
  console.log("Connected to PostgreSQL for total cleanup...");

  // 1. Limpa tabelas de corridas e ofertas de teste
  await safeDelete("partiu_corridas");
  await safeDelete("rides");
  await safeDelete("partiu_trip_offers");
  await safeDelete("partiu_driver_status");

  // 2. Limpa tabelas de passageiros e motoristas
  await safeDelete("partiu_passageiros");
  await safeDelete("partiu_motoristas");
  await safeDelete("partiu_enderecos_passageiro");
  await safeDelete("passenger_destinations");

  // 3. Limpa assinaturas e cobranças de motoristas
  await safeDelete("subscription_events");
  await safeDelete("driver_subscriptions");
  await safeDelete("driver_billing");
  await safeDelete("driver_wallets");

  // 4. Limpa profiles mantendo apenas os admins do sistema
  const delProfiles = await client.query(
    `DELETE FROM public.profiles 
     WHERE email NOT IN ($1, $2, $3, $4)
        OR email IS NULL`,
    PRESERVED_ADMIN_EMAILS,
  );
  console.log(`Deleted ${delProfiles.rowCount} test profiles from public.profiles`);

  // 5. Limpa auth.users mantendo apenas os admins do sistema
  const delAuth = await client.query(
    `DELETE FROM auth.users 
     WHERE email NOT IN ($1, $2, $3, $4)
        OR email IS NULL`,
    PRESERVED_ADMIN_EMAILS,
  );
  console.log(`Deleted ${delAuth.rowCount} test users from auth.users`);

  console.log("\n✅ Limpeza completa concluída com sucesso no PostgreSQL!");

  // Conferência final
  const remainingUsers = await client.query("SELECT id, email, created_at FROM auth.users");
  console.log("\nUsuários remanescentes no banco (apenas Admins):");
  remainingUsers.rows.forEach((u) => console.log(`- ${u.email} (${u.id})`));

  const remainingProfiles = await client.query(
    "SELECT id, email, full_name, role FROM public.profiles",
  );
  console.log("\nPerfis remanescentes no banco:");
  remainingProfiles.rows.forEach((p) =>
    console.log(`- ${p.email} | ${p.full_name} | Role: ${p.role}`),
  );

  await client.end();
}

purge().catch((e) => {
  console.error(e);
  process.exit(1);
});
