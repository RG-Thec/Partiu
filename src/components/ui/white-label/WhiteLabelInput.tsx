import React, { useState, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";

export interface WhiteLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string | null;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  floatingLabel?: boolean;
}

export const WhiteLabelInput = React.forwardRef<HTMLInputElement, WhiteLabelInputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      floatingLabel = false,
      value,
      placeholder,
      className = "",
      disabled,
      onFocus,
      onBlur,
      style,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const inputId = props.id || id;
    const { appConfig } = useTheme();
    const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
    const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
    const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;

    const [isFocused, setIsFocused] = useState(false);

    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const isFloatingActive = isFocused || hasValue;

    // Estilo dinâmico consumindo o WhiteLabelThemeContext
    const containerStyle: React.CSSProperties = {
      fontFamily: ui.fontFamily,
    };

    const inputWrapperStyle: React.CSSProperties = {
      borderRadius: ui.borderRadius,
      backgroundColor: colors.inputBackground,
      border: `1.5px solid ${error ? "#EF4444" : isFocused ? colors.primary : colors.inputBorder}`,
      boxShadow: isFocused ? `0 0 0 3px ${colors.primary}25` : "none",
      transition: "all 0.2s ease-in-out",
    };

    const inputTextStyle: React.CSSProperties = {
      color: colors.textPrimary,
      fontFamily: ui.fontFamily,
    };

    return (
      <div className={`w-full text-left space-y-1.5 ${className}`} style={containerStyle}>
        {/* Label Externo Claro (se não for floating) */}
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-bold tracking-tight select-none"
            style={{ color: error ? "#EF4444" : colors.textPrimary }}
          >
            {label}
            {props.required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}

        {/* Input Wrapper com Touch Height >= 48px */}
        <div
          style={inputWrapperStyle}
          className={`relative min-h-[50px] sm:min-h-[52px] h-13 flex items-center px-4 transition-all ${
            disabled ? "opacity-60 cursor-not-allowed bg-slate-100" : ""
          }`}
        >
          {leftIcon && (
            <div className="mr-3 shrink-0 flex items-center text-slate-500">
              {leftIcon}
            </div>
          )}

          <div className="relative flex-1 flex flex-col justify-center h-full">
            {/* Floating Label (se ativado) */}
            {label && floatingLabel && (
              <label
                htmlFor={inputId}
                className={`absolute left-0 transition-all duration-200 pointer-events-none font-semibold ${
                  isFloatingActive
                    ? "-top-1 text-[11px] font-bold"
                    : "top-1/2 -translate-y-1/2 text-sm"
                }`}
                style={{
                  color: error
                    ? "#EF4444"
                    : isFocused
                    ? colors.primary
                    : colors.textSecondary,
                }}
              >
                {label}
                {props.required && <span className="ml-0.5 text-rose-500">*</span>}
              </label>
            )}

            <input
              id={inputId}
              ref={ref}
              value={value}
              disabled={disabled}
              placeholder={floatingLabel && !isFloatingActive ? "" : placeholder}
              onFocus={(e) => {
                setIsFocused(true);
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                onBlur?.(e);
              }}
              style={inputTextStyle}
              className={`w-full bg-transparent outline-none text-sm sm:text-base font-semibold placeholder:text-slate-400 placeholder:font-normal ${
                floatingLabel && isFloatingActive ? "pt-3.5" : ""
              }`}
              {...props}
            />
          </div>

          {rightIcon && (
            <div className="ml-2.5 shrink-0 flex items-center text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Mensagens de Erro ou Ajuda com Alto Contraste */}
        {error ? (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold pt-0.5 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p
            className="text-xs font-normal leading-relaxed pt-0.5"
            style={{ color: colors.textSecondary }}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

WhiteLabelInput.displayName = "WhiteLabelInput";
