import React from "react";
import { adminTokens } from "./tokens";
import { AdminEmptyState } from "./AdminEmptyState";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export interface AdminColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  sticky?: "left" | "right";
}

export interface AdminDataTableProps<T> {
  columns: AdminColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
  };
  onRowClick?: (row: T) => void;
  className?: string;
}

export function AdminDataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription = "Não há dados cadastrados ou os filtros aplicados não retornaram resultados.",
  emptyAction,
  pagination,
  onRowClick,
  className = "",
}: AdminDataTableProps<T>) {
  if (loading && data.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Carregando registros...
        </p>
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <AdminEmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  const alignStyles = {
    left: "text-left justify-start",
    center: "text-center justify-center",
    right: "text-right justify-end",
  };

  return (
    <div
      className={`rounded-2xl border ${adminTokens.colors.cardBorder} bg-white dark:bg-slate-900 overflow-hidden shadow-xs ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {columns.map((col) => {
                const isStickyRight = col.sticky === "right" || col.key === "acoes";
                const isStickyLeft = col.sticky === "left";
                const stickyThClass = isStickyRight
                  ? "sticky right-0 z-20 bg-slate-50 dark:bg-slate-800 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.08)] dark:shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.35)]"
                  : isStickyLeft
                  ? "sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 shadow-[6px_0_10px_-4px_rgba(0,0,0,0.08)]"
                  : "";

                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={`py-3 px-4 font-bold ${alignStyles[col.align || "left"]} ${stickyThClass}`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
            {data.map((row, idx) => (
              <tr
                key={keyExtractor(row, idx)}
                onClick={() => onRowClick?.(row)}
                className={`group transition-colors ${
                  onRowClick
                    ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    : "hover:bg-slate-50/40 dark:hover:bg-slate-800/30"
                }`}
              >
                {columns.map((col) => {
                  const isStickyRight = col.sticky === "right" || col.key === "acoes";
                  const isStickyLeft = col.sticky === "left";
                  const stickyTdClass = isStickyRight
                    ? "sticky right-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.08)] dark:shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.35)]"
                    : isStickyLeft
                    ? "sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 shadow-[6px_0_10px_-4px_rgba(0,0,0,0.08)]"
                    : "";

                  return (
                    <td
                      key={col.key}
                      className={`py-3.5 px-4 text-slate-700 dark:text-slate-300 ${
                        alignStyles[col.align || "left"]
                      } ${stickyTdClass}`}
                    >
                      {col.render
                        ? col.render(row, idx)
                        : (row as Record<string, any>)[col.key]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            {pagination.totalItems !== undefined && (
              <span>
                Total:{" "}
                <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                  {pagination.totalItems}
                </strong>{" "}
                itens
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium mr-2">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
