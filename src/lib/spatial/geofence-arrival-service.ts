/**
 * ==============================================================================
 * 🛰️ PARTIU SPATIAL ENGINE — GEOFENCE ARRIVAL SERVICE (v1.0)
 * ==============================================================================
 * Detecção automática de chegada do condutor ao ponto de embarque (Pick-up)
 * ou ponto de entrega (< 50 metros), padrão Uber e 99.
 *
 * Elimina a necessidade de o motorista tirar as mãos do volante para clicar
 * manualmente em "Cheguei ao Local", disparando notificação e áudio ao passageiro.
 * ==============================================================================
 */

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface GeofenceCheckResult {
  isWithinThreshold: boolean;
  distanceMeters: number;
  thresholdMeters: number;
}

export interface WaitToleranceStatus {
  rideId: string;
  arrivedAt: number;
  durationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  isNoShowEligible: boolean;
}

export class GeofenceArrivalService {
  private static instance: GeofenceArrivalService;
  private triggeredRides: Set<string> = new Set();
  private triggeredProximities: Set<string> = new Set();
  private waitTimers: Map<
    string,
    { arrivedAt: number; durationSeconds: number }
  > = new Map();

  private constructor() {}

  public static getInstance(): GeofenceArrivalService {
    if (!GeofenceArrivalService.instance) {
      GeofenceArrivalService.instance = new GeofenceArrivalService();
    }
    return GeofenceArrivalService.instance;
  }

  /**
   * Calcula a distância geodésica em metros (Haversine) entre dois pontos
   */
  public calculateDistanceMeters(a: LatLngPoint, b: LatLngPoint): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;

    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);

    const x = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return Math.round(R * c);
  }

  /**
   * Avalia se a localização atual do motorista cruzou o limiar de proximidade
   */
  public checkArrival(
    driverLoc: LatLngPoint,
    targetLoc: LatLngPoint,
    thresholdMeters = 50,
  ): GeofenceCheckResult {
    const distanceMeters = this.calculateDistanceMeters(driverLoc, targetLoc);
    return {
      isWithinThreshold: distanceMeters <= thresholdMeters,
      distanceMeters,
      thresholdMeters,
    };
  }

  /**
   * Verifica e consome o evento de chegada para uma corrida (garante acionamento único)
   */
  public shouldTriggerArrival(
    rideId: string,
    driverLoc: LatLngPoint,
    targetLoc: LatLngPoint,
    thresholdMeters = 50,
  ): boolean {
    if (this.triggeredRides.has(rideId)) {
      return false; // Já acionado anteriormente
    }

    const { isWithinThreshold } = this.checkArrival(driverLoc, targetLoc, thresholdMeters);
    if (isWithinThreshold) {
      this.triggeredRides.add(rideId);
      return true;
    }

    return false;
  }

  /**
   * Verifica e consome o evento de alerta de aproximação de 500m (para embarque ou destino)
   * Garante exatamente 1 disparo por etapa para evitar repetição incômoda.
   */
  public shouldTriggerProximity500m(
    rideId: string,
    stage: "PICKUP" | "DESTINATION",
    driverLoc: LatLngPoint,
    targetLoc: LatLngPoint,
    thresholdMeters = 500,
  ): boolean {
    const key = `${rideId}:::${stage}`;
    if (this.triggeredProximities.has(key)) {
      return false; // Já alertou 500m para esta etapa
    }

    const { isWithinThreshold, distanceMeters } = this.checkArrival(
      driverLoc,
      targetLoc,
      thresholdMeters,
    );

    if (isWithinThreshold) {
      this.triggeredProximities.add(key);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("partiu:proximity_500m_alert", {
            detail: {
              rideId,
              stage,
              distanceMeters,
              timestamp: Date.now(),
            },
          }),
        );
      }

      return true;
    }

    return false;
  }

  /**
   * Consulta se o alerta de 500m já foi disparado nesta etapa
   */
  public isProximity500mTriggered(rideId: string, stage: "PICKUP" | "DESTINATION"): boolean {
    return this.triggeredProximities.has(`${rideId}:::${stage}`);
  }

  /**
   * Limpa o estado de uma corrida concluída ou cancelada
   */
  public clearRide(rideId: string): void {
    this.triggeredRides.delete(rideId);
    this.waitTimers.delete(rideId);
    this.triggeredProximities.delete(`${rideId}:::PICKUP`);
    this.triggeredProximities.delete(`${rideId}:::DESTINATION`);
  }

  /**
   * Reseta o histórico (útil para testes unitários)
   */
  public reset(): void {
    this.triggeredRides.clear();
    this.waitTimers.clear();
    this.triggeredProximities.clear();
  }

  /**
   * Inicia o cronômetro oficial de tolerância de espera (padrão: 5 minutos / 300s).
   * Após o término, o motorista torna-se elegível a cancelar com cobrança de taxa de No-Show.
   */
  public startWaitToleranceTimer(
    rideId: string,
    durationSeconds = 300,
  ): WaitToleranceStatus {
    const arrivedAt = Date.now();
    this.waitTimers.set(rideId, { arrivedAt, durationSeconds });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:wait_tolerance_started", {
          detail: { rideId, arrivedAt, durationSeconds },
        }),
      );
    }

    return {
      rideId,
      arrivedAt,
      durationSeconds,
      elapsedSeconds: 0,
      remainingSeconds: durationSeconds,
      isNoShowEligible: false,
    };
  }

  /**
   * Consulta o estado atual da tolerância de espera de uma corrida
   */
  public getWaitToleranceStatus(rideId: string): WaitToleranceStatus | null {
    const entry = this.waitTimers.get(rideId);
    if (!entry) return null;

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - entry.arrivedAt) / 1000),
    );
    const remainingSeconds = Math.max(0, entry.durationSeconds - elapsedSeconds);
    const isNoShowEligible = remainingSeconds === 0;

    return {
      rideId,
      arrivedAt: entry.arrivedAt,
      durationSeconds: entry.durationSeconds,
      elapsedSeconds,
      remainingSeconds,
      isNoShowEligible,
    };
  }

  /**
   * Cancela o temporizador de tolerância (ex: quando o passageiro embarca)
   */
  public cancelWaitToleranceTimer(rideId: string): void {
    this.waitTimers.delete(rideId);
  }
}

export const geofenceArrivalService = GeofenceArrivalService.getInstance();
