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
} from "lucide-react";
import { supabaseAuthService, type AuthUserProfile } from "@/lib/auth/supabase-auth-service";
import { googleAuthService } from "@/lib/auth/google-auth-service";
import { normalizarTelefoneBR } from "@/lib/passenger-cloud-sync";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import {
  NativeButton,
  NativeInput,
  NativeSurface,
} from "@/components/native";
import {
  WhiteLabelToggle,
  WhiteLabelProgressBar,
  type RoleType,
} from "@/components/ui/white-label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { silentCatchWarn } from "@/lib/structured-logger";
import { GoogleIcon } from "@/components/common/GoogleIcon";

export interface PartiuAppAuthGateProps {
  redirectDestination?: string | undefined;
  initialRole?: "PASSAGEIRO" | "MOTORISTA";
}

// Estados do fluxo de autenticação do Passageiro
type PassengerStep = "MAGIC_ENTRY" | "LOGIN_PASSWORD" | "LOGIN_OTP" | "SIGNUP_STEP_1";

// Estados da visão do Motorista Parceiro
type DriverView = "PORTAL" | "LOGIN";

export function PartiuAppAuthGate({
  redirectDestination,
  initialRole,
}: PartiuAppAuthGateProps = {}) {
  const navigate = useNavigate();

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

  // OTP Celular
  const [otpCode, setOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Estados de Carregamento e Feedback
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [loadingGoogle, setLoadingGoogle] = useState(false);

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoadingGoogle(true);
    try {
      const res = await supabaseAuthService.signInWithGoogle({
        role: activeRole,
        redirectUrl: redirectDestination || (activeRole === "MOTORISTA" ? "/app/motorista" : "/app"),
      });
      if (res.success && res.redirectUrl && !res.redirectUrl.startsWith("http")) {
        void navigate({ to: res.redirectUrl as any });
      } else if (!res.success && res.error && !res.error.includes("Google Client ID")) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha ao autenticar com o Google. Tente novamente.");
    } finally {
      setLoadingGoogle(false);
    }
  }

  // Verificação inicial de sessão ativa e retorno de OAuth
  useEffect(() => {
    async function initGate() {
      try {
        // Se a janela for um popup de autenticação do Google, envia mensagem para a janela pai e fecha
        if (typeof window !== "undefined" && window.opener && window.location.hash.includes("access_token")) {
          window.opener.postMessage(
            { type: "GOOGLE_AUTH_CALLBACK", hash: window.location.hash },
            window.location.origin
          );
          window.close();
          return;
        }

        // Se o usuário foi redirecionado com hash OAuth (#access_token=... ou #id_token=...)
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const idToken = hashParams.get("id_token");
          const accessToken = hashParams.get("access_token");

          let googleProfile = idToken ? googleAuthService.parseJwtPayload(idToken) : null;
          if (!googleProfile && accessToken) {
            googleProfile = await googleAuthService.fetchGoogleUserInfo(accessToken);
          }

          if (googleProfile) {
            const authUser: AuthUserProfile = {
              id: `usr-google-${googleProfile.sub}`,
              name: googleProfile.name,
              email: googleProfile.email,
              avatarUrl: googleProfile.picture,
              role: activeRole,
              rating: 5.0,
              totalTrips: 0,
              driverApprovalStatus: activeRole === "MOTORISTA" ? "pendente" : undefined,
              createdAt: Date.now(),
            };
            supabaseAuthService.saveStoredSession(authUser);
            const dest =
              redirectDestination ||
              (activeRole === "MOTORISTA" ? "/app/motorista" : "/app");
            void navigate({ to: dest, replace: true });
            return;
          }
        }

        const activeSession = await supabaseAuthService.checkAndHydrateSession();
        if (activeSession) {
          const dest =
            redirectDestination ||
            (activeSession.role === "MOTORISTA"
              ? "/app/motorista"
              : activeSession.role === "ADMIN"
              ? "/app/admin"
              : "/app");
          void navigate({ to: dest, replace: true });
          return;
        }
      } catch (err) {
        silentCatchWarn("PartiuAppAuthGate:initGate", err);
      }
      setCheckingSession(false);
    }

    void initGate();
  }, [navigate, redirectDestination, activeRole]);

  // Contagem regressiva de reenvio de OTP
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const interval = setInterval(() => setOtpCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [otpCountdown]);

  // Tratamento Inteligente de Entrada do Contato (Celular ou E-mail)
  function handleContactInputChange(val: string) {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Se o usuário estiver digitando números, aplica máscara brasileira de telefone automaticamente
    const digitsOnly = val.replace(/\D/g, "");
    const hasAtSign = val.includes("@");

    if (hasAtSign || (val.length > 0 && isNaN(Number(val[0])) && val[0] !== "(" && val[0] !== "+")) {
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
      const checkResult = await supabaseAuthService.checkContactExists(cleanInput, activeRole);
      setLoading(false);

      setDetectedContactType(checkResult.contactType);
      setRecognizedUserName(checkResult.userName || null);

      if (checkResult.exists) {
        // Usuário EXISTE -> Direciona para o Fluxo de Login
        if (checkResult.contactType === "PHONE" && features.allowSmsLogin) {
          // Envia OTP SMS e vai para a tela de código
          setPassengerStep("LOGIN_OTP");
          void supabaseAuthService.sendPhoneOtp(cleanInput);
          setOtpCountdown(45);
          setSuccessMessage(`Enviamos um código SMS para ${checkResult.formattedContact}`);
        } else {
          // Solicita a senha cadastrada
          setEmail(cleanInput);
          setPassengerStep("LOGIN_PASSWORD");
        }
      } else {
        // Usuário NÃO EXISTE -> Direciona para o Formulário de Cadastro (Step 1)
        if (checkResult.contactType === "EMAIL") {
          setEmail(cleanInput);
        } else {
          setTelefone(checkResult.formattedContact);
        }
        setPassengerStep("SIGNUP_STEP_1");
        setSuccessMessage("Conta não encontrada. Preencha seus dados para criar sua conta!");
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
      void navigate({ to: redirectDestination || res.redirectUrl || "/app", replace: true });
    }, 300);
  }

  // ===========================================================================
  // 🔑 LOGIN: Autenticação por Senha (Passageiro ou Motorista)
  // ===========================================================================
  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const loginIdentifier = activeRole === "MOTORISTA" ? email || contactInput : email || contactInput;

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
    });
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Credenciais inválidas. Verifique os dados digitados.");
      return;
    }

    setSuccessMessage("Autenticado com sucesso! Redirecionando...");
    setTimeout(() => {
      void navigate({ to: redirectDestination || res.redirectUrl || (activeRole === "MOTORISTA" ? "/app/motorista" : "/app"), replace: true });
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

    setLoading(true);
    const res = await supabaseAuthService.signUpPassenger({
      name: nome,
      email,
      phone: telefone,
      cpf,
      password: senha,
    });
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Não foi possível concluir o cadastro.");
      return;
    }

    setSuccessMessage("Conta criada com sucesso! Redirecionando...");
    setTimeout(() => {
      void navigate({ to: redirectDestination || res.redirectUrl || "/app", replace: true });
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
          className="inline-flex items-center gap-1.5 text-xs font-medium transition h-8 px-3 rounded-lg hover:opacity-85 active:scale-95 cursor-pointer shadow-2xs"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.inputBorder}`,
            color: colors.textSecondary,
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Início</span>
        </Link>

        {/* Logo Centralizado da Marca */}
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={appName}
              className="h-8 max-w-[120px] object-contain"
              onError={(e) => {
                // Se a URL falhar, oculta imagem e renderiza badge nativo
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: colors.primary }}
              >
                <Zap className="h-4.5 w-4.5 stroke-[2.5] text-white" />
              </div>
              <span className="text-lg font-black tracking-tight" style={{ color: colors.textPrimary }}>
                {appName}
              </span>
            </div>
          )}
        </div>

        {/* Espaçador simétrico para manter o logo centralizado */}
        <div className="w-14" />
      </header>

      {/* ===================================================================== */}
      {/* 2. ÁREA CENTRAL DO NOVO FLUXO UNIFICADO (MAGIC FLOW)                  */}
      {/* ===================================================================== */}
      <main className="flex-1 w-full max-w-md mx-auto px-3.5 sm:px-6 py-2 sm:py-4 flex flex-col justify-start pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]">
        
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

        {/* Feedback Messages (Alto Contraste) */}
        {errorMessage && (
          <div className="mb-3.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-3.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="leading-snug">{successMessage}</span>
          </div>
        )}

        {/* SUPERFÍCIE NATIVA ANDROID: FLUIDA EDGE-TO-EDGE NO MOBILE, ELEVAÇÃO SUAVE NO DESKTOP */}
        <NativeSurface
          elevation={1}
          padding="none"
          className="w-full p-4 sm:p-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition-all duration-300"
        >
          {/* =================================================================== */}
          {/* FLUXO DO PASSAGEIRO                                                 */}
          {/* =================================================================== */}
          {activeRole === "PASSAGEIRO" && (
            <>
              {/* ETAPA 1 DO PASSAGEIRO: FLUXO UNIFICADO (MAGIC FLOW) */}
              {passengerStep === "MAGIC_ENTRY" && (
                <form onSubmit={handleMagicFlowSubmit} className="space-y-6">
                  <div className="space-y-2 text-left">
                    <h1
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Qual é o seu celular ou e-mail?
                    </h1>
                    <p
                      className="text-sm font-normal leading-relaxed"
                      style={{ color: colors.textSecondary }}
                    >
                      Entre com o Google ou digite seus dados para continuar.
                    </p>
                  </div>

                  {/* Botão de Entrada Rápida com Google (Padrão 1-Tap / OAuth Direto) */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loadingGoogle || loading}
                    className="w-full h-11 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
                  >
                    {loadingGoogle ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                    ) : (
                      <GoogleIcon className="w-4 h-4" />
                    )}
                    <span>Continuar com o Google</span>
                  </button>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="w-full border-t border-slate-200" />
                    <span className="bg-white px-3 text-xs text-slate-400 font-medium lowercase">
                      ou
                    </span>
                  </div>

                  {/* Input Nativo com Altura de 52px e Clear Button */}
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
                        <Mail className="w-5 h-5 text-slate-400" />
                      ) : (
                        <div className="flex items-center gap-1.5 pl-0.5 text-xs font-black text-slate-700 dark:text-slate-200 select-none">
                          <span className="text-base leading-none">🇧🇷</span>
                          <span>+55</span>
                        </div>
                      )
                    }
                  />

                  {/* Botão Primário Proporcional com Ripple Nativo */}
                  <NativeButton
                    type="submit"
                    variant="filled"
                    size="md"
                    fullWidth
                    isLoading={loading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continuar
                  </NativeButton>

                  <div className="text-center pt-1.5">
                    <Link
                      to="/escolher-tipo-cadastro"
                      className="inline-flex items-center justify-center py-1 text-xs font-medium hover:underline cursor-pointer"
                      style={{ color: colors.textSecondary }}
                    >
                      Não tem uma conta?{" "}
                      <span className="ml-1 font-bold underline" style={{ color: colors.primary }}>
                        Cadastre-se
                      </span>
                    </Link>
                  </div>
                </form>
              )}

              {/* ETAPA 2A: LOGIN COM CÓDIGO SMS (SE CONTATO EXISTIR E FOR CELULAR) */}
              {passengerStep === "LOGIN_OTP" && (
                <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: colors.inputBackground,
                          color: colors.textPrimary,
                        }}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        {contactInput}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPassengerStep("MAGIC_ENTRY");
                          setErrorMessage(null);
                        }}
                        className="px-1.5 py-0.5 text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                        style={{ color: colors.primary }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Alterar
                      </button>
                    </div>

                    <h2
                      className="text-2xl font-extrabold tracking-tight pt-1"
                      style={{ color: colors.textPrimary }}
                    >
                      Código de confirmação
                    </h2>
                    <p className="text-xs sm:text-sm font-normal" style={{ color: colors.textSecondary }}>
                      Digite o código de 6 dígitos enviado por SMS.
                    </p>
                  </div>

                  {/* INPUT OTP SEGMENTADO DE 6 DÍGITOS (PADRÃO FIGMA CABER LOGIN OTP 2) */}
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(val) => setOtpCode(val.replace(/\D/g, "").slice(0, 6))}
                      autoFocus
                    >
                      <InputOTPGroup className="gap-2 sm:gap-2.5">
                        <InputOTPSlot index={0} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all" />
                        <InputOTPSlot index={1} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all" />
                        <InputOTPSlot index={2} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all" />
                        <InputOTPSlot index={3} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all" />
                        <InputOTPSlot index={4} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all" />
                        <InputOTPSlot index={5} className="w-10 h-12 sm:w-12 sm:h-14 text-lg sm:text-xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-800 focus:border-primary shadow-xs transition-all" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <NativeButton
                    type="submit"
                    variant="filled"
                    size="md"
                    fullWidth
                    isLoading={loading}
                    leftIcon={<UserCheck className="w-4 h-4" />}
                  >
                    Confirmar e Entrar
                  </NativeButton>

                  <div className="flex items-center justify-between text-xs pt-1">
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
                </form>
              )}

              {/* ETAPA 2B: LOGIN COM SENHA */}
              {passengerStep === "LOGIN_PASSWORD" && (
                <form onSubmit={handlePasswordLogin} className="space-y-5 animate-in fade-in duration-200">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: colors.inputBackground,
                          color: colors.textPrimary,
                        }}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {contactInput}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPassengerStep("MAGIC_ENTRY");
                          setErrorMessage(null);
                        }}
                        className="px-1.5 py-0.5 text-xs font-semibold hover:underline cursor-pointer flex items-center gap-1"
                        style={{ color: colors.primary }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Alterar
                      </button>
                    </div>

                    <h2
                      className="text-2xl font-extrabold tracking-tight pt-1"
                      style={{ color: colors.textPrimary }}
                    >
                      {recognizedUserName ? `Olá, ${recognizedUserName.split(" ")[0]}!` : "Bem-vindo de volta!"}
                    </h2>
                    <p className="text-xs sm:text-sm font-normal" style={{ color: colors.textSecondary }}>
                      Digite sua senha para acessar sua conta.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold" style={{ color: colors.textPrimary }}>
                        Sua Senha
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="py-0.5 text-xs font-medium hover:underline cursor-pointer"
                        style={{ color: colors.textSecondary }}
                      >
                        Esqueci a senha
                      </button>
                    </div>

                    <NativeInput
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Digite sua senha"
                      autoFocus
                      required
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                          className="min-h-[48px] min-w-[48px] -mr-3 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                  </div>

                  <NativeButton
                    type="submit"
                    variant="filled"
                    size="md"
                    fullWidth
                    isLoading={loading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Entrar na Conta
                  </NativeButton>
                </form>
              )}

              {/* ETAPA 2C: CADASTRO STEP 1 (DADOS PESSOAIS) */}
              {passengerStep === "SIGNUP_STEP_1" && (
                <form onSubmit={handlePassengerSignUp} className="space-y-4 animate-in fade-in duration-200">
                  <WhiteLabelProgressBar
                    currentStep={1}
                    totalSteps={2}
                    stepTitle="Dados Pessoais"
                  />

                  <div className="text-left border-b pb-3" style={{ borderColor: colors.inputBorder }}>
                    <h2
                      className="text-xl sm:text-2xl font-extrabold tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Criar sua conta
                    </h2>
                    <p className="text-xs font-normal" style={{ color: colors.textSecondary }}>
                      Preencha seus dados para pedir corridas com rapidez e segurança.
                    </p>
                  </div>

                  {/* Nome Completo */}
                  <NativeInput
                    label="Nome Completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como deseja ser chamado(a)"
                    required
                    leftIcon={<User className="w-5 h-5 text-slate-400" />}
                  />

                  {/* CPF e Celular em Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.requireCpfOnSignup && (
                      <NativeInput
                        label="CPF"
                        value={cpf}
                        onChange={(e) => handleCpfChange(e.target.value)}
                        placeholder="000.000.000-00"
                        required
                        leftIcon={<FileText className="w-5 h-5 text-slate-400" />}
                      />
                    )}
                    <NativeInput
                      label="Celular"
                      value={telefone}
                      onChange={(e) => handleTelefoneChange(e.target.value)}
                      placeholder="(82) 99841-2940"
                      required
                      leftIcon={<Smartphone className="w-5 h-5 text-slate-400" />}
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
                    leftIcon={<Mail className="w-5 h-5 text-slate-400" />}
                  />

                  {/* Criar Senha */}
                  <NativeInput
                    label="Criar Senha de Acesso"
                    type={showPassword ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    helperText="Crie uma senha segura para entrar no app."
                    leftIcon={<KeyRound className="w-5 h-5 text-slate-400" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                        className="min-h-[48px] min-w-[48px] -mr-3 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <NativeButton
                    type="submit"
                    variant="filled"
                    size="md"
                    fullWidth
                    isLoading={loading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Criar Conta e Começar
                  </NativeButton>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setPassengerStep("MAGIC_ENTRY")}
                      className="min-h-[48px] inline-flex items-center justify-center text-xs font-bold hover:underline cursor-pointer"
                      style={{ color: colors.textSecondary }}
                    >
                      Voltar e trocar contato
                    </button>
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
              {/* VISÃO 1: PORTAL DO MOTORISTA COM FOCO EM CONVERSÃO (TAREFA 3) */}
              {driverView === "PORTAL" && (
                <div className="space-y-6 text-left animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                      style={{
                        backgroundColor: colors.inputBackground,
                        color: colors.primary,
                      }}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      Portal do Parceiro
                    </span>

                    <h1
                      className="text-2xl sm:text-3xl font-black tracking-tight leading-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Dirija com a {appName}
                    </h1>

                    <p
                      className="text-sm font-normal leading-relaxed"
                      style={{ color: colors.textSecondary }}
                    >
                      Aumente seus ganhos com planos a partir de 0% de comissão e repasse imediato de 100% das corridas via PIX D+0.
                    </p>
                  </div>

                  {/* Benefícios Rápidos em Grid Compacta */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <NativeSurface
                      elevation={1}
                      padding="sm"
                      className="flex flex-col items-start gap-1.5 p-3 rounded-2xl"
                    >
                      <span
                        className="px-2 py-0.5 rounded-md font-black text-xs inline-block"
                        style={{
                          backgroundColor: `${colors.primary}18`,
                          color: colors.primary,
                        }}
                      >
                        0% Taxa
                      </span>
                      <h4 className="text-xs font-bold leading-tight" style={{ color: colors.textPrimary }}>
                        Plano Diário
                      </h4>
                      <p className="text-[11px] leading-tight" style={{ color: colors.textSecondary }}>
                        100% do valor da corrida é seu.
                      </p>
                    </NativeSurface>

                    <NativeSurface
                      elevation={1}
                      padding="sm"
                      className="flex flex-col items-start gap-1.5 p-3 rounded-2xl"
                    >
                      <span
                        className="px-2 py-0.5 rounded-md font-black text-xs inline-block"
                        style={{
                          backgroundColor: `${colors.primary}18`,
                          color: colors.primary,
                        }}
                      >
                        Pix D+0
                      </span>
                      <h4 className="text-xs font-bold leading-tight" style={{ color: colors.textPrimary }}>
                        Repasse Imediato
                      </h4>
                      <p className="text-[11px] leading-tight" style={{ color: colors.textSecondary }}>
                        Direto na sua conta bancária.
                      </p>
                    </NativeSurface>
                  </div>

                  {/* BOTÕES DE ACESSO: GOOGLE 1-CLICK & CADASTRO DE VEÍCULO */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loadingGoogle || loading}
                      className="w-full h-11 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
                    >
                      {loadingGoogle ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                      ) : (
                        <GoogleIcon className="w-4 h-4" />
                      )}
                      <span>Entrar com o Google</span>
                    </button>

                    <Link
                      to="/cadastro-motorista"
                      className="w-full flex items-center justify-center"
                    >
                      <NativeButton
                        variant="filled"
                        size="md"
                        fullWidth
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Cadastrar meu veículo
                      </NativeButton>
                    </Link>

                    {/* LINK SECUNDÁRIO LIMPO: "JÁ TENHO CONTA DE MOTORISTA" */}
                    <div className="text-center pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDriverView("LOGIN");
                          setErrorMessage(null);
                        }}
                        className="inline-flex items-center justify-center py-1 text-xs font-medium hover:underline cursor-pointer"
                        style={{ color: colors.textSecondary }}
                      >
                        Já sou parceiro (Entrar com senha)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VISÃO 2: LOGIN DO MOTORISTA PARCEIRO */}
              {driverView === "LOGIN" && (
                <form onSubmit={handlePasswordLogin} className="space-y-4 text-left animate-in fade-in duration-200">
                  <div className="space-y-1 border-b pb-3" style={{ borderColor: colors.inputBorder }}>
                    <h2
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Cockpit do Motorista
                    </h2>
                    <p className="text-xs font-normal" style={{ color: colors.textSecondary }}>
                      Entre com sua conta Google ou com seus dados cadastrados.
                    </p>
                  </div>

                  {/* Botão Google para Login de Motorista */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loadingGoogle || loading}
                    className="w-full h-11 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
                  >
                    {loadingGoogle ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                    ) : (
                      <GoogleIcon className="w-4 h-4" />
                    )}
                    <span>Entrar no Cockpit com o Google</span>
                  </button>

                  <div className="relative flex items-center justify-center my-1">
                    <div className="w-full border-t border-slate-200" />
                    <span className="bg-white px-3 text-xs text-slate-400 font-medium lowercase">
                      ou
                    </span>
                  </div>

                  <NativeInput
                    label="E-mail ou Celular Cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="motorista@exemplo.com"
                    autoFocus
                    required
                    leftIcon={<User className="w-5 h-5 text-slate-400" />}
                  />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold" style={{ color: colors.textPrimary }}>
                        Senha de Acesso
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="py-0.5 text-xs font-medium hover:underline cursor-pointer"
                        style={{ color: colors.textSecondary }}
                      >
                        Esqueci a senha
                      </button>
                    </div>

                    <NativeInput
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Sua senha de motorista"
                      required
                      leftIcon={<KeyRound className="w-5 h-5 text-slate-400" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                          className="min-h-[48px] min-w-[48px] -mr-3 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                  </div>

                  <NativeButton
                    type="submit"
                    variant="filled"
                    size="md"
                    fullWidth
                    isLoading={loading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Entrar no Cockpit
                  </NativeButton>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setDriverView("PORTAL")}
                      className="min-h-[48px] inline-flex items-center justify-center text-xs font-bold hover:underline cursor-pointer"
                      style={{ color: colors.textSecondary }}
                    >
                      Ainda não é cadastrado? Quero me cadastrar
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </NativeSurface>

        {/* =================================================================== */}
        {/* BADGES DE CONFIANÇA DO ECOSSISTEMA (INSPIRADO NO DRIVEMOND)         */}
        {/* =================================================================== */}
        <div className="pt-5 pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div
              className="flex flex-col items-center p-2.5 rounded-2xl border transition-all"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
              }}
            >
              <ShieldCheck className="w-5 h-5 mb-1 stroke-[2]" style={{ color: colors.primary }} />
              <span className="text-xs font-bold leading-tight" style={{ color: colors.textPrimary }}>
                Seguro
              </span>
              <span className="text-[10px] leading-tight" style={{ color: colors.textSecondary }}>
                em cada viagem
              </span>
            </div>

            <div
              className="flex flex-col items-center p-2.5 rounded-2xl border transition-all"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
              }}
            >
              <Zap className="w-5 h-5 mb-1 stroke-[2]" style={{ color: colors.primary }} />
              <span className="text-xs font-bold leading-tight" style={{ color: colors.textPrimary }}>
                Rápido
              </span>
              <span className="text-[10px] leading-tight" style={{ color: colors.textSecondary }}>
                e prático
              </span>
            </div>

            <div
              className="flex flex-col items-center p-2.5 rounded-2xl border transition-all"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
              }}
            >
              <MapPin className="w-5 h-5 mb-1 stroke-[2]" style={{ color: colors.primary }} />
              <span className="text-xs font-bold leading-tight" style={{ color: colors.textPrimary }}>
                Na sua cidade
              </span>
              <span className="text-[10px] leading-tight" style={{ color: colors.textSecondary }}>
                sempre perto
              </span>
            </div>

            <div
              className="flex flex-col items-center p-2.5 rounded-2xl border transition-all"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.inputBorder,
              }}
            >
              <CheckCircle2 className="w-5 h-5 mb-1 stroke-[2]" style={{ color: colors.primary }} />
              <span className="text-xs font-bold leading-tight" style={{ color: colors.textPrimary }}>
                Tarifa Justa
              </span>
              <span className="text-[10px] leading-tight" style={{ color: colors.textSecondary }}>
                sem surpresas
              </span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. RODAPÉ DE SEGURANÇA E CONFORMIDADE                               */}
        {/* =================================================================== */}
        <footer className="w-full text-center py-5 space-y-1.5 select-none">
          <div
            className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold"
            style={{ color: colors.textSecondary }}
          >
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <ShieldCheck className="h-3.5 w-3.5" /> Conexão Segura SSL
            </span>
            <span>•</span>
            <span>Conforme LGPD</span>
            <span>•</span>
            <span>PIX Instantâneo</span>
          </div>
          <p className="text-[11px]" style={{ color: colors.textSecondary }}>
            © {new Date().getFullYear()} {appName}. Todos os direitos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
}
