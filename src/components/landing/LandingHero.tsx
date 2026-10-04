import React, { useState } from "react";
import { ArrowRight, MapPin, User, Car, Star, ShieldCheck, Clock, Zap, CheckCircle2, Bike, Package } from "lucide-react";
import type { HeroConfig, ActionItem, ThemeConfig, MapCardConfig } from "@/types/mobilityLanding";

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
  const [activeCategory, setActiveCategory] = useState<"economico" | "comfort" | "moto" | "entrega">("economico");
  const headlineLines = hero.headline.split("\n");
  const firstLine = headlineLines[0] || hero.headline;
  const secondLine = headlineLines.slice(1).join(" ");

  const handleActionClick = (targetUrl: string) => {
    let resolvedUrl = targetUrl;
    if (targetUrl === "/passageiro") resolvedUrl = "/cadastro-passageiro";
    if (targetUrl === "/motorista") resolvedUrl = "/cadastro-motorista";
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
            background: `radial-gradient(circle, ${theme.primary} 0%, transparent 70%)`,
          }}
        />

        {/* Halo Volumétrico 2 (Acento Secundário Lateral) */}
        <div
          className="absolute top-1/3 -right-32 w-[400px] h-[400px] sm:w-[650px] sm:h-[650px] rounded-full blur-[160px] opacity-[0.05] transition-colors duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${theme.secondary || theme.primary} 0%, transparent 65%)`,
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
      {/* 2. GRID PRINCIPAL DO HERO (COLUNA ESQUERDA: COPY + AÇÕES / DIREITA: APP)  */}
      {/* ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14 pt-2">
        {/* COLUNA ESQUERDA: PROPOSTA DE VALOR, CONVERSÃO E PROVA SOCIAL */}
        <div className="w-full lg:w-[54%] flex flex-col items-start space-y-5 text-left z-10">
          {/* Badge de Status e Geolocalização */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white backdrop-blur-md border border-slate-200/90 text-[11px] font-bold tracking-wider uppercase text-slate-700 shadow-xs transition-all duration-300">
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: theme.primary }}
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
                    backgroundImage: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary || "#FFAE00"} 100%)`,
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

          {/* Cartões de Ação Principais: Quero ser passageiro / Quero ser motorista */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 pt-1">
            {actions.map((action, idx) => {
              const isPassenger = action.style === "primaryGradient" || action.type === "passenger";

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleActionClick(action.targetUrl)}
                  className="group relative flex items-center justify-between px-3 py-2 sm:px-3.5 sm:py-2 transition-all duration-200 active:scale-[0.98] cursor-pointer overflow-hidden min-h-[38px] sm:min-h-[40px]"
                  style={{
                    borderRadius: "12px",
                    ...(isPassenger
                      ? {
                          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary || theme.primary} 100%)`,
                          boxShadow: `0 2px 8px ${theme.primary}25`,
                        }
                      : {
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                        }),
                  }}
                >
                  {/* Efeito Shimmer de Luz no Hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105"
                      style={{
                        background: isPassenger
                          ? "rgba(255, 255, 255, 0.22)"
                          : `${theme.primary}15`,
                        border: isPassenger
                          ? "1px solid rgba(255, 255, 255, 0.35)"
                          : `1px solid ${theme.primary}30`,
                      }}
                    >
                      {isPassenger ? (
                        <User className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                      ) : (
                        <Car
                          className="w-3.5 h-3.5 stroke-[2.2]"
                          style={{ color: theme.primary }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span
                        className={`text-[9.5px] font-medium leading-none ${
                          isPassenger ? "text-white/85" : "text-slate-500"
                        }`}
                      >
                        {action.type === "passenger" ? "Para pedir agora" : "Trabalhe conosco"}
                      </span>
                      <span
                        className={`text-xs sm:text-[13px] font-semibold leading-tight mt-0.5 ${
                          isPassenger ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {action.text.replace("\n", " ")}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isPassenger
                        ? "bg-white/20 group-hover:bg-white/30 text-white"
                        : "bg-slate-100 group-hover:bg-slate-900 text-slate-700 group-hover:text-white"
                    }`}
                  >
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Grid de Prova Social e Métricas de Confiança */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-3 w-full max-w-lg border-t border-slate-200/90 text-left">
            <div>
              <div className="flex items-center gap-1.5 text-amber-500 text-sm sm:text-base font-black">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>4.9</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">
                Avaliação dos condutores
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm sm:text-base font-black">
                <Clock className="w-4 h-4" />
                <span>&lt; 4 min</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">
                Tempo médio de chegada
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sky-600 text-sm sm:text-base font-black">
                <ShieldCheck className="w-4 h-4" />
                <span>100%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">
                Viagens com botão SOS
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
              background: `radial-gradient(circle, ${theme.primary} 0%, ${theme.secondary || theme.primary}30 50%, transparent 75%)`,
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
                  stroke={theme.primary}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="animate-route-flow"
                  style={{
                    filter: `drop-shadow(0 2px 8px ${theme.primary}40)`,
                  }}
                />

                {/* Marcadores Centrais dos Pontos da Rota */}
                <circle cx="60" cy="180" r="5" fill={theme.primary} />
                <circle cx="235" cy="85" r="5" fill={theme.secondary || "#FFAE00"} />
              </svg>

              {/* Pin de Origem (com radar em ondas concêntricas) */}
              <div className="absolute left-[60px] top-[180px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-60 pointer-events-none"
                  style={{ backgroundColor: theme.primary }}
                />
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md relative z-10"
                  style={{ backgroundColor: theme.primary }}
                />
              </div>

              {/* Pin de Destino (com halo na cor secundária) */}
              <div className="absolute left-[235px] top-[85px] -translate-x-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-60 pointer-events-none"
                  style={{
                    backgroundColor: theme.secondary || "#FFAE00",
                    animationDelay: "0.8s",
                  }}
                />
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md relative z-10"
                  style={{ backgroundColor: theme.secondary || "#FFAE00" }}
                />
              </div>

              {/* Tag Flutuante de Status de Chegada (ETA) */}
              <div className="absolute top-3 left-3 z-20">
                <div
                  className="px-3 py-1.5 rounded-xl text-white text-[11px] font-bold leading-tight shadow-md flex items-center gap-2 backdrop-blur-md"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary || theme.primary} 100%)`,
                    boxShadow: `0 3px 12px ${theme.primary}40`,
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

              {/* Marcador do Veículo em Deslocamento Suave com Badge de Satélite */}
              <div
                className="absolute left-[142px] top-[150px] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none select-none"
                title="Veículo em deslocamento"
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute -inset-2.5 rounded-full animate-pulse opacity-40 pointer-events-none"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div
                    className="relative flex items-center justify-center w-9 h-9 rounded-full shadow-lg border-2 border-white transition-transform duration-300"
                    style={{
                      backgroundColor: theme.primary,
                      boxShadow: `0 4px 14px ${theme.primary}50`,
                    }}
                  >
                    <Car className="w-4.5 h-4.5 text-white -rotate-45" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
                </div>
              </div>
            </div>

            {/* SELETOR INTERATIVO DE CATEGORIAS ESTILO UBER (CABER DESIGN) */}
            <div className="grid grid-cols-4 gap-1.5 mt-3">
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
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs scale-102"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <IconComponent
                      className="w-3.5 h-3.5 mb-0.5"
                      style={isSelected ? { color: theme.primary } : undefined}
                    />
                    <span className="text-[9.5px] font-semibold tracking-tight leading-none">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* CARD INFERIOR DO SMARTPHONE: DETALHES DINÂMICOS DA CATEGORIA SELECIONADA */}
            <div className="mt-2.5 w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200/90 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border bg-white shadow-2xs transition-colors"
                  style={{
                    borderColor: `${theme.primary}30`,
                  }}
                >
                  {activeCategory === "moto" ? (
                    <Bike className="w-4.5 h-4.5" style={{ color: theme.primary }} />
                  ) : activeCategory === "entrega" ? (
                    <Package className="w-4.5 h-4.5" style={{ color: theme.primary }} />
                  ) : (
                    <Car className="w-4.5 h-4.5" style={{ color: theme.primary }} />
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9.5px] text-slate-500 font-medium leading-none">
                    {activeCategory === "economico"
                      ? "Chevrolet Onix ou similar"
                      : activeCategory === "comfort"
                      ? "Sedan espaçoso com ar-condicionado"
                      : activeCategory === "moto"
                      ? "Honda Fan 160 • Agilidade urbana"
                      : "Entrega expressa ponto a ponto"}
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight mt-0.5">
                    {activeCategory === "economico"
                      ? "Partiu Econômico"
                      : activeCategory === "comfort"
                      ? "Partiu Comfort"
                      : activeCategory === "moto"
                      ? "Partiu Moto Express"
                      : "Partiu Encomendas Flash"}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-emerald-600">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>
                      {activeCategory === "economico"
                        ? "R$ 14,90 • Tarifa fixada"
                        : activeCategory === "comfort"
                        ? "R$ 19,90 • Tarifa fixada"
                        : activeCategory === "moto"
                        ? "R$ 8,90 • Mais econômico"
                        : "R$ 10,50 • Entrega expressa"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avaliação & CTA de Pedido */}
              <button
                type="button"
                onClick={() => handleActionClick("/cadastro-passageiro")}
                className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200/80 cursor-pointer transition-colors shadow-2xs"
              >
                <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                <span className="text-[11px] font-bold text-amber-700">
                  {activeCategory === "comfort" ? "5.0" : "4.9"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
