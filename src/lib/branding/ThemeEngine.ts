import { type AppBrandingRecord } from "./branding-types";
import { type MonochromaticPalette, DEFAULT_MONOCHROMATIC_PALETTE } from "./monochromatic-palettes";
import { silentCatchWarn } from "@/lib/structured-logger";

/**
 * Utilitários puros para decomposição RGB e interpolação de escala tonal (50 a 900)
 */
function parseHexToRgb(hex: string): [number, number, number] {
  if (!hex || typeof hex !== "string") return [255, 107, 0];
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return [255, 107, 0];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixColors(c1: [number, number, number], c2: [number, number, number], weight: number): string {
  const r = c1[0] * (1 - weight) + c2[0] * weight;
  const g = c1[1] * (1 - weight) + c2[1] * weight;
  const b = c1[2] * (1 - weight) + c2[2] * weight;
  return rgbToHex(r, g, b);
}

export function generatePrimaryPalette(baseHex: string) {
  const baseRgb = parseHexToRgb(baseHex);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];

  return {
    50: mixColors(baseRgb, white, 0.94),
    100: mixColors(baseRgb, white, 0.85),
    200: mixColors(baseRgb, white, 0.70),
    300: mixColors(baseRgb, white, 0.50),
    400: mixColors(baseRgb, white, 0.25),
    500: baseHex,
    600: mixColors(baseRgb, black, 0.12),
    700: mixColors(baseRgb, black, 0.28),
    800: mixColors(baseRgb, black, 0.45),
    900: mixColors(baseRgb, black, 0.62),
    deep: mixColors(baseRgb, black, 0.52),
    vibrant: baseHex,
    accent: mixColors(baseRgb, white, 0.25),
    soft: mixColors(baseRgb, white, 0.93),
    borderActive: mixColors(baseRgb, white, 0.75),
  };
}

/**
 * Gera dinamicamente um Favicon SVG em formato Data URI de alta definição.
 * O ícone possui cantos arredondados preenchidos com o gradiente da paleta ativa
 * e o símbolo de mobilidade (raio estilizado) em branco de alto contraste.
 */
export function generateSvgFavicon(primaryColor: string, secondaryColor?: string): string {
  const p = primaryColor || "#FF6B00";
  const s = secondaryColor || p;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="brandFavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p}"/>
      <stop offset="100%" stop-color="${s}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="18" fill="url(#brandFavGrad)"/>
  <path d="M36 7L16 35h14l-4 22 22-30H34l4-20z" fill="#FFFFFF"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Atualiza todos os nós de ícone do documento (<head>) garantindo que o navegador
 * descarte o cache antigo imediatamente e renderize o novo favicon na aba.
 */
export function updateBrowserFavicon(faviconUrl: string): void {
  if (typeof document === "undefined" || !faviconUrl) return;

  try {
    const isSvg = faviconUrl.startsWith("data:image/svg") || faviconUrl.endsWith(".svg");
    const mimeType = isSvg
      ? "image/svg+xml"
      : faviconUrl.endsWith(".ico")
      ? "image/x-icon"
      : faviconUrl.endsWith(".webp")
      ? "image/webp"
      : "image/png";

    // Adiciona timestamp para forçar quebra de cache em URLs http/https
    const hrefWithCacheBust = faviconUrl.startsWith("http")
      ? (faviconUrl.includes("?") ? `${faviconUrl}&t=${Date.now()}` : `${faviconUrl}?t=${Date.now()}`)
      : faviconUrl;

    const existingIcons = document.querySelectorAll<HTMLLinkElement>(
      "link[rel*='icon'], link[rel='apple-touch-icon']"
    );

    if (existingIcons.length > 0) {
      existingIcons.forEach((oldLink) => {
        const newLink = document.createElement("link");
        newLink.rel = oldLink.rel || "icon";
        newLink.type = mimeType;
        if (oldLink.sizes && oldLink.sizes.length > 0) {
          newLink.setAttribute("sizes", oldLink.sizes.value);
        }
        newLink.href = hrefWithCacheBust;
        oldLink.parentNode?.replaceChild(newLink, oldLink);
      });
    } else {
      const head = document.querySelector("head") || document.documentElement;

      const linkIcon = document.createElement("link");
      linkIcon.rel = "icon";
      linkIcon.type = mimeType;
      linkIcon.href = hrefWithCacheBust;
      head.appendChild(linkIcon);

      const linkApple = document.createElement("link");
      linkApple.rel = "apple-touch-icon";
      linkApple.href = hrefWithCacheBust;
      head.appendChild(linkApple);
    }

    try {
      localStorage.setItem("partiu_branding_favicon_url", faviconUrl);
    } catch {}

    window.dispatchEvent(
      new CustomEvent("partiu:favicon-updated", {
        detail: { faviconUrl },
      })
    );
  } catch (err) {
    silentCatchWarn("ThemeEngine:updateBrowserFavicon", err);
  }
}

/**
 * Injeta dinamicamente no <head> o manifesto WebManifest (PWA) e as meta tags
 * da plataforma (theme-color, apple-mobile-web-app-title, etc.) refletindo
 * em tempo real as configurações White Label ativas sem exigir rebuild do app.
 */
export function updateWebManifestAndMeta(branding: AppBrandingRecord): void {
  if (typeof document === "undefined") return;

  try {
    const head = document.head || document.querySelector("head") || document.documentElement;
    const appName = branding.app_name || "PARTIU";
    const shortName = branding.app_name?.split(" ")[0] || "PARTIU";
    const primaryColor = branding.primary_color || "#FF6B00";
    const bgColor = branding.background_color || "#FAFAFA";
    const iconUrl = branding.favicon_url || branding.logo_url || "/favicon.ico";

    // 0. Meta Color-Scheme (força renderização em Modo Claro Absoluto no navegador)
    let metaColorScheme = document.querySelector<HTMLMetaElement>("meta[name='color-scheme']");
    if (metaColorScheme) {
      metaColorScheme.content = "light";
    } else {
      metaColorScheme = document.createElement("meta");
      metaColorScheme.name = "color-scheme";
      metaColorScheme.content = "light";
      head.appendChild(metaColorScheme);
    }

    // 1. Meta Theme-Color (barra de status Android / navegador mobile)
    let metaThemeColor = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.content = primaryColor;
    } else {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      metaThemeColor.content = primaryColor;
      head.appendChild(metaThemeColor);
    }

    // 2. Meta Apple Mobile Web App Title (tela inicial iOS)
    let metaAppleTitle = document.querySelector<HTMLMetaElement>("meta[name='apple-mobile-web-app-title']");
    if (metaAppleTitle) {
      metaAppleTitle.content = appName;
    } else {
      metaAppleTitle = document.createElement("meta");
      metaAppleTitle.name = "apple-mobile-web-app-title";
      metaAppleTitle.content = appName;
      head.appendChild(metaAppleTitle);
    }

    // 3. Manifesto Web PWA dinâmico em tempo real (Blob URL)
    const manifestData = {
      name: `${appName} - Mobilidade Urbana & Entregas`,
      short_name: shortName,
      description: `${appName} - Para onde você for, tarifa justa e acompanhamento em tempo real.`,
      start_url: "/app",
      display: "standalone",
      orientation: "portrait",
      lang: "pt-BR",
      categories: ["travel", "transportation"],
      background_color: bgColor,
      theme_color: primaryColor,
      icons: [
        {
          src: iconUrl,
          sizes: "192x192 512x512",
          type: iconUrl.endsWith(".svg") ? "image/svg+xml" : "image/png",
          purpose: "any maskable",
        },
      ],
      shortcuts: [
        {
          name: "Pedir Corrida",
          url: "/app",
          description: "Solicite corridas em minutos",
        },
        {
          name: "Cockpit do Motorista",
          url: "/app/motorista",
          description: "Trip Radar e corridas para atender",
        },
      ],
    };

    const blob = new Blob([JSON.stringify(manifestData, null, 2)], {
      type: "application/manifest+json",
    });
    const manifestBlobUrl = URL.createObjectURL(blob);

    let manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
    if (manifestLink) {
      manifestLink.href = manifestBlobUrl;
    } else {
      manifestLink = document.createElement("link");
      manifestLink.rel = "manifest";
      manifestLink.href = manifestBlobUrl;
      head.appendChild(manifestLink);
    }
  } catch (err) {
    silentCatchWarn("ThemeEngine:updateWebManifestAndMeta", err);
  }
}

export class ThemeEngine {
  private static instance: ThemeEngine;
  private lastAppliedThemeSignature: string = "";

  public static getInstance(): ThemeEngine {
    if (!ThemeEngine.instance) {
      ThemeEngine.instance = new ThemeEngine();
    }
    return ThemeEngine.instance;
  }

  /**
   * Aplica atômica e instantaneamente todos os tokens e variáveis CSS no :root
   * gerando dinamicamente a escala tonal completa para Tailwind v4 e Shadcn
   */
  public applyTheme(branding: AppBrandingRecord, force = false): void {
    if (typeof document === "undefined") return;

    try {
      const primaryColor = branding.primary_color || "#FF6B00";
      const secondaryColor = branding.secondary_color || "#FFB800";
      const signature = `${primaryColor}_${secondaryColor}_${branding.accent_color || ""}_${branding.background_color || ""}_${branding.surface_color || ""}_${branding.text_primary || ""}_${branding.border_radius || ""}_${branding.font_family || ""}`;

      if (!force && this.lastAppliedThemeSignature === signature) {
        return;
      }
      this.lastAppliedThemeSignature = signature;

      const root = document.documentElement;
      // Bloqueio absoluto do modo claro: erradica classes .dark e força color-scheme: light
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
      if (document.body) {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
        document.body.style.colorScheme = "light";
      }

      const palette = generatePrimaryPalette(primaryColor);

      // 1. Variáveis Canônicas Requeridas pelo SaaS White Label
      root.style.setProperty("--color-primary", primaryColor);
      root.style.setProperty("--color-secondary", secondaryColor);
      root.style.setProperty("--color-accent", branding.accent_color || secondaryColor);
      root.style.setProperty("--color-background", branding.background_color || "#F8FAFC");
      root.style.setProperty("--color-surface", branding.surface_color || "#FFFFFF");
      root.style.setProperty("--color-text-primary", branding.text_primary || "#090D16");
      root.style.setProperty("--color-text-secondary", branding.text_secondary || "#64748B");

      const headerStart = branding.header_gradient_start || primaryColor;
      const headerEnd = branding.header_gradient_end || secondaryColor;
      root.style.setProperty("--header-gradient-start", headerStart);
      root.style.setProperty("--header-gradient-end", headerEnd);

      // Sincronização do Rodapé com o Cabeçalho (Padrão: true)
      const isFooterSynced = branding.footer_sync_with_header !== false;
      const footerStart = isFooterSynced
        ? headerStart
        : (branding.footer_gradient_start || headerStart);
      const footerEnd = isFooterSynced
        ? headerEnd
        : (branding.footer_gradient_end || headerEnd);

      root.style.setProperty("--footer-gradient-start", footerStart);
      root.style.setProperty("--footer-gradient-end", footerEnd);
      root.style.setProperty("--footer-sync-with-header", isFooterSynced ? "1" : "0");
      root.style.setProperty("--app-border-radius", branding.border_radius || "12px");

      // 2. Mapeamento Retrocompatível com Tailwind v4 & Shadcn/UI
      root.style.setProperty("--primary", primaryColor);
      root.style.setProperty("--primary-foreground", branding.text_primary || "#FFFFFF");
      root.style.setProperty("--secondary", branding.secondary_color || "#FFFFFF");
      root.style.setProperty("--secondary-foreground", branding.text_primary || "#090D16");
      root.style.setProperty("--accent", branding.accent_color || palette.accent);
      root.style.setProperty("--background", branding.background_color || "#F8FAFC");
      root.style.setProperty("--card", branding.surface_color || "#FFFFFF");
      root.style.setProperty("--card-foreground", branding.text_primary || "#090D16");
      root.style.setProperty("--surface", branding.surface_color || "#FFFFFF");
      root.style.setProperty("--text-secondary", branding.text_secondary || "#64748B");
      root.style.setProperty("--ring", primaryColor);

      // 3. Escala Tonal Completa Dinâmica (--primary-50 até --primary-900)
      root.style.setProperty("--primary-50", palette[50]);
      root.style.setProperty("--primary-100", palette[100]);
      root.style.setProperty("--primary-200", palette[200]);
      root.style.setProperty("--primary-300", palette[300]);
      root.style.setProperty("--primary-400", palette[400]);
      root.style.setProperty("--primary-500", palette[500]);
      root.style.setProperty("--primary-600", palette[600]);
      root.style.setProperty("--primary-700", palette[700]);
      root.style.setProperty("--primary-800", palette[800]);
      root.style.setProperty("--primary-900", palette[900]);

      // 4. Tokens Canônicos de Marca & Paleta Oficial
      root.style.setProperty("--brand", primaryColor);
      root.style.setProperty("--brand-primary", primaryColor);
      root.style.setProperty("--brand-primary-hover", palette[600]);
      root.style.setProperty("--brand-secondary", branding.secondary_color || palette.accent);
      root.style.setProperty("--brand-text", branding.text_primary || "#090D16");

      root.style.setProperty("--primary-deep", palette.deep);
      root.style.setProperty("--primary-vibrant", palette.vibrant);
      root.style.setProperty("--primary-accent", palette.accent);
      root.style.setProperty("--brand-primary-deep", palette.deep);
      root.style.setProperty("--brand-primary-vibrant", palette.vibrant);
      root.style.setProperty("--brand-primary-accent", palette.accent);
      root.style.setProperty("--brand-bg-neutral", branding.background_color || "#F8FAFC");
      root.style.setProperty("--brand-surface-card", branding.surface_color || "#FFFFFF");
      root.style.setProperty("--brand-status-green", "#22C55E");
      root.style.setProperty("--brand-danger-red", "#EF4444");
      root.style.setProperty("--brand-border-subtle", "#E2E8F0");
      root.style.setProperty("--brand-border-active", palette.borderActive);
      root.style.setProperty("--brand-pill-bg", "#F1F5F9");
      root.style.setProperty("--brand-soft", palette.soft);
      root.style.setProperty("--brand-surface-highlight", palette[100]);

      // 5. Raio de Bordas
      if (branding.border_radius) {
        root.style.setProperty("--radius", branding.border_radius);
      }

      // 6. Família Tipográfica
      if (branding.font_family) {
        root.style.setProperty(
          "--font-sans",
          `"${branding.font_family}", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        );
      }

      // 7. Atualização Dinâmica do Document Title e Favicon
      if (branding.app_name) {
        const currentTitle = document.title;
        if (!currentTitle || currentTitle.includes("PARTIU") || currentTitle.includes("Mobilidade")) {
          document.title = `${branding.app_name} — ${branding.company_name || "Mobilidade Inteligente"}`;
        }
      }

      if (branding.favicon_url) {
        updateBrowserFavicon(branding.favicon_url);
      } else {
        updateBrowserFavicon(generateSvgFavicon(primaryColor, secondaryColor));
      }

      // 8. Atualização Dinâmica do Web Manifest (PWA) e Meta Tags (theme-color, apple title)
      updateWebManifestAndMeta(branding);

      // 9. Notificação de sincronização global no DOM
      window.dispatchEvent(
        new CustomEvent("partiu:theme-palette-updated", {
          detail: { primaryColor, palette, branding },
        })
      );
    } catch (err) {
      silentCatchWarn("ThemeEngine:applyTheme", err);
    }
  }

  /**
   * Aplica instantaneamente uma das paletas monocromáticas de alto contraste,
   * atualizando todos os tokens CSS, persistindo no localStorage e disparando
   * eventos para atualização reativa de todos os componentes da aplicação.
   */
  public applyMonochromaticPalette(palette: MonochromaticPalette, appName?: string): void {
    if (typeof document === "undefined") return;

    try {
      const root = document.documentElement;
      // Bloqueio absoluto do modo claro: erradica classes .dark e força color-scheme: light
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
      if (document.body) {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
        document.body.style.colorScheme = "light";
      }

      const c = palette?.colors || DEFAULT_MONOCHROMATIC_PALETTE.colors;
      const primaryPalette = generatePrimaryPalette(c?.primary || "#FF6B00");

      // 1. Variáveis Canônicas Requeridas pelo SaaS
      root.style.setProperty("--color-primary", c.primary);
      root.style.setProperty("--color-secondary", c.secondary);
      root.style.setProperty("--color-accent", c.accent);
      root.style.setProperty("--color-background", c.background);
      root.style.setProperty("--color-surface", c.surface);
      root.style.setProperty("--color-text-primary", c.textPrimary);
      root.style.setProperty("--color-text-secondary", c.textSecondary);

      root.style.setProperty("--header-gradient-start", c.headerGradientStart);
      root.style.setProperty("--header-gradient-end", c.headerGradientEnd);
      root.style.setProperty("--footer-gradient-start", c.headerGradientStart);
      root.style.setProperty("--footer-gradient-end", c.headerGradientEnd);

      // 2. Mapeamento Tailwind v4 e Shadcn
      root.style.setProperty("--primary", c.primary);
      root.style.setProperty("--primary-foreground", c.textOnPrimary);
      root.style.setProperty("--secondary", c.secondary);
      root.style.setProperty("--secondary-foreground", c.textPrimary);
      root.style.setProperty("--accent", c.accent);
      root.style.setProperty("--background", c.background);
      root.style.setProperty("--card", c.surface);
      root.style.setProperty("--card-foreground", c.textPrimary);
      root.style.setProperty("--surface", c.surface);
      root.style.setProperty("--text-secondary", c.textSecondary);
      root.style.setProperty("--ring", c.primary);

      // 3. Escala Tonal Dinâmica (50 a 900)
      root.style.setProperty("--primary-50", primaryPalette[50]);
      root.style.setProperty("--primary-100", primaryPalette[100]);
      root.style.setProperty("--primary-200", primaryPalette[200]);
      root.style.setProperty("--primary-300", primaryPalette[300]);
      root.style.setProperty("--primary-400", primaryPalette[400]);
      root.style.setProperty("--primary-500", primaryPalette[500]);
      root.style.setProperty("--primary-600", primaryPalette[600]);
      root.style.setProperty("--primary-700", primaryPalette[700]);
      root.style.setProperty("--primary-800", primaryPalette[800]);
      root.style.setProperty("--primary-900", primaryPalette[900]);

      // 4. Tokens Canônicos de Marca
      root.style.setProperty("--brand", c.primary);
      root.style.setProperty("--brand-primary", c.primary);
      root.style.setProperty("--brand-primary-hover", c.deep);
      root.style.setProperty("--brand-secondary", c.secondary);
      root.style.setProperty("--brand-text", c.textPrimary);
      root.style.setProperty("--brand-primary-deep", c.deep);
      root.style.setProperty("--brand-primary-vibrant", c.primary);
      root.style.setProperty("--brand-primary-accent", c.secondary);
      root.style.setProperty("--brand-soft", c.soft);
      root.style.setProperty("--brand-border-active", c.borderActive);
      root.style.setProperty("--brand-surface-highlight", primaryPalette[100]);

      // 5. Persistência no LocalStorage para retenção cross-session e reload
      let updatedV2: AppBrandingRecord | null = null;
      try {
        localStorage.setItem("partiu_active_palette_id", palette.id);
        localStorage.setItem("partiu_branding_primary", c.primary);
        localStorage.setItem("partiu_branding_secondary", c.secondary);
        localStorage.setItem("partiu_branding_header_start", c.headerGradientStart);
        localStorage.setItem("partiu_branding_header_end", c.headerGradientEnd);

        // Atualiza cache canônico v2 consumido pelo BrandingProvider
        const currentBrandingV2Raw = localStorage.getItem("partiu_active_branding_v2");
        const baseV2 = currentBrandingV2Raw ? JSON.parse(currentBrandingV2Raw) : {};
        updatedV2 = {
          ...baseV2,
          tenant_id: baseV2.tenant_id || "default",
          app_name: appName || baseV2.app_name || "PARTIU",
          company_name: baseV2.company_name || "PARTIU Mobilidade Urbana",
          primary_color: c.primary,
          secondary_color: c.secondary,
          accent_color: c.accent,
          background_color: c.background,
          surface_color: c.surface,
          text_primary: c.textPrimary,
          text_secondary: c.textSecondary,
          header_gradient_start: c.headerGradientStart,
          header_gradient_end: c.headerGradientEnd,
          footer_gradient_start: c.headerGradientStart,
          footer_gradient_end: c.headerGradientEnd,
          border_radius: "16px",
          font_family: "Plus Jakarta Sans",
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem("partiu_active_branding_v2", JSON.stringify(updatedV2));

        // Atualiza cache de branding local legado
        const currentBrandingRaw = localStorage.getItem("partiu_branding_tenant_default") || "{}";
        const currentBranding = JSON.parse(currentBrandingRaw);
        localStorage.setItem(
          "partiu_branding_tenant_default",
          JSON.stringify({
            ...currentBranding,
            primary_color: c.primary,
            secondary_color: c.secondary,
            accent_color: c.accent,
            header_gradient_start: c.headerGradientStart,
            header_gradient_end: c.headerGradientEnd,
            background_color: c.background,
            surface_color: c.surface,
            text_primary: c.textPrimary,
            text_secondary: c.textSecondary,
          })
        );
      } catch {}

      // 6. Atualização Dinâmica do Favicon da Aba do Navegador
      const savedCustomFavicon = localStorage.getItem("partiu_branding_favicon_url");
      if (savedCustomFavicon && !savedCustomFavicon.startsWith("data:image/svg")) {
        updateBrowserFavicon(savedCustomFavicon);
      } else {
        updateBrowserFavicon(generateSvgFavicon(c.primary, c.accent));
      }

      // 7. Título do Documento se fornecido
      if (appName) {
        document.title = `${appName} — Mobilidade Sob Demanda`;
      }

      // 8. Atualização Dinâmica do Web Manifest (PWA) e Meta Tags
      if (updatedV2) {
        updateWebManifestAndMeta(updatedV2);
      }

      // 9. Notificação de sincronização global no DOM
      window.dispatchEvent(
        new CustomEvent("partiu:theme-palette-updated", {
          detail: { palette, primaryColor: c.primary },
        })
      );
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      silentCatchWarn("ThemeEngine:applyMonochromaticPalette", err);
    }
  }
}

export const themeEngine = ThemeEngine.getInstance();
