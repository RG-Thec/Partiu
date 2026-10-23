import React, { memo, useState, useEffect } from "react";
import {
  ShieldCheck,
  Share2,
  PhoneCall,
  Headphones,
  Check,
  AlertTriangle,
  Lock,
  Mic,
  MicOff,
  Radio,
} from "lucide-react";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import {
  safetyToolkitService,
  type AudioRecordingSession,
} from "@/lib/security/safety-toolkit-service";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { NativeBottomSheet } from "@/components/native/NativeBottomSheet";
import { NativeButton } from "@/components/native/NativeButton";
import { NativeRipple } from "@/components/native/NativeRipple";

export interface SafetyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverName?: string | undefined;
  driverPlate?: string | undefined;
  vehicleModel?: string | undefined;
  origin?: string | undefined;
  destination?: string | undefined;
  rideId?: string | undefined;
}

export const SafetyCenterModal = memo(function SafetyCenterModal({
  isOpen,
  onClose,
  driverName = "Motorista Parceiro",
  driverPlate = "ABC1D23",
  vehicleModel = "Veículo Particular",
  origin = "Local de Embarque",
  destination = "Destino Selecionado",
  rideId = "partiu-ride",
}: SafetyCenterModalProps) {
  const { appConfig } = useTheme();
  const { colors, ui, appName } = appConfig.branding;

  const [copied, setCopied] = useState(false);
  const [showPoliceConfirm, setShowPoliceConfirm] = useState(false);
  const [callingPolice, setCallingPolice] = useState(false);
  const [audioSession, setAudioSession] = useState<AudioRecordingSession | null>(null);
  const [sosSent, setSosSent] = useState(false);
  const [sendingSos, setSendingSos] = useState(false);

  // Monitora sessão de gravação de áudio
  useEffect(() => {
    return safetyToolkitService.subscribeAudioStatus((session) => {
      setAudioSession(session);
    });
  }, []);

  if (!isOpen) return null;

  const emergencyInfo = safetyToolkitService.getEmergencyInfo({
    rideId,
    driverName,
    vehiclePlate: driverPlate,
    vehicleModel,
    address: destination,
  });

  const handleToggleAudioRecording = async () => {
    if (audioSession && audioSession.state === "RECORDING") {
      await safetyToolkitService.stopAudioRecording();
    } else {
      await safetyToolkitService.startAudioRecording({
        rideId,
        role: "PASSENGER",
      });
    }
  };

  const handleShare = async () => {
    try {
      const { shareMessage, shareUrl } = safetyToolkitService.buildShareTrackingMessage({
        rideId: rideId || "partiu-ride",
        origin,
        destination,
        driverName,
        vehiclePlate: driverPlate,
        passengerName:
          (typeof window !== "undefined" ? localStorage.getItem("partiu_user_nome") : "") ||
          "Passageiro",
      });

      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: `Acompanhar minha viagem no ${appName}`,
            text: shareMessage,
            url: shareUrl,
          });
          return;
        } catch {
          // Fallback para área de transferência
        }
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(
          `Estou a bordo do ${appName} com o motorista ${driverName} (${driverPlate}). Acompanhe em tempo real: ${window.location.href}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const handleSilentSos = async () => {
    setSendingSos(true);
    try {
      let coords: { lat: number; lng: number } | undefined;
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(undefined),
            { timeout: 1500, maximumAge: 10000 }
          );
        });
      }

      const session =
        supabaseAuthService?.getStoredSession?.() ||
        supabaseAuthService?.getCurrentUser?.() ||
        null;
      const userName =
        session?.name ||
        (typeof window !== "undefined" ? localStorage.getItem("partiu_user_nome") : null) ||
        `Passageiro ${appName}`;
      const userPhone =
        session?.phone ||
        (typeof window !== "undefined" ? localStorage.getItem("partiu_user_phone") : null) ||
        "";

      await safetyToolkitService.dispatchSilentSos({
        rideId,
        role: "PASSENGER",
        reason: "Acionamento preventivo de segurança",
        coordinates: coords,
        requesterName: userName,
        requesterPhone: userPhone,
      });

      setSosSent(true);
      setTimeout(() => setSosSent(false), 4000);
    } catch {
      // Ignora erro de telemetria
    } finally {
      setSendingSos(false);
    }
  };

  const handleCallPolice = async () => {
    setCallingPolice(true);
    try {
      let coords: { lat: number; lng: number } | undefined;
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(undefined),
            { timeout: 1500, maximumAge: 10000 }
          );
        });
      }

      const session =
        supabaseAuthService?.getStoredSession?.() ||
        supabaseAuthService?.getCurrentUser?.() ||
        null;
      const userName =
        session?.name ||
        (typeof window !== "undefined" ? localStorage.getItem("partiu_user_nome") : null) ||
        `Passageiro ${appName}`;
      const userPhone =
        session?.phone ||
        (typeof window !== "undefined" ? localStorage.getItem("partiu_user_phone") : null) ||
        "";

      await safetyToolkitService.dispatchSilentSos({
        rideId,
        role: "PASSENGER",
        reason: `Emergência 190 acionada pelo passageiro. Veículo: ${driverPlate}`,
        coordinates: coords,
        requesterName: userName,
        requesterPhone: userPhone,
      });
    } catch {
      // Degradação graciosa
    } finally {
      window.location.href = "tel:190";
      setCallingPolice(false);
      setShowPoliceConfirm(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const isRecording = audioSession?.state === "RECORDING";

  return (
    <NativeBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Central de Segurança"
      subtitle="Proteção pessoal ativa durante a viagem"
      ariaLabel="Central de Segurança Pessoal"
      showCloseButton
      footer={
        <NativeButton variant="tonal" size="md" fullWidth onClick={onClose}>
          Fechar Central de Segurança
        </NativeButton>
      }
    >
      <div className="space-y-3.5 pt-1">
        {/* Status de Proteção Ativa */}
        <div
          className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5"
          style={{ borderRadius: ui.borderRadius }}
        >
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 leading-relaxed font-medium">
            <span className="font-black block text-emerald-900">
              Viagem Monitorada por Satélite
            </span>
            Sua rota é transmitida com telemetria ativa e criptografia de ponta a ponta.
          </div>
        </div>

        {/* Recurso 1: Gravação de Áudio de Segurança (Jarvis 99 Standard) */}
        <div
          onClick={handleToggleAudioRecording}
          className={`relative overflow-hidden w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            isRecording
              ? "bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20"
              : "bg-slate-50/80 border-slate-200"
          }`}
          style={{
            borderRadius: ui.borderRadius,
            minHeight: "56px",
          }}
        >
          <NativeRipple color={isRecording ? "#e11d48" : colors.primary} />
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs font-black ${
                isRecording
                  ? "bg-rose-600 text-white animate-pulse"
                  : "bg-slate-900 text-white"
              }`}
            >
              {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-slate-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4
                  className={`text-xs font-black ${
                    isRecording ? "text-rose-900" : "text-slate-900"
                  }`}
                >
                  {isRecording ? "Gravando Áudio da Corrida" : "Gravação de Segurança"}
                </h4>
                {isRecording && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                )}
              </div>
              <p className="text-[11px] truncate mt-0.5 text-slate-500">
                {isRecording
                  ? `Duração: ${formatSeconds(audioSession?.durationSeconds || 0)} (Criptografado)`
                  : "Gravação confidencial para proteção durante a viagem"}
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-black shrink-0 px-2.5 py-1 rounded-lg ${
              isRecording
                ? "bg-rose-600 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {isRecording ? "Parar" : "Ativar"}
          </span>
        </div>

        {/* Recurso 2: Compartilhar Rota em Tempo Real (Siga Minha Viagem) */}
        <div
          onClick={handleShare}
          className="relative overflow-hidden w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition cursor-pointer select-none"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            borderRadius: ui.borderRadius,
            minHeight: "56px",
          }}
        >
          <NativeRipple color={colors.primary} />
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs font-black text-white"
              style={{ backgroundColor: colors.primary }}
            >
              {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black" style={{ color: colors.textPrimary }}>
                {copied ? "Link Copiado com Sucesso" : "Compartilhar Viagem"}
              </h4>
              <p className="text-[11px] truncate mt-0.5" style={{ color: colors.textSecondary }}>
                Envie sua localização e dados do motorista para familiares
              </p>
            </div>
          </div>
          <span
            className="text-xs font-black shrink-0 px-2 py-1 rounded-lg"
            style={{ color: colors.primary, backgroundColor: `${colors.primary}15` }}
          >
            {copied ? "Copiado" : "Enviar"}
          </span>
        </div>

        {/* Recurso 3: Botão SOS Silencioso para Central Operacional */}
        <div
          onClick={handleSilentSos}
          className={`relative overflow-hidden w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition cursor-pointer select-none ${
            sosSent ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"
          }`}
          style={{ borderRadius: ui.borderRadius, minHeight: "56px" }}
        >
          <NativeRipple color="#f59e0b" />
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-slate-900">
                {sosSent ? "Alerta Operacional Enviado" : "Alerta Silencioso de Apoio"}
              </h4>
              <p className="text-[11px] truncate mt-0.5 text-slate-500">
                {sosSent
                  ? "A equipe operacional foi notificada com telemetria"
                  : "Notifique a equipe de monitoramento sem chamar atenção"}
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded-lg shrink-0">
            {sendingSos ? "Enviando..." : sosSent ? "Notificado" : "Disparar"}
          </span>
        </div>

        {/* Recurso 4: Emergência 190 (Polícia Militar com Script Guiado) */}
        {showPoliceConfirm ? (
          <div
            className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3 animate-in zoom-in-95 duration-150"
            style={{ borderRadius: ui.borderRadius }}
          >
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-xs font-black">Ligar para a Polícia Militar (190)</h4>
            </div>

            {/* Ficha técnica para leitura rápida ao atendente da Polícia */}
            <div className="bg-white/90 p-3 rounded-xl border border-rose-200 text-xs space-y-1.5 text-slate-800">
              <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider block">
                Ficha para informar ao atendente
              </span>
              <p className="text-xs font-semibold leading-relaxed">
                {emergencyInfo.formattedVerbalScript}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPoliceConfirm(false)}
                className="flex-1 min-h-[48px] rounded-xl bg-white text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer"
                style={{ borderRadius: ui.borderRadius }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCallPolice}
                disabled={callingPolice}
                className="flex-1 min-h-[48px] rounded-xl bg-rose-600 text-white font-black text-xs shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{ borderRadius: ui.borderRadius }}
              >
                <PhoneCall className="w-4 h-4" />
                <span>{callingPolice ? "TRANSMITINDO..." : "DISCAR 190"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setShowPoliceConfirm(true)}
            className="relative overflow-hidden w-full p-3.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200 flex items-center justify-between gap-3 text-left transition cursor-pointer select-none"
            style={{ borderRadius: ui.borderRadius, minHeight: "56px" }}
          >
            <NativeRipple color="#e11d48" />
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-rose-900">Emergência Policial 190</h4>
                <p className="text-[11px] text-rose-700 truncate mt-0.5">
                  Discagem direta e dados do veículo para o operador
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-rose-700 shrink-0">190</span>
          </div>
        )}

        {/* Recurso 5: Suporte Operacional 24h */}
        <a
          href="tel:08007278482"
          className="relative overflow-hidden w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition cursor-pointer select-none block"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            borderRadius: ui.borderRadius,
            minHeight: "56px",
          }}
        >
          <NativeRipple color={colors.primary} />
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black" style={{ color: colors.textPrimary }}>
                Suporte Operacional 24h
              </h4>
              <p className="text-[11px] truncate mt-0.5" style={{ color: colors.textSecondary }}>
                Fale com a equipe de operações da {appName}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500 shrink-0">0800</span>
        </a>
      </div>
    </NativeBottomSheet>
  );
});
