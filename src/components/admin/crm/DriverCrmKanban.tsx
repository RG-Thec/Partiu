import React, { useState, useMemo } from "react";
import {
  UserPlus,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  Clock,
  Lock,
  Phone,
  MessageCircle,
  QrCode,
  Gift,
  MoreVertical,
  Search,
  Filter,
  Car,
  Bike,
  Star,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  Plus,
  Check,
  X,
  MapPin,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  driverSubscriptionService,
  type DriverSubscriptionAccount,
  type DriverLifecycleStatus,
} from "@/lib/ecosystem/driver-subscription-service";
import { AdminPixCobrancaModal, type DriverCobrancaInfo } from "../AdminPixCobrancaModal";

export type CategoriaModal = "CARRO" | "MOTO" | "PLUS" | "MULHER";

export type EstagioCrmKanban =
  "1_lead" | "2_validacao" | "3_aprovado" | "4_ativo" | "5_alerta" | "6_inadimplente";

export interface ItemCrmCondutor {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  cnh: string;
  modal: CategoriaModal;
  veiculoModelo: string;
  veiculoPlaca: string;
  rating: number;
  totalViagens: number;
  fotoUrl?: string;
  estagio: EstagioCrmKanban;
  planoTipo: "MENSAL" | "SEMANAL" | "DIARIA" | "TRIAL" | "NENHUM";
  planoAtivo: boolean;
  diasRestantes?: number;
  diasVencido?: number;
  valorPlano?: number;
  bloqueado?: boolean;
}

export interface DriverCrmKanbanProps {
  condutoresIniciais?: ItemCrmCondutor[];
  pracaNome?: string;
  isNacional?: boolean;
  onVerDetalhes?: (condutorId: string) => void;
  onRecarregar?: () => void;
}

interface ColunaDef {
  id: EstagioCrmKanban;
  titulo: string;
  subtitulo: string;
  icone: React.ReactNode;
  corHeader: string;
  corBadge: string;
  corBorda: string;
}

const COLUNAS_KANBAN: ColunaDef[] = [
  {
    id: "1_lead",
    titulo: "1. Novos Leads",
    subtitulo: "Cadastro iniciado / Pendente dados",
    icone: <UserPlus className="h-4 w-4 text-blue-500" />,
    corHeader: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    corBadge:
      "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    corBorda: "border-blue-500",
  },
  {
    id: "2_validacao",
    titulo: "2. Em Validação",
    subtitulo: "CNH (EAR) e CRLV em análise OCR",
    icone: <FileCheck2 className="h-4 w-4 text-amber-500" />,
    corHeader: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    corBadge:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    corBorda: "border-amber-500",
  },
  {
    id: "3_aprovado",
    titulo: "3. Aprovados",
    subtitulo: "Aptos • Aguardando Trial ou 1º Pix",
    icone: <Sparkles className="h-4 w-4 text-indigo-500" />,
    corHeader: "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
    corBadge:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    corBorda: "border-indigo-500",
  },
  {
    id: "4_ativo",
    titulo: "4. Ativos & Rodando",
    subtitulo: "0% Taxa ativa • Gerando GMV",
    icone: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    corHeader: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    corBadge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    corBorda: "border-emerald-500",
  },
  {
    id: "5_alerta",
    titulo: "5. Alerta Renovação",
    subtitulo: "Vencendo em < 48h • Cobrança amiga",
    icone: <Clock className="h-4 w-4 text-amber-500" />,
    corHeader: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    corBadge:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    corBorda: "border-amber-500",
  },
  {
    id: "6_inadimplente",
    titulo: "6. Churn / Bloqueados",
    subtitulo: "Acesso travado • Reativação SaaS",
    icone: <Lock className="h-4 w-4 text-rose-500" />,
    corHeader: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    corBadge:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    corBorda: "border-rose-500",
  },
];

export function DriverCrmKanban({
  condutoresIniciais = [],
  pracaNome = "Regional",
  isNacional = false,
  onVerDetalhes,
  onRecarregar,
}: DriverCrmKanbanProps) {
  // Estado local do Pipeline de Condutores
  const [condutores, setCondutores] = useState<ItemCrmCondutor[]>(() => {
    if (condutoresIniciais.length > 0) return condutoresIniciais;

    // Se não fornecidos, sincroniza das contas do serviço de assinaturas
    const contas = driverSubscriptionService.getDriverAccounts();
    return contas.map((acc) => {
      let estagio: EstagioCrmKanban = "4_ativo";
      if (!acc.documentsApproved) {
        estagio = "2_validacao";
      } else if (acc.status === "BLOCKED" || acc.status === "EXPIRED") {
        estagio = "6_inadimplente";
      } else if (acc.daysRemaining <= 2 && acc.status === "ACTIVE") {
        estagio = "5_alerta";
      } else if (acc.status === "TRIAL") {
        estagio = "4_ativo";
      } else if (!acc.lastPaymentBrl || acc.lastPaymentBrl <= 0) {
        estagio = "3_aprovado";
      }

      return {
        id: acc.driverId,
        nome: acc.driverName,
        telefone: acc.phone,
        cidade: pracaNome,
        cnh: "CNH Ativa (EAR)",
        modal: acc.vehicleType === "MOTO" ? "MOTO" : "CARRO",
        veiculoModelo: acc.vehicleModel,
        veiculoPlaca: acc.vehiclePlate,
        rating: 4.9,
        totalViagens: acc.completedTrips || 0,
        estagio,
        planoTipo: acc.currentPlanName.includes("Mensal")
          ? "MENSAL"
          : acc.currentPlanName.includes("Semanal")
            ? "SEMANAL"
            : acc.status === "TRIAL"
              ? "TRIAL"
              : "DIARIA",
        planoAtivo: acc.status === "ACTIVE" || acc.status === "TRIAL",
        diasRestantes: acc.daysRemaining > 0 ? acc.daysRemaining : 0,
        diasVencido: acc.daysRemaining < 0 ? Math.abs(acc.daysRemaining) : 0,
        valorPlano: acc.lastPaymentBrl || 199.9,
        bloqueado: acc.status === "BLOCKED",
      };
    });
  });

  // Atualizar quando props mudarem
  React.useEffect(() => {
    if (condutoresIniciais.length > 0) {
      setCondutores(condutoresIniciais);
    }
  }, [condutoresIniciais]);

  // Filtros de Busca e Modalidade
  const [busca, setBusca] = useState("");
  const [filtroModal, setFiltroModal] = useState<"TODOS" | CategoriaModal>("TODOS");

  // Drag and Drop State
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaHover, setColunaHover] = useState<EstagioCrmKanban | null>(null);

  // Modal Pix Instantâneo
  const [modalPixAberto, setModalPixAberto] = useState(false);
  const [motoristaPix, setMotoristaPix] = useState<DriverCobrancaInfo | null>(null);

  // Modal Concessão de Cortesia Rápida
  const [modalCortesiaAberto, setModalCortesiaAberto] = useState(false);
  const [motoristaCortesia, setMotoristaCortesia] = useState<ItemCrmCondutor | null>(null);
  const [diasCortesia, setDiasCortesia] = useState(3);

  // Filtragem
  const condutoresFiltrados = useMemo(() => {
    return condutores.filter((c) => {
      if (filtroModal !== "TODOS" && c.modal !== filtroModal) return false;
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchNome = c.nome.toLowerCase().includes(termo);
        const matchPlaca = c.veiculoPlaca.toLowerCase().includes(termo);
        const matchTel = c.telefone.includes(termo);
        const matchModelo = c.veiculoModelo.toLowerCase().includes(termo);
        if (!matchNome && !matchPlaca && !matchTel && !matchModelo) return false;
      }
      return true;
    });
  }, [condutores, busca, filtroModal]);

  // Indicadores de Performance do Funil CRM
  const metricasCrm = useMemo(() => {
    const total = condutores.length;
    const leads = condutores.filter(
      (c) => c.estagio === "1_lead" || c.estagio === "2_validacao",
    ).length;
    const ativos = condutores.filter((c) => c.estagio === "4_ativo").length;
    const emRisco = condutores.filter(
      (c) => c.estagio === "5_alerta" || c.estagio === "6_inadimplente",
    ).length;
    const mrrAtivo = condutores
      .filter((c) => c.estagio === "4_ativo")
      .reduce((acc, c) => acc + (c.valorPlano || 199.9), 0);
    const taxaAtivacao = total > 0 ? Math.round((ativos / total) * 100) : 0;

    return { total, leads, ativos, emRisco, mrrAtivo, taxaAtivacao };
  }, [condutores]);

  // Função para mover condutor de estágio
  const moverCondutor = (condutorId: string, novoEstagio: EstagioCrmKanban) => {
    setCondutores((prev) =>
      prev.map((c) => {
        if (c.id !== condutorId) return c;

        // Regras de negócio ao trocar de estágio
        const atualizado = { ...c, estagio: novoEstagio };
        if (novoEstagio === "4_ativo") {
          atualizado.planoAtivo = true;
          atualizado.bloqueado = false;
          driverSubscriptionService.unblockDriverAccess(c.id);
        } else if (novoEstagio === "6_inadimplente") {
          atualizado.planoAtivo = false;
          atualizado.bloqueado = true;
          driverSubscriptionService.blockDriverAccess(
            c.id,
            "Mapeado como inadimplente via CRM Kanban",
            "Admin",
          );
        }
        return atualizado;
      }),
    );

    const estagioDef = COLUNAS_KANBAN.find((col) => col.id === novoEstagio);
    toast.success(`Condutor transferido para ${estagioDef?.titulo || "novo estágio"}!`);
    onRecarregar?.();
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setArrastandoId(id);
  };

  const handleDragOver = (e: React.DragEvent, colId: EstagioCrmKanban) => {
    e.preventDefault();
    if (colunaHover !== colId) {
      setColunaHover(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, colId: EstagioCrmKanban) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || arrastandoId;
    if (id) {
      moverCondutor(id, colId);
    }
    setArrastandoId(null);
    setColunaHover(null);
  };

  // Gerar mensagem de WhatsApp contextual
  const gerarMensagemWhatsApp = (condutor: ItemCrmCondutor): string => {
    const nomePrimeiro = condutor.nome.split(" ")[0];
    switch (condutor.estagio) {
      case "1_lead":
        return `Olá ${nomePrimeiro}! Tudo bem? Vimos que você iniciou o cadastro de condutor no PARTIU em ${pracaNome}. Falta bem pouco para você começar a rodar com 100% dos ganhos livres de taxa (0% comissão). Podemos te ajudar a finalizar seu envio da CNH?`;
      case "2_validacao":
        return `Olá ${nomePrimeiro}! Seus documentos (CNH e veículo) estão em processo de validação pela nossa esteira em ${pracaNome}. Qualquer dúvida, estamos aqui no suporte!`;
      case "3_aprovado":
        return `Parabéns ${nomePrimeiro}! Seu cadastro no PARTIU foi aprovado com sucesso! Liberamos uma degustação gratuita (Trial) para você testar a nossa tecnologia sem taxa por corrida. Bora rodar hoje?`;
      case "5_alerta":
        return `Olá ${nomePrimeiro}! Sua assinatura no PARTIU em ${pracaNome} vence em breve. Segue o código Pix para renovação da sua diária sem qualquer interrupção no seu aplicativo. Bom trabalho e boas corridas!`;
      case "6_inadimplente":
        return `Olá ${nomePrimeiro}! Sentimos sua falta na frota do PARTIU! Estamos com condições especiais de renovação para você voltar a faturar com taxa zero. Como podemos te ajudar?`;
      default:
        return `Olá ${nomePrimeiro}! Como estão as corridas hoje no PARTIU em ${pracaNome}? Conte com a nossa equipe de suporte para o que precisar.`;
    }
  };

  const abrirWhatsApp = (condutor: ItemCrmCondutor) => {
    const numerosApenas = condutor.telefone.replace(/\D/g, "");
    const ddiTel = numerosApenas.startsWith("55") ? numerosApenas : `55${numerosApenas}`;
    const texto = encodeURIComponent(gerarMensagemWhatsApp(condutor));
    window.open(`https://wa.me/${ddiTel}?text=${texto}`, "_blank", "noopener,noreferrer");
  };

  const abrirModalPix = (condutor: ItemCrmCondutor) => {
    setMotoristaPix({
      id: condutor.id,
      nome: condutor.nome,
      telefone: condutor.telefone,
      veiculo_placa: condutor.veiculoPlaca,
      veiculo_modelo: condutor.veiculoModelo,
      plano_nome:
        condutor.planoTipo === "MENSAL" ? "Mensal Ilimitado (0% Taxa)" : "Diária Pré-Paga 24h",
      plano_valor: condutor.valorPlano || (condutor.modal === "MOTO" ? 9.9 : 14.9),
      dias_vencido: condutor.diasVencido,
    });
    setModalPixAberto(true);
  };

  const confirmarCortesia = () => {
    if (!motoristaCortesia) return;
    driverSubscriptionService.grantCourtesyDays(
      motoristaCortesia.id,
      diasCortesia,
      "Concedido via CRM Kanban pelo Gestor",
      "Administrador",
    );
    moverCondutor(motoristaCortesia.id, "4_ativo");
    toast.success(
      `Cortesia de ${diasCortesia} dias concedida a ${motoristaCortesia.nome}! Acesso liberado.`,
    );
    setModalCortesiaAberto(false);
    setMotoristaCortesia(null);
  };

  return (
    <div className="w-full space-y-5">
      {/* 1. BARRA SUPERIOR DE INDICADORES DO FUNIL (PIPELINE KPIS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">Total no Funil</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {metricasCrm.total}
          </div>
          <span className="text-[10px] font-bold text-slate-400">Condutores mapeados</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-800/40 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">
              Ativos (0% Taxa)
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {metricasCrm.ativos}
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500">
            {metricasCrm.taxaAtivacao}% taxa de conversão
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-800/40 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">
              Leads & Onboarding
            </span>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400">
            {metricasCrm.leads}
          </div>
          <span className="text-[10px] font-bold text-blue-500">Em esteira de validação</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-800/40 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">
              MRR Ativo Estimado
            </span>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {metricasCrm.mrrAtivo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <span className="text-[10px] font-bold text-emerald-600">Receita SaaS recorrente</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/70 dark:border-rose-800/40 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">
              Em Risco / Churn
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {metricasCrm.emRisco}
          </div>
          <span className="text-[10px] font-bold text-rose-500">Oportunidade de retenção</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/30 shadow-2xs">
          <div className="flex items-center justify-between text-primary mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">
              Praça de Atuação
            </span>
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
            {isNacional ? "Todas as Praças" : pracaNome}
          </div>
          <span className="text-[10px] font-bold text-primary">Pipeline territorial</span>
        </div>
      </div>

      {/* 2. CONTROLES: BUSCA RÁPIDA, FILTRO POR MODAL E AÇÕES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar condutor por nome, placa, telefone ou modelo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="p-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider hidden lg:inline">
            Modal:
          </span>
          {(["TODOS", "CARRO", "MOTO", "PLUS", "MULHER"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFiltroModal(m)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                filtroModal === m
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {m === "CARRO" && <Car className="h-3 w-3" />}
              {m === "MOTO" && <Bike className="h-3 w-3" />}
              {m === "MULHER" && <span className="h-2 w-2 rounded-full bg-pink-500" />}
              {m === "PLUS" && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
              <span>{m === "TODOS" ? "Todos os Modais" : m}</span>
            </button>
          ))}

          {onRecarregar && (
            <button
              type="button"
              onClick={onRecarregar}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Recarregar dados do Kanban"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. QUADRO KANBAN — 6 COLUNAS DE CICLO DE VIDA COM DRAG & DROP NATIVO */}
      <div className="flex gap-4 overflow-x-auto pb-6 items-start custom-admin-scrollbar min-h-[640px]">
        {COLUNAS_KANBAN.map((coluna) => {
          const itensDaColuna = condutoresFiltrados.filter((c) => c.estagio === coluna.id);
          const isHover = colunaHover === coluna.id;

          return (
            <div
              key={coluna.id}
              onDragOver={(e) => handleDragOver(e, coluna.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, coluna.id)}
              className={`w-[320px] sm:w-[340px] shrink-0 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border transition-all duration-200 flex flex-col max-h-[calc(100vh-250px)] min-h-[560px] shadow-sm ${
                isHover
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.01]"
                  : "border-slate-200/90 dark:border-slate-800"
              }`}
            >
              {/* Header da Coluna */}
              <div
                className={`p-3.5 border-b rounded-t-2xl flex flex-col gap-1 transition-colors ${coluna.corHeader}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {coluna.icone}
                    <h3 className="text-xs sm:text-sm font-black tracking-tight">
                      {coluna.titulo}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black border shadow-2xs ${coluna.corBadge}`}
                  >
                    {itensDaColuna.length}
                  </span>
                </div>
                <p className="text-[10px] opacity-80 font-medium leading-tight">
                  {coluna.subtitulo}
                </p>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="p-3 overflow-y-auto space-y-3 flex-1 custom-admin-scrollbar">
                {itensDaColuna.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs font-semibold text-center p-4">
                    <span>Nenhum condutor nesta etapa</span>
                    <span className="text-[10px] text-slate-400 mt-1">Arraste um card para cá</span>
                  </div>
                ) : (
                  itensDaColuna.map((condutor) => {
                    const isArrastando = arrastandoId === condutor.id;

                    return (
                      <div
                        key={condutor.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, condutor.id)}
                        className={`group bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-3.5 rounded-xl shadow-2xs transition-all duration-150 cursor-grab active:cursor-grabbing flex flex-col gap-2.5 relative ${
                          isArrastando
                            ? "opacity-40 scale-95"
                            : "hover:-translate-y-0.5 hover:shadow-xs"
                        }`}
                      >
                        {/* Topo do Card: Avatar, Nome, Modal e Placa */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {condutor.fotoUrl ? (
                              <img
                                src={condutor.fotoUrl}
                                alt={condutor.nome}
                                className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 border border-slate-700">
                                {condutor.nome.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                {condutor.nome}
                              </h4>
                              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-mono">
                                <span>{condutor.veiculoPlaca}</span>
                                <span>•</span>
                                <span className="font-sans">{condutor.veiculoModelo}</span>
                              </p>
                            </div>
                          </div>

                          {/* Badge de Modalidade (Carro / Moto) */}
                          <div className="shrink-0 flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 flex items-center gap-1">
                              {condutor.modal === "MOTO" ? (
                                <Bike className="h-2.5 w-2.5" />
                              ) : (
                                <Car className="h-2.5 w-2.5" />
                              )}
                              <span>{condutor.modal}</span>
                            </span>
                          </div>
                        </div>

                        {/* Metadados: Avaliação, Plano SaaS e Status */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="font-bold text-slate-900 dark:text-white">
                              {condutor.rating.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({condutor.totalViagens} corridas)
                            </span>
                          </div>

                          {/* Pill de Status do Plano */}
                          {condutor.planoAtivo ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {condutor.planoTipo === "TRIAL" ? "Trial Grátis" : "0% Taxa Ativo"}
                            </span>
                          ) : condutor.bloqueado ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                              <Lock className="h-2.5 w-2.5" />
                              Bloqueado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Aguardando
                            </span>
                          )}
                        </div>

                        {/* Detalhe de Vigência ou Alerta */}
                        {condutor.diasRestantes !== undefined && condutor.diasRestantes > 0 && (
                          <div className="text-[10px] text-slate-500 flex items-center justify-between">
                            <span>Vigência da diária/plano:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {condutor.diasRestantes} dias restantes
                            </span>
                          </div>
                        )}
                        {condutor.diasVencido !== undefined && condutor.diasVencido > 0 && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20 px-2 py-0.5 rounded">
                            <span>Vencido há:</span>
                            <span>{condutor.diasVencido} dias</span>
                          </div>
                        )}

                        {/* BARRA DE AÇÕES RÁPIDAS (WHATSAPP, PIX, CORTESIA, TROCAR ESTÁGIO) */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
                          {/* Botão WhatsApp Direto */}
                          <button
                            type="button"
                            onClick={() => abrirWhatsApp(condutor)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-800 transition active:scale-95 cursor-pointer"
                            title="Conversar no WhatsApp com mensagem de engajamento do estágio"
                          >
                            <MessageCircle className="h-3 w-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Botão Cobrança Pix Instantânea */}
                          <button
                            type="button"
                            onClick={() => abrirModalPix(condutor)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 text-[10px] font-black border border-amber-200 dark:border-amber-800 transition active:scale-95 cursor-pointer"
                            title="Gerar cobrança Pix com QR Code dinâmico"
                          >
                            <QrCode className="h-3 w-3 text-amber-600" />
                            <span>Cobrar Pix</span>
                          </button>

                          {/* Conceder Cortesia Rápida */}
                          <button
                            type="button"
                            onClick={() => {
                              setMotoristaCortesia(condutor);
                              setModalCortesiaAberto(true);
                            }}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                            title="Conceder cortesia de dias de acesso"
                          >
                            <Gift className="h-3 w-3" />
                          </button>

                          {/* Seletor Rápido de Estágio (Alternativa para Mobile / Touch) */}
                          <select
                            value={condutor.estagio}
                            onChange={(e) =>
                              moverCondutor(condutor.id, e.target.value as EstagioCrmKanban)
                            }
                            className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded px-1.5 py-1 border border-slate-200 dark:border-slate-700 outline-none cursor-pointer max-w-[85px] truncate"
                            title="Mover estágio manualmente"
                          >
                            {COLUNAS_KANBAN.map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.titulo.replace(/^\d+\.\s*/, "")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE COBRANÇA PIX INSTANTÂNEA */}
      {modalPixAberto && motoristaPix && (
        <AdminPixCobrancaModal
          isOpen={modalPixAberto}
          onClose={() => {
            setModalPixAberto(false);
            setMotoristaPix(null);
          }}
          driver={motoristaPix}
          pracaNome={pracaNome}
          onSuccess={() => {
            if (motoristaPix.id) {
              moverCondutor(motoristaPix.id, "4_ativo");
            }
            onRecarregar?.();
          }}
        />
      )}

      {/* MODAL CONCESSÃO DE CORTESIA RÁPIDA */}
      {modalCortesiaAberto && motoristaCortesia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Conceder Cortesia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalCortesiaAberto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Liberar acesso temporário com 0% de taxa para{" "}
              <strong>{motoristaCortesia.nome}</strong> sem necessidade de pagamento Pix imediato.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Período de Cortesia:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 7, 30].map((dias) => (
                  <button
                    key={dias}
                    type="button"
                    onClick={() => setDiasCortesia(dias)}
                    className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                      diasCortesia === dias
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {dias} {dias === 1 ? "dia" : "dias"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalCortesiaAberto(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarCortesia}
                className="px-4 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
              >
                Liberar {diasCortesia} Dias
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
