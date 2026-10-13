import fs from "fs";
import path from "path";
import pg from "pg";
import crypto from "crypto";

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

interface AdminUserSeed {
  email: string;
  name: string;
  password: string;
}

const defaultAdminPassword = process.env.SUPERADMIN_DEFAULT_PASSWORD || "AdminPartiu2026!";

const SUPER_ADMINS_TO_PROVISION: AdminUserSeed[] = [
  {
    email: "superadmin@partiu.app",
    name: "Super Administrador Geral",
    password: defaultAdminPassword,
  },
  {
    email: "admin@partiumobe.com.br",
    name: "Administrador Geral (PARTIU MOBE)",
    password: defaultAdminPassword,
  },
  {
    email: "admin@partiu.app",
    name: "Administrador Matriz",
    password: defaultAdminPassword,
  },
  {
    email: "dono@partiu.app",
    name: "Proprietário Plataforma PARTIU",
    password: defaultAdminPassword,
  },
];

async function main() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("⚡ Conectado ao Supabase PostgreSQL para provisionamento do Super Admin...");

  for (const admin of SUPER_ADMINS_TO_PROVISION) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Configurando Super Admin: ${admin.email}...`);

    // 1. Verifica se usuário já existe em auth.users
    const userRes = await client.query("SELECT id FROM auth.users WHERE email = $1;", [admin.email]);
    let userId: string;

    const userMetadata = JSON.stringify({
      sub: "",
      email: admin.email,
      role: "SUPER_ADMIN",
      full_name: admin.name,
      is_super_admin: true,
      email_verified: true,
    });

    if (userRes.rows.length === 0) {
      userId = crypto.randomUUID();
      console.log(`Criando novo usuário ${userId} em auth.users...`);
      const userMetaObj = JSON.parse(userMetadata);
      userMetaObj.sub = userId;

      await client.query(
        `
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          role,
          aud,
          created_at,
          updated_at
        ) VALUES (
          $1::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid,
          $2,
          crypt($3, gen_salt('bf', 10)),
          NOW(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          $4::jsonb,
          'authenticated',
          'authenticated',
          NOW(),
          NOW()
        );
        `,
        [userId, admin.email, admin.password, JSON.stringify(userMetaObj)]
      );
      console.log(`✅ Usuário ${admin.email} criado em auth.users.`);
    } else {
      userId = userRes.rows[0].id;
      console.log(`Atualizando usuário existente ${userId} em auth.users...`);
      const userMetaObj = JSON.parse(userMetadata);
      userMetaObj.sub = userId;

      await client.query(
        `
        UPDATE auth.users
        SET encrypted_password = crypt($2, gen_salt('bf', 10)),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            confirmation_token = '',
            recovery_token = '',
            email_change_token_new = '',
            email_change = '',
            phone_change = '',
            phone_change_token = '',
            reauthentication_token = '',
            raw_user_meta_data = $3::jsonb,
            raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
            role = 'authenticated',
            aud = 'authenticated',
            updated_at = NOW()
        WHERE id = $1::uuid;
        `,
        [userId, admin.password, JSON.stringify(userMetaObj)]
      );
      console.log(`✅ Usuário ${admin.email} atualizado com nova senha.`);
    }

    // 2. Garantir registro em auth.identities
    const identRes = await client.query("SELECT id FROM auth.identities WHERE user_id = $1::uuid;", [userId]);
    const identityData = JSON.stringify({
      sub: userId,
      email: admin.email,
      email_verified: true,
      full_name: admin.name,
      role: "SUPER_ADMIN",
      is_super_admin: true,
    });

    if (identRes.rows.length === 0) {
      await client.query(
        `
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1::uuid,
          $2::jsonb,
          'email',
          $1::text,
          NOW(),
          NOW(),
          NOW()
        );
        `,
        [userId, identityData]
      );
      console.log(`✅ Identidade inserida em auth.identities.`);
    } else {
      await client.query(
        `
        UPDATE auth.identities
        SET identity_data = $2::jsonb,
            updated_at = NOW()
        WHERE user_id = $1::uuid;
        `,
        [userId, identityData]
      );
      console.log(`✅ Identidade atualizada em auth.identities.`);
    }

    // 3. Garantir registro em public.profiles
    const profileRes = await client.query("SELECT id FROM public.profiles WHERE id = $1::uuid;", [userId]);
    if (profileRes.rows.length === 0) {
      await client.query(
        `
        INSERT INTO public.profiles (
          id,
          email,
          full_name,
          role,
          created_at,
          updated_at
        ) VALUES (
          $1::uuid,
          $2,
          $3,
          'superadmin',
          NOW(),
          NOW()
        );
        `,
        [userId, admin.email, admin.name]
      );
      console.log(`✅ Perfil inserido em public.profiles.`);
    } else {
      await client.query(
        `
        UPDATE public.profiles
        SET full_name = $2,
            role = 'superadmin',
            updated_at = NOW()
        WHERE id = $1::uuid;
        `,
        [userId, admin.name]
      );
      console.log(`✅ Perfil atualizado em public.profiles.`);
    }

    // 4. Garantir registro em public.admin_users
    const adminUserRes = await client.query("SELECT id FROM public.admin_users WHERE user_id = $1::uuid OR email = $2;", [userId, admin.email]);
    if (adminUserRes.rows.length === 0) {
      await client.query(
        `
        INSERT INTO public.admin_users (
          id,
          user_id,
          email,
          nome,
          role,
          is_super_admin,
          tenant_id,
          ativo,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          $1::uuid,
          $2,
          $3,
          'super_admin',
          true,
          NULL,
          true,
          NOW(),
          NOW()
        );
        `,
        [userId, admin.email, admin.name]
      );
      console.log(`✅ Registro inserido em public.admin_users.`);
    } else {
      await client.query(
        `
        UPDATE public.admin_users
        SET user_id = $1::uuid,
            email = $2,
            nome = $3,
            role = 'super_admin',
            is_super_admin = true,
            tenant_id = NULL,
            ativo = true,
            updated_at = NOW()
        WHERE id = $4::uuid;
        `,
        [userId, admin.email, admin.name, adminUserRes.rows[0].id]
      );
      console.log(`✅ Registro atualizado em public.admin_users.`);
    }

    // 5. Garantir registro em public.user_roles
    const roleRes = await client.query("SELECT id FROM public.user_roles WHERE user_id = $1::uuid;", [userId]);
    if (roleRes.rows.length === 0) {
      await client.query(
        `
        INSERT INTO public.user_roles (
          id,
          user_id,
          role,
          created_at
        ) VALUES (
          gen_random_uuid(),
          $1::uuid,
          'superadmin',
          NOW()
        );
        `,
        [userId]
      );
      console.log(`✅ Papel inserido em public.user_roles.`);
    } else {
      await client.query(
        `
        UPDATE public.user_roles
        SET role = 'superadmin'
        WHERE user_id = $1::uuid;
        `,
        [userId]
      );
      console.log(`✅ Papel atualizado em public.user_roles.`);
    }
  }

  // 6. Atualizar white_label_tenants para default
  await client.query(`
    UPDATE public.white_label_tenants
    SET admin_email = 'superadmin@partiu.app',
        manager_email = 'admin@partiumobe.com.br',
        admin_password = 'AdminPartiu2026!',
        is_active = true,
        updated_at = NOW()
    WHERE tenant_id = 'default';
  `);
  console.log("\n✅ Tenant 'default' (Matriz Oficial) atualizado em public.white_label_tenants!");

  await client.end();
  console.log("\n🎉 TODAS AS CREDENCIAIS DE SUPER ADMIN FORAM CONFIGURADAS COM SUCESSO!");
}

main().catch((err) => {
  console.error("❌ Erro fatal durante provisionamento:", err);
  process.exit(1);
});
