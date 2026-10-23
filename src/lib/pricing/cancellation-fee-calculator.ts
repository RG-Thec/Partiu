/**
 * ==============================================================================
 * 🛑 PARTIU CANCELLATION FEE CALCULATOR (v1.0) — 99 & UBER STANDARD
 * ==============================================================================
 * Motor canônico de precificação e bifurcação de cancelamento e No-Show.
 *
 * REGRAS NORMATIVAS (Padrão 99 DEX Bytecode / Uber Marketplace):
 * 1. ORDER_STATUS_CANCEL_TRIP_NOPAY:
 *    - Se nenhum motorista aceitou o chamado -> Isento (R$ 0,00).
 *    - Se o passageiro cancelar dentro de 2 minutos (120s) do aceite e antes
 *      do condutor chegar ao ponto de embarque -> Isento (R$ 0,00).
 *    - Se o cancelamento for justificado por inação do condutor (DRIVER_STATIONARY,
 *      DRIVER_WRONG_DIRECTION) -> Isento (R$ 0,00).
 *    - Se o cancelamento for efetuado pelo condutor (desistência em rota) -> Isento para o passageiro.
 *
 * 2. ORDER_STATUS_CANCEL_TRIP_PAID:
 *    - Se o passageiro cancelar após a carência de 2 minutos (120s) -> Taxa de R$ 6,00.
 *    - Se o condutor já tiver chegado ao ponto de embarque (DRIVER_ARRIVED) -> Taxa de R$ 6,00.
 *    - Se o passageiro não comparecer após 5 minutos (300s) de espera no ponto
 *      (No-Show com geofencing confirmado) -> Taxa de R$ 6,00.
 *
 * 3. MODELO PURE SAAS (0% Take Rate da Plataforma):
 *    - Em regime de Pure SaaS, 100% da taxa compensatória (R$ 6,00) é destinada
 *      ao condutor parceiro para cobrir deslocamento e tempo consumido.
 *    - Caso configurado modo Marketplace Legado com comissão, permite split proporcional.
 * ==============================================================================
 */

export type CancellationFeeType = "NOPAY" | "PAID";
export type CancellationTrigger = "PASSENGER" | "DRIVER" | "SYSTEM" | "NO_SHOW";

export interface CancellationFeeEvaluationParams {
  rideId: string;
  passengerId: string;
  driverId?: string | null | undefined;
  driverAssigned?: boolean | undefined;
  driverAcceptedAt?: number | null | undefined;
  driverArrivedAt?: number | null | undefined;
  cancelledAt?: number | undefined;
  cancelledBy: CancellationTrigger;
  reasonCode?: string | undefined;
  waitingSeconds?: number | undefined;
  isPureSaaS?: boolean | undefined;
  customFeeCents?: number | undefined;
  category?: string | undefined;
}

export interface CancellationFeeResult {
  rideId: string;
  feeType: CancellationFeeType;
  totalFeeCents: number;
  totalFeeBrl: number;
  driverShareCents: number;
  driverShareBrl: number;
  platformShareCents: number;
  platformShareBrl: number;
  isExempt: boolean;
  reason: string;
  elapsedSeconds: number;
  gracePeriodSeconds: number;
  timestamp: number;
}

export const CANCELLATION_CONSTANTS = {
  GRACE_PERIOD_SECONDS: 120, // 2 minutos de tolerância
  NO_SHOW_MIN_WAIT_SECONDS: 300, // 5 minutos de espera para No-Show
  STANDARD_FEE_CENTS: 600, // R$ 6,00 taxa padrão
  EXEMPT_REASON_CODES: [
    "DRIVER_STATIONARY",
    "DRIVER_NOT_MOVING",
    "DRIVER_WRONG_DIRECTION",
    "PRICE_ISSUE",
    "APP_CRASH",
    "SYSTEM_TIMEOUT",
  ] as const,
};

export class CancellationFeeCalculator {
  /**
   * Avalia as métricas de tempo e contexto para determinar se o cancelamento
   * é gratuito (NOPAY) ou passível de cobrança compensatória (PAID).
   */
  public static calculate(params: CancellationFeeEvaluationParams): CancellationFeeResult {
    const cancelledAt = params.cancelledAt ?? Date.now();
    const isPureSaaS = params.isPureSaaS ?? true;
    const baseFeeCents = params.customFeeCents ?? CANCELLATION_CONSTANTS.STANDARD_FEE_CENTS;

    // 1. Cancelamento disparado pelo Condutor (exceto No-Show)
    // O passageiro NUNCA é onerado se o motorista cancelou a corrida.
    if (params.cancelledBy === "DRIVER") {
      return this.buildNopayResult(
        params.rideId,
        cancelledAt,
        0,
        "Cancelado pelo condutor: passageiro isento de taxa",
      );
    }

    // 2. Cancelamento por No-Show do Passageiro (espera confirmada >= 5 minutos)
    if (params.cancelledBy === "NO_SHOW") {
      const waitTime = params.waitingSeconds ?? CANCELLATION_CONSTANTS.NO_SHOW_MIN_WAIT_SECONDS;
      return this.buildPaidResult(
        params.rideId,
        cancelledAt,
        waitTime,
        baseFeeCents,
        isPureSaaS,
        `No-Show confirmado: passageiro ausente após ${Math.floor(waitTime / 60)} min de espera`,
      );
    }

    // 3. Corrida sem motorista atribuído
    const hasDriver = Boolean(params.driverId || params.driverAssigned);
    if (!hasDriver) {
      return this.buildNopayResult(
        params.rideId,
        cancelledAt,
        0,
        "Cancelamento antes da atribuição de condutor",
      );
    }

    // 4. Motivos isentos comprovados (ex: motorista não se move ou foi na direção oposta)
    if (
      params.reasonCode &&
      (CANCELLATION_CONSTANTS.EXEMPT_REASON_CODES as readonly string[]).includes(params.reasonCode)
    ) {
      return this.buildNopayResult(
        params.rideId,
        cancelledAt,
        0,
        `Isenção concedida: motivo técnico (${params.reasonCode})`,
        true,
      );
    }

    // 5. Condutor já chegou ao local de embarque
    if (params.driverArrivedAt && params.driverArrivedAt > 0) {
      const elapsedSinceArrival = Math.max(0, Math.floor((cancelledAt - params.driverArrivedAt) / 1000));
      return this.buildPaidResult(
        params.rideId,
        cancelledAt,
        elapsedSinceArrival,
        baseFeeCents,
        isPureSaaS,
        "Cancelamento efetuado após a chegada do condutor ao ponto de embarque",
      );
    }

    // 6. Cálculo do tempo decorrido desde o aceite do condutor
    const acceptedAt = params.driverAcceptedAt ?? cancelledAt;
    const elapsedSeconds = Math.max(0, Math.floor((cancelledAt - acceptedAt) / 1000));

    // 7. Avaliação da janela de carência (Grace Period = 120s / 2 min)
    if (elapsedSeconds <= CANCELLATION_CONSTANTS.GRACE_PERIOD_SECONDS) {
      return this.buildNopayResult(
        params.rideId,
        cancelledAt,
        elapsedSeconds,
        `Cancelamento gratuito dentro da tolerância de ${CANCELLATION_CONSTANTS.GRACE_PERIOD_SECONDS}s (${elapsedSeconds}s decorridos)`,
      );
    }

    // 8. Cancelamento tardio fora da carência (> 120s com motorista a caminho)
    return this.buildPaidResult(
      params.rideId,
      cancelledAt,
      elapsedSeconds,
      baseFeeCents,
      isPureSaaS,
      `Cancelamento tardio após a tolerância de 2 minutos (${elapsedSeconds}s decorridos)`,
    );
  }

  private static buildNopayResult(
    rideId: string,
    timestamp: number,
    elapsedSeconds: number,
    reason: string,
    isExempt = true,
  ): CancellationFeeResult {
    return {
      rideId,
      feeType: "NOPAY",
      totalFeeCents: 0,
      totalFeeBrl: 0,
      driverShareCents: 0,
      driverShareBrl: 0,
      platformShareCents: 0,
      platformShareBrl: 0,
      isExempt,
      reason,
      elapsedSeconds,
      gracePeriodSeconds: CANCELLATION_CONSTANTS.GRACE_PERIOD_SECONDS,
      timestamp,
    };
  }

  private static buildPaidResult(
    rideId: string,
    timestamp: number,
    elapsedSeconds: number,
    totalFeeCents: number,
    isPureSaaS: boolean,
    reason: string,
  ): CancellationFeeResult {
    // No modelo Pure SaaS (0% comissão), o condutor recebe 100% da compensação.
    // No modelo híbrido com taxa, 75% condutor e 25% plataforma.
    const driverShareCents = isPureSaaS ? totalFeeCents : Math.round(totalFeeCents * 0.75);
    const platformShareCents = totalFeeCents - driverShareCents;

    return {
      rideId,
      feeType: "PAID",
      totalFeeCents,
      totalFeeBrl: Number((totalFeeCents / 100).toFixed(2)),
      driverShareCents,
      driverShareBrl: Number((driverShareCents / 100).toFixed(2)),
      platformShareCents,
      platformShareBrl: Number((platformShareCents / 100).toFixed(2)),
      isExempt: false,
      reason,
      elapsedSeconds,
      gracePeriodSeconds: CANCELLATION_CONSTANTS.GRACE_PERIOD_SECONDS,
      timestamp,
    };
  }
}

export const calculateCancellationFee = CancellationFeeCalculator.calculate.bind(CancellationFeeCalculator);
