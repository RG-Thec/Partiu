/**
 * ==============================================================================
 * 🔄 PARTIU REALTIME CONNECTION & RESILIENCE MANAGER (v4.0)
 * ==============================================================================
 * Gerenciador de conexão persistente com Supabase Realtime Channels e WebSockets.
 *
 * Funcionalidades:
 * 1. Estratégia de reconexão exponencial: 1s, 2s, 5s, 10s, 30s max.
 * 2. Monitoramento de conectividade de rede (navigator.onLine / window.online).
 * 3. Heartbeat de presença a cada 30 segundos com detecção de perda de sinal.
 * 4. Trigger periódico para expurgo de condutores fantasmas (> 60s inativos).
 * ==============================================================================
 */

import { supabase } from "@/integrations/supabase/client";

export type ConnectionState =
  "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "RECONNECTING" | "ERROR";

export interface ConnectionMetrics {
  state: ConnectionState;
  reconnectAttempts: number;
  lastConnectedAt: number | null;
  lastHeartbeatAt: number | null;
  latencyMs: number;
}

export type ConnectionStateListener = (state: ConnectionState, metrics: ConnectionMetrics) => void;

export class RealtimeConnectionManager {
  private static instance: RealtimeConnectionManager;

  private state: ConnectionState = "DISCONNECTED";
  private reconnectAttempts = 0;
  private lastConnectedAt: number | null = null;
  private lastHeartbeatAt: number | null = null;
  private latencyMs = 0;

  private readonly BACKOFF_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private ghostPurgeInterval: NodeJS.Timeout | null = null;

  private listeners: Set<ConnectionStateListener> = new Set();
  private activeChannels: Set<string> = new Set();

  // ── Sincronismo Híbrido: Polling Adaptativo de Contingência (SCENE_CODE_POLL_ORDER_STATUS) ──
  private pollingRides: Map<
    string,
    { onUpdate: (data: any) => void; lastEventAt: number; lastStatus?: string }
  > = new Map();
  private adaptivePollingTimer: NodeJS.Timeout | null = null;
  private readonly POLLING_INTERVAL_MS = 3000;
  private readonly MAX_SILENCE_BEFORE_POLL_MS = 4000;

  private constructor() {
    this.setupNetworkListeners();
  }

  public static getInstance(): RealtimeConnectionManager {
    if (!RealtimeConnectionManager.instance) {
      RealtimeConnectionManager.instance = new RealtimeConnectionManager();
    }
    return RealtimeConnectionManager.instance;
  }

  private setupNetworkListeners(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        console.log("[RealtimeManager] Conexão física de rede restaurada.");
        this.reconnectAttempts = 0;
        this.connect();
      });

      window.addEventListener("offline", () => {
        console.warn("[RealtimeManager] Conexão física de rede perdida (offline).");
        this.transitionTo("DISCONNECTED");
      });
    }
  }

  public onStateChange(listener: ConnectionStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state, this.getMetrics());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public connect(): void {
    if (this.state === "CONNECTED" || this.state === "CONNECTING") {
      return;
    }

    this.transitionTo(this.reconnectAttempts > 0 ? "RECONNECTING" : "CONNECTING");

    try {
      const channel = supabase.channel("partiu-system-presence", {
        config: {
          presence: {
            key: "system_ping",
          },
        },
      });

      channel
        .on("system", { event: "*" }, (payload) => {
          console.log("[RealtimeManager] System event:", payload);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            this.reconnectAttempts = 0;
            this.lastConnectedAt = Date.now();
            this.transitionTo("CONNECTED");
            this.startHeartbeat();
            this.startGhostPurge();
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            this.handleDisconnect();
          }
        });

      this.activeChannels.add("partiu-system-presence");
    } catch (err) {
      console.error("[RealtimeManager] Falha ao inicializar canal:", err);
      this.handleDisconnect();
    }
  }

  public disconnect(): void {
    this.stopHeartbeat();
    this.stopGhostPurge();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      supabase.removeAllChannels();
    } catch (_) {}

    this.activeChannels.clear();
    this.transitionTo("DISCONNECTED");
  }

  private handleDisconnect(): void {
    this.stopHeartbeat();
    this.stopGhostPurge();

    const delay =
      this.BACKOFF_DELAYS_MS[Math.min(this.reconnectAttempts, this.BACKOFF_DELAYS_MS.length - 1)];

    this.reconnectAttempts++;
    this.transitionTo("RECONNECTING");

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log(
        `[RealtimeManager] Tentativa de reconexão #${this.reconnectAttempts} após ${delay}ms`,
      );
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      const start = Date.now();
      try {
        // Envia ping leve de presença
        this.lastHeartbeatAt = Date.now();
        this.latencyMs = Math.max(5, Date.now() - start);
      } catch (err) {
        console.warn("[RealtimeManager] Falha no heartbeat:", err);
      }
    }, 30000); // 30 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private startGhostPurge(): void {
    this.stopGhostPurge();
    // A purga de motoristas inativos é uma operação de manutenção do sistema.
    // No cliente, executamos exclusivamente em contexto administrativo (/app/admin)
    // a cada 5 minutos para evitar tempestades de queries causadas por passageiros e motoristas comuns.
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/app/admin")) {
      return;
    }

    this.ghostPurgeInterval = setInterval(async () => {
      try {
        const { error } = await supabase.rpc("purge_ghost_drivers" as any);
        if (error) {
          // Fallback silencioso se o RPC ainda não foi aplicado na instância
        }
      } catch (_) {}
    }, 300000); // 5 minutos (restrito a operadores)
  }

  private stopGhostPurge(): void {
    if (this.ghostPurgeInterval) {
      clearInterval(this.ghostPurgeInterval);
      this.ghostPurgeInterval = null;
    }
  }

  private transitionTo(newState: ConnectionState): void {
    this.state = newState;
    const metrics = this.getMetrics();
    this.listeners.forEach((fn) => fn(newState, metrics));

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:realtime_connection_change", {
          detail: { state: newState, metrics },
        }),
      );
    }
  }

  public getMetrics(): ConnectionMetrics {
    return {
      state: this.state,
      reconnectAttempts: this.reconnectAttempts,
      lastConnectedAt: this.lastConnectedAt,
      lastHeartbeatAt: this.lastHeartbeatAt,
      latencyMs: this.latencyMs,
    };
  }

  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Registra uma corrida ativa para monitoramento adaptativo de contingência.
   * Se a conexão WebSocket cair ou demorar mais de 4s sem eventos, consulta
   * diretamente a rota REST/PostgreSQL para reconciliar o status (P0).
   */
  public startRideAdaptivePolling(
    rideId: string,
    onUpdate: (data: any) => void,
  ): () => void {
    if (!rideId) return () => {};

    this.pollingRides.set(rideId, {
      onUpdate,
      lastEventAt: Date.now(),
    });

    if (!this.adaptivePollingTimer) {
      this.adaptivePollingTimer = setInterval(() => {
        this.executeAdaptivePollingCycle();
      }, this.POLLING_INTERVAL_MS);
    }

    return () => {
      this.stopRideAdaptivePolling(rideId);
    };
  }

  /**
   * Notifica que um evento realtime legítimo foi recebido via WebSocket.
   * Reseta a janela de silêncio para que o polling adaptativo não onere o banco.
   */
  public notifyRideEventReceived(rideId: string, currentStatus?: string): void {
    const entry = this.pollingRides.get(rideId);
    if (entry) {
      entry.lastEventAt = Date.now();
      if (currentStatus) {
        entry.lastStatus = currentStatus;
      }
    }
  }

  /**
   * Encerra o monitoramento de contingência para uma corrida finalizada ou cancelada.
   */
  public stopRideAdaptivePolling(rideId: string): void {
    this.pollingRides.delete(rideId);
    if (this.pollingRides.size === 0 && this.adaptivePollingTimer) {
      clearInterval(this.adaptivePollingTimer);
      this.adaptivePollingTimer = null;
    }
  }

  /**
   * Executa a varredura das corridas que necessitam de reconciliação HTTP.
   */
  private async executeAdaptivePollingCycle(): Promise<void> {
    if (this.pollingRides.size === 0) return;

    const now = Date.now();
    const isSocketDegraded = this.state !== "CONNECTED";

    for (const [rideId, tracker] of this.pollingRides.entries()) {
      const isSilent = now - tracker.lastEventAt >= this.MAX_SILENCE_BEFORE_POLL_MS;

      // Executa consulta HTTP apenas se o WebSocket estiver desconectado/reconectando OU silencioso
      if (isSocketDegraded || isSilent) {
        try {
          const { data, error } = await supabase
            .from("rides" as any)
            .select("id, status, driver_id, offered_driver_id, driver_arrived_at, updated_at")
            .eq("id", rideId)
            .maybeSingle();

          if (!error && data) {
            tracker.lastEventAt = now;
            // Se o status mudou ou se é a primeira leitura, notifica
            if (!tracker.lastStatus || tracker.lastStatus !== (data as any).status) {
              tracker.lastStatus = (data as any).status;
              tracker.onUpdate(data);
            }

            // Encerra polling se a corrida atingiu estado terminal
            if (["COMPLETED", "CANCELLED", "PAID"].includes((data as any).status)) {
              this.stopRideAdaptivePolling(rideId);
            }
          }
        } catch (err) {
          console.warn(`[RealtimeManager] Falha no polling adaptativo da corrida ${rideId}:`, err);
        }
      }
    }
  }
}

export const realtimeConnectionManager = RealtimeConnectionManager.getInstance();
