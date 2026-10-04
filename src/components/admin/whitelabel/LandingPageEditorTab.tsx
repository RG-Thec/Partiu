import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Palette,
  Layout,
  Type,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  RotateCcw,
  Save,
  CheckCircle2,
  Sliders,
  Car,
  Shield,
  Clock,
  Headphones,
  Star,
  ArrowRight,
  Globe,
  Upload,
} from "lucide-react";
import type { MobilityLandingPageData } from "@/types/mobilityLanding";
import {
  getStoredLandingPageData,
  saveStoredLandingPageData,
  resetStoredLandingPageData,
} from "@/lib/branding/landing-page-store";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useBranding } from "@/hooks/useBranding";
import { toast } from "sonner";

const PRESET_PALETTES = [
  {
    name: "Laranja & Âmbar (Padrão PARTIU)",
    primary: "#FF6B00",
    secondary: "#FFB800",
    gradient: "linear-gradient(to bottom, #1A0D00, #3D1C00)",
  },
  {
    name: "Azul Elétrico (Tecnologia)",
    primary: "#007AFF",
    secondary: "#9C27B0",
    gradient: "linear-gradient(to bottom, #001236, #002D62)",
  },
  {
    name: "Verde Esmeralda (Eco & Sustentável)",
    primary: "#10B981",
    secondary: "#059669",
    gradient: "linear-gradient(to bottom, #022013, #064E3B)",
  },
  {
    name: "Roxo Tech & Magenta",
    primary: "#8B5CF6",
    secondary: "#EC4899",
    gradient: "linear-gradient(to bottom, #16082F, #31105C)",
  },
  {
    name: "Preto Minimalista / Dark Luxo",
    primary: "#3B82F6",
    secondary: "#64748B",
    gradient: "linear-gradient(to bottom, #0B0F17, #1E293B)",
  },
];

interface LandingPageEditorTabProps {
  onDataChange?: (data: MobilityLandingPageData) => void;
}

export const LandingPageEditorTab: React.FC<LandingPageEditorTabProps> = ({
  onDataChange,
}) => {
  const { nomeApp, sloganApp, corPrimaria, corSecundaria } = useBrandTheme();
  const { uploadAsset } = useBranding();

  const [landingData, setLandingData] = useState<MobilityLandingPageData>(() =>
    getStoredLandingPageData()
  );
  const [salvoSucesso, setSalvoSucesso] = useState(false);
  const [uploadingCar, setUploadingCar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [novoItemChecklist, setNovoItemChecklist] = useState("");

  // Notifica o callback pai se fornecido (para live preview no simulador lateral)
  useEffect(() => {
    onDataChange?.(landingData);
  }, [landingData, onDataChange]);

  const updateTheme = (field: string, val: any) => {
    setLandingData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: val },
    }));
  };

  const updateHeader = (field: string, val: any) => {
    setLandingData((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: val },
      ...(field === "brandName"
        ? {
            reasonSection: { ...prev.reasonSection, brandName: `${val}?` },
            footer: { ...prev.footer, brandName: val },
          }
        : {}),
    }));
  };

  const updateHero = (field: string, val: any) => {
    setLandingData((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: val },
    }));
  };

  const updateAction = (index: number, field: string, val: any) => {
    setLandingData((prev) => {
      const acts = [...prev.actions];
      if (acts[index]) {
        acts[index] = { ...acts[index], [field]: val };
      }
      return { ...prev, actions: acts };
    });
  };

  const updateFeature = (index: number, field: string, val: any) => {
    setLandingData((prev) => {
      const feats = [...prev.features];
      if (feats[index]) {
        feats[index] = { ...feats[index], [field]: val };
      }
      return { ...prev, features: feats };
    });
  };

  const updateReason = (field: string, val: any) => {
    setLandingData((prev) => ({
      ...prev,
      reasonSection: { ...prev.reasonSection, [field]: val },
    }));
  };

  const updateMapCard = (field: string, val: any) => {
    setLandingData((prev) => ({
      ...prev,
      reasonSection: {
        ...prev.reasonSection,
        mapCard: { ...prev.reasonSection.mapCard, [field]: val },
      },
    }));
  };

  const handleSalvar = () => {
    saveStoredLandingPageData(landingData);
    setSalvoSucesso(true);
    setTimeout(() => setSalvoSucesso(false), 3000);
  };

  const handleRestaurar = () => {
    if (confirm("Deseja restaurar todos os textos e imagens da Landing Page para o padrão?")) {
      const reseted = resetStoredLandingPageData();
      setLandingData(reseted);
      setSalvoSucesso(true);
      setTimeout(() => setSalvoSucesso(false), 3000);
    }
  };

  const handleAdicionarChecklist = () => {
    if (!novoItemChecklist.trim()) return;
    setLandingData((prev) => ({
      ...prev,
      reasonSection: {
        ...prev.reasonSection,
        checklist: [...prev.reasonSection.checklist, novoItemChecklist.trim()],
      },
    }));
    setNovoItemChecklist("");
  };

  const handleRemoverChecklist = (idx: number) => {
    setLandingData((prev) => ({
      ...prev,
      reasonSection: {
        ...prev.reasonSection,
        checklist: prev.reasonSection.checklist.filter((_, i) => i !== idx),
      },
    }));
  };

  const handleUploadImage = async (file: File, target: "car" | "logo" | "avatar") => {
    try {
      if (target === "car") setUploadingCar(true);
      if (target === "logo") setUploadingLogo(true);
      if (target === "avatar") setUploadingAvatar(true);

      const url = await uploadAsset(file, "logo");
      if (url) {
        if (target === "car") updateHero("carImageUrl", url);
        if (target === "logo") updateHeader("logoUrl", url);
        if (target === "avatar") updateMapCard("carAvatarUrl", url);
      }
    } catch (err: any) {
      alert("Erro no upload: " + (err?.message || "falha ao enviar imagem."));
    } finally {
      setUploadingCar(false);
      setUploadingLogo(false);
      setUploadingAvatar(false);
    }
  };

  const handleSincronizarComWhiteLabel = () => {
    setLandingData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        primary: corPrimaria || "#FF6B00",
        secondary: corSecundaria || "#FFB800",
        bgDark: {
          gradient: "",
        },
      },
      header: {
        ...prev.header,
        brandName: nomeApp || "PARTIU",
        urbanMobilityText: sloganApp || "Mobilidade Urbana",
      },
      hero: {
        ...prev.hero,
        carImageUrl: "",
      },
      reasonSection: {
        ...prev.reasonSection,
        brandName: `${nomeApp || "PARTIU"}?`,
      },
      footer: {
        ...prev.footer,
        brandName: nomeApp || "PARTIU",
        urbanMobilityText: sloganApp || "Mobilidade Urbana",
      },
    }));
    toast.success("Dados sincronizados com o White Label Studio! Clique em Salvar Alterações para persistir.");
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-8 shadow-xs text-slate-900 animate-in fade-in">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#003366]">
              Editor da Página Inicial (Landing Page Pública)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personalize visualmente todos os textos, imagens, botões de ação e temas da página inicial do aplicativo sem necessidade de alterar código.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSincronizarComWhiteLabel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition cursor-pointer"
            title="Importar cores, nome e slogan ativos do White Label Studio"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Sincronizar White Label</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            title="Abrir página inicial em uma nova aba"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Página Inicial (/)</span>
          </a>

          <button
            type="button"
            onClick={handleSalvar}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-slate-950 font-black text-xs transition shadow-sm active:scale-95 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {salvoSucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Configurações da Página Inicial salvas com sucesso! A página pública (/) foi sincronizada em tempo real.
          </span>
        </div>
      )}

      {/* SEÇÃO 1: PALETAS PRONTAS & CORES DA LANDING PAGE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-primary-600 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            1. Tema Visual &amp; Paleta de Cores
          </h3>
          <span className="text-[11px] text-slate-400">Presets de alta conversão</span>
        </div>

        {/* Presets em 1 Clique */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESET_PALETTES.map((preset, i) => {
            const isSelected =
              landingData.theme.primary.toLowerCase() === preset.primary.toLowerCase();

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setLandingData((prev) => ({
                    ...prev,
                    theme: {
                      ...prev.theme,
                      primary: preset.primary,
                      secondary: preset.secondary,
                      bgDark: { gradient: preset.gradient },
                    },
                  }));
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? "border-primary-500 bg-primary-50/40 shadow-xs"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary-600 stroke-[3]" />}
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Seletor Manual de Cores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Cor Primária (Destaque &amp; Passageiro)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={landingData.theme.primary}
                onChange={(e) => updateTheme("primary", e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={landingData.theme.primary}
                onChange={(e) => updateTheme("primary", e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Cor Secundária (Motorista &amp; Rota)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={landingData.theme.secondary}
                onChange={(e) => updateTheme("secondary", e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={landingData.theme.secondary}
                onChange={(e) => updateTheme("secondary", e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Fundo Claro Inferior (bgLight)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={landingData.theme.bgLight}
                onChange={(e) => updateTheme("bgLight", e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={landingData.theme.bgLight}
                onChange={(e) => updateTheme("bgLight", e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-600">
                Arredondamento dos Botões:
              </label>
              <span className="text-[11px] font-mono font-bold text-primary-600">
                {landingData.theme.buttonRadius}
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="28"
              step="2"
              value={parseInt(landingData.theme.buttonRadius, 10) || 14}
              onChange={(e) => updateTheme("buttonRadius", `${e.target.value}px`)}
              className="w-full cursor-pointer accent-primary-600 mt-2"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: CABEÇALHO & MARCA */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-primary-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Type className="w-3.5 h-3.5" />
          2. Cabeçalho &amp; Identidade de Marca
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nome da Marca (Exibição Superior):
            </label>
            <input
              type="text"
              value={landingData.header.brandName}
              onChange={(e) => updateHeader("brandName", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            />
            <p className="text-[10px] text-slate-400 mt-1">A 2ª palavra herda a cor primária.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Texto de Mobilidade / Categoria:
            </label>
            <input
              type="text"
              value={landingData.header.urbanMobilityText}
              onChange={(e) => updateHeader("urbanMobilityText", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Tagline Superior (Lado Direito):
            </label>
            <textarea
              rows={2}
              value={landingData.header.tagline}
              onChange={(e) => updateHeader("tagline", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-3">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Logo / Ícone do Topo (URL ou Upload):
            </label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
                {landingData.header.logoUrl ? (
                  <img
                    src={landingData.header.logoUrl}
                    alt="Logo Topo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Sparkles className="w-4 h-4 text-white" />
                )}
              </div>
              <input
                type="text"
                value={landingData.header.logoUrl}
                onChange={(e) => updateHeader("logoUrl", e.target.value)}
                placeholder="/lightning_icon.svg ou URL externa"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadImage(f, "logo");
                  }}
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingLogo ? "Enviando..." : "Upload"}</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: SEÇÃO HERO NOTURNA */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-primary-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Car className="w-3.5 h-3.5" />
          3. Seção Hero (Topo Noturno com Horizonte &amp; Carro)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Chip / Etiqueta Superior:
            </label>
            <input
              type="text"
              value={landingData.hero.locationChipText}
              onChange={(e) => updateHero("locationChipText", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Headline Principal (Quebras com Enter):
            </label>
            <textarea
              rows={2}
              value={landingData.hero.headline}
              onChange={(e) => updateHero("headline", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Descrição de Impacto:
            </label>
            <textarea
              rows={2}
              value={landingData.hero.description}
              onChange={(e) => updateHero("description", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Imagem do Veículo (Deixe vazio para o Marcador GPS Nativo no mapa):
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-10 rounded-xl bg-slate-900 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {landingData.hero.carImageUrl ? (
                  <img
                    src={landingData.hero.carImageUrl}
                    alt="Car Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Car className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <input
                type="text"
                value={landingData.hero.carImageUrl}
                onChange={(e) => updateHero("carImageUrl", e.target.value)}
                placeholder="Deixe vazio para GPS dinâmico limpo (Recomendado)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingCar}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadImage(f, "car");
                  }}
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingCar ? "Enviando..." : "Upload Carro"}</span>
                </span>
              </label>
            </div>
          </div>

          {/* Imagem de Fundo Urbana (Metrópole / Cidade à Noite) */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Imagem de fundo urbana (Metrópole / Cidade)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                URL da foto da cidade com vista noturna ou crepúsculo
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={landingData.hero.cityBackgroundImageUrl || ""}
                onChange={(e) => updateHero("cityBackgroundImageUrl", e.target.value)}
                placeholder="https://... (deixe vazio para usar a imagem urbana padrão)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() =>
                  updateHero(
                    "cityBackgroundImageUrl",
                    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2400&q=80"
                  )
                }
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer shrink-0"
                title="Restaurar imagem urbana noturna padrão"
              >
                Padrão
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: BOTÕES DE AÇÃO (PASSAGEIRO & MOTORISTA) */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-primary-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Sliders className="w-3.5 h-3.5" />
          4. Botões de Ação Principal (Passageiro &amp; Motorista)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Botão Passageiro */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
              Botão 1 (Passageiro)
            </span>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Texto do Botão:
              </label>
              <textarea
                rows={2}
                value={landingData.actions[0]?.text || ""}
                onChange={(e) => updateAction(0, "text", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Link de Destino:
              </label>
              <input
                type="text"
                value={landingData.actions[0]?.targetUrl || ""}
                onChange={(e) => updateAction(0, "targetUrl", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* Botão Motorista */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-600 border border-slate-400" />
              Botão 2 (Motorista)
            </span>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Texto do Botão:
              </label>
              <textarea
                rows={2}
                value={landingData.actions[1]?.text || ""}
                onChange={(e) => updateAction(1, "text", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Link de Destino:
              </label>
              <input
                type="text"
                value={landingData.actions[1]?.targetUrl || ""}
                onChange={(e) => updateAction(1, "targetUrl", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 5: 4 PILARES / VANTAGENS */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-primary-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Star className="w-3.5 h-3.5" />
          5. Pilares de Destaque (4 Ícones Circulares com Glow)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {landingData.features.map((feat, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs"
            >
              <div className="flex items-center justify-between text-slate-400 font-bold text-[10px]">
                <span>PILAR #{idx + 1}</span>
                <span className="font-mono">{feat.iconUrl}</span>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block">Texto Principal:</label>
                <input
                  type="text"
                  value={feat.text}
                  onChange={(e) => updateFeature(idx, "text", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold mt-0.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block">Subtexto:</label>
                <input
                  type="text"
                  value={feat.subtext}
                  onChange={(e) => updateFeature(idx, "subtext", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 mt-0.5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 6: "POR QUE ESCOLHER" & CARD FLUTUANTE */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-primary-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Check className="w-3.5 h-3.5" />
          6. Seção "Por Que Escolher" &amp; Card Flutuante de Viagem
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Prefixo do Título:
              </label>
              <input
                type="text"
                value={landingData.reasonSection.titlePrefix}
                onChange={(e) => updateReason("titlePrefix", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Descrição Institucional:
              </label>
              <textarea
                rows={3}
                value={landingData.reasonSection.description}
                onChange={(e) => updateReason("description", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium"
              />
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Itens do Checklist de Diferenciais:
              </label>
              <div className="space-y-1.5">
                {landingData.reasonSection.checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary-600/10 text-primary-600 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newChecklist = [...landingData.reasonSection.checklist];
                        newChecklist[i] = e.target.value;
                        updateReason("checklist", newChecklist);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoverChecklist(i)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Adicionar novo diferencial..."
                  value={novoItemChecklist}
                  onChange={(e) => setNovoItemChecklist(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdicionarChecklist()}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAdicionarChecklist}
                  className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Card Flutuante de Viagem */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Configurações do Card de Rota e Mapa
            </span>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Tempo Estimado de Chegada (ETA):
              </label>
              <textarea
                rows={2}
                value={landingData.reasonSection.mapCard.eta}
                onChange={(e) => updateMapCard("eta", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Modelo / Detalhes do Carro:
              </label>
              <textarea
                rows={2}
                value={landingData.reasonSection.mapCard.carModel}
                onChange={(e) => updateMapCard("carModel", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Avatar do Veículo (URL ou Upload):
              </label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-1 shrink-0">
                  <img
                    src={landingData.reasonSection.mapCard.carAvatarUrl}
                    alt="Avatar Carro"
                    className="w-full h-full object-contain"
                  />
                </div>
                <input
                  type="text"
                  value={landingData.reasonSection.mapCard.carAvatarUrl}
                  onChange={(e) => updateMapCard("carAvatarUrl", e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/webp"
                    className="hidden"
                    disabled={uploadingAvatar}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadImage(f, "avatar");
                    }}
                  />
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition">
                    {uploadingAvatar ? "..." : "Upload"}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Nota de Avaliação:
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={landingData.reasonSection.mapCard.rating}
                onChange={(e) => updateMapCard("rating", parseFloat(e.target.value) || 4.9)}
                className="w-24 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BARRA INFERIOR DE PERSISTÊNCIA */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleRestaurar}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs font-bold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Padrão</span>
        </button>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Visualizar Página Inicial Aberta (/)</span>
          </a>

          <button
            type="button"
            onClick={handleSalvar}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-slate-950 font-black text-xs transition shadow-md active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações da Landing Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
