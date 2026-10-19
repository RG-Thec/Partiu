import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import {
  Smartphone,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Download,
  FileCode,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Server,
  Layers,
  HelpCircle,
  Palette,
  Database,
  MapPin,
  Navigation,
  Eye,
  EyeOff,
  Share2,
  Key,
  Check,
  QrCode,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { getContaAtiva } from "@/lib/admin-rbac";
import { useBranding } from "@/hooks/useBranding";
import {
  tenantDomainService,
  CANONICAL_CNAME_TARGET,
  type TenantDomainRecord,
} from "@/lib/white-label/tenant-domain-service";
import { whiteLabelEngine } from "@/lib/white-label";
import { MapboxConfig } from "@/config/MapboxConfig";

export const Route = createFileRoute("/app/admin/meu-aplicativo")({
  head: () => ({
    meta: [
      { title: "Meu Aplicativo & Geração de APK | PARTIU Admin" },
      {
        name: "description",
        content:
          "Distribuição PWA, geração de APK nativo, domínio próprio e parametrização de mapas por franquia.",
      },
    ],
  }),
  component: MeuAplicativoPage,
});

type AbaMeuApp = "links" | "apk" | "dominio" | "mapas" | "nuvem";

export default function MeuAplicativoPage() {
  const conta = getContaAtiva();
  const { branding, activeTenantId, setTenantId } = useBranding();
  const [abaAtiva, setAbaAtiva] = useState<AbaMeuApp>("links");

  // Para o FRANQUEADO autenticado, o seu tenantId tem prioridade máxima absoluta
  const effectiveTenantId = useMemo(() => {
    if (conta.role === "FRANQUEADO" && conta.tenantId) {
      return conta.tenantId;
    }
    return activeTenantId || conta.tenantId || "default";
  }, [conta.role, conta.tenantId, activeTenantId]);

  // Se o franqueado estiver no painel e o activeTenantId ainda estiver diferente, sincroniza imediatamente
  useEffect(() => {
    if (conta.role === "FRANQUEADO" && conta.tenantId && activeTenantId !== conta.tenantId) {
      void setTenantId(conta.tenantId);
    }
  }, [conta.role, conta.tenantId, activeTenantId, setTenantId]);

  const [dominioRecord, setDominioRecord] = useState<TenantDomainRecord | undefined>(() => {
    const existing = tenantDomainService.getDomainByTenantId(effectiveTenantId);
    if (existing) return existing;
    if (effectiveTenantId && effectiveTenantId !== "default") {
      return tenantDomainService.getOrCreateDomainForTenant(
        effectiveTenantId,
        conta.tenantNome || branding.app_name || "Franquia Regional",
      );
    }
    return undefined;
  });

  const [novoDominioInput, setNovoDominioInput] = useState(dominioRecord?.domain || "");
  const [salvandoDominio, setSalvandoDominio] = useState(false);
  const [testandoDns, setTestandoDns] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrCodeMode, setQrCodeMode] = useState<"OFICIAL" | "PREVIEW">("OFICIAL");

  // Recarregar registro de domínio quando tenant mudar
  useEffect(() => {
    let found = tenantDomainService.getDomainByTenantId(effectiveTenantId);
    if (!found && effectiveTenantId && effectiveTenantId !== "default") {
      found = tenantDomainService.getOrCreateDomainForTenant(
        effectiveTenantId,
        conta.tenantNome || branding.app_name || "Franquia Regional",
      );
    }
    setDominioRecord(found);
    if (found?.domain) {
      setNovoDominioInput(found.domain);
    }
  }, [effectiveTenantId, conta.tenantNome, branding.app_name]);

  // Link Oficial Permanente do Aplicativo (Página Inicial com Identidade da Praça)
  const officialAppUrl = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const origin = window.location.origin;
    if (
      dominioRecord &&
      dominioRecord.status === "ATIVO" &&
      window.location.hostname === dominioRecord.domain
    ) {
      return `https://${dominioRecord.domain}`;
    }
    if (effectiveTenantId && effectiveTenantId !== "default") {
      return `${origin}/?tenant=${encodeURIComponent(effectiveTenantId)}`;
    }
    return `${origin}/`;
  }, [dominioRecord, effectiveTenantId]);

  // Link de Teste Imediato / Web Preview (Página Inicial)
  const previewAppUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return effectiveTenantId && effectiveTenantId !== "default"
        ? `/?tenant=${encodeURIComponent(effectiveTenantId)}`
        : "/";
    }
    if (effectiveTenantId && effectiveTenantId !== "default") {
      return `${window.location.origin}/?tenant=${encodeURIComponent(effectiveTenantId)}`;
    }
    return `${window.location.origin}/`;
  }, [effectiveTenantId]);

  const appUrl = officialAppUrl;

  // URL do manifesto dinâmico gerado pelo servidor
  const manifestUrl = useMemo(() => {
    if (typeof window === "undefined") return "/manifest.webmanifest";
    const origin = window.location.origin;
    const tid = effectiveTenantId;
    return `${origin}/manifest.webmanifest?tenant=${encodeURIComponent(tid)}`;
  }, [effectiveTenantId]);

  // Gerar QR Code
  useEffect(() => {
    const targetUrl = qrCodeMode === "OFICIAL" ? officialAppUrl : previewAppUrl;
    if (!targetUrl) return;
    QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("Erro ao gerar QR Code:", err));
  }, [officialAppUrl, previewAppUrl, qrCodeMode]);

  // URLs diretas por perfil
  // Passageiro: direciona para a Página Inicial com a marca da franquia para apresentação e login
  const passengerAppUrl = useMemo(() => {
    if (typeof window === "undefined") return "/";
    const origin = window.location.origin;
    if (
      dominioRecord &&
      dominioRecord.status === "ATIVO" &&
      window.location.hostname === dominioRecord.domain
    ) {
      return `https://${dominioRecord.domain}`;
    }
    if (effectiveTenantId && effectiveTenantId !== "default") {
      return `${origin}/?tenant=${encodeURIComponent(effectiveTenantId)}`;
    }
    return `${origin}/`;
  }, [dominioRecord, effectiveTenantId]);

  const driverAppUrl = useMemo(() => {
    if (typeof window === "undefined")
      return `/app/motorista?tenant=${encodeURIComponent(effectiveTenantId)}`;
    return `${window.location.origin}/app/motorista?tenant=${encodeURIComponent(effectiveTenantId)}`;
  }, [effectiveTenantId]);

  const ordersAppUrl = useMemo(() => {
    if (typeof window === "undefined")
      return `/app/encomendas?tenant=${encodeURIComponent(effectiveTenantId)}`;
    return `${window.location.origin}/app/encomendas?tenant=${encodeURIComponent(effectiveTenantId)}`;
  }, [effectiveTenantId]);

  // Configurações de Mapas
  const tenantMapConfig = useMemo(() => {
    return MapboxConfig.getTenantMapConfig(effectiveTenantId);
  }, [effectiveTenantId]);

  const [mapProvider, setMapProvider] = useState<"google" | "mapbox" | "osm">(
    tenantMapConfig.provider,
  );
  const [mapboxTokenInput, setMapboxTokenInput] = useState<string>(
    tenantMapConfig.mapboxAccessToken,
  );
  const [googleKeyInput, setGoogleKeyInput] = useState<string>(tenantMapConfig.googleMapsApiKey);
  const [centerLatInput, setCenterLatInput] = useState<number>(tenantMapConfig.center[1]);
  const [centerLngInput, setCenterLngInput] = useState<number>(tenantMapConfig.center[0]);
  const [radiusKmInput, setRadiusKmInput] = useState<number>(() => {
    const t = whiteLabelEngine.getTenantById(effectiveTenantId);
    return t?.configuracaoCompleta?.geo?.raioOperacaoPadraoKm || 15;
  });

  const [showMapboxToken, setShowMapboxToken] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [testandoMapa, setTestandoMapa] = useState(false);
  const [salvandoMapa, setSalvandoMapa] = useState(false);
  const [resultadoTesteMapa, setResultadoTesteMapa] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  // Recarregar configurações de mapas ao alternar de franquia
  useEffect(() => {
    const cfg = MapboxConfig.getTenantMapConfig(effectiveTenantId);
    setMapProvider(cfg.provider);
    setMapboxTokenInput(cfg.mapboxAccessToken);
    setGoogleKeyInput(cfg.googleMapsApiKey);
    setCenterLatInput(cfg.center[1]);
    setCenterLngInput(cfg.center[0]);
    const t = whiteLabelEngine.getTenantById(effectiveTenantId);
    setRadiusKmInput(t?.configuracaoCompleta?.geo?.raioOperacaoPadraoKm || 15);
    setResultadoTesteMapa(null);
  }, [effectiveTenantId]);

  function handleCopiarLink() {
    navigator.clipboard.writeText(appUrl);
    toast.success("Link oficial do aplicativo copiado!");
  }

  function handleCopiarLinkPassageiro() {
    navigator.clipboard.writeText(passengerAppUrl);
    toast.success("Link do aplicativo de passageiros copiado!");
  }

  function handleCopiarLinkMotorista() {
    navigator.clipboard.writeText(driverAppUrl);
    toast.success("Link do portal do motorista copiado!");
  }

  function handleCopiarLinkEncomendas() {
    navigator.clipboard.writeText(ordersAppUrl);
    toast.success("Link do módulo de entregas flash copiado!");
  }

  function handleCompartilharWhatsApp(tipo: "PASSAGEIRO" | "MOTORISTA" | "GERAL") {
    const nomeApp = branding.app_name || "PARTIU";
    const urlAlvo =
      tipo === "MOTORISTA" ? driverAppUrl : tipo === "GERAL" ? appUrl : passengerAppUrl;
    const texto =
      tipo === "MOTORISTA"
        ? `🚗 Venha dirigir no aplicativo ${nomeApp}! Repasse no PIX D+0 e suporte local. Cadastre-se pelo link oficial: ${urlAlvo}`
        : `📲 Baixe e peça sua viagem no ${nomeApp}! Mais conforto, preço justo e segurança na nossa cidade: ${urlAlvo}`;
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleTestarChaveMapa() {
    setTestandoMapa(true);
    setResultadoTesteMapa(null);
    try {
      if (mapProvider === "mapbox") {
        const res = await MapboxConfig.testMapboxToken(mapboxTokenInput.trim());
        setResultadoTesteMapa(res);
        if (res.valid) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      } else if (mapProvider === "google") {
        const res = await MapboxConfig.testGoogleMapsApiKey(googleKeyInput.trim());
        setResultadoTesteMapa(res);
        if (res.valid) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      } else {
        const res = {
          valid: true,
          message: "OpenStreetMap / CARTO selecionado (camada pública sem custos de chave).",
        };
        setResultadoTesteMapa(res);
        toast.success(res.message);
      }
    } catch (err: any) {
      const res = { valid: false, message: err?.message || "Falha ao testar chave de API." };
      setResultadoTesteMapa(res);
      toast.error(res.message);
    } finally {
      setTestandoMapa(false);
    }
  }

  async function handleSalvarConfigMapas(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoMapa(true);
    try {
      const tenant = whiteLabelEngine.getTenantById(effectiveTenantId);
      const prevGeo = tenant?.configuracaoCompleta?.geo || whiteLabelEngine.getActiveConfig().geo;

      const updatedGeo = {
        ...prevGeo,
        mapProvider,
        mapboxAccessToken: mapboxTokenInput.trim(),
        googleMapsApiKey: googleKeyInput.trim(),
        coordenadasCentroLat: Number(centerLatInput),
        coordenadasCentroLng: Number(centerLngInput),
        raioOperacaoPadraoKm: Number(radiusKmInput),
      };

      whiteLabelEngine.updateTenantConfig(effectiveTenantId, { geo: updatedGeo });
      toast.success("Configurações de mapa e geolocalização salvas com sucesso!");
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err?.message || "Tente novamente."}`);
    } finally {
      setSalvandoMapa(false);
    }
  }

  function handleTestarNavegador() {
    window.open(appUrl, "_blank", "noopener,noreferrer");
  }

  function handleAbrirManifesto() {
    window.open(manifestUrl, "_blank", "noopener,noreferrer");
  }

  function handleBaixarQrCode() {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `qrcode-${(branding.app_name || "partiu").toLowerCase().replace(/\s+/g, "-")}.png`;
    link.click();
    toast.success("QR Code baixado com sucesso!");
  }

  async function handleSalvarDominio(e: React.FormEvent) {
    e.preventDefault();
    if (!novoDominioInput.trim()) {
      toast.error("Informe um domínio customizado válido.");
      return;
    }

    setSalvandoDominio(true);
    const tid = effectiveTenantId;
    const nomePraca = conta.tenantNome || branding.app_name || "Franqueado Regional";

    const res = tenantDomainService.registerCustomDomain(tid, novoDominioInput.trim(), nomePraca);

    if (!res.sucesso) {
      toast.error(res.mensagem);
      setSalvandoDominio(false);
      return;
    }

    setDominioRecord(res.record);
    toast.success("Domínio registrado! Configure a entrada CNAME no seu provedor de DNS.");
    setSalvandoDominio(false);
  }

  async function handleRevalidarDns() {
    if (!dominioRecord) return;
    setTestandoDns(true);
    try {
      const res = await tenantDomainService.verifyDomainDns(dominioRecord.domain);
      setDominioRecord(res.record);
      if (res.sucesso) {
        toast.success(res.mensagem);
      } else {
        toast.warning(res.mensagem);
      }
    } catch (err: any) {
      toast.error(`Erro ao validar DNS: ${err.message}`);
    } finally {
      setTestandoDns(false);
    }
  }

  const pwabuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(appUrl)}`;

  return (
    <div className="w-full space-y-6 pb-16">
      {/* 1. HEADER EXECUTIVO & CONTROL BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold tracking-wide uppercase mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            PWA White-Label &amp; Geração de APK
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Meu Aplicativo &amp; Geração de APK
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Painel unificado de distribuição do app ({branding.app_name || "Sua Praça"}). Gerencie
            links, empacotamento nativo Android, domínio e provedores de mapas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopiarLink}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer active:scale-95 shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar Link Oficial
          </button>
          <button
            onClick={handleTestarNavegador}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-slate-950 font-bold text-xs shadow-md hover:bg-primary/90 transition active:scale-95 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Testar App ao Vivo
          </button>
        </div>
      </div>

      {/* 2. STATS PILLS RESUMIDOS (Visão Rápida Sem Rolagem) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              App da Praça
            </span>
            <span className="text-sm font-black text-white mt-0.5 block truncate max-w-[130px]">
              {branding.app_name || "PARTIU"}
            </span>
          </div>
          <Smartphone className="w-5 h-5 text-primary" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Domínio Web
            </span>
            <span className="text-xs font-bold text-emerald-400 mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {dominioRecord?.status === "ATIVO" ? "Próprio Ativo" : "Provisório SSL"}
            </span>
          </div>
          <Globe className="w-5 h-5 text-emerald-400/80" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Motor Cartográfico
            </span>
            <span className="text-xs font-bold text-indigo-400 mt-0.5 block uppercase">
              {mapProvider === "mapbox"
                ? "Mapbox 3D"
                : mapProvider === "google"
                  ? "Google Maps"
                  : "CARTO Grátis"}
            </span>
          </div>
          <Navigation className="w-5 h-5 text-indigo-400/80" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Nuvem &amp; Tenant
            </span>
            <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block truncate max-w-[130px]">
              {effectiveTenantId}
            </span>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* 3. NAVEGAÇÃO POR ABAS OPERACIONAIS (Elimina o Monólito e Sobrecarga Cognitiva) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setAbaAtiva("links")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            abaAtiva === "links"
              ? "bg-primary text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Share2 className="w-4 h-4" />
          Links &amp; Divulgação
        </button>

        <button
          onClick={() => setAbaAtiva("apk")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            abaAtiva === "apk"
              ? "bg-primary text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Layers className="w-4 h-4" />
          Gerador de APK (PWABuilder)
        </button>

        <button
          onClick={() => setAbaAtiva("dominio")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            abaAtiva === "dominio"
              ? "bg-primary text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Globe className="w-4 h-4" />
          Domínio Customizado &amp; DNS
        </button>

        <button
          onClick={() => setAbaAtiva("mapas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            abaAtiva === "mapas"
              ? "bg-primary text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Navigation className="w-4 h-4" />
          Provedores de Mapas &amp; Raio
        </button>

        <button
          onClick={() => setAbaAtiva("nuvem")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            abaAtiva === "nuvem"
              ? "bg-primary text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Database className="w-4 h-4" />
          Nuvem &amp; Segurança Zero-Trust
        </button>
      </div>

      {/* 4. CONTEÚDO DAS ABAS */}

      {/* ABA 1: LINKS & DIVULGAÇÃO */}
      {abaAtiva === "links" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
          {/* COLUNA ESQUERDA: LINKS DIRETOS (7/12) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Link Oficial Permanente */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-primary" />
                  Endereço Oficial Permanente
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  SSL HTTPS Ativo
                </span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none select-all truncate"
                />
                <button
                  onClick={handleCopiarLink}
                  className="px-3 py-1.5 rounded-lg bg-primary text-slate-950 font-bold text-xs hover:bg-primary/90 transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </button>
              </div>
            </div>

            {/* Links Específicos por Perfil de Usuário */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Passageiro */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-primary" />
                    App Passageiro
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Página Inicial</span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={passengerAppUrl}
                  className="w-full bg-slate-950 px-2.5 py-1.5 text-[11px] text-slate-300 font-mono rounded-lg border border-slate-800 select-all truncate"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopiarLinkPassageiro}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                  <button
                    onClick={() => handleCompartilharWhatsApp("PASSAGEIRO")}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* Motorista */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    Portal Motorista
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">/motorista</span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={driverAppUrl}
                  className="w-full bg-slate-950 px-2.5 py-1.5 text-[11px] text-slate-300 font-mono rounded-lg border border-slate-800 select-all truncate"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopiarLinkMotorista}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                  <button
                    onClick={() => handleCompartilharWhatsApp("MOTORISTA")}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Acesso ao White Label Studio */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Quer alterar cores, logos ou ícones?
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Personalize o logotipo, splash screen e paletas no White Label Studio.
                  </span>
                </div>
              </div>
              <Link
                to="/app/admin/whitelabel"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 border border-slate-700"
              >
                Abrir Studio
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* COLUNA DIREITA: QR CODE DE ALTA RESOLUÇÃO (5/12) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-primary" />
                QR Code para Divulgação
              </h3>
              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => setQrCodeMode("OFICIAL")}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                    qrCodeMode === "OFICIAL"
                      ? "bg-primary text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Oficial
                </button>
                <button
                  onClick={() => setQrCodeMode("PREVIEW")}
                  className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                    qrCodeMode === "PREVIEW"
                      ? "bg-primary text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code do App"
                  className="w-40 h-40 rounded-xl shadow-lg border border-white/20 p-2 bg-white"
                />
              ) : (
                <div className="w-40 h-40 rounded-xl bg-slate-900 animate-pulse flex items-center justify-center text-xs text-slate-500">
                  Gerando...
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-2.5 font-mono text-center break-all max-w-[220px]">
                {qrCodeMode === "OFICIAL" ? officialAppUrl : previewAppUrl}
              </p>
            </div>

            <button
              onClick={handleBaixarQrCode}
              disabled={!qrCodeUrl}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer active:scale-95 disabled:opacity-50 border border-slate-700"
            >
              <Download className="w-4 h-4" />
              Baixar QR Code (PNG) em Alta Resolução
            </button>
          </div>
        </div>
      )}

      {/* ABA 2: GERADOR DE APK (PWABUILDER) */}
      {abaAtiva === "apk" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Prontidão PWA Nível 100 Aprovada
                </span>
                <h2 className="text-xl font-black text-white">
                  Empacotar Aplicativo Nativo Android (APK / AAB)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Converta o PWA da sua franquia em um APK instalável ou pacote para a Google Play
                  Console.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAbrirManifesto}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <FileCode className="w-4 h-4" />
                  Ver Manifesto JSON
                </button>
                <a
                  href={pwabuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                >
                  Abrir no PWABuilder Oficial
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Checklist Visual dos 4 Passos em Grid Compacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-black">
                  1
                </div>
                <h4 className="text-xs font-bold text-white">Copiar URL Oficial</h4>
                <p className="text-[11px] text-slate-400">
                  A URL já carrega os parâmetros da praça{" "}
                  <strong className="text-white">({branding.app_name})</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-black">
                  2
                </div>
                <h4 className="text-xs font-bold text-white">Start no PWABuilder</h4>
                <p className="text-[11px] text-slate-400">
                  Cole no site oficial da Microsoft para validação automática de ícones e SSL.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-black">
                  3
                </div>
                <h4 className="text-xs font-bold text-white">Package for Stores</h4>
                <p className="text-[11px] text-slate-400">
                  Clique na aba Android e defina a assinatura e chave do pacote TWA.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-black">
                  4
                </div>
                <h4 className="text-xs font-bold text-white">Baixar APK ou AAB</h4>
                <p className="text-[11px] text-slate-400">
                  Baixe o APK para envio via WhatsApp ou AAB para a Google Play Store.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300 flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Nota Técnica:</strong> O Service Worker do sistema possui cache inteligente,
                push notifications e geolocalização em segundo plano já homologados para lojas de
                aplicativos.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: DOMÍNIO CUSTOMIZADO & DNS */}
      {abaAtiva === "dominio" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-400" />
                  Domínio Próprio da Franquia
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cadastre seu endereço exclusivo (ex: app.suafranquia.com.br) para operar com marca
                  100% própria.
                </p>
              </div>
            </div>

            <form onSubmit={handleSalvarDominio} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                  https://
                </span>
                <input
                  type="text"
                  placeholder="app.minhafranquia.com.br"
                  value={novoDominioInput}
                  onChange={(e) => setNovoDominioInput(e.target.value)}
                  className="w-full pl-20 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-primary transition font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={salvandoDominio}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {salvandoDominio ? "Salvando..." : "Salvar Domínio"}
              </button>
            </form>

            {dominioRecord && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tabela de Apontamento DNS
                  </span>
                  <button
                    onClick={handleRevalidarDns}
                    disabled={testandoDns}
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testandoDns ? "animate-spin" : ""}`} />
                    Rechecar Propagação DNS
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 font-bold">Tipo</th>
                        <th className="pb-2 font-bold">Entrada / Host</th>
                        <th className="pb-2 font-bold">Destino / Valor</th>
                        <th className="pb-2 font-bold">TTL</th>
                        <th className="pb-2 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      <tr>
                        <td className="py-2.5 text-indigo-400 font-bold">CNAME</td>
                        <td className="py-2.5 text-white">
                          {dominioRecord.domain.split(".")[0] || "app"}
                        </td>
                        <td className="py-2.5 text-primary font-bold">{CANONICAL_CNAME_TARGET}</td>
                        <td className="py-2.5 text-slate-400">300 (Automático)</td>
                        <td className="py-2.5">
                          {dominioRecord.status === "ATIVO" ? (
                            <span className="text-emerald-400 font-sans font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Propagado
                            </span>
                          ) : (
                            <span className="text-amber-400 font-sans font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 4: PROVEDORES DE MAPAS & RAIO */}
      {abaAtiva === "mapas" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-400" />
                  Parametrização Cartográfica da Franquia
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Isolamento de cotas, faturamento e coordenadas centrais por cidade.
                </p>
              </div>

              {mapProvider === "mapbox" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mapbox GL Ativo
                </span>
              ) : mapProvider === "google" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Google Maps Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold">
                  <Globe className="w-3.5 h-3.5" />
                  CARTO Grátis
                </span>
              )}
            </div>

            <form onSubmit={handleSalvarConfigMapas} className="space-y-4">
              {/* 3 Provedores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMapProvider("mapbox")}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    mapProvider === "mapbox"
                      ? "bg-primary/20 border-primary text-white shadow-sm ring-1 ring-primary"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Mapbox GL JS</span>
                    {mapProvider === "mapbox" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Visual 3D vetorial ultra-rápido (Padrão Uber).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMapProvider("google")}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    mapProvider === "google"
                      ? "bg-primary/20 border-primary text-white shadow-sm ring-1 ring-primary"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Google Maps</span>
                    {mapProvider === "google" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tiles oficiais, trânsito real e satélite.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMapProvider("osm")}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    mapProvider === "osm"
                      ? "bg-primary/20 border-primary text-white shadow-sm ring-1 ring-primary"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">CARTO / OSM</span>
                    {mapProvider === "osm" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    100% gratuito e sem custos por requisição.
                  </p>
                </button>
              </div>

              {/* Chave Mapbox */}
              {mapProvider === "mapbox" && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-primary" />
                      Token Público Mapbox (pk.*)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMapboxToken(!showMapboxToken)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {showMapboxToken ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                      {showMapboxToken ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  <input
                    type={showMapboxToken ? "text" : "password"}
                    value={mapboxTokenInput}
                    onChange={(e) => setMapboxTokenInput(e.target.value)}
                    placeholder="pk.eyJ1Ijoic3VhZnJhbnF1aWEiLCJhIjoi..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Chave Google Maps */}
              {mapProvider === "google" && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-primary" />
                      Chave de API do Google Maps (GCP)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowGoogleKey(!showGoogleKey)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {showGoogleKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showGoogleKey ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  <input
                    type={showGoogleKey ? "text" : "password"}
                    value={googleKeyInput}
                    onChange={(e) => setGoogleKeyInput(e.target.value)}
                    placeholder="AIzaSyA1B2C3D4E5F6G7H8..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Coordenadas e Raio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    Latitude Central
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={centerLatInput}
                    onChange={(e) => setCenterLatInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    Longitude Central
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={centerLngInput}
                    onChange={(e) => setCenterLngInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Raio Operacional (Km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={radiusKmInput}
                    onChange={(e) => setRadiusKmInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {resultadoTesteMapa && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    resultadoTesteMapa.valid
                      ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                      : "bg-red-950/60 border-red-800 text-red-300"
                  }`}
                >
                  {resultadoTesteMapa.valid ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span>{resultadoTesteMapa.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestarChaveMapa}
                  disabled={testandoMapa}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testandoMapa ? "animate-spin" : ""}`} />
                  {testandoMapa ? "Validando..." : "Testar Conexão"}
                </button>

                <button
                  type="submit"
                  disabled={salvandoMapa}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {salvandoMapa ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABA 5: NUVEM & SEGURANÇA ZERO-TRUST */}
      {abaAtiva === "nuvem" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  Segregação de Dados &amp; Nuvem Zero-Trust
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Isolamento total de motoristas, corridas e faturamento por chave de partição.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Partição 100% Segregada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Modo de Banco</span>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Isolamento RLS Ativo
                </div>
                <p className="text-[11px] text-slate-500">Row Level Security no Postgres</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Segregação de Contas</span>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Usuários Locais
                </div>
                <p className="text-[11px] text-slate-500">Sem vazamento entre praças</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Chave do Tenant</span>
                <div className="text-sm font-bold text-primary font-mono truncate">
                  {effectiveTenantId}
                </div>
                <p className="text-[11px] text-slate-500">Identificador criptográfico</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
