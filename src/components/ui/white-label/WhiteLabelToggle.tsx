import React from "react";
import { Car, Radio } from "lucide-react";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";

export type RoleType = "PASSAGEIRO" | "MOTORISTA";

export interface WhiteLabelToggleProps {
  activeRole: RoleType;
  onChange: (role: RoleType) => void;
  className?: string;
}

export function WhiteLabelToggle({ activeRole, onChange, className = "" }: WhiteLabelToggleProps) {
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;

  return (
    <div
      style={{
        backgroundColor: colors.inputBackground,
        border: `1px solid ${colors.inputBorder}`,
        borderRadius: "14px",
        fontFamily: ui.fontFamily,
      }}
      className={`relative p-0.5 flex items-center justify-between transition-colors select-none ${className}`}
      role="tablist"
      aria-label="Selecionar perfil de acesso"
    >
      {/* Pílula Deslizante Ativa (Indicador animado e sutil) */}
      <div
        className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-[11px] transition-all duration-250 ease-out"
        style={{
          left: activeRole === "PASSAGEIRO" ? "2px" : "calc(50%)",
          backgroundColor: colors.surface,
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.04)",
        }}
      />

      {/* Botão Passageiro */}
      <button
        type="button"
        role="tab"
        aria-selected={activeRole === "PASSAGEIRO"}
        onClick={() => onChange("PASSAGEIRO")}
        className="relative z-10 flex-1 h-8 rounded-[11px] flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer"
        style={{
          color: activeRole === "PASSAGEIRO" ? colors.primary : colors.textSecondary,
        }}
      >
        <Car className="w-3.5 h-3.5 shrink-0 transition-transform duration-200" />
        <span>Passageiro</span>
      </button>

      {/* Botão Motorista */}
      <button
        type="button"
        role="tab"
        aria-selected={activeRole === "MOTORISTA"}
        onClick={() => onChange("MOTORISTA")}
        className="relative z-10 flex-1 h-8 rounded-[11px] flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer"
        style={{
          color: activeRole === "MOTORISTA" ? colors.primary : colors.textSecondary,
        }}
      >
        <Radio className="w-3.5 h-3.5 shrink-0 transition-transform duration-200" />
        <span>Motorista</span>
      </button>
    </div>
  );
}
