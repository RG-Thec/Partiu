import React, { useEffect } from "react";
import {
  RotateCcw,
  X,
  Clock,
  Car,
  Zap,
  ArrowRight,
} from "lucide-react";
import { usePassengerRide } from "@/contexts/PassengerRideContext";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";
import { NativeButton } from "@/components/native/NativeButton";
import { NativeSurface } from "@/components/native/NativeSurface";

/**
 * ==============================================================================
 * ⏱️ PARTIU TIMEOUT BOTTOM SHEET — NATIVE ANDROID MATERIAL 3 & WHITE LABEL
 * ==============================================================================
 * Tela de encerramento temporário de busca com ilustração amigável,
 * botão primário de reinício (Continuar Buscando), botão secundário de cancelamento
 * e banner dinâmico de Fast Recovery se um motorista entrar online.
 * ==============================================================================
 */
export function PassengerTimeoutBottomSheet() {
  const {
    origem,
    destino,
    cotacoes,
    categoriaVeiculo,
    progressiveSession,
    retrySearchAfterTimeout,
    cancelRideAfterTimeout,
  } = usePassengerRide();
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  // Vibração de alerta tátil na abertura do timeout
  useEffect(() => {
    hapticFeedback.warning();
  }, []);

  const isFastRecovery = progressiveSession?.isFastRecoveryAvailable;
  const recoveryDriver = progressiveSession?.recoveryDriver;
  const cotacaoAtiva = categoriaVeiculo === "MOTO" ? cotacoes.moto : cotacoes.carro;

  return (
    <div
      data-hide-bottom-nav="true"
      className="w-full max-w-md mx-auto px-4 pb-6 z-30 animate-in slide-in-from-bottom duration-300 mt-auto select-none"
    >
      <NativeSurface
        elevation={2}
        className="p-6 space-y-4 text-center backdrop-blur-md"
      >
        {/* BARRA SUPERIOR INDICADORA DE ARRASTE / DISPENSA */}
        <div
          onTouchStart={(e) => {
            (e.currentTarget as any)._startY = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const startY = (e.currentTarget as any)._startY;
            if (startY && e.changedTouches[0].clientY - startY > 50) {
              hapticFeedback.light();
              cancelRideAfterTimeout();
            }
          }}
          className="w-full -mt-2 pb-1 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none group"
          aria-label="Deslize para baixo para fechar"
        >
          <div className="w-10 h-1.5 rounded-full bg-slate-300 group-hover:bg-slate-400 transition-colors" />
        </div>

        {/* BANNER DINÂMICO DE FAST RECOVERY (MOTORISTA DISPONÍVEL) */}
        {isFastRecovery && (
          <div
            className="p-3.5 border text-left flex items-center justify-between gap-3 animate-in zoom-in-95 duration-200 shadow-sm"
            style={{
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}45`,
              borderRadius: ui.borderRadius,
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md"
                style={{ backgroundColor: colors.primary }}
              >
                <Zap className="w-4 h-4 fill-white text-white" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-black text-slate-950 leading-tight flex items-center gap-1">
                  <span>Motorista encontrado por perto!</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h5>
                <p className="text-[11px] font-semibold truncate mt-0.5" style={{ color: colors.textSecondary }}>
                  {recoveryDriver?.driverName ? `${recoveryDriver.driverName.split(" ")[0]} está a ${(recoveryDriver.distanceMeters / 1000).toFixed(1)} km` : "Deseja tentar novamente agora?"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                hapticFeedback.success();
                retrySearchAfterTimeout();
              }}
              style={{
                backgroundColor: colors.primary,
                boxShadow: `0 4px 12px ${colors.primary}40`,
                borderRadius: ui.borderRadius,
              }}
              className="py-2 px-3 text-white text-xs font-bold transition shrink-0 flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <span>Conectar</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}

        {/* ILUSTRAÇÃO VETORIAL AMIGÁVEL */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full animate-pulse opacity-20"
            style={{ backgroundColor: colors.primary }}
          />

          <div
            className="relative w-18 h-18 rounded-2xl text-white flex items-center justify-center shadow-xl border-2 border-white"
            style={{
              backgroundColor: colors.primary,
              boxShadow: `0 8px 24px ${colors.primary}35`,
              borderRadius: ui.borderRadius,
            }}
          >
            <Car className="w-9 h-9 text-white" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-md">
              <Clock className="w-3.5 h-3.5" style={{ color: colors.primary }} />
            </div>
          </div>
        </div>

        {/* TÍTULO E DESCRIÇÃO OFICIAL */}
        <div className="space-y-1.5">
          <h3
            className="text-lg font-black tracking-tight leading-snug"
            style={{ color: colors.textPrimary }}
          >
            Nenhum motorista encontrado no momento
          </h3>
          <p
            className="text-xs font-medium leading-relaxed max-w-xs mx-auto"
            style={{ color: colors.textSecondary }}
          >
            Buscamos durante alguns minutos por condutores na sua região, mas todos estão ocupados neste instante. O que deseja fazer?
          </p>
        </div>

        {/* CARD RESUMO DO TRAJETO RECENTE */}
        <div
          className="p-3 border text-left space-y-1 text-xs"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            borderRadius: ui.borderRadius,
          }}
        >
          <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: colors.textSecondary }}>
            <span className="truncate max-w-[200px]">{origem}</span>
            <span>➔</span>
            <span className="truncate max-w-[140px] text-right">{destino}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t font-bold" style={{ borderColor: colors.inputBorder }}>
            <span style={{ color: colors.textPrimary }}>{cotacaoAtiva.nomeExibicao}</span>
            <span className="font-black" style={{ color: colors.primary }}>
              R$ {cotacaoAtiva.precoBrl.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO COM TOUCH TARGET ≥ 48px E FEEDBACK NATIVO */}
        <div className="space-y-2.5 pt-1">
          <NativeButton
            variant="filled"
            size="lg"
            fullWidth
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={() => {
              hapticFeedback.heavy();
              retrySearchAfterTimeout();
            }}
          >
            Continuar Buscando Motorista
          </NativeButton>

          <NativeButton
            variant="tonal"
            size="md"
            fullWidth
            leftIcon={<X className="w-4 h-4" />}
            onClick={() => {
              hapticFeedback.light();
              cancelRideAfterTimeout();
            }}
          >
            Cancelar Busca
          </NativeButton>
        </div>
      </NativeSurface>
    </div>
  );
}
