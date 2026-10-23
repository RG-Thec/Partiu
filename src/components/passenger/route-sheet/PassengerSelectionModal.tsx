import React, { useState } from "react";
import { NativeBottomSheet, NativeSurface, NativeButton } from "@/components/native";
import { rideForThirdPartyEngine } from "@/lib/passenger/ride-for-third-party-engine";
import { ShieldCheck, User, Users } from "lucide-react";

export interface PassengerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  viajanteOutraPessoa: boolean;
  setViajanteOutraPessoa: (val: boolean) => void;
  nomeOutroPassageiro: string;
  setNomeOutroPassageiro: (val: string) => void;
  telefoneOutroPassageiro: string;
  setTelefoneOutroPassageiro: (val: string) => void;
  colors?: any;
}

export function PassengerSelectionModal({
  isOpen,
  onClose,
  viajanteOutraPessoa,
  setViajanteOutraPessoa,
  nomeOutroPassageiro,
  setNomeOutroPassageiro,
  telefoneOutroPassageiro,
  setTelefoneOutroPassageiro,
  colors = {},
}: PassengerSelectionModalProps) {
  const textColor = colors.textPrimary || "#0F172A";
  const secondaryTextColor = colors.textSecondary || "#64748B";
  const [validationError, setValidationError] = useState<string | null>(null);

  const handlePhoneChange = (val: string) => {
    setValidationError(null);
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) {
      setTelefoneOutroPassageiro(digits ? `(${digits}` : "");
    } else if (digits.length <= 6) {
      setTelefoneOutroPassageiro(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else if (digits.length <= 10) {
      setTelefoneOutroPassageiro(
        `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`,
      );
    } else {
      setTelefoneOutroPassageiro(
        `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`,
      );
    }
  };

  const handleSaveAndClose = () => {
    if (viajanteOutraPessoa) {
      const check = rideForThirdPartyEngine.validateGuestRider(
        nomeOutroPassageiro,
        telefoneOutroPassageiro,
      );
      if (!check.isValid) {
        setValidationError(check.error || "Verifique os dados informados.");
        return;
      }
    }
    setValidationError(null);
    onClose();
  };

  return (
    <NativeBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Quem vai viajar?"
      subtitle="Escolha se a viagem é para você ou para outra pessoa"
      showDragHandle
      showCloseButton
    >
      <div className="space-y-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <NativeButton
            variant={!viajanteOutraPessoa ? "filled" : "tonal"}
            size="md"
            onClick={() => {
              setViajanteOutraPessoa(false);
              setValidationError(null);
            }}
          >
            <div className="flex items-center gap-1.5 justify-center">
              <User className="w-4 h-4" />
              <span>Para mim</span>
            </div>
          </NativeButton>

          <NativeButton
            variant={viajanteOutraPessoa ? "filled" : "tonal"}
            size="md"
            onClick={() => {
              setViajanteOutraPessoa(true);
              setValidationError(null);
            }}
          >
            <div className="flex items-center gap-1.5 justify-center">
              <Users className="w-4 h-4" />
              <span>Outra pessoa</span>
            </div>
          </NativeButton>
        </div>

        {viajanteOutraPessoa && (
          <div className="space-y-3 pt-1">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider block mb-1.5"
                style={{ color: secondaryTextColor }}
              >
                Nome de quem vai embarcar
              </label>
              <input
                type="text"
                value={nomeOutroPassageiro}
                onChange={(e) => {
                  setNomeOutroPassageiro(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Exemplo: Maria Silva"
                className="w-full text-xs sm:text-sm font-medium min-h-[48px] px-4 rounded-xl border focus:outline-hidden"
                style={{
                  backgroundColor: colors.inputBackground,
                  color: textColor,
                  borderColor: colors.inputBorder,
                }}
                autoFocus
              />
            </div>

            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider block mb-1.5"
                style={{ color: secondaryTextColor }}
              >
                Celular com WhatsApp
              </label>
              <input
                type="tel"
                value={telefoneOutroPassageiro}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(82) 99999-9999"
                className="w-full text-xs sm:text-sm font-medium min-h-[48px] px-4 rounded-xl border focus:outline-hidden"
                style={{
                  backgroundColor: colors.inputBackground,
                  color: textColor,
                  borderColor: colors.inputBorder,
                }}
              />
            </div>

            {validationError && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                {validationError}
              </p>
            )}

            <NativeSurface
              elevation={1}
              padding="sm"
              className="text-xs font-medium text-slate-700 dark:text-slate-300 space-y-1"
            >
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Embarque seguro com código PIN</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                O motorista saberá quem vai embarcar e você poderá enviar o rastreamento ao vivo com
                placa, modelo do carro e código PIN no WhatsApp.
              </p>
            </NativeSurface>
          </div>
        )}

        <div className="pt-2">
          <NativeButton variant="filled" size="md" fullWidth onClick={handleSaveAndClose}>
            Salvar
          </NativeButton>
        </div>
      </div>
    </NativeBottomSheet>
  );
}
