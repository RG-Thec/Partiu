/**
 * ==============================================================================
 * 🗺️ PARTIU — MAPBOX MAP PROVIDER IMPLEMENTATION
 * ==============================================================================
 * Implementação do provedor Mapbox GL, integrando estilos vetoriais,
 * cálculo de rotas com tráfego e serviços de geocodificação locais/remotos.
 * ==============================================================================
 */

import type { IMapProvider, MapProviderId, ReverseGeocodeResult } from "./IMapProvider";
import type { RouteMetrics, RouteRequestOptions } from "@/services/RoutingService";
import type { GeocodedPlace, GeocodingOptions } from "@/services/GeocodingService";
import { mapboxService } from "@/services/MapboxService";
import { routingService } from "@/services/RoutingService";
import { geocodingService } from "@/lib/passenger/geocoding-service";
import { reverseGeocodingService } from "@/services/ReverseGeocodingService";

export class MapboxMapProvider implements IMapProvider {
  public readonly id: MapProviderId = "mapbox";
  public readonly name: string = "Mapbox GL Standard Engine";

  public getAccessToken(tenantId?: string): string {
    return mapboxService.getAccessToken(tenantId);
  }

  public getStyleUrl(variant?: string): string {
    return mapboxService.getStyleUrl((variant as any) || "streets");
  }

  public async getDirections(
    origin: [number, number],
    destination: [number, number],
    options?: RouteRequestOptions,
  ): Promise<RouteMetrics> {
    return routingService.getRoute(origin, destination, options);
  }

  public async geocode(query: string, options?: GeocodingOptions): Promise<GeocodedPlace[]> {
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
