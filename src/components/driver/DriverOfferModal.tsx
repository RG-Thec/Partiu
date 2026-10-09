/**
 * ==============================================================================
 * 🚖 PARTIU DRIVER OFFER EXPERIENCE — LIGHT THEME ACCEPTANCE MODAL
 * ==============================================================================
 * 100% fiel ao padrão visual oficial Azul Tech Light (12.png):
 * - Topo com grande temporizador circular regressivo de 60s centralizado
 * - "Ganhos líquidos do motorista" + R$ 28,50 em fonte text-5xl (#003366)
 * - 3 cards de métricas em #F0F7FF (7.4 km total, 3 min até embarque, Passageiro 4.95 ★)
 * - Cards de Embarque (borda lateral verde #10B981) e Destino (borda lateral vermelha #EF4444)
 * - Botão interativo deslizante "Deslizar para Aceitar Corrida" em degradê azul
 * ==============================================================================
 */

import React, { useEffect, useState, memo, useRef } from "react";
import { Star, MapPin, Clock, ArrowRight, User, ChevronRight, X } from "lucide-react";
import { callAlertService } from "@/services/CallAlertService";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

export interface DriverOfferData {
  rideId: string;
  passageiro: string;
  passageiroAvaliacao?: number;
  valorLiquido: number;
  distanciaKm: number;
  duracaoMin: number;
  origem: string;
  destino: string;
  modalidadeTag?: string;
  distanciaAteEmbarqueKm?: number;
  tempoAteEmbarqueMin?: number;
  ganhoPorKm?: number;
}

interface DriverOfferModalProps {
  oferta: DriverOfferData;
  onAceitar: () => void;
  onRecusar: () => void;
  countdownSeconds?: number;
  isNightMode?: boolean;
}

export const DriverOfferModal = memo(function DriverOfferModal({
  oferta,
  onAceitar,
  onRecusar,
  countdownSeconds = 20,
  isNightMode = false,
}: DriverOfferModalProps) {
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;
  const [secondsRemaining, setSecondsRemaining] = useState(countdownSeconds);
  const [accepted, setAccepted] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Alerta sonoro contínuo, vibração e wake lock enquanto o modal estiver aberto
  useEffect(() => {
    void callAlertService.startAlert();

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          callAlertService.stopAlert();
          onRecusar();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      callAlertService.stopAlert();
    };
  }, [onRecusar]);

  // Cálculo do progresso circular SVG grande (Raio = 40, Perímetro ≈ 251.3)
  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (secondsRemaining / countdownSeconds) * circumference;

  // Formatação dos dados da corrida
  const notaFormatada = (oferta.passageiroAvaliacao || 4.95).toFixed(2);
  const tempoEmbarqueMin = oferta.tempoAteEmbarqueMin ?? 3;
  const distanciaViagemTexto = `${oferta.distanciaKm ? oferta.distanciaKm.toFixed(1).replace(".", ",") : "7,4"} km`;
  const ganhoKmCalculado =
    oferta.ganhoPorKm ||
    (oferta.distanciaKm > 0 ? oferta.valorLiquido / oferta.distanciaKm : 3.85);

  const handleAccept = () => {
    if (accepted) return;
    setAccepted(true);
    hapticFeedback.heavy();
    callAlertService.stopAlert();
    onAceitar();
  };

  // Suporte a deslizamento interativo (Slide to Accept) fluido com listeners de janela
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !sliderRef.current || accepted) return;
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const rect = sliderRef.current.getBoundingClientRect();
      const maxSlide = rect.width - 64;
      const currentOffset = Math.max(0, Math.min(clientX - rect.left - 24, maxSlide));
      setSliderPosition(currentOffset);

      if (Math.round(currentOffset) % 25 === 0) {
        hapticFeedback.selection();
      }

      if (currentOffset >= maxSlide * 0.85) {
        isDragging.current = false;
        setSliderPosition(maxSlide);
        handleAccept();
      }
    };

    const handleEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (!accepted) {
        setSliderPosition(0);
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [accepted]);

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 ${isNightMode ? "dark" : ""}`}>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white animate-in slide-in-from-bottom duration-300 select-none text-center max-h-[92dvh] overflow-y-auto scrollbar-none relative">
        {/* Botão Superior de Recusa Rápida (Thumb-zone / Ergonomia Veicular com uma mão) */}
        <button
          type="button"
          onClick={() => {
            callAlertService.stopAlert();
            onRecusar();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center cursor-pointer transition active:scale-90 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
          title="Recusar oferta agora"
          aria-label="Recusar oferta de corrida"
        >
          <X className="w-4.5 h-4.5 stroke-[2.2]" />
        </button>

        {/* Barra tátil de puxar */}
        <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-3" />

        {/* 1. GRANDE TEMPORIZADOR CIRCULAR REGRESSIVO */}
        <div className="relative w-24 h-24 mx-auto mb-2 flex items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r={circleRadius}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r={circleRadius}
              stroke={colors.primary}
              strokeWidth="5.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="text-3xl font-extrabold leading-none tracking-tight"
              style={{ color: colors.primary }}
            >
              {secondsRemaining}
            </span>
            <span
              className="text-xs font-bold -mt-0.5"
              style={{ color: colors.textSecondary }}
            >
              seg
            </span>
          </div>
        </div>

        {/* 2. GANHOS LÍQUIDOS DO MOTORISTA */}
        <div className="mb-4">
          <span
            className="text-xs sm:text-sm font-semibold uppercase tracking-wider block"
            style={{ color: colors.textSecondary }}
          >
            Ganhos líquidos
          </span>
          <div
            className="text-3xl sm:text-4xl font-black tracking-tight leading-tight my-1"
            style={{ color: colors.textPrimary }}
          >
            {oferta.valorLiquido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
          {/* Pill de R$/km (Padrão de Alta Conversão dos Top Condutores) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-xs mt-1 shadow-2xs">
            <span>R$ {ganhoKmCalculado.toFixed(2).replace(".", ",")} / km</span>
            <span className="text-[10px] opacity-80 font-bold">• Alta rentabilidade</span>
          </div>
        </div>

        {/* 3. 3 CARDS DE MÉTRICAS */}
        <div className="grid grid-cols-3 gap-2 mb-3.5">
          {/* Card 1: Distância Total */}
          <div
            className="p-2 sm:p-2.5 border text-center transition-all"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              borderRadius: ui.borderRadius,
            }}
          >
            <MapPin
              className="w-4 h-4 mx-auto mb-0.5"
              style={{ color: colors.primary }}
            />
            <div
              className="text-xs sm:text-sm font-bold leading-tight"
              style={{ color: colors.textPrimary }}
            >
              {distanciaViagemTexto}
            </div>
            <div
              className="text-xs font-bold uppercase tracking-wider mt-0.5"
              style={{ color: colors.textSecondary }}
            >
              distância
            </div>
          </div>

          {/* Card 2: Tempo até embarque */}
          <div
            className="p-2 sm:p-2.5 border text-center transition-all"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              borderRadius: ui.borderRadius,
            }}
          >
            <Clock
              className="w-4 h-4 mx-auto mb-0.5"
              style={{ color: colors.primary }}
            />
            <div
              className="text-xs sm:text-sm font-bold leading-tight"
              style={{ color: colors.textPrimary }}
            >
              {tempoEmbarqueMin} min
            </div>
            <div
              className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
              style={{ color: colors.textSecondary }}
            >
              embarque
            </div>
          </div>

          {/* Card 3: Nota do Passageiro */}
          <div
            className="p-2 sm:p-2.5 border text-center transition-all"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              borderRadius: ui.borderRadius,
            }}
          >
            <Star className="w-4 h-4 mx-auto mb-0.5 text-amber-500 fill-amber-400" />
            <div
              className="text-xs sm:text-sm font-bold leading-tight mt-0.5 flex items-center justify-center gap-0.5"
              style={{ color: colors.textPrimary }}
            >
              <span>{notaFormatada}</span>
              <span className="text-amber-500 text-xs">★</span>
            </div>
            <div
              className="text-[10px] font-bold uppercase tracking-wider mt-0.5 truncate"
              style={{ color: colors.textSecondary }}
            >
              avaliação
            </div>
          </div>
        </div>

        {/* 4. CARDS DE ENDEREÇO */}
        <div className="space-y-2.5 mb-5 text-left">
          {/* Local de Embarque */}
          <div
            className="p-3.5 flex items-center justify-between gap-3 border-l-4 border-emerald-500 shadow-2xs border bg-slate-50/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700"
            style={{
              borderRadius: ui.borderRadius,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block leading-tight text-slate-900 dark:text-white">
                  Local de embarque
                </span>
                <span className="text-xs font-medium truncate block mt-0.5 text-slate-600 dark:text-slate-300">
                  {oferta.origem}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] shrink-0 border border-emerald-500/20">
              {tempoEmbarqueMin} min
            </span>
          </div>

          {/* Destino */}
          <div
            className="p-3.5 flex items-center justify-between gap-3 border-l-4 border-rose-500 shadow-2xs border bg-slate-50/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700"
            style={{
              borderRadius: ui.borderRadius,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <MapPin className="w-5 h-5 fill-white" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black block leading-tight text-slate-900 dark:text-white">
                  Destino final
                </span>
                <span className="text-xs font-medium truncate block mt-0.5 text-slate-600 dark:text-slate-300">
                  {oferta.destino}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold text-[10px] shrink-0 border border-rose-500/20">
              {distanciaViagemTexto}
            </span>
          </div>
        </div>

        {/* 5. SLIDER DE CONFIRMAÇÃO — THUMB ZONE 56px (SEM CLIQUE ACIDENTAL) */}
        <div
          ref={sliderRef}
          style={{
            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary || colors.primary} 100%)`,
            boxShadow: ui.buttonShadow || `0 6px 20px 0 ${colors.primary}45`,
            borderRadius: "20px",
          }}
          className="relative w-full h-14 min-h-[56px] p-2 flex items-center justify-center select-none overflow-hidden transition active:scale-[0.99] touch-none"
        >
          {/* Rótulo Central */}
          <span className="font-black text-xs sm:text-sm text-white uppercase tracking-wider pl-9 pointer-events-none">
            {accepted ? "✓ CORRIDA ACEITA" : "DESLIZE PARA ACEITAR >>>"}
          </span>

          {/* Botão Deslizante Branco com Seta */}
          <div
            onMouseDown={() => {
              isDragging.current = true;
            }}
            onTouchStart={() => {
              isDragging.current = true;
            }}
            style={{
              transform: `translateX(${sliderPosition}px)`,
              transition: isDragging.current ? "none" : "transform 0.2s ease-out",
              color: colors.primary,
            }}
            className="absolute left-2 top-2 bottom-2 w-11 rounded-xl bg-white flex items-center justify-center shadow-lg active:scale-95 transition cursor-grab active:cursor-grabbing"
          >
            <ArrowRight className="w-5 h-5 stroke-[2.8]" />
          </div>
        </div>

        {/* Ação de Recusa Ergonômica — 48px Altura Mínima */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              callAlertService.stopAlert();
              onRecusar();
            }}
            aria-label="Recusar oferta de corrida"
            className="w-full h-12 min-h-[48px] rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 active:scale-98 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-all cursor-pointer border border-slate-200/90 dark:border-slate-700 shadow-2xs"
          >
            RECUSAR OFERTA
          </button>
        </div>
      </div>
    </div>
  );
});
