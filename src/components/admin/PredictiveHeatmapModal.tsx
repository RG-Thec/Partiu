import React, { useState } from "react";
import { Flame, Radio, Send, Users, AlertCircle, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

export interface DemandCluster {
  id: string;
  bairro: string;
  cidade: string;
  chamadasPendentes: number;
  motoristasNoRaio: number;
  taxaDesbalanceamento: "ALTA" | "CRITICA" | "MODERADA";
  sugestaoSobretaxa: string;
}

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
  const [clusters] = useState<DemandCluster[]>([
    {
      id: "c1",
      bairro: "Centro / Terminal Rodoviário",
      cidade: pracaNome,
      chamadasPendentes: 14,
      motoristasNoRaio: 2,
      taxaDesbalanceamento: "CRITICA",
      sugestaoSobretaxa: "+20%",
    },
    {
      id: "c2",
      bairro: "Polo Universitário",
      cidade: pracaNome,
      chamadasPendentes: 8,
      motoristasNoRaio: 3,
      taxaDesbalanceamento: "ALTA",
      sugestaoSobretaxa: "+15%",
    },
    {
      id: "c3",
      bairro: "Zona Comercial Sul",
      cidade: pracaNome,
      chamadasPendentes: 5,
      motoristasNoRaio: 4,
      taxaDesbalanceamento: "MODERADA",
      sugestaoSobretaxa: "+10%",
    },
  ]);

  const [disparando, setDisparando] = useState<string | null>(null);

  if (!aberto) return null;

  function handleDispararIncentivo(cluster: DemandCluster) {
    setDisparando(cluster.id);
    setTimeout(() => {
      setDisparando(null);
      toast.success(
        `Alerta de alta demanda enviado para condutores próximos de ${cluster.bairro}! Tarifa sugerida ${cluster.sugestaoSobretaxa}.`
      );
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl text-white animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Torre de Demanda Preditiva</h3>
              <p className="text-xs text-slate-400">
                Praça Ativa: <span className="text-amber-400 font-semibold">{pracaNome}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Zonas de desbalanceamento entre passageiros solicitando viagens e motoristas livres no
          perímetro. Dispare alertas para atrair condutores e evitar cancelamentos.
        </p>

        <div className="space-y-3">
          {clusters.map((cluster) => {
            const isCritico = cluster.taxaDesbalanceamento === "CRITICA";
            return (
              <div
                key={cluster.id}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isCritico
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {cluster.taxaDesbalanceamento}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{cluster.bairro}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>
                      <strong className="text-slate-200">{cluster.chamadasPendentes}</strong> chamadas
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-200">{cluster.motoristasNoRaio}</strong> motoristas
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">Incentivo: {cluster.sugestaoSobretaxa}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={disparando === cluster.id}
                  onClick={() => handleDispararIncentivo(cluster)}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Radio className="h-3.5 w-3.5 animate-pulse" />
                  <span>{disparando === cluster.id ? "Enviando..." : "Disparar Alerta"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
