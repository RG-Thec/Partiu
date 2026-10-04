import { Star, ShieldCheck, MessageCircle, Phone, KeyRound, UserX, CheckCircle2, ChevronRight } from "lucide-react";
import type { WaitingTimerStatus } from "@/lib/partiu-engine";

interface WaitingPassengerStateProps {
  passageiroNome: string;
  passageiroFoto?: string | undefined;
  passageiroAvaliacao?: number | undefined;
  passageiroTotalCorridas?: number | undefined;
  passageiroTrustTier?: string | undefined;
  destinoEndereco: string;
  distanciaKm: number;
  isEntrega: boolean;
  descricaoPacote?: string | undefined;
  waitingTimerStatus: WaitingTimerStatus | null;
  driverUnreadCount: number;
  erroPin?: string | undefined;
  onConfirmarEmbarque: () => void;
  onOpenPinNumpad: () => void;
  onOpenNoShowModal: () => void;
  onOpenChat: () => void;
  onLigar: () => void;
  onOpenCancelar: () => void;
}

export function WaitingPassengerState({
  passageiroNome,
  passageiroFoto,
  passageiroAvaliacao = 4.98,
  passageiroTotalCorridas = 48,
  passageiroTrustTier = "Elite",
  destinoEndereco,
  distanciaKm,
  isEntrega,
  descricaoPacote,
  waitingTimerStatus,
  driverUnreadCount,
  erroPin,
  onConfirmarEmbarque,
  onOpenPinNumpad,
  onOpenNoShowModal,
  onOpenChat,
  onLigar,
  onOpenCancelar,
}: WaitingPassengerStateProps) {
  return (
    <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Cabeçalho do Estado */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-brand-primary-deep">
          <CheckCircle2 className="w-4 h-4 text-brand-primary-vibrant" />
          <span>{isEntrega ? "Coleta" : "Aguardando embarque"}</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
          No local ✓
        </span>
      </div>

      {/* Perfil do Passageiro / Detalhes de Encomenda */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            {passageiroFoto ? (
              <img
                src={passageiroFoto}
                alt={passageiroNome}
                className="w-10 h-10 rounded-full object-cover border-2 border-brand-primary-vibrant shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center border-2 border-brand-primary-vibrant shadow-xs bg-brand-soft text-brand-primary-deep">
                {passageiroNome.charAt(0)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-slate-950 flex items-center justify-center text-[8px] font-bold border border-white shadow-xs bg-brand-primary-vibrant">
              ✓
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-950 truncate">{passageiroNome}</h3>
              <span className="text-xs font-bold flex items-center gap-0.5 text-brand-primary-deep">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {passageiroAvaliacao.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5 flex-wrap font-medium">
              <span className="font-semibold px-1 py-0.2 rounded bg-brand-soft text-brand-primary-deep text-[10px]">
                CPF verificado
              </span>
              <span>•</span>
              <span className="text-slate-500">{passageiroTotalCorridas} viagens</span>
            </div>
          </div>
        </div>

        {/* Botões de Contato Rápido */}
        <div className="flex items-center gap-1.5 shrink-0">
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
          <button
            type="button"
            onClick={onLigar}
            className="w-9.5 h-9.5 min-h-[38px] min-w-[38px] rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center active:scale-90 transition shadow-xs hover:bg-slate-200 cursor-pointer"
            title="Ligar para o passageiro"
            aria-label="Ligar para o passageiro"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Resumo do Destino Confirmado */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between text-xs">
        <div className="truncate pr-2">
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">
            {isEntrega ? "Destino da Entrega:" : "Destino do Passageiro:"}
          </span>
          <span className="font-bold text-slate-900 truncate block mt-0.5">{destinoEndereco}</span>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-black text-slate-950 block">{distanciaKm} km</span>
          <span className="text-xs font-bold text-brand-primary-vibrant">
            {isEntrega ? "Flash Express" : "Embarque Smart"}
          </span>
        </div>
      </div>

      {/* Cronômetro de Espera e Carência Auditada */}
      {waitingTimerStatus && (
        <div
          className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            waitingTimerStatus.isGracePeriodActive
              ? "bg-slate-50 text-slate-700 border-slate-200"
              : "bg-amber-50 text-amber-950 border-amber-200"
          }`}
        >
          <span>
            ⏱️ Espera: {Math.floor(waitingTimerStatus.elapsedSeconds / 60)}:
            {(waitingTimerStatus.elapsedSeconds % 60).toString().padStart(2, "0")}
            {waitingTimerStatus.isGracePeriodActive
              ? " (Carência de 5 min)"
              : " (Tarifação excedente ativa)"}
          </span>
          <span className="font-black">
            {waitingTimerStatus.accumulatedWaitingFeeCents > 0
              ? `+R$ ${(waitingTimerStatus.accumulatedWaitingFeeCents / 100).toFixed(2)}`
              : "Sem cobrança"}
          </span>
        </div>
      )}

      {erroPin && <p className="text-xs text-rose-600 font-bold text-center">{erroPin}</p>}

      {/* Botão de No-Show Operacional (Caso a carência de 5 min expire) */}
      {waitingTimerStatus && !waitingTimerStatus.isGracePeriodActive && (
        <button
          type="button"
          onClick={onOpenNoShowModal}
          className="w-full h-10 min-h-[40px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-rose-700 animate-in fade-in"
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Ausente • Cobrar R$ 4,50</span>
        </button>
      )}

      {/* Ação Primária de Embarque */}
      {isEntrega ? (
        <button
          type="button"
          onClick={onOpenPinNumpad}
          className="w-full h-11 min-h-[44px] rounded-xl bg-brand-primary-vibrant text-slate-950 font-bold text-xs sm:text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
        >
          <KeyRound className="w-4 h-4" />
          <span>Digitar PIN de coleta</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onConfirmarEmbarque}
          className="w-full h-11 min-h-[44px] rounded-xl bg-gradient-to-r from-brand-primary-vibrant to-brand-primary-deep text-slate-950 font-bold text-xs sm:text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
        >
          <span>Iniciar corrida</span>
          <span>✓</span>
        </button>
      )}

      {/* Rodapé com Embarque Protegido e Cancelamento */}
      <div className="flex items-center justify-between pt-1 text-xs px-1">
        <span className="font-bold flex items-center gap-1.5 text-brand-primary-deep text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-primary-vibrant" />
          Embarque protegido
        </span>

        <button
          type="button"
          onClick={onOpenCancelar}
          className="font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer py-1 text-[11px]"
        >
          Cancelar corrida
        </button>
      </div>
    </div>
  );
}
