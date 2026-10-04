import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { components, shadows } from "@/lib/design-tokens";

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "gradient" | "solid" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * PrimaryButton — Botão CTA Oficial "Azul Tech Premium"
 *
 * Padronizado para todos os fluxos críticos da aplicação:
 * - Confirmar Corrida / Solicitar Embarque
 * - Pedir Carro / Pedir Moto
 * - Fazer Pix / Recarregar Carteira
 * - Aceitar Corrida / Iniciar Viagem / Finalizar Corrida
 *
 * Estados:
 * - Normal: LinearGradient Tema Dinâmico, texto branco, shadow elevation premium
 * - Pressed: Escala 0.98, leve redução de brilho
 * - Loading: Spinner estilizado com opacidade preservada
 * - Disabled: Opacidade 50%, sem eventos de clique, sem sombra
 */
export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
      children,
      isLoading = false,
      leftIcon,
      rightIcon,
      variant = "gradient",
      size = "md",
      className,
      disabled,
      style,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    // Tamanhos padronizados estilo Flutter Material 3 (40dp base)
    const sizeClasses = {
      sm: "min-h-[34px] h-8.5 px-3 py-1 text-[11px] font-semibold",
      md: "min-h-[40px] h-10 px-4 py-2 text-xs sm:text-[13px] font-semibold",
      lg: "min-h-[44px] h-11 px-4.5 py-2.5 text-xs sm:text-sm font-bold",
      xl: "min-h-[48px] h-12 px-5 py-3 text-sm font-bold",
    }[size];

    // Estilos de variante
    const variantStyles: React.CSSProperties =
      variant === "gradient"
        ? {
            background: isDisabled
              ? "linear-gradient(135deg, #64748b 0%, #334155 100%)"
              : "linear-gradient(135deg, var(--color-primary, #FF6B00) 0%, var(--color-secondary, #FFB800) 100%)",
            color: "#FFFFFF",
            boxShadow: isDisabled
              ? "none"
              : "var(--wl-button-shadow, var(--button-shadow, 0 4px 14px 0 rgba(0, 0, 0, 0.15)))",
          }
        : variant === "solid"
        ? {
            backgroundColor: "var(--color-primary, #FF6B00)",
            color: "#FFFFFF",
            boxShadow: isDisabled ? "none" : "var(--wl-button-shadow, var(--button-shadow, 0 4px 14px 0 rgba(0, 0, 0, 0.15)))",
          }
        : {
            backgroundColor: "transparent",
            border: "1.5px solid var(--color-primary, #FF6B00)",
            color: "var(--color-primary, #FF6B00)",
          };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        style={{
          borderRadius: "var(--wl-border-radius, var(--radius, 16px))",
          fontWeight: 700,
          ...variantStyles,
          ...style,
        }}
        className={cn(
          "w-full inline-flex items-center justify-center gap-2.5 select-none transition-all duration-200 tracking-tight",
          "active:scale-[0.98] active:brightness-95 touch-manipulation cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary,#FF6B00)] focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          sizeClasses,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-white shrink-0" />
            <span className="opacity-95">{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span className="truncate">{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

PrimaryButton.displayName = "PrimaryButton";

export default PrimaryButton;
