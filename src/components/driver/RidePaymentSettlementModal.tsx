import React, { memo, useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  Banknote,
  ShieldCheck,
  ArrowRight,
  X,
  Wallet,
  Sparkles,
  Coins,
  RotateCcw,
  AlertCircle,
  Gift,
  Zap,
} from "lucide-react";
import QRCode from "qrcode";
import { buildStandardEmvPix } from "@/services/payment/PaymentProviderAdapter";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";
import { digitalChangeEngine } from "@/lib/payment/digital-change-engine";
import { toast } from "sonner";

interface RidePaymentSettlementModalProps {
  isOpen: boolean;
  rideId: string;
  passengerId?: string;
  passengerName: string;
  destinationAddress: string;
  amountBrl: number;
  driverId?: string;
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
  passengerId,
  passengerName,
  destinationAddress,
  amountBrl,
  driverId = "driver_current",
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
  const [selectedMethod, setSelectedMethod] = useState<"PIX" | "DINHEIRO">(() =>
    hasValidPixKey ? "PIX" : "DINHEIRO",
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [pixPayload, setPixPayload] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Estados de Troco Dinâmico / Digital
  const [cashReceivedInput, setCashReceivedInput] = useState<string>("");
  const [digitalChangeDeposited, setDigitalChangeDeposited] = useState(false);
  const [depositedChangeAmount, setDepositedChangeAmount] = useState<number | null>(null);

  const effectivePassengerId = passengerId || `pax_${rideId.slice(0, 10)}`;

  useEffect(() => {
    if (!hasValidPixKey && selectedMethod === "PIX") {
      setSelectedMethod("DINHEIRO");
    }
  }, [hasValidPixKey, selectedMethod]);

  // Reset de estados de troco ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setCashReceivedInput("");
      setDigitalChangeDeposited(false);
      setDepositedChangeAmount(null);
    }
  }, [isOpen]);

  // Geração do QR Code PIX
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

  // Cálculo reativo do troco
  const changeCalculation = useMemo(() => {
    if (!cashReceivedInput.trim()) {
      return null;
    }
    const parsed = Number(cashReceivedInput.replace(",", "."));
    if (isNaN(parsed)) return null;
    return digitalChangeEngine.calculateChange(amountBrl, parsed);
  }, [amountBrl, cashReceivedInput]);

  // Chips de cédulas inteligentes
  const quickBills = useMemo(() => {
    const rounded = Math.ceil(amountBrl);
    const bills = new Set<number>();
    [20, 50, 100].forEach((bill) => {
      if (bill >= rounded) bills.add(bill);
    });
    if (bills.size === 0) {
      bills.add(Math.ceil(rounded / 50) * 50);
      bills.add(Math.ceil(rounded / 50) * 50 + 50);
    }
    return Array.from(bills).sort((a, b) => a - b);
  }, [amountBrl]);

  if (!isOpen) return null;

  const handleCopyPix = () => {
    if (!pixPayload) return;
    void navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    hapticFeedback.light();
    setTimeout(() => setCopied(false), 3000);
  };

  const handleConfirmarTrocoEntregue = () => {
    if (!changeCalculation || changeCalculation.changeBrl <= 0) return;

    try {
      digitalChangeEngine.depositDigitalChange({
        rideId,
        driverId,
        driverName: driverName || "Motorista Parceiro",
        passengerId: effectivePassengerId,
        passengerName,
        changeBrl: changeCalculation.changeBrl,
      });

      setDigitalChangeDeposited(true);
      setDepositedChangeAmount(changeCalculation.changeBrl);
      hapticFeedback.success();
      toast.success(
        `Troco de R$ ${changeCalculation.changeBrl.toFixed(2).replace(".", ",")} confirmado com sucesso!`,
      );
    } catch (err: any) {
      setDigitalChangeDeposited(true);
      setDepositedChangeAmount(changeCalculation.changeBrl);
      toast.success("Troco entregue ao passageiro.");
    }
  };

  const handleConfirm = () => {
    if (
      selectedMethod === "DINHEIRO" &&
      changeCalculation &&
      !changeCalculation.isValid
    ) {
      toast.error("O valor entregue pelo passageiro é insuficiente para quitar a corrida.");
      return;
    }
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
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Acerto da Corrida
              </h3>
              <p className="text-xs text-slate-700 font-semibold">
                Recebimento Direto (0% Comissão)
              </p>
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
            <span>
              Passageiro: <strong>{passengerName}</strong>
            </span>
            <span>•</span>
            <span>{distanceKm} km</span>
          </div>

          {descontoCupom > 0 && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-left text-xs space-y-1">
              <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                <span>Valor original da corrida:</span>
                <span className="line-through">
                  {(valorOriginal || amountBrl + descontoCupom).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-amber-700">
                <span>Desconto Cupom ({codigoCupom || "PROMO"}):</span>
                <span>
                  - {descontoCupom.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="pt-1.5 border-t border-amber-500/20 text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  Subsídio de{" "}
                  {descontoCupom.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}{" "}
                  creditado na sua diária do app.
                </span>
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
                <div className="w-7 h-7 rounded-lg bg-emerald-100/80 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-700 fill-emerald-600" />
                </div>
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
                <span className="text-xs font-black text-slate-900 block leading-tight">
                  PIX Direto
                </span>
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
                  {selectedMethod === "DINHEIRO" && (
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  )}
                </span>
              </div>
              <div className="mt-2">
                <span className="text-xs font-black text-slate-900 block leading-tight">
                  Dinheiro
                </span>
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
                  <span>Código copiado</span>
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

        {/* =================================================================== */}
        {/* EM DINHEIRO & CALCULADORA INTELIGENTE DE TROCO DIGITAL (PADRÃO 99)  */}
        {/* =================================================================== */}
        {selectedMethod === "DINHEIRO" && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-amber-950 leading-tight">
                  Pagamento em Dinheiro &amp; Troco
                </h4>
                <p className="text-[11px] text-amber-900 font-medium">
                  Informe o valor recebido para calcular o troco exato
                </p>
              </div>
            </div>

            {/* Input de Valor Entregue */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Valor entregue pelo passageiro:
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={cashReceivedInput}
                  onChange={(e) => {
                    setCashReceivedInput(e.target.value);
                    if (digitalChangeDeposited) {
                      setDigitalChangeDeposited(false);
                      setDepositedChangeAmount(null);
                    }
                  }}
                  placeholder={amountBrl.toFixed(2).replace(".", ",")}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-amber-300 bg-white text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-inner"
                />
              </div>

              {/* Chips de Cédulas Rápidas */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback.light();
                    setCashReceivedInput(amountBrl.toFixed(2).replace(".", ","));
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition cursor-pointer active:scale-95"
                >
                  Exato (R$ {amountBrl.toFixed(2).replace(".", ",")})
                </button>
                {quickBills.map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    onClick={() => {
                      hapticFeedback.light();
                      setCashReceivedInput(bill.toFixed(2).replace(".", ","));
                    }}
                    className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition cursor-pointer active:scale-95"
                  >
                    R$ {bill},00
                  </button>
                ))}
              </div>
            </div>

            {/* Painel de Resultado do Troco */}
            {changeCalculation && (
              <div className="pt-2 border-t border-amber-200/80 space-y-2">
                {!changeCalculation.isValid ? (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-semibold">{changeCalculation.errorMessage}</span>
                  </div>
                ) : changeCalculation.isExactPayment ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Pagamento exato recebido. Sem troco pendente.</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-white border border-amber-300 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Troco a devolver:
                      </span>
                      <span className="text-lg font-black text-amber-800">
                        {changeCalculation.changeBrl.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>

                    {digitalChangeDeposited ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          <span>Troco Devolvido ao Passageiro</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-tight">
                          Troco de R$ {depositedChangeAmount?.toFixed(2).replace(".", ",")} entregue
                          diretamente a <strong>{passengerName}</strong> (em espécie ou Pix direto).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={handleConfirmarTrocoEntregue}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                          <span>
                            Confirmar Troco Entregue (
                            {changeCalculation.changeBrl.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                            )
                          </span>
                        </button>
                        <p className="text-[10px] text-center text-slate-500 font-medium">
                          Entregue em cédulas ou transfira via PIX diretamente para a conta do passageiro.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
