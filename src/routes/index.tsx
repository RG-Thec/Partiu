import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MobilityLandingPage } from "@/components/landing/MobilityLandingPage";
import { whiteLabelEngine } from "@/lib/white-label";

// Re-exporta PartiuAppAuthGate para retrocompatibilidade
export { PartiuAppAuthGate } from "@/components/auth/PartiuAppAuthGate";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { tenant?: string; tenant_id?: string } => ({
    tenant: typeof search.tenant === "string" ? search.tenant : undefined,
    tenant_id: typeof search.tenant_id === "string" ? search.tenant_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "PARTIU • Mobilidade Urbana & Entregas Inteligentes" },
      {
        name: "description",
        content: "Conectamos você ao seu destino com segurança, conforto e rapidez. Sempre.",
      },
      { property: "og:title", content: "PARTIU • Mobilidade Urbana & Entregas" },
      {
        property: "og:description",
        content: "Conectamos você ao seu destino com segurança, conforto e rapidez. Sempre.",
      },
    ],
  }),
  component: RootLandingPageRoute,
});

function RootLandingPageRoute() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const tenantParam = search.tenant || search.tenant_id;

  useEffect(() => {
    if (tenantParam && tenantParam.trim()) {
      try {
        whiteLabelEngine.switchTenant(tenantParam.trim());
      } catch {}
    }
  }, [tenantParam]);

  const handleNavigate = (url: string) => {
    const effectiveTenant =
      (tenantParam && tenantParam.trim()) || whiteLabelEngine.getActiveTenantId();
    let targetUrl = url;
    if (effectiveTenant && effectiveTenant !== "default" && !targetUrl.includes("tenant=")) {
      targetUrl = `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}tenant=${encodeURIComponent(effectiveTenant)}`;
    }
    if (targetUrl.startsWith("/")) {
      void navigate({ to: targetUrl as any });
    } else {
      window.location.href = targetUrl;
    }
  };

  return <MobilityLandingPage onNavigate={handleNavigate} showCustomizer={false} />;
}
