import { MessageCircle, Compass, MapPin, KeyRound, UserX, RotateCcw, Package, CheckCircle2 } from "lucide-react";
import type { ReturnDetails } from "@/lib/delivery";

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
  // Caso de Devolução Reversa da Entrega
  if (isEntrega && emDevolucao) {
    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between border-b border-rose-100 pb-2">
          <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5 text-rose-600 animate-spin" />
            <span>Devolução ao remetente</span>
          </div>
          <span className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
            +R$ {returnDetails?.driverReturnCompensationBrl.toFixed(2) || "15,50"}
          </span>
        </div>

        <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-200 space-y-0.5 text-xs">
          <span className="text-[10px] font-black uppercase text-rose-900 block">
            Ponto de retorno:
          </span>
          <p className="font-extrabold text-slate-950 truncate">{destinoEndereco}</p>
          <p className="text-[11px] text-slate-600">
            Devolver para: <strong>{passageiroNome}</strong>
          </p>
        </div>

        {/* Navegação Externa para Devolução */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onNavegar("waze")}
            className="h-9 min-h-[36px] rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-200 font-semibold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span>Waze</span>
          </button>
          <button
            type="button"
            onClick={() => onNavegar("google_maps")}
            className="h-9 min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-primary-vibrant" />
            <span>Google Maps</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenReturnFinalizar}
          className="w-full h-11 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
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
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider inline-block bg-brand-soft text-brand-primary-deep border-brand-border-active">
            {isEntrega
              ? `● Entrega ${currentStopNumber > 1 ? `(Parada ${currentStopNumber})` : ""}`
              : "● Em viagem"}
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-950 mt-1 truncate">
            {passageiroNome}
          </h3>
          <span className="text-xs text-slate-500 truncate block mt-0.5">
            {destinoEndereco}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenChat}
            className="relative w-9.5 h-9.5 min-h-[38px] min-w-[38px] rounded-xl bg-brand-primary-vibrant text-slate-950 flex items-center justify-center active:scale-90 transition shadow-xs cursor-pointer"
            title="Abrir chat operacional"
            aria-label={`Abrir chat operacional${driverUnreadCount > 0 ? ` (${driverUnreadCount} não lidas)` : ""}`}
          >
            <MessageCircle className="w-4.5 h-4.5 text-slate-950" />
            {driverUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-bold border-2 border-white shadow-xs animate-pulse">
                {driverUnreadCount > 9 ? "9+" : driverUnreadCount}
              </span>
            )}
          </button>

          <div className="text-right">
            <div className="text-lg sm:text-xl font-extrabold text-brand-primary-deep leading-none">
              {valorLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <span className="text-[11px] font-bold text-brand-primary-vibrant">
              {distanciaKm} km • PIX D+0
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
          className="h-11 min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Google Maps</span>
        </button>
      </div>

      {/* Ações de Conclusão — Thumb Zone 56px Ergonomia Veicular */}
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
              className="h-12 min-h-[48px] rounded-2xl bg-brand-primary-vibrant hover:brightness-105 text-slate-950 font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer text-center px-2"
            >
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Digitar PIN 2</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 font-medium text-center">
            Exige PIN de 4 dígitos do destinatário para repasse D+0
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={onConcluirCorrida}
          className="w-full h-14 min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider"
        >
          <span>🏁 CONCLUIR VIAGEM COM SUCESSO</span>
        </button>
      )}
    </div>
  );
}
