import React from "react";
import { Tag, ChevronRight, Bike, Car, LucideIcon } from "lucide-react";
import { couponService, type ActiveCoupon } from "@/services/CouponService";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

export interface RouteSheetFooterProps {
  cupomAtivo: ActiveCoupon | null;
  paymentInfo: {
    label: string;
    sublabel: string;
    icon: LucideIcon;
    color: string;
  };
  formaPagamento: string;
  pagamentoNaMaquininha: boolean;
  onOpenPayment: () => void;
  onConfirm: () => void;
  isMoto: boolean;
  nomeVeiculoAtivo: string;
  precoAtivo: string;
  corPrimaria?: string;
  corSecundaria?: string;
}

export function RouteSheetFooter({
  cupomAtivo,
  paymentInfo,
  formaPagamento,
  pagamentoNaMaquininha,
  onOpenPayment,
  onConfirm,
  isMoto,
  nomeVeiculoAtivo,
  precoAtivo,
  corPrimaria,
  corSecundaria,
}: RouteSheetFooterProps) {
  const PaymentIcon = paymentInfo.icon;

  return (
    <div
      style={{
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 16px))",
      }}
      className="px-3.5 sm:px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,16px))] shrink-0 border-t border-slate-200/60 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] space-y-2 z-20"
    >
      {/* BANNER DE CUPOM APLICADO (SE HOUVER) */}
      {cupomAtivo && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Cupom <span className="font-extrabold text-emerald-700">{cupomAtivo.codigo}</span> (
              {(cupomAtivo as any).descontoFormatado ||
                (cupomAtivo.tipo === "porcentagem"
                  ? `${cupomAtivo.valor}%`
                  : `R$ ${cupomAtivo.valor}`)}{" "}
              OFF)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticFeedback.light();
              couponService.clearActiveRideCoupon();
            }}
            className="text-slate-400 hover:text-rose-600 text-[11px] font-bold p-0.5 ml-1.5 shrink-0 cursor-pointer"
            title="Remover cupom"
          >
            Remover
          </button>
        </div>
      )}

      {/* BARRA FIXA DE FORMA DE PAGAMENTO */}
      <div
        role="button"
        tabIndex={0}
        onClick={onOpenPayment}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpenPayment();
        }}
        className="w-full flex flex-row items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 active:scale-[0.99] transition cursor-pointer border border-slate-200/80"
      >
        <div className="flex flex-row items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <PaymentIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-800 truncate">
            {pagamentoNaMaquininha
              ? "Maquininha do Motorista"
              : formaPagamento === "pix"
              ? "PIX Direto"
              : paymentInfo.label}
          </span>
          <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full shrink-0">
            {pagamentoNaMaquininha ? "Cartão" : formaPagamento === "pix" ? "Instantâneo" : "Presencial"}
          </span>
        </div>

        <div
          className="flex flex-row items-center gap-1 text-xs font-bold text-brand-primary-vibrant hover:underline shrink-0"
          style={corPrimaria ? { color: corPrimaria } : undefined}
        >
          <span>Trocar</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>

      {/* BOTÃO PRINCIPAL DE CONFIRMAÇÃO DA CORRIDA */}
      <button
        type="button"
        onClick={onConfirm}
        aria-label={`Confirmar corrida ${nomeVeiculoAtivo} por ${precoAtivo}`}
        className="w-full h-10 sm:h-11 rounded-xl bg-gradient-to-r from-brand-primary-vibrant to-brand-primary-deep hover:brightness-105 text-white font-bold text-xs sm:text-sm active:scale-[0.99] transition-all duration-150 flex flex-row items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-primary-vibrant/20 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={
          corPrimaria && corSecundaria
            ? {
                backgroundImage: `linear-gradient(to right, ${corPrimaria}, ${corSecundaria})`,
              }
            : corPrimaria
            ? { backgroundColor: corPrimaria }
            : undefined
        }
      >
        {isMoto ? (
          <Bike className="w-4 h-4 text-white stroke-[2.2]" />
        ) : (
          <Car className="w-4 h-4 text-white stroke-[2.2]" />
        )}
        <span className="opacity-40 font-light">|</span>
        <span>Confirmar • {precoAtivo}</span>
      </button>
    </div>
  );
}
