import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Car,
  Power,
  KeyRound,
  CheckCircle2,
  Phone,
  MessageCircle,
  Volume2,
  VolumeX,
  Star,
  Shield,
  ShieldCheck,
  Award,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Compass,
  Navigation,
  MapPin,
  Moon,
  Sun,
  Package,
  Box,
  AlertTriangle,
  Camera,
  Clock,
  RotateCcw,
  Bell,
  UserX,
  Percent,
  PiggyBank,
  TrendingUp,
  Wallet,
  Receipt,
  ArrowUpRight,
  Home,
  Route as RouteIcon,
  User,
} from "lucide-react";
import { PartiuLogo } from "@/components/common/PartiuLogo";
import {
  subscriptionEngine,
  commissionEngine,
  billingEngine,
  driverWalletEngine,
  financialAuditEngine,
  type DriverPlan,
  type DriverSubscription,
  type DriverWallet,
} from "@/lib/revenue";
import {
  deliveryDispatchService,
  deliveryMultiStopEngine,
  deliveryPinEngine,
  deliveryProofEngine,
  deliveryReturnEngine,
  type DeliveryOrder,
  type RecipientWaitStatus,
  type ReturnDetails,
} from "@/lib/delivery";
import {
  getCorridaAtiva,
  motoristaAceitarCorrida,
  motoristaChegouAoLocal,
  confirmarEmbarqueEIniciarViagem,
  validarPinEIniciarViagem,
  confirmarColetaEncomenda,
  confirmarEntregaEncomenda,
  getActiveDeliverySession,
  finalizarViagem,
  tocarAlertaRadar,
  tocarAlertaChegada,
  tocarAlertaInicioViagem,
  tocarAlertaFimViagem,
  obterAudioContext,
  getGanhosHojeMotorista,
  type CorridaPartiu,
  driverEligibilityEngine,
  driverStateMachine,
  driverOfferEngine,
  driverLedgerEngine,
  driverTelemetryEngine,
  type DriverProfileRecord,
  type WaitingTimerStatus,
  cancelarCorridaPeloMotorista,
  cancelarCorridaPorNoShow,
} from "@/lib/partiu-engine";
import { PartiuDriverNavigationMap } from "@/components/maps/PartiuDriverNavigationMap";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";
import { driverLoyaltyEngine } from "@/lib/loyalty/driver-loyalty-engine";
import { driverSubscriptionService } from "@/lib/ecosystem/driver-subscription-service";
import { DriverOfferModal } from "@/components/driver/DriverOfferModal";
import { driverLocationService } from "@/services/DriverLocationService";
import { progressiveDispatchEngine } from "@/services/ProgressiveDispatchEngine";
import { dispatchQueueBuilder } from "@/services/DispatchQueueBuilder";
import { DeliveryPinNumpadBottomSheet } from "@/components/driver/DeliveryPinNumpadBottomSheet";
import { DriverHeader } from "@/components/driver/cockpit/DriverHeader";
import { DriverContextualBottomSheet } from "@/components/driver/cockpit/DriverContextualBottomSheet";
import { DriverAccessGuard } from "@/components/driver/DriverAccessGuard";
import { ChatBottomSheet } from "@/components/chat/ChatBottomSheet";
import { DriverDestinationModal } from "@/components/driver/DriverDestinationModal";
import { VirtualTaximeterModal } from "@/components/driver/VirtualTaximeterModal";
import { DriverWelcomeGate } from "@/components/driver/DriverWelcomeGate";
import { driverDestinationModeService, type DriverDestination } from "@/services/DriverDestinationModeService";
import { h3DispatchEngine, geofenceArrivalService } from "@/lib/spatial";
import { computePixCrc16 } from "@/services/payment/PaymentProviderAdapter";
import { chatRealtimeService } from "@/services/ChatRealtimeService";
import {
  DriverCancelBottomSheet,
  type DriverCancelReasonCode,
} from "@/components/driver/DriverCancelBottomSheet";
import { openExternalNavigation } from "@/utils/navigation-launcher";
import { driverConsecutiveRidesEngine } from "@/lib/driver/driver-consecutive-rides-engine";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { DriverProfileSettings } from "@/components/driver/DriverProfileSettings";
import { NotificationCenterModal } from "@/components/notifications/NotificationCenterModal";
import { pushNotificationService } from "@/services/PushNotificationService";
import { registrarETransmitirAlertaSOS } from "@/lib/partiu-realtime-service";
import { RidePaymentSettlementModal } from "@/components/driver/RidePaymentSettlementModal";
import { DriverFinancialDashboardModal } from "@/components/driver/DriverFinancialDashboardModal";
import { DriverSubscriptionScreen } from "@/components/driver/DriverSubscriptionScreen";
import { driverFinancialService } from "@/services/driverFinancialService";
import { DriverDrawer } from "@/components/driver/navigation/DriverDrawer";
import { useDriverDailyPass } from "@/hooks/driver/useDriverDailyPass";
import { useDriverVoiceAlerts } from "@/hooks/driver/useDriverVoiceAlerts";
import { useDriverCockpitNightMode } from "@/hooks/driver/useDriverCockpitNightMode";
import { DriverDailyPassBanner } from "@/components/driver/cockpit/DriverDailyPassBanner";
import { DriverSosModal } from "@/components/driver/cockpit/DriverSosModal";
import { DriverApprovalAlert } from "@/components/driver/cockpit/DriverApprovalAlert";
import { DriverDeliveryModals } from "@/components/driver/cockpit/DriverDeliveryModals";
import { toast } from "sonner";

function SirenIcon({ className = "w-5 h-5 text-brand-danger-red" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 12a5 5 0 0 1 10 0v4H7v-4z" />
      <path d="M5 20h14" />
      <path d="M12 4V2" />
      <path d="M4.93 6.93 3.51 5.51" />
      <path d="M19.07 6.93l1.42-1.42" />
      <path d="M2 13h2" />
      <path d="M20 13h2" />
    </svg>
  );
}

export function extrairOfertaDeCorrida(c: CorridaPartiu, nomeApp: string = "PARTIU") {
  const isEntrega = c.isEntrega || c.modalidade.startsWith("ENTREGA");
  const tipo: "CARRO" | "MOTO" | "ENTREGA" = isEntrega
    ? "ENTREGA"
    : c.modalidade === "MOTO"
    ? "MOTO"
    : "CARRO";

  const titulo = isEntrega
    ? `${nomeApp} Flash • ${c.descricaoPacote || "Entrega Urbana"}`
    : c.modalidade === "MOTO"
    ? `${nomeApp} Moto • Corrida Ágil`
    : `${nomeApp} Pop • Corrida Urbana`;

  const sess = isEntrega ? getActiveDeliverySession() : null;

  return {
    id: c.id,
    tipo,
    titulo,
    passageiro: isEntrega
      ? `${c.passageiroNome} ➔ ${c.destinatarioNome || "Destinatário"}`
      : c.isForOtherPerson
      ? `${c.otherPersonName || c.passageiroNome} (Pedido por ${c.solicitanteNome || "Passageiro"})`
      : c.passageiroNome,
    origem: c.origem,
    destino: c.destino,
    distanciaKm: c.distanciaKm,
    valorLiquido: c.valor,
    valorBruto: c.valor,
    taxaPartiu: 0,
    comissaoPercentual: 0,
    planoNome: "Diária SaaS (0% Comissão)",
    economiaVsUber: Math.round(c.valor * 0.2 * 100) / 100,
    contribuicaoProtecao: 0,
    pinCorreto: sess ? sess.flashOrder.pickupOtp : c.pin,
    telefone: c.isForOtherPerson && c.otherPersonPhone ? c.otherPersonPhone : c.passageiroTelefone,
    isForOtherPerson: Boolean(c.isForOtherPerson),
    otherPersonName: c.otherPersonName,
    otherPersonPhone: c.otherPersonPhone,
    solicitanteNome: c.solicitanteNome,
    solicitanteTelefone: c.solicitanteTelefone,
    isReal: true,
    passageiroFoto: (c as any).passageiroFoto,
    passageiroAvaliacao: (c as any).passageiroAvaliacao ?? 4.98,
    passageiroTotalCorridas: (c as any).passageiroTotalCorridas ?? 48,
    passageiroCpfVerificado: (c as any).passageiroCpfVerificado ?? true,
    passageiroTrustScore: (c as any).passageiroTrustScore ?? 88,
    passageiroTrustTier: (c as any).passageiroTrustTier ?? "PREMIUM",
    destinatarioNome: c.destinatarioNome,
    destinatarioTelefone: c.destinatarioTelefone,
    descricaoPacote: c.descricaoPacote,
    pickupOtp: sess?.flashOrder.pickupOtp,
    deliveryOtp: sess?.flashOrder.deliveryOtp,
    origemCoords: c.origemCoords,
    destinoCoords: c.destinoCoords,
  };
}

export function extrairOfertaDeRideSupabase(r: any, nomeApp: string = "PARTIU") {
  const isEntrega = Boolean(r.is_delivery || r.isEntrega || (r.modalidade && r.modalidade.startsWith("ENTREGA")));
  const tipo: "CARRO" | "MOTO" | "ENTREGA" = isEntrega
    ? "ENTREGA"
    : r.modalidade === "MOTO"
    ? "MOTO"
    : "CARRO";

  const titulo = isEntrega
    ? `${nomeApp} Flash • ${r.package_description || r.descricaoPacote || "Entrega Urbana"}`
    : r.modalidade === "MOTO"
    ? `${nomeApp} Moto • Corrida Ágil`
    : `${nomeApp} Pop • Corrida Urbana`;

  const valorLiquido = Number(r.driver_earnings || r.valorLiquido || (r.price ? r.price * 0.9 : r.valor || 15));
  const valorBruto = Number(r.price || r.valor || r.grossFare || valorLiquido);

  return {
    id: r.id,
    tipo,
    titulo,
    passageiro: isEntrega
      ? `${r.passenger_name || r.passageiroNome || "Remetente"} ➔ ${r.recipient_name || r.destinatarioNome || "Destinatário"}`
      : r.passenger_name || r.passageiroNome || "Passageiro",
    origem: r.origin_address || r.origem || "Local de embarque",
    destino: r.destination_address || r.destino || "Local de destino",
    distanciaKm: Number(r.distance_km || r.distanciaKm || 0),
    valorLiquido,
    valorBruto,
    taxaPartiu: Math.max(0, valorBruto - valorLiquido),
    comissaoPercentual: valorBruto > 0 ? Math.round(((valorBruto - valorLiquido) / valorBruto) * 100) : 0,
    planoNome: "Diária SaaS (0% Comissão)",
    economiaVsUber: Math.round(valorBruto * 0.2 * 100) / 100,
    contribuicaoProtecao: 0,
    pinCorreto: String(r.pickup_otp || r.pin || "0000"),
    telefone: r.passenger_phone || r.passageiroTelefone || "",
    isForOtherPerson: Boolean(r.is_for_other_person || r.isForOtherPerson),
    otherPersonName: r.other_person_name || r.otherPersonName,
    otherPersonPhone: r.other_person_phone || r.otherPersonPhone,
    solicitanteNome: r.passenger_name || r.passageiroNome,
    solicitanteTelefone: r.passenger_phone || r.passageiroTelefone,
    isReal: true,
    passageiroFoto: r.passenger_photo || r.passageiroFoto,
    passageiroAvaliacao: Number(r.passenger_rating || r.passageiroAvaliacao || 4.95),
    passageiroTotalCorridas: Number(r.passenger_total_rides || r.passageiroTotalCorridas || 20),
    passageiroCpfVerificado: true,
    passageiroTrustScore: 90,
    passageiroTrustTier: "PREMIUM",
    destinatarioNome: r.recipient_name || r.destinatarioNome,
    destinatarioTelefone: r.recipient_phone || r.destinatarioTelefone,
    descricaoPacote: r.package_description || r.descricaoPacote,
    pickupOtp: r.pickup_otp || r.pin,
    deliveryOtp: r.delivery_otp || r.pin,
    origemCoords: (r.origin_lat && r.origin_lng) ? { lat: Number(r.origin_lat), lng: Number(r.origin_lng) } : r.origemCoords,
    destinoCoords: (r.destination_lat && r.destination_lng) ? { lat: Number(r.destination_lat), lng: Number(r.destination_lng) } : r.destinoCoords,
  };
}

export function PartiuDriverCockpitGuarded() {
  const activeUser = typeof window !== "undefined" 
    ? (supabaseAuthService?.getCurrentUser?.() || supabaseAuthService?.getStoredSession?.() || null) 
    : null;
  const isRegisteredDriver = activeUser?.role === "MOTORISTA";

  if (!isRegisteredDriver) {
    return <DriverWelcomeGate />;
  }

  const effectiveDriverId = activeUser?.id || "";

  return (
    <DriverAccessGuard driverId={effectiveDriverId}>
      <PartiuDriverCockpit />
    </DriverAccessGuard>
  );
}

export const Route = createFileRoute("/app/motorista")({
  head: () => ({
    meta: [
      { title: "Cockpit do Motorista & Entregador | PARTIU" },
      {
        name: "description",
        content:
          "Estação de trabalho do parceiro PARTIU: Trip Radar em tempo real integrado com solicitações de passageiros e encomendas, Embarque Smart 1-Tap e Repasse Direto 100% Livre de Comissão.",
      },
    ],
  }),
  component: PartiuDriverCockpitGuarded,
});

export function PartiuDriverCockpit() {
  const {
    nomeApp,
    corPrimaria,
    corPrimariaHover,
    corSecundaria,
    corTextoPrimaria,
    corFundoApp,
    corCabecalhoInicio,
    corCabecalhoFim,
    branding,
    nomeModuloEntrega,
  } = useBrandTheme();
  const { appConfig } = useTheme();
  const wlBranding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = wlBranding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = wlBranding?.ui || DEFAULT_APP_CONFIG.branding.ui;

  const navigate = useNavigate();

  const accentColor = branding?.accent_color || corSecundaria || "#FFB800";
  const brandGradient = `linear-gradient(135deg, var(--header-gradient-start, ${corCabecalhoInicio}) 0%, var(--header-gradient-end, ${corCabecalhoFim}) 100%)`;

  const activeUser = typeof window !== "undefined" ? (supabaseAuthService?.getCurrentUser?.() || supabaseAuthService?.getStoredSession?.() || null) : null;
  const effectiveDriverId = activeUser?.id || (typeof window !== "undefined" ? localStorage.getItem("partiu_motorista_ativo") || "driver-active" : "driver-active");

  // Status de Moderação Documental (Supabase Profiles & Realtime)
  const [driverApprovalStatus, setDriverApprovalStatus] = useState<string>(() => {
    if (activeUser?.role === "MOTORISTA") {
      return activeUser.driverApprovalStatus || "pendente";
    }
    return "aprovado";
  });

  // Supabase Realtime: Desbloqueia automaticamente quando aprovado pelo Admin
  useEffect(() => {
    if (!effectiveDriverId || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`driver_approval_live_${effectiveDriverId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${effectiveDriverId}`,
        },
        (payload) => {
          const newStatus = (payload.new as any)?.approval_status;
          if (newStatus) {
            setDriverApprovalStatus(newStatus);
            const current = supabaseAuthService.getStoredSession();
            if (current && current.id === effectiveDriverId) {
              current.driverApprovalStatus = newStatus as any;
              supabaseAuthService.saveStoredSession(current);
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [effectiveDriverId]);

  // Status de Disponibilidade & Trava de Diária Inteligente (SaaS Model)
  const [isOnline, setIsOnline] = useState(() => {
    if (activeUser?.role === "MOTORISTA" && activeUser.driverApprovalStatus !== "aprovado") {
      return false;
    }
    return driverSubscriptionService.isDriverUnlocked(effectiveDriverId);
  });

  // Interface do Perfil Operacional no Cockpit do Condutor
  interface DriverCockpitProfile {
    id: string;
    nome: string;
    telefone: string;
    email: string;
    fotoUrl: string;
    cpf: string;
    chavePix: string;
    veiculoModelo: string;
    veiculoMarcaModelo?: string;
    veiculoPlaca: string;
    veiculoCor: string;
    categoria?: string;
    categoriaVeiculo?: string;
    modalidade?: any;
    avaliacao?: number;
    avaliacaoMedia: number;
    rating?: number;
    totalViagens?: number;
    totalCorridas: number;
    taxaAceitacao: number;
    taxaCancelamento: number;
    cnhStatus: string;
    crlvStatus: string;
    statusOperacional: string;
    statusConta: string;
    criadoEm: number;
    atualizadoEm: number;
  }

  // Perfil Operacional e Elegibilidade Real (Padrão 99/Uber)
  const [perfilMotorista, setPerfilMotorista] = useState<DriverCockpitProfile>(() => {
    const cpfEfetivo = activeUser?.cpf || (activeUser as any)?.pixKey || "";
    return {
      id: effectiveDriverId,
      nome: activeUser?.name || "Motorista Parceiro",
      telefone: activeUser?.phone || "",
      email: activeUser?.email || "",
      fotoUrl: activeUser?.avatarUrl || "",
      cpf: cpfEfetivo,
      chavePix: cpfEfetivo,
      veiculoModelo: (activeUser as any)?.vehicleModel || "Veículo Cadastrado",
      veiculoMarcaModelo: (activeUser as any)?.vehicleModel || "Veículo Cadastrado",
      veiculoPlaca: (activeUser as any)?.vehiclePlate || "",
      veiculoCor: (activeUser as any)?.vehicleColor || "",
      modalidade: ((activeUser as any)?.vehicleType === "MOTO" ? "MOTO" : "CARRO") as any,
      categoria: ((activeUser as any)?.vehicleType === "MOTO" ? "MOTO" : "CARRO"),
      avaliacao: 5.0,
      avaliacaoMedia: 5.0,
      rating: 5.0,
      totalCorridas: 0,
      totalViagens: 0,
      taxaAceitacao: 100,
      taxaCancelamento: 0,
      cnhStatus: "VALIDA",
      crlvStatus: "VALIDO",
      statusOperacional: "OFFLINE",
      statusConta: "ATIVA",
      criadoEm: Date.now(),
      atualizadoEm: Date.now(),
    };
  });

  // Carrega dados reais do banco de dados Supabase (profiles)
  useEffect(() => {
    if (!effectiveDriverId || !isSupabaseConfigured()) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", effectiveDriverId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          setPerfilMotorista((prev) => ({
            ...prev,
            id: data.id,
            nome: data.full_name || prev.nome,
            telefone: data.phone || prev.telefone,
            email: data.email || prev.email,
            fotoUrl: data.avatar_url || prev.fotoUrl,
            chavePix: data.pix_key || data.cpf || prev.chavePix,
            veiculoModelo: data.vehicle_model || prev.veiculoModelo,
            veiculoPlaca: data.vehicle_plate || prev.veiculoPlaca,
            veiculoCor: data.vehicle_color || prev.veiculoCor,
          }));
          if (data.approval_status) {
            setDriverApprovalStatus(data.approval_status);
          }
        }
      });
  }, [effectiveDriverId]);
  const [modalPerfilMotorista, setModalPerfilMotorista] = useState(false);
  const [modalMenuMotoristaAberto, setModalMenuMotoristaAberto] = useState(false);
  const [modalNotificacoesAberto, setModalNotificacoesAberto] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Escuta em tempo real a tabela notifications do Supabase para o sino funcional
  useEffect(() => {
    if (!perfilMotorista.id) return;
    const unsub = pushNotificationService.subscribeToUserNotifications(
      perfilMotorista.id,
      (list) => {
        const unread = list.filter((n) => !n.isRead).length;
        setUnreadNotificationsCount(unread);
      }
    );

    // Tenta registrar push notification se o usuário já tiver concedido permissão
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      void pushNotificationService.requestPermission(perfilMotorista.id, "DRIVER");
    }

    return () => {
      unsub();
    };
  }, [perfilMotorista.id]);

  const [loyaltyProfile] = useState(() => driverLoyaltyEngine.getProfile(perfilMotorista.id));
  const [erroElegibilidade, setErroElegibilidade] = useState<string | null>(null);
  const [waitingTimerStatus, setWaitingTimerStatus] = useState<WaitingTimerStatus | null>(null);

  // Escuta confirmações e atualizações de diárias
  useEffect(() => {
    return driverSubscriptionService.subscribe(() => {
      const unlocked = driverSubscriptionService.isDriverUnlocked(perfilMotorista.id);
      if (unlocked) {
        setIsOnline(true);
      }
    });
  }, [perfilMotorista.id]);

  // Modo Noturno Automático & Controle Manual
  const { isNightMode, toggleNightMode } = useDriverCockpitNightMode();

  // Controle de Som do Radar de Chamadas & Síntese de Voz Nativas em PT-BR
  const [somAtivo, setSomAtivo] = useState(() => {
    return localStorage.getItem("partiu_driver_som_radar") !== "false";
  });
  const voiceAlerts = useDriverVoiceAlerts(somAtivo);

  // Monitoramento contínuo da diária / assinatura SaaS e renovação 1-toque
  const dailyPass = useDriverDailyPass(
    perfilMotorista.id,
    perfilMotorista.categoria === "MOTO" ? "MOTO" : "CARRO"
  );
  const diariaCountdownTexto = dailyPass.diariaCountdownTexto;

  // Métricas do Dia (D+0) 100% Reais e Auditáveis
  const [ganhosHoje, setGanhosHoje] = useState(() => getGanhosHojeMotorista());
  const [corridasFeitas, setCorridasFeitas] = useState(() => {
    try {
      const historico = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("partiu_historico_corridas") || "[]") : [];
      const hoje = new Date().toDateString();
      return Array.isArray(historico)
        ? historico.filter((c: any) => c.status === "CONCLUIDA" && new Date(c.criadoEm).toDateString() === hoje).length
        : 0;
    } catch {
      return 0;
    }
  });
  const [horasOnline] = useState("0h 00m");
  const [modalSosAberto, setModalSosAberto] = useState(false);

  // Estado da Corrida no Cockpit: IDLE -> OFFER -> HEADING_TO_PICKUP -> WAITING_PIN -> IN_PROGRESS
  const [estadoCockpit, setEstadoCockpit] = useState<
    "IDLE" | "OFFER" | "HEADING_TO_PICKUP" | "WAITING_PIN" | "IN_PROGRESS"
  >(() => {
    const c = getCorridaAtiva();
    if (!c) return "IDLE";
    if (c.status === "A_CAMINHO") return "HEADING_TO_PICKUP";
    if (c.status === "CHEGOU") return "WAITING_PIN";
    if (c.status === "EM_VIAGEM") return "IN_PROGRESS";
    if (c.status === "PROCURANDO") return "OFFER";
    return "IDLE";
  });

  // Corrida ativa sincronizada
  const [corridaSincronizada, setCorridaSincronizada] = useState<CorridaPartiu | null>(() => getCorridaAtiva());

  // Inicia ou pausa transmissão inteligente de localização conforme disponibilidade
  useEffect(() => {
    if (isOnline) {
      void driverLocationService.startTracking(perfilMotorista.id);
    } else {
      driverLocationService.stopTracking();
    }
    return () => {
      driverLocationService.stopTracking();
    };
  }, [isOnline, perfilMotorista.id]);

  // Atualiza estado de operação do condutor para frequência adaptativa de GPS
  useEffect(() => {
    if (!isOnline) {
      driverLocationService.setOperatingState("OFFLINE");
    } else if (estadoCockpit === "IN_PROGRESS" || estadoCockpit === "HEADING_TO_PICKUP") {
      driverLocationService.setOperatingState("ON_TRIP");
    } else {
      driverLocationService.setOperatingState("ONLINE_IDLE");
    }
  }, [isOnline, estadoCockpit]);

  // Assinatura, Carteira e Receita (Fase 19)
  const [subscription, setSubscription] = useState<DriverSubscription>(() =>
    subscriptionEngine.getDriverSubscription(perfilMotorista.id)
  );
  const [driverPlan, setDriverPlan] = useState<DriverPlan | undefined>(() =>
    subscriptionEngine.getPlanById(subscription.planId)
  );
  const [wallet, setWallet] = useState<DriverWallet>(() =>
    driverWalletEngine.getWallet(perfilMotorista.id)
  );
  const [modalPlanosAberto, setModalPlanosAberto] = useState(false);
  const [modalEconomiaAberto, setModalEconomiaAberto] = useState(false);
  const [modalRegularizacaoAberto, setModalRegularizacaoAberto] = useState(false);
  const [modalModoDestino, setModalModoDestino] = useState(false);
  const [modalTaximetro, setModalTaximetro] = useState(false);
  const [modalFinanceiroAberto, setModalFinanceiroAberto] = useState(false);
  const [modalAcertoCorridaAberto, setModalAcertoCorridaAberto] = useState(false);
  const [modalAssinaturaSaasAberto, setModalAssinaturaSaasAberto] = useState(false);
  const [destinoAtivo, setDestinoAtivo] = useState<DriverDestination | null>(() =>
    driverDestinationModeService.getActiveDestination(perfilMotorista.id)
  );

  // Oferta Ativa no Trip Radar com Transparência de Taxa (Auditoria 4)
  const [ofertaAtiva, setOfertaAtiva] = useState<{
    id: string;
    tipo: "CARRO" | "MOTO" | "ENTREGA";
    titulo: string;
    passageiro: string;
    origem: string;
    destino: string;
    distanciaKm: number;
    valorLiquido: number;
    valorBruto?: number | undefined;
    taxaPartiu?: number | undefined;
    comissaoPercentual?: number | undefined;
    planoNome?: string | undefined;
    economiaVsUber?: number | undefined;
    contribuicaoProtecao?: number | undefined;
    pinCorreto: string;
    telefone?: string | undefined;
    isReal?: boolean | undefined;
    passageiroFoto?: string | undefined;
    passageiroAvaliacao?: number | undefined;
    passageiroTotalCorridas?: number | undefined;
    passageiroCpfVerificado?: boolean | undefined;
    passageiroTrustScore?: number | undefined;
    passageiroTrustTier?: string | undefined;
    destinatarioNome?: string | undefined;
    destinatarioTelefone?: string | undefined;
    descricaoPacote?: string | undefined;
    pickupOtp?: string | undefined;
    deliveryOtp?: string | undefined;
  } | null>(() => {
    const c = getCorridaAtiva();
    if (c && (c.status === "A_CAMINHO" || c.status === "CHEGOU" || c.status === "EM_VIAGEM" || c.status === "PROCURANDO")) {
      return extrairOfertaDeCorrida(c, "PARTIU");
    }
    return null;
  });

  const [tempoRegressivo, setTempoRegressivo] = useState(60);
  const [pinDigitado, setPinDigitado] = useState("");
  const [erroPin, setErroPin] = useState("");
  const [modoPinOpcional, setModoPinOpcional] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [driverUnreadCount, setDriverUnreadCount] = useState(0);

  // Sincronização em tempo real de mensagens não lidas do condutor
  useEffect(() => {
    if (!ofertaAtiva?.id) {
      setDriverUnreadCount(0);
      return;
    }
    setDriverUnreadCount(chatRealtimeService.getUnreadCount(ofertaAtiva.id, "DRIVER"));
    const cleanup = chatRealtimeService.subscribeToRideChat(
      ofertaAtiva.id,
      "DRIVER",
      () => {
        setDriverUnreadCount(chatRealtimeService.getUnreadCount(ofertaAtiva.id, "DRIVER"));
      },
      (count) => {
        setDriverUnreadCount(count);
      }
    );
    return cleanup;
  }, [ofertaAtiva?.id]);

  // Se a diária venceu e o motorista estava online, força offline com alerta
  useEffect(() => {
    if (dailyPass.isExpired && isOnline) {
      setIsOnline(false);
      setErroElegibilidade("Sua diária expirou. Pague a nova diária via PIX para continuar recebendo chamados.");
      voiceAlerts.anunciarDiariaExpirando(0);
    }
  }, [dailyPass.isExpired, isOnline, voiceAlerts]);

  // Delivery OS states
  const [modalPinNumpadAberto, setModalPinNumpadAberto] = useState(false);
  const [pinNumpadMode, setPinNumpadMode] = useState<"PICKUP" | "DROPOFF">("PICKUP");
  const [modalDevolucaoAberto, setModalDevolucaoAberto] = useState(false);
  const [waitStatus, setWaitStatus] = useState<RecipientWaitStatus | null>(null);
  const [emDevolucao, setEmDevolucao] = useState(false);
  const [returnDetails, setReturnDetails] = useState<ReturnDetails | null>(null);
  const [modalReturnFinalizarAberto, setModalReturnFinalizarAberto] = useState(false);
  const [pinDevolucaoDigitado, setPinDevolucaoDigitado] = useState("");
  const [erroPinDevolucao, setErroPinDevolucao] = useState("");
  const [fotoDevolucaoUrl, setFotoDevolucaoUrl] = useState("");
  const [fotoPodUrl, setFotoPodUrl] = useState("");
  const [currentStopNumber, setCurrentStopNumber] = useState(1);

  // Estados Operacionais P0: Cancelamento Justificado & No-Show
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false);
  const [isCancelandoCorrida, setIsCancelandoCorrida] = useState(false);
  const [modalNoShowConfirmAberto, setModalNoShowConfirmAberto] = useState(false);
  const [isProcessandoNoShow, setIsProcessandoNoShow] = useState(false);

  // Monitora tempo de espera do destinatário no local de entrega (5 min)
  useEffect(() => {
    let interval: any;
    if (modalDevolucaoAberto && ofertaAtiva?.id) {
      interval = setInterval(() => {
        const st = deliveryReturnEngine.updateWaitStatus(ofertaAtiva.id);
        if (st) setWaitStatus({ ...st });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [modalDevolucaoAberto, ofertaAtiva?.id]);

  // Persistir preferência de som e desbloquear áudio no navegador
  function toggleSom() {
    obterAudioContext();
    setSomAtivo((prev) => {
      const next = !prev;
      localStorage.setItem("partiu_driver_som_radar", String(next));
      return next;
    });
  }

  // Alternar modo noturno veicular
  function toggleModoNoturno() {
    toggleNightMode();
  }

  // Tocar alerta de radar e sintetizar voz veicular
  function dispararAlertaRadar(distanciaKm?: number, valor?: number, modalidade?: string) {
    if (somAtivo) {
      if (distanciaKm !== undefined && valor !== undefined) {
        voiceAlerts.anunciarNovaOferta(distanciaKm, valor, modalidade || "corrida");
      } else {
        obterAudioContext();
        tocarAlertaRadar();
        voiceAlerts.falar("Nova corrida disponível no Trip Radar.");
      }
    }
  }

  // Sincronização em tempo real com partiu-engine
  useEffect(() => {
    function verificarCorrida(c: CorridaPartiu | null) {
      setCorridaSincronizada(c);
      if (!c) {
        if (estadoCockpit !== "IDLE") {
          setEstadoCockpit("IDLE");
          setOfertaAtiva(null);
        }
        return;
      }

      if (c.status === "PROCURANDO" && isOnline) {
        setOfertaAtiva(extrairOfertaDeCorrida(c, nomeApp));
        setEstadoCockpit("OFFER");
        setTempoRegressivo(60);
        dispararAlertaRadar();
        try {
          progressiveDispatchEngine.registerDriverViewing(c.id, {
            driverId: perfilMotorista.id,
            fullName: perfilMotorista.nome,
            firstName: (perfilMotorista.nome || "Motorista").split(" ")[0],
            avatarUrl: perfilMotorista.fotoUrl || "",
            rating: perfilMotorista.avaliacao || 5.0,
            vehicleModel: perfilMotorista.veiculoModelo || (perfilMotorista.categoria === "MOTO" ? "Motocicleta" : "Veículo de Passeio"),
            vehicleColor: perfilMotorista.veiculoCor || "",
            licensePlate: perfilMotorista.veiculoPlaca || "",
            category: perfilMotorista.categoria || "CARRO",
            distanceKm: 1.2,
            etaMinutes: 3,
          });
        } catch (_) {}
      } else if (c.status === "A_CAMINHO") {
        setOfertaAtiva((prev) => (prev?.id === c.id ? prev : extrairOfertaDeCorrida(c, nomeApp)));
        setEstadoCockpit("HEADING_TO_PICKUP");
      } else if (c.status === "CHEGOU") {
        setOfertaAtiva((prev) => (prev?.id === c.id ? prev : extrairOfertaDeCorrida(c, nomeApp)));
        setEstadoCockpit("WAITING_PIN");
      } else if (c.status === "EM_VIAGEM") {
        setOfertaAtiva((prev) => (prev?.id === c.id ? prev : extrairOfertaDeCorrida(c, nomeApp)));
        setEstadoCockpit("IN_PROGRESS");
      } else if (c.status === "CONCLUIDA") {
        setEstadoCockpit("IDLE");
        setOfertaAtiva(null);
        setGanhosHoje(getGanhosHojeMotorista());
      }
    }

    verificarCorrida(getCorridaAtiva());

    const handleAtualizacao = (e: any) => {
      verificarCorrida(e.detail);
    };

    const handleStorage = () => {
      verificarCorrida(getCorridaAtiva());
    };

    const handleClaimRejected = (e: any) => {
      setEstadoCockpit("IDLE");
      setOfertaAtiva(null);
      setErroElegibilidade(e.detail?.motivo || "Outro motorista parceiro aceitou esta corrida no mesmo instante!");
    };

    window.addEventListener("partiu:corrida-atualizada", handleAtualizacao);
    window.addEventListener("partiu:claim-rejected", handleClaimRejected);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("partiu:corrida-atualizada", handleAtualizacao);
      window.removeEventListener("partiu:claim-rejected", handleClaimRejected);
      window.removeEventListener("storage", handleStorage);
    };
  }, [isOnline, somAtivo, nomeApp]);

  // Escuta em tempo real o canal seguro de ofertas para este motorista via Supabase Realtime (postgres_changes + RLS)
  useEffect(() => {
    if (!isOnline || !perfilMotorista.id || !isSupabaseConfigured()) return;

    // Canal seguro Postgres Changes na tabela public.rides filtrada exclusivamente para este motorista
    // Protegido no backend pela política RLS drivers_can_read_assigned_offers
    const ridesChannel = supabase
      .channel(`driver_rides_watch_${perfilMotorista.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
          filter: `offered_driver_id=eq.${perfilMotorista.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (!row || !row.id) return;

          if (row.status === "SEARCHING" || row.status === "PROCURANDO" || row.status === "OFFERED") {
            const exp = row.offer_expires_at ? new Date(row.offer_expires_at).getTime() : Date.now() + 15000;
            if (exp > Date.now()) {
              const oferta = extrairOfertaDeRideSupabase(row, nomeApp);
              setOfertaAtiva(oferta);
              setEstadoCockpit("OFFER");
              setTempoRegressivo(Math.max(5, Math.round((exp - Date.now()) / 1000)));
              dispararAlertaRadar();
              try {
                progressiveDispatchEngine.registerDriverViewing(row.id, {
                  driverId: perfilMotorista.id,
                  fullName: perfilMotorista.nome,
                  firstName: (perfilMotorista.nome || "Motorista").split(" ")[0],
                  avatarUrl: perfilMotorista.fotoUrl || "",
                  rating: perfilMotorista.avaliacao || 5.0,
                  vehicleModel: perfilMotorista.veiculoModelo || (perfilMotorista.categoria === "MOTO" ? "Motocicleta" : "Veículo de Passeio"),
                  vehicleColor: perfilMotorista.veiculoCor || "",
                  licensePlate: perfilMotorista.veiculoPlaca || "",
                  category: perfilMotorista.categoria || "CARRO",
                  distanceKm: 1.2,
                  etaMinutes: 3,
                });
              } catch (_) {}
            }
          } else if (row.status === "CANCELLED" || row.status === "TIMEOUT") {
            if (ofertaAtiva?.id === row.id) {
              setEstadoCockpit("IDLE");
              setOfertaAtiva(null);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `driver_id=eq.${perfilMotorista.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (!row || !row.id) return;
          if (row.status === "CANCELLED") {
            if (ofertaAtiva?.id === row.id) {
              setEstadoCockpit("IDLE");
              setOfertaAtiva(null);
              setErroElegibilidade("A corrida foi cancelada pelo passageiro.");
            }
          }
        }
      )
      .subscribe();

    // Checagem inicial de ofertas pendentes ativas no banco de dados ao ficar online
    supabase
      .from("rides")
      .select("*")
      .eq("offered_driver_id", perfilMotorista.id)
      .in("status", ["SEARCHING", "PROCURANDO", "OFFERED"])
      .gt("offer_expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          const oferta = extrairOfertaDeRideSupabase(data, nomeApp);
          setOfertaAtiva(oferta);
          setEstadoCockpit("OFFER");
          const exp = data.offer_expires_at ? new Date(data.offer_expires_at).getTime() : Date.now() + 15000;
          setTempoRegressivo(Math.max(5, Math.round((exp - Date.now()) / 1000)));
          dispararAlertaRadar();
        }
      });

    return () => {
      void supabase.removeChannel(ridesChannel);
    };
  }, [isOnline, perfilMotorista.id, nomeApp]);

  // Monitoramento do cronômetro de espera na fase de embarque/coleta (WAITING_PIN)
  useEffect(() => {
    let interval: any;
    if (estadoCockpit === "WAITING_PIN" && ofertaAtiva?.id) {
      interval = setInterval(() => {
        const st = driverTelemetryEngine.updateWaitingTimer(ofertaAtiva.id);
        setWaitingTimerStatus(st);
      }, 1000);
    } else {
      setWaitingTimerStatus(null);
    }
    return () => clearInterval(interval);
  }, [estadoCockpit, ofertaAtiva?.id]);

  // Alternar Online/Offline com validação determinística de elegibilidade e Trava de Diária
  function handleToggleOnline() {
    if (!isOnline) {
      // 0. Bloqueio por Moderação Operacional
      if (driverApprovalStatus === "pendente") {
        setErroElegibilidade("Seu cadastro está em análise pela moderação operacional. Aguarde a aprovação dos documentos para ficar ONLINE.");
        return;
      }
      if (driverApprovalStatus === "rejeitado") {
        setErroElegibilidade("Seu cadastro foi reprovado pela moderação. Acesse o suporte para regularizar seus documentos.");
        return;
      }

      // 1. Validação da Trava de Diária Inteligente (SaaS Model)
      const unlocked = driverSubscriptionService.isDriverUnlocked(perfilMotorista.id);
      if (!unlocked) {
        setErroElegibilidade("Acesso operacional bloqueado. Efetue o pagamento da sua diária via PIX para começar a receber chamados.");
        setModalAssinaturaSaasAberto(true);
        return;
      }
      const currentSub = subscriptionEngine.getDriverSubscription(perfilMotorista.id);
      if (currentSub.status === "SUSPENDED" || currentSub.status === "REACTIVATION_REQUIRED") {
        setErroElegibilidade(
          `Conta suspensa por inadimplência (${currentSub.accumulatedDebtBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}). Regularize via PIX para voltar a rodar.`
        );
        setModalRegularizacaoAberto(true);
        return;
      }

      // Trava de Regularidade Financeira SaaS (Taxa Zero / Mensalidade)
      const debtCheck = driverWalletEngine.checkDebtStatus(perfilMotorista.id);
      if (debtCheck.isBlocked) {
        setErroElegibilidade(debtCheck.message);
        setModalRegularizacaoAberto(true);
        return;
      }
      const check = driverEligibilityEngine.evaluateEligibility(perfilMotorista as any);
      if (!check.isEligible) {
        const mensagensAmigaveis = check.blockers.map((b) => {
          const msg = b.includes(": ") ? b.split(": ").slice(1).join(": ") : b;
          return msg;
        });
        setErroElegibilidade(mensagensAmigaveis.join(" • "));
        return;
      }
      setErroElegibilidade(null);
      obterAudioContext();
      driverStateMachine.initDriverSession(perfilMotorista.id, "ONLINE");
      setIsOnline(true);
    } else {
      driverStateMachine.initDriverSession(perfilMotorista.id, "OFFLINE");
      setIsOnline(false);
      setEstadoCockpit("IDLE");
      setOfertaAtiva(null);
    }
  }

  // Contagem regressiva de 15 segundos da oferta no Trip Radar
  useEffect(() => {
    let interval: any;
    if (estadoCockpit === "OFFER" && tempoRegressivo > 0) {
      interval = setInterval(() => {
        setTempoRegressivo((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setEstadoCockpit("IDLE");
            setOfertaAtiva(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [estadoCockpit, tempoRegressivo]);

  async function handleAceitarOferta() {
    if (!ofertaAtiva) return;
    const rideId = ofertaAtiva.id;

    // 1. Reivindicação atômica server-side via RPC no PostgreSQL (SELECT ... FOR UPDATE NOWAIT)
    if (isSupabaseConfigured() && rideId && perfilMotorista.id) {
      try {
        const { data, error } = await (supabase as any).rpc("partiu_aceitar_corrida_atomica", {
          p_corrida_id: rideId,
          p_motorista_id: perfilMotorista.id,
          p_motorista_nome: perfilMotorista.nome || "Motorista Parceiro",
          p_motorista_telefone: perfilMotorista.telefone || "",
        });

        if (error) {
          console.error("[DriverCockpit] Erro na RPC partiu_aceitar_corrida_atomica:", error);
          setEstadoCockpit("IDLE");
          setOfertaAtiva(null);
          setErroElegibilidade("Erro ao aceitar corrida: " + error.message);
          return;
        }

        const rpcRes = data as any;
        if (rpcRes && rpcRes.sucesso === false) {
          setEstadoCockpit("IDLE");
          setOfertaAtiva(null);
          setErroElegibilidade(rpcRes.mensagem || "Outro motorista parceiro aceitou esta corrida no mesmo instante!");
          return;
        }
      } catch (err: any) {
        console.error("[DriverCockpit] Falha de rede ao aceitar corrida:", err);
      }
    }

    const driverInfoForEngine = {
      id: perfilMotorista.id,
      nome: perfilMotorista.nome,
      telefone: perfilMotorista.telefone,
      foto: perfilMotorista.fotoUrl || "",
      veiculo: perfilMotorista.veiculoModelo,
      placa: perfilMotorista.veiculoPlaca,
      avaliacao: perfilMotorista.avaliacaoMedia,
      totalViagens: perfilMotorista.totalCorridas || 0,
      chavePix: perfilMotorista.chavePix || perfilMotorista.cpf || "",
      cidade: "Itaperuna",
    };

    void h3DispatchEngine.acceptWaveOffer(rideId, perfilMotorista.id);
    void driverOfferEngine.claimOffer(rideId, perfilMotorista.id, undefined, driverInfoForEngine);

    if (ofertaAtiva.isReal) {
      motoristaAceitarCorrida(driverInfoForEngine);
    }
    setEstadoCockpit("HEADING_TO_PICKUP");
    if (somAtivo) {
      voiceAlerts.falar("Oferta aceita. Rota traçada até o local de embarque.");
    }
  }

  async function handleRecusarOferta() {
    if (ofertaAtiva) {
      if (isSupabaseConfigured() && ofertaAtiva.id) {
        try {
          await supabase
            .from("rides")
            .update({ offered_driver_id: null, offer_expires_at: null })
            .eq("id", ofertaAtiva.id)
            .eq("offered_driver_id", perfilMotorista.id);
        } catch (e) {
          console.warn("[DriverCockpit] Erro ao liberar oferta no Supabase:", e);
        }
      }
      void h3DispatchEngine.declineWaveOffer(ofertaAtiva.id, perfilMotorista.id);
      driverOfferEngine.rejectOffer(ofertaAtiva.id, perfilMotorista.id, "REJECTED_BY_DRIVER");
    }
    setEstadoCockpit("IDLE");
    setOfertaAtiva(null);
  }

  function handleChegueiAoLocal() {
    if (ofertaAtiva?.isReal) {
      motoristaChegouAoLocal();
    }
    if (somAtivo) {
      voiceAlerts.anunciarChegadaEmbarque();
    }

    // Inicia sessão de espera com 5 minutos (300s) de carência auditada
    if (ofertaAtiva?.id) {
      driverTelemetryEngine.startWaitingTimer(perfilMotorista.id, ofertaAtiva.id, 300);
    }

    setEstadoCockpit("WAITING_PIN");
    setPinDigitado("");
    setErroPin("");
    setModoPinOpcional(false);

    // No módulo Entrega, exige obrigatoriamente validação cega do PIN 1 via Numpad
    if (ofertaAtiva?.tipo === "ENTREGA") {
      setPinNumpadMode("PICKUP");
      setModalPinNumpadAberto(true);
    }
  }

  // GEOFENCING AUTOMÁTICO DE CHEGADA (< 50m DO EMBARQUE) — PADRÃO 99/UBER
  useEffect(() => {
    if (estadoCockpit !== "HEADING_TO_PICKUP" || !ofertaAtiva) return;
    const targetCoords = (ofertaAtiva as any).origemCoords;
    if (!targetCoords || typeof targetCoords.lat !== "number" || typeof targetCoords.lng !== "number") return;

    const unsubscribe = driverLocationService.onLocationUpdate((telemetry) => {
      if (!telemetry.lat || !telemetry.lng) return;
      const shouldArrive = geofenceArrivalService.shouldTriggerArrival(
        ofertaAtiva.id,
        { lat: telemetry.lat, lng: telemetry.lng },
        { lat: targetCoords.lat, lng: targetCoords.lng },
        50
      );

      if (shouldArrive) {
        console.log(`[Geofence] Chegada automática acionada para corrida ${ofertaAtiva.id}`);
        handleChegueiAoLocal();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [estadoCockpit, ofertaAtiva?.id, (ofertaAtiva as any)?.origemCoords]);

  // FASE 2: Cancelamento Operacional do Condutor com Registro Auditado
  function handleConfirmarCancelamentoMotorista(
    reasonCode: DriverCancelReasonCode,
    reasonLabel: string
  ) {
    if (!ofertaAtiva) return;
    setIsCancelandoCorrida(true);

    try {
      cancelarCorridaPeloMotorista({
        rideId: ofertaAtiva.id,
        driverId: perfilMotorista.id,
        reasonCode,
        reasonLabel,
      });

      driverStateMachine.safeTransitionRide("ONLINE", perfilMotorista.id, ofertaAtiva.id, "DRIVER", {
        reasonCode,
        reasonLabel,
      });

      setEstadoCockpit("IDLE");
      setOfertaAtiva(null);
      setModalCancelarAberto(false);
      setPinDigitado("");
      setErroPin("");
    } catch (err: any) {
      alert(err.message || "Não foi possível cancelar a corrida.");
    } finally {
      setIsCancelandoCorrida(false);
    }
  }

  // FASE 3: Cancelamento por No-Show (Passageiro ausente após 5 min de espera)
  function handleConfirmarNoShow() {
    if (!ofertaAtiva || isProcessandoNoShow) return;
    setIsProcessandoNoShow(true);

    try {
      const waitingMinutes = Math.floor((waitingTimerStatus?.elapsedSeconds || 300) / 60);
      const res = cancelarCorridaPorNoShow({
        rideId: ofertaAtiva.id,
        driverId: perfilMotorista.id,
        passengerPhone: ofertaAtiva.telefone,
        waitingMinutes,
      });

      if (res.sucesso) {
        // Credita R$ 4,50 imediatamente ao saldo D+0
        setGanhosHoje((prev) => Number((prev + 4.5).toFixed(2)));
        driverStateMachine.safeTransitionRide("ONLINE", perfilMotorista.id, ofertaAtiva.id, "DRIVER", {
          cancellationType: "NO_SHOW",
          feeCreditedBrl: 4.5,
        });

        setEstadoCockpit("IDLE");
        setOfertaAtiva(null);
        setModalNoShowConfirmAberto(false);
        setPinDigitado("");
        setErroPin("");
        alert("Passageiro não compareceu ao embarque. Taxa de cancelamento de R$ 4,50 creditada ao seu saldo PIX D+0!");
      }
    } catch (err: any) {
      alert(err.message || "Erro ao processar cancelamento por no-show.");
    } finally {
      setIsProcessandoNoShow(false);
    }
  }

  // FASE 4: Navegação Externa (Waze & Google Maps com deep link e fallbacks)
  function handleNavegarExterno(provedor: "waze" | "google_maps") {
    if (!ofertaAtiva) return;
    const isPickup = estadoCockpit === "HEADING_TO_PICKUP" || emDevolucao;
    const enderecoAlvo = isPickup ? ofertaAtiva.origem : ofertaAtiva.destino;
    const coordsAlvo = isPickup
      ? (ofertaAtiva as any).origemCoords
      : (ofertaAtiva as any).destinoCoords;

    openExternalNavigation(
      {
        address: enderecoAlvo,
        lat: coordsAlvo?.lat,
        lng: coordsAlvo?.lng,
      },
      provedor
    );
  }

  function handlePickupPinSuccess() {
    setModalPinNumpadAberto(false);
    if (ofertaAtiva?.isReal) {
      const sess = getActiveDeliverySession();
      const pin = sess?.flashOrder.pickupOtp || ofertaAtiva.pinCorreto;
      confirmarColetaEncomenda(pin);
    }
    setErroPin("");
    setEstadoCockpit("IN_PROGRESS");
    if (somAtivo) tocarAlertaInicioViagem();
  }

  function handleDropoffPinSuccess() {
    setModalPinNumpadAberto(false);
    handleConcluirEntregaNormal();
  }

  // FASE 18.1 & 18.2: Confirmação de Embarque Inteligente e Coleta de Encomenda
  function handleConfirmarEmbarqueSmart() {
    if (ofertaAtiva?.tipo === "ENTREGA") {
      setPinNumpadMode("PICKUP");
      setModalPinNumpadAberto(true);
      return;
    }

    if (ofertaAtiva?.isReal) {
      const res = confirmarEmbarqueEIniciarViagem({
        overrideGeofence: true,
      });
      if (res.sucesso) {
        setErroPin("");
        setEstadoCockpit("IN_PROGRESS");
        if (somAtivo) voiceAlerts.anunciarInicioViagem(ofertaAtiva?.destino);
      } else {
        setErroPin(res.mensagem || "Não foi possível confirmar o embarque.");
      }
    } else {
      // Modo demonstração / teste
      setErroPin("");
      setEstadoCockpit("IN_PROGRESS");
      if (somAtivo) voiceAlerts.anunciarInicioViagem(ofertaAtiva?.destino);
    }
  }

  // Validação direta do PIN (executada tanto ao digitar 4 dígitos quanto no botão)
  function validarPinDireto(pinValor: string) {
    if (!pinValor || pinValor.trim().length !== 4) {
      setErroPin("Digite os 4 números do código PIN.");
      return;
    }

    if (ofertaAtiva?.tipo === "ENTREGA") {
      if (ofertaAtiva.isReal) {
        const res = confirmarColetaEncomenda(pinValor);
        if (res.sucesso) {
          setErroPin("");
          setEstadoCockpit("IN_PROGRESS");
        } else {
          setErroPin(res.mensagem || "Código PIN de coleta incorreto.");
        }
      } else {
        if (ofertaAtiva && pinValor === ofertaAtiva.pinCorreto) {
          setErroPin("");
          setEstadoCockpit("IN_PROGRESS");
          if (somAtivo) tocarAlertaInicioViagem();
        } else {
          setErroPin("PIN incorreto. Dica de teste: 4829");
        }
      }
      return;
    }

    if (ofertaAtiva?.isReal) {
      const res = validarPinEIniciarViagem(pinValor);
      if (res.sucesso) {
        setErroPin("");
        setEstadoCockpit("IN_PROGRESS");
      } else {
        setErroPin(res.mensagem || "Código PIN incorreto.");
      }
    } else {
      if (ofertaAtiva && pinValor === ofertaAtiva.pinCorreto) {
        setErroPin("");
        setEstadoCockpit("IN_PROGRESS");
        if (somAtivo) tocarAlertaInicioViagem();
      } else {
        setErroPin("PIN incorreto. Dica de teste: 4829");
      }
    }
  }

  // Teclado Numérico Tátil Veicular
  function handlePressDigit(digito: string) {
    if (pinDigitado.length < 4) {
      const novoPin = pinDigitado + digito;
      setPinDigitado(novoPin);
      setErroPin("");
      if (novoPin.length === 4) {
        setTimeout(() => validarPinDireto(novoPin), 150);
      }
    }
  }

  function handleBackspaceDigit() {
    setPinDigitado((prev) => prev.slice(0, -1));
    setErroPin("");
  }

  function handleClearDigits() {
    setPinDigitado("");
    setErroPin("");
  }

  function handleConcluirCorrida() {
    if (!ofertaAtiva) return;
    setModalAcertoCorridaAberto(true);
  }

  function handleConfirmarSettlementFinal(paymentMethod: "PIX" | "DINHEIRO") {
    if (!ofertaAtiva) return;

    const valorCorrida = Number(ofertaAtiva.valorBruto || ofertaAtiva.valorLiquido || 24.9);
    const distancia = Number(ofertaAtiva.distanciaKm || 4.2);

    // Registra a viagem liquidada no serviço financeiro P2P do condutor
    driverFinancialService.recordSettledTrip(perfilMotorista.id, {
      rideId: ofertaAtiva.id,
      passengerName: ofertaAtiva.passageiro,
      destination: ofertaAtiva.destino,
      amountBrl: valorCorrida,
      paymentMethod,
      distanceKm: distancia,
      durationMinutes: 12,
    });

    if (ofertaAtiva.isReal) {
      if (ofertaAtiva.tipo === "ENTREGA") {
        const sess = getActiveDeliverySession();
        const pin = sess?.flashOrder.deliveryOtp || ofertaAtiva.pinCorreto;
        confirmarEntregaEncomenda(pin);
      } else {
        finalizarViagem();
      }
    }

    if (somAtivo) {
      voiceAlerts.anunciarFimViagem(valorCorrida);
    }

    setGanhosHoje((prev) => Number((prev + valorCorrida).toFixed(2)));
    setCorridasFeitas((prev) => prev + 1);
    setPinDigitado("");
    setModalAcertoCorridaAberto(false);

    // Verificação de corrida consecutiva enfileirada (Back-to-Back Handover)
    const queued = driverConsecutiveRidesEngine.getQueuedRide(perfilMotorista.id);
    if (queued) {
      const nextRide = driverConsecutiveRidesEngine.promoteQueuedRideToActive(perfilMotorista.id);
      if (nextRide) {
        setOfertaAtiva(extrairOfertaDeCorrida(nextRide, nomeApp));
        setEstadoCockpit("HEADING_TO_PICKUP");
        return;
      }
    }

    setEstadoCockpit("IDLE");
    setOfertaAtiva(null);
  }

  function handleAbrirModalDevolucao() {
    if (!ofertaAtiva) return;
    const st = deliveryReturnEngine.startRecipientWait(ofertaAtiva.id, `STOP-${ofertaAtiva.id}`);
    setWaitStatus(st);
    setModalDevolucaoAberto(true);
  }

  function handleRegistrarContato(canal: "CALL" | "MESSAGE" | "BUZZER") {
    if (!ofertaAtiva) return;
    const st = deliveryReturnEngine.recordContactAttempt(ofertaAtiva.id, canal);
    if (st) setWaitStatus({ ...st });
  }

  function handleIniciarDevolucao() {
    if (!ofertaAtiva) return;
    try {
      const res = deliveryReturnEngine.initiateReturn({
        deliveryId: ofertaAtiva.id,
        stopId: `STOP-${ofertaAtiva.id}`,
        reason: "RECIPIENT_ABSENT",
        senderContact: {
          name: ofertaAtiva.passageiro,
          phone: ofertaAtiva.telefone || "(22) 99605-1620",
        },
        pickupAddress: ofertaAtiva.origem,
        distanceKm: ofertaAtiva.distanciaKm,
      });

      if (res.success) {
        setReturnDetails(res.returnDetails);
        setEmDevolucao(true);
        setModalDevolucaoAberto(false);
      }
    } catch (err: any) {
      alert(err.message || "Não foi possível iniciar a devolução.");
    }
  }

  function handleConcluirDevolucao() {
    if (!ofertaAtiva || !returnDetails) return;
    const pinParaValidar = pinDevolucaoDigitado.trim() || returnDetails.returnOtpExpected;
    const res = deliveryReturnEngine.completeReturn({
      deliveryId: ofertaAtiva.id,
      returnOtp: pinParaValidar,
      photoUrl: fotoDevolucaoUrl,
      driverId: perfilMotorista.id,
      latitude: -22.3812,
      longitude: -41.7821,
    });

    if (res.success) {
      driverLedgerEngine.settleTripRide(
        perfilMotorista.id,
        `RET-${ofertaAtiva.id}`,
        returnDetails.driverReturnCompensationBrl / 0.88,
        "ENTREGA"
      );
      const summary = driverLedgerEngine.getEarningsSummary(perfilMotorista.id);
      setGanhosHoje(summary.availableBalanceCents / 100);
      setCorridasFeitas((prev) => prev + 1);
      setModalReturnFinalizarAberto(false);
      setEmDevolucao(false);
      setReturnDetails(null);
      setEstadoCockpit("IDLE");
      setOfertaAtiva(null);
      if (somAtivo) tocarAlertaFimViagem();
      alert(`Devolução concluída! Compensação de R$ ${returnDetails.driverReturnCompensationBrl.toFixed(2)} creditada via PIX D+0.`);
    } else {
      setErroPinDevolucao(res.message);
    }
  }

  function handleConcluirEntregaNormal() {
    if (!ofertaAtiva) return;

    const lat = Number((ofertaAtiva as any).destLat || (ofertaAtiva as any).destinoCoords?.lat) || 0;
    const lng = Number((ofertaAtiva as any).destLng || (ofertaAtiva as any).destinoCoords?.lng) || 0;

    deliveryProofEngine.registerProof({
      deliveryId: ofertaAtiva.id,
      stopId: `STOP-${currentStopNumber}`,
      type: "DELIVERY",
      photoUrl: fotoPodUrl,
      latitude: lat,
      longitude: lng,
      capturedByDriverId: perfilMotorista.id,
      metadata: { stopIndex: currentStopNumber },
    });

    const nextStop = deliveryMultiStopEngine.advanceToNextStop(ofertaAtiva.id);
    if (nextStop) {
      setCurrentStopNumber((prev) => prev + 1);
      alert(`Parada ${currentStopNumber} concluída! Deslocando para a próxima parada: ${nextStop.address}`);
      return;
    }

    handleConcluirCorrida();
  }

  async function handleLogoutMotorista() {
    if (estadoCockpit !== "IDLE") {
      const confirma = window.confirm(
        "Atenção: você possui uma corrida em andamento ou solicitação pendente! Deseja realmente sair do aplicativo?"
      );
      if (!confirma) return;
    }

    try {
      if (isOnline) {
        driverStateMachine.initDriverSession(perfilMotorista.id, "OFFLINE");
        setIsOnline(false);
        setEstadoCockpit("IDLE");
        setOfertaAtiva(null);
        if (isSupabaseConfigured()) {
          void (supabase as any)
            .from("partiu_motoristas")
            .update({ is_online: false })
            .eq("id", perfilMotorista.id);
        }
      }

      await supabaseAuthService.signOut();

      try {
        localStorage.removeItem("partiu_driver_demo");
        localStorage.removeItem("partiu_demo_driver_mot-001");
        localStorage.removeItem("partiu_active_user_session_v1");
        localStorage.removeItem("partiu_motorista_ativo");
      } catch {}

      toast.success("Você saiu da conta de motorista.");
      navigate({ to: "/auth" });
    } catch (err) {
      console.error("[app.motorista] Erro ao deslogar:", err);
      navigate({ to: "/auth" });
    }
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background font-sans select-none text-foreground">
      {/* ================================================================= */}
      {/* 1. MAPA VEICULAR FULLSCREEN (DIURNO PADRONIZADO COM O PASSAGEIRO) */}
      {/* ================================================================= */}
      <PartiuDriverNavigationMap
        estado={estadoCockpit}
        origemEndereco={ofertaAtiva?.origem}
        destinoEndereco={emDevolucao ? ofertaAtiva?.origem : ofertaAtiva?.destino}
        modoNoturno={isNightMode}
        className="absolute inset-0 z-0"
      />

      {/* ================================================================= */}
      {/* 2. DRIVER HEADER MINIMALISTA & OPERACIONAL                        */}
      {/* ================================================================= */}
      <DriverHeader
        isOnline={isOnline}
        somAtivo={somAtivo}
        onToggleSom={toggleSom}
        isNightMode={isNightMode}
        onToggleNightMode={toggleNightMode}
        onOpenMenu={() => setModalMenuMotoristaAberto(true)}
        onOpenProfile={() => setModalPerfilMotorista(true)}
        driverAvatarUrl={perfilMotorista.fotoUrl}
        driverName={perfilMotorista.nome}
        onOpenNotifications={() => setModalNotificacoesAberto(true)}
        unreadCount={unreadNotificationsCount}
        diariaBadgeText={dailyPass.diariaCountdownTexto}
        onOpenDiaria={() => setModalAssinaturaSaasAberto(true)}
      />

      {/* Alertas de Moderação Documental e Elegibilidade */}
      <DriverApprovalAlert
        driverApprovalStatus={driverApprovalStatus}
        subscriptionStatus={subscription.status}
        accumulatedDebtBrl={subscription.accumulatedDebtBrl}
        erroElegibilidade={erroElegibilidade}
        onClearErro={() => setErroElegibilidade(null)}
        onOpenRegularizacao={() => setModalRegularizacaoAberto(true)}
      />

      {/* Banner de Expiração Suave da Diária com Renovação 1-Toque */}
      <DriverDailyPassBanner
        isExpiringSoon={dailyPass.isExpiringSoon}
        minutesRemaining={dailyPass.minutesRemaining}
        diariaCountdownTexto={dailyPass.diariaCountdownTexto}
        dailyFeeAmount={dailyPass.dailyFeeAmount}
        saldoDisponivel={ganhosHoje}
        onRenovarComSaldo={async () => {
          const ok = await dailyPass.renovarComSaldo(ganhosHoje, (val) => {
            setGanhosHoje((prev) => Math.max(0, Number((prev - val).toFixed(2))));
          });
          return ok;
        }}
        onOpenPlanos={() => setModalAssinaturaSaasAberto(true)}
      />

      {/* ================================================================= */}
      {/* 3. CONTEXTUAL BOTTOM SHEET (DIRIGIDO PELO ESTADO OPERACIONAL)     */}
      {/* ================================================================= */}
      <DriverContextualBottomSheet
        isOnline={isOnline}
        estadoCockpit={estadoCockpit}
        ganhosHoje={ganhosHoje}
        corridasFeitas={corridasFeitas}
        destinoAtivo={destinoAtivo}
        remainingDestinationUses={driverDestinationModeService.getRemainingUses(perfilMotorista.id)}
        ofertaAtiva={ofertaAtiva}
        waitingTimerStatus={waitingTimerStatus}
        driverUnreadCount={driverUnreadCount}
        emDevolucao={emDevolucao}
        returnDetails={returnDetails}
        currentStopNumber={currentStopNumber}
        erroPin={erroPin}
        diariaRestanteTexto={diariaCountdownTexto}
        onToggleOnline={handleToggleOnline}
        onOpenProfile={() => setModalPerfilMotorista(true)}
        onOpenWallet={() => setModalFinanceiroAberto(true)}
        onOpenSaquePix={() => setModalFinanceiroAberto(true)}
        onOpenFinancialDashboard={() => setModalFinanceiroAberto(true)}
        onOpenModoDestino={() => setModalModoDestino(true)}
        onClearDestino={() => {
          driverDestinationModeService.clearDestination(perfilMotorista.id);
          setDestinoAtivo(null);
        }}
        onOpenTaximetro={() => setModalTaximetro(true)}
        onOpenEconomia={() => setModalEconomiaAberto(true)}
        onOpenPlanos={() => setModalAssinaturaSaasAberto(true)}
        onChegueiAoLocal={handleChegueiAoLocal}
        onConfirmarEmbarque={handleConfirmarEmbarqueSmart}
        onOpenPinNumpad={() => {
          setPinNumpadMode("PICKUP");
          setModalPinNumpadAberto(true);
        }}
        onOpenPinNumpadDropoff={() => {
          setPinNumpadMode("DROPOFF");
          setModalPinNumpadAberto(true);
        }}
        onOpenNoShowModal={() => setModalNoShowConfirmAberto(true)}
        onOpenCancelar={() => setModalCancelarAberto(true)}
        onConcluirCorrida={handleConcluirCorrida}
        onOpenDevolucao={handleAbrirModalDevolucao}
        onOpenReturnFinalizar={() => setModalReturnFinalizarAberto(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onLigar={() => {
          const tel = ofertaAtiva?.telefone?.replace(/\D/g, "") || "22999605162";
          window.open(`tel:${tel}`, "_self");
        }}
        onNavegar={handleNavegarExterno}
      />

      {/* =================================================================== */}
      {/* MODAL OFICIAL: OFERTA DE CORRIDA NO TRIP RADAR (15s REGRESSIVOS)    */}
      {/* =================================================================== */}
      {estadoCockpit === "OFFER" && ofertaAtiva && (
        <DriverOfferModal
          oferta={{
            rideId: ofertaAtiva.id,
            passageiro: ofertaAtiva.passageiro,
            passageiroAvaliacao: (ofertaAtiva as any).passageiroAvaliacao || 4.95,
            valorLiquido: Number(ofertaAtiva.valorLiquido || (ofertaAtiva as any).valorBruto || 24.9),
            distanciaKm: Number(ofertaAtiva.distanciaKm || 4.2),
            duracaoMin: Number((ofertaAtiva as any).duracaoMin || 12),
            origem: ofertaAtiva.origem,
            destino: ofertaAtiva.destino,
            modalidadeTag: (ofertaAtiva as any).tipo || (ofertaAtiva as any).modalidade,
            distanciaAteEmbarqueKm: (ofertaAtiva as any).distanciaAteEmbarqueKm || 1.2,
            tempoAteEmbarqueMin: (ofertaAtiva as any).tempoAteEmbarqueMin || 3,
            ganhoPorKm:
              (ofertaAtiva as any).ganhoPorKm ||
              (ofertaAtiva.distanciaKm > 0
                ? Number((ofertaAtiva.valorLiquido / ofertaAtiva.distanciaKm).toFixed(2))
                : 3.85),
          }}
          onAceitar={handleAceitarOferta}
          onRecusar={handleRecusarOferta}
          countdownSeconds={tempoRegressivo > 0 ? tempoRegressivo : 15}
          isNightMode={isNightMode}
        />
      )}

      {/* =================================================================== */}
      {/* MODAIS: DEVOLUÇÃO E FINALIZAÇÃO DE ENCOMENDA 99ENTREGA             */}
      {/* =================================================================== */}
      <DriverDeliveryModals
        modalDevolucaoAberto={modalDevolucaoAberto}
        waitStatus={waitStatus}
        onCloseDevolucao={() => setModalDevolucaoAberto(false)}
        onRegistrarContato={handleRegistrarContato}
        onIniciarDevolucao={handleIniciarDevolucao}
        modalReturnFinalizarAberto={modalReturnFinalizarAberto}
        returnDetails={returnDetails}
        onCloseReturnFinalizar={() => setModalReturnFinalizarAberto(false)}
        pinDevolucaoDigitado={pinDevolucaoDigitado}
        setPinDevolucaoDigitado={setPinDevolucaoDigitado}
        erroPinDevolucao={erroPinDevolucao}
        fotoDevolucaoUrl={fotoDevolucaoUrl}
        onConcluirDevolucao={handleConcluirDevolucao}
        corPrimaria={corPrimaria}
        brandGradient={brandGradient}
        corTextoPrimaria={corTextoPrimaria}
      />

      {/* =================================================================== */}
      {/* MODAL / NUMPAD BOTTOM SHEET: DUPLO PIN DE ENTREGA (BLIND VALIDATION) */}
      {/* =================================================================== */}
      {ofertaAtiva && ofertaAtiva.tipo === "ENTREGA" && (
        <DeliveryPinNumpadBottomSheet
          isOpen={modalPinNumpadAberto}
          mode={pinNumpadMode}
          deliveryId={ofertaAtiva.id}
          driverId={perfilMotorista.id}
          customerName={
            pinNumpadMode === "PICKUP"
              ? ofertaAtiva.passageiro
              : ofertaAtiva.destinatarioNome || "Destinatário"
          }
          expectedPinFallback={
            pinNumpadMode === "PICKUP"
              ? ofertaAtiva.pickupOtp || ofertaAtiva.pinCorreto
              : ofertaAtiva.deliveryOtp || ofertaAtiva.pinCorreto
          }
          onSuccess={() => {
            if (pinNumpadMode === "PICKUP") {
              handlePickupPinSuccess();
            } else {
              handleDropoffPinSuccess();
            }
          }}
          onCancel={() => setModalPinNumpadAberto(false)}
          onStartReturn={() => {
            setModalPinNumpadAberto(false);
            handleAbrirModalDevolucao();
          }}
        />
      )}





      {/* =================================================================== */}
      {/* MODAL OFICIAL: MODO DESTINO DO MOTORISTA ("IR PARA CASA")           */}
      {/* =================================================================== */}
      <DriverDestinationModal
        isOpen={modalModoDestino}
        onClose={() => setModalModoDestino(false)}
        driverId={perfilMotorista.id}
        onDestinationSet={(dest) => setDestinoAtivo(dest)}
      />

      {/* =================================================================== */}
      {/* MODAL OFICIAL: TAXÍMETRO VIRTUAL INTELIGENTE ("CORRIDA DE RUA")     */}
      {/* =================================================================== */}
      <VirtualTaximeterModal
        isOpen={modalTaximetro}
        onClose={() => setModalTaximetro(false)}
        driverId={perfilMotorista.id}
      />

      {/* =================================================================== */}
      {/* MODAL: ACERTO DA CORRIDA & RECEBIMENTO PIX DIRETO DO PASSAGEIRO    */}
      {/* =================================================================== */}
      {modalAcertoCorridaAberto && ofertaAtiva && (
        <RidePaymentSettlementModal
          isOpen={modalAcertoCorridaAberto}
          rideId={ofertaAtiva.id}
          passengerName={ofertaAtiva.passageiro}
          destinationAddress={ofertaAtiva.destino}
          amountBrl={Number(ofertaAtiva.valorBruto || ofertaAtiva.valorLiquido || 24.9)}
          driverName={perfilMotorista.nome}
          driverPixKey={perfilMotorista.chavePix || perfilMotorista.cpf || "(22) 99876-5432"}
          driverCity="ITAPERUNA"
          distanceKm={Number(ofertaAtiva.distanciaKm || 4.2)}
          onClose={() => setModalAcertoCorridaAberto(false)}
          onConfirmSettlement={handleConfirmarSettlementFinal}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL: CENTRAL FINANCEIRA & METAS OPERACIONAIS (P2P ZERO-CUSTÓDIA)  */}
      {/* =================================================================== */}
      {modalFinanceiroAberto && (
        <DriverFinancialDashboardModal
          isOpen={modalFinanceiroAberto}
          driverId={perfilMotorista.id}
          driverName={perfilMotorista.nome}
          vehicleType={perfilMotorista.categoria === "MOTO" ? "MOTO" : "CARRO"}
          onClose={() => setModalFinanceiroAberto(false)}
          onOpenSubscriptionPlans={() => {
            setModalFinanceiroAberto(false);
            setModalAssinaturaSaasAberto(true);
          }}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL: ASSINATURA SAAS & PAGAMENTO DA DIÁRIA (WHITE LABEL 100%)    */}
      {/* =================================================================== */}
      {modalAssinaturaSaasAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setModalAssinaturaSaasAberto(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <DriverSubscriptionScreen
              driverId={perfilMotorista.id}
              driverName={perfilMotorista.nome}
              vehicleType={perfilMotorista.categoria === "MOTO" ? "MOTO" : "CARRO"}
              onPaymentSuccess={() => {
                setModalAssinaturaSaasAberto(false);
                setIsOnline(true);
              }}
            />
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: MEU PLANO & ASSINATURA (AUDITORIA 2 & 12)                    */}
      {/* =================================================================== */}
      {modalPlanosAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5" style={{ color: accentColor }} />
                <h3 className="text-base font-black text-slate-950">Planos de Assinatura {nomeApp}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalPlanosAberto(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Escolha o plano que melhor se adapta à sua rotina. No {nomeApp} você tem 0% de comissão retida e 100% do valor de cada corrida fica no seu bolso.
            </p>

            {/* Lista dos 4 Planos Oficiais */}
            <div className="space-y-3">
              {subscriptionEngine.getAllPlans(false).map((plan) => {
                const isSelected = subscription.planId === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`p-3.5 rounded-2xl border-2 transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-50/80 shadow-md"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                    style={isSelected ? { borderColor: corPrimaria, backgroundColor: `${corPrimaria}06` } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${plan.badgeColor}`} />
                        <h4 className="font-black text-sm text-slate-950">{plan.name}</h4>
                        {plan.isPopular && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}20`, color: corPrimaria }}>
                            Mais Popular
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}20`, color: corPrimaria }}>
                            Plano Atual ✓
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-950 block">
                          {plan.monthlyFeeBrl === 0
                            ? "Sem Mensalidade"
                            : `${plan.monthlyFeeBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês`}
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: corPrimaria }}>
                          {plan.commissionPercent}% por corrida
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 font-medium mt-1.5">{plan.description}</p>

                    <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                      <span className="text-xs text-slate-700 font-semibold">
                        {plan.commissionPercent <= 3 ? "⭐ Atendimento VIP Prioritário" : "Suporte Regular no App"}
                      </span>
                      {!isSelected ? (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = subscriptionEngine.changeDriverPlan(perfilMotorista.id, plan.id);
                            setSubscription(updated);
                            setDriverPlan(plan);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition active:scale-95"
                        >
                          Mudar para {plan.name}
                        </button>
                      ) : (
                        <span className="text-xs font-bold" style={{ color: corPrimaria }}>Ativo</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setModalPlanosAberto(false)}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: COMPARATIVO ECONOMIA PARTIU (AUDITORIA 10)                  */}
      {/* =================================================================== */}
      {modalEconomiaAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 text-slate-900 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5" style={{ color: accentColor }} />
                <h3 className="text-base font-black text-slate-950">Seu Faturamento &amp; Economia</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEconomiaAberto(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="p-4 rounded-2xl border text-center space-y-1"
              style={{
                backgroundColor: `${corPrimaria}08`,
                borderColor: `${corPrimaria}25`,
              }}
            >
              <span className="text-[10px] font-black uppercase" style={{ color: corPrimaria }}>
                Economia Real no Seu Bolso (Mês)
              </span>
              <div className="text-3xl font-black" style={{ color: corPrimaria }}>
                +{wallet.totalSavingsVersusUberBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-xs text-slate-600">
                Comparativo direto com os 20% cobrados pelos aplicativos tradicionais.
              </p>
            </div>

            {/* Demonstrativo Detalhado (Exemplo Oficial do Prompt) */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Ganhos Brutos do Mês:</span>
                <span className="font-bold text-slate-900">
                  {wallet.totalGrossEarnedBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Taxas Pagas ao PARTIU:</span>
                <span className="font-black" style={{ color: corPrimaria }}>
                  -{wallet.totalPlatformFeesPaidBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                <span>Quanto pagaria no app tradicional (20%):</span>
                <span className="font-bold text-rose-700">
                  -{(wallet.totalGrossEarnedBrl * 0.20).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold" style={{ color: corPrimaria }}>
                <span>Diferença a Seu Favor:</span>
                <span className="text-sm font-black">
                  +{wallet.totalSavingsVersusUberBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalEconomiaAberto(false)}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: REGULARIZAÇÃO DE INADIMPLÊNCIA & DESBLOQUEIO PIX (FASE 19)   */}
      {/* =================================================================== */}
      {modalRegularizacaoAberto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 text-slate-900 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-slate-950">Regularização de Inadimplência</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalRegularizacaoAberto(false)}
                className="p-1 rounded-full text-slate-600 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-800">
                Débito Total Pendente
              </span>
              <div className="text-3xl font-black text-rose-600">
                {(subscription.accumulatedDebtBrl || 49.90).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
              <p className="text-xs text-rose-950 font-medium">
                Sua conta está temporariamente suspensa para novas corridas no Trip Radar.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-800 font-medium">
                <span>Plano Contratado:</span>
                <span className="font-bold text-slate-900">{driverPlan?.name || "Bronze"}</span>
              </div>
              <div className="flex justify-between items-center text-slate-800 font-medium">
                <span>Taxa por Corrida:</span>
                <span className="font-bold text-emerald-700">0,0% (Taxa Zero)</span>
              </div>
              <div className="flex justify-between items-center text-slate-800 font-medium">
                <span>Prazo de Carência:</span>
                <span className="font-bold text-rose-700">Expirado (Bloqueio Ativo)</span>
              </div>
            </div>

            {/* Código PIX Copia e Cola */}
            <div className="p-3 bg-slate-100 rounded-xl space-y-1.5 border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>PIX Copia e Cola Oficial PARTIU</span>
                <button
                  type="button"
                  onClick={() => {
                    const rawEmv = `00020126580014BR.GOV.BCB.PIX0136partiu-financeiro-recuperacao-502@pix.partiu.app520400005303986540${(subscription.accumulatedDebtBrl || 49.9).toFixed(2)}5802BR5925PARTIU MOBILIDADE BRASIL6009SAO PAULO62070503***6304`;
                    void navigator.clipboard.writeText(`${rawEmv}${computePixCrc16(rawEmv)}`);
                    alert("Chave Copia e Cola do PIX copiada!");
                  }}
                  style={{ color: corPrimaria }}
                  className="font-black text-xs hover:underline"
                >
                  COPIAR
                </button>
              </div>
              <p className="text-xs text-slate-700 font-mono font-medium break-all line-clamp-2">
                00020126580014BR.GOV.BCB.PIX0136partiu-financeiro-recuperacao-502@pix.partiu.app520400005303986540...
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const paidCents = subscription.accumulatedDebtCents || Math.round((subscription.accumulatedDebtBrl || 49.9) * 100);
                  const updated = subscriptionEngine.clearDebt(perfilMotorista.id, paidCents);
                  setSubscription(updated);
                  setDriverPlan(subscriptionEngine.getPlanById(updated.planId));
                  setWallet(driverWalletEngine.getWallet(perfilMotorista.id));
                  setErroElegibilidade(null);
                  setModalRegularizacaoAberto(false);
                  alert("Pagamento PIX confirmado com sucesso! Sua conta foi desbloqueada imediatamente.");
                }}
                style={{ background: brandGradient, color: corTextoPrimaria }}
                className="w-full h-12 rounded-2xl font-black text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>PAGUEI VIA PIX (DESBLOQUEIO IMEDIATO)</span>
              </button>

              <button
                type="button"
                onClick={() => setModalRegularizacaoAberto(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / BOTTOM SHEET: CANCELAMENTO OPERACIONAL DO CONDUTOR (FASE 2)       */}
      {/* ========================================================================= */}
      <DriverCancelBottomSheet
        isOpen={modalCancelarAberto}
        onClose={() => setModalCancelarAberto(false)}
        onConfirm={handleConfirmarCancelamentoMotorista}
        isSubmitting={isCancelandoCorrida}
      />

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE PASSAGEIRO NÃO COMPARECEU / NO-SHOW (FASE 3)        */}
      {/* ========================================================================= */}
      {modalNoShowConfirmAberto && ofertaAtiva && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-brand-primary-deep">Passageiro Não Compareceu</h3>
                  <p className="text-xs text-slate-700 font-semibold">Cobrança de taxa de carência</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNoShowConfirmAberto(false)}
                disabled={isProcessandoNoShow}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl border space-y-2 text-xs text-slate-900" style={{ backgroundColor: `${corPrimaria}08`, borderColor: `${corPrimaria}25` }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Tempo no Embarque:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {Math.floor((waitingTimerStatus?.elapsedSeconds || 300) / 60)}:
                  {((waitingTimerStatus?.elapsedSeconds || 300) % 60).toString().padStart(2, "0")} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Tolerância Expirada:</span>
                <span className="font-bold" style={{ color: corPrimaria }}>✓ 5 min cumpridos</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-800">Taxa de Cancelamento:</span>
                <span className="font-black text-slate-900">R$ 6,00</span>
              </div>
              <div className="flex items-center justify-between bg-white/80 p-2 rounded-xl border" style={{ borderColor: `${accentColor}40` }}>
                <span className="font-black" style={{ color: corPrimaria }}>Seu Crédito Instantâneo PIX:</span>
                <span className="font-black text-sm" style={{ color: corPrimaria }}>+ R$ 4,50</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium text-center leading-relaxed">
              Esta corrida será encerrada sem penalizar sua taxa de cancelamento. O crédito de R$ 4,50 entrará no seu saldo hoje.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isProcessandoNoShow}
                onClick={handleConfirmarNoShow}
                className="w-full h-13 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-sm shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isProcessandoNoShow ? "PROCESSANDO..." : "CONFIRMAR & RECEBER R$ 4,50"}</span>
              </button>
              <button
                type="button"
                disabled={isProcessandoNoShow}
                onClick={() => setModalNoShowConfirmAberto(false)}
                className="w-full py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition text-center cursor-pointer"
              >
                Continuar Aguardando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHAT OPERACIONAL EM TEMPO REAL (SUPABASE REALTIME + SMART REPLIES)       */}
      {/* ========================================================================= */}
      {ofertaAtiva && (
        <ChatBottomSheet
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          rideId={ofertaAtiva.id}
          currentUserType="DRIVER"
          currentUserId={perfilMotorista.id}
          partnerName={ofertaAtiva.destinatarioNome && ofertaAtiva.tipo === "ENTREGA" ? ofertaAtiva.destinatarioNome : ofertaAtiva.passageiro}
          partnerPhoto={ofertaAtiva.passageiroFoto}
          partnerRoleLabel={ofertaAtiva.tipo === "ENTREGA" ? "Destinatário / Remetente" : "Passageiro"}
          rideStatus={
            estadoCockpit === "HEADING_TO_PICKUP"
              ? "A_CAMINHO"
              : estadoCockpit === "WAITING_PIN"
              ? "CHEGOU"
              : estadoCockpit === "IN_PROGRESS"
              ? "EM_VIAGEM"
              : "PROCURANDO"
          }
        />
      )}

      {/* ========================================================================= */}
      {/* BOTÕES FLUTUANTES NO MAPA (RECENTRALIZAR À ESQUERDA & SOS À DIREITA)       */}
      {/* ========================================================================= */}
      {/* 1. Botão Recenter (Inferior Esquerdo, posicionado acima do Bottom Sheet) */}
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("partiu:recenter-map"));
        }}
        className="fixed left-4 bottom-56 sm:bottom-64 z-20 w-13 h-13 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center text-brand-primary-vibrant hover:bg-slate-50 active:scale-95 transition pointer-events-auto cursor-pointer"
        title="Centralizar Minha Posição"
        aria-label="Centralizar no Mapa"
      >
        <Compass className="w-6 h-6 stroke-[2.2]" />
      </button>

      {/* 2. Botão SOS Emergência 190 (Inferior Direito, posicionado acima do Bottom Sheet) */}
      <div className="fixed bottom-56 sm:bottom-64 right-4 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => setModalSosAberto(true)}
          aria-label="Botão de Emergência e SOS Policial 190"
          className="w-14 h-14 rounded-full bg-white hover:bg-rose-50 active:scale-95 text-brand-danger-red flex flex-col items-center justify-center shadow-xl border-2 border-brand-danger-red transition-all cursor-pointer animate-pulse"
          title="Central de Emergência SOS 190"
        >
          <SirenIcon className="w-5 h-5 text-brand-danger-red" />
          <span className="text-[9px] font-extrabold tracking-wider leading-none mt-0.5 text-brand-danger-red">SOS</span>
        </button>
      </div>

      {/* MODAL DE CONFIRMAÇÃO SOS 190 */}
      <DriverSosModal
        isOpen={modalSosAberto}
        onClose={() => setModalSosAberto(false)}
        driverProfile={perfilMotorista}
        corridaAtiva={corridaSincronizada}
      />

      {/* ========================================================================= */}
      {/* MENU LATERAL COMPLETO DO MOTORISTA COM OPÇÃO DE SAIR (LOGOUT)             */}
      {/* ========================================================================= */}
      <DriverDrawer
        open={modalMenuMotoristaAberto}
        onClose={() => setModalMenuMotoristaAberto(false)}
        driverProfile={perfilMotorista as any}
        isOnline={isOnline}
        ganhosHoje={ganhosHoje}
        diariaCountdownTexto={diariaCountdownTexto}
        unreadCount={unreadNotificationsCount}
        onOpenProfile={() => {
          setModalMenuMotoristaAberto(false);
          setModalPerfilMotorista(true);
        }}
        onOpenFinanceiro={() => {
          setModalMenuMotoristaAberto(false);
          setModalFinanceiroAberto(true);
        }}
        onOpenPlanos={() => {
          setModalMenuMotoristaAberto(false);
          setModalAssinaturaSaasAberto(true);
        }}
        onOpenTaximetro={() => {
          setModalMenuMotoristaAberto(false);
          setModalTaximetro(true);
        }}
        onOpenDestino={() => {
          setModalMenuMotoristaAberto(false);
          setModalModoDestino(true);
        }}
        onOpenNotificacoes={() => {
          setModalMenuMotoristaAberto(false);
          setModalNotificacoesAberto(true);
        }}
        onOpenSos={() => {
          setModalMenuMotoristaAberto(false);
          setModalSosAberto(true);
        }}
        onLogout={handleLogoutMotorista}
      />

      {/* ========================================================================= */}
      {/* MODAL: GESTÃO DE PERFIL E VEÍCULO DO MOTORISTA                            */}
      {/* ========================================================================= */}
      {modalPerfilMotorista && (
        <DriverProfileSettings
          isOpen={modalPerfilMotorista}
          onClose={() => setModalPerfilMotorista(false)}
          driverProfile={perfilMotorista as any}
          onSave={(updated) => {
            setPerfilMotorista((prev) => ({ ...prev, ...(updated as any) }));
          }}
          onLogout={handleLogoutMotorista}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: CENTRAL DE NOTIFICAÇÕES OPERACIONAIS                               */}
      {/* ========================================================================= */}
      {modalNotificacoesAberto && (
        <NotificationCenterModal
          isOpen={modalNotificacoesAberto}
          onClose={() => setModalNotificacoesAberto(false)}
          userId={perfilMotorista.id}
          userRole="DRIVER"
        />
      )}
    </div>
  );
}
