/**
 * SUITE: 47. DRIVER CPF STRICT VALIDATION, SINGLE ACCOUNT BINDING & IMMUTABLE LEGAL NAME
 * 
 * Invariantes Testadas:
 * 1. Algoritmo oficial da Receita Federal: validação de 11 dígitos, rejeição de repetições e checagem de dígitos verificadores.
 * 2. Bloqueio de cadastro de motorista com CPF inválido.
 * 3. Bloqueio estrito de duplicidade: cada CPF só pode criar 1 única conta no sistema.
 * 4. Imutabilidade do nome oficial do motorista vinculado ao CPF (proibição de alteração pós-cadastro).
 */

import { describe, test, expect } from "./test-harness.mjs";
import { validarCpf, sanitizarCpf, formatarCpf } from "../src/lib/validation/cpf-validator";
import { driverFleetService } from "../src/lib/ecosystem/driver-fleet-service";
import { supabaseAuthService } from "../src/lib/auth/supabase-auth-service";
import { userService } from "../src/services/userService";

describe("47. DRIVER CPF STRICT VALIDATION, SINGLE ACCOUNT BINDING & IMMUTABLE LEGAL NAME", () => {
  // CPFs matematicamente válidos segundo o algoritmo da Receita Federal
  const VALID_CPF_1 = "52998224725"; // 529.982.247-25
  const VALID_CPF_2 = "12345678909"; // 123.456.789-09

  test("1. Validação Sintática e Algorítmica de CPF (Receita Federal)", () => {
    // CPFs vazios ou incompletos
    expect(validarCpf("")).toBe(false);
    expect(validarCpf("123")).toBe(false);
    expect(validarCpf("1234567890")).toBe(false);

    // CPFs com todos os dígitos iguais (proibidos pela Receita)
    expect(validarCpf("00000000000")).toBe(false);
    expect(validarCpf("11111111111")).toBe(false);
    expect(validarCpf("99999999999")).toBe(false);

    // CPFs com dígitos verificadores matematicamente incorretos
    expect(validarCpf("12345678911")).toBe(false);
    expect(validarCpf("12345678900")).toBe(false);

    // CPFs válidos (com e sem pontuação)
    expect(validarCpf(VALID_CPF_1)).toBe(true);
    expect(validarCpf("529.982.247-25")).toBe(true);
    expect(validarCpf(VALID_CPF_2)).toBe(true);
    expect(validarCpf("123.456.789-09")).toBe(true);

    // Formatação e sanitização
    expect(formatarCpf(VALID_CPF_1)).toBe("529.982.247-25");
    expect(sanitizarCpf("529.982.247-25")).toBe(VALID_CPF_1);
  });

  test("2. Bloqueio de Cadastro com CPF Inválido no DriverFleetService", async () => {
    let capturedError: any = null;
    try {
      await driverFleetService.registerDriver({
        name: "Carlos Teste",
        phone: "(22) 99876-1122",
        cpf: "111.111.111-11", // Inválido (dígitos repetidos)
        vehicle_type: "CARRO",
        vehicle_plate: "TST-1A23",
      });
    } catch (err: any) {
      capturedError = err;
    }

    expect(capturedError !== null).toBe(true);
    expect(capturedError.message).toContain("INVALID_CPF");
  });

  test("3. Unicidade Estrita por CPF: Cada CPF Pode Criar Apenas 1 Conta de Motorista", async () => {
    // 1º Cadastro com CPF Válido -> Sucesso
    const motorista1 = await driverFleetService.registerDriver({
      name: "João da Silva Sauro",
      phone: "(22) 99876-5544",
      cpf: VALID_CPF_1,
      vehicle_type: "CARRO",
      vehicle_plate: "RIO-1A99",
      tenant_id: "praca_maceio_al",
    });

    expect(motorista1.id).toBeDefined();
    expect(motorista1.cpf).toBe(VALID_CPF_1);

    // 2º Cadastro com o MESMO CPF -> Rejeição imediata por duplicidade
    let duplicateError: any = null;
    try {
      await driverFleetService.registerDriver({
        name: "Outro Nome Mesmo CPF",
        phone: "(22) 98888-7777",
        cpf: "529.982.247-25", // Mesmo CPF 1 formatado
        vehicle_type: "MOTO",
        vehicle_plate: "MOT-9988",
        tenant_id: "praca_maceio_al",
      });
    } catch (err: any) {
      duplicateError = err;
    }

    expect(duplicateError !== null).toBe(true);
    expect(duplicateError.message).toContain("CPF_ALREADY_REGISTERED");
  });

  test("4. Proibição de Alteração do Nome Oficial do Motorista após o Cadastro", async () => {
    const nomeOriginal = "Marcos Aurélio Silveira";

    // Simula sessão de condutor autenticado
    const driverSession = {
      id: "drv_audit_immutable",
      name: nomeOriginal,
      email: "marcos@partiu.com",
      phone: "(22) 99123-4567",
      cpf: VALID_CPF_2,
      role: "MOTORISTA" as const,
      createdAt: Date.now(),
    };
    supabaseAuthService.saveStoredSession(driverSession, "default");

    // Tentativa de alterar o nome do condutor via updateUserProfile
    const res = await userService.updateUserProfile({
      name: "Nome Falso Malicioso",
      phone: "(22) 99123-9999",
      avatarUrl: "https://example.com/new.png",
    });

    expect(res.success).toBe(true);

    // A sessão deve manter estritamente o nome original do documento
    const sessAtualizada = supabaseAuthService.getStoredSession("default");
    expect(sessAtualizada?.name).toBe(nomeOriginal);
    expect(sessAtualizada?.phone).toBe("(22) 99123-9999");
  });
});
