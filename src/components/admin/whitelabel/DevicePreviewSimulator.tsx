import React from "react";
import {
  SmartphoneNfc,
  Smartphone,
  Tablet,
  Monitor,
  Rocket,
  Bell,
  Sparkles,
  Car,
  Package,
} from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useBranding } from "@/hooks/useBranding";
import { MobilityLandingPage } from "@/components/landing/MobilityLandingPage";
import type { MobilityLandingPageData } from "@/types/mobilityLanding";

interface DevicePreviewSimulatorProps {
  activeTab: string;
  liveLandingData: MobilityLandingPageData | null;
  previewDevice: "MOBILE" | "TABLET" | "DESKTOP";
  setPreviewDevice: (device: "MOBILE" | "TABLET" | "DESKTOP") => void;
  previewMode: "HOME" | "SPLASH" | "PUSH";
  setPreviewMode: (mode: "HOME" | "SPLASH" | "PUSH") => void;
}

export function DevicePreviewSimulator({
  activeTab,
  liveLandingData,
  previewDevice,
  setPreviewDevice,
  previewMode,
  setPreviewMode,
}: DevicePreviewSimulatorProps) {
  const { brand, designSystem, typography, businessModels, geo, appConfig } = useBrandTheme();
  const { branding } = useBranding();

  return (
    <aside className="w-full lg:w-5/12 xl:w-1/3 sticky top-20 z-30">
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-4">
        {/* Controles do Simulador */}
        <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SmartphoneNfc className="w-4 h-4 text-[#0088FF]" />
              <span className="text-xs font-bold text-slate-800">Live Device Preview</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewDevice("MOBILE")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  previewDevice === "MOBILE"
                    ? "bg-[#0088FF] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Simular Mobile (360px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice("TABLET")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  previewDevice === "TABLET"
                    ? "bg-[#0088FF] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Simular Tablet (440px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice("DESKTOP")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  previewDevice === "DESKTOP"
                    ? "bg-[#0088FF] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Simular Desktop"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Seletor de Modo de Exibição */}
          {activeTab !== "landing" && (
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewMode("HOME")}
                className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  previewMode === "HOME"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>App Home</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("SPLASH")}
                className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  previewMode === "SPLASH"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Rocket className="w-3 h-3" />
                <span>Splash</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode("PUSH")}
                className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                  previewMode === "PUSH"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Bell className="w-3 h-3" />
                <span>Push</span>
              </button>
            </div>
          )}
        </div>

        {/* MOLDURA DO DISPOSITIVO */}
        <div className="w-full flex justify-center py-2">
          <div
            style={{
              width:
                previewDevice === "MOBILE"
                  ? "360px"
                  : previewDevice === "TABLET"
                  ? "440px"
                  : "100%",
              fontFamily: typography?.familiaPrincipal || "Plus Jakarta Sans",
            }}
            className="rounded-[36px] border-4 border-slate-800 bg-white text-slate-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 min-h-[580px]"
          >
            {activeTab === "landing" ? (
              <div className="flex-1 overflow-y-auto max-h-[640px] bg-slate-950 flex flex-col">
                <div className="bg-slate-950 text-white px-5 py-2 text-[11px] font-bold flex items-center justify-between border-b border-slate-800 shrink-0">
                  <span>9:41</span>
                  <div className="w-16 h-3.5 bg-slate-800 rounded-full mx-auto" />
                  <span>5G 100%</span>
                </div>
                <div className="w-full flex-1">
                  <MobilityLandingPage
                    initialData={liveLandingData || undefined}
                    showCustomizer={false}
                  />
                </div>
              </div>
            ) : previewMode === "SPLASH" ? (
              <div
                style={{
                  backgroundColor: appConfig?.splashBackgroundColor || "#003366",
                }}
                className="flex-1 flex flex-col items-center justify-between p-6 text-white min-h-[580px] transition-colors duration-300"
              >
                {/* Status bar */}
                <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-80 shrink-0">
                  <span>9:41</span>
                  <div className="w-16 h-3 bg-white/20 rounded-full mx-auto" />
                  <span>5G 100%</span>
                </div>

                {/* Conteúdo Central */}
                <div className="flex flex-col items-center text-center space-y-4 my-auto">
                  <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md p-3 ring-2 ring-white/30 shadow-2xl flex items-center justify-center">
                    {appConfig?.splashAndroidUrl || brand?.splash?.splashAndroidUrl || branding?.splash_logo_url || branding?.logo_url ? (
                      <img
                        src={appConfig?.splashAndroidUrl || brand?.splash?.splashAndroidUrl || branding?.splash_logo_url || branding?.logo_url || ""}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Sparkles className="w-10 h-10 text-white" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
                      {appConfig?.nomeAppExibicao || branding?.app_name || brand?.nomePlataforma || "PARTIU"}
                    </h3>
                    <p className="text-xs text-white/80 font-medium max-w-[200px] mt-1">
                      {brand?.slogan || "Mobilidade Inteligente Sob Demanda"}
                    </p>
                  </div>
                </div>

                {/* Rodapé Splash */}
                <div className="flex flex-col items-center space-y-2 shrink-0">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-[10px] font-medium text-white/70">
                    Carregando serviços e praça...
                  </span>
                  <span className="text-[9px] font-mono text-white/50">
                    v{appConfig?.versaoApp || "3.4.0"} • {geo?.cidadeSede || "Itaperuna, RJ"}
                  </span>
                </div>
              </div>
            ) : previewMode === "PUSH" ? (
              <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white min-h-[580px] relative overflow-hidden">
                {/* Wallpaper radial glow */}
                <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(circle_at_50%_20%,rgba(0,136,255,0.25),transparent_70%)] pointer-events-none" />

                {/* Status bar */}
                <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-80 shrink-0 z-10">
                  <span>9:41</span>
                  <div className="w-16 h-3 bg-white/20 rounded-full mx-auto" />
                  <span>5G 100%</span>
                </div>

                {/* Relógio do Lockscreen */}
                <div className="flex flex-col items-center text-center mt-6 z-10">
                  <span className="text-5xl font-light tracking-tight text-white/95">09:41</span>
                  <span className="text-xs font-medium text-white/70 mt-1">
                    Quarta-feira, 15 de Outubro
                  </span>
                </div>

                {/* Card de Notificação Push */}
                <div className="my-auto z-10">
                  <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-3.5 shadow-2xl text-left space-y-2 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#0088FF] flex items-center justify-center p-0.5 overflow-hidden shadow-xs">
                          {appConfig?.iconeNotificacaoPushUrl || appConfig?.iconeAppUrl || branding?.logo_url ? (
                            <img
                              src={appConfig?.iconeNotificacaoPushUrl || appConfig?.iconeAppUrl || branding?.logo_url || ""}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Bell className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-white">
                          {appConfig?.nomeAppExibicao || branding?.app_name || "PARTIU"}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/60">agora</span>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-white">Motorista a caminho! 🚗</h5>
                      <p className="text-[11px] text-white/80 leading-snug mt-0.5">
                        Carlos (Toyota Corolla • ABC-1234) está a 3 minutos do seu local de embarque.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/15">
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-lg text-white">
                        Abrir App
                      </span>
                      <span className="text-[10px] font-medium text-white/70">
                        Toque para ver a rota no mapa
                      </span>
                    </div>
                  </div>
                </div>

                {/* Atalhos inferiores do Lockscreen */}
                <div className="w-full flex items-center justify-between px-4 shrink-0 z-10">
                  <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white/80">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="w-24 h-1 bg-white/40 rounded-full" />
                  <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white/80">
                    <Smartphone className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Status bar simulada */}
                <div className="bg-slate-950 text-white px-5 py-2 text-[11px] font-bold flex items-center justify-between">
                  <span>9:41</span>
                  <div className="w-16 h-3.5 bg-slate-800 rounded-full mx-auto" />
                  <span>5G 100%</span>
                </div>

                {/* Header do App Simulado com Curvatura em Arco Padrão 99 */}
                <div className="relative w-full h-[74px] overflow-visible bg-slate-100">
                  <svg
                    className="absolute top-0 left-0 w-full h-[74px] pointer-events-auto overflow-visible"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      filter: "drop-shadow(0 6px 12px rgba(0, 51, 102, 0.35))",
                    }}
                  >
                    <defs>
                      <linearGradient id="simHeaderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={branding?.header_gradient_start || "#0088FF"} />
                        <stop offset="100%" stopColor={branding?.header_gradient_end || "#003366"} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,0 L 100,0 L 100,54 C 74,98 26,98 0,54 Z"
                      fill="url(#simHeaderGradient)"
                    />
                  </svg>
                  <div className="relative z-10 px-4 pt-2.5 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/20 ring-2 ring-white/80 overflow-hidden flex items-center justify-center font-black text-[10px]">
                        {branding?.logo_url ? (
                          <img src={branding.logo_url} alt="" className="w-full h-full object-contain" />
                        ) : (
                          branding?.app_name?.slice(0, 2) || "PA"
                        )}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/80">
                          {branding?.app_name || "PARTIU"}
                        </span>
                        <span className="text-xs font-bold truncate">Olá, Passageiro! 👋</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                      {geo?.cidadeSede || "Itaperuna"}
                    </span>
                  </div>
                </div>

                {/* Conteúdo Simulado (Home Blocks) */}
                <div className="flex-1 p-3.5 space-y-3 bg-slate-50 overflow-y-auto max-h-[420px]">
                  {/* Mapa Preview */}
                  <div className="h-28 rounded-2xl bg-slate-200 border border-slate-300 relative overflow-hidden flex items-center justify-center shadow-xs">
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] opacity-70" />
                    <div className="relative z-10 text-center">
                      <span className="text-[11px] font-bold text-slate-600 block">
                        📍 {geo?.cidadeSede || "Itaperuna, RJ"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Radar em tempo real ativo
                      </span>
                    </div>
                  </div>

                  {/* Card de Busca */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">Para onde vamos hoje?</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-400">
                      Digite seu endereço de destino...
                    </div>
                  </div>

                  {/* Verticais Rápidas */}
                  <div className="grid grid-cols-4 gap-2">
                    {businessModels?.verticais &&
                      Object.values(businessModels.verticais)
                        .filter((v) => v.ativo)
                        .slice(0, 4)
                        .map((v) => (
                          <div
                            key={v.id}
                            className="p-2 bg-white rounded-xl border border-slate-200 text-center shadow-2xs"
                          >
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {v.nomeExibicao}
                            </span>
                            <span className="text-[9px] text-primary-700 font-bold block">
                              R$ {v.tarifaBaseBrl.toFixed(0)}
                            </span>
                          </div>
                        ))}
                  </div>

                  {/* Banner Simulado */}
                  <div
                    style={{
                      backgroundColor: designSystem?.paletaPrimaria?.corSecundaria || "#00C6FF",
                    }}
                    className="p-3 rounded-2xl text-white shadow-xs"
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider block opacity-80">
                      {brand?.slogan || "Mobilidade Inteligente"}
                    </span>
                    <span className="text-xs font-bold">
                      Taxa Zero para motoristas no Plano Ouro!
                    </span>
                  </div>
                </div>

                {/* Barra de Navegação Inferior Simulada (Sincronizada por Padrão ou Customizada) */}
                {(() => {
                  const isSynced = branding?.footer_sync_with_header !== false;
                  const fStart = isSynced
                    ? (branding?.header_gradient_start || "#0088FF")
                    : (branding?.footer_gradient_start || branding?.header_gradient_start || "#0088FF");
                  const fEnd = isSynced
                    ? (branding?.header_gradient_end || "#003366")
                    : (branding?.footer_gradient_end || branding?.header_gradient_end || "#003366");

                  return (
                    <div
                      style={{
                        background: `linear-gradient(180deg, ${fStart} 0%, ${fEnd} 100%)`,
                        borderTopLeftRadius: "18px",
                        borderTopRightRadius: "18px",
                        boxShadow: "0 -4px 18px rgba(0, 51, 102, 0.35)",
                      }}
                      className="border-t border-white/20 px-4 py-2.5 flex items-center justify-around"
                    >
                      <div
                        style={{
                          backgroundColor: "#FFFFFF",
                          color: fEnd,
                        }}
                        className="px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>Corridas</span>
                      </div>

                      <div className="px-3 py-1 text-xs font-bold text-white/80 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        <span>Entregas</span>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
