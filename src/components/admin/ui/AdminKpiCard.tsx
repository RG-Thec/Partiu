import React from "react";
import { AdminCard } from "./AdminCard";
import { AdminBadge } from "./AdminBadge";
import { adminTokens } from "./tokens";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface AdminKpiTrend {
  value: string | number;
  positive?: boolean | null; // true: green up, false: red down, null: neutral
  label?: string;
}

export interface AdminKpiCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  iconColor?: "brand" | "success" | "warning" | "critical" | "info" | "neutral";
  trend?: AdminKpiTrend;
  badge?: React.ReactNode;
  subtext?: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AdminKpiCard({
  label,
  value,
  icon,
  iconColor = "brand",
  trend,
  badge,
  subtext,
  loading = false,
  onClick,
  className = "",
}: AdminKpiCardProps) {
  const iconBgMap = {
    brand: "bg-primary/10 text-primary",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    critical: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    info: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  }[iconColor];

  return (
    <AdminCard
      variant={onClick ? "interactive" : "default"}
      padding="default"
      onClick={onClick}
      className={`relative overflow-hidden flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={adminTokens.typography.kpiLabel}>{label}</span>
          <div className="flex items-center gap-1.5">
            {badge}
            {icon && (
              <div className={`p-2.5 rounded-xl shrink-0 ${iconBgMap}`}>
                {icon}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg my-1" />
        ) : (
          <div className={adminTokens.typography.kpiValue}>{value}</div>
        )}
      </div>

      {(trend || subtext) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {trend ? (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-0.5 font-bold ${
                  trend.positive === true
                    ? "text-emerald-600 dark:text-emerald-400"
                    : trend.positive === false
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {trend.positive === true && <TrendingUp className="h-3.5 w-3.5 stroke-[2.5]" />}
                {trend.positive === false && <TrendingDown className="h-3.5 w-3.5 stroke-[2.5]" />}
                {trend.positive === null && <Minus className="h-3.5 w-3.5 stroke-[2.5]" />}
                {trend.value}
              </span>
              {trend.label && (
                <span className="text-slate-400 dark:text-slate-500 font-medium">{trend.label}</span>
              )}
            </div>
          ) : (
            <div />
          )}

          {subtext && (
            <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">{subtext}</span>
          )}
        </div>
      )}
    </AdminCard>
  );
}
