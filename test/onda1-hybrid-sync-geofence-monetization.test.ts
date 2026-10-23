/**
 * ==============================================================================
 * 🚀 SUÍTE ONDA 1: SINCRONISMO HÍBRIDO, GEOFENCING & SANEAMENTO DE MONETIZAÇÃO
 * ==============================================================================
 * Testes de certificação das três frentes fundamentais da Onda 1 (P0):
 * 1. Saneamento Canônico de Monetização (Harmonização de Catálogos).
 * 2. Sincronismo Híbrido com Polling Adaptativo de Contingência (SCENE_CODE_POLL_ORDER_STATUS).
 * 3. Geofencing Automático (< 150m) e Tolerância de Espera No-Show (Cronômetro 5 min).
 * ==============================================================================
 */

import { describe, test, testAsync, expect } from "./test-harness.mjs";
import { configMonetizacaoInicial, getMonetizacaoConfig } from "../src/lib/superadmin-config.ts";
import { subscriptionEngine } from "../src/lib/revenue/subscription-engine.ts";
import { DEFAULT_MONETIZATION_PLANS } from "../src/services/subscription/PixBillingService.ts";
import { realtimeConnectionManager } from "../src/services/RealtimeConnectionManager.ts";
import { geofenceArrivalService } from "../src/lib/spatial/geofence-arrival-service.ts";

describe("SUITE ONDA 1 — MÓDULO 1: Saneamento Canônico dos Catálogos de Monetização", () => {
  test("1. ConfigMonetizacaoInicial deve estar alinhado aos planos canônicos", () => {
    expect(configMonetizacaoInicial.diariaCarro).toBe(14.9);
    expect(configMonetizacaoInicial.diariaMoto).toBe(9.9);
    expect(configMonetizacaoInicial.semanalCarro).toBe(69.9);
    expect(configMonetizacaoInicial.mensalCarro).toBe(199.9);
    expect(configMonetizacaoInicial.trialAtivo).toBe(true);
    expect(configMonetizacaoInicial.trialDias).toBe(7);
  });

  test("2. SubscriptionEngine (INITIAL_DRIVER_PLANS) deve ter paridade de valores com PixBillingService", () => {
    const plans = subscriptionEngine.getAllPlans();
    const bronze = plans.find((p) => p.id === "plano-bronze");
    const prata = plans.find((p) => p.id === "plano-prata");
    const ouro = plans.find((p) => p.id === "plano-ouro");

    expect(bronze).toBeDefined();
    expect(bronze?.dailyFeeBrl).toBe(14.9);
    expect(bronze?.commissionPercent).toBe(0.0);

    expect(prata).toBeDefined();
    expect(prata?.weeklyFeeBrl).toBe(69.9);
    expect(prata?.commissionPercent).toBe(0.0);

    expect(ouro).toBeDefined();
    expect(ouro?.monthlyFeeBrl).toBe(199.9);
    expect(ouro?.dailyFeeBrl).toBe(9.9);
    expect(ouro?.commissionPercent).toBe(0.0);
  });

  test("3. Todos os planos canônicos oficiais devem preservar 0.0% de comissão por corrida", () => {
    for (const plan of DEFAULT_MONETIZATION_PLANS) {
      expect(plan.commission_percent).toBe(0.0);
      expect(plan.daily_fee > 0).toBe(true);
      expect(plan.weekly_fee > 0).toBe(true);
      expect(plan.monthly_fee > 0).toBe(true);
    }
  });
});

describe("SUITE ONDA 1 — MÓDULO 2: Sincronismo Híbrido com Polling Adaptativo", () => {
  test("4. RealtimeConnectionManager: Registro e cancelamento de Polling Adaptativo", () => {
    const rideId = `ride_test_polling_${Date.now()}`;
    let updateReceived = false;

    const stopPolling = realtimeConnectionManager.startRideAdaptivePolling(rideId, () => {
      updateReceived = true;
    });

    expect(typeof stopPolling).toBe("function");

    // Simula notificação de evento realtime recebido
    realtimeConnectionManager.notifyRideEventReceived(rideId, "EN_ROUTE");

    // Cancela o polling
    stopPolling();
    expect(updateReceived).toBe(false);
  });
});

describe("SUITE ONDA 1 — MÓDULO 3: Geofencing Automático & Tolerância de Espera No-Show", () => {
  test("5. Geofence Arrival: Detecção com raio expandido de 150m (padrão 99)", () => {
    geofenceArrivalService.reset();

    const pickup = { lat: -21.205, lng: -41.888 };
    // Ponto a ~120 metros de distância (delta de ~0.0011 graus ≈ 120m)
    const driverA120m = { lat: -21.2061, lng: -41.888 };
    // Ponto a ~300 metros
    const driverA300m = { lat: -21.2077, lng: -41.888 };

    const res120m = geofenceArrivalService.checkArrival(driverA120m, pickup, 150);
    expect(res120m.isWithinThreshold).toBe(true);
    expect(res120m.distanceMeters <= 150).toBe(true);

    const res300m = geofenceArrivalService.checkArrival(driverA300m, pickup, 150);
    expect(res300m.isWithinThreshold).toBe(false);
  });

  test("6. No-Show Wait Tolerance: Inicia com 300s (5 min) e calcula elegibilidade", () => {
    geofenceArrivalService.reset();
    const rideId = "RIDE_WAIT_TEST_001";

    // Inicia contagem regressiva de 300 segundos
    const statusInicial = geofenceArrivalService.startWaitToleranceTimer(rideId, 300);
    expect(statusInicial.rideId).toBe(rideId);
    expect(statusInicial.durationSeconds).toBe(300);
    expect(statusInicial.remainingSeconds).toBe(300);
    expect(statusInicial.isNoShowEligible).toBe(false);

    // Consulta estado
    const statusConsultado = geofenceArrivalService.getWaitToleranceStatus(rideId);
    expect(statusConsultado).toBeDefined();
    expect(statusConsultado?.isNoShowEligible).toBe(false);

    // Teste com timer zero/expirado para verificar elegibilidade de cancelamento pago
    const rideExpirada = "RIDE_EXPIRED_TEST_002";
    geofenceArrivalService.startWaitToleranceTimer(rideExpirada, 0);
    const statusExpirado = geofenceArrivalService.getWaitToleranceStatus(rideExpirada);
    expect(statusExpirado?.isNoShowEligible).toBe(true);
    expect(statusExpirado?.remainingSeconds).toBe(0);

    // Limpeza
    geofenceArrivalService.clearRide(rideId);
    geofenceArrivalService.clearRide(rideExpirada);
    expect(geofenceArrivalService.getWaitToleranceStatus(rideId)).toBe(null);
  });
});
