/**
 * ==============================================================================
 * 🧪 ONDA 6 TEST SUITE: MULTI-STOP WAYPOINTS & SMART GREEN PICKUP ENGINE
 * ==============================================================================
 * Certificação técnica dos módulos de conveniência urbana:
 * 1. Múltiplas Paradas Intermediárias (Waypoints) com avanço sequencial
 * 2. Cálculo financeiro da sobretaxa de paradas (R$ 2,50/parada)
 * 3. Resolução dinâmica de alvo de navegação externa (Waze/Google Maps) por parada
 * 4. Pulo de parada (skip stop) e conclusão com auditoria imutável
 * 5. Pontos Verdes de Encontro Inteligentes (Snap-to-Pin) com cálculo de caminhada
 * 6. Geração de ponto de calçada seguro e economia de retorno para o condutor
 * ==============================================================================
 */

import { describe, test, expect, waitForAllTests } from "./test-harness.mjs";
import {
  multiStopEngine,
  type RideStopItem,
} from "../src/lib/passenger/multi-stop-engine";
import {
  getStrategicPickupPoints,
  findBestPickupPoint,
  snapToPickupPoint,
} from "../src/lib/passenger/smart-pickups";
import { externalNavigationService } from "../src/lib/navigation/external-navigation-service";
import { AuditTrailService } from "../src/lib/security/audit-trail";
import type { CorridaPartiu } from "../src/lib/partiu-engine";

describe("Onda 6 — Multi-Stop Waypoint Engine (Gestão de Paradas Intermediárias)", () => {
  test("TC-MSP-01: Normalização limita a no máximo 2 paradas intermediárias e indexa sequencialmente", () => {
    const rawStops = [
      { endereco: "Rua das Flores, 100", coords: { lat: -21.205, lng: -41.885 } },
      { endereco: "Av. Pres. Vargas, 500", coords: { lat: -21.208, lng: -41.888 } },
      { endereco: "Rua Proibida, 999", coords: { lat: -21.215, lng: -41.890 } }, // 3ª parada deve ser descartada
    ];

    const normalized = multiStopEngine.normalizeStops(rawStops);

    expect(normalized.length).toBe(2);
    expect(normalized[0].sequence).toBe(0);
    expect(normalized[0].status).toBe("PENDING");
    expect(normalized[1].sequence).toBe(1);
    expect(normalized[1].status).toBe("PENDING");
  });

  test("TC-MSP-02: Cálculo da taxa adicional por paradas intermediárias (R$ 2,50 por parada)", () => {
    expect(multiStopEngine.calculateStopsSurcharge(0)).toBe(0);
    expect(multiStopEngine.calculateStopsSurcharge(1)).toBe(2.5);
    expect(multiStopEngine.calculateStopsSurcharge(2)).toBe(5.0);
    // Acima de 2 paradas trava no teto de 2 paradas
    expect(multiStopEngine.calculateStopsSurcharge(3)).toBe(5.0);
  });

  test("TC-MSP-03: Progressão sequencial de paradas (Stop 0 -> Stop 1 -> Destino Final)", () => {
    const mockRide: CorridaPartiu = {
      id: "ride-multistop-01",
      status: "EM_VIAGEM",
      origem: "Ponto de Partida",
      origemCoords: [-41.880, -21.200],
      destino: "Destino Final",
      destinoCoords: [-41.895, -21.220],
      distanciaKm: 8.5,
      duracaoMin: 18,
      valor: 28.5,
      valorOriginal: 28.5,
      descontoCupom: 0,
      modalidade: "PARTIU_POP",
      solicitadaEm: new Date().toISOString(),
      paradas: [
        { id: "s1", endereco: "Farmácia Central", coords: { lat: -21.205, lng: -41.885 } },
        { id: "s2", endereco: "Padaria Modelo", coords: { lat: -21.210, lng: -41.888 } },
      ],
      paradasConcluidas: 0,
    };

    // 1. Estado Inicial: Rumo à 1ª parada
    const progress0 = multiStopEngine.getProgress({
      destino: mockRide.destino,
      destinoCoords: mockRide.destinoCoords,
      paradas: mockRide.paradas,
      paradasConcluidas: mockRide.paradasConcluidas,
    });

    expect(progress0.isAllIntermediateStopsCompleted).toBe(false);
    expect(progress0.currentStopIndex).toBe(0);
    expect(progress0.activeTarget.isFinalDestination).toBe(false);
    expect(progress0.activeTarget.endereco).toBe("Farmácia Central");

    // 2. Conclui 1ª parada -> Avança para a 2ª
    const step1 = multiStopEngine.advanceStop(mockRide);
    expect(step1.completedStop?.status).toBe("COMPLETED");
    expect(step1.isFinalDestination).toBe(false);
    expect(step1.updatedRide.paradasConcluidas).toBe(1);

    const progress1 = multiStopEngine.getProgress({
      destino: step1.updatedRide.destino,
      destinoCoords: step1.updatedRide.destinoCoords,
      paradas: step1.updatedRide.paradas,
      paradasConcluidas: step1.updatedRide.paradasConcluidas,
    });
    expect(progress1.currentStopIndex).toBe(1);
    expect(progress1.activeTarget.endereco).toBe("Padaria Modelo");

    // 3. Conclui 2ª parada -> Rumo ao Destino Final
    const step2 = multiStopEngine.advanceStop(step1.updatedRide);
    expect(step2.isFinalDestination).toBe(true);
    expect(step2.nextTargetLabel).toBe("Destino Final");
    expect(step2.updatedRide.paradasConcluidas).toBe(2);

    const progressFinal = multiStopEngine.getProgress({
      destino: step2.updatedRide.destino,
      destinoCoords: step2.updatedRide.destinoCoords,
      paradas: step2.updatedRide.paradas,
      paradasConcluidas: step2.updatedRide.paradasConcluidas,
    });
    expect(progressFinal.isAllIntermediateStopsCompleted).toBe(true);
    expect(progressFinal.activeTarget.isFinalDestination).toBe(true);
    expect(progressFinal.activeTarget.endereco).toBe("Destino Final");

    // 4. Verificação de registro na trilha de auditoria
    const recentEvents = AuditTrailService.getInstance().getRecentEvents(20);
    const stopAudit = recentEvents.find(
      (e) => e.action === "RIDE_WAYPOINT_STOP_COMPLETED" && e.resource.includes("ride-multistop-01")
    );
    expect(Boolean(stopAudit)).toBe(true);
  });

  test("TC-MSP-04: Resolução de alvo dinâmico para Waze / Google Maps aponta para a parada ativa", () => {
    const rideWithStop = {
      status: "EM_VIAGEM",
      origem: "Início",
      origemCoords: { lat: -21.200, lng: -41.880 },
      destino: "Fim",
      destinoCoords: { lat: -21.220, lng: -41.895 },
      paradas: [
        { endereco: "Parada 1: Supermercado", coords: { lat: -21.206, lng: -41.886 } },
      ],
      currentStopIndex: 0,
    };

    const target = externalNavigationService.resolveTargetForRide(rideWithStop);
    expect(target.targetType).toBe("STOP");
    expect(target.label).toBe("Parada 1: Supermercado");
    expect(target.coords?.lat).toBe(-21.206);
    expect(target.coords?.lng).toBe(-41.886);
  });

  test("TC-MSP-05: Pulo de parada intermediária avança o contador marcando status SKIPPED", () => {
    const mockRide: CorridaPartiu = {
      id: "ride-skip-test",
      status: "EM_VIAGEM",
      origem: "A",
      destino: "B",
      distanciaKm: 5,
      duracaoMin: 10,
      valor: 20,
      modalidade: "PARTIU_POP",
      solicitadaEm: new Date().toISOString(),
      paradas: [
        { id: "s1", endereco: "Parada Opcional", coords: { lat: -21.205, lng: -41.885 } },
      ],
      paradasConcluidas: 0,
    };

    const skipResult = multiStopEngine.skipStop(mockRide, 0);
    expect(skipResult.skippedStop?.status).toBe("SKIPPED");
    expect(skipResult.updatedRide.paradasConcluidas).toBe(1);
  });
});

describe("Onda 6 — Smart Green Pickup Points Engine (Snap-to-Pin)", () => {
  test("TC-SMP-01: Cálculo de distância, tempo de caminhada e economia de retorno do condutor", () => {
    // Localização na Av. Pres. Franklin Roosevelt / Centro de Itaperuna
    const userLocation: [number, number] = [-41.8885, -21.2055];
    const points = getStrategicPickupPoints(userLocation);

    expect(points.length > 0).toBe(true);
    const topPoint = points[0];

    expect(topPoint.isGreenSnapPoint).toBe(true);
    expect(topPoint.distanciaMetros > 0).toBe(true);
    expect(topPoint.tempoCaminhadaMin >= 1).toBe(true);
    expect(topPoint.detourSavingsMinutes >= 2).toBe(true);
    expect(typeof topPoint.benefitMessage).toBe("string");
  });

  test("TC-SMP-02: Geração de calçada com recuo seguro quando não há POI curado a menos de 80m", () => {
    // Coordenada em bairro sem POI curado imediato
    const remoteLocation: [number, number] = [-41.8500, -21.1500];
    const points = getStrategicPickupPoints(remoteLocation);

    expect(points.length > 0).toBe(true);
    const sidewalk = points.find((p) => p.tipo === "calcada");
    expect(Boolean(sidewalk)).toBe(true);
    expect(sidewalk?.nome).toContain("Calçada com Recuo Seguro");
    expect(sidewalk?.badge).toBe("Ponto Verde Recomendado");
  });

  test("TC-SMP-03: Snap-to-Pin atualiza coordenadas de embarque com sucesso", () => {
    const userLocation: [number, number] = [-41.888, -21.205];
    const bestPoint = findBestPickupPoint(userLocation);
    expect(bestPoint).not.toBe(null);

    let appliedCoords: [number, number] | null = null;
    let appliedName: string | null = null;

    if (bestPoint) {
      snapToPickupPoint(bestPoint, (coords, name) => {
        appliedCoords = coords;
        appliedName = name;
      });

      expect(appliedCoords).toEqual(bestPoint.coords);
      expect(appliedName).toBe(bestPoint.nome);
    }
  });
});

if (process.argv[1] && process.argv[1].includes("onda6")) {
  void (async () => {
    await waitForAllTests();
    setTimeout(() => {
      process.exit(0);
    }, 100);
  })();
}
