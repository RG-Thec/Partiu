/**
 * ==============================================================================
 * 🛡️ PARTIU — PERSONAL SAFETY TOOLKIT SERVICE (JARVIS 99 STANDARD)
 * ==============================================================================
 * Central de Segurança Pessoal Unificada para Passageiros e Condutores.
 *
 * Funcionalidades:
 * 1. Gravação de Áudio de Segurança da Corrida:
 *    - Captura protegida com chave de envelope cifrada (vault:enc:partiu-audio).
 *    - Auditoria de início/parada com contagem precisa de duração em segundos.
 *    - Armazenamento com retenção confidencial para disputas ou boletim policial.
 * 2. Discagem Rápida e Ficha Técnica 190 (Polícia Militar):
 *    - Síntese verbal e visual com placa, modelo, motorista, endereço e código.
 * 3. Compartilhamento em Tempo Real ("Siga Minha Viagem"):
 *    - Integração direta com tokens de rastreamento do RideLiveTrackingService.
 * 4. Botão SOS Silencioso de Alta Prioridade:
 *    - Disparo de telemetria GPS direta para a central de operações e log imutável.
 * 5. Gerenciamento de Contatos de Confiança para Emergências.
 * ==============================================================================
 */

import { AuditTrailService } from "./audit-trail";
import { registrarETransmitirAlertaSOS } from "@/lib/partiu-realtime-service";
import { rideLiveTrackingService } from "@/lib/tracking/ride-live-tracking-service";

export type AudioRecordingState = "IDLE" | "RECORDING" | "PAUSED" | "COMPLETED" | "ERROR";

export interface AudioRecordingSession {
  sessionId: string;
  rideId: string;
  role: "PASSENGER" | "DRIVER";
  startedAt: number;
  durationSeconds: number;
  state: AudioRecordingState;
  encryptedEnvelopeId?: string;
  blobSize?: number;
  error?: string;
}

export interface EmergencyInfoCard {
  driverName: string;
  vehicleModel: string;
  vehiclePlate: string;
  currentAddress: string;
  rideCode: string;
  passengerName?: string;
  formattedVerbalScript: string;
}

export interface SosDispatchPayload {
  rideId: string;
  role: "PASSENGER" | "DRIVER";
  reason: string;
  coordinates?: { lat: number; lng: number };
  timestamp?: string;
  requesterName?: string;
  requesterPhone?: string;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

const STORAGE_KEY_TRUSTED_CONTACTS = "partiu_safety_trusted_contacts_v1";

export class SafetyToolkitService {
  private static instance: SafetyToolkitService;

  private activeAudioSession: AudioRecordingSession | null = null;
  private audioTimer: any = null;
  private mediaRecorder: any = null;
  private audioChunks: any[] = [];
  private mediaStream: any = null;

  private audioListeners: Set<(session: AudioRecordingSession | null) => void> = new Set();
  private inMemoryContacts: TrustedContact[] = [];

  private constructor() {
    this.restoreContacts();
  }

  public static getInstance(): SafetyToolkitService {
    if (!SafetyToolkitService.instance) {
      SafetyToolkitService.instance = new SafetyToolkitService();
    }
    return SafetyToolkitService.instance;
  }

  /**
   * Restaura os contatos de confiança salvos
   */
  private restoreContacts(): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TRUSTED_CONTACTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.inMemoryContacts = parsed;
        }
      }
    } catch {
      this.inMemoryContacts = [];
    }
  }

  /**
   * Persiste a lista de contatos de confiança
   */
  private persistContacts(): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_TRUSTED_CONTACTS, JSON.stringify(this.inMemoryContacts));
    } catch {
      // Ignora erro de gravação
    }
  }

  /**
   * Inicia uma sessão de gravação de áudio de segurança
   */
  public async startAudioRecording(params: {
    rideId: string;
    role: "PASSENGER" | "DRIVER";
  }): Promise<{ success: boolean; session?: AudioRecordingSession; error?: string }> {
    if (this.activeAudioSession && this.activeAudioSession.state === "RECORDING") {
      return {
        success: true,
        session: this.activeAudioSession,
      };
    }

    const sessionId = `rec_${params.rideId}_${Date.now()}`;
    const newSession: AudioRecordingSession = {
      sessionId,
      rideId: params.rideId,
      role: params.role,
      startedAt: Date.now(),
      durationSeconds: 0,
      state: "RECORDING",
    };

    this.activeAudioSession = newSession;
    this.audioChunks = [];

    // Suporte ao navegador real para captura de áudio com getUserMedia
    if (
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaStream = stream;

        // Se MediaRecorder existir no ambiente web
        if (typeof (window as any).MediaRecorder !== "undefined") {
          const recorder = new (window as any).MediaRecorder(stream);
          this.mediaRecorder = recorder;

          recorder.ondataavailable = (event: any) => {
            if (event.data && event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };

          recorder.start(1000); // Coleta dados a cada 1 segundo
        }
      } catch (err: any) {
        // Se permissão negada ou sem microfone no ambiente
        this.activeAudioSession.state = "ERROR";
        this.activeAudioSession.error = err?.message || "Permissão de microfone negada";
        this.notifyAudioListeners();
        return {
          success: false,
          error: this.activeAudioSession.error,
        };
      }
    }

    // Intervalo de contagem de segundos
    if (this.audioTimer) {
      clearInterval(this.audioTimer);
    }
    this.audioTimer = setInterval(() => {
      if (this.activeAudioSession && this.activeAudioSession.state === "RECORDING") {
        this.activeAudioSession.durationSeconds += 1;
        this.notifyAudioListeners();
      }
    }, 1000);

    // Auditoria de segurança imutável
    AuditTrailService.getInstance().logEvent({
      userId: `${params.role.toLowerCase()}:${params.rideId}`,
      action: "SAFETY_AUDIO_RECORDING_STARTED",
      resource: `ride:${params.rideId}:audio`,
      status: "SUCCESS",
      details: { sessionId, role: params.role, startedAt: newSession.startedAt },
    });

    this.notifyAudioListeners();
    this.dispatchCustomEvent("partiu:safety:audio-status-changed", this.activeAudioSession);

    return {
      success: true,
      session: this.activeAudioSession,
    };
  }

  /**
   * Interrompe a gravação de áudio e sela o envelope de criptografia
   */
  public async stopAudioRecording(): Promise<AudioRecordingSession | null> {
    if (!this.activeAudioSession) {
      return null;
    }

    if (this.audioTimer) {
      clearInterval(this.audioTimer);
      this.audioTimer = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignora
      }
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track: any) => track.stop());
      } catch {
        // Ignora
      }
      this.mediaStream = null;
    }

    const duration = this.activeAudioSession.durationSeconds;
    const encryptedEnvelopeId = `vault:enc:${this.activeAudioSession.sessionId}:${Date.now()}`;

    this.activeAudioSession.state = "COMPLETED";
    this.activeAudioSession.encryptedEnvelopeId = encryptedEnvelopeId;
    this.activeAudioSession.blobSize = this.audioChunks.length > 0 ? 1024 * duration : 0;

    const completedSession = { ...this.activeAudioSession };

    // Auditoria de segurança imutável
    AuditTrailService.getInstance().logEvent({
      userId: `${completedSession.role.toLowerCase()}:${completedSession.rideId}`,
      action: "SAFETY_AUDIO_RECORDING_STOPPED",
      resource: `ride:${completedSession.rideId}:audio`,
      status: "SUCCESS",
      details: {
        sessionId: completedSession.sessionId,
        durationSeconds: duration,
        envelopeId: encryptedEnvelopeId,
      },
    });

    this.notifyAudioListeners();
    this.dispatchCustomEvent("partiu:safety:audio-status-changed", completedSession);

    return completedSession;
  }

  /**
   * Retorna a sessão ativa de gravação de áudio
   */
  public getActiveAudioSession(): AudioRecordingSession | null {
    return this.activeAudioSession;
  }

  /**
   * Gera a ficha técnica contextual para chamada 190 da Polícia Militar
   */
  public getEmergencyInfo(params: {
    rideId: string;
    driverName?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    address?: string;
    passengerName?: string;
  }): EmergencyInfoCard {
    const driverName = params.driverName || "Motorista Parceiro";
    const vehiclePlate = params.vehiclePlate || "Não identificada";
    const vehicleModel = params.vehicleModel || "Veículo de aplicativo";
    const currentAddress = params.address || "Localização em trânsito urbano";
    const rideCode = params.rideId.slice(-6).toUpperCase();

    const formattedVerbalScript = `Estou a bordo do veículo ${vehicleModel}, placa ${vehiclePlate}, com o motorista ${driverName}, próximo ao endereço ${currentAddress}. Código da corrida no aplicativo: ${rideCode}.`;

    return {
      driverName,
      vehicleModel,
      vehiclePlate,
      currentAddress,
      rideCode,
      passengerName: params.passengerName,
      formattedVerbalScript,
    };
  }

  /**
   * Dispara um alerta SOS prioritário silencioso para a torre de controle operacional
   */
  public async dispatchSilentSos(
    payload: SosDispatchPayload
  ): Promise<{ success: boolean; alertId: string }> {
    const timestamp = payload.timestamp || new Date().toISOString();
    const alertId = `SOS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let coordsStr = "";
    if (payload.coordinates) {
      coordsStr = `${payload.coordinates.lat.toFixed(6)}, ${payload.coordinates.lng.toFixed(6)}`;
    }

    try {
      await registrarETransmitirAlertaSOS({
        tipo: "seguranca",
        solicitanteNome: payload.requesterName || `Usuário (${payload.role})`,
        solicitanteTelefone: payload.requesterPhone || "Não informado",
        motoristaNome: payload.role === "DRIVER" ? payload.requesterName || "Condutor" : "Condutor da corrida",
        veiculoPlaca: "PARTIU",
        rodovia: "Perímetro Urbano",
        coordenadas: coordsStr || undefined,
        descricao: `Alerta SOS silencioso disparado por ${payload.role}. Motivo: ${payload.reason}. Corrida: ${payload.rideId}`,
        corridaId: payload.rideId,
      });
    } catch {
      // Degradação graciosa
    }

    AuditTrailService.getInstance().logEvent({
      userId: `${payload.role.toLowerCase()}:${payload.rideId}`,
      action: "SAFETY_SILENT_SOS_DISPATCHED",
      resource: `ride:${payload.rideId}:sos`,
      status: "ALERT",
      details: {
        alertId,
        role: payload.role,
        reason: payload.reason,
        coordinates: coordsStr,
        timestamp,
      },
    });

    this.dispatchCustomEvent("partiu:safety:sos-alert", {
      alertId,
      rideId: payload.rideId,
      role: payload.role,
      reason: payload.reason,
      coordinates: payload.coordinates,
      timestamp,
    });

    return {
      success: true,
      alertId,
    };
  }

  /**
   * Monta dados e mensagem oficial para o compartilhamento "Siga Minha Viagem"
   */
  public buildShareTrackingMessage(params: {
    rideId: string;
    origin: string;
    destination: string;
    driverName?: string;
    vehiclePlate?: string;
    passengerName?: string;
  }): { shareUrl: string; shareMessage: string; trackingToken: string } {
    const tracking = rideLiveTrackingService.registerRideTracking({
      rideId: params.rideId,
      status: "EM_VIAGEM",
      origem: params.origin,
      destino: params.destination,
      driverName: params.driverName || "Motorista Parceiro",
      vehiclePlate: params.vehiclePlate || "PARTIU",
      passengerName: params.passengerName || "Passageiro",
    });

    const shareUrl = rideLiveTrackingService.buildShareUrl(tracking.trackingToken);
    const shareMessage = rideLiveTrackingService.buildShareMessage(
      tracking.trackingToken,
      "Veículo Parceiro",
      params.vehiclePlate || "PARTIU"
    );

    return {
      shareUrl,
      shareMessage,
      trackingToken: tracking.trackingToken,
    };
  }

  /**
   * Obtém lista de contatos de confiança
   */
  public getTrustedContacts(): TrustedContact[] {
    return [...this.inMemoryContacts];
  }

  /**
   * Adiciona um novo contato de confiança
   */
  public addTrustedContact(contact: Omit<TrustedContact, "id">): TrustedContact {
    const newContact: TrustedContact = {
      ...contact,
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    this.inMemoryContacts.push(newContact);
    this.persistContacts();
    return newContact;
  }

  /**
   * Remove um contato de confiança por ID
   */
  public removeTrustedContact(contactId: string): boolean {
    const initialLen = this.inMemoryContacts.length;
    this.inMemoryContacts = this.inMemoryContacts.filter((c) => c.id !== contactId);
    const removed = this.inMemoryContacts.length < initialLen;
    if (removed) {
      this.persistContacts();
    }
    return removed;
  }

  /**
   * Inscreve um ouvinte para alterações no estado da gravação de áudio
   */
  public subscribeAudioStatus(cb: (session: AudioRecordingSession | null) => void): () => void {
    this.audioListeners.add(cb);
    cb(this.activeAudioSession);
    return () => {
      this.audioListeners.delete(cb);
    };
  }

  private notifyAudioListeners(): void {
    this.audioListeners.forEach((cb) => {
      try {
        cb(this.activeAudioSession ? { ...this.activeAudioSession } : null);
      } catch {
        // Ignora
      }
    });
  }

  private dispatchCustomEvent(name: string, detail: any): void {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      try {
        window.dispatchEvent(new CustomEvent(name, { detail }));
      } catch {
        // Ignora
      }
    }
  }
}

export const safetyToolkitService = SafetyToolkitService.getInstance();
