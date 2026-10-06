import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Clock,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { DeliveryProvider, useDelivery } from "@/contexts/DeliveryContext";
import { DeliverySetupDashboard } from "@/components/delivery/DeliverySetupDashboard";
import { DeliveryContactFormScreen } from "@/components/delivery/DeliveryContactFormScreen";
import { DeliveryTrackingFloatingCard } from "@/components/delivery/DeliveryTrackingFloatingCard";
import { NotificacoesPushModal } from "@/components/modals/NotificacoesPushModal";
import { AppDrawer } from "@/components/navigation/AppDrawer";
import { PartiuRideMap } from "@/components/maps/PartiuRideMap";
import { HomeBottomNav } from "@/components/home/HomeBottomNav";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { getStatusPermissaoPush } from "@/lib/push-notifications";
import { UserService } from "@/services/UserService";

export const Route = createFileRoute("/app/encomendas")({
  head: () => ({
    meta: [
      { title: "Partiu Entregas — Motos & Carros com Duplo PIN Seguro" },
      {
        name: "description",
        content:
          "Envio expresso de encomendas com moto ou carro, com verificação de segurança por Duplo PIN (Coleta e Destino) e rastreamento ao vivo.",
      },
    ],
  }),
  component: PartiuEncomendasRoot,
});

function PartiuEncomendasRoot() {
  return (
    <DeliveryProvider>
      <PartiuEncomendasContent />
    </DeliveryProvider>
  );
}

function PartiuEncomendasContent() {
  const {
    status,
    ordemAtiva,
  } = useDelivery();
  const { corPrimaria, corTextoPrimaria } = useBrandTheme();

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

  // Se houver entrega em andamento (AWAITING_PICKUP | IN_TRANSIT | ARRIVED_DESTINATION | DELIVERED)
  if (status !== "SETUP" && ordemAtiva) {
    const mapStatus =
      status === "AWAITING_PICKUP"
        ? "A_CAMINHO"
        : status === "IN_TRANSIT"
        ? "EM_VIAGEM"
        : status === "ARRIVED_DESTINATION"
        ? "CHEGOU"
        : "CONCLUIDA";

    return (
      <div className="relative w-full h-[100dvh] flex flex-col bg-slate-100 overflow-hidden font-sans">
        {/* MAPA INTERATIVO EM BACKGROUND */}
        <div className="absolute inset-0 z-0">
          <PartiuRideMap
            status={mapStatus}
            modalidade={ordemAtiva.categoriaVeiculo === "MOTO" ? "MOTO" : "POP"}
            origemEndereco={ordemAtiva.origem.endereco}
            destinoEndereco={ordemAtiva.destino.endereco}
            motorista={{
              id: ordemAtiva.motorista.id,
              nome: ordemAtiva.motorista.nome,
              foto: ordemAtiva.motorista.fotoUrl,
              avaliacao: ordemAtiva.motorista.avaliacao,
              totalViagens: 1980,
              veiculo: ordemAtiva.motorista.veiculoModelo,
              placa: ordemAtiva.motorista.veiculoPlaca,
              telefone: ordemAtiva.motorista.telefone,
            }}
          />
        </div>

        {/* TOPO FLUTUANTE SOBRE O MAPA */}
        <div className="relative z-10 px-3 pt-3 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={() => setDrawerAberto(true)}
            className="w-8.5 h-8.5 rounded-xl bg-white/95 backdrop-blur-md shadow-md text-slate-900 flex items-center justify-center pointer-events-auto active:scale-95 transition cursor-pointer"
            aria-label="Abrir Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md shadow-md flex items-center gap-1.5 pointer-events-auto border border-black/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-900">
              {ordemAtiva.codigoRastreio}
            </span>
          </div>

          <Link
            to="/app"
            className="w-8.5 h-8.5 rounded-xl bg-white/95 backdrop-blur-md shadow-md text-slate-900 flex items-center justify-center pointer-events-auto active:scale-95 transition cursor-pointer"
            title="Voltar para Corridas"
          >
            <Car className="w-4 h-4" />
          </Link>
        </div>

        {/* CARD FLUTUANTE DO MOTORISTA E DUPLO PIN */}
        <div className="mt-auto relative z-20">
          <DeliveryTrackingFloatingCard />
        </div>

        {/* GAVETA LATERAL */}
        <AppDrawer open={drawerAberto} onClose={() => setDrawerAberto(false)} />
      </div>
    );
  }

  // TELA DE SETUP (DASHBOARD MINIMALISTA COM MOTO E CARRO)
  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden select-none">
      {/* ÁREA DE CONTEÚDO ROLÁVEL COM SCROLLBAR OCULTA */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain pb-24 pt-0 scrollbar-none">
        {/* COMPONENTE VISUAL DO SETUP DASHBOARD */}
        <DeliverySetupDashboard
          onOpenNotifications={() => setModalNotificacoesAberto(true)}
          pushActive={pushAtivo}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
        />
      </div>

      {/* BARRA DE NAVEGAÇÃO INFERIOR FIXA (CONSISTÊNCIA COM /app) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 w-full pointer-events-auto">
        <HomeBottomNav activeTab="entregas" />
      </div>

      {/* TELA DE FORMULÁRIO LIMPO DE CONTATO / DESTINATÁRIO / REMETENTE */}
      <DeliveryContactFormScreen />

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
