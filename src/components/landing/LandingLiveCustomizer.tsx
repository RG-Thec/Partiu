import React, { useState } from "react";
import { Sliders, RotateCcw, X, Palette, Type, Check, Sparkles } from "lucide-react";
import type { MobilityLandingPageData } from "@/types/mobilityLanding";

interface LandingLiveCustomizerProps {
  data: MobilityLandingPageData;
  onChange: (updated: MobilityLandingPageData) => void;
  onReset: () => void;
}

const PRESET_PALETTES = [
  {
    name: "Azul Elétrico (Original)",
    primary: "#007AFF",
    secondary: "#9C27B0",
    gradient: "linear-gradient(to bottom, #001236, #002D62)",
  },
  {
    name: "Laranja & Âmbar (Partiu)",
    primary: "#FF6B00",
    secondary: "#FFB800",
    gradient: "linear-gradient(to bottom, #1A0D00, #3D1C00)",
  },
  {
    name: "Verde Esmeralda (Eco)",
    primary: "#10B981",
    secondary: "#059669",
    gradient: "linear-gradient(to bottom, #022013, #064E3B)",
  },
  {
    name: "Roxo Tech & Magenta",
    primary: "#8B5CF6",
    secondary: "#EC4899",
    gradient: "linear-gradient(to bottom, #16082F, #31105C)",
  },
  {
    name: "Preto Minimalista / Dark",
    primary: "#3B82F6",
    secondary: "#64748B",
    gradient: "linear-gradient(to bottom, #0B0F17, #1E293B)",
  },
];

export const LandingLiveCustomizer: React.FC<LandingLiveCustomizerProps> = ({
  data,
  onChange,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateTheme = (field: string, value: any) => {
    onChange({
      ...data,
      theme: {
        ...data.theme,
        [field]: value,
      },
    });
  };

  const updateBgGradient = (gradient: string) => {
    onChange({
      ...data,
      theme: {
        ...data.theme,
        bgDark: {
          gradient,
        },
      },
    });
  };

  const updateHeader = (field: string, value: string) => {
    onChange({
      ...data,
      header: {
        ...data.header,
        [field]: value,
      },
      reasonSection: {
        ...data.reasonSection,
        ...(field === "brandName" ? { brandName: `${value}?` } : {}),
      },
      footer: {
        ...data.footer,
        ...(field === "brandName" ? { brandName: value } : {}),
      },
    });
  };

  const updateHero = (field: string, value: string) => {
    onChange({
      ...data,
      hero: {
        ...data.hero,
        [field]: value,
      },
    });
  };

  return (
    <>
      {/* BOTÃO FLUTUANTE DISCRETO PARA ABRIR O SIMULADOR DE PAINEL ADMIN */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-2xl backdrop-blur-md border border-slate-700/80 active:scale-95 transition-all cursor-pointer group"
      >
        <Sliders className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform" />
        <span>Painel Admin Live</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>

      {/* GAVETA LATERAL DO PAINEL ADMINISTRATIVO */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-sm h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Topo do Painel */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Data-Binding Admin Panel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo de Configurações Dinâmicas */}
            <div className="p-4 space-y-5 text-xs text-slate-700 flex-1 overflow-y-auto">
              {/* Seção 1: Paletas Prontas */}
              <div className="space-y-2">
                <label className="font-bold text-[11px] uppercase tracking-wider text-slate-400 block">
                  Paletas Prontas (Theme Presets)
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRESET_PALETTES.map((palette, i) => {
                    const isSelected =
                      data.theme.primary.toLowerCase() === palette.primary.toLowerCase();

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          onChange({
                            ...data,
                            theme: {
                              ...data.theme,
                              primary: palette.primary,
                              secondary: palette.secondary,
                              bgDark: { gradient: palette.gradient },
                            },
                          });
                        }}
                        className={`p-2 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/60 font-bold"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white"
                              style={{ backgroundColor: palette.primary }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white"
                              style={{ backgroundColor: palette.secondary }}
                            />
                          </div>
                          <span className="text-xs text-slate-800">
                            {palette.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-sky-600 stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seção 2: Cores Customizadas */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="font-bold text-[11px] uppercase tracking-wider text-slate-400 block">
                  Cores do Tema (CSS Variables)
                </label>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Cor Primária (Destaque):</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={data.theme.primary}
                      onChange={(e) => updateTheme("primary", e.target.value)}
                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <span className="font-mono text-[11px] uppercase text-slate-500">
                      {data.theme.primary}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Cor Secundária (Motorista):</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={data.theme.secondary}
                      onChange={(e) => updateTheme("secondary", e.target.value)}
                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <span className="font-mono text-[11px] uppercase text-slate-500">
                      {data.theme.secondary}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Fundo Claro Inferior:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={data.theme.bgLight}
                      onChange={(e) => updateTheme("bgLight", e.target.value)}
                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <span className="font-mono text-[11px] uppercase text-slate-500">
                      {data.theme.bgLight}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção 3: Raio das Bordas dos Botões */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                    Bordas dos Botões
                  </label>
                  <span className="font-mono font-bold text-sky-600">
                    {data.theme.buttonRadius}
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="28"
                  step="2"
                  value={parseInt(data.theme.buttonRadius, 10) || 14}
                  onChange={(e) => updateTheme("buttonRadius", `${e.target.value}px`)}
                  className="w-full cursor-pointer accent-sky-500"
                />
              </div>

              {/* Seção 4: Textos & Marca */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="font-bold text-[11px] uppercase tracking-wider text-slate-400 block">
                  Textos da Página (Content Binding)
                </label>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Nome da Marca:
                  </label>
                  <input
                    type="text"
                    value={data.header.brandName}
                    onChange={(e) => updateHeader("brandName", e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Headline Hero:
                  </label>
                  <textarea
                    rows={2}
                    value={data.hero.headline}
                    onChange={(e) => updateHero("headline", e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Rodapé do Painel com Reset */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
