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
  lat: -15.7939,
  lng: -47.8828,
  raioKm: 1500,
};

import { whiteLabelEngine } from "@/lib/white-label";
import { getContaAtiva, isFranqueado } from "@/lib/admin-rbac";

export const PRACAS_PADRAO_INICIAIS: AdminPracaOperacao[] = [
  PRACA_GLOBAL_TODAS,
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
    id: "tenant-itaperuna",
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
  {
    id: "tenant-campos",
    nome: "Campos dos Goytacazes",
    uf: "RJ",
    labelCompleto: "Campos dos Goytacazes - RJ",
    status: "ATIVA",
    lat: -21.7545,
    lng: -41.3244,
    raioKm: 25,
  },
  {
    id: "tenant-bhmob",
    nome: "Belo Horizonte",
    uf: "MG",
    labelCompleto: "Belo Horizonte (BH Mob) - MG",
    status: "ATIVA",
    lat: -19.9167,
    lng: -43.9345,
    raioKm: 30,
  },
];

const STORAGE_KEY_PRACA_ATIVA = "partiu_admin_praca_ativa";
const STORAGE_KEY_PRACAS_CUSTOM = "partiu_cidades_ativas";

/**
 * Normaliza e consolida as praças cadastradas em localStorage, WhiteLabelEngine e padrões
 */
export function carregarPracasDisponiveis(): AdminPracaOperacao[] {
  const pracasMap = new Map<string, AdminPracaOperacao>();

  // 1. Inserir praça global e padrões
  PRACAS_PADRAO_INICIAIS.forEach((p) => pracasMap.set(p.id, p));

  // 2. Mesclar todos os Franqueados / Praças cadastrados no WhiteLabelEngine
  try {
    const tenants = whiteLabelEngine.getAllTenants();
    tenants.forEach((t) => {
      if (t.tenantId === "default" || t.tenantId === "matriz-br") return;
      const id = t.tenantId;
      const nome = t.cidadeNome || t.nomeOperacao;
      const uf = t.uf || "BR";
      const geo = t.configuracaoCompleta?.geo;
      pracasMap.set(id, {
        id,
        nome,
        uf,
        labelCompleto: `${nome} - ${uf}`,
        status: t.ativo !== false && t.statusPlano !== "SUSPENSO" ? "ATIVA" : "PAUSADA",
        lat: geo?.coordenadasCentroLat ?? -21.2054,
        lng: geo?.coordenadasCentroLng ?? -41.8892,
        raioKm: geo?.raioOperacaoPadraoKm ?? 15,
      });
    });
  } catch {}

  // 3. Mesclar praças criadas dinamicamente no assistente de onboarding
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
                lat: typeof item.lat === "number" ? item.lat : -15.7939,
                lng: typeof item.lng === "number" ? item.lng : -47.8828,
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
 * Obtém o ID da praça ativa salva no navegador com isolamento estrito para Franqueado
 */
export function getPracaAtivaId(): string {
  if (typeof window === "undefined") return "todas";
  try {
    const conta = getContaAtiva();
    if (isFranqueado(conta.role) && conta.tenantId) {
      return conta.tenantId;
    }
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
  const conta = getContaAtiva();
  // Franqueado tem praça estritamente bloqueada na sua própria franquia
  let targetId = pracaId;
  if (isFranqueado(conta.role) && conta.tenantId) {
    targetId = conta.tenantId;
  }

  const pracas = carregarPracasDisponiveis();
  const novaPraca = pracas.find((p) => p.id === targetId) || PRACA_GLOBAL_TODAS;

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

/**
 * Salva uma nova praça de operação no ecossistema
 */
export function salvarNovaPraca(dados: {
  nome: string;
  uf: string;
  lat: number;
  lng: number;
  raioKm: number;
  status?: "ATIVA" | "EM_CONFIGURACAO" | "PAUSADA";
}): AdminPracaOperacao {
  const ufLimpa = dados.uf.trim().toUpperCase().slice(0, 2);
  const slug = dados.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 20);
  
  const id = `praca_${slug}_${ufLimpa.toLowerCase()}_${Date.now().toString(36)}`;
  const novaPraca: AdminPracaOperacao = {
    id,
    nome: dados.nome.trim(),
    uf: ufLimpa,
    labelCompleto: `${dados.nome.trim()} - ${ufLimpa}`,
    status: dados.status || "ATIVA",
    lat: Number(dados.lat),
    lng: Number(dados.lng),
    raioKm: Math.max(1, Number(dados.raioKm) || 20),
    totalMotoristasAtivos: 0,
    totalCorridasHoje: 0,
  };

  if (typeof window !== "undefined") {
    try {
      const rawCustom = localStorage.getItem(STORAGE_KEY_PRACAS_CUSTOM);
      const existentes: AdminPracaOperacao[] = rawCustom ? JSON.parse(rawCustom) : [];
      existentes.push(novaPraca);
      localStorage.setItem(STORAGE_KEY_PRACAS_CUSTOM, JSON.stringify(existentes));

      window.dispatchEvent(new CustomEvent("partiu:pracas-list-updated"));
    } catch (e) {
      console.warn("[AdminCityService] Erro ao salvar nova praça:", e);
    }
  }

  return novaPraca;
}

/**
 * Atualiza os dados de uma praça existente
 */
export function atualizarPraca(pracaAtualizada: AdminPracaOperacao): AdminPracaOperacao {
  if (pracaAtualizada.id === "todas") return PRACA_GLOBAL_TODAS;

  if (typeof window !== "undefined") {
    try {
      const rawCustom = localStorage.getItem(STORAGE_KEY_PRACAS_CUSTOM);
      let existentes: AdminPracaOperacao[] = rawCustom ? JSON.parse(rawCustom) : [];
      
      const idx = existentes.findIndex((p) => p.id === pracaAtualizada.id);
      if (idx >= 0) {
        existentes[idx] = {
          ...existentes[idx],
          ...pracaAtualizada,
          labelCompleto: `${pracaAtualizada.nome} - ${pracaAtualizada.uf}`,
        };
      } else {
        // Se for uma praça padrão sendo customizada
        existentes.push({
          ...pracaAtualizada,
          labelCompleto: `${pracaAtualizada.nome} - ${pracaAtualizada.uf}`,
        });
      }

      localStorage.setItem(STORAGE_KEY_PRACAS_CUSTOM, JSON.stringify(existentes));

      // Se a praça atualizada for a praça ativa, atualiza o contexto global
      if (getPracaAtivaId() === pracaAtualizada.id) {
        window.dispatchEvent(
          new CustomEvent("partiu:praca-changed", { detail: pracaAtualizada })
        );
      }

      window.dispatchEvent(new CustomEvent("partiu:pracas-list-updated"));
    } catch (e) {
      console.warn("[AdminCityService] Erro ao atualizar praça:", e);
    }
  }

  return pracaAtualizada;
}

/**
 * Remove uma praça ou restaura ao estado inativo
 */
export function removerPraca(id: string): boolean {
  if (id === "todas") return false;

  if (typeof window !== "undefined") {
    try {
      const rawCustom = localStorage.getItem(STORAGE_KEY_PRACAS_CUSTOM);
      if (rawCustom) {
        const existentes: AdminPracaOperacao[] = JSON.parse(rawCustom);
        const filtradas = existentes.filter((p) => p.id !== id);
        localStorage.setItem(STORAGE_KEY_PRACAS_CUSTOM, JSON.stringify(filtradas));
      }

      // Se a praça removida era a ativa, volta para "todas"
      if (getPracaAtivaId() === id) {
        setPracaAtiva("todas");
      }

      window.dispatchEvent(new CustomEvent("partiu:pracas-list-updated"));
      return true;
    } catch (e) {
      console.warn("[AdminCityService] Erro ao remover praça:", e);
    }
  }

  return false;
}

/**
 * Alterna rapidamente o status da praça entre ATIVA e PAUSADA
 */
export function alternarStatusPraca(id: string): AdminPracaOperacao | null {
  if (id === "todas") return null;

  const pracas = carregarPracasDisponiveis();
  const alvo = pracas.find((p) => p.id === id);
  if (!alvo) return null;

  const novoStatus = alvo.status === "ATIVA" ? "PAUSADA" : "ATIVA";
  const atualizada: AdminPracaOperacao = { ...alvo, status: novoStatus };
  return atualizarPraca(atualizada);
}

/**
 * Exporta a lista de praças em formato CSV para auditoria e relatórios
 */
export function exportarPracasCSV(): void {
  const pracas = carregarPracasDisponiveis().filter((p) => p.id !== "todas");
  const headers = ["ID", "Nome da Cidade", "UF", "Status", "Latitude", "Longitude", "Raio de Atendimento (km)"];
  const rows = pracas.map((p) => [
    p.id,
    `"${p.nome}"`,
    p.uf,
    p.status,
    p.lat.toFixed(6),
    p.lng.toFixed(6),
    p.raioKm,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `pracas_operacao_partiu_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

