/**
 * ==============================================================================
 * 🔊 PARTIU DRIVER AUDIO HUD ENGINE (v1.0) — HANDS-FREE SAFETY
 * ==============================================================================
 * Síntese de voz em português brasileiro para anúncios de corrida no cockpit.
 * Evita que o condutor precise desviar a atenção visual do trânsito para avaliar
 * novas chamadas. Suporta fone Bluetooth, alto-falante e controle de volume.
 * ==============================================================================
 */

export interface AudioAnnouncementOffer {
  distanceMeters: number;
  netFareCents: number;
  destinationAddress: string;
  category?: string;
}

const STORAGE_KEY_AUDIO_HUD = "partiu_driver_audio_hud_enabled";
const STORAGE_KEY_AUDIO_VOLUME = "partiu_driver_audio_hud_volume";

export class DriverAudioHudEngine {
  private static instance: DriverAudioHudEngine;
  private isSpeaking = false;
  private isEnabled = true;
  private volume = 1.0;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  private constructor() {
    this.restoreConfig();
  }

  public static getInstance(): DriverAudioHudEngine {
    if (!DriverAudioHudEngine.instance) {
      DriverAudioHudEngine.instance = new DriverAudioHudEngine();
    }
    return DriverAudioHudEngine.instance;
  }

  private restoreConfig(): void {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUDIO_HUD);
      if (stored !== null) {
        this.isEnabled = stored === "true";
      }
      const storedVol = localStorage.getItem(STORAGE_KEY_AUDIO_VOLUME);
      if (storedVol !== null) {
        this.volume = Math.max(0.1, Math.min(1.0, parseFloat(storedVol) || 1.0));
      }
    } catch {
      // Fallback silencioso
    }
  }

  public isAudioHudEnabled(): boolean {
    return this.isEnabled;
  }

  public setAudioHudEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_AUDIO_HUD, String(enabled));
      } catch {
        // Fallback
      }
    }
    if (!enabled) {
      this.cancelAnnouncement();
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0.1, Math.min(1.0, vol));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_AUDIO_VOLUME, String(this.volume));
      } catch {
        // Fallback
      }
    }
  }

  public subscribeSpeaking(listener: (speaking: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isSpeaking);
    return () => this.listeners.delete(listener);
  }

  private notifySpeaking(speaking: boolean): void {
    this.isSpeaking = speaking;
    this.listeners.forEach((fn) => fn(speaking));
  }

  /**
   * Sintetiza fala do texto utilizando Web Speech API
   */
  public speak(text: string): boolean {
    if (!this.isEnabled) return false;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 1.05; // Levemente acelerado para agilidade operacional
      utterance.pitch = 1.0;
      utterance.volume = this.volume;

      // Busca voz em português se disponível
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(
        (v) => v.lang === "pt-BR" || v.lang.startsWith("pt") || v.name.includes("Brazil"),
      );
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      utterance.onstart = () => this.notifySpeaking(true);
      utterance.onend = () => this.notifySpeaking(false);
      utterance.onerror = () => this.notifySpeaking(false);

      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      this.notifySpeaking(false);
      return false;
    }
  }

  /**
   * Interrompe o áudio em reprodução
   */
  public cancelAnnouncement(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Silencioso
      }
    }
    this.notifySpeaking(false);
  }

  /**
   * Anuncia uma nova oferta com texto conciso e natural
   */
  public announceNewOffer(offer: AudioAnnouncementOffer): void {
    if (!this.isEnabled) return;

    const valorReais = (offer.netFareCents / 100).toFixed(2).replace(".", ",");
    const distancia =
      offer.distanceMeters >= 1000
        ? `${(offer.distanceMeters / 1000).toFixed(1).replace(".", ",")} quilômetros`
        : `${Math.round(offer.distanceMeters)} metros`;

    // Extrai o bairro ou primeira parte do destino para não ficar muito longo
    const destinoCurto = offer.destinationAddress.split(",")[0].trim();

    const frase = `Nova corrida a ${distancia}. Valor líquido: ${valorReais} reais. Destino: ${destinoCurto}.`;
    this.speak(frase);
  }

  /**
   * Executa um teste sonoro do Audio HUD
   */
  public testSpeech(): void {
    this.speak("Áudio HUD operacional. Sistema de voz com alerta ativado.");
  }
}

export const driverAudioHudEngine = DriverAudioHudEngine.getInstance();
