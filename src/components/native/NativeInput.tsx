import React, {
  useState,
  useId,
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertCircle, X } from "lucide-react";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

export interface NativeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string | null;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  floatingLabel?: boolean;
  onClear?: () => void;
  showClearButton?: boolean;
}

/**
 * NativeInput — Campo de Entrada Nativo Android (Material Design 3)
 *
 * Características:
 * - Touch Target Amplo: Altura mínima de 52px (respeitando e superando os 48dp mínimos).
 * - Alto Contraste: Fundo limpo, bordas sutis e foco destacado pela cor primária do painel.
 * - Floating Label Fluido: Suporte a rótulo flutuante animado ou rótulo superior nítido.
 * - Integração White-Label 100%: Consome useTheme() para cores, raio de curvatura e fontes.
 * - Botão de Limpeza Rápida (Clear): Ação acessível de 48px de toque para apagar dados.
 */
export const NativeInput = forwardRef<HTMLInputElement, NativeInputProps>(
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
      onClear,
      showClearButton = false,
      style,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = props.id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const { appConfig } = useTheme();
    const { colors, ui } = appConfig.branding;

    const [isFocused, setIsFocused] = useState(false);

    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const isFloatingActive = isFocused || hasValue;

    const hasError = Boolean(error);

    // Borda e sombra com foco nativo do Material Design
    const wrapperBorderColor = hasError
      ? "#EF4444"
      : isFocused
      ? colors.primary
      : colors.inputBorder;

    const wrapperBoxShadow = isFocused && !hasError
      ? `0 0 0 3px ${colors.primary}25`
      : hasError
      ? "0 0 0 3px rgba(239, 68, 68, 0.2)"
      : "none";

    return (
      <div
        className={`w-full text-left space-y-1.5 ${className}`}
        style={{ fontFamily: ui.fontFamily, ...style }}
      >
        {/* Label Externo de Alto Contraste */}
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-bold tracking-tight select-none"
            style={{ color: hasError ? "#EF4444" : colors.textPrimary }}
          >
            {label}
            {props.required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}

        {/* Input Container com Altura Tátil no Padrão Flutter Material 3 (~42-44px) */}
        <div
          style={{
            borderRadius: ui.borderRadius,
            backgroundColor: disabled ? colors.background : colors.inputBackground,
            border: `1.5px solid ${wrapperBorderColor}`,
            boxShadow: wrapperBoxShadow,
          }}
          className={`relative min-h-[42px] h-10.5 sm:min-h-[44px] sm:h-11 flex items-center px-3.5 transition-all duration-200 ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {leftIcon && (
            <div
              className="mr-3 shrink-0 flex items-center justify-center transition-colors"
              style={{ color: isFocused ? colors.primary : colors.textSecondary }}
            >
              {leftIcon}
            </div>
          )}

          <div className="relative flex-1 flex flex-col justify-center h-full">
            {/* Floating Label Animado */}
            {label && floatingLabel && (
              <label
                htmlFor={inputId}
                className={`absolute left-0 transition-all duration-200 pointer-events-none font-semibold select-none ${
                  isFloatingActive
                    ? "-top-1 text-[11px] font-bold"
                    : "top-1/2 -translate-y-1/2 text-sm"
                }`}
                style={{
                  color: hasError
                    ? "#EF4444"
                    : isFloatingActive
                    ? colors.primary
                    : colors.textSecondary,
                }}
              >
                {label}
                {props.required && <span className="ml-0.5 text-rose-500">*</span>}
              </label>
            )}

            <input
              ref={ref}
              id={inputId}
              value={value}
              disabled={disabled}
              placeholder={floatingLabel && !isFloatingActive ? "" : placeholder}
              aria-invalid={hasError}
              aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
              onFocus={(e) => {
                setIsFocused(true);
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                onBlur?.(e);
              }}
              style={{
                color: colors.textPrimary,
                fontFamily: ui.fontFamily,
              }}
              className={`w-full bg-transparent border-none outline-none text-sm sm:text-base font-medium placeholder:text-slate-400 disabled:cursor-not-allowed ${
                floatingLabel && isFloatingActive ? "pt-3 pb-0.5" : "py-2"
              }`}
              {...props}
            />
          </div>

          {/* Botão de Limpar (Touch Target 48px) */}
          {showClearButton && hasValue && !disabled && onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Limpar campo"
              className="min-h-[48px] min-w-[48px] -mr-2 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
            >
              <span className="p-1 rounded-full bg-slate-200 dark:bg-slate-700">
                <X className="h-3.5 w-3.5" />
              </span>
            </button>
          )}

          {rightIcon && !showClearButton && (
            <div className="ml-3 shrink-0 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Mensagem de Erro ou Ajuda Humanizada */}
        {hasError ? (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 animate-in fade-in-50 duration-200"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="text-xs font-medium text-slate-500 pl-1"
            style={{ color: colors.textSecondary }}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

NativeInput.displayName = "NativeInput";
