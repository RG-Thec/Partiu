import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Clock,
  MapPin,
  QrCode,
  Tag,
  Gift,
  Car,
  Headphones,
  Settings,
  LogOut,
  X,
  ChevronRight,
  Star,
  ShieldAlert,
  Package,
} from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { type SavedLocation } from "@/lib/passenger/passenger-ride-machine";
import {
  userService,
  type UserProfileData,
  addressService,
  couponService,
  type ActiveCoupon,
  driverApplicationService,
  appSettingsService,
  type GlobalAppSettings,
} from "@/services";
import { SecurityCenterModal } from "@/components/security/SecurityCenterModal";
import { SavedAddressesModal } from "./modals/SavedAddressesModal";
import { PaymentMethodsModal } from "./modals/PaymentMethodsModal";
import { CouponsModal } from "./modals/CouponsModal";
import { ReferralModal } from "./modals/ReferralModal";
import { SupportModal } from "./modals/SupportModal";
import { ComfortSettingsModal } from "./modals/ComfortSettingsModal";
import { DriverSignupModal } from "./modals/DriverSignupModal";

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenSecurity?: () => void;
}

export function AppDrawer({ open, onClose }: AppDrawerProps) {
  const navigate = useNavigate();
  const { nomeApp, corTextoPrimaria, activeTenant } = useBrandTheme();
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  // 1. DADOS DO PERFIL DO USUÁRIO (Sincronizado com Supabase)
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);

  // 2. CONFIGURAÇÕES GLOBAIS OPERACIONAIS (app_settings)
  const [appSettings, setAppSettings] = useState<GlobalAppSettings>(() =>
    appSettingsService.getSettingsSync(),
  );

  // Modais de Ações Oficiais
  const [modalEnderecos, setModalEnderecos] = useState(false);
  const [modalPagamentos, setModalPagamentos] = useState(false);
  const [modalCupons, setModalCupons] = useState(false);
  const [modalIndique, setModalIndique] = useState(false);
  const [modalAjuda, setModalAjuda] = useState(false);
  const [modalConfiguracoes, setModalConfiguracoes] = useState(false);
  const [modalMotoristaExpress, setModalMotoristaExpress] = useState(false);
  const [modalSeguranca, setModalSeguranca] = useState(false);
  const [confirmSairAberto, setConfirmSairAberto] = useState(false);

  // 3. ESTADOS DOS ENDEREÇOS SALVOS (AddressService)
  const [enderecos, setEnderecos] = useState<SavedLocation[]>(() =>
    addressService.getLocalAddresses(),
  );

  // 4. ESTADOS DE CUPONS & PROMOÇÕES REAIS (CouponService)
  const [cupons, setCupons] = useState<ActiveCoupon[]>(() => couponService.getLocalCoupons());
  const [promocoesDisponiveis, setPromocoesDisponiveis] = useState<ActiveCoupon[]>([]);
  const [cupomAtivo, setCupomAtivo] = useState<ActiveCoupon | null>(() =>
    couponService.getActiveRideCoupon(),
  );

  // 5. PREFERÊNCIAS DE VIAGEM & CONFORTO REAIS (UserService com Debounce)
  const [pushNotificacoes, setPushNotificacoes] = useState(true);
  const [sonsVibracao, setSonsVibracao] = useState(true);
  const [arCondicionado, setArCondicionado] = useState(true);
  const [viagemSilenciosa, setViagemSilenciosa] = useState(false);
  const [exigirPin, setExigirPin] = useState(true);

  // Carregar dados reais ao abrir o Drawer
  useEffect(() => {
    if (open) {
      void (async () => {
        const perfil = await userService.getCurrentUserProfile();
        setUserProfile(perfil);
        setPushNotificacoes(perfil.preferences.prefPushNotifications);
        setSonsVibracao(perfil.preferences.prefSoundsHaptics ?? true);
        setArCondicionado(perfil.preferences.prefAc);
        setViagemSilenciosa(perfil.preferences.prefQuietTrip);
        setExigirPin(perfil.preferences.prefRequirePin ?? true);

        const ends = await addressService.getAddresses(perfil.id);
        setEnderecos(ends);

        const cups = await couponService.getActiveCoupons(perfil.id);
        setCupons(cups);

        const promos = await couponService.getAvailablePromotions();
        setPromocoesDisponiveis(promos);

        const activeApplied = couponService.getActiveRideCoupon();
        setCupomAtivo(activeApplied);

        const settings = await appSettingsService.fetchSettings();
        setAppSettings(settings);
      })();
    }
  }, [open]);

  // Listener reativo para atualizações instantâneas de perfil/avatar
  useEffect(() => {
    const handleProfileUpdate = () => {
      void userService.getCurrentUserProfile().then((perfil) => {
        setUserProfile(perfil);
      });
    };
    window.addEventListener("partiu:user-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("partiu:user-profile-updated", handleProfileUpdate);
  }, []);

  const effectiveAvatar =
    userProfile?.avatarUrl ||
    (typeof window !== "undefined"
      ? localStorage.getItem("partiu_user_avatar") ||
        localStorage.getItem("partiu_user_foto") ||
        localStorage.getItem("partiu_user_selfie")
      : null);

  const sessionName =
    typeof window !== "undefined" ? supabaseAuthService.getStoredSession()?.name : null;
  const effectiveName =
    (userProfile?.name && userProfile.name !== "Passageiro" ? userProfile.name : null) ||
    (sessionName && sessionName !== "Passageiro" ? sessionName : null) ||
    (typeof window !== "undefined" ? localStorage.getItem("partiu_user_nome") : null) ||
    userProfile?.name ||
    sessionName ||
    "Passageiro";

  // Tecla Escape para fechar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Salvar Endereços
  async function handleAdicionarEndereco(label: string, endereco: string) {
    const atualizados = await addressService.addAddress({ label, endereco }, userProfile?.id);
    setEnderecos(atualizados);
  }

  async function handleRemoverEndereco(id: string) {
    const atualizados = await addressService.removeAddress(id, userProfile?.id);
    setEnderecos(atualizados);
  }

  // Aplicar Cupom com Validação Real
  async function handleAplicarCupom(codigo: string): Promise<boolean> {
    const res = await couponService.redeemCoupon(codigo, userProfile?.id);
    if (res.success) {
      setCupons(res.coupons);
      const ativo = couponService.getActiveRideCoupon();
      setCupomAtivo(ativo);
      return true;
    }
    return false;
  }

  function handleSelecionarCupomParaViagem(cupom: ActiveCoupon) {
    couponService.applyCouponForRide(cupom);
    setCupomAtivo(cupom);
  }

  // Resgatar Código de Indicação
  async function handleResgatarCodigoAmigo(codigo: string): Promise<boolean> {
    const res = await couponService.redeemCoupon(codigo, userProfile?.id);
    if (res.success) {
      setCupons(res.coupons);
      return true;
    }
    return false;
  }

  // Toggles de Preferências com Debounce no Supabase
  function handleTogglePush(val: boolean) {
    setPushNotificacoes(val);
    userService.updateUserPreferences({ prefPushNotifications: val });
  }

  function handleToggleSons(val: boolean) {
    setSonsVibracao(val);
    userService.updateUserPreferences({ prefSoundsHaptics: val });
  }

  function handleToggleAc(val: boolean) {
    setArCondicionado(val);
    userService.updateUserPreferences({ prefAc: val });
  }

  function handleToggleSilencio(val: boolean) {
    setViagemSilenciosa(val);
    userService.updateUserPreferences({ prefQuietTrip: val });
  }

  function handleTogglePin(val: boolean) {
    setExigirPin(val);
    userService.updateUserPreferences({ prefRequirePin: val });
  }

  // Envio de Candidatura Expressa de Motorista
  async function handleEnviarCandidatura(dados: {
    nome: string;
    telefone: string;
    tipoVeiculo: "CARRO" | "MOTO";
    modelo: string;
    placa: string;
  }): Promise<boolean> {
    const res = await driverApplicationService.submitApplication({
      name: dados.nome,
      phone: dados.telefone,
      vehicleType: dados.tipoVeiculo,
      vehicleModel: dados.modelo || (dados.tipoVeiculo === "MOTO" ? "Honda CG 160" : "Carro Sedan"),
      vehiclePlate: dados.placa,
    });
    return res.success;
  }

  // Logout Oficial com confirmação nativa in-app
  async function handleConfirmarSair() {
    setConfirmSairAberto(false);
    onClose();
    await supabaseAuthService.signOut();
    localStorage.removeItem("partiu_enderecos_salvos_v1");
    navigate({ to: "/auth" });
  }

  const cidadeRegional = activeTenant?.cidadeNome
    ? `${activeTenant.cidadeNome}${activeTenant.uf ? `, ${activeTenant.uf}` : ""}`
    : appSettings.pixReceiverCity || "Operação Regional";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-center text-slate-900">
      {/* Backdrop com desfoque */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel do Drawer */}
      <aside
        className="relative w-full max-w-sm h-full bg-card text-foreground shadow-2xl z-10 flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-out border-r border-border"
        aria-label="Menu do Usuário"
      >
        <div className="flex-1">
          {/* HEADER DO PERFIL */}
          <div className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div
                style={{
                  borderRadius: ui.borderRadius,
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary || colors.primary} 100%)`,
                }}
                className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-white shadow-md relative overflow-hidden shrink-0 border border-white/20"
              >
                {effectiveAvatar ? (
                  <img
                    src={effectiveAvatar}
                    alt={effectiveName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-base font-black">
                    {effectiveName ? effectiveName.charAt(0).toUpperCase() : "P"}
                  </span>
                )}
                {/* Indicador Online */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-black/5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-sm font-black text-foreground leading-tight truncate">
                    {effectiveName}
                  </h2>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full border shadow-2xs shrink-0"
                    style={{
                      backgroundColor: `${colors.secondary}20`,
                      borderColor: `${colors.secondary}40`,
                      color: colors.secondary,
                    }}
                  >
                    <Star
                      className="h-2.5 w-2.5"
                      style={{ fill: colors.secondary, color: colors.secondary }}
                    />
                    {(userProfile?.rating || 4.9).toFixed(1)}
                  </span>
                </div>

                <Link
                  to="/app/perfil"
                  onClick={onClose}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mt-0.5 text-left inline-flex items-center gap-1"
                >
                  <span>Ver perfil</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shrink-0"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* FAIXA EXECUTIVA DE ACESSO RÁPIDO (3 PILLS) */}
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 grid grid-cols-3 gap-2">
            <Link
              to="/app/bilhetes"
              onClick={onClose}
              className="p-2 rounded-xl bg-card border border-border/80 hover:border-primary/40 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-1 shadow-2xs group cursor-pointer"
            >
              <div
                style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
              >
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-foreground leading-tight">Viagens</span>
            </Link>

            <button
              type="button"
              onClick={() => setModalCupons(true)}
              className="p-2 rounded-xl bg-card border border-border/80 hover:border-primary/40 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-1 shadow-2xs group cursor-pointer"
            >
              <div
                style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform relative"
              >
                <Tag className="w-3.5 h-3.5" />
                {cupomAtivo && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                )}
              </div>
              <span className="text-[10px] font-bold text-foreground leading-tight">Cupons</span>
            </button>

            <button
              type="button"
              onClick={() => setModalSeguranca(true)}
              className="p-2 rounded-xl bg-card border border-border/80 hover:border-destructive/40 active:scale-95 transition-all text-center flex flex-col items-center justify-center gap-1 shadow-2xs group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold text-foreground leading-tight">SOS 24h</span>
            </button>
          </div>

          {/* CORPO DO MENU ROLÁVEL COM 4 CATEGORIAS */}
          <div className="p-3.5 sm:p-4 space-y-3.5">
            {/* CATEGORIA 1: MOBILIDADE & ATIVIDADES */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1.5 block">
                Mobilidade &amp; Atividades
              </span>
              <div className="bg-card rounded-2xl border border-border/80 overflow-hidden divide-y divide-border/60 shadow-2xs">
                {/* Minhas Viagens */}
                <Link
                  to="/app/bilhetes"
                  onClick={onClose}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/60 active:bg-muted transition-colors text-foreground group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    >
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      Minhas Viagens e Recibos
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>

                {/* Enviar Encomenda */}
                <Link
                  to="/app/encomendas"
                  onClick={onClose}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/60 active:bg-muted transition-colors text-foreground group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    >
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Enviar Encomenda</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/20">
                      Duplo PIN
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
              </div>
            </div>

            {/* CATEGORIA 2: PAGAMENTOS & VANTAGENS */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1.5 block">
                Pagamentos &amp; Vantagens
              </span>
              <div className="bg-card rounded-2xl border border-border/80 overflow-hidden divide-y divide-border/60 shadow-2xs">
                {/* Formas de Pagamento */}
                <button
                  type="button"
                  onClick={() => setModalPagamentos(true)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/60 active:bg-muted transition-colors text-foreground group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    >
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      Como Pagar (PIX / Dinheiro)
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Meus Cupons */}
                <button
                  type="button"
                  onClick={() => setModalCupons(true)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/60 active:bg-muted transition-colors text-foreground group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    >
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      Cupons &amp; Descontos
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {cupomAtivo ? (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/20">
                        {cupomAtivo.codigo}
                      </span>
                    ) : promocoesDisponiveis.length > 0 ? (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {promocoesDisponiveis.length} novos
                      </span>
                    ) : null}
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>

                {/* Indique e Ganhe */}
                <button
                  type="button"
                  onClick={() => setModalIndique(true)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/60 active:bg-muted transition-colors text-foreground group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${colors.secondary}20`, color: colors.primary }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    >
                      <Gift className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Indique e Ganhe</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{ color: colors.primary }}
                      className="text-[10px] font-black bg-primary/10 px-2 py-0.5 rounded-full"
                    >
                      +R$ {appSettings.referralBonusBrl || 5},00
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>
              </div>
            </div>

            {/* CATEGORIA 3: SEGURANÇA & PREFERÊNCIAS */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1.5 block">
                Segurança &amp; Preferências
              </span>
              <div className="bg-card rounded-2xl border border-border/80 overflow-hidden divide-y divide-border/60 shadow-2xs">
                {/* Central de Segurança */}
                <button
                  type="button"
                  onClick={() => setModalSeguranca(true)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/60 active:bg-muted transition-colors text-foreground group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      Central de Segurança &amp; SOS
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">
                      SOS 24h
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>

                {/* Meus Endereços */}
                <button
                  type="button"
                  onClick={() => setModalEnderecos(true)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/60 active:bg-muted transition-colors text-foreground group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Endereços Salvos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {enderecos.length} salvos
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>

                {/* Configurações & Conforto */}
                <button
                  type="button"
                  onClick={() => setModalConfiguracoes(true)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/60 active:bg-muted transition-colors text-foreground group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    >
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      Configurações &amp; Conforto
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </div>

            {/* CATEGORIA 4: SUPORTE & OPORTUNIDADES */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1.5 block">
                Suporte &amp; Oportunidades
              </span>
              <div className="bg-card rounded-2xl border border-border/80 overflow-hidden divide-y divide-border/60 shadow-2xs">
                {/* Ajuda & Suporte */}
                <button
                  type="button"
                  onClick={() => setModalAjuda(true)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/60 active:bg-muted transition-colors text-foreground group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                    >
                      <Headphones className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      Ajuda &amp; Suporte 24h
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Seja Motorista Parceiro */}
                <div
                  onClick={() => setModalMotoristaExpress(true)}
                  className="w-full p-3 hover:bg-muted/60 active:bg-muted transition-colors text-foreground group cursor-pointer flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary || colors.primary} 100%)`,
                        color: "#FFFFFF",
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                    >
                      <Car className="w-4 h-4 text-white stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-foreground block leading-tight">
                        Seja Motorista Parceiro
                      </span>
                      <span className="text-[10px] text-muted-foreground block leading-tight mt-0.5">
                        Taxa Zero • 100% seu
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/20">
                      Diária Fixa
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ DO MENU */}
        <div className="p-4 border-t border-border bg-card/80">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mb-2.5">
            <span>
              {nomeApp} v{appSettings.appVersion || "1.0.0"}
            </span>
            <span className="font-semibold">{cidadeRegional}</span>
          </div>

          <button
            type="button"
            onClick={() => setConfirmSairAberto(true)}
            style={{ borderRadius: ui.borderRadius }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-destructive/10 border border-destructive/20 text-destructive font-bold text-xs hover:bg-destructive/20 active:scale-[0.99] transition-all shadow-2xs cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MODAIS MODULARES DESACOPLADOS
         ========================================================================= */}

      {/* 1. MODAL MEUS ENDEREÇOS */}
      <SavedAddressesModal
        open={modalEnderecos}
        onClose={() => setModalEnderecos(false)}
        enderecos={enderecos}
        onAddEndereco={handleAdicionarEndereco}
        onRemoveEndereco={handleRemoverEndereco}
        corPrimaria={colors.primary}
        corTextoPrimaria={corTextoPrimaria}
      />

      {/* 2. MODAL FORMAS DE PAGAMENTO */}
      <PaymentMethodsModal
        open={modalPagamentos}
        onClose={() => setModalPagamentos(false)}
        corPrimaria={colors.primary}
        corTextoPrimaria={corTextoPrimaria}
      />

      {/* 3. MODAL CUPONS & PROMOÇÕES */}
      <CouponsModal
        open={modalCupons}
        onClose={() => setModalCupons(false)}
        promocoesDisponiveis={promocoesDisponiveis}
        cupomAtivo={cupomAtivo}
        onAplicarCupom={handleAplicarCupom}
        onSelecionarCupom={handleSelecionarCupomParaViagem}
        corPrimaria={colors.primary}
        corTextoPrimaria={corTextoPrimaria}
      />

      {/* 4. MODAL INDIQUE E GANHE */}
      <ReferralModal
        open={modalIndique}
        onClose={() => setModalIndique(false)}
        userProfile={userProfile}
        appSettings={appSettings}
        onResgatarCodigoAmigo={handleResgatarCodigoAmigo}
        corPrimaria={colors.primary}
        corTextoPrimaria={corTextoPrimaria}
      />

      {/* 5. MODAL CENTRAL DE AJUDA */}
      <SupportModal
        open={modalAjuda}
        onClose={() => setModalAjuda(false)}
        appSettings={appSettings}
      />

      {/* 6. MODAL CONFIGURAÇÕES & CONFORTO */}
      <ComfortSettingsModal
        open={modalConfiguracoes}
        onClose={() => setModalConfiguracoes(false)}
        pushNotificacoes={pushNotificacoes}
        sonsVibracao={sonsVibracao}
        arCondicionado={arCondicionado}
        viagemSilenciosa={viagemSilenciosa}
        exigirPin={exigirPin}
        onTogglePush={handleTogglePush}
        onToggleSons={handleToggleSons}
        onToggleAc={handleToggleAc}
        onToggleSilencio={handleToggleSilencio}
        onTogglePin={handleTogglePin}
        corPrimaria={colors.primary}
      />

      {/* 7. MODAL SEJA MOTORISTA EXPRESS */}
      <DriverSignupModal
        open={modalMotoristaExpress}
        onClose={() => setModalMotoristaExpress(false)}
        initialName={userProfile?.name || ""}
        initialPhone={userProfile?.phone || ""}
        onEnviarCandidatura={handleEnviarCandidatura}
        corPrimaria={colors.primary}
        corTextoPrimaria={corTextoPrimaria}
      />

      {/* 8. MODAL DA CENTRAL DE SEGURANÇA */}
      <SecurityCenterModal open={modalSeguranca} onClose={() => setModalSeguranca(false)} />

      {/* 9. MODAL DE CONFIRMAÇÃO DE LOGOUT (Touch First) */}
      {confirmSairAberto && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-foreground rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-border animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black mb-1">Deseja realmente sair?</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Você precisará fazer login novamente para solicitar corridas.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmSairAberto(false)}
                className="py-3 px-4 rounded-xl bg-muted text-foreground font-bold text-xs hover:bg-muted/80 active:scale-95 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarSair}
                className="py-3 px-4 rounded-xl bg-destructive text-destructive-foreground font-bold text-xs hover:bg-destructive/90 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
