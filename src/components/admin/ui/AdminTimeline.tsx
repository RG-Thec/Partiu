import React from "react";
import { adminTokens } from "./tokens";
import { AdminBadge, type AdminBadgeVariant } from "./AdminBadge";

export interface AdminTimelineEvent {
  id: string;
  title: string;
  description?: React.ReactNode;
  date: string;
  icon?: React.ReactNode;
  variant?: AdminBadgeVariant;
  author?: string;
  badge?: string;
}

export interface AdminTimelineProps {
  events: AdminTimelineEvent[];
  className?: string;
}

export function AdminTimeline({ events, className = "" }: AdminTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400">
        Nenhum evento registrado no histórico.
      </div>
    );
  }

  return (
    <div className={`relative pl-6 space-y-6 ${className}`}>
      {/* Linha vertical contínua */}
      <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-slate-200 dark:bg-slate-800 -translate-x-1/2" />

      {events.map((event, idx) => {
        const variant = event.variant || "neutral";
        const colorToken = adminTokens.colors[variant];

        return (
          <div key={event.id || idx} className="relative group">
            {/* Marcador na linha */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] shadow-2xs z-10 ${colorToken.solid}`}
            >
              {event.icon || <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>

            {/* Conteúdo do evento */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {event.title}
                  </h4>
                  {event.badge && (
                    <AdminBadge variant={variant} size="sm">
                      {event.badge}
                    </AdminBadge>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {event.date}
                </span>
              </div>

              {event.description && (
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {event.description}
                </div>
              )}

              {event.author && (
                <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/60 text-[10px] text-slate-400 font-medium">
                  Responsável: <span className="font-semibold text-slate-600 dark:text-slate-300">{event.author}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
