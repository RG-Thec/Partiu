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
  Check,
  Copy,
  Plus,
  Star,
  Phone,
  MessageSquare,
  ExternalLink,
  Trash2,
  Lock,
  CheckCircle2,
  Bell,
  Sliders,
  Share2,
  Sparkles,
  Bike,
  ShieldCheck,
  ShieldAlert,
  User,
  Wind,
  VolumeX,
  Volume2,
  Banknote,
  Zap,
} from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { type SavedLocation } from "@/lib/passenger/passenger-ride-machine";
import { silentCatchWarn } from "@/lib/structured-logger";
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

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenSecurity?: () => void;
}

export function AppDrawer({ open, onClose }: AppDrawerProps) {
  const navigate = useNavigate();
  const { nomeApp, corPrimaria, corSecundaria, corTextoPrimaria } = useBrandTheme();
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  // 1. DADOS DO PERFIL DO USUÁRIO (Sincronizado com Supabase)
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);

  // 2. CONFIGURAÇÕES GLOBAIS OPERACIONAIS (app_settings)
  const [appSettings, setAppSettings] = useState<GlobalAppSettings>(() =>
    appSettingsService.getSettingsSync()
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

  // 3. ESTADOS DOS ENDEREÇOS SALVOS (AddressService)
  const [enderecos, setEnderecos] = useState<SavedLocation[]>(() =>
    addressService.getLocalAddresses()
  );
  const [novoEnderecoLabel, setNovoEnderecoLabel] = useState("");
  const [novoEnderecoRua, setNovoEnderecoRua] = useState("");
  const [mostrandoFormNovoEndereco, setMostrandoFormNovoEndereco] = useState(false);

  // 4. ESTADOS DE CUPONS & PROMOÇÕES REAIS (CouponService)
  const [cupons, setCupons] = useState<ActiveCoupon[]>(() =>
    couponService.getLocalCoupons()
  );
  const [promocoesDisponiveis, setPromocoesDisponiveis] = useState<ActiveCoupon[]>([]);
  const [cupomAtivo, setCupomAtivo] = useState<ActiveCoupon | null>(() =>
    couponService.getActiveRideCoupon()
  );
  const [inputCupom, setInputCupom] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [cupomMensagem, setCupomMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [cupomCopiado, setCupomCopiado] = useState<string | null>(null);

  // 5. INDIQUE E GANHE — CÓDIGO E RESGATE
  const [codigoAmigoInput, setCodigoAmigoInput] = useState("");
  const [resgatandoAmigo, setResgatandoAmigo] = useState(false);
  const [mensagemAmigo, setMensagemAmigo] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // 6. PREFERÊNCIAS DE VIAGEM & CONFORTO REAIS (UserService com Debounce)
  const [pushNotificacoes, setPushNotificacoes] = useState(true);
  const [sonsVibracao, setSonsVibracao] = useState(true);
  const [arCondicionado, setArCondicionado] = useState(true);
  const [viagemSilenciosa, setViagemSilenciosa] = useState(false);
  const [exigirPin, setExigirPin] = useState(true);

  // 7. FORMULÁRIO DE CAPTAÇÃO DE MOTORISTA EXPRESS
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverVehicleType, setDriverVehicleType] = useState<"CARRO" | "MOTO">("CARRO");
  const [driverVehicleModel, setDriverVehicleModel] = useState("");
  const [driverPlate, setDriverPlate] = useState("");
  const [enviandoCandidatura, setEnviandoCandidatura] = useState(false);
  const [candidaturaSucesso, setCandidaturaSucesso] = useState(false);

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

        if (perfil.name) setDriverName(perfil.name);
        if (perfil.phone) setDriverPhone(perfil.phone);

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
        if (perfil.name) setDriverName(perfil.name);
        if (perfil.phone) setDriverPhone(perfil.phone);
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

  const effectiveName =
    userProfile?.name ||
    (typeof window !== "undefined" ? localStorage.getItem("partiu_user_nome") : null) ||
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
  async function handleAdicionarEndereco() {
    if (!novoEnderecoLabel.trim() || !novoEnderecoRua.trim()) return;
    const atualizados = await addressService.addAddress(
      {
        label: novoEnderecoLabel.trim(),
        endereco: novoEnderecoRua.trim(),
      },
      userProfile?.id
    );
    setEnderecos(atualizados);
    setNovoEnderecoLabel("");
    setNovoEnderecoRua("");
    setMostrandoFormNovoEndereco(false);
  }

  async function handleRemoverEndereco(id: string) {
    const atualizados = await addressService.removeAddress(id, userProfile?.id);
    setEnderecos(atualizados);
  }

  // Aplicar Cupom com Validação Real
  async function handleAplicarCupom(codigoCustom?: string) {
    const codigoParaAplicar = (codigoCustom || inputCupom).trim();
    if (!codigoParaAplicar) return;
    setValidandoCupom(true);
    setCupomMensagem(null);
    try {
      const res = await couponService.redeemCoupon(codigoParaAplicar, userProfile?.id);
      if (res.success) {
        setCupons(res.coupons);
        setInputCupom("");
        const ativo = couponService.getActiveRideCoupon();
        setCupomAtivo(ativo);
        setCupomMensagem({ tipo: "sucesso", texto: res.message });
      } else {
        setCupomMensagem({ tipo: "erro", texto: res.message });
      }
    } finally {
      setValidandoCupom(false);
      setTimeout(() => setCupomMensagem(null), 3500);
    }
  }

  function handleSelecionarCupomParaViagem(cupom: ActiveCoupon) {
    couponService.applyCouponForRide(cupom);
    setCupomAtivo(cupom);
    setCupomMensagem({ tipo: "sucesso", texto: `Cupom ${cupom.codigo} ativado para a próxima viagem!` });
    setTimeout(() => setCupomMensagem(null), 3000);
  }

  function copiarCodigo(texto: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      setCupomCopiado(texto);
      setTimeout(() => setCupomCopiado(null), 2000);
    }
  }

  // Resgatar Código de Indicação
  async function handleResgatarCodigoAmigo() {
    if (!codigoAmigoInput.trim()) return;
    setResgatandoAmigo(true);
    setMensagemAmigo(null);
    try {
      const res = await couponService.redeemCoupon(codigoAmigoInput.trim(), userProfile?.id);
      if (res.success) {
        setCupons(res.coupons);
        setCodigoAmigoInput("");
        setMensagemAmigo({
          tipo: "sucesso",
          texto: `Bônus de indicação ativado! Desconto de R$ ${appSettings.referralDiscountBrl || 5},00 liberado.`,
        });
      } else {
        setMensagemAmigo({ tipo: "erro", texto: res.message });
      }
    } finally {
      setResgatandoAmigo(false);
      setTimeout(() => setMensagemAmigo(null), 4000);
    }
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

  // Compartilhamento Dinâmico de Indicação (UUID + Native Share API)
  async function compartilharIndicacao() {
    const valorBonus = appSettings.referralBonusBrl || 5;
    const valorDesconto = appSettings.referralDiscountBrl || 5;
    const meuCodigo = userProfile?.name
      ? (userProfile.name.split(" ")[0].toUpperCase() + valorBonus)
      : `PARTIU${valorBonus}`;
    const referralLink = `https://partiu.app/?convite=${encodeURIComponent(meuCodigo)}`;
    const texto = `Use meu código ${meuCodigo} no ${nomeApp} e ganhe R$ ${valorDesconto},00 de desconto na sua corrida! Baixe e viaje: ${referralLink}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Convite ${nomeApp} Mobilidade`,
          text: texto,
          url: referralLink,
        });
        return;
      } catch (err) { silentCatchWarn("AppDrawer", err); }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(whatsappUrl, "_blank");
  }

  // Envio de Candidatura Expressa de Motorista
  async function handleEnviarCandidatura(e: React.FormEvent) {
    e.preventDefault();
    if (!driverName || !driverPhone || !driverPlate) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    setEnviandoCandidatura(true);
    try {
      const res = await driverApplicationService.submitApplication({
        name: driverName,
        phone: driverPhone,
        vehicleType: driverVehicleType,
        vehicleModel: driverVehicleModel || (driverVehicleType === "MOTO" ? "Honda CG 160" : "Carro Sedan"),
        vehiclePlate: driverPlate,
      });

      if (res.success) {
        setCandidaturaSucesso(true);
        setTimeout(() => {
          setCandidaturaSucesso(false);
          setModalMotoristaExpress(false);
        }, 3000);
      }
    } finally {
      setEnviandoCandidatura(false);
    }
  }

  // Logout Oficial
  async function handleSair() {
    if (confirm("Deseja realmente sair da sua conta PARTIU?")) {
      onClose();
      await supabaseAuthService.signOut();
      localStorage.removeItem("partiu_enderecos_salvos_v1");
      navigate({ to: "/auth" });
    }
  }

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
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div
                style={{
                  borderRadius: ui.borderRadius,
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary || colors.primary} 100%)`,
                }}
                className="w-12 h-12 flex items-center justify-center font-bold text-white shadow-md relative overflow-hidden shrink-0 border border-white/20"
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
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-foreground leading-tight">
                    {effectiveName}
                  </h2>
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full border shadow-2xs"
                    style={{
                      backgroundColor: `${colors.secondary}20`,
                      borderColor: `${colors.secondary}40`,
                      color: colors.secondary,
                    }}
                  >
                    <Star className="h-2.5 w-2.5" style={{ fill: colors.secondary, color: colors.secondary }} />
                    {(userProfile?.rating || 4.9).toFixed(1)}
                  </span>
                </div>

                <Link
                  to="/app/perfil"
                  onClick={onClose}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mt-0.5 text-left inline-flex items-center gap-1"
                >
                  Editar perfil
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* SEÇÃO 1: USO DIÁRIO (ESSENCIAIS) */}
          <div className="p-4 py-3 border-b border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 block mb-1.5">
              Uso Diário
            </span>
            <nav className="space-y-0.5">
              <Link
                to="/app/bilhetes"
                onClick={onClose}
                style={{ borderRadius: ui.borderRadius }}
                className="w-full flex items-center justify-between p-3 hover:bg-muted active:scale-[0.99] transition-all text-foreground group"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                    className="p-2.5 transition-all shrink-0 flex items-center justify-center group-hover:scale-105"
                  >
                    <Clock className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  <span className="text-xs font-bold">Minhas Viagens e Entregas</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>

              <button
                type="button"
                onClick={() => setModalEnderecos(true)}
                style={{ borderRadius: ui.borderRadius }}
                className="w-full flex items-center justify-between p-3 hover:bg-muted active:scale-[0.99] transition-all text-foreground group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                    className="p-2.5 transition-all shrink-0 flex items-center justify-center group-hover:scale-105"
                  >
                    <MapPin className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none">Meus Endereços</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      {enderecos.length} locais sincronizados
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>

              {/* Item: Como Pagar (Zero Custódia / Direto ao Motorista via QR Code ou Dinheiro) */}
              <button
                type="button"
                onClick={() => setModalPagamentos(true)}
                style={{ borderRadius: ui.borderRadius }}
                className="w-full flex items-center justify-between p-3 hover:bg-muted active:scale-[0.99] transition-all text-foreground group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                    className="p-2.5 transition-all shrink-0 flex items-center justify-center group-hover:scale-105"
                  >
                    <QrCode className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none">Como Pagar</span>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      PIX QR Code ou Dinheiro no final da viagem
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>

              {/* Item: Meus Cupons & Promoções Reais */}
              <button
                type="button"
                onClick={() => setModalCupons(true)}
                style={{ borderRadius: ui.borderRadius }}
                className="w-full flex items-center justify-between p-3 hover:bg-muted active:scale-[0.99] transition-all text-foreground group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                    className="p-2.5 transition-all shrink-0 flex items-center justify-center group-hover:scale-105"
                  >
                    <Tag className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold block leading-none">Meus Cupons</span>
                      {cupomAtivo && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                          {cupomAtivo.codigo} Ativo
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      {promocoesDisponiveis.length > 0
                        ? `${promocoesDisponiveis.length} promoções ativas`
                        : "Ver descontos disponíveis"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </nav>
          </div>

          {/* SEÇÃO 2: CRESCIMENTO E SUPORTE */}
          <div className="p-4 py-3 border-b border-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 block mb-1.5">
              Crescimento &amp; Suporte
            </span>
            <nav className="space-y-0.5">
              <button
                type="button"
                onClick={() => setModalIndique(true)}
                style={{ borderRadius: ui.borderRadius }}
                className="w-full flex items-center justify-between p-3 hover:bg-muted active:scale-[0.99] transition-all text-foreground group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: `${colors.secondary}15`,
                      color: colors.primary,
                    }}
                    className="p-2.5 transition-all shrink-0 flex items-center justify-center group-hover:scale-105"
                  >
                    <Gift className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none">Indique e Ganhe</span>
                    <span
                      className="text-[10px] font-semibold mt-1 block"
                      style={{ color: colors.primary }}
                    >
                      Ganhe R$ {appSettings.referralBonusBrl || 5},00 por amigo
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>

              {/* Card Destaque: Seja um Motorista Partiu com Gradiente da Marca */}
              <div
                onClick={() => setModalMotoristaExpress(true)}
                style={{
                  borderRadius: ui.borderRadius,
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                }}
                className="w-full my-2 p-3.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between border"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary || colors.primary} 100%)`,
                      color: "#FFFFFF",
                      boxShadow: `0 4px 14px ${colors.primary}40`,
                    }}
                    className="p-2.5 shadow-md shrink-0 flex items-center justify-center"
                  >
                    <Car className="h-4 w-4 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black leading-tight text-foreground">
                        Seja Motorista Parceiro
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                        DIÁRIA FIXA
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block leading-tight">
                      Taxa Zero: 100% do valor da corrida é seu
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>

              {/* Central de Segurança & SOS 24h Exclusivo no Menu */}
              <button
                type="button"
                onClick={() => setModalSeguranca(true)}
                style={{ borderRadius: ui.borderRadius }}
                className="w-full flex items-center justify-between p-3 hover:bg-muted active:scale-[0.99] transition-all text-foreground group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ borderRadius: ui.borderRadius }}
                    className="p-2.5 bg-destructive/10 text-destructive group-hover:bg-destructive/20 transition-colors shrink-0 flex items-center justify-center"
                  >
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold block leading-none">Central de Segurança &amp; SOS 24h</span>
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">
                        SOS
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Botão de emergência, 190 e Siga Minha Viagem
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setModalAjuda(true)}
                style={{ borderRadius: ui.borderRadius }}
                className="w-full flex items-center justify-between p-3 hover:bg-muted active:scale-[0.99] transition-all text-foreground group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                    className="p-2.5 transition-all shrink-0 flex items-center justify-center group-hover:scale-105"
                  >
                    <Headphones className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  <span className="text-xs font-bold">Ajuda &amp; Suporte 24h</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setModalConfiguracoes(true)}
                style={{ borderRadius: ui.borderRadius }}
                className="w-full flex items-center justify-between p-3 hover:bg-muted active:scale-[0.99] transition-all text-foreground group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                    className="p-2.5 transition-all shrink-0 flex items-center justify-center group-hover:scale-105"
                  >
                    <Settings className="h-4 w-4" style={{ color: colors.primary }} />
                  </div>
                  <span className="text-xs font-bold">Configurações &amp; Conforto</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </nav>
          </div>
        </div>

        {/* RODAPÉ DO MENU */}
        <div className="p-5 border-t border-border bg-card">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mb-3">
            <span>{nomeApp} v{appSettings.appVersion || "1.0.0"}</span>
            <span>Itaperuna, RJ</span>
          </div>

          <button
            type="button"
            onClick={handleSair}
            style={{ borderRadius: ui.borderRadius }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-destructive/10 border border-destructive/20 text-destructive font-bold text-xs hover:bg-destructive/20 active:scale-[0.99] transition-all shadow-2xs cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MODAIS INTEGRADOS COM OS SERVIÇOS
         ========================================================================= */}

      {/* 1. MODAL MEUS ENDEREÇOS */}
      {modalEnderecos && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">Meus Endereços Salvos</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEnderecos(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {enderecos.map((end) => (
                <div
                  key={end.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{end.label}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{end.endereco}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoverEndereco(end.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="Remover endereço"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {mostrandoFormNovoEndereco ? (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <input
                  type="text"
                  placeholder="Nome do local (Ex: Casa, Trabalho)"
                  value={novoEnderecoLabel}
                  onChange={(e) => setNovoEnderecoLabel(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800"
                />
                <input
                  type="text"
                  placeholder="Endereço completo com número"
                  value={novoEnderecoRua}
                  onChange={(e) => setNovoEnderecoRua(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMostrandoFormNovoEndereco(false)}
                    className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAdicionarEndereco}
                    className="flex-1 py-2 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer"
                    style={{ backgroundColor: corPrimaria, color: corTextoPrimaria }}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMostrandoFormNovoEndereco(true)}
                className="w-full mt-4 py-2.5 px-3 rounded-xl border border-dashed border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Adicionar Novo Endereço
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. MODAL COMO PAGAR (100% Direto ao Motorista via QR Code ou Dinheiro - Zero Custódia) */}
      {modalPagamentos && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${corPrimaria || "#FF6B00"}15`, color: corPrimaria || "#FF6B00" }}
                >
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Como Pagar sua Viagem</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Pagamento 100% direto ao condutor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPagamentos(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Aviso de Transparência e Segurança */}
            <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 mb-4 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                <strong>Sem risco e sem cadastro de cartão:</strong> Você não precisa vincular cartões de crédito. O pagamento é realizado ao final da corrida diretamente ao motorista.
              </p>
            </div>

            {/* Opções Reais de Pagamento */}
            <div className="space-y-2.5">
              {/* Opção 1: PIX QR Code na tela do motorista */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                  PIX
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">PIX QR Code no Final da Corrida</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Ao chegar no destino, o motorista conclui a corrida e a tela dele exibe um <strong>QR Code instantâneo</strong> com o valor exato para você escanear pelo seu banco.
                  </p>
                </div>
              </div>

              {/* Opção 2: Dinheiro em Espécie */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Dinheiro em Espécie</span>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Pague em mãos diretamente ao motorista ao desembarcar. Você pode avisar se precisa de troco ao solicitar o veículo.
                  </p>
                </div>
              </div>

              {/* Opção 3: Chave PIX do Motorista */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Chave PIX Direta</span>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    O motorista também pode informar a chave dele (celular, CPF ou e-mail) para transferência bancária no ato.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalPagamentos(false)}
              className="w-full mt-4 py-3 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center"
              style={{ backgroundColor: corPrimaria, color: corTextoPrimaria }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* 3. MODAL MEUS CUPONS (Totalmente Integrado com Promoções Reais do Painel) */}
      {modalCupons && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${corPrimaria || "#FF6B00"}15`, color: corPrimaria || "#FF6B00" }}
                >
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Cupons de Desconto</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Promoções ativas da plataforma</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCupons(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Input de Inserção de Cupom */}
            <div className="space-y-1 mb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Possui um código de desconto?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: PARTIU10 ou código de amigo"
                  value={inputCupom}
                  onChange={(e) => setInputCupom(e.target.value.toUpperCase())}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 uppercase font-bold tracking-wider focus:outline-none focus:border-slate-800"
                />
                <button
                  type="button"
                  disabled={validandoCupom}
                  onClick={() => handleAplicarCupom()}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: corPrimaria, color: corTextoPrimaria }}
                >
                  {validandoCupom ? "Validando..." : "Resgatar"}
                </button>
              </div>

              {cupomMensagem && (
                <p
                  className={`text-[11px] font-bold mt-1.5 ${
                    cupomMensagem.tipo === "sucesso" ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {cupomMensagem.texto}
                </p>
              )}
            </div>

            {/* Lista de Promoções Reais Criadas pelo Administrador */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                Disponíveis para Você
              </span>

              {promocoesDisponiveis.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <Tag className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">Nenhum cupom ativo no momento</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Fique atento às notificações do aplicativo!</p>
                </div>
              ) : (
                promocoesDisponiveis.map((cupom) => {
                  const isAtivo = cupomAtivo?.codigo === cupom.codigo;
                  return (
                    <div
                      key={cupom.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isAtivo
                          ? "bg-emerald-50/70 border-emerald-300 shadow-xs"
                          : "bg-gradient-to-r from-slate-50 to-amber-50/40 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-200 shadow-2xs">
                          {cupom.codigo}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copiarCodigo(cupom.codigo)}
                            className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            title="Copiar código"
                          >
                            {cupomCopiado === cupom.codigo ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelecionarCupomParaViagem(cupom)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                              isAtivo
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                          >
                            {isAtivo ? "✓ Ativo" : "Usar"}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-800 mt-2">{cupom.descontoDescricao}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{cupom.expiracao}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL INDIQUE E GANHE (Conectado aos Dados Reais do Admin) */}
      {modalIndique && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 text-center">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setModalIndique(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${corPrimaria || "#FF6B00"}15`, color: corPrimaria || "#FF6B00" }}
            >
              <Gift className="h-7 w-7" />
            </div>

            <h3 className="text-base font-black text-slate-900">
              Indique Amigos e Ganhe R$ {appSettings.referralBonusBrl || 5},00
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Compartilhe seu código exclusivo. Quando seu amigo fizer a primeira corrida, você ganha{" "}
              <strong>R$ {appSettings.referralBonusBrl || 5},00</strong> e ele ganha{" "}
              <strong>R$ {appSettings.referralDiscountBrl || 5},00 de desconto</strong>!
            </p>

            {/* Código Pessoal do Usuário */}
            <div className="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block text-left">
                  Seu Código de Indicação
                </span>
                <span className="text-sm font-mono font-black text-slate-900">
                  {userProfile?.name
                    ? (userProfile.name.split(" ")[0].toUpperCase() + (appSettings.referralBonusBrl || 5))
                    : `PARTIU${appSettings.referralBonusBrl || 5}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copiarCodigo(
                    userProfile?.name
                      ? (userProfile.name.split(" ")[0].toUpperCase() + (appSettings.referralBonusBrl || 5))
                      : `PARTIU${appSettings.referralBonusBrl || 5}`
                  )
                }
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                {cupomCopiado ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{cupomCopiado ? "Copiado" : "Copiar"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={compartilharIndicacao}
              className="w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mb-4"
              style={{ backgroundColor: corPrimaria, color: corTextoPrimaria }}
            >
              <Share2 className="h-4 w-4" />
              Compartilhar Convite no WhatsApp
            </button>

            {/* Campo: Foi Indicado por um Amigo? */}
            <div className="pt-3 border-t border-slate-100 text-left">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                Foi indicado por alguém?
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código do seu amigo"
                  value={codigoAmigoInput}
                  onChange={(e) => setCodigoAmigoInput(e.target.value.toUpperCase())}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 uppercase font-bold tracking-wider focus:outline-none focus:border-slate-800"
                />
                <button
                  type="button"
                  disabled={resgatandoAmigo}
                  onClick={handleResgatarCodigoAmigo}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {resgatandoAmigo ? "..." : "Resgatar"}
                </button>
              </div>

              {mensagemAmigo && (
                <p
                  className={`text-[11px] font-bold mt-1.5 ${
                    mensagemAmigo.tipo === "sucesso" ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {mensagemAmigo.texto}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL AJUDA E SUPORTE (Consumo dinâmico de app_settings) */}
      {modalAjuda && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">Central de Ajuda 24h</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAjuda(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <a
                href={`https://wa.me/55${appSettings.whatsappSupport.replace(/\D/g, "")}?text=${encodeURIComponent("Olá, preciso de suporte no app PARTIU!")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between hover:bg-emerald-100/70 transition-all text-emerald-900 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Atendimento Humano Suporte</h4>
                    <p className="text-[10px] text-emerald-700">{appSettings.whatsappSupport}</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <a
                href={`tel:${appSettings.phoneEmergency.replace(/\D/g, "")}`}
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between hover:bg-rose-100/70 transition-all text-rose-900 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-600 text-white">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Emergência e Segurança</h4>
                    <p className="text-[10px] text-rose-700">Polícia Militar ({appSettings.phoneEmergency})</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800">Dúvidas Frequentes</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  • <strong>Como pagar?</strong> Ao finalizar a corrida, o motorista apresenta o QR Code do PIX na tela dele para você pagar diretamente pelo seu banco.
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  • <strong>Como funciona o PIN?</strong> No início da corrida ou entrega, informe o PIN de 4 dígitos ao motorista para validação segura.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL CONFIGURAÇÕES & CONFORTO (100% Ajustado às Funções Reais do App) */}
      {modalConfiguracoes && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">Configurações &amp; Conforto</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalConfiguracoes(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Notificações no Dispositivo */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Notificações do App
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bell className="h-4 w-4 text-slate-500" />
                    <div>
                      <span className="block font-bold text-slate-800">Notificações Push no Celular</span>
                      <span className="text-[10px] text-slate-400">Motorista a caminho e chegada</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushNotificacoes}
                    onChange={(e) => handleTogglePush(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="h-4 w-4 text-slate-500" />
                    <div>
                      <span className="block font-bold text-slate-800">Sons e Alertas Táteis</span>
                      <span className="text-[10px] text-slate-400">Vibrações e avisos de status</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sonsVibracao}
                    onChange={(e) => handleToggleSons(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 cursor-pointer"
                  />
                </div>
              </div>

              {/* Preferências de Viagem */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Preferências de Viagem
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Wind className="h-4 w-4" style={{ color: corPrimaria || "#FF6B00" }} />
                    <div>
                      <span className="block font-bold text-slate-800">Sempre solicitar ar-condicionado</span>
                      <span className="text-[10px] text-slate-400">Preferência padrão em carros</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={arCondicionado}
                    onChange={(e) => handleToggleAc(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: corPrimaria }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <VolumeX className="h-4 w-4 text-purple-500" />
                    <div>
                      <span className="block font-bold text-slate-800">Viagem Silenciosa</span>
                      <span className="text-[10px] text-slate-400">Sem música alta ou conversas</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={viagemSilenciosa}
                    onChange={(e) => handleToggleSilencio(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="block font-bold text-slate-800">Código PIN de Segurança</span>
                      <span className="text-[10px] text-slate-400">Validar 4 dígitos no embarque</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={exigirPin}
                    onChange={(e) => handleTogglePin(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalConfiguracoes(false)}
                className="w-full mt-2 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL CAPTAÇÃO MOTORISTA EXPRESS (SaaS Diária Fixa) */}
      {modalMotoristaExpress && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700">
                  Modelo Diária Fixa • 0% Taxa
                </span>
                <h3 className="text-sm font-bold text-slate-900">Quero Ser Motorista Partiu</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMotoristaExpress(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {candidaturaSucesso ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Candidatura Enviada!</h4>
                <p className="text-xs text-slate-500">
                  Nossa equipe de Itaperuna entrará em contato para liberação imediata da sua conta.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnviarCandidatura} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Seu Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-medium"
                    placeholder="Nome"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    WhatsApp para Contato
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-medium"
                    placeholder="(22) 99999-9999"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDriverVehicleType("CARRO")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      driverVehicleType === "CARRO"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Car className="h-3.5 w-3.5" />
                    Carro
                  </button>
                  <button
                    type="button"
                    onClick={() => setDriverVehicleType("MOTO")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                      driverVehicleType === "MOTO"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Bike className="h-3.5 w-3.5" />
                    Moto
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Modelo do Veículo
                  </label>
                  <input
                    type="text"
                    required
                    value={driverVehicleModel}
                    onChange={(e) => setDriverVehicleModel(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-medium"
                    placeholder="Ex: Onix 1.0 ou CG 160"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Placa do Veículo
                  </label>
                  <input
                    type="text"
                    required
                    value={driverPlate}
                    onChange={(e) => setDriverPlate(e.target.value.toUpperCase())}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-mono uppercase font-bold"
                    placeholder="BRA2E19"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviandoCandidatura}
                  className="w-full py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: corPrimaria, color: corTextoPrimaria }}
                >
                  {enviandoCandidatura ? "Enviando Dados..." : "Enviar Candidatura Expressa"}
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  Você também pode fazer o cadastro completo com CNH em{" "}
                  <Link to="/cadastro-motorista" onClick={onClose} className="underline font-bold text-slate-600">
                    cadastro completo
                  </Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 8. MODAL DA CENTRAL DE SEGURANÇA (NO MENU LATERAL) */}
      <SecurityCenterModal
        open={modalSeguranca}
        onClose={() => setModalSeguranca(false)}
      />
    </div>
  );
}
