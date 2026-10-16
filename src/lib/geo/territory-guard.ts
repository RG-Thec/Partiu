/**
 * ==============================================================================
 * 🛡️ PARTIU TERRITORY GUARD & FRANCHISE EXCLUSIVITY ENGINE (v4.5)
 * ==============================================================================
 * Motor de Exclusividade e Prioridade Territorial por Franquia.
 *
 * REGRAS DE NEGÓCIO E GOVERNANÇA:
 * 1. A Franquia Mãe (Matriz Nacional / tenantId === "default") possui licença
 *    irrestrita para atuar em todo o território nacional (100% do Brasil).
 * 2. Cada Franquia Regional possui exclusividade garantida em sua cidade-sede
 *    e raio geográfico delimitado (Geofence Haversine / Cidades Licenciadas).
 * 3. Aplicativos vizinhos NÃO invadem nem canibalizam frotas de outras cidades.
 * 4. Um franqueado pode expandir sua área comprando o direito de expansão para
 *    cidades e municípios vizinhos (cidadesLicenciadas adicionais).
 * ==============================================================================
 */

import {
  type TerritorioExclusivoConfig,
  type WhiteLabelTenantRecord,
  type ModoExclusividadeTerritorial,
} from "@/lib/white-label/white-label-types";
import { resolverCidadeBrasil } from "./brazil-cities";

export interface ValidacaoTerritorialResult {
  permitido: boolean;
  isMatriz: boolean;
  motivo?:
    | "DENTRO_DO_RAIO"
    | "CIDADE_LICENCIADA"
    | "MATRIZ_NACIONAL"
    | "FORA_DO_PERIMETRO"
    | "CIDADE_VIZINHA_BLOQUEADA"
    | string;
  distanciaDoCentroKm: number;
  distanciaKm: number; // alias conveniente
  raioMaximoKm: number;
  cidadeBase: string;
  cidadesLicenciadas: string[];
  franquiaCompetente?: {
    tenantId: string;
    nomeOperacao: string;
    cidadeNome: string;
  };
  mensagem: string;
  modo?: ModoExclusividadeTerritorial;
}

/**
 * Calcula a distância geodésica em quilômetros entre dois pontos (fórmula Haversine)
 */
export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export const calcularDistanciaHaversineKm = calcularDistanciaKm;

/**
 * Cria ou inicializa uma configuração de território exclusivo canônica.
 * Suporta chamada posicional ou via objeto de opções.
 */
export function criarTerritorioPadrao(
  cidadeOuOpcoes:
    | string
    | {
        cidadeNome: string;
        estadoUf: string;
        lat?: number;
        lng?: number;
        raioKm?: number;
        isMatriz?: boolean;
      },
  ufOuMatriz?: string | boolean,
  isMatrizParam = false,
  raioPersonalizadoKm?: number
): TerritorioExclusivoConfig {
  let cidadeNome: string;
  let uf: string;
  let isMatriz = false;
  let raioFinal: number | undefined;
  let customLat: number | undefined;
  let customLng: number | undefined;

  if (typeof cidadeOuOpcoes === "object") {
    cidadeNome = cidadeOuOpcoes.cidadeNome;
    uf = cidadeOuOpcoes.estadoUf;
    isMatriz = Boolean(cidadeOuOpcoes.isMatriz);
    raioFinal = cidadeOuOpcoes.raioKm;
    customLat = cidadeOuOpcoes.lat;
    customLng = cidadeOuOpcoes.lng;
  } else {
    cidadeNome = cidadeOuOpcoes;
    uf = typeof ufOuMatriz === "string" ? ufOuMatriz : "DF";
    isMatriz = typeof ufOuMatriz === "boolean" ? ufOuMatriz : isMatrizParam;
    raioFinal = raioPersonalizadoKm;
  }

  const geoResolvido = resolverCidadeBrasil(cidadeNome, uf);
  const latFinal = customLat ?? geoResolvido.lat;
  const lngFinal = customLng ?? geoResolvido.lng;
  const raioDefinitivo = raioFinal ?? (geoResolvido.raioSugeridoKm || 20);

  if (isMatriz) {
    return {
      modo: "NACIONAL_IRRESTRITO",
      isMatrizNacional: true,
      cidadeBase: cidadeNome || "Brasília",
      cidadeSede: cidadeNome || "Brasília",
      estadoUf: uf || "DF",
      coordenadasCentroLat: latFinal,
      latCentro: latFinal,
      coordenadasCentroLng: lngFinal,
      lngCentro: lngFinal,
      raioOperacaoPadraoKm: 100,
      raioMaximoKm: 9999, // Cobertura total Brasil
      cidadesLicenciadas: ["*"], // Todas as cidades
      bloquearChamadasForaTerritorio: false,
      bloquearNovasContasForaTerritorio: false,
      bloquearDespachoFrotaVizinha: false,
      permiteExpansao: true,
      permitirExpansaoPaga: true,
      cidadesExpansaoContratadas: 999,
      valorExpansaoPorCidadeBrl: 0,
      notasExclusividade: "Franquia Matriz Nacional: atuação irrestrita em 100% do território nacional brasileiro.",
      mensagemBloqueioForaArea: undefined,
    };
  }

  return {
    modo: "CIDADE_ESTRITA",
    isMatrizNacional: false,
    cidadeBase: cidadeNome,
    cidadeSede: cidadeNome,
    estadoUf: uf,
    coordenadasCentroLat: latFinal,
    latCentro: latFinal,
    coordenadasCentroLng: lngFinal,
    lngCentro: lngFinal,
    raioOperacaoPadraoKm: raioDefinitivo,
    raioMaximoKm: raioDefinitivo,
    cidadesLicenciadas: [cidadeNome],
    bloquearChamadasForaTerritorio: true,
    bloquearNovasContasForaTerritorio: true,
    bloquearDespachoFrotaVizinha: true,
    permiteExpansao: true,
    permitirExpansaoPaga: true,
    cidadesExpansaoContratadas: 0,
    valorExpansaoPorCidadeBrl: 1500,
    notasExclusividade: `Praça exclusiva outorgada para ${cidadeNome}/${uf} com raio de ${raioDefinitivo}km.`,
    mensagemBloqueioForaArea: `A franquia atua com exclusividade em ${cidadeNome} e região licenciada.`,
  };
}

/**
 * Validador oficial de território para solicitação de corridas e despacho de frotas
 */
export function validarAcessoTerritorial(
  tenant: WhiteLabelTenantRecord | undefined | null,
  lat: number,
  lng: number,
  cidadePassageiro?: string,
  todosTenantsAtivos: WhiteLabelTenantRecord[] = []
): ValidacaoTerritorialResult {
  // 1. Matriz Nacional (tenantId === 'default' ou isMatrizNacional === true ou modo === 'NACIONAL_IRRESTRITO')
  if (
    !tenant ||
    tenant.tenantId === "default" ||
    tenant.isMatrizNacional === true ||
    tenant.territorio?.isMatrizNacional ||
    tenant.territorio?.modo === "NACIONAL_IRRESTRITO"
  ) {
    return {
      permitido: true,
      isMatriz: true,
      motivo: "MATRIZ_NACIONAL",
      distanciaDoCentroKm: 0,
      distanciaKm: 0,
      raioMaximoKm: 9999,
      cidadeBase: tenant?.cidadeNome || "Nacional",
      cidadesLicenciadas: ["*"],
      mensagem: "Cobertura irrestrita em território nacional (Matriz).",
      modo: "NACIONAL_IRRESTRITO",
    };
  }

  const territorio =
    tenant.territorio ||
    tenant.configuracaoCompleta?.geo?.territorio ||
    criarTerritorioPadrao(
      tenant.cidadeNome,
      tenant.uf,
      false,
      tenant.configuracaoCompleta?.geo?.raioOperacaoPadraoKm
    );

  const centroLat =
    territorio.latCentro ??
    territorio.coordenadasCentroLat ??
    tenant.configuracaoCompleta?.geo?.coordenadasCentroLat ??
    -15.7975;
  const centroLng =
    territorio.lngCentro ??
    territorio.coordenadasCentroLng ??
    tenant.configuracaoCompleta?.geo?.coordenadasCentroLng ??
    -47.8919;
  const raioMaximo =
    territorio.raioMaximoKm ||
    territorio.raioOperacaoPadraoKm ||
    tenant.configuracaoCompleta?.geo?.raioOperacaoPadraoKm ||
    20;

  const distanciaKm = calcularDistanciaKm(centroLat, centroLng, lat, lng);

  // 2. Verificação se a cidade solicitada é uma das cidades expressamente licenciadas
  const cidadeNormalizada = cidadePassageiro?.toLowerCase().trim();
  const cidadeLicenciadaMatch = cidadeNormalizada
    ? (territorio.cidadesLicenciadas || []).some((c) => c.toLowerCase().trim() === cidadeNormalizada)
    : false;

  // 3. Regra de Autorização: Ponto dentro do raio ou cidade expressamente autorizada
  if (distanciaKm <= raioMaximo || cidadeLicenciadaMatch) {
    return {
      permitido: true,
      isMatriz: false,
      motivo: cidadeLicenciadaMatch ? "CIDADE_LICENCIADA" : "DENTRO_DO_RAIO",
      distanciaDoCentroKm: distanciaKm,
      distanciaKm,
      raioMaximoKm: raioMaximo,
      cidadeBase: territorio.cidadeBase || tenant.cidadeNome,
      cidadesLicenciadas: territorio.cidadesLicenciadas || [tenant.cidadeNome],
      mensagem: `Localização permitida dentro da praça de ${territorio.cidadeBase || tenant.cidadeNome} (${distanciaKm} km do centro).`,
      modo: territorio.modo,
    };
  }

  // 4. Bloqueio Territorial: Se a flag de bloqueio estiver ativa
  if (territorio.bloquearChamadasForaTerritorio) {
    // Procura se alguma franquia vizinha atende este ponto
    let franquiaVizinha: WhiteLabelTenantRecord | undefined;
    for (const outro of todosTenantsAtivos) {
      if (outro.tenantId === tenant.tenantId || outro.tenantId === "default") continue;
      const outroLat =
        outro.territorio?.latCentro ??
        outro.territorio?.coordenadasCentroLat ??
        outro.configuracaoCompleta?.geo?.coordenadasCentroLat;
      const outroLng =
        outro.territorio?.lngCentro ??
        outro.territorio?.coordenadasCentroLng ??
        outro.configuracaoCompleta?.geo?.coordenadasCentroLng;
      const outroRaio =
        outro.territorio?.raioMaximoKm ??
        outro.territorio?.raioOperacaoPadraoKm ??
        outro.configuracaoCompleta?.geo?.raioOperacaoPadraoKm ??
        20;

      if (outroLat !== undefined && outroLng !== undefined) {
        const distOutro = calcularDistanciaKm(outroLat, outroLng, lat, lng);
        if (distOutro <= outroRaio) {
          franquiaVizinha = outro;
          break;
        }
      }
    }

    const mensagemCustomizada = franquiaVizinha
      ? `A sua solicitação está localizada na praça exclusiva de ${franquiaVizinha.cidadeNome} (${franquiaVizinha.nomeOperacao}). Para pedir corrida nesta região, acerte a praça correspondente.`
      : `O aplicativo ${tenant.nomeOperacao} opera com exclusividade em ${territorio.cidadeBase || tenant.cidadeNome} (raio de ${raioMaximo} km). O ponto selecionado está a ${distanciaKm} km do centro e fora do perímetro de atendimento.`;

    return {
      permitido: false,
      isMatriz: false,
      motivo: franquiaVizinha ? "CIDADE_VIZINHA_BLOQUEADA" : "FORA_DO_PERIMETRO",
      distanciaDoCentroKm: distanciaKm,
      distanciaKm,
      raioMaximoKm: raioMaximo,
      cidadeBase: territorio.cidadeBase || tenant.cidadeNome,
      cidadesLicenciadas: territorio.cidadesLicenciadas || [tenant.cidadeNome],
      franquiaCompetente: franquiaVizinha
        ? {
            tenantId: franquiaVizinha.tenantId,
            nomeOperacao: franquiaVizinha.nomeOperacao,
            cidadeNome: franquiaVizinha.cidadeNome,
          }
        : undefined,
      mensagem: mensagemCustomizada,
      modo: territorio.modo,
    };
  }

  // Se não estiver com bloqueio estrito ativo
  return {
    permitido: true,
    isMatriz: false,
    motivo: "DENTRO_DO_RAIO",
    distanciaDoCentroKm: distanciaKm,
    distanciaKm,
    raioMaximoKm: raioMaximo,
    cidadeBase: territorio.cidadeBase || tenant.cidadeNome,
    cidadesLicenciadas: territorio.cidadesLicenciadas || [tenant.cidadeNome],
    mensagem: `Operação fora do raio padrão (${distanciaKm} km), autorizada por política flexível.`,
    modo: territorio.modo,
  };
}

export interface ValidacaoCadastroTerritorialResult {
  permitido: boolean;
  isMatriz: boolean;
  motivo?:
    | "MATRIZ_NACIONAL"
    | "DENTRO_DO_RAIO"
    | "CIDADE_LICENCIADA"
    | "CADASTRO_FORA_DA_PRACA"
    | "CIDADE_NAO_LICENCIADA"
    | string;
  cidadeBase: string;
  cidadesLicenciadas: string[];
  distanciaKm?: number;
  raioMaximoKm?: number;
  mensagem: string;
}

/**
 * Validador oficial de território para cadastro de novos passageiros e motoristas.
 * Impede a criação de contas para franquias regionais fora de sua praça autorizada.
 */
export function validarAcessoTerritorialParaCadastro(
  tenant: WhiteLabelTenantRecord | undefined | null,
  coords?: { lat: number; lng: number } | null,
  cidadeUsuario?: string | null,
  todosTenantsAtivos: WhiteLabelTenantRecord[] = []
): ValidacaoCadastroTerritorialResult {
  // 1. Matriz Nacional (tenantId === 'default' ou isMatrizNacional === true ou modo === 'NACIONAL_IRRESTRITO')
  if (
    !tenant ||
    tenant.tenantId === "default" ||
    tenant.isMatrizNacional === true ||
    tenant.territorio?.isMatrizNacional ||
    tenant.territorio?.modo === "NACIONAL_IRRESTRITO"
  ) {
    return {
      permitido: true,
      isMatriz: true,
      motivo: "MATRIZ_NACIONAL",
      cidadeBase: tenant?.cidadeNome || "Nacional",
      cidadesLicenciadas: ["*"],
      mensagem: "Cadastro permitido em todo o território nacional.",
    };
  }

  const territorio =
    tenant.territorio ||
    tenant.configuracaoCompleta?.geo?.territorio ||
    criarTerritorioPadrao(
      tenant.cidadeNome,
      tenant.uf,
      false,
      tenant.configuracaoCompleta?.geo?.raioOperacaoPadraoKm
    );

  const deveBloquear =
    territorio.bloquearNovasContasForaTerritorio ??
    territorio.bloquearChamadasForaTerritorio ??
    true;

  const cidadeBase = territorio.cidadeBase || tenant.cidadeNome;
  const cidadesLicenciadas = territorio.cidadesLicenciadas || [cidadeBase];
  const raioMaximo =
    territorio.raioMaximoKm ||
    territorio.raioOperacaoPadraoKm ||
    tenant.configuracaoCompleta?.geo?.raioOperacaoPadraoKm ||
    25;

  // Se a franquia configurada pelo super admin não restringir novos cadastros
  if (!deveBloquear) {
    return {
      permitido: true,
      isMatriz: false,
      motivo: "DENTRO_DO_RAIO",
      cidadeBase,
      cidadesLicenciadas,
      raioMaximoKm: raioMaximo,
      mensagem: "Cadastro permitido pela política da praça.",
    };
  }

  // 2. Se a cidade informada pelo usuário for passada
  if (cidadeUsuario && cidadeUsuario.trim()) {
    const cidNorm = cidadeUsuario.trim().toLowerCase();
    const match =
      cidadesLicenciadas.some((c) => c.trim().toLowerCase() === cidNorm) ||
      cidNorm === cidadeBase.trim().toLowerCase();

    if (match) {
      return {
        permitido: true,
        isMatriz: false,
        motivo: "CIDADE_LICENCIADA",
        cidadeBase,
        cidadesLicenciadas,
        raioMaximoKm: raioMaximo,
        mensagem: `Cadastro autorizado na cidade de ${cidadeUsuario}.`,
      };
    }
  }

  // 3. Se as coordenadas geográficas foram capturadas
  if (
    coords &&
    typeof coords.lat === "number" &&
    typeof coords.lng === "number" &&
    !isNaN(coords.lat) &&
    !isNaN(coords.lng)
  ) {
    const centroLat =
      territorio.latCentro ??
      territorio.coordenadasCentroLat ??
      tenant.configuracaoCompleta?.geo?.coordenadasCentroLat ??
      -15.7975;
    const centroLng =
      territorio.lngCentro ??
      territorio.coordenadasCentroLng ??
      tenant.configuracaoCompleta?.geo?.coordenadasCentroLng ??
      -47.8919;

    const distanciaKm = calcularDistanciaKm(centroLat, centroLng, coords.lat, coords.lng);

    if (distanciaKm <= raioMaximo) {
      return {
        permitido: true,
        isMatriz: false,
        motivo: "DENTRO_DO_RAIO",
        distanciaKm,
        raioMaximoKm: raioMaximo,
        cidadeBase,
        cidadesLicenciadas,
        mensagem: `Localização permitida dentro da praça de ${cidadeBase} (${distanciaKm} km do centro).`,
      };
    }

    // Coordenadas fora do raio da franquia
    return {
      permitido: false,
      isMatriz: false,
      motivo: "CADASTRO_FORA_DA_PRACA",
      distanciaKm,
      raioMaximoKm: raioMaximo,
      cidadeBase,
      cidadesLicenciadas,
      mensagem: `A franquia ${tenant.nomeOperacao} atua exclusivamente em ${cidadeBase} e região autorizada (raio de ${raioMaximo} km). Sua localização atual está a ${distanciaKm} km e fora da área de cobertura desta praça.`,
    };
  }

  // 4. Se a cidade foi informada e não deu match nas cidades licenciadas
  if (cidadeUsuario && cidadeUsuario.trim()) {
    return {
      permitido: false,
      isMatriz: false,
      motivo: "CIDADE_NAO_LICENCIADA",
      cidadeBase,
      cidadesLicenciadas,
      mensagem: `A franquia ${tenant.nomeOperacao} aceita novos usuários exclusivamente em ${cidadeBase} e cidades licenciadas (${cidadesLicenciadas.join(", ")}).`,
    };
  }

  // 5. Se nenhuma localização foi fornecida e não há cidade informada, permite
  return {
    permitido: true,
    isMatriz: false,
    motivo: "DENTRO_DO_RAIO",
    cidadeBase,
    cidadesLicenciadas,
    raioMaximoKm: raioMaximo,
    mensagem: "Localização não restrita.",
  };
}
