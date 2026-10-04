import React from "react";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

export interface WhiteLabelProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
  className?: string;
}

export function WhiteLabelProgressBar({
  currentStep,
  totalSteps,
  stepTitle,
  className = "",
}: WhiteLabelProgressBarProps) {
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  const percentage = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <div className={`w-full space-y-2 select-none ${className}`} style={{ fontFamily: ui.fontFamily }}>
      <div className="flex items-center justify-between text-xs font-bold">
        <span
          className="uppercase tracking-wider font-extrabold text-[11px]"
          style={{ color: colors.primary }}
        >
          Etapa {currentStep} de {totalSteps}
        </span>
        {stepTitle && (
          <span className="font-semibold" style={{ color: colors.textSecondary }}>
            {stepTitle}
          </span>
        )}
      </div>

      <div
        className="w-full h-1.5 sm:h-2 rounded-full overflow-hidden transition-all"
        style={{ backgroundColor: colors.inputBackground }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: colors.primary,
          }}
        />
      </div>
    </div>
  );
}
