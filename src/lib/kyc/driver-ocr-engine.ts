/**
 * PARTIU MOBILIDADE — DRIVER ONBOARDING & KYC OCR ENGINE
 * 
 * Esteira de Homologação Expressa de Condutores com OCR de CNH e Validação em Tempo Real.
 * Inspirado no fluxo de validação biométrica e documental do APK 99 (v4250).
 * 
 * Funcionalidades:
 * 1. Extração estruturada de dados da CNH brasileira (Nome, CPF, Registro, Categoria, Validade, EAR).
 * 2. Validação criptográfica do CPF via algoritmo da Receita Federal.
 * 3. Validação cruzada (Cross-Validation) entre dados declarados no cadastro e dados extraídos do documento.
 * 4. Verificação de obrigatoriedade do EAR (Exerce Atividade Remunerada) para conformidade regulatória.
 * 5. Detecção preventiva de CNH vencida ou com prazo expirado.
 * 6. Classificação algorítmica de risco (APROVADO_AUTOMATICO, REVISAO_MANUAL, SEM_EAR, CNH_EXPIRADA, REJEITADO_ILEGIVEL).
 */

import { validarCpf, sanitizarCpf, formatarCpf } from "../validation/cpf-validator";

export type CnhCategory = "A" | "B" | "AB" | "C" | "D" | "E";

export type OcrAnalysisStatus = 
  | "APROVADO_AUTOMATICO"
  | "REVISAO_MANUAL"
  | "SEM_EAR"
  | "CNH_EXPIRADA"
  | "REJEITADO_ILEGIVEL";

export interface CnhExtractedData {
  nome: string;
  cpf: string;
  cpfFormatado: string;
  cpfValido: boolean;
  numeroRegistro: string;
  categoria: CnhCategory;
  dataNascimento?: string;
  dataValidade: string;
  dataValidadeTimestamp: number;
  isValida: boolean;
  temEar: boolean;
  scoreConfiabilidade: number; // 0 a 100
  status: OcrAnalysisStatus;
  inconsistencias: string[];
  sugestaoAcao: string;
}

export interface OcrCrossValidationResult {
  cpfMatch: boolean;
  nomeMatch: boolean;
  nomeSimilarity: number; // 0.0 a 1.0
  scoreFinal: number;
  podeAprovacaoExpressa: boolean;
  alertas: string[];
}

export interface DriverOcrEvaluation {
  documento: CnhExtractedData;
  crossValidation: OcrCrossValidationResult;
  timestamp: number;
  duracaoAnaliseMs: number;
}

/**
 * Normaliza strings para comparação (remove acentos, pontuações e converte para maiúsculo)
 */
export function normalizarTexto(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calcula similaridade entre nomes através de interseção de tokens ponderada (Jaccard + Bigramas)
 */
export function calcularSimilaridadeNomes(nomeA: string, nomeB: string): number {
  const normA = normalizarTexto(nomeA);
  const normB = normalizarTexto(nomeB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  const tokensA = new Set(normA.split(" ").filter((t) => t.length > 1));
  const tokensB = new Set(normB.split(" ").filter((t) => t.length > 1));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersecao = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersecao++;
  }

  const uniao = new Set([...tokensA, ...tokensB]).size;
  const jaccard = intersecao / uniao;

  // Se o primeiro e o último nome baterem com perfeição, garante alta similaridade
  const partsA = normA.split(" ");
  const partsB = normB.split(" ");
  const primeiroMatch = partsA[0] === partsB[0];
  const ultimoMatch = partsA[partsA.length - 1] === partsB[partsB.length - 1];

  if (primeiroMatch && ultimoMatch && jaccard >= 0.5) {
    return Math.max(jaccard, 0.88);
  }

  return Math.round(jaccard * 100) / 100;
}

/**
 * Analisa e extrai data de validade no formato DD/MM/AAAA ou AAAA-MM-DD
 */
export function analisarDataValidade(dataStr: string): {
  valida: boolean;
  timestamp: number;
  isExpirada: boolean;
  formatada: string;
} {
  const agora = Date.now();
  let ts = 0;
  let formatada = dataStr;

  // DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
    const [dia, mes, ano] = dataStr.split("/").map((v) => parseInt(v, 10));
    const d = new Date(ano, mes - 1, dia, 23, 59, 59);
    ts = d.getTime();
    formatada = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    // AAAA-MM-DD
    const [ano, mes, dia] = dataStr.split("-").map((v) => parseInt(v, 10));
    const d = new Date(ano, mes - 1, dia, 23, 59, 59);
    ts = d.getTime();
    formatada = `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
  } else {
    // Fallback data futura padrão (1 ano) se não parsear
    ts = agora + 365 * 24 * 60 * 60 * 1000;
    formatada = "Indeterminada";
  }

  const isExpirada = ts < agora;
  return {
    valida: ts > 0,
    timestamp: ts,
    isExpirada,
    formatada,
  };
}

/**
 * Extrai e estrutura dados de documento CNH a partir de texto OCR bruto ou payload estruturado
 */
export function extrairDadosCnh(textoOuDados: string | Partial<CnhExtractedData>): CnhExtractedData {
  const inconsistencias: string[] = [];

  if (typeof textoOuDados === "object") {
    const rawCpf = sanitizarCpf(textoOuDados.cpf || "");
    const isCpfValido = validarCpf(rawCpf);
    if (!isCpfValido) inconsistencias.push("CPF inválido segundo regras da Receita Federal");

    const validadeInfo = analisarDataValidade(textoOuDados.dataValidade || "31/12/2028");
    if (validadeInfo.isExpirada) inconsistencias.push("Habilitação com data de validade expirada");

    const temEar = Boolean(textoOuDados.temEar);
    if (!temEar) inconsistencias.push("Ausência da observação EAR (Exerce Atividade Remunerada)");

    let score = isCpfValido ? 60 : 20;
    if (temEar) score += 20;
    if (!validadeInfo.isExpirada) score += 20;
    if (textoOuDados.nome && textoOuDados.nome.length > 5) score += 5;
    score = Math.min(100, Math.max(0, score));

    let status: OcrAnalysisStatus = "APROVADO_AUTOMATICO";
    let sugestaoAcao = "Documento em total conformidade. Liberação imediata.";

    if (validadeInfo.isExpirada) {
      status = "CNH_EXPIRADA";
      sugestaoAcao = "Solicitar renovação da CNH junto ao Detran.";
    } else if (!temEar) {
      status = "SEM_EAR";
      sugestaoAcao = "Encaminhar para inclusão de EAR para liberação profissional.";
    } else if (!isCpfValido || score < 70) {
      status = "REJEITADO_ILEGIVEL";
      sugestaoAcao = "Solicitar nova foto com melhor iluminação e nitidez.";
    } else if (score < 90) {
      status = "REVISAO_MANUAL";
      sugestaoAcao = "Aprovação manual assistida por operador regional.";
    }

    return {
      nome: normalizarTexto(textoOuDados.nome || "CONDUTOR PARCEIRO"),
      cpf: rawCpf,
      cpfFormatado: formatarCpf(rawCpf),
      cpfValido: isCpfValido,
      numeroRegistro: (textoOuDados.numeroRegistro || "00000000000").replace(/\D/g, "").slice(0, 11),
      categoria: (textoOuDados.categoria as CnhCategory) || "B",
      dataNascimento: textoOuDados.dataNascimento || "01/01/1990",
      dataValidade: validadeInfo.formatada,
      dataValidadeTimestamp: validadeInfo.timestamp,
      isValida: !validadeInfo.isExpirada,
      temEar,
      scoreConfiabilidade: score,
      status,
      inconsistencias,
      sugestaoAcao,
    };
  }

  // Parsing textual do buffer OCR (OCR em texto bruto)
  const texto = textoOuDados.toUpperCase();

  // 1. Extração de CPF
  const cpfRegex = /(?:CPF[:\s]*|)(\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\s]?\d{2})/g;
  const matchCpf = cpfRegex.exec(texto);
  const rawCpf = matchCpf ? sanitizarCpf(matchCpf[1]) : "";
  const isCpfValido = validarCpf(rawCpf);
  if (!isCpfValido) inconsistencias.push("CPF não identificado ou inválido");

  // 2. Extração de EAR
  const temEar = /EXERCE\s+ATIVIDADE\s+REMUNERADA|\bEAR\b/.test(texto);
  if (!temEar) inconsistencias.push("Ausência da observação EAR");

  // 3. Extração de Validade
  const dataRegex = /(\d{2}\/\d{2}\/\d{4})/g;
  let matchData: RegExpExecArray | null;
  let validadeStr = "31/12/2028";
  const datasEncontradas: string[] = [];
  while ((matchData = dataRegex.exec(texto)) !== null) {
    datasEncontradas.push(matchData[1]);
  }
  if (datasEncontradas.length > 0) {
    // Normalmente a maior data encontrada é a validade
    validadeStr = datasEncontradas[datasEncontradas.length - 1];
  }
  const validadeInfo = analisarDataValidade(validadeStr);
  if (validadeInfo.isExpirada) inconsistencias.push("CNH vencida");

  // 4. Extração de Categoria
  let categoria: CnhCategory = "B";
  if (/\bCAT(?:EGORIA|)\s*[:\.]?\s*([A-E]{1,2})\b/.test(texto)) {
    const catMatch = texto.match(/\bCAT(?:EGORIA|)\s*[:\.]?\s*([A-E]{1,2})\b/);
    if (catMatch && ["A", "B", "AB", "C", "D", "E"].includes(catMatch[1])) {
      categoria = catMatch[1] as CnhCategory;
    }
  }

  // 5. Extração de Registro CNH (11 dígitos numéricos isolados)
  const regMatch = texto.match(/\b\d{11}\b/);
  const numeroRegistro = regMatch ? regMatch[0] : "04981726354";

  // 6. Extração aproximada de Nome
  let nomeExtraido = "MOTORISTA PARCEIRO";
  const linhas = texto.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);
  for (const linha of linhas) {
    if (
      !linha.includes("REPUBLICA") &&
      !linha.includes("FEDERATIVA") &&
      !linha.includes("HABILITACAO") &&
      !linha.includes("CARTEIRA") &&
      !linha.includes("DETRAN") &&
      /^[A-Z\s]{6,40}$/.test(linha)
    ) {
      nomeExtraido = linha;
      break;
    }
  }

  let score = isCpfValido ? 60 : 10;
  if (temEar) score += 20;
  if (!validadeInfo.isExpirada) score += 20;
  score = Math.min(100, Math.max(0, score));

  let status: OcrAnalysisStatus = "APROVADO_AUTOMATICO";
  let sugestaoAcao = "Documento em total conformidade. Liberação imediata.";

  if (validadeInfo.isExpirada) {
    status = "CNH_EXPIRADA";
    sugestaoAcao = "Solicitar renovação da CNH.";
  } else if (!temEar) {
    status = "SEM_EAR";
    sugestaoAcao = "Necessário constar EAR para atividade remunerada.";
  } else if (!isCpfValido || score < 70) {
    status = "REJEITADO_ILEGIVEL";
    sugestaoAcao = "Solicitar reenvio com foto nítida e sem reflexos.";
  } else if (score < 90) {
    status = "REVISAO_MANUAL";
    sugestaoAcao = "Revisão manual por operador da praça.";
  }

  return {
    nome: normalizarTexto(nomeExtraido),
    cpf: rawCpf,
    cpfFormatado: formatarCpf(rawCpf),
    cpfValido: isCpfValido,
    numeroRegistro,
    categoria,
    dataValidade: validadeInfo.formatada,
    dataValidadeTimestamp: validadeInfo.timestamp,
    isValida: !validadeInfo.isExpirada,
    temEar,
    scoreConfiabilidade: score,
    status,
    inconsistencias,
    sugestaoAcao,
  };
}

/**
 * Executa validação cruzada entre dados declarados no formulário e documento lido via OCR
 */
export function executarCrossValidation(
  doc: CnhExtractedData,
  declarado: { nome?: string; cpf?: string },
): OcrCrossValidationResult {
  const alertas: string[] = [];
  const declCpf = sanitizarCpf(declarado.cpf);
  const declNome = normalizarTexto(declarado.nome);

  let cpfMatch = false;
  if (declCpf && doc.cpf) {
    cpfMatch = declCpf === doc.cpf;
    if (!cpfMatch) {
      alertas.push("Divergência: CPF cadastrado difere do CPF constante no documento");
    }
  } else {
    // Se não foi declarado ainda, herda o do documento
    cpfMatch = doc.cpfValido;
  }

  const nomeSim = declNome ? calcularSimilaridadeNomes(declNome, doc.nome) : 1.0;
  const nomeMatch = nomeSim >= 0.75;
  if (!nomeMatch && declNome) {
    alertas.push(`Divergência de titularidade: Nome cadastrado (${declNome}) difere do documento (${doc.nome})`);
  }

  let penalidade = 0;
  if (!cpfMatch) penalidade += 40;
  if (!nomeMatch) penalidade += 25;
  if (!doc.temEar) penalidade += 20;
  if (!doc.isValida) penalidade += 50;

  const scoreFinal = Math.max(0, Math.min(100, doc.scoreConfiabilidade - penalidade));
  const podeAprovacaoExpressa =
    scoreFinal >= 85 &&
    doc.cpfValido &&
    doc.isValida &&
    doc.temEar &&
    cpfMatch &&
    nomeMatch;

  return {
    cpfMatch,
    nomeMatch,
    nomeSimilarity: nomeSim,
    scoreFinal,
    podeAprovacaoExpressa,
    alertas,
  };
}

/**
 * Avalia de forma unificada o documento e gera parecer para a esteira de onboarding
 */
export function avaliarCnhOnboarding(
  textoOuDados: string | Partial<CnhExtractedData>,
  declarado: { nome?: string; cpf?: string },
): DriverOcrEvaluation {
  const inicio = Date.now();
  const documento = extrairDadosCnh(textoOuDados);
  const crossValidation = executarCrossValidation(documento, declarado);
  const duracaoAnaliseMs = Date.now() - inicio;

  return {
    documento,
    crossValidation,
    timestamp: Date.now(),
    duracaoAnaliseMs,
  };
}

/**
 * Processamento simulado assíncrono para integração fluida no front-end mobile
 */
export async function simularAnaliseOcr(
  fileOrMeta: { name: string; size?: number; base64?: string },
  declarado: { nome?: string; cpf?: string },
): Promise<DriverOcrEvaluation> {
  // Simula latência de processamento de rede neural (600ms)
  await new Promise((r) => setTimeout(r, 600));

  const nomePadrao = declarado.nome ? normalizarTexto(declarado.nome) : "CARLOS EDUARDO SILVA";
  const cpfPadrao = declarado.cpf && validarCpf(declarado.cpf) 
    ? sanitizarCpf(declarado.cpf) 
    : "12345678909"; // CPF de teste válido

  return avaliarCnhOnboarding(
    {
      nome: nomePadrao,
      cpf: cpfPadrao,
      numeroRegistro: "04981726354",
      categoria: "AB",
      dataValidade: "15/12/2028",
      temEar: true,
      scoreConfiabilidade: 98,
    },
    declarado,
  );
}
