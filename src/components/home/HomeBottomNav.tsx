import React, { memo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Car, Package, Compass, CreditCard, User, Truck, Shield, HelpCircle } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";

export interface HomeBottomNavProps {
  activeTab?: "corridas" | "entregas" | string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Package,
  Compass,
  CreditCard,
  User,
  Truck,
  Shield,
  HelpCircle,
};

export const HomeBottomNav = memo(function HomeBottomNav({ activeTab }: HomeBottomNavProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { menuBuilder, corPrimaria, corSecundaria } = useBrandTheme();

  const customTabs = menuBuilder?.abasNavegacaoInferior?.filter((t) => t.ativo);
  const primaryColor = corPrimaria || "#FF6B00";
  const secondaryColor = corSecundaria || "#FFB800";

  // === Renderização com White Label Custom Tabs ===
  if (customTabs && customTabs.length > 0) {
    return (
      <nav
        className="w-full z-30 flex items-center justify-center bg-transparent pointer-events-auto select-none"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 10px))",
        }}
        aria-label="Navegação Principal"
      >
        <div className="flex items-center justify-around gap-1 p-1 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200/80 max-w-md w-full mx-auto">
          {customTabs
            .sort((a, b) => a.ordem - b.ordem)
            .map((tab) => {
              const isActive =
                activeTab === tab.id ||
                pathname === tab.rota ||
                (tab.rota === "/app" && (pathname === "/app" || pathname === "/app/"));
              const IconComp = ICON_MAP[tab.icone] || Car;

              return (
                <Link
                  key={tab.id}
                  to={tab.rota as any}
                  className={`flex-1 flex items-center justify-center py-1.5 px-2.5 rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
                    isActive
                      ? "font-semibold shadow-2xs text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: primaryColor,
                          color: "#FFFFFF",
                          boxShadow: `0 2px 8px ${primaryColor}30`,
                        }
                      : undefined
                  }
                  aria-label={tab.rotulo}
                >
                  <IconComp
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isActive ? "text-white stroke-[2.4] scale-105" : "text-slate-500 stroke-[2]"
                    }`}
                  />
                  <span
                    className={`text-xs ml-1.5 tracking-tight ${
                      isActive ? "text-white font-semibold" : "text-slate-600 font-medium"
                    }`}
                  >
                    {tab.rotulo}
                  </span>
                </Link>
              );
            })}
        </div>
      </nav>
    );
  }

  // === Padrão: Corridas & Entregas ===
  const isCorridas = activeTab ? activeTab === "corridas" : pathname === "/app" || pathname === "/app/";
  const isEntregas = activeTab ? activeTab === "entregas" : pathname === "/app/encomendas" || pathname === "/app/encomendas/";

  return (
    <nav
      className="w-full z-30 flex items-center justify-center bg-transparent pointer-events-auto select-none"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 10px))",
      }}
      aria-label="Navegação Principal"
    >
      <div className="flex items-center justify-around gap-1 p-1 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200/80 max-w-[280px] sm:max-w-[300px] w-full mx-auto">
        {/* Aba 1: Corridas */}
        <Link
          to="/app"
          className={`flex-1 flex items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
            isCorridas
              ? "font-semibold shadow-2xs text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
          }`}
          style={
            isCorridas
              ? {
                  backgroundColor: primaryColor,
                  color: "#FFFFFF",
                  boxShadow: `0 2px 8px ${primaryColor}30`,
                }
              : undefined
          }
          aria-label="Aba Corridas"
        >
          <Car
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isCorridas ? "text-white stroke-[2.4] scale-105" : "text-slate-500 stroke-[2]"
            }`}
          />
          <span
            className={`text-xs ml-1.5 tracking-tight ${
              isCorridas ? "text-white font-semibold" : "text-slate-600 font-medium"
            }`}
          >
            Corridas
          </span>
        </Link>

        {/* Aba 2: Entregas */}
        <Link
          to="/app/encomendas"
          className={`flex-1 flex items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
            isEntregas
              ? "font-semibold shadow-2xs text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
          }`}
          style={
            isEntregas
              ? {
                  backgroundColor: primaryColor,
                  color: "#FFFFFF",
                  boxShadow: `0 2px 8px ${primaryColor}30`,
                }
              : undefined
          }
          aria-label="Aba Entregas"
        >
          <Package
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isEntregas ? "text-white stroke-[2.4] scale-105" : "text-slate-500 stroke-[2]"
            }`}
          />
          <span
            className={`text-xs ml-1.5 tracking-tight ${
              isEntregas ? "text-white font-semibold" : "text-slate-600 font-medium"
            }`}
          >
            Entregas
          </span>
        </Link>
      </div>
    </nav>
  );
});
