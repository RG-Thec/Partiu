import React, { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";
import { getAdminRole, getContaAtiva, isOwner, isSuperAdmin } from "@/lib/admin-rbac";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useBranding } from "@/hooks/useBranding";
import { whiteLabelEngine } from "@/lib/white-label";
import { BRANDING_PRESETS } from "@/lib/branding";
import type { MobilityLandingPageData } from "@/types/mobilityLanding";
import { toast } from "sonner";

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
  ExternalLink,
  ChevronDown,
  Info,
  X,
  Sliders,
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
  validateSearch: (search: Record<string, unknown>): { tenant?: string; tab?: string } => ({
    tenant: typeof search.tenant === "string" ? search.tenant : undefined,
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
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

interface StudioTabItem {
  id: ActiveTab;
  numero: number;
  label: string;
  grupo: "MARCA" | "APP" | "NEGOCIO";
  icone: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

const STUDIO_TABS: StudioTabItem[] = [
  { id: "brand", numero: 1, label: "Brand Center", grupo: "MARCA", icone: Sparkles },
  { id: "design", numero: 2, label: "Design System", grupo: "MARCA", icone: Palette },
  {
    id: "typography",
    numero: 3,
    label: "Tipografia",
    grupo: "MARCA",
    icone: Type,
    superAdminOnly: true,
  },
  {
    id: "home",
    numero: 4,
    label: "Home Builder",
    grupo: "APP",
    icone: Layout,
    superAdminOnly: true,
  },
  {
    id: "menu",
    numero: 5,
    label: "Menu Builder",
    grupo: "APP",
    icone: Compass,
    superAdminOnly: true,
  },
  {
    id: "landing",
    numero: 6,
    label: "Landing Page",
    grupo: "APP",
    icone: Globe,
    superAdminOnly: true,
  },
  { id: "business", numero: 7, label: "Multi-Negócio", grupo: "NEGOCIO", icone: Layers },
  { id: "monetization", numero: 8, label: "Planos & Diárias", grupo: "NEGOCIO", icone: DollarSign },
  { id: "geo_app", numero: 9, label: "Geo & Conformidade", grupo: "NEGOCIO", icone: Globe },
];

function WhiteLabelStudioPage() {
  return (
    <GuardiaoAcesso permissao="whitelabel:manage">
      <WhiteLabelStudioContent />
    </GuardiaoAcesso>
  );
}

function WhiteLabelStudioContent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const role = getAdminRole();
  const contaAtiva = getContaAtiva();
  const isFranqueadoRole = role === "FRANQUEADO";
  const usuarioOwner = isSuperAdmin(role) || isOwner(role);

  const availableTabs = isFranqueadoRole
    ? STUDIO_TABS.filter((t) => !t.superAdminOnly)
    : STUDIO_TABS;

  const {
    activeTenant,
    allTenants,
    switchTenant,
    applyPreset,
    exportThemeJson,
    resetToDefaults,
    corPrimaria,
  } = useBrandTheme();

  const { applyPreset: applySaasPreset, isSyncing } = useBranding();

  const handleSelectTenant = useCallback(
    (newTenantId: string) => {
      switchTenant(newTenantId);
      void navigate({
        search: (prev: any) => ({ ...prev, tenant: newTenantId }),
      });
    },
    [switchTenant, navigate],
  );

  // Carrega catálogo atualizado do Supabase ao abrir o estúdio White Label
  useEffect(() => {
    void whiteLabelEngine.loadTenantsFromSupabase();
  }, []);

  // Super Admin / Matriz
  useEffect(() => {
    if (search.tenant && search.tenant.trim() && activeTenant?.tenantId !== search.tenant.trim()) {
      try {
        switchTenant(search.tenant.trim());
      } catch (err) {
        console.warn("[whitelabel] Erro ao alternar tenant via query param:", err);
      }
    }
  }, [search.tenant, activeTenant?.tenantId, switchTenant]);

  // Franqueado
  useEffect(() => {
    if (isFranqueadoRole && contaAtiva.tenantId && activeTenant?.tenantId !== contaAtiva.tenantId) {
      try {
        switchTenant(contaAtiva.tenantId);
      } catch (err) {
        console.warn("[whitelabel] Erro ao alternar tenant do franqueado:", err);
      }
    }
  }, [isFranqueadoRole, contaAtiva.tenantId, activeTenant?.tenantId, switchTenant]);

  const [activeTab, setActiveTab] = useState<ActiveTab>("brand");
  const [mostrarBannerAjuda, setMostrarBannerAjuda] = useState(false);

  useEffect(() => {
    if (search.tab && availableTabs.some((t) => t.id === search.tab)) {
      setActiveTab(search.tab as ActiveTab);
    }
  }, [search.tab, availableTabs]);

  useEffect(() => {
    if (isFranqueadoRole && !availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab("brand");
    }
  }, [isFranqueadoRole, availableTabs, activeTab]);

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
    <div className="w-full min-h-screen text-slate-100 font-sans pb-24 space-y-4">
      {/* 1. TOOLBAR COMPACTA & CONTROLES EXECUTIVOS DO STUDIO */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Identificação da Praça & Marca */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md font-black shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                White Label Studio OS
              </h1>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                style={{
                  color: primaryColor,
                  borderColor: `${primaryColor}40`,
                  backgroundColor: `${primaryColor}15`,
                }}
              >
                {usuarioOwner ? "Enterprise Matriz" : `Regional (${role})`}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Praça em edição:{" "}
              <strong className="text-white">
                {activeTenant?.nomeOperacao || "App Principal"}
              </strong>{" "}
              ({activeTenant?.cidadeNome || "Nacional"})
            </p>
          </div>
        </div>

        {/* Toolbar de Ações Rápidas em Linha Única */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Franquia */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs shadow-xs">
            <Building2 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            {usuarioOwner ? (
              <select
                value={activeTenant?.tenantId}
                onChange={(e) => handleSelectTenant(e.target.value)}
                className="bg-transparent font-bold text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                {allTenants.map((t) => (
                  <option key={t.tenantId} value={t.tenantId} className="bg-slate-900 text-white">
                    {t.cidadeNome} ({t.uf}) — {t.nomeOperacao}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-200">
                {activeTenant?.cidadeNome} ({activeTenant?.uf})
              </span>
            )}
          </div>

          {/* Testar App */}
          <button
            type="button"
            onClick={() => {
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              const activeTenantId = activeTenant?.tenantId || "default";
              const url =
                activeTenantId !== "default"
                  ? `${origin}/?tenant=${encodeURIComponent(activeTenantId)}`
                  : `${origin}/`;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
            title="Abrir aplicativo em nova aba"
          >
            <ExternalLink className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Testar app</span>
          </button>

          {/* Clonar Cidade (SuperAdmin) */}
          {usuarioOwner && (
            <button
              type="button"
              onClick={() => setModalClonarAberto(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
            >
              <Copy className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span className="hidden sm:inline">Clonar</span>
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
              toast.success("Configuração White-Label exportada!");
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
            title="Exportar Configuração em JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          {/* Alternar Simulador Mobile */}
          <button
            type="button"
            onClick={() => setPreviewAberto(!previewAberto)}
            style={previewAberto ? { backgroundColor: primaryColor } : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              previewAberto
                ? "text-slate-950 font-black shadow-md"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{previewAberto ? "Ocultar Mockup" : "Simulador"}</span>
          </button>

          {/* Info Banner Toggle */}
          <button
            type="button"
            onClick={() => setMostrarBannerAjuda(!mostrarBannerAjuda)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700"
            title="Ver orientações de governança"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SUB-BAR COMPACTA: PRESETS EM 1-CLIQUE */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            Paletas Prontas:
          </span>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                applyPreset(p.id);
                void applySaasPreset(p.id);
                triggerSaveFeedback();
                toast.success(`Paleta ${p.nome} aplicada!`);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 transition cursor-pointer shrink-0"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.cor }} />
              <span>{p.nome}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isSyncing ? (
            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Sincronizando...
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Nuvem Ativa
            </div>
          )}
        </div>
      </div>

      {/* 3. BANNER COLAPSÁVEL DE ORIENTAÇÃO (Não ocupa espaço permanentemente) */}
      {mostrarBannerAjuda && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-primary/40 text-xs text-slate-300 relative space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-primary" />
              Governança da Praça {activeTenant?.nomeOperacao}
            </span>
            <button
              onClick={() => setMostrarBannerAjuda(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Todas as alterações em logotipo, cores, modalidades de corrida e diárias refletem
            instantaneamente no PWA e APK dos usuários vinculados a esta cidade.
          </p>
        </div>
      )}

      {/* 4. NAVEGAÇÃO POR ABAS AGRUPADAS E COMPACTAS */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto">
        {availableTabs.map((t) => {
          const Icon = t.icone;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                isActive
                  ? "bg-primary text-slate-950 font-black shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. WORKSPACE PRINCIPAL: STUDIO (ESQ) + LIVE SIMULATOR (DIR) */}
      <div className="w-full py-2 flex flex-col lg:flex-row gap-6 items-start">
        {/* COLUNA ESQUERDA: EDITOR ATIVO */}
        <div className={`w-full ${previewAberto ? "lg:w-7/12 xl:w-2/3" : "w-full"} space-y-6`}>
          {activeTab === "brand" && <BrandCenterTab onSaveFeedback={triggerSaveFeedback} />}

          {activeTab === "design" && <DesignSystemTab onSaveFeedback={triggerSaveFeedback} />}

          {activeTab === "typography" && <TypographyTab onSaveFeedback={triggerSaveFeedback} />}

          {activeTab === "landing" && <LandingPageEditorTab onDataChange={setLiveLandingData} />}

          {activeTab === "home" && <HomeBuilderTab onSaveFeedback={triggerSaveFeedback} />}

          {activeTab === "menu" && <MenuBuilderTab onSaveFeedback={triggerSaveFeedback} />}

          {activeTab === "business" && <BusinessModelsTab onSaveFeedback={triggerSaveFeedback} />}

          {activeTab === "monetization" && <MonetizationTab onSaveFeedback={triggerSaveFeedback} />}

          {activeTab === "geo_app" && (
            <GeoAppComplianceTab
              onSaveFeedback={triggerSaveFeedback}
              onRequestSimulatorMode={setPreviewMode}
            />
          )}
        </div>

        {/* COLUNA DIREITA: LIVE DEVICE PREVIEW SIMULATOR */}
        {previewAberto && (
          <div className="w-full lg:w-5/12 xl:w-1/3 sticky top-4">
            <DevicePreviewSimulator
              activeTab={activeTab}
              liveLandingData={liveLandingData}
              previewDevice={previewDevice}
              setPreviewDevice={setPreviewDevice}
              previewMode={previewMode}
              setPreviewMode={setPreviewMode}
            />
          </div>
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
