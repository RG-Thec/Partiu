/**
 * ==============================================================================
 * 🔄 PARTIU ON-SERVICE REASSIGN ENGINE (v1.0) — 99 & UBER STANDARD
 * ==============================================================================
 * Motor de reatribuição transparente de corrida quando o condutor cancela
 * durante o deslocamento de coleta (HEADING_TO_PICKUP / A_CAMINHO / CHEGOU).
 *
 * Baseado no evento canônico do APK 99:
 * EVENT_ONSERVICE_CANCEL_ORDER_REASSIGN_SUCCESS
 *
 * Invariantes Operacionais:
 * 1. O pedido do passageiro PERMANECE ATIVO (não reseta para IDLE nem exige redigitação).
 * 2. O motorista que desistiu é inserido na lista negra de exclusão (excludedDriverIds)
 *    para não receber a mesma corrida novamente.
 * 3. O lock atômico do condutor que desistiu é liberado instantaneamente.
 * 4. A cascata de despacho inteligente é reiniciada para os próximos condutores mais próximos.
 * 5. O passageiro recebe notificação contextual suave ("Localizando outro parceiro...").
 * ==============================================================================
 */

import {
  type CorridaPartiu,
  getCorridaAtiva,
  salvarCorridaAtiva,
  notificarMudanca,
} from "../partiu-engine";
import { atomicMatchingEngine } from "./atomic-matching";
import { progressiveDispatchEngine } from "@/services/ProgressiveDispatchEngine";
import { dispatchQueueBuilder } from "@/services/DispatchQueueBuilder";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { silentCatchWarn } from "@/lib/structured-logger";

export interface OnServiceReassignParams {
  rideId: string;
  cancellingDriverId: string;
  reasonCode: string;
  reasonLabel: string;
  coords?: { lat: number; lng: number } | undefined;
}

export interface OnServiceReassignResult {
  success: boolean;
  reassigned: boolean;
  ride: CorridaPartiu | null;
  reassignCount: number;
  message: string;
}

export class OnServiceReassignEngine {
  private static instance: OnServiceReassignEngine;

  private constructor() {}

  public static getInstance(): OnServiceReassignEngine {
    if (!OnServiceReassignEngine.instance) {
      OnServiceReassignEngine.instance = new OnServiceReassignEngine();
    }
    return OnServiceReassignEngine.instance;
  }

  /**
   * Executa a reatribuição transparente de uma corrida após desistência do condutor
   */
  public async reassignOnDriverCancellation(
    params: OnServiceReassignParams,
  ): Promise<OnServiceReassignResult> {
    const currentRide = getCorridaAtiva();
    const rideToReassign = currentRide && currentRide.id === params.rideId ? currentRide : null;

    if (!rideToReassign) {
      // Se não houver corrida ativa correspondente, não é possível reatribuir
      return {
        success: false,
        reassigned: false,
        ride: null,
        reassignCount: 0,
        message: "Corrida não localizada no cache ativo para reatribuição.",
      };
    }

    // Se a viagem já tiver sido iniciada (EM_VIAGEM), o cancelamento é crítico e não elegível a reatribuição automática
    if (rideToReassign.status === "EM_VIAGEM") {
      return {
        success: false,
        reassigned: false,
        ride: rideToReassign,
        reassignCount: rideToReassign.reassignCount || 0,
        message: "Viagem em andamento: reatribuição automática não permitida.",
      };
    }

    const timestamp = Date.now();
    const excluded = new Set(rideToReassign.excludedDriverIds || []);
    excluded.add(params.cancellingDriverId);

    const reassignCount = (rideToReassign.reassignCount || 0) + 1;

    // Constrói a corrida saneada pronta para novo despacho
    const updatedRide: CorridaPartiu = {
      ...rideToReassign,
      status: "PROCURANDO",
      motorista: undefined,
      excludedDriverIds: Array.from(excluded),
      reassignCount,
      lastReassignReason: params.reasonLabel || params.reasonCode,
      reassignedAt: timestamp,
    };

    // 1. Libera o lock atômico do condutor que cancelou
    try {
      atomicMatchingEngine.releaseRide(params.rideId, params.cancellingDriverId);
    } catch (err) {
      silentCatchWarn("OnServiceReassignEngine:releaseLock", err);
    }

    // 2. Persiste estado atualizado localmente
    salvarCorridaAtiva(updatedRide);
    notificarMudanca(updatedRide);

    // 3. Atualiza banco remoto (Supabase) desvinculando o motorista e voltando para REQUESTED
    if (isSupabaseConfigured()) {
      try {
        await (supabase as any)
          .from("rides")
          .update({
            status: "REQUESTED",
            driver_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.rideId);
      } catch (err) {
        silentCatchWarn("OnServiceReassignEngine:remoteUpdate", err);
      }
    }

    // 4. Emite eventos canônicos para interface do passageiro
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:driver_cancelled_reassigning", {
          detail: {
            rideId: params.rideId,
            cancellingDriverId: params.cancellingDriverId,
            reason: params.reasonLabel,
            reasonCode: params.reasonCode,
            reassignCount,
            timestamp,
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("partiu:corrida_atualizada", {
          detail: updatedRide,
        }),
      );
    }

    // 5. Reinicia a cascata de despacho inteligente ignorando condutores excluídos
    try {
      if (updatedRide.origemCoords && updatedRide.destinoCoords) {
        void progressiveDispatchEngine.startProgressiveDispatch({
          rideId: updatedRide.id,
          category: updatedRide.modalidade || "CARRO",
          pickupCoords: [updatedRide.origemCoords.lng, updatedRide.origemCoords.lat],
          destinationCoords: [updatedRide.destinoCoords.lng, updatedRide.destinoCoords.lat],
          fareBrl: updatedRide.valor,
        });

        void dispatchQueueBuilder.startCascadeDispatch({
          rideId: updatedRide.id,
          category: updatedRide.modalidade || "CARRO",
          pickupCoords: [updatedRide.origemCoords.lng, updatedRide.origemCoords.lat],
          destinationCoords: [updatedRide.destinoCoords.lng, updatedRide.destinoCoords.lat],
          fareBrl: updatedRide.valor,
        });
      }
    } catch (err) {
      silentCatchWarn("OnServiceReassignEngine:restartDispatch", err);
    }

    return {
      success: true,
      reassigned: true,
      ride: updatedRide,
      reassignCount,
      message: `Corrida reatribuída com sucesso. Motorista ${params.cancellingDriverId} excluído da fila.`,
    };
  }
}

export const onServiceReassignEngine = OnServiceReassignEngine.getInstance();
