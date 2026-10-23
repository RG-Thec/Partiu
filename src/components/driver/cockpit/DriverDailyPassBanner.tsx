import React, { useState } from "react";
import { Clock, QrCode, X } from "lucide-react";

export interface DriverDailyPassBannerProps {
  isExpiringSoon: boolean;
  minutesRemaining: number;
  diariaCountdownTexto: string;
  dailyFeeAmount: number;
  onOpenPlanos: () => void;
}

export function DriverDailyPassBanner({
  isExpiringSoon,
  minutesRemaining,
  diariaCountdownTexto,
  dailyFeeAmount,
  onOpenPlanos,
}: DriverDailyPassBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!isExpiringSoon || dismissed) {
    return null;
  }

  return (
    <div className="absolute top-[4.5rem] inset-x-3 z-40 max-w-lg mx-auto p-3.5 bg-amber-500/15 backdrop-blur-md text-foreground rounded-2xl shadow-xl flex items-start gap-3 border border-amber-500/40 animate-in slide-in-from-top duration-200">
      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
        <Clock className="w-5 h-5 animate-pulse" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-black text-xs uppercase tracking-tight text-amber-700 dark:text-amber-300">
            Diária encerra em {diariaCountdownTexto || `${minutesRemaining} min`}
          </span>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer -mr-1"
            aria-label="Dispensar aviso de diária"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          Renove agora para continuar recebendo chamados no Trip Radar com{" "}
          <strong>0% de comissão</strong>.
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <button
            type="button"
            onClick={onOpenPlanos}
            className="h-9 px-3.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>RENOVAR VIA PIX (R$ {dailyFeeAmount.toFixed(2)})</span>
          </button>

          <button
            type="button"
            onClick={onOpenPlanos}
            className="h-9 px-3 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl border border-border transition cursor-pointer"
          >
            Ver Planos
          </button>
        </div>
      </div>
    </div>
  );
}
