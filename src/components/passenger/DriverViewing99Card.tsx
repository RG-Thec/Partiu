import React, { memo } from "react";
import { Star, Eye, ShieldCheck, Car, Clock, Navigation } from "lucide-react";
import { type DriverViewingProfile } from "@/services/ProgressiveDispatchEngine";

interface DriverViewing99CardProps {
  driver: DriverViewingProfile | {
    id: string;
    name: string;
    firstName: string;
    avatarUrl: string;
    rating: number;
    category?: string;
    vehicleModel: string;
    vehicleColor?: string;
    licensePlate: string;
    distanceKm: number;
    etaMinutes: number;
    cascadeSecondsRemaining?: number;
  };
  totalViewingCount?: number;
  isTransitioning?: boolean;
}

/**
 * ==============================================================================
 * 🚕 CARD 99 TEMPO REAL — MOTORISTA VISUALIZANDO SUA SOLICITAÇÃO
 * ==============================================================================
 * 100% padronizado com a experiência do app 99:
 * - Indicador visual de presença em tempo real com radar pulsante
 * - Foto de perfil em destaque com borda viva
 * - Resumo completo do perfil: Nome, Nota, Modelo e Cor do Veículo, Placa e Distância
 * - Mensagem humanizada e contextual em tempo real
 * ==============================================================================
 */
export const DriverViewing99Card = memo(function DriverViewing99Card({
  driver,
  totalViewingCount = 1,
  isTransitioning = false,
}: DriverViewing99CardProps) {
  const fullName = (driver as any).fullName || (driver as any).name || "Motorista";
  const firstName = driver.firstName || fullName.split(" ")[0] || "Motorista";
  const vehicleColor = (driver as any).vehicleColor || "Prata";
  const vehicleModel = driver.vehicleModel || "Carro Particular";
  const licensePlate = driver.licensePlate || "BRA-4X99";
  const distanceKm = typeof driver.distanceKm === "number" ? driver.distanceKm.toFixed(1) : "1.2";
  const etaMinutes = driver.etaMinutes || 3;
  const ratingFormatted = typeof driver.rating === "number" ? driver.rating.toFixed(2) : "4.97";
  const secondsRemaining = (driver as any).cascadeSecondsRemaining ?? 15;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full bg-gradient-to-br from-amber-500/10 via-amber-50/70 to-white border-2 border-amber-400/80 rounded-3xl p-3.5 shadow-xl shadow-amber-500/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
        isTransitioning ? "opacity-75 scale-[0.99]" : "opacity-100 scale-100"
      }`}
    >
      {/* 1. TOPO ESTILO 99: BADGE VIBRANTE + STATUS REALTIME */}
      <div className="flex items-center justify-between pb-2.5 border-b border-amber-200/60">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600" />
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs tracking-wider uppercase shadow-xs">
            99 Tempo Real
          </span>
          <span className="text-xs font-black text-amber-950 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-amber-800 stroke-[2.5]" />
            <span>Motorista visualizando</span>
          </span>
        </div>

        {totalViewingCount > 1 && (
          <span className="text-xs font-black text-amber-950 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
            {totalViewingCount} condutores analisando
          </span>
        )}
      </div>

      {/* 2. CORPO DO CARD: FOTO + DADOS DO MOTORISTA & VEÍCULO */}
      <div className="pt-2.5 flex items-start gap-3 text-left">
        {/* Avatar com radar visual */}
        <div className="relative shrink-0 mt-0.5">
          <img
            src={driver.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"}
            alt={firstName}
            className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
          />
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 shadow-sm border border-white">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        {/* Informações de Perfil */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-sm font-black text-slate-950 tracking-tight truncate">
              {fullName || firstName}
            </h4>

            {/* Avaliação */}
            <div className="flex items-center gap-1 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-lg shrink-0">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span className="text-xs font-black text-amber-950">{ratingFormatted}</span>
            </div>
          </div>

          {/* Veículo, Cor e Placa */}
          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold truncate">
            <Car className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="truncate">{vehicleModel} {vehicleColor}</span>
            <span className="text-slate-400">•</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-300 text-xs font-mono font-black text-slate-900 shrink-0">
              {licensePlate}
            </span>
          </div>

          {/* Distância e Tempo de Chegada */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
            <Navigation className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>A {distanceKm} km de você</span>
            <span className="text-slate-400">•</span>
            <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>~{etaMinutes} min até o embarque</span>
          </div>
        </div>
      </div>

      {/* 3. RODAPÉ DO CARD: FRASE EM TEMPO REAL NO PADRÃO 99 */}
      <div className="mt-3 pt-2 border-t border-amber-200/50 flex items-center justify-between gap-2">
        <p className="text-xs font-black text-amber-950 leading-tight flex-1">
          <span className="text-amber-800 font-extrabold">{firstName}</span> está vendo a sua solicitação em tempo real!
        </p>

        {secondsRemaining > 0 && (
          <div className="px-2 py-0.5 rounded-lg bg-amber-200 border border-amber-300 text-xs font-mono font-black text-amber-950 shrink-0">
            {secondsRemaining}s
          </div>
        )}
      </div>
    </div>
  );
});
