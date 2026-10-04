import React, { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { NativeRipple } from "./NativeRipple";

export type NativeElevationLevel = 0 | 1 | 2 | 3;

export interface NativeSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  elevation?: NativeElevationLevel;
  interactive?: boolean;
  withBorder?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  rippleColor?: string;
}

/**
 * NativeSurface — Superfície Tonal Elevada (Material Design 3 Surface)
 *
 * Características:
 * - Fim da "Cardite": Substitui cards com bordas pesadas e sombras duras por elevações orgânicas e tonais.
 * - Integração White-Label 100%: Consome useTheme() para cor de superfície, fontes e raio de curvatura.
 * - Níveis de Elevação Tonal:
 *   - 0: Flat (flush com o fundo)
 *   - 1: Baixa elevação (agrupamentos de leitura limpos)
 *   - 2: Média elevação (itens clicáveis, seleção de categoria)
 *   - 3: Alta elevação (controles suspensos sobre mapa)
 * - Modo Interativo: Suporte a clique com animação tátil e ripple nativo integrado.
 */
export const NativeSurface = forwardRef<HTMLDivElement, NativeSurfaceProps>(
  (
    {
      children,
      elevation = 1,
      interactive = false,
      withBorder = false,
      padding = "md",
      className = "",
      style,
      onClick,
      rippleColor,
      ...props
    },
    ref
  ) => {
    const { appConfig } = useTheme();
    const { colors, ui } = appConfig.branding;

    // Espaçamento aderente ao grid de 8pt
    const paddingClasses = {
      none: "p-0",
      sm: "p-3",      // 12px
      md: "p-4",      // 16px
      lg: "p-6",      // 24px
    }[padding];

    // Elevações suaves orgânicas (Material Design 3 Diffuse Shadows)
    const elevationShadows = {
      0: "none",
      1: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
      2: "0 4px 12px 0 rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
      3: "0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -4px rgba(0, 0, 0, 0.04)",
    }[elevation];

    const dynamicStyle: React.CSSProperties = {
      backgroundColor: colors.surface,
      borderRadius: ui.borderRadius,
      fontFamily: ui.fontFamily,
      boxShadow: elevationShadows,
      border: withBorder ? `1px solid ${colors.inputBorder}` : "none",
      ...style,
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        style={dynamicStyle}
        className={`relative overflow-hidden transition-all duration-200 ${
          interactive
            ? "cursor-pointer select-none active:scale-[0.99] touch-manipulation"
            : ""
        } ${paddingClasses} ${className}`}
        {...props}
      >
        {interactive && (
          <NativeRipple
            color={rippleColor || `${colors.primary}15`}
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
          />
        )}
        {children}
      </div>
    );
  }
);

NativeSurface.displayName = "NativeSurface";
