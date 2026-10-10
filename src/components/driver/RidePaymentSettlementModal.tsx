import React, { memo, useState, useEffect } from "react";
import { CheckCircle2, QrCode, Copy, Check, Banknote, ShieldCheck, ArrowRight, X } from "lucide-react";
import QRCode from "qrcode";
import { buildStandardEmvPix } from "@/services/payment/PaymentProviderAdapter";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

interface RidePaymentSettlementModalProps {
  isOpen: boolean;
  rideId: string;
  passengerName: string;
  destinationAddress: string;
  amountBrl: number;
  driverName: string;
  driverPixKey: string;
  driverCity?: string;
  distanceKm?: number;
  durationMinutes?: number;
  descontoCupom?: number;
  codigoCupom?: string;
  valorOriginal?: number;
  onClose: () => void;
  onConfirmSettlement: (paymentMethod: "PIX" | "DINHEIRO") => void;
}

export const RidePaymentSettlementModal = memo(function RidePaymentSettlementModal({
  isOpen,
  rideId,
  passengerName,
  destinationAddress,
  amountBrl,
  driverName,
  driverPixKey,
  driverCity = "ITAPERUNA",
  distanceKm = 4.2,
  durationMinutes = 12,
  descontoCupom = 0,
  codigoCupom,
  valorOriginal,
  onClose,
  onConfirmSettlement,
}: RidePaymentSettlementModalProps) {
  const hasValidPixKey = Boolean(driverPixKey && driverPixKey.trim().length >= 4);
  const [selectedMethod, setSelectedMethod] = useState<"PIX" | "DINHEIRO">(() => hasValidPixKey ? "PIX" : "DINHEIRO");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [pixPayload, setPixPayload] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hasValidPixKey && selectedMethod === "PIX") {
      setSelectedMethod("DINHEIRO");
    }
  }, [hasValidPixKey, selectedMethod]);

  useEffect(() => {
    if (!isOpen) return;

    if (!hasValidPixKey) {
      setPixPayload("");
      setQrCodeDataUrl("");
      return;
    }

    const cleanKey = driverPixKey.trim();
    const cleanName = driverName || "Motorista Parceiro";
    const txId = (rideId || "COR-101").replace(/[^a-zA-Z0-9]/g, "").slice(0, 25);

    try {
      const payload = buildStandardEmvPix(cleanKey, cleanName, driverCity, amountBrl, txId);
      setPixPayload(payload);

      QRCode.toDataURL(payload, {
        width: 240,
        margin: 1,
        color: {
          dark: "#09090b",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("Erro ao gerar QR Code PIX motorista:", err));
    } catch (err) {
      console.error("Erro ao montar payload PIX:", err);
    }
  }, [isOpen, rideId, amountBrl, driverName, driverPixKey, driverCity, hasValidPixKey]);

  if (!isOpen) return null;

  const handleCopyPix = () => {
    if (!pixPayload) return;
    void navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    hapticFeedback.light();
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirm = () => {
    hapticFeedback.success();
    onConfirmSettlement(selectedMethod);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom duration-300 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">Acerto da Corrida</h3>
              <p className="text-xs text-slate-700 font-semibold">Recebimento Direto (0% Comissão)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Valor em Destaque */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-slate-100 border border-emerald-500/20 text-center space-y-1">
          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
            Total a Receber do Passageiro
          </span>
          <div className="text-3xl sm:text-4xl font-black text-emerald-700 leading-tight">
            {amountBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-800 font-semibold pt-1">
            <span>Passageiro: <strong>{passengerName}</strong></span>
            <span>•</span>
            <span>{distanceKm} km</span>
          </div>

          {descontoCupom > 0 && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-left text-xs space-y-1">
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                <span>Valor original da corrida:</span>
                <span className="line-through">
                  {(valorOriginal || (amountBrl + descontoCupom)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-amber-700">
                <span>Desconto Cupom ({codigoCupom || "PROMO"}):</span>
                <span>- {descontoCupom.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
              <div className="pt-1.5 border-t border-amber-500/20 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <span>🎁</span>
                <span>Subsídio de {descontoCupom.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} creditado na sua diária do app!</span>
              </div>
            </div>
          )}
        </div>

        {/* Escolha da Forma de Recebimento */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-800 uppercase tracking-tight block">
            Como o passageiro está pagando?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!hasValidPixKey}
              onClick={() => {
                if (!hasValidPixKey) return;
                hapticFeedback.light();
                setSelectedMethod("PIX");
              }}
              className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                !hasValidPixKey
                  ? "border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed"
                  : selectedMethod === "PIX"
                  ? "border-emerald-600 bg-emerald-50/60 shadow-sm active:scale-95"
                  : "border-slate-200 hover:border-slate-300 bg-white active:scale-95"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">⚡</span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === "PIX"
                      ? "border-emerald-600 bg-emerald-600"
                      : "border-slate-300"
                  }`}
                >
                  {selectedMethod === "PIX" && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </span>
              </div>
              <div className="mt-2">
                <span className="text-xs font-black text-slate-900 block leading-tight">PIX Direto</span>
                <span className="text-[11px] text-slate-600 font-semibold">
                  {hasValidPixKey ? "Na sua conta" : "Chave não configurada"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                hapticFeedback.light();
                setSelectedMethod("DINHEIRO");
              }}
              className={`p-3 rounded-2xl border-2 text-left transition active:scale-95 cursor-pointer flex flex-col justify-between ${
                selectedMethod === "DINHEIRO"
                  ? "border-amber-600 bg-amber-50/60 shadow-sm"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <Banknote className="w-5 h-5 text-amber-600" />
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === "DINHEIRO"
                      ? "border-amber-600 bg-amber-600"
                      : "border-slate-300"
                  }`}
                >
                  {selectedMethod === "DINHEIRO" && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </span>
              </div>
              <div className="mt-2">
                <span className="text-xs font-black text-slate-900 block leading-tight">Dinheiro</span>
                <span className="text-xs text-slate-700 font-semibold">Em mãos</span>
              </div>
            </button>
          </div>
        </div>

        {/* QR Code Dinâmico para o Passageiro Ler na Tela do Motorista */}
        {selectedMethod === "PIX" && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-900">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Apresente este QR Code para o Passageiro:</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 inline-block shadow-sm">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code PIX para leitura do passageiro"
                  className="w-48 h-48 mx-auto object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 mx-auto flex items-center justify-center bg-slate-100 rounded-lg text-xs text-slate-600 font-medium">
                  Gerando QR Code...
                </div>
              )}
            </div>

            <div className="space-y-0.5 text-xs text-slate-800 font-medium">
              <p>
                Beneficiário: <strong className="text-slate-900">{driverName}</strong>
              </p>
              <p className="font-mono text-xs text-slate-700 font-semibold truncate">
                Chave: {driverPixKey || "Configurar no perfil"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyPix}
              className="w-full py-2 px-3 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-800" />
                  <span>Copiar Código Copia e Cola</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Em Dinheiro */}
        {selectedMethod === "DINHEIRO" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1.5 animate-in fade-in duration-200">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Banknote className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-black text-amber-900">Cobrança em Espécie</h4>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              Receba os <strong>{amountBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong> em mãos e providencie o troco se necessário.
            </p>
          </div>
        )}

        {/* Selo Garantia Zero Custódia */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>100% deste valor fica com você. 0% de comissão retida pelo app.</span>
        </div>

        {/* Botão de Conclusão */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>CONFIRMAR RECEBIMENTO &amp; LIBERAR</span>
          </button>
        </div>
      </div>
    </div>
  );
});
