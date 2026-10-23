/**
 * ==============================================================================
 * 🛑 PARTIU — MULTI-STOP WAYPOINT ENGINE (v1.0)
 * ==============================================================================
 * Motor de Gerenciamento e Progressão Sequencial de Múltiplas Paradas (Waypoints):
 * 1. Suporte estruturado a até 2 paradas intermediárias além do destino final.
 * 2. Cálculo da sobretaxa de paradas (R$ 2,50 por parada intermediária).
 * 3. Ciclo de vida por parada: PENDING -> COMPLETED / SKIPPED com timestamp.
 * 4. Handover atômico do alvo de navegação (Waze, Google Maps e mapa interno).
 * 5. Emissão de telemetria e eventos em tempo real para sincronização com o passageiro.
 * ==============================================================================
 */

import { haversineDistanceMeters } from "@/lib/geo/polyline-optimizer";
import { AuditTrailService } from "@/lib/security/audit-trail";
import { silentCatchWarn } from "@/lib/structured-logger";
import type { CorridaPartiu } from "@/lib/partiu-engine";

export interface RideStopItem {
  id: string;
  sequence: number; // 0 para primeira parada, 1 para segunda
  endereco: string;
  coords?: { lat: number; lng: number };
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  completedAt?: number;
}

export interface MultiStopProgress {
  totalStops: number;
  completedStopsCount: number;
  currentStopIndex: number; // Índice da parada intermediária atual (0..totalStops-1)
  isAllIntermediateStopsCompleted: boolean;
  activeTarget: {
    label: string;
    endereco: string;
    coords?: { lat: number; lng: number };
    isFinalDestination: boolean;
  };
  stops: RideStopItem[];
}

export class MultiStopEngine {
  private static instance: MultiStopEngine;
  public static readonly SURCHARGE_PER_STOP_BRL = 2.5;
  public static readonly MAX_INTERMEDIATE_STOPS = 2;

  private constructor() {}

  public static getInstance(): MultiStopEngine {
    if (!MultiStopEngine.instance) {
      MultiStopEngine.instance = new MultiStopEngine();
    }
    return MultiStopEngine.instance;
  }

  /**
   * Normaliza a lista de paradas brutas em formato tipado e indexado
   */
  public normalizeStops(rawStops?: any[]): RideStopItem[] {
    if (!rawStops || !Array.isArray(rawStops) || rawStops.length === 0) {
      return [];
    }

    return rawStops.slice(0, MultiStopEngine.MAX_INTERMEDIATE_STOPS).map((stop, index) => {
      let coords: { lat: number; lng: number } | undefined;
      if (stop.coords) {
        if (typeof stop.coords.lat === "number" && typeof stop.coords.lng === "number") {
          coords = { lat: stop.coords.lat, lng: stop.coords.lng };
        } else if (Array.isArray(stop.coords) && stop.coords.length >= 2) {
          coords = { lat: stop.coords[1], lng: stop.coords[0] };
        }
      }

      return {
        id: stop.id || `stop_${index + 1}_${Date.now()}`,
        sequence: index,
        endereco: stop.endereco || `Parada ${index + 1}`,
        coords,
        status: stop.status === "COMPLETED" || stop.status === "SKIPPED" ? stop.status : "PENDING",
        completedAt: stop.completedAt,
      };
    });
  }

  /**
   * Calcula o valor adicional total cobrado pelas paradas intermediárias
   */
  public calculateStopsSurcharge(stopsCount: number): number {
    const validCount = Math.min(
      Math.max(0, stopsCount),
      MultiStopEngine.MAX_INTERMEDIATE_STOPS
    );
    return Number((validCount * MultiStopEngine.SURCHARGE_PER_STOP_BRL).toFixed(2));
  }

  /**
   * Avalia o progresso atual das paradas na corrida
   */
  public getProgress(ride: {
    destino?: string;
    destinoCoords?: { lat: number; lng: number } | [number, number];
    paradas?: any[];
    paradasConcluidas?: number;
  }): MultiStopProgress {
    const stops = this.normalizeStops(ride.paradas);
    const totalStops = stops.length;
    const completedStopsCount = Math.min(
      Math.max(0, ride.paradasConcluidas || 0),
      totalStops
    );

    const isAllIntermediateStopsCompleted = completedStopsCount >= totalStops;
    const currentStopIndex = completedStopsCount;

    let finalCoords: { lat: number; lng: number } | undefined;
    if (ride.destinoCoords) {
      if (Array.isArray(ride.destinoCoords)) {
        finalCoords = { lat: ride.destinoCoords[1], lng: ride.destinoCoords[0] };
      } else if (typeof ride.destinoCoords.lat === "number") {
        finalCoords = ride.destinoCoords;
      }
    }

    if (!isAllIntermediateStopsCompleted && stops[currentStopIndex]) {
      const activeStop = stops[currentStopIndex];
      return {
        totalStops,
        completedStopsCount,
        currentStopIndex,
        isAllIntermediateStopsCompleted: false,
        activeTarget: {
          label: `Parada ${currentStopIndex + 1} de ${totalStops}`,
          endereco: activeStop.endereco,
          coords: activeStop.coords,
          isFinalDestination: false,
        },
        stops,
      };
    }

    return {
      totalStops,
      completedStopsCount,
      currentStopIndex: totalStops,
      isAllIntermediateStopsCompleted: true,
      activeTarget: {
        label: "Destino Final",
        endereco: ride.destino || "Destino Informado",
        coords: finalCoords,
        isFinalDestination: true,
      },
      stops,
    };
  }

  /**
   * Conclui atomicamente a parada intermediária atual e avança para a próxima
   */
  public advanceStop(ride: CorridaPartiu): {
    updatedRide: CorridaPartiu;
    completedStop?: RideStopItem;
    isFinalDestination: boolean;
    nextTargetLabel: string;
  } {
    const stops = this.normalizeStops(ride.paradas);
    const currentCompleted = ride.paradasConcluidas || 0;

    if (currentCompleted < stops.length) {
      const targetStop = stops[currentCompleted];
      targetStop.status = "COMPLETED";
      targetStop.completedAt = Date.now();

      const newCompletedCount = currentCompleted + 1;
      const isFinal = newCompletedCount >= stops.length;

      const updatedRide: CorridaPartiu = {
        ...ride,
        paradas: stops,
        paradasConcluidas: newCompletedCount,
      };

      // Auditoria Imutável de Segurança
      AuditTrailService.getInstance().logEvent({
        userId: ride.motorista?.id ? `driver:${ride.motorista.id}` : "driver:system",
        action: "RIDE_WAYPOINT_STOP_COMPLETED",
        resource: `ride:${ride.id}:stop:${targetStop.sequence}`,
        status: "SUCCESS",
        details: {
          rideId: ride.id,
          stopIndex: targetStop.sequence,
          stopAddress: targetStop.endereco,
          isFinalDestination: isFinal,
        },
      });

      // Emissão de Evento Customizado para Telas e Sockets
      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
        try {
          window.dispatchEvent(
            new CustomEvent("partiu:stop_completed", {
              detail: {
                rideId: ride.id,
                stopIndex: targetStop.sequence,
                completedAddress: targetStop.endereco,
                isFinalDestination: isFinal,
                nextTargetLabel: isFinal
                  ? "Destino Final"
                  : stops[newCompletedCount]?.endereco || "Próxima Parada",
              },
            })
          );
        } catch (err) {
          silentCatchWarn("MultiStopEngine:dispatchEvent", err);
        }
      }

      return {
        updatedRide,
        completedStop: targetStop,
        isFinalDestination: isFinal,
        nextTargetLabel: isFinal
          ? "Destino Final"
          : stops[newCompletedCount]?.endereco || "Próxima Parada",
      };
    }

    return {
      updatedRide: ride,
      isFinalDestination: true,
      nextTargetLabel: "Destino Final",
    };
  }

  /**
   * Pula uma parada intermediária caso solicitado pelo passageiro
   */
  public skipStop(
    ride: CorridaPartiu,
    stopIndex: number
  ): { updatedRide: CorridaPartiu; skippedStop?: RideStopItem } {
    const stops = this.normalizeStops(ride.paradas);
    const stopToSkip = stops[stopIndex];

    if (stopToSkip && stopToSkip.status === "PENDING") {
      stopToSkip.status = "SKIPPED";
      stopToSkip.completedAt = Date.now();

      const updatedRide: CorridaPartiu = {
        ...ride,
        paradas: stops,
        paradasConcluidas: (ride.paradasConcluidas || 0) + 1,
      };

      return {
        updatedRide,
        skippedStop: stopToSkip,
      };
    }

    return { updatedRide: ride };
  }
}

export const multiStopEngine = MultiStopEngine.getInstance();
