import React, { useEffect } from "react";
import { X } from "lucide-react";
import { adminTokens } from "./tokens";

export interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export function AdminModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = "md",
  className = "",
}: AdminModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[size];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${sizeStyles} ${adminTokens.colors.cardBg} ${adminTokens.radius.modal} ${adminTokens.shadows.modal} ${adminTokens.colors.cardBorder} p-4 sm:p-6 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92dvh] flex flex-col ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 sm:mb-5 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {icon && (
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-admin-scrollbar">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
