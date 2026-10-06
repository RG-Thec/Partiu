/**
 * 🗺️ FINOPS DE APIS DE MAPAS & OBSERVABILIDADE (GOOGLE MAPS CACHE & PROXY)
 * Camada de mensuração de economia, deduplicação de geocoding/rotas
 * e stream de observabilidade com categorização de tráfego.
 */

export type CategoriaRequisicaoApi = "SERVIDOR" | "GOOGLE MAPS" | "SALVAR" | "CORRIDA";
export type ProvedorMapa = "GOOGLE_MAPS" | "CACHE_LOCAL" | "OSRM_FALLBACK";
export type EndpointMapa = "Directions" | "Geocoding" | "Places Autocomplete" | "Distance Matrix";
export type StatusRequisicaoCache = "HIT" | "MISS" | "SAVED";

export interface ApiRequestLog {
  id: string;
  timestamp: number;
  categoria: CategoriaRequisicaoApi;
  provedor: ProvedorMapa;
  endpoint: EndpointMapa;
  parametros: string;
  status: StatusRequisicaoCache;
  latenciaMs: number;
  custoEstimadoUsd: number;
  economiaEstimadaUsd: number;
}

export interface FinOpsMetricas {
  totalRequisicoes: number;
  totalGoogleMaps: number;
  totalCacheHits: number;
  taxaRetencaoPercent: number;
  custoTotalSemCacheUsd: number;
  custoRealGastoUsd: number;
  totalEconomizadoUsd: number;
  totalEconomizadoBrl: number;
  tempoMedioRespostaMs: number;
}

export interface ConfigCacheMapas {
  ttlMinutos: number;
  deadbandMetros: number;
  modoEconomiaAgressivo: boolean;
  usarOsrmComoFallback: boolean;
  cotacaoDolarBrl: number;
}

const STORAGE_KEY_MAPS_LOGS = "partiu_maps_api_logs_v1";
const STORAGE_KEY_MAPS_CONFIG = "partiu_maps_finops_config_v1";

export const DEFAULT_CONFIG_MAPAS: ConfigCacheMapas = {
  ttlMinutos: 30,
  deadbandMetros: 50,
  modoEconomiaAgressivo: true,
  usarOsrmComoFallback: true,
  cotacaoDolarBrl: 5.75,
};

// Custos de tabela do Google Maps Platform (por requisição individual)
export const CUSTOS_TABELA_GOOGLE_USD: Record<EndpointMapa, number> = {
  Directions: 0.005, // $5,00 a cada 1.000 requisições
  Geocoding: 0.005, // $5,00 a cada 1.000 requisições
  "Places Autocomplete": 0.017, // $17,00 a cada 1.000 requisições (Session Details)
  "Distance Matrix": 0.005, // $5,00 por elemento
};

export const LOGS_INICIAIS: ApiRequestLog[] = [
  {
    id: "log-1",
    timestamp: Date.now() - 1000 * 60 * 12,
    categoria: "CORRIDA",
    provedor: "CACHE_LOCAL",
    endpoint: "Directions",
    parametros: "Centro (-21.205, -41.889) -> Aeroporto (-21.218, -41.905)",
    status: "HIT",
    latenciaMs: 14,
    custoEstimadoUsd: 0,
    economiaEstimadaUsd: 0.005,
  },
  {
    id: "log-2",
    timestamp: Date.now() - 1000 * 60 * 10,
    categoria: "GOOGLE MAPS",
    provedor: "GOOGLE_MAPS",
    endpoint: "Places Autocomplete",
    parametros: "Busca: 'Hospital São José do Avaí, Itaperuna'",
    status: "MISS",
    latenciaMs: 194,
    custoEstimadoUsd: 0.017,
    economiaEstimadaUsd: 0,
  },
  {
    id: "log-3",
    timestamp: Date.now() - 1000 * 60 * 8,
    categoria: "SERVIDOR",
    provedor: "CACHE_LOCAL",
    endpoint: "Geocoding",
    parametros: "Reverse Geocoding lat/lng -21.2052, -41.8891 (Hash hit)",
    status: "HIT",
    latenciaMs: 8,
    custoEstimadoUsd: 0,
    economiaEstimadaUsd: 0.005,
  },
  {
    id: "log-4",
    timestamp: Date.now() - 1000 * 60 * 5,
    categoria: "CORRIDA",
    provedor: "CACHE_LOCAL",
    endpoint: "Directions",
    parametros: "Bairro Vinhosa -> Terminal Rodoviário (Rota Frequente)",
    status: "HIT",
    latenciaMs: 18,
    custoEstimadoUsd: 0,
    economiaEstimadaUsd: 0.005,
  },
  {
    id: "log-5",
    timestamp: Date.now() - 1000 * 60 * 3,
    categoria: "SALVAR",
    provedor: "CACHE_LOCAL",
    endpoint: "Distance Matrix",
    parametros: "Matriz 5 condutores próximos -> passageiro (Deadband 50m)",
    status: "SAVED",
    latenciaMs: 22,
    custoEstimadoUsd: 0,
    economiaEstimadaUsd: 0.025,
  },
  {
    id: "log-6",
    timestamp: Date.now() - 1000 * 60 * 1,
    categoria: "GOOGLE MAPS",
    provedor: "GOOGLE_MAPS",
    endpoint: "Directions",
    parametros: "Nova rota intermunicipal Itaperuna -> Bom Jesus do Itabapoana",
    status: "MISS",
    latenciaMs: 248,
    custoEstimadoUsd: 0.005,
    economiaEstimadaUsd: 0,
  },
];

let inMemoryLogs: ApiRequestLog[] = [...LOGS_INICIAIS];
let inMemoryConfig: ConfigCacheMapas = { ...DEFAULT_CONFIG_MAPAS };

/**
 * Carrega a lista de logs de requisições de mapas
 */
export function carregarLogsFinOps(): ApiRequestLog[] {
  if (typeof window === "undefined") return inMemoryLogs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAPS_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return inMemoryLogs;
}

/**
 * Carrega parâmetros de configuração de FinOps e Cache
 */
export function carregarConfigFinOps(): ConfigCacheMapas {
  if (typeof window === "undefined") return inMemoryConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAPS_CONFIG);
    if (raw) {
      return { ...DEFAULT_CONFIG_MAPAS, ...JSON.parse(raw) };
    }
  } catch {}
  return inMemoryConfig;
}

/**
 * Salva parâmetros de configuração do cache de mapas
 */
export function salvarConfigFinOps(config: Partial<ConfigCacheMapas>): ConfigCacheMapas {
  const atual = carregarConfigFinOps();
  const nova = { ...atual, ...config };
  inMemoryConfig = nova;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_MAPS_CONFIG, JSON.stringify(nova));
      window.dispatchEvent(new CustomEvent("partiu:maps-finops-updated"));
    } catch {}
  }
  return nova;
}

/**
 * Registra uma nova chamada ou reaproveitamento de cache no stream de observabilidade
 */
export function registrarChamadaApi(params: {
  categoria: CategoriaRequisicaoApi;
  provedor: ProvedorMapa;
  endpoint: EndpointMapa;
  parametros: string;
  status: StatusRequisicaoCache;
  latenciaMs: number;
}): ApiRequestLog {
  const custoBase = CUSTOS_TABELA_GOOGLE_USD[params.endpoint] || 0.005;
  const isHitOuSaved = params.status === "HIT" || params.status === "SAVED";

  const novoLog: ApiRequestLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    categoria: params.categoria,
    provedor: params.provedor,
    endpoint: params.endpoint,
    parametros: params.parametros,
    status: params.status,
    latenciaMs: Math.max(1, Math.round(params.latenciaMs)),
    custoEstimadoUsd: isHitOuSaved ? 0 : custoBase,
    economiaEstimadaUsd: isHitOuSaved ? custoBase : 0,
  };

  const logsAtuais = carregarLogsFinOps();
  // Mantém os últimos 150 registros na memória/storage
  const logsAtualizados = [novoLog, ...logsAtuais].slice(0, 150);
  inMemoryLogs = logsAtualizados;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_MAPS_LOGS, JSON.stringify(logsAtualizados));
      window.dispatchEvent(new CustomEvent("partiu:maps-finops-updated"));
    } catch {}
  }

  return novoLog;
}

/**
 * Consolida todas as métricas financeiras de consumo e retenção de cache
 */
export function calcularMetricasFinOps(logs?: ApiRequestLog[]): FinOpsMetricas {
  const lista = logs || carregarLogsFinOps();
  const config = carregarConfigFinOps();

  const totalRequisicoes = lista.length;
  if (totalRequisicoes === 0) {
    return {
      totalRequisicoes: 0,
      totalGoogleMaps: 0,
      totalCacheHits: 0,
      taxaRetencaoPercent: 100,
      custoTotalSemCacheUsd: 0,
      custoRealGastoUsd: 0,
      totalEconomizadoUsd: 0,
      totalEconomizadoBrl: 0,
      tempoMedioRespostaMs: 0,
    };
  }

  let totalGoogleMaps = 0;
  let totalCacheHits = 0;
  let custoRealGastoUsd = 0;
  let totalEconomizadoUsd = 0;
  let somaLatencia = 0;

  lista.forEach((item) => {
    somaLatencia += item.latenciaMs;
    if (item.status === "HIT" || item.status === "SAVED") {
      totalCacheHits++;
      totalEconomizadoUsd += item.economiaEstimadaUsd;
    } else {
      totalGoogleMaps++;
      custoRealGastoUsd += item.custoEstimadoUsd;
    }
  });

  const custoTotalSemCacheUsd = custoRealGastoUsd + totalEconomizadoUsd;
  const taxaRetencaoPercent =
    totalRequisicoes > 0 ? (totalCacheHits / totalRequisicoes) * 100 : 0;
  const totalEconomizadoBrl = totalEconomizadoUsd * config.cotacaoDolarBrl;
  const tempoMedioRespostaMs = Math.round(somaLatencia / totalRequisicoes);

  return {
    totalRequisicoes,
    totalGoogleMaps,
    totalCacheHits,
    taxaRetencaoPercent,
    custoTotalSemCacheUsd,
    custoRealGastoUsd,
    totalEconomizadoUsd,
    totalEconomizadoBrl,
    tempoMedioRespostaMs,
  };
}

/**
 * Limpa o histórico de cache de rotas e reseta contadores locais
 */
export function limparCacheMapas(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("partiu_routing_cache_v4");
      localStorage.removeItem(STORAGE_KEY_MAPS_LOGS);
      window.dispatchEvent(new CustomEvent("partiu:maps-finops-updated"));
    } catch {}
  }
  inMemoryLogs = [];
}
