import React from "react";
import { Clock, AlertTriangle, ArrowRight } from "lucide-react";

export interface SaaSToleranceBannerProps {
  remainingRides: number;
  pendingFeeBrl: number;
  onOpenPaymentModal: () => void;
}

export function SaaSToleranceBanner({
  remainingRides,
  pendingFeeBrl,
  onOpenPaymentModal,
}: SaaSToleranceBannerProps) {
  return (
    <div className="mx-3 my-2 p-3 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-100 shadow-lg flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
          <Clock className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Modo de Tolerância Ativo
            </span>
          </div>
          <p className="text-[11px] text-slate-200 truncate">
            {remainingRides > 0
              ? `${remainingRides} corrida(s) permitida(s). A diária será deduzida no repasse.`
              : "Limite de tolerância atingido."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenPaymentModal}
        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shrink-0 transition active:scale-95 cursor-pointer shadow-sm"
      >
        <span>Pagar R$ {pendingFeeBrl.toFixed(2).replace(".", ",")}</span>
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
