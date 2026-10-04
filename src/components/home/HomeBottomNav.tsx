import React, { memo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Car, Package, Compass, CreditCard, User, Truck, Shield, HelpCircle, Home, Clock } from "lucide-react";
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

  // === Padrão: 4 Abas Executivas (Início, Viagens, Entregas, Perfil - DriveLux Screen 2) ===
  const isInicio = pathname === "/app" || pathname === "/app/";
  const isViagens = pathname.startsWith("/app/viagem");
  const isEntregas = pathname.startsWith("/app/encomendas");
  const isPerfil = pathname.startsWith("/app/perfil");

  const defaultTabs = [
    { id: "inicio", rotulo: "Início", rota: "/app", icone: Home, ativo: isInicio },
    { id: "viagens", rotulo: "Viagens", rota: "/app/viagem", icone: Clock, ativo: isViagens },
    { id: "entregas", rotulo: "Entregas", rota: "/app/encomendas", icone: Package, ativo: isEntregas },
    { id: "perfil", rotulo: "Perfil", rota: "/app/perfil", icone: User, ativo: isPerfil },
  ];

  return (
    <nav
      className="w-full z-30 flex items-center justify-center bg-transparent pointer-events-auto select-none"
      style={{
        paddingBottom: "max(0.4rem, env(safe-area-inset-bottom, 8px))",
      }}
      aria-label="Navegação Principal"
    >
      <div className="flex items-center justify-around gap-1 p-1 sm:p-1.5 rounded-full bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-200/80 max-w-sm sm:max-w-md w-full mx-auto">
        {defaultTabs.map((tab) => {
          const IconComp = tab.icone;
          const isActive = tab.ativo;

          return (
            <Link
              key={tab.id}
              to={tab.rota as any}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center py-1.5 sm:py-2 px-2 rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive
                  ? "font-bold shadow-xs text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: primaryColor,
                      color: "#FFFFFF",
                      boxShadow: `0 3px 10px ${primaryColor}35`,
                    }
                  : undefined
              }
              aria-label={`Aba ${tab.rotulo}`}
            >
              <IconComp
                className={`w-4 h-4 transition-transform duration-200 ${
                  isActive ? "text-white stroke-[2.4] scale-105" : "text-slate-500 stroke-[2]"
                }`}
              />
              <span
                className={`text-[10px] sm:text-xs sm:ml-1.5 tracking-tight ${
                  isActive ? "text-white font-bold" : "text-slate-600 font-medium"
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
});
