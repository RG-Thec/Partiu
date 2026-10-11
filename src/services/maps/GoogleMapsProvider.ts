/**
 * ==============================================================================
 * 🗺️ PARTIU — GOOGLE MAPS PROVIDER IMPLEMENTATION
 * ==============================================================================
 * Implementação do provedor Google Maps Platform para o ecossistema White-Label.
 * Suporta Directions API, Geocoding e estilos compatíveis.
 * ==============================================================================
 */

import type { IMapProvider, MapProviderId, ReverseGeocodeResult } from "./IMapProvider";
import type { RouteMetrics, RouteRequestOptions } from "@/services/RoutingService";
import type { GeocodedPlace, GeocodingOptions } from "@/services/GeocodingService";
import { routingService } from "@/services/RoutingService";
import { geocodingService } from "@/lib/passenger/geocoding-service";
import { reverseGeocodingService } from "@/services/ReverseGeocodingService";
import { whiteLabelEngine } from "@/lib/white-label/white-label-engine";

const DEFAULT_GOOGLE_KEY =
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.["VITE_GOOGLE_MAPS_KEY"] ||
      import.meta.env?.["VITE_GOOGLE_MAPS_API_KEY"] ||
      import.meta.env?.["GOOGLE_MAPS_API_KEY"])) ||
  (typeof process !== "undefined" &&
    (process.env?.["VITE_GOOGLE_MAPS_KEY"] ||
      process.env?.["VITE_GOOGLE_MAPS_API_KEY"] ||
      process.env?.["GOOGLE_MAPS_API_KEY"])) ||
  "";

export class GoogleMapsProvider implements IMapProvider {
  public readonly id: MapProviderId = "google";
  public readonly name: string = "Google Maps Platform Engine";

  public getAccessToken(tenantId?: string): string {
    const active = whiteLabelEngine.getTenantConfig(tenantId);
    if (active.geo?.googleMapsApiKey) {
      return active.geo.googleMapsApiKey;
    }
    return DEFAULT_GOOGLE_KEY;
  }

  public getStyleUrl(variant?: string): string {
    // URL padrão para renderização compatível ou raster tiles
    if (variant === "satellite") {
      return "satellite";
    }
    if (variant === "terrain") {
      return "terrain";
    }
    return "roadmap";
  }

  public async getDirections(
    origin: [number, number],
    destination: [number, number],
    options?: RouteRequestOptions,
  ): Promise<RouteMetrics> {
    return routingService.getRoute(origin, destination, {
      ...options,
      trafficAware: true,
    });
  }

  public async geocode(query: string, options?: GeocodingOptions): Promise<GeocodedPlace[]> {
    const apiKey = this.getAccessToken();
    if (!apiKey) {
      return geocodingService.buscarLugares(query, options?.proximity);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query,
      )}&key=${apiKey}&language=pt-BR`;
      const res = await fetch(url);
      if (!res.ok) {
        return geocodingService.buscarLugares(query, options?.proximity);
      }
      const data = await res.json();
      if (data.status === "OK" && Array.isArray(data.results)) {
        return data.results.slice(0, options?.limit || 5).map((r: any, idx: number) => ({
          id: `google_${r.place_id || idx}`,
          label: r.formatted_address?.split(",")[0] || query,
          sublabel: r.formatted_address || "",
          endereco: r.formatted_address || "",
          coords: [r.geometry.location.lng, r.geometry.location.lat] as [number, number],
          tipo: "rua" as const,
        }));
      }
    } catch {
      // Fallback gracioso
    }

    return geocodingService.buscarLugares(query, options?.proximity);
  }

  public async reverseGeocode(coords: [number, number]): Promise<ReverseGeocodeResult | null> {
    const res = await reverseGeocodingService.reverseGeocode(coords);
    if (!res) return null;

    return {
      formattedAddress: res.formattedAddress,
      streetName: res.street,
      neighborhood: res.neighborhood,
      city: res.city,
      state: res.state,
    };
  }
}
