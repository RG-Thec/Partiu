/**
 * ==============================================================================
 * 🗺️ PARTIU — MAP PROVIDER FACTORY (ENTERPRISE MULTI-TENANT)
 * ==============================================================================
 * Fábrica dinâmica de resolução de provedores de mapa.
 * Identifica o provedor configurado no White-Label do Tenant ("mapbox", "google", "osm")
 * e entrega a instância correspondente em tempo de execução.
 * ==============================================================================
 */

import type { IMapProvider, MapProviderId } from "./IMapProvider";
import { MapboxMapProvider } from "./MapboxMapProvider";
import { GoogleMapsProvider } from "./GoogleMapsProvider";
import { whiteLabelEngine } from "@/lib/white-label/white-label-engine";

export class MapProviderFactory {
  private static instance: MapProviderFactory;
  private providers = new Map<MapProviderId, IMapProvider>();

  private constructor() {
    this.registerProvider(new MapboxMapProvider());
    this.registerProvider(new GoogleMapsProvider());
  }

  public static getInstance(): MapProviderFactory {
    if (!MapProviderFactory.instance) {
      MapProviderFactory.instance = new MapProviderFactory();
    }
    return MapProviderFactory.instance;
  }

  public registerProvider(provider: IMapProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Obtém diretamente o provedor por ID explícito
   */
  public getProviderById(id: MapProviderId): IMapProvider {
    const provider = this.providers.get(id);
    if (provider) {
      return provider;
    }
    // Fallback padrão: Mapbox
    return this.providers.get("mapbox")!;
  }

  /**
   * Resolve o provedor ativo com base na configuração White-Label do tenant informado
   */
  public getProvider(tenantId?: string): IMapProvider {
    try {
      const config = whiteLabelEngine.getTenantConfig(tenantId);
      const configuredProvider = config.geo?.mapProvider;

      if (configuredProvider && this.providers.has(configuredProvider as MapProviderId)) {
        return this.providers.get(configuredProvider as MapProviderId)!;
      }
    } catch {
      // Fallback seguro em caso de indisponibilidade
    }

    return this.providers.get("mapbox")!;
  }
}

export const mapProviderFactory = MapProviderFactory.getInstance();
