import {
  Star,
  ShieldCheck,
  MessageCircle,
  Phone,
  KeyRound,
  UserX,
  CheckCircle2,
  ChevronRight,
  Users,
  Clock,
  Check,
} from "lucide-react";
import type { WaitingTimerStatus } from "@/lib/partiu-engine";
import { DriverSlideAction } from "../DriverSlideAction";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { InlineQuickReplyBar } from "@/components/chat";

interface WaitingPassengerStateProps {
  rideId?: string;
  driverId?: string;
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
  isForOtherPerson?: boolean;
  otherPersonName?: string;
  otherPersonPhone?: string;
  solicitanteNome?: string;
  exigePinEmbarque?: boolean;
  onOpenPassengerPin?: () => void;
  onConfirmarEmbarque: () => void;
  onOpenPinNumpad: () => void;
  onOpenNoShowModal: () => void;
  onOpenChat: () => void;
  onLigar: () => void;
  onOpenCancelar: () => void;
}

export function WaitingPassengerState({
  rideId,
  driverId,
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
  isForOtherPerson = false,
  otherPersonName,
  otherPersonPhone,
  solicitanteNome,
  exigePinEmbarque = false,
  onOpenPassengerPin,
  onConfirmarEmbarque,
  onOpenPinNumpad,
  onOpenNoShowModal,
  onOpenChat,
  onLigar,
  onOpenCancelar,
}: WaitingPassengerStateProps) {
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  const displayPassengerName = isForOtherPerson ? otherPersonName || passageiroNome : passageiroNome;

  return (
    <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Cabeçalho do Estado */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
        <div
          className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider"
          style={{ color: colors.primary }}
        >
          <CheckCircle2 className="w-4.5 h-4.5" style={{ color: colors.primary }} />
          <span>{isEntrega ? "Coleta" : "Aguardando embarque"}</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
          <Check className="w-3 h-3 stroke-[2.5]" />
          <span>No local</span>
        </span>
      </div>

      {/* Alerta de Corrida para Terceiro */}
      {isForOtherPerson && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-extrabold block truncate">
                Passageiro no local: {displayPassengerName}
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block truncate">
                Solicitado por {solicitanteNome || "Titular da conta"}
              </span>
            </div>
          </div>
          {otherPersonPhone && (
            <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200 shrink-0">
              {otherPersonPhone}
            </span>
          )}
        </div>
      )}

      {/* Perfil do Passageiro / Detalhes de Encomenda */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-muted/40 border border-border">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            {passageiroFoto ? (
              <img
                src={passageiroFoto}
                alt={displayPassengerName}
                className="w-11 h-11 rounded-full object-cover border-2 shadow-xs"
                style={{ borderColor: colors.primary }}
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full font-bold text-sm flex items-center justify-center border-2 shadow-xs text-white"
                style={{ backgroundColor: colors.primary, borderColor: colors.primary }}
              >
                {displayPassengerName.charAt(0)}
              </div>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-slate-950 flex items-center justify-center border border-white shadow-xs"
              style={{ backgroundColor: colors.secondary || colors.primary }}
            >
              <Check className="w-2 h-2 stroke-[3]" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground truncate">
                {displayPassengerName}
              </h3>
              <span
                className="text-xs font-bold flex items-center gap-0.5"
                style={{ color: colors.primary }}
              >
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {passageiroAvaliacao.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 flex-wrap font-medium">
              <span
                className="font-semibold px-1 py-0.2 rounded text-[10px]"
                style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
              >
                {isForOtherPerson ? "Passageiro convidado" : "CPF verificado"}
              </span>
              <span>•</span>
              <span>{passageiroTotalCorridas} viagens</span>
            </div>
          </div>
        </div>

        {/* Botões de Contato Rápido — Ergonomia Veicular 44px */}
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

      {/* Respostas Rápidas Hands-Free no Ponto de Embarque */}
      {rideId && (
        <InlineQuickReplyBar
          rideId={rideId}
          senderType="DRIVER"
          senderId={driverId || "driver_cockpit"}
          rideStatus="CHEGOU"
          onOpenFullChat={onOpenChat}
          unreadCount={driverUnreadCount}
        />
      )}

      {/* Resumo do Destino Confirmado */}
      <div className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between text-xs">
        <div className="truncate pr-2">
          <span className="text-xs text-muted-foreground font-bold block uppercase tracking-wider">
            {isEntrega ? "Destino da Entrega:" : "Destino do Passageiro:"}
          </span>
          <span className="font-bold text-foreground truncate block mt-0.5">{destinoEndereco}</span>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-black text-foreground block">{distanciaKm} km</span>
          <span className="text-xs font-bold" style={{ color: colors.primary }}>
            {isEntrega ? "Flash Express" : "Embarque Confirmado"}
          </span>
        </div>
      </div>

      {/* Cronômetro de Espera e Carência Auditada */}
      {waitingTimerStatus && (
        <div
          className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            waitingTimerStatus.isGracePeriodActive
              ? "bg-muted/40 text-muted-foreground border-border"
              : "bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/30"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              Espera: {Math.floor(waitingTimerStatus.elapsedSeconds / 60)}:
              {(waitingTimerStatus.elapsedSeconds % 60).toString().padStart(2, "0")}
              {waitingTimerStatus.isGracePeriodActive
                ? " (Carência de 5 min)"
                : " (Tarifação excedente ativa)"}
            </span>
          </div>
          <span className="font-black shrink-0">
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
          className="w-full h-11 min-h-[44px] rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-rose-700 animate-in fade-in"
        >
          <UserX className="w-4 h-4" />
          <span>Ausente • Cobrar taxa de carência</span>
        </button>
      )}

      {/* Ação Primária de Embarque — Thumb Zone 56px com Proteção de Gesto */}
      {isEntrega ? (
        <button
          type="button"
          onClick={onOpenPinNumpad}
          style={{
            backgroundColor: colors.primary,
            color: colors.surface,
          }}
          className="w-full h-14 min-h-[56px] rounded-2xl font-black text-sm sm:text-base shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider hover:brightness-105"
        >
          <KeyRound className="w-5 h-5" />
          <span>DIGITAR PIN DE COLETA</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : exigePinEmbarque ? (
        <button
          type="button"
          onClick={onOpenPassengerPin || onOpenPinNumpad}
          style={{
            backgroundColor: colors.primary,
            color: colors.surface,
          }}
          className="w-full h-14 min-h-[56px] rounded-2xl font-black text-sm sm:text-base shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider hover:brightness-105"
        >
          <KeyRound className="w-5 h-5" />
          <span>DIGITAR PIN DO PASSAGEIRO</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <div className="space-y-2">
          <DriverSlideAction
            label="DESLIZE PARA INICIAR VIAGEM >>>"
            confirmedLabel="VIAGEM INICIADA"
            onConfirm={onConfirmarEmbarque}
            gradient={`linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary || colors.primary} 100%)`}
            className="shadow-lg"
          />
          {onOpenPassengerPin && (
            <button
              type="button"
              onClick={onOpenPassengerPin}
              className="w-full min-h-[44px] py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Verificar PIN de segurança</span>
            </button>
          )}
        </div>
      )}

      {/* Rodapé com Embarque Protegido e Cancelamento */}
      <div className="flex items-center justify-between pt-1 text-xs px-1">
        <span
          className="font-bold flex items-center gap-1.5 text-[11px]"
          style={{ color: colors.primary }}
        >
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: colors.primary }} />
          Embarque protegido
        </span>

        <button
          type="button"
          onClick={onOpenCancelar}
          className="font-bold text-muted-foreground hover:text-rose-600 transition cursor-pointer min-h-[44px] flex items-center justify-center px-2 text-[11px]"
        >
          Cancelar corrida
        </button>
      </div>
    </div>
  );
}
