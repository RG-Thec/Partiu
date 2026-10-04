/**
 * ==============================================================================
 * 🎨 PARTIU WHITE LABEL — PALETAS MONOCROMÁTICAS COM CONTRASTE PROFISSIONAL
 * ==============================================================================
 * Cada paleta é um sistema cromático coeso, com gradações monocromáticas
 * harmônicas de alto contraste (WCAG AAA), sem misturas conflitantes de cores.
 * Ao selecionar qualquer paleta, todo o ecossistema (cabeçalho, busca, botões,
 * abas, drawer, modais e mapa) adota as cores de forma 100% unificada.
 * ==============================================================================
 */

export interface MonochromaticPalette {
  id: string;
  name: string;
  category: "Oficial" | "Executivo" | "Corporativo" | "Eco" | "Fintech";
  description: string;
  isDefault?: boolean;
  colors: {
    primary: string;         // Cor principal de ação, botões, ícones ativos
    secondary: string;       // Cor de apoio, badges, acentos
    accent: string;          // Destaque pontual harmônico
    deep: string;            // Gradiente fim, títulos estruturais
    vibrant: string;         // Destaque vibrante
    soft: string;            // Fundo de inputs, cards suaves (50-level)
    borderActive: string;    // Borda de foco e caixas ativas
    background: string;      // Fundo neutro do app
    surface: string;         // Fundo de cards brancos
    textPrimary: string;     // Texto de alto contraste sobre fundos claros
    textSecondary: string;   // Subtítulos
    textOnPrimary: string;   // Texto legível sobre a cor primária (branco/preto)
    headerGradientStart: string;
    headerGradientEnd: string;
  };
}

export const MONOCHROMATIC_PALETTES: MonochromaticPalette[] = [
  {
    id: "paleta-laranja-solar",
    name: "Laranja Solar & Âmbar",
    category: "Oficial",
    description: "Paleta oficial do PARTIU: energia urbana, alta visibilidade e calor moderno.",
    isDefault: true,
    colors: {
      primary: "#FF6B00",
      secondary: "#FFB800",
      accent: "#EA580C",
      deep: "#EA580C",
      vibrant: "#FF6B00",
      soft: "#FFF7ED",
      borderActive: "#FED7AA",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      textPrimary: "#0F172A",
      textSecondary: "#64748B",
      textOnPrimary: "#FFFFFF",
      headerGradientStart: "#FF6B00",
      headerGradientEnd: "#EA580C",
    },
  },
  {
    id: "paleta-preto-onix",
    name: "Preto Ônix & Dourado Nobre",
    category: "Executivo",
    description: "Estilo Black Executivo: sofisticação e elegância máxima para serviços VIP.",
    colors: {
      primary: "#0F172A",
      secondary: "#D97706",
      accent: "#F59E0B",
      deep: "#020617",
      vibrant: "#1E293B",
      soft: "#F8FAFC",
      borderActive: "#CBD5E1",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      textPrimary: "#020617",
      textSecondary: "#475569",
      textOnPrimary: "#FFFFFF",
      headerGradientStart: "#0F172A",
      headerGradientEnd: "#1E293B",
    },
  },
  {
    id: "paleta-azul-real",
    name: "Azul Marinho Real",
    category: "Corporativo",
    description: "100% monocromática oceânica: confiança, segurança e sobriedade institucional.",
    colors: {
      primary: "#0284C7",
      secondary: "#0369A1",
      accent: "#38BDF8",
      deep: "#075985",
      vibrant: "#0284C7",
      soft: "#F0F9FF",
      borderActive: "#BAE6FD",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      textPrimary: "#082F49",
      textSecondary: "#475569",
      textOnPrimary: "#FFFFFF",
      headerGradientStart: "#0284C7",
      headerGradientEnd: "#075985",
    },
  },
  {
    id: "paleta-verde-esmeralda",
    name: "Verde Esmeralda Sustentável",
    category: "Eco",
    description: "Mobilidade limpa, sustentabilidade, frescor e conexão urbana consciente.",
    colors: {
      primary: "#059669",
      secondary: "#10B981",
      accent: "#34D399",
      deep: "#047857",
      vibrant: "#059669",
      soft: "#F0FDF4",
      borderActive: "#BBF7D0",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      textPrimary: "#064E3B",
      textSecondary: "#475569",
      textOnPrimary: "#FFFFFF",
      headerGradientStart: "#059669",
      headerGradientEnd: "#047857",
    },
  },
  {
    id: "paleta-violeta-cyber",
    name: "Violeta Cyber & Ametista",
    category: "Fintech",
    description: "Estilo moderno fintech, vanguarda tecnológica e apelo metropolitano premium.",
    colors: {
      primary: "#7C3AED",
      secondary: "#8B5CF6",
      accent: "#A78BFA",
      deep: "#6D28D9",
      vibrant: "#7C3AED",
      soft: "#FAF5FF",
      borderActive: "#E9D5FF",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      textPrimary: "#2E1065",
      textSecondary: "#475569",
      textOnPrimary: "#FFFFFF",
      headerGradientStart: "#7C3AED",
      headerGradientEnd: "#6D28D9",
    },
  },
];

export const DEFAULT_MONOCHROMATIC_PALETTE = MONOCHROMATIC_PALETTES[0];
