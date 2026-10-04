import React from "react";
import type { HeaderConfig, ThemeConfig } from "@/types/mobilityLanding";
import { ArrowRight } from "lucide-react";

interface LandingHeaderProps {
  header: HeaderConfig;
  theme: ThemeConfig;
  onNavigate?: (url: string) => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  header,
  theme,
  onNavigate,
}) => {
  // Separa o nome da marca para destacar a segunda palavra com a cor primária, como em "SUA MARCA"
  const nameParts = header.brandName.split(" ");
  const firstWord = nameParts[0] || header.brandName;
  const secondWord = nameParts.slice(1).join(" ");

  return (
    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1 select-none z-30">
      <div className="w-full flex items-center justify-between px-3 sm:px-4 py-1.5 rounded-xl bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300">
        {/* Lado Esquerdo: Ícone da Marca com Gradiente + Nome e Subtítulo */}
        <div className="flex items-center gap-2 group/brand cursor-default">
          {/* Badge da logo com brilho e gradiente moderno */}
          <div
            className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shadow-xs relative shrink-0 transition-all duration-300 group-hover/brand:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary || theme.primary} 100%)`,
              boxShadow: `0 2px 8px ${theme.primary}25`,
            }}
          >
            {header.logoUrl ? (
              <img
                src={header.logoUrl}
                alt={header.brandName}
                className="w-4.5 h-4.5 object-contain filter drop-shadow transition-transform duration-300 group-hover/brand:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <svg
                className="w-4.5 h-4.5 text-white transition-transform duration-300 group-hover/brand:scale-105"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            )}
          </div>

          {/* Textos da Marca: Primeira palavra + Segunda palavra (cor primária) + Slogan */}
          <div className="flex flex-col">
            <div className="text-xs sm:text-sm font-extrabold tracking-tight leading-none uppercase flex items-center gap-1 transition-transform duration-300 group-hover/brand:translate-x-0.5">
              <span className="text-slate-900">{firstWord}</span>
              {secondWord ? (
                <span
                  style={{
                    color: theme.primary,
                  }}
                >
                  {secondWord}
                </span>
              ) : (
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block ml-0.5"
                  style={{ backgroundColor: theme.primary }}
                />
              )}
            </div>
            <span className="text-[9.5px] font-medium tracking-wide text-slate-500 mt-0.5 leading-none">
              {header.urbanMobilityText}
            </span>
          </div>
        </div>

        {/* Centro (Desktop): Badge de Status Operacional em Tempo Real */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 shadow-2xs">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10.5px] tracking-wide text-emerald-700 font-medium">Operação em tempo real</span>
        </div>

        {/* Lado Direito: Navegação Rápida e Botão de Acesso */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate?.("/cadastro-motorista")}
            className="hidden sm:inline-flex text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-100/80"
          >
            Seja um motorista
          </button>

          <button
            type="button"
            onClick={() => onNavigate?.("/auth")}
            className="group/btn relative inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-white text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs overflow-hidden min-h-[30px] h-8"
            style={{
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary || theme.primary} 100%)`,
              boxShadow: `0 2px 8px ${theme.primary}25`,
              borderRadius: "10px",
            }}
          >
            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <span>Entrar</span>
            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};
