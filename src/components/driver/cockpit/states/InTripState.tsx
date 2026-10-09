import { MessageCircle, Compass, MapPin, KeyRound, UserX, RotateCcw, Package, CheckCircle2 } from "lucide-react";
import type { ReturnDetails } from "@/lib/delivery";
import { DriverSlideAction } from "../DriverSlideAction";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

interface InTripStateProps {
  passageiroNome: string;
  destinoEndereco: string;
  distanciaKm: number;
  valorLiquido: number;
  isEntrega: boolean;
  emDevolucao: boolean;
  returnDetails: ReturnDetails | null;
  currentStopNumber: number;
  driverUnreadCount: number;
  onConcluirCorrida: () => void;
  onOpenPinNumpadDropoff: () => void;
  onOpenDevolucao: () => void;
  onOpenReturnFinalizar: () => void;
  onOpenChat: () => void;
  onNavegar: (provedor: "waze" | "google_maps") => void;
}

export function InTripState({
  passageiroNome,
  destinoEndereco,
  distanciaKm,
  valorLiquido,
  isEntrega,
  emDevolucao,
  returnDetails,
  currentStopNumber,
  driverUnreadCount,
  onConcluirCorrida,
  onOpenPinNumpadDropoff,
  onOpenDevolucao,
  onOpenReturnFinalizar,
  onOpenChat,
  onNavegar,
}: InTripStateProps) {
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  // Caso de Devolução Reversa da Entrega
  if (isEntrega && emDevolucao) {
    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/50 pb-2">
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <RotateCcw className="w-4 h-4 text-rose-600 animate-spin" />
            <span>Devolução ao remetente</span>
          </div>
          <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
            +R$ {returnDetails?.driverReturnCompensationBrl.toFixed(2) || "15,50"}
          </span>
        </div>

        <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-0.5 text-xs">
          <span className="text-[10px] font-black uppercase text-rose-900 dark:text-rose-300 block">
            Ponto de retorno:
          </span>
          <p className="font-extrabold text-foreground truncate">{destinoEndereco}</p>
          <p className="text-[11px] text-muted-foreground">
            Devolver para: <strong>{passageiroNome}</strong>
          </p>
        </div>

        {/* Navegação Externa para Devolução — Touch Target 44px */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onNavegar("waze")}
            className="h-11 min-h-[44px] rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-200 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Compass className="w-4 h-4 text-sky-600" />
            <span>Waze</span>
          </button>
          <button
            type="button"
            onClick={() => onNavegar("google_maps")}
            className="h-11 min-h-[44px] rounded-2xl bg-muted text-foreground border border-border font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Google Maps</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenReturnFinalizar}
          className="w-full h-12 min-h-[48px] rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Package className="w-4 h-4" />
          <span>Finalizar devolução</span>
        </button>
      </div>
    );
  }

  // Viagem Normal (Carro, Moto ou Entrega Flash em Rota)
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Cabeçalho da Viagem & Valor a Receber */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
        <div className="min-w-0 flex-1 pr-2">
          <span
            style={{
              color: colors.primary,
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}30`,
            }}
            className="text-xs font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider inline-block"
          >
            {isEntrega
              ? `● Entrega ${currentStopNumber > 1 ? `(Parada ${currentStopNumber})` : ""}`
              : "● Em viagem"}
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-foreground mt-1 truncate">
            {passageiroNome}
          </h3>
          <span className="text-xs text-muted-foreground truncate block mt-0.5">
            {destinoEndereco}
          </span>
        </div>

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

          <div className="text-right">
            <div className="text-lg sm:text-xl font-extrabold text-foreground leading-none">
              {valorLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {distanciaKm} km • Repasse 100%
            </span>
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos de Navegação Externa (Waze & Google Maps) — Alvo de Toque 44px */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onNavegar("waze")}
          className="h-11 min-h-[44px] rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-200 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Compass className="w-4 h-4 text-sky-600" />
          <span>Waze</span>
        </button>
        <button
          type="button"
          onClick={() => onNavegar("google_maps")}
          className="h-11 min-h-[44px] rounded-2xl bg-muted text-foreground border border-border font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Google Maps</span>
        </button>
      </div>

      {/* Ações de Conclusão — Thumb Zone 56px Ergonomia Veicular com Proteção de Gesto */}
      {isEntrega ? (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {/* Exceção: Destinatário não localizado */}
            <button
              type="button"
              onClick={onOpenDevolucao}
              className="h-12 min-h-[48px] rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer text-center px-2 shadow-xs"
            >
              <UserX className="w-4 h-4 shrink-0 text-amber-700" />
              <span>Destinatário ausente</span>
            </button>

            {/* Normal: Finalizar com PIN 2 de Entrega */}
            <button
              type="button"
              onClick={onOpenPinNumpadDropoff}
              style={{
                backgroundColor: colors.primary,
                color: colors.surface,
              }}
              className="h-12 min-h-[48px] rounded-2xl font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer text-center px-2 hover:brightness-105"
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Digitar PIN 2</span>
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground font-medium text-center">
            Exige PIN de 4 dígitos do destinatário para repasse imediato
          </p>
        </div>
      ) : (
        <DriverSlideAction
          label="DESLIZE PARA CONCLUIR VIAGEM >>>"
          confirmedLabel="🏁 VIAGEM CONCLUÍDA COM SUCESSO"
          onConfirm={onConcluirCorrida}
          gradient="linear-gradient(90deg, #059669 0%, #10B981 100%)"
          className="shadow-xl"
        />
      )}
    </div>
  );
}
