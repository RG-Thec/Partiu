/**
 * 💳 SERVIÇO DE CARTEIRA PRÉ-PAGA DO MOTORISTA & GATEWAY PIX
 * Modelo onde a comissão do app é debitada da carteira e corridas são bloqueadas se saldo <= 0.
 */

export interface CarteiraMotorista {
  motoristaId: string;
  motoristaNome: string;
  telefone: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  saldoBrl: number;
  limiteMinimoBrl: number;
  statusBloqueio: "LIBERADO" | "BLOQUEADO_SALDO_INSUFICIENTE" | "BLOQUEADO_ADMINISTRATIVO";
  totalCorridasPagas: number;
  totalRecargasPixBrl: number;
  atualizadoEm: number;
}

export type TipoTransacaoCarteira =
  | "RECARGA_PIX"
  | "DEBITO_CORRIDA"
  | "CREDITO_MANUAL_ADMIN"
  | "DEBITO_MANUAL_ADMIN"
  | "BONUS";

export interface TransacaoCarteira {
  id: string;
  motoristaId: string;
  tipo: TipoTransacaoCarteira;
  valorBrl: number;
  saldoAposBrl: number;
  descricao: string;
  corridaId?: string;
  operadorAdmin?: string;
  timestamp: number;
  dataHoraFormatada: string;
}

export interface PedidoRecargaPix {
  id: string;
  motoristaId: string;
  motoristaNome: string;
  valorBrl: number;
  gateway: "MERCADO_PAGO" | "PICPAY" | "ASAAS" | "MANUAL";
  status: "PENDENTE" | "APROVADO" | "EXPIRADO" | "REJEITADO";
  qrCodeCopiaECola?: string;
  expiraEm: number;
  criadoEm: number;
  aprovadoEm?: number;
  comprovanteNota?: string;
}

export interface GatewayConfig {
  gatewayAtivo: "MERCADO_PAGO" | "PICPAY" | "ASAAS" | "MANUAL";
  chavePixManual: string;
  tipoChave: "CNPJ" | "TELEFONE" | "EMAIL" | "ALEATORIA";
  nomeBeneficiario: string;
  cidadeBeneficiario: string;
  mercadoPagoAccessToken?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoWebhookSecret?: string;
  picPayClientId?: string;
  picPayClientSecret?: string;
  picPayWebhookToken?: string;
  asaasApiKey?: string;
  sandbox: boolean;
  tempoExpiracaoMinutos: number;
  limiteAlertaSaldoBaixo: number; // R$ 15,00
}

const STORAGE_KEY_WALLETS = "partiu_driver_wallets";
const STORAGE_KEY_TRANSACTIONS = "partiu_driver_wallet_transactions";
const STORAGE_KEY_RECHARGES = "partiu_pix_recharge_orders";
const STORAGE_KEY_GATEWAY = "partiu_gateway_pix_config";

export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  gatewayAtivo: "MERCADO_PAGO",
  chavePixManual: "financeiro@partiumobilidade.com.br",
  tipoChave: "EMAIL",
  nomeBeneficiario: "PARTIU MOBILIDADE URBANA LTDA",
  cidadeBeneficiario: "ITAPERUNA",
  mercadoPagoAccessToken: "",
  mercadoPagoPublicKey: "",
  mercadoPagoWebhookSecret: "",
  picPayClientId: "",
  picPayClientSecret: "",
  picPayWebhookToken: "",
  asaasApiKey: "",
  sandbox: false,
  tempoExpiracaoMinutos: 15,
  limiteAlertaSaldoBaixo: 15.0,
};

export const WALLETS_INICIAIS: CarteiraMotorista[] = [
  {
    motoristaId: "mot-1",
    motoristaNome: "Carlos Eduardo Silva",
    telefone: "(22) 99960-5162",
    veiculoPlaca: "MOB-8K99",
    veiculoModelo: "Chevrolet Onix Plus",
    saldoBrl: 48.5,
    limiteMinimoBrl: 0.0,
    statusBloqueio: "LIBERADO",
    totalCorridasPagas: 142,
    totalRecargasPixBrl: 350.0,
    atualizadoEm: Date.now(),
  },
  {
    motoristaId: "mot-2",
    motoristaNome: "Lucas Motoboy Flash",
    telefone: "(22) 99888-1122",
    veiculoPlaca: "MOT-7799",
    veiculoModelo: "Honda CG 160 Titan",
    saldoBrl: 2.15,
    limiteMinimoBrl: 0.0,
    statusBloqueio: "LIBERADO",
    totalCorridasPagas: 89,
    totalRecargasPixBrl: 180.0,
    atualizadoEm: Date.now(),
  },
  {
    motoristaId: "mot-3",
    motoristaNome: "Mariana Santos",
    telefone: "(22) 99777-3344",
    veiculoPlaca: "PAR-5P20",
    veiculoModelo: "Hyundai HB20 Sedan",
    saldoBrl: -3.8,
    limiteMinimoBrl: 0.0,
    statusBloqueio: "BLOQUEADO_SALDO_INSUFICIENTE",
    totalCorridasPagas: 64,
    totalRecargasPixBrl: 120.0,
    atualizadoEm: Date.now(),
  },
  {
    motoristaId: "mot-4",
    motoristaNome: "Rodrigo Gonçalves",
    telefone: "(22) 99654-7890",
    veiculoPlaca: "RIO-9J33",
    veiculoModelo: "Fiat Cronos",
    saldoBrl: 120.0,
    limiteMinimoBrl: 0.0,
    statusBloqueio: "LIBERADO",
    totalCorridasPagas: 310,
    totalRecargasPixBrl: 650.0,
    atualizadoEm: Date.now(),
  },
];

export const PEDIDOS_RECARGA_INICIAIS: PedidoRecargaPix[] = [
  {
    id: "rec-801",
    motoristaId: "mot-1",
    motoristaNome: "Carlos Eduardo Silva",
    valorBrl: 50.0,
    gateway: "MERCADO_PAGO",
    status: "APROVADO",
    expiraEm: Date.now() - 3600000,
    criadoEm: Date.now() - 7200000,
    aprovadoEm: Date.now() - 7180000,
    comprovanteNota: "Aprovado via Webhook Pix",
  },
  {
    id: "rec-802",
    motoristaId: "mot-3",
    motoristaNome: "Mariana Santos",
    valorBrl: 30.0,
    gateway: "MANUAL",
    status: "PENDENTE",
    expiraEm: Date.now() + 1800000,
    criadoEm: Date.now() - 600000,
    comprovanteNota: "Aguardando confirmação manual do comprovante",
  },
];

export function carregarCarteiras(): CarteiraMotorista[] {
  if (typeof window === "undefined") return WALLETS_INICIAIS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WALLETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return WALLETS_INICIAIS;
}

export function carregarTransacoes(motoristaId?: string): TransacaoCarteira[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (raw) {
      const list: TransacaoCarteira[] = JSON.parse(raw);
      if (motoristaId) {
        return list.filter((t) => t.motoristaId === motoristaId);
      }
      return list;
    }
  } catch {}
  return [];
}

export function carregarPedidosRecarga(): PedidoRecargaPix[] {
  if (typeof window === "undefined") return PEDIDOS_RECARGA_INICIAIS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECHARGES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return PEDIDOS_RECARGA_INICIAIS;
}

let inMemoryGatewayConfig: GatewayConfig = { ...DEFAULT_GATEWAY_CONFIG };

export function carregarGatewayConfig(): GatewayConfig {
  if (typeof window === "undefined") return inMemoryGatewayConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GATEWAY);
    if (raw) {
      return { ...DEFAULT_GATEWAY_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return inMemoryGatewayConfig;
}

export function salvarGatewayConfig(config: Partial<GatewayConfig>): GatewayConfig {
  const atual = carregarGatewayConfig();
  const nova = { ...atual, ...config };
  inMemoryGatewayConfig = nova;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_GATEWAY, JSON.stringify(nova));
    window.dispatchEvent(new CustomEvent("partiu:gateway-config-updated"));
  }
  return nova;
}

/**
 * Lança um crédito ou débito na carteira do condutor e recalcula o status de bloqueio
 */
export function lancarTransacaoCarteira(dados: {
  motoristaId: string;
  tipo: TipoTransacaoCarteira;
  valorBrl: number;
  descricao: string;
  corridaId?: string;
  operadorAdmin?: string;
}): TransacaoCarteira | null {
  const carteiras = carregarCarteiras();
  const index = carteiras.findIndex((w) => w.motoristaId === dados.motoristaId);
  if (index < 0) return null;

  const carteira = carteiras[index];
  const isCredito =
    dados.tipo === "RECARGA_PIX" ||
    dados.tipo === "CREDITO_MANUAL_ADMIN" ||
    dados.tipo === "BONUS";

  const novoSaldo = isCredito
    ? Math.round((carteira.saldoBrl + dados.valorBrl) * 100) / 100
    : Math.round((carteira.saldoBrl - dados.valorBrl) * 100) / 100;

  // Atualiza status de bloqueio caso seja decorrente do saldo
  let novoStatus = carteira.statusBloqueio;
  if (novoSaldo <= carteira.limiteMinimoBrl) {
    novoStatus = "BLOQUEADO_SALDO_INSUFICIENTE";
  } else if (carteira.statusBloqueio === "BLOQUEADO_SALDO_INSUFICIENTE") {
    novoStatus = "LIBERADO";
  }

  carteiras[index] = {
    ...carteira,
    saldoBrl: novoSaldo,
    statusBloqueio: novoStatus,
    totalRecargasPixBrl: isCredito
      ? carteira.totalRecargasPixBrl + dados.valorBrl
      : carteira.totalRecargasPixBrl,
    atualizadoEm: Date.now(),
  };

  const idTransacao = `tx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const transacao: TransacaoCarteira = {
    id: idTransacao,
    motoristaId: dados.motoristaId,
    tipo: dados.tipo,
    valorBrl: dados.valorBrl,
    saldoAposBrl: novoSaldo,
    descricao: dados.descricao,
    corridaId: dados.corridaId,
    operadorAdmin: dados.operadorAdmin,
    timestamp: Date.now(),
    dataHoraFormatada: new Date().toLocaleString("pt-BR"),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_WALLETS, JSON.stringify(carteiras));

    const transacoesAtuais = carregarTransacoes();
    transacoesAtuais.unshift(transacao);
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transacoesAtuais));

    window.dispatchEvent(new CustomEvent("partiu:wallet-updated"));
  }

  return transacao;
}

/**
 * Alterna bloqueio manual administrativo de um motorista
 */
export function alternarBloqueioAdmin(motoristaId: string): CarteiraMotorista | null {
  const carteiras = carregarCarteiras();
  const index = carteiras.findIndex((w) => w.motoristaId === motoristaId);
  if (index < 0) return null;

  const w = carteiras[index];
  const novoStatus =
    w.statusBloqueio === "BLOQUEADO_ADMINISTRATIVO"
      ? w.saldoBrl > w.limiteMinimoBrl
        ? "LIBERADO"
        : "BLOQUEADO_SALDO_INSUFICIENTE"
      : "BLOQUEADO_ADMINISTRATIVO";

  carteiras[index] = {
    ...w,
    statusBloqueio: novoStatus,
    atualizadoEm: Date.now(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_WALLETS, JSON.stringify(carteiras));
    window.dispatchEvent(new CustomEvent("partiu:wallet-updated"));
  }

  return carteiras[index];
}

/**
 * Aprova uma recarga Pix e lança o crédito imediatamente na carteira
 */
export function aprovarRecargaPix(pedidoId: string): boolean {
  const pedidos = carregarPedidosRecarga();
  const index = pedidos.findIndex((p) => p.id === pedidoId);
  if (index < 0) return false;

  const pedido = pedidos[index];
  if (pedido.status === "APROVADO") return true;

  pedidos[index] = {
    ...pedido,
    status: "APROVADO",
    aprovadoEm: Date.now(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_RECHARGES, JSON.stringify(pedidos));
  }

  // Credita na carteira do motorista
  lancarTransacaoCarteira({
    motoristaId: pedido.motoristaId,
    tipo: "RECARGA_PIX",
    valorBrl: pedido.valorBrl,
    descricao: `Recarga Pix aprovada (#${pedido.id})`,
    operadorAdmin: "Conciliação Admin",
  });

  return true;
}

/**
 * Rejeita uma recarga Pix pendente
 */
export function rejeitarRecargaPix(pedidoId: string, motivo: string): boolean {
  const pedidos = carregarPedidosRecarga();
  const index = pedidos.findIndex((p) => p.id === pedidoId);
  if (index < 0) return false;

  pedidos[index] = {
    ...pedidos[index],
    status: "REJEITADO",
    comprovanteNota: `Rejeitado: ${motivo}`,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_RECHARGES, JSON.stringify(pedidos));
    window.dispatchEvent(new CustomEvent("partiu:wallet-updated"));
  }

  return true;
}

/**
 * Emite payload Pix Copia e Cola EMVCo com CRC16
 */
export function gerarPayloadPixCopiaECola(params: {
  chavePix: string;
  nomeBeneficiario: string;
  cidade: string;
  valorBrl: number;
  txid?: string;
}): string {
  const chave = params.chavePix.trim();
  const nome = params.nomeBeneficiario.trim().slice(0, 25).toUpperCase();
  const cidade = params.cidade.trim().slice(0, 15).toUpperCase();
  const valor = params.valorBrl.toFixed(2);
  const txid = (params.txid || "***").slice(0, 25);

  const formatTag = (id: string, val: string) => {
    const len = val.length.toString().padStart(2, "0");
    return `${id}${len}${val}`;
  };

  const merchantAccount = `${formatTag("00", "br.gov.bcb.pix")}${formatTag("01", chave)}`;
  const additionalData = formatTag("05", txid);

  let raw =
    formatTag("00", "01") +
    formatTag("26", merchantAccount) +
    formatTag("52", "0000") +
    formatTag("53", "986") +
    formatTag("54", valor) +
    formatTag("58", "BR") +
    formatTag("59", nome) +
    formatTag("60", cidade) +
    formatTag("62", additionalData) +
    "6304";

  // Calcula CRC16 CCITT (0xFFFF)
  let crc = 0xffff;
  for (let i = 0; i < raw.length; i++) {
    crc ^= raw.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  const crcHex = (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  return raw + crcHex;
}

