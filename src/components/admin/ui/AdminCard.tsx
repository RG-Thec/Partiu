import React from "react";
import { adminTokens } from "./tokens";

export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "flat" | "bordered" | "interactive";
  padding?: "none" | "sm" | "default" | "lg";
  className?: string;
}

export function AdminCard({
  children,
  variant = "default",
  padding = "default",
  className = "",
  ...props
}: AdminCardProps) {
  const variantStyles = {
    default: `${adminTokens.colors.cardBg} ${adminTokens.colors.cardBorder} ${adminTokens.shadows.card}`,
    elevated: `${adminTokens.colors.cardBg} ${adminTokens.colors.cardBorder} ${adminTokens.shadows.elevated}`,
    flat: `${adminTokens.colors.mutedBg} border border-transparent`,
    bordered: `${adminTokens.colors.cardBg} border-2 ${adminTokens.colors.cardBorder}`,
    interactive: `${adminTokens.colors.cardBg} ${adminTokens.colors.cardBorder} ${adminTokens.shadows.card} ${adminTokens.shadows.cardHover} ${adminTokens.colors.cardBorderHover} cursor-pointer active:scale-[0.99] transition-all`,
  }[variant];

  const paddingStyles = {
    none: "p-0",
    sm: "p-3 sm:p-4",
    default: "p-4 sm:p-5 lg:p-6",
    lg: "p-6 sm:p-8",
  }[padding];

  return (
    <div
      className={`${adminTokens.radius.card} ${variantStyles} ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({
  title,
  subtitle,
  action,
  icon,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className={adminTokens.typography.cardTitle}>{title}</h3>
          {subtitle && <p className={adminTokens.typography.cardSubtitle}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function AdminCardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mt-4 pt-4 border-t ${adminTokens.colors.cardBorder} flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 ${className}`}
    >
      {children}
    </div>
  );
}
