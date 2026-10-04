import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Flame,
  Layers,
  MapPin,
  MessageSquare,
  Package,
  PhoneCall,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Truck,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { UniversalMapView } from "@/components/maps/UniversalMapView";
import {
  useTelemetriaFrota,
  usePartiuRides,
  usePartiuRidesRealtime,
  usePartiuMetrics,
  useAlertasSOS,
  useAlertasSOSRealtime,
  useMotoristas,
  useCaixaAdmin,
} from "@/lib/partiu-db";
import { getAdminRole, type AdminRole } from "@/lib/admin-rbac";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

export const Route = createFileRoute("/app/admin/")({
  head: () => ({
    meta: [
      { title: "Central de Operações Nacional | PARTIU Admin" },
      {
        name: "description",
        content:
          "Centro nervoso da mobilidade urbana: KPIs executivos, mapa operacional em tempo real e alertas inteligentes de exceção.",
      },
    ],
  }),
  component: SuperAdminDashboardExecutive,
});

export function SuperAdminDashboardExecutive() {
  const { appConfig } = useTheme();
  const { branding } = appConfig;
  const { colors, ui } = branding;

  const [roleAtiva, setRoleAtiva] = useState<AdminRole>(() => getAdminRole());
  const { data: frotaBanco = [], refetch: recarregarFrota } = useTelemetriaFrota();
  usePartiuRidesRealtime();
  const { data: ridesBanco = [], refetch: recarregarRides } = usePartiuRides(100);
  const { data: motoristasBanco = [], refetch: recarregarMotoristas } = useMotoristas();
  const { data: caixasBanco = [], refetch: recarregarCaixas } = useCaixaAdmin();

  // Subscrição em tempo real aos alertas SOS
  useAlertasSOSRealtime();
  const { data: alertasSOS = [], refetch: recarregarSOS } = useAlertasSOS();

  useEffect(() => {
    function onRoleChange(e: any) {
      if (e.detail?.role) {
        setRoleAtiva(e.detail.role);
      }
    }
    window.addEventListener("partiu:role-changed", onRoleChange);
    return () => {
      window.removeEventListener("partiu:role-changed", onRoleChange);
    };
  }, []);

  // 1. CÁLCULO DOS CARDS EXECUTIVOS BASEADO 100% EM DADOS REAIS
  // ---------------------------------------------------------------------------
  const motoristasOnline = useMemo(() => {
    return frotaBanco.filter((v) => v.status === "em_rota" || v.status === "parado").length;
  }, [frotaBanco]);

  const chamadosSOSAtivos = useMemo(() => {
    return alertasSOS.filter((a) => a.status !== "resolvido").length;
  }, [alertasSOS]);

  const metrics = usePartiuMetrics(ridesBanco, chamadosSOSAtivos, motoristasOnline);
  const { receitaHoje, corridasEmAndamento, corridasFinalizadasHoje, entregasEmAndamento } = metrics;

  // Motoristas Credenciados & Ativos
  const assinaturasAtivasQtd = useMemo(() => {
    return motoristasBanco.filter((m: any) => m.status === "ativo" || m.status_aprovacao === "aprovado").length;
  }, [motoristasBanco]);

  // 2. ALERTAS INTELIGENTES (SOMENTE EXCEÇÕES - SEM LOGS TÉCNICOS)
  // ---------------------------------------------------------------------------
  const alertasInteligentes = useMemo(() => {
    const lista = [];

    // Alerta 1: SOS Acionado (Crítico Máximo)
    if (chamadosSOSAtivos > 0) {
      lista.push({
        id: "alerta_sos",
        tipo: "CRITICAL" as const,
        titulo: "Chamado de SOS 190 Acionado",
        descricao: `Existe(m) ${chamadosSOSAtivos} chamado(s) de emergência ativo(s). Ação imediata requerida.`,
        acaoTexto: "Intervir na Operação",
        acaoLink: "/app/admin/operacao?tab=suporte",
        icone: ShieldAlert,
        corBadge: "bg-red-600 text-white animate-pulse",
      });
    }

    // Alerta 2: Demanda vs Oferta (Viagens ativas sem motoristas online)
    if (motoristasOnline === 0 && (corridasEmAndamento > 0 || entregasEmAndamento > 0)) {
      lista.push({
        id: "alerta_sem_motorista",
        tipo: "WARNING" as const,
        titulo: "Demanda sem Motoristas Disponíveis",
        descricao: `Existem ${corridasEmAndamento + entregasEmAndamento} solicitações ativas e nenhum motorista livre online no momento.`,
        acaoTexto: "Ver Mapa",
        acaoLink: "/app/admin/operacao",
        icone: AlertTriangle,
        corBadge: "bg-amber-500 text-slate-950",
      });
    }

    // Alerta 3: Motoristas aguardando aprovação cadastral
    const motoristasPendentes = motoristasBanco.filter((m: any) => m.status_aprovacao === "pendente").length;
    if (motoristasPendentes > 0) {
      lista.push({
        id: "alerta_motoristas_pendentes",
        tipo: "INFO" as const,
        titulo: "Cadastros Aguardando Análise",
        descricao: `${motoristasPendentes} motorista(s) aguardando validação de CNH/documentos.`,
        acaoTexto: "Ver Motoristas",
        acaoLink: "/app/admin/motoristas",
        icone: Users,
        corBadge: "bg-blue-600 text-white",
      });
    }

    return lista;
  }, [chamadosSOSAtivos, motoristasOnline, corridasEmAndamento, entregasEmAndamento, motoristasBanco]);

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Header Central de Operações */}
      <div
        className="bg-slate-950 p-5 sm:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden"
        style={{ borderRadius: ui.borderRadius }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border"
              style={{
                backgroundColor: `${colors.primary}20`,
                borderColor: `${colors.primary}40`,
                color: colors.primary,
              }}
            >
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: colors.primary }} />
              <span>Centro de Operações Nacional (NOC)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Central de Comando <span style={{ color: colors.primary }}>{branding.appName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Supervisão em tempo real de tráfego, despacho de corridas (Carro e Moto), entregas Flash e controle financeiro instantâneo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                recarregarFrota();
                recarregarRides();
                recarregarSOS();
                recarregarMotoristas();
                recarregarCaixas();
              }}
              style={{ borderRadius: ui.borderRadius }}
              className="flex h-11 items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-4 text-xs font-bold border border-slate-800 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" style={{ color: colors.primary }} />
              <span>Atualizar Dados</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. OS 6 CARDS EXECUTIVOS OBRIGATÓRIOS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Receita Hoje */}
        <div className="rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Receita Hoje</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="pt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              R$ {receitaHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {receitaHoje > 0 ? (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3 w-3" /> Faturamento consolidado
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">
                Aguardando corridas
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Motoristas Online */}
        <div className="rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Motoristas Online</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="pt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${motoristasOnline > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
              {motoristasOnline}
            </p>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5 block">
              {motoristasOnline > 0 ? "Carro e Moto ativos" : "Nenhum condutor online"}
            </span>
          </div>
        </div>

        {/* Card 3: Corridas em Andamento */}
        <div className="rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Em Andamento</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div className="pt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {corridasEmAndamento}
            </p>
            <span className="text-[10px] text-blue-700 font-bold mt-0.5 block">
              + {entregasEmAndamento} entregas flash
            </span>
          </div>
        </div>

        {/* Card 4: Corridas Finalizadas Hoje */}
        <div className="rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Finalizadas Hoje</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="pt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {corridasFinalizadasHoje}
            </p>
            <span className="text-[10px] text-indigo-600 font-bold mt-0.5 block">
              {corridasFinalizadasHoje > 0 ? "Operação concluída" : "Aguardando conclusão"}
            </span>
          </div>
        </div>

        {/* Card 5: Motoristas Credenciados */}
        <div className="rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Motoristas Ativos</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="pt-3">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {assinaturasAtivasQtd}
            </p>
            <span className="text-[10px] text-purple-700 font-bold mt-0.5 block">
              {assinaturasAtivasQtd === 1 ? "motorista credenciado" : "motoristas credenciados"}
            </span>
          </div>
        </div>

        {/* Card 6: Chamados SOS */}
        <div className={`rounded-3xl p-4 sm:p-5 border shadow-xs flex flex-col justify-between transition-all ${
          chamadosSOSAtivos > 0
            ? "bg-red-50/90 border-red-300 shadow-md shadow-red-500/10"
            : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chamados SOS</span>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
              chamadosSOSAtivos > 0 ? "bg-red-600 text-white animate-pulse" : "bg-slate-100 text-slate-500"
            }`}>
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="pt-3">
            <p className={`text-xl sm:text-2xl font-black tracking-tight ${
              chamadosSOSAtivos > 0 ? "text-red-700" : "text-slate-900"
            }`}>
              {chamadosSOSAtivos}
            </p>
            <span className={`text-[10px] font-bold mt-0.5 block ${
              chamadosSOSAtivos > 0 ? "text-red-700 font-black animate-pulse" : "text-slate-400"
            }`}>
              {chamadosSOSAtivos > 0 ? "⚠️ Emergência ativa" : "Nenhum alerta crítico"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ALERTAS INTELIGENTES DE EXCEÇÃO (SEM LOGS TÉCNICOS) */}
      {alertasInteligentes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-600 animate-ping" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Alertas Inteligentes de Exceção ({alertasInteligentes.length})
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Monitoramento algorítmico em tempo real</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alertasInteligentes.map((alerta) => {
              const Icon = alerta.icone;
              return (
                <div
                  key={alerta.id}
                  className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs flex items-start justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-slate-900" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${alerta.corBadge}`}>
                          {alerta.tipo}
                        </span>
                        <h3 className="text-xs font-black text-slate-900">{alerta.titulo}</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{alerta.descricao}</p>
                    </div>
                  </div>

                  <Link
                    to={alerta.acaoLink}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all shadow-2xs"
                  >
                    <span>{alerta.acaoTexto}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MAPA OPERACIONAL (ELEMENTO PRINCIPAL DA TELA) */}
      <div
        className="bg-white border border-slate-200/90 shadow-xs overflow-hidden"
        style={{ borderRadius: ui.borderRadius }}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center font-black"
              style={{ color: colors.primary }}
            >
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Radar Operacional Urbano em Tempo Real
              </h2>
              <p className="text-xs text-slate-500">
                Exibindo motoristas online (Carro/Moto), viagens ativas e zonas de alta demanda (Hotspots).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Realtime Ativo
            </span>
            <Link
              to="/app/admin/operacao"
              style={{ borderRadius: ui.borderRadius }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 transition-all"
            >
              <span>Cockpit Completo</span>
              <ArrowRight className="h-3 w-3" style={{ color: colors.primary }} />
            </Link>
          </div>
        </div>

        {/* Componente UniversalMapView com altura expandida e controles */}
        <div className="w-full h-[460px] sm:h-[540px] relative bg-slate-100">
          <UniversalMapView
            veiculos={frotaBanco}
            altura="h-full min-h-[460px]"
            mostrarControles={true}
            mostrarTrafego={true}
            mostrarCardInferior={true}
          />
        </div>
      </div>
    </div>
  );
}
