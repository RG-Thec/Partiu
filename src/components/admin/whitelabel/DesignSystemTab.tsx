import React from "react";
import { Palette, Link2, Unlink, Sliders, Save } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useBranding } from "@/hooks/useBranding";
import { PalettePickerSection } from "@/components/admin/PalettePickerSection";
import type { BorderRadiusOption, ShadowOption } from "@/lib/white-label";

interface DesignSystemTabProps {
  onSaveFeedback: () => void;
}

export function DesignSystemTab({ onSaveFeedback }: DesignSystemTabProps) {
  const { designSystem, updateConfig } = useBrandTheme();
  const { branding, updateBranding, isSyncing, lastSyncedAt } = useBranding();

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary-600" />
          Módulo 2: Design System Manager
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Altere cores primárias, secundárias, semântica, raios e sombras aplicados via variáveis CSS no :root.
        </p>
      </div>

      {/* Seletor de Paletas Monocromáticas de 1-Clique */}
      <PalettePickerSection className="pb-4" />

      {/* Paleta Primária */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-primary-600">
          Paleta de Cores da Marca
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Cor Primária */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Cor Primária (Brand)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={designSystem?.paletaPrimaria?.corPrincipal || "#FF6B00"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corPrincipal: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={designSystem?.paletaPrimaria?.corPrincipal || "#FF6B00"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corPrincipal: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Cor Primária Hover */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Cor Primária (Hover / Active)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={designSystem?.paletaPrimaria?.corPrincipalHover || "#EA580C"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corPrincipalHover: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={designSystem?.paletaPrimaria?.corPrincipalHover || "#EA580C"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corPrincipalHover: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Cor Secundária */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Cor Secundária (Acentos)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={designSystem?.paletaPrimaria?.corSecundaria || "#FFB800"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corSecundaria: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={designSystem?.paletaPrimaria?.corSecundaria || "#FFB800"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corSecundaria: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Cor Accent / Destaque (--brand-accent) */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Cor Accent / Destaque (--brand-accent)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={designSystem?.paletaPrimaria?.corTerciaria || "#EA580C"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corTerciaria: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={designSystem?.paletaPrimaria?.corTerciaria || "#EA580C"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corTerciaria: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Cor de Texto Principal */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Texto Sobre Primária
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={designSystem?.paletaPrimaria?.corTextoPrincipal || "#0F172A"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corTextoPrincipal: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={designSystem?.paletaPrimaria?.corTextoPrincipal || "#0F172A"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corTextoPrincipal: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Cor Fundo do App */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Fundo das Páginas
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={designSystem?.paletaPrimaria?.corFundoApp || "#F8FAFC"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corFundoApp: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={designSystem?.paletaPrimaria?.corFundoApp || "#F8FAFC"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corFundoApp: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Superfície Cards */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Superfície dos Cards
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={designSystem?.paletaPrimaria?.corSuperficieCard || "#FFFFFF"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corSuperficieCard: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={designSystem?.paletaPrimaria?.corSuperficieCard || "#FFFFFF"}
                onChange={(e) => {
                  updateConfig({
                    designSystem: {
                      ...designSystem,
                      paletaPrimaria: {
                        ...designSystem.paletaPrimaria,
                        corSuperficieCard: e.target.value,
                      },
                    },
                  });
                  onSaveFeedback();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Gradiente do Cabeçalho Padrão 99 (Início) */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Cabeçalho Curvo (Início Gradiente)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding?.header_gradient_start || "#0088FF"}
                onChange={(e) => {
                  const val = e.target.value;
                  const isSynced = branding?.footer_sync_with_header !== false;
                  updateBranding({
                    header_gradient_start: val,
                    ...(isSynced ? { footer_gradient_start: val } : {}),
                  });
                  onSaveFeedback();
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={branding?.header_gradient_start || "#0088FF"}
                onChange={(e) => {
                  const val = e.target.value;
                  const isSynced = branding?.footer_sync_with_header !== false;
                  updateBranding({
                    header_gradient_start: val,
                    ...(isSynced ? { footer_gradient_start: val } : {}),
                  });
                  onSaveFeedback();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Gradiente do Cabeçalho Padrão 99 (Fim) */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Cabeçalho Curvo (Fim Gradiente)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding?.header_gradient_end || "#003366"}
                onChange={(e) => {
                  const val = e.target.value;
                  const isSynced = branding?.footer_sync_with_header !== false;
                  updateBranding({
                    header_gradient_end: val,
                    ...(isSynced ? { footer_gradient_end: val } : {}),
                  });
                  onSaveFeedback();
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={branding?.header_gradient_end || "#003366"}
                onChange={(e) => {
                  const val = e.target.value;
                  const isSynced = branding?.footer_sync_with_header !== false;
                  updateBranding({
                    header_gradient_end: val,
                    ...(isSynced ? { footer_gradient_end: val } : {}),
                  });
                  onSaveFeedback();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* SINCRONIZAÇÃO E CUSTOMIZAÇÃO DO RODAPÉ (FOOTER BRANDING) */}
          <div className="col-span-full p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Cor do Rodapé (Navegação Inferior)
                  </span>
                  {branding?.footer_sync_with_header !== false ? (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Sincronizado com Cabeçalho
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Unlink className="w-3 h-3" /> Customização Separada
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {branding?.footer_sync_with_header !== false
                    ? "Por padrão, o rodapé segue automaticamente as mesmas cores e degradê do cabeçalho em tempo real."
                    : "O rodapé está operando com cores personalizadas independentes do cabeçalho."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const currentlySynced = branding?.footer_sync_with_header !== false;
                  if (currentlySynced) {
                    updateBranding({
                      footer_sync_with_header: false,
                      footer_gradient_start: branding?.footer_gradient_start || branding?.header_gradient_start || "#0088FF",
                      footer_gradient_end: branding?.footer_gradient_end || branding?.header_gradient_end || "#003366",
                    });
                  } else {
                    updateBranding({
                      footer_sync_with_header: true,
                      footer_gradient_start: branding?.header_gradient_start || "#0088FF",
                      footer_gradient_end: branding?.header_gradient_end || "#003366",
                    });
                  }
                  onSaveFeedback();
                }}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
                  branding?.footer_sync_with_header !== false
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                }`}
              >
                {branding?.footer_sync_with_header !== false ? (
                  <>
                    <Sliders className="w-3.5 h-3.5 text-primary-400" />
                    <span>Customizar Rodapé Separadamente</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Sincronizar com Cabeçalho</span>
                  </>
                )}
              </button>
            </div>

            {/* Controles de Cores Independentes para o Rodapé (quando desvinculado) */}
            {branding?.footer_sync_with_header === false && (
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Rodapé (Início Gradiente)
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={branding?.footer_gradient_start || branding?.header_gradient_start || "#0088FF"}
                      onChange={(e) => {
                        updateBranding({ footer_gradient_start: e.target.value });
                        onSaveFeedback();
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={branding?.footer_gradient_start || branding?.header_gradient_start || "#0088FF"}
                      onChange={(e) => {
                        updateBranding({ footer_gradient_start: e.target.value });
                        onSaveFeedback();
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Rodapé (Fim Gradiente)
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={branding?.footer_gradient_end || branding?.header_gradient_end || "#003366"}
                      onChange={(e) => {
                        updateBranding({ footer_gradient_end: e.target.value });
                        onSaveFeedback();
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={branding?.footer_gradient_end || branding?.header_gradient_end || "#003366"}
                      onChange={(e) => {
                        updateBranding({ footer_gradient_end: e.target.value });
                        onSaveFeedback();
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cor de Destaque / Acentos */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Cor de Destaque (Accent / Cyan)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding?.accent_color || "#00C6FF"}
                onChange={(e) => {
                  updateBranding({ accent_color: e.target.value });
                  onSaveFeedback();
                }}
                className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={branding?.accent_color || "#00C6FF"}
                onChange={(e) => {
                  updateBranding({ accent_color: e.target.value });
                  onSaveFeedback();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Botão de Ação: Salvar e Sincronizar em Tempo Real no Supabase */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">
              {isSyncing
                ? "Sincronizando com Supabase..."
                : lastSyncedAt
                ? `Sincronizado às ${lastSyncedAt.toLocaleTimeString()}`
                : "Conectado ao Supabase Realtime"}
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await updateBranding({
                primary_color: designSystem?.paletaPrimaria?.corPrincipal || branding.primary_color,
                secondary_color: designSystem?.paletaPrimaria?.corSecundaria || branding.secondary_color,
                background_color: designSystem?.paletaPrimaria?.corFundoApp || branding.background_color,
                surface_color: designSystem?.paletaPrimaria?.corSuperficieCard || branding.surface_color,
                text_primary: designSystem?.paletaPrimaria?.corTextoPrincipal || branding.text_primary,
                header_gradient_start: branding.header_gradient_start,
                header_gradient_end: branding.header_gradient_end,
                footer_sync_with_header: branding.footer_sync_with_header !== false,
                footer_gradient_start: branding.footer_gradient_start || branding.header_gradient_start,
                footer_gradient_end: branding.footer_gradient_end || branding.header_gradient_end,
              });
              onSaveFeedback();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-slate-950 font-black text-xs py-2.5 px-5 rounded-xl shadow-lg transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar e Aplicar Imediatamente (Realtime)</span>
          </button>
        </div>
      </div>

      {/* Raio das Bordas e Sombras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Arredondamento das Bordas (Border Radius)
          </label>
          <select
            value={designSystem?.raioBordas || "2xl"}
            onChange={(e) => {
              updateConfig({
                designSystem: {
                  ...designSystem,
                  raioBordas: e.target.value as BorderRadiusOption,
                },
              });
              onSaveFeedback();
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 cursor-pointer outline-none"
          >
            <option value="sm">sm (Pequeno - 4px)</option>
            <option value="md">md (Médio - 8px)</option>
            <option value="lg">lg (Grande - 12px)</option>
            <option value="xl">xl (Extra Grande - 16px)</option>
            <option value="2xl">2xl (Super Arredondado - 20px - Padrão)</option>
            <option value="3xl">3xl (Ultra - 24px)</option>
            <option value="full">full (Pílula Total)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Estilo de Sombra dos Cards
          </label>
          <select
            value={designSystem?.sombraCards || "medium"}
            onChange={(e) => {
              updateConfig({
                designSystem: {
                  ...designSystem,
                  sombraCards: e.target.value as ShadowOption,
                },
              });
              onSaveFeedback();
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 cursor-pointer outline-none"
          >
            <option value="none">Nenhuma (Plano / Flat)</option>
            <option value="light">Suave (Light)</option>
            <option value="medium">Média (Padrão 99)</option>
            <option value="strong">Marcante (Strong)</option>
            <option value="elevated">Elevada (3D Float)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
