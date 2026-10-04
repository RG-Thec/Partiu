/**
 * PARTIU — Design Tokens "Laranja Solar & Amarelo"
 *
 * Single source of truth for all visual tokens.
 * Every component MUST import colors from here instead of hardcoding hex values.
 *
 * @see styles.css for CSS custom property equivalents consumed by Tailwind.
 */

// ─────────────────────────────────────────────────────────────
// OFFICIAL BRAND TOKENS "LARANJA SOLAR & AMARELO"
// ─────────────────────────────────────────────────────────────
export const brandTokens = {
  primaryDeep: "#EA580C",     // Títulos, valores em destaque, bordas estruturais
  primaryVibrant: "#FF6B00",  // Ícones ativos, barras de progresso, gradiente início
  primaryAccent: "#FFB800",   // Badges de destaque, cor secundária, detalhes
  bgNeutral: "#F8FAFC",       // Fundo global de telas (Slate-50 anti-fadiga)
  surfaceCard: "#FFFFFF",     // Superfície branca pura de cards e sheets
  statusGreen: "#22C55E",     // Indicadores de ONLINE, confirmação de embarque
  dangerRed: "#EF4444",       // Central de Emergência / SOS 190, recusa e cancelamento
  borderSubtle: "#E2E8F0",    // Bordas finas de cartões e inputs (slate-200)
  pillBg: "#FFF7ED",          // Fundo de chips e metadados secundários (orange-50)
} as const;

// ─────────────────────────────────────────────────────────────
// PRIMARY SCALE
// ─────────────────────────────────────────────────────────────
export const colors = {
  brand: brandTokens,
  primary: {
    900: "#7C2D12",
    800: "#9A3412",
    700: "#C2410C",
    600: "#EA580C",
    500: "#FF6B00",
    400: "#FB923C",
    100: "#FFEDD5",
    50: "#FFF7ED",
  },

  accent: "#FFB800",

  background: "#F8FAFC",
  surface: "#FFFFFF",

  text: {
    primary: "#0F172A",
    secondary: "#475569",
    tertiary: "#94A3B8",
    inverse: "#FFFFFF",
  },

  border: {
    default: "#E2E8F0",
    soft: "#FED7AA",
  },

  semantic: {
    success: "#22C55E",
    successSoft: "#ECFDF5",
    warning: "#F59E0B",
    warningSoft: "#FFFBEB",
    danger: "#EF4444",
    dangerSoft: "#FEF2F2",
    info: "#FF6B00",
    infoSoft: "#FFF7ED",
  },

  /** Dark mode overrides */
  dark: {
    background: "#090D16",
    surface: "#111827",
    card: "#111827",
    border: "rgba(255, 255, 255, 0.1)",
    textSecondary: "#94A3B8",
  },
} as const;

// ─────────────────────────────────────────────────────────────
// GRADIENTS
// ─────────────────────────────────────────────────────────────
export const gradients = {
  /** Primary CTA gradient — used on all main action buttons */
  primary: "linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)",

  /** Rainbow gradient — Estilo Arco-íris Vibrante & Moderno */
  rainbow:
    "linear-gradient(90deg, #E11D48 0%, #EA580C 16%, #F59E0B 32%, #10B981 48%, #06B6D4 64%, #3B82F6 80%, #8B5CF6 100%)",

  /** Rainbow Mesh alternativo */
  rainbowMesh:
    "linear-gradient(135deg, #FF007A 0%, #7928CA 20%, #0070F3 42%, #00DFD8 65%, #10B981 82%, #F59E0B 100%)",

  /** Header gradient (Laranja degradê) */
  header: "linear-gradient(180deg, #FF6B00 0%, #EA580C 100%)",

  /** Bottom nav dark gradient — Alto Contraste Obsidian */
  bottomNav: "linear-gradient(180deg, #0F172A 0%, #020617 100%)",

  /** Accent subtle glow */
  accentGlow: "linear-gradient(135deg, #FFB800 0%, #FF6B00 100%)",

  /** Hero background gradient */
  hero: "linear-gradient(135deg, #FF6B00 0%, #FFB800 100%)",
} as const;

// ─────────────────────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────────────────────
export const shadows = {
  soft: "0 2px 8px rgba(0, 0, 0, 0.05)",
  card: "0 4px 18px rgba(0, 0, 0, 0.07)",
  elevated: "0 10px 30px rgba(0, 0, 0, 0.10)",
  button: "0 4px 14px rgba(255, 107, 0, 0.25)",
  buttonHover: "0 6px 20px rgba(255, 107, 0, 0.35)",
  nav: "0 -4px 20px rgba(0, 0, 0, 0.08)",
  glow: "0 0 20px rgba(255, 107, 0, 0.30)",
} as const;

// ─────────────────────────────────────────────────────────────
// RADII
// ─────────────────────────────────────────────────────────────
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────
export const typography = {
  family: {
    sans: '"Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },
} as const;

// ─────────────────────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────────────────────
export const animation = {
  fast: "150ms",
  normal: "250ms",
  slow: "350ms",
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

// ─────────────────────────────────────────────────────────────
// COMPONENT-SPECIFIC TOKENS
// ─────────────────────────────────────────────────────────────
export const components = {
  header: {
    gradient: gradients.header,
    borderRadius: 16,
    textColor: colors.text.inverse,
  },
  bottomNav: {
    background: "#0F172A",
    gradient: gradients.bottomNav,
    activeIconColor: colors.text.inverse,
    activeTextColor: colors.text.inverse,
    inactiveColor: "rgba(255, 255, 255, 0.45)",
    activePill: {
      background: "rgba(255, 107, 0, 0.15)",
      border: "rgba(255, 107, 0, 0.35)",
    },
    borderRadius: radii["3xl"],
  },
  button: {
    gradient: gradients.primary,
    textColor: colors.text.inverse,
    borderRadius: radii.lg,
    shadow: shadows.button,
    shadowHover: shadows.buttonHover,
    disabledOpacity: 0.5,
  },
  card: {
    background: colors.surface,
    borderRadius: radii.lg,
    shadow: shadows.card,
    border: colors.border.soft,
  },
  input: {
    focusColor: colors.primary[600],
    focusRing: `0 0 0 3px rgba(0, 136, 255, 0.2)`,
    borderColor: colors.border.default,
    borderRadius: radii.md,
  },
} as const;

export type DesignTokens = {
  colors: typeof colors;
  gradients: typeof gradients;
  shadows: typeof shadows;
  radii: typeof radii;
  spacing: typeof spacing;
  typography: typeof typography;
  animation: typeof animation;
  components: typeof components;
};

const tokens: DesignTokens = {
  colors,
  gradients,
  shadows,
  radii,
  spacing,
  typography,
  animation,
  components,
};

export default tokens;
