import React, { useCallback, memo } from "react";
import { Clock, ShieldCheck, Sparkles, User, Briefcase } from "lucide-react";
import type { PassengerVehicleCategory } from "@/lib/passenger/passenger-ride-machine";
import { VehiclePerspectiveGraphic } from "../VehiclePerspectiveGraphic";

export interface VehicleOptionCardProps {
  isSelected: boolean;
  category: PassengerVehicleCategory;
  title: string;
  description?: string;
  badgeText?: string;
  badgeClass?: string;
  etaMinutes: number;
  capacityText: string;
  luggageText?: string;
  price: string;
  originalPrice?: string;
  vehicleGraphicCategory: "POP" | "MOTO" | "PLUS";
  onSelect: (cat: PassengerVehicleCategory) => void;
  corPrimaria?: string;
  corSecundaria?: string;
}

/** Item de Categoria Compacto Horizontal no Padrão Uber Zero-Scroll (~48-52px) */
export const VehicleOptionCard = memo(function VehicleOptionCard({
  isSelected,
  category,
  title,
  badgeText,
  badgeClass,
  etaMinutes,
  capacityText,
  luggageText,
  price,
  originalPrice,
  vehicleGraphicCategory,
  onSelect,
  corPrimaria,
}: VehicleOptionCardProps) {
  const handleClick = useCallback(() => {
    onSelect(category);
  }, [onSelect, category]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
      style={
        isSelected && corPrimaria
          ? {
              borderColor: corPrimaria,
              backgroundColor: `${corPrimaria}12`,
            }
          : undefined
      }
      className={`relative w-full flex flex-row items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-150 cursor-pointer touch-manipulation text-left select-none ${
        isSelected
          ? "border-2 shadow-sm font-bold bg-slate-50"
          : "border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300"
      }`}
    >
      {/* Lado Esquerdo: Render 3D do Veículo com Proporção Otimizada */}
      <div className="flex flex-row items-center gap-2.5 min-w-0">
        <div className="w-12 h-10 sm:w-14 sm:h-11 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center p-1 shrink-0 overflow-hidden">
          <VehiclePerspectiveGraphic
            category={vehicleGraphicCategory}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Informações Centrais: Nome, ETA e Capacidade */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight leading-tight">
              {title}
            </span>
            {badgeText && (
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md leading-tight ${
                  badgeClass || "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {badgeText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-0.5 font-medium">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-slate-500 stroke-[2.2]" />
              <span>{etaMinutes} min</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-0.5">
              <User className="w-3 h-3 text-slate-500 stroke-[2.2]" />
              <span>{capacityText}</span>
            </span>
            {luggageText && (
              <>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="hidden sm:flex items-center gap-0.5">
                  <Briefcase className="w-3 h-3 text-slate-500 stroke-[2.2]" />
                  <span>{luggageText}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lado Direito: Preço Final em Destaque e Original Riscado */}
      <div className="flex flex-col items-end justify-center shrink-0 pl-2">
        <span
          style={isSelected && corPrimaria ? { color: corPrimaria } : undefined}
          className={`font-black text-sm sm:text-base tracking-tight leading-none ${
            isSelected ? "text-brand-primary-vibrant" : "text-slate-900"
          }`}
        >
          {price}
        </span>
        {originalPrice && (
          <span className="text-[10.5px] text-slate-400 line-through font-semibold mt-0.5">
            {originalPrice}
          </span>
        )}
      </div>
    </div>
  );
});
