import React, { useState, useEffect, useMemo } from "react";
import type { MobilityLandingPageData } from "@/types/mobilityLanding";
import { defaultMobilityLandingData } from "@/data/defaultMobilityLandingData";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingWavyDivider } from "./LandingWavyDivider";
import { LandingReasonSection } from "./LandingReasonSection";
import { LandingFooter } from "./LandingFooter";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { getStoredLandingPageData } from "@/lib/branding/landing-page-store";

interface MobilityLandingPageProps {
  initialData?: MobilityLandingPageData;
  onNavigate?: (url: string) => void;
  showCustomizer?: boolean;
}

/**
 * Gera um gradiente escuro refinado e harmonioso com base nas cores hex do White Label
 */
function generateDarkGradientFromColors(primaryHex: string, secondaryHex?: string): string {
  const hexToRgb = (hex: string) => {
    let clean = (hex || "").replace("#", "").trim();
    if (!clean || clean.length < 3) return { r: 15, g: 23, b: 42 };
    if (clean.length === 3) {
      clean = clean.split("").map((c) => c + c).join("");
    }
    const num = parseInt(clean.substring(0, 6), 16);
    if (isNaN(num)) return { r: 15, g: 23, b: 42 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  try {
    const { r: r1, g: g1, b: b1 } = hexToRgb(primaryHex);
    // Dark tone 1 (topo): matiz profunda da cor primária (aprox. 12% de brilho)
    const dark1 = `rgb(${Math.round(r1 * 0.12)}, ${Math.round(g1 * 0.12)}, ${Math.round(b1 * 0.12)})`;
    // Dark tone 2 (fundo): profundidade equilibrada com toque secundário ou gradiente escuro
    if (secondaryHex) {
      const { r: r2, g: g2, b: b2 } = hexToRgb(secondaryHex);
      const dark2 = `rgb(${Math.round(r2 * 0.16 + 4)}, ${Math.round(r2 * 0.16 + 4)}, ${Math.round(r2 * 0.16 + 8)})`;
      return `linear-gradient(to bottom, ${dark1}, ${dark2})`;
    }
    const dark2 = `rgb(${Math.round(r1 * 0.20 + 4)}, ${Math.round(r1 * 0.20 + 4)}, ${Math.round(r1 * 0.20 + 8)})`;
    return `linear-gradient(to bottom, ${dark1}, ${dark2})`;
  } catch {
    return "linear-gradient(to bottom, #0F172A, #020617)";
  }
}

export const MobilityLandingPage: React.FC<MobilityLandingPageProps> = ({
  initialData,
  onNavigate,
  showCustomizer = false,
}) => {
  // Consumo em tempo real do tema e identidade definidos no Painel Admin White Label
  const {
    nomeApp,
    sloganApp,
    corPrimaria,
    corSecundaria,
    corFundoApp,
    branding,
    config,
    identidade,
  } = useBrandTheme();

  // Helper para gerar gradiente escuro de fundo alinhado à cor primária do tema ativo
  const darkGradientForTheme = useMemo(() => {
    return generateDarkGradientFromColors(corPrimaria || "#FF6B00", corSecundaria || "#FFB800");
  }, [corPrimaria, corSecundaria]);

  // Carrega configuração persistida pelo painel administrativo
  const [storedData, setStoredData] = useState<MobilityLandingPageData>(() =>
    initialData || getStoredLandingPageData()
  );

  // Escuta atualizações vindas do Painel Administrativo em tempo real
  useEffect(() => {
    function handleUpdate(e: Event) {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.data) {
        setStoredData(customEvent.detail.data);
      }
    }
    window.addEventListener("partiu:landing-page-updated", handleUpdate);
    return () => window.removeEventListener("partiu:landing-page-updated", handleUpdate);
  }, []);

  // Montagem reativa dos dados conectando o schema armazenado às configurações de cor/marca do Admin
  const adminLinkedData = useMemo<MobilityLandingPageData>(() => {
    const base = storedData || defaultMobilityLandingData;

    // Resolução da Marca:
    // Se o valor salvo for vazio ou o placeholder legado "SUA MARCA", usamos nomeApp configurado no White Label Studio
    const activeBrand =
      base.header?.brandName &&
      base.header.brandName !== "SUA MARCA" &&
      base.header.brandName.trim() !== ""
        ? base.header.brandName
        : (nomeApp || "PARTIU");

    // Resolução da Logo Oficial White Label
    const activeLogo =
      branding?.logo_url ||
      config.brandCenter?.logos?.logoPrincipalUrl ||
      identidade?.logoUrl ||
      (base.header?.logoUrl && base.header.logoUrl !== "/lightning_icon.svg" ? base.header.logoUrl : "") ||
      "/assets/partiu-logo-transparent.png";

    // Resolução das Cores: O tema White Label do Painel (corPrimaria / corSecundaria) tem autoridade
    const activePrimary = corPrimaria || base.theme?.primary || "#FF6B00";
    const activeSecondary = corSecundaria || base.theme?.secondary || "#FFB800";

    // Resolução do Gradiente de Fundo Noturno:
    // Se o gradiente for vazio ou o legado azul (#001236, #002D62), gera dinamicamente para a paleta ativa
    const isOldBlueGradient =
      !base.theme?.bgDark?.gradient ||
      base.theme.bgDark.gradient.includes("#001236") ||
      base.theme.bgDark.gradient.includes("#002D62");

    const activeDarkGradient = isOldBlueGradient ? darkGradientForTheme : base.theme.bgDark.gradient;

    // Resolução da imagem de carro do hero:
    // Removemos a foto retangular estática /modern_car_dusk.png que corta e obstrui o mapa vetorial
    const activeCarImageUrl =
      base.hero?.carImageUrl && !base.hero.carImageUrl.includes("modern_car_dusk")
        ? base.hero.carImageUrl
        : "";

    return {
      ...base,
      theme: {
        ...base.theme,
        primary: activePrimary,
        secondary: activeSecondary,
        bgLight: corFundoApp || base.theme?.bgLight || "#F8FAFC",
        bgDark: {
          gradient: activeDarkGradient,
        },
      },
      header: {
        ...base.header,
        brandName: activeBrand,
        logoUrl: activeLogo,
        urbanMobilityText: base.header?.urbanMobilityText || sloganApp || "Mobilidade Urbana",
      },
      hero: {
        ...base.hero,
        carImageUrl: activeCarImageUrl,
        cityBackgroundImageUrl:
          base.hero?.cityBackgroundImageUrl ||
          "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2400&q=80",
      },
      reasonSection: {
        ...base.reasonSection,
        brandName:
          base.reasonSection?.brandName &&
          !base.reasonSection.brandName.includes("SUA MARCA")
            ? base.reasonSection.brandName
            : `${activeBrand}?`,
      },
      footer: {
        ...base.footer,
        brandName: activeBrand,
        urbanMobilityText: base.footer?.urbanMobilityText || sloganApp || "Mobilidade Urbana",
      },
    };
  }, [
    storedData,
    corPrimaria,
    corSecundaria,
    corFundoApp,
    nomeApp,
    sloganApp,
    branding,
    config.brandCenter,
    identidade,
    darkGradientForTheme,
  ]);

  // Estado reativo controlado por data-binding
  const [data, setData] = useState<MobilityLandingPageData>(adminLinkedData);

  useEffect(() => {
    setData(adminLinkedData);
  }, [adminLinkedData]);

  // Atualiza título da aba do navegador para refletir a marca configurada
  useEffect(() => {
    if (data.header?.brandName && typeof document !== "undefined") {
      document.title = `${data.header.brandName} • ${data.header.urbanMobilityText || "Mobilidade Urbana"}`;
    }
  }, [data.header?.brandName, data.header?.urbanMobilityText]);

  const { theme, header, hero, actions, features, reasonSection, footer } = data;

  return (
    <div
      className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col items-center justify-start overflow-x-hidden transition-colors duration-300 font-sans selection:bg-amber-100 selection:text-slate-900"
      style={
        {
          fontFamily: theme.fontFamily || "'Plus Jakarta Sans', sans-serif",
          "--primary-color": theme.primary,
          "--secondary-color": theme.secondary,
          "--button-radius": theme.buttonRadius,
          "--bg-light": theme.bgLight,
        } as React.CSSProperties
      }
    >
      {/* CONTAINER PRINCIPAL RESPONSIVO E ELEGANTEMENTE ESTRUTURADO NO TEMA CLARO */}
      <main className="w-full min-h-screen overflow-x-hidden relative flex flex-col bg-slate-50">
        
        {/* SEÇÃO SUPERIOR CLARA (CLEAN LIGHT HERO COM SUAVES LUZES AMBIENTES E RADAR TECNOLÓGICO) */}
        <div
          className="relative w-full flex flex-col overflow-hidden transition-colors duration-500 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/90"
        >
          {/* Efeitos sutis de luz ambiente suave de fundo com a cor primária ativa */}
          <div
            className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.08] pointer-events-none transition-colors duration-500"
            style={{
              background: `radial-gradient(circle, ${theme.primary} 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute top-36 -left-20 w-[450px] h-[450px] rounded-full blur-3xl opacity-[0.06] pointer-events-none transition-colors duration-500"
            style={{
              background: `radial-gradient(circle, ${theme.secondary || theme.primary} 0%, transparent 70%)`,
            }}
          />

          <div className="w-full flex flex-col">
            {/* 1. Cabeçalho da Marca (Logo + Nome + Slogan + Entrar) */}
            <LandingHeader header={header} theme={theme} onNavigate={onNavigate} />

            {/* 2. Seção Hero com o App Live Preview integrado (Mapa Claro, Rota, Veículo e Ações) */}
            <LandingHero
              hero={hero}
              actions={actions}
              theme={theme}
              mapCard={reasonSection?.mapCard}
              onNavigate={onNavigate}
            />

            {/* 3. Grid de Funcionalidades e Selos de Confiança (Cards Claros e Elegantes) */}
            <LandingFeatures features={features} theme={theme} />
          </div>
        </div>

        {/* 4. Divisor Suave e Orgânico */}
        <LandingWavyDivider theme={theme} />

        {/* 5. Seção Clara de Benefícios e Motivos (PILARES + CHECKLIST + CTA) */}
        <LandingReasonSection
          reasonSection={reasonSection}
          theme={theme}
          onNavigate={onNavigate}
        />

        {/* 6. Rodapé com Identificação White Label */}
        <LandingFooter footer={footer} theme={theme} />
      </main>
    </div>
  );
};
