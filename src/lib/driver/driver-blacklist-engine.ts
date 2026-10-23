/**
 * ==============================================================================
 * 🛡️ PARTIU MUTUAL BLACKLIST ENGINE (ONDA 11 — PADRÃO 99 BLOQUEIO SOBERANO)
 * ==============================================================================
 * Mecanismo de bloqueio mútuo e soberano pós-corrida.
 *
 * Princípios:
 * 1. O motorista pode escolher bloquear permanentemente um passageiro após uma corrida.
 * 2. O passageiro também pode bloquear um motorista caso deseje.
 * 3. O algoritmo de despacho em cascata (DispatchQueueBuilder) e o MatchingEngine
 *    excluem automaticamente os pares bloqueados de qualquer futura distribuição.
 * 4. A taxa de aceitação do motorista NUNCA é penalizada por chamadas de passageiros bloqueados,
 *    pois a oferta é suprimida antes de chegar ao seu cockpit.
 * ==============================================================================
 */

export type BlacklistReasonCode =
  | "INAPPROPRIATE_BEHAVIOR"
  | "SECURITY_RISK"
  | "PAYMENT_ISSUE"
  | "DISRESPECTFUL"
  | "OTHER";

export const BLACKLIST_REASON_LABELS: Record<BlacklistReasonCode, string> = {
  INAPPROPRIATE_BEHAVIOR: "Comportamento inadequado",
  SECURITY_RISK: "Risco à segurança",
  PAYMENT_ISSUE: "Problema com pagamento",
  DISRESPECTFUL: "Desrespeito ao condutor",
  OTHER: "Outro motivo",
};

export interface BlockedPassengerEntry {
  driverId: string;
  passengerId: string;
  passengerName?: string | undefined;
  rideId?: string | undefined;
  reasonCode: BlacklistReasonCode;
  reasonDetails?: string | undefined;
  blockedAt: number;
}

export interface BlockedDriverEntry {
  passengerId: string;
  driverId: string;
  driverName?: string | undefined;
  rideId?: string | undefined;
  reason?: string | undefined;
  blockedAt: number;
}

const STORAGE_KEY_DRIVER_BLOCKS = "partiu_driver_blocked_passengers_v1";
const STORAGE_KEY_PASSENGER_BLOCKS = "partiu_passenger_blocked_drivers_v1";

export class DriverBlacklistEngine {
  private static instance: DriverBlacklistEngine;
  private driverBlocks: Map<string, BlockedPassengerEntry> = new Map();
  private passengerBlocks: Map<string, BlockedDriverEntry> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): DriverBlacklistEngine {
    if (!DriverBlacklistEngine.instance) {
      DriverBlacklistEngine.instance = new DriverBlacklistEngine();
    }
    return DriverBlacklistEngine.instance;
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;

    try {
      const rawDriver = localStorage.getItem(STORAGE_KEY_DRIVER_BLOCKS);
      if (rawDriver) {
        const list: BlockedPassengerEntry[] = JSON.parse(rawDriver);
        if (Array.isArray(list)) {
          list.forEach((item) => {
            const key = `${item.driverId}:::${item.passengerId}`;
            this.driverBlocks.set(key, item);
          });
        }
      }

      const rawPassenger = localStorage.getItem(STORAGE_KEY_PASSENGER_BLOCKS);
      if (rawPassenger) {
        const list: BlockedDriverEntry[] = JSON.parse(rawPassenger);
        if (Array.isArray(list)) {
          list.forEach((item) => {
            const key = `${item.passengerId}:::${item.driverId}`;
            this.passengerBlocks.set(key, item);
          });
        }
      }
    } catch {
      // Falha silenciosa em deserialização
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;

    try {
      const driverList = Array.from(this.driverBlocks.values());
      localStorage.setItem(STORAGE_KEY_DRIVER_BLOCKS, JSON.stringify(driverList));

      const passengerList = Array.from(this.passengerBlocks.values());
      localStorage.setItem(STORAGE_KEY_PASSENGER_BLOCKS, JSON.stringify(passengerList));
    } catch {
      // Ignora erro de quota local
    }
  }

  /**
   * Bloqueia um passageiro pelo motorista
   */
  public blockPassenger(entry: BlockedPassengerEntry): void {
    const key = `${entry.driverId}:::${entry.passengerId}`;
    this.driverBlocks.set(key, {
      ...entry,
      blockedAt: entry.blockedAt || Date.now(),
    });
    this.saveToStorage();

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:passenger_blocked", {
          detail: entry,
        }),
      );
    }
  }

  /**
   * Desbloqueia um passageiro
   */
  public unblockPassenger(driverId: string, passengerId: string): void {
    const key = `${driverId}:::${passengerId}`;
    if (this.driverBlocks.delete(key)) {
      this.saveToStorage();
    }
  }

  /**
   * Verifica se o passageiro foi bloqueado por este motorista
   */
  public isPassengerBlockedByDriver(driverId: string, passengerId: string): boolean {
    const key = `${driverId}:::${passengerId}`;
    return this.driverBlocks.has(key);
  }

  /**
   * Bloqueia um motorista pelo passageiro (Bloqueio Mútuo)
   */
  public blockDriverByPassenger(entry: BlockedDriverEntry): void {
    const key = `${entry.passengerId}:::${entry.driverId}`;
    this.passengerBlocks.set(key, {
      ...entry,
      blockedAt: entry.blockedAt || Date.now(),
    });
    this.saveToStorage();

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:driver_blocked_by_passenger", {
          detail: entry,
        }),
      );
    }
  }

  /**
   * Verifica se o motorista foi bloqueado pelo passageiro
   */
  public isDriverBlockedByPassenger(passengerId: string, driverId: string): boolean {
    const key = `${passengerId}:::${driverId}`;
    return this.passengerBlocks.has(key);
  }

  /**
   * Verifica se há qualquer bloqueio mútuo entre o motorista e o passageiro
   */
  public isMutualBlocked(driverId: string, passengerId: string): boolean {
    return (
      this.isPassengerBlockedByDriver(driverId, passengerId) ||
      this.isDriverBlockedByPassenger(passengerId, driverId)
    );
  }

  /**
   * Retorna a lista de IDs de motoristas que NÃO devem ser despachados para este passageiro:
   * 1. Motoristas que este passageiro bloqueou
   * 2. Motoristas que bloquearam este passageiro
   */
  public getBlockedDriverIdsForPassenger(passengerId: string): string[] {
    if (!passengerId) return [];

    const blockedSet = new Set<string>();

    // Motoristas bloqueados pelo passageiro
    for (const item of this.passengerBlocks.values()) {
      if (item.passengerId === passengerId) {
        blockedSet.add(item.driverId);
      }
    }

    // Motoristas que bloquearam este passageiro
    for (const item of this.driverBlocks.values()) {
      if (item.passengerId === passengerId) {
        blockedSet.add(item.driverId);
      }
    }

    return Array.from(blockedSet);
  }

  /**
   * Lista todos os passageiros bloqueados por um motorista
   */
  public listBlockedPassengers(driverId: string): BlockedPassengerEntry[] {
    return Array.from(this.driverBlocks.values()).filter((item) => item.driverId === driverId);
  }

  /**
   * Limpa histórico em memória (para testes unitários)
   */
  public resetForTesting(): void {
    this.driverBlocks.clear();
    this.passengerBlocks.clear();
  }
}

export const driverBlacklistEngine = DriverBlacklistEngine.getInstance();
