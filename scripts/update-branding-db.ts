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

async function main() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("⚡ Conectado ao Supabase PostgreSQL...");

  const updateBrandingSql = `
    UPDATE public.app_branding
    SET 
      app_name = 'PARTIU',
      company_name = 'PARTIU Mobilidade Urbana',
      primary_color = '#FF6B00',
      secondary_color = '#FFB800',
      accent_color = '#FFD54F',
      background_color = '#F8FAFC',
      surface_color = '#FFFFFF',
      text_primary = '#090D16',
      text_secondary = '#64748B',
      header_gradient_start = '#FF6B00',
      header_gradient_end = '#FFB800',
      footer_sync_with_header = true,
      footer_gradient_start = '#FF6B00',
      footer_gradient_end = '#FFB800',
      border_radius = '16px',
      font_family = 'Plus Jakarta Sans',
      updated_at = NOW()
    WHERE tenant_id = 'default';
  `;
  await client.query(updateBrandingSql);
  console.log("✅ Updated app_branding for default to official #FF6B00");

  const wlRes = await client.query("SELECT design_system, full_snapshot FROM public.white_label_tenant_configs WHERE tenant_id = 'default'");
  if (wlRes.rows.length > 0) {
    const row = wlRes.rows[0];
    const ds = row.design_system || {};
    if (!ds.paletaPrimaria) ds.paletaPrimaria = {};
    ds.paletaPrimaria.corPrincipal = "#FF6B00";
    ds.paletaPrimaria.corSecundaria = "#FFB800";

    const snap = row.full_snapshot || {};
    if (!snap.designSystem) snap.designSystem = {};
    if (!snap.designSystem.paletaPrimaria) snap.designSystem.paletaPrimaria = {};
    snap.designSystem.paletaPrimaria.corPrincipal = "#FF6B00";
    snap.designSystem.paletaPrimaria.corSecundaria = "#FFB800";

    await client.query(
      "UPDATE public.white_label_tenant_configs SET design_system = $1, full_snapshot = $2, updated_at = NOW() WHERE tenant_id = 'default'",
      [JSON.stringify(ds), JSON.stringify(snap)]
    );
    console.log("✅ Updated white_label_tenant_configs for default to official #FF6B00");
  }

  const res1 = await client.query("SELECT tenant_id, app_name, primary_color, secondary_color FROM public.app_branding WHERE tenant_id = 'default'");
  console.log("Verified app_branding:", res1.rows);

  const res2 = await client.query("SELECT tenant_id, (design_system->'paletaPrimaria'->>'corPrincipal') as cor FROM public.white_label_tenant_configs WHERE tenant_id = 'default'");
  console.log("Verified white_label_tenant_configs:", res2.rows);

  await client.end();
  console.log("🚀 Sincronização de banco concluída!");
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
