/**
 * ==============================================================================
 * 💸 PARTIU DIGITAL CHANGE ENGINE (ONDA 11 — PADRÃO 99PAY / CASH TRANSFERS)
 * ==============================================================================
 * Sistema soberano de cálculo de troco em espécie e repasse digital 1-toque
 * direto para a carteira virtual do passageiro, com 0% de comissão retida.
 *
 * Características:
 * 1. Cálculo dinâmico e seguro de troco para pagamentos em notas/dinheiro vivo.
 * 2. Suporte a troco físico em espécie ou conversão instantânea em saldo digital.
 * 3. Crédito na carteira digital do passageiro (Partiu Money) sem retenção de taxas.
 * 4. Idempotência e registro transparente em extrato D+0.
 * ==============================================================================
 */

import { partiuWalletEngine } from "../finance/partiu-wallet";

export interface DigitalChangeCalculation {
  fareBrl: number;
  cashReceivedBrl: number;
  changeBrl: number;
  isValid: boolean;
  isExactPayment: boolean;
  insufficientAmountBrl?: number;
  errorMessage?: string;
}

export interface DigitalChangeDepositParams {
  rideId: string;
  driverId: string;
  driverName: string;
  passengerId: string;
  passengerName: string;
  changeBrl: number;
}

export interface DigitalChangeDepositResult {
  success: boolean;
  changeBrl: number;
  transactionId: string;
  passengerId: string;
  driverId: string;
  timestamp: number;
  newPassengerBalance: number;
  receiptMessage: string;
}

export class DigitalChangeEngine {
  private static instance: DigitalChangeEngine;
  private depositsHistory: Map<string, DigitalChangeDepositResult> = new Map();

  private constructor() {}

  public static getInstance(): DigitalChangeEngine {
    if (!DigitalChangeEngine.instance) {
      DigitalChangeEngine.instance = new DigitalChangeEngine();
    }
    return DigitalChangeEngine.instance;
  }

  /**
   * Calcula matematicamente o troco exato a partir do valor da corrida e nota entregue.
   */
  public calculateChange(
    fareBrl: number,
    cashReceivedBrl: number,
  ): DigitalChangeCalculation {
    const cleanFare = Math.round(Number(fareBrl) * 100) / 100;
    const cleanCash = Math.round(Number(cashReceivedBrl) * 100) / 100;

    if (isNaN(cleanCash) || cleanCash <= 0) {
      return {
        fareBrl: cleanFare,
        cashReceivedBrl: 0,
        changeBrl: 0,
        isValid: false,
        isExactPayment: false,
        errorMessage: "Informe um valor válido recebido em dinheiro.",
      };
    }

    if (cleanCash < cleanFare) {
      const falta = Math.round((cleanFare - cleanCash) * 100) / 100;
      return {
        fareBrl: cleanFare,
        cashReceivedBrl: cleanCash,
        changeBrl: 0,
        isValid: false,
        isExactPayment: false,
        insufficientAmountBrl: falta,
        errorMessage: `Valor recebido é menor que o total da corrida. Faltam R$ ${falta.toFixed(2).replace(".", ",")}.`,
      };
    }

    const change = Math.round((cleanCash - cleanFare) * 100) / 100;
    const isExact = change === 0;

    return {
      fareBrl: cleanFare,
      cashReceivedBrl: cleanCash,
      changeBrl: change,
      isValid: true,
      isExactPayment: isExact,
    };
  }

  /**
   * Deposita o troco digitalmente na carteira do passageiro com 0% de comissão retida.
   */
  public depositDigitalChange(
    params: DigitalChangeDepositParams,
  ): DigitalChangeDepositResult {
    const { rideId, driverId, driverName, passengerId, passengerName, changeBrl } = params;

    const cleanChange = Math.round(Number(changeBrl) * 100) / 100;
    if (cleanChange <= 0) {
      throw new Error("O valor de troco digital deve ser estritamente maior que zero.");
    }

    const idempotencyKey = `CHANGE-${rideId}-${passengerId}`;
    const existing = this.depositsHistory.get(idempotencyKey);
    if (existing) {
      return existing;
    }

    // 1. Obtém carteira digital do passageiro
    const passengerWallet = partiuWalletEngine.getOrCreateWallet(passengerId, "PASSENGER");
    passengerWallet.balance = Math.round((passengerWallet.balance + cleanChange) * 100) / 100;
    passengerWallet.availableBalance =
      Math.round((passengerWallet.availableBalance + cleanChange) * 100) / 100;
    passengerWallet.updatedAt = Date.now();

    const timestamp = Date.now();
    const transactionId = `TX-CHANGE-${timestamp}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 2. Registra a transação com 0% de taxa no motor financeiro
    partiuWalletEngine.recordTransaction({
      transactionId,
      walletId: passengerWallet.walletId,
      userId: passengerId,
      type: "PIX_CASH_IN",
      amountBrl: cleanChange,
      feeBrl: 0,
      netAmountBrl: cleanChange,
      balanceAfterBrl: passengerWallet.balance,
      idempotencyKey,
      description: `Troco Digital da Corrida #${rideId.slice(0, 8)} (${driverName || "Motorista"})`,
      metadata: {
        rideId,
        driverId,
        driverName,
        passengerName,
        type: "DIGITAL_CHANGE_DEPOSIT",
      },
      timestamp,
      status: "COMPLETED",
    });

    const receiptMessage = `Troco digital de R$ ${cleanChange.toFixed(2).replace(".", ",")} creditado com sucesso na carteira de ${passengerName}.`;

    const result: DigitalChangeDepositResult = {
      success: true,
      changeBrl: cleanChange,
      transactionId,
      passengerId,
      driverId,
      timestamp,
      newPassengerBalance: passengerWallet.balance,
      receiptMessage,
    };

    this.depositsHistory.set(idempotencyKey, result);

    // 3. Emite evento para a UI
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:digital_change_deposited", {
          detail: result,
        }),
      );
    }

    return result;
  }

  /**
   * Obtém registro de troco digital depositado para uma corrida específica
   */
  public getDepositForRide(rideId: string, passengerId: string): DigitalChangeDepositResult | null {
    const idempotencyKey = `CHANGE-${rideId}-${passengerId}`;
    return this.depositsHistory.get(idempotencyKey) || null;
  }

  /**
   * Limpa histórico em memória (para testes unitários)
   */
  public resetForTesting(): void {
    this.depositsHistory.clear();
  }
}

export const digitalChangeEngine = DigitalChangeEngine.getInstance();
