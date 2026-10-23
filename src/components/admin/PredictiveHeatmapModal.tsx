import React, { useState, useEffect, useMemo } from "react";
import {
  Flame,
  Radio,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  predictiveDemandEngine,
  type DemandCluster,
  type DemandSeverity,
} from "@/lib/spatial/predictive-demand-engine";

export interface PredictiveHeatmapModalProps {
  aberto: boolean;
  onFechar: () => void;
  pracaNome: string;
}

export function PredictiveHeatmapModal({
  aberto,
  onFechar,
  pracaNome,
}: PredictiveHeatmapModalProps) {
  const [clusters, setClusters] = useState<DemandCluster[]>([]);
  const [filtro, setFiltro] = useState<"TODOS" | "CRITICOS" | "EM_ALTA">("TODOS");
  const [disparandoId, setDisparandoId] = useState<string | null>(null);

  // Seletores contextuais por cluster
  const [raioKmMap, setRaioKmMap] = useState<Record<string, number>>({});
  const [sobretaxaMap, setSobretaxaMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!aberto) return;

    const carregarClusters = () => {
      const data = predictiveDemandEngine.getDemandClusters(pracaNome);
      setClusters(data);
    };

    carregarClusters();
    return predictiveDemandEngine.subscribe(carregarClusters);
  }, [aberto, pracaNome]);

  const clustersFiltrados = useMemo(() => {
    if (filtro === "CRITICOS") {
      return clusters.filter((c) => c.severity === "CRITICA");
    }
    if (filtro === "EM_ALTA") {
      return clusters.filter((c) => c.trend === "RISING" || c.severity === "ALTA");
    }
    return clusters;
  }, [clusters, filtro]);

  const resumo = useMemo(() => {
    const totalChamadas = clusters.reduce((acc, c) => acc + c.activeRequests, 0);
    const totalMotoristas = clusters.reduce((acc, c) => acc + c.availableDrivers, 0);
    const criticosCount = clusters.filter((c) => c.severity === "CRITICA").length;
    return { totalChamadas, totalMotoristas, criticosCount };
  }, [clusters]);

  if (!aberto) return null;

  async function handleDispararIncentivo(cluster: DemandCluster) {
    const raioKm = raioKmMap[cluster.id] || 5;
    const multiplicador = sobretaxaMap[cluster.id] || cluster.suggestedMultiplier;

    setDisparandoId(cluster.id);

    try {
      const res = await predictiveDemandEngine.broadcastSurgeIncentive({
        clusterId: cluster.id,
        radiusKm: raioKm,
        incentiveMultiplier: multiplicador,
        adminUserId: "admin:painel_despacho",
      });

      if (res.status === "SUCCESS") {
        toast.success(
          `Alerta enviado com sucesso. ${res.driversAlerted} condutores no raio de ${raioKm} km foram notificados para a região ${cluster.name}.`
        );
      } else if (res.status === "COOLDOWN_ACTIVE") {
        toast.info(
          `Aguarde ${res.cooldownRemainingSeconds}s antes de disparar novo alerta para ${cluster.name}.`
        );
      } else {
        toast.error(`Falha no envio de incentivo para o cluster ${cluster.name}.`);
      }
    } catch {
      toast.error("Erro operacional ao transmitir alerta de incentivo.");
    } finally {
      setDisparandoId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-2xl text-white max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Torre de Demanda Preditiva</h3>
              <p className="text-xs text-slate-400">
                Praça Ativa: <span className="text-amber-400 font-semibold">{pracaNome}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fechar Torre de Demanda Preditiva"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumo Operacional em Cards */}
        <div className="grid grid-cols-3 gap-2.5 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Chamadas em Espera
            </span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">
              {resumo.totalChamadas}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Condutores Livres
            </span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">
              {resumo.totalMotoristas}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Zonas Críticas
            </span>
            <span className="text-xl font-black text-rose-400 mt-0.5 block">
              {resumo.criticosCount}
            </span>
          </div>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex items-center justify-between gap-2 shrink-0 pt-0.5">
          <span className="text-xs text-slate-400 font-medium">Filtrar Zonas:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFiltro("TODOS")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filtro === "TODOS"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              Todas ({clusters.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("CRITICOS")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filtro === "CRITICOS"
                  ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              Críticas ({resumo.criticosCount})
            </button>
            <button
              type="button"
              onClick={() => setFiltro("EM_ALTA")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filtro === "EM_ALTA"
                  ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              Em Alta
            </button>
          </div>
        </div>

        {/* Lista de Clusters */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {clustersFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma zona identificada para o filtro selecionado.
            </div>
          ) : (
            clustersFiltrados.map((cluster) => {
              const isCritico = cluster.severity === "CRITICA";
              const isAlta = cluster.severity === "ALTA";
              const raioSelecionado = raioKmMap[cluster.id] || 5;
              const multSelecionado = sobretaxaMap[cluster.id] || cluster.suggestedMultiplier;
              const isDisparando = disparandoId === cluster.id;

              return (
                <div
                  key={cluster.id}
                  className={`p-4 rounded-2xl border transition ${
                    isCritico
                      ? "bg-slate-800/70 border-rose-500/40 ring-1 ring-rose-500/20"
                      : isAlta
                      ? "bg-slate-800/60 border-amber-500/40"
                      : "bg-slate-800/40 border-slate-700/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isCritico
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : isAlta
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {cluster.severity}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {cluster.name}
                        </h4>
                      </div>

                      {/* Projeção temporal preditiva */}
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 pt-0.5">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cluster.prediction30Min}</span>
                      </div>

                      {/* Métricas do Cluster */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                        <span>
                          <strong className="text-slate-200">{cluster.activeRequests}</strong> chamadas
                        </span>
                        <span>•</span>
                        <span>
                          <strong className="text-slate-200">{cluster.availableDrivers}</strong> motoristas
                        </span>
                        <span>•</span>
                        <span className="text-slate-300">
                          Razão: <strong className="text-white">{cluster.imbalanceRatio}x</strong>
                        </span>
                      </div>
                    </div>

                    {/* Botão de Disparo */}
                    <button
                      type="button"
                      disabled={isDisparando}
                      onClick={() => handleDispararIncentivo(cluster)}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/20"
                    >
                      <Radio className="h-4 w-4 animate-pulse" />
                      <span>{isDisparando ? "Transmitindo..." : "Disparar Alerta"}</span>
                    </button>
                  </div>

                  {/* Controles de Disparo (Raio e Sobretaxa) */}
                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Raio de Busca:</span>
                      {[3, 5, 8].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRaioKmMap((prev) => ({ ...prev, [cluster.id]: r }))}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                            raioSelecionado === r
                              ? "bg-amber-500 text-slate-950"
                              : "bg-slate-700/70 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {r} km
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Incentivo:</span>
                      {[
                        { label: "+10%", mult: 1.1 },
                        { label: "+15%", mult: 1.15 },
                        { label: "+20%", mult: 1.2 },
                        { label: "+25%", mult: 1.25 },
                      ].map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() =>
                            setSobretaxaMap((prev) => ({ ...prev, [cluster.id]: s.mult }))
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                            multSelecionado === s.mult
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-700/70 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
