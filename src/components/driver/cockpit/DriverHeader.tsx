import React, { useState } from "react";
import { Menu, Bell, SlidersHorizontal, ChevronRight } from "lucide-react";
import { PartiuLogo } from "@/components/common/PartiuLogo";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { DriverQuickPreferencesModal } from "./DriverQuickPreferencesModal";

export interface DriverHeaderProps {
  isOnline: boolean;
  somAtivo: boolean;
  onToggleSom: () => void;
  onOpenMenu: () => void;
  onOpenProfile?: () => void;
  driverAvatarUrl?: string | null;
  driverName?: string;
  onOpenNotifications?: () => void;
  unreadNotifications?: boolean;
  unreadCount?: number;
  diariaBadgeText?: string;
  onOpenDiaria?: () => void;
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  ganhosHoje?: number;
  onOpenFinanceiro?: () => void;
  onOpenZonasExclusao?: () => void;
  onOpenModoDestino?: () => void;
  destinoAtivoTexto?: string | null;
}

export function DriverHeader({
  isOnline,
  somAtivo,
  onToggleSom,
  onOpenMenu,
  onOpenProfile,
  driverAvatarUrl,
  driverName = "Motorista",
  onOpenNotifications,
  unreadNotifications = false,
  unreadCount = 0,
  diariaBadgeText,
  onOpenDiaria,
  isNightMode = false,
  onToggleNightMode,
  ganhosHoje,
  onOpenFinanceiro,
  onOpenZonasExclusao,
  onOpenModoDestino,
  destinoAtivoTexto,
}: DriverHeaderProps) {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const { corPrimaria } = useBrandTheme();
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  const driverInitials = (driverName || "Motorista")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hasUnread = unreadCount > 0 || unreadNotifications;

  return (
    <>
      <header className="absolute top-0 inset-x-0 z-30 pt-[max(0.6rem,calc(env(safe-area-inset-top,0px)+6px))] px-3 pb-1 pointer-events-none select-none">
        <div
          style={{ borderRadius: ui.borderRadius || "1.25rem" }}
          className="flex items-center justify-between pointer-events-auto px-2.5 py-1.5 min-h-[48px] max-w-lg mx-auto border backdrop-blur-xl transition-all duration-200 shadow-md bg-card/95 border-border text-foreground gap-2"
        >
          {/* ================================================================= */}
          {/* ESQUERDA: AVATAR UNIFICADO COM INDICADOR DO MENU                  */}
          {/* ================================================================= */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenMenu}
              className="relative w-9 h-9 min-w-[36px] min-h-[36px] rounded-full border border-border bg-muted flex items-center justify-center shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-all hover:brightness-105"
              style={{ borderColor: `${colors.primary}50` }}
              aria-label="Abrir menu do motorista"
              title="Menu e Perfil"
            >
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                {driverAvatarUrl ? (
                  <img
                    src={driverAvatarUrl}
                    alt={driverName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span
                    className="text-[11px] font-black tracking-tight"
                    style={{ color: colors.primary }}
                  >
                    {driverInitials}
                  </span>
                )}
              </div>
              {/* Mini badge hambúrguer sobreposto */}
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card border border-border shadow-2xs flex items-center justify-center text-foreground">
                <Menu className="w-2.5 h-2.5 stroke-[2.5]" />
              </span>
            </button>
          </div>

          {/* ================================================================= */}
          {/* CENTRO: GANHOS DO DIA (PADRÃO 99 / UBER) OU LOGO COMPACTO         */}
          {/* ================================================================= */}
          <div className="flex items-center justify-center min-w-0 flex-1">
            {typeof ganhosHoje === "number" ? (
              <button
                type="button"
                onClick={onOpenFinanceiro || onOpenMenu}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/80 shadow-2xs transition active:scale-95 cursor-pointer truncate max-w-[170px]"
                title="Ganhos de hoje (toque para ver extrato e resumo financeiro)"
                aria-label={`Ganhos de hoje: ${ganhosHoje.toFixed(2)} reais`}
              >
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                  Hoje
                </span>
                <span className="text-xs sm:text-sm font-black text-foreground tracking-tight truncate">
                  {ganhosHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground opacity-60 shrink-0" />
              </button>
            ) : (
              <PartiuLogo
                variant="compact"
                size="sm"
                appName={appConfig.branding.appName}
                primaryColor={colors.primary}
                secondaryColor={colors.secondary}
              />
            )}
          </div>

          {/* ================================================================= */}
          {/* DIREITA: STATUS OPERACIONAL + PREFERÊNCIAS + NOTIFICAÇÕES         */}
          {/* ================================================================= */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Indicador de Status Operacional Online/Offline */}
            <button
              type="button"
              onClick={() => setIsPreferencesOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer shadow-2xs active:scale-95 ${
                isOnline
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
              title={isOnline ? "Conectado • Recebendo chamadas" : "Offline • Pausado"}
              aria-label={isOnline ? "Status online: conectado" : "Status offline: desconectado"}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/60"
                }`}
              />
              <span className="hidden xs:inline">{isOnline ? "Online" : "Off"}</span>
            </button>

            {/* Botão de Preferências Rápidas do Cockpit (Sliders) */}
            <button
              type="button"
              onClick={() => setIsPreferencesOpen(true)}
              style={{ borderRadius: ui.borderRadius }}
              className="relative w-8.5 h-8.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition cursor-pointer rounded-full border border-border/80 bg-muted/40 shadow-2xs"
              aria-label="Abrir preferências do cockpit"
              title="Preferências rápidas (som, modo noturno, áudio HUD)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2]" />
              {/* Indicador sutil se o som estiver silenciado ou modo noturno ativo */}
              {(!somAtivo || isNightMode) && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>

            {/* Sino de Notificações com Badge Numérico */}
            <button
              type="button"
              onClick={onOpenNotifications}
              style={{ borderRadius: ui.borderRadius }}
              className="relative w-8.5 h-8.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition cursor-pointer rounded-full border border-border/80 bg-muted/40 shadow-2xs"
              aria-label="Central de Notificações"
              title="Central de Notificações"
            >
              <Bell className="w-3.5 h-3.5 stroke-[2]" />
              {hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background leading-none animate-pulse">
                  {unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : ""}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Modal / Sheet de Preferências Rápidas do Cockpit */}
      <DriverQuickPreferencesModal
        open={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        isNightMode={isNightMode}
        onToggleNightMode={onToggleNightMode}
        somAtivo={somAtivo}
        onToggleSom={onToggleSom}
        onOpenZonasExclusao={onOpenZonasExclusao}
        onOpenModoDestino={onOpenModoDestino}
        destinoAtivoTexto={destinoAtivoTexto}
        diariaBadgeText={diariaBadgeText}
        onOpenDiaria={onOpenDiaria}
      />
    </>
  );
}

export default DriverHeader;
