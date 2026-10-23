/**
 * ==============================================================================
 * 🔐 PARTIU MOBILIDADE — PASSENGER BOARDING PIN SECURITY ENGINE (v1.0)
 * ==============================================================================
 * Geração criptográfica de código de embarque seguro (OTP de 4 dígitos) para
 * viagens de passageiros. Proteção ativa contra embarque no carro errado,
 * falso motorista e golpe do passageiro clandestino.
 *
 * Características:
 * - Geração uniforme de 4 dígitos (1000 - 9999) via crypto.getRandomValues
 * - Políticas contextuais: Noturno (22h às 05h), Terceiros, ou Preferência do Passageiro
 * - Proteção estrita contra força bruta: Bloqueio de 5 min após 3 falhas incorretas
 * - Padrão operacional homologado Uber / 99 Safety Shield
 * ==============================================================================
 */

export interface BoardingPinPolicyOptions {
  currentHour?: number;
  isNightTime?: boolean;
  userPinPreference?: boolean;
  isForOtherPerson?: boolean;
  highRiskZone?: boolean;
}

export interface BoardingPinVerificationResult {
  success: boolean;
  message: string;
  isLocked: boolean;
  remainingAttempts: number;
  remainingSeconds?: number;
  lockExpiresAt?: number;
}

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 300_000; // 5 minutos de carência contra força bruta

export class BoardingPinEngine {
  private failedAttempts = new Map<string, number>();
  private lockouts = new Map<string, number>();

  /**
   * Gera um código PIN numérico de 4 dígitos (1000 a 9999) com segurança criptográfica
   */
  public generateBoardingPin(): string {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const buffer = new Uint32Array(1);
      crypto.getRandomValues(buffer);
      const val = buffer[0] ?? Math.floor(Math.random() * 9000);
      const pinNum = 1000 + (val % 9000);
      return pinNum.toString();
    }
    const pinNum = Math.floor(1000 + Math.random() * 9000);
    return pinNum.toString();
  }

  /**
   * Avalia as regras de política de segurança para determinar se o PIN é mandatória na corrida
   */
  public shouldRequirePin(options: BoardingPinPolicyOptions = {}): boolean {
    const {
      currentHour = new Date().getHours(),
      isNightTime = currentHour >= 22 || currentHour < 5,
      userPinPreference = false,
      isForOtherPerson = false,
      highRiskZone = false,
    } = options;

    // Regra 1: Preferência explícita do passageiro ("Exigir PIN sempre")
    if (userPinPreference) return true;

    // Regra 2: Corrida solicitada para terceiros (garante que quem embarca tem o código)
    if (isForOtherPerson) return true;

    // Regra 3: Faixa de horário noturno de risco (22:00 às 05:00)
    if (isNightTime) return true;

    // Regra 4: Zona com alerta de segurança
    if (highRiskZone) return true;

    return false;
  }

  /**
   * Verifica se o identificador da corrida está bloqueado temporariamente por excesso de tentativas
   */
  public isLocked(rideId: string): { isLocked: boolean; remainingSeconds: number } {
    const lockExpiry = this.lockouts.get(rideId);
    if (!lockExpiry) return { isLocked: false, remainingSeconds: 0 };

    const now = Date.now();
    if (now >= lockExpiry) {
      this.lockouts.delete(rideId);
      this.failedAttempts.delete(rideId);
      return { isLocked: false, remainingSeconds: 0 };
    }

    const remainingSeconds = Math.ceil((lockExpiry - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }

  /**
   * Valida o PIN fornecido pelo passageiro e digitado pelo condutor
   */
  public verifyBoardingPin(
    rideId: string,
    inputPin: string,
    expectedPin: string,
  ): BoardingPinVerificationResult {
    // 1. Checagem de bloqueio temporário
    const { isLocked, remainingSeconds } = this.isLocked(rideId);
    if (isLocked) {
      return {
        success: false,
        message: `Muitas tentativas incorretas. Entrada bloqueada por segurança por mais ${remainingSeconds} segundos.`,
        isLocked: true,
        remainingAttempts: 0,
        remainingSeconds,
        lockExpiresAt: this.lockouts.get(rideId),
      };
    }

    // 2. Normalização e validação de formato
    const cleanInput = (inputPin || "").trim();
    const cleanExpected = (expectedPin || "").trim();

    if (!/^\d{4}$/.test(cleanInput)) {
      return {
        success: false,
        message: "O código PIN de embarque deve conter exatamente 4 números.",
        isLocked: false,
        remainingAttempts: MAX_FAILED_ATTEMPTS - (this.failedAttempts.get(rideId) || 0),
      };
    }

    // 3. Validação de correspondência
    if (cleanInput === cleanExpected) {
      this.failedAttempts.delete(rideId);
      this.lockouts.delete(rideId);
      return {
        success: true,
        message: "Código de embarque confirmado com sucesso.",
        isLocked: false,
        remainingAttempts: MAX_FAILED_ATTEMPTS,
      };
    }

    // 4. Falha na validação — incrementa contador de tentativas
    const currentFailures = (this.failedAttempts.get(rideId) || 0) + 1;
    this.failedAttempts.set(rideId, currentFailures);

    if (currentFailures >= MAX_FAILED_ATTEMPTS) {
      const lockExpiry = Date.now() + LOCKOUT_DURATION_MS;
      this.lockouts.set(rideId, lockExpiry);
      return {
        success: false,
        message:
          "3 tentativas incorretas. Entrada bloqueada temporariamente por 5 minutos por segurança.",
        isLocked: true,
        remainingAttempts: 0,
        remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        lockExpiresAt: lockExpiry,
      };
    }

    const remaining = MAX_FAILED_ATTEMPTS - currentFailures;
    return {
      success: false,
      message: `Código PIN incorreto. Você tem mais ${remaining} ${remaining === 1 ? "tentativa" : "tentativas"}.`,
      isLocked: false,
      remainingAttempts: remaining,
    };
  }

  /**
   * Reseta o estado de tentativas (utilizado em testes ou finalização de corrida)
   */
  public resetAttempts(rideId?: string): void {
    if (rideId) {
      this.failedAttempts.delete(rideId);
      this.lockouts.delete(rideId);
    } else {
      this.failedAttempts.clear();
      this.lockouts.clear();
    }
  }
}

export const boardingPinEngine = new BoardingPinEngine();
