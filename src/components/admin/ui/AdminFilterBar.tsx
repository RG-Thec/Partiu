import React from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { adminTokens } from "./tokens";

export interface AdminFilterBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  totalResults?: number;
  totalLabel?: string;
  children?: React.ReactNode;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function AdminFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  totalResults,
  totalLabel = "registros",
  children,
  onResetFilters,
  hasActiveFilters = false,
  className = "",
}: AdminFilterBarProps) {
  return (
    <div
      className={`p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border ${adminTokens.colors.cardBorder} flex flex-col md:flex-row md:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-3 flex-1 flex-wrap">
        {onSearchChange !== undefined && (
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border ${adminTokens.colors.cardBorder} text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {children}

        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>

      {totalResults !== undefined && (
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 self-end md:self-center">
          <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            {totalResults}
          </span>{" "}
          {totalLabel}
        </div>
      )}
    </div>
  );
}
