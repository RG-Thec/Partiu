/**
 * ==============================================================================
 * 🔄 PARTIU — BACK-TO-BACK DISPATCH ENGINE (CORRIDAS EM CADEIA)
 * ==============================================================================
 * Elimina o tempo ocioso ("deadhead miles") do condutor ao antecipar a próxima
 * chamada nos minutos finais da viagem atual.
 *
 * Quando a corrida ativa atinge o limiar de aproximação do desembarque
 * (ETA <= 120 segundos ou Distância <= 1.500m), o motor H3 busca passageiros
 * com embarque adjacente ao destino final e despacha a oferta em fila.
 * ==============================================================================
 */

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
  public static readonly TRIGGER_THRESHOLD_SECONDS = 120; // 2 minutos para desembarque
  public static readonly TRIGGER_THRESHOLD_METERS = 1500; // 1,5 km do desembarque
  public static readonly MAX_PICKUP_SEARCH_RADIUS_METERS = 2000; // Raio máximo de 2 km a partir do desembarque

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
   * Calcula a distância geodésica em metros
   */
  public static calculateDistanceMeters(
    p1: [number, number],
    p2: [number, number]
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
    }>
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
}
