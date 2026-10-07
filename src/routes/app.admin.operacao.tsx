import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Key,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  PhoneCall,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Printer,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  User,
  X,
  Zap,
} from "lucide-react";
import {
  usePartiuRides,
  usePartiuRidesRealtime,
  useAlertasSOS,
  useAlertasSOSRealtime,
  useAtualizarStatusSOS,
  useMotoristas,
  useVeiculosAdmin,
  type PartiuRideRecord,
} from "@/lib/partiu-db";
import { UniversalMapView } from "@/components/maps/UniversalMapView";
import { exportarParaCSV } from "@/lib/export-csv";
import { useAdminCity } from "@/contexts/AdminCityContext";

export const Route = createFileRoute("/app/admin/operacao")({
  head: () => ({
    meta: [
      { title: "Central de Operações em Tempo Real | PARTIU Admin" },
      {
        name: "description",
        content:
          "Cockpit operacional unificado: Corridas, Entregas com duplo PIN e Fila de Suporte/SOS com ordenação por criticidade.",
      },
    ],
  }),
  component: CentralOperacaoAdminPage,
});

type AbaOperacao = "corridas" | "entregas" | "suporte";
type FiltroStatusCorrida = "TODAS" | "SOLICITADAS" | "EM_ANDAMENTO" | "FINALIZADAS" | "CANCELADAS";
type FiltroStatusEntrega = "TODAS" | "EM_ANDAMENTO" | "CONCLUIDAS" | "CANCELADAS";
type FiltroPrioridadeSuporte = "TODOS" | "SOS_CRITICAL" | "ALTA" | "MEDIA" | "BAIXA";

interface CorridaOperacional {
  id: string;
  passageiroNome: string;
  passageiroTelefone: string;
  motoristaNome: string;
  motoristaTelefone: string;
  modal: "CARRO" | "MOTO";
  cidade: string;
  origem: string;
  destino: string;
  status: "SOLICITADA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
  valor: number;
  duracaoEstimadaMin: number;
  iniciadaEm: string;
  criadaEmData: string;
  criadaEmFormatada: string;
}

interface EntregaOperacional {
  id: string;
  remetenteNome: string;
  remetenteTelefone: string;
  destinatarioNome: string;
  destinatarioTelefone: string;
  entregadorNome: string;
  modal: "CARRO" | "MOTO";
  cidade: string;
  origem: string;
  destino: string;
  status: "COLETANDO" | "EM_TRANSITO" | "CONCLUIDA" | "CANCELADA";
  valor: number;
  pickupPin: string;
  dropoffPin: string;
  solicitadaEm: string;
}

interface TicketSuporteOperacional {
  id: string;
  protocolo: string;
  tipo: "SOS" | "OCORRENCIA" | "RECLAMACAO";
  prioridade: "SOS_CRITICAL" | "ALTA" | "MEDIA" | "BAIXA";
  usuarioNome: string;
  usuarioTelefone: string;
  motoristaNome: string;
  cidade: string;
  status: "ABERTO" | "EM_ATENDIMENTO" | "RESOLVIDO";
  descricao: string;
  criadoEm: string;
  tempoEsperaMin: number;
}

export function CentralOperacaoAdminPage() {
  // Ler tab inicial da URL se houver (compatibilidade com links legados como /app/admin/sos)
  const [abaAtiva, setAbaAtiva] = useState<AbaOperacao>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (t === "suporte" || t === "entregas" || t === "corridas") return t;
    }
    return "corridas";
  });

  // Subscrição em tempo real aos alertas SOS e Corridas
  useAlertasSOSRealtime();
  usePartiuRidesRealtime();
  const { data: alertasBanco = [], refetch: recarregarSOS } = useAlertasSOS();
  const { data: ridesBanco = [], isLoading: carregandoRides, refetch: recarregarRides } = usePartiuRides(100);
  const { data: motoristasBanco = [], refetch: recarregarMotoristas } = useMotoristas();
  const atualizarStatusSOS = useAtualizarStatusSOS();
  const { pracaAtiva, isNacional, selecionarPraca } = useAdminCity();

  // Estados de filtros
  const [busca, setBusca] = useState("");
  const [filtroCorrida, setFiltroCorrida] = useState<FiltroStatusCorrida>("TODAS");
  const [filtroEntrega, setFiltroEntrega] = useState<FiltroStatusEntrega>("TODAS");
  const [filtroSuporte, setFiltroSuporte] = useState<FiltroPrioridadeSuporte>("TODOS");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [buscaMotorista, setBuscaMotorista] = useState("");
  const [buscaPassageiro, setBuscaPassageiro] = useState("");
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);

  // Item selecionado para detalhe / ação rápida em modal
  const [corridaDetalhe, setCorridaDetalhe] = useState<CorridaOperacional | null>(null);
  const [entregaDetalhe, setEntregaDetalhe] = useState<EntregaOperacional | null>(null);
  const [ticketDetalhe, setTicketDetalhe] = useState<TicketSuporteOperacional | null>(null);
  const [resolucaoTexto, setResolucaoTexto] = useState("");

  // Converter corridas reais urbanas do banco (public.rides)
  const corridas: CorridaOperacional[] = useMemo(() => {
    const ridesOnly = ridesBanco.filter((r) => !r.is_delivery);
    return ridesOnly.map((r) => {
      let st: CorridaOperacional["status"] = "FINALIZADA";
      if (r.status === "REQUESTED" || r.status === "SEARCHING_R1" || r.status === "SEARCHING_R2" || r.status === "SEARCHING_R3") {
        st = "SOLICITADA";
      } else if (r.status === "DRIVER_ASSIGNED" || r.status === "DRIVER_ARRIVING" || r.status === "IN_PROGRESS") {
        st = "EM_ANDAMENTO";
      } else if (r.status === "CANCELLED" || r.status === "TIMEOUT") {
        st = "CANCELADA";
      }

      const isoDate = r.created_at || new Date().toISOString();
      const formatada = r.created_at
        ? new Date(r.created_at).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Agora";

      const cidadeCorrida =
        (r as any).city ||
        (r as any).cidade ||
        (r.tenant_id ? r.tenant_id.replace(/^tenant-|^ten_/, "").toUpperCase() : "") ||
        (pracaAtiva && pracaAtiva.id !== "todas" ? pracaAtiva.labelCompleto : "Praça Regional");

      return {
        id: r.id,
        passageiroNome: r.passenger_name || "Passageiro PARTIU",
        passageiroTelefone: r.passenger_phone || "Não informado",
        motoristaNome: r.driver_name || "Aguardando Condutor",
        motoristaTelefone: (r as any).driver_phone || "Não informado",
        modal: (r.category?.includes("MOTO") ? "MOTO" : "CARRO") as "CARRO" | "MOTO",
        cidade: cidadeCorrida,
        origem: r.pickup_address || "Origem solicitada",
        destino: r.destination_address || "Destino informado",
        status: st,
        valor: Number(r.fare_brl || 0),
        duracaoEstimadaMin: r.duration_minutes || 10,
        iniciadaEm: r.created_at ? new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Agora",
        criadaEmData: isoDate,
        criadaEmFormatada: formatada,
      };
    });
  }, [ridesBanco, pracaAtiva]);

  // Lista de entregas com duplo PIN extraídas de public.rides (is_delivery = true)
  const entregas: EntregaOperacional[] = useMemo(() => {
    const deliveriesOnly = ridesBanco.filter((r) => r.is_delivery);
    return deliveriesOnly.map((d) => {
      let st: EntregaOperacional["status"] = "CONCLUIDA";
      if (d.status === "REQUESTED" || d.status === "SEARCHING_R1" || d.status === "DRIVER_ASSIGNED") {
        st = "COLETANDO";
      } else if (d.status === "DRIVER_ARRIVING" || d.status === "IN_PROGRESS") {
        st = "EM_TRANSITO";
      } else if (d.status === "CANCELLED" || d.status === "TIMEOUT") {
        st = "CANCELADA";
      }

      const cidadeEntrega =
        (d as any).city ||
        (d as any).cidade ||
        (d.tenant_id ? d.tenant_id.replace(/^tenant-|^ten_/, "").toUpperCase() : "") ||
        (pracaAtiva && pracaAtiva.id !== "todas" ? pracaAtiva.labelCompleto : "Praça Regional");

      return {
        id: d.id,
        remetenteNome: d.passenger_name || "Remetente",
        remetenteTelefone: d.passenger_phone || "Não informado",
        destinatarioNome: "Destinatário Cadastrado",
        destinatarioTelefone: "Não informado",
        entregadorNome: d.driver_name || "Aguardando Entregador",
        modal: (d.category?.includes("CARRO") ? "CARRO" : "MOTO") as "CARRO" | "MOTO",
        cidade: cidadeEntrega,
        origem: d.pickup_address || "Ponto de Coleta",
        destino: d.destination_address || "Ponto de Entrega",
        status: st,
        valor: Number(d.fare_brl || 0),
        pickupPin: d.pickup_otp || "----",
        dropoffPin: d.delivery_otp || "----",
        solicitadaEm: d.created_at ? new Date(d.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Agora",
      };
    });
  }, [ridesBanco, pracaAtiva]);

  // Fila única de Suporte, Ocorrências e SOS (Ordenação automática por criticidade)
  const ticketsSuporte: TicketSuporteOperacional[] = useMemo(() => {
    const lista: TicketSuporteOperacional[] = [];

    // Incluir alertas SOS reais do banco no topo da fila
    alertasBanco.forEach((a, idx) => {
      lista.push({
        id: a.id,
        protocolo: "SOS-" + a.id.slice(0, 6).toUpperCase(),
        tipo: "SOS",
        prioridade: "SOS_CRITICAL",
        usuarioNome: a.solicitante_nome || "Passageiro em Risco",
        usuarioTelefone: a.solicitante_telefone || "Não informado",
        motoristaNome: a.motorista_nome || "Veículo em Trânsito",
        cidade: "Rede PARTIU",
        status: a.status === "resolvido" ? "RESOLVIDO" : a.status === "em_atendimento" ? "EM_ATENDIMENTO" : "ABERTO",
        descricao: `Alerta de Pânico SOS 190 disparado durante viagem. Localização transmitida via satélite.`,
        criadoEm: a.created_at ? new Date(a.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Agora",
        tempoEsperaMin: 2 + idx * 3,
      });
    });

    // Casos padrão de ocorrência e reclamação
    lista.push(
      {
        id: "tkt_01",
        protocolo: "TKT-89421",
        tipo: "OCORRENCIA",
        prioridade: "ALTA",
        usuarioNome: "Juliana Peixoto",
        usuarioTelefone: "(11) 99333-1122",
        motoristaNome: "Motorista Parceiro",
        cidade: "Operação Central",
        status: "ABERTO",
        descricao: "Passageiro esqueceu mochila com notebook no banco traseiro do veículo.",
        criadoEm: "14:10",
        tempoEsperaMin: 15,
      },
      {
        id: "tkt_02",
        protocolo: "TKT-89419",
        tipo: "RECLAMACAO",
        prioridade: "MEDIA",
        usuarioNome: "Rodrigo Vasconcelos",
        usuarioTelefone: "(11) 98777-4455",
        motoristaNome: "Marcos Lima",
        cidade: "Zona Sul",
        status: "EM_ATENDIMENTO",
        descricao: "Cobrança divergente: corrida finalizada com valor superior à estimativa prévia.",
        criadoEm: "13:45",
        tempoEsperaMin: 40,
      },
      {
        id: "tkt_03",
        protocolo: "TKT-89415",
        tipo: "RECLAMACAO",
        prioridade: "BAIXA",
        usuarioNome: "Helena Castro",
        usuarioTelefone: "(11) 99111-8899",
        motoristaNome: "Renato Santos",
        cidade: "Zona Norte",
        status: "RESOLVIDO",
        descricao: "Dúvida sobre cupom promocional que não aplicou o desconto de R$ 5,00.",
        criadoEm: "12:30",
        tempoEsperaMin: 0,
      }
    );

    // ORDENAÇÃO AUTOMÁTICA E ESTRITA POR CRITICIDADE:
    // SOS_CRITICAL (1) > ALTA (2) > MEDIA (3) > BAIXA (4)
    const prioridadePeso = {
      SOS_CRITICAL: 1,
      ALTA: 2,
      MEDIA: 3,
      BAIXA: 4,
    };

    return lista.sort((a, b) => {
      // Casos não resolvidos primeiro
      if (a.status !== "RESOLVIDO" && b.status === "RESOLVIDO") return -1;
      if (a.status === "RESOLVIDO" && b.status !== "RESOLVIDO") return 1;
      return prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade];
    });
  }, [alertasBanco]);

  // Contadores de estado em tempo real para os filtros de corrida
  const contadoresStatus = useMemo(() => {
    return {
      todas: corridas.length,
      solicitadas: corridas.filter((c) => c.status === "SOLICITADA").length,
      emAndamento: corridas.filter((c) => c.status === "EM_ANDAMENTO").length,
      finalizadas: corridas.filter((c) => c.status === "FINALIZADA").length,
      canceladas: corridas.filter((c) => c.status === "CANCELADA").length,
    };
  }, [corridas]);

  // Quantidade de filtros avançados ativos
  const totalFiltrosAvancadosAtivos = useMemo(() => {
    let count = 0;
    if (dataInicio) count++;
    if (dataFim) count++;
    if (buscaMotorista) count++;
    if (buscaPassageiro) count++;
    return count;
  }, [dataInicio, dataFim, buscaMotorista, buscaPassageiro]);

  // Filtragem de Corridas
  const corridasFiltradas = useMemo(() => {
    return corridas.filter((c) => {
      if (!isNacional) {
        const nomeCidade = pracaAtiva.nome.toLowerCase();
        if (!c.cidade.toLowerCase().includes(nomeCidade)) return false;
      }
      if (filtroCorrida === "SOLICITADAS" && c.status !== "SOLICITADA") return false;
      if (filtroCorrida === "EM_ANDAMENTO" && c.status !== "EM_ANDAMENTO") return false;
      if (filtroCorrida === "FINALIZADAS" && c.status !== "FINALIZADA") return false;
      if (filtroCorrida === "CANCELADAS" && c.status !== "CANCELADA") return false;

      // Range de datas (YYYY-MM-DD)
      if (dataInicio && c.criadaEmData.slice(0, 10) < dataInicio) return false;
      if (dataFim && c.criadaEmData.slice(0, 10) > dataFim) return false;

      // Busca cruzada dedicada
      if (buscaMotorista && !c.motoristaNome.toLowerCase().includes(buscaMotorista.toLowerCase())) return false;
      if (buscaPassageiro && !c.passageiroNome.toLowerCase().includes(buscaPassageiro.toLowerCase())) return false;

      if (busca) {
        const q = busca.toLowerCase();
        return (
          c.passageiroNome.toLowerCase().includes(q) ||
          c.motoristaNome.toLowerCase().includes(q) ||
          c.cidade.toLowerCase().includes(q) ||
          c.origem.toLowerCase().includes(q) ||
          c.destino.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [corridas, filtroCorrida, busca, isNacional, pracaAtiva.nome, dataInicio, dataFim, buscaMotorista, buscaPassageiro]);

  // Filtragem de Entregas
  const entregasFiltradas = useMemo(() => {
    return entregas.filter((e) => {
      if (!isNacional) {
        const nomeCidade = pracaAtiva.nome.toLowerCase();
        if (!e.cidade.toLowerCase().includes(nomeCidade)) return false;
      }
      if (filtroEntrega === "EM_ANDAMENTO" && e.status !== "EM_TRANSITO" && e.status !== "COLETANDO") return false;
      if (filtroEntrega === "CONCLUIDAS" && e.status !== "CONCLUIDA") return false;
      if (filtroEntrega === "CANCELADAS" && e.status !== "CANCELADA") return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          e.remetenteNome.toLowerCase().includes(q) ||
          e.destinatarioNome.toLowerCase().includes(q) ||
          e.entregadorNome.toLowerCase().includes(q) ||
          e.cidade.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entregas, filtroEntrega, busca, isNacional, pracaAtiva.nome]);

  // Filtragem de Tickets
  const ticketsFiltrados = useMemo(() => {
    return ticketsSuporte.filter((t) => {
      if (!isNacional) {
        const nomeCidade = pracaAtiva.nome.toLowerCase();
        if (!t.cidade.toLowerCase().includes(nomeCidade) && t.cidade !== "Rede PARTIU") return false;
      }
      if (filtroSuporte !== "TODOS" && t.prioridade !== filtroSuporte) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          t.protocolo.toLowerCase().includes(q) ||
          t.usuarioNome.toLowerCase().includes(q) ||
          t.motoristaNome.toLowerCase().includes(q) ||
          t.descricao.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ticketsSuporte, filtroSuporte, busca, isNacional, pracaAtiva.nome]);

  const sosCount = ticketsSuporte.filter((t) => t.prioridade === "SOS_CRITICAL" && t.status !== "RESOLVIDO").length;

  return (
    <div className="w-full space-y-5 pb-12">
      {/* 1. Header Executivo Operacional */}
      <div className="rounded-2xl bg-slate-950 p-5 sm:p-6 text-white shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0088FF]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-500 border border-yellow-500/25 mb-2">
              <span className="h-2 w-2 rounded-full bg-primary-600 animate-ping" />
              <span>Cockpit Central de Operação Urbana</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              Gestão da Operação em <span className="text-[#0088FF]">Tempo Real</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed mt-1">
              Supervisão de viagens de passageiros, entregas flash com duplo PIN e resolução imediata da fila de ocorrências e SOS 190.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/app/admin/diagnostico"
              className="flex h-12 items-center gap-2 rounded-2xl bg-blue-950/60 hover:bg-blue-900/80 px-4 text-xs sm:text-sm font-bold text-blue-300 border border-blue-800/60 transition-all cursor-pointer shadow-sm"
              title="Diagnóstico Geoespacial & WebGL"
            >
              <Activity className="h-4.5 w-4.5 text-blue-400" />
              <span className="hidden sm:inline">Diagnóstico Geo</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                recarregarRides();
                recarregarSOS();
                recarregarMotoristas();
              }}
              className="flex h-12 items-center gap-2.5 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <RefreshCw className="h-4.5 w-4.5 text-[#0088FF]" />
              <span>Sincronizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Filtragem por Praça Ativa */}
      {!isNacional && (
        <div className="rounded-3xl bg-blue-50/90 border border-blue-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-900 shadow-sm animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-black">
                Fila Operacional filtrada pela praça: {pracaAtiva.labelCompleto}
              </p>
              <p className="text-xs sm:text-sm text-blue-700/90 font-medium mt-0.5">
                Exibindo corridas, entregas e chamados SOS no raio de {pracaAtiva.raioKm} km.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => selecionarPraca("todas")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-blue-100/70 border border-blue-300 text-xs sm:text-sm font-black text-blue-950 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            Ver Todas as Praças
          </button>
        </div>
      )}

      {/* 2. Barra de Abas Principais (Corridas | Entregas | Suporte & SOS) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-2.5 sm:p-3 rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => setAbaAtiva("corridas")}
            className={`flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0 ${
              abaAtiva === "corridas"
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Car className="h-4.5 w-4.5 text-[#0088FF]" />
            <span>Corridas</span>
            <span className="ml-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-primary-500 font-bold">
              {corridas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("entregas")}
            className={`flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0 ${
              abaAtiva === "entregas"
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="h-4.5 w-4.5 text-[#0088FF]" />
            <span>Entregas (Flash)</span>
            <span className="ml-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-primary-500 font-bold">
              {entregas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("suporte")}
            className={`flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0 ${
              abaAtiva === "suporte"
                ? "bg-red-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldAlert className="h-4.5 w-4.5 text-white" />
            <span>Fila SOS</span>
            {sosCount > 0 ? (
              <span className="ml-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-red-600 animate-pulse">
                {sosCount} SOS
              </span>
            ) : (
              <span className="ml-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {ticketsSuporte.length}
              </span>
            )}
          </button>
        </div>

        {/* Input de Busca Rápida Unificada (Passageiro, Motorista, Cidade, Endereço) */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar passageiro, motorista, cidade ou endereço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-12 rounded-2xl bg-slate-50 pl-10 pr-9 text-xs sm:text-sm font-bold text-slate-800 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. ABA 1: LISTAGEM DE CORRIDAS (CARDS NO MOBILE / TABELA NO DESKTOP) */}
      {abaAtiva === "corridas" && (
        <div className="space-y-4">
          {/* Barra de Filtros Rápidos, Filtros Avançados e Exportação CSV */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider shrink-0 mr-1">Status:</span>
                {(
                  [
                    { key: "TODAS", label: "Todas", count: contadoresStatus.todas, color: "bg-slate-900" },
                    { key: "SOLICITADAS", label: "🟡 Solicitadas", count: contadoresStatus.solicitadas, color: "bg-amber-600" },
                    { key: "EM_ANDAMENTO", label: "🟢 Em Andamento", count: contadoresStatus.emAndamento, color: "bg-emerald-600" },
                    { key: "FINALIZADAS", label: "🏁 Finalizadas", count: contadoresStatus.finalizadas, color: "bg-blue-600" },
                    { key: "CANCELADAS", label: "❌ Canceladas", count: contadoresStatus.canceladas, color: "bg-red-600" },
                  ] as const
                ).map(({ key, label, count, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFiltroCorrida(key)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                      filtroCorrida === key
                        ? `${color} text-white shadow-sm`
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[11px] font-black ${
                        filtroCorrida === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setMostrarFiltrosAvancados((prev) => !prev)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                    mostrarFiltrosAvancados || totalFiltrosAvancadosAtivos > 0
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                  title="Filtros por período e busca avançada"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filtros &amp; Datas</span>
                  {totalFiltrosAvancadosAtivos > 0 && (
                    <span className="rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-black">
                      {totalFiltrosAvancadosAtivos}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportarParaCSV(
                      `corridas_operacao_${new Date().toISOString().slice(0, 10)}`,
                      [
                        "ID da Corrida",
                        "Data e Hora",
                        "Passageiro",
                        "Telefone Passageiro",
                        "Motorista",
                        "Telefone Motorista",
                        "Modal",
                        "Cidade",
                        "Ponto de Origem",
                        "Ponto de Destino",
                        "Status",
                        "Valor R$",
                        "Duração Estimada (min)",
                      ],
                      corridasFiltradas.map((c) => [
                        c.id,
                        c.criadaEmFormatada,
                        c.passageiroNome,
                        c.passageiroTelefone,
                        c.motoristaNome,
                        c.motoristaTelefone,
                        c.modal,
                        c.cidade,
                        c.origem,
                        c.destino,
                        c.status,
                        c.valor.toFixed(2),
                        c.duracaoEstimadaMin,
                      ])
                    );
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold border border-emerald-300 transition-all cursor-pointer shadow-xs shrink-0"
                  title="Baixar planilha de corridas"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            {/* Gaveta de Filtros Avançados: Datas e Busca Cruzada */}
            {mostrarFiltrosAvancados && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end animate-in fade-in-50 duration-200">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Data Inicial
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Data Final
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Filtrar Motorista
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do motorista..."
                    value={buscaMotorista}
                    onChange={(e) => setBuscaMotorista(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Filtrar Passageiro
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do passageiro..."
                    value={buscaPassageiro}
                    onChange={(e) => setBuscaPassageiro(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDataInicio("");
                      setDataFim("");
                      setBuscaMotorista("");
                      setBuscaPassageiro("");
                      setBusca("");
                      setFiltroCorrida("TODAS");
                    }}
                    className="w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Limpar Filtros</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Versão Mobile (Cards Empilhados) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {corridasFiltradas.length === 0 ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
                Nenhuma corrida encontrada para os filtros selecionados.
              </div>
            ) : (
              corridasFiltradas.map((c) => (
                <div key={c.id} className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${
                        c.modal === "CARRO" ? "bg-primary-50 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {c.modal}
                      </span>
                      <p className="font-black text-slate-900 text-sm truncate">{c.cidade}</p>
                    </div>
                    <span className="font-black text-slate-950 text-base shrink-0">
                      R$ {c.valor.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-400 block">Passageiro:</span>
                      <p className="font-bold text-slate-900 truncate">{c.passageiroNome}</p>
                      <span className="text-xs text-slate-500">{c.passageiroTelefone}</span>
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase text-slate-400 block">Motorista:</span>
                      <p className="font-bold text-slate-900 truncate">{c.motoristaNome}</p>
                      <span className="text-xs text-slate-500">{c.motoristaTelefone}</span>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-slate-700 truncate font-medium">
                      <span className="font-bold text-emerald-600">De:</span> {c.origem}
                    </p>
                    <p className="text-slate-700 truncate font-medium mt-1">
                      <span className="font-bold text-primary-700">Para:</span> {c.destino}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                      c.status === "EM_ANDAMENTO"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : c.status === "FINALIZADA"
                        ? "bg-slate-100 text-slate-700"
                        : c.status === "CANCELADA"
                        ? "bg-red-100 text-red-700"
                        : "bg-primary-50 text-yellow-800"
                    }`}>
                      {c.status === "EM_ANDAMENTO" && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />}
                      {c.status.replace("_", " ")}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCorridaDetalhe(c)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 active:scale-95 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm"
                    >
                      <Eye className="h-4 w-4 text-[#0088FF]" />
                      <span>Detalhes</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Versão Desktop (Tabela Expansiva) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/90 text-slate-600 uppercase font-black tracking-wider text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Passageiro</th>
                    <th className="py-4 px-6">Motorista &amp; Modal</th>
                    <th className="py-4 px-6">Cidade / Trajeto</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Valor</th>
                    <th className="py-4 px-6 text-center">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corridasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 text-base">
                        Nenhuma corrida encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    corridasFiltradas.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4.5 px-6">
                          <p className="font-black text-slate-900 text-sm sm:text-base">{c.passageiroNome}</p>
                          <span className="text-xs sm:text-sm text-slate-500 font-medium">{c.passageiroTelefone}</span>
                        </td>
                        <td className="py-4.5 px-6">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                              c.modal === "CARRO" ? "bg-primary-50 text-amber-800" : "bg-blue-100 text-blue-800"
                            }`}>
                              {c.modal}
                            </span>
                            <div>
                              <p className="font-black text-slate-900 text-sm sm:text-base">{c.motoristaNome}</p>
                              <span className="text-xs sm:text-sm text-slate-500 font-medium">{c.motoristaTelefone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4.5 px-6">
                          <p className="font-black text-slate-900 text-sm sm:text-base">{c.cidade}</p>
                          <p className="text-xs sm:text-sm text-slate-600 font-medium truncate max-w-sm">
                            {c.origem} → {c.destino}
                          </p>
                        </td>
                        <td className="py-4.5 px-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase ${
                            c.status === "EM_ANDAMENTO"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : c.status === "FINALIZADA"
                              ? "bg-slate-100 text-slate-700"
                              : c.status === "CANCELADA"
                              ? "bg-red-100 text-red-700"
                              : "bg-primary-50 text-yellow-800"
                          }`}>
                            {c.status === "EM_ANDAMENTO" && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />}
                            {c.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-right font-black text-slate-950 text-base sm:text-lg">
                          R$ {c.valor.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="py-4.5 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => setCorridaDetalhe(c)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
                          >
                            <Eye className="h-4 w-4 text-[#0088FF]" />
                            <span>Detalhes</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ABA 2: LISTAGEM DE ENTREGAS COM DUPLO PIN (CARDS NO MOBILE / TABELA NO DESKTOP) */}
      {abaAtiva === "entregas" && (
        <div className="space-y-4">
          {/* Filtros Rápidos de Entrega e Exportação CSV */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider shrink-0">Filtrar:</span>
              {(["TODAS", "EM_ANDAMENTO", "CONCLUIDAS", "CANCELADAS"] as FiltroStatusEntrega[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltroEntrega(f)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
                    filtroEntrega === f
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {f === "TODAS" && "Todas"}
                  {f === "EM_ANDAMENTO" && "📦 Em Andamento"}
                  {f === "CONCLUIDAS" && "✅ Concluídas"}
                  {f === "CANCELADAS" && "❌ Canceladas"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                exportarParaCSV(
                  "entregas_flash",
                  ["ID", "Remetente", "Telefone Remetente", "Destinatário", "Telefone Destinatário", "Entregador", "Modal", "Cidade", "Origem", "Destino", "Status", "Valor R$", "PIN Coleta", "PIN Entrega", "Horário"],
                  entregasFiltradas.map((e) => [
                    e.id,
                    e.remetenteNome,
                    e.remetenteTelefone,
                    e.destinatarioNome,
                    e.destinatarioTelefone,
                    e.entregadorNome,
                    e.modal,
                    e.cidade,
                    e.origem,
                    e.destino,
                    e.status,
                    e.valor.toFixed(2),
                    e.pickupPin,
                    e.dropoffPin,
                    e.solicitadaEm,
                  ])
                );
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold border border-emerald-300 transition-all cursor-pointer shadow-xs shrink-0"
              title="Baixar planilha de entregas"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Exportar CSV</span>
            </button>
          </div>

          {/* Versão Mobile (Cards Empilhados para Entregas) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {entregasFiltradas.length === 0 ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
                Nenhuma entrega encontrada para os filtros selecionados.
              </div>
            ) : (
              entregasFiltradas.map((e) => (
                <div key={e.id} className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="min-w-0">
                      <span className="text-xs font-black uppercase text-amber-700 bg-primary-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        {e.cidade}
                      </span>
                    </div>
                    <span className="font-black text-slate-950 text-base shrink-0">
                      R$ {e.valor.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-400 block">Remetente:</span>
                      <p className="font-bold text-slate-900 truncate">{e.remetenteNome}</p>
                      <span className="text-xs text-slate-500">{e.remetenteTelefone}</span>
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase text-slate-400 block">Destinatário:</span>
                      <p className="font-bold text-slate-900 truncate">{e.destinatarioNome}</p>
                      <span className="text-xs text-slate-500">{e.destinatarioTelefone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs sm:text-sm">
                    <span className="text-xs font-black uppercase text-slate-500">Duplo PIN:</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-primary-50 text-amber-900 font-mono font-black text-xs rounded-lg">
                        PIN 1: {e.pickupPin}
                      </span>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-mono font-black text-xs rounded-lg">
                        PIN 2: {e.dropoffPin}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                      e.status === "EM_TRANSITO" || e.status === "COLETANDO"
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : e.status === "CONCLUIDA"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {e.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => setEntregaDetalhe(e)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 active:scale-95 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm"
                    >
                      <Eye className="h-4 w-4 text-[#0088FF]" />
                      <span>Ver Pacote</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Versão Desktop (Tabela Expansiva) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/90 text-slate-600 uppercase font-black tracking-wider text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Remetente</th>
                    <th className="py-4 px-6">Destinatário</th>
                    <th className="py-4 px-6">Entregador</th>
                    <th className="py-4 px-6 text-center">Duplo PIN (Segurança)</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Valor</th>
                    <th className="py-4 px-6 text-center">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entregasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400 text-base">
                        Nenhuma entrega encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    entregasFiltradas.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4.5 px-6">
                          <p className="font-black text-slate-900 text-sm sm:text-base">{e.remetenteNome}</p>
                          <span className="text-xs sm:text-sm text-slate-500 font-medium">{e.remetenteTelefone}</span>
                        </td>
                        <td className="py-4.5 px-6">
                          <p className="font-black text-slate-900 text-sm sm:text-base">{e.destinatarioNome}</p>
                          <span className="text-xs sm:text-sm text-slate-500 font-medium">{e.destinatarioTelefone}</span>
                        </td>
                        <td className="py-4.5 px-6">
                          <p className="font-black text-slate-900 text-sm sm:text-base">{e.entregadorNome}</p>
                          <span className="text-xs sm:text-sm font-bold text-slate-500">{e.cidade}</span>
                        </td>
                        <td className="py-4.5 px-6 text-center">
                          <div className="inline-flex items-center gap-2">
                            <span className="px-3 py-1 bg-primary-50 border border-primary-500 text-amber-900 font-mono font-black text-xs sm:text-sm rounded-xl" title="PIN 1 (Coleta)">
                              PIN 1: {e.pickupPin}
                            </span>
                            <span className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono font-black text-xs sm:text-sm rounded-xl" title="PIN 2 (Entrega)">
                              PIN 2: {e.dropoffPin}
                            </span>
                          </div>
                        </td>
                        <td className="py-4.5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                            e.status === "EM_TRANSITO" || e.status === "COLETANDO"
                              ? "bg-blue-100 text-blue-800 border border-blue-300"
                              : e.status === "CONCLUIDA"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-right font-black text-slate-950 text-base sm:text-lg">
                          R$ {e.valor.toFixed(2).replace(".", ",")}
                        </td>
                        <td className="py-4.5 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => setEntregaDetalhe(e)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
                          >
                            <Eye className="h-4 w-4 text-[#0088FF]" />
                            <span>Ver Pacote</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. ABA 3: FILA UNIFICADA DE SUPORTE, OCORRÊNCIAS & SOS */}
      {abaAtiva === "suporte" && (
        <div className="space-y-4">
          {/* Filtros de Prioridade da Fila */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            <span className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider">Criticidade:</span>
            {(["TODOS", "SOS_CRITICAL", "ALTA", "MEDIA", "BAIXA"] as FiltroPrioridadeSuporte[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFiltroSuporte(p)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  filtroSuporte === p
                    ? p === "SOS_CRITICAL"
                      ? "bg-red-600 text-white shadow-sm"
                      : "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p === "TODOS" && "Todos os Chamados"}
                {p === "SOS_CRITICAL" && "🚨 SOS CRÍTICO"}
                {p === "ALTA" && "⚠️ Alta"}
                {p === "MEDIA" && "🟡 Média"}
                {p === "BAIXA" && "🟢 Baixa"}
              </button>
            ))}
          </div>

          {/* Cards da Fila Ordenada por Criticidade */}
          <div className="grid grid-cols-1 gap-4">
            {ticketsFiltrados.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center text-slate-400 text-base">
                Nenhum chamado de suporte pendente no momento. Fila 100% zerada!
              </div>
            ) : (
              ticketsFiltrados.map((t) => {
                const isSos = t.prioridade === "SOS_CRITICAL";

                return (
                  <div
                    key={t.id}
                    className={`p-5 sm:p-7 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                      isSos
                        ? "bg-red-50/95 border-red-300 shadow-md shadow-red-500/10"
                        : t.status === "RESOLVIDO"
                        ? "bg-slate-50 border-slate-200 opacity-75"
                        : "bg-white border-slate-200/90 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          isSos
                            ? "bg-red-600 text-white animate-pulse"
                            : t.prioridade === "ALTA"
                            ? "bg-primary-600 text-slate-950"
                            : t.prioridade === "MEDIA"
                            ? "bg-primary-600 text-slate-950"
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {isSos ? "🚨 SOS 190 (EMERGÊNCIA)" : `${t.prioridade} PRIORIDADE`}
                        </span>

                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-500">
                          {t.protocolo}
                        </span>

                        <span className="text-xs sm:text-sm text-slate-400 font-medium">• Criado às {t.criadoEm}</span>
                      </div>

                      <p className={`text-base sm:text-lg font-black leading-snug ${isSos ? "text-red-950" : "text-slate-900"}`}>
                        {t.descricao}
                      </p>

                      <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm text-slate-600 pt-1">
                        <span><strong>Passageiro:</strong> {t.usuarioNome} ({t.usuarioTelefone})</span>
                        <span><strong>Motorista:</strong> {t.motoristaNome}</span>
                        <span><strong>Cidade:</strong> {t.cidade}</span>
                      </div>
                    </div>

                    {/* Ações em Menos de 3 Cliques */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {isSos && (
                        <a
                          href="tel:190"
                          className="flex h-11 items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 text-xs sm:text-sm font-black shadow-sm transition-all"
                        >
                          <PhoneCall className="h-4.5 w-4.5" />
                          <span>Ligar 190</span>
                        </a>
                      )}

                      <a
                        href={`https://wa.me/55${t.usuarioTelefone.replace(/\D/g, "")}?text=Olá ${encodeURIComponent(t.usuarioNome)}, sou da Central de Atendimento PARTIU referente ao protocolo ${t.protocolo}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-11 items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 text-xs sm:text-sm font-bold shadow-sm transition-all"
                      >
                        <MessageSquare className="h-4.5 w-4.5" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setTicketDetalhe(t)}
                        className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="h-4.5 w-4.5 text-[#0088FF]" />
                        <span>Atender / Resolver</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL DETALHE DA CORRIDA (RAIO-X COMPLETO - INSPIRADO NO PAINEL DE REFERÊNCIA) */}
      {corridaDetalhe && (() => {
        const isCarro = corridaDetalhe.modal === "CARRO";
        const tarifaBase = isCarro ? 5.00 : 4.00;
        const taxaKm = isCarro ? 2.00 : 1.20;
        const taxaMin = isCarro ? 0.30 : 0.20;
        const distanciaKm = Math.max(1.2, Math.round((corridaDetalhe.duracaoEstimadaMin * 0.45) * 10) / 10);
        const tempoMin = corridaDetalhe.duracaoEstimadaMin;
        const valorKm = Math.round(distanciaKm * taxaKm * 100) / 100;
        const valorTempo = Math.round(tempoMin * taxaMin * 100) / 100;
        const subtotal = Math.round((tarifaBase + valorKm + valorTempo) * 100) / 100;
        const precoFinal = corridaDetalhe.valor > 0 ? corridaDetalhe.valor : subtotal;
        const taxaAppValor = Math.round(precoFinal * 0.10 * 100) / 100;
        const liquidoMotorista = Math.round((precoFinal - taxaAppValor) * 100) / 100;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
              {/* Header do Modal */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4.5 bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black ${
                    isCarro ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {isCarro ? <Car className="h-6 w-6 stroke-[2.5]" /> : <Zap className="h-6 w-6 stroke-[2.5]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">
                        Corrida #{corridaDetalhe.id}
                      </h3>
                      <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase ${
                        corridaDetalhe.status === "EM_ANDAMENTO"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse"
                          : corridaDetalhe.status === "FINALIZADA"
                          ? "bg-slate-100 text-slate-700"
                          : corridaDetalhe.status === "CANCELADA"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {corridaDetalhe.status.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{corridaDetalhe.cidade} • Solicitada às {corridaDetalhe.iniciadaEm}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Imprimir Comprovante"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Recibo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCorridaDetalhe(null)}
                    className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-all cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Corpo em 2 Colunas */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Coluna Esquerda: Trajeto, Passageiro, Motorista (7 colunas) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Trajeto Completo */}
                    <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-emerald-600" /> Itinerário de Corrida
                        </span>
                        <span className="text-xs font-bold text-slate-600 font-mono">
                          {distanciaKm} km • ~{tempoMin} min
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs sm:text-sm">
                        <div className="flex items-start gap-2.5">
                          <span className="h-3 w-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase block">Ponto de Origem</span>
                            <p className="font-bold text-slate-900 leading-snug">{corridaDetalhe.origem}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <span className="h-3 w-3 rounded-full bg-red-500 mt-1 shrink-0" />
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase block">Ponto de Destino</span>
                            <p className="font-bold text-slate-900 leading-snug">{corridaDetalhe.destino}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cards dos Envolvidos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Passageiro */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-2xl bg-primary-50 text-amber-800 flex items-center justify-center font-black shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Passageiro</span>
                            <p className="font-black text-slate-900 text-sm truncate">{corridaDetalhe.passageiroNome}</p>
                            <span className="text-xs text-slate-500">{corridaDetalhe.passageiroTelefone}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <a
                            href={`tel:${corridaDetalhe.passageiroTelefone.replace(/\D/g, "")}`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                          >
                            <Phone className="h-3.5 w-3.5" /> Ligar
                          </a>
                          <a
                            href={`https://wa.me/55${corridaDetalhe.passageiroTelefone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
                          </a>
                        </div>
                      </div>

                      {/* Motorista */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center font-black shrink-0">
                            {isCarro ? <Car className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Motorista • {corridaDetalhe.modal}</span>
                            <p className="font-black text-slate-900 text-sm truncate">{corridaDetalhe.motoristaNome}</p>
                            <span className="text-xs text-slate-500">{corridaDetalhe.motoristaTelefone}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <a
                            href={`tel:${corridaDetalhe.motoristaTelefone.replace(/\D/g, "")}`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                          >
                            <Phone className="h-3.5 w-3.5" /> Ligar
                          </a>
                          <a
                            href={`https://wa.me/55${corridaDetalhe.motoristaTelefone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita: Resumo Financeiro / Raio-X Contábil (5 colunas) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-5 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-3.5 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Receipt className="h-4 w-4 text-amber-400" /> Resumo Financeiro
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300">
                          {isCarro ? "Carro Popular" : "Moto Flash"}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs sm:text-sm font-medium text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tarifa Base:</span>
                          <span className="font-mono text-white">R$ {tarifaBase.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Distância ({distanciaKm} km × R$ {taxaKm.toFixed(2)}):</span>
                          <span className="font-mono text-white">R$ {valorKm.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tempo ({tempoMin} min × R$ {taxaMin.toFixed(2)}):</span>
                          <span className="font-mono text-white">R$ {valorTempo.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800/80 pt-1.5">
                          <span className="text-slate-400">Subtotal Operacional:</span>
                          <span className="font-mono font-bold text-white">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Paradas Extras:</span>
                          <span className="font-mono text-white">R$ 0,00</span>
                        </div>

                        <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between">
                          <span className="text-sm font-black text-white">Preço Final:</span>
                          <span className="text-lg font-black text-amber-400 font-mono">
                            R$ {precoFinal.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Taxa Plataforma (10%):</span>
                          <span className="font-mono text-emerald-400 font-bold">R$ {taxaAppValor.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <div className="flex justify-between text-slate-200 font-bold border-t border-slate-800 pt-1">
                          <span>Líquido do Motorista:</span>
                          <span className="font-mono text-white font-black text-sm">R$ {liquidoMotorista.toFixed(2).replace(".", ",")}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>Forma de Pagamento:</span>
                        <span className="font-bold text-white">PIX / Dinheiro</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setCorridaDetalhe(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-sm transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DETALHE DO TICKET DE SUPORTE */}
      {ticketDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Atendimento {ticketDetalhe.protocolo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setTicketDetalhe(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Descrição da Ocorrência:</span>
                <p className="font-bold text-slate-900 mt-0.5">{ticketDetalhe.descricao}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nota de Resolução do Atendente:</label>
                <textarea
                  rows={3}
                  placeholder="Descreva a ação tomada para encerrar o chamado..."
                  value={resolucaoTexto}
                  onChange={(e) => setResolucaoTexto(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTicketDetalhe(null)}
                className="h-11 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (ticketDetalhe.tipo === "SOS") {
                    atualizarStatusSOS.mutate({ id: ticketDetalhe.id, status: "resolvido" });
                  }
                  setTicketDetalhe(null);
                  setResolucaoTexto("");
                }}
                className="h-11 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs"
              >
                Marcar como Resolvido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
