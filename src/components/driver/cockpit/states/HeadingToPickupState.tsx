import { MessageCircle, Phone, Compass, MapPin, AlertTriangle, Navigation } from "lucide-react";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

interface HeadingToPickupStateProps {
  passageiroNome: string;
  origemEndereco: string;
  isEntrega: boolean;
  driverUnreadCount: number;
  onChegueiAoLocal: () => void;
  onOpenChat: () => void;
  onLigar: () => void;
  onNavegar: (provedor: "waze" | "google_maps") => void;
  onOpenCancelar: () => void;
}

export function HeadingToPickupState({
  passageiroNome,
  origemEndereco,
  isEntrega,
  driverUnreadCount,
  onChegueiAoLocal,
  onOpenChat,
  onLigar,
  onNavegar,
  onOpenCancelar,
}: HeadingToPickupStateProps) {
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-300">
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
            {passageiroNome}
          </h3>
          <span className="text-xs text-muted-foreground truncate block mt-0.5">
            {origemEndereco}
          </span>
        </div>

        {/* Botões de Contato Rápido (Chat Seguro + Ligação) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenChat}
            style={{
              backgroundColor: colors.primary,
              color: colors.surface,
              borderRadius: ui.borderRadius,
            }}
            className="relative w-9.5 h-9.5 min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-90 transition shadow-xs cursor-pointer hover:brightness-105"
            title="Abrir chat operacional"
            aria-label={`Abrir chat operacional${driverUnreadCount > 0 ? ` (${driverUnreadCount} não lidas)` : ""}`}
          >
            <MessageCircle className="w-4.5 h-4.5" />
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
            className="w-9.5 h-9.5 min-h-[38px] min-w-[38px] bg-muted text-foreground border border-border flex items-center justify-center active:scale-90 transition shadow-xs hover:bg-muted/80 cursor-pointer"
            title="Ligar para o passageiro"
            aria-label="Ligar para o passageiro"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Atalhos Rápidos de Navegação Externa (Waze & Google Maps) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onNavegar("waze")}
          style={{ borderRadius: ui.borderRadius }}
          className="h-9 min-h-[36px] bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-200 font-semibold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Compass className="w-3.5 h-3.5 text-sky-600" />
          <span>Waze</span>
        </button>
        <button
          type="button"
          onClick={() => onNavegar("google_maps")}
          style={{ borderRadius: ui.borderRadius }}
          className="h-9 min-h-[36px] bg-muted/60 hover:bg-muted text-foreground border border-border font-semibold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <MapPin className="w-3.5 h-3.5" style={{ color: colors.primary }} />
          <span>Google Maps</span>
        </button>
      </div>

      {/* Botão Primário de Chegada (Padrão Flutter 44px) */}
      <button
        type="button"
        onClick={onChegueiAoLocal}
        style={{
          backgroundColor: colors.primary,
          color: colors.surface,
          borderRadius: ui.borderRadius,
          boxShadow: ui.buttonShadow,
        }}
        className="w-full h-11 min-h-[44px] font-bold text-xs sm:text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
      >
        <span>✓ Cheguei ao local</span>
      </button>

      {/* Opção Secundária: Cancelamento Justificado */}
      <div className="pt-0.5 flex justify-center">
        <button
          type="button"
          onClick={onOpenCancelar}
          className="text-xs font-semibold text-muted-foreground hover:text-rose-600 flex items-center gap-1.5 py-1 px-3 rounded-lg transition active:scale-95 cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span>Cancelar corrida</span>
        </button>
      </div>
    </div>
  );
}
