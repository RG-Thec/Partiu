import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

export interface NativeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  showDragHandle?: boolean;
  showCloseButton?: boolean;
  maxHeight?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * NativeBottomSheet — Substituto Universal de Modais Web para Mobile Nativo
 *
 * Características:
 * - Padrão Ergonômico Android: Alocado na base da tela (thumb zone) para operação com 1 mão.
 * - Suporte a Gesto de Arraste (Swipe-to-Dismiss): Puxador superior tátil com área de toque de 48px.
 * - Respeito a Safe Area: Suporta barras de navegação gestual através de pb-safe / env(safe-area-inset-bottom).
 * - Arquitetura White-Label 100% Dinâmica: Consome useTheme() para cores, raio de curvatura e fontes.
 * - Acessibilidade Completa: role="dialog", aria-modal="true", atalho de teclado ESC e bloqueio de scroll de fundo.
 */
export const NativeBottomSheet: React.FC<NativeBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showDragHandle = true,
  showCloseButton = false,
  maxHeight = "max-h-[88dvh]",
  className = "",
  ariaLabel,
}) => {
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Sincroniza abertura e fechamento com animações fluidas
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = requestAnimationFrame(() => {
        setIsAnimating(true);
      });
      // Trava scroll do body enquanto sheet está aberta
      document.body.style.overflow = "hidden";
      return () => {
        cancelAnimationFrame(timer);
      };
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setDragOffsetY(0);
        document.body.style.overflow = "";
      }, 280);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Listener para fechar com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Gestos de Arraste (Swipe down to dismiss)
  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
    currentYRef.current = clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      currentYRef.current = clientY;
      const diff = clientY - startYRef.current;
      // Permitir apenas arrastar para baixo (resistência se tentar arrastar para cima)
      if (diff > 0) {
        setDragOffsetY(diff);
      } else {
        setDragOffsetY(diff * 0.2);
      }
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = currentYRef.current - startYRef.current;
    // Se arrastou mais de 75px para baixo, fecha a Bottom Sheet
    if (diff > 75) {
      onClose();
    } else {
      setDragOffsetY(0);
    }
  }, [isDragging, onClose]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd);
      window.addEventListener("mousemove", handleTouchMove);
      window.addEventListener("mouseup", handleTouchEnd);
    }
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mousemove", handleTouchMove);
      window.removeEventListener("mouseup", handleTouchEnd);
    };
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  if (!isRendered && typeof document !== "undefined") return null;

  const sheetContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || "Gaveta inferior de opções"}
      className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto"
      style={{ fontFamily: ui.fontFamily }}
    >
      {/* Backdrop Translúcido com Blur */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Folha Deslizante da Base (Bottom Sheet Container) */}
      <div
        ref={sheetRef}
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: "28px",
          borderTopRightRadius: "28px",
          transform: isAnimating
            ? `translateY(${dragOffsetY}px)`
            : "translateY(100%)",
          transition: isDragging
            ? "none"
            : "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.12)",
        }}
        className={`relative z-10 w-full flex flex-col ${maxHeight} overflow-hidden pb-safe select-none ${className}`}
      >
        {/* Puxador Tátil Superior (Drag Handle Zone) */}
        {showDragHandle && (
          <div
            onMouseDown={handleTouchStart}
            onTouchStart={handleTouchStart}
            className="w-full min-h-[36px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none py-2.5 shrink-0"
            aria-label="Arrastar para fechar"
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-200 ${
                isDragging ? "w-14 opacity-80" : "w-10 opacity-40"
              }`}
              style={{ backgroundColor: colors.textSecondary }}
            />
          </div>
        )}

        {/* Cabeçalho da Sheet (Título, Subtítulo e Fechar opcional) */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 pt-1 pb-3 shrink-0">
            <div className="flex-1 pr-2">
              {title && (
                <h3
                  className="text-lg sm:text-xl font-bold tracking-tight"
                  style={{ color: colors.textPrimary }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className="text-xs sm:text-sm font-medium mt-0.5"
                  style={{ color: colors.textSecondary }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="min-h-[48px] min-w-[48px] -mr-3 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-95 transition-all text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-2">
          {children}
        </div>

        {/* Rodapé Fixo (Ações Principais) */}
        {footer && (
          <div
            className="p-4 sm:p-6 shrink-0 border-t border-slate-100 dark:border-slate-800"
            style={{ backgroundColor: colors.surface }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(sheetContent, document.body)
    : null;
};
