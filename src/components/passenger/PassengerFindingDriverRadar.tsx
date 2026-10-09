import React, { useMemo, memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  AlertTriangle,
  Clock,
  Star,
  ShieldCheck,
  Car,
} from "lucide-react";
import { usePassengerRide } from "@/contexts/PassengerRideContext";
import { useDriverSearchRealtime } from "@/hooks/useDriverSearchRealtime";
import { DriverViewing99Card } from "./DriverViewing99Card";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

/**
 * ==============================================================================
 * 📡 PARTIU RADAR ENGINE V4 (60 FPS GPU-ACCELERATED)
 * ==============================================================================
 * Visual progressivo de alta fidelidade com 3 ondas concêntricas animadas,
 * pino de ancoragem de embarque central, feedback em tempo real de expansão
 * de raio PostGIS (R1 2km -> R2 4km -> R3 6km) e redução ativa de ansiedade.
 * Padrão Uber/99.
 * ==============================================================================
 */
export const PassengerFindingDriverRadar = memo(function PassengerFindingDriverRadar() {
  const {
    state,
    categoriaVeiculo,
    cotacoes,
    origem,
    destino,
    formaPagamento,
    progressiveSession,
    isCancelModalOpen,
    requestCancel,
    dismissCancel,
    confirmCancel,
    selectVehicle,
    confirmPickupAndFindDriver,
  } = usePassengerRide();

  const [incentivoAdicionado, setIncentivoAdicionado] = useState(false);

  const { currentDriver, isTransitioning, hasActiveDriver } = useDriverSearchRealtime();
  const { corPrimaria, corTextoPrimaria, nomeApp } = useBrandTheme();
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  // Determina onda atual (1, 2 ou 3) com fallback do estado
  const currentWave = useMemo(() => {
    if (progressiveSession?.currentWave) return progressiveSession.currentWave;
    if (state === "SEARCHING_R2") return 2;
    if (state === "SEARCHING_R3") return 3;
    return 1;
  }, [progressiveSession?.currentWave, state]);

  // Mensagem e Raio dinâmicos da onda ativa sincronizados com o motor de busca
  const waveDetails = useMemo(() => {
    switch (currentWave) {
      case 2:
        return {
          title: "Ampliando a busca",
          message: progressiveSession?.waveMessage || "Ampliando a busca na região...",
          radiusLabel: "Raio: 4 km",
          secondsRemaining: progressiveSession?.waveSecondsRemaining ?? 180,
          totalSeconds: progressiveSession?.waveDurationSeconds ?? 180,
          themeColor: "blue",
          ringBorder: "border-primary",
          ringBg: "bg-primary/15",
          badgeBg: "bg-primary-50 text-primary-900 border-primary-300",
        };
      case 3:
        return {
          title: "Busca metropolitana",
          message: progressiveSession?.waveMessage || "Procurando em bairros vizinhos...",
          radiusLabel: progressiveSession?.currentRadiusMeters
            ? `Raio: ${(progressiveSession.currentRadiusMeters / 1000).toFixed(0)} km`
            : "Raio: 6 km",
          secondsRemaining: progressiveSession?.waveSecondsRemaining ?? 300,
          totalSeconds: progressiveSession?.waveDurationSeconds ?? 300,
          themeColor: "indigo",
          ringBorder: "border-primary",
          ringBg: "bg-primary/15",
          badgeBg: "bg-primary-50 text-primary-900 border-primary-300",
        };
      case 1:
      default:
        return {
          title: "Buscando condutores",
          message: progressiveSession?.waveMessage || "Buscando motoristas próximos...",
          radiusLabel: "Raio: 2 km",
          secondsRemaining: progressiveSession?.waveSecondsRemaining ?? 120,
          totalSeconds: progressiveSession?.waveDurationSeconds ?? 120,
          themeColor: "cyan",
          ringBorder: "border-primary",
          ringBg: "bg-primary/15",
          badgeBg: "bg-primary-50 text-primary-900 border-primary-300",
        };
    }
  }, [currentWave, progressiveSession]);

  const cotacaoAtiva = categoriaVeiculo === "MOTO" ? cotacoes.moto : cotacoes.carro;

  // Progresso percentual da onda ativa
  const progressPercent = Math.min(
    100,
    Math.max(
      5,
      ((waveDetails.totalSeconds - waveDetails.secondsRemaining) / waveDetails.totalSeconds) * 100
    )
  );

  // Contagem regressiva total com suporte à janela estendida de 10 minutos (600s)
  const totalSecondsRemaining = useMemo(() => {
    if (typeof progressiveSession?.totalSearchSecondsRemaining === "number") {
      return progressiveSession.totalSearchSecondsRemaining;
    }
    return Math.max(1, (3 - currentWave) * 20 + waveDetails.secondsRemaining);
  }, [progressiveSession?.totalSearchSecondsRemaining, currentWave, waveDetails.secondsRemaining]);

  const formattedCountdown = useMemo(() => {
    const mins = Math.floor(totalSecondsRemaining / 60);
    const secs = totalSecondsRemaining % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [totalSecondsRemaining]);

  // Feedback tátil sutil a cada progressão de onda
  useEffect(() => {
    hapticFeedback.light();
  }, [currentWave]);

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. RADAR CENTRAL NO MAPA (RESPONSIVO, OCULTADO QUANDO O MODAL ESTIVER ABERTO) */}
      {/* ========================================================================= */}
      <div
        className={`fixed inset-x-0 top-16 bottom-[340px] pointer-events-none flex items-center justify-center select-none transition-all duration-300 ${
          isCancelModalOpen ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
        }`}
        style={{ zIndex: 10 }}
        aria-hidden="true"
      >
        <div className="relative flex items-center justify-center">
          <style>{`
            @keyframes radar-spin-sweep {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            .animate-radar-sweep {
              animation: radar-spin-sweep 3.5s linear infinite;
            }
          `}</style>

          {/* Feixe Giratório de Varredura de Radar (Inspirado no 21st.dev Radar Effect) */}
          <div
            style={{ transformOrigin: "right center" }}
            className="animate-radar-sweep absolute right-1/2 top-1/2 z-15 flex h-[4px] w-[160px] sm:w-[200px] items-end justify-center overflow-hidden pointer-events-none"
          >
            <div
              className="relative h-[2px] w-full"
              style={{
                background: `linear-gradient(to right, transparent, ${colors.primary}, transparent)`,
              }}
            />
          </div>

          {/* Beacon Central do Veículo (Padrão Figma Caber Connecting Rider) */}
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-2xl relative z-20 border-2 border-white transition-transform transform active:scale-95"
            style={{
              backgroundColor: colors.primary,
              boxShadow: `0 8px 32px ${colors.primary}70`,
            }}
          >
            <Car className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
          </div>

          {/* Anel Concêntrico 1 (Pulso Rápido) */}
          <div
            className="absolute w-44 h-44 rounded-full border-2 animate-ping duration-1000 will-change-transform pointer-events-none"
            style={{
              animationDuration: "1400ms",
              borderColor: colors.primary,
              backgroundColor: `${colors.primary}1A`,
            }}
          />

          {/* Anel Concêntrico 2 (Pulso Médio Expansivo) */}
          <div
            className="absolute w-64 h-64 rounded-full border opacity-70 animate-pulse duration-1000 will-change-transform pointer-events-none"
            style={{
              animationDuration: "1800ms",
              borderColor: colors.primary,
              backgroundColor: `${colors.primary}1A`,
            }}
          />

          {/* Anel Concêntrico 3 (Expansão Máxima) */}
          <div
            className="absolute w-88 h-88 rounded-full border border-dashed opacity-40 will-change-transform pointer-events-none"
            style={{
              borderColor: `${colors.primary}66`,
              backgroundColor: `${colors.primary}0D`,
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GAVETA INFERIOR UNIFICADA DE BUSCA (PADRÃO ENTERPRISE UBER / STRIPE)   */}
      {/* ETAPA 1 & 3: SUPERFÍCIE ÚNICA, ZERO FRATURA, ZERO CARD FLUTUANTE SOLTO   */}
      {/* ========================================================================= */}
      <div
        data-hide-bottom-nav="true"
        className="w-full max-w-md mx-auto z-40 animate-in slide-in-from-bottom duration-300 mt-auto relative select-none"
        style={{ zIndex: 40 }}
      >
        <div
          style={{ borderRadius: `${ui.borderRadius} ${ui.borderRadius} 0 0` }}
          className="bg-card shadow-2xl border-t border-border pt-3.5 pb-5 px-5 flex flex-col space-y-3.5"
        >
          {/* DRAG HANDLE BAR MINIMALISTA */}
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto" />

          {/* 1. STATUS PRINCIPAL DA BUSCA & CRONÔMETRO TABULAR (WCAG 2.2 AA) */}
          <div className="flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: colors.primary }}
                />
                <span
                  className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ backgroundColor: colors.primary }}
                />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                  Buscando motoristas próximos
                </h3>
                <p className="text-xs text-slate-700 font-semibold leading-tight truncate mt-0.5">
                  {currentWave === 1
                    ? "Conectando aos condutores no seu bairro (2 km)"
                    : currentWave === 2
                    ? "Ampliando busca para a região (4 km)"
                    : "Busca metropolitana expandida (6 km)"}
                </p>
              </div>
            </div>

            {/* Cronômetro Tabular Elegante (Padrão 99 com suporte até 10 minutos) */}
            <div
              role="timer"
              aria-live="polite"
              aria-label={`${formattedCountdown} restantes`}
              className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-primary stroke-[2.2]" />
              <span className="text-xs font-mono font-black text-slate-900 tabular-nums">
                {formattedCountdown}
              </span>
            </div>
          </div>

          {/* 2. BARRA DE PROGRESSO TRIFÁSICA DA ONDA COM COR PRIMÁRIA DINÂMICA */}
          <div className="space-y-1">
            <div
              role="progressbar"
              aria-label="Progresso da busca em ondas"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1"
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  currentWave >= 1 ? "bg-primary" : "bg-slate-200"
                }`}
                style={{ width: currentWave === 1 ? `${progressPercent}%` : "100%" }}
              />
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  currentWave >= 2 ? "bg-primary" : "bg-slate-200"
                }`}
                style={{
                  width: currentWave === 2 ? `${progressPercent}%` : currentWave > 2 ? "100%" : "0%",
                }}
              />
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  currentWave >= 3 ? "bg-primary" : "bg-slate-200"
                }`}
                style={{ width: currentWave === 3 ? `${progressPercent}%` : "0%" }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-0.5">
              <span>Onda {currentWave} de 3</span>
              <span>{waveDetails.radiusLabel}</span>
            </div>
          </div>

          {/* 3. MOTORISTA VISUALIZANDO EM TEMPO REAL (PADRÃO OFICIAL APLICATIVO 99) */}
          {hasActiveDriver && currentDriver && (
            <DriverViewing99Card
              driver={currentDriver}
              totalViewingCount={(progressiveSession?.viewingDrivers?.length || 1)}
              isTransitioning={isTransitioning}
            />
          )}

          {/* 4. RESUMO PERMANENTE DA CORRIDA (ETAPA 6: O USUÁRIO NUNCA PERDE O CONTEXTO) */}
          <div className="w-full bg-slate-50/90 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-3 text-left">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: colors.primary }}
                />
                <span className="truncate">{origem ? origem.split(",")[0] : "Local de Embarque"}</span>
                <span className="text-slate-600 font-extrabold">➔</span>
                <span className="truncate text-slate-950 font-black">{destino ? destino.split(",")[0] : "Destino"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 font-bold mt-0.5">
                <span>{categoriaVeiculo === "MOTO" ? `${nomeApp} Moto` : `${nomeApp} Carro`}</span>
                <span>•</span>
                <span>
                  {String(formaPagamento).toUpperCase() === "PIX"
                    ? "PIX"
                    : String(formaPagamento).toUpperCase() === "DINHEIRO"
                    ? "Dinheiro"
                    : String(formaPagamento).toUpperCase().includes("CARTAO")
                    ? "Cartão"
                    : "Maquininha"}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                {cotacaoAtiva?.precoBrl ? `R$ ${cotacaoAtiva.precoBrl.toFixed(2).replace(".", ",")}` : "R$ 14,90"}
              </span>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Tarifa Fixada
              </span>
            </div>
          </div>

          {/* ASSISTÊNCIA PRÓ-ATIVA DE CONVERSÃO RÁPIDA (ONDA 2+) */}
          {currentWave >= 2 && (
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                <span>⚡ Busca prolongada. Deseja acelerar o aceite?</span>
              </div>
              <div className="flex items-center gap-2">
                {!incentivoAdicionado ? (
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback.medium();
                      setIncentivoAdicionado(true);
                    }}
                    className="min-h-[44px] flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition active:scale-95 shadow-xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>+ R$ 3 de incentivo</span>
                  </button>
                ) : (
                  <div className="min-h-[44px] flex-1 py-2 px-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs text-center border border-emerald-300 flex items-center justify-center">
                    ✓ +R$ 3 adicionado
                  </div>
                )}
                {categoriaVeiculo === "CARRO" && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback.medium();
                      selectVehicle("MOTO");
                      confirmPickupAndFindDriver();
                    }}
                    className="min-h-[44px] flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs transition active:scale-95 shadow-xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>🏍️ Tentar Moto</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 5. AÇÃO SECUNDÁRIA: CANCELAR BUSCA (ETAPA 5: NEUTRO, SEM VERMELHO AGRESSIVO) */}
          <button
            type="button"
            onClick={requestCancel}
            className="w-full min-h-[44px] h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer shadow-2xs border border-slate-200"
            aria-label="Cancelar busca de motorista"
          >
            <X className="w-4 h-4 stroke-[2.2] text-slate-600" />
            <span>Cancelar busca</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL DE CONFIRMAÇÃO DE CANCELAMENTO (PORTAL Z-[9999] COM BACKDROP FOCAL) */}
      {/* ========================================================================= */}
      {isCancelModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            style={{ zIndex: 9999 }}
            className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 pointer-events-auto select-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) dismissCancel();
            }}
          >
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-5 space-y-3.5 text-center animate-in zoom-in-95 duration-200 pointer-events-auto border border-slate-100">
              {/* Ícone de Atenção com Halo Suave */}
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100 shadow-2xs">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>

              {/* Textos Informativos */}
              <div className="space-y-1">
                <h4 id="cancel-modal-title" className="text-base font-extrabold text-slate-900 tracking-tight">
                  Deseja cancelar a busca?
                </h4>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  Já estamos na Onda {currentWave} ({waveDetails.radiusLabel}), conectando com os condutores mais próximos de você.
                </p>

                {/* Badge de Carência Gratuita */}
                <div className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/80 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Cancelamento gratuito · Nenhuma taxa cobrada</span>
                </div>
              </div>

              {/* Botões de Decisão (Primário: Continuar / Secundário: Cancelar) */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={dismissCancel}
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.surface,
                    borderRadius: "12px",
                  }}
                  className="w-full h-9.5 sm:h-10 font-semibold text-xs sm:text-[13px] transition active:scale-[0.98] cursor-pointer hover:brightness-105 shadow-2xs flex items-center justify-center"
                >
                  Continuar Aguardando
                </button>

                <button
                  type="button"
                  onClick={() => confirmCancel()}
                  className="w-full h-9 sm:h-9.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-medium text-xs transition active:scale-[0.98] cursor-pointer border border-slate-200 hover:border-rose-300 flex items-center justify-center"
                >
                  Sim, Cancelar Corrida
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
});
