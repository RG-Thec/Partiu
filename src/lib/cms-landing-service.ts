/**
 * 🌐 CMS DA LANDING PAGE INSTITUCIONAL & MARKETING
 * Serviço unificado para gestão dinâmica de conteúdo público do PARTIU:
 * Hero, Benefícios, Seção Passageiro, Seção Motorista, B2B, Prova Social e CTAs.
 */

import {
  type MobilityLandingPageData,
  type HeroConfig,
  type HeaderConfig,
  type ActionItem,
  type FeatureItem,
  type ReasonSectionConfig,
} from "@/types/mobilityLanding";
import {
  getStoredLandingPageData,
  saveStoredLandingPageData,
  resetStoredLandingPageData,
} from "@/lib/branding/landing-page-store";

export interface DepoimentoLanding {
  id: string;
  nome: string;
  papel: "Passageiro" | "Passageira" | "Motorista Parceiro" | "Empresa Conveniada";
  fotoUrl: string;
  cidade: string;
  avaliacao: number; // 1 a 5 estrelas
  comentario: string;
}

export interface MetricaSocialLanding {
  id: string;
  valor: string; // Ex: "+150.000"
  rotulo: string; // Ex: "Corridas Realizadas"
  subrotulo?: string;
}

export interface CmsLandingExtendedData extends MobilityLandingPageData {
  b2bSection?: {
    titulo: string;
    subtitulo: string;
    descricao: string;
    ctaTexto: string;
    ctaUrl: string;
    beneficios: string[];
  };
  socialProof?: {
    metricas: MetricaSocialLanding[];
    depoimentos: DepoimentoLanding[];
  };
}

const STORAGE_KEY_EXTENDED_CMS = "partiu_cms_landing_extended_v1";

export const DEFAULT_DEPOIMENTOS: DepoimentoLanding[] = [
  {
    id: "dep-1",
    nome: "Carolina Mendes",
    papel: "Passageira",
    fotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    cidade: "Itaperuna - RJ",
    avaliacao: 5,
    comentario: "Uso o Partiu todos os dias para ir ao trabalho. Os carros chegam em menos de 3 minutos e o preço é sempre justo, sem surpresas abusivas.",
  },
  {
    id: "dep-2",
    nome: "Rogério Antunes",
    papel: "Motorista Parceiro",
    fotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    cidade: "Campos dos Goytacazes - RJ",
    avaliacao: 5,
    comentario: "O modelo de diária sem taxa abusiva de 30% mudou minha renda mensal. No fim do dia, o dinheiro das corridas é 100% meu na hora.",
  },
  {
    id: "dep-3",
    nome: "Beatriz Nogueira",
    papel: "Empresa Conveniada",
    fotoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    cidade: "Arapiraca - AL",
    avaliacao: 5,
    comentario: "Centralizamos todo o deslocamento dos nossos colaboradores e entregas rápidas no Partiu Empresas. Painel simples e controle total de despesas.",
  },
];

export const DEFAULT_METRICAS_SOCIAIS: MetricaSocialLanding[] = [
  { id: "m-1", valor: "+180.000", rotulo: "Corridas Concluídas", subrotulo: "Em todas as cidades ativas" },
  { id: "m-2", valor: "4.9 ★", rotulo: "Avaliação Média", subrotulo: "Baseada em mais de 45 mil notas" },
  { id: "m-3", valor: "+1.400", rotulo: "Motoristas Ativos", subrotulo: "Carros e motos credenciados" },
  { id: "m-4", valor: "< 3 min", rotulo: "Tempo Médio de Espera", subrotulo: "Embarque ágil e seguro" },
];

export const DEFAULT_B2B_SECTION = {
  titulo: "PARTIU Empresas & Convênios Corporativos",
  subtitulo: "Mobilidade, entregas rápidas e frete inteligente para o seu negócio",
  descricao: "Gerencie o transporte da sua equipe e a logística de encomendas da sua empresa em um único painel, com faturamento quinzenal e relatórios auditáveis.",
  ctaTexto: "Criar Conta Corporativa",
  ctaUrl: "/app/admin/afiliados",
  beneficios: [
    "Faturamento unificado via Pix ou boleto corporativo",
    "Sem mensalidade fixa: pague apenas pelas corridas utilizadas",
    "Rastreamento de trajetos em tempo real com controle de centros de custo",
    "Suporte prioritário 24/7 com equipe dedicada",
  ],
};

let inMemoryExtendedData: CmsLandingExtendedData | null = null;

/**
 * Carrega a configuração completa do CMS da Landing Page
 */
export function carregarCmsLandingData(): CmsLandingExtendedData {
  const baseData = getStoredLandingPageData();

  if (typeof window === "undefined") {
    if (inMemoryExtendedData) return inMemoryExtendedData;
    return {
      ...baseData,
      b2bSection: DEFAULT_B2B_SECTION,
      socialProof: {
        metricas: DEFAULT_METRICAS_SOCIAIS,
        depoimentos: DEFAULT_DEPOIMENTOS,
      },
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXTENDED_CMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...baseData,
        ...parsed,
        b2bSection: parsed.b2bSection || DEFAULT_B2B_SECTION,
        socialProof: {
          metricas: parsed.socialProof?.metricas || DEFAULT_METRICAS_SOCIAIS,
          depoimentos: parsed.socialProof?.depoimentos || DEFAULT_DEPOIMENTOS,
        },
      };
    }
  } catch {}

  const defaultExtended: CmsLandingExtendedData = {
    ...baseData,
    b2bSection: DEFAULT_B2B_SECTION,
    socialProof: {
      metricas: DEFAULT_METRICAS_SOCIAIS,
      depoimentos: DEFAULT_DEPOIMENTOS,
    },
  };
  return defaultExtended;
}

/**
 * Salva a configuração atualizada e notifica os ouvintes da Landing Page
 */
export function salvarCmsLandingData(data: Partial<CmsLandingExtendedData>): CmsLandingExtendedData {
  const atual = carregarCmsLandingData();
  const nova: CmsLandingExtendedData = {
    ...atual,
    ...data,
    hero: { ...atual.hero, ...(data.hero || {}) },
    header: { ...atual.header, ...(data.header || {}) },
    actions: data.actions || atual.actions,
    features: data.features || atual.features,
    reasonSection: { ...atual.reasonSection, ...(data.reasonSection || {}) },
    footer: { ...atual.footer, ...(data.footer || {}) },
    b2bSection: {
      ...DEFAULT_B2B_SECTION,
      ...(atual.b2bSection || {}),
      ...(data.b2bSection || {}),
    },
    socialProof: {
      metricas: data.socialProof?.metricas || atual.socialProof?.metricas || DEFAULT_METRICAS_SOCIAIS,
      depoimentos: data.socialProof?.depoimentos || atual.socialProof?.depoimentos || DEFAULT_DEPOIMENTOS,
    },
  };

  inMemoryExtendedData = nova;

  // Persiste no storage base do landing-page-store
  saveStoredLandingPageData(nova);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY_EXTENDED_CMS, JSON.stringify(nova));
      window.dispatchEvent(
        new CustomEvent("partiu:cms-landing-updated", { detail: { data: nova } })
      );
    } catch (e) {
      console.warn("Erro ao persistir CMS Landing Page:", e);
    }
  }

  return nova;
}

/**
 * Restaura o CMS da Landing Page para os padrões canônicos
 */
export function restaurarCmsLandingPadrao(): CmsLandingExtendedData {
  resetStoredLandingPageData();
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_EXTENDED_CMS);
    } catch {}
  }
  inMemoryExtendedData = null;
  return carregarCmsLandingData();
}
