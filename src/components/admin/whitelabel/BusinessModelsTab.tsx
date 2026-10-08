import React from "react";
import { Layers } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";

interface BusinessModelsTabProps {
  onSaveFeedback: () => void;
}

export function BusinessModelsTab({ onSaveFeedback }: BusinessModelsTabProps) {
  const { businessModels, toggleBusinessModel } = useBrandTheme();

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-600" />
          Módulo 6: Business Model Engine (Multi-Negócio)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Ative ou desative as 11 verticais operacionais da sua plataforma, configure tarifas base e comissões.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {businessModels?.verticais &&
          Object.values(businessModels.verticais).map((v) => (
            <div
              key={v.id}
              className={`p-4 rounded-2xl border transition-all ${
                v.ativo
                  ? "bg-slate-900 border-primary-600/40 shadow-sm"
                  : "bg-slate-900/40 border-slate-800 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-primary-600 flex items-center justify-center font-bold text-xs">
                    {v.icone}
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      {v.nomeExibicao}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {v.descricao}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toggleBusinessModel(v.id, !v.ativo);
                    onSaveFeedback();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    v.ativo
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {v.ativo ? "Habilitado" : "Desabilitado"}
                </button>
              </div>

              {/* Tarifa Base e Comissão */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-medium">Tarifa Base</span>
                  <span className="font-bold text-white font-mono">
                    R$ {v.tarifaBaseBrl.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-400 block font-medium">Taxa por Corrida</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    0% (Taxa Zero)
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
