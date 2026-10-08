import { OfflineState } from "./states/OfflineState";
import { IdleState } from "./states/IdleState";
import { HeadingToPickupState } from "./states/HeadingToPickupState";
import { WaitingPassengerState } from "./states/WaitingPassengerState";
import { InTripState } from "./states/InTripState";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import type { DriverDestination } from "@/services/DriverDestinationModeService";
import type { WaitingTimerStatus } from "@/lib/partiu-engine";
import type { ReturnDetails } from "@/lib/delivery";

export interface DriverContextualBottomSheetProps {
  isOnline: boolean;
  estadoCockpit: "IDLE" | "OFFER" | "HEADING_TO_PICKUP" | "WAITING_PIN" | "IN_PROGRESS";
  ganhosHoje: number;
  corridasFeitas: number;
  destinoAtivo: DriverDestination | null;
  remainingDestinationUses: number;
  ofertaAtiva: any | null;
  waitingTimerStatus: WaitingTimerStatus | null;
  driverUnreadCount: number;
  emDevolucao: boolean;
  returnDetails: ReturnDetails | null;
  currentStopNumber: number;
  erroPin?: string | undefined;

  diariaRestanteTexto?: string;

  // Callbacks
  onToggleOnline: () => void;
  onOpenProfile: () => void;
  onOpenWallet: () => void;
  onOpenSaquePix: () => void;
  onOpenFinancialDashboard?: () => void;
  onOpenModoDestino: () => void;
  onClearDestino: () => void;
  onOpenTaximetro: () => void;
  onOpenEconomia: () => void;
  onOpenPlanos: () => void;
  onChegueiAoLocal: () => void;
  onConfirmarEmbarque: () => void;
  onOpenPinNumpad: () => void;
  onOpenPinNumpadDropoff: () => void;
  onOpenNoShowModal: () => void;
  onOpenCancelar: () => void;
  onConcluirCorrida: () => void;
  onOpenDevolucao: () => void;
  onOpenReturnFinalizar: () => void;
  onOpenChat: () => void;
  onLigar: () => void;
  onNavegar: (provedor: "waze" | "google_maps") => void;
}

export function DriverContextualBottomSheet({
  isOnline,
  estadoCockpit,
  ganhosHoje,
  corridasFeitas,
  destinoAtivo,
  remainingDestinationUses,
  ofertaAtiva,
  waitingTimerStatus,
  driverUnreadCount,
  emDevolucao,
  returnDetails,
  currentStopNumber,
  erroPin,
  diariaRestanteTexto,
  onToggleOnline,
  onOpenProfile,
  onOpenWallet,
  onOpenSaquePix,
  onOpenFinancialDashboard,
  onOpenModoDestino,
  onClearDestino,
  onOpenTaximetro,
  onOpenEconomia,
  onOpenPlanos,
  onChegueiAoLocal,
  onConfirmarEmbarque,
  onOpenPinNumpad,
  onOpenPinNumpadDropoff,
  onOpenNoShowModal,
  onOpenCancelar,
  onConcluirCorrida,
  onOpenDevolucao,
  onOpenReturnFinalizar,
  onOpenChat,
  onLigar,
  onNavegar,
}: DriverContextualBottomSheetProps) {
  const { appConfig } = useTheme();
  const { ui } = appConfig.branding;

  // Se houver uma oferta ativa no radar ("OFFER"), o DriverOfferModal sobrepõe na tela
  if (estadoCockpit === "OFFER") {
    return null;
  }

  const isEntrega = Boolean(ofertaAtiva?.tipo === "ENTREGA");

  return (
    <div
      data-hide-bottom-nav="true"
      className="absolute bottom-0 inset-x-0 z-30 pb-[max(1rem,env(safe-area-inset-bottom))] px-3 sm:px-4 max-w-lg mx-auto pointer-events-auto"
    >
      <div
        style={{ borderRadius: ui.borderRadius }}
        className="p-3.5 sm:p-5 bg-card/98 backdrop-blur-md border border-border shadow-[0_16px_50px_rgba(0,0,0,0.18)] space-y-2.5 max-h-[85dvh] overflow-y-auto scrollbar-none"
      >
        {/* Barra tátil superior de puxar (Drag handle) */}
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-1" />

        {/* 1. ESTADO OFFLINE */}
        {!isOnline && (
          <OfflineState
            onToggleOnline={onToggleOnline}
            onOpenProfile={onOpenProfile}
            onOpenWallet={onOpenWallet}
          />
        )}

        {/* 2. ESTADO ONLINE / AGUARDANDO NO TRIP RADAR */}
        {isOnline && estadoCockpit === "IDLE" && (
          <IdleState
            ganhosHoje={ganhosHoje}
            corridasFeitas={corridasFeitas}
            destinoAtivo={destinoAtivo}
            remainingDestinationUses={remainingDestinationUses}
            diariaRestanteTexto={diariaRestanteTexto}
            onToggleOnline={onToggleOnline}
            onOpenSaquePix={onOpenSaquePix}
            onOpenFinancialDashboard={onOpenFinancialDashboard}
            onOpenModoDestino={onOpenModoDestino}
            onClearDestino={onClearDestino}
            onOpenTaximetro={onOpenTaximetro}
            onOpenEconomia={onOpenEconomia}
            onOpenPlanos={onOpenPlanos}
          />
        )}

        {/* 3. ESTADO A CAMINHO DO EMBARQUE */}
        {isOnline && estadoCockpit === "HEADING_TO_PICKUP" && ofertaAtiva && (
          <HeadingToPickupState
            passageiroNome={ofertaAtiva.passageiro}
            origemEndereco={ofertaAtiva.origem}
            isEntrega={isEntrega}
            driverUnreadCount={driverUnreadCount}
            onChegueiAoLocal={onChegueiAoLocal}
            onOpenChat={onOpenChat}
            onLigar={onLigar}
            onNavegar={onNavegar}
            onOpenCancelar={onOpenCancelar}
          />
        )}

        {/* 4. ESTADO CHEGOU / AGUARDANDO EMBARQUE */}
        {isOnline && estadoCockpit === "WAITING_PIN" && ofertaAtiva && (
          <WaitingPassengerState
            passageiroNome={ofertaAtiva.passageiro}
            passageiroFoto={ofertaAtiva.passageiroFoto}
            passageiroAvaliacao={ofertaAtiva.passageiroAvaliacao}
            passageiroTotalCorridas={ofertaAtiva.passageiroTotalCorridas}
            passageiroTrustTier={ofertaAtiva.passageiroTrustTier}
            destinoEndereco={ofertaAtiva.destino}
            distanciaKm={ofertaAtiva.distanciaKm}
            isEntrega={isEntrega}
            descricaoPacote={ofertaAtiva.descricaoPacote}
            waitingTimerStatus={waitingTimerStatus}
            driverUnreadCount={driverUnreadCount}
            erroPin={erroPin}
            onConfirmarEmbarque={onConfirmarEmbarque}
            onOpenPinNumpad={onOpenPinNumpad}
            onOpenNoShowModal={onOpenNoShowModal}
            onOpenChat={onOpenChat}
            onLigar={onLigar}
            onOpenCancelar={onOpenCancelar}
          />
        )}

        {/* 5. ESTADO VIAGEM EM ANDAMENTO */}
        {isOnline && estadoCockpit === "IN_PROGRESS" && ofertaAtiva && (
          <InTripState
            passageiroNome={
              isEntrega && ofertaAtiva.destinatarioNome
                ? ofertaAtiva.destinatarioNome
                : ofertaAtiva.passageiro
            }
            destinoEndereco={emDevolucao ? ofertaAtiva.origem : ofertaAtiva.destino}
            distanciaKm={ofertaAtiva.distanciaKm}
            valorLiquido={ofertaAtiva.valorLiquido}
            isEntrega={isEntrega}
            emDevolucao={emDevolucao}
            returnDetails={returnDetails}
            currentStopNumber={currentStopNumber}
            driverUnreadCount={driverUnreadCount}
            onConcluirCorrida={onConcluirCorrida}
            onOpenPinNumpadDropoff={onOpenPinNumpadDropoff}
            onOpenDevolucao={onOpenDevolucao}
            onOpenReturnFinalizar={onOpenReturnFinalizar}
            onOpenChat={onOpenChat}
            onNavegar={onNavegar}
          />
        )}
      </div>
    </div>
  );
}
