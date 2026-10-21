import { describe, test, expect } from "./test-harness.mjs";
import { driverExclusionZonesEngine } from "../src/lib/geo/driver-exclusion-zones";
import { driverDestinationModeService } from "../src/services/DriverDestinationModeService";
import { driverAudioHudEngine } from "../src/lib/driver/audio-hud-engine";
import { scheduledRideEngine } from "../src/lib/ride/scheduled-ride-engine";

describe("44. DRIVER EFFICIENCY — PERSONAL EXCLUSION ZONES & COMMUNITY RADAR", () => {
  test("1. Cadastro e Limite de 3 Zonas: Salva zonas e impede ultrapassar limite", () => {
    const driverId = "drv_test_zones_01";

    const z1 = driverExclusionZonesEngine.saveZone(driverId, {
      name: "Trevo Norte",
      center: { lat: -21.205, lng: -41.89 },
      radiusKm: 1.5,
      startHour: 20,
      endHour: 6,
      active: true,
    });
    expect(z1.success).toBe(true);

    const z2 = driverExclusionZonesEngine.saveZone(driverId, {
      name: "Bairro Industrial",
      center: { lat: -21.22, lng: -41.87 },
      radiusKm: 2.0,
      startHour: 21,
      endHour: 5,
      active: true,
    });
    expect(z2.success).toBe(true);

    const z3 = driverExclusionZonesEngine.saveZone(driverId, {
      name: "Perímetro Rural",
      center: { lat: -21.25, lng: -41.85 },
      radiusKm: 3.0,
      startHour: 19,
      endHour: 7,
      active: true,
    });
    expect(z3.success).toBe(true);

    // Tentativa de 4ª zona deve ser rejeitada
    const z4 = driverExclusionZonesEngine.saveZone(driverId, {
      name: "Zona Excedente",
      center: { lat: -21.21, lng: -41.88 },
      radiusKm: 1.0,
      startHour: 22,
      endHour: 4,
      active: true,
    });
    expect(z4.success).toBe(false);

    const list = driverExclusionZonesEngine.getZones(driverId);
    expect(list.length).toBe(3);
  });

  test("2. Janela de Horário e Filtragem Espacial: Bloqueia corrida cujo destino incide na zona ativa", () => {
    const driverId = "drv_test_zones_01";

    // Às 22h00 (dentro da janela 20h - 06h)
    const nightTime = new Date("2026-10-20T22:00:00");
    const checkNight = driverExclusionZonesEngine.isRideInExcludedZone(
      driverId,
      { lat: -21.19, lng: -41.9 }, // Origem fora
      { lat: -21.205, lng: -41.89 }, // Destino no Trevo Norte (dentro)
      nightTime,
    );
    expect(checkNight.isExcluded).toBe(true);
    expect(checkNight.zoneName).toBe("Trevo Norte");

    // Às 14h00 (fora da janela 20h - 06h)
    const dayTime = new Date("2026-10-20T14:00:00");
    const checkDay = driverExclusionZonesEngine.isRideInExcludedZone(
      driverId,
      { lat: -21.19, lng: -41.9 },
      { lat: -21.205, lng: -41.89 },
      dayTime,
    );
    expect(checkDay.isExcluded).toBe(false);
  });

  test("3. Classificação Comunitária de Segurança", () => {
    const ratingSafe = driverExclusionZonesEngine.getCommunitySafetyRating({
      lat: -21.205,
      lng: -41.89,
    });
    expect(ratingSafe.rating).toBe("ALTA_SEGURANCA");
    expect(ratingSafe.label).toBe("Área Monitorada & Segura");
  });
});

describe("45. DRIVER EFFICIENCY — DESTINATION MODE (INDO PARA CASA) & FAVORITOS", () => {
  test("1. Favorito Casa: Salva e ativa destino favorito com 1 toque", () => {
    const driverId = "drv_test_dest_01";
    driverDestinationModeService.clearDestination(driverId);

    driverDestinationModeService.setFavoriteHome(driverId, "Rua das Palmeiras, 100", {
      lat: -21.23,
      lng: -41.86,
    });

    const fav = driverDestinationModeService.getFavoriteHome(driverId);
    expect(fav?.address).toBe("Rua das Palmeiras, 100");

    const activated = driverDestinationModeService.activateFavoriteHome(driverId);
    expect(activated.success).toBe(true);
    expect(activated.destination?.address).toBe("Rua das Palmeiras, 100");

    const current = driverDestinationModeService.getActiveDestination(driverId);
    expect(current?.address).toBe("Rua das Palmeiras, 100");

    driverDestinationModeService.clearDestination(driverId);
  });

  test("2. Convergência Vetorial: Corrida que aproxima do destino é APROVADA", () => {
    const driverCoords = { lat: -21.2, lng: -41.9 }; // 15 km de casa
    const targetHome = { lat: -21.23, lng: -41.86 }; // Destino Casa
    const rideOrigem = { lat: -21.205, lng: -41.895 }; // Perto do motorista
    const rideDestino = { lat: -21.225, lng: -41.865 }; // Muito perto de casa!

    const converge = driverDestinationModeService.isRideConverging(
      driverCoords,
      rideOrigem,
      rideDestino,
      targetHome,
    );
    expect(converge).toBe(true);
  });
});

describe("46. SCHEDULED RIDES & NIGHT CHECK-IN GUARANTEE", () => {
  test("1. Criação e Reserva de Corrida Agendada: Salva e permite alocação prévia", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);

    const ride = scheduledRideEngine.createScheduledRide({
      passengerId: "usr_unit_test_01",
      passengerName: "Juliana Santos",
      passengerPhone: "(22) 98888-7777",
      pickupAddress: "Rua São José, 120",
      pickupCoords: { lat: -21.205, lng: -41.89 },
      destinationAddress: "Hospital São José do Avaí",
      destinationCoords: { lat: -21.21, lng: -41.885 },
      scheduledFor: tomorrow.toISOString(),
      category: "Carro",
      estimatedFareCents: 2800,
      notes: "Consulta médica agendada para 06h30.",
    });

    expect(ride.status).toBe("SCHEDULED_SEARCHING");
    expect(ride.estimatedFareCents).toBe(2800);

    // Motorista reivindica
    const claimRes = scheduledRideEngine.claimScheduledRide(
      ride.id,
      "drv_escala_01",
      "Carlos Andrade",
      "Fiat Cronos Branco",
      "(22) 97777-6666",
    );

    expect(claimRes.success).toBe(true);
    expect(claimRes.ride?.status).toBe("DRIVER_CONFIRMED");
    expect(claimRes.ride?.assignedDriverName).toBe("Carlos Andrade");
  });

  test("2. Protocolo de Check-in Noturno e Garantia de Escala", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(5, 30, 0, 0);

    const ride = scheduledRideEngine.createScheduledRide({
      passengerId: "usr_unit_test_02",
      passengerName: "Roberto Lima",
      passengerPhone: "(22) 99999-1234",
      pickupAddress: "Terminal Rodoviário",
      pickupCoords: { lat: -21.205, lng: -41.89 },
      destinationAddress: "Aeroporto",
      destinationCoords: { lat: -21.25, lng: -41.85 },
      scheduledFor: tomorrow.toISOString(),
      category: "Carro",
      estimatedFareCents: 6500,
    });

    scheduledRideEngine.claimScheduledRide(
      ride.id,
      "drv_escala_02",
      "Fernanda Lima",
      "Toyota Yaris",
      "(22) 98888-2222",
    );

    // Confirmação do Check-in Noturno
    const checkinRes = scheduledRideEngine.performNightCheckin(ride.id, "drv_escala_02");
    expect(checkinRes.success).toBe(true);
    expect(checkinRes.ride?.status).toBe("NIGHT_CHECKIN_CONFIRMED");
    expect(checkinRes.ride?.nightCheckinAt).not.toBe(undefined);
  });

  test("3. Realocação Automática de Inadimplência no Check-in Noturno", () => {
    // Corrida para amanhã cedo com prazo expirado
    const tomorrowEarly = new Date();
    tomorrowEarly.setDate(tomorrowEarly.getDate() + 1);
    tomorrowEarly.setHours(5, 0, 0, 0);

    const expiredDeadline = new Date();
    expiredDeadline.setHours(expiredDeadline.getHours() - 1); // Passou há 1 hora

    const ride = scheduledRideEngine.createScheduledRide({
      passengerId: "usr_unit_test_03",
      passengerName: "Marcos Paulo",
      passengerPhone: "(22) 97777-3333",
      pickupAddress: "Centro",
      pickupCoords: { lat: -21.205, lng: -41.89 },
      destinationAddress: "Indústria",
      destinationCoords: { lat: -21.22, lng: -41.88 },
      scheduledFor: tomorrowEarly.toISOString(),
      category: "Carro",
      estimatedFareCents: 4200,
    });

    scheduledRideEngine.claimScheduledRide(
      ride.id,
      "drv_escala_inadimplente",
      "Motorista Ausente",
      "Sedan Preto",
      "(22) 99999-0000",
    );

    // Simula prazo ultrapassado
    ride.nightCheckinDeadline = expiredDeadline.toISOString();

    const reallocated = scheduledRideEngine.reallocateOverdueCheckins();
    expect(reallocated.length).toBeGreaterThan(0);
    const target = reallocated.find((r) => r.id === ride.id);
    expect(target?.status).toBe("REALLOCATING");
    expect(target?.assignedDriverId).toBe(undefined);
  });
});
