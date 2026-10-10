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
} from "lucide-react";
import { toast } from "sonner";
import { getContaAtiva } from "@/lib/admin-rbac";
import { useBranding } from "@/hooks/useBranding";
import { PalettePickerSection } from "@/components/admin/PalettePickerSection";
import {
  tenantDomainService,
  CANONICAL_CNAME_TARGET,
  type TenantDomainRecord,
} from "@/lib/white-label/tenant-domain-service";
import { whiteLabelEngine } from "@/lib/white-label";
import { MapboxConfig } from "@/config/MapboxConfig";

export const Route = createFileRoute("/app/admin/meu-aplicativo")({
  component: MeuAplicativoPage,
});

export default function MeuAplicativoPage() {
  const conta = getContaAtiva();
  const { branding, activeTenantId, setTenantId } = useBranding();

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
        conta.tenantNome || branding.app_name || "Franquia Regional"
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
        conta.tenantNome || branding.app_name || "Franquia Regional"
      );
    }
    setDominioRecord(found);
    if (found?.domain) {
      setNovoDominioInput(found.domain);
    }
  }, [effectiveTenantId, conta.tenantNome, branding.app_name]);

  // 1. Link Oficial Permanente do Aplicativo (Domínio Próprio do Franqueado)
  const officialAppUrl = useMemo(() => {
    if (dominioRecord && dominioRecord.status === "ATIVO") {
      return `https://${dominioRecord.domain}`;
    }
    if (typeof window === "undefined") return "/app";
    return `${window.location.origin}/app?tenant=${encodeURIComponent(effectiveTenantId)}`;
  }, [dominioRecord, effectiveTenantId]);

  // 2. Link de Teste Imediato / Web Preview (funciona 100% no ambiente atual: Vercel ou Localhost)
  const previewAppUrl = useMemo(() => {
    if (typeof window === "undefined") return `/app?tenant=${encodeURIComponent(effectiveTenantId)}`;
    return `${window.location.origin}/app?tenant=${encodeURIComponent(effectiveTenantId)}`;
  }, [effectiveTenantId]);

  // O link oficial permanente exibido no card principal e usado para distribuição/APK
  const appUrl = officialAppUrl;

  // URL do manifesto dinâmico gerado pelo servidor
  const manifestUrl = useMemo(() => {
    if (typeof window === "undefined") return "/manifest.webmanifest";
    const origin = window.location.origin;
    const tid = effectiveTenantId;
    return `${origin}/manifest.webmanifest?tenant=${encodeURIComponent(tid)}`;
  }, [effectiveTenantId]);

  // Gerar QR Code de alta resolução em DataURL
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

  // URLs diretas e portáteis do ecossistema do Franqueado
  const passengerAppUrl = useMemo(() => {
    if (typeof window === "undefined") return `/app?tenant=${encodeURIComponent(effectiveTenantId)}`;
    return `${window.location.origin}/app?tenant=${encodeURIComponent(effectiveTenantId)}`;
  }, [effectiveTenantId]);

  const driverAppUrl = useMemo(() => {
    if (typeof window === "undefined") return `/app/motorista?tenant=${encodeURIComponent(effectiveTenantId)}`;
    return `${window.location.origin}/app/motorista?tenant=${encodeURIComponent(effectiveTenantId)}`;
  }, [effectiveTenantId]);

  const ordersAppUrl = useMemo(() => {
    if (typeof window === "undefined") return `/app/encomendas?tenant=${encodeURIComponent(effectiveTenantId)}`;
    return `${window.location.origin}/app/encomendas?tenant=${encodeURIComponent(effectiveTenantId)}`;
  }, [effectiveTenantId]);

  // Estados de Configuração de APIs de Mapas Próprias por Franqueado
  const tenantMapConfig = useMemo(() => {
    return MapboxConfig.getTenantMapConfig(effectiveTenantId);
  }, [effectiveTenantId]);

  const [mapProvider, setMapProvider] = useState<"google" | "mapbox" | "osm">(tenantMapConfig.provider);
  const [mapboxTokenInput, setMapboxTokenInput] = useState<string>(tenantMapConfig.mapboxAccessToken);
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
  const [resultadoTesteMapa, setResultadoTesteMapa] = useState<{ valid: boolean; message: string } | null>(null);

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
    toast.success("Link oficial do aplicativo copiado para a área de transferência!");
  }

  function handleCopiarLinkPassageiro() {
    navigator.clipboard.writeText(passengerAppUrl);
    toast.success("Link do aplicativo de passageiros copiado!");
  }

  function handleCopiarLinkMotorista() {
    navigator.clipboard.writeText(driverAppUrl);
    toast.success("Link do portal do motorista copiado!");
  }

  function handleCompartilharWhatsApp(tipo: "PASSAGEIRO" | "MOTORISTA") {
    const nomeApp = branding.app_name || "PARTIU";
    const urlAlvo = tipo === "MOTORISTA" ? driverAppUrl : passengerAppUrl;
    const texto = tipo === "MOTORISTA"
      ? `🚗 Venha dirigir no aplicativo ${nomeApp}! Repasse no PIX D+0 e suporte local. Cadastre-se pelo link oficial: ${urlAlvo}`
      : `📲 Baixe e peça sua viagem no ${nomeApp}! Mais conforto, preço justo e segurança na nossa cidade: ${urlAlvo}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
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
      const prevGeo = tenant?.configuracaoCompleta?.geo || {};

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
      toast.success("Configurações de mapa e geolocalização salvas e aplicadas em tempo real!");
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold tracking-wide uppercase mb-3">
            <Smartphone className="w-3.5 h-3.5" />
            PWA White-Label & Gerador de APK
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Meu Aplicativo & Geração de APK
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Tenha seu próprio aplicativo exclusivo com a marca da sua franquia ({branding.app_name || "Sua Praça"}). Compartilhe o link com motoristas e passageiros e exporte o APK nativo para instalação direta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestarNavegador}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-slate-950 font-bold text-sm shadow-md hover:bg-primary/90 transition active:scale-95 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Testar App ao Vivo
          </button>
        </div>
      </div>

      {/* GRID DE CARDS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1 & 2: LINK OFICIAL E STATUS DO DOMÍNIO (2 COLUNAS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* LINK EXCLUSIVO */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Link Oficial do Seu Aplicativo
              </h2>
              {dominioRecord?.status === "ATIVO" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Domínio Próprio Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Link Provisório da Plataforma
                </span>
              )}
            </div>

            <p className="text-sm text-slate-400">
              Este é o endereço permanente do seu aplicativo web. Qualquer pessoa que acessar este link verá a sua logomarca, suas cores e a praça de atendimento configurada para a sua cidade.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none select-all"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopiarLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-slate-950 font-bold text-xs hover:bg-primary/90 transition shadow cursor-pointer active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Link Oficial
                </button>
                <button
                  onClick={handleTestarNavegador}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition cursor-pointer"
                  title="Abrir endereço permanente do domínio em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Domínio
                </button>
                <button
                  onClick={handleAbrirManifesto}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition cursor-pointer"
                  title="Ver manifesto JSON dinâmico"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  Manifest
                </button>
              </div>
            </div>

            {/* LINKS DEDICADOS E PORTÁTEIS POR PERFIL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Card Link Passageiro */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-primary" />
                    Aplicativo de Passageiros
                  </span>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    Trava ?tenant={effectiveTenantId}
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={passengerAppUrl}
                  className="w-full bg-slate-900 px-3 py-1.5 text-xs text-slate-300 font-mono rounded-lg border border-slate-800 select-all"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopiarLinkPassageiro}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                  <button
                    onClick={() => handleCompartilharWhatsApp("PASSAGEIRO")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* Card Link Motorista */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    Portal & App do Motorista
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Auto-Cadastro Local
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={driverAppUrl}
                  className="w-full bg-slate-900 px-3 py-1.5 text-xs text-slate-300 font-mono rounded-lg border border-slate-800 select-all"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopiarLinkMotorista}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                  <button
                    onClick={() => handleCompartilharWhatsApp("MOTORISTA")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Nome no App</div>
                <div className="text-sm font-bold text-white mt-1">
                  {branding.app_name || "PARTIU"}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Cor Principal</div>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: branding.primary_color }}
                  />
                  <span className="text-sm font-bold text-white font-mono">
                    {branding.primary_color}
                  </span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Segurança SSL</div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-400 mt-1">
                  <ShieldCheck className="w-4 h-4" />
                  HTTPS Ativo
                </div>
              </div>
            </div>
          </div>

          {/* IDENTIDADE VISUAL, CORES & WHITE-LABEL DO APP */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-white">
                    Identidade Visual, Paleta de Cores &amp; White-Label
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Logotipo, ícone do app/APK, splash screen e paletas monocromáticas aplicadas em tempo real.
                </p>
              </div>

              <Link
                to="/app/admin/whitelabel"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:opacity-90 text-slate-950 text-xs font-black shadow transition active:scale-95 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Abrir White-Label Studio Completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Ativos Visuais em Destaque */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Logo do App */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center space-y-2.5">
                <span className="text-xs font-bold text-slate-300">Logotipo da Marca</span>
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                  {branding.logo_url ? (
                    <img src={branding.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold">Sem Logo</span>
                  )}
                </div>
                <Link
                  to="/app/admin/whitelabel"
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Alterar no Estúdio</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Ícone do PWA / APK */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center space-y-2.5">
                <span className="text-xs font-bold text-slate-300">Ícone do App (512x512)</span>
                <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                  {branding.app_icon_url || branding.logo_url ? (
                    <img
                      src={branding.app_icon_url || branding.logo_url || ""}
                      alt="Ícone do App"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <Smartphone className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <Link
                  to="/app/admin/whitelabel"
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Alterar Ícone</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Favicon da Aba */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center space-y-2.5">
                <span className="text-xs font-bold text-slate-300">Favicon do Navegador</span>
                <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                  {branding.favicon_url ? (
                    <img src={branding.favicon_url} alt="Favicon" className="w-10 h-10 object-contain" />
                  ) : (
                    <Globe className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <Link
                  to="/app/admin/whitelabel"
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Alterar Favicon</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Seletor Rápido de Paleta de Cores 1-Clique */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white text-slate-950 border border-slate-200 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Trocar Paleta de Cores do App em 1-Clique
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Sincronização Instantânea
                </span>
              </div>
              <PalettePickerSection targetTenantId={effectiveTenantId} />
            </div>
          </div>

          {/* DOMÍNIO CUSTOMIZADO E APONTAMENTO DNS */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400" />
                Configurar Domínio Customizado (ex: app.suafranquia.com.br)
              </h2>
            </div>

            <p className="text-sm text-slate-400">
              Deseja que os motoristas e passageiros acessem um endereço com a sua marca própria? Cadastre abaixo o seu subdomínio e aponte o registro DNS no seu provedor (ex: Registro.br, Cloudflare, GoDaddy).
            </p>

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
                  className="w-full pl-20 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary transition font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={salvandoDominio}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow transition disabled:opacity-50 cursor-pointer"
              >
                {salvandoDominio ? "Salvando..." : "Salvar Domínio"}
              </button>
            </form>

            {dominioRecord && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Instrução de Apontamento DNS
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
                        <th className="pb-2">Tipo</th>
                        <th className="pb-2">Nome / Entrada</th>
                        <th className="pb-2">Destino / Valor</th>
                        <th className="pb-2">TTL</th>
                        <th className="pb-2">Status</th>
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

          {/* CONECTAR APIS DE MAPAS PRÓPRIA (GOOGLE MAPS / MAPBOX / CARTO) */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Conectar APIs de Mapas Própria (Google Maps / Mapbox)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Isolamento total de cotas e faturamento por franqueado regional
                  </p>
                </div>
              </div>

              {tenantMapConfig.isMatriz ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Matriz Oficial (Chave Central)
                </span>
              ) : tenantMapConfig.hasOwnGoogleKey && mapProvider === "google" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Google Maps Conectado
                </span>
              ) : tenantMapConfig.hasOwnMapboxKey && mapProvider === "mapbox" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mapbox Conectado
                </span>
              ) : mapProvider === "osm" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold">
                  <Globe className="w-3.5 h-3.5" />
                  CARTO / OSM Gratuito
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Chave Pendente (CARTO Fallback)
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p>
                <strong className="text-white">Regra Estrita de Governança e Custos:</strong> Cada franqueado deve conectar sua própria chave de API (Google Maps ou Mapbox). O sistema da Matriz Central é o único que consome a chave oficial do Super Administrador.
              </p>
              <p className="text-slate-400">
                Se você ainda não possui uma chave própria, seu aplicativo operará automaticamente na camada gratuita e de alta disponibilidade CARTO / OpenStreetMap sem qualquer custo extra.
              </p>
            </div>

            <form onSubmit={handleSalvarConfigMapas} className="space-y-4">
              {/* Seletor de Provedor */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Selecione o Provedor de Mapas para esta Franquia:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setMapProvider("google")}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      mapProvider === "google"
                        ? "bg-primary/10 border-primary text-white shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Google Maps</span>
                      {mapProvider === "google" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tiles oficiais, rotas de trânsito em tempo real e satélite Google.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMapProvider("mapbox")}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      mapProvider === "mapbox"
                        ? "bg-primary/10 border-primary text-white shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">Mapbox GL JS</span>
                      {mapProvider === "mapbox" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Visual 3D vetorial ultra-fluido (Padrão Uber e 99 App).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMapProvider("osm")}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                      mapProvider === "osm"
                        ? "bg-primary/10 border-primary text-white shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">CARTO / OSM</span>
                      {mapProvider === "osm" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      100% gratuito e sem custos por requisição.
                    </p>
                  </button>
                </div>
              </div>

              {/* Campo para Google Maps */}
              {mapProvider === "google" && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-primary" />
                      Chave de API do Google Maps (Google Cloud Platform)
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
                  <p className="text-[11px] text-slate-400">
                    Obtenha sua chave no console do Google Cloud com as APIs <code className="text-primary">Maps JavaScript</code>, <code className="text-primary">Directions API</code> e <code className="text-primary">Geocoding API</code> ativadas.
                  </p>
                </div>
              )}

              {/* Campo para Mapbox */}
              {mapProvider === "mapbox" && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-primary" />
                      Token de Acesso Mapbox (pk.*)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMapboxToken(!showMapboxToken)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {showMapboxToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showMapboxToken ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  <input
                    type={showMapboxToken ? "text" : "password"}
                    value={mapboxTokenInput}
                    onChange={(e) => setMapboxTokenInput(e.target.value)}
                    placeholder="pk.eyJ1Ijoic3VhZnJhbnF1aWEiLCJhIjoiY2x4..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-slate-400">
                    Insira seu Public Access Token do Mapbox obtido em <code className="text-primary">account.mapbox.com</code>.
                  </p>
                </div>
              )}

              {/* Coordenadas e Raio da Cidade */}
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
                    Raio de Cobertura (Km)
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

              {/* Feedback do Teste de Conexão */}
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

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestarChaveMapa}
                  disabled={testandoMapa}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testandoMapa ? "animate-spin" : ""}`} />
                  {testandoMapa ? "Validando Chave..." : "Testar Conexão da API"}
                </button>

                <button
                  type="submit"
                  disabled={salvandoMapa}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {salvandoMapa ? "Salvando..." : "Salvar Configurações de Mapa"}
                </button>
              </div>
            </form>
          </div>

          {/* BANCO DE DADOS & NUVEM DEDICADA DO FRANQUEADO */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Banco de Dados &amp; Nuvem Dedicada do APK
                  </h2>
                  <p className="text-xs text-slate-400">
                    Isolamento Criptográfico e de Sessão Zero-Trust por Franquia
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Partição 100% Isolada
              </span>
            </div>

            <p className="text-sm text-slate-300">
              Cada franquia possui seu próprio ecossistema de dados e segregação completa de usuários. Passageiros, motoristas e corridas cadastrados nesta praça ({branding.app_name || "Sua Operação"}) não se misturam nem colidem com a conta matriz ou com outras cidades.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Modo de Banco</span>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Isolamento Zero-Trust
                </div>
                <p className="text-[11px] text-slate-500">RLS + Tenant Guard Ativo</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Segregação de Contas</span>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Usuários Exclusivos
                </div>
                <p className="text-[11px] text-slate-500">Bloqueio de Contas Externas</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Identificador do Tenant</span>
                <div className="text-sm font-bold text-primary font-mono truncate">
                  {effectiveTenantId}
                </div>
                <p className="text-[11px] text-slate-500">Chave de Partição Única</p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: QR CODE DE ACESSO RÁPIDO (1 COLUNA) */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                QR Code do Aplicativo
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Escaneie com a câmera de qualquer smartphone para abrir o aplicativo.
            </p>

            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mt-3 text-xs">
              <button
                type="button"
                onClick={() => setQrCodeMode("OFICIAL")}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition cursor-pointer text-center ${
                  qrCodeMode === "OFICIAL"
                    ? "bg-primary text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Domínio Oficial
              </button>
              <button
                type="button"
                onClick={() => setQrCodeMode("PREVIEW")}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition cursor-pointer text-center ${
                  qrCodeMode === "PREVIEW"
                    ? "bg-primary text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Link Preview
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code do Aplicativo"
                className="w-52 h-52 rounded-xl shadow-lg border-2 border-white/10 p-2 bg-white"
              />
            ) : (
              <div className="w-52 h-52 rounded-xl bg-slate-900 animate-pulse flex items-center justify-center text-xs text-slate-500">
                Gerando QR Code...
              </div>
            )}
            <p className="text-xs text-slate-400 mt-3 font-mono text-center break-all max-w-xs">
              {qrCodeMode === "OFICIAL" ? officialAppUrl : previewAppUrl}
            </p>
          </div>

          <button
            onClick={handleBaixarQrCode}
            disabled={!qrCodeUrl}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition shadow cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Baixar QR Code (PNG) para Divulgação
          </button>
        </div>
      </div>

      {/* MINI-GUIA PASSO A PASSO: GERADOR DE APK COM PWABUILDER */}
      <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase mb-2">
              <Layers className="w-3.5 h-3.5" />
              Tutorial Oficial PWABuilder (TWA)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Como Gerar seu Aplicativo Android (APK / AAB)
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Siga os 4 passos abaixo para empacotar o seu PWA em um APK nativo usando a ferramenta gratuita oficial da Microsoft (PWABuilder).
            </p>
          </div>

          <a
            href={pwabuilderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Abrir PWABuilder com Meu App
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* PASSO 1 */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 relative">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-sm font-black">
              1
            </div>
            <h3 className="text-base font-bold text-white">Copie o Link Oficial</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clique no botão "Copiar Link" no card acima para obter a URL exclusiva do seu aplicativo com seus parâmetros White-Label.
            </p>
          </div>

          {/* PASSO 2 */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 relative">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-sm font-black">
              2
            </div>
            <h3 className="text-base font-bold text-white">Cole no PWABuilder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acesse <strong className="text-white">pwabuilder.com</strong>, cole a URL no campo de busca e clique em <strong className="text-primary">Start</strong>.
            </p>
          </div>

          {/* PASSO 3 */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 relative">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-sm font-black">
              3
            </div>
            <h3 className="text-base font-bold text-white">Leitura Automática</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O PWABuilder lerá o manifesto dinâmico com o nome <strong className="text-white">({branding.app_name || "PARTIU"})</strong>, as cores da sua paleta e os ícones configurados.
            </p>
          </div>

          {/* PASSO 4 */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 relative">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-sm font-black">
              4
            </div>
            <h3 className="text-base font-bold text-white">Baixe o APK ou AAB</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clique em <strong className="text-emerald-400">Package for Stores</strong> &rarr; <strong className="text-emerald-400">Android</strong>. Escolha <strong className="text-white">APK</strong> para distribuição direta ou <strong className="text-white">AAB</strong> para a Google Play.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 flex-shrink-0 text-blue-400 mt-0.5" />
          <div>
            <strong className="font-bold text-blue-200">Dica Operacional:</strong>
            {" "}Como nosso PWA já implementa Service Worker com cache offline e suporte completo a Web Push e Geolocation em segundo plano, o APK gerado possui pontuação máxima (Score 100) no PWABuilder e é aceito sem restrições na Google Play Console.
          </div>
        </div>
      </div>
    </div>
  );
}
