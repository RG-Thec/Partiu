import React, { memo } from "react";
import { Compass, Home, X } from "lucide-react";
import {
  driverDestinationModeService,
  type DriverDestination,
} from "@/services/DriverDestinationModeService";

interface DestinationQuickChipProps {
  driverId: string;
  activeDestination: DriverDestination | null;
  onOpenModal: () => void;
  onClearDestination: () => void;
  accentColor?: string;
}

export const DestinationQuickChip: React.FC<DestinationQuickChipProps> = memo(
  ({ driverId, activeDestination, onOpenModal, onClearDestination, accentColor = "#0088FF" }) => {
    const remainingUses = driverDestinationModeService.getRemainingUses(driverId);
    const favoriteHome = driverDestinationModeService.getFavoriteHome(driverId);

    if (activeDestination) {
      return (
        <div className="flex items-center gap-1.5 bg-sky-950/90 border border-sky-500/40 text-sky-200 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md text-xs font-semibold animate-in fade-in duration-200">
          <Home className="w-3.5 h-3.5 text-sky-400 stroke-[2.5]" />
          <span className="truncate max-w-[130px] sm:max-w-[180px]">
            {activeDestination.address.split(",")[0]}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearDestination();
            }}
            className="p-1 -mr-1 rounded-full text-sky-400 hover:text-sky-100 hover:bg-sky-800/60 transition-colors"
            title="Desativar modo destino"
            aria-label="Desativar modo destino"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={onOpenModal}
        className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-full shadow-md backdrop-blur-md text-xs font-medium hover:border-slate-500 active:scale-95 transition-all"
        title="Definir destino ou rota para casa"
      >
        <Compass className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
        <span>Indo para Casa</span>
        <span className="bg-slate-800 text-[10px] text-slate-400 px-1.5 py-0.2 rounded font-mono font-bold">
          {remainingUses}/2
        </span>
      </button>
    );
  },
);

DestinationQuickChip.displayName = "DestinationQuickChip";
