import type { MobilityLandingPageData } from "@/types/mobilityLanding";
import { defaultMobilityLandingData } from "@/data/defaultMobilityLandingData";

export const STORAGE_KEY_LANDING_DATA = "partiu_custom_landing_page_data_v1";

/**
 * Obtém a configuração customizada da Landing Page persistida pelo painel administrativo
 * Faz fallback suave para os valores canônicos se nada foi salvo ainda.
 */
export function getStoredLandingPageData(): MobilityLandingPageData {
  if (typeof window === "undefined") {
    return defaultMobilityLandingData;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LANDING_DATA);
    if (!raw) return defaultMobilityLandingData;
    const parsed = JSON.parse(raw);
    const cleanedCarImage =
      parsed.hero?.carImageUrl && parsed.hero.carImageUrl.includes("modern_car_dusk")
        ? ""
        : parsed.hero?.carImageUrl;
    const cleanedBrandName =
      parsed.header?.brandName === "SUA MARCA" ? "" : parsed.header?.brandName;
    const cleanedPrimary =
      parsed.theme?.primary === "#007AFF" ? "" : parsed.theme?.primary;

    return {
      ...defaultMobilityLandingData,
      ...parsed,
      theme: {
        ...defaultMobilityLandingData.theme,
        ...(parsed.theme || {}),
        primary: cleanedPrimary || "",
      },
      header: {
        ...defaultMobilityLandingData.header,
        ...(parsed.header || {}),
        brandName: cleanedBrandName || "",
      },
      hero: {
        ...defaultMobilityLandingData.hero,
        ...(parsed.hero || {}),
        carImageUrl: cleanedCarImage || "",
      },
      actions: parsed.actions && parsed.actions.length > 0 ? parsed.actions : defaultMobilityLandingData.actions,
      features: parsed.features && parsed.features.length > 0 ? parsed.features : defaultMobilityLandingData.features,
      reasonSection: {
        ...defaultMobilityLandingData.reasonSection,
        ...(parsed.reasonSection || {}),
        brandName:
          parsed.reasonSection?.brandName === "SUA MARCA?" || parsed.reasonSection?.brandName === "SUA MARCA"
            ? ""
            : parsed.reasonSection?.brandName,
        checklist: parsed.reasonSection?.checklist || defaultMobilityLandingData.reasonSection.checklist,
        mapCard: {
          ...defaultMobilityLandingData.reasonSection.mapCard,
          ...(parsed.reasonSection?.mapCard || {}),
        },
      },
      footer: {
        ...defaultMobilityLandingData.footer,
        ...(parsed.footer || {}),
        brandName: cleanedBrandName || "",
      },
    };
  } catch {
    return defaultMobilityLandingData;
  }
}

/**
 * Salva e propaga via CustomEvent a nova configuração da Landing Page
 */
export function saveStoredLandingPageData(data: MobilityLandingPageData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_LANDING_DATA, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("partiu:landing-page-updated", {
        detail: { data },
      })
    );
  } catch (err) {
    console.warn("Erro ao salvar landing page data no localStorage:", err);
  }
}

/**
 * Restaura para os dados padrão de fábrica
 */
export function resetStoredLandingPageData(): MobilityLandingPageData {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_LANDING_DATA);
      window.dispatchEvent(
        new CustomEvent("partiu:landing-page-updated", {
          detail: { data: defaultMobilityLandingData },
        })
      );
    } catch {}
  }
  return defaultMobilityLandingData;
}
