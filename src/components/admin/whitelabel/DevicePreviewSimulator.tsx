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
  Navigation,
  MapPin,
  Clock,
  Shield,
  Search,
  Home,
  Briefcase,
  History,
  User,
  CreditCard,
  Wifi,
  Battery,
  ChevronRight,
  Bike,
  HeartHandshake,
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
  const {
    brand,
    designSystem,
    typography,
    businessModels,
    geo,
    appConfig,
    corPrimaria: themeCorPrimaria,
    corSecundaria: themeCorSecundaria,
  } = useBrandTheme();
  const { branding } = useBranding();

  const corPrimaria = branding?.primary_color || themeCorPrimaria || "#FF6B00";
  const corSecundaria = branding?.secondary_color || themeCorSecundaria || "#0088FF";
  const nomeApp =
    appConfig?.nomeAppExibicao || branding?.app_name || brand?.nomePlataforma || "PARTIU";
  const cidadeSede = geo?.cidadeSede || "Brasília, DF";

  return (
    <div className="w-full space-y-4">
      {/* 1. CONTROLES DO SIMULADOR (Dark Mode Integrado) */}
      <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SmartphoneNfc className="w-4 h-4 text-primary" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Live Device Preview
            </span>
          </div>

          {/* Seletor de Tipo de Aparelho */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPreviewDevice("MOBILE")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                previewDevice === "MOBILE"
                  ? "bg-primary text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Mobile (iPhone 16 Pro)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setPreviewDevice("TABLET")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                previewDevice === "TABLET"
                  ? "bg-primary text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Tablet (iPad Mini)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setPreviewDevice("DESKTOP")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                previewDevice === "DESKTOP"
                  ? "bg-primary text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Seletor de Telas: App Home / Splash / Notificação Push */}
        {activeTab !== "landing" && (
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setPreviewMode("HOME")}
              className={`py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                previewMode === "HOME"
                  ? "bg-primary text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>App Home</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewMode("SPLASH")}
              className={`py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                previewMode === "SPLASH"
                  ? "bg-primary text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Rocket className="w-3 h-3" />
              <span>Splash</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewMode("PUSH")}
              className={`py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                previewMode === "PUSH"
                  ? "bg-primary text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Bell className="w-3 h-3" />
              <span>Push Lock</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. CHASSI DO DISPOSITIVO (iPhone 16 Pro Titanium Chassis) */}
      <div className="w-full flex justify-center py-1">
        <div
          style={{
            width:
              previewDevice === "MOBILE" ? "360px" : previewDevice === "TABLET" ? "440px" : "100%",
            fontFamily: typography?.familiaPrincipal || "Plus Jakarta Sans, sans-serif",
          }}
          className="relative rounded-[48px] border-[10px] border-slate-950 bg-slate-950 text-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all duration-300 min-h-[640px] ring-1 ring-white/10"
        >
          {/* A. VISUALIZAÇÃO DE LANDING PAGE */}
          {activeTab === "landing" ? (
            <div className="flex-1 overflow-y-auto max-h-[660px] bg-slate-950 flex flex-col">
              {/* Dynamic Island & Status Bar */}
              <div className="bg-slate-950 text-white px-6 pt-3 pb-2 text-[10px] font-bold flex items-center justify-between shrink-0 select-none">
                <span>09:41</span>
                <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center px-2">
                  <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700 mr-auto" />
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="w-full flex-1">
                <MobilityLandingPage
                  initialData={liveLandingData || undefined}
                  showCustomizer={false}
                />
              </div>
            </div>
          ) : previewMode === "SPLASH" ? (
            /* B. MODO SPLASH SCREEN */
            <div
              style={{
                backgroundColor: appConfig?.splashBackgroundColor || "#0F172A",
              }}
              className="flex-1 flex flex-col items-center justify-between p-6 text-white min-h-[620px] transition-colors duration-300 relative overflow-hidden"
            >
              {/* Wallpaper glow */}
              <div
                className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
                style={{ backgroundColor: corPrimaria }}
              />

              {/* Status bar */}
              <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-300 shrink-0 z-10 pt-1">
                <span>09:41</span>
                <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center px-2">
                  <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700 mr-auto" />
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Logo Central & Nome da Marca */}
              <div className="flex flex-col items-center text-center space-y-4 my-auto z-10 animate-in zoom-in-95 duration-300">
                <div
                  className="w-24 h-24 rounded-3xl p-3.5 ring-2 shadow-2xl flex items-center justify-center backdrop-blur-md"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderColor: `${corPrimaria}60`,
                  }}
                >
                  {branding?.splash_logo_url || branding?.logo_url ? (
                    <img
                      src={branding?.splash_logo_url || branding?.logo_url || ""}
                      alt={nomeApp}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Sparkles className="w-12 h-12" style={{ color: corPrimaria }} />
                  )}
                </div>

                <div>
                  <h3 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                    {nomeApp}
                  </h3>
                  <p className="text-xs text-slate-300 font-semibold max-w-[220px] mt-1.5">
                    {brand?.slogan || "Mobilidade Inteligente Sob Demanda"}
                  </p>
                </div>
              </div>

              {/* Rodapé Splash */}
              <div className="flex flex-col items-center space-y-2 shrink-0 z-10 pb-3">
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: `${corPrimaria}30`,
                    borderTopColor: corPrimaria,
                  }}
                />
                <span className="text-[10px] font-bold text-slate-300">
                  Carregando frota em {cidadeSede}...
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  v{appConfig?.versaoApp || "3.5.0"} • Partição Segura
                </span>
              </div>

              {/* Home indicator bar */}
              <div className="w-28 h-1 bg-white/40 rounded-full mx-auto shrink-0 z-10" />
            </div>
          ) : previewMode === "PUSH" ? (
            /* C. MODO LOCKSCREEN COM NOTIFICAÇÃO PUSH */
            <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white min-h-[620px] relative overflow-hidden">
              {/* Wallpaper radial glow */}
              <div
                className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ backgroundColor: corPrimaria }}
              />

              {/* Status bar */}
              <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-300 shrink-0 z-10 pt-1">
                <span>09:41</span>
                <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center px-2">
                  <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700 mr-auto" />
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Relógio do Lockscreen */}
              <div className="flex flex-col items-center text-center mt-4 z-10">
                <span className="text-5xl font-extralight tracking-tight text-white/95 font-mono">
                  09:41
                </span>
                <span className="text-xs font-semibold text-slate-300 mt-1">
                  Segunda-feira, 12 de Outubro
                </span>
              </div>

              {/* Card de Notificação Push */}
              <div className="my-auto z-10">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl text-left space-y-2.5 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center p-0.5 overflow-hidden shadow-xs font-black text-xs text-slate-950"
                        style={{ backgroundColor: corPrimaria }}
                      >
                        {branding?.logo_url ? (
                          <img
                            src={branding.logo_url}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          nomeApp.slice(0, 1)
                        )}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-white">
                        {nomeApp}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">agora</span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Motorista parceiro a caminho!</span>
                      <span>🚗</span>
                    </h5>
                    <p className="text-[11px] text-slate-300 leading-snug mt-1">
                      Carlos (Toyota Corolla • ABC-1234) está a 2 minutos do seu ponto de embarque.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <span
                      className="text-[10px] font-black px-2.5 py-0.5 rounded-lg text-slate-950 shadow-xs"
                      style={{ backgroundColor: corPrimaria }}
                    >
                      Acompanhar
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Toque para abrir o mapa em tempo real
                    </span>
                  </div>
                </div>
              </div>

              {/* Atalhos inferiores do Lockscreen */}
              <div className="w-full flex items-center justify-between px-2 shrink-0 z-10 pb-1">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="w-28 h-1 bg-white/40 rounded-full" />
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
            </div>
          ) : (
            /* D. MODO APP HOME (Passageiro) */
            <div className="flex-1 flex flex-col bg-slate-950 text-white min-h-[640px] max-h-[640px] overflow-hidden">
              {/* Status bar */}
              <div className="bg-slate-950 px-6 pt-3 pb-1 text-[11px] font-bold text-slate-300 flex items-center justify-between shrink-0 select-none z-20">
                <span>09:41</span>
                {/* Dynamic Island */}
                <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center px-2 border border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700 mr-auto" />
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Header do App com Gradiente da Marca */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${branding?.header_gradient_start || corPrimaria} 0%, ${branding?.header_gradient_end || "#0F172A"} 100%)`,
                }}
                className="p-4 shadow-md text-white shrink-0 z-10 border-b border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md ring-1 ring-white/30 overflow-hidden flex items-center justify-center font-black text-xs">
                      {branding?.logo_url ? (
                        <img
                          src={branding.logo_url}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        nomeApp.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/80 block leading-tight">
                        {nomeApp}
                      </span>
                      <span className="text-xs font-bold block text-white leading-tight">
                        Olá, Passageiro! 👋
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1">
                    <MapPin className="w-3 h-3" style={{ color: corPrimaria }} />
                    <span className="truncate max-w-[90px]">{cidadeSede.split(",")[0]}</span>
                  </span>
                </div>
              </div>

              {/* Conteúdo Rolável do App Home */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-admin-scrollbar">
                {/* SIMULADOR DE MAPA COM RADAR E VEÍCULO */}
                <div className="h-32 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden flex flex-col justify-between p-3 shadow-inner group">
                  {/* Malha Viária Simulada */}
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800/80 -rotate-6" />
                  <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-slate-800/80 rotate-12" />

                  {/* Carro / Radar em Movimento */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: corPrimaria }}
                      >
                        <Car className="w-4 h-4 text-slate-950" />
                      </div>
                      <span
                        className="absolute inset-0 rounded-full animate-ping opacity-60"
                        style={{ backgroundColor: corPrimaria }}
                      />
                    </div>
                  </div>

                  {/* Status do Radar */}
                  <div className="relative z-10 flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-emerald-400 font-bold border border-white/10 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Radar Ativo • {cidadeSede.split(",")[0]}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-slate-300 font-mono">
                      2 min de espera
                    </span>
                  </div>

                  <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 font-semibold bg-black/60 backdrop-blur-xs p-1.5 rounded-xl border border-white/10">
                    <span className="flex items-center gap-1 text-slate-200">
                      <Navigation className="w-3 h-3 text-primary" />5 motoristas disponíveis na sua
                      região
                    </span>
                  </div>
                </div>

                {/* CARD DE BUSCA FLUTUANTE ("Para onde vamos hoje?") */}
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-primary" />
                      Para onde vamos hoje?
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-xl px-3 py-2 text-xs text-slate-400 border border-slate-800 flex items-center justify-between cursor-pointer">
                    <span className="truncate">Digite seu endereço de destino...</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </div>

                  {/* Atalhos Rápidos */}
                  <div className="flex items-center gap-1.5 pt-1 text-[10px]">
                    <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1 font-bold">
                      <Home className="w-3 h-3 text-emerald-400" /> Casa
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1 font-bold">
                      <Briefcase className="w-3 h-3 text-blue-400" /> Trabalho
                    </span>
                  </div>
                </div>

                {/* CATEGORIAS DISPONÍVEIS NA PRAÇA */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
                    Modalidades Disponíveis
                  </span>

                  <div className="grid grid-cols-4 gap-2">
                    {/* 1. Pop */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-primary/40 text-center space-y-1">
                      <div
                        className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center text-slate-950 font-black"
                        style={{ backgroundColor: corPrimaria }}
                      >
                        <Car className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-white block truncate">Pop</span>
                      <span className="text-[9px] font-mono font-bold text-emerald-400 block">
                        R$ 11,90
                      </span>
                    </div>

                    {/* 2. Moto */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 mx-auto flex items-center justify-center text-amber-400 font-black">
                        <Bike className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-white block truncate">Moto</span>
                      <span className="text-[9px] font-mono font-bold text-emerald-400 block">
                        R$ 6,90
                      </span>
                    </div>

                    {/* 3. Flash Entregas */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 mx-auto flex items-center justify-center text-blue-400 font-black">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-white block truncate">Flash</span>
                      <span className="text-[9px] font-mono font-bold text-emerald-400 block">
                        R$ 8,90
                      </span>
                    </div>

                    {/* 4. Mulher */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 mx-auto flex items-center justify-center text-rose-400 font-black">
                        <HeartHandshake className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-white block truncate">
                        Mulher
                      </span>
                      <span className="text-[9px] font-mono font-bold text-emerald-400 block">
                        R$ 12,90
                      </span>
                    </div>
                  </div>
                </div>

                {/* BANNER PROMOCIONAL DA PRAÇA */}
                <div
                  style={{
                    background: `linear-gradient(135deg, ${corPrimaria}25 0%, ${corSecundaria}25 100%)`,
                    borderColor: `${corPrimaria}40`,
                  }}
                  className="p-3 rounded-2xl border text-white shadow-xs space-y-0.5"
                >
                  <span className="text-[9px] font-black uppercase tracking-wider text-primary block">
                    Taxa 0% para Motoristas
                  </span>
                  <span className="text-xs font-bold text-white block">
                    Assinatura diária, semanal ou mensal via PIX
                  </span>
                </div>
              </div>

              {/* BARRA DE NAVEGAÇÃO INFERIOR DO APP COM HOME BAR */}
              <div className="shrink-0 bg-slate-950 border-t border-slate-800/80 px-4 pt-2.5 pb-2">
                <div className="flex items-center justify-around text-xs">
                  <div
                    className="flex flex-col items-center gap-0.5 font-bold"
                    style={{ color: corPrimaria }}
                  >
                    <Car className="w-4 h-4 stroke-[2.5]" />
                    <span className="text-[9px]">Viagens</span>
                  </div>

                  <div className="flex flex-col items-center gap-0.5 text-slate-500 font-medium">
                    <Package className="w-4 h-4" />
                    <span className="text-[9px]">Entregas</span>
                  </div>

                  <div className="flex flex-col items-center gap-0.5 text-slate-500 font-medium">
                    <History className="w-4 h-4" />
                    <span className="text-[9px]">Histórico</span>
                  </div>

                  <div className="flex flex-col items-center gap-0.5 text-slate-500 font-medium">
                    <User className="w-4 h-4" />
                    <span className="text-[9px]">Perfil</span>
                  </div>
                </div>

                {/* Indicador de gesto Home do iPhone */}
                <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-2" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
