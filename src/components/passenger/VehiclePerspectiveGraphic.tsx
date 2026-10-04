import React, { memo } from "react";

export interface VehiclePerspectiveGraphicProps {
  category: "MOTO" | "CARRO" | "POP" | "PLUS" | "EXECUTIVO" | string;
  className?: string | undefined;
}

/**
 * 🚗 VEHICLE PERSPECTIVE GRAPHIC — ILUSTRAÇÃO 3D REALISTA DOS VEÍCULOS OFICIAIS
 * ==============================================================================
 * Renderizações 3D em alta fidelidade com fundo 100% transparente:
 * 1. MOTO: Moto esportiva urbana de passageiro em cinza ardósia, branco e laranja
 * 2. CARRO / POP: Sedã elétrico moderno com frisos em neon âmbar
 * 3. PLUS / EXECUTIVO: Sedã premium executivo
 * ==============================================================================
 */
export const VehiclePerspectiveGraphic = memo(function VehiclePerspectiveGraphic({
  category,
  className = "w-20 h-16",
}: VehiclePerspectiveGraphicProps) {
  const cat = category.toUpperCase();

  // 1. ILUSTRAÇÃO 3D DA MOTO TRANSPARENTE OFICIAL
  if (cat === "MOTO") {
    return (
      <img
        src="/assets/moto-transparent.png"
        alt="Partiu Moto"
        className={`object-contain select-none drop-shadow-md ${className}`}
        loading="lazy"
      />
    );
  }

  // 2. ILUSTRAÇÃO 3D DO CARRO EXECUTIVO / PLUS
  if (cat === "PLUS" || cat === "EXECUTIVO") {
    return (
      <img
        src="/assets/car-transparent.png"
        alt="Partiu Plus Executivo"
        className={`object-contain select-none drop-shadow-md brightness-95 contrast-105 ${className}`}
        loading="lazy"
      />
    );
  }

  // 3. ILUSTRAÇÃO 3D DO CARRO TRANSPARENTE OFICIAL (POP / PADRÃO)
  return (
    <img
      src="/assets/car-transparent.png"
      alt="Partiu Carro"
      className={`object-contain select-none drop-shadow-md ${className}`}
      loading="lazy"
    />
  );
});

export default VehiclePerspectiveGraphic;
