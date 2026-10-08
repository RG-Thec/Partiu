import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Search, MapPin, ChevronRight, Clock, Home, Briefcase, Car, Package } from "lucide-react";
import { usePassengerRide } from "@/contexts/PassengerRideContext";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { SavedLocation } from "@/lib/passenger/passenger-ride-machine";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";
import { silentCatchWarn } from "@/lib/structured-logger";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { addressService } from "@/services/AddressService";

function carregarDestinosReais(): SavedLocation[] {
  if (typeof window === "undefined") return [];
  try {
    const session = supabaseAuthService?.getStoredSession?.() || null;
    const uid = session?.id || localStorage.getItem("partiu_user_id") || undefined;
    const key =
      uid && uid !== "passageiro_default"
        ? `partiu_recent_destinations_v1_${uid}`
        : "partiu_recent_destinations_v1";

    const salvo = localStorage.getItem(key);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validos = parsed.filter(
          (item: any) =>
            item &&
            item.id !== "rec-1" &&
            item.id !== "rec-2" &&
            item.label !== "Rua Dez de Maio, 188" &&
            item.label !== "Hospital São José do Avaí"
        );
        if (validos.length > 0) {
          return validos.slice(0, 2).map((item: any) => ({
            id: item.id || `rec-${Math.random()}`,
            label: item.label || item.titulo || "Recente",
            sublabel: item.endereco || "",
            endereco: item.endereco,
            coords: item.coords || [-41.8860, -21.2065],
            icone: "clock",
          }));
        }
      }
    }

    // Se não há viagens recentes, verifica se o usuário configurou Casa ou Trabalho reais
    const casa = addressService.getCasa(uid);
    const trabalho = addressService.getTrabalho(uid);
    const reais: SavedLocation[] = [];
    if (casa && casa.endereco) {
      reais.push({
        id: casa.id,
        label: casa.label || "Casa",
        sublabel: casa.sublabel || casa.endereco,
        endereco: casa.endereco,
        coords: casa.coords,
        icone: "home",
      });
    }
    if (trabalho && trabalho.endereco) {
      reais.push({
        id: trabalho.id,
        label: trabalho.label || "Trabalho",
        sublabel: trabalho.sublabel || trabalho.endereco,
        endereco: trabalho.endereco,
        coords: trabalho.coords,
        icone: "work",
      });
    }

    return reais.slice(0, 2);
  } catch (err) {
    silentCatchWarn("PassengerIdleCard", err);
    return [];
  }
}

interface PassengerIdleCardProps {
  userName?: string;
  onOpenDrawer?: () => void;
}

export function PassengerIdleCard({ userName = "Passageiro" }: PassengerIdleCardProps) {
  const { startSearch, selectDestination, selectDestinationOnMap } = usePassengerRide();
  const { nomeModuloEntrega } = useBrandTheme();
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  // Destinos Recentes/Frequentes autênticos (vazio para novo usuário)
  const [destinosFrequentes, setDestinosFrequentes] = useState<SavedLocation[]>(() =>
    carregarDestinosReais()
  );

  useEffect(() => {
    const handleSync = () => {
      setDestinosFrequentes(carregarDestinosReais());
    };
    const handleClear = () => {
      setDestinosFrequentes([]);
    };

    window.addEventListener("partiu:history-cleared", handleClear);
    window.addEventListener("partiu:user-profile-updated", handleSync);
    window.addEventListener("partiu:addresses_updated", handleSync);
    return () => {
      window.removeEventListener("partiu:history-cleared", handleClear);
      window.removeEventListener("partiu:user-profile-updated", handleSync);
      window.removeEventListener("partiu:addresses_updated", handleSync);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto z-20 animate-in slide-in-from-bottom duration-300 pointer-events-auto">
      {/* Bottom Sheet Ancorado na Base — Padrão 99 */}
      <div
        style={{ borderRadius: `${ui.borderRadius} ${ui.borderRadius} 0 0` }}
        className="bg-card shadow-[0_-12px_40px_rgba(0,0,0,0.14)] border-t border-border sm:border p-4 pb-6 sm:pb-5 space-y-3 text-left"
      >
        
        {/* Handle de arraste sutil (Mobile) */}
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-2" />

        {/* 1. Abas Oficiais 99: Corrida vs Entrega */}
        <div className="flex items-center p-1 bg-muted/80 rounded-2xl gap-1 border border-border/40">
          <div
            style={{
              backgroundColor: colors.primary,
              color: colors.surface,
              borderRadius: ui.borderRadius,
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 font-black text-xs shadow-xs cursor-default select-none"
          >
            <Car className="w-4 h-4 stroke-[2.4]" />
            <span>Corrida</span>
          </div>

          <Link
            to="/app/encomendas"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition active:scale-95 cursor-pointer"
          >
            <Package className="w-4 h-4 stroke-[2.2]" />
            <span>{nomeModuloEntrega || "Entrega"}</span>
          </Link>
        </div>

        {/* 2. Barra Dominante "Para onde vamos?" (Padrão 99) */}
        <button
          type="button"
          onClick={() => {
            hapticFeedback.light();
            startSearch();
          }}
          style={{ borderRadius: ui.borderRadius }}
          className="group w-full h-12 sm:h-13 px-3.5 bg-muted/70 hover:bg-muted border border-border flex items-center gap-3 transition-all duration-200 active:scale-[0.99] cursor-pointer text-left shadow-2xs"
        >
          <div
            style={{
              backgroundColor: colors.primary,
              color: colors.surface,
              borderRadius: ui.borderRadius,
            }}
            className="w-8 h-8 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
          </div>

          <span className="text-sm sm:text-base font-bold text-foreground block flex-1 truncate">
            Para onde vamos?
          </span>
        </button>

        {/* 3. Destinos Frequentes / Recentes (Modelo Uber / 99 — Exibição estrita se existirem) */}
        {destinosFrequentes.length > 0 && (
          <div className="pt-0.5 divide-y divide-slate-100">
            {destinosFrequentes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  hapticFeedback.selection();
                  selectDestination(item.endereco, item.coords);
                }}
                style={{ borderRadius: ui.borderRadius }}
                className="w-full min-h-[48px] py-2.5 px-2 flex items-center gap-3 hover:bg-slate-50 transition active:scale-[0.99] cursor-pointer group text-left"
              >
                <div
                  style={{ borderRadius: ui.borderRadius }}
                  className="w-9 h-9 bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 transition-colors"
                >
                  {item.icone === "home" ? (
                    <Home className="w-4 h-4 stroke-[2.2]" />
                  ) : item.icone === "work" ? (
                    <Briefcase className="w-4 h-4 stroke-[2.2]" />
                  ) : (
                    <Clock className="w-4 h-4 stroke-[2.2]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-900 block truncate leading-tight">
                    {item.label}
                  </span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700 font-normal block truncate mt-0.5">
                    {item.sublabel || item.endereco}
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
