import { describe, test, expect } from "./test-harness.mjs";
import { SurgeEngine, surgeEngine } from "../src/services/SurgeEngine.ts";
import {
  carregarConfiguracoesDespacho,
  salvarConfiguracoesDespacho,
  ativarLiveSurgeOverride,
  desativarLiveSurgeOverride,
  DEFAULT_DISPATCH_SETTINGS,
} from "../src/lib/surge-rules-service.ts";
import { pricingService } from "../src/services/PricingService.ts";

// Setup Mock LocalStorage e Window para ambiente Node.js de teste
if (typeof (globalThis as any).localStorage === "undefined") {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe("⚡ Inteligência de Demanda Automática & Sobretaxa Imediata (Padrão Uber/99)", () => {
  // Limpeza de estado antes dos testes
  surgeEngine.clearAdminOverride("default");
  surgeEngine.clearAdminOverride("tenant-bh");
  surgeEngine.clearAdminOverride("tenant-itaperuna");

  describe("1. Curva Automática de Demanda de Mercado (Oferta vs Procura)", () => {
    test("Equilíbrio ou excesso de motoristas (R <= 1.0) resulta em tarifa padrão 1.0x", () => {
      const res = surgeEngine.calculateSurge({
        demandCount: 5,
        availableDriversCount: 10,
        isNightTime: false,
        isRaining: false,
        regionalEventActive: false,
      });

      expect(res.multiplier).toBe(1.0);
      expect(res.isSurgeActive).toBe(false);
      expect(res.isLiveOverride).toBe(false);
      expect(res.supplyDemandRatio).toBe(0.5);
    });

    test("Procura moderadamente elevada (1.0 < R <= 1.3) resulta em multiplicador 1.2x", () => {
      const res = surgeEngine.calculateSurge({
        demandCount: 12,
        availableDriversCount: 10, // R = 1.2
        isNightTime: false,
        isRaining: false,
      });

      expect(res.multiplier).toBe(1.2);
      expect(res.isSurgeActive).toBe(true);
      expect(res.isLiveOverride).toBe(false);
      expect(res.reason).toContain("Procura ligeiramente elevada");
    });

    test("Alta procura na região (1.3 < R <= 1.8) resulta em multiplicador 1.4x", () => {
      const res = surgeEngine.calculateSurge({
        demandCount: 15,
        availableDriversCount: 10, // R = 1.5
        isNightTime: false,
        isRaining: false,
      });

      expect(res.multiplier).toBe(1.4);
      expect(res.isSurgeActive).toBe(true);
      expect(res.isLiveOverride).toBe(false);
      expect(res.reason).toContain("Alta procura de passageiros");
    });

    test("Escassez acentuada de veículos (1.8 < R <= 2.3) resulta em multiplicador 1.6x", () => {
      const res = surgeEngine.calculateSurge({
        demandCount: 20,
        availableDriversCount: 10, // R = 2.0
        isNightTime: false,
        isRaining: false,
      });

      expect(res.multiplier).toBe(1.6);
      expect(res.isSurgeActive).toBe(true);
      expect(res.isLiveOverride).toBe(false);
      expect(res.reason).toContain("escassez de veículos disponíveis");
    });

    test("Pico severo de chamados (2.3 < R <= 3.0) resulta em multiplicador 1.8x", () => {
      const res = surgeEngine.calculateSurge({
        demandCount: 25,
        availableDriversCount: 10, // R = 2.5
        isNightTime: false,
        isRaining: false,
      });

      expect(res.multiplier).toBe(1.8);
      expect(res.isSurgeActive).toBe(true);
      expect(res.isLiveOverride).toBe(false);
      expect(res.reason).toContain("pico severo de chamados");
    });

    test("Extrema escassez de veículos (R > 3.0) resulta em multiplicador 2.0x", () => {
      const res = surgeEngine.calculateSurge({
        demandCount: 35,
        availableDriversCount: 10, // R = 3.5
        isNightTime: false,
        isRaining: false,
      });

      expect(res.multiplier).toBe(2.0);
      expect(res.isSurgeActive).toBe(true);
      expect(res.isLiveOverride).toBe(false);
      expect(res.reason).toContain("extrema escassez");
    });
  });

  describe("2. Sobretaxa Administrativa Imediata (Live Override) & Precedência", () => {
    test("Override manual tem precedência absoluta sobre baixa demanda de mercado", () => {
      // Mercado com abundância de motoristas (1 chamado para 20 motoristas -> R = 0.05)
      const resWithOverride = surgeEngine.calculateSurge({
        demandCount: 1,
        availableDriversCount: 20,
        manualAdminMultiplier: 1.4,
      });

      expect(resWithOverride.multiplier).toBe(1.4);
      expect(resWithOverride.isSurgeActive).toBe(true);
      expect(resWithOverride.isLiveOverride).toBe(true);
      expect(resWithOverride.reason).toContain("Sobretaxa administrativa imediata");
    });

    test("Suporta todas as opções instantâneas: x1.2, x1.4, x1.6, x1.8, x2.0", () => {
      const multipliers = [1.2, 1.4, 1.6, 1.8, 2.0];
      for (const m of multipliers) {
        const res = surgeEngine.calculateSurge({
          demandCount: 2,
          availableDriversCount: 10,
          manualAdminMultiplier: m,
        });
        expect(res.multiplier).toBe(m);
        expect(res.isLiveOverride).toBe(true);
      }
    });

    test("ativarLiveSurgeOverride persiste duração (15m, 30m, 1h, 2h) e reflete no motor", () => {
      // Teste com duração de 30 minutos
      const settings = ativarLiveSurgeOverride(1.6, 30, "default");
      expect(settings.liveOverrideAtivo).toBe(true);
      expect(settings.liveOverrideMultiplicador).toBe(1.6);
      expect(Boolean(settings.liveOverrideExpiraEm)).toBe(true);
      expect(settings.liveOverrideExpiraEm! > Date.now()).toBe(true);

      // Motor dinâmico deve ler o override ativo
      const surge = surgeEngine.calculateSurge({}, "default");
      expect(surge.multiplier).toBe(1.6);
      expect(surge.isLiveOverride).toBe(true);

      // Desativa e verifica reversão
      const desativado = desativarLiveSurgeOverride("default");
      expect(desativado.liveOverrideAtivo).toBe(false);
      expect(desativado.liveOverrideMultiplicador).toBe(1.0);

      const surgeAposDesativar = surgeEngine.calculateSurge(
        { demandCount: 2, availableDriversCount: 5, isNightTime: false, isRaining: false },
        "default"
      );
      expect(surgeAposDesativar.multiplier).toBe(1.0);
      expect(surgeAposDesativar.isLiveOverride).toBe(false);
    });
  });

  describe("3. Expiração Automática do Live Override", () => {
    test("Override com timestamp expirado é automaticamente desativado e limpo", () => {
      // Simula override expirado há 5 minutos gravado no LocalStorage
      const timestampPassado = Date.now() - 5 * 60 * 1000;
      salvarConfiguracoesDespacho(
        {
          liveOverrideAtivo: true,
          liveOverrideMultiplicador: 1.8,
          liveOverrideExpiraEm: timestampPassado,
        },
        "default"
      );
      surgeEngine.clearAdminOverride("default");

      // carregarConfiguracoesDespacho detecta a expiração e limpa
      const config = carregarConfiguracoesDespacho("default");
      expect(config.liveOverrideAtivo).toBe(false);
      expect(config.liveOverrideMultiplicador).toBe(1.0);

      // O cálculo volta para a inteligência de mercado
      const surge = surgeEngine.calculateSurge(
        { demandCount: 5, availableDriversCount: 10, isNightTime: false, isRaining: false },
        "default"
      );
      expect(surge.multiplier).toBe(1.0);
      expect(surge.isLiveOverride).toBe(false);
    });
  });

  describe("4. Isolamento Estrito Multi-Tenant (Franquia vs Super Admin / Outras Franquias)", () => {
    test("Override aplicado na Franquia BH não afeta Franquia Itaperuna ou Default", () => {
      // Aplica x1.8 na praça de Belo Horizonte
      ativarLiveSurgeOverride(1.8, 60, "tenant-bh");

      // Praça BH tem 1.8x ativo
      const surgeBH = surgeEngine.calculateSurge({}, "tenant-bh");
      expect(surgeBH.multiplier).toBe(1.8);
      expect(surgeBH.isLiveOverride).toBe(true);
      expect(surgeBH.tenantId).toBe("tenant-bh");

      // Praça Itaperuna deve continuar independente (1.0x se em equilíbrio)
      const surgeItaperuna = surgeEngine.calculateSurge(
        { demandCount: 2, availableDriversCount: 10, isNightTime: false, isRaining: false },
        "tenant-itaperuna"
      );
      expect(surgeItaperuna.multiplier).toBe(1.0);
      expect(surgeItaperuna.isLiveOverride).toBe(false);
      expect(surgeItaperuna.tenantId).toBe("tenant-itaperuna");

      // Praça Default (Super Admin) permanece independente
      const surgeDefault = surgeEngine.calculateSurge(
        { demandCount: 3, availableDriversCount: 10, isNightTime: false, isRaining: false },
        "default"
      );
      expect(surgeDefault.multiplier).toBe(1.0);
      expect(surgeDefault.isLiveOverride).toBe(false);

      // Limpeza
      desativarLiveSurgeOverride("tenant-bh");
    });

    test("Estatísticas de mercado (chamados vs motoristas) são 100% isoladas por tenant", () => {
      // Atualiza mercado de BH com alta demanda (30 chamados vs 10 motoristas -> R = 3.0)
      surgeEngine.updateTenantMarketState("tenant-bh", 30, 10);

      // Atualiza mercado de Itaperuna com equilíbrio (5 chamados vs 10 motoristas -> R = 0.5)
      surgeEngine.updateTenantMarketState("tenant-itaperuna", 5, 10);

      const statsBH = surgeEngine.getTenantMarketStats("tenant-bh");
      expect(statsBH.demandCount).toBe(30);
      expect(statsBH.availableDriversCount).toBe(10);

      const statsItaperuna = surgeEngine.getTenantMarketStats("tenant-itaperuna");
      expect(statsItaperuna.demandCount).toBe(5);
      expect(statsItaperuna.availableDriversCount).toBe(10);

      // Cálculo de surge automático reflete o mercado específico de cada praça
      const surgeBH = surgeEngine.calculateSurge({ isNightTime: false, isRaining: false }, "tenant-bh");
      expect(surgeBH.multiplier).toBe(1.8); // 3.0 ratio -> 1.8x
      expect(surgeBH.tenantId).toBe("tenant-bh");

      const surgeItaperuna = surgeEngine.calculateSurge(
        { isNightTime: false, isRaining: false },
        "tenant-itaperuna"
      );
      expect(surgeItaperuna.multiplier).toBe(1.0);
      expect(surgeItaperuna.tenantId).toBe("tenant-itaperuna");
    });
  });

  describe("5. Integração com PricingService & Cotação Multicategoria Transparente", () => {
    test("Todas as 7 modalidades recebem informações completas de tarifa dinâmica", () => {
      // Configura rota de 10 km e 20 min
      const routeMetrics = {
        distanceKm: 10,
        durationMinutes: 20,
        trafficDurationMinutes: 20,
      };

      // Simula mercado com alta demanda (R = 1.5 -> 1.4x)
      const quotes = pricingService.calculateMultiCategoryQuotes(routeMetrics, {
        demandCount: 15,
        availableDriversCount: 10,
        isNightTime: false,
        isRaining: false,
      });

      const categories = [
        "PARTIU_MOTO",
        "PARTIU_CARRO",
        "PARTIU_EXECUTIVO",
        "PARTIU_FLASH",
        "PARTIU_ENTREGA",
        "PARTIU_TURISMO",
        "PARTIU_VAN",
      ] as const;

      for (const cat of categories) {
        const q = quotes[cat];
        expect(Boolean(q)).toBe(true);
        expect(q.surgeMultiplier).toBe(1.4);
        expect(q.isSurgeActive).toBe(true);
        expect(q.isLiveOverride).toBe(false);
        expect(q.surgeReason.length > 0).toBe(true);
        expect(q.priceBrl > 0).toBe(true);
      }
    });

    test("Preço de PARTIU_CARRO com surge 1.4x reflete o multiplicador de forma consistente", () => {
      const routeMetrics = {
        distanceKm: 10,
        durationMinutes: 20,
      };

      const quoteNormal = pricingService.calculateMultiCategoryQuotes(routeMetrics, {
        demandCount: 5,
        availableDriversCount: 10,
        isNightTime: false,
        isRaining: false,
      });

      const quoteSurge = pricingService.calculateMultiCategoryQuotes(routeMetrics, {
        demandCount: 15,
        availableDriversCount: 10,
        isNightTime: false,
        isRaining: false,
      });

      expect(quoteNormal.PARTIU_CARRO.surgeMultiplier).toBe(1.0);
      expect(quoteSurge.PARTIU_CARRO.surgeMultiplier).toBe(1.4);
      expect(quoteSurge.PARTIU_CARRO.priceBrl > quoteNormal.PARTIU_CARRO.priceBrl).toBe(true);

      // Razão entre preços deve ser aproximadamente 1.4x
      const ratio = quoteSurge.PARTIU_CARRO.priceBrl / quoteNormal.PARTIU_CARRO.priceBrl;
      expect(ratio > 1.35 && ratio < 1.45).toBe(true);
    });

    test("Quando Live Override está ativo, as cotações marcam isLiveOverride: true", () => {
      ativarLiveSurgeOverride(1.6, 15, "default");

      const routeMetrics = { distanceKm: 5, durationMinutes: 10 };
      const quotes = pricingService.calculateMultiCategoryQuotes(routeMetrics);

      expect(quotes.PARTIU_CARRO.surgeMultiplier).toBe(1.6);
      expect(quotes.PARTIU_CARRO.isSurgeActive).toBe(true);
      expect(quotes.PARTIU_CARRO.isLiveOverride).toBe(true);

      desativarLiveSurgeOverride("default");
    });
  });

  describe("6. Fatores Adicionais (Noturno, Chuva e Teto Máximo)", () => {
    test("Fator Noturno adiciona +0.15x na tarifa da madrugada", () => {
      const res = surgeEngine.calculateSurge({
        demandCount: 5,
        availableDriversCount: 10,
        isNightTime: true,
        isRaining: false,
      });

      // 1.0 base + 0.15 noturno = 1.15 -> arredonda para 1.2
      expect(res.multiplier).toBe(1.2);
      expect(res.breakdown.nightFactor).toBe(1.15);
      expect(res.reason).toContain("noturna");
    });

    test("Fator Chuva adiciona sobretaxa climática de incentivo", () => {
      const res = surgeEngine.calculateSurge({
        demandCount: 5,
        availableDriversCount: 10,
        isNightTime: false,
        isRaining: true,
      });

      // 1.0 base + 0.2 chuva = 1.2
      expect(res.multiplier).toBe(1.2);
      expect(res.reason).toContain("climáticas");
    });

    test("Clamping de teto: multiplicador nunca excede o teto configurado (ex: 2.5x)", () => {
      const res = surgeEngine.calculateSurge({
        demandCount: 100,
        availableDriversCount: 1, // R = 100
        isNightTime: true,
        isRaining: true,
        regionalEventActive: true,
        maxSurgeCeiling: 2.5,
      });

      expect(res.multiplier <= 2.5).toBe(true);
    });
  });
});
