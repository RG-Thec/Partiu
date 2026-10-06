import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  DollarSign,
  Download,
  Filter,
  HardDrive,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  type ApiRequestLog,
  type FinOpsMetricas,
  type ConfigCacheMapas,
  type CategoriaRequisicaoApi,
  carregarLogsFinOps,
  calcularMetricasFinOps,
  carregarConfigFinOps,
  salvarConfigFinOps,
  limparCacheMapas,
  registrarChamadaApi,
} from "@/lib/maps-finops-service";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";

export const Route = createFileRoute("/app/admin/api-finops")({
  head: () => ({
    meta: [
      { title: "FinOps de APIs & Google Maps Cache | PARTIU Admin" },
      {
        name: "description",
        content:
          "Monitoramento de custos de APIs de geolocalização e rotas, métricas de retenção de cache local e stream de observabilidade.",
      },
    ],
  }),
  component: ApiFinOpsAdminPage,
});

export function ApiFinOpsAdminPage() {
  const [logs, setLogs] = useState<ApiRequestLog[]>(() => carregarLogsFinOps());
  const [config, setConfig] = useState<ConfigCacheMapas>(() => carregarConfigFinOps());
  const [filtroCategoria, setFiltroCategoria] = useState<string>("TODAS");
  const [buscaTexto, setBuscaTexto] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const metricas = useMemo(() => calcularMetricasFinOps(logs), [logs]);

  function mostrarToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  function recarregarDados() {
    setLogs(carregarLogsFinOps());
    setConfig(carregarConfigFinOps());
    mostrarToast("Dados e métricas de FinOps atualizados!");
  }

  useEffect(() => {
    const handleUpdate = () => {
      setLogs(carregarLogsFinOps());
      setConfig(carregarConfigFinOps());
    };
    window.addEventListener("partiu:maps-finops-updated", handleUpdate);
    return () => window.removeEventListener("partiu:maps-finops-updated", handleUpdate);
  }, []);

  const logsFiltrados = useMemo(() => {
    return logs.filter((l) => {
      const matchCat =
        filtroCategoria === "TODAS" || l.categoria === filtroCategoria;
      const matchBusca =
        buscaTexto === "" ||
        l.parametros.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        l.endpoint.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        l.provedor.toLowerCase().includes(buscaTexto.toLowerCase());
      return matchCat && matchBusca;
    });
  }, [logs, filtroCategoria, buscaTexto]);

  const handleLimparCache = () => {
    if (window.confirm("Deseja realmente purgar todo o cache local de rotas e geocoding? Novas requisições farão chamadas diretas ao provedor.")) {
      limparCacheMapas();
      recarregarDados();
      mostrarToast("Cache de mapas e histórico de requisições purgados!");
    }
  };

  const handleSalvarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    salvarConfigFinOps(config);
    mostrarToast("Parâmetros de FinOps e TTL do cache salvos com sucesso!");
  };

  const handleExportarCsv = () => {
    const headers = "ID,Data/Hora,Categoria,Provedor,Endpoint,Status,Latencia(ms),Custo(USD),Economia(USD),Parametros\n";
    const rows = logsFiltrados
      .map(
        (l) =>
          `"${l.id}","${new Date(l.timestamp).toISOString()}","${l.categoria}","${l.provedor}","${l.endpoint}","${l.status}",${l.latenciaMs},${l.custoEstimadoUsd},${l.economiaEstimadaUsd},"${l.parametros.replace(/"/g, '""')}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finops-maps-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    mostrarToast("Relatório CSV gerado e baixado com sucesso!");
  };

  const handleSimularChamada = (status: "HIT" | "MISS") => {
    registrarChamadaApi({
      categoria: status === "HIT" ? "CORRIDA" : "GOOGLE MAPS",
      provedor: status === "HIT" ? "CACHE_LOCAL" : "GOOGLE_MAPS",
      endpoint: "Directions",
      parametros: status === "HIT" ? "Simulação de rota frequente (Cache Hit)" : "Simulação de nova rota (Google Directions API)",
      status,
      latenciaMs: status === "HIT" ? 12 : 210,
    });
    recarregarDados();
  };

  return (
    <GuardiaoAcesso permissao="operations:view_operational_kpis">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Toast Notificação */}
        {toastMsg && (
          <div className="fixed top-4 right-4 z-50 bg-slate-950 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header do Módulo */}
        <div className="bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-transparent border border-blue-600/30 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 fill-current" />
              Módulo 10 • FinOps de APIs de Mapas
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950">
              Observabilidade de APIs & Google Maps Cache
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Monitore a contenção de custos de APIs de geolocalização através do cache determinístico de rotas (Directions) e geocodificação (Places), com métricas de retenção e stream de logs em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={recarregarDados}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-xs"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Atualizar</span>
            </button>
            <button
              type="button"
              onClick={handleExportarCsv}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* KPI Cards FinOps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Taxa de Retenção (Cache Hit)
            </span>
            <div className="text-2xl font-black text-emerald-700">
              {metricas.taxaRetencaoPercent.toFixed(1)}%
            </div>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {metricas.totalCacheHits} de {metricas.totalRequisicoes} servidas localmente
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Economia Gerada (BRL)
            </span>
            <div className="text-2xl font-black text-emerald-700">
              {metricas.totalEconomizadoBrl.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              US$ {metricas.totalEconomizadoUsd.toFixed(3)} poupados
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Gasto Real na API (USD)
            </span>
            <div className="text-2xl font-black text-slate-950">
              US$ {metricas.custoRealGastoUsd.toFixed(3)}
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              {metricas.totalGoogleMaps} requisições faturadas
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Latência Média de Resposta
            </span>
            <div className="text-2xl font-black text-blue-700">
              {metricas.tempoMedioRespostaMs} ms
            </div>
            <span className="text-[10px] text-blue-700 font-bold">
              Sub-50ms no Cache Local
            </span>
          </div>
        </div>

        {/* Configurações de Cache & Ações Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-950 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Parâmetros do Cache de Mapas
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                LRU + LocalStorage
              </span>
            </div>

            <form onSubmit={handleSalvarConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    TTL de Validade (Minutos)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={config.ttlMinutos}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        ttlMinutos: parseInt(e.target.value) || 30,
                      }))
                    }
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Deadband Radial (Metros)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={config.deadbandMetros}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        deadbandMetros: parseInt(e.target.value) || 50,
                      }))
                    }
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={config.modoEconomiaAgressivo}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        modoEconomiaAgressivo: e.target.checked,
                      }))
                    }
                    className="rounded text-blue-600"
                  />
                  <span>Modo Economia Agressivo (Deduplicação ~100m)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={config.usarOsrmComoFallback}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        usarOsrmComoFallback: e.target.checked,
                      }))
                    }
                    className="rounded text-blue-600"
                  />
                  <span>Fallback Gratuito OSRM se Google Maps falhar</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleLimparCache}
                  className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purgar Cache</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-xs transition"
                >
                  Salvar Parâmetros
                </button>
              </div>
            </form>

            {/* Testes de Simulação de Tráfego */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Simulador de Eventos de API
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimularChamada("HIT")}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition"
                >
                  + Simular Cache Hit (0ms)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimularChamada("MISS")}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                >
                  + Simular Miss (Google API)
                </button>
              </div>
            </div>
          </div>

          {/* Stream de Observabilidade e Logs */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Stream de Requisições de Mapas em Tempo Real
                </h2>
                <p className="text-[11px] text-slate-500">
                  Categorização de tráfego por chamadas de corrida, servidor, geocoding e cache local.
                </p>
              </div>

              {/* Filtro por Categoria */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                {["TODAS", "CORRIDA", "GOOGLE MAPS", "SERVIDOR", "SALVAR"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFiltroCategoria(cat)}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      filtroCategoria === cat
                        ? "bg-white text-slate-950 shadow-xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Barra de Busca de Logs */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                placeholder="Buscar por coordenadas, nome de rua, endpoint ou provedor..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Tabela de Stream */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 bg-white">
                  <tr>
                    <th className="py-2.5 px-2">Data / Hora</th>
                    <th className="py-2.5 px-2">Categoria</th>
                    <th className="py-2.5 px-2">Endpoint</th>
                    <th className="py-2.5 px-2">Detalhes / Rota</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2 text-right">Latência</th>
                    <th className="py-2.5 px-2 text-right">Custo / Economia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        Nenhuma requisição encontrada com os filtros informados.
                      </td>
                    </tr>
                  ) : (
                    logsFiltrados.map((log) => {
                      const isHit = log.status === "HIT" || log.status === "SAVED";

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-2 text-[10px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="py-2.5 px-2">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black ${
                                log.categoria === "CORRIDA"
                                  ? "bg-amber-100 text-amber-900"
                                  : log.categoria === "GOOGLE MAPS"
                                  ? "bg-blue-100 text-blue-900"
                                  : log.categoria === "SALVAR"
                                  ? "bg-purple-100 text-purple-900"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {log.categoria}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-800">
                            {log.endpoint}
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 truncate max-w-xs text-[11px]" title={log.parametros}>
                            {log.parametros}
                          </td>
                          <td className="py-2.5 px-2">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isHit
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-[11px] text-slate-600">
                            {log.latenciaMs}ms
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            {isHit ? (
                              <span className="font-bold text-emerald-700 text-[11px]">
                                +US$ {log.economiaEstimadaUsd.toFixed(3)}
                              </span>
                            ) : (
                              <span className="font-medium text-slate-700 text-[11px]">
                                US$ {log.custoEstimadoUsd.toFixed(3)}
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
    </GuardiaoAcesso>
  );
}
