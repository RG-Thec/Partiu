import React, { useState, useEffect } from "react";
import { User, MapPin, CheckCircle, X, Sparkles, Navigation } from "lucide-react";
import type { BackToBackCandidate } from "@/lib/driver/back-to-back-engine";

export interface BackToBackRideCardProps {
  candidate: BackToBackCandidate;
  onAccept: (candidate: BackToBackCandidate) => void;
  onDecline: (candidateId: string) => void;
  isConfirmedInQueue?: boolean;
}

export function BackToBackRideCard({
  candidate,
  onAccept,
  onDecline,
  isConfirmedInQueue = false,
}: BackToBackRideCardProps) {
  const [tempoRestante, setTempoRestante] = useState(candidate.expiraEmSegundos || 15);

  useEffect(() => {
    if (isConfirmedInQueue) return;
    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(candidate.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [candidate.id, isConfirmedInQueue, onDecline]);

  if (isConfirmedInQueue) {
    return (
      <div className="mx-3 my-2 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 shadow-xl backdrop-blur-md text-white flex items-center justify-between gap-3 animate-in fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Próxima Corrida em Fila
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-xs font-bold truncate text-slate-100">
              {candidate.passageiroNome} • Embarque a {candidate.distanciaDoDesembarqueMetros}m
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-black text-emerald-400">
            R$ {candidate.valorEstimadoBrl.toFixed(2).replace(".", ",")}
          </span>
          <p className="text-[9px] text-slate-400">Inicia após desembarque</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 my-2 p-4 rounded-3xl bg-slate-900/95 border-2 border-primary-500/80 shadow-2xl backdrop-blur-md text-white space-y-3 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-600/30 border border-primary-500/40 text-[10px] font-black uppercase tracking-wider text-primary-400">
          <Sparkles className="h-3 w-3 animate-pulse" /> Chamada em Cadeia (Sem Espera)
        </div>
        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-500/30">
          {tempoRestante}s
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-10 w-10 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{candidate.passageiroNome}</h4>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>★ {candidate.passageiroNota.toFixed(1)}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">
                A {candidate.distanciaDoDesembarqueMetros}m do seu desembarque
              </span>
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-sm sm:text-base font-black text-emerald-400">
            R$ {candidate.valorEstimadoBrl.toFixed(2).replace(".", ",")}
          </span>
          <p className="text-[10px] text-slate-400">Ganho líquido</p>
        </div>
      </div>

      <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-1.5 text-xs text-slate-300">
        <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
        <span className="truncate">{candidate.origemEndereco}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onDecline(candidate.id)}
          className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
        >
          <X className="h-4 w-4" /> Dispensar
        </button>

        <button
          type="button"
          onClick={() => onAccept(candidate)}
          className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
        >
          <Navigation className="h-4 w-4 fill-current" /> Aceitar em Fila
        </button>
      </div>
    </div>
  );
}
