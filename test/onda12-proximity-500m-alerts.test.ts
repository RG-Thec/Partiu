/**
 * ==============================================================================
 * 🧪 SUÍTE DE TESTES: ONDA 12 — ALERTA DE PROXIMIDADE 500M (EMBARQUE & DESTINO)
 * ==============================================================================
 * Cobertura completa do sistema de alerta sonoro, visual e síntese de voz a 500m:
 * 1. Precisão da fórmula geodésica Haversine para limiares de proximidade (500m).
 * 2. Acionamento único (single-trigger guarantee / idempotência) por etapa.
 * 3. Independência de etapas para a mesma corrida (PICKUP e DESTINATION).
 * 4. Disparo do evento customizado global 'partiu:proximity_500m_alert'.
 * 5. Ciclo de vida e limpeza (clearRide e reset).
 * ==============================================================================
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { geofenceArrivalService } from "../src/lib/spatial/geofence-arrival-service";

describe("ONDA 12: Alerta de Proximidade 500m (Embarque e Destino)", () => {
  beforeEach(() => {
    geofenceArrivalService.reset();
  });

  // Coordenadas base em Maceió / Itaperuna para testes
  const pontoOrigemEmbarque = { lat: -9.6658, lng: -35.7351 };
  // Ponto a ~400 metros de distância
  const ponto400m = { lat: -9.6625, lng: -35.734 };
  // Ponto a ~800 metros de distância
  const ponto800m = { lat: -9.673, lng: -35.736 };
  // Ponto de destino final
  const pontoDestinoFinal = { lat: -9.65, lng: -35.72 };
  // Ponto a ~450 metros do destino
  const ponto450mDoDestino = { lat: -9.6535, lng: -35.722 };

  it("1.1 Deve calcular distâncias geodésicas Haversine com alta precisão", () => {
    const dist400 = geofenceArrivalService.calculateDistanceMeters(
      pontoOrigemEmbarque,
      ponto400m,
    );
    assert.ok(dist400 >= 350 && dist400 <= 450, `Distância esperada ~400m, obtido: ${dist400}m`);

    const dist800 = geofenceArrivalService.calculateDistanceMeters(
      pontoOrigemEmbarque,
      ponto800m,
    );
    assert.ok(dist800 >= 750 && dist800 <= 850, `Distância esperada ~800m, obtido: ${dist800}m`);
  });

  it("1.2 Não deve disparar alerta de 500m quando condutor estiver a mais de 500m", () => {
    const rideId = "corrida-teste-800m";
    const triggered = geofenceArrivalService.shouldTriggerProximity500m(
      rideId,
      "PICKUP",
      ponto800m,
      pontoOrigemEmbarque,
      500,
    );

    assert.equal(triggered, false);
    assert.equal(geofenceArrivalService.isProximity500mTriggered(rideId, "PICKUP"), false);
  });

  it("1.3 Deve disparar alerta de aproximação ao embarque quando motorista estiver a <= 500m", () => {
    const rideId = "corrida-teste-pickup-400m";
    const triggered = geofenceArrivalService.shouldTriggerProximity500m(
      rideId,
      "PICKUP",
      ponto400m,
      pontoOrigemEmbarque,
      500,
    );

    assert.equal(triggered, true);
    assert.equal(geofenceArrivalService.isProximity500mTriggered(rideId, "PICKUP"), true);
  });

  it("1.4 Deve garantir disparo único (idempotência) para a etapa PICKUP na mesma corrida", () => {
    const rideId = "corrida-teste-idempotencia";

    // Primeiro disparo (entra no raio de 500m)
    const trigger1 = geofenceArrivalService.shouldTriggerProximity500m(
      rideId,
      "PICKUP",
      ponto400m,
      pontoOrigemEmbarque,
      500,
    );
    assert.equal(trigger1, true);

    // Segundo sinal de GPS (ainda dentro do raio ou mais perto, ex: 350m)
    const trigger2 = geofenceArrivalService.shouldTriggerProximity500m(
      rideId,
      "PICKUP",
      ponto400m,
      pontoOrigemEmbarque,
      500,
    );
    assert.equal(trigger2, false, "Segundo sinal não deve disparar novamente");
  });

  it("1.5 Deve permitir disparar o alerta de DESTINATION de forma independente para a mesma corrida", () => {
    const rideId = "corrida-fluxo-completo";

    // 1. Etapa de Embarque
    const triggerPickup = geofenceArrivalService.shouldTriggerProximity500m(
      rideId,
      "PICKUP",
      ponto400m,
      pontoOrigemEmbarque,
      500,
    );
    assert.equal(triggerPickup, true);

    // 2. Etapa de Destino - antes dos 500m não dispara
    const triggerDestinoLonge = geofenceArrivalService.shouldTriggerProximity500m(
      rideId,
      "DESTINATION",
      pontoOrigemEmbarque,
      pontoDestinoFinal,
      500,
    );
    assert.equal(triggerDestinoLonge, false);

    // 3. Etapa de Destino - ao atingir 450m do destino final, dispara com sucesso
    const triggerDestinoPerto = geofenceArrivalService.shouldTriggerProximity500m(
      rideId,
      "DESTINATION",
      ponto450mDoDestino,
      pontoDestinoFinal,
      500,
    );
    assert.equal(triggerDestinoPerto, true);

    // 4. Verificação de estados independentes
    assert.equal(geofenceArrivalService.isProximity500mTriggered(rideId, "PICKUP"), true);
    assert.equal(geofenceArrivalService.isProximity500mTriggered(rideId, "DESTINATION"), true);

    // 5. Destino também não pode disparar duas vezes
    const triggerDestinoRepetido = geofenceArrivalService.shouldTriggerProximity500m(
      rideId,
      "DESTINATION",
      ponto450mDoDestino,
      pontoDestinoFinal,
      500,
    );
    assert.equal(triggerDestinoRepetido, false);
  });

  it("1.6 Deve emitir o CustomEvent partiu:proximity_500m_alert com payload estruturado", () => {
    const rideId = "corrida-evento-teste";
    let eventoRecebido: any = null;

    // Configura mock de window/EventTarget se estiver rodando em Node
    const originalWindow = (globalThis as any).window;

    const listeners: Record<string, ((e: any) => void)[]> = {};
    (globalThis as any).window = {
      dispatchEvent: (event: any) => {
        const handlers = listeners[event.type] || [];
        handlers.forEach((h) => h(event));
        return true;
      },
      addEventListener: (type: string, handler: any) => {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(handler);
      },
      removeEventListener: (type: string, handler: any) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((h) => h !== handler);
        }
      },
    };

    (globalThis as any).window.addEventListener("partiu:proximity_500m_alert", (e: any) => {
      eventoRecebido = e.detail;
    });

    try {
      geofenceArrivalService.shouldTriggerProximity500m(
        rideId,
        "PICKUP",
        ponto400m,
        pontoOrigemEmbarque,
        500,
      );

      assert.ok(eventoRecebido, "Evento customizado deve ter sido recebido");
      assert.equal(eventoRecebido.rideId, rideId);
      assert.equal(eventoRecebido.stage, "PICKUP");
      assert.ok(eventoRecebido.distanceMeters <= 500);
      assert.ok(eventoRecebido.timestamp > 0);
    } finally {
      (globalThis as any).window = originalWindow;
    }
  });

  it("1.7 Deve limpar estados com clearRide permitindo novo ciclo para o mesmo ID", () => {
    const rideId = "corrida-reaproveitada";

    geofenceArrivalService.shouldTriggerProximity500m(
      rideId,
      "PICKUP",
      ponto400m,
      pontoOrigemEmbarque,
      500,
    );
    assert.equal(geofenceArrivalService.isProximity500mTriggered(rideId, "PICKUP"), true);

    geofenceArrivalService.clearRide(rideId);
    assert.equal(geofenceArrivalService.isProximity500mTriggered(rideId, "PICKUP"), false);

    // Deve poder disparar novamente após limpeza
    const retrig = geofenceArrivalService.shouldTriggerProximity500m(
      rideId,
      "PICKUP",
      ponto400m,
      pontoOrigemEmbarque,
      500,
    );
    assert.equal(retrig, true);
  });

  it("1.8 Deve limpar todos os estados com reset", () => {
    geofenceArrivalService.shouldTriggerProximity500m(
      "ride-1",
      "PICKUP",
      ponto400m,
      pontoOrigemEmbarque,
      500,
    );
    geofenceArrivalService.shouldTriggerProximity500m(
      "ride-2",
      "DESTINATION",
      ponto450mDoDestino,
      pontoDestinoFinal,
      500,
    );

    assert.equal(geofenceArrivalService.isProximity500mTriggered("ride-1", "PICKUP"), true);
    assert.equal(geofenceArrivalService.isProximity500mTriggered("ride-2", "DESTINATION"), true);

    geofenceArrivalService.reset();

    assert.equal(geofenceArrivalService.isProximity500mTriggered("ride-1", "PICKUP"), false);
    assert.equal(geofenceArrivalService.isProximity500mTriggered("ride-2", "DESTINATION"), false);
  });
});
