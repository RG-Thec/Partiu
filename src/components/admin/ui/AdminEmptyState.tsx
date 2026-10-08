import React from "react";
import { adminTokens } from "./tokens";
import { Inbox } from "lucide-react";

export interface AdminEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function AdminEmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: AdminEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed ${adminTokens.colors.cardBorder} bg-slate-50/50 dark:bg-slate-900/40 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4">
        {icon || <Inbox className="h-6 w-6 stroke-[1.5]" />}
      </div>
      <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
        {title}
      </h4>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
