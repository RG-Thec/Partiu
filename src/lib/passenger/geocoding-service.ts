/**
 * ==============================================================================
 * 📍 PARTIU — GEOCODING & REVERSE GEOCODING SERVICE (ITAPERUNA / REGIONAL)
 * ==============================================================================
 * Resolução inteligente de endereços e coordenadas:
 * - Autocomplete de ruas, bairros e pontos de interesse de Itaperuna e região.
 * - Priorização geográfica (Geobias) baseada na localização exata do usuário.
 * - Geocodificação reversa (coordenadas [lng, lat] -> nome legível da via).
 * - Integração online de alta velocidade (Photon / OSM) com fallback instantâneo.
 * ==============================================================================
 */

import { silentCatchWarn } from "@/lib/structured-logger";
import { reverseGeocodingService } from "@/services/ReverseGeocodingService";
import {
  geocodingService as geocodingServiceCore,
  LUGARES_CURADOS_ITAPERUNA,
  type GeocodedPlace,
  type GeocodingOptions,
  calcularDistanciaHaversineMetros,
  formatarDistanciaLegivel,
} from "@/services/GeocodingService";

export type { GeocodedPlace, GeocodingOptions };
export { LUGARES_CURADOS_ITAPERUNA, calcularDistanciaHaversineMetros, formatarDistanciaLegivel };

class PassengerGeocodingService {
  private cacheReverso = new Map<string, string>();

  /**
   * Busca preditiva de endereços e pontos de interesse (Autocomplete em tempo real)
   * Aceita coordenadas de origem para priorizar bairros e vias próximas ao passageiro.
   */
  async buscarLugares(
    termo: string,
    coordsOrigem?: [number, number]
  ): Promise<GeocodedPlace[]> {
    return geocodingServiceCore.buscarLugares(termo, coordsOrigem);
  }

  /**
   * Geocodificação reversa: Coordenadas [lng, lat] para endereço em texto legível
   * Utiliza motor de alta fidelidade (Mapbox Places + OpenStreetMap Nominatim)
   */
  async geocodificarReverso(coords: [number, number]): Promise<string> {
    const key = `${coords[0].toFixed(4)},${coords[1].toFixed(4)}`;
    if (this.cacheReverso.has(key)) {
      return this.cacheReverso.get(key)!;
    }

    try {
      const res = await reverseGeocodingService.reverseGeocode(coords);
      if (res && res.formattedAddress) {
        this.cacheReverso.set(key, res.formattedAddress);
        return res.formattedAddress;
      }
    } catch (err) {
      silentCatchWarn("passenger-geocoding-service", err);
    }

    return `Local no mapa (${coords[1].toFixed(4)}, ${coords[0].toFixed(4)})`;
  }
}

export const geocodingService = new PassengerGeocodingService();
