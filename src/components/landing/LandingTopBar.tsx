import React from "react";
import { Wifi, Battery } from "lucide-react";
import type { ThemeConfig } from "@/types/mobilityLanding";

interface LandingTopBarProps {
  theme: ThemeConfig;
  time?: string;
}

export const LandingTopBar: React.FC<LandingTopBarProps> = ({
  theme,
  time = "9:41",
}) => {
  return (
    <div
      className="w-full flex items-center justify-between px-6 pt-3 pb-1 select-none text-xs font-semibold tracking-tight transition-colors z-30"
      style={{ color: theme.textColorLight }}
    >
      {/* Horário do Sistema (iOS status bar) */}
      <span className="font-semibold text-sm pl-1">{time}</span>

      {/* Ícones de Status: Sinal Celular, Wi-Fi e Bateria */}
      <div className="flex items-center gap-2 pr-1">
        {/* Barras de Sinal de Rede Celular */}
        <div className="flex items-end gap-[2px] h-3">
          <div className="w-[3px] h-[4px] rounded-xs bg-current" />
          <div className="w-[3px] h-[6px] rounded-xs bg-current" />
          <div className="w-[3px] h-[8px] rounded-xs bg-current" />
          <div className="w-[3px] h-[10px] rounded-xs bg-current" />
        </div>

        {/* Ícone de Wi-Fi */}
        <Wifi className="w-3.5 h-3.5 stroke-[2.4]" />

        {/* Ícone de Bateria Estilizado com Preenchimento */}
        <div className="relative flex items-center">
          <Battery className="w-5 h-5 stroke-[2]" />
          <div
            className="absolute left-[3px] top-[6.5px] w-[9px] h-[7px] rounded-xs bg-current"
          />
        </div>
      </div>
    </div>
  );
};
