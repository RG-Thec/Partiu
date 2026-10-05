import React, { useState, useEffect } from "react";
import { Palette, Check, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import {
  MONOCHROMATIC_PALETTES,
  DEFAULT_MONOCHROMATIC_PALETTE,
  type MonochromaticPalette,
} from "@/lib/branding/monochromatic-palettes";
import { themeEngine } from "@/lib/branding/ThemeEngine";
import { useBranding } from "@/hooks/useBranding";
import { getSuperAdminConfig, saveSuperAdminConfig } from "@/lib/superadmin-config";

export interface PalettePickerSectionProps {
  onPaletteSelect?: (palette: MonochromaticPalette) => void;
  className?: string;
}

export function PalettePickerSection({ onPaletteSelect, className = "" }: PalettePickerSectionProps) {
  const { branding, updateBranding } = useBranding();
  const [activePaletteId, setActivePaletteId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("partiu_active_palette_id");
      if (saved) return saved;
    }
    // Identifica por cor primária atual
    const matching = MONOCHROMATIC_PALETTES.find(
      (p) => p?.colors?.primary?.toLowerCase() === (branding?.primary_color || "").toLowerCase()
    );
    return matching?.id || DEFAULT_MONOCHROMATIC_PALETTE.id;
  });

  const [aplicandoId, setAplicandoId] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  // Escuta atualizações de tema
  useEffect(() => {
    function handleThemeChange(e: Event) {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.palette?.id) {
        setActivePaletteId(customEvent.detail.palette.id);
      }
    }
    window.addEventListener("partiu:theme-palette-updated", handleThemeChange);
    return () => window.removeEventListener("partiu:theme-palette-updated", handleThemeChange);
  }, []);

  async function handleSelectPalette(palette: MonochromaticPalette) {
    setAplicandoId(palette.id);
    setActivePaletteId(palette.id);

    try {
      // 1. Aplicação imediata no DOM e CSS Variables via ThemeEngine
      themeEngine.applyMonochromaticPalette(palette, branding?.app_name || "PARTIU");

      // 2. Persistência na camada SaaS / Supabase
      await updateBranding({
        primary_color: palette.colors.primary,
        secondary_color: palette.colors.secondary,
        accent_color: palette.colors.accent,
        header_gradient_start: palette.colors.headerGradientStart,
        header_gradient_end: palette.colors.headerGradientEnd,
        background_color: palette.colors.background,
        surface_color: palette.colors.surface,
        text_primary: palette.colors.textPrimary,
        text_secondary: palette.colors.textSecondary,
      });

      // 3. Sincroniza WhiteLabelEngine
      try {
        const { whiteLabelEngine } = await import("@/lib/white-label");
        const act = whiteLabelEngine.getActiveConfig();
        whiteLabelEngine.updateActiveConfig({
          designSystem: {
            ...act.designSystem,
            paletaPrimaria: {
              corPrincipal: palette.colors.primary,
              corPrincipalHover: palette.colors.deep,
              corSecundaria: palette.colors.secondary,
              corSecundariaHover: palette.colors.deep,
              corTerciaria: palette.colors.accent,
              corTextoPrincipal: palette.colors.textPrimary,
              corFundoApp: palette.colors.background,
              corSuperficieCard: palette.colors.surface,
            },
            gradienteHero: {
              nome: palette.name,
              anguloGraus: 135,
              corInicio: palette.colors.headerGradientStart,
              corFim: palette.colors.headerGradientEnd,
              ativo: true,
            },
          },
        });
      } catch {}

      // 4. Sincroniza superadmin-config
      try {
        const cfg = getSuperAdminConfig();
        if (cfg.identidade) {
          cfg.identidade.corPrimaria = palette.colors.primary;
          cfg.identidade.corPrimariaHover = palette.colors.deep;
          cfg.identidade.corSecundaria = palette.colors.secondary;
          saveSuperAdminConfig(cfg);
        }
      } catch {}

      onPaletteSelect?.(palette);
      setSucessoMsg(`Paleta "${palette.name}" aplicada com sucesso em todo o aplicativo!`);
      setTimeout(() => setSucessoMsg(null), 3500);
    } finally {
      setAplicandoId(null);
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cabeçalho explicativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2.5">
                Paletas Monocromáticas Prontas
                <span className="text-xs uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  White Label 1-Clique
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                Selecione uma paleta harmônica com contraste profissional (WCAG AAA). O sistema atualiza todos os botões, cabeçalhos e telas na mesma hora.
              </p>
            </div>
          </div>
        </div>

        {sucessoMsg && (
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 animate-in fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
        )}
      </div>

      {/* Grid com as 5 Paletas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {MONOCHROMATIC_PALETTES.map((paleta) => {
          const isAtiva = activePaletteId === paleta.id;
          const isCarregando = aplicandoId === paleta.id;

          return (
            <button
              key={paleta.id}
              type="button"
              onClick={() => handleSelectPalette(paleta)}
              disabled={isCarregando}
              className={`text-left p-5 sm:p-6 rounded-3xl border-2 transition-all duration-200 relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
                isAtiva
                  ? "border-slate-900 bg-white shadow-lg ring-2 ring-slate-900/10 scale-[1.01]"
                  : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-md active:scale-[0.99]"
              }`}
            >
              {/* Barra de Gradiente Superior do Card */}
              <div
                className="absolute top-0 inset-x-0 h-2"
                style={{
                  background: `linear-gradient(90deg, ${paleta.colors.headerGradientStart} 0%, ${paleta.colors.secondary} 100%)`,
                }}
              />

              {/* Topo do Card: Categoria & Badge de Ativa */}
              <div className="flex items-center justify-between gap-2 pt-1 mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {paleta.category}
                </span>

                <div className="flex items-center gap-1.5">
                  {paleta.isDefault && (
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      PADRÃO OFICIAL
                    </span>
                  )}
                  {isAtiva && (
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-white flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      ATIVA
                    </span>
                  )}
                </div>
              </div>

              {/* Nome e Descrição */}
              <div className="mb-4">
                <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-slate-950 flex items-center gap-2">
                  {paleta.name}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-1 leading-relaxed font-medium">
                  {paleta.description}
                </p>
              </div>

              {/* Amostras Visuais das Cores */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-xs border border-white/80 ring-1 ring-black/10"
                    style={{ backgroundColor: paleta.colors.primary }}
                    title={`Primária: ${paleta.colors.primary}`}
                  />
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-xs border border-white/80 ring-1 ring-black/10"
                    style={{ backgroundColor: paleta.colors.secondary }}
                    title={`Secundária: ${paleta.colors.secondary}`}
                  />
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-xs border border-slate-200 ring-1 ring-black/10"
                    style={{ backgroundColor: paleta.colors.soft }}
                    title={`Fundo Suave: ${paleta.colors.soft}`}
                  />
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-xs border border-slate-300 ring-1 ring-black/10"
                    style={{ backgroundColor: paleta.colors.deep }}
                    title={`Tom Estrutural: ${paleta.colors.deep}`}
                  />
                </div>

                <div
                  className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-colors"
                  style={{
                    backgroundColor: isAtiva ? paleta.colors.primary : "#F1F5F9",
                    color: isAtiva ? paleta.colors.textOnPrimary : "#334155",
                  }}
                >
                  {isCarregando ? "Aplicando..." : isAtiva ? "Em Uso" : "Selecionar"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
