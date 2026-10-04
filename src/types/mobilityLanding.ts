export interface ThemeConfig {
  primary: string; // Ex: "#007AFF"
  secondary: string; // Ex: "#9C27B0"
  bgDark: {
    gradient: string; // Ex: "linear-gradient(to bottom, #001236, #002D62)"
  };
  bgLight: string; // Ex: "#F1F5F9"
  textColorLight: string; // Ex: "#FFFFFF"
  textColorDark: string; // Ex: "#111827"
  cardBackground: string; // Ex: "#FFFFFF"
  buttonRadius: string; // Ex: "12px"
  fontFamily: string; // Ex: "'Avenir Next', sans-serif"
}

export interface HeaderConfig {
  logoUrl: string;
  brandName: string;
  urbanMobilityText: string;
  tagline: string;
}

export interface HeroConfig {
  locationChipText: string;
  headline: string;
  description: string;
  carImageUrl: string;
  cityBackgroundImageUrl?: string;
}

export interface ActionItem {
  type: "passenger" | "driver" | string;
  text: string;
  iconUrl: string;
  targetUrl: string;
  style: "primaryGradient" | "outline" | string;
}

export interface FeatureItem {
  iconUrl: string;
  text: string;
  subtext: string;
}

export interface MapCardConfig {
  eta: string;
  startPointIcon: string;
  endPointIcon: string;
  carAvatarUrl: string;
  carModel: string;
  rating: number;
}

export interface ReasonSectionConfig {
  titlePrefix: string;
  brandName: string;
  description: string;
  checklist: string[];
  ctaText: string;
  ctaUrl: string;
  mapCard: MapCardConfig;
}

export interface FooterConfig {
  brandName: string;
  urbanMobilityText: string;
}

export interface MobilityLandingPageData {
  theme: ThemeConfig;
  header: HeaderConfig;
  hero: HeroConfig;
  actions: ActionItem[];
  features: FeatureItem[];
  reasonSection: ReasonSectionConfig;
  footer: FooterConfig;
}
