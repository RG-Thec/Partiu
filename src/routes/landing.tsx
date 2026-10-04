import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobilityLandingPage } from "@/components/landing/MobilityLandingPage";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "PARTIU • Mobilidade Urbana & Entregas Inteligentes" },
      {
        name: "description",
        content:
          "Conectamos você ao seu destino com segurança, conforto e rapidez. Sempre.",
      },
    ],
  }),
  component: LandingPageRoute,
});

function LandingPageRoute() {
  const navigate = useNavigate();

  const handleNavigate = (url: string) => {
    if (url.startsWith("/")) {
      void navigate({ to: url as any });
    } else {
      window.location.href = url;
    }
  };

  return <MobilityLandingPage onNavigate={handleNavigate} />;
}
