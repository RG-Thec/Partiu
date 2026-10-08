import React, { useState } from "react";
import { Sparkles, Upload, Globe, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useBranding } from "@/hooks/useBranding";
import { updateBrowserFavicon, generateSvgFavicon } from "@/lib/branding/ThemeEngine";

interface BrandCenterTabProps {
  onSaveFeedback: () => void;
}

export function BrandCenterTab({ onSaveFeedback }: BrandCenterTabProps) {
  const { brand, updateConfig, appConfig } = useBrandTheme();
  const { branding, updateBranding, uploadAsset } = useBranding();

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [faviconTestFeedback, setFaviconTestFeedback] = useState(false);

  function handleApplyCustomFavicon(url: string) {
    updateConfig({
      brandCenter: {
        ...brand,
        favicons: {
          ...brand.favicons,
          faviconDesktopUrl: url,
          faviconMobileUrl: url,
          appleTouchIconUrl: url,
        },
      },
    });
    void updateBranding({ favicon_url: url });
    updateBrowserFavicon(url);
    onSaveFeedback();
  }

  function handleGerarFaviconDaPaleta() {
    const primary = (brand as any)?.designSystem?.paletaPrimaria?.corPrincipal || branding?.primary_color || "#FF6B00";
    const secondary = (brand as any)?.designSystem?.paletaPrimaria?.corSecundaria || branding?.secondary_color || "#FFB800";
    const svgUri = generateSvgFavicon(primary, secondary);
    handleApplyCustomFavicon(svgUri);
    setFaviconTestFeedback(true);
    setTimeout(() => setFaviconTestFeedback(false), 3000);
  }

  function handleTestarFaviconAba() {
    const activeFav = brand?.favicons?.faviconDesktopUrl || branding?.favicon_url || "/favicon.svg";
    updateBrowserFavicon(activeFav);
    setFaviconTestFeedback(true);
    setTimeout(() => setFaviconTestFeedback(false), 3000);
  }

  async function handleFileUpload(file: File, type: "logo" | "splash" | "favicon" | "app_icon" | "push_icon") {
    try {
      setUploadingField(type);
      setUploadError(null);
      const url = await uploadAsset(file, type);
      if (url) {
        if (type === "logo") {
          updateConfig({
            brandCenter: {
              ...brand,
              logos: { ...brand.logos, logoPrincipalUrl: url },
            },
          });
        } else if (type === "splash") {
          updateConfig({
            brandCenter: {
              ...brand,
              splash: { ...brand.splash, splashAndroidUrl: url, splashIosUrl: url },
            },
            nativeApp: {
              ...appConfig,
              splashAndroidUrl: url,
              splashIosUrl: url,
            },
          });
        } else if (type === "favicon") {
          updateConfig({
            brandCenter: {
              ...brand,
              favicons: {
                ...brand.favicons,
                faviconDesktopUrl: url,
                faviconMobileUrl: url,
                appleTouchIconUrl: url,
              },
            },
          });
          updateBrowserFavicon(url);
        }
        onSaveFeedback();
      }
    } catch (err: any) {
      setUploadError(err?.message || "Erro no upload do arquivo.");
    } finally {
      setUploadingField(null);
    }
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          Módulo 1: Brand Center
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Nomes, slogans, logotipos SVG/PNG, favicons e informações institucionais sem mexer em código.
        </p>
      </div>

      {/* Informações Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Nome da Plataforma
          </label>
          <input
            type="text"
            value={brand?.nomePlataforma || ""}
            onChange={(e) => {
              updateConfig({
                brandCenter: { ...brand, nomePlataforma: e.target.value },
              });
              onSaveFeedback();
            }}
            placeholder="ex: PARTIU"
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none transition"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Slogan Principal
          </label>
          <input
            type="text"
            value={brand?.slogan || ""}
            onChange={(e) => {
              updateConfig({
                brandCenter: { ...brand, slogan: e.target.value },
              });
              onSaveFeedback();
            }}
            placeholder="ex: Mobilidade inteligente para sua cidade"
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none transition"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1.5">
          Descrição Institucional
        </label>
        <textarea
          rows={3}
          value={brand?.descricaoInstitucional || ""}
          onChange={(e) => {
            updateConfig({
              brandCenter: { ...brand, descricaoInstitucional: e.target.value },
            });
            onSaveFeedback();
          }}
          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none transition"
        />
      </div>

      {/* Logotipos */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-primary-600">
          Logotipos &amp; Recursos de Mídia (Supabase Storage)
        </h3>

        {uploadError && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Upload Cards com Preview ao Vivo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Upload Logo Principal */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-3">
            <span className="text-xs font-bold text-slate-700">Logo Principal</span>
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-xs">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400 font-bold">Sem Logo</span>
              )}
            </div>
            <label className="w-full cursor-pointer">
              <input
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/jpeg"
                className="hidden"
                disabled={uploadingField === "logo"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUpload(file, "logo");
                }}
              />
              <span className="inline-flex items-center justify-center gap-1.5 w-full bg-primary-600 hover:bg-primary-500 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingField === "logo" ? "Enviando..." : "Upload Logo (<5MB)"}</span>
              </span>
            </label>
          </div>

          {/* Upload Splash Logo */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-3">
            <span className="text-xs font-bold text-slate-700">Logo Splash Screen</span>
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-xs">
              {branding?.splash_logo_url ? (
                <img src={branding.splash_logo_url} alt="Splash" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400 font-bold">Sem Splash</span>
              )}
            </div>
            <label className="w-full cursor-pointer">
              <input
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/jpeg"
                className="hidden"
                disabled={uploadingField === "splash"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUpload(file, "splash");
                }}
              />
              <span className="inline-flex items-center justify-center gap-1.5 w-full bg-primary-600 hover:bg-primary-500 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingField === "splash" ? "Enviando..." : "Upload Splash (<5MB)"}</span>
              </span>
            </label>
          </div>

          {/* Upload Favicon */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-3">
            <span className="text-xs font-bold text-slate-700">Favicon do Navegador</span>
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-xs">
              {brand?.favicons?.faviconDesktopUrl || branding?.favicon_url ? (
                <img
                  src={brand?.favicons?.faviconDesktopUrl || branding?.favicon_url || ""}
                  alt="Favicon"
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400 font-bold">Sem Favicon</span>
              )}
            </div>
            <label className="w-full cursor-pointer">
              <input
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/x-icon"
                className="hidden"
                disabled={uploadingField === "favicon"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUpload(file, "favicon");
                }}
              />
              <span className="inline-flex items-center justify-center gap-1.5 w-full bg-primary-600 hover:bg-primary-500 text-slate-950 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingField === "favicon" ? "Enviando..." : "Upload Favicon (<5MB)"}</span>
              </span>
            </label>
          </div>
        </div>

        {/* Módulo Especial: Centro de Personalização do Favicon da Aba do Navegador */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Ícone da Aba do Navegador (Favicon em Tempo Real)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Personalize o ícone exibido na aba do navegador do passageiro e motorista. Sincronização instantânea sem necessidade de recarregar a página.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 w-fit">
              {(brand?.favicons?.faviconDesktopUrl || branding?.favicon_url || "").startsWith("data:image/svg")
                ? "✨ SVG Vetorial Dinâmico"
                : "🖼️ Imagem Personalizada"}
            </span>
          </div>

          {/* Simulador da Aba do Navegador */}
          <div className="rounded-xl border border-slate-700/80 bg-slate-950 p-3 shadow-md space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
              <span>Simulação da Aba no Navegador:</span>
              <span className="text-[10px] text-slate-500">16x16 / 32x32 SVG Multi-DPI</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/90 rounded-lg p-2 border border-slate-800">
              <div className="flex items-center gap-1.5 px-1 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>

              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-md max-w-sm truncate shadow-xs">
                <div className="w-4 h-4 rounded-xs shrink-0 overflow-hidden flex items-center justify-center bg-slate-900">
                  {brand?.favicons?.faviconDesktopUrl || branding?.favicon_url ? (
                    <img
                      src={brand?.favicons?.faviconDesktopUrl || branding?.favicon_url || ""}
                      alt="Aba Favicon"
                      className="w-4 h-4 object-contain"
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-primary-500" />
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {brand?.nomePlataforma || branding?.app_name || "PARTIU"} — {brand?.slogan || "Mobilidade Inteligente"}
                </span>
                <span className="text-slate-500 hover:text-slate-300 text-xs ml-auto cursor-default">×</span>
              </div>
            </div>
          </div>

          {/* Ações Rápidas do Favicon */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleGerarFaviconDaPaleta}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-slate-950 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gerar da Cor da Marca ({(brand as any)?.designSystem?.paletaPrimaria?.corPrincipal || branding?.primary_color || "#FF6B00"})</span>
            </button>

            <button
              type="button"
              onClick={handleTestarFaviconAba}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 cursor-pointer active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Testar na Aba do Navegador Agora</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyCustomFavicon("/favicon.svg")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Ícone Padrão</span>
            </button>
          </div>

          {faviconTestFeedback && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                ✓ Favicon atualizado com sucesso na aba do seu navegador em tempo real!
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Logo Principal (URL direta)
            </label>
            <input
              type="text"
              value={brand?.logos?.logoPrincipalUrl || ""}
              onChange={(e) => {
                updateConfig({
                  brandCenter: {
                    ...brand,
                    logos: { ...brand.logos, logoPrincipalUrl: e.target.value },
                  },
                });
                onSaveFeedback();
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Logo Reduzida / Ícone
            </label>
            <input
              type="text"
              value={brand?.logos?.logoReduzidaUrl || ""}
              onChange={(e) => {
                updateConfig({
                  brandCenter: {
                    ...brand,
                    logos: { ...brand.logos, logoReduzidaUrl: e.target.value },
                  },
                });
                onSaveFeedback();
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Favicon Desktop / Aba (URL direta ou Data URI)
            </label>
            <input
              type="text"
              value={brand?.favicons?.faviconDesktopUrl || branding?.favicon_url || ""}
              placeholder="https://... ou /favicon.svg ou data:image/svg+xml,..."
              onChange={(e) => {
                handleApplyCustomFavicon(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Apple Touch Icon (URL direta)
            </label>
            <input
              type="text"
              value={brand?.favicons?.appleTouchIconUrl || ""}
              placeholder="/apple-touch-icon.png ou URL externa"
              onChange={(e) => {
                updateConfig({
                  brandCenter: {
                    ...brand,
                    favicons: { ...brand.favicons, appleTouchIconUrl: e.target.value },
                  },
                });
                onSaveFeedback();
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Logo Versão Branca
            </label>
            <input
              type="text"
              value={brand?.logos?.logoBrancaUrl || ""}
              onChange={(e) => {
                updateConfig({
                  brandCenter: {
                    ...brand,
                    logos: { ...brand.logos, logoBrancaUrl: e.target.value },
                  },
                });
                onSaveFeedback();
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Logo Versão Escura
            </label>
            <input
              type="text"
              value={brand?.logos?.logoEscuraUrl || ""}
              onChange={(e) => {
                updateConfig({
                  brandCenter: {
                    ...brand,
                    logos: { ...brand.logos, logoEscuraUrl: e.target.value },
                  },
                });
                onSaveFeedback();
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Suporte e Contato */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-primary-600">
          Canais de Atendimento ao Usuário
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              E-mail Oficial
            </label>
            <input
              type="email"
              value={brand?.emailContato || ""}
              onChange={(e) => {
                updateConfig({
                  brandCenter: { ...brand, emailContato: e.target.value },
                });
                onSaveFeedback();
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Telefone / 0800
            </label>
            <input
              type="text"
              value={brand?.telefoneSuporte || ""}
              onChange={(e) => {
                updateConfig({
                  brandCenter: { ...brand, telefoneSuporte: e.target.value },
                });
                onSaveFeedback();
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              WhatsApp de Suporte
            </label>
            <input
              type="text"
              value={brand?.whatsappSuporte || ""}
              onChange={(e) => {
                updateConfig({
                  brandCenter: { ...brand, whatsappSuporte: e.target.value },
                });
                onSaveFeedback();
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
