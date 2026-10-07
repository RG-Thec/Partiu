import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle2,
  DollarSign,
  Eye,
  FileSpreadsheet,
  IdCard,
  Lock,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Unlock,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  atualizarPassageiro,
  cadastrarPassageiro,
  listarPassageiros,
  alternarStatusPassageiro,
  type PassageiroAdmin,
} from "@/lib/passageiros.functions";
import { usePartiuRides, type PartiuRideRecord } from "@/lib/partiu-db";
import { exportarParaCSV } from "@/lib/export-csv";
import { getAdminRole, isFranqueado } from "@/lib/admin-rbac";
import { useAdminCity } from "@/contexts/AdminCityContext";

export const Route = createFileRoute("/app/admin/passageiros")({
  head: () => ({
    meta: [
      { title: "Gestão de Passageiros & LTV | PARTIU Admin" },
      {
        name: "description",
        content:
          "Inteligência de clientes, métricas de LTV, histórico de corridas e compliance cadastral do app PARTIU.",
      },
      { property: "og:title", content: "Gestão de Passageiros & LTV | PARTIU Admin" },
      {
        property: "og:description",
        content: "Gestão de passageiros, LTV acumulado, controle de bloqueio cautelar e auditoria de viagens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPassageiros,
});

const CAMPO =
  "mt-1 w-full min-h-11 h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 outline-none transition-colors";

function AdminPassageiros() {
  const { pracaAtiva, isNacional, selecionarPraca } = useAdminCity();
  const [adminRole] = useState(() => getAdminRole());

  const qc = useQueryClient();
  const listar = useServerFn(listarPassageiros);
  const cadastrar = useServerFn(cadastrarPassageiro);
  const atualizar = useServerFn(atualizarPassageiro);
  const alternarStatus = useServerFn(alternarStatusPassageiro);

  const {
    data: passageiros = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "passageiros"],
    queryFn: () => listar(),
  });

  const { data: todasCorridas = [] } = usePartiuRides(200);

  // Estados de formulário e filtros
  const [modalNovoPassageiroAberto, setModalNovoPassageiroAberto] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", cpf: "", whatsapp: "" });
  const [editando, setEditando] = useState<PassageiroAdmin | null>(null);
  const [passageiroDetalhe, setPassageiroDetalhe] = useState<PassageiroAdmin | null>(null);
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "ATIVOS" | "BLOQUEADOS">("TODOS");

  const criar = useMutation({
    mutationFn: (dados: typeof form) => cadastrar({ data: dados }),
    onSuccess: () => {
      setForm({ nome: "", email: "", senha: "", cpf: "", whatsapp: "" });
      void qc.invalidateQueries({ queryKey: ["admin", "passageiros"] });
      setTimeout(() => setModalNovoPassageiroAberto(false), 1200);
    },
  });

  const salvarEdicao = useMutation({
    mutationFn: (dados: { id: string; nome: string; cpf: string; whatsapp: string }) =>
      atualizar({ data: dados }),
    onSuccess: () => {
      setEditando(null);
      void qc.invalidateQueries({ queryKey: ["admin", "passageiros"] });
    },
  });

  const mudarStatus = useMutation({
    mutationFn: (dados: { id: string; status: "ativo" | "bloqueado"; motivo?: string }) =>
      alternarStatus({ data: dados }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "passageiros"] });
      if (passageiroDetalhe) {
        setPassageiroDetalhe((ant) =>
          ant ? { ...ant, status: ant.status === "bloqueado" ? "ativo" : "bloqueado" } : null
        );
      }
      setMotivoBloqueio("");
    },
  });

  // Mapeamento de LTV e métricas por passageiro
  const passageirosComMetricas = useMemo(() => {
    return passageiros.map((p) => {
      const viagensDoPassageiro = todasCorridas.filter(
        (r) =>
          (r.passenger_id && r.passenger_id === p.id) ||
          (r.passenger_name &&
            p.full_name &&
            r.passenger_name.toLowerCase().trim() === p.full_name.toLowerCase().trim())
      );
      const totalCorridas = viagensDoPassageiro.length;
      const ltvBrl = viagensDoPassageiro.reduce((acc, r) => acc + Number(r.fare_brl || 0), 0);

      return {
        ...p,
        total_corridas: totalCorridas,
        ltv_brl: ltvBrl,
        viagens: viagensDoPassageiro,
      };
    });
  }, [passageiros, todasCorridas]);

  // Escopo por Franquia / Praça Ativa
  const passageirosDaPraca = useMemo(() => {
    if (isNacional) return passageirosComMetricas;
    const nomeCidade = pracaAtiva.nome.toLowerCase();
    return passageirosComMetricas.filter((p) => {
      const temViagemNaCidade = p.viagens.some((r) =>
        (r.pickup_address && r.pickup_address.toLowerCase().includes(nomeCidade)) ||
        (r.destination_address && r.destination_address.toLowerCase().includes(nomeCidade))
      );
      const cidadeUsuario = ((p as any).cidade || (p as any).city || "").toLowerCase();
      return temViagemNaCidade || cidadeUsuario.includes(nomeCidade);
    });
  }, [passageirosComMetricas, isNacional, pracaAtiva.nome]);

  // Indicadores Executivos Globais
  const kpis = useMemo(() => {
    const total = passageirosDaPraca.length;
    const ltvTotal = passageirosDaPraca.reduce((acc, p) => acc + (p.ltv_brl || 0), 0);
    const totalViagens = passageirosDaPraca.reduce((acc, p) => acc + (p.total_corridas || 0), 0);
    const mediaViagens = total > 0 ? (totalViagens / total).toFixed(1) : "0.0";
    const hojeStr = new Date().toISOString().slice(0, 10);
    const novosHoje = passageirosDaPraca.filter((p) => p.created_at.slice(0, 10) === hojeStr).length;

    return { total, ltvTotal, mediaViagens, novosHoje };
  }, [passageirosDaPraca]);

  // Filtragem da lista
  const passageirosFiltrados = useMemo(() => {
    return passageirosDaPraca.filter((p) => {
      if (filtroStatus === "ATIVOS" && p.status === "bloqueado") return false;
      if (filtroStatus === "BLOQUEADOS" && p.status !== "bloqueado") return false;

      if (busca) {
        const q = busca.toLowerCase();
        return (
          (p.full_name && p.full_name.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.cpf && p.cpf.toLowerCase().includes(q)) ||
          (p.phone && p.phone.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [passageirosDaPraca, filtroStatus, busca]);

  // Viagens do passageiro em modal
  const viagensModal = useMemo(() => {
    if (!passageiroDetalhe) return [];
    return todasCorridas.filter(
      (r) =>
        (r.passenger_id && r.passenger_id === passageiroDetalhe.id) ||
        (r.passenger_name &&
          passageiroDetalhe.full_name &&
          r.passenger_name.toLowerCase().trim() === passageiroDetalhe.full_name.toLowerCase().trim())
    );
  }, [passageiroDetalhe, todasCorridas]);

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 w-full">
      {/* 1. Header Executivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Gestão de Clientes • {isFranqueado(adminRole) ? `Franquia ${pracaAtiva?.nome || "Regional"}` : "Gestão Nacional"}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Base de Passageiros &amp; LTV
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0088FF] border border-blue-200/50">
              {kpis.total} CLIENTES
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de LTV, histórico de corridas, conformidade e governança de bloqueio {isNacional ? "em âmbito nacional" : `em ${pracaAtiva.nome}`}.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setModalNovoPassageiroAberto(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 text-xs font-black shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5 text-[#0088FF]" />
            <span>Novo Passageiro</span>
          </button>

          <button
            type="button"
            onClick={() => {
              exportarParaCSV(
                `passageiros_partiu_${new Date().toISOString().slice(0, 10)}`,
                ["ID", "Nome Completo", "E-mail", "CPF", "WhatsApp", "Status", "Total de Corridas", "LTV Acumulado R$", "Data de Cadastro"],
                passageirosFiltrados.map((p) => [
                  p.id,
                  p.full_name || "Sem nome",
                  p.email || "—",
                  p.cpf || "—",
                  p.phone || "—",
                  p.status || "ativo",
                  p.total_corridas || 0,
                  (p.ltv_brl || 0).toFixed(2),
                  new Date(p.created_at).toLocaleDateString("pt-BR"),
                ])
              );
            }}
            className="flex h-10 items-center gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 text-xs font-bold border border-emerald-300 shadow-xs transition-all cursor-pointer"
            title="Exportar base de passageiros em CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <Link
            to="/app"
            className="flex h-10 items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 text-xs font-black border border-slate-200/80 shadow-xs transition-all cursor-pointer"
          >
            <Car className="h-3.5 w-3.5 text-[#0088FF]" />
            <span className="hidden sm:inline">Abrir App</span>
          </Link>
        </div>
      </div>

      {/* Banner de Filtragem por Praça Ativa */}
      {!isNacional && (
        <div className="rounded-xl bg-blue-50/90 border border-blue-200/80 px-4 py-2.5 flex items-center justify-between gap-3 text-blue-900 text-xs animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#0088FF] shrink-0" />
            <span className="font-bold">
              Base de clientes filtrada pela praça: <strong>{pracaAtiva.labelCompleto}</strong>
            </span>
          </div>
          {!isFranqueado(adminRole) && (
            <button
              type="button"
              onClick={() => selecionarPraca("todas")}
              className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-white border border-blue-300 hover:bg-blue-100/70 text-blue-950 transition-colors cursor-pointer shrink-0"
            >
              Ver Todas as Praças
            </button>
          )}
        </div>
      )}

      {/* 2. Top Metrics (KPIs Executivos de LTV) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Base na Praça</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0088FF] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{kpis.total}</span>
            <span className="text-[11px] font-medium text-slate-500">clientes</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">LTV Acumulado (GMV)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">
              R$ {kpis.ltvTotal.toFixed(2).replace(".", ",")}
            </span>
            <span className="text-[11px] font-medium text-emerald-600">faturamento</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Frequência Média</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{kpis.mediaViagens}</span>
            <span className="text-[11px] font-medium text-slate-500">viagens/usuário</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Novos Cadastros</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{kpis.novosHoje}</span>
            <span className="text-[11px] font-bold text-emerald-600">hoje</span>
          </div>
        </div>
      </div>

      {/* 4. Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {(
            [
              { key: "TODOS", label: "Todos" },
              { key: "ATIVOS", label: "Ativos" },
              { key: "BLOQUEADOS", label: "Bloqueados" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFiltroStatus(key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filtroStatus === key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF, e-mail ou WhatsApp..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 5. Tabela de Passageiros com LTV e Status */}
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
          <h2 className="text-sm sm:text-base font-black text-slate-800">
            Passageiros Cadastrados ({passageirosFiltrados.length})
          </h2>
          <span className="text-xs font-bold text-slate-500">
            Ordenados por data de cadastro
          </span>
        </div>

        {isLoading && <p className="p-6 text-sm text-slate-500">Carregando passageiros...</p>}
        {error && <p className="p-6 text-sm font-bold text-rose-600">{(error as Error).message}</p>}

        {/* Tabela Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/90 text-slate-600 uppercase font-black tracking-wider text-xs border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Passageiro</th>
                <th className="py-3.5 px-6">Documentos / Contato</th>
                <th className="py-3.5 px-6 text-center">Corridas</th>
                <th className="py-3.5 px-6 text-right">LTV Acumulado</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {passageirosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 text-sm">
                    Nenhum passageiro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                passageirosFiltrados.map((p) => {
                  const isBloqueado = p.status === "bloqueado";
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-black text-slate-900 text-sm">{p.full_name ?? "Sem nome"}</p>
                        <span className="text-xs text-slate-500">{p.email ?? "—"}</span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <p className="font-semibold">{p.cpf ?? "CPF não informado"}</p>
                        <p className="text-slate-500">{p.phone ?? "WhatsApp não informado"}</p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700">
                          {p.total_corridas} viagens
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          R$ {(p.ltv_brl || 0).toFixed(2).replace(".", ",")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                            isBloqueado
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isBloqueado ? <Lock className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                          {isBloqueado ? "Bloqueado" : "Ativo"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPassageiroDetalhe(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Ver histórico e LTV detalhado"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#0088FF]" />
                            <span>Detalhes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditando(p)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                            title="Editar CPF e Telefone"
                          >
                            Editar
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

        {/* Versão Mobile (Cards Empilhados) */}
        <div className="grid grid-cols-1 gap-3 md:hidden p-4">
          {passageirosFiltrados.map((p) => {
            const isBloqueado = p.status === "bloqueado";
            return (
              <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-slate-900 text-sm">{p.full_name ?? "Sem nome"}</p>
                    <p className="text-xs text-slate-500">{p.email ?? "—"}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isBloqueado ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {isBloqueado ? "Bloqueado" : "Ativo"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Viagens:</span>
                    <span className="font-bold text-slate-900">{p.total_corridas}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">LTV:</span>
                    <span className="font-bold text-emerald-700">
                      R$ {(p.ltv_brl || 0).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPassageiroDetalhe(p)}
                    className="flex-1 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold text-center"
                  >
                    Ver Detalhes &amp; LTV
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditando(p)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Modal de Edição de Dados */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">Editar Dados do Passageiro</h3>
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Nome Completo</label>
                <input
                  className={CAMPO}
                  value={editando.full_name ?? ""}
                  onChange={(e) => setEditando({ ...editando, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">CPF</label>
                <input
                  className={CAMPO}
                  value={editando.cpf ?? ""}
                  onChange={(e) => setEditando({ ...editando, cpf: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">WhatsApp</label>
                <input
                  className={CAMPO}
                  value={editando.phone ?? ""}
                  onChange={(e) => setEditando({ ...editando, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvarEdicao.isPending}
                onClick={() =>
                  salvarEdicao.mutate({
                    id: editando.id,
                    nome: editando.full_name ?? "",
                    cpf: editando.cpf ?? "",
                    whatsapp: editando.phone ?? "",
                  })
                }
                className="flex-1 rounded-xl bg-[#0088FF] py-2.5 text-xs font-black text-slate-950 hover:bg-[#00A3FF]"
              >
                {salvarEdicao.isPending ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de Detalhes do Passageiro, LTV e Histórico de Corridas */}
      {passageiroDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in-50">
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                  {(passageiroDetalhe.full_name || "P").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black leading-tight">{passageiroDetalhe.full_name ?? "Passageiro PARTIU"}</h3>
                  <p className="text-[11px] text-slate-400 leading-tight">{passageiroDetalhe.email ?? "—"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPassageiroDetalhe(null)}
                className="h-7.5 w-7.5 rounded-lg flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Cards de Métricas do Passageiro */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Gasto Total (LTV)
                  </span>
                  <p className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
                    R$ {(passageiroDetalhe.ltv_brl || 0).toFixed(2).replace(".", ",")}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Total de Viagens
                  </span>
                  <p className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    {viagensModal.length} corridas
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Status da Conta
                  </span>
                  <p
                    className={`text-xs font-black mt-1 uppercase ${
                      passageiroDetalhe.status === "bloqueado" ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {passageiroDetalhe.status === "bloqueado" ? "Bloqueado Cautelar" : "Ativo Regular"}
                  </p>
                </div>
              </div>

              {/* Informações Cadastrais */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">CPF Vinculado</span>
                  <span className="font-bold text-slate-800">{passageiroDetalhe.cpf ?? "Não informado"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">WhatsApp</span>
                  <span className="font-bold text-slate-800">{passageiroDetalhe.phone ?? "Não informado"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Cadastrado em</span>
                  <span className="font-bold text-slate-800">
                    {new Date(passageiroDetalhe.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              {/* Histórico de Viagens */}
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4 text-[#0088FF]" /> Histórico de Viagens Recentes
                </h4>
                {viagensModal.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    Nenhuma viagem registrada até o momento para este passageiro.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {viagensModal.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">
                            {v.pickup_address || "Origem"} → {v.destination_address || "Destino"}
                          </p>
                          <span className="text-[11px] text-slate-500">
                            Motorista: {v.driver_name || "Aguardando"} • {v.created_at ? new Date(v.created_at).toLocaleDateString("pt-BR") : "Hoje"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-slate-900">
                            R$ {Number(v.fare_brl || 0).toFixed(2).replace(".", ",")}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-200 text-slate-700">
                            {v.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção de Bloqueio Cautelar / Desbloqueio (Compliance & Governança) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-700" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Governança e Bloqueio Cautelar
                  </h4>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  O bloqueio cautelar suspende temporariamente a permissão do passageiro de solicitar novas corridas sem apagar seus dados históricos nem relatórios financeiros.
                </p>

                {passageiroDetalhe.status === "bloqueado" ? (
                  <button
                    type="button"
                    disabled={mudarStatus.isPending}
                    onClick={() =>
                      mudarStatus.mutate({
                        id: passageiroDetalhe.id,
                        status: "ativo",
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>Desbloquear Passageiro</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Motivo do bloqueio (ex: Inadimplência, Conduta imprópria)..."
                      value={motivoBloqueio}
                      onChange={(e) => setMotivoBloqueio(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-white border border-amber-300 text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      disabled={mudarStatus.isPending}
                      onClick={() =>
                        mudarStatus.mutate({
                          id: passageiroDetalhe.id,
                          status: "bloqueado",
                          motivo: motivoBloqueio || "Suspensão cautelar administrativa",
                        })
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Confirmar Bloqueio Cautelar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setPassageiroDetalhe(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO PASSAGEIRO */}
      {modalNovoPassageiroAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#0088FF] flex items-center justify-center font-bold">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">Cadastrar Novo Passageiro</h3>
                  <p className="text-[11px] text-slate-500 leading-tight">Cadastre e libere acesso imediato ao aplicativo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoPassageiroAberto(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 sm:col-span-2">
                Nome completo
                <input
                  type="text"
                  placeholder="Nome do cliente"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className={CAMPO}
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                E-mail de acesso
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={CAMPO}
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Senha inicial
                <input
                  type="text"
                  placeholder="Mínimo 6 dígitos"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  className={CAMPO}
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                CPF
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                  className={CAMPO}
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                WhatsApp
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  className={CAMPO}
                />
              </label>
            </div>

            {criar.isError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {(criar.error as Error).message}
              </p>
            )}

            {criar.isSuccess && (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                Passageiro cadastrado com sucesso! Acesso liberado no app.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalNovoPassageiroAberto(false)}
                className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={criar.isPending}
                onClick={() => criar.mutate(form)}
                className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>{criar.isPending ? "Cadastrando..." : "Cadastrar Passageiro"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
