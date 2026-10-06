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
  Percent,
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
  ArrowDownLeft,
  Search,
} from "lucide-react";
import {
  type CarteiraMotorista,
  type TransacaoCarteira,
  type PedidoRecargaPix,
  type GatewayConfig,
  carregarCarteiras,
  carregarTransacoes,
  carregarPedidosRecarga,
  carregarGatewayConfig,
  salvarGatewayConfig,
  lancarTransacaoCarteira,
  alternarBloqueioAdmin,
  aprovarRecargaPix,
  rejeitarRecargaPix,
} from "@/lib/driver-wallet-service";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";
import {
  subscriptionEngine,
  commissionEngine,
  billingEngine,
  driverWalletEngine,
  financialAuditEngine,
  revenueDashboardEngine,
  type DriverPlan,
  type ProtectionFundConfig,
  type PlatformRevenueMetrics,
} from "@/lib/revenue";
import { RealQrCodePix } from "@/components/common/RealQrCodePix";
import { appSettingsService, type AppSettings } from "@/lib/ecosystem/app-settings-service";
import {
  driverSubscriptionService,
  type DriverSubscriptionRecord,
} from "@/lib/ecosystem/driver-subscription-service";
import { computePixCrc16 } from "@/services/payment/PaymentProviderAdapter";

export const Route = createFileRoute("/app/admin/monetizacao")({
  head: () => ({
    meta: [
      { title: "Monetização & Planos SaaS | PARTIU Admin" },
      {
        name: "description",
        content:
          "Centro Executivo de Monetização: gestão de diárias SaaS, planos de assinatura, comissões variáveis e controle de receita.",
      },
    ],
  }),
  component: AdminMonetizacaoPage,
});

type AbaMonetizacao =
  | "diarias_saas"
  | "carteira_pre_paga"
  | "gateways_pix"
  | "planos"
  | "taxas"
  | "cobranca"
  | "inadimplencia"
  | "dashboard";

export function AdminMonetizacaoPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaMonetizacao>("diarias_saas");
  const [appSettings, setAppSettings] = useState<AppSettings>(() => appSettingsService.getSettings());
  const [diariaCarroInput, setDiariaCarroInput] = useState(() => appSettings.daily_fee_car.toFixed(2));
  const [diariaMotoInput, setDiariaMotoInput] = useState(() => appSettings.daily_fee_moto.toFixed(2));
  const [saasMetrics, setSaasMetrics] = useState(() => driverSubscriptionService.getSaaSMetrics());
  const [subscriptionsList, setSubscriptionsList] = useState<DriverSubscriptionRecord[]>(() =>
    driverSubscriptionService.getAllSubscriptions()
  );
  const [planos, setPlanos] = useState<DriverPlan[]>(() =>
    subscriptionEngine.getAllPlans(true)
  );
  const [protectionConfig, setProtectionConfig] = useState<ProtectionFundConfig>(() =>
    commissionEngine.getProtectionConfig()
  );
  const [goldProtectionConfig, setGoldProtectionConfig] = useState(() =>
    commissionEngine.getGoldProtectionConfig()
  );
  const [metrics, setMetrics] = useState<PlatformRevenueMetrics>(() =>
    revenueDashboardEngine.calculateMetrics()
  );

  // Módulo 7: Carteira de Créditos e Gateways Pix
  const [wallets, setWallets] = useState<CarteiraMotorista[]>(() => carregarCarteiras());
  const [buscaWallet, setBuscaWallet] = useState("");
  const [pedidosRecarga, setPedidosRecarga] = useState<PedidoRecargaPix[]>(() => carregarPedidosRecarga());
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig>(() => carregarGatewayConfig());

  const statsCarteira = useMemo(() => {
    const totalCustodia = wallets.reduce((acc, w) => acc + w.saldoBrl, 0);
    const liberados = wallets.filter((w) => w.statusBloqueio === "LIBERADO").length;
    const bloqueadosSaldo = wallets.filter((w) => w.statusBloqueio === "BLOQUEADO_SALDO_INSUFICIENTE").length;
    const bloqueadosAdmin = wallets.filter((w) => w.statusBloqueio === "BLOQUEADO_ADMINISTRATIVO").length;
    const totalRecarregado = pedidosRecarga
      .filter((p) => p.status === "APROVADO")
      .reduce((acc, p) => acc + p.valorBrl, 0);
    return { totalCustodia, liberados, bloqueadosSaldo, bloqueadosAdmin, totalRecarregado };
  }, [wallets, pedidosRecarga]);

  const carteirasFiltradas = useMemo(() => {
    const q = buscaWallet.toLowerCase().trim();
    if (!q) return wallets;
    return wallets.filter(
      (w) =>
        w.motoristaNome.toLowerCase().includes(q) ||
        w.telefone.toLowerCase().includes(q) ||
        w.veiculoModelo.toLowerCase().includes(q) ||
        w.veiculoPlaca.toLowerCase().includes(q)
    );
  }, [wallets, buscaWallet]);

  // Modal Lançamento na Carteira
  const [modalLancamentoAberto, setModalLancamentoAberto] = useState(false);
  const [walletSelecionada, setWalletSelecionada] = useState<CarteiraMotorista | null>(null);
  const [tipoLancamento, setTipoLancamento] = useState<"CREDITO_MANUAL_ADMIN" | "DEBITO_MANUAL_ADMIN" | "BONUS">("CREDITO_MANUAL_ADMIN");
  const [valorLancamentoInput, setValorLancamentoInput] = useState("50.00");
  const [descricaoLancamentoInput, setDescricaoLancamentoInput] = useState("");

  // Modal Extrato da Carteira
  const [modalExtratoAberto, setModalExtratoAberto] = useState(false);
  const [extratoMotorista, setExtratoMotorista] = useState<TransacaoCarteira[]>([]);
  const [motoristaExtratoNome, setMotoristaExtratoNome] = useState("");

  // Modal de Edição / Criação de Plano
  const [modalPlanoAberto, setModalPlanoAberto] = useState(false);
  const [planoEmEdicao, setPlanoEmEdicao] = useState<Partial<DriverPlan> | null>(null);

  // Modal de Cobrança PIX Avulsa
  const [modalPixAvulsoAberto, setModalPixAvulsoAberto] = useState(false);
  const [pixMotoristaNome, setPixMotoristaNome] = useState("Carlos Eduardo (Onix Prata)");
  const [pixValorBrl, setPixValorBrl] = useState("49.90");
  const [pixGeradoPayload, setPixGeradoPayload] = useState<string | null>(null);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function mostrarToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  function recarregarDados() {
    setAppSettings(appSettingsService.getSettings());
    setSaasMetrics(driverSubscriptionService.getSaaSMetrics());
    setSubscriptionsList(driverSubscriptionService.getAllSubscriptions());
    setPlanos(subscriptionEngine.getAllPlans(true));
    setProtectionConfig(commissionEngine.getProtectionConfig());
    setGoldProtectionConfig(commissionEngine.getGoldProtectionConfig());
    setMetrics(revenueDashboardEngine.calculateMetrics());
    setWallets(carregarCarteiras());
    setPedidosRecarga(carregarPedidosRecarga());
    setGatewayConfig(carregarGatewayConfig());
  }

  useEffect(() => {
    const handleWalletUpdate = () => {
      setWallets(carregarCarteiras());
      setPedidosRecarga(carregarPedidosRecarga());
    };
    window.addEventListener("partiu:wallet-updated", handleWalletUpdate);
    return () => window.removeEventListener("partiu:wallet-updated", handleWalletUpdate);
  }, []);

  const recarregarCarteirasData = () => {
    setWallets(carregarCarteiras());
    setPedidosRecarga(carregarPedidosRecarga());
    setGatewayConfig(carregarGatewayConfig());
  };

  const abrirModalCreditoDebito = (w: CarteiraMotorista, tipo: "CREDITO_MANUAL_ADMIN" | "DEBITO_MANUAL_ADMIN") => {
    setWalletSelecionada(w);
    setTipoLancamento(tipo);
    setValorLancamentoInput("50.00");
    setDescricaoLancamentoInput(tipo === "CREDITO_MANUAL_ADMIN" ? "Ajuste manual de crédito" : "Estorno de tarifa ou ajuste");
    setModalLancamentoAberto(true);
  };

  const handleSalvarLancamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletSelecionada) return;
    const v = parseFloat(valorLancamentoInput.replace(",", "."));
    if (isNaN(v) || v <= 0) {
      mostrarToast("Insira um valor válido maior que zero.");
      return;
    }

    lancarTransacaoCarteira({
      motoristaId: walletSelecionada.motoristaId,
      tipo: tipoLancamento,
      valorBrl: v,
      descricao: descricaoLancamentoInput.trim() || "Ajuste administrativo",
      operadorAdmin: "Super Admin",
    });

    setModalLancamentoAberto(false);
    recarregarCarteirasData();
    mostrarToast(`Lançamento de R$ ${v.toFixed(2)} processado na carteira de ${walletSelecionada.motoristaNome}!`);
  };

  const handleAlternarBloqueio = (w: CarteiraMotorista) => {
    alternarBloqueioAdmin(w.motoristaId);
    recarregarCarteirasData();
    mostrarToast(`Status de bloqueio de ${w.motoristaNome} alterado.`);
  };

  const abrirExtratoMotorista = (w: CarteiraMotorista) => {
    setMotoristaExtratoNome(w.motoristaNome);
    setExtratoMotorista(carregarTransacoes(w.motoristaId));
    setModalExtratoAberto(true);
  };

  const handleAprovarRecarga = (pedidoId: string) => {
    aprovarRecargaPix(pedidoId);
    recarregarCarteirasData();
    mostrarToast(`Recarga #${pedidoId} aprovada e creditada na carteira!`);
  };

  const handleRejeitarRecarga = (pedidoId: string) => {
    rejeitarRecargaPix(pedidoId, "Comprovante não identificado");
    recarregarCarteirasData();
    mostrarToast(`Recarga #${pedidoId} rejeitada.`);
  };

  const handleSalvarGateway = (e: React.FormEvent) => {
    e.preventDefault();
    salvarGatewayConfig(gatewayConfig);
    mostrarToast("Configurações do Gateway Pix salvas com sucesso!");
  };

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

  // Ações de Planos
  function handleAbrirCriarPlano() {
    setPlanoEmEdicao({
      name: "",
      description: "",
      monthlyFeeBrl: 29.9,
      commissionPercent: 4.0,
      features: ["Taxa reduzida", "Repasse PIX D+0"],
      badgeColor: "bg-indigo-600",
      active: true,
      isPopular: false,
    });
    setModalPlanoAberto(true);
  }

  function handleAbrirEditarPlano(plano: DriverPlan) {
    setPlanoEmEdicao({ ...plano });
    setModalPlanoAberto(true);
  }

  function handleSalvarPlano(e: React.FormEvent) {
    e.preventDefault();
    if (!planoEmEdicao || !planoEmEdicao.name) return;

    if (planoEmEdicao.id) {
      // Atualizar existente
      subscriptionEngine.updatePlan(planoEmEdicao.id, {
        name: planoEmEdicao.name,
        description: planoEmEdicao.description || "",
        monthlyFeeBrl: Number(planoEmEdicao.monthlyFeeBrl) || 0,
        dailyFeeBrl: Number(planoEmEdicao.dailyFeeBrl) || 0,
        weeklyFeeBrl: Number(planoEmEdicao.weeklyFeeBrl) || 0,
        billingCycle: planoEmEdicao.billingCycle || "MONTHLY",
        commissionPercent: planoEmEdicao.commissionPercent !== undefined ? Number(planoEmEdicao.commissionPercent) : 0,
        features: Array.isArray(planoEmEdicao.features)
          ? planoEmEdicao.features
          : String(planoEmEdicao.features).split("\n").filter(Boolean),
        badgeColor: planoEmEdicao.badgeColor || "bg-slate-500",
        active: planoEmEdicao.active ?? true,
        isPopular: planoEmEdicao.isPopular ?? false,
      });
      mostrarToast(`Plano "${planoEmEdicao.name}" atualizado com sucesso!`);
    } else {
      // Criar novo
      subscriptionEngine.createPlan({
        name: planoEmEdicao.name,
        description: planoEmEdicao.description || "",
        monthlyFeeBrl: Number(planoEmEdicao.monthlyFeeBrl) || 0,
        dailyFeeBrl: Number(planoEmEdicao.dailyFeeBrl) || 0,
        weeklyFeeBrl: Number(planoEmEdicao.weeklyFeeBrl) || 0,
        billingCycle: planoEmEdicao.billingCycle || "MONTHLY",
        commissionPercent: planoEmEdicao.commissionPercent !== undefined ? Number(planoEmEdicao.commissionPercent) : 0,
        features: Array.isArray(planoEmEdicao.features)
          ? planoEmEdicao.features
          : String(planoEmEdicao.features).split("\n").filter(Boolean),
        badgeColor: planoEmEdicao.badgeColor || "bg-indigo-600",
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
    mostrarToast(
      `Plano "${atualizado.name}" agora está ${atualizado.active ? "ATIVO" : "INATIVO"}.`
    );
    recarregarDados();
  }

  // Ações de Taxas & Proteção
  function handleSalvarProtecao(e: React.FormEvent) {
    e.preventDefault();
    commissionEngine.updateProtectionConfig({
      enabled: protectionConfig.enabled,
      retentionPerTripBrl: Number(protectionConfig.retentionPerTripBrl) || 0.3,
      targetCapBrl: Number(protectionConfig.targetCapBrl) || 30.0,
    });
    mostrarToast("Parâmetros do Fundo de Proteção salvos com sucesso!");
    recarregarDados();
  }

  function handleSalvarProtecaoOuro(e: React.FormEvent) {
    e.preventDefault();
    commissionEngine.updateGoldProtectionConfig({
      thresholdMonthlyBrl: Number(goldProtectionConfig.thresholdMonthlyBrl) || 8000,
      postThresholdCommissionPercent: Number(goldProtectionConfig.postThresholdCommissionPercent) || 0.5,
    });
    mostrarToast(
      `Proteção do Plano Ouro salva: 0% até R$ ${Number(goldProtectionConfig.thresholdMonthlyBrl) || 8000}/mês + ${Number(goldProtectionConfig.postThresholdCommissionPercent) || 0.5}% excedente.`
    );
    recarregarDados();
  }

  // Gerador de PIX Avulso
  function handleGerarPixAvulso(e: React.FormEvent) {
    e.preventDefault();
    const rawEmv = `00020126580014br.gov.bcb.pix0136partiu-recuperacao-finops-001520400005303986540${pixValorBrl.replace(".", "")}5802BR5915PARTIU BRASIL6009SAO PAULO62070503***6304`;
    const payload = `${rawEmv}${computePixCrc16(rawEmv)}`;
    setPixGeradoPayload(payload);
    mostrarToast("QR Code PIX gerado para regularização.");
  }

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

        {/* CABEÇALHO EXECUTIVO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary-50 text-amber-900 border border-primary-500">
                FASE 19 • REVENUE OS
              </span>
              <span className="text-xs font-bold text-slate-500">Governança Econômica</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
              Monetização, Comissões &amp; Planos SaaS
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Modelo econômico híbrido: assinaturas mensais, comissões variáveis por corrida,
              fundo de proteção e esteira de cobrança em cascata.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={recarregarDados}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              title="Recarregar Indicadores"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              type="button"
              onClick={handleAbrirCriarPlano}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Plano</span>
            </button>
          </div>
        </div>

        {/* KPI CARDS RESUMIDOS (TOP BAR) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              MRR (Recorrente)
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-950">
              {metrics.mrrBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              ARR {metrics.arrBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Take-Rate Médio
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-700">
              {metrics.effectiveTakeRatePercent.toFixed(2)}%
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              Uber: 20-30% | 99: 18-25%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Receita Líquida Total
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {metrics.totalNetRevenueBrl.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <span className="text-[10px] text-emerald-800 font-bold">
              Assinaturas + Comissões
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Inadimplência
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-950">
              {metrics.delinquencyRatePercent}%
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">
              {metrics.defaultingDriversCount} em carência / {metrics.activeDriversCount} adimplentes
            </span>
          </div>
        </div>

        {/* SELETOR DE ABAS PRINCIPAIS */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 scrollbar-none">
          {[
            { id: "diarias_saas", label: "Diárias SaaS (Zero Comissão)", icon: Zap },
            { id: "carteira_pre_paga", label: "Carteira & Créditos Motorista", icon: Wallet },
            { id: "gateways_pix", label: "Gateways Pix & Conciliação", icon: QrCode },
            { id: "planos", label: "Planos de Acesso", icon: Layers },
            { id: "taxas", label: "Taxas & Fundo Proteção", icon: ShieldCheck },
            { id: "cobranca", label: "Cobrança & Meios", icon: CreditCard },
            { id: "inadimplencia", label: "Inadimplência & Réguas", icon: AlertTriangle },
            { id: "dashboard", label: "Dashboard Financeiro", icon: PieChart },
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
        {/* ABA 0: GESTÃO FINANCEIRA & DIÁRIAS SAAS (ZERO COMISSÃO)             */}
        {/* =================================================================== */}
        {abaAtiva === "diarias_saas" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header com Regra de Ouro */}
            <div className="bg-gradient-to-r from-primary-600/15 via-yellow-500/10 to-transparent border border-primary-600/30 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-600 text-slate-950 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Modelo SaaS Puro • 100% Repasse Líquido
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  Gestão de Diárias dos Motoristas & Receita SaaS
                </h2>
                <p className="text-xs text-slate-600 max-w-2xl">
                  O Partiu não retém comissão de corridas. A receita da plataforma provém exclusivamente
                  das diárias pré-pagas (24 horas) via PIX cobradas de motoristas de Carro e Moto.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={recarregarDados}
                  className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Atualizar
                </button>
              </div>
            </div>

            {/* KPI Cards de Diárias Pagas (Hoje vs Mês) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Diárias Pagas Hoje (PIX)
                </span>
                <div className="text-2xl font-black text-emerald-600">
                  R$ {saasMetrics.totalRevenueToday.toFixed(2).replace(".", ",")}
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Liquidação imediata D+0
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Receita Diárias no Mês
                </span>
                <div className="text-2xl font-black text-slate-900">
                  R$ {saasMetrics.totalRevenueMonth.toFixed(2).replace(".", ",")}
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  100% SaaS Recorrente
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Motoristas com Diária Ativa
                </span>
                <div className="text-2xl font-black text-primary-700">
                  {saasMetrics.activeDriversCount}
                </div>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  Habilitados para receber chamados
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Diárias Vencidas / Bloqueadas
                </span>
                <div className="text-2xl font-black text-rose-600">
                  {saasMetrics.expiredDriversCount}
                </div>
                <span className="text-[10px] text-rose-700 font-bold block">
                  Cockpit bloqueado pela trava
                </span>
              </div>
            </div>

            {/* Configurador Rápido de Valores de Diária */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  Configurador Rápido de Diárias (PostgreSQL / Supabase)
                </h3>
                <p className="text-xs text-slate-500">
                  Altere os valores cobrados por diária de 24 horas. Os novos valores são sincronizados
                  imediatamente na tabela <code>app_settings</code> e exibidos no app do motorista.
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
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:bg-white focus:border-amber-400 focus:outline-hidden"
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
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:bg-white focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Valor atual: R$ {appSettings.daily_fee_moto.toFixed(2)}
                  </span>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-95 text-white text-xs font-black transition shadow-md flex items-center justify-center gap-2 cursor-pointer h-[42px]"
                  >
                    <Save className="w-4 h-4 text-primary-600" />
                    <span>Salvar Valores de Diária</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Tabela de Diárias Recentes dos Motoristas */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-950">
                    Assinaturas de Diárias Recentes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Histórico de liquidações PIX de 24 horas registradas no banco de dados.
                  </p>
                </div>
              </div>

              {subscriptionsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  Nenhuma assinatura registrada ainda. Assim que os motoristas pagarem a diária via PIX, os registros aparecerão aqui em tempo real.
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
                        <th className="pb-3">Expiração (24h)</th>
                        <th className="pb-3">TXID PIX</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {subscriptionsList.map((sub) => {
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
        {/* ABA: CARTEIRA DE CRÉDITOS DO MOTORISTA (MODELO PRÉ-PAGO)            */}
        {/* =================================================================== */}
        {abaAtiva === "carteira_pre_paga" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header explicativo */}
            <div className="bg-gradient-to-r from-emerald-600/15 via-teal-500/10 to-transparent border border-emerald-600/30 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  <Wallet className="w-3.5 h-3.5 fill-current" />
                  Módulo de Saldo Pré-Pago • Desconto de Comissão
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  Carteira Pré-Paga & Saldo dos Motoristas
                </h2>
                <p className="text-xs text-slate-600 max-w-2xl">
                  Cada motorista possui uma carteira interna de créditos. A taxa ou comissão do app é debitada automaticamente por corrida. Quando o saldo atinge zero ou fica negativo, o motorista é bloqueado preventivamente de aceitar novas corridas até recarregar via Pix.
                </p>
              </div>
              <button
                type="button"
                onClick={recarregarCarteirasData}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-xs"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                <span>Atualizar Carteiras</span>
              </button>
            </div>

            {/* KPIs da Carteira */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Saldo em Custódia
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-700">
                  {statsCarteira.totalCustodia.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <span className="text-[10px] text-slate-500 font-bold">
                  Total depositado por motoristas
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Motoristas Liberados
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-700">
                  {statsCarteira.liberados}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">
                  Com saldo positivo suficiente
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Bloqueados por Saldo
                </span>
                <div className="text-xl sm:text-2xl font-black text-red-600">
                  {statsCarteira.bloqueadosSaldo}
                </div>
                <span className="text-[10px] text-red-600 font-bold">
                  Saldo zerado ou negativo
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Recargas Pix Liquidadas
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-950">
                  {statsCarteira.totalRecarregado.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <span className="text-[10px] text-slate-500 font-bold">
                  Total aprovado via Pix
                </span>
              </div>
            </div>

            {/* Barra de Busca e Filtro */}
            <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buscaWallet}
                    onChange={(e) => setBuscaWallet(e.target.value)}
                    placeholder="Buscar motorista, telefone, veículo ou placa..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="text-xs text-slate-500 font-bold">
                  Mostrando {carteirasFiltradas.length} de {wallets.length} motoristas
                </div>
              </div>

              {/* Tabela de Carteiras */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-2">Motorista</th>
                      <th className="py-3 px-2">Veículo / Placa</th>
                      <th className="py-3 px-2">Saldo Atual</th>
                      <th className="py-3 px-2">Alerta Mínimo</th>
                      <th className="py-3 px-2">Status Operacional</th>
                      <th className="py-3 px-2">Última Recarga</th>
                      <th className="py-3 px-2 text-right">Ações de Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {carteirasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          Nenhum motorista encontrado com os filtros informados.
                        </td>
                      </tr>
                    ) : (
                      carteirasFiltradas.map((w) => {
                        const isNegativo = w.saldoBrl <= 0;
                        const isAlerta = w.saldoBrl > 0 && w.saldoBrl <= w.limiteMinimoBrl;

                        return (
                          <tr key={w.motoristaId} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-2">
                              <div className="font-bold text-slate-950">{w.motoristaNome}</div>
                              <div className="text-[11px] text-slate-500">{w.telefone}</div>
                            </td>
                            <td className="py-3 px-2">
                              <div className="font-semibold text-slate-800">{w.veiculoModelo}</div>
                              <div className="font-mono text-[10px] text-slate-500 uppercase">{w.veiculoPlaca}</div>
                            </td>
                            <td className="py-3 px-2">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${
                                  isNegativo
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : isAlerta
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {w.saldoBrl.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-slate-500 font-medium">
                              {w.limiteMinimoBrl.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                            <td className="py-3 px-2">
                              {w.statusBloqueio === "LIBERADO" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  Liberado
                                </span>
                              )}
                              {w.statusBloqueio === "BLOQUEADO_SALDO_INSUFICIENTE" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                  Bloqueado (Saldo)
                                </span>
                              )}
                              {w.statusBloqueio === "BLOQUEADO_ADMINISTRATIVO" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200 text-slate-800">
                                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                                  Bloqueio Admin
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2 text-[11px] text-slate-500">
                              {w.atualizadoEm
                                ? new Date(w.atualizadoEm).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Nenhuma"}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => abrirModalCreditoDebito(w, "CREDITO_MANUAL_ADMIN")}
                                  title="Adicionar Crédito (+)"
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => abrirModalCreditoDebito(w, "DEBITO_MANUAL_ADMIN")}
                                  title="Lançar Débito / Estorno (-)"
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition"
                                >
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAlternarBloqueio(w)}
                                  title={
                                    w.statusBloqueio === "BLOQUEADO_ADMINISTRATIVO"
                                      ? "Desbloquear Motorista"
                                      : "Bloquear Manualmente"
                                  }
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                >
                                  {w.statusBloqueio === "BLOQUEADO_ADMINISTRATIVO" ? (
                                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => abrirExtratoMotorista(w)}
                                  title="Ver Extrato de Transações"
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                </button>
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
        {/* ABA: GATEWAYS PIX & CONCILIAÇÃO BANCÁRIA                            */}
        {/* =================================================================== */}
        {abaAtiva === "gateways_pix" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header explicativo */}
            <div className="bg-gradient-to-r from-blue-600/15 via-indigo-500/10 to-transparent border border-blue-600/30 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  <QrCode className="w-3.5 h-3.5 fill-current" />
                  Gateways Pix • Liquidação Instantânea
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  Gateways Pix & Conciliação de Recargas
                </h2>
                <p className="text-xs text-slate-600 max-w-2xl">
                  Configure as credenciais do provedor de pagamento (Mercado Pago, PicPay, Asaas ou Central Manual) para emissão de QR Code Pix dinâmico e concilie recargas pendentes dos motoristas.
                </p>
              </div>
              <button
                type="button"
                onClick={recarregarCarteirasData}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-xs"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                <span>Atualizar Pedidos</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna 1: Formulário de Configuração do Provedor Pix */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    Parâmetros do Gateway Pix
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
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
                      className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="MERCADO_PAGO">Mercado Pago (Pix Transparente / Webhook)</option>
                      <option value="PICPAY">PicPay API (QR Code & Notificações)</option>
                      <option value="ASAAS">Asaas (Cobranças & Split Automático)</option>
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
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
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
                        className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                        placeholder="Ex: Partiu Mobilidade Urbana Ltda"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Mercado Pago Webhook Secret
                      </label>
                      <input
                        type="password"
                        value={gatewayConfig.mercadoPagoWebhookSecret || ""}
                        onChange={(e) =>
                          setGatewayConfig((prev) => ({ ...prev, mercadoPagoWebhookSecret: e.target.value }))
                        }
                        placeholder="whsec_xxxxxx"
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Expiração do QR Code (minutos)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="1440"
                        value={gatewayConfig.tempoExpiracaoMinutos}
                        onChange={(e) =>
                          setGatewayConfig((prev) => ({
                            ...prev,
                            tempoExpiracaoMinutos: parseInt(e.target.value) || 30,
                          }))
                        }
                        className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        Alerta de Saldo Baixo (R$)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        value={gatewayConfig.limiteAlertaSaldoBaixo}
                        onChange={(e) =>
                          setGatewayConfig((prev) => ({
                            ...prev,
                            limiteAlertaSaldoBaixo: parseFloat(e.target.value) || 15,
                          }))
                        }
                        className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
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
                        className="rounded text-blue-600"
                      />
                      <span>Ambiente Sandbox (Modo Teste)</span>
                    </label>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-xs flex items-center gap-2 transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar Configuração</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Coluna 2: Conciliação Bancária & Pedidos de Recarga Pix */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      Fila de Conciliação Bancária Pix
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Pedidos de recarga efetuados pelos motoristas aguardando webhook ou validação manual.
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
                        <th className="py-2.5 px-2">Provedor / TxID</th>
                        <th className="py-2.5 px-2">Status</th>
                        <th className="py-2.5 px-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pedidosRecarga.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                            Nenhum pedido de recarga Pix registrado.
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
                                <div className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                                  #{p.id}
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
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition"
                                    >
                                      Aprovar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejeitarRecarga(p.id)}
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold text-[11px] transition"
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
        {/* ABA 1: PLANOS DE ASSINATURA (CRUD)                                  */}
        {/* =================================================================== */}
        {abaAtiva === "planos" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  Planos Cadastrados na Plataforma
                </h2>
                <p className="text-xs text-slate-500">
                  O motorista escolhe livremente o equilíbrio ideal entre mensalidade fixa e comissão
                  por corrida.
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
                    {/* Header do Card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${plano.badgeColor}`} />
                        <h3 className="text-base font-black text-slate-950">{plano.name}</h3>
                      </div>
                      {plano.isPopular && (
                        <span className="text-[9px] font-black uppercase bg-primary-100 text-amber-950 px-2 py-0.5 rounded-full">
                          Mais Popular
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{plano.description}</p>

                    {/* Preço e Taxa */}
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
                        <span className="text-sm font-black text-amber-700">
                          {plano.commissionPercent}%
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-400">Peso no Despacho:</span>
                        <span className="text-[10px] font-bold text-slate-600">
                          {plano.dispatchWeightPercent}% (Máx 5%)
                        </span>
                      </div>
                    </div>

                    {/* Benefícios */}
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

                  {/* Ações do Card */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatusPlano(plano.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
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
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                        title="Duplicar Plano"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAbrirEditarPlano(plano)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition"
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
        )}

        {/* =================================================================== */}
        {/* ABA 2: TAXAS & FUNDO DE PROTEÇÃO                                    */}
        {/* =================================================================== */}
        {abaAtiva === "taxas" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
            {/* Configuração do Fundo de Proteção */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary-50 text-amber-950">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950">
                      Parâmetros do Fundo de Proteção Operacional
                    </h3>
                    <p className="text-xs text-slate-500">
                      Micro-retenção automática retida de cada corrida para cobrir calotes de dinheiro,
                      inadimplência e socorro mútuo.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSalvarProtecao} className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Status do Fundo de Proteção
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Quando ativado, retém automaticamente a fração definida até atingir o teto
                      individual.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={protectionConfig.enabled}
                      onChange={(e) =>
                        setProtectionConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Retenção por Corrida (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={protectionConfig.retentionPerTripBrl}
                        onChange={(e) =>
                          setProtectionConfig((prev) => ({
                            ...prev,
                            retentionPerTripBrl: Number(e.target.value),
                          }))
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Padrão sugerido: R$ 0,30 a R$ 0,50 por corrida concluída.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Teto Máximo de Reserva por Condutor (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="number"
                        step="1.00"
                        min="10"
                        value={protectionConfig.targetCapBrl}
                        onChange={(e) =>
                          setProtectionConfig((prev) => ({
                            ...prev,
                            targetCapBrl: Number(e.target.value),
                          }))
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Após atingir o teto (ex: R$ 30,00), a cobrança é pausada automaticamente.
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs transition shadow-sm"
                  >
                    Salvar Parâmetros
                  </button>
                </div>
              </form>
            </div>

            {/* AUDITORIA FASE 1: Proteção Financeira do Plano Ouro (Taxa Zero até R$ 8k + 0.5% excedente) */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary-600 text-slate-950 font-black">
                    🏆
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-950">
                      Proteção Financeira de Sustentabilidade — Plano Ouro (VIP)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Isenção de 0% garantida até o limite mensal configurado. Acima deste teto,
                      aplica-se a comissão mínima de proteção da plataforma.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-primary-50 border border-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  Fase 1 Homologada
                </span>
              </div>

              <form onSubmit={handleSalvarProtecaoOuro} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Teto Mensal de Faturamento Isento (0%)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="number"
                        step="500"
                        min="1000"
                        value={goldProtectionConfig.thresholdMonthlyBrl}
                        onChange={(e) =>
                          setGoldProtectionConfig((prev) => ({
                            ...prev,
                            thresholdMonthlyBrl: Number(e.target.value),
                          }))
                        }
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Padrão: R$ 8.000,00/mês. Dentro deste limite o repasse é 100% líquido.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Comissão Excedente Pós-Teto (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={goldProtectionConfig.postThresholdCommissionPercent}
                        onChange={(e) =>
                          setGoldProtectionConfig((prev) => ({
                            ...prev,
                            postThresholdCommissionPercent: Number(e.target.value),
                          }))
                        }
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Padrão: 0,5% aplicada exclusivamente sobre os valores que excederem o teto.
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs transition shadow-sm"
                  >
                    Salvar Regra do Plano Ouro
                  </button>
                </div>
              </form>
            </div>

            {/* Painel de Reserva & Benchmark */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-950">Reserva de Contingência</h3>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-800">
                  Saldo Total Acumulado em Conta
                </span>
                <div className="text-2xl font-black text-emerald-700">
                  {metrics.protectionFundReserveTotalBrl.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <p className="text-[11px] text-emerald-800">
                  Fundo líquido pronto para resgate de despesas e cobertura imediata.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Benchmark de Mercado vs Concorrentes
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-600">PARTIU (Média):</span>
                    <span className="font-black text-emerald-600">
                      {metrics.effectiveTakeRatePercent}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-900">
                    <span>Uber (Brasil):</span>
                    <span className="font-black">20% a 35%</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-primary-50 border border-amber-100 text-amber-900">
                    <span>99 Pop / Moto:</span>
                    <span className="font-black">18% a 28%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 3: COBRANÇA EM CASCATA & PIX                                    */}
        {/* =================================================================== */}
        {abaAtiva === "cobranca" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
            {/* Diagrama da Cascata */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-slate-900" />
                  <h3 className="text-base font-black text-slate-950">
                    Cascata de Cobrança Automática de 4 Níveis
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  100% Automatizado
                </span>
              </div>

              <p className="text-xs text-slate-600">
                O motorista nunca tem o plano suspenso sem antes passar por todas as tentativas
                amigáveis de liquidação na seguinte ordem estrita:
              </p>

              <div className="space-y-3">
                {[
                  {
                    passo: "1º Nível",
                    titulo: "Saldo em Carteira (Instantâneo D+0)",
                    desc: "Deduz diretamente do saldo disponível acumulado das corridas no app.",
                    cor: "border-emerald-300 bg-emerald-50/60 text-emerald-900",
                  },
                  {
                    passo: "2º Nível",
                    titulo: "Faturamento das Próximas Corridas",
                    desc: "Retém uma porcentagem controlada (máx 30%) de cada nova corrida até quitar.",
                    cor: "border-teal-300 bg-teal-50/60 text-teal-900",
                  },
                  {
                    passo: "3º Nível",
                    titulo: "PIX Automático com QR Code Dinâmico",
                    desc: "Gera notificação push com chave copia-e-cola e QR Code de liquidação imediata.",
                    cor: "border-primary-500 bg-primary-50/60 text-amber-900",
                  },
                  {
                    passo: "4º Nível",
                    titulo: "Cartão de Crédito Cadastrado",
                    desc: "Dispara cobrança segura no gateway se o condutor possuir cartão ativo.",
                    cor: "border-slate-300 bg-slate-50 text-slate-900",
                  },
                ].map((item, idx) => (
                  <div key={idx} className={`p-3.5 rounded-2xl border ${item.cor} flex items-start gap-3`}>
                    <span className="px-2 py-1 rounded-lg bg-white font-black text-[10px] shadow-xs shrink-0">
                      {item.passo}
                    </span>
                    <div>
                      <h4 className="text-xs font-black">{item.titulo}</h4>
                      <p className="text-[11px] opacity-80 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gerador Manual de PIX para Regularização */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary-700" />
                <h3 className="text-base font-black text-slate-950">Cobrança Avulsa via PIX</h3>
              </div>

              <p className="text-xs text-slate-500">
                Gere um QR Code PIX avulso para regularização imediata de mensalidades ou dívidas em
                carência de qualquer condutor.
              </p>

              <form onSubmit={handleGerarPixAvulso} className="space-y-3">
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
                  className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-amber-600 text-slate-950 font-black text-xs transition"
                >
                  Gerar QR Code PIX
                </button>
              </form>

              {pixGeradoPayload && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2 animate-in fade-in">
                  <div className="flex justify-center">
                    <RealQrCodePix textoChave={pixGeradoPayload} tamanho={120} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block break-all">
                    {pixGeradoPayload.slice(0, 32)}...
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(pixGeradoPayload);
                      mostrarToast("Chave PIX copiada!");
                    }}
                    className="px-3 py-1 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold border border-slate-200 shadow-xs"
                  >
                    Copiar Código PIX
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 4: INADIMPLÊNCIA & RÉGUAS                                       */}
        {/* =================================================================== */}
        {abaAtiva === "inadimplencia" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 rounded-2xl bg-primary-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-primary-700 shrink-0" />
                <div>
                  <h3 className="text-xs font-black text-amber-950">
                    Régua de Carência: 3 Dias Sem Bloqueio Abrupto
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    O motorista continua operando normalmente durante os primeiros 3 dias de atraso.
                    Bloqueios operacionais só ocorrem após expiração da carência e avisos reiterados.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-900 bg-white px-3 py-1.5 rounded-xl border border-primary-500 shrink-0">
                Trava Ativa: Pós-Carência
              </span>
            </div>

            {/* Tabela de Inadimplentes e Monitoramento */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-950">
                  Condutores em Acompanhamento Financeiro
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {metrics.defaultingDriversCount} registros
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="p-3 pl-5">Motorista</th>
                      <th className="p-3">Plano Atual</th>
                      <th className="p-3">Dívida Acumulada</th>
                      <th className="p-3">Status Cobrança</th>
                      <th className="p-3">Prazo Carência</th>
                      <th className="p-3 text-right pr-5">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 pl-5 font-bold text-slate-950">
                        Marcos Vinicius (mot-004)
                        <span className="block text-[10px] font-normal text-slate-400">
                          Ford Ka • (11) 98765-4321
                        </span>
                      </td>
                      <td className="p-3 font-semibold">Plano Prata</td>
                      <td className="p-3 font-black text-rose-600">R$ 49,90</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary-50 text-amber-900">
                          EM CARÊNCIA (Dia 2/3)
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">Restam 24h</td>
                      <td className="p-3 text-right pr-5">
                        <button
                          type="button"
                          onClick={() => {
                            subscriptionEngine.clearDebt("mot-004", 4990);
                            mostrarToast("Dívida regularizada com sucesso via PIX!");
                            recarregarDados();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs mr-1"
                        >
                          Quitar
                        </button>
                        <button
                          type="button"
                          onClick={() => mostrarToast("Notificação amigável enviada no WhatsApp!")}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition"
                        >
                          Avisar
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 pl-5 font-bold text-slate-950">
                        Rafael Silveira (mot-009)
                        <span className="block text-[10px] font-normal text-slate-400">
                          HB20 • (11) 91234-5678
                        </span>
                      </td>
                      <td className="p-3 font-semibold">Plano Ouro</td>
                      <td className="p-3 font-black text-rose-600">R$ 99,90</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900">
                          SUSPENSO
                        </span>
                      </td>
                      <td className="p-3 text-rose-600 font-bold">Carência Vencida</td>
                      <td className="p-3 text-right pr-5">
                        <button
                          type="button"
                          onClick={() => {
                            subscriptionEngine.clearDebt("mot-009", 9990);
                            mostrarToast("Motorista reativado no Trip Radar!");
                            recarregarDados();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs mr-1"
                        >
                          Reativar
                        </button>
                        <button
                          type="button"
                          onClick={() => mostrarToast("Proposta de parcelamento gerada!")}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition"
                        >
                          Renegociar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 5: DASHBOARD FINANCEIRO SAAS EXECUTIVO                          */}
        {/* =================================================================== */}
        {abaAtiva === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Grid Detalhado de Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">GMV Total Transacionado</span>
                  <DollarSign className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-2xl font-black text-slate-950">
                  {metrics.totalGmvBrl.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {metrics.totalRidesCount} corridas • Ticket Médio R${" "}
                  {metrics.averageTicketBrl.toFixed(2)}
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">Receita de Comissões</span>
                  <Percent className="w-4 h-4 text-primary-600" />
                </div>
                <div className="text-2xl font-black text-amber-700">
                  {metrics.monthlyCommissionRevenueBrl.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Take-rate ponderado de {metrics.effectiveTakeRatePercent}%
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">Receita de Assinaturas</span>
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-indigo-700">
                  {metrics.monthlySubscriptionRevenueBrl.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Mensalidades fixas recorrentes (MRR)
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase">Economia Gerada p/ Frota</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  +R$ 19.813,50
                </div>
                <span className="text-[11px] text-emerald-800 font-bold block">
                  Retido no bolso dos motoristas vs Uber
                </span>
              </div>
            </div>

            {/* Health Metrics (LTV, CAC, Churn) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-950">
                  Indicadores de Saúde SaaS do Marketplace
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Unidade Econômica Altamente Eficiente
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
                    Razão LTV / CAC
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    {(metrics.driverLtvBrl / metrics.driverCacBrl).toFixed(0)}x
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Churn Mensal
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {metrics.churnRatePercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL: CRIAR OU EDITAR PLANO                                        */}
        {/* =================================================================== */}
        {modalPlanoAberto && planoEmEdicao && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-950">
                  {planoEmEdicao.id ? `Editar Plano: ${planoEmEdicao.name}` : "Criar Novo Plano"}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalPlanoAberto(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
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
                    placeholder="Ex: Diamante, Prata Plus"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
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
                      <option value="DAILY">Diário</option>
                      <option value="WEEKLY">Semanal</option>
                      <option value="MONTHLY">Mensal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mensalidade (R$)
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
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Taxa Corrida (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={planoEmEdicao.commissionPercent ?? 0}
                      onChange={(e) =>
                        setPlanoEmEdicao((prev) => ({
                          ...prev,
                          commissionPercent: Number(e.target.value),
                        }))
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-black text-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tarifa Diária (R$ - opcional)
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
                      placeholder="Ex: 6.90"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tarifa Semanal (R$ - opcional)
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
                      placeholder="Ex: 34.90"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Benefícios (Um por linha)
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
                      className="rounded text-primary-600"
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
                      className="rounded text-emerald-500"
                    />
                    <span>Plano Ativo</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalPlanoAberto(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-sm"
                  >
                    Salvar Plano
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL: LANÇAMENTO MANUAL NA CARTEIRA (CRÉDITO / DÉBITO)             */}
        {/* =================================================================== */}
        {modalLancamentoAberto && walletSelecionada && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                      tipoLancamento === "CREDITO_MANUAL_ADMIN" || tipoLancamento === "BONUS"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950">
                      Lançamento em Carteira
                    </h3>
                    <p className="text-[11px] text-slate-500">{walletSelecionada.motoristaNome}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalLancamentoAberto(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSalvarLancamento} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Tipo de Operação
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "CREDITO_MANUAL_ADMIN", label: "Crédito (+)" },
                      { id: "DEBITO_MANUAL_ADMIN", label: "Débito (-)" },
                      { id: "BONUS", label: "Bônus (+)" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setTipoLancamento(t.id as "CREDITO_MANUAL_ADMIN" | "DEBITO_MANUAL_ADMIN" | "BONUS")
                        }
                        className={`py-2 px-1 rounded-xl text-xs font-black border transition ${
                          tipoLancamento === t.id
                            ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">Saldo Atual do Motorista:</span>
                  <span className="font-black text-slate-950">
                    {walletSelecionada.saldoBrl.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Valor da Operação (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      value={valorLancamentoInput}
                      onChange={(e) => setValorLancamentoInput(e.target.value)}
                      placeholder="50,00"
                      className="w-full pl-9 pr-3 py-2 text-sm font-black rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Descrição / Motivo do Lançamento
                  </label>
                  <input
                    type="text"
                    value={descricaoLancamentoInput}
                    onChange={(e) => setDescricaoLancamentoInput(e.target.value)}
                    placeholder="Ex: Ajuste manual, bonificação de corrida ou estorno"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalLancamentoAberto(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-xl text-white font-black text-xs shadow-xs transition ${
                      tipoLancamento === "DEBITO_MANUAL_ADMIN"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    Confirmar Lançamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL: EXTRATO COMPLETO DA CARTEIRA DO MOTORISTA                    */}
        {/* =================================================================== */}
        {modalExtratoAberto && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950">
                      Extrato da Carteira do Motorista
                    </h3>
                    <p className="text-[11px] text-slate-500">{motoristaExtratoNome}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalExtratoAberto(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-2">Data / Hora</th>
                      <th className="py-2.5 px-2">Tipo</th>
                      <th className="py-2.5 px-2">Descrição</th>
                      <th className="py-2.5 px-2">Operador</th>
                      <th className="py-2.5 px-2 text-right">Valor</th>
                      <th className="py-2.5 px-2 text-right">Saldo Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extratoMotorista.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          Nenhuma movimentação registrada nesta carteira.
                        </td>
                      </tr>
                    ) : (
                      extratoMotorista.map((t) => {
                        const isEntrada =
                          t.tipo === "RECARGA_PIX" ||
                          t.tipo === "CREDITO_MANUAL_ADMIN" ||
                          t.tipo === "BONUS";
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-2 text-[11px] text-slate-600 whitespace-nowrap">
                              {new Date(t.timestamp).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2.5 px-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isEntrada
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {t.tipo.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-slate-800 font-medium">
                              {t.descricao}
                            </td>
                            <td className="py-2.5 px-2 text-[11px] text-slate-500">
                              {t.operadorAdmin || "Sistema"}
                            </td>
                            <td
                              className={`py-2.5 px-2 text-right font-black ${
                                isEntrada ? "text-emerald-700" : "text-red-700"
                              }`}
                            >
                              {isEntrada ? "+" : "-"}
                              {t.valorBrl.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                            <td className="py-2.5 px-2 text-right font-bold text-slate-950">
                              {t.saldoAposBrl.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalExtratoAberto(false)}
                  className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
                >
                  Fechar Extrato
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GuardiaoAcesso>
  );
}
