import React from "react";
import type { FooterConfig, ThemeConfig } from "@/types/mobilityLanding";

interface LandingFooterProps {
  footer: FooterConfig;
  theme: ThemeConfig;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ footer, theme }) => {
  const primaryColor = theme?.primary || "#FF6B00";
  const secondaryColor = theme?.secondary || "#FFB800";

  return (
    <footer
      className="relative w-full overflow-hidden pt-8 select-none"
      style={{
        backgroundColor: theme?.bgLight || "#F8FAFC",
      }}
    >
      {/* Linha Divisória Central com Identificador da Marca */}
      <div className="w-full px-6 flex items-center justify-center gap-3 pb-8 group/footer">
        <div className="flex-1 h-[1px] bg-slate-300/80 max-w-[80px] sm:max-w-[120px] transition-colors duration-300 group-hover/footer:bg-slate-400" />
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 group-hover/footer:text-slate-800 transition-all duration-300 whitespace-nowrap cursor-default">
          {footer?.brandName || "PARTIU"} • {footer?.urbanMobilityText || "Mobilidade urbana"}
        </span>
        <div className="flex-1 h-[1px] bg-slate-300/80 max-w-[80px] sm:max-w-[120px] transition-colors duration-300 group-hover/footer:bg-slate-400" />
      </div>

      {/* Onda Decorativa Inferior com o Gradiente Exato do White Label */}
      <div className="relative w-full h-14 sm:h-18 overflow-hidden leading-none">
        <svg
          className="relative block w-full h-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="footerDynamicGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="50%" stopColor={secondaryColor} />
              <stop offset="100%" stopColor={primaryColor} />
            </linearGradient>
          </defs>
          <path
            d="M0,40 C300,120 700,-30 1200,60 L1200,120 L0,120 Z"
            fill="url(#footerDynamicGradient)"
            opacity="0.95"
          />
        </svg>
      </div>
    </footer>
  );
};
