import React from "react";
import { adminTokens } from "./tokens";

export interface AdminTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "critical" | "warning";
}

export interface AdminTabBarProps {
  tabs: AdminTabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pills" | "underline";
  className?: string;
}

export function AdminTabBar({
  tabs,
  activeTab,
  onChange,
  variant = "pills",
  className = "",
}: AdminTabBarProps) {
  if (variant === "underline") {
    return (
      <div className={`flex items-center gap-6 border-b ${adminTokens.colors.cardBorder} overflow-x-auto scrollbar-none ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`pb-3 px-1 text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "text-primary font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                    tab.badgeVariant === "critical"
                      ? "bg-rose-500 text-white"
                      : tab.badgeVariant === "warning"
                      ? "bg-amber-500 text-white"
                      : isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: pills
  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border ${adminTokens.colors.cardBorder} overflow-x-auto scrollbar-none max-w-full ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer select-none ${
              isActive
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                  tab.badgeVariant === "critical"
                    ? "bg-rose-500 text-white"
                    : tab.badgeVariant === "warning"
                    ? "bg-amber-500 text-white"
                    : isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
