import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Layers,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Plus,
  Edit2,
  Copy,
  Check,
  X,
  RefreshCw,
  DollarSign,
  PieChart,
  Sliders,
  Users,
  Calendar,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  QrCode,
  FileSpreadsheet,
  Save,
  Wallet,
  Lock,
  Unlock,
  Search,
  Clock,
  UserCheck,
  UserX,
  Gift,
} from "lucide-react";
import {
  type PedidoRecargaPix,
  type GatewayConfig,
  carregarPedidosRecarga,
  carregarGatewayConfig,
  salvarGatewayConfig,
  aprovarRecargaPix,
  rejeitarRecargaPix,
} from "@/lib/driver-wallet-service";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";
import {
  subscriptionEngine,
  revenueDashboardEngine,
  type DriverPlan,
  type PlatformRevenueMetrics,
} from "@/lib/revenue";
import { RealQrCodePix } from "@/components/common/RealQrCodePix";
import { appSettingsService, type AppSettings } from "@/lib/ecosystem/app-settings-service";
import {
  driverSubscriptionService,
  type DriverSubscriptionRecord,
  type DriverSubscriptionAccount,
  type DriverLifecycleStatus,
  type ExecutiveSaaSMetrics,
} from "@/lib/ecosystem/driver-subscription-service";
import { computePixCrc16 } from "@/services/payment/PaymentProviderAdapter";

export const Route = createFileRoute("/app/admin/monetizacao")({
  head: () => ({
    meta: [
      { title: "Monetização & Planos SaaS | PARTIU Admin" },
      {
        name: "description",
        content:
          "Centro Executivo de Monetização SaaS: gestão de planos de assinatura, ciclo de vida dos motoristas, taxa zero por corrida e faturamento recorrente.",
      },
    ],
  }),
  component: AdminMonetizacaoPage,
});

type AbaMonetizacao = "dashboard" | "ciclo_vida" | "planos" | "gateways_pix";

export function AdminMonetizacaoPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaMonetizacao>("ciclo_vida");
  const [appSettings, setAppSettings] = useState<AppSettings>(() => appSettingsService.getSettings());
  const [diariaCarroInput, setDiariaCarroInput] = useState(() => appSettings.daily_fee_car.toFixed(2));
  const [diariaMotoInput, setDiariaMotoInput] = useState(() => appSettings.daily_fee_moto.toFixed(2));

  // Dados das Assinaturas e Contas
  const [executiveMetrics, setExecutiveMetrics] = useState<ExecutiveSaaSMetrics>(() =>
    driverSubscriptionService.getExecutiveSaaSMetrics()
  );
  const [driverAccounts, setDriverAccounts] = useState<DriverSubscriptionAccount[]>(() =>
    driverSubscriptionService.getDriverAccounts()
  );
  const [subscriptionsList, setSubscriptionsList] = useState<DriverSubscriptionRecord[]>(() =>
    driverSubscriptionService.getAllSubscriptions()
  );
  const [planos, setPlanos] = useState<DriverPlan[]>(() =>
    subscriptionEngine.getAllPlans(true)
  );
  const [metrics, setMetrics] = useState<PlatformRevenueMetrics>(() =>
    revenueDashboardEngine.calculateMetrics()
  );

  // Gateways Pix e Conciliação
  const [pedidosRecarga, setPedidosRecarga] = useState<PedidoRecargaPix[]>(() => carregarPedidosRecarga());
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig>(() => carregarGatewayConfig());

  // Filtros de busca no ciclo de vida
  const [buscaMotorista, setBuscaMotorista] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | DriverLifecycleStatus | "EXPIRING_SOON">("TODOS");

  // Modais de Ações de Gestão
  const [modalCortesiaAberto, setModalCortesiaAberto] = useState(false);
  const [modalRenovacaoAberto, setModalRenovacaoAberto] = useState(false);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [modalPlanoAberto, setModalPlanoAberto] = useState(false);
  const [modalPixAvulsoAberto, setModalPixAvulsoAberto] = useState(false);

  // Estados dos formulários de modais
  const [contaSelecionada, setContaSelecionada] = useState<DriverSubscriptionAccount | null>(null);
  const [diasCortesiaInput, setDiasCortesiaInput] = useState(7);
  const [motivoCortesiaInput, setMotivoCortesiaInput] = useState("Bonificação de fidelidade e incentivo operacional");

  const [planoRenovacaoNome, setPlanoRenovacaoNome] = useState("Mensal Ilimitado (Zero Taxa)");
  const [diasRenovacaoInput, setDiasRenovacaoInput] = useState(30);
  const [valorRenovacaoInput, setValorRenovacaoInput] = useState("199.90");

  const [motivoBloqueioInput, setMotivoBloqueioInput] = useState("Inadimplência de mensalidade após tolerância");

  const [planoEmEdicao, setPlanoEmEdicao] = useState<Partial<DriverPlan> | null>(null);

  const [pixMotoristaNome, setPixMotoristaNome] = useState("");
  const [pixValorBrl, setPixValorBrl] = useState("199.90");
  const [pixGeradoPayload, setPixGeradoPayload] = useState<string | null>(null);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function mostrarToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3800);
  }

  function recarregarDados() {
    setAppSettings(appSettingsService.getSettings());
    setExecutiveMetrics(driverSubscriptionService.getExecutiveSaaSMetrics());
    setDriverAccounts(driverSubscriptionService.getDriverAccounts());
    setSubscriptionsList(driverSubscriptionService.getAllSubscriptions());
    setPlanos(subscriptionEngine.getAllPlans(true));
    setMetrics(revenueDashboardEngine.calculateMetrics());
    setPedidosRecarga(carregarPedidosRecarga());
    setGatewayConfig(carregarGatewayConfig());
  }

  useEffect(() => {
    const unsub = driverSubscriptionService.subscribeAccounts((accs) => {
      setDriverAccounts(accs);
      setExecutiveMetrics(driverSubscriptionService.getExecutiveSaaSMetrics());
    });
    return () => unsub();
  }, []);

  // Filtro de Contas de Motoristas
  const contasFiltradas = useMemo(() => {
    return driverAccounts.filter((acc) => {
      const matchBusca =
        !buscaMotorista.trim() ||
        acc.driverName.toLowerCase().includes(buscaMotorista.toLowerCase()) ||
        acc.phone.includes(buscaMotorista) ||
        acc.vehicleModel.toLowerCase().includes(buscaMotorista.toLowerCase()) ||
        acc.vehiclePlate.toLowerCase().includes(buscaMotorista.toLowerCase());

      if (!matchBusca) return false;

      if (filtroStatus === "TODOS") return true;
      if (filtroStatus === "EXPIRING_SOON") {
        return (acc.status === "ACTIVE" || acc.status === "TRIAL") && acc.daysRemaining <= 7;
      }
      return acc.status === filtroStatus;
    });
  }, [driverAccounts, buscaMotorista, filtroStatus]);

  // Ações de Gestão de Assinatura
  function handleAbrirCortesia(acc: DriverSubscriptionAccount) {
    setContaSelecionada(acc);
    setDiasCortesiaInput(7);
    setMotivoCortesiaInput("Bonificação de fidelidade e incentivo operacional");
    setModalCortesiaAberto(true);
  }

  function handleConfirmarCortesia(e: React.FormEvent) {
    e.preventDefault();
    if (!contaSelecionada) return;
    const res = driverSubscriptionService.grantCourtesyDays(
      contaSelecionada.driverId,
      Number(diasCortesiaInput),
      motivoCortesiaInput,
      "Super Admin"
    );
    if (res) {
      mostrarToast(`Cortesia de ${diasCortesiaInput} dias concedida a ${res.driverName}! Acesso liberado no app.`);
      setModalCortesiaAberto(false);
      recarregarDados();
    }
  }

  function handleAbrirRenovacao(acc: DriverSubscriptionAccount) {
    setContaSelecionada(acc);
    setPlanoRenovacaoNome(acc.currentPlanName || "Mensal Ilimitado (Zero Taxa)");
    setDiasRenovacaoInput(30);
    setValorRenovacaoInput(acc.lastPaymentBrl > 0 ? acc.lastPaymentBrl.toFixed(2) : "199.90");
    setModalRenovacaoAberto(true);
  }

  function handleConfirmarRenovacao(e: React.FormEvent) {
    e.preventDefault();
    if (!contaSelecionada) return;
    const valor = parseFloat(valorRenovacaoInput.replace(",", "."));
    const res = driverSubscriptionService.renewManually(
      contaSelecionada.driverId,
      planoRenovacaoNome,
      Number(diasRenovacaoInput),
      isNaN(valor) ? 0 : valor,
      "Super Admin"
    );
    if (res) {
      mostrarToast(`Assinatura de ${res.driverName} renovada manualmente por ${diasRenovacaoInput} dias!`);
      setModalRenovacaoAberto(false);
      recarregarDados();
    }
  }

  function handleAbrirBloqueio(acc: DriverSubscriptionAccount) {
    setContaSelecionada(acc);
    setMotivoBloqueioInput("Inadimplência de mensalidade após tolerância");
    setModalBloqueioAberto(true);
  }

  function handleConfirmarBloqueio(e: React.FormEvent) {
    e.preventDefault();
    if (!contaSelecionada) return;
    const res = driverSubscriptionService.blockDriverAccess(
      contaSelecionada.driverId,
      motivoBloqueioInput,
      "Super Admin"
    );
    if (res) {
      mostrarToast(`Acesso de ${res.driverName} bloqueado no app.`);
      setModalBloqueioAberto(false);
      recarregarDados();
    }
  }

  function handleDesbloquearAcesso(acc: DriverSubscriptionAccount) {
    const res = driverSubscriptionService.unblockDriverAccess(acc.driverId);
    if (res) {
      mostrarToast(`Acesso de ${res.driverName} desbloqueado.`);
      recarregarDados();
    }
  }

  function handleAbrirPixAvulso(acc?: DriverSubscriptionAccount) {
    const nome = acc ? acc.driverName : "Motorista Parceiro";
    const valor = acc && acc.lastPaymentBrl > 0 ? acc.lastPaymentBrl.toFixed(2) : "199.90";
    setPixMotoristaNome(nome);
    setPixValorBrl(valor);

    const rawEmv = `00020126580014br.gov.bcb.pix0136partiu-recuperacao-finops-001520400005303986540${valor.replace(".", "")}5802BR5915PARTIU BRASIL6009SAO PAULO62070503***6304`;
    const payload = `${rawEmv}${computePixCrc16(rawEmv)}`;
    setPixGeradoPayload(payload);
    setModalPixAvulsoAberto(true);
  }

  function handleGerarPix(e: React.FormEvent) {
    e.preventDefault();
    const rawEmv = `00020126580014br.gov.bcb.pix0136partiu-recuperacao-finops-001520400005303986540${pixValorBrl.replace(".", "")}5802BR5915PARTIU BRASIL6009SAO PAULO62070503***6304`;
    const payload = `${rawEmv}${computePixCrc16(rawEmv)}`;
    setPixGeradoPayload(payload);
    mostrarToast("Novo QR Code PIX de assinatura gerado.");
  }

  // Ações de Planos
  function handleAbrirCriarPlano() {
    setPlanoEmEdicao({
      name: "",
      description: "",
      monthlyFeeBrl: 199.90,
      dailyFeeBrl: 14.90,
      weeklyFeeBrl: 69.90,
      commissionPercent: 0.0,
      billingCycle: "MONTHLY",
      features: ["0% Taxa por Corrida", "100% Repasse Líquido D+0", "Acesso Total ao App"],
      badgeColor: "bg-emerald-600",
      active: true,
      isPopular: false,
    });
    setModalPlanoAberto(true);
  }

  function handleAbrirEditarPlano(plano: DriverPlan) {
    setPlanoEmEdicao({ ...plano, commissionPercent: 0.0 });
    setModalPlanoAberto(true);
  }

  function handleSalvarPlano(e: React.FormEvent) {
    e.preventDefault();
    if (!planoEmEdicao || !planoEmEdicao.name) return;

    if (planoEmEdicao.id) {
      subscriptionEngine.updatePlan(planoEmEdicao.id, {
        name: planoEmEdicao.name,
        description: planoEmEdicao.description || "",
        monthlyFeeBrl: Number(planoEmEdicao.monthlyFeeBrl) || 0,
        dailyFeeBrl: Number(planoEmEdicao.dailyFeeBrl) || 0,
        weeklyFeeBrl: Number(planoEmEdicao.weeklyFeeBrl) || 0,
        billingCycle: planoEmEdicao.billingCycle || "MONTHLY",
        commissionPercent: 0.0, // TRAVADO EM 0%
        features: Array.isArray(planoEmEdicao.features)
          ? planoEmEdicao.features
          : String(planoEmEdicao.features).split("\n").filter(Boolean),
        badgeColor: planoEmEdicao.badgeColor || "bg-emerald-600",
        active: planoEmEdicao.active ?? true,
        isPopular: planoEmEdicao.isPopular ?? false,
      });
      mostrarToast(`Plano "${planoEmEdicao.name}" atualizado com sucesso!`);
    } else {
      subscriptionEngine.createPlan({
        name: planoEmEdicao.name,
        description: planoEmEdicao.description || "",
        monthlyFeeBrl: Number(planoEmEdicao.monthlyFeeBrl) || 0,
        dailyFeeBrl: Number(planoEmEdicao.dailyFeeBrl) || 0,
        weeklyFeeBrl: Number(planoEmEdicao.weeklyFeeBrl) || 0,
        billingCycle: planoEmEdicao.billingCycle || "MONTHLY",
        commissionPercent: 0.0, // TRAVADO EM 0%
        features: Array.isArray(planoEmEdicao.features)
          ? planoEmEdicao.features
          : String(planoEmEdicao.features).split("\n").filter(Boolean),
        badgeColor: planoEmEdicao.badgeColor || "bg-emerald-600",
      });
      mostrarToast(`Novo plano "${planoEmEdicao.name}" criado com sucesso!`);
    }

    setModalPlanoAberto(false);
    recarregarDados();
  }

  function handleDuplicarPlano(planoId: string) {
    const novo = subscriptionEngine.duplicatePlan(planoId);
    mostrarToast(`Plano duplicado como "${novo.name}".`);
    recarregarDados();
  }

  function handleToggleStatusPlano(planoId: string) {
    const atualizado = subscriptionEngine.togglePlanStatus(planoId);
    mostrarToast(`Plano "${atualizado.name}" agora está ${atualizado.active ? "ATIVO" : "INATIVO"}.`);
    recarregarDados();
  }

  // Ações de Diárias Rápidas
  async function handleSalvarDiariasSaaS(e: React.FormEvent) {
    e.preventDefault();
    const carVal = parseFloat(diariaCarroInput.replace(",", "."));
    const motoVal = parseFloat(diariaMotoInput.replace(",", "."));

    if (isNaN(carVal) || carVal <= 0 || isNaN(motoVal) || motoVal <= 0) {
      mostrarToast("Insira valores válidos para as diárias de Carro e Moto.");
      return;
    }

    const updated = await appSettingsService.updateSettings({
      daily_fee_car: carVal,
      daily_fee_moto: motoVal,
    });
    setAppSettings(updated);
    mostrarToast("Diárias SaaS atualizadas com sucesso! Refletidas no app do motorista.");
  }

  // Gateways Pix
  const handleSalvarGateway = (e: React.FormEvent) => {
    e.preventDefault();
    salvarGatewayConfig(gatewayConfig);
    mostrarToast("Configurações do Gateway Pix salvas com sucesso!");
  };

  const handleAprovarRecarga = (pedidoId: string) => {
    aprovarRecargaPix(pedidoId);
    setPedidosRecarga(carregarPedidosRecarga());
    mostrarToast(`Assinatura Pix #${pedidoId} aprovada e liberada no app!`);
  };

  const handleRejeitarRecarga = (pedidoId: string) => {
    rejeitarRecargaPix(pedidoId, "Comprovante não identificado");
    setPedidosRecarga(carregarPedidosRecarga());
    mostrarToast(`Fatura Pix #${pedidoId} rejeitada.`);
  };

  return (
    <GuardiaoAcesso permissao="financial:configure_fees" somenteOwner={true}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-900 animate-in fade-in duration-200">
        {/* TOAST FLUTUANTE */}
        {toastMsg && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-slate-700 animate-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* CABEÇALHO EXECUTIVO NORTH STAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                0% TAKE RATE • SAAS PURO
              </span>
              <span className="text-xs font-bold text-slate-500">Governança de Assinaturas & Recorrência</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
              Monetização &amp; Planos SaaS (Taxa Zero)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              O motorista fica com 100% do valor da corrida. A receita da plataforma provém exclusivamente
              das assinaturas periódicas (diárias, semanais e mensais) pagas pelos parceiros.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={recarregarDados}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Recarregar Indicadores"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              type="button"
              onClick={() => handleAbrirPixAvulso()}
              className="px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Cobrança Pix</span>
            </button>
            <button
              type="button"
              onClick={handleAbrirCriarPlano}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Plano</span>
            </button>
          </div>
        </div>

        {/* KPI CARDS EXECUTIVOS FOCADOS EM ASSINATURA */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* MRR */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              MRR (Recorrência)
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-950">
              {executiveMetrics.mrrBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              ARR {executiveMetrics.arrBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          {/* ASSINANTES ATIVOS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Assinantes Ativos
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {executiveMetrics.activeSubscribersCount}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              Habilitados no Despacho
            </span>
          </div>

          {/* VENCENDO EM 7 DIAS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Vencendo em 7 Dias
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600">
              {executiveMetrics.expiringIn7DaysCount}
            </div>
            <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Alerta Pró-Renovação
            </span>
          </div>

          {/* INADIMPLENTES / BLOQUEADOS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Inadimplentes / Bloqueados
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-600">
              {executiveMetrics.defaultingOrBlockedCount}
            </div>
            <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Trava Operacional Ativa
            </span>
          </div>

          {/* GMV TOTAL (IMPACTO TAXA ZERO) */}
          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              GMV 100% Repassado
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-800">
              {executiveMetrics.totalGmvProcessedBrl.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <span className="text-[10px] text-emerald-700 font-black block">
              Taxa Retida: R$ 0,00 (0,0%)
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 scrollbar-none">
          {[
            { id: "ciclo_vida", label: "Ciclo de Vida dos Motoristas", icon: Users },
            { id: "planos", label: "Planos & Diárias SaaS", icon: Layers },
            { id: "dashboard", label: "Visão Executiva & MRR", icon: PieChart },
            { id: "gateways_pix", label: "Gateways Pix & Conciliação", icon: QrCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = abaAtiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAbaAtiva(tab.id as AbaMonetizacao)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* ABA 1: CICLO DE VIDA DAS ASSINATURAS DOS MOTORISTAS                 */}
        {/* =================================================================== */}
        {abaAtiva === "ciclo_vida" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Header com Regra de Negócio de Despacho */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Trava Automática de Despacho Ativa
                </div>
                <h2 className="text-xl font-black text-white">
                  Gestão do Ciclo de Vida das Assinaturas
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Motoristas com assinatura ativa ou em período de teste recebem chamados instantaneamente no app.
                  Condutores inadimplentes são excluídos da esteira de despacho até a regularização via Pix.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFiltroStatus("EXPIRING_SOON")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    filtroStatus === "EXPIRING_SOON"
                      ? "bg-amber-400 text-slate-950 border-amber-400"
                      : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  Vencendo (7d)
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatus("BLOCKED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    filtroStatus === "BLOCKED"
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  Bloqueados
                </button>
              </div>
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buscaMotorista}
                    onChange={(e) => setBuscaMotorista(e.target.value)}
                    placeholder="Buscar por motorista, telefone, veículo ou placa..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                  {[
                    { id: "TODOS", label: "Todos" },
                    { id: "ACTIVE", label: "Ativos" },
                    { id: "TRIAL", label: "Em Teste (Trial)" },
                    { id: "GRACE_PERIOD", label: "Em Carência" },
                    { id: "BLOCKED", label: "Bloqueados" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFiltroStatus(f.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        filtroStatus === f.id
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabela de Contas e Status */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-2">Motorista</th>
                      <th className="py-3 px-2">Veículo / Placa</th>
                      <th className="py-3 px-2">Plano Atual</th>
                      <th className="py-3 px-2">Status da Conta</th>
                      <th className="py-3 px-2">Vencimento</th>
                      <th className="py-3 px-2">Última Mensalidade</th>
                      <th className="py-3 px-2 text-right">Ações de Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                          Nenhum motorista encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      contasFiltradas.map((acc) => {
                        return (
                          <tr key={acc.driverId} className="hover:bg-slate-50/70 transition">
                            {/* Motorista */}
                            <td className="py-3 px-2">
                              <div className="font-bold text-slate-950">{acc.driverName}</div>
                              <div className="text-[11px] text-slate-500">{acc.phone}</div>
                            </td>

                            {/* Veículo */}
                            <td className="py-3 px-2">
                              <div className="font-semibold text-slate-800">{acc.vehicleModel}</div>
                              <div className="font-mono text-[10px] text-slate-500 uppercase">{acc.vehiclePlate}</div>
                            </td>

                            {/* Plano Atual */}
                            <td className="py-3 px-2">
                              <span className="font-bold text-slate-900 block">{acc.currentPlanName}</span>
                              <span className="text-[10px] font-black text-emerald-700">0% Comissão (100% Repasse)</span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-2">
                              {acc.status === "ACTIVE" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  Assinatura Ativa
                                </span>
                              )}
                              {acc.status === "TRIAL" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                                  <Gift className="w-3.5 h-3.5 text-blue-600" />
                                  Período de Teste
                                </span>
                              )}
                              {acc.status === "GRACE_PERIOD" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  Em Carência (Aguardando Pix)
                                </span>
                              )}
                              {acc.status === "BLOCKED" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                                  Bloqueada (Inadimplente)
                                </span>
                              )}
                              {acc.status === "EXPIRED" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800">
                                  <UserX className="w-3.5 h-3.5 text-slate-600" />
                                  Vencida
                                </span>
                              )}
                            </td>

                            {/* Vencimento */}
                            <td className="py-3 px-2">
                              <div className="font-semibold text-slate-900">
                                {new Date(acc.expiresAt).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                })}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {acc.daysRemaining > 0
                                  ? `${acc.daysRemaining} dias restantes`
                                  : "Expirada"}
                              </div>
                            </td>

                            {/* Último Pagamento */}
                            <td className="py-3 px-2">
                              <div className="font-black text-slate-950">
                                {acc.lastPaymentBrl > 0
                                  ? acc.lastPaymentBrl.toLocaleString("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    })
                                  : "Grátis (Trial)"}
                              </div>
                              <div className="font-mono text-[9px] text-slate-400 truncate max-w-[110px]">
                                {acc.lastPaymentTxId}
                              </div>
                            </td>

                            {/* Ações */}
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Cortesia */}
                                <button
                                  type="button"
                                  onClick={() => handleAbrirCortesia(acc)}
                                  title="Conceder Dias de Cortesia (+)"
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                                >
                                  <Gift className="w-3.5 h-3.5" />
                                </button>

                                {/* Renovar */}
                                <button
                                  type="button"
                                  onClick={() => handleAbrirRenovacao(acc)}
                                  title="Renovar Manualmente"
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>

                                {/* Cobrança Pix */}
                                <button
                                  type="button"
                                  onClick={() => handleAbrirPixAvulso(acc)}
                                  title="Gerar Cobrança Pix Imediata"
                                  className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition cursor-pointer"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>

                                {/* Bloquear / Desbloquear */}
                                {acc.status === "BLOCKED" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDesbloquearAcesso(acc)}
                                    title="Desbloquear Acesso"
                                    className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition cursor-pointer"
                                  >
                                    <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirBloqueio(acc)}
                                    title="Bloquear Acesso Manualmente"
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 2: CENTRAL DE PLANOS DE ACESSO SAAS & DIÁRIAS                   */}
        {/* =================================================================== */}
        {abaAtiva === "planos" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Configurador Rápido de Valores de Diária */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Tarifas Rápidas de Acesso por Diária (24h)
                </h3>
                <p className="text-xs text-slate-500">
                  Valores sincronizados instantaneamente no Supabase (<code>app_settings</code>) e cobrados via Pix para liberação de 24 horas no app.
                </p>
              </div>

              <form onSubmit={handleSalvarDiariasSaaS} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">
                    Diária Carro (R$ / 24h):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      min="1.00"
                      value={diariaCarroInput}
                      onChange={(e) => setDiariaCarroInput(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Valor atual: R$ {appSettings.daily_fee_car.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">
                    Diária Moto (R$ / 24h):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      min="1.00"
                      value={diariaMotoInput}
                      onChange={(e) => setDiariaMotoInput(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Valor atual: R$ {appSettings.daily_fee_moto.toFixed(2)}
                  </span>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer h-[42px]"
                  >
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>Salvar Tarifas de Diária</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Catálogo de Planos Periódicos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-950">
                    Planos de Acesso Recorrentes da Frota
                  </h2>
                  <p className="text-xs text-slate-500">
                    Todos os planos operam com 0% de comissão retida e 100% de repasse líquido ao condutor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {planos.map((plano) => (
                  <div
                    key={plano.id}
                    className={`p-5 rounded-3xl border transition flex flex-col justify-between ${
                      plano.active
                        ? "bg-white border-slate-200 shadow-xs hover:border-slate-300"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${plano.badgeColor || "bg-emerald-600"}`} />
                          <h3 className="text-base font-black text-slate-950">{plano.name}</h3>
                        </div>
                        {plano.isPopular && (
                          <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-full">
                            Mais Popular
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{plano.description}</p>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-slate-500">Mensalidade:</span>
                          <span className="text-base font-black text-slate-950">
                            {plano.monthlyFeeBrl === 0
                              ? "R$ 0,00"
                              : plano.monthlyFeeBrl.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-slate-500">Taxa p/ Corrida:</span>
                          <span className="text-sm font-black text-emerald-700">
                            0,0% (Taxa Zero)
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline pt-1 border-t border-slate-200/60">
                          <span className="text-[10px] text-slate-400">Ciclo Base:</span>
                          <span className="text-[10px] font-bold text-slate-700">
                            {plano.billingCycle || "MONTHLY"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Benefícios Inclusos:
                        </span>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {plano.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="text-emerald-600 text-xs font-bold">✓</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatusPlano(plano.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          plano.active
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                      >
                        {plano.active ? "Desativar" : "Ativar"}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicarPlano(plano.id)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                          title="Duplicar Plano"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarPlano(plano)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 3: DASHBOARD FINANCEIRO EXECUTIVO SAAS                          */}
        {/* =================================================================== */}
        {abaAtiva === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Grid Detalhado de Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">GMV Total dos Condutores</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-950">
                  {executiveMetrics.totalGmvProcessedBrl.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <span className="text-[11px] text-emerald-700 font-bold block">
                  100% Repassado Líquido D+0 aos Motoristas
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">Comissões por Corrida</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  R$ 0,00 (0,0%)
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Zero dedução fracionada sobre viagens
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">Receita de Mensalidades (MRR)</span>
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-indigo-700">
                  {executiveMetrics.mrrBrl.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Faturamento exclusivamente SaaS
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">Economia Gerada p/ Frota</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  {executiveMetrics.totalSavingsForFleetBrl.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <span className="text-[11px] text-emerald-800 font-bold block">
                  Preservado no bolso dos parceiros vs apps tradicionais
                </span>
              </div>
            </div>

            {/* Health Metrics (LTV, CAC, Churn, Taxa de Renovação) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-950">
                  Indicadores de Saúde SaaS da Frota
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Economia de Escala Sustentável
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Driver LTV
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {metrics.driverLtvBrl.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Driver CAC
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {metrics.driverCacBrl.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    Taxa de Renovação Pix
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    {executiveMetrics.renewalRatePercent}%
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Churn Mensal
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {executiveMetrics.churnRatePercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Últimas Liquidações Pix */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-950">
                  Assinaturas e Diárias Liquidadas Recentemente
                </h3>
                <span className="text-xs text-slate-500 font-bold">
                  {subscriptionsList.length} registros
                </span>
              </div>

              {subscriptionsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  Nenhuma liquidação registrada recentemente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-black uppercase text-slate-400">
                        <th className="pb-3">Motorista ID</th>
                        <th className="pb-3">Veículo</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Valor Pago</th>
                        <th className="pb-3">Início</th>
                        <th className="pb-3">Expiração</th>
                        <th className="pb-3">TXID Pix</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {subscriptionsList.slice(0, 10).map((sub) => {
                        const isExpired = new Date(sub.expires_at).getTime() < Date.now();
                        return (
                          <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 font-mono font-bold text-slate-900">{sub.driver_id}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                                {sub.vehicle_type}
                              </span>
                            </td>
                            <td className="py-3">
                              {sub.status === "ACTIVE" && !isExpired ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Ativa
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Expirada
                                </span>
                              )}
                            </td>
                            <td className="py-3 font-bold text-slate-900">
                              R$ {sub.amount_paid.toFixed(2).replace(".", ",")}
                            </td>
                            <td className="py-3 text-slate-500">
                              {new Date(sub.starts_at).toLocaleDateString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3 text-slate-500">
                              {new Date(sub.expires_at).toLocaleDateString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3 font-mono text-[10px] text-slate-400">
                              {sub.pix_txid || "---"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 4: GATEWAYS PIX & CONCILIAÇÃO BANCÁRIA                          */}
        {/* =================================================================== */}
        {abaAtiva === "gateways_pix" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Formulário do Gateway */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    Parâmetros do Gateway Pix
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                    Configuração Ativa
                  </span>
                </div>

                <form onSubmit={handleSalvarGateway} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Provedor Ativo
                    </label>
                    <select
                      value={gatewayConfig.gatewayAtivo}
                      onChange={(e) =>
                        setGatewayConfig((prev) => ({
                          ...prev,
                          gatewayAtivo: e.target.value as GatewayConfig["gatewayAtivo"],
                        }))
                      }
                      className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="MERCADO_PAGO">Mercado Pago (Pix Transparente / Webhook)</option>
                      <option value="PICPAY">PicPay API (QR Code & Notificações)</option>
                      <option value="ASAAS">Asaas (Cobranças & Recorrência)</option>
                      <option value="MANUAL">Central Manual (Chave Pix & Comprovante)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Chave Pix da Central
                      </label>
                      <input
                        type="text"
                        value={gatewayConfig.chavePixManual}
                        onChange={(e) =>
                          setGatewayConfig((prev) => ({ ...prev, chavePixManual: e.target.value }))
                        }
                        placeholder="Ex: financeiro@partiu.com.br"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Tipo da Chave
                      </label>
                      <select
                        value={gatewayConfig.tipoChave}
                        onChange={(e) =>
                          setGatewayConfig((prev) => ({
                            ...prev,
                            tipoChave: e.target.value as GatewayConfig["tipoChave"],
                          }))
                        }
                        className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        <option value="CNPJ">CNPJ</option>
                        <option value="EMAIL">E-mail</option>
                        <option value="TELEFONE">Telefone</option>
                        <option value="ALEATORIA">Chave Aleatória (EVP)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Titular / Beneficiário
                      </label>
                      <input
                        type="text"
                        value={gatewayConfig.nomeBeneficiario}
                        onChange={(e) =>
                          setGatewayConfig((prev) => ({ ...prev, nomeBeneficiario: e.target.value }))
                        }
                        placeholder="Ex: Partiu Mobilidade Ltda"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Cidade do Titular
                      </label>
                      <input
                        type="text"
                        value={gatewayConfig.cidadeBeneficiario}
                        onChange={(e) =>
                          setGatewayConfig((prev) => ({ ...prev, cidadeBeneficiario: e.target.value }))
                        }
                        placeholder="Ex: Sao Paulo"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      Credenciais da API & Webhooks
                    </span>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Mercado Pago Access Token
                      </label>
                      <input
                        type="password"
                        value={gatewayConfig.mercadoPagoAccessToken || ""}
                        onChange={(e) =>
                          setGatewayConfig((prev) => ({ ...prev, mercadoPagoAccessToken: e.target.value }))
                        }
                        placeholder="APP_USR-xxxx-xxxx-xxxx"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          PicPay Client ID
                        </label>
                        <input
                          type="text"
                          value={gatewayConfig.picPayClientId || ""}
                          onChange={(e) =>
                            setGatewayConfig((prev) => ({ ...prev, picPayClientId: e.target.value }))
                          }
                          placeholder="client_id_exemplo"
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          PicPay Client Secret
                        </label>
                        <input
                          type="password"
                          value={gatewayConfig.picPayClientSecret || ""}
                          onChange={(e) =>
                            setGatewayConfig((prev) => ({ ...prev, picPayClientSecret: e.target.value }))
                          }
                          placeholder="••••••••••••"
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={gatewayConfig.sandbox}
                        onChange={(e) =>
                          setGatewayConfig((prev) => ({ ...prev, sandbox: e.target.checked }))
                        }
                        className="rounded text-emerald-600"
                      />
                      <span>Ambiente Sandbox (Modo Teste)</span>
                    </label>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-xs flex items-center gap-2 transition cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar Configuração</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Fila de Conciliação Bancária */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      Fila de Conciliação de Assinaturas Pix
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Ordens de pagamento de planos e diárias aguardando webhook ou validação manual.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                    {pedidosRecarga.filter((p) => p.status === "PENDENTE").length} Pendentes
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-2">Data / ID</th>
                        <th className="py-2.5 px-2">Motorista</th>
                        <th className="py-2.5 px-2">Valor (R$)</th>
                        <th className="py-2.5 px-2">Gateway</th>
                        <th className="py-2.5 px-2">Status</th>
                        <th className="py-2.5 px-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pedidosRecarga.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                            Nenhum pedido de assinatura Pix pendente.
                          </td>
                        </tr>
                      ) : (
                        pedidosRecarga.map((p) => {
                          const isPendente = p.status === "PENDENTE";
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/70 transition">
                              <td className="py-3 px-2">
                                <div className="font-mono text-[10px] text-slate-500">#{p.id}</div>
                                <div className="text-[11px] text-slate-700">
                                  {new Date(p.criadoEm).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="font-bold text-slate-950">{p.motoristaNome}</div>
                              </td>
                              <td className="py-3 px-2">
                                <span className="font-black text-xs text-emerald-700">
                                  {p.valorBrl.toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <div className="font-bold uppercase text-[10px] text-slate-600">
                                  {p.gateway}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                {p.status === "PENDENTE" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Pendente
                                  </span>
                                )}
                                {p.status === "APROVADO" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Aprovado
                                  </span>
                                )}
                                {p.status === "REJEITADO" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                    <X className="w-3 h-3 text-red-600" />
                                    Rejeitado
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-right">
                                {isPendente ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleAprovarRecarga(p.id)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition cursor-pointer"
                                    >
                                      Aprovar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejeitarRecarga(p.id)}
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold text-[11px] transition cursor-pointer"
                                    >
                                      Rejeitar
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    Conciliado
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 1: CONCEDER DIAS DE CORTESIA                                  */}
        {/* =================================================================== */}
        {modalCortesiaAberto && contaSelecionada && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950">Conceder Dias de Cortesia</h3>
                    <p className="text-[11px] text-slate-500">{contaSelecionada.driverName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalCortesiaAberto(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmarCortesia} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Quantidade de Dias de Acesso Grátis
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 7, 15].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDiasCortesiaInput(d)}
                        className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                          diasCortesiaInput === d
                            ? "bg-slate-950 text-white border-slate-950"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        +{d} Dias
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Dias Personalizados
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={diasCortesiaInput}
                    onChange={(e) => setDiasCortesiaInput(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Justificativa / Motivo Administrativo
                  </label>
                  <input
                    type="text"
                    required
                    value={motivoCortesiaInput}
                    onChange={(e) => setMotivoCortesiaInput(e.target.value)}
                    placeholder="Ex: Incentivo operacional, compensação de suporte..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
                  <span className="font-bold block">Efeito Imediato:</span>
                  <span>O status da assinatura mudará para <strong>ATIVO</strong> e o botão "Ficar Online" no app do motorista será desbloqueado em tempo real.</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalCortesiaAberto(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs cursor-pointer"
                  >
                    Confirmar Cortesia
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 2: RENOVAÇÃO MANUAL DE ASSINATURA                             */}
        {/* =================================================================== */}
        {modalRenovacaoAberto && contaSelecionada && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950">Renovação Manual de Assinatura</h3>
                    <p className="text-[11px] text-slate-500">{contaSelecionada.driverName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalRenovacaoAberto(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmarRenovacao} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Plano de Acesso
                  </label>
                  <select
                    value={planoRenovacaoNome}
                    onChange={(e) => setPlanoRenovacaoNome(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Diária Flex (24h)">Diária Flex (24h)</option>
                    <option value="Semanal Pro (7 Dias)">Semanal Pro (7 Dias)</option>
                    <option value="Mensal Ilimitado (Zero Taxa)">Mensal Ilimitado (Zero Taxa)</option>
                    <option value="Mensal Ouro (30 Dias)">Mensal Ouro (30 Dias)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Duração (Dias)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={diasRenovacaoInput}
                      onChange={(e) => setDiasRenovacaoInput(parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Valor Quitado (R$)
                    </label>
                    <input
                      type="text"
                      value={valorRenovacaoInput}
                      onChange={(e) => setValorRenovacaoInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-black rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalRenovacaoAberto(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs cursor-pointer"
                  >
                    Confirmar Renovação
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 3: BLOQUEIO ADMINISTRATIVO DE ACESSO                          */}
        {/* =================================================================== */}
        {modalBloqueioAberto && contaSelecionada && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950">Bloquear Acesso do Motorista</h3>
                    <p className="text-[11px] text-slate-500">{contaSelecionada.driverName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalBloqueioAberto(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmarBloqueio} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Motivo do Bloqueio
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={motivoBloqueioInput}
                    onChange={(e) => setMotivoBloqueioInput(e.target.value)}
                    placeholder="Ex: Inadimplência de mensalidade após carência..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-[11px] text-rose-900">
                  <span className="font-bold block">Atenção:</span>
                  <span>O motorista será desconectado da fila de despacho e impedido de aceitar novas corridas até que sua assinatura seja regularizada.</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalBloqueioAberto(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-xs cursor-pointer"
                  >
                    Confirmar Bloqueio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 4: CRIAR OU EDITAR PLANO SAAS                                 */}
        {/* =================================================================== */}
        {modalPlanoAberto && planoEmEdicao && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-950">
                  {planoEmEdicao.id ? `Editar Plano: ${planoEmEdicao.name}` : "Criar Novo Plano SaaS"}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalPlanoAberto(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarPlano} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Plano
                  </label>
                  <input
                    type="text"
                    required
                    value={planoEmEdicao.name || ""}
                    onChange={(e) =>
                      setPlanoEmEdicao((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex: Mensal Ilimitado, Diária Flex"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição Comercial
                  </label>
                  <input
                    type="text"
                    value={planoEmEdicao.description || ""}
                    onChange={(e) =>
                      setPlanoEmEdicao((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Para quem roda 8h+ por dia..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Ciclo Principal
                    </label>
                    <select
                      value={planoEmEdicao.billingCycle || "MONTHLY"}
                      onChange={(e) =>
                        setPlanoEmEdicao((prev) => ({
                          ...prev,
                          billingCycle: e.target.value as "DAILY" | "WEEKLY" | "MONTHLY",
                        }))
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value="DAILY">Diário (24h)</option>
                      <option value="WEEKLY">Semanal (7d)</option>
                      <option value="MONTHLY">Mensal (30d)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Valor Recorrente (R$)
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={planoEmEdicao.monthlyFeeBrl ?? 0}
                      onChange={(e) =>
                        setPlanoEmEdicao((prev) => ({
                          ...prev,
                          monthlyFeeBrl: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Taxa por Corrida
                    </label>
                    <div className="w-full px-2.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-black text-emerald-700">
                      0,0% (Taxa Zero)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tarifa Diária (R$ opcional)
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={planoEmEdicao.dailyFeeBrl ?? ""}
                      onChange={(e) =>
                        setPlanoEmEdicao((prev) => ({
                          ...prev,
                          dailyFeeBrl: Number(e.target.value),
                        }))
                      }
                      placeholder="Ex: 14.90"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tarifa Semanal (R$ opcional)
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={planoEmEdicao.weeklyFeeBrl ?? ""}
                      onChange={(e) =>
                        setPlanoEmEdicao((prev) => ({
                          ...prev,
                          weeklyFeeBrl: Number(e.target.value),
                        }))
                      }
                      placeholder="Ex: 69.90"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Benefícios Inclusos (Um por linha)
                  </label>
                  <textarea
                    rows={3}
                    value={
                      Array.isArray(planoEmEdicao.features)
                        ? planoEmEdicao.features.join("\n")
                        : (planoEmEdicao.features as any) || ""
                    }
                    onChange={(e) =>
                      setPlanoEmEdicao((prev) => ({
                        ...prev,
                        features: e.target.value.split("\n"),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={planoEmEdicao.isPopular ?? false}
                      onChange={(e) =>
                        setPlanoEmEdicao((prev) => ({ ...prev, isPopular: e.target.checked }))
                      }
                      className="rounded text-emerald-600"
                    />
                    <span>Destacar como Mais Popular</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={planoEmEdicao.active ?? true}
                      onChange={(e) =>
                        setPlanoEmEdicao((prev) => ({ ...prev, active: e.target.checked }))
                      }
                      className="rounded text-emerald-600"
                    />
                    <span>Plano Ativo</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalPlanoAberto(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-sm cursor-pointer"
                  >
                    Salvar Plano SaaS
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL 5: COBRANÇA AVULSA / PIX IMEDIATO                             */}
        {/* =================================================================== */}
        {modalPixAvulsoAberto && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950">Cobrança de Mensalidade Pix</h3>
                    <p className="text-[11px] text-slate-500">QR Code dinâmico com liquidação instantânea</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalPixAvulsoAberto(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGerarPix} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motorista Parceiro
                  </label>
                  <input
                    type="text"
                    value={pixMotoristaNome}
                    onChange={(e) => setPixMotoristaNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor da Cobrança (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={pixValorBrl}
                    onChange={(e) => setPixValorBrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-black text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs transition cursor-pointer"
                >
                  Regerar Código PIX
                </button>
              </form>

              {pixGeradoPayload && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2 animate-in fade-in">
                  <div className="flex justify-center">
                    <RealQrCodePix textoChave={pixGeradoPayload} tamanho={130} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block break-all">
                    {pixGeradoPayload.slice(0, 32)}...
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(pixGeradoPayload);
                      mostrarToast("Chave PIX copiada para a área de transferência!");
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-100 rounded-xl text-xs font-bold border border-slate-200 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código Pix Copia e Cola</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </GuardiaoAcesso>
  );
}
