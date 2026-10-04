import type { MobilityLandingPageData } from "@/types/mobilityLanding";

export const defaultMobilityLandingData: MobilityLandingPageData = {
  theme: {
    primary: "", // Herda dinamicamente de useBrandTheme() (White Label Studio)
    secondary: "", // Herda dinamicamente de useBrandTheme()
    bgDark: {
      gradient: "", // Gerado dinamicamente com base nas cores primária e secundária ativas
    },
    bgLight: "#F8FAFC", // Fundo claro inferior
    textColorLight: "#FFFFFF",
    textColorDark: "#0F172A",
    cardBackground: "#FFFFFF",
    buttonRadius: "16px",
    fontFamily: "'Plus Jakarta Sans', 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    logoUrl: "", // Herda a logo oficial do White Label Studio
    brandName: "", // Herda o nome da plataforma do White Label Studio
    urbanMobilityText: "Mobilidade Urbana",
    tagline: "Mais que transporte,\né liberdade.",
  },
  hero: {
    locationChipText: "MOBILIDADE URBANA",
    headline: "Seu destino\né mais fácil",
    description: "Conectamos você ao seu destino com segurança, conforto e rapidez. Sempre.",
    carImageUrl: "", // Vazio para renderizar o marcador de GPS nativo sem fotos retangulares cobrindo o mapa
    cityBackgroundImageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2400&q=80",
  },
  actions: [
    {
      type: "passenger",
      text: "Quero ser\nPassageiro",
      iconUrl: "/user_icon.svg",
      targetUrl: "/cadastro-passageiro",
      style: "primaryGradient",
    },
    {
      type: "driver",
      text: "Quero ser\nMotorista",
      iconUrl: "/car_icon.svg",
      targetUrl: "/cadastro-motorista",
      style: "outline",
    },
  ],
  features: [
    {
      iconUrl: "/shield_icon.svg",
      text: "Seguro",
      subtext: "em todas as corridas",
    },
    {
      iconUrl: "/lightning_fast_icon.svg",
      text: "Chegada",
      subtext: "rápida",
    },
    {
      iconUrl: "/star_verified_icon.svg",
      text: "Motoristas",
      subtext: "verificados",
    },
    {
      iconUrl: "/headset_support_icon.svg",
      text: "Suporte",
      subtext: "24h",
    },
  ],
  reasonSection: {
    titlePrefix: "POR QUE ESCOLHER A",
    brandName: "",
    description:
      "Somos a escolha certa para quem busca praticidade, segurança e um serviço de qualidade todos os dias.",
    checklist: [
      "Corridas particulares",
      "Viagens corporativas",
      "Entregas expressas",
    ],
    ctaText: "Saiba mais",
    ctaUrl: "/app",
    mapCard: {
      eta: "Chegando em\n2 min",
      startPointIcon: "/map_marker_blue.svg",
      endPointIcon: "/map_marker_purple.svg",
      carAvatarUrl: "/chevrolet_onix_avatar.png",
      carModel: "Sua viagem\nChevrolet Onix",
      rating: 4.9,
    },
  },
  footer: {
    brandName: "",
    urbanMobilityText: "Mobilidade Urbana",
  },
};
