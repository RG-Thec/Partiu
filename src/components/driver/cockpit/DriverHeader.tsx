import React from "react";
import { Menu, Volume2, VolumeX, Bell, Clock } from "lucide-react";
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
        className="flex items-center justify-between pointer-events-auto bg-white/95 backdrop-blur-xl px-3 py-2 min-h-[52px] rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] max-w-lg mx-auto"
      >
        {/* ================================================================= */}
        {/* ESQUERDA: AVATAR DO MOTORISTA (PERFIL) + BOTÃO DE MENU LATERAL     */}
        {/* ================================================================= */}
        <div className="flex items-center gap-1.5">
          {/* Avatar Circular Clicável */}
          <button
            type="button"
            onClick={onOpenProfile || onOpenMenu}
            className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-all"
            style={{ borderColor: `${corPrimaria}40` }}
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
              <span className="text-[10px] font-bold tracking-tight" style={{ color: corPrimaria }}>
                {driverInitials}
              </span>
            )}
          </button>

          {/* Menu Hambúrguer */}
          <button
            type="button"
            onClick={onOpenMenu}
            style={{ borderRadius: ui.borderRadius }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition cursor-pointer"
            aria-label="Abrir menu do motorista"
            title="Menu"
          >
            <Menu className="w-3.5 h-3.5 stroke-[1.8]" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* CENTRO: LOGOTIPO PARTIU OFICIAL                                  */}
        {/* ================================================================= */}
        <div className="flex items-center justify-center">
          <PartiuLogo variant="full" size="sm" />
        </div>

        {/* ================================================================= */}
        {/* DIREITA: STATUS OPERACIONAL GPS + SOM + SINO NOTIFICAÇÕES         */}
        {/* ================================================================= */}
        <div className="flex items-center gap-1">
          {/* Chip de Diária Ativa / Tempo Restante */}
          {diariaBadgeText && (
            <button
              type="button"
              onClick={onOpenDiaria}
              className="h-7 px-2 rounded-full text-[10px] font-bold tracking-tight bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:brightness-105 active:scale-95 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Tempo de diária SaaS ativa"
              aria-label={`Tempo restante da diária SaaS: ${diariaBadgeText}`}
            >
              <Clock className="w-2.5 h-2.5 text-emerald-600 stroke-[2]" />
              <span>{diariaBadgeText}</span>
            </button>
          )}

          {/* Indicador de Status GPS */}
          <div
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider border ${
              isOnline
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                : "bg-muted text-muted-foreground border-border"
            }`}
            title={isOnline ? "GPS e Telemetria Conectados" : "Operação Offline"}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              }`}
            />
            <span>{isOnline ? "GPS" : "Offline"}</span>
          </div>

          {/* Controle de Áudio do Radar */}
          <button
            type="button"
            onClick={onToggleSom}
            style={{
              borderRadius: ui.borderRadius,
              color: somAtivo ? colors.primary : undefined,
            }}
            className={`w-9 h-9 min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center transition active:scale-90 cursor-pointer ${
              somAtivo
                ? "hover:bg-muted"
                : "text-muted-foreground hover:bg-muted"
            }`}
            title={somAtivo ? "Som ativado (clique para silenciar)" : "Som silenciado (clique para ativar)"}
            aria-label={somAtivo ? "Desativar alerta sonoro de chamadas" : "Ativar alerta sonoro de chamadas"}
          >
            {somAtivo ? <Volume2 className="w-3.5 h-3.5 stroke-[1.8]" /> : <VolumeX className="w-3.5 h-3.5 stroke-[1.8]" />}
          </button>

          {/* Sino de Notificações com Badge Numérico Vermelho em Tempo Real */}
          <button
            type="button"
            onClick={onOpenNotifications}
            style={{ borderRadius: ui.borderRadius }}
            className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition relative cursor-pointer"
            aria-label="Central de Notificações"
            title="Central de Notificações"
          >
            <Bell className="w-3.5 h-3.5 stroke-[1.8]" />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[13px] h-[13px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[8.5px] font-bold flex items-center justify-center ring-1.5 ring-background leading-none animate-pulse">
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
