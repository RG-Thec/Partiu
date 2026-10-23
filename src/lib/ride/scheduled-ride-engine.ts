/**
 * ==============================================================================
 * PARTIU MOBILIDADE — MOTOR DE CORRIDAS AGENDADAS COM NEGOCIAÇÃO BILATERAL
 * ==============================================================================
 * Diretrizes Arquiteturais (docs/ux/vision.md & Caminho a):
 * 1. Modelo Pure SaaS: 0% de comissão retida pela plataforma.
 * 2. Proteção Anti-Leilão Predatório: O lance inicial do passageiro possui um
 *    piso operacional mínimo inegociável baseado nos custos reais da rota
 *    (combustível, tempo e depreciação veicular).
 * 3. Negociação Bilateral Justificada: O motorista parceiro pode aceitar de
 *    imediato a oferta ou submeter contraproposta fundamentada (ex: pedágios,
 *    deslocamento vazio ou horário de pico).
 * 4. Travamento por Mútuo Consentimento com Régua de Lembretes Automáticos:
 *    Alertas automáticos disparados com 24h, 2h e 30m de antecedência para ambas
 *    as partes.
 * ==============================================================================
 */

export type CategoriaAgendamento = "CARRO" | "MOTO" | "PREMIUM";

export type StatusAgendamento =
  | "SOLICITADO"
  | "EM_NEGOCIACAO"
  | "AGENDADO"
  | "INICIADO"
  | "CONCLUIDO"
  | "CANCELADO";

export interface MotoristaAgendado {
  id: string;
  nome: string;
  fotoUrl?: string;
  veiculoModelo?: string;
  veiculoPlaca?: string;
  avaliacao?: number;
  telefone?: string;
}

export interface ContrapropostaMotorista {
  motoristaId: string;
  motoristaNome: string;
  valor: number;
  justificativa: string;
  timestamp: number;
  status: "PENDENTE" | "ACEITA" | "RECUSADA";
}

export interface LembretesStatus {
  notificacao24h: boolean;
  notificacao2h: boolean;
  notificacao30m: boolean;
}

export interface ScheduledRide {
  id: string;
  passageiroId: string;
  passageiroNome: string;
  passageiroTelefone?: string;
  origem: {
    endereco: string;
    lat?: number;
    lng?: number;
  };
  destino: {
    endereco: string;
    lat?: number;
    lng?: number;
  };
  dataAgendada: string; // formato YYYY-MM-DD
  horarioAgendado: string; // formato HH:mm
  timestampAgendado: number; // Unix ms
  categoriaVeiculo: CategoriaAgendamento;
  distanciaKm: number;
  duracaoMin: number;
  tarifaBaseSugerida: number; // BRL
  pisoMinimoCusto: number; // BRL (anti-dumping)
  valorPropostoPassageiro: number; // BRL
  valorFinalAcordado?: number; // BRL
  status: StatusAgendamento;
  motoristaAtribuido?: MotoristaAgendado;
  contrapropostaMotorista?: ContrapropostaMotorista;
  lembretes: LembretesStatus;
  observacoes?: string;
  criadoEm: number;
}

export interface SolicitacaoAgendamentoInput {
  passageiroId?: string;
  passageiroNome?: string;
  passageiroTelefone?: string;
  origem: {
    endereco: string;
    lat?: number;
    lng?: number;
  };
  destino: {
    endereco: string;
    lat?: number;
    lng?: number;
  };
  dataAgendada: string; // YYYY-MM-DD
  horarioAgendado: string; // HH:mm
  categoriaVeiculo?: CategoriaAgendamento;
  distanciaKm?: number;
  duracaoMin?: number;
  valorProposto: number;
  observacoes?: string;
}

const STORAGE_KEY = "partiu_corridas_agendadas";

// Memória em runtime como cache e fallback
let memoriaAgendamentos: ScheduledRide[] = [];

/**
 * Carrega a base persistida de agendamentos
 */
export function carregarAgendamentos(): ScheduledRide[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoriaAgendamentos = JSON.parse(raw);
        return memoriaAgendamentos;
      }
    } catch {
      // Retorna memória em caso de falha de parser
    }
  }
  return memoriaAgendamentos;
}

/**
 * Salva e notifica ouvintes
 */
function salvarAgendamentos(lista: ScheduledRide[]): void {
  memoriaAgendamentos = lista;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      window.dispatchEvent(
        new CustomEvent("partiu:agendamento-atualizado", {
          detail: { agendamentos: lista },
        }),
      );
    } catch {
      // Falha silenciosa de cota de storage
    }
  }
}

/**
 * Formata data no fuso horário local para YYYY-MM-DD
 */
export function formatarDataLocal(d: Date = new Date()): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/**
 * Formata horário no fuso horário local para HH:mm
 */
export function formatarHoraLocal(d: Date = new Date()): string {
  const hora = String(d.getHours()).padStart(2, "0");
  const minuto = String(d.getMinutes()).padStart(2, "0");
  return `${hora}:${minuto}`;
}

/**
 * Calcula a tarifa sugerida e o piso mínimo de dignidade do motorista
 */
export function calcularPisoMinimo(
  distanciaKm: number,
  categoria: CategoriaAgendamento = "CARRO",
): {
  tarifaSugerida: number;
  pisoMinimo: number;
  custoKm: number;
  taxaEmbarque: number;
} {
  const km = Math.max(1, distanciaKm);

  // Parâmetros operacionais por categoria
  let taxaEmbarque = 6.0;
  let custoKm = 2.4;
  let fatorPiso = 0.82; // Máximo de 18% abaixo da média de mercado, garantindo cobertura de custos

  if (categoria === "MOTO") {
    taxaEmbarque = 4.5;
    custoKm = 1.6;
    fatorPiso = 0.85;
  } else if (categoria === "PREMIUM") {
    taxaEmbarque = 10.0;
    custoKm = 3.5;
    fatorPiso = 0.88;
  }

  const tarifaCalculada = taxaEmbarque + km * custoKm;
  const tarifaSugerida = Number(tarifaCalculada.toFixed(2));
  const pisoMinimo = Number((tarifaSugerida * fatorPiso).toFixed(2));

  return {
    tarifaSugerida,
    pisoMinimo,
    custoKm,
    taxaEmbarque,
  };
}

/**
 * Valida se o horário de agendamento tem pelo menos 30 minutos de antecedência
 */
export function validarAntecedenciaMinima(
  dataStr: string,
  horaStr: string,
  minutosMinimos = 30,
): { valido: boolean; timestamp: number; mensagem?: string } {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  const [hora, minuto] = horaStr.split(":").map(Number);

  if (!ano || !mes || !dia || hora === undefined || minuto === undefined) {
    return {
      valido: false,
      timestamp: 0,
      mensagem: "Data ou horário em formato inválido",
    };
  }

  const dataAgendada = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
  const timestamp = dataAgendada.getTime();
  const agora = Date.now();
  const margemMs = minutosMinimos * 60 * 1000;

  if (timestamp < agora + margemMs) {
    return {
      valido: false,
      timestamp,
      mensagem: `O agendamento precisa ser solicitado com no mínimo ${minutosMinimos} minutos de antecedência`,
    };
  }

  return { valido: true, timestamp };
}

/**
 * Solicita uma corrida agendada com validação estrita de piso mínimo
 */
export function solicitarAgendamento(input: SolicitacaoAgendamentoInput): ScheduledRide {
  if (!input.origem?.endereco?.trim()) {
    throw new Error("O endereço de partida é obrigatório");
  }
  if (!input.destino?.endereco?.trim()) {
    throw new Error("O endereço de destino é obrigatório");
  }

  const categoria = input.categoriaVeiculo || "CARRO";
  const distancia = input.distanciaKm || 7.5;
  const duracao = input.duracaoMin || 18;

  // 1. Validação temporal
  const antecedencia = validarAntecedenciaMinima(input.dataAgendada, input.horarioAgendado);
  if (!antecedencia.valido) {
    throw new Error(antecedencia.mensagem);
  }

  // 2. Proteção Anti-Leilão Predatório (Caminho a)
  const metricas = calcularPisoMinimo(distancia, categoria);
  const valorProposto = Number(input.valorProposto);

  if (Number.isNaN(valorProposto) || valorProposto < metricas.pisoMinimo) {
    throw new Error(
      `O valor proposto (R$ ${valorProposto.toFixed(2)}) está abaixo do piso mínimo de R$ ${metricas.pisoMinimo.toFixed(2)}, que protege o custo da rota do motorista parceiro`,
    );
  }

  const novaCorrida: ScheduledRide = {
    id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    passageiroId: input.passageiroId || "passenger_default",
    passageiroNome: input.passageiroNome || "Passageiro Partiu",
    passageiroTelefone: input.passageiroTelefone || "(11) 99999-0000",
    origem: input.origem,
    destino: input.destino,
    dataAgendada: input.dataAgendada,
    horarioAgendado: input.horarioAgendado,
    timestampAgendado: antecedencia.timestamp,
    categoriaVeiculo: categoria,
    distanciaKm: distancia,
    duracaoMin: duracao,
    tarifaBaseSugerida: metricas.tarifaSugerida,
    pisoMinimoCusto: metricas.pisoMinimo,
    valorPropostoPassageiro: valorProposto,
    status: "SOLICITADO",
    lembretes: {
      notificacao24h: false,
      notificacao2h: false,
      notificacao30m: false,
    },
    observacoes: input.observacoes?.trim() || undefined,
    criadoEm: Date.now(),
  };

  const lista = carregarAgendamentos();
  lista.unshift(novaCorrida);
  salvarAgendamentos(lista);

  return novaCorrida;
}

/**
 * Motorista aceita a corrida pelo valor proposto pelo passageiro
 */
export function motoristaAceitarValor(
  rideId: string,
  motorista: MotoristaAgendado,
): ScheduledRide {
  const lista = carregarAgendamentos();
  const index = lista.findIndex((r) => r.id === rideId);

  if (index === -1) {
    throw new Error("Agendamento não encontrado");
  }

  const ride = lista[index];
  if (ride.status !== "SOLICITADO" && ride.status !== "EM_NEGOCIACAO") {
    throw new Error(`Esta corrida já está no status ${ride.status}`);
  }

  const atualizada: ScheduledRide = {
    ...ride,
    status: "AGENDADO",
    valorFinalAcordado: ride.valorPropostoPassageiro,
    motoristaAtribuido: motorista,
    contrapropostaMotorista: undefined,
  };

  lista[index] = atualizada;
  salvarAgendamentos(lista);
  return atualizada;
}

/**
 * Motorista envia contraproposta justificada antes do horário marcado
 */
export function motoristaEnviarContraproposta(
  rideId: string,
  motorista: MotoristaAgendado,
  valorContraproposta: number,
  justificativa: string,
): ScheduledRide {
  const lista = carregarAgendamentos();
  const index = lista.findIndex((r) => r.id === rideId);

  if (index === -1) {
    throw new Error("Agendamento não encontrado");
  }

  const ride = lista[index];
  if (ride.status !== "SOLICITADO" && ride.status !== "EM_NEGOCIACAO") {
    throw new Error("Esta corrida não aceita mais contrapropostas");
  }

  if (valorContraproposta <= ride.pisoMinimoCusto) {
    throw new Error("A contraproposta deve respeitar a sustentabilidade mínima da corrida");
  }

  if (!justificativa?.trim()) {
    throw new Error("Informe a justificativa da contraproposta (ex: pedágio ou retorno vazio)");
  }

  const atualizada: ScheduledRide = {
    ...ride,
    status: "EM_NEGOCIACAO",
    motoristaAtribuido: motorista,
    contrapropostaMotorista: {
      motoristaId: motorista.id,
      motoristaNome: motorista.nome,
      valor: Number(valorContraproposta.toFixed(2)),
      justificativa: justificativa.trim(),
      timestamp: Date.now(),
      status: "PENDENTE",
    },
  };

  lista[index] = atualizada;
  salvarAgendamentos(lista);
  return atualizada;
}

/**
 * Passageiro aceita a contraproposta do motorista
 */
export function passageiroAceitarContraproposta(rideId: string): ScheduledRide {
  const lista = carregarAgendamentos();
  const index = lista.findIndex((r) => r.id === rideId);

  if (index === -1) {
    throw new Error("Agendamento não encontrado");
  }

  const ride = lista[index];
  if (ride.status !== "EM_NEGOCIACAO" || !ride.contrapropostaMotorista) {
    throw new Error("Nenhuma contraproposta pendente para este agendamento");
  }

  const atualizada: ScheduledRide = {
    ...ride,
    status: "AGENDADO",
    valorFinalAcordado: ride.contrapropostaMotorista.valor,
    contrapropostaMotorista: {
      ...ride.contrapropostaMotorista,
      status: "ACEITA",
    },
  };

  lista[index] = atualizada;
  salvarAgendamentos(lista);
  return atualizada;
}

/**
 * Passageiro recusa a contraproposta do motorista
 */
export function passageiroRecusarContraproposta(rideId: string): ScheduledRide {
  const lista = carregarAgendamentos();
  const index = lista.findIndex((r) => r.id === rideId);

  if (index === -1) {
    throw new Error("Agendamento não encontrado");
  }

  const ride = lista[index];
  if (ride.status !== "EM_NEGOCIACAO") {
    throw new Error("Não há contraproposta ativa para recusar");
  }

  // Volta para SOLICITADO para outros motoristas avaliarem
  const atualizada: ScheduledRide = {
    ...ride,
    status: "SOLICITADO",
    motoristaAtribuido: undefined,
    contrapropostaMotorista: undefined,
  };

  lista[index] = atualizada;
  salvarAgendamentos(lista);
  return atualizada;
}

/**
 * Cancela um agendamento
 */
export function cancelarAgendamento(
  rideId: string,
  solicitante: "PASSAGEIRO" | "MOTORISTA",
  motivo?: string,
): ScheduledRide {
  const lista = carregarAgendamentos();
  const index = lista.findIndex((r) => r.id === rideId);

  if (index === -1) {
    throw new Error("Agendamento não encontrado");
  }

  const ride = lista[index];
  if (ride.status === "CONCLUIDO" || ride.status === "INICIADO") {
    throw new Error("Corrida em andamento ou concluída não pode ser cancelada por este canal");
  }

  const atualizada: ScheduledRide = {
    ...ride,
    status: "CANCELADO",
    observacoes: motivo ? `Cancelada por ${solicitante}: ${motivo}` : `Cancelada por ${solicitante}`,
  };

  lista[index] = atualizada;
  salvarAgendamentos(lista);
  return atualizada;
}

/**
 * Lista agendamentos pertencentes ao passageiro
 */
export function listarAgendamentosPassageiro(passageiroId?: string): ScheduledRide[] {
  const lista = carregarAgendamentos();
  if (!passageiroId || passageiroId === "all") {
    return lista;
  }
  return lista.filter((r) => r.passageiroId === passageiroId);
}

/**
 * Lista agendamentos abertos e disponíveis para os motoristas parceiros
 */
export function listarAgendamentosDisponiveisMotorista(motoristaId?: string): ScheduledRide[] {
  const lista = carregarAgendamentos();
  const agora = Date.now();

  return lista.filter((r) => {
    // Apenas futuras
    if (r.timestampAgendado <= agora) return false;
    // Se está solicitada, está disponível para qualquer um
    if (r.status === "SOLICITADO") return true;
    // Se está em negociação ou agendada e pertence a este motorista
    if (motoristaId && r.motoristaAtribuido?.id === motoristaId) return true;
    return false;
  });
}

/**
 * Verificação e disparo da régua de lembretes automáticos
 */
export function checarLembretesAgendamento(agoraMs = Date.now()): {
  lembretesEnviados: number;
  notificacoes: Array<{
    rideId: string;
    tipo: "24h" | "2h" | "30m";
    destinatario: "PASSAGEIRO" | "MOTORISTA";
    mensagem: string;
  }>;
} {
  const lista = carregarAgendamentos();
  const notificacoes: Array<{
    rideId: string;
    tipo: "24h" | "2h" | "30m";
    destinatario: "PASSAGEIRO" | "MOTORISTA";
    mensagem: string;
  }> = [];

  let alterado = false;

  lista.forEach((ride) => {
    if (ride.status !== "AGENDADO") return;

    const tempoRestanteMs = ride.timestampAgendado - agoraMs;
    const tempoRestanteMin = Math.floor(tempoRestanteMs / (60 * 1000));

    // Lembrete 24h (entre 23h30 e 24h30)
    if (
      tempoRestanteMin <= 24 * 60 &&
      tempoRestanteMin > 23 * 60 &&
      !ride.lembretes.notificacao24h
    ) {
      ride.lembretes.notificacao24h = true;
      alterado = true;
      notificacoes.push({
        rideId: ride.id,
        tipo: "24h",
        destinatario: "PASSAGEIRO",
        mensagem: `Lembrete Partiu: sua corrida agendada para ${ride.horarioAgendado} de amanhã está confirmada`,
      });
      if (ride.motoristaAtribuido) {
        notificacoes.push({
          rideId: ride.id,
          tipo: "24h",
          destinatario: "MOTORISTA",
          mensagem: `Compromisso amanhã às ${ride.horarioAgendado}: corrida agendada no Partiu`,
        });
      }
    }

    // Lembrete 2h (entre 1h30 e 2h15)
    if (tempoRestanteMin <= 120 && tempoRestanteMin > 90 && !ride.lembretes.notificacao2h) {
      ride.lembretes.notificacao2h = true;
      alterado = true;
      notificacoes.push({
        rideId: ride.id,
        tipo: "2h",
        destinatario: "PASSAGEIRO",
        mensagem: `Faltam 2 horas para o seu embarque agendado às ${ride.horarioAgendado}`,
      });
      if (ride.motoristaAtribuido) {
        notificacoes.push({
          rideId: ride.id,
          tipo: "2h",
          destinatario: "MOTORISTA",
          mensagem: `Aviso operacional: sua corrida agendada é em 2 horas às ${ride.horarioAgendado}`,
        });
      }
    }

    // Lembrete 30m (entre 0 e 35 minutos)
    if (tempoRestanteMin <= 35 && tempoRestanteMin > 0 && !ride.lembretes.notificacao30m) {
      ride.lembretes.notificacao30m = true;
      alterado = true;
      notificacoes.push({
        rideId: ride.id,
        tipo: "30m",
        destinatario: "PASSAGEIRO",
        mensagem: `Seu motorista parceiro está se preparando para seu agendamento das ${ride.horarioAgendado}`,
      });
      if (ride.motoristaAtribuido) {
        notificacoes.push({
          rideId: ride.id,
          tipo: "30m",
          destinatario: "MOTORISTA",
          mensagem: `Hora de partir: corrida agendada em 30 minutos às ${ride.horarioAgendado}`,
        });
      }
    }
  });

  if (alterado) {
    salvarAgendamentos(lista);
  }

  return {
    lembretesEnviados: notificacoes.length,
    notificacoes,
  };
}
