import React from "react";
import { NativeBottomSheet, NativeSurface, NativeButton } from "@/components/native";

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

  return (
    <NativeBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Quem vai embarcar?"
      subtitle="Escolha quem irá viajar"
      showDragHandle
      showCloseButton
    >
      <div className="space-y-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <NativeButton
            variant={!viajanteOutraPessoa ? "filled" : "tonal"}
            size="md"
            onClick={() => setViajanteOutraPessoa(false)}
          >
            Para mim
          </NativeButton>

          <NativeButton
            variant={viajanteOutraPessoa ? "filled" : "tonal"}
            size="md"
            onClick={() => setViajanteOutraPessoa(true)}
          >
            Outra pessoa
          </NativeButton>
        </div>

        {viajanteOutraPessoa && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: secondaryTextColor }}>
                Nome do passageiro
              </label>
              <input
                type="text"
                value={nomeOutroPassageiro}
                onChange={(e) => setNomeOutroPassageiro(e.target.value)}
                placeholder="Nome completo (ex: Maria Silva)..."
                className="w-full text-xs sm:text-sm font-medium min-h-[48px] px-4 rounded-xl border"
                style={{
                  backgroundColor: colors.inputBackground,
                  color: textColor,
                  borderColor: colors.inputBorder,
                }}
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: secondaryTextColor }}>
                Telefone de contato
              </label>
              <input
                type="tel"
                value={telefoneOutroPassageiro}
                onChange={(e) => setTelefoneOutroPassageiro(e.target.value)}
                placeholder="(82) 99999-9999"
                className="w-full text-xs sm:text-sm font-medium min-h-[48px] px-4 rounded-xl border"
                style={{
                  backgroundColor: colors.inputBackground,
                  color: textColor,
                  borderColor: colors.inputBorder,
                }}
              />
            </div>

            <NativeSurface elevation={1} padding="sm" className="text-xs font-medium text-slate-700">
              💡 O motorista verá que a corrida foi pedida por você e poderá falar diretamente com quem vai embarcar.
            </NativeSurface>
          </div>
        )}

        <div className="pt-2">
          <NativeButton
            variant="filled"
            size="md"
            fullWidth
            onClick={onClose}
          >
            Concluir
          </NativeButton>
        </div>
      </div>
    </NativeBottomSheet>
  );
}
