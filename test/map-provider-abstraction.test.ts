import { describe, test, testAsync, expect } from "./test-harness.mjs";
import { mapProviderFactory, MapProviderFactory } from "../src/services/maps/MapProviderFactory.ts";
import { MapboxMapProvider } from "../src/services/maps/MapboxMapProvider.ts";
import { GoogleMapsProvider } from "../src/services/maps/GoogleMapsProvider.ts";
import { whiteLabelEngine } from "../src/lib/white-label/white-label-engine.ts";

describe("🗺️ Suíte: Map Provider Abstraction Layer (IMapProvider)", () => {
  test("1. Deve registrar e resolver instâncias de Mapbox e Google Maps", () => {
    const mapbox = mapProviderFactory.getProviderById("mapbox");
    expect(mapbox).toBeDefined();
    expect(mapbox.id).toBe("mapbox");
    expect(mapbox.name).toBe("Mapbox GL Standard Engine");

    const google = mapProviderFactory.getProviderById("google");
    expect(google).toBeDefined();
    expect(google.id).toBe("google");
    expect(google.name).toBe("Google Maps Platform Engine");
  });

  test("2. Deve retornar Mapbox como fallback padrão seguro", () => {
    const fallback = mapProviderFactory.getProviderById("unknown" as any);
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe("mapbox");
  });

  test("3. Deve resolver o provedor configurado no White-Label do Tenant", () => {
    // Configura tenant existente com Google Maps
    const testTenantId = "tenant-campos";
    const originalConfig = whiteLabelEngine.getTenantConfig(testTenantId);
    const originalGeo = { ...originalConfig.geo };

    whiteLabelEngine.updateTenantConfig(testTenantId, {
      ...originalConfig,
      geo: {
        ...originalConfig.geo,
        mapProvider: "google",
        googleMapsApiKey: "AIzaSyTestApiKeyMock12345",
      },
    });

    const resolved = mapProviderFactory.getProvider(testTenantId);
    expect(resolved.id).toBe("google");
    expect(resolved.getAccessToken(testTenantId)).toBe("AIzaSyTestApiKeyMock12345");

    // Restaura configuração original
    whiteLabelEngine.updateTenantConfig(testTenantId, {
      ...originalConfig,
      geo: originalGeo,
    });
  });

  test("4. Provedores devem implementar interface canônica com métodos essenciais", () => {
    const mapbox = new MapboxMapProvider();
    expect(typeof mapbox.getAccessToken).toBe("function");
    expect(typeof mapbox.getStyleUrl).toBe("function");
    expect(typeof mapbox.getDirections).toBe("function");
    expect(typeof mapbox.geocode).toBe("function");
    expect(typeof mapbox.reverseGeocode).toBe("function");

    const google = new GoogleMapsProvider();
    expect(typeof google.getAccessToken).toBe("function");
    expect(typeof google.getStyleUrl).toBe("function");
    expect(typeof google.getDirections).toBe("function");
    expect(typeof google.geocode).toBe("function");
    expect(typeof google.reverseGeocode).toBe("function");
  });
});
