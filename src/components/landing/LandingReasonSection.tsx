import React, { useMemo } from "react";
import { ArrowRight, Check, Car, Briefcase, Package } from "lucide-react";
import type { ReasonSectionConfig, ThemeConfig } from "@/types/mobilityLanding";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";

interface LandingReasonSectionProps {
  reasonSection: ReasonSectionConfig;
  theme: ThemeConfig;
  onNavigate?: (url: string) => void;
}

export const LandingReasonSection: React.FC<LandingReasonSectionProps> = ({
  reasonSection,
  theme,
  onNavigate,
}) => {
  const primaryColor = theme?.primary || "#FF6B00";
  const secondaryColor = theme?.secondary || "#FFB800";

  const activeUser = useMemo(() => {
    return typeof window !== "undefined"
      ? (supabaseAuthService?.getCurrentUser?.() || supabaseAuthService?.getStoredSession?.() || null)
      : null;
  }, []);

  const handleCtaClick = () => {
    let target = reasonSection?.ctaUrl || "/app";
    if (target === "/app") {
      if (activeUser) {
        target = activeUser.role === "MOTORISTA" ? "/app/motorista" : activeUser.role === "ADMIN" ? "/app/admin" : "/app";
      } else {
        target = "/cadastro-passageiro";
      }
    }
    if (onNavigate) {
      onNavigate(target);
    } else {
      window.location.href = target;
    }
  };

  const defaultCards = [
    {
      icon: <Car className="w-6 h-6" style={{ color: primaryColor }} />,
      title: "Corridas particulares",
      desc: "Chame carros confortáveis e motos ágeis em poucos segundos com preço justo e sem surpresas no final.",
    },
    {
      icon: <Briefcase className="w-6 h-6 text-purple-400" />,
      title: "Viagens corporativas",
      desc: "Mobilidade confiável para você e sua equipe chegarem sempre no horário com condutores qualificados.",
    },
    {
      icon: <Package className="w-6 h-6 text-emerald-400" />,
      title: "Entregas expressas",
      desc: "Envie e receba encomendas, documentos e objetos com rastreamento ponto a ponto pelo mapa.",
    },
  ];

  return (
    <section
      className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 transition-colors z-20"
      style={{
        backgroundColor: theme?.bgLight || "#F8FAFC",
        color: theme?.textColorDark || "#0F172A",
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col space-y-8 sm:space-y-12">
        {/* Cabeçalho da Seção de Categorias */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-700">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <span>{reasonSection?.titlePrefix || "Por que escolher a"}</span>
          </div>

          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight"
            style={{ color: theme.textColorDark || "#0F172A" }}
          >
            {reasonSection.brandName}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {reasonSection.description}
          </p>
        </div>

        {/* 3 Cards de Modais de Atendimento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {defaultCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-2xs">
                  {card.icon}
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {card.desc}
                </p>
              </div>

              <div
                className="pt-6 flex items-center gap-1.5 text-xs font-bold group-hover:translate-x-1 transition-transform"
                style={{ color: primaryColor }}
              >
                <span>Disponível no app</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
            </div>
          ))}
        </div>

        {/* Checklist de Diferenciais & Botão de Início */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-left w-full md:w-auto">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Vantagens exclusivas
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {(reasonSection?.checklist || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs"
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCtaClick}
            className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 shrink-0 w-full md:w-auto cursor-pointer shadow-md hover:shadow-lg min-h-[40px]"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              boxShadow: `0 4px 14px ${primaryColor}35`,
            }}
          >
            <span>{reasonSection?.ctaText || (activeUser ? "Pedir corrida agora" : "Começar agora")}</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
