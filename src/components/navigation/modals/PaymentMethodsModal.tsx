import React from "react";
import { QrCode, ShieldCheck, Banknote, CreditCard, Zap, X } from "lucide-react";

interface PaymentMethodsModalProps {
  open: boolean;
  onClose: () => void;
  corPrimaria?: string;
  corTextoPrimaria?: string;
}

export function PaymentMethodsModal({
  open,
  onClose,
  corPrimaria,
  corTextoPrimaria,
}: PaymentMethodsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${corPrimaria || "#FF6B00"}15`, color: corPrimaria || "#FF6B00" }}
            >
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Como Pagar sua Viagem</h3>
              <p className="text-[10px] text-slate-500 font-medium">Pagamento 100% direto ao condutor (Zero Custódia)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Aviso de Transparência e Segurança */}
        <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 mb-4 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
            <strong>Zero custódia e sem retenção de dados:</strong> O PARTIU não desconta valores no seu cartão in-app. O repasse é 100% direto entre você e o condutor parceiro ao desembarcar.
          </p>
        </div>

        {/* Opções Reais de Pagamento */}
        <div className="space-y-2.5">
          {/* Opção 1: PIX QR Code na tela do motorista */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
              PIX
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">PIX QR Code no Final da Corrida</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Recomendado
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Ao chegar no destino, a tela do condutor exibe um <strong>QR Code instantâneo</strong> com o valor exato para você escanear pelo app do seu banco.
              </p>
            </div>
          </div>

          {/* Opção 2: Maquininha do Motorista (Débito e Crédito) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Maquininha do Motorista</span>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Pague com seu cartão físico (débito, crédito ou aproximação) direto na maquininha do veículo no desembarque.
              </p>
            </div>
          </div>

          {/* Opção 3: Dinheiro em Espécie */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Dinheiro em Espécie</span>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Pague em notas ou moedas em mãos ao motorista. Você pode informar necessidade de troco ao solicitar a corrida.
              </p>
            </div>
          </div>

          {/* Opção 4: Chave PIX Direta */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Chave PIX do Condutor</span>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                O condutor também pode fornecer sua chave PIX direta (telefone, CPF ou e-mail) para transferência bancária no ato.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center"
          style={{ backgroundColor: corPrimaria || "#FF6B00", color: corTextoPrimaria || "#FFFFFF" }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
