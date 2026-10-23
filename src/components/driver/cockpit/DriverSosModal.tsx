import React, { useState, useEffect } from "react";
import { AlertTriangle, Phone, Radio, Mic, MicOff, Lock } from "lucide-react";
import { driverLocationService } from "@/services/DriverLocationService";
import {
  safetyToolkitService,
  type AudioRecordingSession,
} from "@/lib/security/safety-toolkit-service";

export interface DriverSosModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverProfile: {
    id: string;
    nome: string;
    telefone: string;
    placa?: string;
    modelo?: string;
  };
  corridaAtiva?: {
    id: string;
    destino: any;
  } | null;
}

export function DriverSosModal({
  isOpen,
  onClose,
  driverProfile,
  corridaAtiva,
}: DriverSosModalProps) {
  const [acionandoSos, setAcionandoSos] = useState(false);
  const [alertaSilenciosoEnviado, setAlertaSilenciosoEnviado] = useState(false);
  const [enviandoSilencioso, setEnviandoSilencioso] = useState(false);
  const [audioSession, setAudioSession] = useState<AudioRecordingSession | null>(null);

  useEffect(() => {
    return safetyToolkitService.subscribeAudioStatus((session) => {
      setAudioSession(session);
    });
  }, []);

  if (!isOpen) return null;

  const currentRideId = corridaAtiva?.id || "corrida-ativa";
  const destinoTexto =
    typeof corridaAtiva?.destino === "string"
      ? corridaAtiva.destino
      : corridaAtiva?.destino?.endereco || "Perímetro Urbano";

  const emergencyInfo = safetyToolkitService.getEmergencyInfo({
    rideId: currentRideId,
    driverName: driverProfile.nome,
    vehiclePlate: driverProfile.placa || "PARTIU",
    vehicleModel: driverProfile.modelo || "Veículo Parceiro",
    address: destinoTexto,
  });

  const isRecording = audioSession?.state === "RECORDING";

  const handleToggleAudio = async () => {
    if (isRecording) {
      await safetyToolkitService.stopAudioRecording();
    } else {
      await safetyToolkitService.startAudioRecording({
        rideId: currentRideId,
        role: "DRIVER",
      });
    }
  };

  const handleAlertaSilencioso = async () => {
    setEnviandoSilencioso(true);
    try {
      const pos = driverLocationService.getCurrentPosition();
      const coords = pos ? { lat: pos.lat, lng: pos.lng } : undefined;

      await safetyToolkitService.dispatchSilentSos({
        rideId: currentRideId,
        role: "DRIVER",
        reason: "Alerta silencioso de perigo acionado pelo motorista no cockpit",
        coordinates: coords,
        requesterName: driverProfile.nome,
        requesterPhone: driverProfile.telefone,
      });

      setAlertaSilenciosoEnviado(true);
      setTimeout(() => setAlertaSilenciosoEnviado(false), 3500);
    } catch {
      // Ignora erro
    } finally {
      setEnviandoSilencioso(false);
    }
  };

  const handleAcionarPolicia = async () => {
    setAcionandoSos(true);
    try {
      const pos = driverLocationService.getCurrentPosition();
      let coords: { lat: number; lng: number } | undefined = pos
        ? { lat: pos.lat, lng: pos.lng }
        : undefined;

      if (!coords && typeof navigator !== "undefined" && navigator.geolocation) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => resolve(undefined),
            { timeout: 1200, maximumAge: 10000 }
          );
        });
      }

      await safetyToolkitService.dispatchSilentSos({
        rideId: currentRideId,
        role: "DRIVER",
        reason: `Emergência 190 acionada pelo condutor. Placa: ${driverProfile.placa || "PARTIU"}`,
        coordinates: coords,
        requesterName: driverProfile.nome,
        requesterPhone: driverProfile.telefone,
      });
    } catch (e) {
      console.error("Erro ao registrar telemetria SOS motorista:", e);
    } finally {
      window.location.href = "tel:190";
      setAcionandoSos(false);
      onClose();
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border-2 border-rose-500 rounded-3xl p-5 sm:p-6 max-w-sm w-full text-foreground shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-500/30 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Central de Emergência SOS</h3>
            <p className="text-xs text-muted-foreground font-semibold">
              Proteção Operacional do Condutor
            </p>
          </div>
        </div>

        {/* Ficha verbal de leitura rápida para o 190 */}
        <div className="bg-muted/60 p-3 rounded-2xl border border-border text-xs space-y-1.5 text-foreground font-medium">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
            Dados para informar à autoridade
          </span>
          <p className="text-xs font-semibold leading-relaxed">
            {emergencyInfo.formattedVerbalScript}
          </p>
        </div>

        {/* Recurso de Gravação de Áudio de Segurança (Jarvis Standard) */}
        <div
          onClick={handleToggleAudio}
          className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
            isRecording
              ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400"
              : "bg-muted/40 border-border text-foreground hover:bg-muted/60"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isRecording ? "bg-rose-600 text-white animate-pulse" : "bg-muted text-muted-foreground"
              }`}
            >
              {isRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold truncate">
                {isRecording ? "Gravando Áudio de Segurança" : "Gravação Confidencial"}
              </h4>
              <p className="text-[10px] text-muted-foreground truncate">
                {isRecording
                  ? `Duração: ${formatSeconds(audioSession?.durationSeconds || 0)} (Criptografado)`
                  : "Registro protegido para salvaguarda da corrida"}
              </p>
            </div>
          </div>
          <span
            className={`text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
              isRecording ? "bg-rose-600 text-white" : "bg-muted text-foreground"
            }`}
          >
            {isRecording ? "Parar" : "Gravar"}
          </span>
        </div>

        {/* Botão de Alerta Silencioso à Torre de Operações */}
        <div
          onClick={handleAlertaSilencioso}
          className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
            alertaSilenciosoEnviado
              ? "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400"
              : "bg-muted/40 border-border text-foreground hover:bg-muted/60"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold truncate">
                {alertaSilenciosoEnviado ? "Alerta Silencioso Transmitido" : "Alerta Silencioso"}
              </h4>
              <p className="text-[10px] text-muted-foreground truncate">
                Notifica a central com localização sem som
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
            {enviandoSilencioso ? "..." : alertaSilenciosoEnviado ? "Enviado" : "Disparar"}
          </span>
        </div>

        {/* Botão Principal: Ligar para 190 */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={acionandoSos}
            onClick={handleAcionarPolicia}
            className="w-full min-h-[48px] h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            <Phone className="w-4 h-4" />
            <span>
              {acionandoSos ? "TRANSMITINDO TELEMETRIA..." : "LIGAR PARA POLÍCIA MILITAR (190)"}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
