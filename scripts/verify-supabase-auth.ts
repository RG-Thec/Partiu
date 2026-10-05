import { supabaseAuthService } from "../src/lib/auth/supabase-auth-service";
import pg from "pg";

const { Client } = pg;
const pgClient = new Client({
  connectionString: "postgresql://postgres:Presbitero%402026@db.wlmnwazdntayhrsndfor.supabase.co:5432/postgres"
});

async function run() {
  await pgClient.connect();
  console.log("--- TESTE COMPLETO DE AUDITORIA: CADASTRO PASSAGEIRO E MOTORISTA ---");

  const paxEmail = `pax_audit_${Date.now()}@partiu.com.br`;
  const drvEmail = `drv_audit_${Date.now()}@partiu.com.br`;

  // 1. Cadastro Passageiro
  console.log("\n1. Testando cadastro real de PASSAGEIRO...");
  const paxRes = await supabaseAuthService.signUpPassenger({
    name: "Passageiro Teste Auditoria",
    email: paxEmail,
    phone: "(82) 99123-4567",
    cpf: "123.456.789-10",
    password: "senhaSegura123"
  });

  console.log("Resultado cadastro passageiro:", paxRes.success ? "SUCESSO!" : "FALHA: " + paxRes.error);
  if (!paxRes.success) throw new Error(paxRes.error);

  // 2. Cadastro Motorista
  console.log("\n2. Testando cadastro real de MOTORISTA...");
  const drvRes = await supabaseAuthService.signUpDriver({
    name: "Motorista Teste Auditoria",
    email: drvEmail,
    phone: "(82) 99765-4321",
    cpf: "987.654.321-99",
    password: "senhaSegura456",
    vehicleType: "carro",
    vehicleModel: "Fiat Cronos Drive",
    vehiclePlate: "BRA9E22",
    vehicleYear: "2023",
    vehicleColor: "Prata",
    cnh: "12345678901",
    cnhCategory: "B",
    hasEar: true,
    pixKey: "98765432199",
    pixKeyType: "cpf"
  });

  console.log("Resultado cadastro motorista:", drvRes.success ? "SUCESSO!" : "FALHA: " + drvRes.error);
  if (!drvRes.success) throw new Error(drvRes.error);

  // 3. Login Passageiro
  console.log("\n3. Testando Login com e-mail e senha do PASSAGEIRO recém-criado...");
  const loginPax = await supabaseAuthService.signInWithEmail({
    email: paxEmail,
    senha: "senhaSegura123",
    role: "PASSAGEIRO"
  });
  console.log("Login passageiro:", loginPax.success ? "SUCESSO!" : "FALHA: " + loginPax.error);
  console.log("Passageiro ID:", loginPax.user?.id, "Role:", loginPax.user?.role);

  // 4. Login Motorista
  console.log("\n4. Testando Login com e-mail e senha do MOTORISTA recém-criado...");
  const loginDrv = await supabaseAuthService.signInWithEmail({
    email: drvEmail,
    senha: "senhaSegura456",
    role: "MOTORISTA"
  });
  console.log("Login motorista:", loginDrv.success ? "SUCESSO!" : "FALHA: " + loginDrv.error);
  console.log("Motorista ID:", loginDrv.user?.id, "Role:", loginDrv.user?.role, "Status aprovação:", loginDrv.user?.driverApprovalStatus);

  // 5. Verificar persistência nas tabelas do PostgreSQL
  const dbPax = await pgClient.query("SELECT * FROM public.partiu_passageiros WHERE email = $1", [paxEmail]);
  console.log("\n5. Linha em public.partiu_passageiros:", dbPax.rows.length === 1 ? "EXISTE E CONFIRMADO!" : "NÃO ENCONTRADO!");

  const dbDrv = await pgClient.query("SELECT * FROM public.partiu_motoristas WHERE email = $1", [drvEmail]);
  console.log("Linha em public.partiu_motoristas:", dbDrv.rows.length === 1 ? "EXISTE E CONFIRMADO!" : "NÃO ENCONTRADO!");

  const dbProfiles = await pgClient.query("SELECT id, full_name, role, approval_status FROM public.profiles WHERE email IN ($1, $2)", [paxEmail, drvEmail]);
  console.log("Perfis em public.profiles:", dbProfiles.rows);

  // Limpeza após teste de sucesso
  console.log("\nLimpando registros de teste...");
  await pgClient.query("DELETE FROM public.partiu_passageiros WHERE email = $1", [paxEmail]);
  await pgClient.query("DELETE FROM public.partiu_motoristas WHERE email = $1", [drvEmail]);
  await pgClient.query("DELETE FROM public.profiles WHERE email IN ($1, $2)", [paxEmail, drvEmail]);
  await pgClient.query("DELETE FROM auth.users WHERE email IN ($1, $2)", [paxEmail, drvEmail]);
  console.log("Limpeza concluída com sucesso!");

  await pgClient.end();
}

run().catch(err => {
  console.error("Erro na auditoria:", err);
  process.exit(1);
});
