import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { LocateFixed } from "lucide-react";
import { PartiuLogo } from "@/components/common/PartiuLogo";
import {
  PassengerRideProvider,
  usePassengerRide,
} from "@/contexts/PassengerRideContext";
import {
  DestinationCard,
  PromoCarousel,
  HomeBottomNav,
  AnimatedWaveHeader,
  type RecentAddressItem,
  type PromoBannerItem,
} from "@/components/home";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";
import { bannerService } from "@/lib/ecosystem/banner-service";
import { registrarDestinoFrequente } from "@/lib/passenger/smart-destination-suggestions";
import { PassengerSearchDestinationSheet } from "@/components/passenger/PassengerSearchDestinationSheet";
import { PassengerReviewRouteSheet } from "@/components/passenger/PassengerReviewRouteSheet";
import { PassengerConfirmPickupPin } from "@/components/passenger/PassengerConfirmPickupPin";
import { PassengerConfirmDestinationPin } from "@/components/passenger/PassengerConfirmDestinationPin";
import { PassengerFindingDriverRadar } from "@/components/passenger/PassengerFindingDriverRadar";
import { FloatingRidePill } from "@/components/passenger/FloatingRidePill";
import { PassengerTimeoutBottomSheet } from "@/components/passenger/PassengerTimeoutBottomSheet";
import { DriverEnRouteSheet } from "@/components/passenger/DriverEnRouteSheet";
import { NetworkReconnectionBanner } from "@/components/passenger/NetworkReconnectionBanner";
import { GpsPermissionModal } from "@/components/passenger/GpsPermissionModal";
import { PartiuRideMap, type PartiuRideMapHandle } from "@/components/maps/PartiuRideMap";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";
import { getStatusPermissaoPush } from "@/lib/push-notifications";
import { useScrollInterpolation } from "@/hooks/useScrollInterpolation";
import { NotificationCenterModal } from "@/components/notifications/NotificationCenterModal";
import { pushNotificationService } from "@/services/PushNotificationService";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { userService } from "@/services/UserService";
import { getHistoricoViagens } from "@/lib/partiu-engine";

// Lazy loading sob demanda para componentes pesados secundários (TTI acelerado)
const AppDrawer = lazy(() =>
  import("@/components/navigation/AppDrawer").then((m) => ({ default: m.AppDrawer }))
);

function carregarDestinosRecentesPassageiro(uid?: string, phone?: string): RecentAddressItem[] {
  if (typeof window === "undefined") return [];
  try {
    const key =
      uid && uid !== "passageiro_default"
        ? `partiu_recent_destinations_v1_${uid}`
        : "partiu_recent_destinations_v1";

    const salvo = localStorage.getItem(key);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed)) {
        // Filtrar e expurgar registros mock legados e inválidos
        const validos = parsed.filter(
          (item: any) =>
            item &&
            item.id !== "rec-1" &&
            item.id !== "rec-2" &&
            item.label !== "Rua Dez de Maio, 188" &&
            item.label !== "Hospital São José do Avaí" &&
            Array.isArray(item.coords) &&
            item.coords.length === 2 &&
            typeof item.coords[0] === "number" &&
            typeof item.coords[1] === "number"
        );
        if (validos.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(validos));
        }
        if (validos.length > 0) {
          return validos.slice(0, 2).map((item: any) => ({
            id: item.id,
            titulo: item.label || item.titulo || "Recente",
            endereco: item.endereco,
            coords: [item.coords[0], item.coords[1]] as [number, number],
          }));
        }
      }
    }

    // Se storage estiver vazio, verifica se há viagens reais finalizadas no histórico deste usuário
    const historicoEngine = getHistoricoViagens(
      uid || phone ? { userId: uid, phone } : undefined
    );
    if (Array.isArray(historicoEngine) && historicoEngine.length > 0) {
      const validas = historicoEngine
        .filter(
          (c) =>
            c &&
            c.destino &&
            c.id &&
            !c.id.startsWith("mock-") &&
            c.destinoCoords &&
            typeof c.destinoCoords.lng === "number" &&
            typeof c.destinoCoords.lat === "number"
        )
        .slice(0, 2);
      if (validas.length > 0) {
        return validas.map((c) => ({
          id: `ride-${c.id}`,
          titulo: c.destino.split(",")[0]?.trim() || c.destino,
          endereco: c.destino,
          coords: [c.destinoCoords!.lng, c.destinoCoords!.lat] as [number, number],
        }));
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "PARTIU — Corridas Expressas de Carro e Moto" },
      {
        name: "description",
        content:
          "Solicite carros e motos para transporte urbano com tarifa transparente e agilidade em sua cidade.",
      },
    ],
  }),
  component: PartiuPassengerHomeRoot,
});

function PartiuPassengerHomeRoot() {
  return (
    <PassengerRideProvider>
      <PartiuPassengerHomeContent />
    </PassengerRideProvider>
  );
}

function PartiuPassengerHomeContent() {
  const {
    state,
    categoriaVeiculo,
    origem,
    origemCoords,
    destino,
    destinoCoords,
    driverCoords,
    activeRide,
    startSearch,
    startEditingPickup,
    proceedToConfirmPickup,
    selectDestination,
    selectDestinationOnMap,
    smartPickups,
    selectStrategicPickup,
    updatePickupLocationFromMap,
    updateDestinationLocationFromMap,
    userAccuracyMeters,
    forcarCentralizarUsuario,
  } = usePassengerRide();

  const { corPrimaria, corSecundaria } = useBrandTheme();
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;
  const appName = branding?.appName || DEFAULT_APP_CONFIG.branding.appName;

  const [drawerAberto, setDrawerAberto] = useState(false);
  const [modalPushAberto, setModalPushAberto] = useState(false);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>("default");

  // Identificação do passageiro para autenticação e notificações em tempo real
  const activeUser = typeof window !== "undefined"
    ? (supabaseAuthService?.getCurrentUser?.() || supabaseAuthService?.getStoredSession?.() || null)
    : null;
  const passengerId = activeUser?.id || (typeof window !== "undefined" ? localStorage.getItem("partiu_user_id") || "passageiro_default" : "passageiro_default");

  const [userName, setUserName] = useState(() => {
    if (activeUser?.name && activeUser.name !== "Passageiro") return activeUser.name;
    if (typeof window === "undefined") return "Passageiro";
    const local = localStorage.getItem("partiu_user_nome");
    if (local && local !== "Passageiro") return local;
    return activeUser?.name || local || "Passageiro";
  });
  const [userAvatar, setUserAvatar] = useState<string | null>(() => {
    return (
      activeUser?.avatarUrl ||
      (typeof window !== "undefined" ? localStorage.getItem("partiu_user_avatar") : null) ||
      null
    );
  });
  const mapHandleRef = useRef<PartiuRideMapHandle | null>(null);
  const handleRecenterMap = useCallback(() => {
    hapticFeedback.light();
    forcarCentralizarUsuario();
    void mapHandleRef.current?.recenter();
  }, [forcarCentralizarUsuario]);

  const [unreadCount, setUnreadCount] = useState(0);

  // Escuta em tempo real a tabela notifications para o passageiro
  useEffect(() => {
    if (!passengerId) return;
    const unsub = pushNotificationService.subscribeToUserNotifications(
      passengerId,
      (list) => {
        const unread = list.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    );

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      void pushNotificationService.requestPermission(passengerId, "PASSENGER");
    }

    return () => {
      unsub();
    };
  }, [passengerId]);

  // Callbacks memorizados para garantir Pure Rendering e zero re-renders nas camadas filhas
  const handleOpenDrawer = useCallback(() => setDrawerAberto(true), []);
  const handleCloseDrawer = useCallback(() => {
    setDrawerAberto(false);
    const salvoAvatar = localStorage.getItem("partiu_user_avatar");
    if (salvoAvatar) setUserAvatar(salvoAvatar);
    const salvoNome = localStorage.getItem("partiu_user_nome");
    if (salvoNome) setUserName(salvoNome);
  }, []);
  const handleOpenNotifications = useCallback(() => setModalPushAberto(true), []);
  const handleCloseNotifications = useCallback(() => {
    setModalPushAberto(false);
    setPushStatus(getStatusPermissaoPush());
  }, []);
  const handleSelectAddressItem = useCallback(
    (item: RecentAddressItem) => {
      registrarDestinoFrequente(item.titulo, item.endereco, item.coords, passengerId);
      selectDestination(item.endereco, item.coords);
    },
    [selectDestination, passengerId]
  );

  // Histórico de destinos recentes do passageiro (100% autêntico, isolado por usuário)
  const [recentAddresses, setRecentAddresses] = useState<RecentAddressItem[]>(() =>
    carregarDestinosRecentesPassageiro(passengerId, activeUser?.phone)
  );

  // Reatividade em tempo real: zera ao deslogar ou ao alternar de usuário
  useEffect(() => {
    const handleHistoryCleared = () => {
      setRecentAddresses([]);
    };
    const handleUserChanged = () => {
      const session =
        supabaseAuthService?.getCurrentUser?.() ||
        supabaseAuthService?.getStoredSession?.() ||
        null;
      const uid = session?.id || (typeof window !== "undefined" ? localStorage.getItem("partiu_user_id") || undefined : undefined);
      const phone = session?.phone || (typeof window !== "undefined" ? localStorage.getItem("partiu_user_phone") || undefined : undefined);
      setRecentAddresses(carregarDestinosRecentesPassageiro(uid, phone));
    };

    window.addEventListener("partiu:history-cleared", handleHistoryCleared);
    window.addEventListener("partiu:user-profile-updated", handleUserChanged);
    return () => {
      window.removeEventListener("partiu:history-cleared", handleHistoryCleared);
      window.removeEventListener("partiu:user-profile-updated", handleUserChanged);
    };
  }, []);

  useEffect(() => {
    setRecentAddresses(carregarDestinosRecentesPassageiro(passengerId, activeUser?.phone));
  }, [passengerId, activeUser?.phone]);

  // Banners Ativos do Ecossistema (Zero dados falsos - Consome estritamente o serviço)
  const [activeBanners, setActiveBanners] = useState<PromoBannerItem[]>(() => {
    const fromService = bannerService.getActiveBanners("PASSENGER");
    if (fromService.length > 0) {
      return fromService.map((b, idx) => ({
        id: b.id,
        badge: b.badge || "DESTAQUE",
        titulo: b.title,
        subtitulo: b.subtitle || "",
        imagemUrl: b.image_url,
        acaoUrl: b.link_url,
        corGradiente:
          idx % 2 === 0
            ? "from-primary via-primary/90 to-primary/80 text-primary-foreground"
            : "from-secondary via-secondary/90 to-secondary text-secondary-foreground",
        tagCor: idx % 2 === 0 ? "bg-white/20 text-white backdrop-blur-md" : "bg-primary text-primary-foreground",
      }));
    }
    return [];
  });
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Hook desacoplado de UX Motion para interpolação de scroll (0 a 28px no raio da onda)
  const { scrollRef, waveRadius, isScrolled, onScroll } = useScrollInterpolation({
    maxRadius: 28,
    threshold: 80,
  });

  useEffect(() => {
    setPushStatus(getStatusPermissaoPush());
    const salvo = localStorage.getItem("partiu_user_nome");
    if (salvo) setUserName(salvo);
    const salvoAvatar = localStorage.getItem("partiu_user_avatar");
    if (salvoAvatar) setUserAvatar(salvoAvatar);

    // Carregar perfil ativo sincronizado com Supabase / UserService
    void (async () => {
      try {
        const perfil = await userService.getCurrentUserProfile();
        if (perfil) {
          if (perfil.name) {
            setUserName(perfil.name);
            try { localStorage.setItem("partiu_user_nome", perfil.name); } catch {}
          }
          if (perfil.avatarUrl) {
            setUserAvatar(perfil.avatarUrl);
            try { localStorage.setItem("partiu_user_avatar", perfil.avatarUrl); } catch {}
          }
        }
      } catch {}
    })();

    const sincronizarStorage = () => {
      try {
        const salvoNome = localStorage.getItem("partiu_user_nome");
        if (salvoNome) setUserName(salvoNome);
        const salvoAv = localStorage.getItem("partiu_user_avatar");
        if (salvoAv) setUserAvatar(salvoAv);

        const uid = localStorage.getItem("partiu_user_id") || undefined;
        const phone = localStorage.getItem("partiu_user_phone") || undefined;
        setRecentAddresses(carregarDestinosRecentesPassageiro(uid, phone));
      } catch {
        // ignore
      }
    };

    const handleProfileUpdate = (e: any) => {
      try {
        if (e.detail?.name) setUserName(e.detail.name);
        if (e.detail?.avatarUrl) setUserAvatar(e.detail.avatarUrl);
      } catch {}
    };
    window.addEventListener("storage", sincronizarStorage);
    window.addEventListener("partiu:user-profile-updated", handleProfileUpdate);

    // Inscrição reativa para alterações de banners no Admin
    const handleBannersUpdate = (allBanners?: any[]) => {
      const all = allBanners || bannerService.getAllBanners();
      const passengerBanners = all.filter((b) => b.is_active && (b.category === "PASSENGER" || b.category === "ALL"));
      if (passengerBanners.length > 0) {
        setActiveBanners(
          passengerBanners.map((b, idx) => ({
            id: b.id,
            badge: b.badge || "DESTAQUE",
            titulo: b.title,
            subtitulo: b.subtitle || "",
            imagemUrl: b.image_url,
            acaoUrl: b.link_url,
            corGradiente:
              idx % 2 === 0
                ? "from-slate-950 via-slate-900 to-slate-900 text-white"
                : "from-slate-900 via-slate-800 to-slate-950 text-white",
            tagCor: "bg-white/20 text-white backdrop-blur-md border border-white/20",
          }))
        );
      } else {
        setActiveBanners([]);
      }
    };

    const unsubBanner = bannerService.subscribe(handleBannersUpdate);
    const onCustomBannerEvent = (e: any) => handleBannersUpdate(e.detail);
    window.addEventListener("partiu:banners-updated", onCustomBannerEvent);

    return () => {
      window.removeEventListener("storage", sincronizarStorage);
      window.removeEventListener("partiu:user-profile-updated", handleProfileUpdate);
      window.removeEventListener("partiu:banners-updated", onCustomBannerEvent);
      unsubBanner();
    };
  }, []);

  const pushAtivo = pushStatus === "granted";

  // Referência e medição dinâmica de altura do Sheet ativo para Camera Padding Forense
  const [activeSheetHeight, setActiveSheetHeight] = useState<number>(0);
  const sheetObserverRef = useRef<ResizeObserver | null>(null);

  const sheetContainerCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (sheetObserverRef.current) {
      sheetObserverRef.current.disconnect();
      sheetObserverRef.current = null;
    }
    if (node) {
      setActiveSheetHeight(node.offsetHeight);
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const h = Math.round(entry.contentRect.height);
            if (h > 0) setActiveSheetHeight(h);
          }
        });
        ro.observe(node);
        sheetObserverRef.current = ro;
      }
    }
  }, []);

  // Medição da gaveta inferior no estado IDLE para garantir o Half-Map (~48% superior livre)
  const [idlePanelHeight, setIdlePanelHeight] = useState<number>(0);
  const idlePanelObserverRef = useRef<ResizeObserver | null>(null);

  const idlePanelCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (idlePanelObserverRef.current) {
      idlePanelObserverRef.current.disconnect();
      idlePanelObserverRef.current = null;
    }
    if (node) {
      setIdlePanelHeight(node.offsetHeight);
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const h = Math.round(entry.contentRect.height);
            if (h > 0) setIdlePanelHeight(h);
          }
        });
        ro.observe(node);
        idlePanelObserverRef.current = ro;
      }
    }
  }, []);

  // Referência de GPS para Deadband Inteligente e Throttle Anti-Render-Storm
  const lastGpsUpdateRef = useRef<{ coords: [number, number]; timestamp: number } | null>(null);

  const handleUserLocationChange = useCallback(
    (coords: [number, number]) => {
      if (state !== "IDLE") return;

      const now = Date.now();
      const last = lastGpsUpdateRef.current;

      if (last) {
        const deltaLng = Math.abs(last.coords[0] - coords[0]);
        const deltaLat = Math.abs(last.coords[1] - coords[1]);
        const timeDelta = now - last.timestamp;

        // Deadband de ~8 metros (~0.00008 graus) e throttle temporal de 2500ms
        if (deltaLng < 0.00008 && deltaLat < 0.00008 && timeDelta < 2500) {
          return;
        }
      }

      lastGpsUpdateRef.current = { coords, timestamp: now };
      updatePickupLocationFromMap(coords, undefined, false);
    },
    [state, updatePickupLocationFromMap]
  );

  // Mapeamento de estado para o mapa
  const isSearching =
    state === "FINDING_DRIVER" ||
    state === "REQUESTED" ||
    state === "SEARCHING_R1" ||
    state === "SEARCHING_R2" ||
    state === "SEARCHING_R3";

  const mapStatus =
    isSearching
      ? "PROCURANDO"
      : state === "DRIVER_ASSIGNED" ||
        state === "DRIVER_ARRIVING" ||
        (state as string) === "ACCEPTED" ||
        (state as string) === "DRIVER_EN_ROUTE" ||
        (state as string) === "DRIVER_ARRIVED"
      ? "A_CAMINHO"
      : state === "ON_TRIP" || state === "IN_PROGRESS"
      ? "EM_VIAGEM"
      : state === "COMPLETED"
      ? "CONCLUIDA"
      : state === "CONFIRMING_PICKUP"
      ? "CONFIRMING_PICKUP"
      : state === "CONFIRMING_DESTINATION_MAP"
      ? "CONFIRMING_DESTINATION_MAP"
      : state === "REVIEWING_ROUTE"
      ? "REVIEWING_ROUTE"
      : state === "SELECTING_DESTINATION"
      ? "SELECTING_DESTINATION"
      : state === "EDITING_PICKUP"
      ? "EDITING_PICKUP"
      : state === "SEARCHING_DESTINATION"
      ? "SEARCHING_DESTINATION"
      : "IDLE";

  const dynamicCameraPadding = useMemo(() => {
    if (typeof window === "undefined") return undefined;

    const vh = window.innerHeight;
    const safeSheetH = activeSheetHeight > 0 ? activeSheetHeight : Math.round(vh * 0.52);

    if (isSearching) {
      return {
        top: Math.round(vh * 0.06),
        bottom: Math.max(320, safeSheetH + 24),
        left: 24,
        right: 24,
      };
    }

    if (mapStatus === "REVIEWING_ROUTE") {
      return {
        top: Math.max(70, Math.round(vh * 0.10)),
        bottom: Math.max(380, safeSheetH + 28),
        left: 48,
        right: 48,
      };
    }

    if (mapStatus === "A_CAMINHO") {
      return {
        top: 80,
        bottom: Math.max(360, safeSheetH + 24),
        left: 64,
        right: 64,
      };
    }

    if (mapStatus === "EM_VIAGEM") {
      return {
        top: 80,
        bottom: Math.max(300, safeSheetH + 20),
        left: 48,
        right: 48,
      };
    }

    if (mapStatus === "IDLE") {
      const bottomPadding = idlePanelHeight > 0 ? idlePanelHeight + 16 : 240;
      return {
        top: 80,
        bottom: bottomPadding,
        left: 32,
        right: 32,
      };
    }

    return undefined;
  }, [isSearching, mapStatus, activeSheetHeight, idlePanelHeight]);

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-background text-foreground overflow-hidden font-sans select-none flex flex-col">
      {/* BANNER DE RESILIÊNCIA DE REDE */}
      <NetworkReconnectionBanner />
      <GpsPermissionModal />
      <FloatingRidePill />

      {/* ========================================================================= */}
      {/* SEÇÃO DO MAPA: TELA CHEIA EM TODOS OS ESTADOS (FUNDO TOTALMENTE VISÍVEL)  */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-auto">
        <PartiuRideMap
          ref={mapHandleRef}
          status={mapStatus}
          modalidade={categoriaVeiculo === "MOTO" ? "MOTO" : "POP"}
          origemEndereco={origem}
          origemCoords={origemCoords}
          destinoEndereco={destino || undefined}
          destinoCoords={
            state !== "IDLE" &&
            state !== "SEARCHING_DESTINATION" &&
            state !== "SELECTING_DESTINATION" &&
            state !== "EDITING_PICKUP" &&
            (Boolean(destino) || state === "CONFIRMING_DESTINATION_MAP")
              ? destinoCoords
              : undefined
          }
          motorista={activeRide?.motorista || undefined}
          driverCoords={driverCoords}
          strategicPickups={smartPickups}
          onSelectStrategicPickup={selectStrategicPickup}
          onMapCenterChange={
            state === "CONFIRMING_DESTINATION_MAP"
              ? updateDestinationLocationFromMap
              : (coords) => updatePickupLocationFromMap(coords, undefined, true)
          }
          onUserLocationChange={handleUserLocationChange}
          hideRecenter={state === "IDLE"}
          userAccuracyMeters={userAccuracyMeters}
          cameraPadding={dynamicCameraPadding}
          primaryRouteColor={corSecundaria || corPrimaria}
        />
      </div>

      {state === "IDLE" ? (
        <>
          {/* ========================================================================= */}
          {/* CABEÇALHO FLUTUANTE SOBRE O TOPO DO MAPA COM FOTO DO PASSAGEIRO         */}
          {/* ========================================================================= */}
          <AnimatedWaveHeader
            userName={userName}
            avatarUrl={userAvatar || undefined}
            onOpenDrawer={handleOpenDrawer}
            onOpenNotifications={handleOpenNotifications}
            hasUnreadNotifications={unreadCount > 0}
            unreadCount={unreadCount}
            waveRadius={waveRadius}
            isScrolled={isScrolled}
          />

          {/* ========================================================================= */}
          {/* PAINEL INFERIOR FLUTUANTE SOBRE O MAPA (HALF-MAP COMFORT ZONE)           */}
          {/* ========================================================================= */}
          <div
            ref={idlePanelCallbackRef}
            className="absolute inset-x-0 bottom-0 z-20 pointer-events-none flex flex-col justify-end w-full max-w-lg mx-auto px-3 sm:px-4 pb-[max(0.4rem,env(safe-area-inset-bottom))] space-y-1.5 sm:space-y-2 select-none"
          >
            {/* BOTÃO RECENTRALIZAR GPS: Flutuando com precisão alinhado à direita logo acima do DestinationCard */}
            <div className="w-full flex justify-end pointer-events-auto pr-1 -mb-1">
              <button
                type="button"
                onClick={handleRecenterMap}
                className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-md text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-black/5"
                title="Centralizar no meu local exato"
                aria-label="Centralizar no meu local exato"
              >
                <LocateFixed className="w-5.5 h-5.5 text-blue-600" />
              </button>
            </div>

            {/* BLOCO 1 (DESTINO): Card flutuante "Para onde vamos?" + Histórico + Seleção no Mapa */}
            <div className="w-full pointer-events-auto">
              <DestinationCard
                onSearchClick={startSearch}
                onAdjustPinOnMap={selectDestinationOnMap}
                onEditPickupClick={startEditingPickup}
                onSelectAddress={handleSelectAddressItem}
                currentAddress={origem}
                userAccuracyMeters={userAccuracyMeters}
                recentAddresses={recentAddresses}
              />
            </div>

            {/* BLOCO 2 (BANNERS): Carrossel Promocional Condicional com Opção de Fechar para Liberar 65%+ do Mapa */}
            {activeBanners && activeBanners.length > 0 && !bannerDismissed && (
              <div className="w-full overflow-hidden pointer-events-auto transition-all relative group">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback.light();
                    setBannerDismissed(true);
                  }}
                  className="absolute top-1.5 right-3 z-20 min-h-[40px] min-w-[40px] p-2 flex items-center justify-center cursor-pointer text-slate-400 hover:text-white"
                  title="Ocultar promoções e liberar visão do mapa"
                  aria-label="Ocultar promoções"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-900/75 text-white flex items-center justify-center text-xs shadow-xs backdrop-blur-xs">
                    ✕
                  </span>
                </button>
                <PromoCarousel
                  banners={activeBanners}
                  autoPlayIntervalMs={7000}
                />
              </div>
            )}

            {/* RODAPÉ: Barra de Navegação Flutuante Sem Fundo Preto */}
            <div className="w-full pointer-events-auto">
              <HomeBottomNav activeTab="corridas" disableSafeAreaBottom />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* BARRA SUPERIOR CONTEXTUAL                                                 */}
          {/* ========================================================================= */}
          <div className="absolute top-0 inset-x-0 z-30 pointer-events-auto flex items-center justify-between px-4 pt-[max(0.75rem,calc(env(safe-area-inset-top,0px)+8px))] pb-2 select-none">
            <div className="flex items-center gap-2">
              <div
                style={{ borderRadius: ui.borderRadius }}
                className="px-3 py-1.5 bg-card/95 backdrop-blur-md shadow-md border border-border flex items-center gap-2"
              >
                <PartiuLogo variant="icon" size="sm" />
                <span className="text-xs font-bold text-foreground">{appName}</span>
              </div>
            </div>
          </div>

          {/* PAINÉIS FLUTUANTES DA MÁQUINA DE ESTADOS DA CORRIDA QUANDO NÃO IDLE */}
          <main
            data-hide-bottom-nav="true"
            className="absolute inset-x-0 bottom-0 z-40 pointer-events-none flex flex-col justify-end w-full max-w-lg mx-auto pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all"
            style={{ zIndex: 40 }}
          >
            <div ref={sheetContainerCallbackRef} className="w-full pointer-events-auto">
              {/* B. BUSCA DE DESTINO (BOTTOM SHEET COM AUTOCOMPLETE E RECENTES) */}
              {(state === "SEARCHING_DESTINATION" ||
                state === "SELECTING_DESTINATION" ||
                state === "EDITING_PICKUP") && <PassengerSearchDestinationSheet />}

              {/* C. REVISÃO DE ROTA (SELETOR EXCLUSIVO PARTIU MOTO / PARTIU CARRO + PIX/DINHEIRO) */}
              {state === "REVIEWING_ROUTE" && <PassengerReviewRouteSheet />}

              {/* D1. AJUSTE FINO DO PINO CENTRAL DE EMBARQUE OU DESTINO */}
              {state === "CONFIRMING_PICKUP" && <PassengerConfirmPickupPin />}
              {state === "CONFIRMING_DESTINATION_MAP" && <PassengerConfirmDestinationPin />}

              {/* D2. RADAR DE BUSCA PROGRESSIVO EM ONDAS (R1 2km -> R2 4km -> R3 6km) */}
              {(state === "FINDING_DRIVER" ||
                state === "REQUESTED" ||
                state === "SEARCHING_R1" ||
                state === "SEARCHING_R2" ||
                state === "SEARCHING_R3") && <PassengerFindingDriverRadar />}

              {/* D3. TIMEOUT DE BUSCA SEM MOTORISTAS DISPONÍVEIS */}
              {(state === "TIMEOUT" || (state as string) === "SEARCH_TIMEOUT") && <PassengerTimeoutBottomSheet />}

              {/* E. CORRIDA EM ANDAMENTO */}
              {(state === "DRIVER_ASSIGNED" ||
                state === "DRIVER_ARRIVING" ||
                state === "DRIVER_EN_ROUTE" ||
                state === "DRIVER_ARRIVED" ||
                state === "ACCEPTED" ||
                state === "ON_TRIP" ||
                state === "IN_PROGRESS" ||
                state === "COMPLETED") && (
                <DriverEnRouteSheet />
              )}
            </div>
          </main>
        </>
      )}

      {/* CENTRAL DE NOTIFICAÇÕES (TEMPO REAL + PUSH + BADGE) */}
      {modalPushAberto && (
        <NotificationCenterModal
          isOpen={modalPushAberto}
          onClose={handleCloseNotifications}
          userId={passengerId}
          userRole="PASSENGER"
        />
      )}

      {/* GAVETA LATERAL DE NAVEGAÇÃO (LAZY LOADED SOB DEMANDA) */}
      {drawerAberto && (
        <Suspense fallback={null}>
          <AppDrawer open={drawerAberto} onClose={handleCloseDrawer} />
        </Suspense>
      )}
    </div>
  );
}
