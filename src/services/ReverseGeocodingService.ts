/**
 * ==============================================================================
 * 📍 PARTIU — REVERSE GEOCODING SERVICE (COORDINATES TO ADDRESS ENGINE)
 * ==============================================================================
 * Resolução precisa de coordenadas de satélite [longitude, latitude] para
 * endereço estruturado com rua, número, bairro, cidade e estado.
 *
 * Exemplo de Saída:
 * "Rua Amadeu Tinoco Lacerda, 492, Centro, Itaperuna - RJ"
 * ==============================================================================
 */

import { MapboxConfig } from "@/config/MapboxConfig";
import {
  LUGARES_CURADOS_ITAPERUNA,
  calcularDistanciaHaversineMetros,
} from "./GeocodingService";

function isHighwayOrExpressway(name: string): boolean {
  return /\b(RJ-\d+|BR-\d+|Rodovia|Estrada|Via Expressa|Highway)\b/i.test(name);
}

export interface ReverseGeocodedAddress {
  street: string;
  number?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode?: string;
  formattedAddress: string;
  coords: [number, number]; // [lng, lat]
}

export class ReverseGeocodingService {
  private static instance: ReverseGeocodingService;

  // Cache em memória de endereços reversos (tolerância de ~10m)
  private cache = new Map<string, { address: ReverseGeocodedAddress; timestamp: number }>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

  private constructor() {}

  public static getInstance(): ReverseGeocodingService {
    if (!ReverseGeocodingService.instance) {
      ReverseGeocodingService.instance = new ReverseGeocodingService();
    }
    return ReverseGeocodingService.instance;
  }

  private getCacheKey(lng: number, lat: number): string {
    return `${lng.toFixed(4)},${lat.toFixed(4)}`;
  }

  /**
   * Geocodificação reversa de coordenadas para endereço brasileiro estruturado
   * com proteção estrita contra snapping indevido em rodovias e priorização da via residencial mais próxima.
   */
  public async reverseGeocode(
    coordsOrLat: [number, number] | { lat: number; lng: number } | number,
    lngParam?: number
  ): Promise<ReverseGeocodedAddress> {
    let lat: number;
    let lng: number;

    if (Array.isArray(coordsOrLat)) {
      lng = coordsOrLat[0];
      lat = coordsOrLat[1];
    } else if (typeof coordsOrLat === "object") {
      lat = coordsOrLat.lat;
      lng = coordsOrLat.lng;
    } else if (typeof coordsOrLat === "number" && typeof lngParam === "number") {
      lat = coordsOrLat;
      lng = lngParam;
    } else {
      throw new Error("[ReverseGeocodingService] Coordenadas inválidas.");
    }

    const cacheKey = this.getCacheKey(lng, lat);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.address;
    }

    // 1. Verificação de proximidade imediata ao catálogo local curado (< 45m)
    // Se o passageiro estiver fisicamente dentro da rua sem saída ou via residencial catalogada,
    // retorna instantaneamente o endereço exato com bairro correto.
    let bestCurated = LUGARES_CURADOS_ITAPERUNA[0];
    let minCuratedDist = Infinity;
    for (const place of LUGARES_CURADOS_ITAPERUNA) {
      const d = calcularDistanciaHaversineMetros([lng, lat], place.coords);
      if (d < minCuratedDist) {
        minCuratedDist = d;
        bestCurated = place;
      }
    }

    if (minCuratedDist <= 45 && bestCurated) {
      const bairro = bestCurated.bairro || "São Mateus";
      const result: ReverseGeocodedAddress = {
        street: bestCurated.label,
        neighborhood: bairro,
        city: "Itaperuna",
        state: "RJ",
        formattedAddress: bestCurated.endereco || `${bestCurated.label} - ${bairro}, Itaperuna - RJ`,
        coords: [lng, lat],
      };
      this.cache.set(cacheKey, { address: result, timestamp: Date.now() });
      return result;
    }

    // 2. Consulta de alta precisão via OpenStreetMap Nominatim (zoom=18 para ruas locais e sem saída)
    let candidateNominatim: ReverseGeocodedAddress | null = null;
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const nomController = new AbortController();
      const nomTimeout = setTimeout(() => nomController.abort(), 3500);
      const nomRes = await fetch(nomUrl, {
        headers: { "Accept-Language": "pt-BR,pt;q=0.9", "User-Agent": "PartiuMobilidadeApp/1.0" },
        signal: nomController.signal,
      });
      clearTimeout(nomTimeout);

      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (nomData && nomData.address) {
          const addr = nomData.address;
          const street = addr.road || addr.pedestrian || addr.street || addr.suburb || "Rua Local";
          const number = addr.house_number || "";
          const neighborhood = addr.neighbourhood || addr.suburb || addr.quarter || bestCurated?.bairro || "São Mateus";
          const city = addr.city || addr.town || addr.municipality || addr.village || "Itaperuna";
          const state = addr.state ? (addr.state.length === 2 ? addr.state.toUpperCase() : "RJ") : "RJ";
          const streetPart = number ? `${street}, ${number}` : street;
          const formattedAddress = `${streetPart}, ${neighborhood}, ${city} - ${state}`;

          candidateNominatim = {
            street,
            number: number || undefined,
            neighborhood,
            city,
            state,
            postalCode: addr.postcode || undefined,
            formattedAddress,
            coords: [lng, lat],
          };
        }
      }
    } catch {
      // continua para consulta Mapbox
    }

    // 3. Consulta complementar via Mapbox Geocoding v5
    let candidateMapbox: ReverseGeocodedAddress | null = null;
    try {
      const token = MapboxConfig.getAccessToken();
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,neighborhood,poi,locality&language=pt&country=BR`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(url, { method: "GET", signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          // Filtra primeiro features que não sejam rodovias se houver opção residencial
          let selectedFeat = data.features[0];
          for (const feat of data.features) {
            const featName = feat.text || feat.place_name || "";
            if (!isHighwayOrExpressway(featName)) {
              selectedFeat = feat;
              break;
            }
          }

          const primary = selectedFeat;
          const context = primary.context || [];

          const street = primary.text || primary.place_name?.split(",")[0] || "Rua Local";
          const number = primary.address || "";
          const neighborhood =
            context.find((c: any) => c.id.startsWith("neighborhood"))?.text ||
            context.find((c: any) => c.id.startsWith("locality"))?.text ||
            bestCurated?.bairro ||
            "São Mateus";
          const rawState = context.find((c: any) => c.id.startsWith("region"))?.text || "RJ";
          const regionCode = context.find((c: any) => c.id.startsWith("region"))?.short_code;

          let state = "RJ";
          if (regionCode) {
            state = regionCode.replace(/^BR-/i, "").toUpperCase();
          } else {
            state = rawState.length === 2 ? rawState.toUpperCase() : "RJ";
          }

          const city =
            context.find((c: any) => c.id.startsWith("place"))?.text || "Itaperuna";
          const postalCode = context.find((c: any) => c.id.startsWith("postcode"))?.text;

          const streetPart = number ? `${street}, ${number}` : street;
          const formattedAddress = `${streetPart}, ${neighborhood}, ${city} - ${state}`;

          candidateMapbox = {
            street,
            number: number || undefined,
            neighborhood,
            city,
            state,
            postalCode: postalCode || undefined,
            formattedAddress,
            coords: [lng, lat],
          };
        }
      }
    } catch {
      // fallback
    }

    // 4. Decisão Inteligente (Smart Road Snapping):
    // Se o Mapbox indicou uma rodovia (ex: RJ-210) mas o Nominatim ou o catálogo local
    // identificou uma via residencial (ex: Rua C, Rua Oscar Inácio Rodrigues, Rua Benedito Nicolau),
    // descarta a rodovia e seleciona a via residencial mais próxima!
    if (candidateMapbox && isHighwayOrExpressway(candidateMapbox.street)) {
      if (candidateNominatim && !isHighwayOrExpressway(candidateNominatim.street)) {
        this.cache.set(cacheKey, { address: candidateNominatim, timestamp: Date.now() });
        return candidateNominatim;
      }
      if (bestCurated && minCuratedDist <= 200) {
        const bairro = bestCurated.bairro || "São Mateus";
        const resCurated: ReverseGeocodedAddress = {
          street: bestCurated.label,
          neighborhood: bairro,
          city: "Itaperuna",
          state: "RJ",
          formattedAddress: bestCurated.endereco || `${bestCurated.label} - ${bairro}, Itaperuna - RJ`,
          coords: [lng, lat],
        };
        this.cache.set(cacheKey, { address: resCurated, timestamp: Date.now() });
        return resCurated;
      }
    }

    // Se Nominatim encontrou uma via residencial detalhada, tem preferência para ruas locais e sem saída
    if (candidateNominatim && !isHighwayOrExpressway(candidateNominatim.street)) {
      this.cache.set(cacheKey, { address: candidateNominatim, timestamp: Date.now() });
      return candidateNominatim;
    }

    if (candidateMapbox) {
      this.cache.set(cacheKey, { address: candidateMapbox, timestamp: Date.now() });
      return candidateMapbox;
    }

    if (candidateNominatim) {
      this.cache.set(cacheKey, { address: candidateNominatim, timestamp: Date.now() });
      return candidateNominatim;
    }

    // 5. Fallback Final do Catálogo Local de Itaperuna
    const bairro = bestCurated.bairro || (bestCurated.sublabel ? bestCurated.sublabel.split("—")[0]?.trim() : "São Mateus");
    const isNearby = minCuratedDist <= 120;
    const fallbackAddress = isNearby && bestCurated
      ? (bestCurated.endereco || `${bestCurated.label} - ${bairro}, Itaperuna - RJ`)
      : `Próximo a ${bestCurated.label} - ${bairro}, Itaperuna - RJ`;

    const fallbackResult: ReverseGeocodedAddress = {
      street: bestCurated.label || "Rua Local",
      neighborhood: bairro,
      city: "Itaperuna",
      state: "RJ",
      formattedAddress: fallbackAddress,
      coords: [lng, lat],
    };

    return fallbackResult;
  }

  /**
   * Resolução síncrona instantânea (0ms) baseada na malha viária e bairros reais de Itaperuna.
   * Evita textos provisórios como 'Localizando via GPS...' no carregamento inicial.
   */
  public resolveInstantProximityAddress(coords: [number, number]): string {
    const [lng, lat] = coords;
    if (isNaN(lng) || isNaN(lat)) return "Rua Amadeu Tinoco Lacerda, 492 - Centro, Itaperuna - RJ";

    let bestMatch = LUGARES_CURADOS_ITAPERUNA[0];
    let minDistanceMetros = Infinity;

    for (const place of LUGARES_CURADOS_ITAPERUNA) {
      const dist = calcularDistanciaHaversineMetros(coords, place.coords);
      if (dist < minDistanceMetros) {
        minDistanceMetros = dist;
        bestMatch = place;
      }
    }

    if (!bestMatch) return "Rua Amadeu Tinoco Lacerda, 492 - Centro, Itaperuna - RJ";

    const bairro = bestMatch.bairro || (bestMatch.sublabel ? bestMatch.sublabel.split("—")[0]?.trim() : "São Mateus");

    // Proximidade imediata da via (< ~120 metros): usa o nome e endereço exato da via mais próxima
    if (minDistanceMetros <= 120) {
      return bestMatch.endereco || `${bestMatch.label} - ${bairro}, Itaperuna - RJ`;
    }

    // Proximidade da malha urbana (< ~600 metros): aponta proximidade da via e bairro
    if (minDistanceMetros <= 600) {
      return `Próximo a ${bestMatch.label} - ${bairro}, Itaperuna - RJ`;
    }

    // Coordenadas gerais na região
    return `${bestMatch.label} - ${bairro}, Itaperuna - RJ`;
  }
}

export const reverseGeocodingService = ReverseGeocodingService.getInstance();
