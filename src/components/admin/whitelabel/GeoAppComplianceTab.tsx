import React, { useState } from "react";
import {
  Globe,
  Smartphone,
  Scale,
  Sparkles,
  Building2,
  ShieldCheck,
  Check,
  FileText,
  Upload,
  Copy,
  Eye,
  Bell,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Navigation,
} from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useBranding } from "@/hooks/useBranding";
import { updateBrowserFavicon, generateSvgFavicon } from "@/lib/branding/ThemeEngine";
import { MapboxConfig } from "@/config/MapboxConfig";
import { toast } from "sonner";
import { ExternalLink, CheckCircle2, Share2, Key } from "lucide-react";

interface GeoAppComplianceTabProps {
  onSaveFeedback: () => void;
  onRequestSimulatorMode?: (mode: "HOME" | "SPLASH" | "PUSH") => void;
}

export function GeoAppComplianceTab({
  onSaveFeedback,
  onRequestSimulatorMode,
}: GeoAppComplianceTabProps) {
  const { geo, appConfig, brand, updateConfig, activeTenant } = useBrandTheme();
  const { branding, updateBranding, uploadAsset } = useBranding();

  const [geoAppSubTab, setGeoAppSubTab] = useState<"stores" | "legal" | "assets">("stores");
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [faviconTestFeedback, setFaviconTestFeedback] = useState(false);

  // Estados de teste e visualização de chaves de mapas
  const [testandoMapa, setTestandoMapa] = useState(false);
  const [resultadoTesteMapa, setResultadoTesteMapa] = useState<{ valid: boolean; message: string } | null>(null);
  const [mostrarToken, setMostrarToken] = useState(false);

  const tenantId = activeTenant?.tenantId || "default";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://partiumobe.com.br";
  const passengerUrl = `${origin}/app?tenant=${encodeURIComponent(tenantId)}`;
  const driverUrl = `${origin}/app/motorista?tenant=${encodeURIComponent(tenantId)}`;

  function handleCopiarLink(url: string, label: string) {
    navigator.clipboard.writeText(url);
    toast.success(`Link de ${label} copiado!`);
  }

  function handleCompartilharWhatsApp(url: string, tipo: "PASSAGEIRO" | "MOTORISTA") {
    const nomeApp = appConfig?.nomeAppExibicao || branding?.app_name || "PARTIU";
    const texto = tipo === "MOTORISTA"
      ? `🚗 Venha dirigir no aplicativo ${nomeApp}! Repasse no PIX D+0 e suporte local. Cadastre-se: ${url}`
      : `📲 Peça sua viagem no ${nomeApp}! Mais conforto, preço justo e segurança na cidade: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
  }

  async function handleTestarChaveMapa() {
    setTestandoMapa(true);
    setResultadoTesteMapa(null);
    try {
      const prov = geo?.mapProvider || "mapbox";
      if (prov === "mapbox") {
        const token = (geo?.mapboxAccessToken || "").trim();
        const res = await MapboxConfig.testMapboxToken(token);
        setResultadoTesteMapa(res);
        if (res.valid) toast.success(res.message);
        else toast.error(res.message);
      } else if (prov === "google") {
        const key = (geo?.googleMapsApiKey || "").trim();
        const res = await MapboxConfig.testGoogleMapsApiKey(key);
        setResultadoTesteMapa(res);
        if (res.valid) toast.success(res.message);
        else toast.error(res.message);
      } else {
        const res = { valid: true, message: "Camada gratuita CARTO/OSM ativa (sem consumo de cota)." };
        setResultadoTesteMapa(res);
        toast.success(res.message);
      }
    } catch (err: any) {
      const res = { valid: false, message: err?.message || "Falha ao validar chave de mapa." };
      setResultadoTesteMapa(res);
      toast.error(res.message);
    } finally {
      setTestandoMapa(false);
    }
  }

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

  async function handleFileUpload(file: File, type: "splash" | "app_icon" | "push_icon") {
    try {
      setUploadingField(type);
      setUploadError(null);
      const url = await uploadAsset(file, type);
      if (url) {
        if (type === "splash") {
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
        } else if (type === "app_icon") {
          updateConfig({
            nativeApp: {
              ...appConfig,
              iconeAppUrl: url,
            },
          });
        } else if (type === "push_icon") {
          updateConfig({
            nativeApp: {
              ...appConfig,
              iconeNotificacaoPushUrl: url,
            },
          });
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

      {uploadError && (
        <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-ABA 1: LOJAS & GEO */}
      {/* ------------------------------------------------------------- */}
      {geoAppSubTab === "stores" && (
        <div className="space-y-6 animate-in fade-in">
          {/* PAINEL DE LINKS EXCLUSIVOS DA FRANQUIA / CIDADE */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#003366] flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#0088FF]" />
                  Links Personalizados do Aplicativo ({activeTenant?.cidadeNome || "Praça Regional"})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  URLs com identificador exclusivo que travam a marca, cores, catálogo e tarifas desta praça para passageiros e motoristas.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 self-start sm:self-auto">
                Isolamento Ativo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Card Link Passageiros */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-primary-500" />
                    Aplicativo de Passageiros
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    PWA / Web App
                  </span>
                </div>
                <code className="text-[11px] font-mono text-primary-700 bg-primary-50/70 p-2 rounded-lg border border-primary-200/60 block truncate select-all">
                  {passengerUrl}
                </code>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopiarLink(passengerUrl, "passageiros")}
                    className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(passengerUrl, "_blank", "noopener,noreferrer")}
                    className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 transition cursor-pointer"
                    title="Abrir em Nova Aba"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCompartilharWhatsApp(passengerUrl, "PASSAGEIRO")}
                    className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition cursor-pointer"
                    title="Compartilhar no WhatsApp"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Card Link Motoristas */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                    Portal do Motorista Parceiro
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Cadastro &amp; Diárias
                  </span>
                </div>
                <code className="text-[11px] font-mono text-emerald-700 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60 block truncate select-all">
                  {driverUrl}
                </code>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopiarLink(driverUrl, "motoristas")}
                    className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(driverUrl, "_blank", "noopener,noreferrer")}
                    className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition cursor-pointer"
                    title="Abrir Portal do Motorista"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCompartilharWhatsApp(driverUrl, "MOTORISTA")}
                    className="py-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition cursor-pointer"
                    title="Compartilhar no WhatsApp"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
                  }}
                  placeholder="Ex: PARTIU Mobilidade"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
                />
              </div>
            </div>

            {/* MOTOR GEOESPACIAL & CHAVES DE API DE MAPAS DO FRANQUEADO */}
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#003366] flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-[#0088FF]" />
                    Conectar APIs de Mapas Própria (Isolamento de Cotas)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cada franqueado conecta sua própria chave Google Maps ou Mapbox para isolar faturamento e consumo da matriz.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
                  Chave Matriz Restrita ao Super Admin
                </span>
              </div>

              {/* Aviso Explícito de Isolamento */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Política de Proteção de Cotas:</strong> A chave do sistema principal é restrita à Matriz do Super Administrador. Para habilitar mapas com alta precisão e rotas de tráfego na sua praça, insira seu Token Mapbox (<code className="font-mono text-[10px]">pk.*</code>) ou sua Chave Google Maps Platform (<code className="font-mono text-[10px]">AIzaSy*</code>). Caso não configure uma chave, seu aplicativo utilizará a camada gratuita pública OpenStreetMap/CARTO.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Provedor de Mapas Ativo
                  </label>
                  <select
                    value={geo?.mapProvider || "mapbox"}
                    onChange={(e: any) => {
                      updateConfig({
                        geo: { ...geo, mapProvider: e.target.value },
                      });
                      onSaveFeedback();
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-semibold"
                  >
                    <option value="mapbox">Mapbox GL JS (Nativo)</option>
                    <option value="google">Google Maps Platform</option>
                    <option value="osm">OpenStreetMap / CARTO (Gratuito / Sem Chave)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Token Mapbox do Franqueado (pk.*)
                    </label>
                    <button
                      type="button"
                      onClick={() => setMostrarToken(!mostrarToken)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5 cursor-pointer"
                    >
                      {mostrarToken ? "Ocultar" : "Exibir"}
                    </button>
                  </div>
                  <input
                    type={mostrarToken ? "text" : "password"}
                    value={geo?.mapboxAccessToken || ""}
                    onChange={(e) => {
                      updateConfig({
                        geo: { ...geo, mapboxAccessToken: e.target.value.trim() },
                      });
                      onSaveFeedback();
                    }}
                    placeholder="pk.eyJ1I..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Chave Google Maps (AIzaSy...)
                    </label>
                    <button
                      type="button"
                      onClick={() => setMostrarToken(!mostrarToken)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5 cursor-pointer"
                    >
                      {mostrarToken ? "Ocultar" : "Exibir"}
                    </button>
                  </div>
                  <input
                    type={mostrarToken ? "text" : "password"}
                    value={geo?.googleMapsApiKey || ""}
                    onChange={(e) => {
                      updateConfig({
                        geo: { ...geo, googleMapsApiKey: e.target.value.trim() },
                      });
                      onSaveFeedback();
                    }}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Latitude Central da Cidade
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={geo?.coordenadasCentroLat ?? -21.2054}
                    onChange={(e) => {
                      updateConfig({
                        geo: { ...geo, coordenadasCentroLat: Number(e.target.value) },
                      });
                      onSaveFeedback();
                    }}
                    placeholder="-21.2054"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    Longitude Central da Cidade
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={geo?.coordenadasCentroLng ?? -41.8892}
                    onChange={(e) => {
                      updateConfig({
                        geo: { ...geo, coordenadasCentroLng: Number(e.target.value) },
                      });
                      onSaveFeedback();
                    }}
                    placeholder="-41.8892"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none font-mono"
                  />
                </div>

                {/* Botão de Teste */}
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleTestarChaveMapa}
                    disabled={testandoMapa}
                    className="w-full h-9 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {testandoMapa ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>Validando Chave...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Testar Conexão da API</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {resultadoTesteMapa && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    resultadoTesteMapa.valid
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {resultadoTesteMapa.valid ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{resultadoTesteMapa.message}</span>
                </div>
              )}
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                    onSaveFeedback();
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
                      onSaveFeedback();
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
                      onSaveFeedback();
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
                      onSaveFeedback();
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
                          onSaveFeedback();
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
                    onSaveFeedback();
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

                {onRequestSimulatorMode && (
                  <button
                    type="button"
                    onClick={() => onRequestSimulatorMode("SPLASH")}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0088FF]" />
                    <span>Ver no Simulador</span>
                  </button>
                )}
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
                    onSaveFeedback();
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

                {onRequestSimulatorMode && (
                  <button
                    type="button"
                    onClick={() => onRequestSimulatorMode("PUSH")}
                    className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0088FF]" />
                    <span>Simular no Lockscreen</span>
                  </button>
                )}
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
  );
}
