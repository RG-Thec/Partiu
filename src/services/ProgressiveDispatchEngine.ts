/**
 * ==============================================================================
 * 🚀 PARTIU PROGRESSIVE DISPATCH & LIVE RINGING ENGINE (v4.0)
 * ==============================================================================
 * Motor de despacho em ondas progressivas com PostGIS, Live Ringing Engine (Padrão 99),
 * Cascata de 10s por condutor, Supabase Realtime Delta Updates, Timeout Inteligente,
 * Driver Trust Center e Fast Recovery.
 *
 * MÁQUINA DE ESTADOS CANÔNICA & MICRO-ESTADOS DE NOTIFICAÇÃO:
 * - SEARCHING_R1 / R2 / R3
 * - DRIVER_NOTIFIED: "[Nome] está analisando seu pedido..."
 * - DRIVER_VIEWING:  "[Nome] está verificando a rota..."
 * - DRIVER_DECLINED: "Buscando outro motorista disponível..."
 * - ACCEPTED
 * - TIMEOUT
 * ==============================================================================
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { matchingEngine, type CandidateDriverProfile } from "./MatchingEngine";
import { appSettingsService } from "@/lib/ecosystem/app-settings-service";

export type ProgressiveWave = 1 | 2 | 3;

export type ProgressiveDispatchStatus =
  | "REQUESTED"
  | "SEARCHING_R1"
  | "SEARCHING_R2"
  | "SEARCHING_R3"
  | "DRIVER_ASSIGNED"
  | "TIMEOUT"
  | "CANCELLED";

export type LiveRingingMicroStatus =
  | "SEARCHING_R1"
  | "SEARCHING_R2"
  | "SEARCHING_R3"
  | "DRIVER_NOTIFIED"
  | "DRIVER_VIEWING"
  | "DRIVER_DECLINED"
  | "ACCEPTED"
  | "TIMEOUT";

export interface DriverTrustProfile {
  driverId: string;
  fullName: string;
  firstName: string;
  avatarUrl: string;
  category: string;
  rating: number; // ex: 4.97
  totalRides: number; // ex: 1284
  platformYears: number; // ex: 2
  completionRate: number; // ex: 99
  vehicleBrand: string; // ex: "Chevrolet"
  vehicleModel: string; // ex: "Onix Plus"
  vehicleColor: string; // ex: "Prata"
  vehicleYear: number; // ex: 2024
  licensePlate: string; // ex: "ABC1D23"
  phone: string;
}

export interface DriverViewingProfile {
  driverId: string;
  fullName: string;
  firstName: string;
  avatarUrl: string;
  rating: number; // ex: 4.97
  vehicleModel: string; // ex: "Chevrolet Onix"
  vehicleColor: string; // ex: "Prata"
  licensePlate: string; // ex: "BRA-4X99"
  category: string; // ex: "Partiu Carro"
  distanceKm: number; // ex: 1.2
  etaMinutes: number; // ex: 3
  viewingSince: number;
  status: "VIEWING" | "ANALYZING_ROUTE" | "DECIDING";
}

export interface ProgressiveDispatchSession {
  rideId: string;
  category: "MOTO" | "CARRO" | string;
  pickupCoords: [number, number]; // [lng, lat]
  destinationCoords: [number, number]; // [lng, lat]
  fareBrl: number;
  status: ProgressiveDispatchStatus;
  currentWave: ProgressiveWave;
  currentRadiusMeters: number;
  waveMessage: string;
  waveSecondsRemaining: number;
  waveDurationSeconds: number;
  
  // Janela Total Estendida de até 10 Minutos (600s)
  totalSearchDurationSeconds: number;
  totalSearchSecondsRemaining: number;

  // Live Ringing Engine (Fase 1 e 2) & Visualização em Tempo Real (Padrão 99)
  dispatchAttempt: number;
  dispatchStatus: LiveRingingMicroStatus;
  currentNotifiedDriverId: string | null;
  trustProfile?: DriverTrustProfile | undefined;
  viewingDrivers: DriverViewingProfile[];
  currentViewingDriver: DriverViewingProfile | null;
  
  // Cascata de Condutores
  candidates: CandidateDriverProfile[];
  currentCandidateIndex: number;
  currentCandidate: CandidateDriverProfile | null;
  cascadeSecondsRemaining: number;
  rejectedDriverIds: string[];
  
  // Resultados
  acceptedDriver?: CandidateDriverProfile | undefined;
  
  // Fast Recovery
  isFastRecoveryAvailable: boolean;
  recoveryDriver?: {
    driverId: string;
    driverName: string;
    distanceMeters: number;
  } | undefined;
  
  startedAt: number;
  updatedAt: number;
}

export type ProgressiveDispatchListener = (session: ProgressiveDispatchSession) => void;

export const SEARCH_TIMEOUT_MS = 60000;
export const SEARCH_DURATION_MS = 60000;
export const DRIVER_SEARCH_WINDOW_MS = 60000;
export const SEARCH_TIMEOUT_SECONDS = 60;
export const EXTENDED_SEARCH_TIMEOUT_SECONDS = 600; // 10 minutos (600s) oficiais
export const EXTENDED_SEARCH_TIMEOUT_MS = 600000;

export class ProgressiveDispatchEngine {
  private static instance: ProgressiveDispatchEngine;

  private activeSessions = new Map<string, ProgressiveDispatchSession>();
  private sessionTimers = new Map<string, NodeJS.Timeout[]>();
  private realtimeChannels = new Map<string, any>();
  private listeners: Set<ProgressiveDispatchListener> = new Set();
  private cancelledRideIds: Set<string> = new Set();

  // Configurações Oficiais de Ondas (Padrão Uber/99: Janela Global de 60s / 3 Ondas de 20s)
  private readonly WAVE_CONFIGS = {
    1: {
      radiusMeters: 2000,
      durationSeconds: 20,
      status: "SEARCHING_R1" as ProgressiveDispatchStatus,
      message: "Buscando motoristas próximos...",
    },
    2: {
      radiusMeters: 4000,
      durationSeconds: 20,
      status: "SEARCHING_R2" as ProgressiveDispatchStatus,
      message: "Ampliando a busca na região...",
    },
    3: {
      radiusMeters: 6000, // Padrão 6km, configurável até 10km pelo Admin
      durationSeconds: 20,
      status: "SEARCHING_R3" as ProgressiveDispatchStatus,
      message: "Procurando em bairros vizinhos...",
    },
  };

  private readonly DRIVER_CASCADE_TIMEOUT_SECONDS = 12; // Janela equilibrada de 12s por condutor

  private constructor() {}

  public static getInstance(): ProgressiveDispatchEngine {
    if (!ProgressiveDispatchEngine.instance) {
      ProgressiveDispatchEngine.instance = new ProgressiveDispatchEngine();
    }
    return ProgressiveDispatchEngine.instance;
  }

  /**
   * Registra ouvinte para atualizações de estado do radar de despacho
   */
  public onSessionUpdate(listener: ProgressiveDispatchListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(session: ProgressiveDispatchSession): void {
    const clone = { ...session };
    this.listeners.forEach((fn) => {
      try {
        fn(clone);
      } catch (e) {
        console.error("[ProgressiveDispatchEngine] Erro no listener:", e);
      }
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:progressive_dispatch_updated", {
          detail: clone,
        })
      );

      // Emite Delta Update mínimo (Fase 1)
      window.dispatchEvent(
        new CustomEvent("partiu:live_ringing_delta", {
          detail: {
            rideId: clone.rideId,
            status: clone.status,
            currentNotifiedDriverId: clone.currentNotifiedDriverId,
            dispatchAttempt: clone.dispatchAttempt,
            dispatchStatus: clone.dispatchStatus,
            candidate: clone.currentCandidate,
            trustProfile: clone.trustProfile,
            updatedAt: clone.updatedAt,
          },
        })
      );
    }
  }

  /**
   * Obtém a sessão de despacho ativa para uma corrida
   */
  public getSession(rideId: string): ProgressiveDispatchSession | undefined {
    return this.activeSessions.get(rideId);
  }

  /**
   * Inicia o ciclo de Despacho Progressivo em Ondas PostGIS com Live Ringing
   */
  public async startProgressiveDispatch(params: {
    rideId: string;
    category: "MOTO" | "CARRO" | string;
    pickupCoords: [number, number];
    destinationCoords: [number, number];
    fareBrl: number;
    customWave3RadiusMeters?: number;
    searchTimeoutSeconds?: number;
  }): Promise<ProgressiveDispatchSession> {
    const { rideId, category, pickupCoords, destinationCoords, fareBrl } = params;

    // Cancela sessão prévia se houver
    this.cancelDispatch(rideId);

    // Obtém raio customizado da Onda 3 das configurações globais do Admin se existir
    let wave3Radius = params.customWave3RadiusMeters || 6000;
    try {
      const settings = appSettingsService.getSettings();
      if ((settings as any)?.pricing?.maxSearchRadiusKm) {
        wave3Radius = Math.max(6000, Math.min(10000, (settings as any).pricing.maxSearchRadiusKm * 1000));
      }
    } catch (_) {}

    // Duração total configurável de até 10 minutos (padrão 600s / fallback 60s em testes legados)
    const totalDuration = params.searchTimeoutSeconds !== undefined ? params.searchTimeoutSeconds : 60;
    const waveDurations = totalDuration >= 600
      ? { 1: 120, 2: 180, 3: 300 } // 10 minutos: 2 min + 3 min + 5 min
      : totalDuration > 60
      ? {
          1: Math.max(20, Math.round(totalDuration * 0.2)),
          2: Math.max(20, Math.round(totalDuration * 0.3)),
          3: totalDuration - Math.max(20, Math.round(totalDuration * 0.2)) - Math.max(20, Math.round(totalDuration * 0.3)),
        }
      : { 1: 20, 2: 20, 3: 20 }; // 60 segundos legado / testes unitários

    const initialWaveConfig = this.WAVE_CONFIGS[1];
    const initialWaveSeconds = waveDurations[1];

    const session: ProgressiveDispatchSession = {
      rideId,
      category,
      pickupCoords,
      destinationCoords,
      fareBrl,
      status: "REQUESTED",
      currentWave: 1,
      currentRadiusMeters: initialWaveConfig.radiusMeters,
      waveMessage: initialWaveConfig.message,
      waveSecondsRemaining: initialWaveSeconds,
      waveDurationSeconds: initialWaveSeconds,
      totalSearchDurationSeconds: totalDuration,
      totalSearchSecondsRemaining: totalDuration,
      dispatchAttempt: 1,
      dispatchStatus: "SEARCHING_R1",
      currentNotifiedDriverId: null,
      viewingDrivers: [],
      currentViewingDriver: null,
      candidates: [],
      currentCandidateIndex: 0,
      currentCandidate: null,
      cascadeSecondsRemaining: this.DRIVER_CASCADE_TIMEOUT_SECONDS,
      rejectedDriverIds: [],
      isFastRecoveryAvailable: false,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.cancelledRideIds.delete(rideId);
    this.activeSessions.set(rideId, session);
    this.notify(session);

    // Conecta canal Realtime do Supabase se disponível
    this.setupRealtimeSubscription(session);

    // Dispara Onda 1
    await this.executeWave(rideId, 1, wave3Radius, waveDurations);

    return session;
  }

  /**
   * Executa a busca e cascata de uma onda específica
   */
  private async executeWave(
    rideId: string,
    wave: ProgressiveWave,
    wave3RadiusMeters: number,
    waveDurations: { [key in ProgressiveWave]: number } = { 1: 20, 2: 20, 3: 20 }
  ): Promise<void> {
    if (this.cancelledRideIds.has(rideId)) return;
    const session = this.activeSessions.get(rideId);
    if (!session || session.status === "CANCELLED" || session.status === "DRIVER_ASSIGNED") {
      return;
    }

    const config = this.WAVE_CONFIGS[wave];
    const effectiveRadius = wave === 3 ? wave3RadiusMeters : config.radiusMeters;
    const waveSecs = waveDurations[wave] || config.durationSeconds;

    session.currentWave = wave;
    session.status = config.status;
    session.dispatchStatus = `SEARCHING_R${wave}` as LiveRingingMicroStatus;
    session.currentRadiusMeters = effectiveRadius;
    session.waveMessage = config.message;
    session.waveSecondsRemaining = waveSecs;
    session.waveDurationSeconds = waveSecs;
    session.updatedAt = Date.now();
    this.notify(session);

    // 1. Busca condutores elegíveis no PostGIS para esta onda
    const candidates = await this.fetchEligibleDrivers(session, effectiveRadius);

    // Se a busca foi cancelada durante a chamada assíncrona, interrompe imediatamente
    if (
      this.cancelledRideIds.has(rideId) ||
      !this.activeSessions.has(rideId) ||
      session.status === "CANCELLED"
    ) {
      return;
    }

    session.candidates = candidates;
    session.currentCandidateIndex = 0;
    session.currentCandidate = candidates.length > 0 ? (candidates[0] ?? null) : null;
    session.cascadeSecondsRemaining = this.DRIVER_CASCADE_TIMEOUT_SECONDS;

    // Se houver candidato, transiciona para DRIVER_NOTIFIED e notifica condutor real no Supabase
    if (session.currentCandidate) {
      session.currentNotifiedDriverId = session.currentCandidate.driverId;
      session.dispatchStatus = "DRIVER_NOTIFIED";
      const firstName = session.currentCandidate.name.split(" ")[0];
      session.waveMessage = `${firstName} está analisando seu pedido...`;
      void this.notifyCandidateDriver(session, session.currentCandidate);
    }

    this.notify(session);

    // 2. Orquestra timers de contagem regressiva da onda e avanço de cascata
    this.clearSessionTimers(rideId);
    const timers: NodeJS.Timeout[] = [];

    // Timer regressivo por segundo da onda (P0-02: sem micro-estados falsos)
    const waveTicker = setInterval(() => {
      const s = this.activeSessions.get(rideId);
      if (!s || s.status !== config.status) {
        clearInterval(waveTicker);
        return;
      }

      s.totalSearchSecondsRemaining = Math.max(0, (s.totalSearchSecondsRemaining ?? 60) - 1);
      s.waveSecondsRemaining = Math.max(0, s.waveSecondsRemaining - 1);
      
      // Contagem da cascata do motorista atual
      if (s.currentCandidate) {
        s.cascadeSecondsRemaining = Math.max(0, s.cascadeSecondsRemaining - 1);

        if (s.cascadeSecondsRemaining === 0) {
          // Timeout do condutor atual -> Avança para o próximo da cascata
          this.advanceCascade(rideId);
        }
      }

      s.updatedAt = Date.now();
      this.notify(s);

      // Fim do tempo global total de busca
      if (s.totalSearchSecondsRemaining === 0) {
        clearInterval(waveTicker);
        this.triggerTimeout(rideId);
        return;
      }

      // Fim do tempo da onda
      if (s.waveSecondsRemaining === 0) {
        clearInterval(waveTicker);
        this.onWaveDurationExpired(rideId, wave, wave3RadiusMeters, waveDurations);
      }
    }, 1000);

    timers.push(waveTicker);
    this.sessionTimers.set(rideId, timers);
  }

  /**
   * Avança para o próximo motorista da fila na cascata (15s por condutor)
   */
  public advanceCascade(rideId: string): void {
    if (this.cancelledRideIds.has(rideId)) return;
    const session = this.activeSessions.get(rideId);
    if (!session || session.status === "DRIVER_ASSIGNED" || session.status === "TIMEOUT" || session.status === "CANCELLED") {
      return;
    }

    if (session.currentCandidate) {
      session.rejectedDriverIds.push(session.currentCandidate.driverId);
    }

    session.dispatchAttempt += 1;
    session.currentCandidateIndex += 1;

    if (session.currentCandidateIndex < session.candidates.length) {
      session.currentCandidate = session.candidates[session.currentCandidateIndex] ?? null;
      session.cascadeSecondsRemaining = this.DRIVER_CASCADE_TIMEOUT_SECONDS;
      if (session.currentCandidate) {
        session.currentNotifiedDriverId = session.currentCandidate.driverId;
        session.dispatchStatus = "DRIVER_NOTIFIED";
        const firstName = session.currentCandidate.name.split(" ")[0];
        session.waveMessage = `${firstName} está analisando seu pedido...`;
        void this.notifyCandidateDriver(session, session.currentCandidate);
      }
    } else {
      // Fim dos candidatos disponíveis desta onda
      session.currentCandidate = null;
      session.currentNotifiedDriverId = null;
      session.dispatchStatus = `SEARCHING_R${session.currentWave}` as LiveRingingMicroStatus;
      session.waveMessage = this.WAVE_CONFIGS[session.currentWave]?.message || "Buscando condutores...";
    }

    session.updatedAt = Date.now();
    this.notify(session);
  }

  /**
   * Registra em tempo real que um motorista está com a corrida na tela analisando a rota (Padrão 99)
   */
  public registerDriverViewing(
    rideId: string,
    driver: Partial<DriverViewingProfile> & { driverId: string }
  ): void {
    const session = this.activeSessions.get(rideId);
    if (!session || session.status === "DRIVER_ASSIGNED" || session.status === "TIMEOUT" || session.status === "CANCELLED") {
      return;
    }

    const viewingProfile: DriverViewingProfile = {
      driverId: driver.driverId,
      fullName: driver.fullName || (driver as any).name || "Motorista Parceiro",
      firstName: driver.firstName || ((driver as any).name || "Motorista").split(" ")[0] || "Motorista",
      avatarUrl: driver.avatarUrl || "",
      rating: Number(driver.rating) || 5.0,
      vehicleModel: driver.vehicleModel || (session.category === "MOTO" ? "Moto" : "Carro"),
      vehicleColor: driver.vehicleColor || "",
      licensePlate: driver.licensePlate || "",
      category: driver.category || (session.category === "MOTO" ? "Partiu Moto" : "Partiu Carro"),
      distanceKm: Number(driver.distanceKm) || 0,
      etaMinutes: Number(driver.etaMinutes) || 0,
      viewingSince: Date.now(),
      status: "ANALYZING_ROUTE",
    };

    if (!session.viewingDrivers) session.viewingDrivers = [];
    const existingIndex = session.viewingDrivers.findIndex((d) => d.driverId === viewingProfile.driverId);
    if (existingIndex >= 0) {
      session.viewingDrivers[existingIndex] = viewingProfile;
    } else {
      session.viewingDrivers.push(viewingProfile);
    }

    session.currentViewingDriver = viewingProfile;
    session.dispatchStatus = "DRIVER_VIEWING";
    session.waveMessage = `${viewingProfile.firstName} está vendo sua solicitação em tempo real...`;
    session.updatedAt = Date.now();

    this.notify(session);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:driver_viewing_ride", {
          detail: {
            rideId,
            viewingDriver: viewingProfile,
            viewingDrivers: session.viewingDrivers,
          },
        })
      );
    }

    // Transmite broadcast pelo canal Realtime do Supabase se disponível
    const channel = this.realtimeChannels.get(rideId);
    if (channel) {
      try {
        void channel.send({
          type: "broadcast",
          event: "driver_viewing",
          payload: {
            rideId,
            viewingDriver: viewingProfile,
            viewingDriversCount: session.viewingDrivers.length,
          },
        });
      } catch (_) {}
    }
  }

  /**
   * Ação disparada quando o tempo máximo da onda expira
   */
  private onWaveDurationExpired(
    rideId: string,
    completedWave: ProgressiveWave,
    wave3RadiusMeters: number,
    waveDurations: { [key in ProgressiveWave]: number } = { 1: 20, 2: 20, 3: 20 }
  ): void {
    if (this.cancelledRideIds.has(rideId)) return;
    const session = this.activeSessions.get(rideId);
    if (!session || session.status === "DRIVER_ASSIGNED" || session.status === "CANCELLED") {
      return;
    }

    if (isSupabaseConfigured()) {
      // P0 ARCHITECTURAL ENFORCEMENT: Em rede Supabase, o avanço de ondas é estritamente Server-Authoritative.
      // O cliente notifica a procedure atômica do servidor caso ainda esteja online, mas não decide nada localmente.
      void (supabase.rpc as any)("dispatch_advance_wave", {
        p_ride_id: rideId,
        p_timeout_seconds: 15,
      }).then(({ data, error }: any) => {
        if (!error && data?.status === "TIMEOUT") {
          this.triggerTimeout(rideId);
        }
      });
      return;
    }

    if (completedWave === 1) {
      void this.executeWave(rideId, 2, wave3RadiusMeters, waveDurations);
    } else if (completedWave === 2) {
      void this.executeWave(rideId, 3, wave3RadiusMeters, waveDurations);
    } else {
      this.triggerTimeout(rideId);
    }
  }

  /**
   * Transiciona a sessão para o estado TIMEOUT e inicia escuta de Fast Recovery
   */
  public triggerTimeout(rideId: string): void {
    if (this.cancelledRideIds.has(rideId)) return;
    const session = this.activeSessions.get(rideId);
    if (!session || session.status === "CANCELLED") return;

    this.clearSessionTimers(rideId);

    session.status = "TIMEOUT";
    session.dispatchStatus = "TIMEOUT";
    session.currentCandidate = null;
    session.currentNotifiedDriverId = null;
    session.waveSecondsRemaining = 0;
    session.cascadeSecondsRemaining = 0;
    session.waveMessage = "Nenhum motorista disponível na região no momento.";
    session.updatedAt = Date.now();

    this.notify(session);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:dispatch_ride_timeout", {
          detail: { rideId, session: { ...session } },
        })
      );
    }

    // Inicia monitoramento passivo de Fast Recovery durante o Timeout
    this.startFastRecoveryWatcher(rideId);
  }

  /**
   * Aceita corrida e provisiona o perfil completo de confiança (Driver Trust Center)
   */
  public acceptRide(rideId: string, driver?: CandidateDriverProfile): ProgressiveDispatchSession | null {
    const session = this.activeSessions.get(rideId);
    if (!session || session.status === "DRIVER_ASSIGNED" || session.status === "CANCELLED") {
      return session || null;
    }

    const assignedDriver = driver || session.currentCandidate || session.candidates[0];
    if (!assignedDriver || !assignedDriver.driverId) {
      console.warn("[ProgressiveDispatchEngine] acceptRide invocado sem dados válidos do condutor. Rejeitando mock.");
      return null;
    }

    this.clearSessionTimers(rideId);

    session.status = "DRIVER_ASSIGNED";
    session.dispatchStatus = "ACCEPTED";
    session.acceptedDriver = assignedDriver;
    session.currentCandidate = assignedDriver;
    session.currentNotifiedDriverId = assignedDriver.driverId;
    session.waveMessage = "Motorista encontrado!";

    const isMoto = session.category === "MOTO";
    // Monta perfil de confiança oficial para o Driver Trust Center (Fase 6)
    const trustProfile: DriverTrustProfile = {
      driverId: assignedDriver.driverId,
      fullName: assignedDriver.name || "Motorista Parceiro",
      firstName: (assignedDriver.name || "Motorista").split(" ")[0] ?? "Motorista",
      avatarUrl: assignedDriver.avatarUrl || "",
      category: isMoto ? "Partiu Moto" : "Partiu Carro",
      rating: Number(assignedDriver.rating) || 5.0,
      totalRides: Number((assignedDriver as any).totalRides) || 1284,
      platformYears: Number((assignedDriver as any).platformYears) || 2,
      completionRate: Number((assignedDriver as any).completionRate) || 99,
      vehicleBrand: (assignedDriver as any).vehicleBrand || (isMoto ? "Honda" : "Chevrolet"),
      vehicleModel: assignedDriver.vehicleModel || (isMoto ? "CG 160 Titan" : "Onix Plus"),
      vehicleColor: (assignedDriver as any).vehicleColor || "Prata",
      vehicleYear: Number((assignedDriver as any).vehicleYear) || 2024,
      licensePlate: assignedDriver.licensePlate || "",
      phone: assignedDriver.phone || "",
    };

    session.trustProfile = trustProfile;
    session.updatedAt = Date.now();

    this.notify(session);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:dispatch_ride_accepted", {
          detail: {
            rideId,
            driver: assignedDriver,
            trustProfile,
            session: { ...session },
          },
        })
      );
    }

    return session;
  }

  /**
   * Cancela a busca de corrida e limpa recursos
   */
  public cancelDispatch(rideId: string, reason = "PASSENGER_CANCELLED"): void {
    this.cancelledRideIds.add(rideId);
    const session = this.activeSessions.get(rideId);
    this.cleanup(rideId);

    if (session) {
      session.status = "CANCELLED";
      session.waveMessage = "Busca cancelada.";
      session.updatedAt = Date.now();
      this.notify(session);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:dispatch_ride_cancelled", {
          detail: { rideId, reason },
        })
      );
    }
  }

  /**
   * Tenta novamente a partir do TIMEOUT (Reinicia o ciclo em REQUESTED / Onda 1 com janela de 10 minutos)
   */
  public retrySearch(rideId: string, searchTimeoutSeconds = 600): Promise<ProgressiveDispatchSession | undefined> {
    const session = this.activeSessions.get(rideId);
    if (!session) return Promise.resolve(undefined);

    return this.startProgressiveDispatch({
      rideId: session.rideId,
      category: session.category,
      pickupCoords: session.pickupCoords,
      destinationCoords: session.destinationCoords,
      fareBrl: session.fareBrl,
      searchTimeoutSeconds,
    });
  }

  /**
   * Fast Recovery Watcher: monitora se um motorista elegível deu sinal no raio
   */
  private startFastRecoveryWatcher(rideId: string): void {
    const recoveryInterval = setInterval(async () => {
      const session = this.activeSessions.get(rideId);
      if (!session || session.status !== "TIMEOUT") {
        clearInterval(recoveryInterval);
        return;
      }

      let recoveryFound = false;
      let driverData: any = null;

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await (supabase.rpc as any)("dispatch_check_fast_recovery", {
            p_ride_id: rideId,
            p_search_radius_meters: 6000,
          });

          if (!error && Array.isArray(data) && data.length > 0 && data[0]?.available) {
            recoveryFound = true;
            driverData = {
              driverId: data[0].driver_id,
              driverName: data[0].driver_name,
              distanceMeters: Number(data[0].distance_meters) || 1200,
            };
          }
        } catch (_) {}
      }

      if (recoveryFound && driverData) {
        clearInterval(recoveryInterval);
        session.isFastRecoveryAvailable = true;
        session.recoveryDriver = driverData;
        session.updatedAt = Date.now();
        this.notify(session);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("partiu:dispatch_fast_recovery_available", {
              detail: { rideId, driver: driverData },
            })
          );
        }
      }
    }, 4000);

    const existing = this.sessionTimers.get(rideId) || [];
    existing.push(recoveryInterval);
    this.sessionTimers.set(rideId, existing);
  }

  /**
   * Busca motoristas elegíveis (via RPC PostGIS ou fallback determinístico in-process)
   */
  private async fetchEligibleDrivers(
    session: ProgressiveDispatchSession,
    radiusMeters: number
  ): Promise<CandidateDriverProfile[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase.rpc as any)("dispatch_find_progressive_drivers", {
          p_pickup_lat: session.pickupCoords[1],
          p_pickup_lng: session.pickupCoords[0],
          p_category: session.category,
          p_wave: session.currentWave,
          p_radius_meters: radiusMeters,
          p_exclude_driver_ids: session.rejectedDriverIds,
        });

        if (!error && data && Array.isArray(data)) {
          return data.map((d: any) => ({
            driverId: d.driver_id,
            name: d.name,
            phone: d.phone,
            avatarUrl: d.avatar_url,
            vehicleModel: d.vehicle_model,
            licensePlate: d.license_plate,
            category: d.category,
            status: d.status,
            subscriptionPlan: d.subscription_plan,
            lat: d.lat,
            lng: d.lng,
            heading: d.heading,
            speed: d.speed,
            rating: Number(d.rating) || 4.9,
            acceptanceRate: Number(d.acceptance_rate) || 98,
            cancellationRate: Number(d.cancellation_rate) || 1.5,
            distanceMeters: Number(d.distance_meters),
            etaMinutes: Number(d.eta_minutes) || 3,
            dispatchScore: Number(d.dispatch_score) || 90,
          }));
        }
      } catch (err) {
        console.warn("[ProgressiveDispatchEngine] Fallback in-process ativado:", err);
      }
    }

    // Fallback in-process através do matchingEngine
    const matchResults = await matchingEngine.findBestDrivers({
      passengerLat: session.pickupCoords[1],
      passengerLng: session.pickupCoords[0],
      category: session.category,
      radiusMeters,
      limit: 10,
    });

    return matchResults.filter((c) => !session.rejectedDriverIds.includes(c.driverId));
  }

  /**
   * Configuração de canais Realtime do Supabase
   */
  private setupRealtimeSubscription(session: ProgressiveDispatchSession): void {
    if (!isSupabaseConfigured()) return;

    try {
      const channel = supabase
        .channel(`dispatch_ride_${session.rideId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "rides",
            filter: `id=eq.${session.rideId}`,
          },
          (payload: any) => {
            const updated = payload.new;
            if (updated) {
              const isAccepted =
                updated.status === "ACCEPTED" ||
                updated.status === "DRIVER_ASSIGNED" ||
                updated.status === "A_CAMINHO" ||
                updated.status === "CHEGOU";

              if (isAccepted && updated.driver_id) {
                const driverName = updated.driver_name || "Motorista Parceiro";
                const driverPhone = updated.driver_phone || "";

                void (async () => {
                  let driverLat = session.pickupCoords[1];
                  let driverLng = session.pickupCoords[0];
                  let driverHeading = 0;
                  let driverSpeed = 0;

                  // Busca a telemetria GPS real mais recente da tabela driver_locations (P1-02)
                  if (isSupabaseConfigured()) {
                    try {
                      const { data: loc } = await (supabase as any)
                        .from("driver_locations")
                        .select("latitude, longitude, heading, speed")
                        .eq("driver_id", updated.driver_id)
                        .maybeSingle();

                      if (loc && !isNaN(loc.latitude) && !isNaN(loc.longitude) && (loc.latitude !== 0 || loc.longitude !== 0)) {
                        driverLat = Number(loc.latitude);
                        driverLng = Number(loc.longitude);
                        driverHeading = Number(loc.heading || 0);
                        driverSpeed = Number(loc.speed || 0);
                      }
                    } catch (_) {}
                  }

                  const distMeters = this.calculateHaversineMeters(
                    session.pickupCoords[1],
                    session.pickupCoords[0],
                    driverLat,
                    driverLng
                  );
                  const etaMin = Math.max(1, Math.round(distMeters / 400));

                  this.acceptRide(session.rideId, {
                    driverId: updated.driver_id,
                    name: driverName,
                    phone: driverPhone,
                    category: updated.category || updated.vehicle_category || session.category,
                    status: "ON_TRIP",
                    subscriptionPlan: "OURO",
                    lat: driverLat,
                    lng: driverLng,
                    heading: driverHeading,
                    speed: driverSpeed,
                    rating: Number(updated.driver_rating) || 4.97,
                    acceptanceRate: 99,
                    cancellationRate: 1.0,
                    distanceMeters: distMeters,
                    etaMinutes: etaMin,
                    dispatchScore: 94,
                  });
                })();
              } else if (updated.status === "TIMEOUT") {
                this.triggerTimeout(session.rideId);
              } else if (updated.status === "CANCELLED") {
                this.cancelDispatch(session.rideId, "REMOTE_CANCEL");
              } else if (
                updated.status === "OFFERED" &&
                updated.dispatch_wave &&
                updated.dispatch_wave !== session.currentWave
              ) {
                session.currentWave = updated.dispatch_wave as ProgressiveWave;
                session.waveSecondsRemaining = 15;
                session.waveDurationSeconds = 15;
                session.dispatchStatus = `SEARCHING_R${updated.dispatch_wave}` as LiveRingingMicroStatus;
                session.waveMessage = this.WAVE_CONFIGS[session.currentWave]?.message || "Buscando condutores na região...";
                session.updatedAt = Date.now();
                this.notify(session);
              }
            }
          }
        )
        .on("broadcast", { event: "driver_viewing" }, (event: any) => {
          if (event?.payload?.viewingDriver) {
            this.registerDriverViewing(session.rideId, event.payload.viewingDriver);
          }
        })
        .subscribe();

      this.realtimeChannels.set(session.rideId, channel);
    } catch (_) {}
  }

  /**
   * Dispara a oferta real para o motorista no Supabase (rides.offered_driver_id + Realtime broadcast)
   * P0-01 ARCHITECTURAL ENFORCEMENT: O cliente (navegador) atua exclusivamente como visualizador (VIEWER).
   * A autoridade soberana de despacho reside exclusivamente na Edge Function server-side dispatch-ride.
   */
  private async notifyCandidateDriver(
    session: ProgressiveDispatchSession,
    candidate: CandidateDriverProfile
  ): Promise<void> {
    if (!candidate?.driverId) return;

    // Em ambiente conectado ao Supabase, a autoridade de despacho é 100% server-side.
    // O cliente NÃO efetua mutações em rides.offered_driver_id nem transmite broadcasts de ofertas.
    if (isSupabaseConfigured()) {
      return;
    }
  }

  private calculateHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private clearSessionTimers(rideId: string): void {
    const timers = this.sessionTimers.get(rideId);
    if (timers) {
      timers.forEach((t) => {
        clearInterval(t);
        clearTimeout(t);
      });
      this.sessionTimers.delete(rideId);
    }
  }

  /**
   * Limpeza completa e segura de recursos ao cancelar, concluir ou expirar
   */
  public cleanup(rideId: string): void {
    this.clearSessionTimers(rideId);

    const channel = this.realtimeChannels.get(rideId);
    if (channel) {
      try {
        channel.unsubscribe();
      } catch (_) {}
      this.realtimeChannels.delete(rideId);
    }

    this.activeSessions.delete(rideId);
  }
}

export const progressiveDispatchEngine = ProgressiveDispatchEngine.getInstance();
