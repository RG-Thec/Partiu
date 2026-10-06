import { describe, test, expect } from "./test-harness.mjs";
import { whiteLabelEngine } from "../src/lib/white-label/white-label-engine.ts";
import { pricingService } from "../src/services/PricingService.ts";
import { reverseGeocodingService } from "../src/services/ReverseGeocodingService.ts";
import { geocodingService } from "../src/services/GeocodingService.ts";
import { matchingEngine } from "../src/services/MatchingEngine.ts";
import {
  formatarDataHora,
  formatarHoraMinuto,
  formatarMoeda,
  formatarDistancia,
  getDeviceTimezone,
} from "../src/utils/geo-formatters.ts";

describe("SUITE 53: 🌐 DYNAMIC GEOLOCATION & LOCATION-AGNOSTIC ADAPTATION", () => {
  // --------------------------------------------------------------------------
  // TESTE 1: Resolução de Praça Operacional e Geofencing Tarifário Dinâmico
  // --------------------------------------------------------------------------
  test("1.1 Resolução automática de Tenant por Coordenadas (Dentro da Área)", () => {
    // Coordenadas da Praça 1 (Itaperuna)
    const resItaperuna = whiteLabelEngine.findTenantByCoordinates(-21.205, -41.888);
    expect(resItaperuna).not.toBe(null);
    expect(resItaperuna!.tenant.tenantId).toBe("tenant-itaperuna");
    expect(resItaperuna!.isWithinServiceArea).toBe(true);
    expect(resItaperuna!.distanceKm).toBeLessThan(5);

    // Coordenadas da Praça 2 (Campos dos Goytacazes)
    const resCampos = whiteLabelEngine.findTenantByCoordinates(-21.754, -41.324);
    expect(resCampos).not.toBe(null);
    expect(resCampos!.tenant.tenantId).toBe("tenant-campos");
    expect(resCampos!.isWithinServiceArea).toBe(true);
    expect(resCampos!.distanceKm).toBeLessThan(5);
  });

  test("1.2 Detecção de Coordenadas Fora da Área Operacional Cadastrada (Elegância Regional)", () => {
    // Coordenadas de São Paulo - Marco Zero (-23.5505, -46.6333)
    const resSP = whiteLabelEngine.findTenantByCoordinates(-23.5505, -46.6333);
    expect(resSP).not.toBe(null);
    // Identifica o tenant mais próximo, mas marca fora da área de cobertura operacional
    expect(resSP!.isWithinServiceArea).toBe(false);
    expect(resSP!.distanceKm).toBeGreaterThan(100);
  });

  test("1.3 Injeção Contextual de Parâmetros de Tarifação por Coordenadas no PricingService", () => {
    const coordsItaperuna: [number, number] = [-41.888, -21.205];
    const settingsItap = pricingService.getPricingSettings(coordsItaperuna);
    expect(settingsItap.tenantId).toBe("tenant-itaperuna");
    expect(settingsItap.isWithinServiceArea).toBe(true);

    const coordsFora: [number, number] = [-46.633, -23.550]; // São Paulo
    const settingsSP = pricingService.getPricingSettings(coordsFora);
    expect(settingsSP.isWithinServiceArea).toBe(false);
  });

  // --------------------------------------------------------------------------
  // TESTE 2: Geocoding e Reverse Geocoding Agnósticos à Localização
  // --------------------------------------------------------------------------
  test("2.1 ReverseGeocodingService não força cidade arbitrária para coordenadas desconhecidas", async () => {
    // Coordenadas neutras em São Paulo (Av. Paulista)
    const coordsPaulista: [number, number] = [-46.655, -23.561];
    const instant = reverseGeocodingService.resolveInstantProximityAddress(coordsPaulista);
    // Não pode conter "Itaperuna"
    expect(instant.includes("Itaperuna")).toBe(false);
    expect(instant.includes("Ponto no Mapa") || instant.includes("Sua localização")).toBe(true);
  });

  test("2.2 ReverseGeocodingService preserva catálogo quando no raio estrito do polo", async () => {
    const coordsDezDeMaio: [number, number] = [-41.886, -21.2065];
    const instant = reverseGeocodingService.resolveInstantProximityAddress(coordsDezDeMaio);
    expect(instant.includes("Dez de Maio") || instant.includes("Itaperuna")).toBe(true);
  });

  test("2.3 GeocodingService suprime catálogo curado fora do raio do polo", async () => {
    // Usuário em Belo Horizonte buscando por locais sem digitação
    const coordsBH: [number, number] = [-43.9345, -19.9167];
    const sugestoesVazias = await geocodingService.buscarLugares("", coordsBH);
    // Não pode retornar pontos de Itaperuna quando o usuário está em BH
    expect(sugestoesVazias.length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // TESTE 3: Despacho Puramente Espacial (MatchingEngine)
  // --------------------------------------------------------------------------
  test("3.1 MatchingEngine calcula scores puramente por Haversine e ETA sem filtro textual de cidade", () => {
    const scoreA = matchingEngine.calculateScore({
      distanceMeters: 1000,
      etaMinutes: 3,
      subscriptionPlan: "OURO",
      acceptanceRate: 95,
      rating: 4.9,
      cancellationRate: 1,
    });

    const scoreB = matchingEngine.calculateScore({
      distanceMeters: 7000,
      etaMinutes: 20,
      subscriptionPlan: "FREE",
      acceptanceRate: 80,
      rating: 4.2,
      cancellationRate: 10,
    });

    expect(scoreA).toBeGreaterThan(scoreB);
  });

  // --------------------------------------------------------------------------
  // TESTE 4: Timezone Awareness & Internacionalização (i18n & L10n)
  // --------------------------------------------------------------------------
  test("4.1 Conversão de Timestamps UTC para fusos horários locais específicos", () => {
    // 15:00 UTC
    const utcTimestamp = "2026-10-06T15:00:00Z";

    // Em Brasília (UTC-3), 15:00 UTC deve ser 12:00
    const horaBrasilia = formatarHoraMinuto(utcTimestamp, "America/Sao_Paulo");
    expect(horaBrasilia).toBe("12:00");

    // Em Manaus (UTC-4), 15:00 UTC deve ser 11:00
    const horaManaus = formatarHoraMinuto(utcTimestamp, "America/Manaus");
    expect(horaManaus).toBe("11:00");

    // Em Lisboa (UTC+1 em horário de verão), 15:00 UTC deve ser 16:00
    const horaLisboa = formatarHoraMinuto(utcTimestamp, "Europe/Lisbon");
    expect(horaLisboa).toBe("16:00");
  });

  test("4.2 Formatação de Moeda com Parâmetros Dinâmicos", () => {
    const valor = 45.8;
    const formatadoBrl = formatarMoeda(valor, "BRL", "pt-BR");
    expect(formatadoBrl).toContain("45,80");

    const formatadoUsd = formatarMoeda(valor, "USD", "en-US");
    expect(formatadoUsd).toContain("45.80");
  });

  test("4.3 Formatação de Distância Amigável", () => {
    expect(formatarDistancia(450)).toBe("450 m");
    expect(formatarDistancia(4250)).toBe("4,3 km");
  });
});
