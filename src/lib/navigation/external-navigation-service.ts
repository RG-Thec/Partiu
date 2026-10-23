/**
 * ==============================================================================
 * 🧭 PARTIU EXTERNAL NAVIGATION SERVICE (v1.0) — 99 & WAZE / GOOGLE MAPS STANDARD
 * ==============================================================================
 * Serviço unificado de deep linking para navegação externa por GPS nativo.
 * Suporta Waze, Google Maps e Apple Maps com detecção de plataforma móvel (Android/iOS)
 * e resolução dinâmica de ponto alvo (Embarque, Parada Intermediária ou Destino).
 *
 * ESQUEMAS DE URL (Baseados na Auditoria Forense do APK 99):
 * 1. Waze:
 *    - Nativo: waze://?ll={lat},{lng}&navigate=yes
 *    - Universal Web Fallback: https://waze.com/ul?ll={lat},{lng}&navigate=yes
 *
 * 2. Google Maps:
 *    - Nativo Android: google.navigation:q={lat},{lng}&mode=d
 *    - Universal Web Fallback: https://www.google.com/maps/dir/?api=1&destination={lat},{lng}
 *
 * 3. Apple Maps (iOS):
 *    - Nativo: maps://?daddr={lat},{lng}&dirflg=d
 *    - Web Fallback: https://maps.apple.com/?daddr={lat},{lng}&dirflg=d
 * ==============================================================================
 */

export type NavigationApp = "waze" | "google" | "apple";

export interface NavigationTargetCoords {
  lat: number;
  lng: number;
}

export interface NavigationUrlPair {
  nativeUrl: string;
  webUrl: string;
}

export interface ResolvedNavigationTarget {
  coords: NavigationTargetCoords | null;
  targetType: "PICKUP" | "STOP" | "DROPOFF";
  label: string;
}

export class ExternalNavigationService {
  private static instance: ExternalNavigationService;
  public static readonly STORAGE_KEY_PREFERRED_NAV = "partiu_preferred_navigation_app";
  private inMemoryPreferredApp: NavigationApp = "waze";

  private constructor() {}

  public static getInstance(): ExternalNavigationService {
    if (!ExternalNavigationService.instance) {
      ExternalNavigationService.instance = new ExternalNavigationService();
    }
    return ExternalNavigationService.instance;
  }

  /**
   * Obtém os esquemas de URLs nativas e fallbacks universais para os 3 navegadores
   */
  public getNavigationUrls(
    coords: NavigationTargetCoords,
    address?: string,
  ): Record<NavigationApp, NavigationUrlPair> {
    const lat = coords.lat.toFixed(6);
    const lng = coords.lng.toFixed(6);
    const encodedAddress = address ? encodeURIComponent(address) : "";

    return {
      waze: {
        nativeUrl: `waze://?ll=${lat},${lng}&navigate=yes`,
        webUrl: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
      },
      google: {
        nativeUrl: `google.navigation:q=${lat},${lng}&mode=d`,
        webUrl: encodedAddress
          ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedAddress}`
          : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      },
      apple: {
        nativeUrl: `maps://?daddr=${lat},${lng}&dirflg=d`,
        webUrl: `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
      },
    };
  }

  /**
   * Identifica o aplicativo de navegação preferido salvo pelo condutor
   */
  public getPreferredApp(): NavigationApp {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(ExternalNavigationService.STORAGE_KEY_PREFERRED_NAV);
      if (saved === "waze" || saved === "google" || saved === "apple") {
        return saved;
      }
    }
    return this.inMemoryPreferredApp;
  }

  /**
   * Salva a preferência de navegador do motorista
   */
  public setPreferredApp(app: NavigationApp): void {
    this.inMemoryPreferredApp = app;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ExternalNavigationService.STORAGE_KEY_PREFERRED_NAV, app);
    }
  }

  /**
   * Dispara o deep link nativo no dispositivo com fallback inteligente
   */
  public launchNavigation(
    app: NavigationApp,
    coords: NavigationTargetCoords,
    address?: string,
  ): { launched: boolean; app: NavigationApp; url: string } {
    const urls = this.getNavigationUrls(coords, address);
    const urlPair = urls[app] || urls.waze;

    this.setPreferredApp(app);

    const isMobile =
      typeof navigator !== "undefined" &&
      /android|iphone|ipad|ipod/i.test(navigator.userAgent || "");

    const targetUrl = isMobile ? urlPair.nativeUrl : urlPair.webUrl;

    if (typeof window !== "undefined") {
      try {
        if (isMobile) {
          // No mobile tenta abrir o esquema nativo diretamente
          window.location.href = urlPair.nativeUrl;

          // Timeout de fallback para abrir versão web caso o app nativo não responda
          setTimeout(() => {
            window.open(urlPair.webUrl, "_blank", "noopener,noreferrer");
          }, 1500);
        } else {
          // No desktop/web abre diretamente a aba com o mapa de direções
          window.open(urlPair.webUrl, "_blank", "noopener,noreferrer");
        }

        // Emite telemetria de navegação externa
        window.dispatchEvent(
          new CustomEvent("partiu:external_navigation_launched", {
            detail: {
              app,
              coords,
              address,
              timestamp: Date.now(),
            },
          }),
        );
      } catch (err) {
        window.open(urlPair.webUrl, "_blank", "noopener,noreferrer");
      }
    }

    return {
      launched: true,
      app,
      url: targetUrl,
    };
  }

  /**
   * Resolve dinamicamente as coordenadas do alvo atual baseado no ciclo da corrida
   * - A_CAMINHO / HEADING_TO_PICKUP -> Ponto de Embarque (Origem)
   * - EM_VIAGEM / IN_TRIP -> Próxima Parada ou Ponto de Desembarque (Destino)
   */
  public resolveTargetForRide(ride: {
    status?: string;
    origem?: string;
    origemCoords?: { lat: number; lng: number } | [number, number];
    destino?: string;
    destinoCoords?: { lat: number; lng: number } | [number, number];
    paradas?: Array<{ endereco?: string; coords?: { lat: number; lng: number } }>;
    currentStopIndex?: number;
  }): ResolvedNavigationTarget {
    const isHeadingToPickup =
      ride.status === "A_CAMINHO" ||
      ride.status === "HEADING_TO_PICKUP" ||
      ride.status === "OFFER_ACCEPTED";

    if (isHeadingToPickup) {
      const coords = this.normalizeCoords(ride.origemCoords);
      return {
        coords,
        targetType: "PICKUP",
        label: ride.origem || "Local de Embarque",
      };
    }

    // Se estiver em viagem e houver paradas intermediárias pendentes
    if (ride.paradas && ride.paradas.length > 0) {
      const stopIdx = ride.currentStopIndex || 0;
      const nextStop = ride.paradas[stopIdx];
      if (nextStop && nextStop.coords) {
        return {
          coords: this.normalizeCoords(nextStop.coords),
          targetType: "STOP",
          label: nextStop.endereco || `Parada ${stopIdx + 1}`,
        };
      }
    }

    // Destino final
    const coords = this.normalizeCoords(ride.destinoCoords);
    return {
      coords,
      targetType: "DROPOFF",
      label: ride.destino || "Destino Final",
    };
  }

  private normalizeCoords(
    rawCoords?: { lat: number; lng: number } | [number, number],
  ): NavigationTargetCoords | null {
    if (!rawCoords) return null;
    if (Array.isArray(rawCoords) && rawCoords.length === 2) {
      return { lng: rawCoords[0], lat: rawCoords[1] };
    }
    if (typeof rawCoords === "object" && "lat" in rawCoords && "lng" in rawCoords) {
      return { lat: rawCoords.lat, lng: rawCoords.lng };
    }
    return null;
  }
}

export const externalNavigationService = ExternalNavigationService.getInstance();
