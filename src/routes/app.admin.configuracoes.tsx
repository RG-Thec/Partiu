import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Key,
  Layers,
  Lock,
  MessageSquare,
  Paintbrush,
  Palette,
  Percent,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Unlock,
  Upload,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  getSuperAdminConfig,
  saveSuperAdminConfig,
} from "@/lib/superadmin-config";
import { appSettingsService } from "@/lib/ecosystem/app-settings-service";
import { isSuperAdmin, getAdminRole } from "@/lib/admin-rbac";
import { useBranding } from "@/hooks/useBranding";
import { themeEngine, generatePrimaryPalette, updateBrowserFavicon, generateSvgFavicon } from "@/lib/branding/ThemeEngine";
import { PalettePickerSection } from "@/components/admin/PalettePickerSection";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações Operacionais & White Label Expresso | PARTIU Admin" },
      {
        name: "description",
        content:
          "Progressive Disclosure: Modo Essencial sempre visível, Modo Avançado protegido e Assistente de Onboarding de Cidade em 4 passos (< 15 min).",
      },
    ],
  }),
  component: ConfiguracoesAdminPage,
});

type AbaConfig = "essencial" | "whitelabel" | "avancado";

interface CidadeTenant {
  id: string;
  nome: string;
  uf: string;
  nomeApp: string;
  corPrimaria: string;
  preset: "Moderno" | "Compacto" | "Arredondado";
  tarifaBase: number;
  comissaoPercent: number;
  chavePix: string;
  whatsapp: string;
  status: "ATIVA" | "EM_CONFIGURACAO";
}

export function ConfiguracoesAdminPage() {
  const { branding, updateBranding } = useBranding();
  const [corPrimariaApp, setCorPrimariaApp] = useState(branding?.primary_color || "#FF6B00");
  const [salvandoCor, setSalvandoCor] = useState(false);
  const [sucessoCor, setSucessoCor] = useState(false);

  const [faviconUrlApp, setFaviconUrlApp] = useState(branding?.favicon_url || "/favicon.svg");
  const [salvandoFavicon, setSalvandoFavicon] = useState(false);
  const [sucessoFavicon, setSucessoFavicon] = useState(false);

  async function handleSalvarFavicon(url: string) {
    setSalvandoFavicon(true);
    try {
      setFaviconUrlApp(url);
      await updateBranding({ favicon_url: url });
      updateBrowserFavicon(url);
      try {
        const { whiteLabelEngine } = await import("@/lib/white-label");
        const act = whiteLabelEngine.getActiveConfig();
        whiteLabelEngine.updateActiveConfig({
          brandCenter: {
            ...act.brandCenter,
            favicons: {
              ...act.brandCenter.favicons,
              faviconDesktopUrl: url,
              faviconMobileUrl: url,
              appleTouchIconUrl: url,
            },
          },
        });
      } catch {}
      setSucessoFavicon(true);
      setTimeout(() => setSucessoFavicon(false), 3000);
    } catch {} finally {
      setSalvandoFavicon(false);
    }
  }

  function handleGerarFaviconDaPaletaAtual() {
    const palette = generatePrimaryPalette(corPrimariaApp);
    const svgUri = generateSvgFavicon(corPrimariaApp, palette.accent);
    setFaviconUrlApp(svgUri);
    void handleSalvarFavicon(svgUri);
  }

  function handleTestarFaviconAba() {
    updateBrowserFavicon(faviconUrlApp || branding?.favicon_url || "/favicon.svg");
    setSucessoFavicon(true);
    setTimeout(() => setSucessoFavicon(false), 3000);
  }

  async function handleSalvarCorPrimaria() {
    setSalvandoCor(true);
    try {
      const palette = generatePrimaryPalette(corPrimariaApp);
      const isCustomImage =
        branding?.favicon_url &&
        !branding.favicon_url.startsWith("data:image/svg") &&
        branding.favicon_url !== "/favicon.svg";

      const svgFav = generateSvgFavicon(corPrimariaApp, palette.accent);

      const patchData: any = {
        primary_color: corPrimariaApp,
        secondary_color: palette.accent,
        header_gradient_start: palette.deep,
        header_gradient_end: palette.vibrant,
      };

      if (!isCustomImage) {
        patchData.favicon_url = svgFav;
        setFaviconUrlApp(svgFav);
        updateBrowserFavicon(svgFav);
      } else {
        updateBrowserFavicon(branding!.favicon_url!);
      }

      await updateBranding(patchData);
      themeEngine.applyTheme({
        ...branding,
        ...patchData,
      });

      // Sincroniza WhiteLabelEngine
      try {
        const { whiteLabelEngine } = await import("@/lib/white-label");
        const act = whiteLabelEngine.getActiveConfig();
        whiteLabelEngine.updateActiveConfig({
          designSystem: {
            ...act.designSystem,
            paletaPrimaria: {
              corPrincipal: corPrimariaApp,
              corPrincipalHover: palette[600],
              corSecundaria: palette.accent,
              corSecundariaHover: palette[600],
              corTerciaria: palette[300],
              corTextoPrincipal: "#0F172A",
              corFundoApp: "#F8FAFC",
              corSuperficieCard: "#FFFFFF",
            },
            gradienteHero: {
              nome: "Personalizado",
              anguloGraus: 135,
              corInicio: corPrimariaApp,
              corFim: palette.accent,
              ativo: true,
            },
          },
        });
      } catch {}

      // Sincroniza superadmin-config
      try {
        const cfg = getSuperAdminConfig();
        if (cfg.identidade) {
          cfg.identidade.corPrimaria = corPrimariaApp;
          cfg.identidade.corPrimariaHover = palette[600];
          cfg.identidade.corSecundaria = palette.accent;
          saveSuperAdminConfig(cfg);
        }
      } catch {}

      setSucessoCor(true);
      setTimeout(() => setSucessoCor(false), 3000);
    } catch (_) {
    } finally {
      setSalvandoCor(false);
    }
  }

  const [abaAtiva, setAbaAtiva] = useState<AbaConfig>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "whitelabel" || tab === "avancado") return tab;
    }
    return "essencial";
  });

  const config = getSuperAdminConfig();
  const role = getAdminRole();
  const ehSuperAdmin = isSuperAdmin(role);

  // 1. MODO ESSENCIAL (SEMPRE VISÍVEL)
  const [cidadeOperacao, setCidadeOperacao] = useState("Matriz Central");
  const [tarifaBaseEssencial, setTarifaBaseEssencial] = useState("5.50");
  const [valorKmEssencial, setValorKmEssencial] = useState("2.10");
  const [valorMinutoEssencial, setValorMinutoEssencial] = useState("0.35");
  const [tarifaMinimaEssencial, setTarifaMinimaEssencial] = useState("8.00");
  const [comissaoFranquia, setComissaoFranquia] = useState("10.0");
  const [whatsappSuporte, setWhatsappSuporte] = useState("");
  const [chavePixPadrao, setChavePixPadrao] = useState("financeiro@partiu.app");
  const [sucessoEssencial, setSucessoEssencial] = useState(false);

  // Parâmetros de Despacho & Tarifação da Plataforma (Paridade com Painel Demo)
  const [taxaAppModo, setTaxaAppModo] = useState<"percentual" | "fixo">("percentual");
  const [taxaAppPercentual, setTaxaAppPercentual] = useState("10.0");
  const [taxaAppFixa, setTaxaAppFixa] = useState("2.50");
  const [raioInicialKm, setRaioInicialKm] = useState("3.0");
  const [raioIncrementoKmPorMin, setRaioIncrementoKmPorMin] = useState("1.5");
  const [tempoLimiteBuscaMin, setTempoLimiteBuscaMin] = useState("5");

  // 2. MODO AVANÇADO (PROTEGIDO POR CONFIRMAÇÃO / DESBLOQUEIO)
  const [modoAvancadoDesbloqueado, setModoAvancadoDesbloqueado] = useState(false);
  const [modalDesbloquearAberto, setModalDesbloquearAberto] = useState(false);
  const [confirmacaoTexto, setConfirmacaoTexto] = useState("");
  const [erroDesbloqueio, setErroDesbloqueio] = useState<string | null>(null);

  // Parâmetros Técnicos Avançados
  const [googleMapsKey, setGoogleMapsKey] = useState("AIzaSyB*****************************");
  const [stripeSecretKey, setStripeSecretKey] = useState("sk_live_****************************");
  const [asaasApiKey, setAsaasApiKey] = useState("$aact_******************************");
  const [webhookSecret, setWebhookSecret] = useState("whsec_*****************************");
  const [dnsUrl, setDnsUrl] = useState("https://api.partiumobilidade.com.br");
  const [timeoutDespachoSec, setTimeoutDespachoSec] = useState("600");
  const [mostrarChaves, setMostrarChaves] = useState(false);
  const [sucessoAvancado, setSucessoAvancado] = useState(false);

  // Gateway Primário & Mercado Pago
  const [activeGateway, setActiveGateway] = useState<"MERCADO_PAGO" | "ASAAS" | "EFI_BANK" | "MANUAL">("MERCADO_PAGO");
  const [mercadopagoAccessToken, setMercadopagoAccessToken] = useState("");
  const [mercadopagoPublicKey, setMercadopagoPublicKey] = useState("");
  const [mercadopagoWebhookSecret, setMercadopagoWebhookSecret] = useState("");
  const [mercadopagoSandbox, setMercadopagoSandbox] = useState(false);
  const [salvandoTecnico, setSalvandoTecnico] = useState(false);
  const [copiadoWebhookUrl, setCopiadoWebhookUrl] = useState(false);

  useEffect(() => {
    const s = appSettingsService.getSettings();
    if (s.active_gateway) setActiveGateway(s.active_gateway);
    if (s.mercadopago_access_token) setMercadopagoAccessToken(s.mercadopago_access_token);
    if (s.mercadopago_public_key) setMercadopagoPublicKey(s.mercadopago_public_key);
    if (s.mercadopago_webhook_secret) setMercadopagoWebhookSecret(s.mercadopago_webhook_secret);
    if (s.mercadopago_sandbox !== undefined) setMercadopagoSandbox(s.mercadopago_sandbox);
    if (s.base_fare_ride) setTarifaBaseEssencial(String(s.base_fare_ride));
    if (s.price_per_km) setValorKmEssencial(String(s.price_per_km));
    if (s.price_per_minute) setValorMinutoEssencial(String(s.price_per_minute));
    if (s.pix_key) setChavePixPadrao(s.pix_key);

    try {
      const cfg = getSuperAdminConfig();
      if (cfg.tarifas?.raioBuscaKm) setRaioInicialKm(String(cfg.tarifas.raioBuscaKm));
      if (cfg.tarifas?.partiuPop) {
        if (cfg.tarifas.partiuPop.tarifaBase) setTarifaBaseEssencial(String(cfg.tarifas.partiuPop.tarifaBase));
        if (cfg.tarifas.partiuPop.valorKm) setValorKmEssencial(String(cfg.tarifas.partiuPop.valorKm));
        if (cfg.tarifas.partiuPop.valorMinuto) setValorMinutoEssencial(String(cfg.tarifas.partiuPop.valorMinuto));
        if (cfg.tarifas.partiuPop.tarifaMinima) setTarifaMinimaEssencial(String(cfg.tarifas.partiuPop.tarifaMinima));
      }
      if (cfg.estrategicos?.taxaCooperativaPercent) {
        setComissaoFranquia(String(cfg.estrategicos.taxaCooperativaPercent));
        setTaxaAppPercentual(String(cfg.estrategicos.taxaCooperativaPercent));
      }
      if (cfg.pix?.chavePixManual) {
        setChavePixPadrao(cfg.pix.chavePixManual);
      }
    } catch {}
  }, []);

  async function handleSalvarTecnico(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSalvandoTecnico(true);
    try {
      await appSettingsService.updateSettings({
        active_gateway: activeGateway,
        mercadopago_access_token: mercadopagoAccessToken,
        mercadopago_public_key: mercadopagoPublicKey,
        mercadopago_webhook_secret: mercadopagoWebhookSecret,
        mercadopago_sandbox: mercadopagoSandbox,
      });

      const superAdminConfig = getSuperAdminConfig();
      if (superAdminConfig.pix) {
        superAdminConfig.pix.gateway = activeGateway === "MERCADO_PAGO" ? "mercadopago" : activeGateway === "ASAAS" ? "asaas" : "manual";
        superAdminConfig.pix.mercadoPagoAccessToken = mercadopagoAccessToken;
        superAdminConfig.pix.mercadoPagoPublicKey = mercadopagoPublicKey;
        superAdminConfig.pix.mercadoPagoWebhookSecret = mercadopagoWebhookSecret;
        superAdminConfig.pix.sandbox = mercadopagoSandbox;
        saveSuperAdminConfig(superAdminConfig);
      }

      setSucessoAvancado(true);
      setTimeout(() => setSucessoAvancado(false), 3500);
    } finally {
      setSalvandoTecnico(false);
    }
  }

  // 3. WHITE LABEL EXPRESSO (ASSISTENTE DE 4 PASSOS)
  const [passoWizard, setPassoWizard] = useState<1 | 2 | 3 | 4>(1);
  const [wlCidade, setWlCidade] = useState("");
  const [wlUf, setWlUf] = useState("");
  const [wlNomeApp, setWlNomeApp] = useState("PARTIU");
  const [wlLogoUrl, setWlLogoUrl] = useState("");
  const [wlCorPrimaria, setWlCorPrimaria] = useState("#FF6B00");
  const [wlPreset, setWlPreset] = useState<"Moderno" | "Compacto" | "Arredondado">("Moderno");
  const [wlTarifaBase, setWlTarifaBase] = useState("5.00");
  const [wlComissao, setWlComissao] = useState("10.0");
  const [wlPix, setWlPix] = useState("");
  const [wlWhatsapp, setWlWhatsapp] = useState("");
  const [cidadeAtivadaSucesso, setCidadeAtivadaSucesso] = useState(false);

  // Lista de Cidades White Label Ativas com persistência local
  const [cidadesAtivas, setCidadesAtivas] = useState<CidadeTenant[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("partiu_cidades_ativas");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: "ten_matriz",
        nome: "Operação Principal",
        uf: "BR",
        nomeApp: "PARTIU",
        corPrimaria: "#FF6B00",
        preset: "Moderno",
        tarifaBase: 5.5,
        comissaoPercent: 10.0,
        chavePix: "financeiro@partiu.app",
        whatsapp: "",
        status: "ATIVA",
      },
    ];
  });

  // Sincroniza cidades/tenants reais do Supabase na inicialização
  useEffect(() => {
    if (isSupabaseConfigured()) {
      void (async () => {
        try {
          const { data } = await (supabase as any)
            .from("white_label_tenants")
            .select("*");
          if (data && data.length > 0) {
            const mapped: CidadeTenant[] = data.map((t: any) => ({
              id: t.id,
              nome: t.city_name || t.tenant_name || "Cidade",
              uf: t.state_uf || "BR",
              nomeApp: t.trade_name || t.tenant_name || "Partiu",
              corPrimaria: t.primary_color || "#0088FF",
              preset: "Moderno",
              tarifaBase: Number(t.base_fare || 5.0),
              comissaoPercent: Number(t.platform_fee_percent || 10.0),
              chavePix: t.pix_key || "",
              whatsapp: t.support_whatsapp || "",
              status: t.is_active ? "ATIVA" : "EM_CONFIGURACAO",
            }));
            setCidadesAtivas((prev) => {
              const ids = new Set(mapped.map((m) => m.id));
              const remaining = prev.filter((p) => !ids.has(p.id));
              return [...mapped, ...remaining];
            });
          }
        } catch (e) {
          console.warn("[ConfiguracoesAdminPage] Falha ao sincronizar tenants do Supabase:", e);
        }
      })();
    }
  }, []);

  async function handleSalvarEssencial(e: React.FormEvent) {
    e.preventDefault();
    try {
      // 1. Persistência Canônica no Supabase (Fonte da verdade consumida por PricingService e Apps)
      await appSettingsService.updateSettings({
        base_fare_ride: Number(tarifaBaseEssencial) || 5.5,
        price_per_km: Number(valorKmEssencial) || 2.1,
        price_per_minute: Number(valorMinutoEssencial) || 0.35,
        pix_key: chavePixPadrao,
      });

      // 2. Persistência de sincronização local/legada no SuperAdminConfig
      const superAdminConfig = getSuperAdminConfig();
      if (superAdminConfig.tarifas) {
        superAdminConfig.tarifas.raioBuscaKm = Number(raioInicialKm) || 3;
        if (superAdminConfig.tarifas.partiuPop) {
          superAdminConfig.tarifas.partiuPop.tarifaBase = Number(tarifaBaseEssencial) || 5.5;
          superAdminConfig.tarifas.partiuPop.valorKm = Number(valorKmEssencial) || 2.1;
          superAdminConfig.tarifas.partiuPop.valorMinuto = Number(valorMinutoEssencial) || 0.35;
          superAdminConfig.tarifas.partiuPop.tarifaMinima = Number(tarifaMinimaEssencial) || 8.0;
        }
      }
      if (superAdminConfig.estrategicos) {
        superAdminConfig.estrategicos.taxaCooperativaPercent = Number(comissaoFranquia) || 12.5;
      }
      if (superAdminConfig.pix) {
        superAdminConfig.pix.chavePixManual = chavePixPadrao;
      }
      saveSuperAdminConfig(superAdminConfig);
    } catch (err) {
      console.warn("Falha ao salvar configurações essenciais:", err);
    }
    setSucessoEssencial(true);
    setTimeout(() => setSucessoEssencial(false), 2500);
  }

  function handleDesbloquearAvancado(e: React.FormEvent) {
    e.preventDefault();
    if (confirmacaoTexto.trim().toUpperCase() === "DESBLOQUEAR") {
      setModoAvancadoDesbloqueado(true);
      setModalDesbloquearAberto(false);
      setConfirmacaoTexto("");
      setErroDesbloqueio(null);
    } else {
      setErroDesbloqueio("Digite exatamente a palavra 'DESBLOQUEAR' para confirmar.");
    }
  }

  function handleConcluirWhiteLabel() {
    const novaCidade: CidadeTenant = {
      id: "ten_" + wlCidade.toLowerCase().replace(/\s+/g, ""),
      nome: wlCidade,
      uf: wlUf,
      nomeApp: wlNomeApp,
      corPrimaria: wlCorPrimaria,
      preset: wlPreset,
      tarifaBase: Number(wlTarifaBase) || 5.0,
      comissaoPercent: Number(wlComissao) || 10.0,
      chavePix: wlPix,
      whatsapp: wlWhatsapp,
      status: "ATIVA",
    };

    setCidadesAtivas((prev) => {
      const updated = [novaCidade, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("partiu_cidades_ativas", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    if (isSupabaseConfigured()) {
      void (async () => {
        try {
          await (supabase as any).from("white_label_tenants").upsert({
            id: novaCidade.id,
            tenant_name: novaCidade.nome,
            trade_name: novaCidade.nomeApp,
            primary_color: novaCidade.corPrimaria,
            pix_key: novaCidade.chavePix,
            support_whatsapp: novaCidade.whatsapp,
            is_active: true,
            status: "active",
            city_name: novaCidade.nome,
            state_uf: novaCidade.uf,
            base_fare: novaCidade.tarifaBase,
            platform_fee_percent: novaCidade.comissaoPercent,
            updated_at: new Date().toISOString(),
          });
          await (supabase as any).from("app_branding").upsert({
            tenant_id: novaCidade.id,
            app_name: novaCidade.nomeApp,
            primary_color: novaCidade.corPrimaria,
            support_whatsapp: novaCidade.whatsapp,
            updated_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("[handleConcluirWhiteLabel] Falha ao persistir tenant no Supabase:", e);
        }
      })();
    }

    setCidadeAtivadaSucesso(true);
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-20">
      {/* 1. Header Executivo Configurações */}
      <div className="rounded-3xl bg-slate-950 p-6 sm:p-10 xl:p-12 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full bg-[#0088FF]/15 px-4 py-2 text-xs sm:text-sm lg:text-base font-black uppercase tracking-wider text-[#0088FF] border border-[#0088FF]/30 mb-3.5">
              <Sliders className="h-5 w-5 text-[#0088FF]" />
              <span>Progressive Disclosure &amp; Multi-Cidade</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-tight">
              Configurações &amp; <span className="text-[#0088FF]">White Label Expresso</span>
            </h1>
            <p className="text-base sm:text-lg xl:text-xl text-slate-300 max-w-4xl font-medium mt-3 leading-relaxed">
              Configurações essenciais sempre acessíveis, dados técnicos protegidos por desafio de segurança e assistente de ativação de cidade em 4 passos.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Barra de Abas (Modo Essencial | White Label Expresso | Modo Avançado Protegido) */}
      <div className="flex flex-wrap items-center gap-2.5 p-2 sm:p-2.5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm max-w-full overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setAbaAtiva("essencial")}
          className={`flex items-center gap-2.5 px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm lg:text-base font-black transition-all cursor-pointer ${
            abaAtiva === "essencial" ? "bg-slate-950 text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="h-5 w-5 text-[#0088FF]" />
          <span>Modo Essencial</span>
          <span className="ml-1 rounded-full bg-emerald-100 px-3 py-1 text-xs sm:text-sm text-emerald-900 font-bold">
            Sempre Visível
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("whitelabel")}
          className={`flex items-center gap-2.5 px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm lg:text-base font-black transition-all cursor-pointer ${
            abaAtiva === "whitelabel" ? "bg-slate-950 text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="h-5 w-5 text-[#0088FF]" />
          <span>White Label Expresso</span>
          <span className="ml-1 rounded-full bg-blue-50 px-3 py-1 text-xs sm:text-sm text-blue-900 font-bold">
            4 Passos (&lt;15 min)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("avancado")}
          className={`flex items-center gap-2.5 px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm lg:text-base font-black transition-all cursor-pointer ${
            abaAtiva === "avancado" ? "bg-slate-950 text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          {modoAvancadoDesbloqueado ? (
            <Unlock className="h-5 w-5 text-emerald-400" />
          ) : (
            <Lock className="h-5 w-5 text-rose-500" />
          )}
          <span>Modo Avançado</span>
          <span className={`ml-1 rounded-full px-3 py-1 text-xs sm:text-sm font-bold ${
            modoAvancadoDesbloqueado ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
          }`}>
            {modoAvancadoDesbloqueado ? "Desbloqueado" : "Protegido"}
          </span>
        </button>
      </div>

      {/* 3. ABA 1: MODO ESSENCIAL (SEMPRE VISÍVEL) */}
      {abaAtiva === "essencial" && (
        <form onSubmit={handleSalvarEssencial} className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Configurações Operacionais Essenciais</h2>
              <p className="text-base sm:text-lg text-slate-600 font-medium mt-1">
                Parâmetros vitais de operação diária sem exposição a dados técnicos complexos.
              </p>
            </div>
            <button
              type="submit"
              className="flex h-14 sm:h-16 items-center justify-center gap-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-8 sm:px-10 text-base sm:text-lg font-black shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Save className="h-5.5 w-5.5 text-[#0088FF]" />
              <span>Salvar Modificações</span>
            </button>
          </div>

          {sucessoEssencial && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-base font-bold flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <span>Configurações essenciais salvas com sucesso no banco de dados!</span>
            </div>
          )}

          {/* Card de Cor Primária & Identidade Visual Global */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-6 sm:space-y-8">
            {/* Seletor de Paletas Monocromáticas de 1-Clique */}
            <PalettePickerSection onPaletteSelect={(p) => setCorPrimariaApp(p?.colors?.primary || "#FF6B00")} />

            {/* Ajuste Fino Personalizado e Salvar */}
            <div className="pt-6 sm:pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <Palette className="h-7 w-7 text-primary" />
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Ajuste Fino de Cor Personalizada (Hexadecimal)
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
                  Caso deseje um tom exclusivo fora das paletas prontas, digite o código hex abaixo.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSalvarCorPrimaria}
                disabled={salvandoCor}
                className="flex h-13 sm:h-14 items-center justify-center gap-2.5 rounded-2xl bg-primary hover:opacity-90 text-primary-foreground px-7 text-sm sm:text-base font-black shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
              >
                {salvandoCor ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                <span>{salvandoCor ? "Aplicando..." : "Salvar Cor Hexadecimal"}</span>
              </button>
            </div>

            {sucessoCor && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-base font-bold flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <span>Cor primária atualizada e sincronizada com sucesso em todo o sistema!</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
              {/* Seletor de Cor Hex & Input */}
              <div className="space-y-4">
                <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">
                  Selecione ou Digite a Cor Hexadecimal
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <input
                      type="color"
                      value={corPrimariaApp}
                      onChange={(e) => {
                        setCorPrimariaApp(e.target.value);
                        themeEngine.applyTheme({ ...branding, primary_color: e.target.value });
                      }}
                      className="h-16 sm:h-18 w-20 sm:w-24 rounded-2xl border-2 border-slate-300 p-1.5 cursor-pointer bg-white shadow-xs"
                      title="Escolher cor primária"
                    />
                  </div>
                  <input
                    type="text"
                    maxLength={7}
                    value={corPrimariaApp}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCorPrimariaApp(val);
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        themeEngine.applyTheme({ ...branding, primary_color: val });
                      }
                    }}
                    placeholder="#FF6B00"
                    className="flex-1 h-16 sm:h-18 px-6 rounded-2xl border border-slate-300 text-lg sm:text-2xl font-mono font-black uppercase text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Cores Rápidas Predefinidas */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-sm sm:text-base font-bold text-slate-700">Paletas Populares de Mobilidade:</span>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { nome: "Laranja Solar (Padrão PARTIU)", hex: "#FF6B00" },
                      { nome: "Amarelo Ouro", hex: "#FFB800" },
                      { nome: "Azul Tech", hex: "#0088FF" },
                      { nome: "Verde Sustentável", hex: "#10B981" },
                      { nome: "Roxo Fintech", hex: "#8B5CF6" },
                      { nome: "Vermelho Rubi", hex: "#EF4444" },
                    ].map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => {
                          setCorPrimariaApp(preset.hex);
                          themeEngine.applyTheme({ ...branding, primary_color: preset.hex });
                        }}
                        className={`inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border text-xs sm:text-sm lg:text-base font-bold transition-all cursor-pointer ${
                          corPrimariaApp.toLowerCase() === preset.hex.toLowerCase()
                            ? "border-slate-900 bg-slate-900 text-white shadow-md"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span
                          className="h-4 w-4 rounded-full shrink-0 border border-black/10"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span>{preset.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview em Tempo Real */}
              <div className="p-6 sm:p-8 rounded-3xl border border-slate-200/90 bg-slate-50/80 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">
                    Prévia em Tempo Real
                  </span>
                  <span
                    className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-black"
                    style={{ backgroundColor: `${corPrimariaApp}20`, color: corPrimariaApp }}
                  >
                    Ativa no Sistema
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    style={{ backgroundColor: corPrimariaApp }}
                    className="px-6 py-3.5 rounded-2xl text-white font-black text-sm sm:text-base shadow-md cursor-pointer transition active:scale-95"
                  >
                    Solicitar Corrida
                  </button>
                  <button
                    type="button"
                    style={{ backgroundColor: corPrimariaApp }}
                    className="px-6 py-3.5 rounded-2xl text-white font-black text-sm sm:text-base shadow-md cursor-pointer transition active:scale-95"
                  >
                    Aceitar Viagem
                  </button>
                  <span
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm lg:text-base font-bold border"
                    style={{
                      borderColor: corPrimariaApp,
                      color: corPrimariaApp,
                      backgroundColor: `${corPrimariaApp}10`,
                    }}
                  >
                    Tag Selecionada
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Esta cor gera automaticamente todas as tonalidades semânticas (50 a 900, fundos, contrastes e realces) em conformidade com as diretrizes do frontend &amp; UI/UX.
                </p>
              </div>

              {/* Personalização do Favicon da Aba do Navegador */}
              <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-[#0088FF]" />
                    <span className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-800">
                      Ícone da Aba do Navegador (Favicon em Tempo Real)
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700">
                    {faviconUrlApp.startsWith("data:image/svg") ? "✨ SVG Dinâmico" : "🖼️ URL Customizada"}
                  </span>
                </div>

                {/* Simulador de Aba */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
                  <div className="flex items-center gap-2 px-1 shrink-0">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 px-4 py-2 rounded-xl max-w-lg truncate text-sm sm:text-base text-white font-medium">
                    <div className="w-6 h-6 rounded-lg shrink-0 overflow-hidden flex items-center justify-center bg-slate-950">
                      <img
                        src={faviconUrlApp || branding?.favicon_url || "/favicon.svg"}
                        alt="Favicon da aba"
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                    <span className="truncate">{branding?.app_name || "PARTIU"} — Mobilidade Urbana</span>
                    <span className="text-slate-400 text-base ml-auto">×</span>
                  </div>
                </div>

                {/* Campo URL Direta e Ações */}
                <div className="space-y-4">
                  <label className="text-sm sm:text-base font-bold text-slate-700 block">
                    URL ou SVG Data URI do Favicon:
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={faviconUrlApp}
                      onChange={(e) => setFaviconUrlApp(e.target.value)}
                      placeholder="https://... ou /favicon.svg ou data:image/svg+xml,..."
                      className="w-full flex-1 h-14 sm:h-16 px-5 rounded-2xl border border-slate-300 text-sm sm:text-base font-mono font-medium text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSalvarFavicon(faviconUrlApp)}
                      disabled={salvandoFavicon}
                      className="h-14 sm:h-16 px-7 rounded-2xl bg-slate-900 text-white text-sm sm:text-base font-black hover:bg-slate-800 transition cursor-pointer active:scale-95 shrink-0 shadow-md"
                    >
                      {salvandoFavicon ? "Aplicando..." : "Salvar Favicon"}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleGerarFaviconDaPaletaAtual}
                      className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 text-xs sm:text-sm lg:text-base font-bold transition cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>Gerar da Cor ({corPrimariaApp})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTestarFaviconAba}
                      className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm lg:text-base font-bold transition cursor-pointer active:scale-95"
                    >
                      <Globe className="w-5 h-5 text-blue-500" />
                      <span>Testar na Aba Agora</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSalvarFavicon("/favicon.svg")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-slate-500 hover:text-slate-800 text-xs sm:text-sm lg:text-base font-medium transition cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Padrão (/favicon.svg)</span>
                    </button>
                  </div>

                  {sucessoFavicon && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm sm:text-base font-bold flex items-center gap-2.5 animate-in fade-in">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Ícone da aba do navegador atualizado com sucesso!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card de Tarifação Base de Mobilidade (PARTIU Pop) */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-7 w-7 text-emerald-600" />
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Tarifação Base de Corridas (PARTIU Pop)
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
                  Composição de valores por quilometragem e tempo para cálculo de estimativa e encerramento.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-black border border-emerald-200 self-start sm:self-auto">
                <Zap className="h-4 w-4 text-emerald-600" />
                Cálculo em Tempo Real
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Tarifa Base / Bandeirada
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.10"
                    value={tarifaBaseEssencial}
                    onChange={(e) => setTarifaBaseEssencial(e.target.value)}
                    className="w-full h-14 sm:h-16 pl-12 pr-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">Valor fixo de partida.</p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Valor por KM Rodado
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.10"
                    value={valorKmEssencial}
                    onChange={(e) => setValorKmEssencial(e.target.value)}
                    className="w-full h-14 sm:h-16 pl-12 pr-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">Multiplicado pelos km totais.</p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Valor por Minuto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.05"
                    value={valorMinutoEssencial}
                    onChange={(e) => setValorMinutoEssencial(e.target.value)}
                    className="w-full h-14 sm:h-16 pl-12 pr-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">Multiplicado pelo tempo em trânsito.</p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Tarifa Mínima Garantida (Piso)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    value={tarifaMinimaEssencial}
                    onChange={(e) => setTarifaMinimaEssencial(e.target.value)}
                    className="w-full h-14 sm:h-16 pl-12 pr-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">Valor mínimo cobrado por corrida.</p>
              </div>
            </div>
          </div>

          {/* Card de Parâmetros de Despacho & Comissão da Plataforma */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <Radio className="h-7 w-7 text-[#0088FF]" />
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Parâmetros de Despacho &amp; Comissão da Plataforma
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
                  Configurações de retenção da plataforma e algoritmos progressivos de despacho de motoristas.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-900 text-xs sm:text-sm font-black border border-blue-200 self-start sm:self-auto">
                <Radio className="h-4 w-4 text-[#0088FF]" />
                Algoritmo Inteligente
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Modo da Taxa da Plataforma */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Modo da Taxa App
                </label>
                <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTaxaAppModo("percentual")}
                    className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                      taxaAppModo === "percentual"
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    % Percentual
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaxaAppModo("fixo")}
                    className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                      taxaAppModo === "fixo"
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    R$ Fixo
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium">Formato da taxa retida pela plataforma.</p>
              </div>

              {/* Valor da Taxa App */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  {taxaAppModo === "percentual" ? "Taxa Plataforma (%)" : "Taxa Fixa por Corrida (R$)"}
                </label>
                <div className="relative">
                  {taxaAppModo === "fixo" && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-bold text-slate-400">R$</span>
                  )}
                  <input
                    type="number"
                    step={taxaAppModo === "percentual" ? "0.5" : "0.50"}
                    value={taxaAppModo === "percentual" ? taxaAppPercentual : taxaAppFixa}
                    onChange={(e) => {
                      if (taxaAppModo === "percentual") {
                        setTaxaAppPercentual(e.target.value);
                        setComissaoFranquia(e.target.value);
                      } else {
                        setTaxaAppFixa(e.target.value);
                      }
                    }}
                    className={`w-full h-14 sm:h-16 ${taxaAppModo === "fixo" ? "pl-12 pr-4" : "px-5 pr-12"} rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]`}
                  />
                  {taxaAppModo === "percentual" && (
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold text-slate-400">%</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {taxaAppModo === "percentual" ? "Ex: 10% retido do subtotal" : "Ex: R$ 2,50 fixos por corrida"}
                </p>
              </div>

              {/* Raio Inicial */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Raio Inicial de Busca
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={raioInicialKm}
                    onChange={(e) => setRaioInicialKm(e.target.value)}
                    className="w-full h-14 sm:h-16 px-5 pr-14 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-400">km</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Distância inicial dos motoristas mais próximos.</p>
              </div>

              {/* Expansão do Raio & Limite */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Expansão do Raio / Minuto
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={raioIncrementoKmPorMin}
                    onChange={(e) => setRaioIncrementoKmPorMin(e.target.value)}
                    className="w-full h-14 sm:h-16 px-5 pr-18 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-400">km/min</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Aumenta o raio a cada minuto de busca.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Tempo Limite Máximo de Busca
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tempoLimiteBuscaMin}
                    onChange={(e) => setTempoLimiteBuscaMin(e.target.value)}
                    className="w-full h-14 sm:h-16 px-5 pr-16 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-400">min</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Tempo até declarar sem motoristas disponíveis.</p>
              </div>

              <div className="space-y-2.5 flex flex-col justify-end">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-3">
                  <Clock className="h-6 w-6 text-[#0088FF] shrink-0" />
                  <span>
                    O algoritmo expande progressivamente o despacho a partir de <strong>{raioInicialKm} km</strong>, aumentando <strong>+{raioIncrementoKmPorMin} km</strong> por minuto até o limite de <strong>{tempoLimiteBuscaMin} min</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Cidade de Operação */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">
                Cidade de Operação Ativa
              </label>
              <input
                type="text"
                value={cidadeOperacao}
                onChange={(e) => setCidadeOperacao(e.target.value)}
                className="w-full h-14 sm:h-16 px-5 rounded-2xl border border-slate-300 text-base sm:text-lg font-bold text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
              />
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Região de cobertura padrão das corridas.</p>
            </div>

            {/* Comissão / Taxa da Franquia */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">
                Taxa de Serviço / Comissão (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={comissaoFranquia}
                  onChange={(e) => setComissaoFranquia(e.target.value)}
                  className="w-full h-14 sm:h-16 px-5 pr-12 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold text-slate-400">%</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Comissão retida pela plataforma por corrida.</p>
            </div>

            {/* WhatsApp Central */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">
                WhatsApp Central de Atendimento
              </label>
              <input
                type="text"
                value={whatsappSuporte}
                onChange={(e) => setWhatsappSuporte(e.target.value)}
                className="w-full h-14 sm:h-16 px-5 rounded-2xl border border-slate-300 text-base sm:text-lg font-bold text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
              />
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Canal direto de suporte ao passageiro.</p>
            </div>

            {/* Chave PIX */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-3 lg:col-span-3">
              <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">
                Chave PIX Oficial de Recebimento da Matriz / Franquia
              </label>
              <input
                type="text"
                value={chavePixPadrao}
                onChange={(e) => setChavePixPadrao(e.target.value)}
                className="w-full h-14 sm:h-16 px-5 rounded-2xl border border-slate-300 text-base sm:text-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
              />
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Chave utilizada para emissão de cobranças PIX Copia e Cola nos aplicativos.</p>
            </div>
          </div>
        </form>
      )}

      {/* 4. ABA 2: WHITE LABEL EXPRESSO (ASSISTENTE DE 4 PASSOS) */}
      {abaAtiva === "whitelabel" && (
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xs space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Assistente de Onboarding White Label (4 Passos)</h2>
                <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
                  Substitui mais de 60 campos técnicos por um fluxo de ativação rápida em menos de 15 minutos.
                </p>
              </div>

              {/* Indicador dos 4 Passos */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center text-sm sm:text-base font-black transition-all ${
                      passoWizard === step
                        ? "bg-slate-950 text-white shadow-md scale-105"
                        : passoWizard > step
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {passoWizard > step ? <Check className="h-5 w-5" /> : step}
                  </div>
                ))}
              </div>
            </div>

            {/* CONTEÚDO DO PASSO ATIVO */}
            {passoWizard === 1 && (
              <div className="space-y-5 max-w-xl animate-in fade-in">
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-primary-700">Passo 1 de 4</span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Identificação da Cidade &amp; Aplicativo</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">Defina o município de expansão e o nome comercial do app.</p>
                </div>

                <div className="grid grid-cols-3 gap-3.5">
                  <div className="col-span-2">
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Cidade:</label>
                    <input
                      type="text"
                      value={wlCidade}
                      onChange={(e) => setWlCidade(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">UF:</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={wlUf}
                      onChange={(e) => setWlUf(e.target.value.toUpperCase())}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-bold uppercase text-center text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Nome Comercial do App:</label>
                  <input
                    type="text"
                    value={wlNomeApp}
                    onChange={(e) => setWlNomeApp(e.target.value)}
                    className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPassoWizard(2)}
                    className="flex h-12 items-center gap-2 rounded-2xl bg-slate-900 text-white px-6 text-xs sm:text-sm font-black hover:bg-slate-800 transition active:scale-95 cursor-pointer shadow-md"
                  >
                    <span>Avançar para Identidade Visual</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}

            {passoWizard === 2 && (
              <div className="space-y-5 max-w-xl animate-in fade-in">
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-primary-700">Passo 2 de 4</span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Identidade Visual &amp; Preset de Estilo</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">Cores da marca e o acabamento estético do aplicativo local.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Cor Primária da Marca:</label>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={wlCorPrimaria}
                        onChange={(e) => setWlCorPrimaria(e.target.value)}
                        className="h-12 sm:h-14 w-16 rounded-2xl border-2 border-slate-300 p-1 cursor-pointer bg-white shadow-xs shrink-0"
                      />
                      <input
                        type="text"
                        value={wlCorPrimaria}
                        onChange={(e) => setWlCorPrimaria(e.target.value)}
                        className="flex-1 h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-mono font-bold uppercase text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Preset Visual:</label>
                    <select
                      value={wlPreset}
                      onChange={(e: any) => setWlPreset(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-bold bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="Moderno">Moderno (Bordas Suaves)</option>
                      <option value="Compacto">Compacto (Alta Densidade)</option>
                      <option value="Arredondado">Arredondado (Amigável)</option>
                    </select>
                  </div>
                </div>

                {/* Preview Rápido */}
                <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2.5">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600 block">Prévia do Botão Principal:</span>
                  <button
                    type="button"
                    style={{ backgroundColor: wlCorPrimaria }}
                    className="w-full h-12 sm:h-14 rounded-2xl text-slate-950 font-black text-sm sm:text-base shadow-sm"
                  >
                    Pedir Corrida em {wlCidade}
                  </button>
                </div>

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setPassoWizard(1)}
                    className="h-12 px-6 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-200 transition cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassoWizard(3)}
                    className="flex h-12 items-center gap-2 rounded-2xl bg-slate-900 text-white px-6 text-xs sm:text-sm font-black hover:bg-slate-800 transition active:scale-95 cursor-pointer shadow-md"
                  >
                    <span>Avançar para Tarifas</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}

            {passoWizard === 3 && (
              <div className="space-y-5 max-w-xl animate-in fade-in">
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-primary-700">Passo 3 de 4</span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Tarifas da Cidade &amp; Comissão</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">Regras de precificação e split financeiro da operação.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Tarifa Base (R$):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={wlTarifaBase}
                      onChange={(e) => setWlTarifaBase(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Comissão da Franquia (%):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={wlComissao}
                      onChange={(e) => setWlComissao(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setPassoWizard(2)}
                    className="h-12 px-6 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-200 transition cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassoWizard(4)}
                    className="flex h-12 items-center gap-2 rounded-2xl bg-slate-900 text-white px-6 text-xs sm:text-sm font-black hover:bg-slate-800 transition active:scale-95 cursor-pointer shadow-md"
                  >
                    <span>Avançar para Ativação</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}

            {passoWizard === 4 && (
              <div className="space-y-5 max-w-xl animate-in fade-in">
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-primary-700">Passo 4 de 4</span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Canais Operacionais &amp; Ativação</h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">Chave PIX para recebimentos e WhatsApp oficial da praça.</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Chave PIX da Cidade:</label>
                  <input
                    type="text"
                    value={wlPix}
                    onChange={(e) => setWlPix(e.target.value)}
                    className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">WhatsApp de Suporte da Cidade:</label>
                  <input
                    type="text"
                    value={wlWhatsapp}
                    onChange={(e) => setWlWhatsapp(e.target.value)}
                    className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {cidadeAtivadaSucesso ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
                    <div className="flex items-center gap-2 font-black text-base sm:text-lg">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                      <span>Cidade {wlCidade} ({wlUf}) Ativada com Sucesso!</span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-800 font-medium">
                      O tenant foi provisionado no banco de dados e está pronto para receber cadastros de passageiros e motoristas.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCidadeAtivadaSucesso(false);
                        setPassoWizard(1);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-bold hover:bg-emerald-800 transition cursor-pointer"
                    >
                      Cadastrar Outra Cidade
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setPassoWizard(3)}
                      className="h-12 px-6 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-200 transition cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleConcluirWhiteLabel}
                      className="flex h-12 sm:h-14 items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-7 text-xs sm:text-sm font-black shadow-md cursor-pointer transition active:scale-95"
                    >
                      <Zap className="h-4.5 w-4.5 text-[#0088FF]" />
                      <span>🚀 Ativar Cidade Agora (&lt; 15 min)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lista de Cidades Ativas */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900">Cidades Ativas na Rede PARTIU ({cidadesAtivas.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cidadesAtivas.map((c) => (
                <div key={c.id} className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: c.corPrimaria }} />
                      <p className="font-bold text-sm sm:text-base text-slate-900">{c.nome} - {c.uf}</p>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">App: {c.nomeApp} | Preset: {c.preset}</p>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-900">Comissão: {c.comissaoPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. ABA 3: MODO AVANÇADO (PROTEGIDO POR CONFIRMAÇÃO) */}
      {abaAtiva === "avancado" && (
        <div className="space-y-6">
          {!modoAvancadoDesbloqueado ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-6 max-w-2xl mx-auto">
              <div className="h-20 w-20 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Área Técnica Protegida (Modo Avançado)</h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg mx-auto font-medium">
                  Esta seção contém credenciais críticas de infraestrutura (API Keys, Webhooks, DNS e Variáveis de Sistema). O acesso requer confirmação explícita para evitar alterações acidentais.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalDesbloquearAberto(true)}
                className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm sm:text-base shadow-lg transition-all inline-flex items-center gap-3 cursor-pointer active:scale-95"
              >
                <Unlock className="h-5 w-5 text-[#0088FF]" />
                <span>Desbloquear Configurações Técnicas</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 p-4 sm:p-5 rounded-2xl border border-amber-300">
                <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-amber-950">
                  <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0" />
                  <span>Modo Avançado Desbloqueado com Sucesso. Atenção ao alterar chaves de produção.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModoAvancadoDesbloqueado(false)}
                  className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-black hover:bg-slate-800 transition active:scale-95 cursor-pointer shrink-0"
                >
                  Bloquear Novamente
                </button>
              </div>

              {/* Card Destaque: Gateway Mercado Pago Oficial */}
              <div className="bg-gradient-to-br from-sky-900/10 via-white to-white p-6 sm:p-8 rounded-3xl border-2 border-sky-500/30 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-sm shrink-0">
                      <CreditCard className="w-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">Mercado Pago Oficial (PIX D+0)</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                          Recomendado • Produção
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                        Receba pagamentos das diárias e assinaturas de motoristas com liquidação instantânea via PIX.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMostrarChaves(!mostrarChaves)}
                      className="h-10 px-4 text-xs sm:text-sm font-black text-slate-700 flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-xs cursor-pointer transition active:scale-95"
                    >
                      {mostrarChaves ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span>{mostrarChaves ? "Ocultar Chaves" : "Revelar Chaves"}</span>
                    </button>
                  </div>
                </div>

                {/* Seleção do Gateway Ativo */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                    Provedor de Pagamento PIX Ativo no Ecossistema:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: "MERCADO_PAGO", label: "Mercado Pago", desc: "Oficial (PIX D+0)" },
                      { id: "ASAAS", label: "Asaas", desc: "Subcontas & Split" },
                      { id: "EFI_BANK", label: "Efí Bank", desc: "BACEN Direto" },
                      { id: "MANUAL", label: "PIX Estático", desc: "Chave Manual" },
                    ].map((gw) => (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setActiveGateway(gw.id as any)}
                        className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          activeGateway === gw.id
                            ? "border-sky-500 bg-sky-50/50 text-sky-950 font-bold ring-2 ring-sky-500/20"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
                        }`}
                      >
                        <span className="text-sm font-black">{gw.label}</span>
                        <span className="text-xs text-slate-500 mt-1 font-medium">{gw.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formulário de Credenciais Mercado Pago */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Mercado Pago Access Token (Produção ou Sandbox):
                    </label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={mercadopagoAccessToken}
                      onChange={(e) => setMercadopagoAccessToken(e.target.value)}
                      placeholder="APP_USR-0000000000000000-000000-00000000000000000000000000000000-000000000"
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition font-bold"
                    />
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">
                      Obtenha em: <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noreferrer" className="text-sky-600 underline font-bold">Mercado Pago Developers</a> &gt; Suas integrações &gt; Credenciais de produção.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Mercado Pago Public Key:
                    </label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={mercadopagoPublicKey}
                      onChange={(e) => setMercadopagoPublicKey(e.target.value)}
                      placeholder="APP_USR-00000000-0000-0000-0000-000000000000"
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Webhook Secret (Chave Secreta de Assinatura):
                    </label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={mercadopagoWebhookSecret}
                      onChange={(e) => setMercadopagoWebhookSecret(e.target.value)}
                      placeholder="Ex: whsec_... ou chave de assinatura do webhook"
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition font-bold"
                    />
                  </div>
                </div>

                {/* Modo Sandbox & URL de Webhook para Cadastro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="block text-sm sm:text-base font-bold text-slate-800">Modo Sandbox (Testes)</span>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium">
                        {mercadopagoSandbox ? "Usando ambiente de testes do Mercado Pago" : "Operando em ambiente real de Produção"}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mercadopagoSandbox}
                        onChange={(e) => setMercadopagoSandbox(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                    <span className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">URL de Webhook no Mercado Pago (Edge Function):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={
                          typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes("SEU_PROJETO")
                            ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/payment-webhook`
                            : "https://<SEU_PROJETO>.supabase.co/functions/v1/payment-webhook"
                        }
                        className="w-full h-10 sm:h-11 px-3 rounded-xl border border-slate-200 font-mono text-xs bg-slate-100 text-slate-700 select-all font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes("SEU_PROJETO")
                            ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/payment-webhook`
                            : "https://<SEU_PROJETO>.supabase.co/functions/v1/payment-webhook";
                          navigator.clipboard?.writeText(url);
                          setCopiadoWebhookUrl(true);
                          setTimeout(() => setCopiadoWebhookUrl(false), 2000);
                        }}
                        className="h-10 sm:h-11 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 transition cursor-pointer active:scale-95 shadow-xs"
                      >
                        {copiadoWebhookUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiadoWebhookUrl ? "Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Secundário: Demais Credenciais de Infraestrutura */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Demais Credenciais &amp; Parâmetros de Cluster</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Google Maps Platform API Key:</label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={googleMapsKey}
                      onChange={(e) => setGoogleMapsKey(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Asaas API Token (Fallback):</label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={asaasApiKey}
                      onChange={(e) => setAsaasApiKey(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Stripe Secret Key (Opcional):</label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Global Webhook Secret (HMAC):</label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">DNS / Endpoint Base:</label>
                    <input
                      type="text"
                      value={dnsUrl}
                      onChange={(e) => setDnsUrl(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-sm sm:text-base font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Tempo de Busca / Timeout de Despacho (Segundos):
                    </label>
                    <input
                      type="number"
                      min="60"
                      max="1200"
                      value={timeoutDespachoSec}
                      onChange={(e) => setTimeoutDespachoSec(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-bold text-slate-900"
                    />
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5">
                      Padrão atual: 600s (10 minutos). Se nenhum motorista aceitar, o passageiro poderá continuar buscando ou cancelar.
                    </p>
                  </div>
                </div>

                {sucessoAvancado && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Configurações do Mercado Pago e parâmetros técnicos salvos com sucesso no cluster!</span>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={salvandoTecnico}
                    onClick={() => handleSalvarTecnico()}
                    className="h-12 sm:h-14 px-7 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2.5 cursor-pointer transition disabled:opacity-50 active:scale-95"
                  >
                    {salvandoTecnico ? (
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Save className="h-4.5 w-4.5" />
                    )}
                    <span>{salvandoTecnico ? "Salvando no Cluster..." : "Salvar Configurações Técnicas & Mercado Pago"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DESBLOQUEAR MODO AVANÇADO */}
      {modalDesbloquearAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5 text-rose-600">
                <ShieldAlert className="h-6 w-6" />
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Confirmação de Segurança</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDesbloquearAberto(false)}
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDesbloquearAvancado} className="space-y-4">
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                Para liberar as configurações avançadas e chaves de API, digite a palavra <strong className="text-slate-950 font-black">DESBLOQUEAR</strong> abaixo:
              </p>

              <input
                type="text"
                required
                placeholder="Digite DESBLOQUEAR"
                value={confirmacaoTexto}
                onChange={(e) => setConfirmacaoTexto(e.target.value)}
                className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-black uppercase text-center text-base sm:text-lg tracking-widest focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />

              {erroDesbloqueio && (
                <p className="text-red-600 font-bold text-xs sm:text-sm">{erroDesbloqueio}</p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalDesbloquearAberto(false)}
                  className="h-12 sm:h-14 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-12 sm:h-14 rounded-2xl bg-rose-600 text-white font-black text-xs sm:text-sm hover:bg-rose-700 shadow-md transition cursor-pointer active:scale-95"
                >
                  Confirmar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
