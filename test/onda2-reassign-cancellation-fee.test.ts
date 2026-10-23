/**
 * ==============================================================================
 * 🧪 ONDA 2 TEST SUITE: ON-SERVICE REASSIGN & CANCELLATION FEE BIFURCATION
 * ==============================================================================
 * Certificação técnica dos padrões 99 / Uber no PARTIU:
 * 1. Bifurcação de Taxa de Cancelamento (Carência de 2 min / NOPAY vs PAID R$ 6,00)
 * 2. Compensação integral ao condutor no modelo Pure SaaS (0% comissão)
 * 3. Reatribuição transparente por cancelamento do condutor (On-Service Reassign)
 * 4. Transições canônicas da máquina de estados do passageiro (DRIVER_ASSIGNED -> SEARCHING_R1)
 * ==============================================================================
 */

import { describe, test, expect, waitForAllTests } from "./test-harness.mjs";
import {
  calculateCancellationFee,
  CANCELLATION_CONSTANTS,
} from "../src/lib/pricing/cancellation-fee-calculator";
import {
  onServiceReassignEngine,
} from "../src/lib/dispatch-atomic/on-service-reassign";
import {
  cancelarCorridaPeloMotorista,
  salvarCorridaAtiva,
  getCorridaAtiva,
  type CorridaPartiu,
} from "../src/lib/partiu-engine";
import {
  PASSENGER_RIDE_TRANSITIONS,
  canTransitionPassengerRide,
} from "../src/lib/passenger/passenger-ride-machine";
import { dispatchQueueBuilder } from "../src/services/DispatchQueueBuilder";
import { progressiveDispatchEngine } from "../src/services/ProgressiveDispatchEngine";

describe("Onda 2 — Bifurcação Justa da Taxa de Cancelamento (Grace Period 2 min)", () => {
  test("TC-FEE-01: Cancelamento antes de motorista aceitar deve ser sempre gratuito (NOPAY)", () => {
    const res = calculateCancellationFee({
      rideId: "ride-test-1",
      passengerId: "passenger-1",
      driverId: null,
      driverAssigned: false,
      cancelledAt: Date.now(),
      cancelledBy: "PASSENGER",
    });

    expect(res.feeType).toBe("NOPAY");
    expect(res.totalFeeCents).toBe(0);
    expect(res.totalFeeBrl).toBe(0);
    expect(res.driverShareBrl).toBe(0);
  });

  test("TC-FEE-02: Cancelamento do passageiro dentro da tolerância de 2 minutos (45s) deve ser gratuito (NOPAY)", () => {
    const now = Date.now();
    const acceptedAt = now - 45 * 1000; // 45 segundos atrás

    const res = calculateCancellationFee({
      rideId: "ride-test-2",
      passengerId: "passenger-1",
      driverId: "driver-123",
      driverAssigned: true,
      driverAcceptedAt: acceptedAt,
      cancelledAt: now,
      cancelledBy: "PASSENGER",
      isPureSaaS: true,
    });

    expect(res.feeType).toBe("NOPAY");
    expect(res.totalFeeCents).toBe(0);
    expect(res.totalFeeBrl).toBe(0);
    expect(res.elapsedSeconds).toBe(45);
    expect(res.gracePeriodSeconds).toBe(120);
  });

  test("TC-FEE-03: Cancelamento tardio após tolerância de 2 minutos (180s) deve cobrar taxa de R$ 6,00 (PAID)", () => {
    const now = Date.now();
    const acceptedAt = now - 180 * 1000; // 3 minutos atrás

    const res = calculateCancellationFee({
      rideId: "ride-test-3",
      passengerId: "passenger-1",
      driverId: "driver-123",
      driverAssigned: true,
      driverAcceptedAt: acceptedAt,
      cancelledAt: now,
      cancelledBy: "PASSENGER",
      isPureSaaS: true,
    });

    expect(res.feeType).toBe("PAID");
    expect(res.totalFeeCents).toBe(600);
    expect(res.totalFeeBrl).toBe(6.0);
    // No modelo Pure SaaS 0% comissão, 100% da compensação vai para o parceiro
    expect(res.driverShareCents).toBe(600);
    expect(res.driverShareBrl).toBe(6.0);
    expect(res.platformShareCents).toBe(0);
    expect(res.elapsedSeconds).toBe(180);
  });

  test("TC-FEE-04: Cancelamento após chegada do condutor ao ponto (DRIVER_ARRIVED) deve cobrar R$ 6,00 mesmo que < 120s", () => {
    const now = Date.now();
    const acceptedAt = now - 60 * 1000; // Aceito há 60s
    const arrivedAt = now - 10 * 1000; // Chegou há 10s

    const res = calculateCancellationFee({
      rideId: "ride-test-4",
      passengerId: "passenger-1",
      driverId: "driver-123",
      driverAssigned: true,
      driverAcceptedAt: acceptedAt,
      driverArrivedAt: arrivedAt,
      cancelledAt: now,
      cancelledBy: "PASSENGER",
      isPureSaaS: true,
    });

    expect(res.feeType).toBe("PAID");
    expect(res.totalFeeCents).toBe(600);
    expect(res.totalFeeBrl).toBe(6.0);
    expect(res.driverShareBrl).toBe(6.0);
  });

  test("TC-FEE-05: Cancelamento por No-Show (Passageiro não compareceu em 5 min) cobra taxa de R$ 6,00 para o condutor", () => {
    const res = calculateCancellationFee({
      rideId: "ride-test-5",
      passengerId: "passenger-1",
      driverId: "driver-123",
      cancelledBy: "NO_SHOW",
      waitingSeconds: 320,
      isPureSaaS: true,
    });

    expect(res.feeType).toBe("PAID");
    expect(res.totalFeeCents).toBe(600);
    expect(res.driverShareCents).toBe(600);
    expect(res.driverShareBrl).toBe(6.0);
  });

  test("TC-FEE-06: Cancelamento com motivo isento comprovado (DRIVER_STATIONARY) não gera cobrança", () => {
    const now = Date.now();
    const acceptedAt = now - 300 * 1000; // 5 minutos atrás, mas motorista não saiu do lugar

    const res = calculateCancellationFee({
      rideId: "ride-test-6",
      passengerId: "passenger-1",
      driverId: "driver-123",
      driverAssigned: true,
      driverAcceptedAt: acceptedAt,
      cancelledAt: now,
      cancelledBy: "PASSENGER",
      reasonCode: "DRIVER_STATIONARY",
      isPureSaaS: true,
    });

    expect(res.feeType).toBe("NOPAY");
    expect(res.totalFeeCents).toBe(0);
    expect(res.isExempt).toBe(true);
  });
});

describe("Onda 2 — Reatribuição Transparente em Cancelamento do Condutor (On-Service Reassign)", () => {
  test("TC-REASSIGN-01: Máquina de estados do passageiro deve permitir transição de DRIVER_ASSIGNED para SEARCHING_R1 / FINDING_DRIVER", () => {
    expect(canTransitionPassengerRide("DRIVER_ASSIGNED", "SEARCHING_R1")).toBe(true);
    expect(canTransitionPassengerRide("DRIVER_ASSIGNED", "FINDING_DRIVER")).toBe(true);
    expect(canTransitionPassengerRide("ACCEPTED", "SEARCHING_R1")).toBe(true);
    expect(canTransitionPassengerRide("DRIVER_ARRIVING", "SEARCHING_R1")).toBe(true);
  });

  test("TC-REASSIGN-02: Cancelamento do condutor a caminho (A_CAMINHO) mantém pedido ativo e reatribui para a fila", async () => {
    const mockRide: CorridaPartiu = {
      id: "ride-reassign-101",
      modalidade: "CARRO",
      origem: "Av. Cardoso Moreira, 100",
      destino: "Rodoviária de Itaperuna",
      origemCoords: { lat: -21.205, lng: -41.885 },
      destinoCoords: { lat: -21.215, lng: -41.895 },
      passageiroNome: "Juliana Santos",
      passageiroTelefone: "22998877665",
      valor: 16.5,
      distanciaKm: 3.2,
      duracaoMin: 7,
      formaPagamento: "pix",
      pin: "4321",
      status: "A_CAMINHO",
      motorista: {
        id: "driver-flattire-1",
        nome: "Carlos Pneu",
        foto: "https://example.com/carlos.jpg",
        avaliacao: 4.9,
        totalViagens: 420,
        veiculo: "Fiat Cronos",
        placa: "RIO-1A23",
        telefone: "22999990001",
      },
      criadoEm: Date.now() - 60000,
      aceitoEm: Date.now() - 30000,
    };

    salvarCorridaAtiva(mockRide);

    // Condutor cancela por motivo operacional ("Pneu furado")
    const cancelRes = cancelarCorridaPeloMotorista({
      rideId: mockRide.id,
      driverId: "driver-flattire-1",
      reasonCode: "VEHICLE_ISSUE",
      reasonLabel: "Pneu furado no deslocamento",
    });

    expect(cancelRes.sucesso).toBe(true);
    expect(cancelRes.reassigned).toBe(true);

    // Verifica que a corrida permanece salva no sistema, mas reatribuída
    const corridaSalva = getCorridaAtiva();
    expect(corridaSalva).not.toBe(null);
    expect(corridaSalva?.id).toBe("ride-reassign-101");
    expect(corridaSalva?.status).toBe("PROCURANDO");
    expect(corridaSalva?.motorista).toBe(undefined);
    expect(corridaSalva?.reassignCount).toBe(1);
    expect(corridaSalva?.excludedDriverIds?.includes("driver-flattire-1")).toBe(true);
    expect(corridaSalva?.origem).toBe("Av. Cardoso Moreira, 100");
    expect(corridaSalva?.destino).toBe("Rodoviária de Itaperuna");

    // Limpeza de timers de despacho
    dispatchQueueBuilder.cancelCascade("ride-reassign-101");
    progressiveDispatchEngine.cancelDispatch("ride-reassign-101", "TEST_DONE");
  });

  test("TC-REASSIGN-03: Viagem já em andamento (EM_VIAGEM) não pode ser reatribuída automaticamente", async () => {
    const mockInTripRide: CorridaPartiu = {
      id: "ride-in-trip-202",
      modalidade: "CARRO",
      origem: "Origem A",
      destino: "Destino B",
      passageiroNome: "Lucas",
      passageiroTelefone: "22999991111",
      valor: 20.0,
      distanciaKm: 5.0,
      duracaoMin: 12,
      formaPagamento: "dinheiro",
      pin: "9999",
      status: "EM_VIAGEM",
      motorista: {
        id: "driver-active-2",
        nome: "Roberto",
        foto: "",
        avaliacao: 5.0,
        totalViagens: 100,
        veiculo: "Onix",
        placa: "BRA-0001",
        telefone: "22999990002",
      },
      criadoEm: Date.now() - 300000,
      aceitoEm: Date.now() - 240000,
    };

    salvarCorridaAtiva(mockInTripRide);

    const reassignRes = await onServiceReassignEngine.reassignOnDriverCancellation({
      rideId: mockInTripRide.id,
      cancellingDriverId: "driver-active-2",
      reasonCode: "EMERGENCY",
      reasonLabel: "Emergência grave",
    });

    expect(reassignRes.success).toBe(false);
    expect(reassignRes.reassigned).toBe(false);

    dispatchQueueBuilder.cancelCascade("ride-in-trip-202");
    progressiveDispatchEngine.cancelDispatch("ride-in-trip-202", "TEST_DONE");
  });
});

if (process.argv[1] && process.argv[1].includes("onda2")) {
  void (async () => {
    await waitForAllTests();
    process.exit(0);
  })();
}
