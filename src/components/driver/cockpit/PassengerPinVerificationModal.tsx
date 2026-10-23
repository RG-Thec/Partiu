/**
 * ==============================================================================
 * 🔐 PARTIU MOTORISTA — PASSENGER PIN VERIFICATION MODAL (v1.0)
 * ==============================================================================
 * Modal com teclado numérico tátil integrado (56px) para digitação rápida do
 * código PIN de segurança de 4 dígitos informado pelo passageiro no embarque.
 *
 * Características:
 * - 4 slots numéricos em alto contraste (WCAG AAA)
 * - Numpad integrado in-app sem sobreposição do teclado nativo do sistema
 * - Validação automática ao inserir o 4º dígito
 * - Animação de erro e rate-limiting (3 tentativas -> bloqueio de 5 min)
 * ==============================================================================
 */

import React, { useState, useEffect, memo, useCallback } from "react";
import {
  KeyRound,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Delete,
  User,
  Users,
} from "lucide-react";
import { boardingPinEngine } from "@/lib/security/boarding-pin-engine";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";
import { useBrandTheme } from "@/hooks/useBrandTheme";

export interface PassengerPinVerificationModalProps {
  isOpen: boolean;
  rideId: string;
  passageiroNome: string;
  expectedPin: string;
  isForOtherPerson?: boolean;
  otherPersonName?: string;
  solicitanteNome?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PassengerPinVerificationModal = memo(function PassengerPinVerificationModal({
  isOpen,
  rideId,
  passageiroNome,
  expectedPin,
  isForOtherPerson = false,
  otherPersonName,
  solicitanteNome,
  onSuccess,
  onCancel,
}: PassengerPinVerificationModalProps) {
  const { corPrimaria, corSecundaria } = useBrandTheme();
  const [digits, setDigits] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [lockedSeconds, setLockedSeconds] = useState<number>(0);

  // Monitora e decrementa bloqueio por força bruta
  useEffect(() => {
    if (!isOpen) return;
    const { isLocked, remainingSeconds } = boardingPinEngine.isLocked(rideId);
    let timer: NodeJS.Timeout | null = null;
    if (isLocked) {
      setLockedSeconds(remainingSeconds);
      timer = setInterval(() => {
        const check = boardingPinEngine.isLocked(rideId);
        if (check.isLocked) {
          setLockedSeconds(check.remainingSeconds);
        } else {
          setLockedSeconds(0);
          if (timer) clearInterval(timer);
        }
      }, 1000);
    } else {
      setLockedSeconds(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, rideId]);

  // Reseta campos ao abrir
  useEffect(() => {
    if (isOpen) {
      setDigits("");
      setErrorMessage(null);
      setIsShaking(false);
    }
  }, [isOpen]);

  const handlePressDigit = useCallback(
    (num: string) => {
      if (digits.length >= 4 || isValidating || lockedSeconds > 0) return;
      hapticFeedback.light();
      const nextDigits = digits + num;
      setDigits(nextDigits);
      setErrorMessage(null);

      if (nextDigits.length === 4) {
        setIsValidating(true);
        setTimeout(() => {
          const res = boardingPinEngine.verifyBoardingPin(rideId, nextDigits, expectedPin);
          if (res.success) {
            hapticFeedback.success();
            setIsValidating(false);
            onSuccess();
          } else {
            hapticFeedback.error();
            setIsValidating(false);
            setErrorMessage(res.message);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            if (res.isLocked && res.remainingSeconds) {
              setLockedSeconds(res.remainingSeconds);
            }
            setDigits("");
          }
        }, 150);
      }
    },
    [digits, isValidating, lockedSeconds, rideId, expectedPin, onSuccess],
  );

  const handleBackspace = useCallback(() => {
    if (digits.length === 0 || isValidating || lockedSeconds > 0) return;
    hapticFeedback.light();
    setDigits((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  }, [digits, isValidating, lockedSeconds]);

  const handleClear = useCallback(() => {
    if (isValidating || lockedSeconds > 0) return;
    hapticFeedback.light();
    setDigits("");
    setErrorMessage(null);
  }, [isValidating, lockedSeconds]);

  if (!isOpen) return null;

  const displayRiderName = isForOtherPerson ? otherPersonName || passageiroNome : passageiroNome;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col text-left">
        {/* Header do Modal */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs"
              style={{ backgroundColor: corPrimaria || "#0088FF" }}
            >
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="pin-modal-title"
                className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate"
              >
                Código PIN de Embarque
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate block">
                Solicite os 4 números ao passageiro
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar validação de PIN"
            className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer active:scale-90"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Informações do Passageiro */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {isForOtherPerson ? (
              <Users className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <User className="w-4 h-4 text-primary shrink-0" />
            )}
            <div className="min-w-0 truncate">
              <span className="font-bold text-slate-900 dark:text-white block truncate">
                {displayRiderName}
              </span>
              {isForOtherPerson && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block truncate">
                  Pedido por {solicitanteNome || "Titular"}
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
            Segurança ativa
          </span>
        </div>

        {/* Caixas de Dígitos OTP */}
        <div className="p-4 flex flex-col items-center">
          <div
            className={`grid grid-cols-4 gap-3 w-full max-w-[260px] my-2 transition-transform ${
              isShaking ? "animate-shake" : ""
            }`}
          >
            {[0, 1, 2, 3].map((idx) => {
              const char = digits[idx];
              const isFilled = Boolean(char);
              return (
                <div
                  key={idx}
                  className={`h-14 rounded-2xl flex items-center justify-center text-2xl font-black font-mono transition-all border-2 ${
                    isFilled
                      ? "border-primary bg-primary/10 text-slate-900 dark:text-white shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-400"
                  } ${errorMessage ? "!border-rose-500 !bg-rose-50 dark:!bg-rose-950/30" : ""}`}
                >
                  {char || "•"}
                </div>
              );
            })}
          </div>

          {/* Mensagem de Erro ou Bloqueio */}
          {lockedSeconds > 0 ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 mt-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-center">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Entrada bloqueada por mais {lockedSeconds} segundos</span>
            </div>
          ) : errorMessage ? (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 text-center mt-2 px-2 animate-in fade-in">
              {errorMessage}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2">
              Digite o código que o passageiro visualiza na tela dele
            </p>
          )}
        </div>

        {/* Numpad Veicular Tátil (56px) */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700/60">
          <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePressDigit(num)}
                disabled={lockedSeconds > 0 || isValidating}
                className="h-14 rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xl font-black shadow-xs border border-slate-200/80 dark:border-slate-600 active:scale-95 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              disabled={lockedSeconds > 0 || isValidating}
              className="h-14 rounded-2xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold active:scale-95 transition cursor-pointer disabled:opacity-40"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => handlePressDigit("0")}
              disabled={lockedSeconds > 0 || isValidating}
              className="h-14 rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xl font-black shadow-xs border border-slate-200/80 dark:border-slate-600 active:scale-95 hover:bg-slate-50 transition cursor-pointer disabled:opacity-40"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={lockedSeconds > 0 || isValidating}
              aria-label="Apagar dígito"
              className="h-14 rounded-2xl bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center active:scale-95 transition cursor-pointer disabled:opacity-40"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
