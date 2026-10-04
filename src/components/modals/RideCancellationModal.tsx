import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import {
  cancellationPolicyService,
  CANCELLATION_REASONS_PASSENGER,
  CANCELLATION_REASONS_DRIVER,
  type CancellationReason,
} from "@/services/CancellationPolicyService";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { NativeBottomSheet } from "@/components/native/NativeBottomSheet";
import { NativeButton } from "@/components/native/NativeButton";
import { NativeRipple } from "@/components/native/NativeRipple";

export interface RideCancellationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: CancellationReason) => void;
  userType?: "PASSENGER" | "DRIVER";
  acceptedAt?: string | number | Date | null;
  customFeeBrl?: number;
  isCancelling?: boolean;
}

export function RideCancellationModal({
  open,
  onClose,
  onConfirmCancel,
  userType = "PASSENGER",
  acceptedAt,
  customFeeBrl = 5.0,
  isCancelling = false,
}: RideCancellationModalProps) {
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  const reasons =
    userType === "PASSENGER"
      ? CANCELLATION_REASONS_PASSENGER
      : CANCELLATION_REASONS_DRIVER;

  const [selectedReasonCode, setSelectedReasonCode] = useState<string>(
    reasons[0]?.code || "WAIT_TOO_LONG"
  );

  const policy = useMemo(() => {
    return cancellationPolicyService.evaluatePolicy(acceptedAt, 2, customFeeBrl);
  }, [acceptedAt, customFeeBrl]);

  if (!open) return null;

  const selectedReason =
    reasons.find((r) => r.code === selectedReasonCode) || reasons[0];

  const isExemptByReason = !selectedReason?.appliesFeeWhenLate;
  const willChargeFee = policy.shouldChargeFee && !isExemptByReason && userType === "PASSENGER";

  function handleConfirm() {
    if (selectedReason) {
      onConfirmCancel(selectedReason);
    }
  }

  return (
    <NativeBottomSheet
      isOpen={open}
      onClose={onClose}
      title="Cancelar viagem?"
      subtitle="Selecione o motivo do cancelamento"
      ariaLabel="Modal de cancelamento de corrida"
      showCloseButton
      maxHeight="max-h-[90dvh]"
      footer={
        <div className="flex gap-2.5 w-full">
          <NativeButton
            variant="tonal"
            size="md"
            className="flex-1"
            onClick={onClose}
            disabled={isCancelling}
          >
            Manter corrida
          </NativeButton>
          <NativeButton
            variant="danger"
            size="md"
            className="flex-1"
            onClick={handleConfirm}
            isLoading={isCancelling}
          >
            Confirmar cancelamento
          </NativeButton>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Banner de Tolerância / Taxa */}
        {userType === "PASSENGER" && (
          <div>
            {willChargeFee ? (
              <div
                className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3"
                style={{ borderRadius: ui.borderRadius }}
              >
                <DollarSign className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-black text-amber-900 block">
                    Taxa de cancelamento: R$ {policy.cancellationFee.toFixed(2).replace(".", ",")}
                  </span>
                  <p className="text-amber-800/90 text-[11px] mt-0.5 leading-relaxed">
                    O motorista já se deslocou em sua direção por mais de 2 minutos. A taxa será
                    repassada ao condutor pelo deslocamento.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3"
                style={{ borderRadius: ui.borderRadius }}
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-black text-emerald-900 block">
                    {isExemptByReason
                      ? "Cancelamento isento"
                      : `Cancelamento gratuito (${cancellationPolicyService.formatFreeUntilTime(policy.freeCancellationUntil)})`}
                  </span>
                  <p className="text-emerald-800/90 text-[11px] mt-0.5 leading-relaxed">
                    {isExemptByReason
                      ? "Por se tratar de um imprevisto na rota, nenhuma taxa será cobrada."
                      : "Você está dentro da carência inicial de 2 minutos. Nenhuma taxa será cobrada."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de Motivos com Seleção Tátil */}
        <div className="space-y-2">
          <label
            className="text-[11px] font-bold uppercase tracking-wider block px-1"
            style={{ color: colors.textSecondary }}
          >
            Motivo do cancelamento:
          </label>
          {reasons.map((reason) => {
            const isSelected = selectedReasonCode === reason.code;
            return (
              <div
                key={reason.code}
                onClick={() => setSelectedReasonCode(reason.code)}
                className="relative overflow-hidden p-3.5 border transition cursor-pointer flex items-start gap-3 select-none"
                style={{
                  backgroundColor: isSelected ? `${colors.primary}12` : colors.inputBackground,
                  borderColor: isSelected ? colors.primary : colors.inputBorder,
                  borderRadius: ui.borderRadius,
                  minHeight: "52px",
                }}
              >
                <NativeRipple color={colors.primary} />
                <input
                  type="radio"
                  name="cancellationReason"
                  checked={isSelected}
                  onChange={() => setSelectedReasonCode(reason.code)}
                  className="mt-0.5 cursor-pointer"
                  style={{ accentColor: colors.primary }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-bold leading-tight"
                    style={{ color: colors.textPrimary }}
                  >
                    {reason.label}
                  </p>
                  <p
                    className="text-[11px] mt-0.5 line-clamp-2"
                    style={{ color: colors.textSecondary }}
                  >
                    {reason.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </NativeBottomSheet>
  );
}
