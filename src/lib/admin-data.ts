export type VanAtiva = {
  id: string;
  placa: string;
  motorista: string;
  fotoMotorista: string;
  rota: string;
  velocidade: number;
  telemetria: "online" | "instavel" | "offline";
  x: number;
  y: number;
  corPin: "verde" | "amarelo" | "escuro";
  modelo: string;
};

export type Alerta = {
  id: string;
  titulo: string;
  detalhe: string;
  prioridade: "critico" | "atencao" | "info";
  quando: string;
  categoria: "manutencao" | "trafego" | "atraso";
};

export type Despesa = {
  id: string;
  descricao: string;
  subcategoria: string;
  categoria:
    | "Combustível"
    | "Manutenção Preventiva"
    | "Manutenção Carta"
    | "Manutenção Corretiva"
    | "Pedágio";
  valor: number;
  data: string;
  conciliado: boolean;
};

export type RotaHistorico = {
  id: string;
  nome: string;
  modalidade: "Urbana" | "Flash" | "Partiu Mulher" | "Rotas Escolares" | "Shuttles de Empresa" | "Intermunicipal";
  trajeto: string;
  data: string;
  paradas: number;
  inicio: string;
  fim: string;
  tipoRegistro: "Rota corrida" | "Rota observada";
  status: "Concluído" | "Agendado";
};

export type Motorista = {
  id: string;
  nome: string;
  iniciais: string;
  fotoUrl: string;
  rating: number;
  etaMin: number;
  veiculo: string;
  fotoVeiculo: string;
  favorito: boolean;
  telefone: string;
};

export const vansAtivas: VanAtiva[] = [
  {
    id: "va1",
    placa: "MOB-8K99",
    motorista: "Carlos Eduardo Silva",
    fotoMotorista:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rota: "Centro ➔ Shopping (Partiu Pop)",
    velocidade: 48,
    telemetria: "online",
    x: 28,
    y: 35,
    corPin: "verde",
    modelo: "Chevrolet Onix Plus 2024 (Prata)",
  },
  {
    id: "va2",
    placa: "MOT-7799",
    motorista: "Lucas Fernandes",
    fotoMotorista:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rota: "Vinhosa ➔ Centro (Partiu Moto)",
    velocidade: 38,
    telemetria: "online",
    x: 52,
    y: 48,
    corPin: "verde",
    modelo: "Honda CG 160 Titan (Preta)",
  },
  {
    id: "va3",
    placa: "PRT-9900",
    motorista: "Roberto Fonseca",
    fotoMotorista:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rota: "Aeroporto ➔ Zona Sul (Partiu Plus)",
    velocidade: 62,
    telemetria: "online",
    x: 72,
    y: 22,
    corPin: "escuro",
    modelo: "Toyota Corolla XEi 2024 (Preto)",
  },
  {
    id: "va4",
    placa: "FLS-3321",
    motorista: "Marcos Vinicius",
    fotoMotorista:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    rota: "Zona Norte ➔ Polo Comercial (Partiu Flash)",
    velocidade: 32,
    telemetria: "online",
    x: 38,
    y: 68,
    corPin: "amarelo",
    modelo: "Yamaha Fazer 250 (Vermelha)",
  },
];

export const alertas: Alerta[] = [
  {
    id: "a1",
    titulo: "Manutenção alerts",
    detalhe: "Manutenção agendada",
    prioridade: "atencao",
    quando: "há 10 min",
    categoria: "manutencao",
  },
  {
    id: "a2",
    titulo: "Atrasos e tráfego intenso",
    detalhe: "Rota 2 com atrasos",
    prioridade: "critico",
    quando: "há 4 min",
    categoria: "trafego",
  },
  {
    id: "a3",
    titulo: "Inspeção semestral pendente",
    detalhe: "Van MTQ-9J07 vence em 5 dias",
    prioridade: "info",
    quando: "há 2 h",
    categoria: "manutencao",
  },
];

export const despesas: Despesa[] = [
  {
    id: "d1",
    descricao: "Combustivel",
    subcategoria: "Manutenção Preventiva",
    categoria: "Combustível",
    valor: 480.5,
    data: "Hoje, 14:20",
    conciliado: true,
  },
  {
    id: "d2",
    descricao: "Combustivel",
    subcategoria: "Manutenção Carta",
    categoria: "Combustível",
    valor: 320.0,
    data: "Ontem, 09:15",
    conciliado: true,
  },
  {
    id: "d3",
    descricao: "Troca de Pastilhas e Fluido",
    subcategoria: "Manutenção Preventiva",
    categoria: "Manutenção Preventiva",
    valor: 750.0,
    data: "26 ago",
    conciliado: true,
  },
  {
    id: "d4",
    descricao: "Reparo Injeção Eletrônica",
    subcategoria: "Manutenção Corretiva",
    categoria: "Manutenção Corretiva",
    valor: 1890.9,
    data: "22 ago",
    conciliado: false,
  },
];

export const rotasHistorico: RotaHistorico[] = [
  {
    id: "rh1",
    nome: "Corrida Centro ➔ Zona Norte",
    modalidade: "Urbana",
    trajeto: "Terminal Rodoviário Urbano → Bairro Residencial Norte",
    data: "Hoje",
    paradas: 1,
    inicio: "06:30",
    fim: "06:55",
    tipoRegistro: "Rota corrida",
    status: "Concluído",
  },
  {
    id: "rh2",
    nome: "Entrega Flash Express",
    modalidade: "Flash",
    trajeto: "Polo Comercial → Shopping Central",
    data: "Hoje",
    paradas: 1,
    inicio: "08:30",
    fim: "08:50",
    tipoRegistro: "Rota observada",
    status: "Concluído",
  },
  {
    id: "rh3",
    nome: "Corrida Partiu Mulher",
    modalidade: "Urbana",
    trajeto: "Centro Financeiro → Campus Universitário",
    data: "Ontem",
    paradas: 1,
    inicio: "14:30",
    fim: "14:55",
    tipoRegistro: "Rota observada",
    status: "Concluído",
  },
  {
    id: "rh4",
    nome: "Corrida Aeroporto Conexão",
    modalidade: "Urbana",
    trajeto: "Hotel Central → Terminal de Passageiros Aeroporto",
    data: "Ontem",
    paradas: 1,
    inicio: "09:00",
    fim: "09:35",
    tipoRegistro: "Rota corrida",
    status: "Concluído",
  },
];

export const motoristas: Motorista[] = [
  {
    id: "m1",
    nome: "Carlos Eduardo Santos",
    iniciais: "CS",
    fotoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 4.95,
    etaMin: 3,
    veiculo: "Chevrolet Onix Plus 1.0 Turbo",
    fotoVeiculo:
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80",
    favorito: true,
    telefone: "+5511998412940",
  },
  {
    id: "m2",
    nome: "Fernando Costa",
    iniciais: "FC",
    fotoUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    rating: 4.92,
    etaMin: 6,
    veiculo: "Hyundai HB20 Sedan 1.6",
    fotoVeiculo:
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=200&auto=format&fit=crop&q=80",
    favorito: false,
    telefone: "+5511996114020",
  },
  {
    id: "m3",
    nome: "Antônio Marcos Ferreira",
    iniciais: "AF",
    fotoUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    rating: 4.88,
    etaMin: 3,
    veiculo: "Honda CG 160 Titan (Flash)",
    fotoVeiculo:
      "https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=200&auto=format&fit=crop&q=80",
    favorito: true,
    telefone: "+5511997031288",
  },
  {
    id: "m4",
    nome: "Severino José de Lima",
    iniciais: "SL",
    fotoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 4.91,
    etaMin: 7,
    veiculo: "Toyota Corolla XEi 2.0",
    fotoVeiculo:
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80",
    favorito: false,
    telefone: "+5511996124411",
  },
  {
    id: "m5",
    nome: "Clara Albuquerque Lima",
    iniciais: "CL",
    fotoUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    rating: 4.97,
    etaMin: 2,
    veiculo: "Fiat Cronos Drive (Partiu Mulher)",
    fotoVeiculo:
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=200&auto=format&fit=crop&q=80",
    favorito: true,
    telefone: "+5511998415522",
  },
];

export type ItemConforto =
  "ar_condicionado" | "wifi_starlink" | "tomada_usb" | "acessibilidade_pcd" | "bagageiro";

export type HorarioSaidaVan = {
  id: string;
  linhaId: string;
  origem: string;
  destino: string;
  pontoEmbarquePrincipal: string;
  pontoDesembarquePrincipal: string;
  horarioSaida: string;
  previsaoChegada: string;
  duracaoEstimada: string;
  preco: number;
  motoristaNome: string;
  motoristaFoto: string;
  motoristaTelefone: string;
  motoristaRating: number;
  veiculoModelo: string;
  veiculoPlaca: string;
  VagasTotais: number;
  VagasDisponiveis: number;
  status: "embarque_iniciado" | "saindo_em_breve" | "confirmado" | "lotado" | "em_transito";
  conforto: ItemConforto[];
  paradasIntermediarias: string[];
};

export type SolicitacaoMotorista = {
  id: string;
  nomeCompleto: string;
  cpf: string;
  whatsapp: string;
  email: string;
  cnhNumero: string;
  cnhCategoria: string;
  possuiEAR: boolean;
  veiculoMarcaModelo: string;
  veiculoAno: string;
  veiculoPlaca: string;
  veiculoCapacidade: number;
  orgaoRegulador: string; // Ex: ARSAL, DETRO, ANTT, EMTU
  numeroAutorizacao: string;
  linhaOrigem: string;
  linhaDestino: string;
  diasOperacao: string[];
  horariosSaida: string[];
  chavePix: string;
  tipoChavePix: "cpf" | "celular" | "email" | "aleatoria";
  status: "pendente" | "aprovado" | "rejeitado";
  dataSolicitacao: string;
  conforto: ItemConforto[];
};

export type VagaVan = {
  numero: number;
  status: "livre" | "ocupado" | "reservado";
  passageiroNome?: string | undefined;
  passageiroTelefone?: string | undefined;
  pontoEmbarque?: string | undefined;
};

export type EncomendaVan = {
  id: string;
  codigoRastreio: string;
  pinEntrega: string; // PIN de segurança de 4 dígitos para confirmação na entrega (Estilo 99)
  remetenteNome: string;
  remetenteTelefone: string;
  destinatarioNome: string;
  destinatarioTelefone: string;
  origem: string;
  destino: string;
  tipo: "envelope" | "pacote_pequeno" | "caixa_media" | "caixa_grande";
  descricao: string;
  valorFrete: number;
  status: "aguardando_coleta" | "em_transito" | "entregue_no_terminal" | "a_caminho" | "entregue";
  dataEnvio: string;
  dataEntrega?: string | undefined;
  entreguePor?: string | undefined;
  motoristaNome?: string | undefined;
  vanPlaca?: string | undefined;
};

export type EncomendaFlash = EncomendaVan;

export type DemandaRota = {
  id: string;
  origem: string;
  destino: string;
  horarioDesejado: string;
  diasSemana: string;
  apoiadoresQtd: number;
  metaApoiadores: number;
  status: "em_votacao" | "em_analise_cooperativa" | "em_analise_operacional" | "rota_criada";
  dataCriacao: string;
};

export type AlertaSOS = {
  id: string;
  tipo: "seguranca" | "pane_mecanica" | "emergencia_medica" | "acidente_rodovia";
  solicitanteNome: string;
  solicitanteTelefone: string;
  vanPlaca: string;
  motoristaNome: string;
  rodovia: string;
  coordenadas: string;
  status: "ativo" | "em_atendimento" | "resolvido";
  dataHora: string;
  descricao?: string | undefined;
};

export type LocalAtendido = {
  id: string;
  nome: string;
  estado: string;
  tipo: "terminal_rodoviario" | "posto_apoio" | "trevo_acesso" | "centro_urbano";
  endereco: string;
  ativo: boolean;
  latitude: number;
  longitude: number;
};

export const encomendasMock: EncomendaVan[] = [
  {
    id: "enc-1",
    codigoRastreio: "PT-8942-BR",
    pinEntrega: "4819",
    remetenteNome: "Distribuidora Central Auto",
    remetenteTelefone: "+5511998412940",
    destinatarioNome: "Oficina do Beto",
    destinatarioTelefone: "+5511996114020",
    origem: "Polo Comercial, 120",
    destino: "Centro Urbano, 450",
    tipo: "caixa_media",
    descricao: "Peças automotivas e correia dentada (8kg)",
    valorFrete: 35.0,
    status: "em_transito",
    dataEnvio: "Hoje, 08:30",
    motoristaNome: "Carlos Eduardo Silva",
    vanPlaca: "MOB-8K99",
  },
  {
    id: "enc-2",
    codigoRastreio: "PT-3319-BR",
    pinEntrega: "7320",
    remetenteNome: "Confecções & Moda Urbana",
    remetenteTelefone: "+5511997031288",
    destinatarioNome: "Boutique Central",
    destinatarioTelefone: "+5511992223344",
    origem: "Distrito Industrial, 50",
    destino: "Shopping Central, 320",
    tipo: "caixa_grande",
    descricao: "Fardos de vestuário e produtos (18kg)",
    valorFrete: 50.0,
    status: "em_transito",
    dataEnvio: "Hoje, 05:15",
    motoristaNome: "Lucas Fernandes",
    vanPlaca: "MOT-7799",
  },
];

/**
 * 📦 GERENCIAMENTO DE ENCOMENDAS EXPRESS COM PIN SEGURO
 */
export function getEncomendasStore(): EncomendaVan[] {
  if (typeof window === "undefined") return encomendasMock;
  try {
    const raw = localStorage.getItem("partiu_encomendas_store");
    if (!raw) {
      localStorage.setItem("partiu_encomendas_store", JSON.stringify(encomendasMock));
      return encomendasMock;
    }
    return JSON.parse(raw);
  } catch {
    return encomendasMock;
  }
}

export function salvarNovaEncomendaStore(nova: EncomendaVan): EncomendaVan[] {
  if (typeof window === "undefined") return [nova, ...encomendasMock];
  try {
    const atuais = getEncomendasStore();
    const atualizadas = [nova, ...atuais];
    localStorage.setItem("partiu_encomendas_store", JSON.stringify(atualizadas));
    return atualizadas;
  } catch {
    return [nova, ...encomendasMock];
  }
}

export function validarPinEntregaEncomenda(
  encomendaId: string,
  pinDigitado: string,
  motoristaNome = "Carlos Eduardo Santos",
): { sucesso: boolean; mensagem: string; encomenda?: EncomendaVan } {
  if (typeof window === "undefined") {
    return { sucesso: false, mensagem: "Ambiente inválido" };
  }

  try {
    const atuais = getEncomendasStore();
    const enc = atuais.find((e) => e.id === encomendaId || e.codigoRastreio === encomendaId);

    if (!enc) {
      return { sucesso: false, mensagem: "Encomenda não encontrada no manifesto." };
    }

    if (enc.status === "entregue_no_terminal") {
      return {
        sucesso: false,
        mensagem: "Esta encomenda já foi entregue e finalizada anteriormente.",
      };
    }

    if (enc.pinEntrega.trim() !== pinDigitado.trim()) {
      return {
        sucesso: false,
        mensagem:
          "PIN INCORRETO! O destinatário deve apresentar o código de 4 dígitos gerado no envio.",
      };
    }

    const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const atualizadas = atuais.map((item) => {
      if (item.id === enc.id) {
        return {
          ...item,
          status: "entregue_no_terminal" as const,
          dataEntrega: `Hoje, às ${agora}`,
          entreguePor: motoristaNome,
        };
      }
      return item;
    });

    localStorage.setItem("partiu_encomendas_store", JSON.stringify(atualizadas));
    const final = atualizadas.find((e) => e.id === enc.id);

    return {
      sucesso: true,
      mensagem: "Entrega confirmada com sucesso mediante PIN validado!",
      ...(final ? { encomenda: final } : {}),
    };
  } catch {
    return { sucesso: false, mensagem: "Erro ao processar baixa da encomenda." };
  }
}

export const demandasRotasMock: DemandaRota[] = [
  {
    id: "dem-1",
    origem: "Bairro Residencial Novo",
    destino: "Centro Financeiro",
    horarioDesejado: "07:00 e 18:30 (Pico)",
    diasSemana: "Segunda a Sexta",
    apoiadoresQtd: 48,
    metaApoiadores: 50,
    status: "em_votacao",
    dataCriacao: "Há 2 dias",
  },
  {
    id: "dem-2",
    origem: "Polo Universitário",
    destino: "Terminal Rodoviário Central",
    horarioDesejado: "22:15 (Noturno)",
    diasSemana: "Segunda a Sexta",
    apoiadoresQtd: 62,
    metaApoiadores: 50,
    status: "em_analise_operacional",
    dataCriacao: "Há 4 dias",
  },
  {
    id: "dem-3",
    origem: "Distrito Industrial",
    destino: "Estação Central",
    horarioDesejado: "06:00 e 17:00",
    diasSemana: "Segunda a Sexta",
    apoiadoresQtd: 34,
    metaApoiadores: 50,
    status: "em_votacao",
    dataCriacao: "Ontem",
  },
];

export const alertasSOSMock: AlertaSOS[] = [
  {
    id: "sos-1",
    tipo: "pane_mecanica",
    solicitanteNome: "Carlos Eduardo Santos (Motorista)",
    solicitanteTelefone: "+5511998412940",
    vanPlaca: "MOB-8K99",
    motoristaNome: "Carlos Eduardo Santos",
    rodovia: "Av. Principal · Centro Urbano",
    coordenadas: "-21.2054, -41.8892",
    status: "em_atendimento",
    dataHora: "Hoje, 09:12",
    descricao:
      "Pneu furado durante corrida urbana. Veículo em local seguro aguardando apoio da equipe conveniada.",
  },
];

export const locaisAtendidosMock: LocalAtendido[] = [
  {
    id: "loc-1",
    nome: "Terminal Central Urbano",
    estado: "BR",
    tipo: "terminal_rodoviario",
    endereco: "Av. Central, s/n - Centro",
    ativo: true,
    latitude: -21.2054,
    longitude: -41.8892,
  },
  {
    id: "loc-2",
    nome: "Shopping Central & Gastronomia",
    estado: "BR",
    tipo: "centro_urbano",
    endereco: "Av. Comercial, 500",
    ativo: true,
    latitude: -21.208,
    longitude: -41.884,
  },
  {
    id: "loc-3",
    nome: "Polo Universitário & Campus",
    estado: "BR",
    tipo: "centro_urbano",
    endereco: "Rua Universitária, 200",
    ativo: true,
    latitude: -21.201,
    longitude: -41.88,
  },
  {
    id: "loc-4",
    nome: "Terminal de Embarque Aeroporto",
    estado: "BR",
    tipo: "terminal_rodoviario",
    endereco: "Av. do Aeroporto, 100",
    ativo: true,
    latitude: -21.218,
    longitude: -41.875,
  },
  {
    id: "loc-5",
    nome: "Complexo Hospitalar Central",
    estado: "BR",
    tipo: "centro_urbano",
    endereco: "Rua da Saúde, 150",
    ativo: true,
    latitude: -21.206,
    longitude: -41.887,
  },
];

export const linhasEHorarios: HorarioSaidaVan[] = [
  {
    id: "h1",
    linhaId: "l1",
    origem: "Terminal Rodoviário Central",
    destino: "Centro Comercial & Shopping",
    pontoEmbarquePrincipal: "Terminal Central • Plataforma de Embarque",
    pontoDesembarquePrincipal: "Shopping Central • Portaria Principal",
    horarioSaida: "06:30",
    previsaoChegada: "07:05",
    duracaoEstimada: "35m",
    preco: 8.5,
    motoristaNome: "Carlos Eduardo Santos",
    motoristaFoto:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    motoristaTelefone: "+5511998412940",
    motoristaRating: 4.95,
    veiculoModelo: "Chevrolet Onix Plus 1.0 Turbo",
    veiculoPlaca: "MOB-8K99",
    VagasTotais: 4,
    VagasDisponiveis: 2,
    status: "embarque_iniciado",
    conforto: ["ar_condicionado", "wifi_starlink", "tomada_usb", "bagageiro"],
    paradasIntermediarias: ["Av. Principal", "Ponto Universitário"],
  },
  {
    id: "h2",
    linhaId: "l2",
    origem: "Polo Universitário",
    destino: "Terminal Rodoviário Central",
    pontoEmbarquePrincipal: "Campus Central • Portaria 1",
    pontoDesembarquePrincipal: "Terminal Central",
    horarioSaida: "08:00",
    previsaoChegada: "08:30",
    duracaoEstimada: "30m",
    preco: 7.5,
    motoristaNome: "Fernando Costa",
    motoristaFoto:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    motoristaTelefone: "+5511996114020",
    motoristaRating: 4.92,
    veiculoModelo: "Hyundai HB20 Sedan 1.6",
    veiculoPlaca: "PAR-5P20",
    VagasTotais: 4,
    VagasDisponiveis: 3,
    status: "saindo_em_breve",
    conforto: ["ar_condicionado", "wifi_starlink", "bagageiro"],
    paradasIntermediarias: ["Centro Médico", "Bairro Novo"],
  },
  {
    id: "h3",
    linhaId: "l3",
    origem: "Terminal Rodoviário Central",
    destino: "Aeroporto Municipal",
    pontoEmbarquePrincipal: "Terminal Central • Baia Executiva",
    pontoDesembarquePrincipal: "Aeroporto • Terminal de Passageiros",
    horarioSaida: "09:00",
    previsaoChegada: "09:35",
    duracaoEstimada: "35m",
    preco: 15.0,
    motoristaNome: "Clara Albuquerque Lima",
    motoristaFoto:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    motoristaTelefone: "+5511998415522",
    motoristaRating: 4.97,
    veiculoModelo: "Toyota Corolla XEi 2.0",
    veiculoPlaca: "COR-9X10",
    VagasTotais: 4,
    VagasDisponiveis: 3,
    status: "saindo_em_breve",
    conforto: ["ar_condicionado", "wifi_starlink", "tomada_usb", "acessibilidade_pcd", "bagageiro"],
    paradasIntermediarias: ["Hotel Central", "Av. do Aeroporto"],
  },
];

export const solicitacoesMotoristasPendentes: SolicitacaoMotorista[] = [
  {
    id: "sol-1",
    nomeCompleto: "Marcos Aurelio Silveira",
    cpf: "123.456.789-00",
    whatsapp: "+5511991234567",
    email: "marcos.partiu@gmail.com",
    cnhNumero: "04987654321",
    cnhCategoria: "B (Com EAR)",
    possuiEAR: true,
    veiculoMarcaModelo: "Chevrolet Onix Plus 1.0T",
    veiculoAno: "2024",
    veiculoPlaca: "BRA-4E29",
    veiculoCapacidade: 4,
    orgaoRegulador: "Secretaria de Mobilidade Urbana",
    numeroAutorizacao: "SMT-2026/8942",
    linhaOrigem: "Zona Norte",
    linhaDestino: "Centro",
    diasOperacao: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
    horariosSaida: ["06:00", "10:30", "15:00"],
    chavePix: "12345678900",
    tipoChavePix: "cpf",
    status: "pendente",
    dataSolicitacao: "Hoje, 11:45",
    conforto: ["ar_condicionado", "wifi_starlink", "tomada_usb", "bagageiro"],
  },
  {
    id: "sol-2",
    nomeCompleto: "Regina Coeli Barreto",
    cpf: "321.654.987-11",
    whatsapp: "+5511998765432",
    email: "regina.motorista@partiumobilidade.com.br",
    cnhNumero: "08765432109",
    cnhCategoria: "B (Com EAR)",
    possuiEAR: true,
    veiculoMarcaModelo: "Fiat Cronos Drive 1.3",
    veiculoAno: "2025",
    veiculoPlaca: "QLD-9A12",
    veiculoCapacidade: 4,
    orgaoRegulador: "Secretaria de Mobilidade Urbana",
    numeroAutorizacao: "SMT-AL/2026-441",
    linhaOrigem: "Zona Sul",
    linhaDestino: "Centro",
    diasOperacao: ["Segunda", "Quarta", "Sexta", "Domingo"],
    horariosSaida: ["07:00", "14:00"],
    chavePix: "regina.motorista@partiumobilidade.com.br",
    tipoChavePix: "email",
    status: "pendente",
    dataSolicitacao: "Ontem, 16:20",
    conforto: ["ar_condicionado", "acessibilidade_pcd", "wifi_starlink", "bagageiro"],
  },
];

export const VagasMockVan: VagaVan[] = [
  {
    numero: 1,
    status: "ocupado",
    passageiroNome: "Lucas Andrade",
    passageiroTelefone: "+5511988112233",
    pontoEmbarque: "Rodoviária Central",
  },
  {
    numero: 2,
    status: "ocupado",
    passageiroNome: "Maria Eduarda",
    passageiroTelefone: "+5511988223344",
    pontoEmbarque: "Rodoviária Central",
  },
  {
    numero: 3,
    status: "reservado",
    passageiroNome: "Carlos Alberto",
    passageiroTelefone: "+5511988334455",
    pontoEmbarque: "Ponto Comercial Central",
  },
  { numero: 4, status: "livre" },
];

export const paradasRota = [
  {
    id: "p1",
    nome: "Partida • Ponto Central",
    endereco: "Terminal Rodoviário Central",
    horario: "06:30",
    status: "concluido",
  },
  {
    id: "p2",
    nome: "Av. Principal • Centro",
    endereco: "Av. Principal, 120",
    horario: "06:45",
    status: "concluido",
  },
  {
    id: "p3",
    nome: "Ponto Universitário",
    endereco: "Campus Central • Portaria 1",
    horario: "07:00",
    status: "em_andamento",
  },
  {
    id: "p4",
    nome: "Shopping Central",
    endereco: "Av. Comercial, 500 — Destino Final",
    horario: "07:15",
    status: "pendente",
  },
];
