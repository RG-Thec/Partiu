import React from "react";
import { DollarSign } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";

interface MonetizationTabProps {
  onSaveFeedback: () => void;
}

export function MonetizationTab({ onSaveFeedback }: MonetizationTabProps) {
  const { monetization } = useBrandTheme();

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          Módulo 7: Planos &amp; Monetização
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Gerencie os planos dos motoristas parceiros (Bronze, Prata, Ouro, etc.) e regras financeiras.
        </p>
      </div>

      <div className="space-y-4">
        {monetization?.planos?.map((plano) => (
          <div
            key={plano.id}
            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black text-white">{plano.nome}</span>
                <span
                  style={{ backgroundColor: plano.badgeCor }}
                  className="text-slate-950 px-2 py-0.5 rounded text-[10px] font-black"
                >
                  {plano.comissaoPercentual === 0 ? "Taxa Zero" : `${plano.comissaoPercentual}%`}
                </span>
              </div>
              <p className="text-xs text-slate-400">{plano.descricao}</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">Mensalidade</span>
                <span className="font-bold text-emerald-400">
                  R$ {plano.mensalidadeBrl.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Diária</span>
                <span className="font-bold text-white">
                  R$ {plano.diariaBrl.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Despacho VIP</span>
                <span className="font-bold text-primary-600">
                  {plano.pesoDespacho}x
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
