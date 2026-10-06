/**
 * ⚡ SERVIÇO DE CONFIGURAÇÃO DE DESPACHO & REGRAS DE TARIFA DINÂMICA (SURGE PRICING)
 * Controla os parâmetros do algoritmo de busca progressiva e regras automatizadas de sobretaxa
 */

import { surgeEngine } from "@/services/SurgeEngine";

export interface SurgeRule {
  id: string;
  nome: string;
  descricao: string;
  gatilho: "HORARIO" | "CLIMA" | "EVENTO" | "MANUAL";
  horarioInicio?: string;
  horarioFim?: string;
  diasSemana?: string;
  multiplicador: number;
  ativo: boolean;
}

export interface DispatchAlgorithmSettings {
  raioInicialKm: number;
  expansaoKmPorMinuto: number;
  raioMaximoKm: number;
  timeoutGeralSegundos: number;
  pisoMinimoCorrida: number;
  toleranciaCancelamentoMinutos: number;
  tarifaParadaAdicional: number;
  takeRateTipo: "PERCENTUAL" | "FIXO";
  takeRateValor: number;
  liveOverrideAtivo: boolean;
  liveOverrideMultiplicador: number;
  liveOverrideExpiraEm?: number | null;
}

const STORAGE_KEY_DISPATCH_SETTINGS = "partiu_dispatch_algorithm_settings";
const STORAGE_KEY_SURGE_RULES = "partiu_surge_pricing_rules";

export const DEFAULT_DISPATCH_SETTINGS: DispatchAlgorithmSettings = {
  raioInicialKm: 2.0,
  expansaoKmPorMinuto: 1.5,
  raioMaximoKm: 8.0,
  timeoutGeralSegundos: 60,
  pisoMinimoCorrida: 8.0,
  toleranciaCancelamentoMinutos: 2,
  tarifaParadaAdicional: 2.5,
  takeRateTipo: "PERCENTUAL",
  takeRateValor: 15.0, // 15% retido pelo app
  liveOverrideAtivo: false,
  liveOverrideMultiplicador: 1.0,
  liveOverrideExpiraEm: null,
};

export const REGRAS_SURGE_PADRAO: SurgeRule[] = [
  {
    id: "pico_matutino",
    nome: "Pico Matutino (Ida ao Trabalho)",
    descricao: "Horário de rush matinal em dias úteis com alta procura",
    gatilho: "HORARIO",
    horarioInicio: "06:30",
    horarioFim: "08:30",
    diasSemana: "Seg à Sex",
    multiplicador: 1.3,
    ativo: true,
  },
  {
    id: "pico_noturno",
    nome: "Pico Noturno (Volta do Trabalho)",
    descricao: "Concentração máxima de viagens comerciais e centros urbanos",
    gatilho: "HORARIO",
    horarioInicio: "17:30",
    horarioFim: "19:30",
    diasSemana: "Seg à Sex",
    multiplicador: 1.4,
    ativo: true,
  },
  {
    id: "fim_de_semana_noite",
    nome: "Madrugada de Fim de Semana (Baladas & Shows)",
    descricao: "Incentivo aos motoristas parceiros nas madrugadas de entretenimento",
    gatilho: "HORARIO",
    horarioInicio: "23:00",
    horarioFim: "05:00",
    diasSemana: "Sex e Sáb",
    multiplicador: 1.7,
    ativo: true,
  },
  {
    id: "chuva_temporal",
    nome: "Chuva Intensa & Alerta Climático",
    descricao: "Acionamento automático quando dados meteorológicos indicam precipitação",
    gatilho: "CLIMA",
    multiplicador: 1.5,
    ativo: true,
  },
  {
    id: "eventos_regionais",
    nome: "Eventos & Feiras Regionais",
    descricao: "Alta concentração momentânea em arenas, exposições e polos turísticos",
    gatilho: "EVENTO",
    multiplicador: 1.6,
    ativo: false,
  },
];

export function carregarConfiguracoesDespacho(): DispatchAlgorithmSettings {
  if (typeof window === "undefined") return DEFAULT_DISPATCH_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISPATCH_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Checa se o live override expirou
      if (parsed.liveOverrideExpiraEm && Date.now() > parsed.liveOverrideExpiraEm) {
        parsed.liveOverrideAtivo = false;
        parsed.liveOverrideMultiplicador = 1.0;
        parsed.liveOverrideExpiraEm = null;
      }
      return { ...DEFAULT_DISPATCH_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_DISPATCH_SETTINGS;
}

export function salvarConfiguracoesDespacho(
  novas: Partial<DispatchAlgorithmSettings>
): DispatchAlgorithmSettings {
  const atuais = carregarConfiguracoesDespacho();
  const consolidadas = { ...atuais, ...novas };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_DISPATCH_SETTINGS, JSON.stringify(consolidadas));
    window.dispatchEvent(new CustomEvent("partiu:dispatch-settings-updated"));
  }

  return consolidadas;
}

export function carregarRegrasSurge(): SurgeRule[] {
  if (typeof window === "undefined") return REGRAS_SURGE_PADRAO;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SURGE_RULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return REGRAS_SURGE_PADRAO;
}

export function salvarRegraSurge(regra: Omit<SurgeRule, "id"> & { id?: string }): SurgeRule {
  const regras = carregarRegrasSurge();
  const id = regra.id || `surge_${Date.now().toString(36)}`;
  const nova: SurgeRule = {
    ...regra,
    id,
  };

  const existentes = regras.filter((r) => r.id !== id);
  existentes.push(nova);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_SURGE_RULES, JSON.stringify(existentes));
    window.dispatchEvent(new CustomEvent("partiu:surge-rules-updated"));
  }

  return nova;
}

export function alternarStatusRegraSurge(id: string): SurgeRule | null {
  const regras = carregarRegrasSurge();
  const index = regras.findIndex((r) => r.id === id);
  if (index < 0) return null;

  regras[index].ativo = !regras[index].ativo;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_SURGE_RULES, JSON.stringify(regras));
    window.dispatchEvent(new CustomEvent("partiu:surge-rules-updated"));
  }

  return regras[index];
}

export function excluirRegraSurge(id: string): boolean {
  const regras = carregarRegrasSurge();
  const filtradas = regras.filter((r) => r.id !== id);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_SURGE_RULES, JSON.stringify(filtradas));
    window.dispatchEvent(new CustomEvent("partiu:surge-rules-updated"));
  }

  return true;
}

export function ativarLiveSurgeOverride(
  multiplicador: number,
  duracaoMinutos: number = 30
): DispatchAlgorithmSettings {
  const clamped = Math.max(1.0, Math.min(3.0, multiplicador));
  const expiraEm = Date.now() + duracaoMinutos * 60 * 1000;

  // Atualiza o motor em tempo real
  surgeEngine.setAdminOverride(clamped);

  return salvarConfiguracoesDespacho({
    liveOverrideAtivo: clamped > 1.0,
    liveOverrideMultiplicador: clamped,
    liveOverrideExpiraEm: expiraEm,
  });
}

export function desativarLiveSurgeOverride(): DispatchAlgorithmSettings {
  surgeEngine.setAdminOverride(1.0);
  return salvarConfiguracoesDespacho({
    liveOverrideAtivo: false,
    liveOverrideMultiplicador: 1.0,
    liveOverrideExpiraEm: null,
  });
}
