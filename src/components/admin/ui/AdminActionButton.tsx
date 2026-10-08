import React from "react";
import { adminTokens } from "./tokens";
import { Loader2 } from "lucide-react";

export type AdminButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "success";

export type AdminButtonSize = "xs" | "sm" | "default" | "lg";

export interface AdminActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
}

export function AdminActionButton({
  children,
  variant = "primary",
  size = "default",
  loading = false,
  iconLeft,
  iconRight,
  disabled,
  className = "",
  ...props
}: AdminActionButtonProps) {
  const variantStyles = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-[0.98]",
    secondary:
      "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98]",
    outline:
      "bg-transparent border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.98]",
    ghost:
      "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
    destructive:
      "bg-rose-600 text-white hover:bg-rose-700 shadow-xs active:scale-[0.98]",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs active:scale-[0.98]",
  }[variant];

  const sizeStyles = {
    xs: "px-2.5 py-1 text-xs gap-1.5 h-7",
    sm: "px-3 py-1.5 text-xs font-semibold gap-2 h-8",
    default: "px-4 py-2 text-sm font-semibold gap-2.5 h-10",
    lg: "px-5 py-2.5 text-base font-bold gap-3 h-12",
  }[size];

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium ${adminTokens.radius.button} transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        iconLeft && <span className="shrink-0">{iconLeft}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
