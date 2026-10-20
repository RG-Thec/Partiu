/**
 * ==============================================================================
 * 🎟️ PARTIU — SAAS TOLERANCE & SMART GRACE ENGINE
 * ==============================================================================
 * Permite que condutores parceiros operem até 2 corridas em modo de tolerância
 * quando a diária SaaS estiver vencida (saldo zerado no início do turno).
 *
 * Ao finalizar a corrida, o valor pendente da diária é liquidado diretamente do
 * primeiro repasse digital (Pix/Cartão), renovando o acesso sem interromper a
 * oferta de transporte na cidade.
 * ==============================================================================
 */

export interface DriverSaaSStatus {
  driverId: string;
  tenantId: string;
  status: "ACTIVE" | "TOLERANCE_MODE" | "BLOCKED_EXHAUSTED";
  toleranceRidesUsed: number;
  maxToleranceRides: number;
  pendingDailyFeeCents: number;
  lastPaymentTimestamp?: number | null;
}

export interface ToleranceEvaluation {
  canAcceptRide: boolean;
  isToleranceActive: boolean;
  remainingToleranceRides: number;
  message: string;
  requiresImmediateDeduction: boolean;
}

export class SaaSToleranceEngine {
  public static readonly DEFAULT_MAX_TOLERANCE_RIDES = 2;
  public static readonly DEFAULT_DAILY_FEE_CENTS = 500; // R$ 5,00 em centavos

  /**
   * Avalia a aptidão do motorista para receber chamadas sob as regras de tolerância
   */
  public static evaluateDriverAccess(status: DriverSaaSStatus): ToleranceEvaluation {
    if (status.status === "ACTIVE") {
      return {
        canAcceptRide: true,
        isToleranceActive: false,
        remainingToleranceRides: status.maxToleranceRides,
        message: "Acesso regular ativo.",
        requiresImmediateDeduction: false,
      };
    }

    if (status.toleranceRidesUsed < status.maxToleranceRides) {
      const remaining = status.maxToleranceRides - status.toleranceRidesUsed;
      return {
        canAcceptRide: true,
        isToleranceActive: true,
        remainingToleranceRides: remaining,
        message: `Modo de Tolerância Ativo: você possui ${remaining} corrida(s) permitida(s). A diária pendente será liquidada no repasse.`,
        requiresImmediateDeduction: true,
      };
    }

    return {
      canAcceptRide: false,
      isToleranceActive: false,
      remainingToleranceRides: 0,
      message: "Limite de tolerância esgotado. Efetue o pagamento da diária para continuar recebendo chamadas.",
      requiresImmediateDeduction: true,
    };
  }

  /**
   * Processa o split financeiro aplicando a dedução da diária pendente
   */
  public static processRideSettlementWithTolerance(
    driverStatus: DriverSaaSStatus,
    netRideEarningsCents: number
  ): {
    driverFinalEarningsCents: number;
    deductedFeeCents: number;
    updatedStatus: DriverSaaSStatus;
    settledDailyFee: boolean;
  } {
    if (driverStatus.status === "ACTIVE" || driverStatus.pendingDailyFeeCents <= 0) {
      return {
        driverFinalEarningsCents: netRideEarningsCents,
        deductedFeeCents: 0,
        updatedStatus: driverStatus,
        settledDailyFee: false,
      };
    }

    const feeToDeduct = Math.min(driverStatus.pendingDailyFeeCents, netRideEarningsCents);
    const driverFinalEarnings = netRideEarningsCents - feeToDeduct;
    const remainingPendingFee = driverStatus.pendingDailyFeeCents - feeToDeduct;

    const settled = remainingPendingFee === 0;

    const updatedStatus: DriverSaaSStatus = {
      ...driverStatus,
      pendingDailyFeeCents: remainingPendingFee,
      toleranceRidesUsed: settled ? 0 : driverStatus.toleranceRidesUsed + 1,
      status: settled ? "ACTIVE" : (driverStatus.toleranceRidesUsed + 1 >= driverStatus.maxToleranceRides ? "BLOCKED_EXHAUSTED" : "TOLERANCE_MODE"),
      lastPaymentTimestamp: settled ? Date.now() : driverStatus.lastPaymentTimestamp,
    };

    return {
      driverFinalEarningsCents: driverFinalEarnings,
      deductedFeeCents: feeToDeduct,
      updatedStatus,
      settledDailyFee: settled,
    };
  }
}
