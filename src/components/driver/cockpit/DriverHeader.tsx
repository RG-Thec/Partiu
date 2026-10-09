import React from "react";
import { Menu, Volume2, VolumeX, Bell, Clock, Moon, Sun } from "lucide-react";
import { PartiuLogo } from "@/components/common/PartiuLogo";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

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
}: DriverHeaderProps) {
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
    <header className="absolute top-0 inset-x-0 z-30 pt-[max(0.6rem,calc(env(safe-area-inset-top,0px)+6px))] px-3.5 pb-1.5 pointer-events-none">
      <div
        style={{ borderRadius: ui.borderRadius }}
        className={`flex items-center justify-between pointer-events-auto px-3 py-2 min-h-[52px] border backdrop-blur-xl transition-colors duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.06)] max-w-lg mx-auto ${
          isNightMode
            ? "bg-slate-900/95 border-slate-800 text-slate-100"
            : "bg-card/95 border-border text-foreground"
        }`}
      >
        {/* ================================================================= */}
        {/* ESQUERDA: AVATAR DO MOTORISTA (PERFIL) + BOTÃO DE MENU LATERAL     */}
        {/* ================================================================= */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Avatar Circular Clicável */}
          <button
            type="button"
            onClick={onOpenProfile || onOpenMenu}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-all hover:brightness-105"
            style={{ borderColor: `${colors.primary}40` }}
            aria-label="Abrir Perfil do Motorista"
            title="Editar Perfil e Veículo"
          >
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
              <span className="text-[11px] font-black tracking-tight" style={{ color: colors.primary }}>
                {driverInitials}
              </span>
            )}
          </button>

          {/* Menu Hambúrguer */}
          <button
            type="button"
            onClick={onOpenMenu}
            style={{ borderRadius: ui.borderRadius }}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition cursor-pointer"
            aria-label="Abrir menu do motorista"
            title="Menu"
          >
            <Menu className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* CENTRO: LOGOTIPO WHITE-LABEL (COMPACTO E SEM POLUIÇÃO)            */}
        {/* ================================================================= */}
        <div className="flex items-center justify-center px-1">
          <PartiuLogo
            variant="compact"
            size="sm"
            appName={appConfig.branding.appName}
            primaryColor={colors.primary}
            secondaryColor={colors.secondary}
          />
        </div>

        {/* ================================================================= */}
        {/* DIREITA: STATUS OPERACIONAL GPS + SOM + TEMA + SINO NOTIFICAÇÕES  */}
        {/* ================================================================= */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Indicador de Status GPS e Radar Operacional */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
              isOnline
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                : "bg-muted text-muted-foreground border-border"
            }`}
            title={isOnline ? "GPS e Telemetria Conectados" : "Operação Offline"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/60"
              }`}
            />
            <span className="hidden xs:inline">{isOnline ? "Online" : "Off"}</span>
          </div>

          {/* Chip de Diária Ativa / Tempo Restante */}
          {diariaBadgeText && (
            <button
              type="button"
              onClick={onOpenDiaria}
              className="h-8 px-2 rounded-full text-[10px] font-bold tracking-tight bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:brightness-105 active:scale-95 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Tempo de diária SaaS ativa"
              aria-label={`Tempo restante da diária SaaS: ${diariaBadgeText}`}
            >
              <Clock className="w-3 h-3 text-emerald-600 stroke-[2]" />
              <span className="hidden sm:inline">{diariaBadgeText}</span>
            </button>
          )}

          {/* Controle de Áudio do Radar */}
          <button
            type="button"
            onClick={onToggleSom}
            style={{
              borderRadius: ui.borderRadius,
              color: somAtivo ? colors.primary : undefined,
            }}
            className="w-10 h-10 min-h-[40px] min-w-[40px] flex items-center justify-center transition active:scale-90 cursor-pointer hover:bg-muted"
            title={somAtivo ? "Som ativado (clique para silenciar)" : "Som silenciado (clique para ativar)"}
            aria-label={somAtivo ? "Desativar alerta sonoro de chamadas" : "Ativar alerta sonoro de chamadas"}
          >
            {somAtivo ? <Volume2 className="w-4 h-4 stroke-[2]" /> : <VolumeX className="w-4 h-4 stroke-[2]" />}
          </button>

          {/* Alternância de Modo Noturno / Diurno */}
          {onToggleNightMode && (
            <button
              type="button"
              onClick={onToggleNightMode}
              style={{ borderRadius: ui.borderRadius }}
              className="w-10 h-10 min-h-[40px] min-w-[40px] flex items-center justify-center text-foreground hover:bg-muted active:scale-90 transition cursor-pointer"
              title={isNightMode ? "Modo Noturno ativo (clique para alternar)" : "Modo Diurno ativo (clique para alternar)"}
              aria-label="Alternar modo noturno veicular"
            >
              {isNightMode ? (
                <Moon className="w-4 h-4 text-amber-400 fill-amber-400 stroke-[2]" />
              ) : (
                <Sun className="w-4 h-4 stroke-[2]" />
              )}
            </button>
          )}

          {/* Sino de Notificações com Badge Numérico */}
          <button
            type="button"
            onClick={onOpenNotifications}
            style={{ borderRadius: ui.borderRadius }}
            className="w-10 h-10 min-h-[40px] min-w-[40px] flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition relative cursor-pointer"
            aria-label="Central de Notificações"
            title="Central de Notificações"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background leading-none animate-pulse">
                {unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : ""}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default DriverHeader;
