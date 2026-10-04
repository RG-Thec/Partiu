import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useBranding } from "@/hooks/useBranding";

// ==============================================================================
// 🏷️ WHITE LABEL SAAS THEME CONTRACT (Conforme Especificação de Painel Admin)
// ==============================================================================

export interface AppConfigBrandingColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  inputBorder: string;
  inputBackground: string;
}

export interface AppConfigBrandingUi {
  borderRadius: string;
  buttonShadow: string;
  fontFamily: string;
}

export interface AppConfigBranding {
  appName: string;
  logoUrl: string;
  colors: AppConfigBrandingColors;
  ui: AppConfigBrandingUi;
}

export interface AppConfigFeatures {
  allowSmsLogin: boolean;
  allowEmailLogin: boolean;
  requireCpfOnSignup: boolean;
}

export interface AppConfig {
  branding: AppConfigBranding;
  features: AppConfigFeatures;
}

/**
 * Payload canônico padrão (simula o consumo do Painel Administrativo White Label)
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  branding: {
    appName: "Partiu",
    logoUrl: "",
    colors: {
      primary: "#FF8C00", // Laranja principal
      primaryHover: "#E67E00",
      secondary: "#003366", // Azul marinho
      background: "#FAFAFA",
      surface: "#FFFFFF",
      textPrimary: "#1A1A1A",
      textSecondary: "#666666",
      inputBorder: "#E0E0E0",
      inputBackground: "#F5F7FA",
    },
    ui: {
      borderRadius: "16px", // Controla o arredondamento de botões e cards
      buttonShadow: "0 4px 14px 0 rgba(255, 140, 0, 0.39)", // Dinâmico com a cor primária
      fontFamily: "'Inter', sans-serif",
    },
  },
  features: {
    allowSmsLogin: true,
    allowEmailLogin: true,
    requireCpfOnSignup: true,
  },
};

/**
 * Utilitário para gerar sombra dinâmica a partir de uma cor primária HEX
 */
export function computeButtonShadow(hexColor: string, opacity = 0.39): string {
  if (!hexColor || !hexColor.startsWith("#")) {
    return "0 4px 14px 0 rgba(255, 140, 0, 0.39)";
  }
  const clean = hexColor.replace("#", "");
  let r = 255;
  let g = 140;
  let b = 0;
  if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  }
  return `0 4px 14px 0 rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export interface WhiteLabelContextValue {
  appConfig: AppConfig;
  updateAppConfig: (partial: Partial<AppConfig>) => void;
  updateBrandingColors: (partial: Partial<AppConfigBrandingColors>) => void;
  updateFeatures: (partial: Partial<AppConfigFeatures>) => void;
  resetTheme: () => void;
}

export const WhiteLabelContext = createContext<WhiteLabelContextValue | null>(null);

const STORAGE_KEY_WL_CONFIG = "partiu_wl_app_config_v2";

/**
 * Injeta variáveis CSS no elemento raiz (:root) garantindo que nenhum
 * estilo fique hardcoded no código.
 */
function applyCssVariablesToRoot(config: AppConfig) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const { branding } = config;
  const { colors, ui } = branding;

  // Variáveis Scoped White Label
  root.style.setProperty("--wl-primary", colors.primary);
  root.style.setProperty("--wl-primary-hover", colors.primaryHover);
  root.style.setProperty("--wl-secondary", colors.secondary);
  root.style.setProperty("--wl-background", colors.background);
  root.style.setProperty("--wl-surface", colors.surface);
  root.style.setProperty("--wl-text-primary", colors.textPrimary);
  root.style.setProperty("--wl-text-secondary", colors.textSecondary);
  root.style.setProperty("--wl-input-border", colors.inputBorder);
  root.style.setProperty("--wl-input-background", colors.inputBackground);
  root.style.setProperty("--wl-border-radius", ui.borderRadius);
  root.style.setProperty("--wl-button-shadow", ui.buttonShadow);
  root.style.setProperty("--wl-font-family", ui.fontFamily);

  // Mapeamentos de compatibilidade com classes Tailwind / Shadcn existentes
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--primary-foreground", "#FFFFFF");
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--card", colors.surface);
  root.style.setProperty("--surface", colors.surface);
  root.style.setProperty("--radius", ui.borderRadius);
  root.style.setProperty("--color-primary", colors.primary);
  root.style.setProperty("--color-secondary", colors.secondary);
  root.style.setProperty("--color-background", colors.background);
  root.style.setProperty("--color-surface", colors.surface);
  root.style.setProperty("--header-gradient-start", colors.primary);
  root.style.setProperty("--header-gradient-end", colors.secondary);
  root.style.setProperty("--brand-primary-vibrant", colors.primary);
  root.style.setProperty("--brand-primary-deep", colors.primaryHover || colors.primary);
  root.style.setProperty("--brand-primary-accent", colors.secondary);
  root.style.setProperty("--brand-bg-neutral", colors.background);
  root.style.setProperty("--brand-surface-card", colors.surface);
  root.style.setProperty("--button-shadow", ui.buttonShadow);
  root.style.setProperty("--border-radius", ui.borderRadius);
}

export function WhiteLabelThemeProvider({
  children,
  initialConfig,
}: {
  children: ReactNode;
  initialConfig?: AppConfig;
}) {
  const globalBranding = useBranding();

  const [appConfig, setAppConfigState] = useState<AppConfig>(() => {
    if (initialConfig) return initialConfig;

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_WL_CONFIG);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_APP_CONFIG,
            ...parsed,
            branding: {
              ...DEFAULT_APP_CONFIG.branding,
              ...(parsed.branding || {}),
              colors: {
                ...DEFAULT_APP_CONFIG.branding.colors,
                ...(parsed.branding?.colors || {}),
              },
              ui: {
                ...DEFAULT_APP_CONFIG.branding.ui,
                ...(parsed.branding?.ui || {}),
              },
            },
            features: {
              ...DEFAULT_APP_CONFIG.features,
              ...(parsed.features || {}),
            },
          };
        }
      } catch {}
    }
    return DEFAULT_APP_CONFIG;
  });

  // Sincroniza dinamicamente se o BrandingProvider global emitir novos valores do Supabase
  useEffect(() => {
    if (globalBranding?.branding) {
      const b = globalBranding.branding;
      setAppConfigState((prev) => {
        const primary = b.primary_color || prev.branding.colors.primary;
        const newColors: AppConfigBrandingColors = {
          ...prev.branding.colors,
          primary,
          primaryHover: b.secondary_color || prev.branding.colors.primaryHover,
          secondary: b.secondary_color || prev.branding.colors.secondary,
          background: b.background_color || prev.branding.colors.background,
          surface: b.surface_color || prev.branding.colors.surface,
          textPrimary: b.text_primary || prev.branding.colors.textPrimary,
          textSecondary: b.text_secondary || prev.branding.colors.textSecondary,
        };
        const newUi: AppConfigBrandingUi = {
          ...prev.branding.ui,
          borderRadius: b.border_radius || prev.branding.ui.borderRadius,
          buttonShadow: computeButtonShadow(primary),
          fontFamily: b.font_family || prev.branding.ui.fontFamily,
        };
        return {
          ...prev,
          branding: {
            ...prev.branding,
            appName: b.app_name || prev.branding.appName,
            logoUrl: b.logo_url || prev.branding.logoUrl,
            colors: newColors,
            ui: newUi,
          },
        };
      });
    }
  }, [globalBranding?.branding]);

  // Aplica as variáveis CSS sempre que o appConfig sofrer mutação
  useEffect(() => {
    applyCssVariablesToRoot(appConfig);
    try {
      localStorage.setItem(STORAGE_KEY_WL_CONFIG, JSON.stringify(appConfig));
    } catch {}
  }, [appConfig]);

  const updateAppConfig = useCallback((partial: Partial<AppConfig>) => {
    setAppConfigState((prev) => ({
      ...prev,
      ...partial,
      branding: {
        ...prev.branding,
        ...(partial.branding || {}),
        colors: {
          ...prev.branding.colors,
          ...(partial.branding?.colors || {}),
        },
        ui: {
          ...prev.branding.ui,
          ...(partial.branding?.ui || {}),
        },
      },
      features: {
        ...prev.features,
        ...(partial.features || {}),
      },
    }));
  }, []);

  const updateBrandingColors = useCallback((partialColors: Partial<AppConfigBrandingColors>) => {
    setAppConfigState((prev) => {
      const primary = partialColors.primary || prev.branding.colors.primary;
      return {
        ...prev,
        branding: {
          ...prev.branding,
          colors: {
            ...prev.branding.colors,
            ...partialColors,
          },
          ui: {
            ...prev.branding.ui,
            buttonShadow: computeButtonShadow(primary),
          },
        },
      };
    });
  }, []);

  const updateFeatures = useCallback((partialFeatures: Partial<AppConfigFeatures>) => {
    setAppConfigState((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        ...partialFeatures,
      },
    }));
  }, []);

  const resetTheme = useCallback(() => {
    setAppConfigState(DEFAULT_APP_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY_WL_CONFIG);
    } catch {}
  }, []);

  const value = useMemo<WhiteLabelContextValue>(
    () => ({
      appConfig,
      updateAppConfig,
      updateBrandingColors,
      updateFeatures,
      resetTheme,
    }),
    [appConfig, updateAppConfig, updateBrandingColors, updateFeatures, resetTheme]
  );

  return <WhiteLabelContext.Provider value={value}>{children}</WhiteLabelContext.Provider>;
}

/**
 * Hook universal de consumo do tema White Label.
 * Simula a conexão com o Painel Administrativo.
 */
export function useTheme(): WhiteLabelContextValue {
  const ctx = useContext(WhiteLabelContext);
  if (!ctx) {
    // Fallback gracioso caso invocado fora do provider
    return {
      appConfig: DEFAULT_APP_CONFIG,
      updateAppConfig: () => {},
      updateBrandingColors: () => {},
      updateFeatures: () => {},
      resetTheme: () => {},
    };
  }
  return ctx;
}

// Alias para maior clareza semântica
export const useWhiteLabelTheme = useTheme;
