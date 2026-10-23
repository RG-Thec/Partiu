/**
 * ==============================================================================
 * 🧪 ONDA 4 TEST SUITE: SAFETY TOOLKIT (JARVIS 99) & 60 FPS MAP OPTIMIZATION
 * ==============================================================================
 * Certificação técnica dos padrões 99 / Uber no PARTIU:
 * 1. Central de Segurança Pessoal Unificada (Safety Toolkit Service)
 * 2. Gravação de Áudio de Segurança da Corrida com Envelope Criptográfico
 * 3. Ficha Técnica e Síntese Verbal para Atendimento 190 (Polícia Militar)
 * 4. Botão de Emergência SOS Silencioso com Telemetria e Trilha Imutável
 * 5. Gerenciamento de Contatos de Confiança
 * 6. Algoritmo Ramer-Douglas-Peucker (RDP) para Compressão Vetorial de Rotas
 * 7. Filtro Deadband de Jitter de GPS e Suavização Angular de Rotação (Bearing)
 * ==============================================================================
 */

import { describe, test, expect, waitForAllTests } from "./test-harness.mjs";
import {
  simplifyPolyline,
  optimizeRoutePolyline,
  filterGpsJitter,
  calculateBearing,
  smoothBearing,
  haversineDistanceMeters,
} from "../src/lib/geo/polyline-optimizer";
import {
  safetyToolkitService,
} from "../src/lib/security/safety-toolkit-service";
import { AuditTrailService } from "../src/lib/security/audit-trail";

describe("Onda 4 — Polyline Compression & 60 FPS Map Engine (Padrão 99 APK)", () => {
  test("TC-RDP-01: Simplificação RDP reduz densidade de pontos mantendo fidelidade viária", () => {
    // Rota com 11 pontos com micro-jitter realista de GPS e uma curva de 90 graus
    const denseRoute: [number, number][] = [
      [-41.8800, -21.2000],
      [-41.8810, -21.20002],
      [-41.8820, -21.20001],
      [-41.8830, -21.20003],
      [-41.8840, -21.20001],
      [-41.8850, -21.2000], // Ponto de virada acentuada na esquina
      [-41.88501, -21.2050],
      [-41.88502, -21.2070],
      [-41.88501, -21.2090],
      [-41.88502, -21.2110],
      [-41.8850, -21.2150],
    ];

    const result = optimizeRoutePolyline(denseRoute, 0.00005);

    expect(result.originalCount).toBe(11);
    expect(result.simplifiedCount < 11).toBe(true);
    expect(result.reductionRatio >= 0.40).toBe(true); // Redução acima de 40% (chega a 72.7%)

    // Preservação estrita dos pontos inicial e final
    expect(result.coordinates[0][0]).toBe(denseRoute[0][0]);
    expect(result.coordinates[0][1]).toBe(denseRoute[0][1]);
    expect(result.coordinates[result.coordinates.length - 1][0]).toBe(denseRoute[denseRoute.length - 1][0]);
    expect(result.coordinates[result.coordinates.length - 1][1]).toBe(denseRoute[denseRoute.length - 1][1]);

    // Preservação da virada na esquina
    const hasTurnPoint = result.coordinates.some(
      (c) => Math.abs(c[0] - (-41.8850)) < 0.0001 && Math.abs(c[1] - (-21.2000)) < 0.0001
    );
    expect(hasTurnPoint).toBe(true);
  });

  test("TC-RDP-02: Reta perfeita é comprimida para exatamente 2 pontos (Início e Fim)", () => {
    const straightLine: [number, number][] = [
      [-41.880, -21.200],
      [-41.881, -21.200],
      [-41.882, -21.200],
      [-41.883, -21.200],
      [-41.884, -21.200],
      [-41.885, -21.200],
    ];

    const simplified = simplifyPolyline(straightLine, 0.00005);
    expect(simplified.length).toBe(2);
    expect(simplified[0]).toEqual([-41.880, -21.200]);
    expect(simplified[1]).toEqual([-41.885, -21.200]);
  });

  test("TC-MAP-03: Filtro Deadband de GPS amortece micro-jitter (< 2.5m) de veículo parado", () => {
    const basePos: [number, number] = [-41.885000, -21.205000];

    // Jitter de 1 metro (antena oscilando no semáforo)
    const jitterPos: [number, number] = [-41.885008, -21.205005];
    const distJitter = haversineDistanceMeters(basePos, jitterPos);
    expect(distJitter < 2.5).toBe(true);

    const filtered = filterGpsJitter(jitterPos, basePos, 2.5);
    // Deve reter a coordenada anterior para evitar trepidação no mapa
    expect(filtered).toBe(basePos);

    // Movimento real de 10 metros
    const movingPos: [number, number] = [-41.885100, -21.205050];
    const distReal = haversineDistanceMeters(basePos, movingPos);
    expect(distReal >= 2.5).toBe(true);

    const movingFiltered = filterGpsJitter(movingPos, basePos, 2.5);
    expect(movingFiltered).toBe(movingPos);
  });

  test("TC-MAP-04: Suavização de Azimute (Bearing) resolve rotação pelo menor arco angular", () => {
    // Teste de cálculo de azimute Norte (0° ou 360°)
    const northStart: [number, number] = [-41.885, -21.210];
    const northEnd: [number, number] = [-41.885, -21.200];
    const bearingNorth = calculateBearing(northStart, northEnd);
    expect(Math.round(bearingNorth)).toBe(0);

    // Teste de transição pelo limiar 355° -> 5° (menor arco é +10°, não -350°)
    const smoothed = smoothBearing(355, 5, 0.5);
    // 355 + (10 * 0.5) = 360 -> 0°
    expect(Math.round(smoothed)).toBe(0);
  });
});

describe("Onda 4 — Personal Safety Toolkit (Jarvis 99 Standard)", () => {
  test("TC-SFT-01: Ciclo de vida da Gravação de Áudio de Segurança com envelope cifrado", async () => {
    const rideId = "ride-safety-test-01";

    // 1. Início de gravação
    const startResult = await safetyToolkitService.startAudioRecording({
      rideId,
      role: "PASSENGER",
    });

    expect(startResult.success).toBe(true);
    expect(startResult.session?.state).toBe("RECORDING");
    expect(startResult.session?.rideId).toBe(rideId);
    expect(startResult.session?.sessionId.startsWith(`rec_${rideId}`)).toBe(true);

    // Chamada subsequente idempotente
    const active = safetyToolkitService.getActiveAudioSession();
    expect(active?.state).toBe("RECORDING");

    // 2. Parada e selagem de envelope de criptografia
    const stopResult = await safetyToolkitService.stopAudioRecording();
    expect(stopResult).not.toBe(null);
    expect(stopResult?.state).toBe("COMPLETED");
    expect(stopResult?.encryptedEnvelopeId?.startsWith("vault:enc:")).toBe(true);

    // 3. Verificação de registro na trilha de auditoria imutável
    const recentEvents = AuditTrailService.getInstance().getRecentEvents(20);
    const startLog = recentEvents.find(
      (e) => e.action === "SAFETY_AUDIO_RECORDING_STARTED" && e.resource.includes(rideId)
    );
    const stopLog = recentEvents.find(
      (e) => e.action === "SAFETY_AUDIO_RECORDING_STOPPED" && e.resource.includes(rideId)
    );

    expect(Boolean(startLog)).toBe(true);
    expect(Boolean(stopLog)).toBe(true);
  });

  test("TC-SFT-02: Síntese verbal e dados técnicos da Ficha 190 (Polícia Militar)", () => {
    const info = safetyToolkitService.getEmergencyInfo({
      rideId: "ride-pt-998811",
      driverName: "Carlos Alberto",
      vehiclePlate: "RIO-2A19",
      vehicleModel: "Toyota Corolla Prata",
      address: "Av. Pres. Vargas, 1000",
      passengerName: "Mariana Souza",
    });

    expect(info.driverName).toBe("Carlos Alberto");
    expect(info.vehiclePlate).toBe("RIO-2A19");
    expect(info.vehicleModel).toBe("Toyota Corolla Prata");
    expect(info.rideCode).toBe("998811");

    // Validação da fraseologia padronizada para operador 190
    expect(info.formattedVerbalScript).toContain("Toyota Corolla Prata");
    expect(info.formattedVerbalScript).toContain("RIO-2A19");
    expect(info.formattedVerbalScript).toContain("Carlos Alberto");
    expect(info.formattedVerbalScript).toContain("Av. Pres. Vargas, 1000");
  });

  test("TC-SFT-03: Disparo de Alerta SOS Silencioso prioritário e telemetria operacional", async () => {
    const sosResult = await safetyToolkitService.dispatchSilentSos({
      rideId: "ride-sos-4422",
      role: "DRIVER",
      reason: "Suspeita de tentativa de assalto em semáforo",
      coordinates: { lat: -21.205123, lng: -41.885456 },
      requesterName: "João Motorista",
      requesterPhone: "+558299887766",
    });

    expect(sosResult.success).toBe(true);
    expect(sosResult.alertId.startsWith("SOS-")).toBe(true);

    // Verifica presença na trilha de auditoria imutável
    const recentEvents = AuditTrailService.getInstance().getRecentEvents(20);
    const sosAudit = recentEvents.find(
      (e) => e.action === "SAFETY_SILENT_SOS_DISPATCHED" && e.details?.alertId === sosResult.alertId
    );

    expect(Boolean(sosAudit)).toBe(true);
    expect(sosAudit?.status).toBe("ALERT");
    expect(sosAudit?.details?.role).toBe("DRIVER");
  });

  test("TC-SFT-04: Compartilhamento Siga Minha Viagem gera link e mensagem válidos", () => {
    const payload = safetyToolkitService.buildShareTrackingMessage({
      rideId: "ride-share-8833",
      origin: "Terminal Rodoviário",
      destination: "Shopping Center",
      driverName: "Ana Paula",
      vehiclePlate: "MOB-8833",
      passengerName: "Lucas",
    });

    expect(payload.trackingToken.startsWith("TRK-")).toBe(true);
    expect(payload.shareUrl).toContain(`/rastreio/${payload.trackingToken}`);
    expect(payload.shareMessage).toContain("Acompanhe meu trajeto em tempo real");
    expect(payload.shareMessage).toContain(payload.shareUrl);
  });

  test("TC-SFT-05: Gestão de Contatos de Confiança com persistência", () => {
    const novoContato = safetyToolkitService.addTrustedContact({
      name: "Maria de Fátima",
      phone: "+558299112233",
      relation: "Mãe",
    });

    expect(novoContato.id.startsWith("cnt_")).toBe(true);
    expect(novoContato.name).toBe("Maria de Fátima");

    const contatos = safetyToolkitService.getTrustedContacts();
    const encontrado = contatos.find((c) => c.id === novoContato.id);
    expect(Boolean(encontrado)).toBe(true);

    // Remoção do contato
    const removido = safetyToolkitService.removeTrustedContact(novoContato.id);
    expect(removido).toBe(true);

    const contatosAposRemover = safetyToolkitService.getTrustedContacts();
    expect(contatosAposRemover.some((c) => c.id === novoContato.id)).toBe(false);
  });
});

if (process.argv[1] && process.argv[1].includes("onda4")) {
  void (async () => {
    await waitForAllTests();
    setTimeout(() => {
      process.exit(0);
    }, 100);
  })();
}
