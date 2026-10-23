import { MessageCircle, Phone, Compass, MapPin, AlertTriangle, Navigation, Users } from "lucide-react";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { InlineQuickReplyBar } from "@/components/chat";

interface HeadingToPickupStateProps {
  rideId?: string;
  driverId?: string;
  passageiroNome: string;
  origemEndereco: string;
  isEntrega: boolean;
  driverUnreadCount: number;
  isForOtherPerson?: boolean;
  otherPersonName?: string;
  otherPersonPhone?: string;
  solicitanteNome?: string;
  onChegueiAoLocal: () => void;
  onOpenChat: () => void;
  onLigar: () => void;
  onNavegar: (provedor: "waze" | "google_maps") => void;
  onOpenCancelar: () => void;
}

export function HeadingToPickupState({
  rideId,
  driverId,
  passageiroNome,
  origemEndereco,
  isEntrega,
  driverUnreadCount,
  isForOtherPerson = false,
  otherPersonName,
  otherPersonPhone,
  solicitanteNome,
  onChegueiAoLocal,
  onOpenChat,
  onLigar,
  onNavegar,
  onOpenCancelar,
}: HeadingToPickupStateProps) {
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  const displayPassengerName = isForOtherPerson ? otherPersonName || passageiroNome : passageiroNome;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Alerta de Corrida para Terceiro */}
      {isForOtherPerson && (
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-bold truncate">
              Passageiro: {displayPassengerName} (por {solicitanteNome || "Titular"})
            </span>
          </div>
          {otherPersonPhone && (
            <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200 shrink-0">
              {otherPersonPhone}
            </span>
          )}
        </div>
      )}

      {/* Cabeçalho da Viagem & Contatos Rápidos */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="min-w-0 flex-1 pr-2">
          <span
            style={{
              color: colors.primary,
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}30`,
            }}
            className="text-xs font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider inline-block"
          >
            {isEntrega ? "● A caminho da coleta" : "● A caminho do embarque"}
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-foreground mt-1 truncate">
            {displayPassengerName}
          </h3>
          <span className="text-xs text-muted-foreground truncate block mt-0.5">
            {origemEndereco}
          </span>
        </div>

        {/* Botões de Contato Rápido (Chat Seguro + Ligação) — Ergonomia Veicular 44px */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenChat}
            style={{
              backgroundColor: colors.primary,
              color: colors.surface,
              borderRadius: ui.borderRadius,
            }}
            className="relative w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 transition shadow-xs cursor-pointer hover:brightness-105"
            title="Abrir chat operacional"
            aria-label={`Abrir chat operacional${driverUnreadCount > 0 ? ` (${driverUnreadCount} não lidas)` : ""}`}
          >
            <MessageCircle className="w-5 h-5" />
            {driverUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-bold border-2 border-white shadow-xs animate-pulse">
                {driverUnreadCount > 9 ? "9+" : driverUnreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onLigar}
            style={{ borderRadius: ui.borderRadius }}
            className="w-11 h-11 min-h-[44px] min-w-[44px] bg-muted text-foreground border border-border flex items-center justify-center active:scale-90 transition shadow-xs hover:bg-muted/80 cursor-pointer"
            title={isForOtherPerson ? `Ligar para ${displayPassengerName}` : "Ligar para o passageiro"}
            aria-label={isForOtherPerson ? `Ligar para ${displayPassengerName}` : "Ligar para o passageiro"}
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Respostas Rápidas Hands-Free a Caminho do Ponto de Embarque */}
      {rideId && (
        <InlineQuickReplyBar
          rideId={rideId}
          senderType="DRIVER"
          senderId={driverId || "driver_cockpit"}
          rideStatus="A_CAMINHO"
          onOpenFullChat={onOpenChat}
          unreadCount={driverUnreadCount}
        />
      )}

      {/* Ações Rápidas de Direção e Navegação Externa */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onNavegar("waze")}
          className="h-11 min-h-[44px] rounded-2xl bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-950 dark:text-sky-200 border border-sky-200 dark:border-sky-800 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Navigation className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Waze</span>
        </button>
        <button
          type="button"
          onClick={() => onNavegar("google_maps")}
          className="h-11 min-h-[44px] rounded-2xl bg-muted/60 hover:bg-muted text-foreground border border-border font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Google Maps</span>
        </button>
      </div>

      {/* Ação Primária de Chegada — Thumb Zone 56px */}
      <button
        type="button"
        onClick={onChegueiAoLocal}
        style={{
          backgroundColor: colors.primary,
          color: colors.surface,
          borderRadius: ui.borderRadius,
        }}
        className="w-full h-14 min-h-[56px] font-black text-sm sm:text-base tracking-wider uppercase shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
      >
        <MapPin className="w-5 h-5" />
        <span>CHEGUEI AO LOCAL</span>
      </button>

      {/* Rodapé com Cancelamento */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onOpenCancelar}
          className="text-xs font-bold text-muted-foreground hover:text-rose-600 transition cursor-pointer py-1"
        >
          Problemas com o embarque? Cancelar
        </button>
      </div>
    </div>
  );
}
