/**
 * 🏙️ SERVIÇO GLOBAL DE GESTÃO DE CIDADES E PRAÇAS DE OPERAÇÃO
 * Sistema de Seleção e Escopo Regional do Painel Administrativo PARTIU V4
 */

export interface AdminPracaOperacao {
  id: string;
  nome: string;
  uf: string;
  labelCompleto: string;
  status: "ATIVA" | "EM_CONFIGURACAO" | "PAUSADA";
  lat: number;
  lng: number;
  raioKm: number;
  totalMotoristasAtivos?: number;
  totalCorridasHoje?: number;
}

export const PRACA_GLOBAL_TODAS: AdminPracaOperacao = {
  id: "todas",
  nome: "Todas as Praças",
  uf: "BR",
  labelCompleto: "Todas as Praças (Rede Nacional)",
  status: "ATIVA",
  lat: -9.6658,
  lng: -35.7351,
  raioKm: 150,
};

export const PRACAS_PADRAO_INICIAIS: AdminPracaOperacao[] = [
  PRACA_GLOBAL_TODAS,
  {
    id: "mcz",
    nome: "Maceió",
    uf: "AL",
    labelCompleto: "Maceió - AL",
    status: "ATIVA",
    lat: -9.6658,
    lng: -35.7351,
    raioKm: 25,
  },
  {
    id: "arp",
    nome: "Arapiraca",
    uf: "AL",
    labelCompleto: "Arapiraca - AL",
    status: "ATIVA",
    lat: -9.7517,
    lng: -36.6601,
    raioKm: 20,
  },
  {
    id: "itp",
    nome: "Itaperuna",
    uf: "RJ",
    labelCompleto: "Itaperuna - RJ",
    status: "ATIVA",
    lat: -21.2054,
    lng: -41.8892,
    raioKm: 15,
  },
  {
    id: "cmp",
    nome: "Campos dos Goytacazes",
    uf: "RJ",
    labelCompleto: "Campos dos Goytacazes - RJ",
    status: "ATIVA",
    lat: -21.7545,
    lng: -41.3244,
    raioKm: 25,
  },
];

const STORAGE_KEY_PRACA_ATIVA = "partiu_admin_praca_ativa";
const STORAGE_KEY_PRACAS_CUSTOM = "partiu_cidades_ativas";

/**
 * Normaliza e consolida as praças cadastradas em localStorage e nos padrões
 */
export function carregarPracasDisponiveis(): AdminPracaOperacao[] {
  const pracasMap = new Map<string, AdminPracaOperacao>();

  // 1. Inserir praças padrão
  PRACAS_PADRAO_INICIAIS.forEach((p) => pracasMap.set(p.id, p));

  // 2. Mesclar praças criadas dinamicamente no assistente de onboarding
  if (typeof window !== "undefined") {
    try {
      const rawCustom = localStorage.getItem(STORAGE_KEY_PRACAS_CUSTOM);
      if (rawCustom) {
        const parsed = JSON.parse(rawCustom);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            const id = item.id || `cidade_${item.nome?.toLowerCase().replace(/\s+/g, "_")}`;
            if (!pracasMap.has(id)) {
              pracasMap.set(id, {
                id,
                nome: item.nome || "Nova Cidade",
                uf: item.uf || "BR",
                labelCompleto: `${item.nome || "Nova Cidade"} - ${item.uf || "BR"}`,
                status: item.status === "EM_CONFIGURACAO" ? "EM_CONFIGURACAO" : "ATIVA",
                lat: typeof item.lat === "number" ? item.lat : -9.6658,
                lng: typeof item.lng === "number" ? item.lng : -35.7351,
                raioKm: typeof item.raioKm === "number" ? item.raioKm : 20,
              });
            }
          });
        }
      }
    } catch {}
  }

  return Array.from(pracasMap.values());
}

/**
 * Obtém o ID da praça ativa salva no navegador
 */
export function getPracaAtivaId(): string {
  if (typeof window === "undefined") return "todas";
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PRACA_ATIVA);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return "todas";
}

/**
 * Obtém o registro completo da praça ativa
 */
export function getPracaAtiva(): AdminPracaOperacao {
  const pracas = carregarPracasDisponiveis();
  const ativaId = getPracaAtivaId();
  const encontrada = pracas.find((p) => p.id === ativaId);
  return encontrada || PRACA_GLOBAL_TODAS;
}

/**
 * Altera a praça ativa, persiste e notifica o ecossistema com evento de broadcast
 */
export function setPracaAtiva(pracaId: string): AdminPracaOperacao {
  const pracas = carregarPracasDisponiveis();
  const novaPraca = pracas.find((p) => p.id === pracaId) || PRACA_GLOBAL_TODAS;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_PRACA_ATIVA, novaPraca.id);
      window.dispatchEvent(
        new CustomEvent("partiu:praca-changed", {
          detail: novaPraca,
        })
      );
    } catch {}
  }

  return novaPraca;
}
