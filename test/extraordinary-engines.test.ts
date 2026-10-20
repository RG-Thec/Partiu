import { describe, test, expect } from "./test-harness.mjs";
import { MockLocationShield, type TelemetryPoint } from "../src/lib/geo/mock-location-shield";
import { BackToBackEngine, type CurrentTripProgress } from "../src/lib/driver/back-to-back-engine";
import { SaaSToleranceEngine, type DriverSaaSStatus } from "../src/services/subscription/SaaSToleranceEngine";

describe("41. MOCK LOCATION SHIELD (ANTI-FAKE GPS & COERÊNCIA FÍSICA)", () => {
  test("1. Ponto Autêntico: Telemetria em velocidade e aceleração realistas é APROVADA", () => {
    const p1: TelemetryPoint = {
      latitude: -9.665,
      longitude: -35.735,
      altitude: 15,
      speed: 12, // 12 m/s (~43 km/h)
      accuracy: 6,
      timestamp: 10000,
      isMock: false,
    };

    const p2: TelemetryPoint = {
      latitude: -9.6645,
      longitude: -35.7345,
      altitude: 16,
      speed: 13,
      accuracy: 5,
      timestamp: 15000, // 5 segundos depois
      isMock: false,
    };

    const result = MockLocationShield.validatePoint(p2, p1);
    expect(result.isAuthentic).toBe(true);
    expect(result.riskLevel).toBe("SAFE");
    expect(result.confidenceScore).toBe(100);
  });

  test("2. Detecção Ativa: Provedor Mock Explícito (Android Fake GPS) é REJEITADO com CRITICAL_SPOOF", () => {
    const fakePoint: TelemetryPoint = {
      latitude: -9.665,
      longitude: -35.735,
      timestamp: 20000,
      isMock: true,
    };

    const result = MockLocationShield.validatePoint(fakePoint, null);
    expect(result.isAuthentic).toBe(false);
    expect(result.riskLevel).toBe("CRITICAL_SPOOF");
    expect(result.confidenceScore).toBe(0);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  test("3. Salto Cinemático Impossível (Teleporte > 180 km/h) é REJEITADO", () => {
    const p1: TelemetryPoint = {
      latitude: -9.665,
      longitude: -35.735,
      timestamp: 10000,
      speed: 10,
    };

    // Salto de 5 km em 2 segundos (~9.000 km/h)
    const p2: TelemetryPoint = {
      latitude: -9.620,
      longitude: -35.710,
      timestamp: 12000,
      speed: 10,
    };

    const result = MockLocationShield.validatePoint(p2, p1);
    expect(result.isAuthentic).toBe(false);
    expect(result.riskLevel).toBe("CRITICAL_SPOOF");
  });
});

describe("42. BACK-TO-BACK DISPATCH ENGINE (CHAMADAS EM CADEIA)", () => {
  test("1. Elegibilidade de Disparo: Atinge janela operacional a <= 2 min do desembarque", () => {
    const progressLonge: CurrentTripProgress = {
      tripId: "t1",
      driverId: "d1",
      currentLocation: [-35.735, -9.665],
      dropoffLocation: [-35.710, -9.620],
      remainingDistanceMeters: 4500,
      remainingDurationSeconds: 420, // 7 minutos
    };
    expect(BackToBackEngine.evaluateEligibility(progressLonge)).toBe(false);

    const progressPerto: CurrentTripProgress = {
      tripId: "t1",
      driverId: "d1",
      currentLocation: [-35.715, -9.622],
      dropoffLocation: [-35.710, -9.620],
      remainingDistanceMeters: 800, // 800 metros
      remainingDurationSeconds: 95, // 95 segundos (< 120s)
    };
    expect(BackToBackEngine.evaluateEligibility(progressPerto)).toBe(true);
  });

  test("2. Seleção de Candidato: Ranqueia o passageiro mais próximo do ponto de desembarque", () => {
    const dropoff: [number, number] = [-35.735, -9.665];

    const availableRides = [
      {
        id: "r1",
        passageiroNome: "Carlos",
        origemEndereco: "Rua A",
        origemCoords: [-35.737, -9.667] as [number, number], // ~300m
        destinoEndereco: "Rua B",
        destinoCoords: [-35.750, -9.680] as [number, number],
        valorEstimadoBrl: 16.5,
      },
      {
        id: "r2",
        passageiroNome: "Mariana",
        origemEndereco: "Rua C",
        origemCoords: [-35.748, -9.675] as [number, number], // ~1.800m
        destinoEndereco: "Rua D",
        destinoCoords: [-35.760, -9.690] as [number, number],
        valorEstimadoBrl: 22.0,
      },
    ];

    const best = BackToBackEngine.selectBestQueuedRide(dropoff, availableRides);
    expect(best !== null).toBe(true);
    expect(best?.id).toBe("r1");
    expect(best?.passageiroNome).toBe("Carlos");
    expect(best?.distanciaDoDesembarqueMetros).toBeLessThan(500);
  });
});

describe("43. SAAS TOLERANCE & SMART GRACE ENGINE (DIÁRIAS COM TOLERÂNCIA)", () => {
  test("1. Avaliação de Acesso: Motorista vencido entra em TOLERANCE_MODE com até 2 corridas", () => {
    const statusVencido: DriverSaaSStatus = {
      driverId: "d1",
      tenantId: "default",
      status: "TOLERANCE_MODE",
      toleranceRidesUsed: 0,
      maxToleranceRides: 2,
      pendingDailyFeeCents: 500, // R$ 5,00
    };

    const evalResult = SaaSToleranceEngine.evaluateDriverAccess(statusVencido);
    expect(evalResult.canAcceptRide).toBe(true);
    expect(evalResult.isToleranceActive).toBe(true);
    expect(evalResult.remainingToleranceRides).toBe(2);
    expect(evalResult.requiresImmediateDeduction).toBe(true);
  });

  test("2. Bloqueio Estrito: Ao esgotar 2 corridas sem pagamento, o acesso é travado", () => {
    const statusEsgotado: DriverSaaSStatus = {
      driverId: "d1",
      tenantId: "default",
      status: "TOLERANCE_MODE",
      toleranceRidesUsed: 2,
      maxToleranceRides: 2,
      pendingDailyFeeCents: 500,
    };

    const evalResult = SaaSToleranceEngine.evaluateDriverAccess(statusEsgotado);
    expect(evalResult.canAcceptRide).toBe(false);
    expect(evalResult.remainingToleranceRides).toBe(0);
  });

  test("3. Dedução Automática no Split: Corrida realizada deduz a diária pendente e restaura ACTIVE", () => {
    const statusVencido: DriverSaaSStatus = {
      driverId: "d1",
      tenantId: "default",
      status: "TOLERANCE_MODE",
      toleranceRidesUsed: 0,
      maxToleranceRides: 2,
      pendingDailyFeeCents: 500, // R$ 5,00
    };

    // Corrida com ganho líquido do motorista de R$ 25,00 (2.500 centavos)
    const netEarningsCents = 2500;
    const settlement = SaaSToleranceEngine.processRideSettlementWithTolerance(statusVencido, netEarningsCents);

    expect(settlement.deductedFeeCents).toBe(500); // R$ 5,00 retido para a franquia
    expect(settlement.driverFinalEarningsCents).toBe(2000); // R$ 20,00 liberado para o motorista
    expect(settlement.settledDailyFee).toBe(true);
    expect(settlement.updatedStatus.status).toBe("ACTIVE");
    expect(settlement.updatedStatus.pendingDailyFeeCents).toBe(0);
    expect(settlement.updatedStatus.toleranceRidesUsed).toBe(0);
  });
});
