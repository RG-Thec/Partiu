import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { MobileViewportContainer } from "@/components/layout/MobileViewportContainer";
import { RouteLoadingPendingScreen } from "@/components/layout/RouteLoadingPendingScreen";
import { BrandingProvider, SplashScreen } from "@/components/branding";
import { WhiteLabelThemeProvider } from "@/contexts/WhiteLabelThemeContext";
import { setupGlobalErrorLogging } from "@/lib/structured-logger";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-xl sm:max-w-2xl text-center">
        <h1 className="text-7xl font-black text-primary">404</h1>
        <h2 className="mt-4 text-xl font-bold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você tentou acessar não existe ou foi transferido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius,12px)] bg-primary text-primary-foreground px-6 py-2.5 text-sm font-bold transition-all hover:bg-primary/90 shadow-md active:scale-95"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  // Re-throw redirects para o TanStack Router gerenciar transições sem tratá-las como crash
  if (
    error &&
    typeof error === "object" &&
    ("options" in error ||
      "isSerializedRedirect" in error ||
      (error as any).status === 307 ||
      (error as any).status === 302)
  ) {
    throw error;
  }

  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-xl sm:max-w-2xl text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Não foi possível carregar esta tela
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu uma instabilidade na conexão ou no processamento dos dados. Você pode tentar atualizar ou retornar ao início.
        </p>
        {error?.message && (
          <p className="mt-3 text-xs font-mono bg-muted text-muted-foreground p-3 rounded-xl break-words text-left max-h-32 overflow-auto border border-border">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius,12px)] bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold transition-all hover:bg-primary/90 shadow-md active:scale-95 cursor-pointer"
          >
            Tentar Novamente
          </button>
          <a
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-input bg-card px-5 py-2.5 text-sm font-bold text-foreground transition-all hover:bg-muted active:scale-95 cursor-pointer"
          >
            Ir para o Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      { name: "color-scheme", content: "light" },
      { name: "theme-color", content: "#FF6B00" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "PARTIU - Para onde você for, Partiu! Mobilidade & Entregas" },
      {
        name: "description",
        content:
          "Para onde você for, Partiu! Carro, moto e entregas expressas com tarifa justa, verificação de PIN de segurança e repasse instantâneo via PIX D+0.",
      },
      { name: "author", content: "PARTIU Mobilidade" },
      { property: "og:title", content: "PARTIU - Mobilidade Urbana & Entregas" },
      {
        property: "og:description",
        content:
          "Carro, moto e entregas com tarifa justa, código PIN de segurança e rastreamento em tempo real.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/icon-512.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/icon-512.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  pendingComponent: RouteLoadingPendingScreen,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="light" style={{ colorScheme: "light" }}>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var urlParams = new URLSearchParams(window.location.search);
    var tid = urlParams.get('tenant') || urlParams.get('tenant_id');
    if (!tid) {
      var sessionRaw = localStorage.getItem('partiu_admin_session');
      if (sessionRaw) {
        try {
          var s = JSON.parse(sessionRaw);
          if (s && s.role === 'FRANQUEADO' && s.tenantId) tid = s.tenantId;
        } catch(e) {}
      }
    }
    if (!tid) {
      tid = localStorage.getItem('partiu_active_tenant_id_v2') || localStorage.getItem('partiu_wl_active_tenant_v1') || 'default';
    }
    var raw = localStorage.getItem('partiu_branding_tenant_' + tid) || localStorage.getItem('partiu_active_branding_v2');
    if (raw) {
      var b = JSON.parse(raw);
      if (b && b.primary_color) {
        var r = document.documentElement;
        r.style.setProperty('--primary', b.primary_color);
        r.style.setProperty('--color-primary', b.primary_color);
        r.style.setProperty('--brand', b.primary_color);
        r.style.setProperty('--brand-primary', b.primary_color);
        if (b.secondary_color) {
          r.style.setProperty('--secondary', b.secondary_color);
          r.style.setProperty('--color-secondary', b.secondary_color);
          r.style.setProperty('--brand-secondary', b.secondary_color);
        }
        if (b.background_color) {
          r.style.setProperty('--background', b.background_color);
          r.style.setProperty('--color-background', b.background_color);
        }
      }
    }
  } catch(e) {}
})();
`,
          }}
        />
      </head>
      <body className="light" style={{ colorScheme: "light" }}>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    setupGlobalErrorLogging();
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <WhiteLabelThemeProvider>
          <SplashScreen minDurationMs={550} />
          <MobileViewportContainer>
            <Outlet />
          </MobileViewportContainer>
        </WhiteLabelThemeProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}
