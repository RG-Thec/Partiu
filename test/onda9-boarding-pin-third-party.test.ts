import { describe, test, expect, waitForAllTests } from "./test-harness.mjs";
import {
  boardingPinEngine,
  type BoardingPinVerificationResult,
} from "../src/lib/security/boarding-pin-engine";
import {
  rideForThirdPartyEngine,
  type ThirdPartyRiderValidation,
} from "../src/lib/passenger/ride-for-third-party-engine";
import { criarNovaCorrida } from "../src/lib/partiu-engine";
import { extrairOfertaDeCorrida } from "../src/routes/app.motorista";

describe("Onda 9 — Código PIN de Embarque & Corridas para Terceiros", () => {
  // ============================================================================
  // PARTE 1: BOARDING PIN ENGINE (OTP DE SEGURANÇA 4 DÍGITOS)
  // ============================================================================
  test("TC-PIN-01: Geração criptográfica de PIN com 4 dígitos numéricos (1000 - 9999)", () => {
    for (let i = 0; i < 20; i++) {
      const pin = boardingPinEngine.generateBoardingPin();
      expect(typeof pin).toBe("string");
      expect(pin.length).toBe(4);
      expect(/^\d{4}$/.test(pin)).toBe(true);
      const num = parseInt(pin, 10);
      expect(num >= 1000 && num <= 9999).toBe(true);
    }
  });

  test("TC-PIN-02: Política de ativação inteligente de PIN (Noturno, Terceiros, Preferência)", () => {
    // Horário diurno sem outros gatilhos -> Não exige
    expect(boardingPinEngine.shouldRequirePin({ currentHour: 14 })).toBe(false);

    // Horário noturno (22h às 05h) -> Exige automaticamente
    expect(boardingPinEngine.shouldRequirePin({ currentHour: 23 })).toBe(true);
    expect(boardingPinEngine.shouldRequirePin({ currentHour: 2 })).toBe(true);
    expect(boardingPinEngine.shouldRequirePin({ isNightTime: true })).toBe(true);

    // Corrida para terceiros -> Exige sempre
    expect(boardingPinEngine.shouldRequirePin({ isForOtherPerson: true, currentHour: 14 })).toBe(true);

    // Preferência explícita do usuário -> Exige sempre
    expect(boardingPinEngine.shouldRequirePin({ userPinPreference: true, currentHour: 10 })).toBe(true);

    // Área de alto risco
    expect(boardingPinEngine.shouldRequirePin({ highRiskZone: true, currentHour: 12 })).toBe(true);
  });

  test("TC-PIN-03: Validação positiva de PIN correto", () => {
    const rideId = "ride_pin_test_ok";
    boardingPinEngine.resetAttempts(rideId);

    const res = boardingPinEngine.verifyBoardingPin(rideId, "4829", "4829");
    expect(res.success).toBe(true);
    expect(res.isLocked).toBe(false);
    expect(res.remainingAttempts).toBe(3);
  });

  test("TC-PIN-04: Rejeição de PIN incorreto e decremento de tentativas", () => {
    const rideId = "ride_pin_test_fail";
    boardingPinEngine.resetAttempts(rideId);

    // 1ª tentativa incorreta
    const res1 = boardingPinEngine.verifyBoardingPin(rideId, "1111", "4829");
    expect(res1.success).toBe(false);
    expect(res1.isLocked).toBe(false);
    expect(res1.remainingAttempts).toBe(2);

    // 2ª tentativa incorreta
    const res2 = boardingPinEngine.verifyBoardingPin(rideId, "2222", "4829");
    expect(res2.success).toBe(false);
    expect(res2.isLocked).toBe(false);
    expect(res2.remainingAttempts).toBe(1);

    // 3ª tentativa incorreta -> Dispara bloqueio temporário por força bruta
    const res3 = boardingPinEngine.verifyBoardingPin(rideId, "3333", "4829");
    expect(res3.success).toBe(false);
    expect(res3.isLocked).toBe(true);
    expect(res3.remainingAttempts).toBe(0);
    expect(typeof res3.remainingSeconds).toBe("number");
    expect(res3.remainingSeconds! > 0).toBe(true);

    // 4ª tentativa durante o bloqueio -> Bloqueado imediatamente sem checar dígitos
    const res4 = boardingPinEngine.verifyBoardingPin(rideId, "4829", "4829");
    expect(res4.success).toBe(false);
    expect(res4.isLocked).toBe(true);

    // Limpeza / reset
    boardingPinEngine.resetAttempts(rideId);
    expect(boardingPinEngine.isLocked(rideId).isLocked).toBe(false);
  });

  // ============================================================================
  // PARTE 2: RIDE FOR THIRD PARTY ENGINE (CORRIDAS PARA AMIGOS OU FAMILIARES)
  // ============================================================================
  test("TC-3RD-01: Validação e normalização de dados do passageiro terceiro", () => {
    // Nome muito curto
    const invalidName = rideForThirdPartyEngine.validateGuestRider("Jo", "82998765432");
    expect(invalidName.isValid).toBe(false);

    // Telefone com dígitos insuficientes
    const invalidPhone = rideForThirdPartyEngine.validateGuestRider("Maria Silva", "12345");
    expect(invalidPhone.isValid).toBe(false);

    // Celular brasileiro com DDD e 9 dígitos (11 dígitos)
    const valid11 = rideForThirdPartyEngine.validateGuestRider("Maria Silva", "82998765432");
    expect(valid11.isValid).toBe(true);
    expect(valid11.normalizedPhone).toBe("(82) 99876-5432");
    expect(valid11.e164Phone).toBe("5582998765432");

    // Telefone com formatação suja e pontuação
    const validDirty = rideForThirdPartyEngine.validateGuestRider("Lucas Santos", "(82) 9.9123-4567");
    expect(validDirty.isValid).toBe(true);
    expect(validDirty.normalizedPhone).toBe("(82) 99123-4567");
    expect(validDirty.e164Phone).toBe("5582991234567");
  });

  test("TC-3RD-02: Construção de mensagem estruturada e link de WhatsApp com PIN e rastreio", () => {
    const share = rideForThirdPartyEngine.buildThirdPartyWhatsAppShare({
      guestName: "Fernanda Costa",
      guestPhone: "82998765432",
      bookerName: "Carlos Eduardo",
      driverName: "Roberto Alencar",
      driverRating: 4.97,
      vehicleModel: "Chevrolet Onix",
      vehiclePlate: "ABC-1D23",
      vehicleColor: "Prata",
      pickupAddress: "Av. Fernandes Lima, 1200",
      boardingPin: "8492",
      trackingToken: "trk_live_token_77",
      appName: "PARTIU",
    });

    expect(share.shareText.includes("Fernanda Costa")).toBe(true);
    expect(share.shareText.includes("Carlos Eduardo")).toBe(true);
    expect(share.shareText.includes("Roberto Alencar")).toBe(true);
    expect(share.shareText.includes("Chevrolet Onix")).toBe(true);
    expect(share.shareText.includes("ABC-1D23")).toBe(true);
    expect(share.shareText.includes("8492")).toBe(true);
    expect(share.shareText.includes("trk_live_token_77")).toBe(true);
    expect(share.whatsappUrl.startsWith("https://api.whatsapp.com/send?phone=5582998765432")).toBe(true);
  });

  // ============================================================================
  // PARTE 3: INTEGRAÇÃO COM DISPATCH E DRIVER COCKPIT
  // ============================================================================
  test("TC-INT-01: Criação de corrida para terceiros ativa PIN obrigatório e propaga metadados", () => {
    const corrida = criarNovaCorrida({
      origem: "Rua das Flores, 50",
      destino: "Shopping Pátio Maceió",
      modalidade: "POP",
      valor: 25.5,
      distanciaKm: 8.4,
      duracaoMin: 18,
      formaPagamento: "pix",
      passageiroNome: "Beatriz Lima",
      passageiroTelefone: "82991112233",
      isForOtherPerson: true,
      otherPersonName: "Beatriz Lima",
      otherPersonPhone: "(82) 99111-2233",
      solicitanteNome: "Rodrigo Silva",
      solicitanteTelefone: "(82) 98888-7777",
    });

    expect(corrida.isForOtherPerson).toBe(true);
    expect(corrida.otherPersonName).toBe("Beatriz Lima");
    expect(corrida.solicitanteNome).toBe("Rodrigo Silva");
    expect(corrida.exigePinEmbarque).toBe(true);
    expect(corrida.pin.length).toBe(4);
  });

  test("TC-INT-02: extrairOfertaDeCorrida projeta visualização correta para o Cockpit do Motorista", () => {
    const corrida = criarNovaCorrida({
      origem: "Praça Centenário",
      destino: "Orla de Ponta Verde",
      modalidade: "POP",
      valor: 18.0,
      distanciaKm: 5.0,
      duracaoMin: 12,
      formaPagamento: "pix",
      passageiroNome: "Maria Santos",
      passageiroTelefone: "82993334444",
      isForOtherPerson: true,
      otherPersonName: "Maria Santos",
      otherPersonPhone: "(82) 99333-4444",
      solicitanteNome: "Lucas Titular",
      solicitanteTelefone: "(82) 99222-1111",
    });

    const oferta = extrairOfertaDeCorrida(corrida, "PARTIU");
    expect(oferta.isForOtherPerson).toBe(true);
    expect(oferta.passageiro).toBe("Maria Santos (Pedido por Lucas Titular)");
    expect(oferta.telefone).toBe("(82) 99333-4444");
    expect(oferta.exigePinEmbarque).toBe(true);
    expect(oferta.pinCorreto).toBe(corrida.pin);
  });
});
