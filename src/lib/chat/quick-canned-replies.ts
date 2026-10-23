/**
 * PARTIU MOBILIDADE — QUICK CANNED REPLIES & HANDS-FREE CHAT ENGINE
 * 
 * Motor de Respostas Rápidas de 1 Toque para Condutores e Passageiros.
 * Inspirado nos padrões de usabilidade e segurança viária do APK 99 (v4250).
 * 
 * Objetivos:
 * 1. Zero Digitação ao Volante: Permite ao motorista comunicar status com apenas 1 toque táctil.
 * 2. Agilidade no Embarque: Passageiro informa localização e status sem precisar abrir tela cheia de chat.
 * 3. Integração em Tempo Real: Despacho instantâneo no canal Supabase Realtime da corrida.
 * 4. Proteção Anti-Flood: Evita envios repetidos acidentais em toques múltiplos.
 */

import {
  chatRealtimeService,
  type SenderType,
  type RideMessage,
} from "../../services/ChatRealtimeService";

export type QuickReplyStage = "HEADING" | "ARRIVED" | "ON_TRIP";

export interface QuickReplyItem {
  id: string;
  text: string;
  stage: QuickReplyStage;
  targetUser: "DRIVER" | "PASSENGER";
  shortLabel?: string;
  iconName?: string;
}

const DRIVER_REPLIES_HEADING: QuickReplyItem[] = [
  { id: "d_head_1", text: "Estou a caminho", stage: "HEADING", targetUser: "DRIVER", shortLabel: "A caminho", iconName: "car" },
  { id: "d_head_2", text: "Trânsito na via", stage: "HEADING", targetUser: "DRIVER", shortLabel: "Trânsito", iconName: "alert" },
  { id: "d_head_3", text: "Chego em 2 minutos", stage: "HEADING", targetUser: "DRIVER", shortLabel: "2 min", iconName: "clock" },
  { id: "d_head_4", text: "Aguarde no ponto combinado", stage: "HEADING", targetUser: "DRIVER", shortLabel: "No ponto", iconName: "map-pin" },
];

const DRIVER_REPLIES_ARRIVED: QuickReplyItem[] = [
  { id: "d_arr_1", text: "Cheguei no local", stage: "ARRIVED", targetUser: "DRIVER", shortLabel: "No local", iconName: "check" },
  { id: "d_arr_2", text: "Pisca-alerta ligado", stage: "ARRIVED", targetUser: "DRIVER", shortLabel: "Pisca-alerta", iconName: "zap" },
  { id: "d_arr_3", text: "Em frente ao número indicado", stage: "ARRIVED", targetUser: "DRIVER", shortLabel: "No número", iconName: "map-pin" },
  { id: "d_arr_4", text: "Aguardando no portão principal", stage: "ARRIVED", targetUser: "DRIVER", shortLabel: "No portão", iconName: "door" },
  { id: "d_arr_5", text: "Pode vir com calma", stage: "ARRIVED", targetUser: "DRIVER", shortLabel: "Com calma", iconName: "smile" },
];

const DRIVER_REPLIES_ON_TRIP: QuickReplyItem[] = [
  { id: "d_trip_1", text: "Seguindo rota do aplicativo", stage: "ON_TRIP", targetUser: "DRIVER", shortLabel: "Rota do app", iconName: "compass" },
  { id: "d_trip_2", text: "Ar-condicionado ligado", stage: "ON_TRIP", targetUser: "DRIVER", shortLabel: "Ar ligado", iconName: "wind" },
  { id: "d_trip_3", text: "Alguma preferência de caminho?", stage: "ON_TRIP", targetUser: "DRIVER", shortLabel: "Caminho?", iconName: "help" },
];

const PASSENGER_REPLIES_HEADING: QuickReplyItem[] = [
  { id: "p_head_1", text: "Estou descendo", stage: "HEADING", targetUser: "PASSENGER", shortLabel: "Descendo", iconName: "arrow-down" },
  { id: "p_head_2", text: "Estou na portaria", stage: "HEADING", targetUser: "PASSENGER", shortLabel: "Portaria", iconName: "door" },
  { id: "p_head_3", text: "Aguardando na calçada", stage: "HEADING", targetUser: "PASSENGER", shortLabel: "Calçada", iconName: "user" },
  { id: "p_head_4", text: "Estou de camisa preta", stage: "HEADING", targetUser: "PASSENGER", shortLabel: "Camisa preta", iconName: "tag" },
  { id: "p_head_5", text: "Já avistei seu veículo", stage: "HEADING", targetUser: "PASSENGER", shortLabel: "Avistei", iconName: "eye" },
];

const PASSENGER_REPLIES_ARRIVED: QuickReplyItem[] = [
  { id: "p_arr_1", text: "Já estou saindo", stage: "ARRIVED", targetUser: "PASSENGER", shortLabel: "Saindo", iconName: "footprints" },
  { id: "p_arr_2", text: "Só 1 minuto, por favor", stage: "ARRIVED", targetUser: "PASSENGER", shortLabel: "1 minuto", iconName: "clock" },
  { id: "p_arr_3", text: "Estou no portão", stage: "ARRIVED", targetUser: "PASSENGER", shortLabel: "No portão", iconName: "door" },
  { id: "p_arr_4", text: "Estou atravessando a rua", stage: "ARRIVED", targetUser: "PASSENGER", shortLabel: "Atravessando", iconName: "arrow-right" },
];

const PASSENGER_REPLIES_ON_TRIP: QuickReplyItem[] = [
  { id: "p_trip_1", text: "Tudo certo, obrigado", stage: "ON_TRIP", targetUser: "PASSENGER", shortLabel: "Obrigado", iconName: "thumbs-up" },
  { id: "p_trip_2", text: "Pode seguir pelo mapa do app", stage: "ON_TRIP", targetUser: "PASSENGER", shortLabel: "Seguir mapa", iconName: "map" },
  { id: "p_trip_3", text: "Pode ligar o ar, por favor?", stage: "ON_TRIP", targetUser: "PASSENGER", shortLabel: "Ligar ar", iconName: "wind" },
];

class QuickCannedRepliesEngine {
  private lastSentByRideAndText: Map<string, number> = new Map();

  /**
   * Retorna a lista contextual de respostas rápidas para o perfil e estágio atual
   */
  public getReplies(userType: "DRIVER" | "PASSENGER", stage: QuickReplyStage): QuickReplyItem[] {
    if (userType === "DRIVER") {
      switch (stage) {
        case "HEADING":
          return DRIVER_REPLIES_HEADING;
        case "ARRIVED":
          return DRIVER_REPLIES_ARRIVED;
        case "ON_TRIP":
          return DRIVER_REPLIES_ON_TRIP;
      }
    } else {
      switch (stage) {
        case "HEADING":
          return PASSENGER_REPLIES_HEADING;
        case "ARRIVED":
          return PASSENGER_REPLIES_ARRIVED;
        case "ON_TRIP":
          return PASSENGER_REPLIES_ON_TRIP;
      }
    }
  }

  /**
   * Converte o status genérico de corrida para o estágio simplificado da barra
   */
  public resolveStage(status: string | undefined): QuickReplyStage {
    const s = (status || "").toUpperCase();
    if (s === "CHEGOU" || s === "WAITING" || s === "DRIVER_ARRIVED" || s === "WAITING_PIN") {
      return "ARRIVED";
    }
    if (s === "EM_VIAGEM" || s === "IN_PROGRESS" || s === "ON_TRIP") {
      return "ON_TRIP";
    }
    return "HEADING";
  }

  /**
   * Envia uma resposta rápida instantânea com proteção anti-flood de 2.5s
   */
  public async sendQuickReply(params: {
    rideId: string;
    senderType: "DRIVER" | "PASSENGER";
    senderId: string;
    replyText: string;
  }): Promise<{ success: boolean; message?: RideMessage; error?: string }> {
    const { rideId, senderType, senderId, replyText } = params;

    const trimmed = (replyText || "").trim();
    if (!trimmed) {
      return { success: false, error: "Texto da resposta rápida não pode ser vazio." };
    }

    // Trava de deduplicação anti-flood (mesma mensagem no intervalo de 2.5s)
    const key = `${rideId}:${senderType}:${trimmed}`;
    const agora = Date.now();
    const ultimoEnvio = this.lastSentByRideAndText.get(key) || 0;

    if (agora - ultimoEnvio < 2500) {
      return { success: false, error: "Mensagem já enviada recentemente. Aguarde um instante." };
    }

    this.lastSentByRideAndText.set(key, agora);

    const res = await chatRealtimeService.sendMessage({
      rideId,
      senderId,
      senderType,
      messageType: "SMART_REPLY",
      content: trimmed,
    });

    if (res.success && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:quick-reply-sent", {
          detail: { rideId, senderType, text: trimmed, timestamp: agora },
        }),
      );
    }

    return res;
  }

  /**
   * Limpa caches de proteção ao finalizar a corrida
   */
  public clearRide(rideId: string): void {
    for (const key of this.lastSentByRideAndText.keys()) {
      if (key.startsWith(`${rideId}:`)) {
        this.lastSentByRideAndText.delete(key);
      }
    }
  }
}

export const quickCannedRepliesEngine = new QuickCannedRepliesEngine();
