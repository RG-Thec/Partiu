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

export const Route = createFileRoute("/app/admin/meu-aplicativo")({
  component: MeuAplicativoPage,
});

export default function MeuAplicativoPage() {
  const conta = getContaAtiva();
  const { branding, activeTenantId } = useBranding();

  const [dominioRecord, setDominioRecord] = useState<TenantDomainRecord | undefined>(() =>
    tenantDomainService.getDomainByTenantId(activeTenantId || conta.tenantId || "default")
  );

  const [novoDominioInput, setNovoDominioInput] = useState(dominioRecord?.domain || "");
  const [salvandoDominio, setSalvandoDominio] = useState(false);
  const [testandoDns, setTestandoDns] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Recarregar registro de domínio quando tenant mudar
  useEffect(() => {
    const tid = activeTenantId || conta.tenantId || "default";
    const found = tenantDomainService.getDomainByTenantId(tid);
    setDominioRecord(found);
    if (found?.domain) {
      setNovoDominioInput(found.domain);
    }
  }, [activeTenantId, conta.tenantId]);

  // URL canônica do aplicativo deste franqueado
  const appUrl = useMemo(() => {
    if (typeof window === "undefined") return "https://partiumobe.com.br/app";
    if (dominioRecord && dominioRecord.status === "ATIVO") {
      return `https://${dominioRecord.domain}/app`;
    }
    const origin = window.location.origin;
    const tid = activeTenantId || conta.tenantId || "default";
    return `${origin}/app?tenant=${encodeURIComponent(tid)}`;
  }, [dominioRecord, activeTenantId, conta.tenantId]);

  // URL do manifesto dinâmico gerado pelo servidor
  const manifestUrl = useMemo(() => {
    if (typeof window === "undefined") return "/manifest.webmanifest";
    const origin = window.location.origin;
    const tid = activeTenantId || conta.tenantId || "default";
    return `${origin}/manifest.webmanifest?tenant=${encodeURIComponent(tid)}`;
  }, [activeTenantId, conta.tenantId]);

  // Gerar QR Code de alta resolução em DataURL
  useEffect(() => {
    if (!appUrl) return;
    QRCode.toDataURL(appUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("Erro ao gerar QR Code:", err));
  }, [appUrl]);

  function handleCopiarLink() {
    navigator.clipboard.writeText(appUrl);
    toast.success("Link do aplicativo copiado para a área de transferência!");
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
    const tid = activeTenantId || conta.tenantId || "tenant-franquia";
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
                  Copiar Link
                </button>
                <button
                  onClick={handleTestarNavegador}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition cursor-pointer"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir
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
              <PalettePickerSection />
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
        </div>

        {/* CARD 3: QR CODE DE ACESSO RÁPIDO (1 COLUNA) */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              QR Code do Aplicativo
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Escaneie com a câmera de qualquer smartphone para abrir o PWA imediatamente.
            </p>
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
              {appUrl}
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
