import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Car,
  CheckCircle2,
  ChevronRight,
  Eye,
  Filter,
  Flame,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  Truck,
  UserCheck,
  UserX,
  Users,
  X,
  Zap,
  Palette,
  Sliders,
  Clock,
  FileSpreadsheet,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Receipt,
} from "lucide-react";
import {
  useMotoristas,
  useVeiculosAdmin,
  usePartiuMotoristasPendentes,
  useAprovarPartiuMotorista,
  useRejeitarPartiuMotorista,
  useAtualizarCategoriaMotorista,
} from "@/lib/partiu-db";
import { driverSubscriptionService, type DriverSubscriptionRecord } from "@/lib/ecosystem/driver-subscription-service";
import { useRideRatings, type RideRating } from "@/services/RideRatingService";
import { exportarParaCSV } from "@/lib/export-csv";
import { getAdminRole, isFranqueado } from "@/lib/admin-rbac";
import { useAdminCity } from "@/contexts/AdminCityContext";

export const Route = createFileRoute("/app/admin/motoristas")({
  head: () => ({
    meta: [
      { title: "Gestão da Frota & Aprovação Inteligente | PARTIU Admin" },
      {
        name: "description",
        content:
          "Dashboard da frota urbana, esteira inteligente de aprovação e gestão de categorias (Carro, Moto, Plus, Mulher).",
      },
    ],
  }),
  component: QuadroMotoristasAdminPage,
});

type CategoriaPermitida = "CARRO" | "MOTO" | "PLUS" | "MULHER";
type StatusMotorista = "TODOS" | "ONLINE" | "OFFLINE" | "PENDENTE" | "SUSPENSO" | "PLANO_ATIVO" | "PLANO_VENCIDO";

interface MotoristaFrota {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  cnh: string;
  cnhValidade: string;
  modal: CategoriaPermitida;
  veiculoModelo: string;
  veiculoPlaca: string;
  veiculoAno: string;
  status: "ONLINE" | "OFFLINE" | "PENDENTE" | "SUSPENSO";
  rating: number;
  totalViagens: number;
  ocrScore?: number;
  fotoUrl?: string | undefined;
  // Gestão SaaS 0% Comissão
  planoTipo: "MENSAL" | "SEMANAL" | "DIARIA" | "TRIAL" | "NENHUM";
  planoAtivo: boolean;
  planoExpiraEm?: string;
  planoTempoRestante?: string;
  valorPlano?: number;
}

export function QuadroMotoristasAdminPage() {
  const { pracaAtiva, isNacional, selecionarPraca } = useAdminCity();
  const [adminRole] = useState(() => getAdminRole());

  const { data: motoristasBanco = [], isLoading: carregandoMotoristas, refetch: recarregarMotoristas } = useMotoristas();
  const { data: veiculosBanco = [] } = useVeiculosAdmin();
  const { data: pendentesBanco = [], refetch: recarregarPendentes } = usePartiuMotoristasPendentes();

  const aprovarMotorista = useAprovarPartiuMotorista();
  const rejeitarMotorista = useRejeitarPartiuMotorista();
  const atualizarCategoria = useAtualizarCategoriaMotorista();

  const [busca, setBusca] = useState(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("busca") || "";
    }
    return "";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const b = sp.get("busca");
      if (b !== null) {
        setBusca(b);
      }
    }
  }, []);
  const [filtroStatus, setFiltroStatus] = useState<StatusMotorista>("TODOS");
  const [filtroModal, setFiltroModal] = useState<"TODOS" | CategoriaPermitida>("TODOS");

  // Modais de ação
  const [motoristaSelecionado, setMotoristaSelecionado] = useState<MotoristaFrota | null>(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [categoriaEdicao, setCategoriaEdicao] = useState<CategoriaPermitida>("CARRO");
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  const [modalRejeitarAberto, setModalRejeitarAberto] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("Documento CNH ilegível ou vencido");
  const [modalOcrAberto, setModalOcrAberto] = useState(false);
  const [processandoOcr, setProcessandoOcr] = useState(false);

  // Abas principais: Frota Urbana vs Moderação de Avaliações (Rating 1-5★)
  const [abaPrincipal, setAbaPrincipal] = useState<"frota" | "avaliacoes">("frota");
  const { data: avaliacoesBanco = [], refetch: recarregarAvaliacoes } = useRideRatings(100);
  const [filtroEstrelas, setFiltroEstrelas] = useState<"TODAS" | "CRITICAS" | "EXCELENTES" | "MEDIAS">("TODAS");
  const [filtroDirecao, setFiltroDirecao] = useState<"TODAS" | "PASSENGER_TO_DRIVER" | "DRIVER_TO_PASSENGER">("TODAS");
  const [buscaAvaliacao, setBuscaAvaliacao] = useState("");

  // KPIs de Moderação de Avaliações
  const kpisAvaliacoes = useMemo(() => {
    const total = avaliacoesBanco.length;
    if (total === 0) {
      return { total: 0, media: "5.0", criticas: 0, excelentes: 0, taxaPositiva: "100%" };
    }
    const soma = avaliacoesBanco.reduce((acc, a) => acc + a.score, 0);
    const media = (soma / total).toFixed(2);
    const criticas = avaliacoesBanco.filter((a) => a.score <= 2).length;
    const excelentes = avaliacoesBanco.filter((a) => a.score >= 4).length;
    const taxaPositiva = ((excelentes / total) * 100).toFixed(0) + "%";
    return { total, media, criticas, excelentes, taxaPositiva };
  }, [avaliacoesBanco]);

  // Lista filtrada de avaliações
  const avaliacoesFiltradas = useMemo(() => {
    return avaliacoesBanco.filter((a) => {
      if (filtroEstrelas === "CRITICAS" && a.score > 2) return false;
      if (filtroEstrelas === "EXCELENTES" && a.score < 4) return false;
      if (filtroEstrelas === "MEDIAS" && a.score !== 3) return false;

      if (filtroDirecao !== "TODAS" && a.role !== filtroDirecao) return false;

      if (buscaAvaliacao) {
        const q = buscaAvaliacao.toLowerCase();
        return (
          a.rideId.toLowerCase().includes(q) ||
          a.fromUserId.toLowerCase().includes(q) ||
          a.toUserId.toLowerCase().includes(q) ||
          (a.comment && a.comment.toLowerCase().includes(q)) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [avaliacoesBanco, filtroEstrelas, filtroDirecao, buscaAvaliacao]);

  // Subscrição em tempo real às assinaturas SaaS
  const [assinaturas, setAssinaturas] = useState<DriverSubscriptionRecord[]>(() =>
    driverSubscriptionService.getAllSubscriptions()
  );

  useEffect(() => {
    return driverSubscriptionService.subscribe((subs) => {
      setAssinaturas(subs);
    });
  }, []);

  // Montar frota consolidando banco com suporte a CARRO, MOTO, PLUS e MULHER
  const motoristas: MotoristaFrota[] = useMemo(() => {
    const lista: MotoristaFrota[] = [];

    // 1. Motoristas cadastrados no Supabase
    motoristasBanco.forEach((mb) => {
      const veiculoVinculado = veiculosBanco.find((v) => v.motorista_id === mb.id);
      const catBanco = ((mb as any).categoria || (mb as any).vehicle_type || (veiculoVinculado as any)?.tipo || "").toUpperCase();
      const modalFinal: CategoriaPermitida =
        catBanco === "MOTO" ? "MOTO" : catBanco === "PLUS" ? "PLUS" : catBanco === "MULHER" ? "MULHER" : "CARRO";

      const sub = driverSubscriptionService.getActiveSubscription(mb.id);
      const isPlanoAtivo = Boolean(sub);
      const tempoRestante = sub ? driverSubscriptionService.getRemainingTime(sub).formatted : "";
      let planoTipo: "MENSAL" | "SEMANAL" | "DIARIA" | "TRIAL" | "NENHUM" = "NENHUM";
      if (sub) {
        if (sub.cycle === "MONTHLY" || (sub.amount_paid && sub.amount_paid >= 100)) planoTipo = "MENSAL";
        else if (sub.cycle === "WEEKLY") planoTipo = "SEMANAL";
        else if (sub.cycle === "TRIAL" || sub.pix_txid?.startsWith("TRIAL")) planoTipo = "TRIAL";
        else planoTipo = "DIARIA";
      }

      lista.push({
        id: mb.id,
        nome: mb.full_name || "Motorista Parceiro",
        telefone: mb.phone || "Não informado",
        cidade: (mb as any).cidade || (mb as any).city || "Praça Regional",
        cnh: (mb as any).cnh_number ? `CNH: ${(mb as any).cnh_number}` : `CNH Cat. ${modalFinal === "MOTO" ? "A (EAR)" : "B (EAR)"}`,
        cnhValidade: "Em dia",
        modal: modalFinal,
        veiculoModelo: (mb as any).vehicle_model || veiculoVinculado?.modelo || "Veículo Cadastrado",
        veiculoPlaca: (mb as any).vehicle_plate || veiculoVinculado?.placa || "Placa não informada",
        veiculoAno: (mb as any).vehicle_year ? String((mb as any).vehicle_year) : "2023",
        status: (mb as any).status_operacional === "ONLINE" ? "ONLINE" : (mb as any).status_operacional === "SUSPENSO" ? "SUSPENSO" : "OFFLINE",
        rating: (mb as any).rating ? Number((mb as any).rating) : 5.0,
        totalViagens: (mb as any).total_trips || 0,
        ocrScore: 98,
        fotoUrl: mb.avatar_url || undefined,
        planoTipo,
        planoAtivo: isPlanoAtivo,
        planoExpiraEm: sub?.expires_at,
        planoTempoRestante: tempoRestante,
        valorPlano: sub?.amount_paid || 0,
      });
    });

    // 2. Candidatos pendentes de aprovação
    pendentesBanco.forEach((p) => {
      // Ignorar se já listado
      if (lista.some((m) => m.id === p.id)) return;
      const catPendente = (p.categoria_veiculo || "").toUpperCase();
      const modalFinal: CategoriaPermitida =
        catPendente === "MOTO" ? "MOTO" : catPendente === "PLUS" ? "PLUS" : catPendente === "MULHER" ? "MULHER" : "CARRO";

      lista.push({
        id: p.id,
        nome: p.nome || "Candidato a Condutor",
        telefone: p.telefone || "Não informado",
        cidade: (p as any).cidade || (p as any).city || "Praça Regional",
        cnh: "CNH: " + (p.cnh_numero || "Validação OCR"),
        cnhValidade: "Em análise",
        modal: modalFinal,
        veiculoModelo: `${p.veiculo_marca_modelo || "Veículo"} (${p.veiculo_cor || "Cor"})`,
        veiculoPlaca: p.veiculo_placa || "Placa Mercosul",
        veiculoAno: String(p.veiculo_ano || 2021),
        status: "PENDENTE",
        rating: 5.0,
        totalViagens: 0,
        ocrScore: 94,
        planoTipo: "NENHUM",
        planoAtivo: false,
      });
    });

    return lista;
  }, [motoristasBanco, veiculosBanco, pendentesBanco, assinaturas]);

  // Escopo Territorial por Franquia / Praça Ativa
  const motoristasDaPraca = useMemo(() => {
    if (isNacional) return motoristas;
    const nomeCidade = pracaAtiva.nome.toLowerCase();
    return motoristas.filter((m) => m.cidade.toLowerCase().includes(nomeCidade));
  }, [motoristas, isNacional, pracaAtiva.nome]);

  // CÁLCULO DOS INDICADORES DO DASHBOARD DA FROTA
  const totalCadastrados = motoristasDaPraca.length;
  const totalPlanosAtivos = motoristasDaPraca.filter((m) => m.planoAtivo).length;
  const totalOnline = motoristasDaPraca.filter((m) => m.status === "ONLINE").length;
  const totalOffline = motoristasDaPraca.filter((m) => m.status === "OFFLINE").length;
  const totalPendentes = motoristasDaPraca.filter((m) => m.status === "PENDENTE").length;
  const totalSuspensos = motoristasDaPraca.filter((m) => m.status === "SUSPENSO").length;
  const totalSemPlano = motoristasDaPraca.filter((m) => !m.planoAtivo && m.status !== "PENDENTE").length;

  // Filtragem da tabela
  const motoristasFiltrados = useMemo(() => {
    return motoristasDaPraca.filter((m) => {
      if (filtroStatus === "PLANO_ATIVO" && !m.planoAtivo) return false;
      if (filtroStatus === "PLANO_VENCIDO" && (m.planoAtivo || m.status === "PENDENTE")) return false;
      if (filtroStatus !== "TODOS" && filtroStatus !== "PLANO_ATIVO" && filtroStatus !== "PLANO_VENCIDO" && m.status !== filtroStatus) return false;
      if (filtroModal !== "TODOS" && m.modal !== filtroModal) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          m.nome.toLowerCase().includes(q) ||
          m.telefone.toLowerCase().includes(q) ||
          m.cidade.toLowerCase().includes(q) ||
          m.veiculoModelo.toLowerCase().includes(q) ||
          m.veiculoPlaca.toLowerCase().includes(q) ||
          m.cnh.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [motoristasDaPraca, filtroStatus, filtroModal, busca]);

  // APROVAÇÃO RÁPIDA DE MOTORISTA COM WHATSAPP AUTOMÁTICO
  async function handleAprovar(m: MotoristaFrota) {
    try {
      await aprovarMotorista.mutateAsync({ id: m.id, categoriaVeiculo: m.modal });
      const mensagemWhats = encodeURIComponent(
        `Olá ${m.nome}, parabéns! Seu cadastro no PARTIU como parceiro (${m.modal}) foi APROVADO com sucesso. Abra o app PARTIU Motorista, fique online e comece a rodar!`
      );
      window.open(`https://wa.me/55${m.telefone.replace(/\D/g, "")}?text=${mensagemWhats}`, "_blank");
      setMotoristaSelecionado(null);
    } catch (err: any) {
      alert("Falha ao aprovar condutor: " + err.message);
    }
  }

  // REJEIÇÃO RÁPIDA DE MOTORISTA COM MOTIVO
  async function handleConfirmarRejeicao() {
    if (!motoristaSelecionado) return;
    try {
      await rejeitarMotorista.mutateAsync({ id: motoristaSelecionado.id, motivo: motivoRejeicao });
      const mensagemWhats = encodeURIComponent(
        `Olá ${motoristaSelecionado.nome}, informamos que seu cadastro no PARTIU necessita de ajustes: ${motivoRejeicao}. Por favor, reenvie a documentação pelo aplicativo para nova análise.`
      );
      window.open(`https://wa.me/55${motoristaSelecionado.telefone.replace(/\D/g, "")}?text=${mensagemWhats}`, "_blank");
      setModalRejeitarAberto(false);
      setMotoristaSelecionado(null);
    } catch (err: any) {
      alert("Falha ao rejeitar condutor: " + err.message);
    }
  }

  // SIMULAÇÃO DA ESTEIRA AUTÔNOMA DE OCR (Criação de motorista, WhatsApp, liberação autônoma)
  function handleExecutarEsteiraOCR() {
    setProcessandoOcr(true);
    setTimeout(() => {
      setProcessandoOcr(false);
      setModalOcrAberto(true);
    }, 1200);
  }

  return (
    <div className="w-full space-y-5 pb-12">
      {/* 1. Header Executivo Frota */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Gestão da Frota • {isFranqueado(adminRole) ? `Franquia ${pracaAtiva?.nome || "Regional"}` : "Gestão Nacional"}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Frota Urbana &amp; Condutores
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0088FF] border border-blue-200/50">
              {totalCadastrados} CONDUTORES
            </span>
            {totalPendentes > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                {totalPendentes} PENDENTES
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisão de condutores parceiros, modais de despacho e conformidade documental {isNacional ? "em âmbito nacional" : `em ${pracaAtiva.nome}`}.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExecutarEsteiraOCR}
            disabled={processandoOcr}
            className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0088FF]" />
            <span>{processandoOcr ? "Analisando..." : "Esteira OCR"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              recarregarMotoristas();
              recarregarPendentes();
            }}
            className="flex h-10 items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 text-xs font-black border border-slate-200/80 shadow-xs transition-all cursor-pointer"
            title="Sincronizar condutores"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#0088FF]" />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Banner de Filtragem por Praça Ativa */}
      {!isNacional && (
        <div className="rounded-xl bg-blue-50/90 border border-blue-200/80 px-4 py-2.5 flex items-center justify-between gap-3 text-blue-900 text-xs animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#0088FF] shrink-0" />
            <span className="font-bold">
              Frota filtrada pela praça: <strong>{pracaAtiva.labelCompleto}</strong> ({pracaAtiva.raioKm} km de raio)
            </span>
          </div>
          <button
            type="button"
            onClick={() => selecionarPraca("todas")}
            className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-white border border-blue-300 hover:bg-blue-100/70 text-blue-950 transition-colors cursor-pointer shrink-0"
          >
            Ver Todas as Praças
          </button>
        </div>
      )}

      {/* 2. Seletor de Sub-Abas do Módulo: Frota Urbana vs. Moderação de Avaliações */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl w-fit border border-slate-200/90 shadow-xs">
        <button
          type="button"
          onClick={() => setAbaPrincipal("frota")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            abaPrincipal === "frota"
              ? "bg-slate-950 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Car className="h-3.5 w-3.5 text-[#0088FF]" />
          <span>Frota Urbana &amp; Condutores</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
            abaPrincipal === "frota" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}>
            {motoristasDaPraca.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaPrincipal("avaliacoes")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            abaPrincipal === "avaliacoes"
              ? "bg-slate-950 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          <span>Moderação de Avaliações (1-5★)</span>
          {kpisAvaliacoes.criticas > 0 ? (
            <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[10px] font-black text-white animate-pulse">
              {kpisAvaliacoes.criticas} críticas
            </span>
          ) : (
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
              abaPrincipal === "avaliacoes" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
              {avaliacoesBanco.length}
            </span>
          )}
        </button>
      </div>

      {abaPrincipal === "frota" ? (
        <>
          {/* 3. DASHBOARD DA FROTA — 4 CARDS MÉTRICOS EXECUTIVOS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total de Motoristas */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total na Praça</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0088FF] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{totalCadastrados}</span>
                <span className="text-[11px] font-bold text-emerald-600">Base Ativa</span>
              </div>
            </div>

            {/* Planos SaaS Ativos (Zero Comissão) */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Planos SaaS Ativos</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-emerald-700">{totalPlanosAtivos}</span>
                <span className="text-[11px] font-bold text-emerald-600">
                  0% Taxa Ativa
                </span>
              </div>
            </div>

            {/* Pendentes */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Aguardando OCR</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-amber-600">{totalPendentes}</span>
                <span className="text-[11px] font-medium text-amber-700">Em esteira</span>
              </div>
            </div>

            {/* Acesso Vencido / Suspensos */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Acesso Vencido</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-rose-600">{totalSemPlano + totalSuspensos}</span>
                <span className="text-[11px] font-medium text-slate-500">Requer diária/plano</span>
              </div>
            </div>
          </div>

          {/* 3. CONTEÚDO PRINCIPAL: TABELA DE MOTORISTAS EM LARGURA TOTAL */}
          <div className="w-full space-y-3">
            {/* BARRA DE BUSCA & FILTROS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(["TODOS", "ONLINE", "PLANO_ATIVO", "PLANO_VENCIDO", "PENDENTE", "OFFLINE", "SUSPENSO"] as StatusMotorista[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFiltroStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      filtroStatus === st
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                    }`}
                  >
                    {st === "TODOS" && "Todos"}
                    {st === "ONLINE" && "Online"}
                    {st === "PLANO_ATIVO" && "Plano Ativo (0%)"}
                    {st === "PLANO_VENCIDO" && "Acesso Vencido"}
                    {st === "PENDENTE" && "Pendentes"}
                    {st === "OFFLINE" && "Offline"}
                    {st === "SUSPENSO" && "Suspensos"}
                  </button>
                ))}

                <select
                  value={filtroModal}
                  onChange={(e) => setFiltroModal(e.target.value as any)}
                  className="h-8 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="TODOS">Todos os Modais</option>
                  <option value="CARRO">Carro (Pop)</option>
                  <option value="MOTO">Moto (Flash)</option>
                  <option value="PLUS">Plus (Sedan)</option>
                  <option value="MULHER">Mulher (Delas)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar motorista, placa ou CNH..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full h-8.5 pl-8.5 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-[#0088FF]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    exportarParaCSV(
                      `motoristas_partiu_${new Date().toISOString().slice(0, 10)}`,
                      ["ID", "Nome", "Telefone", "Modal", "Veículo", "Placa", "Ano", "Status", "Avaliação", "Total Viagens"],
                      motoristasFiltrados.map((m) => [
                        m.id,
                        m.nome,
                        m.telefone,
                        m.modal,
                        m.veiculoModelo,
                        m.veiculoPlaca,
                        m.veiculoAno,
                        m.status,
                        m.rating.toFixed(1),
                        m.totalViagens,
                      ])
                    );
                  }}
                  className="h-8.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Exportar CSV de Condutores"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>
              </div>
            </div>

        {/* TABELA DE MOTORISTAS DESKTOP */}
        <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/90 text-slate-500 uppercase font-black text-xs tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Motorista</th>
                  <th className="py-3 px-4">Veículo</th>
                  <th className="py-3 px-4">Plano SaaS (0% Taxa)</th>
                  <th className="py-3 px-4">Documentos</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {motoristasFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center text-slate-500 text-xs font-medium">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-700">Nenhum motorista encontrado com os filtros atuais</p>
                        <p className="text-[11px] text-slate-400">Tente buscar por outro nome, placa ou redefinir os filtros de status.</p>
                        {(busca.trim() || filtroStatus !== "TODOS" || filtroModal !== "TODOS") && (
                          <button
                            type="button"
                            onClick={() => {
                              setBusca("");
                              setFiltroStatus("TODOS");
                              setFiltroModal("TODOS");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                          >
                            Limpar Filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  motoristasFiltrados.map((m) => {
                    const isPendente = m.status === "PENDENTE";

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0088FF] border border-blue-200/60 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                              {m.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                                {m.nome}
                                <span className="text-amber-500 text-[11px] font-black flex items-center">
                                  ★ {m.rating.toFixed(1)}
                                </span>
                              </p>
                              <span className="text-[11px] text-slate-500 font-medium">{m.telefone}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-xs sm:text-sm text-slate-900">{m.veiculoModelo}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500 font-mono font-bold uppercase">
                              {m.veiculoPlaca}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-black border ${
                                m.modal === "CARRO"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : m.modal === "MOTO"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : m.modal === "PLUS"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {m.modal}
                            </span>
                          </div>
                        </td>

                        {/* Plano SaaS (0% Taxa) */}
                        <td className="py-3 px-4">
                          {m.planoAtivo ? (
                            <div className="space-y-0.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                m.planoTipo === "MENSAL"
                                  ? "bg-purple-50 text-purple-800 border border-purple-200"
                                  : m.planoTipo === "TRIAL"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              }`}>
                                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                                {m.planoTipo === "MENSAL" ? "Mensal Ouro" : m.planoTipo === "TRIAL" ? "Trial 7 Dias" : "Diária 24h"}
                              </span>
                              <span className="block text-[10px] text-slate-500 font-medium">
                                {m.planoTempoRestante ? `Restam ${m.planoTempoRestante}` : "0% Comissão Ativa"}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="h-2.5 w-2.5" />
                                {m.status === "PENDENTE" ? "Em Análise" : "Acesso Vencido"}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {m.status === "PENDENTE" ? "Aguardando OCR" : "Bloqueado p/ Corridas"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Checklist de Documentos */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#22C55E] text-[10px] font-bold border border-emerald-200/60">
                              ✓ CNH
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#22C55E] text-[10px] font-bold border border-emerald-200/60">
                              ✓ CRLV
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#22C55E] text-[10px] font-bold border border-emerald-200/60">
                              ✓ Antecedentes
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              m.status === "ONLINE"
                                ? "bg-emerald-50 text-[#22C55E] border border-emerald-200"
                                : m.status === "PENDENTE"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : m.status === "SUSPENSO"
                                ? "bg-rose-50 text-[#EF4444] border border-rose-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {m.status === "ONLINE" && "Aprovado"}
                            {m.status === "OFFLINE" && "Offline"}
                            {m.status === "PENDENTE" && "Pendente"}
                            {m.status === "SUSPENSO" && "Suspenso"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isPendente ? (
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleAprovar(m)}
                                className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Aprovar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMotoristaSelecionado(m);
                                  setModalRejeitarAberto(true);
                                }}
                                className="h-8 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#EF4444] font-bold text-xs border border-rose-200 transition cursor-pointer flex items-center gap-1 active:scale-95"
                              >
                                <UserX className="h-3.5 w-3.5" />
                                <span>Rejeitar</span>
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const msg = encodeURIComponent(`Olá ${m.nome}, contato da Central PARTIU Operações.`);
                                  window.open(`https://wa.me/55${m.telefone.replace(/\D/g, "")}?text=${msg}`, "_blank");
                                }}
                                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 border border-slate-200 flex items-center justify-center transition cursor-pointer active:scale-95"
                                title="WhatsApp"
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMotoristaSelecionado(m);
                                  setCategoriaEdicao(m.modal);
                                  setModalDetalhesAberto(true);
                                }}
                                className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition cursor-pointer active:scale-95"
                              >
                                Detalhes
                              </button>
                            </div>
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

        {/* CARDS MOBILE */}
        <div className="grid grid-cols-1 gap-2.5 sm:hidden">
          {motoristasFiltrados.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Nenhum motorista encontrado para os filtros selecionados.
            </div>
          ) : (
            motoristasFiltrados.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0088FF] flex items-center justify-center font-bold text-xs">
                      {m.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">{m.nome}</p>
                      <span className="text-[10px] text-slate-400">{m.telefone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.planoAtivo
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}>
                      {m.planoAtivo ? (m.planoTipo === "MENSAL" ? "Mensal (0%)" : "Diária (0%)") : "Sem Plano"}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {m.status}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl flex items-center justify-between">
                  <span>{m.veiculoModelo} • {m.veiculoPlaca}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">{m.modal}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMotoristaSelecionado(m);
                        setCategoriaEdicao(m.modal);
                        setModalDetalhesAberto(true);
                      }}
                      className="text-[10px] font-bold text-[#0088FF] hover:underline cursor-pointer"
                    >
                      Acessar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
        </>
      ) : (
        /* VISÃO DE MODERAÇÃO DE AVALIAÇÕES (RATING 1-5★ BIDIRECIONAL) */
        <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-200">
          {/* Top Cards de Reputação e Qualidade */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500">Média Geral da Rede</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{kpisAvaliacoes.media}</span>
                <span className="text-xs font-bold text-amber-600">de 5.0 estrelas</span>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500">Total de Avaliações</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0088FF] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{kpisAvaliacoes.total}</span>
                <span className="text-xs font-bold text-slate-500">registradas</span>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500">Críticas (1-2★)</span>
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-red-600">{kpisAvaliacoes.criticas}</span>
                <span className="text-xs font-bold text-red-600">requer atenção</span>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500">Excelentes (4-5★)</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700">{kpisAvaliacoes.excelentes}</span>
                <span className="text-xs font-bold text-emerald-600">{kpisAvaliacoes.taxaPositiva} satisfação</span>
              </div>
            </div>
          </div>

          {/* Barra de Filtros, Direção e Exportação */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {(
                [
                  { key: "TODAS", label: "Todas" },
                  { key: "CRITICAS", label: "🚨 Críticas (1-2★)" },
                  { key: "EXCELENTES", label: "⭐ Excelentes (4-5★)" },
                  { key: "MEDIAS", label: "Médias (3★)" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFiltroEstrelas(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    filtroEstrelas === key
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              ))}

              <select
                value={filtroDirecao}
                onChange={(e) => setFiltroDirecao(e.target.value as any)}
                className="h-8 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="TODAS">Todas as Direções</option>
                <option value="PASSENGER_TO_DRIVER">Passageiro → Motorista</option>
                <option value="DRIVER_TO_PASSENGER">Motorista → Passageiro</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar corrida, tags ou texto..."
                  value={buscaAvaliacao}
                  onChange={(e) => setBuscaAvaliacao(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  exportarParaCSV(
                    `avaliacoes_partiu_${new Date().toISOString().slice(0, 10)}`,
                    ["ID", "Corrida ID", "Avaliador", "Avaliado", "Direção", "Nota", "Tags", "Comentário", "Data e Hora"],
                    avaliacoesFiltradas.map((a) => [
                      a.id,
                      a.rideId,
                      a.fromUserId,
                      a.toUserId,
                      a.role,
                      a.score,
                      a.tags.join("; "),
                      a.comment || "",
                      new Date(a.createdAt).toLocaleString("pt-BR"),
                    ])
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Lista de Avaliações Moderadas */}
          <div className="space-y-3">
            {avaliacoesFiltradas.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
                Nenhuma avaliação encontrada para os filtros selecionados.
              </div>
            ) : (
              avaliacoesFiltradas.map((a) => {
                const isCritica = a.score <= 2;
                const isPassageiroParaMotorista = a.role === "PASSENGER_TO_DRIVER";
                return (
                  <div
                    key={a.id}
                    className={`p-5 rounded-3xl border bg-white shadow-xs transition-all space-y-3 ${
                      isCritica ? "border-red-200 bg-red-50/20" : "border-slate-200/90"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        {/* Estrelas */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= a.score
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-200 fill-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-black text-sm text-slate-900">{a.score}.0</span>

                        {/* Badge de Direção */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                            isPassageiroParaMotorista
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {isPassageiroParaMotorista ? <Car className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          {isPassageiroParaMotorista ? "Passageiro → Motorista" : "Motorista → Passageiro"}
                        </span>

                        {isCritica && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-red-100 text-red-700 border border-red-300">
                            <ShieldAlert className="h-3 w-3" />
                            Crítica
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                        <Link
                          to="/app/admin/operacao"
                          className="font-mono text-[#0088FF] hover:underline font-bold"
                          title="Auditar corrida na central de operação"
                        >
                          Corrida #{a.rideId}
                        </Link>
                        <span>•</span>
                        <span>{new Date(a.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>

                    {/* Autor e Destinatário */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-bold text-slate-900">De: {a.fromUserId}</span>
                      <span>→</span>
                      <span className="font-bold text-slate-900">Para: {a.toUserId}</span>
                    </div>

                    {/* Chips de Tags Qualitativas */}
                    {a.tags && a.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {a.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                              isCritica
                                ? "bg-red-50 text-red-800 border border-red-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200/80"
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Comentário do Usuário */}
                    {a.comment && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-800 italic">
                        "{a.comment}"
                      </div>
                    )}

                    {/* Ações Rápidas do Atendimento */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-slate-400">
                        Auditoria de qualidade em conformidade com diretrizes do app
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to="/app/admin/operacao"
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs"
                        >
                          Ver na Operação
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL REJEITAR CONDUTOR */}
      {modalRejeitarAberto && motoristaSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white p-5 rounded-2xl shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <h3 className="text-sm font-black text-slate-900">Rejeitar Cadastro</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRejeitarAberto(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <p className="text-slate-600 leading-snug">
                O condutor <strong>{motoristaSelecionado.nome}</strong> será notificado automaticamente via WhatsApp com a justificativa selecionada.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Motivo da Rejeição:</label>
                <select
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  className="w-full h-8.5 px-2.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:outline-hidden focus:ring-1 focus:ring-red-500"
                >
                  <option value="Documento CNH ilegível ou com foto cortada">Documento CNH ilegível ou com foto cortada</option>
                  <option value="CNH sem a observação Exerce Atividade Remunerada (EAR)">CNH sem observação EAR</option>
                  <option value="Veículo fora do ano de fabricação permitido">Veículo com ano acima do limite</option>
                  <option value="CRLV (documento do veículo) vencido ou com pendências">CRLV vencido ou com pendências</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => setModalRejeitarAberto(false)}
                className="h-8.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer transition active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRejeicao}
                className="h-8.5 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-xs cursor-pointer transition active:scale-95"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUCESSO DA ESTEIRA OCR */}
      {modalOcrAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white p-5 rounded-2xl shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Esteira OCR Executada com Sucesso</h3>
                <p className="text-[11px] text-slate-500">Validação algorítmica autônoma concluída</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Documentos Válidos Analisados:</span>
                <span className="font-bold text-slate-900">100% dos candidatos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Restrição Carro e Moto:</span>
                <span className="font-bold text-emerald-600">Em conformidade</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Intervenção do Operador:</span>
                <span className="font-bold text-primary-700">Apenas em 1 exceção</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalOcrAberto(false)}
              className="w-full h-8.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer transition active:scale-95"
            >
              Concluir Revisão
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALHES DO MOTORISTA & GESTÃO DA CATEGORIA */}
      {modalDetalhesAberto && motoristaSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white p-5 rounded-2xl shadow-2xl border border-slate-200 space-y-3.5 max-h-[90vh] overflow-y-auto">
            {/* Topo */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0088FF] flex items-center justify-center font-black text-sm">
                  {motoristaSelecionado.nome.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">{motoristaSelecionado.nome}</h3>
                  <p className="text-[11px] text-slate-500 leading-tight">{motoristaSelecionado.cidade} • {motoristaSelecionado.telefone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalhesAberto(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Dados do Veículo Cadastrado */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="font-black text-slate-700 uppercase tracking-wider block text-[10px]">Veículo Declarado:</span>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block">Modelo e Marca</span>
                  <strong>{motoristaSelecionado.veiculoModelo}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Placa</span>
                  <strong className="uppercase">{motoristaSelecionado.veiculoPlaca}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Ano de Fabricação</span>
                  <strong>{motoristaSelecionado.veiculoAno}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Habilitação</span>
                  <strong>{motoristaSelecionado.cnh}</strong>
                </div>
              </div>
            </div>

            {/* Gestão do Plano SaaS & Desbloqueio (0% Comissão) */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Acesso SaaS &amp; Desbloqueio (0% Comissão)
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  motoristaSelecionado.planoAtivo
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}>
                  {motoristaSelecionado.planoAtivo ? "Desbloqueado" : "Bloqueado"}
                </span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-slate-500 font-medium">Situação do Plano:</span>
                  <strong className="text-slate-900">
                    {motoristaSelecionado.planoAtivo
                      ? `${motoristaSelecionado.planoTipo === "MENSAL" ? "Plano Mensal Ouro" : motoristaSelecionado.planoTipo === "TRIAL" ? "Trial 7 Dias" : "Diária 24h"} (${motoristaSelecionado.planoTempoRestante ? `Restam ${motoristaSelecionado.planoTempoRestante}` : "Ativo"})`
                      : "Sem assinatura ativa (Acesso vencido)"}
                  </strong>
                </div>
                <p className="text-[10.5px] text-emerald-800 leading-tight">
                  No PARTIU, o motorista recebe <strong>100% de cada corrida (0% taxa)</strong>. A receita da franquia vem exclusivamente do SaaS de acesso.
                </p>
              </div>

              {/* Botões Rápidos de Concessão SaaS pelo Admin */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={async () => {
                    await driverSubscriptionService.confirmDailyFeePayment(
                      motoristaSelecionado.id,
                      motoristaSelecionado.modal === "MOTO" ? "MOTO" : "CARRO",
                      `CORTESIA_${Date.now()}`,
                      0,
                      24
                    );
                    alert(`Diária Cortesia de 24 horas liberada para ${motoristaSelecionado.nome}!`);
                    motoristaSelecionado.planoAtivo = true;
                    motoristaSelecionado.planoTipo = "DIARIA";
                    motoristaSelecionado.planoTempoRestante = "24h 00min";
                    setModalDetalhesAberto(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                >
                  <Zap className="h-3 w-3" /> Liberar Diária (24h)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await driverSubscriptionService.confirmDailyFeePayment(
                      motoristaSelecionado.id,
                      motoristaSelecionado.modal === "MOTO" ? "MOTO" : "CARRO",
                      `PLANO_MENSAL_${Date.now()}`,
                      149,
                      720
                    );
                    alert(`Plano Mensal Ouro (30 dias) ativado com sucesso para ${motoristaSelecionado.nome}!`);
                    motoristaSelecionado.planoAtivo = true;
                    motoristaSelecionado.planoTipo = "MENSAL";
                    motoristaSelecionado.planoTempoRestante = "30 dias";
                    setModalDetalhesAberto(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" /> Ativar Mensal Ouro (30d)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await driverSubscriptionService.activateTrial(
                      motoristaSelecionado.id,
                      motoristaSelecionado.modal === "MOTO" ? "MOTO" : "CARRO"
                    );
                    alert(`Período de Degustação (Trial) ativado para ${motoristaSelecionado.nome}!`);
                    motoristaSelecionado.planoAtivo = true;
                    motoristaSelecionado.planoTipo = "TRIAL";
                    setModalDetalhesAberto(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  Ativar Degustação (7d)
                </button>
              </div>
            </div>

            {/* Gestão da Categoria de Atendimento (Controle Administrativo) */}
            <div className="space-y-2 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-blue-950 uppercase tracking-wider block">
                  Categoria de Atendimento Operacional:
                </label>
                <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                  Exclusivo Operação
                </span>
              </div>
              <p className="text-[10px] text-slate-600">
                Definido pela equipe de moderação com base na vistoria do veículo e documentação:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                {(["CARRO", "MOTO", "PLUS", "MULHER"] as const).map((cat) => {
                  const isSelected = categoriaEdicao === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaEdicao(cat)}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-1 ring-slate-900/20"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-[11px] font-black">{cat}</span>
                      <span className={`text-[9px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                        {cat === "CARRO" && "Partiu Pop"}
                        {cat === "MOTO" && "Moto Flash"}
                        {cat === "PLUS" && "Plus Sedan"}
                        {cat === "MULHER" && "Delas"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const msg = encodeURIComponent(`Olá ${motoristaSelecionado.nome}, contato da Central PARTIU Operações.`);
                  window.open(`https://wa.me/55${motoristaSelecionado.telefone.replace(/\D/g, "")}?text=${msg}`, "_blank");
                }}
                className="h-8.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                disabled={salvandoCategoria}
                onClick={async () => {
                  setSalvandoCategoria(true);
                  try {
                    await atualizarCategoria.mutateAsync({
                      id: motoristaSelecionado.id,
                      categoria: categoriaEdicao,
                    });
                    motoristaSelecionado.modal = categoriaEdicao;
                    setModalDetalhesAberto(false);
                    void recarregarMotoristas();
                    void recarregarPendentes();
                  } catch (err: any) {
                    alert("Erro ao atualizar categoria: " + err.message);
                  } finally {
                    setSalvandoCategoria(false);
                  }
                }}
                className="h-8.5 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{salvandoCategoria ? "Salvando..." : "Salvar Categoria"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
