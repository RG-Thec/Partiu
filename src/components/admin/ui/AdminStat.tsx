import React from "react";
import { adminTokens } from "./tokens";

export interface AdminStatProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  className?: string;
}

export function AdminStat({
  label,
  value,
  icon,
  trend,
  trendPositive,
  className = "",
}: AdminStatProps) {
  return (
    <div
      className={`p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border ${adminTokens.colors.cardBorder} flex items-center justify-between gap-3 ${className}`}
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-lg font-black text-slate-900 dark:text-slate-100 tabular-nums">
            {value}
          </p>
          {trend && (
            <span
              className={`text-[10px] font-bold ${
                trendPositive === true
                  ? "text-emerald-600 dark:text-emerald-400"
                  : trendPositive === false
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
      {icon && (
        <div className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
}
