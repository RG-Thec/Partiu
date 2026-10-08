import React from "react";
import { AlertTriangle, X, Phone, MessageCircle, Bell, RotateCcw, CheckCircle2 } from "lucide-react";
import type { RecipientWaitStatus, ReturnDetails } from "@/lib/delivery";

export interface DriverDeliveryModalsProps {
  modalDevolucaoAberto: boolean;
  waitStatus: RecipientWaitStatus | null;
  onCloseDevolucao: () => void;
  onRegistrarContato: (canal: "CALL" | "MESSAGE" | "BUZZER") => void;
  onIniciarDevolucao: () => void;

  modalReturnFinalizarAberto: boolean;
  returnDetails: ReturnDetails | null;
  onCloseReturnFinalizar: () => void;
  pinDevolucaoDigitado: string;
  setPinDevolucaoDigitado: (val: string) => void;
  erroPinDevolucao: string;
  fotoDevolucaoUrl: string;
  onConcluirDevolucao: () => void;

  corPrimaria?: string;
  brandGradient?: string;
  corTextoPrimaria?: string;
}

export function DriverDeliveryModals({
  modalDevolucaoAberto,
  waitStatus,
  onCloseDevolucao,
  onRegistrarContato,
  onIniciarDevolucao,

  modalReturnFinalizarAberto,
  returnDetails,
  onCloseReturnFinalizar,
  pinDevolucaoDigitado,
  setPinDevolucaoDigitado,
  erroPinDevolucao,
  fotoDevolucaoUrl,
  onConcluirDevolucao,

  corPrimaria,
  brandGradient,
  corTextoPrimaria,
}: DriverDeliveryModalsProps) {
  return (
    <>
      {/* MODAL: DESTINATÁRIO AUSENTE / PROTOCOLO DE DEVOLUÇÃO */}
      {modalDevolucaoAberto && waitStatus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-5 max-w-sm w-full space-y-4 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-200 text-foreground pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-foreground">Destinatário Não Localizado</h3>
              </div>
              <button
                type="button"
                onClick={onCloseDevolucao}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cronômetro de Carência Obrigatória (5 minutos / 300s) */}
            <div
              className="p-3.5 border rounded-2xl text-center space-y-1"
              style={{
                backgroundColor: corPrimaria ? `${corPrimaria}0D` : undefined,
                borderColor: corPrimaria ? `${corPrimaria}30` : undefined,
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: corPrimaria }}>
                Tolerância Obrigatória de Espera
              </span>
              <div className="text-3xl font-mono font-black" style={{ color: corPrimaria }}>
                {Math.floor(waitStatus.elapsedSeconds / 60).toString().padStart(2, "0")}:
                {(waitStatus.elapsedSeconds % 60).toString().padStart(2, "0")}{" "}
                <span className="text-xs font-sans font-bold text-muted-foreground">/ 05:00 min</span>
              </div>
              <p className="text-xs text-foreground font-medium">
                {waitStatus.canInitiateReturn
                  ? "✓ Tolerância e tentativas cumpridas! Devolução liberada."
                  : "Aguarde e tente contatar o destinatário antes de devolver."}
              </p>
            </div>

            {/* Botões de Tentativa de Contato Obrigatório */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Registre suas tentativas de contato:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onRegistrarContato("CALL")}
                  className="p-2.5 border rounded-xl bg-muted/40 text-foreground font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Ligação</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRegistrarContato("MESSAGE")}
                  className="p-2.5 border rounded-xl bg-muted/40 text-foreground font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRegistrarContato("BUZZER")}
                  className="p-2.5 border rounded-xl bg-muted/40 text-foreground font-bold text-xs flex flex-col items-center gap-1 active:scale-95 transition cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Interfone</span>
                </button>
              </div>

              {waitStatus.contactAttempts.length > 0 && (
                <div className="text-[11px] font-semibold text-center pt-1 text-emerald-600">
                  ✓ {waitStatus.contactAttempts.length} tentativa(s) registrada(s) na auditoria.
                </div>
              )}
            </div>

            {/* Ação de Iniciar Devolução */}
            <div className="pt-2 border-t border-border space-y-2">
              <button
                type="button"
                onClick={onIniciarDevolucao}
                style={{
                  background: brandGradient,
                  color: corTextoPrimaria,
                }}
                className="w-full py-3.5 rounded-2xl font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>INICIAR DEVOLUÇÃO AO REMETENTE</span>
              </button>
              <button
                type="button"
                onClick={onCloseDevolucao}
                className="w-full py-2.5 rounded-xl bg-muted text-foreground font-bold text-xs hover:bg-muted/80 transition cursor-pointer"
              >
                Continuar Aguardando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FINALIZAÇÃO DA DEVOLUÇÃO NO REMETENTE */}
      {modalReturnFinalizarAberto && returnDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-5 max-w-sm w-full space-y-4 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-200 text-foreground pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-foreground">Confirmar Devolução</h3>
              </div>
              <button
                type="button"
                onClick={onCloseReturnFinalizar}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="p-3 border rounded-2xl text-xs space-y-1 text-foreground"
              style={{
                backgroundColor: corPrimaria ? `${corPrimaria}0D` : undefined,
                borderColor: corPrimaria ? `${corPrimaria}30` : undefined,
              }}
            >
              <span className="font-black block" style={{ color: corPrimaria }}>
                Remetente Presente no Local:
              </span>
              <p className="text-muted-foreground">
                Solicite o PIN de 4 dígitos ao remetente ou confirme a entrega do pacote de volta.
              </p>
              <p className="font-bold pt-1 text-emerald-600">
                Compensação Condutor: R$ {returnDetails.driverReturnCompensationBrl.toFixed(2)}
              </p>
            </div>

            {/* Input PIN Remetente */}
            <div className="space-y-1 text-center">
              <label className="text-xs font-bold text-muted-foreground block">
                PIN de Devolução (Dica: {returnDetails.returnOtpExpected}):
              </label>
              <input
                type="text"
                maxLength={4}
                value={pinDevolucaoDigitado}
                onChange={(e) => setPinDevolucaoDigitado(e.target.value)}
                placeholder={returnDetails.returnOtpExpected}
                className="w-36 mx-auto px-4 py-2.5 text-center font-mono font-black text-xl border rounded-xl bg-background text-foreground focus:outline-none tracking-widest"
              />
              {erroPinDevolucao && (
                <p className="text-xs text-destructive font-bold">{erroPinDevolucao}</p>
              )}
            </div>

            {/* Comprovante Fotográfico */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase block">
                Foto do Pacote Devolvido (POD):
              </span>
              <div className="h-28 w-full overflow-hidden border border-border rounded-xl relative">
                <img
                  src={fotoDevolucaoUrl}
                  alt="Comprovante de Devolução"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 px-2 py-0.5 bg-black/70 text-white rounded text-[9px] font-bold">
                  Foto Comprovada ✓
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onConcluirDevolucao}
              style={{
                background: brandGradient,
                color: corTextoPrimaria,
              }}
              className="w-full h-14 rounded-2xl font-black text-sm shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>FINALIZAR DEVOLUÇÃO &amp; RECEBER PIX D+0</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
