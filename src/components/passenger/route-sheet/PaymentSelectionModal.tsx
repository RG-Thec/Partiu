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
      <div className="space-y-3 pb-3">
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
                  border: `1.5px solid ${primaryColor}`,
                  backgroundColor: `${primaryColor}12`,
                }
              : undefined
          }
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${primaryColor}18`,
                color: primaryColor,
              }}
            >
              <QrCode className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-black block" style={{ color: textColor }}>
                PIX Direto
              </span>
              <span className="text-xs font-medium block" style={{ color: secondaryTextColor }}>
                Transferência instantânea para o motorista
              </span>
            </div>
          </div>
          {formaPagamento === "pix" && !pagamentoNaMaquininha && (
            <Check className="w-5 h-5 stroke-[3]" style={{ color: primaryColor }} />
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
                  border: `1.5px solid ${primaryColor}`,
                  backgroundColor: `${primaryColor}12`,
                }
              : undefined
          }
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-black block" style={{ color: textColor }}>
                Dinheiro
              </span>
              <span className="text-xs font-medium block" style={{ color: secondaryTextColor }}>
                Pagar em espécie diretamente ao condutor
              </span>
            </div>
          </div>
          {formaPagamento === "dinheiro" && !pagamentoNaMaquininha && (
            <Check className="w-5 h-5 stroke-[3]" style={{ color: primaryColor }} />
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
                  border: `1.5px solid ${primaryColor}`,
                  backgroundColor: `${primaryColor}12`,
                }
              : undefined
          }
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${primaryColor}18`,
                color: primaryColor,
              }}
            >
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-black block" style={{ color: textColor }}>
                Maquininha do Motorista
              </span>
              <span className="text-xs font-medium block" style={{ color: secondaryTextColor }}>
                Cartão de débito ou crédito no veículo
              </span>
            </div>
          </div>
          {pagamentoNaMaquininha && (
            <Check className="w-5 h-5 stroke-[3]" style={{ color: primaryColor }} />
          )}
        </NativeSurface>
      </div>
    </NativeBottomSheet>
  );
}
