import React from "react";
import { Car, Bike, Star, ChevronUp } from "lucide-react";
import { usePassengerRide } from "@/contexts/PassengerRideContext";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

export interface FloatingRidePillProps {
  onExpand?: () => void;
  className?: string;
}

export function FloatingRidePill({ onExpand, className = "" }: FloatingRidePillProps) {
  const {
    activeRide,
    state,
    categoriaVeiculo,
  } = usePassengerRide();
  const { corPrimaria } = useBrandTheme();

  // Determina status ativo da corrida a partir da state machine canônica
  const isSearching =
    state === "FINDING_DRIVER" ||
    state === "REQUESTED" ||
    state === "SEARCHING_R1" ||
    state === "SEARCHING_R2" ||
    state === "SEARCHING_R3";

  const isDriverAssigned =
    state === "DRIVER_ASSIGNED" ||
    state === "ACCEPTED" ||
    state === "DRIVER_ARRIVING" ||
    state === "DRIVER_EN_ROUTE";

  const isDriverArrived = state === "DRIVER_ARRIVED";

  const isOnTrip = state === "ON_TRIP" || state === "IN_PROGRESS";

  const isCorridaAtiva = isSearching || isDriverAssigned || isDriverArrived || isOnTrip;

  if (!isCorridaAtiva) {
    return null;
  }

  const isMoto = categoriaVeiculo === "MOTO";
  const driver = activeRide?.motorista;
  const driverName = driver?.nome || "Motorista Parceiro";
  const vehicleInfo = driver?.veiculo
    ? `${driver.veiculo}${driver.placa ? ` • ${driver.placa}` : ""}`
    : isMoto
    ? "Partiu Moto"
    : "Partiu Pop";
  const driverRating = driver?.avaliacao ?? 4.95;

  let statusLabel = "Buscando motorista...";
  let statusBadgeClass = "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";

  if (isDriverAssigned) {
    statusLabel = "A caminho do embarque (~3 min)";
    statusBadgeClass = "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
  } else if (isDriverArrived) {
    statusLabel = "Chegou ao local de embarque!";
    statusBadgeClass = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 animate-pulse";
  } else if (isOnTrip) {
    statusLabel = "Em viagem até o destino";
    statusBadgeClass = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  }

  const handleClick = () => {
    hapticFeedback.medium();
    if (onExpand) {
      onExpand();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className={`fixed top-[max(0.75rem,calc(env(safe-area-inset-top,0px)+10px))] inset-x-3 max-w-sm mx-auto z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 cursor-pointer active:scale-[0.98] transition-all select-none animate-in slide-in-from-top duration-300 pointer-events-auto ${className}`}
      aria-label="Status da corrida ativa. Toque para ver detalhes completos."
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Avatar ou Ícone do Veículo */}
        <div
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden"
          style={corPrimaria ? { borderColor: `${corPrimaria}40` } : undefined}
        >
          {driver?.foto ? (
            <img
              src={driver.foto}
              alt={driverName}
              className="w-full h-full object-cover"
            />
          ) : isMoto ? (
            <Bike className="w-5 h-5 text-emerald-600" />
          ) : (
            <Car className="w-5 h-5 text-blue-600" />
          )}
        </div>

        {/* Informações da Corrida */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
              {isSearching ? "Procurando no Trip Radar" : driverName}
            </span>
            {!isSearching && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-500" />
                <span>{driverRating.toFixed(1)}</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate">
            {vehicleInfo}
          </p>

          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md border leading-tight truncate ${statusBadgeClass}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Ícone de expansão */}
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
        <ChevronUp className="w-4 h-4 stroke-[2.5]" />
      </div>
    </div>
  );
}

export default FloatingRidePill;
