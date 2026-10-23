/**
 * ==============================================================================
 * 🧪 ONDA 3 TEST SUITE: BACK-TO-BACK DISPATCH & EXTERNAL GPS DEEP LINKING
 * ==============================================================================
 * Certificação técnica dos padrões 99 / Uber no PARTIU:
 * 1. Despacho em Cadeia Consecutivo (Back-to-Back Dispatch / Predictive Chaining)
 * 2. Limiares de Aproximação (3 min / 180s ou 2.000m do desembarque)
 * 3. Transição Atômica de Fila (Zero Downtime Handover para HEADING_TO_PICKUP)
 * 4. Deep Linking Universal para Waze, Google Maps e Apple Maps
 * 5. Resolução Dinâmica de Ponto Alvo (Embarque, Paradas ou Desembarque)
 * ==============================================================================
 */

import { describe, test, expect, waitForAllTests } from "./test-harness.mjs";
import {
  BackToBackEngine,
  type CurrentTripProgress,
} from "../src/lib/driver/back-to-back-engine";
import {
  driverConsecutiveRidesEngine,
} from "../src/lib/driver/driver-consecutive-rides-engine";
import {
  driverStateMachine,
} from "../src/lib/driver/driver-state-machine";
import {
  externalNavigationService,
} from "../src/lib/navigation/external-navigation-service";
import type { CorridaPartiu } from "../src/lib/partiu-engine";

describe("Onda 3 — Back-to-Back Dispatch Engine (Predictive Chaining Padrão 99)", () => {
  test("TC-B2B-01: Avaliação de Elegibilidade por Limiar de Tempo (<= 180s) e Distância (<= 2.000m)", () => {
    // Caso 1: A 150 segundos de concluir a viagem (elegível por tempo)
    const progressoTempo: CurrentTripProgress = {
      tripId: "trip-act-1",
      driverId: "drv-b2b-1",
      currentLocation: [-41.885, -21.205],
      dropoffLocation: [-41.895, -21.215],
      remainingDistanceMeters: 2500,
      remainingDurationSeconds: 150,
    };
    expect(BackToBackEngine.evaluateEligibility(progressoTempo)).toBe(true);

    // Caso 2: A 1.400 metros de concluir a viagem (elegível por distância)
    const progressoDist: CurrentTripProgress = {
      tripId: "trip-act-2",
      driverId: "drv-b2b-1",
      currentLocation: [-41.885, -21.205],
      dropoffLocation: [-41.895, -21.215],
      remainingDistanceMeters: 1400,
      remainingDurationSeconds: 240,
    };
    expect(BackToBackEngine.evaluateEligibility(progressoDist)).toBe(true);

    // Caso 3: Longe do destino (8 km / 12 min) -> NÃO elegível
    const progressoLonge: CurrentTripProgress = {
      tripId: "trip-act-3",
      driverId: "drv-b2b-1",
      currentLocation: [-41.85, -21.15],
      dropoffLocation: [-41.895, -21.215],
      remainingDistanceMeters: 8000,
      remainingDurationSeconds: 720,
    };
    expect(BackToBackEngine.evaluateEligibility(progressoLonge)).toBe(false);

    // Caso 4: Viagem já concluída (0s / 0m) -> NÃO elegível
    const progressoConcluido: CurrentTripProgress = {
      tripId: "trip-act-4",
      driverId: "drv-b2b-1",
      currentLocation: [-41.895, -21.215],
      dropoffLocation: [-41.895, -21.215],
      remainingDistanceMeters: 0,
      remainingDurationSeconds: 0,
    };
    expect(BackToBackEngine.evaluateEligibility(progressoConcluido)).toBe(false);
  });

  test("TC-B2B-02: Seleção da Melhor Chamada Concorrente Adjacente ao Ponto de Desembarque (Raio <= 3.000m)", () => {
    const dropoffCoords: [number, number] = [-41.888, -21.205]; // Centro de Itaperuna

    const chamadasDisponiveis = [
      {
        id: "ride-near-1",
        passageiroNome: "Mariana Lima",
        origemEndereco: "Rua Próxima 1",
        origemCoords: [-41.892, -21.208] as [number, number], // ~500m
        destinoEndereco: "Bairro A",
        destinoCoords: [-41.91, -21.22] as [number, number],
        valorEstimadoBrl: 15.0,
      },
      {
        id: "ride-closer-2",
        passageiroNome: "Felipe Rocha",
        origemEndereco: "Rua Muito Próxima",
        origemCoords: [-41.889, -21.206] as [number, number], // ~150m
        destinoEndereco: "Bairro B",
        destinoCoords: [-41.92, -21.23] as [number, number],
        valorEstimadoBrl: 18.0,
      },
      {
        id: "ride-far-3",
        passageiroNome: "José Fora do Raio",
        origemEndereco: "Outra Cidade",
        origemCoords: [-41.75, -21.1] as [number, number], // ~18 km
        destinoEndereco: "Bairro C",
        destinoCoords: [-41.76, -21.11] as [number, number],
        valorEstimadoBrl: 45.0,
      },
    ];

    const best = BackToBackEngine.selectBestQueuedRide(dropoffCoords, chamadasDisponiveis);
    expect(best).not.toBe(null);
    expect(best?.id).toBe("ride-closer-2");
    expect(best?.passageiroNome).toBe("Felipe Rocha");
    expect(best?.distanciaDoDesembarqueMetros <= 500).toBe(true);
  });

  test("TC-B2B-03: Ciclo Completo de Enfileiramento e Handover Atômico (Zero Downtime para HEADING_TO_PICKUP)", () => {
    const driverId = "drv-chain-999";
    const activeRideId = "current-trip-123";

    const candidateRide: CorridaPartiu = {
      id: "next-queued-456",
      modalidade: "CARRO",
      origem: "Rua do Embarque Próximo, 50",
      destino: "Shopping Itaperuna",
      origemCoords: { lat: -21.206, lng: -41.889 },
      destinoCoords: { lat: -21.22, lng: -41.9 },
      passageiroNome: "Beatriz Oliveira",
      passageiroTelefone: "22998877661",
      valor: 22.0,
      distanciaKm: 4.8,
      duracaoMin: 10,
      formaPagamento: "pix",
      pin: "7788",
      status: "PROCURANDO",
      criadoEm: Date.now(),
    };

    // Simula o ciclo da viagem atual até COMPLETED
    driverStateMachine.initDriverSession(driverId, "ONLINE");
    driverStateMachine.transitionRide("HEADING_TO_PICKUP", driverId, activeRideId, "SYSTEM");
    driverStateMachine.transitionRide("ARRIVED", driverId, activeRideId, "SYSTEM");
    driverStateMachine.transitionRide("BOARDING", driverId, activeRideId, "SYSTEM");
    driverStateMachine.transitionRide("IN_TRIP", driverId, activeRideId, "SYSTEM");
    driverStateMachine.transitionRide("COMPLETING", driverId, activeRideId, "SYSTEM");
    driverStateMachine.transitionRide("COMPLETED", driverId, activeRideId, "SYSTEM");

    // 1. Despacha oferta consecutiva
    const offered = driverConsecutiveRidesEngine.offerConsecutiveRide(
      driverId,
      activeRideId,
      candidateRide,
    );
    expect(offered).toBe(true);

    // 2. Motorista aceita a próxima chamada enquanto ainda está em trânsito
    const acceptedInQueue = driverConsecutiveRidesEngine.acceptConsecutiveRide(driverId);
    expect(acceptedInQueue).not.toBe(null);
    expect(acceptedInQueue?.id).toBe("next-queued-456");

    // Verifica que a corrida reside no slot QUEUED do motorista
    const inQueue = driverConsecutiveRidesEngine.getQueuedRide(driverId);
    expect(inQueue).not.toBe(null);
    expect(inQueue?.id).toBe("next-queued-456");

    // 3. Ao finalizar a corrida atual, o handover promove a enfileirada diretamente para HEADING_TO_PICKUP
    const promoted = driverConsecutiveRidesEngine.promoteQueuedRideToActive(driverId);
    expect(promoted).not.toBe(null);
    expect(promoted?.id).toBe("next-queued-456");
    expect(promoted?.status).toBe("A_CAMINHO");

    // A fila deve estar vazia após a promoção
    expect(driverConsecutiveRidesEngine.getQueuedRide(driverId)).toBe(null);
  });
});

describe("Onda 3 — Deep Linking Universal para Navegação Externa (Waze, Google Maps & Apple Maps)", () => {
  test("TC-NAV-01: Geração de URLs nativas e web fallbacks para Waze e Google Maps", () => {
    const coords = { lat: -21.205, lng: -41.888 };
    const urls = externalNavigationService.getNavigationUrls(coords, "Praça Central");

    // Waze
    expect(urls.waze.nativeUrl).toBe("waze://?ll=-21.205000,-41.888000&navigate=yes");
    expect(urls.waze.webUrl).toBe("https://waze.com/ul?ll=-21.205000,-41.888000&navigate=yes");

    // Google Maps
    expect(urls.google.nativeUrl).toBe("google.navigation:q=-21.205000,-41.888000&mode=d");
    expect(urls.google.webUrl.includes("https://www.google.com/maps/dir/")).toBe(true);
    expect(urls.google.webUrl.includes("-21.205000,-41.888000")).toBe(true);

    // Apple Maps
    expect(urls.apple.nativeUrl).toBe("maps://?daddr=-21.205000,-41.888000&dirflg=d");
    expect(urls.apple.webUrl).toBe("https://maps.apple.com/?daddr=-21.205000,-41.888000&dirflg=d");
  });

  test("TC-NAV-02: Persistência e Recuperação do Navegador Padrão do Condutor", () => {
    externalNavigationService.setPreferredApp("google");
    expect(externalNavigationService.getPreferredApp()).toBe("google");

    externalNavigationService.setPreferredApp("waze");
    expect(externalNavigationService.getPreferredApp()).toBe("waze");
  });

  test("TC-NAV-03: Resolução Dinâmica de Alvo GPS por Etapa de Corrida (Embarque vs Desembarque vs Paradas)", () => {
    // Etapa 1: A caminho do embarque (HEADING_TO_PICKUP)
    const rideHeading = {
      status: "HEADING_TO_PICKUP",
      origem: "Rua das Flores, 10",
      origemCoords: { lat: -21.201, lng: -41.881 },
      destino: "Rodoviária",
      destinoCoords: { lat: -21.215, lng: -41.895 },
    };
    const targetHeading = externalNavigationService.resolveTargetForRide(rideHeading);
    expect(targetHeading.targetType).toBe("PICKUP");
    expect(targetHeading.label).toBe("Rua das Flores, 10");
    expect(targetHeading.coords?.lat).toBe(-21.201);
    expect(targetHeading.coords?.lng).toBe(-41.881);

    // Etapa 2: Em viagem com destino final (IN_TRIP)
    const rideInTrip = {
      status: "IN_TRIP",
      origem: "Rua das Flores, 10",
      origemCoords: { lat: -21.201, lng: -41.881 },
      destino: "Rodoviária",
      destinoCoords: { lat: -21.215, lng: -41.895 },
    };
    const targetInTrip = externalNavigationService.resolveTargetForRide(rideInTrip);
    expect(targetInTrip.targetType).toBe("DROPOFF");
    expect(targetInTrip.label).toBe("Rodoviária");
    expect(targetInTrip.coords?.lat).toBe(-21.215);
    expect(targetInTrip.coords?.lng).toBe(-41.895);

    // Etapa 3: Em viagem com Parada Intermediária Pendente
    const rideWithStop = {
      status: "EM_VIAGEM",
      origem: "Origem",
      origemCoords: { lat: -21.201, lng: -41.881 },
      destino: "Destino Final",
      destinoCoords: { lat: -21.215, lng: -41.895 },
      paradas: [
        { endereco: "Farmácia Central (Parada 1)", coords: { lat: -21.207, lng: -41.886 } },
      ],
      currentStopIndex: 0,
    };
    const targetStop = externalNavigationService.resolveTargetForRide(rideWithStop);
    expect(targetStop.targetType).toBe("STOP");
    expect(targetStop.label).toBe("Farmácia Central (Parada 1)");
    expect(targetStop.coords?.lat).toBe(-21.207);
  });
});

if (process.argv[1] && process.argv[1].includes("onda3")) {
  void (async () => {
    await waitForAllTests();
    process.exit(0);
  })();
}
