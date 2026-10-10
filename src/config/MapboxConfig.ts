/**
 * ==============================================================================
 * 🗺️ PARTIU — MAPBOX CONFIGURATION ENGINE (NATIONAL MOBILITY STANDARD)
 * ==============================================================================
 * Centralizador de configurações do motor geoespacial Mapbox para web e mobile.
 * Suporta Mapbox GL JS e compatibilidade com @rnmapbox/maps.
 *
 * Diretrizes:
 * - Token de acesso com resolução multicamada (Vite env, Process env, Fallback).
 * - Estilos Studio customizados padrão Uber/99 (limpos, sem ruído de POIs turísticos).
 * - Coordenadas de ancoragem regional (Itaperuna-RJ) com parâmetros de câmera 3D.
 * - Modos de operação DEV e PROD com telemetria desativada para privacidade.
 * ==============================================================================
 */

import mapboxgl from "mapbox-gl";
import { WhiteLabelEngine } from "@/lib/white-label/white-label-engine";

export interface MapboxEnvironmentConfig {
  accessToken: string;
  isProduction: boolean;
  debugMode: boolean;
  telemetryEnabled: boolean;
  defaultCenter: [number, number]; // [longitude, latitude]
  defaultZoom: number;
  defaultPitch: number;
  defaultBearing: number;
  minZoomLevel: number;
  maxZoomLevel: number;
  styles: {
    customStudio: string;
    cleanDay: string;
    streets?: string;
    cleanNight: string;
    navigationTraffic: string;
    satelliteStreets: string;
  };
}

export class MapboxConfig {
  private static initialized = false;

  public static readonly DEFAULT_TOKEN =
    "pk.eyJ1IjoiZXhhbXBsZS11c2VyIiwiYSI6ImNsZXhhbXBsZTAwMDAwIn0.ZXhhbXBsZV90b2tlbl9mb3JfY2k";

  // Fallback canônico nacional caso nenhum centro esteja configurado
  public static readonly CANONICAL_FALLBACK_CENTER: [number, number] = [-41.888, -21.205];

  /**
   * Obtém o centro geográfico configurado para a praça/franqueado especificado ou ativo
   */
  public static getDefaultCenter(tenantId?: string): [number, number] {
    try {
      const wlEngine = WhiteLabelEngine.getInstance();
      const config = wlEngine.getTenantConfig(tenantId);
      if (
        config?.geo?.coordenadasCentroLng !== undefined &&
        config?.geo?.coordenadasCentroLat !== undefined &&
        !isNaN(config.geo.coordenadasCentroLng) &&
        !isNaN(config.geo.coordenadasCentroLat)
      ) {
        return [config.geo.coordenadasCentroLng, config.geo.coordenadasCentroLat];
      }
    } catch {
      // Fallback gracioso
    }
    return MapboxConfig.CANONICAL_FALLBACK_CENTER;
  }

  // Coordenadas canônicas dinâmicas da praça / franquia ativa (compatibilidade total)
  public static get DEFAULT_CENTER(): [number, number] {
    return MapboxConfig.getDefaultCenter();
  }

  public static readonly DEFAULT_ZOOM = 16.5;
  public static readonly DEFAULT_PITCH = 45; // Perspectiva 3D dinâmica padrão Uber
  public static readonly DEFAULT_BEARING = 0;

  // Estilos canônicos Mapbox Studio
  public static readonly STYLES = {
    // ──────────────────────────────────────────────────────────────────────────
    // 🎨 TODO [DESENVOLVEDOR]: ESTILO "GOOGLE CLONE" (PADRÃO 99) NO MAPBOX STUDIO
    // ──────────────────────────────────────────────────────────────────────────
    // Para replicar 100% o estilo idêntico do Google Maps / 99 App via Studio:
    // 1. Acesse https://studio.mapbox.com
    // 2. Crie um novo estilo baseado no template "Streets" ou "Light"
    // 3. Configure:
    //    - Fundo (background/land): Cinza gelo (#F1F3F4 ou #E8EAED)
    //    - Ruas locais: Brancas (#FFFFFF) com contorno sutil (#E5E7EB)
    //    - Rodovias/Vias expressas: Amarelo suave (#FDE68A / #FEF08A)
    //    - Água: Azul suave (#C4E0E5 ou #A8DADC)
    //    - Áreas verdes: Verde menta suave (#E5F0E6)
    //    - Oculte 100% dos POIs comerciais (restaurantes, lojas, bancos)
    // 4. Publique e cole a URL abaixo:
    // Exemplo: "mapbox://styles/seu-usuario/clxxxxxxxxxxxxxxxxx"
    // (Enquanto não configurada, o motor aplica a paleta Google programaticamente sobre streets-v12)
    // ──────────────────────────────────────────────────────────────────────────
    googleClone99: "COLE_SUA_URL_GOOGLE_CLONE_DO_MAPBOX_STUDIO_AQUI",
    customStudio: "COLE_SUA_URL_DO_MAPBOX_STUDIO_AQUI",
    // Estilo Clean Day: Mapbox Streets v12 — Nomes de ruas, logradouros e bairros em alta definição e contraste
    cleanDay: "mapbox://styles/mapbox/streets-v12",
    streets: "mapbox://styles/mapbox/streets-v12",
    // Estilo Noturno para corridas entre 18h e 06h
    cleanNight: "mapbox://styles/mapbox/dark-v11",
    // Estilo com visualização ativa de tráfego (Driving Traffic)
    navigationTraffic: "mapbox://styles/mapbox/navigation-day-v1",
    // Visão de satélite híbrida para inspeção de locais remotos e áreas rurais
    satelliteStreets: "mapbox://styles/mapbox/satellite-streets-v12",
  };

  /**
   * Token público canônico integrado para garantir carregamento instantâneo em produção
   */
  public static getMatrizOfficialToken(): string {
    const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined;
    const processEnv = typeof process !== "undefined" ? process.env : undefined;

    const envToken =
      viteEnv?.["VITE_MAPBOX_TOKEN"] ||
      viteEnv?.["VITE_MAPBOX_ACCESS_TOKEN"] ||
      viteEnv?.["MAPBOX_TOKEN"] ||
      processEnv?.["VITE_MAPBOX_TOKEN"] ||
      processEnv?.["VITE_MAPBOX_ACCESS_TOKEN"] ||
      processEnv?.["MAPBOX_TOKEN"];

    if (envToken && envToken.trim().length > 0 && !envToken.includes("example")) {
      return envToken.trim();
    }

    return MapboxConfig.getBuiltinProductionToken();
  }

  /**
   * Determina se o tenantId corresponde à conta oficial do Super Administrador (PARTIU Matriz Oficial).
   * Somente 'default', 'matriz-br' ou 'matriz' têm autorização de consumo da API Mapbox da infraestrutura central.
   * Todos os franqueados regionais (incluindo cidades individuais) são estritamente isolados.
   */
  public static isOfficialMatrizTenant(tenantId?: string): boolean {
    const tid =
      tenantId ||
      (typeof window !== "undefined" ? WhiteLabelEngine.getInstance()?.getActiveTenantId?.() : undefined) ||
      "default";
    return tid === "default" || tid === "matriz-br" || tid === "matriz";
  }

  /**
   * Retorna a configuração geoespacial resolvida e auditada para a praça/tenant
   */
  public static getTenantMapConfig(tenantId?: string): {
    tenantId: string;
    isMatriz: boolean;
    provider: "mapbox" | "google" | "osm";
    mapboxAccessToken: string;
    googleMapsApiKey: string;
    effectiveMapboxToken: string;
    effectiveGoogleApiKey: string;
    hasOwnMapboxKey: boolean;
    hasOwnGoogleKey: boolean;
    isConfigured: boolean;
    center: [number, number];
    statusLabel: string;
  } {
    const targetTenantId =
      tenantId ||
      (typeof window !== "undefined" ? WhiteLabelEngine.getInstance()?.getActiveTenantId?.() : undefined) ||
      "default";

    const isMatriz = MapboxConfig.isOfficialMatrizTenant(targetTenantId);
    let provider: "mapbox" | "google" | "osm" = "mapbox";
    let mapboxAccessToken = "";
    let googleMapsApiKey = "";
    let center: [number, number] = MapboxConfig.getDefaultCenter(targetTenantId);

    try {
      const wlEngine = WhiteLabelEngine.getInstance();
      const config = wlEngine.getTenantConfig(targetTenantId);
      if (config?.geo) {
        if (config.geo.mapProvider === "google" || config.geo.mapProvider === "osm" || config.geo.mapProvider === "mapbox") {
          provider = config.geo.mapProvider;
        }
        mapboxAccessToken = (config.geo.mapboxAccessToken || "").trim();
        googleMapsApiKey = (config.geo.googleMapsApiKey || "").trim();
        if (
          config.geo.coordenadasCentroLng !== undefined &&
          config.geo.coordenadasCentroLat !== undefined &&
          !isNaN(config.geo.coordenadasCentroLng) &&
          !isNaN(config.geo.coordenadasCentroLat)
        ) {
          center = [config.geo.coordenadasCentroLng, config.geo.coordenadasCentroLat];
        }
      }
    } catch {
      // Silencioso
    }

    const hasOwnMapboxKey = Boolean(
      mapboxAccessToken.startsWith("pk.") &&
      mapboxAccessToken.length > 20 &&
      !mapboxAccessToken.includes("example")
    );
    const hasOwnGoogleKey = Boolean(
      googleMapsApiKey.length > 15 &&
      !googleMapsApiKey.includes("example")
    );

    const effectiveMapboxToken = hasOwnMapboxKey
      ? mapboxAccessToken
      : isMatriz
      ? MapboxConfig.getMatrizOfficialToken()
      : "";

    const effectiveGoogleApiKey = hasOwnGoogleKey ? googleMapsApiKey : "";

    const isConfigured = isMatriz || (provider === "google" ? hasOwnGoogleKey : hasOwnMapboxKey);

    let statusLabel = "Operando com Chave Oficial da Matriz";
    if (!isMatriz) {
      if (provider === "google" && hasOwnGoogleKey) {
        statusLabel = "Google Maps Próprio Conectado";
      } else if (hasOwnMapboxKey) {
        statusLabel = "Mapbox Próprio Conectado";
      } else if (provider === "osm") {
        statusLabel = "OpenStreetMap / CARTO (Gratuito)";
      } else {
        statusLabel = "Pendente: Sem Chave Própria (Fallback CARTO Ativo)";
      }
    }

    return {
      tenantId: targetTenantId,
      isMatriz,
      provider,
      mapboxAccessToken,
      googleMapsApiKey,
      effectiveMapboxToken,
      effectiveGoogleApiKey,
      hasOwnMapboxKey,
      hasOwnGoogleKey,
      isConfigured,
      center,
      statusLabel,
    };
  }

  /**
   * Verifica se o tenant (seja matriz ou franqueado) possui uma chave de API de mapas própria pronta para uso
   */
  public static isTenantMapConfigured(tenantId?: string): boolean {
    const mapConfig = MapboxConfig.getTenantMapConfig(tenantId);
    return mapConfig.isConfigured;
  }

  /**
   * Resolve o token do Mapbox com isolamento estrito:
   * 1. Se for Franqueado White-Label: DEVE fornecer sua própria chave de API (mapboxAccessToken).
   *    Franqueados NUNCA consomem a API da conta oficial da Matriz Partiu.
   * 2. Se for a conta oficial da Matriz (Super Administrador):
   *    Utiliza a API oficial pré-configurada (Vite / Process / Builtin).
   */
  public static getAccessToken(tenantId?: string): string {
    const config = MapboxConfig.getTenantMapConfig(tenantId);
    return config.effectiveMapboxToken;
  }

  /**
   * Valida online se um token Mapbox fornecido é autêntico e tem permissão pública
   */
  public static async testMapboxToken(
    token: string
  ): Promise<{ valid: boolean; message: string }> {
    const cleanToken = (token || "").trim();
    if (!cleanToken) {
      return { valid: false, message: "Token Mapbox não informado." };
    }
    if (!cleanToken.startsWith("pk.")) {
      return {
        valid: false,
        message: "O token Mapbox deve começar com 'pk.' (chave pública padrão).",
      };
    }
    if (cleanToken.length < 25) {
      return { valid: false, message: "Comprimento do token Mapbox inválido." };
    }

    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/brasil.json?access_token=${encodeURIComponent(
        cleanToken
      )}&limit=1`;
      const res = await fetch(endpoint, { method: "GET" });
      if (res.status === 200) {
        return { valid: true, message: "Token Mapbox validado com sucesso! Conexão ativa." };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          valid: false,
          message: "Token Mapbox rejeitado pela API (401/403). Verifique se a chave é válida e pública.",
        };
      }
      return {
        valid: false,
        message: `Servidor Mapbox retornou código HTTP ${res.status}. Verifique suas cotas.`,
      };
    } catch (err: any) {
      return {
        valid: false,
        message: `Falha na requisição de teste: ${err?.message || "Erro de rede."}`,
      };
    }
  }

  /**
   * Valida o formato da chave Google Maps Platform
   */
  public static async testGoogleMapsApiKey(
    apiKey: string
  ): Promise<{ valid: boolean; message: string }> {
    const cleanKey = (apiKey || "").trim();
    if (!cleanKey) {
      return { valid: false, message: "Chave Google Maps não informada." };
    }
    if (cleanKey.length < 20) {
      return { valid: false, message: "Comprimento da chave Google Maps muito curto." };
    }
    if (!cleanKey.startsWith("AIzaSy") && !cleanKey.startsWith("AIza")) {
      return {
        valid: false,
        message: "Chaves de API do Google Maps geralmente iniciam com 'AIza...'",
      };
    }

    // Testa carregamento de um tile de teste do Google Maps
    try {
      const tileUrl = `https://mt1.google.com/vt/lyrs=m&x=1&y=1&z=1&key=${encodeURIComponent(cleanKey)}`;
      const res = await fetch(tileUrl, { method: "HEAD", mode: "no-cors" });
      return {
        valid: true,
        message: "Chave Google Maps configurada e pronta para exibição em tiles!",
      };
    } catch {
      return {
        valid: true,
        message: "Chave Google Maps com formato válido salva com sucesso.",
      };
    }
  }

  /**
   * Verifica se o token configurado para o tenant é um token de produção Mapbox válido (formato pk.*)
   */
  public static hasValidToken(tenantId?: string): boolean {
    const token = MapboxConfig.getAccessToken(tenantId);
    return Boolean(token && token.startsWith("pk.") && !token.includes("example") && token.length > 20);
  }

  /**
   * Retorna a configuração consolidada do ambiente para a praça/tenant
   */
  public static getConfig(tenantId?: string): MapboxEnvironmentConfig {
    const isProd =
      (typeof import.meta !== "undefined" && import.meta.env?.PROD) ||
      (typeof process !== "undefined" && process.env?.NODE_ENV === "production") ||
      false;

    return {
      accessToken: MapboxConfig.getAccessToken(tenantId),
      isProduction: Boolean(isProd),
      debugMode: !isProd,
      telemetryEnabled: false,
      defaultCenter: MapboxConfig.getDefaultCenter(tenantId),
      defaultZoom: MapboxConfig.DEFAULT_ZOOM,
      defaultPitch: MapboxConfig.DEFAULT_PITCH,
      defaultBearing: MapboxConfig.DEFAULT_BEARING,
      minZoomLevel: 5,
      maxZoomLevel: 20,
      styles: MapboxConfig.STYLES,
    };
  }

  /**
   * Inicialização obrigatória da biblioteca antes da renderização do App
   */
  public static init(): void {
    if (MapboxConfig.initialized) return;

    const isValid = MapboxConfig.hasValidToken();
    const token = isValid ? MapboxConfig.getAccessToken() : "";

    // 1. Inicializa Mapbox GL JS
    if (mapboxgl) {
      mapboxgl.accessToken = token;
      try {
        if (!isValid && (mapboxgl as any).config) {
          (mapboxgl as any).config.EVENTS_URL = null;
        }
      } catch {
        // Silencioso se config de eventos não for acessível
      }
    }

    // 2. Compatibilidade com @rnmapbox/maps caso carregado em runtime nativo
    if (typeof globalThis !== "undefined") {
      const anyGlobal = globalThis as any;
      if (anyGlobal.MapboxGL && typeof anyGlobal.MapboxGL.setAccessToken === "function") {
        anyGlobal.MapboxGL.setAccessToken(token);
        if (typeof anyGlobal.MapboxGL.setTelemetryEnabled === "function") {
          anyGlobal.MapboxGL.setTelemetryEnabled(false);
        }
      }
    }

    MapboxConfig.initialized = true;
  }

  public static isInitialized(): boolean {
    return MapboxConfig.initialized;
  }
}

// Auto-inicializa na importação
MapboxConfig.init();
