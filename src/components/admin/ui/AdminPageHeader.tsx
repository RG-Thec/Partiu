import React from "react";
import { adminTokens } from "./tokens";
import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface AdminBreadcrumbItem {
  label: string;
  to?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: AdminBreadcrumbItem[];
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  stats?: React.ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  breadcrumbs,
  badge,
  actions,
  stats,
  className = "",
}: AdminPageHeaderProps) {
  return (
    <div className={`space-y-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-600 dark:text-slate-300 font-semibold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className={adminTokens.typography.pageTitle}>{title}</h1>
            {badge}
          </div>
          {subtitle && <p className={adminTokens.typography.pageSubtitle}>{subtitle}</p>}
        </div>

        {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
      </div>

      {stats && <div className="pt-2">{stats}</div>}
    </div>
  );
}
