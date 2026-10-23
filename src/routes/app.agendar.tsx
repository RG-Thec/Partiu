import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ScheduledRideFormScreen } from "@/components/schedule/ScheduledRideFormScreen";
import { NotificacoesPushModal } from "@/components/modals/NotificacoesPushModal";
import { AppDrawer } from "@/components/navigation/AppDrawer";
import { HomeBottomNav } from "@/components/home/HomeBottomNav";
import { getStatusPermissaoPush } from "@/lib/push-notifications";
import { UserService } from "@/services/UserService";

export const Route = createFileRoute("/app/agendar")({
  head: () => ({
    meta: [
      { title: "Partiu Agendar — Corridas Programadas com Acordo Direto" },
      {
        name: "description",
        content:
          "Agende suas viagens com antecedência no Partiu. Proponha sua tarifa com piso mínimo operacional protegido e combine diretamente com o motorista parceiro sem taxas abusivas.",
      },
    ],
  }),
  component: PartiuAgendarPage,
});

function PartiuAgendarPage() {
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [modalNotificacoesAberto, setModalNotificacoesAberto] = useState(false);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>("default");

  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("partiu_user_nome") || "Passageiro";
    }
    return "Passageiro";
  });

  const [userAvatarUrl, setUserAvatarUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("partiu_user_avatar") || "";
    }
    return "";
  });

  useEffect(() => {
    setPushStatus(getStatusPermissaoPush());
    UserService.getInstance()
      .getCurrentUserProfile()
      .then((perfil) => {
        if (perfil?.name) setUserName(perfil.name);
        if (perfil?.avatarUrl) setUserAvatarUrl(perfil.avatarUrl);
      })
      .catch(() => {
        const salvo = localStorage.getItem("partiu_user_nome");
        if (salvo) setUserName(salvo);
      });

    const sincronizarStorage = () => {
      try {
        const salvoNome = localStorage.getItem("partiu_user_nome");
        if (salvoNome) setUserName(salvoNome);
        const salvoAv = localStorage.getItem("partiu_user_avatar");
        if (salvoAv) setUserAvatarUrl(salvoAv);
      } catch {}
    };

    const handleProfileUpdate = (e: any) => {
      try {
        if (e.detail?.name) setUserName(e.detail.name);
        if (e.detail?.avatarUrl) setUserAvatarUrl(e.detail.avatarUrl);
      } catch {}
    };

    window.addEventListener("storage", sincronizarStorage);
    window.addEventListener("partiu:user-profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("storage", sincronizarStorage);
      window.removeEventListener("partiu:user-profile-updated", handleProfileUpdate);
    };
  }, []);

  const pushAtivo = pushStatus === "granted";

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden select-none">
      {/* CONTEÚDO ROLÁVEL COM SCROLLBAR OCULTA */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain pb-20 pt-0 scrollbar-none">
        <ScheduledRideFormScreen
          userName={userName}
          userAvatarUrl={userAvatarUrl}
          onOpenNotifications={() => setModalNotificacoesAberto(true)}
          pushActive={pushAtivo}
        />
      </div>

      {/* BARRA DE NAVEGAÇÃO INFERIOR FIXA */}
      <div className="absolute bottom-0 left-0 right-0 z-30 w-full pointer-events-auto">
        <HomeBottomNav activeTab="agendar" />
      </div>

      {/* MODAL DE NOTIFICAÇÕES PUSH NATIVAS */}
      <NotificacoesPushModal
        aberto={modalNotificacoesAberto}
        onFechar={() => {
          setModalNotificacoesAberto(false);
          setPushStatus(getStatusPermissaoPush());
        }}
      />

      {/* GAVETA LATERAL */}
      <AppDrawer open={drawerAberto} onClose={() => setDrawerAberto(false)} />
    </div>
  );
}
