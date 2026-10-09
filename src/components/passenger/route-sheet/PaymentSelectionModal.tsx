import React from "react";
import { QrCode, Banknote, CreditCard, Check } from "lucide-react";
import { NativeBottomSheet, NativeSurface } from "@/components/native";

export interface PaymentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formaPagamento: "pix" | "dinheiro" | "cartao_app";
  pagamentoNaMaquininha: boolean;
  onSelectPayment: (method: "pix" | "dinheiro", naMaquininha: boolean) => void;
  corPrimaria?: string;
  corTextoPrimaria?: string;
  colors?: any;
}

export function PaymentSelectionModal({
  isOpen,
  onClose,
  formaPagamento,
  pagamentoNaMaquininha,
  onSelectPayment,
  corPrimaria = "#003366",
  colors = {},
}: PaymentSelectionModalProps) {
  const primaryColor = colors.primary || corPrimaria;
  const textColor = colors.textPrimary || "#0F172A";
  const secondaryTextColor = colors.textSecondary || "#64748B";

  return (
    <NativeBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Forma de pagamento"
      subtitle="Pagamento direto no desembarque"
      showDragHandle
      showCloseButton
    >
      <div className="space-y-2.5 pb-2">
        {/* OPÇÃO 1: PIX DIRETO */}
        <NativeSurface
          elevation={1}
          interactive
          padding="sm"
          onClick={() => {
            onSelectPayment("pix", false);
            onClose();
          }}
          style={
            formaPagamento === "pix" && !pagamentoNaMaquininha
              ? {
                  border: `2px solid ${primaryColor}`,
                  backgroundColor: `${primaryColor}12`,
                }
              : undefined
          }
          className="min-h-[56px] py-3 px-3.5 rounded-2xl flex items-center justify-between border border-slate-200/80 touch-manipulation transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-200"
            >
              <QrCode className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold block truncate" style={{ color: textColor }}>
                  PIX Direto
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
                  Instantâneo
                </span>
              </div>
              <span className="text-xs font-medium block truncate mt-0.5" style={{ color: secondaryTextColor }}>
                Transferência para chave do condutor
              </span>
            </div>
          </div>
          {formaPagamento === "pix" && !pagamentoNaMaquininha && (
            <Check className="w-5 h-5 stroke-[3] shrink-0 ml-2" style={{ color: primaryColor }} />
          )}
        </NativeSurface>

        {/* OPÇÃO 2: DINHEIRO EM ESPÉCIE */}
        <NativeSurface
          elevation={1}
          interactive
          padding="sm"
          onClick={() => {
            onSelectPayment("dinheiro", false);
            onClose();
          }}
          style={
            formaPagamento === "dinheiro" && !pagamentoNaMaquininha
              ? {
                  border: `2px solid ${primaryColor}`,
                  backgroundColor: `${primaryColor}12`,
                }
              : undefined
          }
          className="min-h-[56px] py-3 px-3.5 rounded-2xl flex items-center justify-between border border-slate-200/80 touch-manipulation transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold block truncate" style={{ color: textColor }}>
                  Dinheiro
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full shrink-0">
                  Presencial
                </span>
              </div>
              <span className="text-xs font-medium block truncate mt-0.5" style={{ color: secondaryTextColor }}>
                Pagar em notas ou moedas no desembarque
              </span>
            </div>
          </div>
          {formaPagamento === "dinheiro" && !pagamentoNaMaquininha && (
            <Check className="w-5 h-5 stroke-[3] shrink-0 ml-2" style={{ color: primaryColor }} />
          )}
        </NativeSurface>

        {/* OPÇÃO 3: MAQUININHA DO MOTORISTA */}
        <NativeSurface
          elevation={1}
          interactive
          padding="sm"
          onClick={() => {
            onSelectPayment("dinheiro", true);
            onClose();
          }}
          style={
            pagamentoNaMaquininha
              ? {
                  border: `2px solid ${primaryColor}`,
                  backgroundColor: `${primaryColor}12`,
                }
              : undefined
          }
          className="min-h-[56px] py-3 px-3.5 rounded-2xl flex items-center justify-between border border-slate-200/80 touch-manipulation transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-200"
            >
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold block truncate" style={{ color: textColor }}>
                  Maquininha do Motorista
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full shrink-0">
                  Débito / Crédito
                </span>
              </div>
              <span className="text-xs font-medium block truncate mt-0.5" style={{ color: secondaryTextColor }}>
                Cartão presencial na maquininha do carro
              </span>
            </div>
          </div>
          {pagamentoNaMaquininha && (
            <Check className="w-5 h-5 stroke-[3] shrink-0 ml-2" style={{ color: primaryColor }} />
          )}
        </NativeSurface>

        {/* SELO DE TRANSPARÊNCIA ZERO-CUSTÓDIA */}
        <div className="pt-1.5 px-1 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Pagamento 100% direto ao parceiro condutor (P2P sem intermediação).</span>
        </div>
      </div>
    </NativeBottomSheet>
  );
}
