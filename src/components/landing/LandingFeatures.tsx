import React from "react";
import { Shield, Zap, UserCheck, Headphones } from "lucide-react";
import type { FeatureItem, ThemeConfig } from "@/types/mobilityLanding";

interface LandingFeaturesProps {
  features: FeatureItem[];
  theme: ThemeConfig;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({
  features,
  theme,
}) => {
  // Ícones padrões correspondentes aos 4 pilares caso a URL falhe ou não venha definida
  const fallbackIcons = [
    <Shield key="0" className="w-5 h-5 text-sky-600 stroke-[2.2]" />,
    <Zap key="1" className="w-5 h-5 text-amber-500 stroke-[2.2]" />,
    <UserCheck key="2" className="w-5 h-5 text-emerald-600 stroke-[2.2]" />,
    <Headphones key="3" className="w-5 h-5 text-purple-600 stroke-[2.2]" />,
  ];

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 z-20">
      {/* Grid Responsivo: 4 colunas em telas médias/grandes / 2x2 em celulares pequenos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-7xl mx-auto">
        {features.map((feature, idx) => {
          const fallbackIcon = fallbackIcons[idx % fallbackIcons.length];

          return (
            <div
              key={idx}
              className="group relative flex items-center gap-3.5 p-4 sm:p-5 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden"
            >
              {/* Efeito Glow na Borda Superior ao Passar o Mouse */}
              <div
                className="absolute top-0 inset-x-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)`,
                }}
              />

              {/* Ícone com Container Arredondado */}
              <div
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-300 group-hover:scale-105 bg-slate-50 border border-slate-200/80"
              >
                {feature.iconUrl ? (
                  <img
                    src={feature.iconUrl}
                    alt={feature.text}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  fallbackIcon
                )}
              </div>

              {/* Textos com Tipografia Acessível em Sentence Case */}
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-tight transition-colors">
                  {feature.text}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium leading-tight mt-0.5 truncate">
                  {feature.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
