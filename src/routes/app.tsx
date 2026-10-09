import { initGlobalFontSize } from "@/lib/font-size-manager";
import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { PushNotificationPrompt } from "@/components/notifications/PushNotificationPrompt";
import { BroadcastNotificationListener } from "@/components/notifications/BroadcastNotificationListener";
import { registrarServiceWorker } from "@/lib/push-notifications";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";

export const Route = createFileRoute("/app")({
  ssr: false,
  shouldReload: false,
  beforeLoad: async ({ location }) => {
    const pathname = location.pathname;

    // Rotas administrativas possuem seu próprio sistema de autenticação RBAC dedicado
    if (pathname.startsWith("/app/admin")) {
      return { user: null };
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const expired = !session || (session.expires_at ?? 0) * 1000 <= Date.now();
      const storedUser = typeof window !== "undefined" ? supabaseAuthService.getStoredSession() : null;

      // Todas as rotas do aplicativo (/app) exigem login ativo (Passageiro ou Motorista)
      const isAuthenticated = (session && !expired) || !!storedUser;

      if (!isAuthenticated) {
        const isMotorista = pathname.startsWith("/app/motorista");
        throw redirect({
          to: "/auth",
          search: {
            redirect: pathname,
            role: isMotorista ? ("MOTORISTA" as const) : ("PASSAGEIRO" as const),
            ...(session && expired ? { expirada: "1" as const } : {}),
          },
        });
      }

      return { user: session?.user ?? (storedUser as any) ?? null };
    } catch (err: any) {
      if (err && typeof err === "object" && ("options" in err || "status" in err)) {
        throw err;
      }
      return { user: null };
    }
  },
  component: AppLayout,
});

function AppLayout() {
  useEffect(() => {
    initGlobalFontSize();
    registrarServiceWorker();

    // Bloqueio absoluto do Dark Mode: erradica classes .dark e força color-scheme: light
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.documentElement.style.colorScheme = "light";
      if (document.body) {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
        document.body.style.colorScheme = "light";
      }
    }
  }, []);
  const href = useRouterState({ select: (s) => s.location.href });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/app/admin") || href.includes("/app/admin");

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-background w-full">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-50 w-full flex flex-col relative overflow-hidden">
      <div className="w-full flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
      <BroadcastNotificationListener />
      <PushNotificationPrompt />
    </div>
  );
}
