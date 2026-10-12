import fs from "fs";
import path from "path";
import pg from "pg";
import crypto from "crypto";

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf-8");
  const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
  if (match) connectionString = match[1];
}

async function createFranchisee() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("🚀 Provisionando usuário da Franquia Teste no Supabase Auth...");

  // 1. Adiciona colunas admin_email e admin_password na tabela white_label_tenants se não existirem
  await client.query(`
    ALTER TABLE public.white_label_tenants 
    ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS admin_password VARCHAR(255);
  `);
  console.log("✅ Colunas admin_email e admin_password verificadas em public.white_label_tenants.");

  // 2. Atualiza a Franquia Teste (tenant-bh)
  await client.query(`
    UPDATE public.white_label_tenants
    SET admin_email = 'franquiateste@gmail.com',
        manager_email = 'franquiateste@gmail.com',
        is_active = true,
        updated_at = NOW()
    WHERE tenant_id = 'tenant-bh';
  `);
  console.log("✅ Franquia tenant-bh atualizada com admin_email verificado.");

  // 3. Verifica se o usuário já existe em auth.users
  const email = "franquiateste@gmail.com";
  const password = "123456";

  const existingUserRes = await client.query(`SELECT id FROM auth.users WHERE email = $1;`, [email]);
  let userId = existingUserRes.rows[0]?.id;

  if (!userId) {
    userId = crypto.randomUUID();
    console.log(`Criando novo usuário ${userId} em auth.users...`);
    const userMetadata = JSON.stringify({
      sub: userId,
      email: email,
      role: 'FRANQUEADO',
      full_name: 'Gestor Franquia Teste (BH)',
      tenant_id: 'tenant-bh',
      email_verified: true,
    });
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
        crypt($3, gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        $4::jsonb,
        'authenticated',
        'authenticated',
        NOW(),
        NOW()
      );
      `,
      [userId, email, password, userMetadata]
    );
    console.log("✅ Usuário criado com sucesso em auth.users com senha criptografada via bcrypt!");
  } else {
    console.log(`Atualizando senha do usuário existente ${userId} em auth.users...`);
    const userMetadata = JSON.stringify({
      sub: userId,
      email: email,
      role: 'FRANQUEADO',
      full_name: 'Gestor Franquia Teste (BH)',
      tenant_id: 'tenant-bh',
      email_verified: true,
    });
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
          updated_at = NOW()
      WHERE id = $1::uuid;
      `,
      [userId, password, userMetadata]
    );
    console.log("✅ Senha atualizada em auth.users com bcrypt 10 rounds!");
  }

  // 3.5. Garante registro obrigatório em auth.identities para GoTrue
  const existingIdent = await client.query(
    `SELECT id FROM auth.identities WHERE user_id = $1::uuid;`,
    [userId]
  );
  const identityData = JSON.stringify({
    sub: userId,
    email: email,
    email_verified: true,
    full_name: 'Gestor Franquia Teste (BH)',
    role: 'FRANQUEADO',
    tenant_id: 'tenant-bh',
  });

  if (existingIdent.rows.length === 0) {
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
    console.log("✅ Identidade inserida com sucesso em auth.identities!");
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
    console.log("✅ Identidade sincronizada em auth.identities!");
  }

  // 4. Garante coluna tenant_id e registro em public.profiles
  await client.query(`
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
  `);
  await client.query(`
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      approval_status,
      tenant_id,
      created_at,
      updated_at
    ) VALUES (
      $1::uuid,
      $2,
      'Gestor Franquia Teste (BH)',
      'franqueado',
      'aprovado',
      'tenant-bh',
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      role = 'franqueado',
      approval_status = 'aprovado',
      tenant_id = 'tenant-bh',
      updated_at = NOW();
  `, [userId, email]);
  console.log("✅ Perfil do franqueado sincronizado em public.profiles.");

  // 5. Garante permissão em public.admin_users
  const existingAdmin = await client.query(
    `SELECT id FROM public.admin_users WHERE email = $1 OR user_id = $2::uuid;`,
    [email, userId]
  );
  if (existingAdmin.rows.length > 0) {
    await client.query(
      `
      UPDATE public.admin_users
      SET user_id = $1::uuid,
          nome = 'Gestor Franquia Teste (BH)',
          role = 'franqueado',
          is_super_admin = false,
          tenant_id = 'tenant-bh',
          ativo = true,
          updated_at = NOW()
      WHERE id = $2;
      `,
      [userId, existingAdmin.rows[0].id]
    );
  } else {
    await client.query(
      `
      INSERT INTO public.admin_users (
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
        $1::uuid,
        $2,
        'Gestor Franquia Teste (BH)',
        'franqueado',
        false,
        'tenant-bh',
        true,
        NOW(),
        NOW()
      );
      `,
      [userId, email]
    );
  }
  console.log("✅ Permissão de franqueado associada em public.admin_users.");

  // 6. Teste de validação com crypt
  const testRes = await client.query(
    `SELECT id, email, (encrypted_password = crypt($2, encrypted_password)) as password_matches FROM auth.users WHERE email = $1;`,
    [email, password]
  );
  console.log("\n🔍 Resultado da verificação:", testRes.rows[0]);

  await client.end();
}

createFranchisee().catch(console.error);
