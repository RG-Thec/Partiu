export type TipoPontoEmbarque =
  | "terminal_rodoviario"
  | "posto_combustivel"
  | "trevo_rodoviario"
  | "praca_central"
  | "ponto_urbano_vip";

export interface PontoEmbarqueConfig {
  id: string;
  nome: string; // Ex: "Hub Central • Praça Principal"
  cidade: string; // "Centro Operacional"
  linhaAssociada: string; // "Todas" ou identificador da rota
  tipo: TipoPontoEmbarque;
  tipoRotulo: string; // "Ponto de Embarque Rápido"
  referencia: string; // "Marco Central • Calçadão"
  enderecoCompleto: string;
  comodidades: string[]; // ["🛡️ Segurança 24h", "🚻 Banheiro", "☕ Lanchonete", "🛋️ Abrigo Coberto", "🛰️ Wi-Fi"]
  minutosAposSaida: number; // Minutos desde a partida estimada
  distanciaKmEstimada: number;
  fotoUrl: string;
  lat?: number | undefined;
  lng?: number | undefined;
  ativo: boolean;
  ordem: number;
  observacaoOperacional?: string;
}

export const PONTOS_EMBARQUE_PADRAO: PontoEmbarqueConfig[] = [
  {
    id: "hub-01",
    lat: -21.2054,
    lng: -41.8892,
    nome: "Hub Central • Praça Principal",
    cidade: "Centro Urbano",
    linhaAssociada: "Todas",
    tipo: "praca_central",
    tipoRotulo: "Ponto de Embarque Rápido",
    referencia: "Marco Central • Calçadão",
    enderecoCompleto: "Av. Principal, s/n - Centro",
    comodidades: [
      "🛋️ Abrigo Coberto",
      "🛡️ Ponto Iluminado 24h",
      "☕ Cafés & Serviços",
      "🛰️ Wi-Fi Livre",
    ],
    minutosAposSaida: 0,
    distanciaKmEstimada: 0.5,
    fotoUrl:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&auto=format&fit=crop&q=80",
    ativo: true,
    ordem: 1,
    observacaoOperacional: "Baia exclusiva para parada e embarque rápido de passageiros.",
  },
  {
    id: "hub-02",
    lat: -21.218,
    lng: -41.875,
    nome: "Hub Aeroporto & Conexão",
    cidade: "Aeroporto",
    linhaAssociada: "Todas",
    tipo: "ponto_urbano_vip",
    tipoRotulo: "Terminal de Passageiros",
    referencia: "Terminal de Embarque • Baia 1",
    enderecoCompleto: "Av. do Aeroporto, 100",
    comodidades: [
      "🛋️ Sala Climatizada",
      "🚻 Sanitários",
      "🛡️ Monitoramento 24h",
    ],
    minutosAposSaida: 0,
    distanciaKmEstimada: 4.2,
    fotoUrl:
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=300&auto=format&fit=crop&q=80",
    ativo: true,
    ordem: 2,
  },
  {
    id: "hub-03",
    lat: -21.208,
    lng: -41.884,
    nome: "Hub Shopping & Lazer",
    cidade: "Zona Comercial",
    linhaAssociada: "Todas",
    tipo: "ponto_urbano_vip",
    tipoRotulo: "Centro Comercial & Shopping",
    referencia: "Portaria Principal • Acesso de Aplicativos",
    enderecoCompleto: "Av. Comercial, 500",
    comodidades: ["☕ Alimentação", "🛋️ Conforto", "🛡️ Segurança Privada"],
    minutosAposSaida: 0,
    distanciaKmEstimada: 2.1,
    fotoUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&auto=format&fit=crop&q=80",
    ativo: true,
    ordem: 3,
  },
  {
    id: "hub-04",
    lat: -21.201,
    lng: -41.88,
    nome: "Hub Universitário • Campus Central",
    cidade: "Polo Universitário",
    linhaAssociada: "Todas",
    tipo: "terminal_rodoviario",
    tipoRotulo: "Polo Estudantil",
    referencia: "Entrada Principal do Campus",
    enderecoCompleto: "Rua Universitária, 200",
    comodidades: ["🛋️ Bancos Cobertos", "☕ Lanchonete", "🛡️ Ponto Seguro"],
    minutosAposSaida: 0,
    distanciaKmEstimada: 3.5,
    fotoUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=300&auto=format&fit=crop&q=80",
    ativo: true,
    ordem: 4,
  },
];

const STORAGE_KEY = "partiu_pontos_embarque_config";

export function getPontosEmbarqueConfig(): PontoEmbarqueConfig[] {
  if (typeof window === "undefined") return PONTOS_EMBARQUE_PADRAO;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PONTOS_EMBARQUE_PADRAO));
      return PONTOS_EMBARQUE_PADRAO;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return PONTOS_EMBARQUE_PADRAO;
  } catch {
    return PONTOS_EMBARQUE_PADRAO;
  }
}

export function salvarPontoEmbarque(ponto: PontoEmbarqueConfig): PontoEmbarqueConfig[] {
  const atuais = getPontosEmbarqueConfig();
  const index = atuais.findIndex((p) => p.id === ponto.id);
  let atualizados: PontoEmbarqueConfig[];

  if (index >= 0) {
    atualizados = atuais.map((p) => (p.id === ponto.id ? ponto : p));
  } else {
    atualizados = [ponto, ...atuais];
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
    } catch (e) {
      console.error("Erro ao salvar pontos de embarque:", e);
    }
  }

  return atualizados;
}

export function removerPontoEmbarque(id: string): PontoEmbarqueConfig[] {
  const atuais = getPontosEmbarqueConfig();
  const atualizados = atuais.filter((p) => p.id !== id);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
    } catch (e) {
      console.error("Erro ao remover ponto de embarque:", e);
    }
  }
  return atualizados;
}

export function toggleAtivoPontoEmbarque(id: string): PontoEmbarqueConfig[] {
  const atuais = getPontosEmbarqueConfig();
  const atualizados = atuais.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p));
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
    } catch (e) {
      console.error("Erro ao alterar status do ponto:", e);
    }
  }
  return atualizados;
}

export function resetarPontosEmbarquePadrao(): PontoEmbarqueConfig[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(PONTOS_EMBARQUE_PADRAO));
    } catch (e) {
      console.error("Erro ao resetar pontos de embarque:", e);
    }
  }
  return PONTOS_EMBARQUE_PADRAO;
}
