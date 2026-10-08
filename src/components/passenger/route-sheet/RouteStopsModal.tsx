import React, { useState } from "react";
import { NativeBottomSheet, NativeSurface, NativeButton } from "@/components/native";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

export interface RouteStopsModalProps {
  isOpen: boolean;
  onClose: () => void;
  origem: string;
  destino: string;
  paradas: Array<{ id: string; endereco: string }>;
  onAdicionarParada: (endereco: string) => void;
  onRemoverParada: (id: string) => void;
  corPrimaria?: string;
  colors?: any;
}

export function RouteStopsModal({
  isOpen,
  onClose,
  origem,
  destino,
  paradas,
  onAdicionarParada,
  onRemoverParada,
  corPrimaria = "#003366",
  colors = {},
}: RouteStopsModalProps) {
  const [inputParada, setInputParada] = useState("");
  const primaryColor = colors.primary || corPrimaria;
  const textColor = colors.textPrimary || "#0F172A";

  const handleAdd = () => {
    if (inputParada.trim()) {
      hapticFeedback.light();
      onAdicionarParada(inputParada.trim());
      setInputParada("");
    }
  };

  return (
    <NativeBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Paradas no trajeto"
      subtitle="Adicione até 2 paradas (+ R$ 2,50/parada)"
      showDragHandle
      showCloseButton
    >
      <div className="space-y-3 pb-3">
        {/* Ponto 1: Origem */}
        <NativeSurface elevation={1} padding="sm" className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] uppercase font-extrabold text-slate-500 block">Embarque</span>
            <span className="font-bold truncate block text-xs" style={{ color: textColor }}>{origem}</span>
          </div>
        </NativeSurface>

        {/* Lista de Paradas Cadastradas */}
        {paradas.map((p, idx) => (
          <NativeSurface
            key={p.id}
            elevation={1}
            padding="sm"
            style={
              primaryColor
                ? {
                    backgroundColor: `${primaryColor}10`,
                    border: `1.5px solid ${primaryColor}30`,
                  }
                : undefined
            }
            className="flex items-center justify-between gap-2 text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                style={{ backgroundColor: primaryColor, color: "#FFFFFF" }}
                className="w-5 h-5 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-2xs"
              >
                {idx + 1}
              </span>
              <div className="min-w-0">
                <span
                  style={{ color: primaryColor }}
                  className="text-[10px] uppercase font-black block"
                >
                  Parada {idx + 1}
                </span>
                <span className="font-bold truncate block text-xs" style={{ color: textColor }}>{p.endereco}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                hapticFeedback.light();
                onRemoverParada(p.id);
              }}
              className="min-h-[44px] px-3 py-1.5 text-rose-700 hover:text-rose-900 hover:bg-rose-100/60 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer"
            >
              Remover
            </button>
          </NativeSurface>
        ))}

        {/* Campo para Adicionar Parada (se < 2) */}
        {paradas.length < 2 ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputParada}
                onChange={(e) => setInputParada(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder={paradas.length === 0 ? "Endereço da 1ª parada..." : "Endereço da 2ª parada..."}
                className="flex-1 text-xs sm:text-sm font-medium min-h-[48px] px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: colors.inputBackground,
                  color: textColor,
                  borderColor: colors.inputBorder,
                }}
                autoFocus
              />
              <NativeButton
                type="button"
                size="sm"
                disabled={!inputParada.trim()}
                onClick={handleAdd}
              >
                + Add
              </NativeButton>
            </div>
          </div>
        ) : (
          <p
            style={{
              backgroundColor: `${primaryColor}12`,
              color: primaryColor,
              borderColor: `${primaryColor}25`,
            }}
            className="text-xs p-3 rounded-xl text-center font-bold border"
          >
            ✓ Limite máximo de 2 paradas intermediárias atingido.
          </p>
        )}

        {/* Ponto Final: Destino */}
        <NativeSurface elevation={1} padding="sm" className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-sm bg-rose-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] uppercase font-extrabold text-slate-500 block">Destino</span>
            <span className="font-bold truncate block text-xs" style={{ color: textColor }}>{destino}</span>
          </div>
        </NativeSurface>

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
