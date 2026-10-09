import React, { memo, useState } from "react";
import {
  ShieldCheck,
  Share2,
  PhoneCall,
  Headphones,
  Check,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { registrarETransmitirAlertaSOS } from "@/lib/partiu-realtime-service";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { NativeBottomSheet } from "@/components/native/NativeBottomSheet";
import { NativeButton } from "@/components/native/NativeButton";
import { NativeRipple } from "@/components/native/NativeRipple";

export interface SafetyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverName?: string | undefined;
  driverPlate?: string | undefined;
  origin?: string | undefined;
  destination?: string | undefined;
  rideId?: string | undefined;
}

export const SafetyCenterModal = memo(function SafetyCenterModal({
  isOpen,
  onClose,
  driverName = "Motorista Parceiro",
  driverPlate = "ABC1D23",
  origin = "Local de Embarque",
  destination = "Destino Selecionado",
  rideId = "partiu-ride",
}: SafetyCenterModalProps) {
  const { appConfig } = useTheme();
  const { colors, ui, appName } = appConfig.branding;

  const [copied, setCopied] = useState(false);
  const [showPoliceConfirm, setShowPoliceConfirm] = useState(false);
  const [callingPolice, setCallingPolice] = useState(false);

  if (!isOpen) return null;

  const shareText = `Estou a bordo do ${appName} em viagem com o motorista ${driverName} (${driverPlate}). Destino: ${destination}. Rota acompanhada em tempo real.`;

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Acompanhar minha viagem ${appName}`,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback para cópia
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText} Link: ${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCallPolice = async () => {
    setCallingPolice(true);
    try {
      let coords = "";
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        coords = await new Promise<string>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
            () => resolve(""),
            { timeout: 1200, maximumAge: 10000 }
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

      await registrarETransmitirAlertaSOS({
        tipo: "seguranca",
        solicitanteNome: userName,
        solicitanteTelefone: userPhone || "Não informado",
        motoristaNome: driverName,
        veiculoPlaca: driverPlate,
        rodovia: destination || "Perímetro Urbano",
        coordenadas: coords || undefined,
        descricao: `Emergência 190 acionada pelo passageiro na corrida ${rideId}. Origem: ${origin} -> Destino: ${destination}`,
        corridaId: rideId,
      });
    } catch (e) {
      console.error("Erro ao registrar telemetria SOS passageiro:", e);
    } finally {
      window.location.href = "tel:190";
      setCallingPolice(false);
      setShowPoliceConfirm(false);
    }
  };

  return (
    <NativeBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Central de Segurança"
      subtitle="Recursos de proteção em tempo real"
      ariaLabel="Central de Segurança do Passageiro"
      showCloseButton
      footer={
        <NativeButton
          variant="tonal"
          size="md"
          fullWidth
          onClick={onClose}
        >
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
            <span className="font-black block text-emerald-900">Viagem Monitorada por Satélite</span>
            Sua rota é transmitida em tempo real com telemetria ativa e criptografia de ponta a ponta.
          </div>
        </div>

        {/* Ação 1: Compartilhar Rota em Tempo Real */}
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
                {copied ? "Link Copiado com Sucesso!" : "Compartilhar Viagem"}
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
            {copied ? "Copiado ✓" : "Enviar"}
          </span>
        </div>

        {/* Ação 2: Suporte Operacional 24h */}
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

        {/* Ação 3: Emergência 190 (Polícia Militar) */}
        {showPoliceConfirm ? (
          <div
            className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-2.5 animate-in zoom-in-95 duration-150"
            style={{ borderRadius: ui.borderRadius }}
          >
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-xs font-black">Ligar para a Polícia Militar (190)?</h4>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
              Esta chamada deve ser utilizada exclusivamente em situações de emergência de segurança.
            </p>
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
                className="flex-1 min-h-[48px] rounded-xl bg-rose-600 text-white font-black text-xs shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                style={{ borderRadius: ui.borderRadius }}
              >
                <PhoneCall className="w-4 h-4" />
                <span>{callingPolice ? "TRANSMITINDO..." : "LIGAR 190"}</span>
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
                <h4 className="text-xs font-black text-rose-900">Emergência Policial (190)</h4>
                <p className="text-[11px] text-rose-700 truncate mt-0.5">
                  Ligue diretamente para a central de emergência
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-rose-700 shrink-0">190</span>
          </div>
        )}
      </div>
    </NativeBottomSheet>
  );
});
