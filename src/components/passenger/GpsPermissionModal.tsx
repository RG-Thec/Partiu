import React, { useState } from "react";
import { Navigation, AlertTriangle, ShieldCheck, MapPin } from "lucide-react";
import { usePassengerRide } from "@/contexts/PassengerRideContext";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { NativeBottomSheet } from "@/components/native/NativeBottomSheet";
import { NativeButton } from "@/components/native/NativeButton";

export function GpsPermissionModal() {
  const { isGpsPermissionModalOpen, closeGpsPermissionModal, solicitarPermissaoGps } = usePassengerRide();
  const { appConfig } = useTheme();
  const { colors, ui, appName } = appConfig.branding;

  const [solicitando, setSolicitando] = useState(false);
  const [tentativaFalhou, setTentativaFalhou] = useState(false);

  async function handleTentarNovamente() {
    setSolicitando(true);
    setTentativaFalhou(false);
    try {
      const sucesso = await solicitarPermissaoGps();
      if (!sucesso) {
        setTentativaFalhou(true);
      }
    } finally {
      setSolicitando(false);
    }
  }

  return (
    <NativeBottomSheet
      isOpen={isGpsPermissionModalOpen}
      onClose={closeGpsPermissionModal}
      title="Ativar Localização"
      subtitle={`Necessário para conectar você ao motorista no ${appName}`}
      ariaLabel="Permissão de Localização GPS"
    >
      <div className="space-y-4 pt-1">
        {/* Ícone com Destaque Temático */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center relative transition-transform"
            style={{
              backgroundColor: `${colors.primary}18`,
              border: `2px solid ${colors.primary}35`,
              color: colors.primary,
            }}
          >
            <Navigation className="w-8 h-8 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: colors.primary }}
              />
              <span
                className="relative inline-flex rounded-full h-4 w-4 border-2 border-white"
                style={{ backgroundColor: colors.primary }}
              />
            </span>
          </div>
        </div>

        {/* Descrição Direta e Humana */}
        <p
          className="text-xs sm:text-sm text-center font-medium leading-relaxed"
          style={{ color: colors.textSecondary }}
        >
          Para encontrar o motorista mais próximo e calcular a rota correta, precisamos acessar a sua localização em tempo real.
        </p>

        {/* Alerta de Falha/Bloqueio nas Configurações */}
        {tentativaFalhou && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-left flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 leading-tight">
              <strong className="font-bold">Permissão bloqueada:</strong> Acesse as configurações de permissões do navegador ou dispositivo e libere o acesso ao GPS.
            </div>
          </div>
        )}

        {/* Benefícios e Segurança */}
        <div
          className="p-3 border rounded-2xl space-y-2 text-left"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            borderRadius: ui.borderRadius,
          }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: colors.textPrimary }}>
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dados de localização criptografados de ponta a ponta</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: colors.textPrimary }}>
            <MapPin className="w-4 h-4 shrink-0" style={{ color: colors.primary }} />
            <span>Ponto de embarque identificado sem digitação manual</span>
          </div>
        </div>

        {/* Ações com NativeButton e Touch Target >= 48px */}
        <div className="space-y-2.5 pt-2">
          <NativeButton
            variant="filled"
            size="lg"
            fullWidth
            isLoading={solicitando}
            leftIcon={<Navigation className="w-5 h-5" />}
            onClick={handleTentarNovamente}
          >
            {solicitando ? "Buscando satélites..." : "Permitir Acesso ao GPS"}
          </NativeButton>

          <NativeButton
            variant="text"
            size="md"
            fullWidth
            onClick={closeGpsPermissionModal}
          >
            Agora não
          </NativeButton>
        </div>
      </div>
    </NativeBottomSheet>
  );
}
