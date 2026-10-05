import React, { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";

export interface WhiteLabelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const WhiteLabelButton = React.forwardRef<HTMLButtonElement, WhiteLabelButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = "",
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const { appConfig } = useTheme();
    const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
    const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
    const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;

    const [isHovered, setIsHovered] = React.useState(false);

    // Altura ergonômica estilo Flutter Material 3 (40dp padrão)
    const sizeClasses = {
      sm: "h-8.5 min-h-[34px] px-3 text-[11px] font-semibold tracking-tight",
      md: "h-10 min-h-[40px] px-4 text-xs sm:text-[13px] font-semibold tracking-tight",
      lg: "h-11 min-h-[44px] px-4.5 text-xs sm:text-sm font-bold tracking-tight",
    }[size];

    // Estilos dinâmicos sem nenhuma cor ou raio de borda hardcoded
    const dynamicStyle: React.CSSProperties = {
      borderRadius: ui.borderRadius,
      fontFamily: ui.fontFamily,
      ...style,
    };

    if (variant === "primary") {
      dynamicStyle.backgroundColor = isHovered && !disabled ? colors.primaryHover : colors.primary;
      dynamicStyle.color = "#FFFFFF";
      dynamicStyle.boxShadow = disabled ? "none" : ui.buttonShadow;
    } else if (variant === "secondary") {
      dynamicStyle.backgroundColor = colors.secondary;
      dynamicStyle.color = "#FFFFFF";
    } else if (variant === "outline") {
      dynamicStyle.backgroundColor = isHovered && !disabled ? colors.inputBackground : "transparent";
      dynamicStyle.border = `1.5px solid ${colors.inputBorder}`;
      dynamicStyle.color = colors.textPrimary;
    } else if (variant === "ghost") {
      dynamicStyle.backgroundColor = isHovered && !disabled ? colors.inputBackground : "transparent";
      dynamicStyle.color = colors.textPrimary;
    } else if (variant === "link") {
      dynamicStyle.backgroundColor = "transparent";
      dynamicStyle.color = isHovered && !disabled ? colors.primaryHover : colors.primary;
      dynamicStyle.padding = 0;
      dynamicStyle.minHeight = "auto";
      dynamicStyle.height = "auto";
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={dynamicStyle}
        className={`inline-flex items-center justify-center gap-2.5 transition-all duration-200 select-none cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
          fullWidth ? "w-full" : ""
        } ${sizeClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

WhiteLabelButton.displayName = "WhiteLabelButton";
