/**
 * ==============================================================================
 * 🗺️ PARTIU — MAP PROVIDER ABSTRACTION INTERFACE (IMapProvider)
 * ==============================================================================
 * Define o contrato canônico universal para qualquer provedor de mapas (Mapbox,
 * Google Maps, OpenStreetMap/CARTO) na arquitetura White-Label Multi-Tenant.
 * ==============================================================================
 */

import type { RouteMetrics, RouteRequestOptions } from "@/services/RoutingService";
import type { GeocodedPlace, GeocodingOptions } from "@/services/GeocodingService";

export type MapProviderId = "mapbox" | "google" | "osm";

export interface ReverseGeocodeResult {
  formattedAddress: string;
  streetName?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface IMapProvider {
  readonly id: MapProviderId;
  readonly name: string;

  /**
   * Obtém a chave/token de autenticação isolada para o tenant
   */
  getAccessToken(tenantId?: string): string;

  /**
   * Retorna a URL de estilo vetorial ou raster correspondente ao variante
   */
  getStyleUrl(variant?: string): string;

  /**
   * Calcula rota e métricas de mobilidade urbana (distância, tempo, polyline)
   */
  getDirections(
    origin: [number, number],
    destination: [number, number],
    options?: RouteRequestOptions,
  ): Promise<RouteMetrics>;

  /**
   * Busca textual e autocompletar de endereços com geobias
   */
  geocode(query: string, options?: GeocodingOptions): Promise<GeocodedPlace[]>;

  /**
   * Converte coordenadas geográficas [lng, lat] em endereço textual legível
   */
  reverseGeocode(coords: [number, number]): Promise<ReverseGeocodeResult | null>;
}
