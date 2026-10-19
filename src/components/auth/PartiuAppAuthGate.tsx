import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, useMemo } from "react";
import {
  Zap,
  ShieldCheck,
  Smartphone,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Radio,
  Loader2,
  Lock,
  User,
  KeyRound,
  FileText,
  Clock,
  TrendingUp,
  CreditCard,
  Edit2,
  Car,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { normalizarTelefoneBR } from "@/lib/passenger-cloud-sync";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { NativeButton, NativeInput, NativeSurface } from "@/components/native";
import {
  WhiteLabelToggle,
  WhiteLabelProgressBar,
  type RoleType,
} from "@/components/ui/white-label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { silentCatchWarn } from "@/lib/structured-logger";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { CameraPhotoCapture } from "@/components/common/CameraPhotoCapture";
import { whiteLabelEngine } from "@/lib/white-label/white-label-engine";
import { validarAcessoTerritorialParaCadastro } from "@/lib/geo/territory-guard";

export interface PartiuAppAuthGateProps {
  redirectDestination?: string | undefined;
  initialRole?: "PASSAGEIRO" | "MOTORISTA";
  initialTenantId?: string | undefined;
}

// Estados do fluxo de autenticação do Passageiro
type PassengerStep = "MAGIC_ENTRY" | "LOGIN_PASSWORD" | "LOGIN_OTP" | "SIGNUP_STEP_1";

// Estados da visão do Motorista Parceiro
type DriverView = "PORTAL" | "LOGIN";

export function PartiuAppAuthGate({
  redirectDestination,
  initialRole,
  initialTenantId,
}: PartiuAppAuthGateProps = {}) {
  const navigate = useNavigate();

  // Tenant ativo contextualizado para isolamento total entre franquias White-Label
  const currentTenantId = useMemo(() => {
    if (initialTenantId && initialTenantId.trim()) return initialTenantId.trim();
    if (typeof window !== "undefined") {
      try {
        const param =
          new URLSearchParams(window.location.search).get("tenant") ||
          new URLSearchParams(window.location.search).get("tenant_id");
        if (param && param.trim()) return param.trim();
      } catch {}
    }
    return whiteLabelEngine.getActiveTenantId() || "default";
  }, [initialTenantId]);

  // 1. Consumo do Tema White Label Global (Dados e Estilos Dinâmicos sem Hardcode)
  const { appConfig } = useTheme();
  const { branding, features } = appConfig;
  const { colors, ui, appName, logoUrl } = branding;

  // 2. Estado de Papel Ativo (Passageiro vs Motorista)
  const [activeRole, setActiveRole] = useState<RoleType>(() => {
    if (initialRole) return initialRole;
    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const r = urlParams.get("role")?.toUpperCase();
        if (r === "MOTORISTA" || r === "PASSAGEIRO") return r as RoleType;

        const savedRole = localStorage.getItem("partiu_last_role")?.toUpperCase();
        if (savedRole === "MOTORISTA" || savedRole === "PASSAGEIRO") return savedRole as RoleType;
      } catch {
        /* ignore */
      }
    }
    return "PASSAGEIRO";
  });

  useEffect(() => {
    if (initialRole) {
      setActiveRole(initialRole);
    }
  }, [initialRole]);

  // Persiste a preferência de papel no localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("partiu_last_role", activeRole);
      } catch {
        /* ignore */
      }
    }
  }, [activeRole]);

  // 3. Estados dos Fluxos
  const [passengerStep, setPassengerStep] = useState<PassengerStep>("MAGIC_ENTRY");
  const [driverView, setDriverView] = useState<DriverView>("PORTAL");

  // 4. Campos do Formulário
  const [contactInput, setContactInput] = useState("");
  const [detectedContactType, setDetectedContactType] = useState<"EMAIL" | "PHONE">("PHONE");
  const [recognizedUserName, setRecognizedUserName] = useState<string | null>(null);

  // Campos de Credenciais
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Campos de Cadastro (Step 1 - Dados Pessoais)
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState("");

  // OTP Celular
  const [otpCode, setOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Estados de Carregamento e Feedback
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validação Territorial Proativa para Novos Usuários
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [territorialBlock, setTerritorialBlock] = useState<{
    blocked: boolean;
    message: string;
  } | null>(null);

  // Consulta proativa de GPS para validação territorial de novos cadastros
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);

          const targetTenant =
            whiteLabelEngine.getTenantById(currentTenantId) || whiteLabelEngine.getActiveTenant();
          if (targetTenant) {
            const check = validarAcessoTerritorialParaCadastro(
              targetTenant,
              coords,
              null,
              whiteLabelEngine.getAllTenants(),
            );
            if (!check.permitido) {
              setTerritorialBlock({ blocked: true, message: check.mensagem });
            } else {
              setTerritorialBlock(null);
            }
          }
        },
        () => {
          /* Fallback silencioso caso GPS não seja compartilhado */
        },
        { enableHighAccuracy: false, timeout: 5000 },
      );
    }
  }, [currentTenantId]);

  // Verificação inicial de sessão ativa
  useEffect(() => {
    async function initGate() {
      try {
        const activeSession = await supabaseAuthService.checkAndHydrateSession(currentTenantId);
        if (activeSession) {
          const dest =
            redirectDestination ||
            (activeSession.role === "MOTORISTA"
              ? `/app/motorista?tenant=${encodeURIComponent(currentTenantId)}`
              : activeSession.role === "ADMIN"
                ? "/app/admin"
                : `/app?tenant=${encodeURIComponent(currentTenantId)}`);
          void navigate({ to: dest, replace: true });
          return;
        }
      } catch (err) {
        silentCatchWarn("PartiuAppAuthGate:initGate", err);
      }
      setCheckingSession(false);
    }

    void initGate();
  }, [navigate, redirectDestination, activeRole, currentTenantId]);

  // Contagem regressiva de reenvio de OTP
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const interval = setInterval(() => setOtpCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [otpCountdown]);

  // Garante que ao entrar na etapa de cadastro o botão de ação fique visível e acessível
  useEffect(() => {
    if (passengerStep !== "SIGNUP_STEP_1") return undefined;
    const timer = setTimeout(() => {
      const btn = document.getElementById("btn-confirmar-cadastro");
      if (btn) {
        btn.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [passengerStep]);

  // Tratamento Inteligente de Entrada do Contato (Celular ou E-mail)
  function handleContactInputChange(val: string) {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Se o usuário estiver digitando números, aplica máscara brasileira de telefone automaticamente
    const digitsOnly = val.replace(/\D/g, "");
    const hasAtSign = val.includes("@");

    if (
      hasAtSign ||
      (val.length > 0 && isNaN(Number(val[0])) && val[0] !== "(" && val[0] !== "+")
    ) {
      // É digitado como e-mail
      setContactInput(val);
      setDetectedContactType("EMAIL");
    } else if (digitsOnly.length > 0) {
      // Aplica formatação de telefone BR
      const { formatado } = normalizarTelefoneBR(val);
      setContactInput(formatado || val);
      setDetectedContactType("PHONE");
    } else {
      setContactInput(val);
    }
  }

  // Máscaras de Cadastro
  function handleCpfChange(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 11);
    let mask = raw;
    if (raw.length > 9) {
      mask = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
    } else if (raw.length > 6) {
      mask = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    } else if (raw.length > 3) {
      mask = `${raw.slice(0, 3)}.${raw.slice(3)}`;
    }
    setCpf(mask);
  }

  function handleTelefoneChange(val: string) {
    const { formatado } = normalizarTelefoneBR(val);
    setTelefone(formatado || val);
  }

  // ===========================================================================
  // ⚡ MAGIC FLOW: Checagem Unificada de Contato (Celular ou E-mail)
  // ===========================================================================
  async function handleMagicFlowSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanInput = contactInput.trim();
    if (!cleanInput) {
      setErrorMessage("Informe seu número de celular com DDD ou seu e-mail.");
      return;
    }

    const isEmail = cleanInput.includes("@");
    if (isEmail) {
      if (!cleanInput.includes(".") || cleanInput.length < 5) {
        setErrorMessage("Por favor, informe um endereço de e-mail válido.");
        return;
      }
    } else {
      const norm = normalizarTelefoneBR(cleanInput);
      if (!norm.valido) {
        setErrorMessage("Informe um celular válido com DDD (ex: 82 99841-2940).");
        return;
      }
    }

    setLoading(true);
    try {
      const checkResult = await supabaseAuthService.checkContactExists(
        cleanInput,
        activeRole,
        currentTenantId,
      );
      setLoading(false);

      setDetectedContactType(checkResult.contactType);
      setRecognizedUserName(checkResult.userName || null);

      if (checkResult.exists) {
        // Usuário EXISTE -> Direciona para o Fluxo de Login por Senha
        setEmail(cleanInput);
        setPassengerStep("LOGIN_PASSWORD");
        if (checkResult.userName) {
          setSuccessMessage(
            `Conta reconhecida! Olá, ${checkResult.userName}. Digite sua senha para entrar.`,
          );
        } else {
          setSuccessMessage("Conta encontrada! Digite sua senha de acesso para entrar.");
        }
      } else {
        // Usuário NÃO EXISTE -> Direciona para o Formulário de Cadastro (Step 1)
        if (checkResult.contactType === "EMAIL") {
          setEmail(cleanInput);
        } else {
          setTelefone(checkResult.formattedContact);
        }
        setPassengerStep("SIGNUP_STEP_1");
        setSuccessMessage("Novo por aqui? Preencha seus dados para criar sua conta gratuita!");
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Erro ao consultar informações. Tente novamente.");
    }
  }

  // ===========================================================================
  // 🔑 LOGIN: Verificação de OTP por Celular (Passageiro)
  // ===========================================================================
  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMessage("Informe o código de verificação recebido.");
      return;
    }

    setLoading(true);
    const res = await supabaseAuthService.verifyPhoneOtp({
      phone: contactInput,
      otpCode,
      role: activeRole,
    });
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Código de verificação inválido ou expirado.");
      return;
    }

    setSuccessMessage("Acesso validado com sucesso! Entrando...");
    setTimeout(() => {
      const target = redirectDestination || res.redirectUrl || "/app";
      const scopedDest = target.includes("tenant=")
        ? target
        : `${target}${target.includes("?") ? "&" : "?"}tenant=${encodeURIComponent(currentTenantId)}`;
      void navigate({ to: scopedDest, replace: true });
    }, 300);
  }

  // ===========================================================================
  // 🔑 LOGIN: Autenticação por Senha (Passageiro ou Motorista)
  // ===========================================================================
  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const loginIdentifier =
      activeRole === "MOTORISTA" ? email || contactInput : email || contactInput;

    if (!loginIdentifier) {
      setErrorMessage("Informe seu e-mail ou celular de acesso.");
      return;
    }
    if (!senha || senha.length < 4) {
      setErrorMessage("Informe sua senha de acesso.");
      return;
    }

    setLoading(true);
    const res = await supabaseAuthService.signInWithEmail({
      email: loginIdentifier,
      senha,
      role: activeRole,
      tenantId: currentTenantId,
    });
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Credenciais inválidas para esta praça. Verifique os dados.");
      return;
    }

    setSuccessMessage("Autenticado com sucesso! Redirecionando...");
    setTimeout(() => {
      const target =
        redirectDestination ||
        res.redirectUrl ||
        (activeRole === "MOTORISTA" ? "/app/motorista" : "/app");
      const scopedDest = target.includes("tenant=")
        ? target
        : `${target}${target.includes("?") ? "&" : "?"}tenant=${encodeURIComponent(currentTenantId)}`;
      void navigate({ to: scopedDest, replace: true });
    }, 300);
  }

  // ===========================================================================
  // 📝 CADASTRO STEP 1: Conclusão de Registro do Passageiro
  // ===========================================================================
  async function handlePassengerSignUp(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!nome || nome.trim().length < 3) {
      setErrorMessage("Informe seu nome completo (ao menos 3 letras).");
      return;
    }
    if (!email || !email.includes("@")) {
      setErrorMessage("Informe um endereço de e-mail válido.");
      return;
    }
    const norm = normalizarTelefoneBR(telefone);
    if (!norm.valido) {
      setErrorMessage("Informe um celular válido com DDD.");
      return;
    }
    if (features.requireCpfOnSignup && cpf.replace(/\D/g, "").length !== 11) {
      setErrorMessage("Informe um CPF válido com 11 dígitos.");
      return;
    }
    if (!senha || senha.length < 6) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (territorialBlock?.blocked) {
      setErrorMessage(territorialBlock.message);
      return;
    }
    const finalAvatar =
      fotoPerfilUrl ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome.trim() || email)}`;

    setLoading(true);
    const res = await supabaseAuthService.signUpPassenger({
      name: nome,
      email,
      phone: telefone,
      cpf,
      password: senha,
      avatarUrl: finalAvatar,
      tenantId: currentTenantId,
      coordinates: userLocation,
    });
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Não foi possível concluir o cadastro.");
      return;
    }

    setSuccessMessage("Conta criada com sucesso! Redirecionando...");
    setTimeout(() => {
      const target = redirectDestination || res.redirectUrl || "/app";
      const scopedDest = target.includes("tenant=")
        ? target
        : `${target}${target.includes("?") ? "&" : "?"}tenant=${encodeURIComponent(currentTenantId)}`;
      void navigate({ to: scopedDest, replace: true });
    }, 400);
  }

  // Recuperação de Senha
  async function handleForgotPassword() {
    const targetEmail = email || contactInput;
    if (!targetEmail || !targetEmail.includes("@")) {
      setErrorMessage("Digite seu e-mail para receber as instruções de redefinição.");
      return;
    }
    setLoading(true);
    const res = await supabaseAuthService.resetPassword(targetEmail);
    setLoading(false);
    setSuccessMessage(res.message);
  }

  // Carregamento de Inicialização
  if (checkingSession) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg mb-3 animate-pulse"
          style={{ backgroundColor: colors.primary }}
        >
          <Zap className="h-7 w-7 stroke-[2.5] text-white" />
        </div>
        <p className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
          Carregando {appName}...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col font-sans transition-colors duration-200 overflow-x-hidden overflow-y-auto bg-slate-50"
      style={{
        backgroundColor: colors.background,
        color: colors.textPrimary,
        fontFamily: ui.fontFamily,
      }}
    >
      {/* ===================================================================== */}
      {/* 1. BARRA SUPERIOR MINIMALISTA COM LOGO E TOGGLE PASSAGEIRO/MOTORISTA  */}
      {/* ===================================================================== */}
      <header className="w-full max-w-md mx-auto px-4 pt-[max(0.75rem,calc(env(safe-area-inset-top,0px)+0.5rem))] pb-2 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-[11px] font-semibold transition h-7 px-2.5 rounded-full hover:opacity-85 active:scale-95 cursor-pointer shadow-2xs"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.inputBorder}`,
            color: colors.textSecondary,
          }}
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Início</span>
        </Link>

        {/* Logo Centralizado da Marca (White Label com fallback oficial Partiu 3D) */}
        <div className="flex items-center gap-2">
          <img
            src={logoUrl || "/assets/partiu-logo-transparent.png"}
            alt={appName}
            className="h-7.5 max-w-[130px] object-contain drop-shadow-xs"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Espaçador simétrico para manter o logo centralizado */}
        <div className="w-12" />
      </header>

      {/* ===================================================================== */}
      {/* 2. ÁREA CENTRAL DO NOVO FLUXO UNIFICADO (MAGIC FLOW)                  */}
      {/* ===================================================================== */}
      <main className="flex-1 w-full max-w-md mx-auto px-3.5 sm:px-6 py-2 sm:py-4 flex flex-col justify-start pb-6 sm:pb-8">
        {/* Toggle Sutil no Topo com Animação Fluida (Passageiro vs Motorista) */}
        <div className="mb-4 sm:mb-6">
          <WhiteLabelToggle
            activeRole={activeRole}
            onChange={(role) => {
              setActiveRole(role);
              setErrorMessage(null);
              setSuccessMessage(null);
              // Reseta estados para telas iniciais limpas
              if (role === "PASSAGEIRO") {
                setPassengerStep("MAGIC_ENTRY");
              } else {
                setDriverView("PORTAL");
              }
            }}
          />
        </div>

        {/* Feedback Messages (Alto Contraste com Ação Direta para Criar Conta) */}
        {errorMessage && (
          <div className="mb-3.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
            {(errorMessage.toLowerCase().includes("não encontrada") ||
              errorMessage.toLowerCase().includes("crie") ||
              errorMessage.toLowerCase().includes("outra franquia") ||
              errorMessage.toLowerCase().includes("não encontrado") ||
              errorMessage.toLowerCase().includes("credenciais")) && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  if (activeRole === "PASSAGEIRO") {
                    setPassengerStep("SIGNUP_STEP_1");
                  } else {
                    void navigate({ to: "/cadastro-motorista" });
                  }
                }}
                className="w-full sm:w-auto shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition hover:brightness-105 active:scale-95 cursor-pointer"
                style={{ backgroundColor: colors.primary }}
              >
                <span>Criar conta</span>
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-3.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-snug">{successMessage}</span>
            </div>
            {passengerStep === "SIGNUP_STEP_1" && (
              <button
                type="button"
                onClick={() => {
                  const targetBtn = document.getElementById("btn-confirmar-cadastro");
                  if (targetBtn) {
                    targetBtn.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                className="w-full sm:w-auto shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition hover:brightness-105 active:scale-95 cursor-pointer"
                style={{ backgroundColor: colors.primary }}
              >
                <span>Criar conta</span>
              </button>
            )}
          </div>
        )}

        {/* SUPERFÍCIE DO DESIGN SYSTEM: CARD BRANCO FLUTUANTE ELEVADO COM CUSTOMIZAÇÃO DO FRANQUEADO */}
        <div
          className="w-full p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xl sm:shadow-2xl shadow-slate-200/50 space-y-5 transition-all duration-300"
          style={{ borderRadius: ui.borderRadius || "1.5rem" }}
        >
          {/* =================================================================== */}
          {/* FLUXO DO PASSAGEIRO                                                 */}
          {/* =================================================================== */}
          {activeRole === "PASSAGEIRO" && (
            <>
              {/* ETAPA 1 DO PASSAGEIRO: FLUXO UNIFICADO (MAGIC FLOW) */}
              {passengerStep === "MAGIC_ENTRY" && (
                <form onSubmit={handleMagicFlowSubmit} className="space-y-4">
                  {/* Cabeçalho do Card Padrão Design System */}
                  <div className="text-center">
                    <h1
                      className="text-xl sm:text-[22px] font-black tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Acesso do Passageiro
                    </h1>
                    <p className="text-xs mt-1 font-normal" style={{ color: colors.textSecondary }}>
                      Informe seu celular ou e-mail para acessar ou criar sua conta.
                    </p>
                    {/* Barra de destaque na cor primária do Franqueado */}
                    <div
                      className="w-8 h-1 rounded-full mx-auto mt-2.5 mb-5 transition-colors"
                      style={{ backgroundColor: colors.primary }}
                    />
                  </div>

                  {/* Input com Ícone Nativo e Botão de Limpar */}
                  <NativeInput
                    label="Celular ou E-mail"
                    value={contactInput}
                    onChange={(e) => handleContactInputChange(e.target.value)}
                    placeholder="Ex: (82) 99841-2940 ou seu@email.com"
                    autoFocus
                    required
                    showClearButton
                    onClear={() => {
                      setContactInput("");
                      setErrorMessage(null);
                    }}
                    leftIcon={
                      detectedContactType === "EMAIL" ? (
                        <Mail className="w-4 h-4 text-slate-400" />
                      ) : (
                        <div className="flex items-center gap-1 pl-0.5 text-xs font-black text-slate-700 dark:text-slate-200 select-none">
                          <span className="text-sm leading-none">🇧🇷</span>
                          <span>+55</span>
                        </div>
                      )
                    }
                  />

                  {/* Botão Primário Estilo Design System */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: ui.borderRadius || "0.75rem",
                    }}
                    className="w-full py-3.5 px-4 text-white text-xs sm:text-sm font-black tracking-wide shadow-md flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    <span>➔</span>
                    <span>{loading ? "Verificando..." : "CONTINUAR"}</span>
                  </button>

                  {/* Ação Direta para Confirmar Criação de Conta */}
                  <div className="pt-1.5 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        const cleanInput = contactInput.trim();
                        if (cleanInput.includes("@")) {
                          setEmail(cleanInput);
                        } else if (cleanInput) {
                          setTelefone(cleanInput);
                        }
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setPassengerStep("SIGNUP_STEP_1");
                      }}
                      style={{
                        borderColor: colors.primary,
                        color: colors.primary,
                        borderRadius: ui.borderRadius || "0.75rem",
                      }}
                      className="w-full py-2.5 px-4 border-2 text-xs font-black tracking-wide shadow-xs flex items-center justify-center gap-2 transition hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                    >
                      <span>➔</span>
                      <span>CONFIRMAR CRIAÇÃO DE CONTA</span>
                    </button>

                    <div className="text-center pt-0.5">
                      <Link
                        to="/escolher-tipo-cadastro"
                        className="inline-flex items-center justify-center text-xs font-medium hover:underline cursor-pointer transition-colors"
                        style={{ color: colors.textSecondary }}
                      >
                        Não tem uma conta?{" "}
                        <span
                          className="ml-1 font-bold underline"
                          style={{ color: colors.primary }}
                        >
                          Cadastre-se
                        </span>
                      </Link>
                    </div>
                  </div>

                  {/* Rodapé Interno do Card */}
                  <div className="border-t border-slate-100 pt-3.5 mt-5">
                    <p className="text-[11px] text-slate-400 text-center">
                      © {new Date().getFullYear()} {appName} · Mobilidade conectada
                    </p>
                  </div>
                </form>
              )}

              {/* ETAPA 2A: LOGIN COM CÓDIGO SMS */}
              {passengerStep === "LOGIN_OTP" && (
                <form
                  onSubmit={handleVerifyOtp}
                  className="space-y-4 animate-in fade-in duration-200"
                >
                  <div className="text-center">
                    <div
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2"
                      style={{
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                      }}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{contactInput}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPassengerStep("MAGIC_ENTRY");
                          setErrorMessage(null);
                        }}
                        className="ml-1.5 text-xs font-semibold hover:underline cursor-pointer"
                        style={{ color: colors.primary }}
                      >
                        Trocar
                      </button>
                    </div>

                    <h2
                      className="text-xl sm:text-[22px] font-black tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Código de Confirmação
                    </h2>
                    <p className="text-xs mt-1 font-normal" style={{ color: colors.textSecondary }}>
                      Digite o código de 6 dígitos enviado por SMS.
                    </p>
                    <div
                      className="w-8 h-1 rounded-full mx-auto mt-2.5 mb-5 transition-colors"
                      style={{ backgroundColor: colors.primary }}
                    />
                  </div>

                  {/* INPUT OTP */}
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(val) => setOtpCode(val.replace(/\D/g, "").slice(0, 6))}
                      autoFocus
                    >
                      <InputOTPGroup className="gap-2 sm:gap-2.5">
                        <InputOTPSlot
                          index={0}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all"
                        />
                        <InputOTPSlot
                          index={1}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all"
                        />
                        <InputOTPSlot
                          index={2}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all"
                        />
                        <InputOTPSlot
                          index={3}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all"
                        />
                        <InputOTPSlot
                          index={4}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all"
                        />
                        <InputOTPSlot
                          index={5}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: ui.borderRadius || "0.75rem",
                    }}
                    className="w-full py-3 px-4 text-white text-xs font-black tracking-wide shadow-md flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-4"
                  >
                    <span>➔</span>
                    <span>{loading ? "Validando..." : "CONFIRMAR E ENTRAR"}</span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      disabled={otpCountdown > 0}
                      onClick={handleMagicFlowSubmit}
                      className="py-1 flex items-center font-semibold hover:underline disabled:opacity-50 cursor-pointer"
                      style={{ color: colors.textSecondary }}
                    >
                      {otpCountdown > 0 ? `Reenviar em ${otpCountdown}s` : "Reenviar SMS"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPassengerStep("LOGIN_PASSWORD")}
                      className="py-1 flex items-center font-semibold hover:underline cursor-pointer"
                      style={{ color: colors.primary }}
                    >
                      Entrar com senha
                    </button>
                  </div>

                  {/* Rodapé Interno do Card */}
                  <div className="border-t border-slate-100 pt-3.5 mt-5">
                    <p className="text-[11px] text-slate-400 text-center">
                      © {new Date().getFullYear()} {appName} · Mobilidade conectada
                    </p>
                  </div>
                </form>
              )}

              {/* ETAPA 2B: LOGIN COM SENHA */}
              {passengerStep === "LOGIN_PASSWORD" && (
                <form
                  onSubmit={handlePasswordLogin}
                  className="space-y-4 animate-in fade-in duration-200"
                >
                  <div className="text-center">
                    <div
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2"
                      style={{
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                      }}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{contactInput}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPassengerStep("MAGIC_ENTRY");
                          setErrorMessage(null);
                        }}
                        className="ml-1.5 text-xs font-semibold hover:underline cursor-pointer"
                        style={{ color: colors.primary }}
                      >
                        Trocar
                      </button>
                    </div>

                    <h2
                      className="text-xl sm:text-[22px] font-black tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      {recognizedUserName
                        ? `Olá, ${recognizedUserName.split(" ")[0]}!`
                        : "Bem-vindo de Volta"}
                    </h2>
                    <p className="text-xs mt-1 font-normal" style={{ color: colors.textSecondary }}>
                      Digite sua senha para acessar sua conta de passageiro.
                    </p>
                    <div
                      className="w-8 h-1 rounded-full mx-auto mt-2.5 mb-5 transition-colors"
                      style={{ backgroundColor: colors.primary }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition"
                        style={{
                          borderRadius: ui.borderRadius || "0.5rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: ui.borderRadius || "0.75rem",
                    }}
                    className="w-full py-3.5 px-4 text-white text-xs sm:text-sm font-black tracking-wide shadow-md flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-4"
                  >
                    <span>➔</span>
                    <span>{loading ? "Autenticando..." : "ENTRAR"}</span>
                  </button>

                  {/* Ação Alternativa: Confirmar Criação de Conta se não possuir senha/conta */}
                  <div className="pt-1.5 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setPassengerStep("SIGNUP_STEP_1");
                      }}
                      style={{
                        borderColor: colors.primary,
                        color: colors.primary,
                        borderRadius: ui.borderRadius || "0.75rem",
                      }}
                      className="w-full py-2.5 px-4 border text-xs font-bold tracking-wide shadow-xs flex items-center justify-center gap-2 transition hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                    >
                      <span>Criar uma nova conta</span>
                    </button>

                    <div className="text-center pt-0.5">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs font-semibold hover:underline cursor-pointer transition-colors"
                        style={{ color: colors.primary }}
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>
                  </div>

                  {/* Rodapé Interno do Card */}
                  <div className="border-t border-slate-100 pt-3.5 mt-5">
                    <p className="text-[11px] text-slate-400 text-center">
                      © {new Date().getFullYear()} {appName} · Mobilidade conectada
                    </p>
                  </div>
                </form>
              )}

              {/* ETAPA 2C: CADASTRO STEP 1 (DADOS PESSOAIS) */}
              {passengerStep === "SIGNUP_STEP_1" && (
                <form
                  onSubmit={handlePassengerSignUp}
                  className="space-y-3.5 animate-in fade-in duration-200"
                >
                  <div className="text-center">
                    <h2
                      className="text-xl sm:text-[22px] font-black tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Criar Nova Conta
                    </h2>
                    <p className="text-xs mt-1 font-normal" style={{ color: colors.textSecondary }}>
                      Preencha seus dados para começar a pedir corridas.
                    </p>
                    <div
                      className="w-8 h-1 rounded-full mx-auto mt-2.5 mb-4 transition-colors"
                      style={{ backgroundColor: colors.primary }}
                    />
                  </div>

                  {/* Aviso de Bloqueio Territorial (se fora da praça autorizada) */}
                  {territorialBlock?.blocked && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-bold text-amber-950 dark:text-amber-100">
                          Área de Atendimento Exclusiva
                        </p>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                          {territorialBlock.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Foto Oficial de Identificação */}
                  <CameraPhotoCapture
                    label="Foto Oficial de Identificação"
                    sublabel="Tire uma selfie nítida pela câmera para identificação oficial"
                    value={fotoPerfilUrl}
                    onChange={(url) => setFotoPerfilUrl(url)}
                    required
                  />

                  {/* Nome Completo */}
                  <NativeInput
                    label="Nome Completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como deseja ser chamado(a)"
                    required
                    leftIcon={<User className="w-4 h-4 text-slate-400" />}
                  />

                  {/* CPF e Celular em Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {features.requireCpfOnSignup && (
                      <NativeInput
                        label="CPF"
                        value={cpf}
                        onChange={(e) => handleCpfChange(e.target.value)}
                        placeholder="000.000.000-00"
                        required
                        leftIcon={<FileText className="w-4 h-4 text-slate-400" />}
                      />
                    )}
                    <NativeInput
                      label="Celular"
                      value={telefone}
                      onChange={(e) => handleTelefoneChange(e.target.value)}
                      placeholder="(82) 99841-2940"
                      required
                      leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
                    />
                  </div>

                  {/* E-mail */}
                  <NativeInput
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  />

                  {/* Senha */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">
                      Criar Senha de Acesso
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Mínimo 6 dígitos"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition"
                        style={{
                          borderRadius: ui.borderRadius || "0.5rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bloco de Ação: Confirmar Criação de Conta e Ir para o Login */}
                  <div className="pt-2 space-y-2.5">
                    <button
                      id="btn-confirmar-cadastro"
                      type="submit"
                      disabled={loading || Boolean(territorialBlock?.blocked)}
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: ui.borderRadius || "0.75rem",
                      }}
                      className="w-full py-3.5 px-4 text-white text-xs sm:text-sm font-bold tracking-wide shadow-md flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cadastrando...</span>
                        </>
                      ) : territorialBlock?.blocked ? (
                        <span>Cadastro indisponível nesta região</span>
                      ) : (
                        <span>Criar minha conta</span>
                      )}
                    </button>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setPassengerStep("MAGIC_ENTRY");
                          setErrorMessage(null);
                        }}
                        className="text-xs font-semibold hover:underline cursor-pointer py-1 transition-colors"
                        style={{ color: colors.textSecondary }}
                      >
                        Já tem uma conta?{" "}
                        <span
                          className="font-extrabold underline ml-1"
                          style={{ color: colors.primary }}
                        >
                          Ir para o login
                        </span>
                      </button>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPassengerStep("MAGIC_ENTRY");
                          setErrorMessage(null);
                        }}
                        className="text-xs font-medium hover:underline cursor-pointer py-1 transition-colors"
                        style={{ color: colors.textSecondary }}
                      >
                        Trocar contato
                      </button>
                    </div>
                  </div>

                  {/* Rodapé Interno do Card */}
                  <div className="border-t border-slate-100 pt-3.5 mt-5">
                    <p className="text-[11px] text-slate-400 text-center">
                      © {new Date().getFullYear()} {appName} · Mobilidade conectada
                    </p>
                  </div>
                </form>
              )}
            </>
          )}

          {/* =================================================================== */}
          {/* FLUXO DO MOTORISTA PARCEIRO                                         */}
          {/* =================================================================== */}
          {activeRole === "MOTORISTA" && (
            <>
              {/* VISÃO 1: PORTAL DO MOTORISTA */}
              {driverView === "PORTAL" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-center">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2"
                      style={{
                        backgroundColor: colors.inputBackground,
                        color: colors.primary,
                      }}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      Portal do Parceiro
                    </span>

                    <h1
                      className="text-xl sm:text-[22px] font-black tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Dirija com a {appName}
                    </h1>

                    <p className="text-xs mt-1 font-normal" style={{ color: colors.textSecondary }}>
                      Planos a partir de 0% de taxa e repasse imediato via PIX D+0.
                    </p>
                    <div
                      className="w-8 h-1 rounded-full mx-auto mt-2.5 mb-5 transition-colors"
                      style={{ backgroundColor: colors.primary }}
                    />
                  </div>

                  {/* Benefícios Rápidos em Grid Compacta */}
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="flex flex-col items-start gap-1 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                      <span
                        className="px-1.5 py-0.5 rounded font-black text-[10px] inline-block"
                        style={{
                          backgroundColor: `${colors.primary}18`,
                          color: colors.primary,
                        }}
                      >
                        0% Taxa
                      </span>
                      <h4
                        className="text-xs font-bold leading-tight"
                        style={{ color: colors.textPrimary }}
                      >
                        Plano Diário
                      </h4>
                      <p className="text-[10px] leading-tight text-slate-500">
                        100% do valor da corrida é seu.
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-1 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                      <span
                        className="px-1.5 py-0.5 rounded font-black text-[10px] inline-block"
                        style={{
                          backgroundColor: `${colors.primary}18`,
                          color: colors.primary,
                        }}
                      >
                        Pix D+0
                      </span>
                      <h4
                        className="text-xs font-bold leading-tight"
                        style={{ color: colors.textPrimary }}
                      >
                        Repasse Imediato
                      </h4>
                      <p className="text-[10px] leading-tight text-slate-500">
                        Direto na sua conta bancária.
                      </p>
                    </div>
                  </div>

                  {/* BOTÃO PRINCIPAL: CADASTRO DE VEÍCULO */}
                  <div className="space-y-2 pt-2">
                    <Link to="/cadastro-motorista" className="w-full block">
                      <button
                        type="button"
                        style={{
                          backgroundColor: colors.primary,
                          borderRadius: ui.borderRadius || "0.75rem",
                        }}
                        className="w-full py-3 px-4 text-white text-xs font-black tracking-wide shadow-md flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-[0.98] cursor-pointer"
                      >
                        <span>➔</span>
                        <span>CADASTRAR MEU VEÍCULO</span>
                      </button>
                    </Link>

                    {/* LINK SECUNDÁRIO: "JÁ TENHO CONTA DE MOTORISTA" */}
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDriverView("LOGIN");
                          setErrorMessage(null);
                        }}
                        className="text-xs font-semibold hover:underline cursor-pointer transition-colors"
                        style={{ color: colors.primary }}
                      >
                        Já sou parceiro (Entrar com e-mail/celular e senha)
                      </button>
                    </div>
                  </div>

                  {/* Rodapé Interno do Card */}
                  <div className="border-t border-slate-100 pt-3.5 mt-5">
                    <p className="text-[11px] text-slate-400 text-center">
                      © {new Date().getFullYear()} {appName} · Mobilidade conectada
                    </p>
                  </div>
                </div>
              )}

              {/* VISÃO 2: LOGIN DO MOTORISTA PARCEIRO */}
              {driverView === "LOGIN" && (
                <form
                  onSubmit={handlePasswordLogin}
                  className="space-y-4 animate-in fade-in duration-200"
                >
                  <div className="text-center">
                    <h2
                      className="text-xl sm:text-[22px] font-black tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Cockpit do Motorista
                    </h2>
                    <p className="text-xs mt-1 font-normal" style={{ color: colors.textSecondary }}>
                      Informe suas credenciais para gerenciar suas corridas.
                    </p>
                    <div
                      className="w-8 h-1 rounded-full mx-auto mt-2.5 mb-5 transition-colors"
                      style={{ backgroundColor: colors.primary }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">
                      E-mail ou Celular Cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="motorista@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition"
                        style={{
                          borderRadius: ui.borderRadius || "0.5rem",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">
                      Senha de Acesso
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Sua senha de motorista"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition"
                        style={{
                          borderRadius: ui.borderRadius || "0.5rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: ui.borderRadius || "0.75rem",
                    }}
                    className="w-full py-3.5 px-4 text-white text-xs sm:text-sm font-black tracking-wide shadow-md flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-4"
                  >
                    <span>➔</span>
                    <span>{loading ? "Autenticando..." : "ENTRAR NO COCKPIT"}</span>
                  </button>

                  {/* Ação Alternativa: Confirmar Criação de Conta de Parceiro */}
                  <div className="pt-1.5 space-y-2">
                    <Link to="/cadastro-motorista" className="block w-full">
                      <button
                        type="button"
                        style={{
                          borderColor: colors.primary,
                          color: colors.primary,
                          borderRadius: ui.borderRadius || "0.75rem",
                        }}
                        className="w-full py-2.5 px-4 border-2 text-xs font-black tracking-wide shadow-xs flex items-center justify-center gap-2 transition hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
                      >
                        <span>➔</span>
                        <span>CONFIRMAR CRIAÇÃO DE CONTA</span>
                      </button>
                    </Link>

                    <div className="space-y-1.5 text-center pt-0.5">
                      <div>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs font-semibold hover:underline cursor-pointer transition-colors"
                          style={{ color: colors.primary }}
                        >
                          Esqueceu sua senha?
                        </button>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setDriverView("PORTAL")}
                          className="text-xs font-medium hover:underline cursor-pointer transition-colors"
                          style={{ color: colors.textSecondary }}
                        >
                          Voltar ao Portal do Parceiro
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé Interno do Card */}
                  <div className="border-t border-slate-100 pt-3.5 mt-5">
                    <p className="text-[11px] text-slate-400 text-center">
                      © {new Date().getFullYear()} {appName} · Mobilidade conectada
                    </p>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* =================================================================== */}
        {/* BADGES DE CONFIANÇA DO ECOSSISTEMA                                  */}
        {/* =================================================================== */}
        <div className="pt-3 pb-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div
              className="flex flex-col items-center p-2 rounded-xl border transition-all"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
              }}
            >
              <ShieldCheck
                className="w-4 h-4 mb-0.5 stroke-[2]"
                style={{ color: colors.primary }}
              />
              <span
                className="text-[11px] font-bold leading-tight"
                style={{ color: colors.textPrimary }}
              >
                Seguro
              </span>
              <span className="text-[9px] leading-tight" style={{ color: colors.textSecondary }}>
                em cada viagem
              </span>
            </div>

            <div
              className="flex flex-col items-center p-2 rounded-xl border transition-all"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
              }}
            >
              <Zap className="w-4 h-4 mb-0.5 stroke-[2]" style={{ color: colors.primary }} />
              <span
                className="text-[11px] font-bold leading-tight"
                style={{ color: colors.textPrimary }}
              >
                Rápido
              </span>
              <span className="text-[9px] leading-tight" style={{ color: colors.textSecondary }}>
                e prático
              </span>
            </div>

            <div
              className="flex flex-col items-center p-2 rounded-xl border transition-all"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
              }}
            >
              <MapPin className="w-4 h-4 mb-0.5 stroke-[2]" style={{ color: colors.primary }} />
              <span
                className="text-[11px] font-bold leading-tight"
                style={{ color: colors.textPrimary }}
              >
                Na sua cidade
              </span>
              <span className="text-[9px] leading-tight" style={{ color: colors.textSecondary }}>
                sempre perto
              </span>
            </div>

            <div
              className="flex flex-col items-center p-2 rounded-xl border transition-all"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
              }}
            >
              <CheckCircle2
                className="w-4 h-4 mb-0.5 stroke-[2]"
                style={{ color: colors.primary }}
              />
              <span
                className="text-[11px] font-bold leading-tight"
                style={{ color: colors.textPrimary }}
              >
                Tarifa Justa
              </span>
              <span className="text-[9px] leading-tight" style={{ color: colors.textSecondary }}>
                sem surpresas
              </span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. RODAPÉ DE SEGURANÇA E CONFORMIDADE                               */}
        {/* =================================================================== */}
        <footer className="w-full text-center py-3 space-y-1 select-none">
          <div
            className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold"
            style={{ color: colors.textSecondary }}
          >
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <ShieldCheck className="h-3 w-3" /> Conexão Segura SSL
            </span>
            <span>•</span>
            <span>Conforme LGPD</span>
            <span>•</span>
            <span>PIX Instantâneo</span>
          </div>
          <p className="text-[10px]" style={{ color: colors.textSecondary }}>
            © {new Date().getFullYear()} {appName}. Todos os direitos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
}
