import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";
import { getAdminRole, getContaAtiva, isOwner, isSuperAdmin } from "@/lib/admin-rbac";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useBranding } from "@/hooks/useBranding";
import { BRANDING_PRESETS } from "@/lib/branding";
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
  Building2,
  Copy,
  CheckCircle2,
} from "lucide-react";

import { BrandCenterTab } from "@/components/admin/whitelabel/BrandCenterTab";
import { DesignSystemTab } from "@/components/admin/whitelabel/DesignSystemTab";
import { TypographyTab } from "@/components/admin/whitelabel/TypographyTab";
import { LandingPageEditorTab } from "@/components/admin/whitelabel/LandingPageEditorTab";
import { HomeBuilderTab } from "@/components/admin/whitelabel/HomeBuilderTab";
import { MenuBuilderTab } from "@/components/admin/whitelabel/MenuBuilderTab";
import { BusinessModelsTab } from "@/components/admin/whitelabel/BusinessModelsTab";
import { MonetizationTab } from "@/components/admin/whitelabel/MonetizationTab";
import { GeoAppComplianceTab } from "@/components/admin/whitelabel/GeoAppComplianceTab";
import { DevicePreviewSimulator } from "@/components/admin/whitelabel/DevicePreviewSimulator";
import { CloneTenantModal } from "@/components/admin/whitelabel/CloneTenantModal";
import { ImportThemeModal } from "@/components/admin/whitelabel/ImportThemeModal";

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
  | "typography"
  | "landing"
  | "home"
  | "menu"
  | "business"
  | "monetization"
  | "geo_app";

function WhiteLabelStudioPage() {
  return (
    <GuardiaoAcesso permissao="whitelabel:manage">
      <WhiteLabelStudioContent />
    </GuardiaoAcesso>
  );
}

function WhiteLabelStudioContent() {
  const role = getAdminRole();
  const contaAtiva = getContaAtiva();
  const isFranqueadoRole = role === "FRANQUEADO";
  const usuarioOwner = isSuperAdmin(role) || isOwner(role);

  const {
    activeTenant,
    allTenants,
    switchTenant,
    applyPreset,
    exportThemeJson,
    resetToDefaults,
    corPrimaria,
  } = useBrandTheme();

  const {
    applyPreset: applySaasPreset,
    isSyncing,
  } = useBranding();

  // Franqueado: vincula automaticamente ao seu próprio tenant
  useEffect(() => {
    if (isFranqueadoRole && contaAtiva.tenantId && activeTenant?.tenantId !== contaAtiva.tenantId) {
      switchTenant(contaAtiva.tenantId);
    }
  }, [isFranqueadoRole, contaAtiva.tenantId, activeTenant?.tenantId, switchTenant]);

  const [activeTab, setActiveTab] = useState<ActiveTab>("brand");
  const [liveLandingData, setLiveLandingData] = useState<MobilityLandingPageData | null>(null);
  const [salvoFeedback, setSalvoFeedback] = useState(false);
  const [modalClonarAberto, setModalClonarAberto] = useState(false);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);

  // Live Preview Device Simulator State
  const [previewDevice, setPreviewDevice] = useState<"MOBILE" | "TABLET" | "DESKTOP">("MOBILE");
  const [previewMode, setPreviewMode] = useState<"HOME" | "SPLASH" | "PUSH">("HOME");
  const [previewAberto, setPreviewAberto] = useState(true);

  function triggerSaveFeedback() {
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 2500);
  }

  const presets = BRANDING_PRESETS.map((p) => ({
    id: p.id,
    nome: p.name,
    cor: p.previewColors.secondary,
    preset: p,
  }));

  const primaryColor = corPrimaria || "#FF6B00";

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24">
      {/* 1. TOP BAR DA PLATAFORMA WHITE LABEL (LIGHT/DARK THEME) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-2xs font-black"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
                PARTIU White Label Studio OS
              </h1>
              <span
                className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full border"
                style={{
                  color: primaryColor,
                  borderColor: `${primaryColor}40`,
                  backgroundColor: `${primaryColor}10`,
                }}
              >
                {usuarioOwner ? "Enterprise v1.0 (Owner)" : `Regional (${role})`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Personalização visual, multi-negócio e governança de franquias em tempo real.
            </p>
          </div>
        </div>

        {/* CONTROLES DE TOPO: TENANT, PRESETS E EXPORT/IMPORT */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Indicador de Sincronização em Tempo Real */}
          <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sincronização em Tempo Real
          </span>

          {/* Seletor de Franquia / Tenant */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs shadow-xs">
            <Building2 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span className="text-slate-500 dark:text-slate-400">Franquia:</span>
            {usuarioOwner ? (
              <select
                value={activeTenant?.tenantId}
                onChange={(e) => switchTenant(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                {allTenants.map((t) => (
                  <option key={t.tenantId} value={t.tenantId} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {t.cidadeNome} ({t.uf}) — {t.nomeOperacao}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {activeTenant?.cidadeNome} ({activeTenant?.uf}) — {activeTenant?.nomeOperacao}
              </span>
            )}
          </div>

          {/* Botão Clonar Cidade (Exclusivo SuperAdmin / Owner) */}
          {usuarioOwner && (
            <button
              type="button"
              onClick={() => setModalClonarAberto(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span>Clonar Cidade</span>
            </button>
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
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
            title="Exportar Configuração em JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Importar JSON (Exclusivo SuperAdmin / Owner) */}
          {usuarioOwner && (
            <button
              type="button"
              onClick={() => {
                setModalImportarAberto(true);
              }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
              title="Importar Configuração em JSON"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Importar</span>
            </button>
          )}

          {/* Reset Defaults (Exclusivo SuperAdmin / Owner) */}
          {usuarioOwner && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Deseja restaurar todas as configurações para o padrão canônico do PARTIU?")) {
                  resetToDefaults();
                  triggerSaveFeedback();
                }
              }}
              className="p-1.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 rounded-xl transition cursor-pointer"
              title="Restaurar Padrão de Fábrica"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Feedback de Salvo */}
          {salvoFeedback && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Salvo</span>
            </span>
          )}

          {/* Alternar Preview Mobile */}
          <button
            type="button"
            onClick={() => setPreviewAberto(!previewAberto)}
            style={previewAberto ? { backgroundColor: primaryColor } : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              previewAberto
                ? "text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{previewAberto ? "Ocultar Preview" : "Simulador"}</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-BAR: PALETAS RÁPIDAS (PRESETS PRONTOS) */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Presets Prontos:
          </span>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                applyPreset(p.id);
                void applySaasPreset(p.id);
                triggerSaveFeedback();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer shrink-0"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.cor }} />
              <span>{p.nome}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isSyncing ? (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Sincronizando com a nuvem...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Supabase Cloud Sync Ativo</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. LAYOUT PRINCIPAL: STUDIO (ESQUERDA) + SIMULADOR LIVE PREVIEW (DIREITA) */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* COLUNA ESQUERDA: NAVEGAÇÃO POR ABAS + FORMULÁRIOS DO STUDIO */}
        <div className={`w-full ${previewAberto ? "lg:w-7/12 xl:w-2/3" : "w-full"} space-y-6`}>
          {/* NAVEGAÇÃO POR ABAS */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("brand")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === "brand"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-black shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>1. Brand Center</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("design")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === "design"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-black shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>2. Design System</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("typography")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === "typography"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-black shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Type className="w-4 h-4" />
              <span>3. Tipografia</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("landing")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === "landing"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-black shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>4. Landing Page</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === "home"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-black shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>5. Home Builder</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("menu")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === "menu"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-black shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>6. Menu Builder</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("business")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === "business"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-black shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>7. Multi-Negócio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("monetization")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === "monetization"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-black shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>8. Planos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("geo_app")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === "geo_app"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 font-black shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>9. Geo &amp; App</span>
            </button>
          </div>

          {/* CONTEÚDO DAS ABAS MODULARIZADAS */}
          {activeTab === "brand" && (
            <BrandCenterTab onSaveFeedback={triggerSaveFeedback} />
          )}

          {activeTab === "design" && (
            <DesignSystemTab onSaveFeedback={triggerSaveFeedback} />
          )}

          {activeTab === "typography" && (
            <TypographyTab onSaveFeedback={triggerSaveFeedback} />
          )}

          {activeTab === "landing" && (
            <LandingPageEditorTab onDataChange={setLiveLandingData} />
          )}

          {activeTab === "home" && (
            <HomeBuilderTab onSaveFeedback={triggerSaveFeedback} />
          )}

          {activeTab === "menu" && (
            <MenuBuilderTab onSaveFeedback={triggerSaveFeedback} />
          )}

          {activeTab === "business" && (
            <BusinessModelsTab onSaveFeedback={triggerSaveFeedback} />
          )}

          {activeTab === "monetization" && (
            <MonetizationTab onSaveFeedback={triggerSaveFeedback} />
          )}

          {activeTab === "geo_app" && (
            <GeoAppComplianceTab
              onSaveFeedback={triggerSaveFeedback}
              onRequestSimulatorMode={setPreviewMode}
            />
          )}
        </div>

        {/* COLUNA DIREITA: LIVE DEVICE PREVIEW (SIMULADOR RESPONSIVO) */}
        {previewAberto && (
          <DevicePreviewSimulator
            activeTab={activeTab}
            liveLandingData={liveLandingData}
            previewDevice={previewDevice}
            setPreviewDevice={setPreviewDevice}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
          />
        )}
      </div>

      {/* MODAL CLONAR FRANQUIA */}
      <CloneTenantModal
        isOpen={modalClonarAberto}
        onClose={() => setModalClonarAberto(false)}
        onCloned={triggerSaveFeedback}
      />

      {/* MODAL IMPORTAR JSON */}
      <ImportThemeModal
        isOpen={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
        onImported={triggerSaveFeedback}
      />
    </div>
  );
}
export default WhiteLabelStudioPage;
