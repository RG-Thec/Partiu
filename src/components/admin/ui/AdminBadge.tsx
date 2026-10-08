import React from "react";
import { adminTokens } from "./tokens";

export type AdminBadgeVariant = "success" | "warning" | "critical" | "info" | "neutral" | "brand";

export interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: AdminBadgeVariant;
  appearance?: "subtle" | "solid" | "outline";
  dot?: boolean;
  pulse?: boolean;
  size?: "sm" | "default" | "lg";
  icon?: React.ReactNode;
  className?: string;
}

export function AdminBadge({
  children,
  variant = "neutral",
  appearance = "subtle",
  dot = false,
  pulse = false,
  size = "default",
  icon,
  className = "",
}: AdminBadgeProps) {
  const colorToken = adminTokens.colors[variant];

  const appearanceStyles = {
    subtle: `${colorToken.subtle} border`,
    solid: colorToken.solid,
    outline: `bg-transparent border ${colorToken.icon} ${colorToken.subtle.split(" ")[1]}`,
  }[appearance];

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] font-bold gap-1",
    default: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1.5 text-xs font-bold gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center font-medium ${adminTokens.radius.badge} ${appearanceStyles} ${sizeStyles} ${className}`}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorToken.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${colorToken.dot}`} />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="leading-none">{children}</span>
    </span>
  );
}
