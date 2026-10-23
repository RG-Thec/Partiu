import React from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { SpoofRiskLevel } from "@/lib/geo/mock-location-shield";

export interface MockLocationBannerProps {
  riskLevel: SpoofRiskLevel;
  reasons?: string[];
  onDismiss?: () => void;
}

export function MockLocationBanner({
  riskLevel,
  reasons = [],
}: MockLocationBannerProps) {
  if (riskLevel === "SAFE" || riskLevel === "LOW_RISK") {
    return null;
  }

  const isCritical = riskLevel === "CRITICAL_SPOOF";

  return (
    <div
      className={`mx-3 my-2 p-3 rounded-2xl border text-xs shadow-lg flex items-start gap-2.5 animate-in fade-in ${
        isCritical
          ? "bg-red-950/90 border-red-500 text-red-100"
          : "bg-amber-950/90 border-amber-500 text-amber-100"
      }`}
    >
      <ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
      <div className="min-w-0">
        <h5 className="font-bold text-[11px] leading-tight">
          {isCritical ? "Alerta de Localização Simulada (GPS Falso)" : "Instabilidade de Sinal de GPS"}
        </h5>
        <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
          {reasons[0] || "Desative aplicativos de simulação de coordenadas para manter o repasse liberado."}
        </p>
      </div>
    </div>
  );
}
