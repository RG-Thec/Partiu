/**
 * ==============================================================================
 * 🔄 PARTIU — BACK-TO-BACK DISPATCH ENGINE (CORRIDAS EM CADEIA) (v2.0)
 * ==============================================================================
 * Elimina o tempo ocioso ("deadhead miles") do condutor ao antecipar a próxima
 * chamada nos minutos finais da viagem atual. Padrão 99 APK / Uber Marketplace.
 *
 * REGRAS OPERACIONAIS:
 * 1. Janela de Disparo: ETA <= 180 segundos (3 minutos) OU Distância <= 2.000m (2 km)
 *    do ponto final de desembarque.
 * 2. Raio de Coleta Adjacente: Busca chamadas com embarque a até 3.000m do desembarque.
 * 3. Enfileiramento Atômico: Ao aceitar, a chamada entra no slot QUEUED sem interromper
 *    a viagem ativa (IN_PROGRESS) nem a navegação GPS.
 * 4. Handover sem Ociosidade (Zero Downtime): Ao finalizar a corrida atual (COMPLETED),
 *    o motorista transita instantaneamente para HEADING_TO_PICKUP da próxima corrida.
 * ==============================================================================
 */

import { driverConsecutiveRidesEngine } from "./driver-consecutive-rides-engine";
import type { CorridaPartiu } from "../partiu-engine";

export interface BackToBackCandidate {
  id: string;
  passageiroNome: string;
  passageiroFoto?: string;
  passageiroNota: number;
  origemEndereco: string;
  origemCoords: [number, number]; // [lng, lat]
  destinoEndereco: string;
  destinoCoords: [number, number];
  valorEstimadoBrl: number;
  distanciaDoDesembarqueMetros: number;
  categoria: string;
  expiraEmSegundos: number;
}

export interface CurrentTripProgress {
  tripId: string;
  driverId: string;
  currentLocation: [number, number]; // [lng, lat]
  dropoffLocation: [number, number]; // [lng, lat]
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
}

export interface BackToBackEvaluation {
  eligibleForNextRide: boolean;
  triggerReason?: string;
  suggestedCandidate?: BackToBackCandidate | null;
}

export class BackToBackEngine {
  public static readonly TRIGGER_THRESHOLD_SECONDS = 180; // 3 minutos para desembarque (Padrão 99)
  public static readonly TRIGGER_THRESHOLD_METERS = 2000; // 2 km do desembarque (Padrão 99)
  public static readonly MAX_PICKUP_SEARCH_RADIUS_METERS = 3000; // Raio máximo de 3 km a partir do desembarque

  /**
   * Avalia se a viagem corrente atingiu a janela de disparo para chamadas em cadeia
   */
  public static evaluateEligibility(progress: CurrentTripProgress): boolean {
    if (progress.remainingDurationSeconds <= 0 && progress.remainingDistanceMeters <= 0) {
      return false; // Viagem já encerrada
    }
    return (
      progress.remainingDurationSeconds <= this.TRIGGER_THRESHOLD_SECONDS ||
      progress.remainingDistanceMeters <= this.TRIGGER_THRESHOLD_METERS
    );
  }

  /**
   * Calcula a distância geodésica em metros via fórmula Haversine
   */
  public static calculateDistanceMeters(
    p1: [number, number],
    p2: [number, number],
  ): number {
    const R = 6371000;
    const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
    const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1[1] * Math.PI) / 180) *
        Math.cos((p2[1] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Encontra a melhor chamada concorrente próxima ao ponto de desembarque
   */
  public static selectBestQueuedRide(
    currentDropoff: [number, number],
    availableRides: Array<{
      id: string;
      passageiroNome: string;
      passageiroNota?: number;
      origemEndereco: string;
      origemCoords: [number, number];
      destinoEndereco: string;
      destinoCoords: [number, number];
      valorEstimadoBrl: number;
      categoria?: string;
    }>,
  ): BackToBackCandidate | null {
    let bestCandidate: BackToBackCandidate | null = null;
    let shortestPickupDistance = Infinity;

    for (const ride of availableRides) {
      const dist = this.calculateDistanceMeters(currentDropoff, ride.origemCoords);
      if (dist <= this.MAX_PICKUP_SEARCH_RADIUS_METERS && dist < shortestPickupDistance) {
        shortestPickupDistance = dist;
        bestCandidate = {
          id: ride.id,
          passageiroNome: ride.passageiroNome,
          passageiroNota: ride.passageiroNota ?? 5.0,
          origemEndereco: ride.origemEndereco,
          origemCoords: ride.origemCoords,
          destinoEndereco: ride.destinoEndereco,
          destinoCoords: ride.destinoCoords,
          valorEstimadoBrl: ride.valorEstimadoBrl,
          distanciaDoDesembarqueMetros: Math.round(dist),
          categoria: ride.categoria || "CARRO",
          expiraEmSegundos: 15,
        };
      }
    }

    return bestCandidate;
  }

  /**
   * Converte uma CorridaPartiu ativa em um BackToBackCandidate
   */
  public static createCandidateFromRide(
    ride: CorridaPartiu,
    currentDropoff: [number, number],
  ): BackToBackCandidate {
    const pickupCoords: [number, number] = ride.origemCoords
      ? [ride.origemCoords.lng, ride.origemCoords.lat]
      : currentDropoff;
    const dropoffCoords: [number, number] = ride.destinoCoords
      ? [ride.destinoCoords.lng, ride.destinoCoords.lat]
      : currentDropoff;

    const dist = this.calculateDistanceMeters(currentDropoff, pickupCoords);

    return {
      id: ride.id,
      passageiroNome: ride.passageiroNome,
      passageiroFoto: undefined,
      passageiroNota: ride.avaliacaoPassageiro || 5.0,
      origemEndereco: ride.origem,
      origemCoords: pickupCoords,
      destinoEndereco: ride.destino,
      destinoCoords: dropoffCoords,
      valorEstimadoBrl: ride.valor,
      distanciaDoDesembarqueMetros: Math.round(dist),
      categoria: ride.modalidade || "CARRO",
      expiraEmSegundos: 15,
    };
  }

  /**
   * Dispara a oferta em fila para o motorista no cockpit
   */
  public static offerConsecutiveRide(
    driverId: string,
    activeRideId: string,
    candidate: BackToBackCandidate,
  ): boolean {
    const dummyRide: CorridaPartiu = {
      id: candidate.id,
      modalidade: (candidate.categoria as any) || "CARRO",
      origem: candidate.origemEndereco,
      destino: candidate.destinoEndereco,
      origemCoords: { lat: candidate.origemCoords[1], lng: candidate.origemCoords[0] },
      destinoCoords: { lat: candidate.destinoCoords[1], lng: candidate.destinoCoords[0] },
      passageiroNome: candidate.passageiroNome,
      passageiroTelefone: "22999990000",
      valor: candidate.valorEstimadoBrl,
      distanciaKm: 3.5,
      duracaoMin: 8,
      formaPagamento: "pix",
      pin: "1234",
      status: "PROCURANDO",
      criadoEm: Date.now(),
    };

    return driverConsecutiveRidesEngine.offerConsecutiveRide(driverId, activeRideId, dummyRide);
  }

  /**
   * Condutor aceita a corrida em fila
   */
  public static acceptConsecutiveRide(driverId: string): CorridaPartiu | null {
    return driverConsecutiveRidesEngine.acceptConsecutiveRide(driverId);
  }

  /**
   * Condutor recusa a corrida em fila
   */
  public static rejectConsecutiveRide(driverId: string): void {
    driverConsecutiveRidesEngine.rejectConsecutiveRide(driverId);
  }

  /**
   * Transiciona atomicamente a corrida da fila para ativa pós-desembarque
   */
  public static promoteConsecutiveRide(driverId: string): CorridaPartiu | null {
    return driverConsecutiveRidesEngine.promoteQueuedRideToActive(driverId);
  }

  /**
   * Retorna a corrida em fila do condutor se houver
   */
  public static getQueuedRide(driverId: string): CorridaPartiu | null {
    return driverConsecutiveRidesEngine.getQueuedRide(driverId);
  }
}
