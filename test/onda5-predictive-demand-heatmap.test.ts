/**
 * ==============================================================================
 * 🧪 ONDA 5 TEST SUITE: PREDICTIVE DEMAND & CONTROL TOWER HEATMAP ENGINE
 * ==============================================================================
 * Certificação técnica da Torre de Demanda Preditiva:
 * 1. Cálculo matemático de Desbalanceamento (Imbalance Ratio) e Severidade
 * 2. Previsão de tendência temporal e projeção de chamadas (30-min forecast)
 * 3. Geração de GeoJSON térmico otimizado para WebGL no Mapbox GL
 * 4. Disparo atômico de incentivo operacional com registro na trilha de auditoria
 * 5. Cooldown antiflood para proteção contra notificações abusivas em condutores
 * 6. Atualização dinâmica de telemetria com recomputação de métricas
 * ==============================================================================
 */

import { describe, test, expect, waitForAllTests } from "./test-harness.mjs";
import {
  predictiveDemandEngine,
  type DemandCluster,
} from "../src/lib/spatial/predictive-demand-engine";
import { AuditTrailService } from "../src/lib/security/audit-trail";

describe("Onda 5 — Predictive Demand & Control Tower Engine", () => {
  test("TC-PRD-01: Cálculo matemático de Imbalance Ratio e Classificação de Severidade", () => {
    // Caso 1: Demanda Crítica (16 chamadas para 2 motoristas = 8.0x)
    const clusterCritico = predictiveDemandEngine.computeClusterMetrics({
      id: "test-c1",
      name: "Terminal Urbano",
      bairro: "Centro",
      city: "Praça Teste",
      centerCoords: [-41.88, -21.20],
      radiusMeters: 1000,
      activeRequests: 16,
      availableDrivers: 2,
    });

    expect(clusterCritico.imbalanceRatio).toBe(8.0);
    expect(clusterCritico.severity).toBe("CRITICA");
    expect(clusterCritico.suggestedIncentive).toBe("+25%");
    expect(clusterCritico.suggestedMultiplier).toBe(1.25);

    // Caso 2: Demanda Alta (6 chamadas para 3 motoristas = 2.0x)
    const clusterAlta = predictiveDemandEngine.computeClusterMetrics({
      id: "test-c2",
      name: "Polo Comercial",
      bairro: "Norte",
      city: "Praça Teste",
      centerCoords: [-41.87, -21.19],
      radiusMeters: 1000,
      activeRequests: 6,
      availableDrivers: 3,
    });

    expect(clusterAlta.imbalanceRatio).toBe(2.0);
    expect(clusterAlta.severity).toBe("ALTA");
    expect(clusterAlta.suggestedIncentive).toBe("+15%");
    expect(clusterAlta.suggestedMultiplier).toBe(1.15);

    // Caso 3: Demanda Moderada (5 chamadas para 4 motoristas = 1.25x)
    const clusterMod = predictiveDemandEngine.computeClusterMetrics({
      id: "test-c3",
      name: "Bairro Residencial",
      bairro: "Sul",
      city: "Praça Teste",
      centerCoords: [-41.89, -21.22],
      radiusMeters: 1000,
      activeRequests: 5,
      availableDrivers: 4,
    });

    expect(clusterMod.imbalanceRatio).toBe(1.25);
    expect(clusterMod.severity).toBe("MODERADA");
    expect(clusterMod.suggestedIncentive).toBe("+10%");

    // Caso 4: Equilibrada (2 chamadas para 4 motoristas = 0.5x)
    const clusterEq = predictiveDemandEngine.computeClusterMetrics({
      id: "test-c4",
      name: "Praça Central",
      bairro: "Centro",
      city: "Praça Teste",
      centerCoords: [-41.88, -21.20],
      radiusMeters: 1000,
      activeRequests: 2,
      availableDrivers: 4,
    });

    expect(clusterEq.imbalanceRatio).toBe(0.5);
    expect(clusterEq.severity).toBe("EQUILIBRADA");
    expect(clusterEq.suggestedIncentive).toBe("+0%");
  });

  test("TC-PRD-02: Previsão de tendência temporal baseada em curvas de pico urbano", () => {
    // Horário de Pico Noturno (18h)
    const predicaoPico = predictiveDemandEngine.predictTrend("cluster-centro-terminal", 18);
    expect(predicaoPico.trend).toBe("RISING");
    expect(predicaoPico.forecastCallsDelta > 0).toBe(true);
    expect(predicaoPico.message).toContain("Pico Iminente");

    // Horário de Almoço (12h)
    const predicaoAlmoco = predictiveDemandEngine.predictTrend("cluster-centro-terminal", 12);
    expect(predicaoAlmoco.trend).toBe("PEAKING");

    // Horário de Arrefecimento (14h)
    const predicaoEsfriando = predictiveDemandEngine.predictTrend("cluster-centro-terminal", 14);
    expect(predicaoEsfriando.trend).toBe("COOLING");
    expect(predicaoEsfriando.forecastCallsDelta < 0).toBe(true);
  });

  test("TC-PRD-03: Geração de GeoJSON com pesos e intensidades para Mapbox WebGL", () => {
    const geoJson = predictiveDemandEngine.generateHeatmapGeoJson();

    expect(geoJson.type).toBe("FeatureCollection");
    expect(geoJson.features.length >= 3).toBe(true);

    const firstFeature = geoJson.features[0];
    expect(firstFeature.geometry.type).toBe("Point");
    expect(Array.isArray(firstFeature.geometry.coordinates)).toBe(true);
    expect(typeof firstFeature.properties?.intensity).toBe("number");
    expect(typeof firstFeature.properties?.weight).toBe("number");
    expect(typeof firstFeature.properties?.severity).toBe("string");
  });

  test("TC-PRD-04: Disparo atômico de incentivo com auditoria criptográfica imutável", async () => {
    const clusters = predictiveDemandEngine.getDemandClusters();
    const clusterAlvo = clusters[0];

    const broadcastRes = await predictiveDemandEngine.broadcastSurgeIncentive({
      clusterId: clusterAlvo.id,
      radiusKm: 5,
      incentiveMultiplier: 1.25,
      adminUserId: "admin:gestor_franquia_01",
      tenantId: "tenant_demo",
    });

    expect(broadcastRes.status).toBe("SUCCESS");
    expect(broadcastRes.broadcastId.startsWith("SURGE-DISPATCH-")).toBe(true);
    expect(broadcastRes.driversAlerted > 0).toBe(true);
    expect(broadcastRes.incentiveMultiplier).toBe(1.25);

    // Verificação na Trilha de Auditoria
    const recentEvents = AuditTrailService.getInstance().getRecentEvents(20);
    const auditEvent = recentEvents.find(
      (e) =>
        e.action === "PREDICTIVE_DEMAND_INCENTIVE_DISPATCHED" &&
        e.details?.broadcastId === broadcastRes.broadcastId
    );

    expect(Boolean(auditEvent)).toBe(true);
    expect(auditEvent?.userId).toBe("admin:gestor_franquia_01");
    expect(auditEvent?.details?.multiplier).toBe(1.25);
  });

  test("TC-PRD-05: Cooldown antiflood bloqueia rajada consecutiva de alertas para o mesmo cluster", async () => {
    const clusters = predictiveDemandEngine.getDemandClusters();
    const clusterAlvo = clusters[0];

    // O cluster acabou de receber disparo no TC-PRD-04, logo deve estar em cooldown
    const segundoDisparo = await predictiveDemandEngine.broadcastSurgeIncentive({
      clusterId: clusterAlvo.id,
      radiusKm: 5,
      incentiveMultiplier: 1.25,
      adminUserId: "admin:gestor_franquia_01",
    });

    expect(segundoDisparo.status).toBe("COOLDOWN_ACTIVE");
    expect((segundoDisparo.cooldownRemainingSeconds || 0) > 0).toBe(true);
  });

  test("TC-PRD-06: Atualização dinâmica de telemetria recomputa métricas e notifica observadores", () => {
    let notified = false;
    const unsubscribe = predictiveDemandEngine.subscribe(() => {
      notified = true;
    });

    const clusters = predictiveDemandEngine.getDemandClusters();
    const clusterId = clusters[1].id;

    const updated = predictiveDemandEngine.updateClusterTelemetry(clusterId, {
      activeRequests: 25,
      availableDrivers: 1,
    });

    expect(updated).not.toBe(null);
    expect(updated?.activeRequests).toBe(25);
    expect(updated?.availableDrivers).toBe(1);
    expect(updated?.imbalanceRatio).toBe(25.0);
    expect(updated?.severity).toBe("CRITICA");
    expect(notified).toBe(true);

    unsubscribe();
  });
});

if (process.argv[1] && process.argv[1].includes("onda5")) {
  void (async () => {
    await waitForAllTests();
    setTimeout(() => {
      process.exit(0);
    }, 100);
  })();
}
