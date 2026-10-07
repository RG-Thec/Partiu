import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useBranding } from "@/hooks/useBranding";
import { getAdminRole, getContaAtiva } from "@/lib/admin-rbac";
import { BRANDING_PRESETS, DEFAULT_BRANDING, type AppBrandingRecord } from "@/lib/branding";
import { updateBrowserFavicon, generateSvgFavicon } from "@/lib/branding/ThemeEngine";
import { PalettePickerSection } from "@/components/admin/PalettePickerSection";
import { LandingPageEditorTab } from "@/components/admin/whitelabel/LandingPageEditorTab";
import { MobilityLandingPage } from "@/components/landing/MobilityLandingPage";
import type { MobilityLandingPageData } from "@/types/mobilityLanding";
import {
  Sparkles,
  Palette,
  Type,
  Layout,
  Compass,
  Layers,
  DollarSign,
  Globe,
  Smartphone,
  Download,
  Upload,
  RotateCcw,
  Save,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Building2,
  Copy,
  ExternalLink,
  ShieldCheck,
  SmartphoneNfc,
  Tablet,
  Monitor,
  Car,
  Package,
  Bike,
  Truck,
  GraduationCap,
  Bus,
  Crown,
  ShoppingBag,
  Store,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Unlink,
  Sliders,
  FileText,
  Scale,
  Bell,
  Rocket,
  Image,
  Eye,
  RefreshCw,
  Pencil,
} from "lucide-react";
import {
  type BusinessVerticalId,
  type FontFamilyOption,
  type BorderRadiusOption,
  type ShadowOption,
  type SpacingScale,
  type CurrencyCode,
  type LocaleCode,
  type WhiteLabelFullConfig,
  type HomeHeroBanner,
} from "@/lib/white-label";

export const Route = createFileRoute("/app/admin/whitelabel")({
  head: () => ({
    meta: [
      { title: "White Label Studio OS | PARTIU Enterprise" },
      {
        name: "description",
        content:
          "Plataforma de customização White Label total sem código: Brand Center, Design System, Multi-negócio, Multi-tenant e Live Preview.",
      },
    ],
  }),
  component: WhiteLabelStudioPage,
});

type ActiveTab =
  | "brand"
  | "design"
  | "banners"
  | "typography"
  | "landing"
  | "home"
  | "menu"
  | "business"
  | "monetization"
  | "geo_app"
  | "tenants";

function WhiteLabelStudioPage() {
  return (
    <GuardiaoAcesso>
      <WhiteLabelStudioContent />
    </GuardiaoAcesso>
  );
}

function WhiteLabelStudioContent() {
  const roleAtiva = getAdminRole();
  const contaAtiva = getContaAtiva();
  const isFranqueado = roleAtiva === "FRANQUEADO";

  const {
    config,
    brand,
    designSystem,
    typography,
    homePage,
    menuBuilder,
    businessModels,
    monetization,
    geo,
    appConfig,
    activeTenant,
    allTenants,
    updateConfig,
    switchTenant,
    cloneTenant,
    toggleBusinessModel,
    reorderHomeBlocks,
    applyPreset,
    exportThemeJson,
    importThemeJson,
    resetToDefaults,
  } = useBrandTheme();

  const {
    branding,
    activeTenantId: saasTenantId,
    setTenantId: setSaasTenantId,
    updateBranding,
    applyPreset: applySaasPreset,
    uploadAsset,
    isSyncing,
    lastSyncedAt,
    resetToDefault: resetSaasBranding,
  } = useBranding();

  // Franqueado: vincula automaticamente ao seu próprio tenant
  useEffect(() => {
    if (isFranqueado && contaAtiva.tenantId && activeTenant?.tenantId !== contaAtiva.tenantId) {
      switchTenant(contaAtiva.tenantId);
    }
  }, [isFranqueado, contaAtiva.tenantId, activeTenant?.tenantId, switchTenant]);

  const [activeTab, setActiveTab] = useState<ActiveTab>("brand");
  const [liveLandingData, setLiveLandingData] = useState<MobilityLandingPageData | null>(null);
  const [salvoFeedback, setSalvoFeedback] = useState(false);
  const [modalClonarAberto, setModalClonarAberto] = useState(false);
  const [cloneCidadeNome, setCloneCidadeNome] = useState("");
  const [cloneEstadoUf, setCloneEstadoUf] = useState("RJ");
  const [cloneTenantId, setCloneTenantId] = useState("");
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importErro, setImportErro] = useState<string | null>(null);

  // Upload de Mídia para Supabase Storage
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
    triggerSaveFeedback();
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
          void updateBranding({ logo_url: url });
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
          void updateBranding({ splash_logo_url: url });
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
          void updateBranding({ favicon_url: url });
        } else if (type === "app_icon") {
          updateConfig({
            nativeApp: {
              ...appConfig,
              iconeAppUrl: url,
            },
          });
          void updateBranding({ app_icon_url: url });
        } else if (type === "push_icon") {
          updateConfig({
            nativeApp: {
              ...appConfig,
              iconeNotificacaoPushUrl: url,
            },
          });
          void updateBranding({ push_icon_url: url });
        }
        triggerSaveFeedback();
      }
    } catch (err: any) {
      setUploadError(err?.message || "Erro no upload do arquivo.");
    } finally {
      setUploadingField(null);
    }
  }

  // Estados e Handlers para o Gerenciador de Banners do Aplicativo
  const [novoBannerTitulo, setNovoBannerTitulo] = useState("");
  const [novoBannerSubtitulo, setNovoBannerSubtitulo] = useState("");
  const [novoBannerBadge, setNovoBannerBadge] = useState("DESTAQUE");
  const [novoBannerImagemUrl, setNovoBannerImagemUrl] = useState("");
  const [novoBannerLink, setNovoBannerLink] = useState("/app");
  const [adicionandoBanner, setAdicionandoBanner] = useState(false);
  const [bannerEmEdicaoId, setBannerEmEdicaoId] = useState<string | null>(null);

  function handleAdicionarOuEditarBanner() {
    if (!novoBannerTitulo.trim()) {
      alert("Por favor, preencha o título do banner.");
      return;
    }
    const bannersAtuais = homePage?.banners || [];
    if (bannerEmEdicaoId) {
      const atualizados = bannersAtuais.map((b) =>
        b.id === bannerEmEdicaoId
          ? {
              ...b,
              titulo: novoBannerTitulo,
              subtitulo: novoBannerSubtitulo,
              badge: novoBannerBadge,
              imagemUrl: novoBannerImagemUrl || b.imagemUrl,
              linkDestino: novoBannerLink,
            }
          : b
      );
      updateConfig({
        homePage: {
          ...homePage,
          banners: atualizados,
        },
      });
      setBannerEmEdicaoId(null);
    } else {
      const novoId = `banner-${Date.now()}`;
      const novoItem: HomeHeroBanner = {
        id: novoId,
        titulo: novoBannerTitulo,
        subtitulo: novoBannerSubtitulo,
        badge: novoBannerBadge || "DESTAQUE",
        imagemUrl:
          novoBannerImagemUrl ||
          "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop&q=80",
        linkDestino: novoBannerLink || "/app",
        prioridade: bannersAtuais.length + 1,
        ativo: true,
      };
      updateConfig({
        homePage: {
          ...homePage,
          banners: [novoItem, ...bannersAtuais],
        },
      });
    }

    setNovoBannerTitulo("");
    setNovoBannerSubtitulo("");
    setNovoBannerBadge("DESTAQUE");
    setNovoBannerImagemUrl("");
    setNovoBannerLink("/app");
    setAdicionandoBanner(false);
    triggerSaveFeedback();
  }

  function handleIniciarEdicaoBanner(banner: HomeHeroBanner) {
    setBannerEmEdicaoId(banner.id);
    setNovoBannerTitulo(banner.titulo);
    setNovoBannerSubtitulo(banner.subtitulo);
    setNovoBannerBadge(banner.badge);
    setNovoBannerImagemUrl(banner.imagemUrl);
    setNovoBannerLink(banner.linkDestino);
    setAdicionandoBanner(true);
  }

  function handleCancelarEdicaoBanner() {
    setBannerEmEdicaoId(null);
    setNovoBannerTitulo("");
    setNovoBannerSubtitulo("");
    setNovoBannerBadge("DESTAQUE");
    setNovoBannerImagemUrl("");
    setNovoBannerLink("/app");
    setAdicionandoBanner(false);
  }

  function handleExcluirBanner(id: string) {
    if (confirm("Tem certeza que deseja remover este banner do aplicativo?")) {
      const bannersAtuais = homePage?.banners || [];
      const atualizados = bannersAtuais.filter((b) => b.id !== id);
      updateConfig({
        homePage: {
          ...homePage,
          banners: atualizados,
        },
      });
      triggerSaveFeedback();
    }
  }

  function handleToggleBannerAtivo(id: string) {
    const bannersAtuais = homePage?.banners || [];
    const atualizados = bannersAtuais.map((b) =>
      b.id === id ? { ...b, ativo: !b.ativo } : b
    );
    updateConfig({
      homePage: {
        ...homePage,
        banners: atualizados,
      },
    });
    triggerSaveFeedback();
  }

  function handleMoverBanner(idx: number, direcao: "cima" | "baixo") {
    const bannersAtuais = [...(homePage?.banners || [])];
    const targetIdx = direcao === "cima" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= bannersAtuais.length) return;
    const temp = bannersAtuais[idx];
    bannersAtuais[idx] = bannersAtuais[targetIdx];
    bannersAtuais[targetIdx] = temp;
    updateConfig({
      homePage: {
        ...homePage,
        banners: bannersAtuais,
      },
    });
    triggerSaveFeedback();
  }

  async function handleBannerImageUpload(file: File) {
    try {
      setUploadingField("banner_image");
      const url = await uploadAsset(file, "logo");
      if (url) {
        setNovoBannerImagemUrl(url);
      }
    } catch (err: any) {
      alert("Erro ao enviar imagem do banner: " + (err?.message || ""));
    } finally {
      setUploadingField(null);
    }
  }

  // Sub-aba do Módulo Geo, App & Compliance
  const [geoAppSubTab, setGeoAppSubTab] = useState<"stores" | "legal" | "assets">("stores");

  // Live Preview Device Simulator State
  const [previewDevice, setPreviewDevice] = useState<"MOBILE" | "TABLET" | "DESKTOP">("MOBILE");
  const [previewMode, setPreviewMode] = useState<"HOME" | "SPLASH" | "PUSH">("HOME");
  const [previewAberto, setPreviewAberto] = useState(true);

  // Helper de persistência manual / auto
  function triggerSaveFeedback() {
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 2500);
  }

  // 5 Presets Canônicos Solicitados (Azul Tech, Verde, Roxo, Vermelho, Preto Luxo)
  const presets = BRANDING_PRESETS.map((p) => ({
    id: p.id,
    nome: p.name,
    cor: p.previewColors.secondary,
    preset: p,
  }));

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-24">
      {/* 1. TOP BAR DA PLATAFORMA WHITE LABEL (LIGHT THEME) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0088FF] text-white flex items-center justify-center shadow-2xs">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-[#003366]">
                PARTIU White Label Studio OS
              </h1>
              <span className="text-[9px] font-semibold uppercase tracking-wider bg-blue-50 text-[#0088FF] border border-blue-200 px-1.5 py-0.2 rounded-full">
                Enterprise v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Personalização visual, multi-negócio e governança de franquias em tempo real.
            </p>
          </div>
        </div>

        {/* CONTROLES DE TOPO: TENANT, PRESETS E EXPORT/IMPORT */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Franquia / Tenant */}
          {isFranqueado ? (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-[#0088FF]" />
              <span className="text-slate-500">Sua Franquia:</span>
              <span className="font-bold text-slate-800">
                {activeTenant?.cidadeNome || contaAtiva.tenantNome || "Praça Regional"}
              </span>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                Operação Local
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-[#0088FF]" />
                <span className="text-slate-500">Franquia:</span>
                <select
                  value={activeTenant?.tenantId}
                  onChange={(e) => switchTenant(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {allTenants.map((t) => (
                    <option key={t.tenantId} value={t.tenantId} className="bg-white text-slate-800">
                      {t.cidadeNome} ({t.uf}) — {t.nomeOperacao}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botão Clonar Cidade (Super Admin) */}
              <button
                type="button"
                onClick={() => setModalClonarAberto(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer active:scale-95"
              >
                <Copy className="w-3.5 h-3.5 text-[#0088FF]" />
                <span>Clonar Cidade</span>
              </button>
            </>
          )}

          {/* Exportar JSON */}
          <button
            type="button"
            onClick={() => {
              const json = exportThemeJson();
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `partiu-whitelabel-${activeTenant?.cidadeNome || "theme"}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
            title="Exportar Configuração em JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Importar JSON */}
          <button
            type="button"
            onClick={() => {
              setImportErro(null);
              setImportJsonText("");
              setModalImportarAberto(true);
            }}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
            title="Importar Configuração em JSON"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Importar</span>
          </button>

          {/* Reset Defaults */}
          <button
            type="button"
            onClick={() => {
              if (confirm("Deseja restaurar todas as configurações para o padrão canônico do PARTIU?")) {
                resetToDefaults();
                triggerSaveFeedback();
              }
            }}
            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition cursor-pointer"
            title="Restaurar Padrão de Fábrica"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Alternar Preview Lateral */}
          <button
            type="button"
            onClick={() => setPreviewAberto(!previewAberto)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              previewAberto
                ? "bg-[#0088FF] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{previewAberto ? "Ocultar Preview" : "Ver Simulador"}</span>
          </button>
        </div>
      </header>

      {/* 2. BARRA DE PRESETS RÁPIDOS DE MARCAS CONSAGRADAS */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 shrink-0">
          Presets 1-Click:
        </span>
        <div className="flex items-center gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={async () => {
                applyPreset(p.id);
                await applySaasPreset(p.id);
                triggerSaveFeedback();
              }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 transition cursor-pointer shrink-0"
            >
              <span
                className="w-2.5 h-2.5 rounded-full ring-1 ring-slate-300"
                style={{ backgroundColor: p.cor }}
              />
              <span>{p.nome}</span>
            </button>
          ))}
        </div>
        {salvoFeedback && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-[#22C55E] font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Aplicado e salvo em tempo real!</span>
          </div>
        )}
      </div>

      {/* 3. LAYOUT PRINCIPAL: STUDIO COM SEPARAÇÃO EXPLÍCITA DE ESCOPO */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* BANNER DE SEPARAÇÃO E ESCOPO: SUPER ADMIN VS FRANQUEADO */}
        {isFranqueado ? (
          <div className="bg-gradient-to-r from-indigo-50/90 via-white to-slate-50 border border-indigo-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Ambiente do Franqueado: {activeTenant?.cidadeNome || contaAtiva.tenantNome || "Sua Praça"}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Escopo Exclusivo da Franquia Local
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-2xl">
                  Você está customizando o <strong>aplicativo próprio da sua cidade</strong>. As alterações de cores, logotipos, banners e ícones afetam <strong>exclusivamente a sua operação local</strong>. O aplicativo da Matriz e das demais cidades permanecem inalterados.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <div className="px-3.5 py-1.5 rounded-xl bg-indigo-100/70 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Praça Isolada: {activeTenant?.cidadeNome || "Local"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-50/90 via-white to-slate-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Ambiente Super Admin: Matriz Holding &amp; Aplicativo Principal
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    Template Global da Rede • Matriz
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-2xl">
                  Você está no controle da <strong>Matriz Central do PARTIU</strong>. As customizações salvas aqui definem o padrão canônico do Aplicativo Principal. Para auditar ou customizar uma praça de franqueado específica, use o seletor de franquia no topo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Praça Ativa: {activeTenant?.cidadeNome || "Matriz"}</span>
              </div>
            </div>
          </div>
        )}

        {/* CONTAINER DUAS COLUNAS: STUDIO + SIMULADOR */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* COLUNA ESQUERDA: NAVEGAÇÃO POR ABAS + FORMULÁRIOS DO STUDIO */}
          <div className={`w-full ${previewAberto ? "lg:w-7/12 xl:w-2/3" : "w-full"} space-y-6`}>
            {/* NAVEGAÇÃO POR ABAS COMPACTA */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("brand")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "brand"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1. Marca &amp; Logos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("design")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "design"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>2. Paleta &amp; Cores</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("banners")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "banners"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Image className="w-3.5 h-3.5 text-primary" />
                <span>3. Banners do App</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Novo
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("geo_app")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "geo_app"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>4. App &amp; APK (PWA)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("home")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "home"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>5. Home &amp; Blocos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("typography")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "typography"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>6. Tipografia</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("landing")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "landing"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>7. Landing Page</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("monetization")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "monetization"
                    ? "bg-[#003366] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>8. Planos SaaS</span>
              </button>
            </div>

          {/* ================================================================= */}
          {/* TAB 1: BRAND CENTER */}
          {/* ================================================================= */}
          {activeTab === "brand" && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#0088FF]" />
                  Módulo 1: Identidade da Marca &amp; Logos
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Nomes, slogans, logotipos SVG/PNG, favicons e informações institucionais sem mexer em código.
                </p>
              </div>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nome da Plataforma / App
                  </label>
                  <input
                    type="text"
                    value={brand?.nomePlataforma || ""}
                    onChange={(e) => {
                      updateConfig({
                        brandCenter: { ...brand, nomePlataforma: e.target.value },
                      });
                      triggerSaveFeedback();
                    }}
                    placeholder="ex: PARTIU MOBE"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Slogan Principal da Cidade / Franquia
                  </label>
                  <input
                    type="text"
                    value={brand?.slogan || ""}
                    onChange={(e) => {
                      updateConfig({
                        brandCenter: { ...brand, slogan: e.target.value },
                      });
                      triggerSaveFeedback();
                    }}
                    placeholder="ex: Mobilidade Inteligente para sua Cidade"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descrição Institucional da Operação
                </label>
                <textarea
                  rows={2}
                  value={brand?.descricaoInstitucional || ""}
                  onChange={(e) => {
                    updateConfig({
                      brandCenter: { ...brand, descricaoInstitucional: e.target.value },
                    });
                    triggerSaveFeedback();
                  }}
                  placeholder="Descrição da empresa para telas institucionais e metatags..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl p-3 text-xs text-slate-800 outline-none transition font-sans"
                />
              </div>

              {/* Logotipos */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#003366]">
                  Logotipos &amp; Recursos de Mídia (Supabase Storage)
                </h3>

                {uploadError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload Cards com Preview ao Vivo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Upload Logo Principal */}
                  <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col items-center text-center space-y-3">
                    <span className="text-xs font-bold text-slate-700">Logo Principal</span>
                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-2 overflow-hidden">
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
                          if (file) handleFileUpload(file, "logo");
                        }}
                      />
                      <span className="inline-flex items-center justify-center gap-1.5 w-full bg-[#0088FF] hover:bg-blue-600 text-white font-bold text-xs py-2 px-3 rounded-xl transition shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingField === "logo" ? "Enviando..." : "Upload Logo (<5MB)"}</span>
                      </span>
                    </label>
                  </div>

                  {/* Upload Splash Logo */}
                  <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col items-center text-center space-y-3">
                    <span className="text-xs font-bold text-slate-700">Logo Splash Screen</span>
                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-2 overflow-hidden">
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
                          if (file) handleFileUpload(file, "splash");
                        }}
                      />
                      <span className="inline-flex items-center justify-center gap-1.5 w-full bg-[#0088FF] hover:bg-blue-600 text-white font-bold text-xs py-2 px-3 rounded-xl transition shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingField === "splash" ? "Enviando..." : "Upload Splash (<5MB)"}</span>
                      </span>
                    </label>
                  </div>

                  {/* Upload Favicon */}
                  <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col items-center text-center space-y-3">
                    <span className="text-xs font-bold text-slate-700">Favicon do Navegador</span>
                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-2 overflow-hidden">
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
                          if (file) handleFileUpload(file, "favicon");
                        }}
                      />
                      <span className="inline-flex items-center justify-center gap-1.5 w-full bg-[#0088FF] hover:bg-blue-600 text-white font-bold text-xs py-2 px-3 rounded-xl transition shadow-2xs cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingField === "favicon" ? "Enviando..." : "Upload Favicon (<5MB)"}</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Módulo Especial: Centro de Personalização do Favicon da Aba do Navegador */}
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0088FF] border border-blue-200 flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#003366]">
                          Ícone da Aba do Navegador (Favicon em Tempo Real)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Personalize o ícone exibido na aba do navegador do passageiro e motorista. Sincronização instantânea.
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200 w-fit">
                      {(brand?.favicons?.faviconDesktopUrl || branding?.favicon_url || "").startsWith("data:image/svg")
                        ? "✨ SVG Vetorial Dinâmico"
                        : "🖼️ Imagem Personalizada"}
                    </span>
                  </div>

                  {/* Simulador da Aba do Navegador */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                      <span>Simulação da Aba no Navegador:</span>
                      <span className="text-[10px] text-slate-400 font-mono">16x16 / 32x32 SVG Multi-DPI</span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-2 border border-slate-200">
                      {/* Pontos de controle da janela */}
                      <div className="flex items-center gap-1.5 px-1 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>

                      {/* Aba Ativa */}
                      <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-md max-w-sm truncate shadow-2xs">
                        <div className="w-4 h-4 rounded-xs shrink-0 overflow-hidden flex items-center justify-center bg-slate-50">
                          {brand?.favicons?.faviconDesktopUrl || branding?.favicon_url ? (
                            <img
                              src={brand?.favicons?.faviconDesktopUrl || branding?.favicon_url || ""}
                              alt="Aba Favicon"
                              className="w-4 h-4 object-contain"
                            />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-[#0088FF]" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {brand?.nomePlataforma || branding?.app_name || "PARTIU"} — {brand?.slogan || "Mobilidade Inteligente"}
                        </span>
                        <span className="text-slate-400 hover:text-slate-600 text-xs ml-auto cursor-default">×</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações Rápidas do Favicon */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleGerarFaviconDaPaleta}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0088FF] hover:bg-blue-600 text-white text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gerar da Cor da Marca ({(brand as any)?.designSystem?.paletaPrimaria?.corPrincipal || branding?.primary_color || "#FF6B00"})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTestarFaviconAba}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition border border-slate-200 cursor-pointer active:scale-95"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#0088FF]" />
                      <span>Testar na Aba do Navegador Agora</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyCustomFavicon("/favicon.svg")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium transition border border-slate-200 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>Restaurar Padrão</span>
                    </button>
                  </div>

                  {faviconTestFeedback && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Favicon atualizado com sucesso na aba do seu navegador em tempo real!
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
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
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
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
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Favicon Desktop / Aba (URL direta ou Data URI)
                    </label>
                    <input
                      type="text"
                      value={brand?.favicons?.faviconDesktopUrl || branding?.favicon_url || ""}
                      placeholder="https://... ou /favicon.svg ou data:image/svg+xml,..."
                      onChange={(e) => {
                        handleApplyCustomFavicon(e.target.value);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
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
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
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
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
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
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Suporte e Contato */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#003366]">
                  Canais de Atendimento ao Usuário
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      E-mail Oficial
                    </label>
                    <input
                      type="email"
                      value={brand?.emailContato || ""}
                      onChange={(e) => {
                        updateConfig({
                          brandCenter: { ...brand, emailContato: e.target.value },
                        });
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Telefone / 0800
                    </label>
                    <input
                      type="text"
                      value={brand?.telefoneSuporte || ""}
                      onChange={(e) => {
                        updateConfig({
                          brandCenter: { ...brand, telefoneSuporte: e.target.value },
                        });
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      WhatsApp de Suporte
                    </label>
                    <input
                      type="text"
                      value={brand?.whatsappSuporte || ""}
                      onChange={(e) => {
                        updateConfig({
                          brandCenter: { ...brand, whatsappSuporte: e.target.value },
                        });
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: DESIGN SYSTEM & CORES */}
          {/* ================================================================= */}
          {activeTab === "design" && (
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
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#003366]">
                    Paleta de Cores da Marca &amp; Aplicação In-App
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Clique no círculo para escolher no seletor ou digite o código HEX
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Cor Primária */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Cor Primária (Brand)
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={designSystem?.paletaPrimaria?.corPrincipal || "#0088FF"}
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
                          triggerSaveFeedback();
                        }}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
                      />
                      <input
                        type="text"
                        value={designSystem?.paletaPrimaria?.corPrincipal || "#0088FF"}
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
                          triggerSaveFeedback();
                        }}
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Cor Primária Hover */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Cor Primária (Hover / Active)
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={designSystem?.paletaPrimaria?.corPrincipalHover || "#006ACC"}
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
                          triggerSaveFeedback();
                        }}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
                      />
                      <input
                        type="text"
                        value={designSystem?.paletaPrimaria?.corPrincipalHover || "#006ACC"}
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
                          triggerSaveFeedback();
                        }}
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Cor Secundária */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Cor Secundária (Acentos)
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={designSystem?.paletaPrimaria?.corSecundaria || "#00C6FF"}
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
                          triggerSaveFeedback();
                        }}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
                      />
                      <input
                        type="text"
                        value={designSystem?.paletaPrimaria?.corSecundaria || "#00C6FF"}
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
                          triggerSaveFeedback();
                        }}
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Cor Accent / Destaque (--brand-accent) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Cor Accent / Destaque (--brand-accent)
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={designSystem?.paletaPrimaria?.corTerciaria || "#00C6FF"}
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
                          triggerSaveFeedback();
                        }}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
                      />
                      <input
                        type="text"
                        value={designSystem?.paletaPrimaria?.corTerciaria || "#00C6FF"}
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
                          triggerSaveFeedback();
                        }}
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Cor de Texto Principal */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Texto Sobre Primária
                    </label>
                    <div className="flex items-center gap-2.5">
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
                          triggerSaveFeedback();
                        }}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
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
                          triggerSaveFeedback();
                        }}
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Cor Fundo do App */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Fundo das Páginas
                    </label>
                    <div className="flex items-center gap-2.5">
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
                          triggerSaveFeedback();
                        }}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
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
                          triggerSaveFeedback();
                        }}
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Superfície Cards */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Superfície dos Cards
                    </label>
                    <div className="flex items-center gap-2.5">
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
                          triggerSaveFeedback();
                        }}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
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
                          triggerSaveFeedback();
                        }}
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Gradiente do Cabeçalho (Início) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Cabeçalho Curvo (Início Gradiente)
                    </label>
                    <div className="flex items-center gap-2.5">
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
                          triggerSaveFeedback();
                        }}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
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
                          triggerSaveFeedback();
                        }}
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Gradiente do Cabeçalho (Fim) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Cabeçalho Curvo (Fim Gradiente)
                    </label>
                    <div className="flex items-center gap-2.5">
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
                          triggerSaveFeedback();
                        }}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
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
                          triggerSaveFeedback();
                        }}
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition"
                      />
                    </div>
                  </div>

                  {/* ============================================================= */}
                  {/* SINCRONIZAÇÃO E CUSTOMIZAÇÃO DO RODAPÉ (FOOTER BRANDING)      */}
                  {/* ============================================================= */}
                  <div className="col-span-full p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            Cor do Rodapé (Navegação Inferior)
                          </span>
                          {branding?.footer_sync_with_header !== false ? (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <Link2 className="w-3 h-3" /> Sincronizado com Cabeçalho
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Unlink className="w-3 h-3" /> Customização Separada
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
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
                          triggerSaveFeedback();
                        }}
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
                          branding?.footer_sync_with_header !== false
                            ? "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-[#0088FF] hover:bg-blue-600 text-white shadow-xs"
                        }`}
                      >
                        {branding?.footer_sync_with_header !== false ? (
                          <>
                            <Sliders className="w-3.5 h-3.5 text-[#0088FF]" />
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
                      <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Rodapé (Início Gradiente)
                          </label>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="color"
                              value={branding?.footer_gradient_start || branding?.header_gradient_start || "#0088FF"}
                              onChange={(e) => {
                                updateBranding({ footer_gradient_start: e.target.value });
                                triggerSaveFeedback();
                              }}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white shrink-0"
                            />
                            <input
                              type="text"
                              value={branding?.footer_gradient_start || branding?.header_gradient_start || "#0088FF"}
                              onChange={(e) => {
                                updateBranding({ footer_gradient_start: e.target.value });
                                triggerSaveFeedback();
                              }}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono outline-none"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Rodapé (Fim Gradiente)
                          </label>
                          <div className="flex items-center gap-2.5">
                            <input
                              type="color"
                              value={branding?.footer_gradient_end || branding?.header_gradient_end || "#003366"}
                              onChange={(e) => {
                                updateBranding({ footer_gradient_end: e.target.value });
                                triggerSaveFeedback();
                              }}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white shrink-0"
                            />
                            <input
                              type="text"
                              value={branding?.footer_gradient_end || branding?.header_gradient_end || "#003366"}
                              onChange={(e) => {
                                updateBranding({ footer_gradient_end: e.target.value });
                                triggerSaveFeedback();
                              }}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cor de Destaque / Acentos */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Cor de Destaque (Accent / Cyan)
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={branding?.accent_color || "#00C6FF"}
                        onChange={(e) => {
                          updateBranding({ accent_color: e.target.value });
                          triggerSaveFeedback();
                        }}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
                      />
                      <input
                        type="text"
                        value={branding?.accent_color || "#00C6FF"}
                        onChange={(e) => {
                          updateBranding({ accent_color: e.target.value });
                          triggerSaveFeedback();
                        }}
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Botão de Ação: Salvar e Sincronizar em Tempo Real no Supabase */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-slate-600 font-medium">
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
                      triggerSaveFeedback();
                    }}
                    className="flex items-center gap-2 bg-[#0088FF] hover:bg-blue-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar e Aplicar Imediatamente (Realtime)</span>
                  </button>
                </div>
              </div>

              {/* Raio das Bordas e Sombras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
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
                      triggerSaveFeedback();
                    }}
                    className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 cursor-pointer outline-none transition"
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

                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
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
                      triggerSaveFeedback();
                    }}
                    className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 cursor-pointer outline-none transition"
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
          )}

          {/* ================================================================= */}
          {/* TAB 3: BANNERS DO APLICATIVO (CARROSSEL HOME) */}
          {/* ================================================================= */}
          {activeTab === "banners" && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
              {/* Header do Módulo com Identificação de Escopo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                      <Image className="w-5 h-5 text-[#0088FF]" />
                      Banners Promocionais &amp; Comunicação In-App
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      Home Carrossel
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Configure os banners em destaque exibidos no topo da tela inicial do passageiro e motorista. Promoções de desconto, aviso de campanhas e novas modalidades.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (adicionandoBanner) {
                        handleCancelarEdicaoBanner();
                      } else {
                        setAdicionandoBanner(true);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs ${
                      adicionandoBanner
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        : "bg-[#0088FF] hover:bg-blue-600 text-white"
                    }`}
                  >
                    {adicionandoBanner ? (
                      <>
                        <span>Fechar Formulário</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Novo Banner</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Scope Notice Específico do Módulo */}
              <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                isFranqueado
                  ? "bg-indigo-50/70 border-indigo-200/80 text-indigo-950"
                  : "bg-amber-50/70 border-amber-200/80 text-amber-950"
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${isFranqueado ? "bg-indigo-600" : "bg-amber-600"} animate-pulse`} />
                  <span>
                    <strong>Escopo Atual:</strong>{" "}
                    {isFranqueado
                      ? `Exclusivo para a Praça Local: ${activeTenant?.cidadeNome || contaAtiva.tenantNome || "Sua Cidade"}. Não altera outras franquias nem a Matriz.`
                      : "Template Global da Matriz: Serve de padrão para o Aplicativo Principal e novos franqueados."}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-75">
                  {(homePage?.banners || []).length} banners no catálogo
                </span>
              </div>

              {/* Configurações Globais do Carrossel (Compacto) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#0088FF]" />
                    <span className="text-xs font-bold text-slate-800">
                      Comportamento de Reprodução do Carrossel
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Sincronizado automaticamente com o App
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Autoplay Toggle */}
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Rotação Automática</span>
                      <span className="text-[10px] text-slate-500">Avança sem toque do usuário</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const atual = homePage?.carrosselConfig?.autoplay ?? true;
                        updateConfig({
                          homePage: {
                            ...homePage,
                            carrosselConfig: {
                              ...(homePage?.carrosselConfig || {
                                velocidadeSegundos: 4,
                                loopInfinito: true,
                                quantidadeCardsVisiveis: 1,
                              }),
                              autoplay: !atual,
                            },
                          },
                        });
                        triggerSaveFeedback();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        homePage?.carrosselConfig?.autoplay !== false
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {homePage?.carrosselConfig?.autoplay !== false ? "Ativado" : "Pausado"}
                    </button>
                  </div>

                  {/* Velocidade de Rotação */}
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Tempo por Slide</span>
                      <span className="text-[10px] text-slate-500">Duração de cada banner</span>
                    </div>
                    <select
                      value={homePage?.carrosselConfig?.velocidadeSegundos || 4}
                      onChange={(e) => {
                        updateConfig({
                          homePage: {
                            ...homePage,
                            carrosselConfig: {
                              ...(homePage?.carrosselConfig || {
                                autoplay: true,
                                loopInfinito: true,
                                quantidadeCardsVisiveis: 1,
                              }),
                              velocidadeSegundos: Number(e.target.value),
                            },
                          },
                        });
                        triggerSaveFeedback();
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="3">3 segundos</option>
                      <option value="4">4 segundos (Ideal)</option>
                      <option value="5">5 segundos</option>
                      <option value="7">7 segundos</option>
                    </select>
                  </div>

                  {/* Loop Infinito */}
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Loop Infinito</span>
                      <span className="text-[10px] text-slate-500">Retorna ao 1º após o último</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const atual = homePage?.carrosselConfig?.loopInfinito ?? true;
                        updateConfig({
                          homePage: {
                            ...homePage,
                            carrosselConfig: {
                              ...(homePage?.carrosselConfig || {
                                autoplay: true,
                                velocidadeSegundos: 4,
                                quantidadeCardsVisiveis: 1,
                              }),
                              loopInfinito: !atual,
                            },
                          },
                        });
                        triggerSaveFeedback();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        homePage?.carrosselConfig?.loopInfinito !== false
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {homePage?.carrosselConfig?.loopInfinito !== false ? "Sim" : "Não"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Formulário de Adição / Edição de Banner */}
              {adicionandoBanner && (
                <div className="p-5 bg-blue-50/50 border border-blue-200/90 rounded-2xl space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0088FF]" />
                      <h3 className="text-sm font-bold text-[#003366]">
                        {bannerEmEdicaoId ? "Editar Banner Existente" : "Cadastrar Novo Banner no Carrossel"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelarEdicaoBanner}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Título */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Título Principal do Banner *
                      </label>
                      <input
                        type="text"
                        value={novoBannerTitulo}
                        onChange={(e) => setNovoBannerTitulo(e.target.value)}
                        placeholder="ex: Vá de PARTIU Pop com 20% OFF"
                        className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                      />
                    </div>

                    {/* Badge / Tag */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Tag / Badge em Destaque
                      </label>
                      <input
                        type="text"
                        value={novoBannerBadge}
                        onChange={(e) => setNovoBannerBadge(e.target.value.toUpperCase())}
                        placeholder="ex: CORRIDAS COM DESCONTO, NOVIDADE, FLASH"
                        className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition font-semibold"
                      />
                    </div>

                    {/* Subtítulo */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Subtítulo / Mensagem Explicativa
                      </label>
                      <input
                        type="text"
                        value={novoBannerSubtitulo}
                        onChange={(e) => setNovoBannerSubtitulo(e.target.value)}
                        placeholder="ex: Use o cupom PARTIU10 na sua próxima corrida urbana"
                        className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                      />
                    </div>

                    {/* Link de Destino */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Ação ao Clicar (Rota In-App ou URL)
                      </label>
                      <input
                        type="text"
                        value={novoBannerLink}
                        onChange={(e) => setNovoBannerLink(e.target.value)}
                        placeholder="ex: /app, /app/motorista, /app/encomendas"
                        className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition font-mono"
                      />
                    </div>
                  </div>

                  {/* Upload de Imagem e URL */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Imagem de Fundo do Banner (Recomendado: 800×400 px, Proporção 2:1)
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="url"
                        value={novoBannerImagemUrl}
                        onChange={(e) => setNovoBannerImagemUrl(e.target.value)}
                        placeholder="Cole a URL da imagem ou envie um arquivo..."
                        className="flex-1 bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                      />

                      <label className="flex items-center justify-center gap-1.5 bg-[#0088FF] hover:bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingField === "banner_image" ? "Enviando..." : "Upload Imagem"}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleBannerImageUpload(f);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Mini Preview ao Vivo do Banner Sendo Editado */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Pré-visualização do Banner:
                    </span>
                    <div className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-900 text-white min-h-[120px] flex flex-col justify-end p-4 max-w-lg">
                      {novoBannerImagemUrl ? (
                        <img
                          src={novoBannerImagemUrl}
                          alt="Preview do Banner"
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundColor: designSystem?.paletaPrimaria?.corSecundaria || "#00C6FF",
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="relative z-10 space-y-1">
                        {novoBannerBadge && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider bg-amber-400 text-slate-950 uppercase">
                            {novoBannerBadge}
                          </span>
                        )}
                        <h5 className="text-sm font-bold text-white leading-tight">
                          {novoBannerTitulo || "Título de Exemplo do Banner"}
                        </h5>
                        <p className="text-xs text-white/80">
                          {novoBannerSubtitulo || "Subtítulo descritivo com cupom ou chamada para ação..."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação do Form */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-blue-100">
                    <button
                      type="button"
                      onClick={handleCancelarEdicaoBanner}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!novoBannerTitulo.trim()}
                      onClick={handleAdicionarOuEditarBanner}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0088FF] hover:bg-blue-600 text-white disabled:opacity-40 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{bannerEmEdicaoId ? "Salvar Alterações" : "Inserir Banner no App"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Lista dos Banners Cadastrados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Banners Ativos na Fila de Exibição
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Arraste ou use as setas para reordenar a prioridade de rotação
                  </span>
                </div>

                {(!homePage?.banners || homePage.banners.length === 0) ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3 bg-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                      <Image className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Nenhum Banner Cadastrado</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Crie seu primeiro banner promocional para exibir cupons de desconto, parcerias locais ou avisos importantes na tela inicial dos passageiros da sua cidade.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdicionandoBanner(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0088FF] hover:bg-blue-600 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar Primeiro Banner</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {homePage.banners.map((banner, idx, arr) => (
                      <div
                        key={banner.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                          banner.ativo
                            ? "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                            : "bg-slate-50 border-slate-200 opacity-60"
                        }`}
                      >
                        {/* Imagem + Informações */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Miniatura */}
                          <div className="w-20 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                            {banner.imagemUrl ? (
                              <img
                                src={banner.imagemUrl}
                                alt={banner.titulo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-full h-full"
                                style={{
                                  backgroundColor: designSystem?.paletaPrimaria?.corSecundaria || "#00C6FF",
                                }}
                              />
                            )}
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-black/70 text-[9px] font-mono font-bold text-white">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Textos */}
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {banner.badge && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                                  {banner.badge}
                                </span>
                              )}
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {banner.titulo}
                              </h4>
                            </div>
                            {banner.subtitulo && (
                              <p className="text-[11px] text-slate-500 truncate max-w-md">
                                {banner.subtitulo}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span className="flex items-center gap-1">
                                <ExternalLink className="w-2.5 h-2.5" />
                                {banner.linkDestino || "/app"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Controles de Ação */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {/* Toggle Ativo */}
                          <button
                            type="button"
                            onClick={() => handleToggleBannerAtivo(banner.id)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                              banner.ativo
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {banner.ativo ? "Visível no App" : "Oculto"}
                          </button>

                          {/* Reordenar Cima */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoverBanner(idx, "cima")}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 transition cursor-pointer"
                            title="Aumentar prioridade"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Reordenar Baixo */}
                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => handleMoverBanner(idx, "baixo")}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 transition cursor-pointer"
                            title="Diminuir prioridade"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => handleIniciarEdicaoBanner(banner)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#0088FF] transition cursor-pointer"
                            title="Editar este banner"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir */}
                          <button
                            type="button"
                            onClick={() => handleExcluirBanner(banner.id)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition cursor-pointer"
                            title="Excluir banner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: TIPOGRAFIA */}
          {/* ================================================================= */}
          {activeTab === "typography" && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                  <Type className="w-5 h-5 text-[#0088FF]" />
                  Módulo 6: Tipografia &amp; Fontes
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione as fontes do Google Fonts, escala de títulos, entrelinha e pesos de botões.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Família da Fonte Principal
                  </label>
                  <select
                    value={typography?.familiaPrincipal || "Plus Jakarta Sans"}
                    onChange={(e) => {
                      updateConfig({
                        typography: {
                          ...typography,
                          familiaPrincipal: e.target.value as FontFamilyOption,
                        },
                      });
                      triggerSaveFeedback();
                    }}
                    className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3.5 py-2 text-xs text-slate-800 cursor-pointer outline-none transition"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Padrão PARTIU)</option>
                    <option value="Inter">Inter (Estilo Uber)</option>
                    <option value="Poppins">Poppins (Geométrica e Moderna)</option>
                    <option value="Roboto">Roboto (Google Material)</option>
                    <option value="Montserrat">Montserrat (Impacto Comercial)</option>
                    <option value="Nunito">Nunito (Amigável e Arredondada)</option>
                    <option value="Open Sans">Open Sans (Alta Legibilidade)</option>
                  </select>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Família para Títulos &amp; Números
                  </label>
                  <select
                    value={typography?.familiaTitulos || "Plus Jakarta Sans"}
                    onChange={(e) => {
                      updateConfig({
                        typography: {
                          ...typography,
                          familiaTitulos: e.target.value as FontFamilyOption,
                        },
                      });
                      triggerSaveFeedback();
                    }}
                    className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3.5 py-2 text-xs text-slate-800 cursor-pointer outline-none transition"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="Inter">Inter</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Nunito">Nunito</option>
                    <option value="Open Sans">Open Sans</option>
                  </select>
                </div>
              </div>

              {/* Escala de Tamanhos */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#003366]">
                  Escala Tipográfica (Valores em REM)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
                    <span className="text-[11px] text-slate-600 block mb-1 font-bold">Títulos</span>
                    <input
                      type="number"
                      step="0.05"
                      value={typography?.tamanhoTitulosRem || 1.5}
                      onChange={(e) => {
                        updateConfig({
                          typography: {
                            ...typography,
                            tamanhoTitulosRem: parseFloat(e.target.value) || 1.5,
                          },
                        });
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-[#0088FF] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none"
                    />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
                    <span className="text-[11px] text-slate-600 block mb-1 font-bold">Subtítulos</span>
                    <input
                      type="number"
                      step="0.05"
                      value={typography?.tamanhoSubtitulosRem || 1.125}
                      onChange={(e) => {
                        updateConfig({
                          typography: {
                            ...typography,
                            tamanhoSubtitulosRem: parseFloat(e.target.value) || 1.125,
                          },
                        });
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-[#0088FF] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none"
                    />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
                    <span className="text-[11px] text-slate-600 block mb-1 font-bold">Corpo / Base</span>
                    <input
                      type="number"
                      step="0.05"
                      value={typography?.tamanhoTextoBaseRem || 0.875}
                      onChange={(e) => {
                        updateConfig({
                          typography: {
                            ...typography,
                            tamanhoTextoBaseRem: parseFloat(e.target.value) || 0.875,
                          },
                        });
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-slate-200/70 border border-slate-300 focus:border-[#0088FF] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none bg-white"
                    />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
                    <span className="text-[11px] text-slate-600 block mb-1 font-bold">Botões</span>
                    <input
                      type="number"
                      step="0.05"
                      value={typography?.tamanhoBotoesRem || 0.875}
                      onChange={(e) => {
                        updateConfig({
                          typography: {
                            ...typography,
                            tamanhoBotoesRem: parseFloat(e.target.value) || 0.875,
                          },
                        });
                        triggerSaveFeedback();
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-[#0088FF] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: LANDING PAGE BUILDER */}
          {/* ================================================================= */}
          {activeTab === "landing" && (
            <LandingPageEditorTab onDataChange={setLiveLandingData} />
          )}

          {/* ================================================================= */}
          {/* TAB 5: HOME BUILDER */}
          {/* ================================================================= */}
          {activeTab === "home" && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                  <Layout className="w-5 h-5 text-[#0088FF]" />
                  Módulo 5: Estrutura da Home do App
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ordene blocos, ative/desative componentes e configure a experiência da tela inicial.
                </p>
              </div>

              {/* Atalho de Destaque para Banners */}
              <div className="p-4 bg-blue-50/70 border border-blue-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0088FF] flex items-center justify-center shrink-0">
                    <Image className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#003366]">
                      Banners Promocionais &amp; Carrossel da Home
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Os banners rotativos agora possuem um painel dedicado com upload de imagens e controle de autoplay.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("banners")}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0088FF] hover:bg-blue-600 text-white text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
                >
                  Abrir Módulo de Banners →
                </button>
              </div>

              {/* Lista de Blocos Reordenáveis */}
              <div className="space-y-2.5">
                {homePage?.blocos
                  ?.sort((a, b) => a.ordem - b.ordem)
                  ?.map((bloco, idx, arr) => (
                    <div
                      key={bloco.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold flex items-center justify-center shadow-2xs">
                          {bloco.ordem}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {bloco.titulo}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Tipo: {bloco.tipo}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Ativo */}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedBlocos = homePage.blocos.map((b) =>
                              b.id === bloco.id ? { ...b, ativo: !b.ativo } : b
                            );
                            reorderHomeBlocks(updatedBlocos);
                            triggerSaveFeedback();
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                            bloco.ativo
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-slate-200/70 text-slate-500 border border-slate-300"
                          }`}
                        >
                          {bloco.ativo ? "Visível no App" : "Oculto"}
                        </button>

                        {/* Mover para Cima */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            if (idx > 0) {
                              const newArr = [...arr];
                              const prev = newArr[idx - 1];
                              const curr = newArr[idx];
                              if (prev && curr) {
                                const temp = prev.ordem;
                                prev.ordem = curr.ordem;
                                curr.ordem = temp;
                                reorderHomeBlocks(newArr);
                                triggerSaveFeedback();
                              }
                            }
                          }}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 rounded-xl text-slate-600 cursor-pointer transition shadow-2xs"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Mover para Baixo */}
                        <button
                          type="button"
                          disabled={idx === arr.length - 1}
                          onClick={() => {
                            if (idx < arr.length - 1) {
                              const newArr = [...arr];
                              const next = newArr[idx + 1];
                              const curr = newArr[idx];
                              if (next && curr) {
                                const temp = next.ordem;
                                next.ordem = curr.ordem;
                                curr.ordem = temp;
                                reorderHomeBlocks(newArr);
                                triggerSaveFeedback();
                              }
                            }
                          }}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 rounded-xl text-slate-600 cursor-pointer transition shadow-2xs"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: MENU BUILDER */}
          {/* ================================================================= */}
          {activeTab === "menu" && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary-600" />
                  Módulo 5: Menu &amp; Navigation Builder
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adicione, renomeie ou ordene itens no Menu Drawer lateral e abas da barra de navegação inferior.
                </p>
              </div>

              {/* Itens do Drawer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-primary-600">
                    Itens do Menu Drawer Lateral
                  </h3>
                </div>

                <div className="space-y-2">
                  {menuBuilder?.itensDrawer?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">{item.rotulo}</span>
                        <span className="text-slate-400 font-mono">{item.rota}</span>
                        {item.badge && (
                          <span className="bg-primary-600/20 text-primary-500 px-2 py-0.5 rounded text-[10px] font-bold">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = menuBuilder.itensDrawer.map((i) =>
                              i.id === item.id ? { ...i, visivel: !i.visivel } : i
                            );
                            updateConfig({
                              menuBuilder: { ...menuBuilder, itensDrawer: updated },
                            });
                            triggerSaveFeedback();
                          }}
                          className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                            item.visivel
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {item.visivel ? "Ativo" : "Inativo"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 6: BUSINESS MODEL ENGINE (MULTI-NEGÓCIO) */}
          {/* ================================================================= */}
          {activeTab === "business" && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-600" />
                  Módulo 6: Business Model Engine (Multi-Negócio)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Ative ou desative as 11 verticais operacionais da sua plataforma, configure tarifas base e comissões.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {businessModels?.verticais &&
                  Object.values(businessModels.verticais).map((v) => (
                    <div
                      key={v.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        v.ativo
                          ? "bg-slate-900 border-primary-600/40 shadow-sm"
                          : "bg-slate-900/40 border-slate-800 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-primary-600 flex items-center justify-center font-bold text-xs">
                            {v.icone}
                          </div>
                          <div>
                            <span className="text-xs font-black text-white block">
                              {v.nomeExibicao}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {v.descricao}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            toggleBusinessModel(v.id, !v.ativo);
                            triggerSaveFeedback();
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            v.ativo
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {v.ativo ? "Habilitado" : "Desabilitado"}
                        </button>
                      </div>

                      {/* Tarifa Base e Comissão */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-400 block font-medium">Tarifa Base</span>
                          <span className="font-bold text-white font-mono">
                            R$ {v.tarifaBaseBrl.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-emerald-400 block font-medium">Taxa por Corrida</span>
                          <span className="font-bold text-emerald-300 font-mono">
                            0% (Taxa Zero)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 7: PLANOS & MONETIZAÇÃO */}
          {/* ================================================================= */}
          {activeTab === "monetization" && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#0088FF]" />
                  Módulo 8: Planos SaaS &amp; Modelo Taxa Zero
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gerencie os planos de assinatura dos motoristas parceiros (Bronze, Prata, Ouro) com 0% de comissão por corrida.
                </p>
              </div>

              <div className="space-y-3">
                {monetization?.planos?.map((plano) => (
                  <div
                    key={plano.id}
                    className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-4 transition hover:border-slate-300"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900">{plano.nome}</span>
                        <span
                          style={{ backgroundColor: plano.badgeCor }}
                          className="text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs"
                        >
                          {plano.comissaoPercentual === 0 ? "Taxa Zero (0%)" : `${plano.comissaoPercentual}%`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{plano.descricao}</p>
                    </div>

                    <div className="flex items-center gap-5 text-xs font-mono">
                      <div className="text-right sm:text-left">
                        <span className="text-slate-400 block text-[10px] font-sans font-bold">Mensalidade</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          R$ {plano.mensalidadeBrl.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right sm:text-left">
                        <span className="text-slate-400 block text-[10px] font-sans font-bold">Diária</span>
                        <span className="font-bold text-slate-800">
                          R$ {plano.diariaBrl.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right sm:text-left">
                        <span className="text-slate-400 block text-[10px] font-sans font-bold">Prioridade</span>
                        <span className="font-bold text-[#0088FF]">
                          {plano.pesoDespacho}x
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 8/9: GEO, APP STORES, LEGAL LGPD & MOBILE ASSETS */}
          {/* ================================================================= */}
          {activeTab === "geo_app" && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
              {/* Header do Módulo & Seletor de Sub-Abas */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#0088FF]" />
                    Módulo 9: App Center, Compliance LGPD &amp; Mobile Assets
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Geolocalização regional, publicação nas lojas, contratos de compliance e studio de assets nativos.
                  </p>
                </div>

                {/* Sub-Abas */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setGeoAppSubTab("stores")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      geoAppSubTab === "stores"
                        ? "bg-[#003366] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Lojas &amp; Geo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGeoAppSubTab("legal")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      geoAppSubTab === "legal"
                        ? "bg-[#003366] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Jurídico &amp; LGPD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGeoAppSubTab("assets")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      geoAppSubTab === "assets"
                        ? "bg-[#003366] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mobile Assets Studio</span>
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SUB-ABA 1: LOJAS & GEO */}
              {/* ------------------------------------------------------------- */}
              {geoAppSubTab === "stores" && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#003366] mb-3 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#0088FF]" />
                      Geolocalização Operacional &amp; Moeda
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Cidade Sede
                        </label>
                        <input
                          type="text"
                          value={geo?.cidadeSede || ""}
                          onChange={(e) => {
                            updateConfig({
                              geo: { ...geo, cidadeSede: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="Ex: Itaperuna"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Estado (UF)
                        </label>
                        <input
                          type="text"
                          value={geo?.estadoUf || ""}
                          onChange={(e) => {
                            updateConfig({
                              geo: { ...geo, estadoUf: e.target.value.toUpperCase() },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="Ex: RJ"
                          maxLength={2}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Fuso Horário
                        </label>
                        <input
                          type="text"
                          value={geo?.fusoHorario || "America/Sao_Paulo"}
                          onChange={(e) => {
                            updateConfig({
                              geo: { ...geo, fusoHorario: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Moeda Oficial
                        </label>
                        <input
                          type="text"
                          value={`${geo?.moedaSimbolo || "R$"} (${geo?.moedaCodigo || "BRL"})`}
                          disabled
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Raio Padrão de Operação (Km)
                        </label>
                        <input
                          type="number"
                          value={geo?.raioOperacaoPadraoKm || 15}
                          onChange={(e) => {
                            updateConfig({
                              geo: { ...geo, raioOperacaoPadraoKm: Number(e.target.value) || 15 },
                            });
                            triggerSaveFeedback();
                          }}
                          min={1}
                          max={200}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Nome de Exibição do App
                        </label>
                        <input
                          type="text"
                          value={appConfig?.nomeAppExibicao || branding?.app_name || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, nomeAppExibicao: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="Ex: PARTIU Mobilidade"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#003366] mb-3 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#0088FF]" />
                      Identificadores de Publicação &amp; App Stores
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Package Android (Google Play)
                        </label>
                        <input
                          type="text"
                          value={appConfig?.pacoteAndroid || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, pacoteAndroid: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="com.partiumobilidade.app"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none transition"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Identificador exclusivo do app no Google Play Console.
                        </span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Bundle Identifier (Apple iOS)
                        </label>
                        <input
                          type="text"
                          value={appConfig?.bundleIos || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, bundleIos: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="com.partiumobilidade.ios"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none transition"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          ID de aplicativo registrado no Apple Developer Account.
                        </span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Link Google Play Store
                        </label>
                        <input
                          type="url"
                          value={appConfig?.linkGooglePlayStore || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, linkGooglePlayStore: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="https://play.google.com/store/apps/details?id=..."
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Link Apple App Store
                        </label>
                        <input
                          type="url"
                          value={appConfig?.linkAppStoreIos || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, linkAppStoreIos: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="https://apps.apple.com/app/id..."
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Versão Mínima do Aplicativo
                        </label>
                        <input
                          type="text"
                          value={appConfig?.versaoApp || "3.4.0"}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, versaoApp: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="3.4.0"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Dispara aviso de atualização forçada para versões inferiores.
                        </span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Link Central de Ajuda &amp; Suporte
                        </label>
                        <input
                          type="url"
                          value={appConfig?.suporteUrl || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, suporteUrl: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="https://ajuda.partiumobilidade.com.br"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUB-ABA 2: DADOS JURÍDICOS & LGPD */}
              {/* ------------------------------------------------------------- */}
              {geoAppSubTab === "legal" && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#003366] mb-3 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#0088FF]" />
                      Dados Corporativos &amp; Fiscais da Operação
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Razão Social
                        </label>
                        <input
                          type="text"
                          value={appConfig?.razaoSocial || branding?.company_name || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, razaoSocial: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="Ex: Partiu Tecnologia e Mobilidade Ltda"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Nome Fantasia
                        </label>
                        <input
                          type="text"
                          value={appConfig?.nomeFantasia || branding?.app_name || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, nomeFantasia: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="Ex: PARTIU Mobilidade Urbana"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          CNPJ
                        </label>
                        <input
                          type="text"
                          value={appConfig?.cnpj || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, cnpj: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="00.000.000/0001-00"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Inscrição Estadual / Municipal
                        </label>
                        <input
                          type="text"
                          value={appConfig?.inscricaoEstadual || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, inscricaoEstadual: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="Isento ou Nº de Inscrição"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Endereço Completo da Sede
                        </label>
                        <input
                          type="text"
                          value={appConfig?.enderecoSede || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, enderecoSede: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="Rua / Av., Número, Bairro, CEP, Cidade - UF"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#003366] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#0088FF]" />
                        Governança LGPD (Lei Geral de Proteção de Dados - Lei 13.709/2018)
                      </h3>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Art. 41 LGPD
                      </span>
                    </div>

                    <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl mb-4 text-xs text-slate-700 leading-relaxed">
                      <strong>Requisito Legal:</strong> O Encarregado pelo Tratamento de Dados Pessoais (DPO) deve ser identificado no aplicativo com canal direto para solicitações dos titulares (acesso, correção, revogação e exclusão de dados).
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Nome do Encarregado de Dados (DPO)
                        </label>
                        <input
                          type="text"
                          value={appConfig?.dpoNome || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, dpoNome: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="Ex: Jurídico &amp; Privacidade Partiu"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          E-mail do DPO / Canal de Privacidade
                        </label>
                        <input
                          type="email"
                          value={appConfig?.dpoEmail || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, dpoEmail: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="privacidade@partiumobilidade.com.br"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#003366] mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#0088FF]" />
                      Contratos, Políticas &amp; Termos de Adesão
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          URL dos Termos de Uso (Passageiro)
                        </label>
                        <input
                          type="url"
                          value={appConfig?.termosUsoUrl || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, termosUsoUrl: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="https://partiu.com.br/termos"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          URL da Política de Privacidade LGPD
                        </label>
                        <input
                          type="url"
                          value={appConfig?.politicaPrivacidadeLgpdUrl || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, politicaPrivacidadeLgpdUrl: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="https://partiu.com.br/privacidade"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          URL Termo de Adesão do Motorista
                        </label>
                        <input
                          type="url"
                          value={appConfig?.termoMotoristaUrl || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, termoMotoristaUrl: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="https://partiu.com.br/adesao-motorista"
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Minuta Integral: Termos de Uso (Renderizado no App)
                        </label>
                        <textarea
                          rows={4}
                          value={appConfig?.termosUsoTexto || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, termosUsoTexto: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="Cole aqui o texto dos termos de uso da sua franquia para exibição offline ou in-app..."
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl p-3 text-xs text-slate-800 outline-none transition font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Minuta Integral: Política de Privacidade &amp; Tratamento de Dados
                        </label>
                        <textarea
                          rows={4}
                          value={appConfig?.politicaPrivacidadeTexto || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, politicaPrivacidadeTexto: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="Cole aqui a política de privacidade completa para visualização in-app pelo passageiro e motorista..."
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl p-3 text-xs text-slate-800 outline-none transition font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUB-ABA 3: MOBILE ASSET STUDIO */}
              {/* ------------------------------------------------------------- */}
              {geoAppSubTab === "assets" && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. APP LAUNCHER ICON */}
                    <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#0088FF] block">
                            Asset Nativo 1
                          </span>
                          <h4 className="text-sm font-bold text-slate-800">
                            App Launcher Icon (Ícone do App)
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            512 × 512 px PNG sem canal alfa (Google Play &amp; App Store).
                          </p>
                        </div>

                        {/* Preview do Ícone */}
                        <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-md border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {appConfig?.iconeAppUrl || branding?.logo_url ? (
                            <img
                              src={appConfig?.iconeAppUrl || branding?.logo_url || ""}
                              alt="Ícone do App"
                              className="w-full h-full object-contain rounded-xl"
                            />
                          ) : (
                            <Smartphone className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 block">
                          URL da Imagem do Ícone
                        </label>
                        <input
                          type="text"
                          value={appConfig?.iconeAppUrl || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, iconeAppUrl: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="https://..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-2 bg-[#0088FF] hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingField === "app_icon" ? "Enviando..." : "Upload Ícone (512x512)"}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handleFileUpload(f, "app_icon");
                            }}
                          />
                        </label>

                        {branding?.logo_url && (
                          <button
                            type="button"
                            onClick={() => {
                              updateConfig({
                                nativeApp: { ...appConfig, iconeAppUrl: branding.logo_url || "" },
                              });
                              triggerSaveFeedback();
                            }}
                            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Usar Logo da Marca</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. SPLASH SCREEN NATIVA */}
                    <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#0088FF] block">
                            Asset Nativo 2
                          </span>
                          <h4 className="text-sm font-bold text-slate-800">
                            Splash Screen (Tela de Abertura)
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            1080 × 1920 px PNG vertical (Proporção 9:16).
                          </p>
                        </div>

                        {/* Preview Vertical da Splash */}
                        <div
                          style={{
                            backgroundColor: appConfig?.splashBackgroundColor || "#003366",
                          }}
                          className="w-12 h-20 rounded-xl p-1 shadow-md border border-slate-300 flex items-center justify-center shrink-0 overflow-hidden"
                        >
                          {appConfig?.splashAndroidUrl || brand?.splash?.splashAndroidUrl || branding?.splash_logo_url ? (
                            <img
                              src={appConfig?.splashAndroidUrl || brand?.splash?.splashAndroidUrl || branding?.splash_logo_url || ""}
                              alt="Splash Preview"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[8px] font-black text-white/80">SPLASH</span>
                          )}
                        </div>
                      </div>

                      {/* Seletor de Cor de Fundo da Splash */}
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Cor de Fundo da Splash Screen
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={appConfig?.splashBackgroundColor || "#003366"}
                            onChange={(e) => {
                              updateConfig({
                                nativeApp: { ...appConfig, splashBackgroundColor: e.target.value },
                              });
                              triggerSaveFeedback();
                            }}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                          />
                          <input
                            type="text"
                            value={appConfig?.splashBackgroundColor || "#003366"}
                            onChange={(e) => {
                              updateConfig({
                                nativeApp: { ...appConfig, splashBackgroundColor: e.target.value },
                              });
                              triggerSaveFeedback();
                            }}
                            className="w-24 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none"
                          />

                          {/* Quick Swatches */}
                          <div className="flex items-center gap-1.5 ml-auto">
                            {["#003366", "#0088FF", "#0F172A", "#000000", "#FFFFFF"].map((cor) => (
                              <button
                                key={cor}
                                type="button"
                                onClick={() => {
                                  updateConfig({
                                    nativeApp: { ...appConfig, splashBackgroundColor: cor },
                                  });
                                  triggerSaveFeedback();
                                }}
                                style={{ backgroundColor: cor }}
                                className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition cursor-pointer shadow-2xs"
                                title={cor}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 block">
                          URL da Imagem de Splash
                        </label>
                        <input
                          type="text"
                          value={appConfig?.splashAndroidUrl || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: {
                                ...appConfig,
                                splashAndroidUrl: e.target.value,
                                splashIosUrl: e.target.value,
                              },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="https://..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-2 bg-[#0088FF] hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingField === "splash" ? "Enviando..." : "Upload Splash (1080x1920)"}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handleFileUpload(f, "splash");
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setPreviewMode("SPLASH")}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0088FF]" />
                          <span>Ver no Simulador</span>
                        </button>
                      </div>
                    </div>

                    {/* 3. ÍCONE DE PUSH NOTIFICATION MONOCROMÁTICO */}
                    <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#0088FF] block">
                            Asset Nativo 3
                          </span>
                          <h4 className="text-sm font-bold text-slate-800">
                            Push Notification Icon (Status Bar)
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            96 × 96 px PNG Monocromático (Silhueta Branca com Canal Alfa Transparente).
                          </p>
                        </div>

                        {/* Preview do Ícone de Push em Fundo Escuro */}
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 p-2 shadow-md border border-slate-700 flex items-center justify-center shrink-0">
                          {appConfig?.iconeNotificacaoPushUrl ? (
                            <img
                              src={appConfig.iconeNotificacaoPushUrl}
                              alt="Ícone Push"
                              className="w-8 h-8 object-contain filter invert contrast-200"
                            />
                          ) : (
                            <Bell className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                        ⚠️ <strong>Diretriz Técnica Android:</strong> Ícones coloridos são renderizados como quadrados brancos no Android 5.0+. Use uma silhueta branca sobre fundo totalmente transparente.
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 block">
                          URL do Ícone de Push
                        </label>
                        <input
                          type="text"
                          value={appConfig?.iconeNotificacaoPushUrl || ""}
                          onChange={(e) => {
                            updateConfig({
                              nativeApp: { ...appConfig, iconeNotificacaoPushUrl: e.target.value },
                            });
                            triggerSaveFeedback();
                          }}
                          placeholder="https://..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-2 bg-[#0088FF] hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingField === "push_icon" ? "Enviando..." : "Upload Push Icon (96x96)"}</span>
                          <input
                            type="file"
                            accept="image/png"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handleFileUpload(f, "push_icon");
                            }}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setPreviewMode("PUSH")}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0088FF]" />
                          <span>Simular no Lockscreen</span>
                        </button>
                      </div>
                    </div>

                    {/* 4. FAVICONS & METADADOS WEB/PWA */}
                    <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#0088FF] block">
                            Asset Web / PWA
                          </span>
                          <h4 className="text-sm font-bold text-slate-800">
                            Favicons Web &amp; PWA Manifest
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Ícone da aba do navegador e atalho na tela inicial do Chrome/Safari.
                          </p>
                        </div>

                        {/* Preview Favicon */}
                        <div className="w-12 h-12 rounded-xl bg-white p-2 shadow-md border border-slate-200 flex items-center justify-center shrink-0">
                          <img
                            src={brand?.favicons?.faviconDesktopUrl || branding?.favicon_url || "/favicon.svg"}
                            alt="Favicon"
                            className="w-7 h-7 object-contain"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Favicon Atual
                        </label>
                        <input
                          type="text"
                          value={brand?.favicons?.faviconDesktopUrl || branding?.favicon_url || "/favicon.svg"}
                          disabled
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed font-mono truncate"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleGerarFaviconDaPaleta}
                          className="flex items-center gap-1.5 bg-[#0088FF] hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gerar da Paleta</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleTestarFaviconAba}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Testar nesta Aba</span>
                        </button>
                      </div>

                      {faviconTestFeedback && (
                        <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Favicon injetado dinamicamente na aba do navegador!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* COLUNA DIREITA: LIVE DEVICE PREVIEW (SIMULADOR RESPONSIVO) */}
        {/* =================================================================== */}
        {previewAberto && (
          <aside className="w-full lg:w-5/12 xl:w-1/3 sticky top-20 z-30">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-4">
              {/* Controles do Simulador */}
              <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SmartphoneNfc className="w-4 h-4 text-[#0088FF]" />
                    <span className="text-xs font-bold text-slate-800">Live Device Preview</span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("MOBILE")}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        previewDevice === "MOBILE"
                          ? "bg-[#0088FF] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="Simular Mobile (360px)"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewDevice("TABLET")}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        previewDevice === "TABLET"
                          ? "bg-[#0088FF] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="Simular Tablet (440px)"
                    >
                      <Tablet className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewDevice("DESKTOP")}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        previewDevice === "DESKTOP"
                          ? "bg-[#0088FF] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="Simular Desktop"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Seletor de Modo de Exibição */}
                {activeTab !== "landing" && (
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("HOME")}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        previewMode === "HOME"
                          ? "bg-[#003366] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>App Home</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewMode("SPLASH")}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        previewMode === "SPLASH"
                          ? "bg-[#003366] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Rocket className="w-3 h-3" />
                      <span>Splash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewMode("PUSH")}
                      className={`py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        previewMode === "PUSH"
                          ? "bg-[#003366] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Bell className="w-3 h-3" />
                      <span>Push</span>
                    </button>
                  </div>
                )}
              </div>

              {/* MOLDURA DO DISPOSITIVO */}
              <div className="w-full flex justify-center py-2">
                <div
                  style={{
                    width:
                      previewDevice === "MOBILE"
                        ? "360px"
                        : previewDevice === "TABLET"
                        ? "440px"
                        : "100%",
                    fontFamily: typography?.familiaPrincipal || "Plus Jakarta Sans",
                  }}
                  className="rounded-[36px] border-4 border-slate-800 bg-white text-slate-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 min-h-[580px]"
                >
                  {activeTab === "landing" ? (
                    <div className="flex-1 overflow-y-auto max-h-[640px] bg-slate-950 flex flex-col">
                      <div className="bg-slate-950 text-white px-5 py-2 text-[11px] font-bold flex items-center justify-between border-b border-slate-800 shrink-0">
                        <span>9:41</span>
                        <div className="w-16 h-3.5 bg-slate-800 rounded-full mx-auto" />
                        <span>5G 100%</span>
                      </div>
                      <div className="w-full flex-1">
                        <MobilityLandingPage
                          initialData={liveLandingData || undefined}
                          showCustomizer={false}
                        />
                      </div>
                    </div>
                  ) : previewMode === "SPLASH" ? (
                    <div
                      style={{
                        backgroundColor: appConfig?.splashBackgroundColor || "#003366",
                      }}
                      className="flex-1 flex flex-col items-center justify-between p-6 text-white min-h-[580px] transition-colors duration-300"
                    >
                      {/* Status bar */}
                      <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-80 shrink-0">
                        <span>9:41</span>
                        <div className="w-16 h-3 bg-white/20 rounded-full mx-auto" />
                        <span>5G 100%</span>
                      </div>

                      {/* Conteúdo Central */}
                      <div className="flex flex-col items-center text-center space-y-4 my-auto">
                        <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md p-3 ring-2 ring-white/30 shadow-2xl flex items-center justify-center">
                          {appConfig?.splashAndroidUrl || brand?.splash?.splashAndroidUrl || branding?.splash_logo_url || branding?.logo_url ? (
                            <img
                              src={appConfig?.splashAndroidUrl || brand?.splash?.splashAndroidUrl || branding?.splash_logo_url || branding?.logo_url || ""}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Sparkles className="w-10 h-10 text-white" />
                          )}
                        </div>

                        <div>
                          <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
                            {appConfig?.nomeAppExibicao || branding?.app_name || brand?.nomePlataforma || "PARTIU"}
                          </h3>
                          <p className="text-xs text-white/80 font-medium max-w-[200px] mt-1">
                            {brand?.slogan || "Mobilidade Inteligente Sob Demanda"}
                          </p>
                        </div>
                      </div>

                      {/* Rodapé Splash */}
                      <div className="flex flex-col items-center space-y-2 shrink-0">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-[10px] font-medium text-white/70">
                          Carregando serviços e praça...
                        </span>
                        <span className="text-[9px] font-mono text-white/50">
                          v{appConfig?.versaoApp || "3.4.0"} • {geo?.cidadeSede || "Itaperuna, RJ"}
                        </span>
                      </div>
                    </div>
                  ) : previewMode === "PUSH" ? (
                    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white min-h-[580px] relative overflow-hidden">
                      {/* Wallpaper radial glow */}
                      <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(circle_at_50%_20%,rgba(0,136,255,0.25),transparent_70%)] pointer-events-none" />

                      {/* Status bar */}
                      <div className="w-full flex items-center justify-between text-[11px] font-bold opacity-80 shrink-0 z-10">
                        <span>9:41</span>
                        <div className="w-16 h-3 bg-white/20 rounded-full mx-auto" />
                        <span>5G 100%</span>
                      </div>

                      {/* Relógio do Lockscreen */}
                      <div className="flex flex-col items-center text-center mt-6 z-10">
                        <span className="text-5xl font-light tracking-tight text-white/95">09:41</span>
                        <span className="text-xs font-medium text-white/70 mt-1">
                          Quarta-feira, 15 de Outubro
                        </span>
                      </div>

                      {/* Card de Notificação Push */}
                      <div className="my-auto z-10">
                        <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-3.5 shadow-2xl text-left space-y-2 animate-in slide-in-from-top-4 duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-md bg-[#0088FF] flex items-center justify-center p-0.5 overflow-hidden shadow-xs">
                                {appConfig?.iconeNotificacaoPushUrl || appConfig?.iconeAppUrl || branding?.logo_url ? (
                                  <img
                                    src={appConfig?.iconeNotificacaoPushUrl || appConfig?.iconeAppUrl || branding?.logo_url || ""}
                                    alt=""
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <Bell className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                                {appConfig?.nomeAppExibicao || branding?.app_name || "PARTIU"}
                              </span>
                            </div>
                            <span className="text-[10px] text-white/60">agora</span>
                          </div>

                          <div>
                            <h5 className="text-xs font-bold text-white">Motorista a caminho! 🚗</h5>
                            <p className="text-[11px] text-white/80 leading-snug mt-0.5">
                              Carlos (Toyota Corolla • ABC-1234) está a 3 minutos do seu local de embarque.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-white/15">
                            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-lg text-white">
                              Abrir App
                            </span>
                            <span className="text-[10px] font-medium text-white/70">
                              Toque para ver a rota no mapa
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Atalhos inferiores do Lockscreen */}
                      <div className="w-full flex items-center justify-between px-4 shrink-0 z-10">
                        <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white/80">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="w-24 h-1 bg-white/40 rounded-full" />
                        <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white/80">
                          <Smartphone className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Status bar simulada */}
                      <div className="bg-slate-950 text-white px-5 py-2 text-[11px] font-bold flex items-center justify-between">
                        <span>9:41</span>
                        <div className="w-16 h-3.5 bg-slate-800 rounded-full mx-auto" />
                        <span>5G 100%</span>
                      </div>

                  {/* Header do App Simulado com Curvatura em Arco Padrão 99 */}
                  <div className="relative w-full h-[74px] overflow-visible bg-slate-100">
                    <svg
                      className="absolute top-0 left-0 w-full h-[74px] pointer-events-auto overflow-visible"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      style={{
                        filter: "drop-shadow(0 6px 12px rgba(0, 51, 102, 0.35))",
                      }}
                    >
                      <defs>
                        <linearGradient id="simHeaderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={branding?.header_gradient_start || "#0088FF"} />
                          <stop offset="100%" stopColor={branding?.header_gradient_end || "#003366"} />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,0 L 100,0 L 100,54 C 74,98 26,98 0,54 Z"
                        fill="url(#simHeaderGradient)"
                      />
                    </svg>
                    <div className="relative z-10 px-4 pt-2.5 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white/20 ring-2 ring-white/80 overflow-hidden flex items-center justify-center font-black text-[10px]">
                          {branding?.logo_url ? (
                            <img src={branding.logo_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            branding?.app_name?.slice(0, 2) || "PA"
                          )}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/80">
                            {branding?.app_name || "PARTIU"}
                          </span>
                          <span className="text-xs font-bold truncate">Olá, Passageiro! 👋</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                        {geo?.cidadeSede || "Itaperuna"}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo Simulado (Home Blocks) */}
                  <div className="flex-1 p-3.5 space-y-3 bg-slate-50 overflow-y-auto max-h-[420px]">
                    {/* Mapa Preview */}
                    <div className="h-28 rounded-2xl bg-slate-200 border border-slate-300 relative overflow-hidden flex items-center justify-center shadow-xs">
                      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] opacity-70" />
                      <div className="relative z-10 text-center">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          📍 {geo?.cidadeSede || "Itaperuna, RJ"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Radar em tempo real ativo
                        </span>
                      </div>
                    </div>

                    {/* Card de Busca */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-700">Para onde vamos hoje?</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-400">
                        Digite seu endereço de destino...
                      </div>
                    </div>

                    {/* Verticais Rápidas */}
                    <div className="grid grid-cols-4 gap-2">
                      {businessModels?.verticais &&
                        Object.values(businessModels.verticais)
                          .filter((v) => v.ativo)
                          .slice(0, 4)
                          .map((v) => (
                            <div
                              key={v.id}
                              className="p-2 bg-white rounded-xl border border-slate-200 text-center shadow-2xs"
                            >
                              <span className="text-xs font-bold text-slate-800 block truncate">
                                {v.nomeExibicao}
                              </span>
                              <span className="text-[9px] text-primary-700 font-bold block">
                                R$ {v.tarifaBaseBrl.toFixed(0)}
                              </span>
                            </div>
                          ))}
                    </div>

                    {/* Banners Reais do App */}
                    {(() => {
                      const bannersAtivos = (homePage?.banners || []).filter((b) => b.ativo);
                      if (bannersAtivos.length === 0) {
                        return (
                          <div className="p-3 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs py-3 bg-white">
                            Nenhum banner ativo configurado
                          </div>
                        );
                      }
                      const bannerDestaque = bannersAtivos[0];
                      return (
                        <div className="space-y-1.5">
                          <div className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 bg-slate-900 text-white min-h-[92px] flex flex-col justify-end p-3">
                            {bannerDestaque.imagemUrl ? (
                              <img
                                src={bannerDestaque.imagemUrl}
                                alt={bannerDestaque.titulo}
                                className="absolute inset-0 w-full h-full object-cover opacity-60"
                              />
                            ) : (
                              <div
                                className="absolute inset-0"
                                style={{
                                  backgroundColor: designSystem?.paletaPrimaria?.corSecundaria || "#00C6FF",
                                }}
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                            <div className="relative z-10 space-y-0.5">
                              {bannerDestaque.badge && (
                                <span className="inline-block px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-wider bg-amber-400 text-slate-950 uppercase">
                                  {bannerDestaque.badge}
                                </span>
                              )}
                              <h6 className="text-[11px] font-bold text-white leading-tight line-clamp-1">
                                {bannerDestaque.titulo}
                              </h6>
                              {bannerDestaque.subtitulo && (
                                <p className="text-[9px] text-white/80 line-clamp-1">
                                  {bannerDestaque.subtitulo}
                                </p>
                              )}
                            </div>
                          </div>
                          {bannersAtivos.length > 1 && (
                            <div className="flex justify-center items-center gap-1">
                              {bannersAtivos.map((b, i) => (
                                <span
                                  key={b.id}
                                  className={`h-1 rounded-full transition-all ${
                                    i === 0 ? "bg-[#0088FF] w-3" : "bg-slate-300 w-1.5"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Barra de Navegação Inferior Simulada (Sincronizada por Padrão ou Customizada) */}
                  {(() => {
                    const isSynced = branding?.footer_sync_with_header !== false;
                    const fStart = isSynced
                      ? (branding?.header_gradient_start || "#0088FF")
                      : (branding?.footer_gradient_start || branding?.header_gradient_start || "#0088FF");
                    const fEnd = isSynced
                      ? (branding?.header_gradient_end || "#003366")
                      : (branding?.footer_gradient_end || branding?.header_gradient_end || "#003366");

                    return (
                      <div
                        style={{
                          background: `linear-gradient(180deg, ${fStart} 0%, ${fEnd} 100%)`,
                          borderTopLeftRadius: "18px",
                          borderTopRightRadius: "18px",
                          boxShadow: "0 -4px 18px rgba(0, 51, 102, 0.35)",
                        }}
                        className="border-t border-white/20 px-4 py-2.5 flex items-center justify-around"
                      >
                        <div
                          style={{
                            backgroundColor: "#FFFFFF",
                            color: fEnd,
                          }}
                          className="px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                        >
                          <Car className="w-3.5 h-3.5" />
                          <span>Corridas</span>
                        </div>

                        <div className="px-3 py-1 text-xs font-bold text-white/80 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" />
                          <span>Entregas</span>
                        </div>
                      </div>
                    );
                  })()}
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>

      {/* MODAL CLONAR FRANQUIA */}
      {modalClonarAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-[#003366] flex items-center gap-2">
              <Copy className="w-5 h-5 text-[#0088FF]" />
              Clonar Franquia com 1-Click
            </h3>
            <p className="text-xs text-slate-500">
              Duplica 100% da configuração visual, comercial e operacional para uma nova cidade.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Nome da Nova Cidade</label>
                <input
                  type="text"
                  placeholder="ex: Campos dos Goytacazes"
                  value={cloneCidadeNome}
                  onChange={(e) => {
                    setCloneCidadeNome(e.target.value);
                    setCloneTenantId(
                      `tenant-${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
                    );
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Estado (UF)</label>
                <input
                  type="text"
                  placeholder="ex: RJ"
                  value={cloneEstadoUf}
                  onChange={(e) => setCloneEstadoUf(e.target.value.toUpperCase())}
                  maxLength={2}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition uppercase"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">ID da Franquia (Slug)</label>
                <input
                  type="text"
                  placeholder="ex: tenant-campos"
                  value={cloneTenantId}
                  onChange={(e) => setCloneTenantId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalClonarAberto(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!cloneCidadeNome || !cloneTenantId}
                onClick={() => {
                  cloneTenant(cloneTenantId, cloneCidadeNome, cloneEstadoUf);
                  switchTenant(cloneTenantId);
                  setModalClonarAberto(false);
                  triggerSaveFeedback();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0088FF] hover:bg-blue-600 text-white disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Criar e Ativar Franquia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPORTAR JSON */}
      {modalImportarAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-[#003366] flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#0088FF]" />
              Importar Configuração JSON White Label
            </h3>
            <p className="text-xs text-slate-500">
              Cole abaixo o payload JSON completo exportado previamente de outra franquia ou ambiente.
            </p>

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='{ "versaoSchema": 1, "brandCenter": { ... } }'
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl p-3 text-xs text-slate-800 font-mono outline-none transition"
            />

            {importErro && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{importErro}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalImportarAberto(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!importJsonText.trim()}
                onClick={() => {
                  const res = importThemeJson(importJsonText);
                  if (res.success) {
                    setModalImportarAberto(false);
                    triggerSaveFeedback();
                  } else {
                    setImportErro(res.error || "Erro ao importar JSON.");
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0088FF] hover:bg-blue-600 text-white disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Validar e Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
