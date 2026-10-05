import React, { useState, useEffect } from "react";
import { ArrowRight, MapPin, User, Car, Star, ShieldCheck, Clock, Zap, CheckCircle2, Bike, Package } from "lucide-react";
import type { HeroConfig, ActionItem, ThemeConfig, MapCardConfig } from "@/types/mobilityLanding";
import { VehiclePerspectiveGraphic } from "@/components/passenger/VehiclePerspectiveGraphic";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";

interface LandingHeroProps {
  hero: HeroConfig;
  actions: ActionItem[];
  theme: ThemeConfig;
  mapCard?: MapCardConfig;
  onNavigate?: (url: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  hero,
  actions,
  theme,
  mapCard,
  onNavigate,
}) => {
  const primaryColor = theme?.primary || "#FF6B00";
  const secondaryColor = theme?.secondary || "#FFB800";
  const [activeCategory, setActiveCategory] = useState<"economico" | "comfort" | "moto" | "entrega">("economico");
  const [vehicleMode, setVehicleMode] = useState<"car" | "moto">("car");

  // Sessão ativa do usuário para redirecionamento inteligente
  const [currentUser] = useState<any>(() => {
    return typeof window !== "undefined"
      ? (supabaseAuthService?.getCurrentUser?.() || supabaseAuthService?.getStoredSession?.() || null)
      : null;
  });

  // Alternância automática fluida entre Carro e Moto para evidenciar ambas opções do app
  useEffect(() => {
    const timer = setInterval(() => {
      setVehicleMode((prev) => (prev === "car" ? "moto" : "car"));
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  // Sincroniza a categoria exibida no simulador quando o modo do veículo muda
  useEffect(() => {
    if (vehicleMode === "moto") {
      setActiveCategory("moto");
    } else {
      setActiveCategory("economico");
    }
  }, [vehicleMode]);

  const headlineLines = hero.headline.split("\n");
  const firstLine = headlineLines[0] || hero.headline;
  const secondLine = headlineLines.slice(1).join(" ");

  const handleActionClick = (targetUrl: string) => {
    let resolvedUrl = targetUrl;
    if (targetUrl === "/passageiro") resolvedUrl = "/cadastro-passageiro";
    if (targetUrl === "/motorista") resolvedUrl = "/cadastro-motorista";

    if (targetUrl === "/app") {
      if (currentUser) {
        resolvedUrl = currentUser.role === "MOTORISTA" ? "/app/motorista" : currentUser.role === "ADMIN" ? "/app/admin" : "/app";
      } else {
        // Usuário não autenticado: barreira profissional obrigatória de cadastro
        resolvedUrl = "/cadastro-passageiro";
      }
    }

    if (onNavigate) {
      onNavigate(resolvedUrl);
    } else {
      window.location.href = resolvedUrl;
    }
  };

  const activeEta = mapCard?.eta || "Chegando em\n2 min";
  const activeCarModel = mapCard?.carModel || "Sua viagem\nChevrolet Onix";
  const activeRating = mapCard?.rating || 4.9;

  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:pb-16 z-20 overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. BACKDROP LUMINOSO COM SUAVE ILUMINAÇÃO WHITE LABEL                     */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 select-none">
        {/* Imagem de Alta Resolução Urbana com Máscara Clara Suave */}
        <img
          src={
            hero.cityBackgroundImageUrl ||
            "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2400&q=80"
          }
          alt="Cidade urbana iluminada"
          className="w-full h-full object-cover object-center opacity-[0.06] transform scale-105 transition-all duration-1000"
          style={{
            filter: "grayscale(0.4) contrast(1.1)",
          }}
        />

        {/* Halo Volumétrico 1 (Acento Primário Difuso Suave) */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] sm:w-[800px] sm:h-[800px] rounded-full blur-[140px] opacity-[0.07] transition-colors duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
          }}
        />

        {/* Halo Volumétrico 2 (Acento Secundário Lateral) */}
        <div
          className="absolute top-1/3 -right-32 w-[400px] h-[400px] sm:w-[650px] sm:h-[650px] rounded-full blur-[160px] opacity-[0.05] transition-colors duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${secondaryColor || primaryColor} 0%, transparent 65%)`,
          }}
        />

        {/* Grade Cartográfica Tecnológica Sutil e Clara */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2A. HERO NATIVO MOBILE-FIRST (DRIVELUX SCREEN 1 ONBOARDING)               */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center lg:hidden space-y-4 pt-1 pb-4">
        {/* Badge de Status e Geolocalização */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs text-[11px] font-bold text-slate-700">
          <span
            className="w-2 h-2 rounded-full animate-ping"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="tracking-wide text-slate-700">
            {hero.locationChipText || "Mobilidade urbana"}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-600 font-extrabold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ao vivo
          </span>
        </div>

        {/* Headline e Copy Clean */}
        <div className="space-y-1.5 px-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {firstLine}{" "}
            {secondLine && (
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || "#FFAE00"} 100%)`,
                }}
              >
                {secondLine}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
            {hero.description || "Viagens rápidas e seguras no seu dia a dia com os melhores motoristas da cidade."}
          </p>
        </div>

        {/* Visual do Veículo em Destaque com Transição Suave (Carro <-> Moto) */}
        <div className="relative w-full py-1.5 flex flex-col items-center justify-center">
          <div
            className="absolute inset-0 max-w-[260px] mx-auto rounded-full blur-2xl opacity-25 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${primaryColor} 0%, ${secondaryColor || primaryColor} 50%, transparent 70%)`,
            }}
          />

          {/* Container com Crossfade Fluido para Carro e Moto */}
          <div className="relative w-full max-w-[280px] h-32 sm:h-36 flex items-center justify-center">
            <img
              src="/assets/car-transparent.png"
              alt="Carro Partiu"
              className={`absolute max-h-30 sm:max-h-34 w-auto object-contain drop-shadow-xl transition-all duration-700 ease-in-out ${
                vehicleMode === "car"
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-90 translate-y-3 pointer-events-none"
              }`}
            />
            <img
              src="/assets/moto-transparent.png"
              alt="Moto Partiu"
              className={`absolute max-h-30 sm:max-h-34 w-auto object-contain drop-shadow-xl transition-all duration-700 ease-in-out ${
                vehicleMode === "moto"
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-90 translate-y-3 pointer-events-none"
              }`}
            />
          </div>

          {/* Seletor Pill Rápido (Carro & Moto) */}
          <div className="inline-flex items-center p-0.5 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs mt-1 relative z-10 gap-0.5">
            <button
              type="button"
              onClick={() => setVehicleMode("car")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-300 cursor-pointer ${
                vehicleMode === "car"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Car className="w-3 h-3" />
              <span>Carro</span>
            </button>
            <button
              type="button"
              onClick={() => setVehicleMode("moto")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-300 cursor-pointer ${
                vehicleMode === "moto"
                  ? "text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              style={
                vehicleMode === "moto"
                  ? {
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%)`,
                    }
                  : undefined
              }
            >
              <Bike className="w-3 h-3" />
              <span>Moto</span>
            </button>
          </div>
        </div>

        {/* Três Selos/Pills de Confiança (Screen 1 DriveLux) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 w-full pt-0.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs text-[10.5px] font-semibold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Seguro e confiável</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs text-[10.5px] font-semibold text-slate-700">
            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Motoristas verificados</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs text-[10.5px] font-semibold text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Pagamento pelo app</span>
          </div>
        </div>

        {/* CTAs de Conversão Mobile (Screen 1) */}
        <div className="w-full space-y-2.5 pt-2 px-1">
          <button
            type="button"
            onClick={() => handleActionClick("/app")}
            className="w-full h-12 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%)`,
              boxShadow: `0 6px 20px ${primaryColor}35`,
            }}
          >
            <span>
              {currentUser
                ? currentUser.role === "MOTORISTA"
                  ? "Acessar cockpit do motorista"
                  : "Pedir corrida agora"
                : "Começar agora"}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[2.2]" />
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => handleActionClick("/auth")}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer py-1"
            >
              Já tem uma conta?{" "}
              <span className="font-extrabold underline" style={{ color: primaryColor }}>
                Entrar
              </span>
            </button>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleActionClick("/cadastro-motorista")}
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-between transition active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-600" />
                <span>Quer faturar? Seja motorista parceiro</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2B. GRID DESKTOP DO HERO (COLUNA ESQUERDA: COPY + AÇÕES / DIREITA: APP)   */}
      {/* ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto hidden lg:flex flex-row items-center justify-between gap-8 lg:gap-14 pt-2">
        {/* COLUNA ESQUERDA: PROPOSTA DE VALOR, CONVERSÃO E PROVA SOCIAL */}
        <div className="w-full lg:w-[54%] flex flex-col items-start space-y-5 text-left z-10">
          {/* Badge de Status e Geolocalização */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white backdrop-blur-md border border-slate-200/90 text-[11px] font-bold tracking-wider uppercase text-slate-700 shadow-xs transition-all duration-300">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="tracking-wide text-slate-700">
              {hero.locationChipText || "Mobilidade urbana inteligente"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Operação ativa
            </span>
          </div>

          {/* Headline Imponente com Paleta Dinâmica */}
          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12] text-slate-900">
              <span className="block">{firstLine}</span>
              {secondLine && (
                <span
                  className="block mt-1 transition-all duration-300 bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || "#FFAE00"} 100%)`,
                  }}
                >
                  {secondLine}
                </span>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-xl">
              {hero.description}
            </p>
          </div>

          {/* Badge de Categorias Oficiais: Carro & Moto com Transição Sincronizada */}
          <div className="inline-flex items-center gap-2 p-1 rounded-2xl bg-white/95 border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 pl-2.5 pr-1">Categorias:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVehicleMode("car")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                  vehicleMode === "car"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Carro</span>
              </button>
              <button
                type="button"
                onClick={() => setVehicleMode("moto")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                  vehicleMode === "moto"
                    ? "text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                style={
                  vehicleMode === "moto"
                    ? {
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%)`,
                      }
                    : undefined
                }
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Moto</span>
              </button>
            </div>
          </div>

          {/* Cartões de Ação Principais: Pedir corrida / Dirigir com o Partiu */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {actions.map((action, idx) => {
              const isPassenger = action.style === "primaryGradient" || action.type === "passenger";
              const label = isPassenger ? "Pedir corrida" : "Dirigir com o Partiu";
              const subtitle = isPassenger ? "Carro ou moto em minutos" : "100% repasse no Pix D+0";

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleActionClick(action.targetUrl)}
                  className="group relative flex items-center justify-between px-4 py-3 transition-all duration-300 active:scale-[0.98] cursor-pointer overflow-hidden min-h-[52px] rounded-2xl shadow-xs hover:shadow-md"
                  style={{
                    ...(isPassenger
                      ? {
                          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%)`,
                          boxShadow: `0 6px 20px ${primaryColor}35`,
                        }
                      : {
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
                        }),
                  }}
                >
                  {/* Efeito Shimmer de Luz no Hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105"
                      style={{
                        background: isPassenger
                          ? "rgba(255, 255, 255, 0.22)"
                          : `${primaryColor}15`,
                        border: isPassenger
                          ? "1px solid rgba(255, 255, 255, 0.35)"
                          : `1px solid ${primaryColor}30`,
                      }}
                    >
                      {isPassenger ? (
                        <User className="w-4.5 h-4.5 text-white stroke-[2.2]" />
                      ) : (
                        <Car
                          className="w-4.5 h-4.5 stroke-[2.2]"
                          style={{ color: primaryColor }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span
                        className={`text-xs sm:text-sm font-bold leading-tight ${
                          isPassenger ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {label}
                      </span>
                      <span
                        className={`text-[10.5px] font-medium leading-none mt-1 ${
                          isPassenger ? "text-white/85" : "text-slate-500"
                        }`}
                      >
                        {subtitle}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5 ${
                      isPassenger
                        ? "bg-white/20 group-hover:bg-white/30 text-white"
                        : "bg-slate-100 group-hover:bg-slate-900 text-slate-700 group-hover:text-white"
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Grid de Prova Social e Métricas de Confiança em Bento Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-2 w-full max-w-xl text-left">
            <div className="p-3 rounded-2xl bg-white/95 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-1.5 text-amber-500 text-sm sm:text-base font-extrabold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>4.9</span>
              </div>
              <p className="text-[10.5px] text-slate-600 mt-1 font-medium leading-tight">
                Nota média dos motoristas
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/95 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm sm:text-base font-extrabold">
                <Clock className="w-4 h-4 stroke-[2.2]" />
                <span>&lt; 3 min</span>
              </div>
              <p className="text-[10.5px] text-slate-600 mt-1 font-medium leading-tight">
                Tempo médio de embarque
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/95 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-1.5 text-sky-600 text-sm sm:text-base font-extrabold">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                <span>100%</span>
              </div>
              <p className="text-[10.5px] text-slate-600 mt-1 font-medium leading-tight">
                Viagens monitoradas e SOS
              </p>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: O MOCKUP DO APLICATIVO COM MAPA CLARO ULTRA-CLEAN */}
        <div className="w-full lg:w-[46%] flex items-center justify-center relative mt-4 lg:mt-0">
          {/* Brilho Ambiente Dinâmico Atrás do Simulador */}
          <div
            className="absolute -inset-4 sm:-inset-8 rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${primaryColor} 0%, ${secondaryColor || primaryColor}30 50%, transparent 75%)`,
            }}
          />

          {/* Moldura Sofisticada do Smartphone com Vidro Claro */}
          <div className="relative w-full max-w-[430px] bg-white rounded-[32px] p-3.5 sm:p-4 shadow-[0_20px_60px_rgba(0,0,0,0.07)] border border-slate-200/90 hover:border-slate-300 transition-all duration-500 overflow-hidden group/showcase">
            {/* Barra de Status do Smartphone */}
            <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-100 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] uppercase tracking-wider text-slate-700 font-bold">
                  Telemetria ao vivo
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-700 border border-slate-200/60">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>GPS 60 FPS</span>
              </div>
            </div>

            {/* MAPA CLARO VETORIAL (CLEAN LIGHT MAP) */}
            <div className="relative w-full h-[230px] sm:h-[260px] rounded-2xl overflow-hidden mt-3 bg-[#F8FAFC] shadow-inner border border-slate-200/90">
              <svg
                className="w-full h-full"
                viewBox="0 0 320 260"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
              >
                {/* Parques e Áreas Urbanas Verdes em Tom Suave */}
                <rect x="220" y="150" width="90" height="90" rx="14" fill="#ECFDF5" stroke="#D1FAE5" strokeWidth="1" />
                <rect x="15" y="15" width="80" height="60" rx="12" fill="#ECFDF5" stroke="#D1FAE5" strokeWidth="1" />
                <rect x="180" y="20" width="60" height="40" rx="10" fill="#F0FDF4" stroke="#DCFCE7" strokeWidth="1" />

                {/* Malha Viária da Cidade (Bordas de Asfalto Claro) */}
                <path d="M-10 60 H330" stroke="#E2E8F0" strokeWidth="16" />
                <path d="M-10 130 H330" stroke="#E2E8F0" strokeWidth="14" />
                <path d="M-10 200 H330" stroke="#E2E8F0" strokeWidth="16" />
                <path d="M70 -10 V270" stroke="#E2E8F0" strokeWidth="14" />
                <path d="M190 -10 V270" stroke="#E2E8F0" strokeWidth="16" />
                <path d="M280 -10 V270" stroke="#E2E8F0" strokeWidth="12" />
                <path d="M10 250 L310 30" stroke="#E2E8F0" strokeWidth="12" />

                {/* Ruas Internas em Branco */}
                <path d="M-10 60 H330" stroke="#FFFFFF" strokeWidth="12" />
                <path d="M-10 130 H330" stroke="#FFFFFF" strokeWidth="10" />
                <path d="M-10 200 H330" stroke="#FFFFFF" strokeWidth="12" />
                <path d="M70 -10 V270" stroke="#FFFFFF" strokeWidth="10" />
                <path d="M190 -10 V270" stroke="#FFFFFF" strokeWidth="12" />
                <path d="M280 -10 V270" stroke="#FFFFFF" strokeWidth="8" />
                <path d="M10 250 L310 30" stroke="#FFFFFF" strokeWidth="8" />

                {/* Linhas de Centro das Vias */}
                <path d="M-10 60 H330" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="5 5" />
                <path d="M-10 200 H330" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="5 5" />

                {/* Traçado Dinâmico da Rota com a Cor Primária do White Label */}
                <path
                  d="M 60 180 Q 120 140 150 155 T 235 85"
                  stroke={primaryColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="animate-route-flow"
                  style={{
                    filter: `drop-shadow(0 2px 8px ${primaryColor}40)`,
                  }}
                />

                {/* Marcadores Centrais dos Pontos da Rota */}
                <circle cx="60" cy="180" r="5" fill={primaryColor} />
                <circle cx="235" cy="85" r="5" fill={secondaryColor || "#FFAE00"} />
              </svg>

              {/* Pin de Origem (com radar em ondas concêntricas) */}
              <div className="absolute left-[60px] top-[180px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-60 pointer-events-none"
                  style={{ backgroundColor: primaryColor }}
                />
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md relative z-10"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>

              {/* Pin de Destino (com halo na cor secundária) */}
              <div className="absolute left-[235px] top-[85px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-60 pointer-events-none"
                  style={{
                    backgroundColor: secondaryColor || "#FFAE00",
                    animationDelay: "0.8s",
                  }}
                />
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md relative z-10"
                  style={{ backgroundColor: secondaryColor || "#FFAE00" }}
                />
              </div>

              {/* Tag Flutuante de Status de Chegada (ETA) */}
              <div className="absolute top-3 left-3 z-20">
                <div
                  className="px-3 py-1.5 rounded-xl text-white text-[11px] font-bold leading-tight shadow-md flex items-center gap-2 backdrop-blur-md"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%)`,
                    boxShadow: `0 3px 12px ${primaryColor}40`,
                  }}
                >
                  <Clock className="w-3.5 h-3.5 text-white shrink-0" />
                  <div className="flex flex-col">
                    {activeEta.split("\n").map((line, i) => (
                      <span
                        key={i}
                        className={i === 0 ? "font-normal opacity-90 text-[9px]" : "font-black tracking-wide"}
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Marcador do Veículo em Deslocamento Suave com Transição Carro / Moto */}
              <div
                className="absolute left-[142px] top-[150px] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none select-none"
                title="Veículo em deslocamento"
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute -inset-2.5 rounded-full animate-pulse opacity-40 pointer-events-none"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg border-2 border-white transition-all duration-300"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 4px 14px ${primaryColor}50`,
                    }}
                  >
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      <Car
                        className={`w-4.5 h-4.5 text-white -rotate-45 absolute transition-all duration-500 ease-in-out ${
                          vehicleMode === "car"
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-50 rotate-0 pointer-events-none"
                        }`}
                      />
                      <Bike
                        className={`w-4.5 h-4.5 text-white absolute transition-all duration-500 ease-in-out ${
                          vehicleMode === "moto"
                            ? "opacity-100 scale-100 rotate-0"
                            : "opacity-0 scale-50 -rotate-45 pointer-events-none"
                        }`}
                      />
                    </div>
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
                </div>
              </div>
            </div>

            {/* SELETOR INTERATIVO DE CATEGORIAS ESTILO DRIVELUX (SCREEN 2) */}
            <div className="grid grid-cols-4 gap-2 mt-3.5 px-0.5">
              {(
                [
                  { id: "economico", label: "Econômico", icon: Car },
                  { id: "comfort", label: "Comfort", icon: Car },
                  { id: "moto", label: "Moto", icon: Bike },
                  { id: "entrega", label: "Flash", icon: Package },
                ] as const
              ).map((cat) => {
                const isSelected = activeCategory === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className="flex flex-col items-center justify-center group cursor-pointer transition-all active:scale-95"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xs ${
                        isSelected
                          ? "scale-105 shadow-md"
                          : "bg-slate-100 group-hover:bg-slate-200/80 text-slate-600"
                      }`}
                      style={
                        isSelected
                          ? {
                              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%)`,
                              boxShadow: `0 4px 12px ${primaryColor}35`,
                              color: "#FFFFFF",
                            }
                          : undefined
                      }
                    >
                      <IconComponent
                        className={`w-5 h-5 transition-transform duration-300 ${
                          isSelected ? "text-white stroke-[2.4]" : "text-slate-600 group-hover:text-slate-900"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 transition-colors leading-none tracking-tight ${
                        isSelected ? "font-bold text-slate-900" : "font-medium text-slate-500 group-hover:text-slate-700"
                      }`}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CARD INFERIOR DO SMARTPHONE: VEÍCULO DRIVELUX EM DESTAQUE COM ESPECIFICAÇÕES */}
            <div className="mt-3 w-full bg-white rounded-2xl p-3 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                    {activeCategory === "moto"
                      ? "1 Passageiro • Capacete Higienizado"
                      : activeCategory === "entrega"
                      ? "Até 15kg • Baú Lacrado"
                      : "4 Lugares • Ar-Condicionado"}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Fixada</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                  <span className="text-[10.5px] font-black text-amber-800">
                    {activeCategory === "comfort" ? "5.0" : "4.9"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <div className="flex flex-col text-left">
                  <span className="text-xs sm:text-[13px] font-extrabold text-slate-900 leading-tight">
                    {activeCategory === "economico"
                      ? "Partiu Econômico"
                      : activeCategory === "comfort"
                      ? "Partiu Comfort"
                      : activeCategory === "moto"
                      ? "Partiu Moto Express"
                      : "Partiu Encomendas Flash"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                    {activeCategory === "economico"
                      ? "Chevrolet Onix ou similar"
                      : activeCategory === "comfort"
                      ? "Sedan espaçoso com ar"
                      : activeCategory === "moto"
                      ? "Honda CG 160 • Agilidade urbana"
                      : "Entrega expressa ponto a ponto"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-black text-slate-900 leading-none" style={{ color: primaryColor }}>
                      {activeCategory === "economico"
                        ? "R$ 14,90"
                        : activeCategory === "comfort"
                        ? "R$ 19,90"
                        : activeCategory === "moto"
                        ? "R$ 8,90"
                        : "R$ 10,50"}
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">estimado</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleActionClick("/cadastro-passageiro")}
                    className="h-8 px-3 rounded-full text-white font-bold text-xs flex items-center gap-1 transition-all duration-200 active:scale-95 shadow-xs hover:shadow-sm cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor || primaryColor} 100%)`,
                      boxShadow: `0 2px 8px ${primaryColor}30`,
                    }}
                  >
                    <span>Pedir</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
