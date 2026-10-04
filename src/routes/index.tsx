import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobilityLandingPage } from "@/components/landing/MobilityLandingPage";

// Re-exporta PartiuAppAuthGate para retrocompatibilidade
export { PartiuAppAuthGate } from "@/components/auth/PartiuAppAuthGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PARTIU • Mobilidade Urbana & Entregas Inteligentes" },
      {
        name: "description",
        content:
          "Conectamos você ao seu destino com segurança, conforto e rapidez. Sempre.",
      },
      { property: "og:title", content: "PARTIU • Mobilidade Urbana & Entregas" },
      {
        property: "og:description",
        content:
          "Conectamos você ao seu destino com segurança, conforto e rapidez. Sempre.",
      },
    ],
  }),
  component: RootLandingPageRoute,
});

function RootLandingPageRoute() {
  const navigate = useNavigate();

  const handleNavigate = (url: string) => {
    if (url.startsWith("/")) {
      void navigate({ to: url as any });
    } else {
      window.location.href = url;
    }
  };

  return <MobilityLandingPage onNavigate={handleNavigate} showCustomizer={false} />;
}
