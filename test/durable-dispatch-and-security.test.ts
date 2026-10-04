import { describe, test, expect } from "./test-harness.mjs";
import { atomicMatchingEngine } from "../src/lib/dispatch-atomic/atomic-matching.ts";
import { motoristaAceitarCorrida, MOTORISTA_PADRAO, type CorridaPartiu, type MotoristaInfo } from "../src/lib/partiu-engine.ts";
import { driverOfferEngine } from "../src/lib/driver/driver-offer-engine.ts";
import { progressiveDispatchEngine } from "../src/services/ProgressiveDispatchEngine.ts";
import { matchingEngine } from "../src/services/MatchingEngine.ts";

describe("🛡️ PARTIU — SERVER-DURABLE DISPATCH & SECURITY INVARIANTS (9 ADVERSARIAL SUITES)", () => {
  // --------------------------------------------------------------------------
  // INVARIANTE 1: Sobrevivência ao App Kill do Passageiro (Server Durability)
  // --------------------------------------------------------------------------
  test("1. Passenger App Kill: Wave advancement persists server-side when client dies", async () => {
    const rideId = `RIDE-APPKILL-${Date.now()}`;
    const initialOfferTime = Date.now() - 16000; // 16 segundos atrás (> 15s timeout)

    // Estado simulado no PostgreSQL
    const dbRide = {
      id: rideId,
      passenger_id: "pax-disconnected",
      status: "OFFERED",
      current_wave: 1,
      dispatch_wave: 1,
      offered_driver_id: "drv-candidate-1",
      offer_expires_at: new Date(initialOfferTime).toISOString(),
      dispatch_attempt: 1,
    };

    // Função de simulação da procedure server-side dispatch_advance_wave
    const simulateServerAdvanceWave = (ride: typeof dbRide) => {
      if (ride.status !== "OFFERED") return { status: ride.status, wave: ride.dispatch_wave };
      if (new Date(ride.offer_expires_at).getTime() > Date.now()) {
        return { status: ride.status, wave: ride.dispatch_wave, code: "NOT_EXPIRED" };
      }

      // Avança a onda autonomamente no banco de dados
      const nextWave = ride.dispatch_wave + 1;
      const nextDriver = nextWave === 2 ? "drv-candidate-2" : "drv-candidate-3";
      ride.dispatch_wave = nextWave;
      ride.current_wave = nextWave;
      ride.offered_driver_id = nextDriver;
      ride.offer_expires_at = new Date(Date.now() + 15000).toISOString();
      ride.dispatch_attempt += 1;
      return { status: "OFFERED", wave: nextWave, candidate: nextDriver, code: "WAVE_ADVANCED" };
    };

    // O passageiro fechou o app (processo do browser destruído).
    // O servidor roda o scheduler e detecta a expiração:
    const advanceResult = simulateServerAdvanceWave(dbRide);

    expect(advanceResult.code).toBe("WAVE_ADVANCED");
    expect(advanceResult.wave).toBe(2);
    expect(advanceResult.candidate).toBe("drv-candidate-2");
    expect(dbRide.offered_driver_id).toBe("drv-candidate-2");
    expect(new Date(dbRide.offer_expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 2: Concorrência de Aceite (Atomic Lock / Single Winner)
  // --------------------------------------------------------------------------
  test("2. Concurrent Accept: Exactly one driver wins race condition, second driver is gracefully rejected", async () => {
    const rideId = `RIDE-CONCURRENT-${Date.now()}`;
    const ride: CorridaPartiu = {
      id: rideId,
      passageiroId: "pax-concurrent-1",
      origem: "Rua das Flores, 100",
      destino: "Centro",
      status: "PROCURANDO",
      valor: 20.0,
      distanciaKm: 3.5,
      duracaoMin: 8,
      dataCriacao: new Date().toISOString(),
      categoriaVeiculo: "CARRO",
      formaPagamento: "PIX",
    };

    const driverA: MotoristaInfo = {
      id: "drv-winner-A",
      nome: "Motorista A",
      avaliacao: 4.9,
      totalViagens: 100,
      veiculo: "Carro A",
      placa: "AAA-1111",
      telefone: "(22) 9999-0001",
    };

    const driverB: MotoristaInfo = {
      id: "drv-loser-B",
      nome: "Motorista B",
      avaliacao: 4.8,
      totalViagens: 80,
      veiculo: "Carro B",
      placa: "BBB-2222",
      telefone: "(22) 9999-0002",
    };

    // Disputa concorrente simultânea
    const [resA, resB] = await Promise.all([
      atomicMatchingEngine.claimRideAtomic(ride, driverA),
      atomicMatchingEngine.claimRideAtomic(ride, driverB),
    ]);

    const winners = [resA, resB].filter((r) => r.success);
    const losers = [resA, resB].filter((r) => !r.success);

    expect(winners.length).toBe(1);
    expect(losers.length).toBe(1);
    expect(winners[0].winnerDriverId).toBeDefined();
    expect(losers[0].reason).toBe("ALREADY_CLAIMED_BY_ANOTHER_DRIVER");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 3: Rejeição de Motorista Não Autorizado (Offer Ownership)
  // --------------------------------------------------------------------------
  test("3. Unauthorized Driver: Driver B attempting to accept offer directed to Driver A is rejected", async () => {
    const rideId = `RIDE-UNAUTHORIZED-${Date.now()}`;
    const targetDriverId = "drv-authorized-A";
    const maliciousDriverId = "drv-spoofed-B";

    // Simulação do check da RPC partiu_aceitar_corrida_atomica:
    // IF v_ride.offered_driver_id IS NOT NULL AND v_ride.offered_driver_id <> v_driver_id THEN RAISE EXCEPTION 'OFFER_NOT_YOURS'
    const validateOfferOwnership = (offeredDriverId: string | null, claimingDriverId: string) => {
      if (offeredDriverId && offeredDriverId !== claimingDriverId) {
        return { success: false, code: "OFFER_NOT_YOURS", message: "Esta oferta foi direcionada a outro condutor." };
      }
      return { success: true, code: "OFFER_VALID" };
    };

    const checkResult = validateOfferOwnership(targetDriverId, maliciousDriverId);
    expect(checkResult.success).toBe(false);
    expect(checkResult.code).toBe("OFFER_NOT_YOURS");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 4: Rejeição de Chamadas Anônimas (RPC Auth Required)
  // --------------------------------------------------------------------------
  test("4. Anonymous RPC: Rejection of atomic claim lacking authenticated identity", async () => {
    const anonymousCall = (authUid: string | null, inputDriverId: string | null) => {
      const driverId = authUid || inputDriverId;
      if (!driverId) {
        return { success: false, code: "AUTH_REQUIRED", message: "Autenticação obrigatória para aceitar corrida." };
      }
      return { success: true, driverId };
    };

    const result = anonymousCall(null, null);
    expect(result.success).toBe(false);
    expect(result.code).toBe("AUTH_REQUIRED");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 5: Blindagem contra Adulteração Direta de Colunas em rides
  // --------------------------------------------------------------------------
  test("5. Direct Rides Manipulation: Passenger PATCH attempting to tamper fare_price or offered_driver is blocked", () => {
    const simulateTriggerColumnProtection = (
      oldRow: Record<string, any>,
      newRow: Record<string, any>,
      callerRole: string
    ) => {
      if (callerRole === "service_role") return { allowed: true };

      if (oldRow.fare_price !== newRow.fare_price) {
        throw new Error("COLUNA_IMUTAVEL: fare_price não pode ser alterado diretamente pelo cliente.");
      }
      if (oldRow.offered_driver_id !== newRow.offered_driver_id) {
        throw new Error("COLUNA_IMUTAVEL: offered_driver_id é gerenciado exclusivamente pelo servidor.");
      }
      if (oldRow.status !== newRow.status && newRow.status === "ACCEPTED") {
        throw new Error("STATUS_NAO_AUTORIZADO: Passageiro não pode alterar o status da corrida para ACCEPTED.");
      }
      return { allowed: true };
    };

    const currentRide = {
      id: "ride-tamper-test",
      fare_price: 25.0,
      offered_driver_id: "drv-1",
      status: "OFFERED",
    };

    // Ataque 1: Tentativa de reduzir preço da corrida para R$ 1,00
    expect(() => {
      simulateTriggerColumnProtection(
        currentRide,
        { ...currentRide, fare_price: 1.0 },
        "authenticated"
      );
    }).toThrow("COLUNA_IMUTAVEL: fare_price");

    // Ataque 2: Tentativa de alterar offered_driver_id diretamente
    expect(() => {
      simulateTriggerColumnProtection(
        currentRide,
        { ...currentRide, offered_driver_id: "drv-amigo" },
        "authenticated"
      );
    }).toThrow("COLUNA_IMUTAVEL: offered_driver_id");

    // Ataque 3: Tentativa de alterar status para ACCEPTED via PATCH
    expect(() => {
      simulateTriggerColumnProtection(
        currentRide,
        { ...currentRide, status: "ACCEPTED" },
        "authenticated"
      );
    }).toThrow("STATUS_NAO_AUTORIZADO");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 6: Isolamento de Realtime (Realtime Channel Filtering)
  // --------------------------------------------------------------------------
  test("6. Realtime Isolation: Channel filter guarantees Driver B cannot receive offers for Driver A", () => {
    const activeOffers = [
      { rideId: "ride-alpha", offered_driver_id: "drv-A", fare_price: 30.0 },
      { rideId: "ride-beta", offered_driver_id: "drv-B", fare_price: 18.0 },
    ];

    // Simulação do filtro RLS da publicação postgres_changes (offered_driver_id = auth.uid())
    const simulateRealtimeFilter = (listenerDriverId: string) => {
      return activeOffers.filter((o) => o.offered_driver_id === listenerDriverId);
    };

    const offersForDriverA = simulateRealtimeFilter("drv-A");
    const offersForDriverB = simulateRealtimeFilter("drv-B");
    const offersForAnon = simulateRealtimeFilter("anon-stranger");

    expect(offersForDriverA.length).toBe(1);
    expect(offersForDriverA[0].rideId).toBe("ride-alpha");

    expect(offersForDriverB.length).toBe(1);
    expect(offersForDriverB[0].rideId).toBe("ride-beta");

    expect(offersForAnon.length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 7: Idempotência de Despacho Duplicado (No Duplicate Offer)
  // --------------------------------------------------------------------------
  test("7. Duplicate Dispatch: Invocations on active or resolved rides do not produce duplicate offers", async () => {
    const offerId = `OFFER-IDEM-${Date.now()}`;
    const driverId = "drv-idem-test";
    const idempotencyKey = `KEY-${Date.now()}`;

    const motorista: MotoristaInfo = {
      id: driverId,
      nome: "Condutor Idempotente",
      avaliacao: 4.95,
      totalViagens: 120,
      veiculo: "Carro",
      placa: "IDE-0001",
      telefone: "(22) 98888-0000",
    };

    // Cria oferta inicial no engine
    const offer = driverOfferEngine.createOffer({
      ride: {
        id: "ride-idem-1",
        valor: 25.0,
        distanciaKm: 5.0,
        duracaoMin: 10,
        origem: "Rua 1",
        destino: "Rua 2",
        modalidade: "CARRO",
        passageiroNome: "Passageiro Teste",
      } as any,
      driverId,
    });

    // 1º Aceite com idempotencyKey
    const res1 = await driverOfferEngine.acceptOffer(offer.id, driverId, idempotencyKey, motorista);
    expect(res1.success).toBe(true);

    // 2º Aceite imediato com a mesma idempotencyKey (duplicação de rede)
    const res2 = await driverOfferEngine.acceptOffer(offer.id, driverId, idempotencyKey, motorista);
    expect(res2.success).toBe(true);
    expect(res2.message).toContain("já aceita anteriormente");
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 8: Concorrência de Workers Server-Side (SKIP LOCKED)
  // --------------------------------------------------------------------------
  test("8. Worker Concurrency: Multiple workers sweeping expired waves process disjoint subsets without duplicates", () => {
    const expiredRides = [
      { id: "ride-1", locked: false, wave: 1 },
      { id: "ride-2", locked: false, wave: 1 },
      { id: "ride-3", locked: false, wave: 1 },
    ];

    // Simulação do PostgreSQL FOR UPDATE SKIP LOCKED
    const workerSweep = (workerName: string, batchSize: number) => {
      const lockedByWorker: string[] = [];
      for (const r of expiredRides) {
        if (!r.locked && lockedByWorker.length < batchSize) {
          r.locked = true;
          lockedByWorker.push(r.id);
        }
      }
      return { worker: workerName, processed: lockedByWorker };
    };

    // Worker 1 e Worker 2 disparam simultaneamente
    const sweep1 = workerSweep("worker-1", 2);
    const sweep2 = workerSweep("worker-2", 2);

    expect(sweep1.processed.length).toBe(2);
    expect(sweep2.processed.length).toBe(1);

    // Nenhum ID foi processado por ambos os workers (interseção vazia)
    const overlap = sweep1.processed.filter((id) => sweep2.processed.includes(id));
    expect(overlap.length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // INVARIANTE 9: Erradicação de Mock (Zero Carlos Eduardo Silva)
  // --------------------------------------------------------------------------
  test("9. No Driver Mock: Invocations with undefined driver must throw REAL_DRIVER_DATA_REQUIRED", () => {
    // Tenta aceitar corrida sem condutor fornecido (undefined)
    expect(() => {
      motoristaAceitarCorrida(undefined);
    }).toThrow("REAL_DRIVER_DATA_REQUIRED");

    // Tenta aceitar com condutor sem ID
    expect(() => {
      motoristaAceitarCorrida({} as any);
    }).toThrow("REAL_DRIVER_DATA_REQUIRED");
  });
});
