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
  const branding = config?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;

  const primary = colors?.primary || DEFAULT_APP_CONFIG.branding.colors.primary;
  const primaryHover = colors?.primaryHover || DEFAULT_APP_CONFIG.branding.colors.primaryHover;
  const secondary = colors?.secondary || DEFAULT_APP_CONFIG.branding.colors.secondary;
  const background = colors?.background || DEFAULT_APP_CONFIG.branding.colors.background;
  const surface = colors?.surface || DEFAULT_APP_CONFIG.branding.colors.surface;
  const textPrimary = colors?.textPrimary || DEFAULT_APP_CONFIG.branding.colors.textPrimary;
  const textSecondary = colors?.textSecondary || DEFAULT_APP_CONFIG.branding.colors.textSecondary;
  const inputBorder = colors?.inputBorder || DEFAULT_APP_CONFIG.branding.colors.inputBorder;
  const inputBackground = colors?.inputBackground || DEFAULT_APP_CONFIG.branding.colors.inputBackground;
  const borderRadius = ui?.borderRadius || DEFAULT_APP_CONFIG.branding.ui.borderRadius;
  const buttonShadow = ui?.buttonShadow || DEFAULT_APP_CONFIG.branding.ui.buttonShadow;
  const fontFamily = ui?.fontFamily || DEFAULT_APP_CONFIG.branding.ui.fontFamily;

  // Variáveis Scoped White Label
  root.style.setProperty("--wl-primary", primary);
  root.style.setProperty("--wl-primary-hover", primaryHover);
  root.style.setProperty("--wl-secondary", secondary);
  root.style.setProperty("--wl-background", background);
  root.style.setProperty("--wl-surface", surface);
  root.style.setProperty("--wl-text-primary", textPrimary);
  root.style.setProperty("--wl-text-secondary", textSecondary);
  root.style.setProperty("--wl-input-border", inputBorder);
  root.style.setProperty("--wl-input-background", inputBackground);
  root.style.setProperty("--wl-border-radius", borderRadius);
  root.style.setProperty("--wl-button-shadow", buttonShadow);
  root.style.setProperty("--wl-font-family", fontFamily);

  // Mapeamentos de compatibilidade com classes Tailwind / Shadcn existentes
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-foreground", "#FFFFFF");
  root.style.setProperty("--background", background);
  root.style.setProperty("--card", surface);
  root.style.setProperty("--surface", surface);
  root.style.setProperty("--radius", borderRadius);
  root.style.setProperty("--color-primary", primary);
  root.style.setProperty("--color-secondary", secondary);
  root.style.setProperty("--color-background", background);
  root.style.setProperty("--color-surface", surface);
  root.style.setProperty("--header-gradient-start", primary);
  root.style.setProperty("--header-gradient-end", secondary);
  root.style.setProperty("--brand-primary-vibrant", primary);
  root.style.setProperty("--brand-primary-deep", primaryHover || primary);
  root.style.setProperty("--brand-primary-accent", secondary);
  root.style.setProperty("--brand-bg-neutral", background);
  root.style.setProperty("--brand-surface-card", surface);
  root.style.setProperty("--button-shadow", buttonShadow);
  root.style.setProperty("--border-radius", borderRadius);
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
        const prevColors = prev?.branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
        const prevUi = prev?.branding?.ui || DEFAULT_APP_CONFIG.branding.ui;
        const primary = b.primary_color || prevColors.primary || DEFAULT_APP_CONFIG.branding.colors.primary;
        const newColors: AppConfigBrandingColors = {
          ...prevColors,
          primary,
          primaryHover: b.secondary_color || prevColors.primaryHover,
          secondary: b.secondary_color || prevColors.secondary,
          background: b.background_color || prevColors.background,
          surface: b.surface_color || prevColors.surface,
          textPrimary: b.text_primary || prevColors.textPrimary,
          textSecondary: b.text_secondary || prevColors.textSecondary,
        };
        const newUi: AppConfigBrandingUi = {
          ...prevUi,
          borderRadius: b.border_radius || prevUi.borderRadius,
          buttonShadow: computeButtonShadow(primary),
          fontFamily: b.font_family || prevUi.fontFamily,
        };
        return {
          ...prev,
          branding: {
            appName: b.app_name || prev?.branding?.appName || DEFAULT_APP_CONFIG.branding.appName,
            logoUrl: b.logo_url || prev?.branding?.logoUrl || "",
            colors: newColors,
            ui: newUi,
          },
          features: prev?.features || DEFAULT_APP_CONFIG.features,
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
        ...(prev?.branding || DEFAULT_APP_CONFIG.branding),
        ...(partial.branding || {}),
        colors: {
          ...(prev?.branding?.colors || DEFAULT_APP_CONFIG.branding.colors),
          ...(partial.branding?.colors || {}),
        },
        ui: {
          ...(prev?.branding?.ui || DEFAULT_APP_CONFIG.branding.ui),
          ...(partial.branding?.ui || {}),
        },
      },
      features: {
        ...(prev?.features || DEFAULT_APP_CONFIG.features),
        ...(partial.features || {}),
      },
    }));
  }, []);

  const updateBrandingColors = useCallback((partialColors: Partial<AppConfigBrandingColors>) => {
    setAppConfigState((prev) => {
      const prevColors = prev?.branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
      const primary = partialColors.primary || prevColors.primary || DEFAULT_APP_CONFIG.branding.colors.primary;
      return {
        ...prev,
        branding: {
          ...(prev?.branding || DEFAULT_APP_CONFIG.branding),
          colors: {
            ...prevColors,
            ...partialColors,
          },
          ui: {
            ...(prev?.branding?.ui || DEFAULT_APP_CONFIG.branding.ui),
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
