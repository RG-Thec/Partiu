/**
 * ==============================================================================
 * ⚡ PARTIU DYNAMIC SURGE ENGINE (v4.0 Enterprise)
 * ==============================================================================
 * Motor inteligente de cálculo de Tarifa Dinâmica (Surge Pricing) baseado em
 * equilíbrio de oferta e demanda em tempo real (Padrão Uber / 99), horários de
 * pico, eventos climáticos e sobretaxa administrativa imediata (Live Override).
 *
 * MODOS DE OPERAÇÃO:
 * 1. PRIORIDADE 1: Sobretaxa Administrativa Imediata (Live Override)
 *    Força multiplicador específico (x1.2, x1.4, x1.6, x1.8, x2.0) por tempo
 *    determinado (15m, 30m, 1h, 2h) via painel do Franqueado ou Super Admin.
 * 2. PRIORIDADE 2: Inteligência Dinâmica Automática de Mercado (Padrão Uber/99)
 *    Calcula e aplica o multiplicador em tempo real com base na razão de
 *    chamados ativos vs motoristas disponíveis na praça/geocélula.
 *
 * MULTI-TENANT ISOLATION:
 * Cada franqueado (tenantId) possui sua própria praça, motoristas, chamados
 * e configurações de despacho sem contaminação entre franquias.
 * ==============================================================================
 */

export interface TenantMarketStats {
  tenantId: string;
  demandCount: number;         // Passageiros buscando / chamados ativos na praça
  availableDriversCount: number; // Motoristas online e livres (não em rota)
  lastUpdated: number;
}

export interface SurgeContext {
  tenantId?: string;
  activeRequestsCount?: number;
  demandCount?: number;
  availableDriversCount?: number;
  hour?: number;
  isNightTime?: boolean;
  isRaining?: boolean;
  rainRiskFactor?: number;
  regionalEventActive?: boolean;
  manualAdminMultiplier?: number;
  maxSurgeCeiling?: number;
  isAutoSurgeEnabled?: boolean;
}

export interface SurgeCalculationResult {
  multiplier: number;
  reason: string;
  isSurgeActive: boolean;
  isLiveOverride: boolean;
  supplyDemandRatio: number;
  demandCount: number;
  availableDriversCount: number;
  tenantId: string;
  breakdown: {
    demandFactor: number;
    nightFactor: number;
    weatherFactor: number;
    eventFactor: number;
  };
}

export class SurgeEngine {
  private static instance: SurgeEngine;
  private minCeiling: number = 1.0;
  private maxCeiling: number = 2.5;

  // Cache em memória de estatísticas de mercado por tenant
  private tenantMarketStats = new Map<string, TenantMarketStats>();

  // Overrides manuais em memória por tenant
  private tenantOverrides = new Map<string, { multiplier: number; expiresAt: number | null }>();

  private constructor() {}

  public static getInstance(): SurgeEngine {
    if (!SurgeEngine.instance) {
      SurgeEngine.instance = new SurgeEngine();
    }
    return SurgeEngine.instance;
  }

  /**
   * Define override administrativo manual com suporte a tenant e tempo de expiração
   */
  public setAdminOverride(multiplier: number, durationMinutes: number = 30, tenantId: string = "default"): void {
    const clamped = Math.max(1.0, Math.min(3.0, multiplier));
    const expiresAt = durationMinutes > 0 ? Date.now() + durationMinutes * 60 * 1000 : null;

    this.tenantOverrides.set(tenantId, {
      multiplier: clamped,
      expiresAt,
    });

    // Notifica ouvintes da praça
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent("partiu:surge-updated", {
          detail: { tenantId, multiplier: clamped, isOverride: clamped > 1.0 },
        })
      );
    }
  }

  /**
   * Remove o override administrativo manual de um tenant
   */
  public clearAdminOverride(tenantId: string = "default"): void {
    this.tenantOverrides.delete(tenantId);

    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent("partiu:surge-updated", {
          detail: { tenantId, multiplier: 1.0, isOverride: false },
        })
      );
    }
  }

  /**
   * Atualiza as estatísticas de mercado (chamados vs motoristas) de um tenant
   */
  public updateTenantMarketState(
    tenantId: string = "default",
    demandCount: number,
    availableDriversCount: number
  ): void {
    this.tenantMarketStats.set(tenantId, {
      tenantId,
      demandCount: Math.max(0, demandCount),
      availableDriversCount: Math.max(0, availableDriversCount),
      lastUpdated: Date.now(),
    });

    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent("partiu:surge-updated", {
          detail: { tenantId, demandCount, availableDriversCount },
        })
      );
    }
  }

  /**
   * Obtém as estatísticas de mercado de um tenant
   */
  public getTenantMarketStats(tenantId: string = "default"): TenantMarketStats {
    const existing = this.tenantMarketStats.get(tenantId);
    if (existing && Date.now() - existing.lastUpdated < 60_000) {
      return existing;
    }

    // Se não houver estatística fresca em memória, tenta consultar localStorage ou dados mock
    let demandCount = 1;
    let availableDriversCount = 2;

    if (typeof localStorage !== "undefined") {
      try {
        // Tenta ler chamados ativos locais
        const rawCorrida = localStorage.getItem("partiu_corrida_ativa");
        if (rawCorrida) demandCount = Math.max(demandCount, 2);
      } catch {}
    }

    const fallback: TenantMarketStats = {
      tenantId,
      demandCount: existing ? existing.demandCount : demandCount,
      availableDriversCount: existing ? existing.availableDriversCount : availableDriversCount,
      lastUpdated: Date.now(),
    };

    this.tenantMarketStats.set(tenantId, fallback);
    return fallback;
  }

  /**
   * Verifica se há override administrativo persistido no LocalStorage para o tenant
   */
  public getStoredTenantOverride(tenantId: string = "default"): { multiplier: number; expiresAt: number | null } | null {
    // 1. Checa memória primeiro
    const mem = this.tenantOverrides.get(tenantId);
    if (mem) {
      if (mem.expiresAt && Date.now() > mem.expiresAt) {
        this.tenantOverrides.delete(tenantId);
      } else {
        return mem;
      }
    }

    // 2. Checa LocalStorage do tenant
    if (typeof localStorage !== "undefined") {
      try {
        const storageKeys = [
          tenantId && tenantId !== "default" ? `partiu_dispatch_algorithm_settings_${tenantId}` : null,
          "partiu_dispatch_algorithm_settings",
        ].filter(Boolean) as string[];

        for (const key of storageKeys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.liveOverrideAtivo && parsed.liveOverrideMultiplicador) {
              if (parsed.liveOverrideExpiraEm && Date.now() > parsed.liveOverrideExpiraEm) {
                // Expirado: limpa flag
                parsed.liveOverrideAtivo = false;
                parsed.liveOverrideMultiplicador = 1.0;
                parsed.liveOverrideExpiraEm = null;
                localStorage.setItem(key, JSON.stringify(parsed));
                continue;
              }
              const result = {
                multiplier: Number(parsed.liveOverrideMultiplicador),
                expiresAt: parsed.liveOverrideExpiraEm ?? null,
              };
              this.tenantOverrides.set(tenantId, result);
              return result;
            }
          }
        }
      } catch {}
    }

    return null;
  }

  public setCeilings(min: number, max: number): void {
    this.minCeiling = Math.max(1.0, min);
    this.maxCeiling = Math.max(this.minCeiling, max);
  }

  /**
   * Verifica se o horário atual é considerado noturno (22h às 05h)
   */
  public isNightHour(currentHour?: number): boolean {
    const hour = currentHour !== undefined ? currentHour : new Date().getHours();
    return hour >= 22 || hour < 5;
  }

  /**
   * Calcula o multiplicador dinâmico oficial da corrida com suporte a IA e Live Override
   */
  public calculateSurge(context: Partial<SurgeContext> = {}, targetTenantId?: string): SurgeCalculationResult {
    const tenantId = targetTenantId || context.tenantId || "default";

    // =========================================================================
    // PRIORIDADE 1: SOBRETAXA ADMINISTRATIVA IMEDIATA (LIVE OVERRIDE)
    // =========================================================================
    // A) Se informado explicitamente no contexto
    if (context.manualAdminMultiplier && context.manualAdminMultiplier > 1.0) {
      const clamped = Math.min(this.maxCeiling, Math.max(1.0, context.manualAdminMultiplier));
      const rounded = Math.round(clamped * 10) / 10;
      return {
        multiplier: rounded,
        reason: "Sobretaxa administrativa imediata ativa na praça",
        isSurgeActive: rounded > 1.0,
        isLiveOverride: true,
        supplyDemandRatio: 1.0,
        demandCount: context.demandCount ?? 1,
        availableDriversCount: context.availableDriversCount ?? 1,
        tenantId,
        breakdown: {
          demandFactor: rounded,
          nightFactor: 1.0,
          weatherFactor: 1.0,
          eventFactor: 1.0,
        },
      };
    }

    // B) Se houver override manual ativo salvo para o tenant
    const activeOverride = this.getStoredTenantOverride(tenantId);
    if (activeOverride && activeOverride.multiplier > 1.0) {
      const clamped = Math.min(this.maxCeiling, Math.max(1.0, activeOverride.multiplier));
      const rounded = Math.round(clamped * 10) / 10;
      return {
        multiplier: rounded,
        reason: "Sobretaxa administrativa imediata ativa na praça",
        isSurgeActive: rounded > 1.0,
        isLiveOverride: true,
        supplyDemandRatio: 1.0,
        demandCount: context.demandCount ?? 1,
        availableDriversCount: context.availableDriversCount ?? 1,
        tenantId,
        breakdown: {
          demandFactor: rounded,
          nightFactor: 1.0,
          weatherFactor: 1.0,
          eventFactor: 1.0,
        },
      };
    }

    // =========================================================================
    // PRIORIDADE 2: MOTOR DINÂMICO AUTOMÁTICO DE ALTA DEMANDA (UBER / 99 STANDARD)
    // =========================================================================
    const stats = this.getTenantMarketStats(tenantId);
    const demand = Math.max(1, context.demandCount ?? context.activeRequestsCount ?? stats.demandCount);
    const supply = Math.max(1, context.availableDriversCount ?? stats.availableDriversCount);
    const ratio = demand / supply;

    let demandFactor = 1.0;
    let nightFactor = 1.0;
    let weatherFactor = 1.0;
    let eventFactor = 1.0;
    let calculatedMultiplier = 1.0;
    const reasons: string[] = [];

    // Curva de Demanda Automatizada Uber / 99:
    // - ratio <= 1.0: 1.0x (normal)
    // - 1.0 < ratio <= 1.3: 1.2x (moderada procura)
    // - 1.3 < ratio <= 1.8: 1.4x (alta procura)
    // - 1.8 < ratio <= 2.3: 1.6x (escassez acentuada)
    // - 2.3 < ratio <= 3.0: 1.8x (pico severo de chamados)
    // - ratio > 3.0: 2.0x (extrema escassez)
    if (ratio > 3.0) {
      demandFactor = 2.0;
      calculatedMultiplier = Math.max(calculatedMultiplier, 2.0);
      reasons.push(`Alta procura e extrema escassez: ${demand} chamados para ${supply} motoristas`);
    } else if (ratio > 2.3) {
      demandFactor = 1.8;
      calculatedMultiplier = Math.max(calculatedMultiplier, 1.8);
      reasons.push(`Alta procura e pico severo de chamados na região (${demand} chamados para ${supply} motoristas)`);
    } else if (ratio > 1.8) {
      demandFactor = 1.6;
      calculatedMultiplier = Math.max(calculatedMultiplier, 1.6);
      reasons.push(`Alta procura e escassez de veículos disponíveis na praça (${demand} chamados para ${supply} motoristas)`);
    } else if (ratio > 1.3) {
      demandFactor = 1.4;
      calculatedMultiplier = Math.max(calculatedMultiplier, 1.4);
      reasons.push("Alta procura de passageiros na sua região");
    } else if (ratio > 1.0) {
      demandFactor = 1.2;
      calculatedMultiplier = Math.max(calculatedMultiplier, 1.2);
      reasons.push("Procura ligeiramente elevada na sua região");
    }

    // 2. Fator Noturno (Segurança e compensação ao motorista da madrugada 22h às 05h)
    const isNight = context.isNightTime ?? this.isNightHour(context.hour);
    if (isNight) {
      nightFactor = 1.15;
      calculatedMultiplier += 0.15;
      reasons.push("Tarifa noturna (22h às 05h)");
    }

    // 3. Fator Clima / Chuva
    if (context.isRaining || (context.rainRiskFactor && context.rainRiskFactor > 1.0)) {
      const wAdd = context.rainRiskFactor ? (context.rainRiskFactor - 1.0) * 0.5 : 0.2;
      weatherFactor += wAdd;
      calculatedMultiplier += wAdd;
      reasons.push("Condições climáticas adversas");
    }

    // 4. Eventos especiais regionais
    if (context.regionalEventActive) {
      eventFactor = 1.25;
      calculatedMultiplier += 0.25;
      reasons.push("Evento regional com tráfego intenso");
    }

    // Aplica o teto configurado
    const ceiling = context.maxSurgeCeiling ?? this.maxCeiling;
    const finalMultiplier = Math.min(ceiling, Math.max(this.minCeiling, calculatedMultiplier));
    const rounded = Math.round(finalMultiplier * 10) / 10;

    return {
      multiplier: rounded,
      reason: reasons.length > 0 ? reasons.join(" • ") : "Tarifa padrão",
      isSurgeActive: rounded > 1.0,
      isLiveOverride: false,
      supplyDemandRatio: Math.round(ratio * 100) / 100,
      demandCount: demand,
      availableDriversCount: supply,
      tenantId,
      breakdown: {
        demandFactor: Math.round(demandFactor * 100) / 100,
        nightFactor: Math.round(nightFactor * 100) / 100,
        weatherFactor: Math.round(weatherFactor * 100) / 100,
        eventFactor: Math.round(eventFactor * 100) / 100,
      },
    };
  }

  /**
   * Helper simplificado para calcular o surge de um tenant específico
   */
  public calculateTenantSurge(
    tenantId: string = "default",
    extraContext: Partial<SurgeContext> = {}
  ): SurgeCalculationResult {
    return this.calculateSurge({ ...extraContext, tenantId }, tenantId);
  }
}

export const surgeEngine = SurgeEngine.getInstance();
