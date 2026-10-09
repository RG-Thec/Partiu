import { Power, User, Wallet } from "lucide-react";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

interface OfflineStateProps {
  onToggleOnline: () => void;
  onOpenProfile: () => void;
  onOpenWallet: () => void;
}

export function OfflineState({
  onToggleOnline,
  onOpenProfile,
  onOpenWallet,
}: OfflineStateProps) {
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Indicador de Status Offline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground border border-border">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
              <h3 className="text-base font-black text-foreground leading-none">Você está offline</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-semibold">
              Conecte-se para receber chamadas próximas
            </p>
          </div>
        </div>
      </div>

      {/* Botão Primário de Conexão no padrão Veicular Material 3 (52px) */}
      <button
        type="button"
        onClick={onToggleOnline}
        style={{ borderRadius: ui.borderRadius }}
        className="w-full h-13 min-h-[52px] bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer uppercase tracking-wider"
      >
        <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
        <span>Ficar online</span>
      </button>

      {/* Ações Secundárias Ergonômicas (44px) */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
        <button
          type="button"
          onClick={onOpenWallet}
          style={{ borderRadius: ui.borderRadius }}
          className="h-11 min-h-[44px] bg-muted/60 hover:bg-muted active:scale-95 text-foreground font-bold text-xs flex items-center justify-center gap-2 border border-border transition cursor-pointer"
        >
          <Wallet className="w-4 h-4" style={{ color: colors.primary }} />
          <span>Ganhos &amp; PIX</span>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          style={{ borderRadius: ui.borderRadius }}
          className="h-11 min-h-[44px] bg-muted/60 hover:bg-muted active:scale-95 text-foreground font-bold text-xs flex items-center justify-center gap-2 border border-border transition cursor-pointer"
        >
          <User className="w-4 h-4" style={{ color: colors.primary }} />
          <span>Perfil &amp; veículo</span>
        </button>
      </div>
    </div>
  );
}
