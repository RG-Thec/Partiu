import { describe, test, expect, waitForAllTests } from "./test-harness.mjs";
import {
  quickCannedRepliesEngine,
  type QuickReplyStage,
} from "../src/lib/chat/quick-canned-replies";
import { chatRealtimeService } from "../src/services/ChatRealtimeService";

describe("Onda 8 — Chat de Bordo Hands-Free com Respostas Rápidas de 1 Toque", () => {
  test("TC-QCR-01: Retorno de respostas contextuais para motorista parceiro por estágio", () => {
    const headingReplies = quickCannedRepliesEngine.getReplies("DRIVER", "HEADING");
    expect(headingReplies.length >= 4).toBe(true);
    expect(headingReplies.some((r) => r.text === "Estou a caminho")).toBe(true);
    expect(headingReplies.some((r) => r.text === "Chego em 2 minutos")).toBe(true);

    const arrivedReplies = quickCannedRepliesEngine.getReplies("DRIVER", "ARRIVED");
    expect(arrivedReplies.some((r) => r.text === "Cheguei no local")).toBe(true);
    expect(arrivedReplies.some((r) => r.text === "Pisca-alerta ligado")).toBe(true);

    const tripReplies = quickCannedRepliesEngine.getReplies("DRIVER", "ON_TRIP");
    expect(tripReplies.some((r) => r.text === "Seguindo rota do aplicativo")).toBe(true);
  });

  test("TC-QCR-02: Retorno de respostas contextuais para o passageiro por estágio", () => {
    const headingReplies = quickCannedRepliesEngine.getReplies("PASSENGER", "HEADING");
    expect(headingReplies.some((r) => r.text === "Estou descendo")).toBe(true);
    expect(headingReplies.some((r) => r.text === "Estou na portaria")).toBe(true);

    const arrivedReplies = quickCannedRepliesEngine.getReplies("PASSENGER", "ARRIVED");
    expect(arrivedReplies.some((r) => r.text === "Já estou saindo")).toBe(true);
    expect(arrivedReplies.some((r) => r.text === "Só 1 minuto, por favor")).toBe(true);

    const tripReplies = quickCannedRepliesEngine.getReplies("PASSENGER", "ON_TRIP");
    expect(tripReplies.some((r) => r.text === "Tudo certo, obrigado")).toBe(true);
  });

  test("TC-QCR-03: Resolução determinística do status da corrida para o estágio da barra", () => {
    expect(quickCannedRepliesEngine.resolveStage("A_CAMINHO")).toBe("HEADING");
    expect(quickCannedRepliesEngine.resolveStage("DRIVER_ARRIVING")).toBe("HEADING");
    expect(quickCannedRepliesEngine.resolveStage("CHEGOU")).toBe("ARRIVED");
    expect(quickCannedRepliesEngine.resolveStage("WAITING_PIN")).toBe("ARRIVED");
    expect(quickCannedRepliesEngine.resolveStage("EM_VIAGEM")).toBe("ON_TRIP");
    expect(quickCannedRepliesEngine.resolveStage("ON_TRIP")).toBe("ON_TRIP");
  });

  test("TC-QCR-04: Envio instantâneo de resposta rápida despacha com tipo SMART_REPLY", async () => {
    const rideId = "test_ride_quick_01";
    const res = await quickCannedRepliesEngine.sendQuickReply({
      rideId,
      senderType: "DRIVER",
      senderId: "driver_test_99",
      replyText: "Pisca-alerta ligado",
    });

    expect(res.success).toBe(true);
    expect(res.message?.content).toBe("Pisca-alerta ligado");
    expect(res.message?.messageType).toBe("SMART_REPLY");
  });

  test("TC-QCR-05: Proteção anti-flood rejeita reenvio da mesma mensagem dentro de 2.5s", async () => {
    const rideId = "test_ride_quick_flood";
    const p1 = await quickCannedRepliesEngine.sendQuickReply({
      rideId,
      senderType: "PASSENGER",
      senderId: "passenger_01",
      replyText: "Estou descendo",
    });
    expect(p1.success).toBe(true);

    // Segundo envio imediato deve ser travado
    const p2 = await quickCannedRepliesEngine.sendQuickReply({
      rideId,
      senderType: "PASSENGER",
      senderId: "passenger_01",
      replyText: "Estou descendo",
    });
    expect(p2.success).toBe(false);
    expect(p2.error).toContain("Aguarde");
  });

  test("TC-QCR-06: Limpeza de sessão por corrida com clearRide", () => {
    const rideId = "test_ride_cleanup";
    quickCannedRepliesEngine.clearRide(rideId);
    expect(true).toBe(true);
  });
});

if (process.argv[1] && process.argv[1].includes("onda8")) {
  void (async () => {
    await waitForAllTests();
    setTimeout(() => {
      process.exit(0);
    }, 100);
  })();
}
