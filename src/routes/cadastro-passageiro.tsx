import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Zap,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";
import { useGeolocation } from "@/lib/use-geolocation";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";
import {
  NativeButton,
  NativeInput,
  NativeSurface,
} from "@/components/native";
import {
  WhiteLabelProgressBar,
} from "@/components/ui/white-label";
import { CameraPhotoCapture } from "@/components/common/CameraPhotoCapture";

export const Route = createFileRoute("/cadastro-passageiro")({
  head: () => ({
    meta: [
      { title: "Cadastro de Passageiro | PARTIU" },
      {
        name: "description",
        content:
          "Crie sua conta de passageiro no PARTIU para pedir corridas urbanas e entregas expressas com segurança e tarifa justa.",
      },
    ],
  }),
  component: CadastroPassageiroPage,
});

function formatarTelefone(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatarCpf(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function CadastroPassageiroPage() {
  const navigate = useNavigate();
  const { corPrimaria, corTextoPrimaria } = useBrandTheme();
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;
  const appName = branding?.appName || DEFAULT_APP_CONFIG.branding.appName;

  // Estados limpos sem dados mockados pré-preenchidos
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [receberWhatsApp, setReceberWhatsApp] = useState(false);

  // Estados de feedback operacional
  const [carregando, setCarregando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const {
    localDetectado,
    carregando: carregandoGPS,
    solicitarLocalizacao,
    permissaoConcedida,
  } = useGeolocation();

  useEffect(() => {
    try {
      const savedAvatar =
        localStorage.getItem("partiu_user_avatar") ||
        localStorage.getItem("partiu_user_foto") ||
        localStorage.getItem("partiu_user_selfie");
      if (savedAvatar) {
        setFotoUrl(savedAvatar);
      }
    } catch {}
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErroCadastro(null);

    const cleanNome = nome.trim();
    const cleanEmail = email.trim().toLowerCase();
    const rawTelefone = telefone.replace(/\D/g, "");
    const rawCpf = cpf.replace(/\D/g, "");

    if (cleanNome.length < 3) {
      setErroCadastro("Por favor, digite seu nome completo (ao menos 3 letras).");
      return;
    }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErroCadastro("Por favor, digite um e-mail válido.");
      return;
    }
    if (rawTelefone.length < 10) {
      setErroCadastro("Por favor, digite um número de celular válido com DDD.");
      return;
    }
    if (rawCpf.length !== 11) {
      setErroCadastro("Por favor, digite um CPF válido com 11 dígitos.");
      return;
    }
    if (senha.length < 6) {
      setErroCadastro("A senha de acesso deve ter pelo menos 6 caracteres.");
      return;
    }
    if (!fotoUrl) {
      setErroCadastro("Por favor, tire sua foto pela câmera do celular para identificação oficial.");
      return;
    }

    if (!permissaoConcedida) {
      solicitarLocalizacao();
    }

    setCarregando(true);
    try {
      const res = await supabaseAuthService.signUpPassenger({
        name: cleanNome,
        email: cleanEmail,
        phone: telefone,
        cpf,
        password: senha,
        avatarUrl: fotoUrl,
      });

      if (!res.success) {
        setErroCadastro(res.error || "Não foi possível concluir o cadastro no momento. Tente novamente.");
        setCarregando(false);
        return;
      }

      if (permissaoConcedida) {
        try {
          localStorage.setItem("partiu_gps_permitido", "true");
        } catch {}
      }

      setSucesso(true);
    } catch (err: any) {
      setErroCadastro(err?.message || "Ocorreu um erro de conexão. Verifique sua internet.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col font-sans transition-colors duration-200 overflow-x-hidden overflow-y-auto bg-slate-50 p-3.5 sm:p-6 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]"
      style={{
        backgroundColor: colors.background,
        color: colors.textPrimary,
        fontFamily: ui.fontFamily,
      }}
    >
      {/* Top Header */}
      <div className="mx-auto w-full max-w-md pt-[max(0.5rem,calc(env(safe-area-inset-top,0px)))] flex items-center justify-between pb-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
          aria-label="Voltar para início"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </Link>
        <span
          className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-full border"
          style={{
            borderColor: `${colors.primary}33`,
            backgroundColor: `${colors.primary}12`,
            color: colors.primary,
          }}
        >
          <Zap className="h-3.5 w-3.5" />
          Passageiro {appName}
        </span>
        <Link
          to="/auth"
          search={{ role: "PASSAGEIRO" }}
          className="text-xs font-bold hover:underline transition"
          style={{ color: colors.primary }}
        >
          Entrar
        </Link>
      </div>

      <main className="w-full max-w-md mx-auto flex-1 flex flex-col justify-start py-2 sm:py-3 pb-8 sm:pb-12">
        {!sucesso ? (
          <div
            className="w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xl sm:shadow-2xl shadow-slate-200/50 space-y-3 transition-all duration-200 relative"
            style={{ borderRadius: ui.borderRadius || "1.5rem" }}
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Cabeçalho do Card Padrão Design System */}
              <div className="text-center">
                <h1
                  className="text-lg sm:text-xl font-black tracking-tight"
                  style={{ color: colors.textPrimary }}
                >
                  Cadastro de Passageiro
                </h1>
                <p className="text-[11px] sm:text-xs mt-0.5 font-normal" style={{ color: colors.textSecondary }}>
                  Crie sua conta para solicitar corridas e entregas com segurança.
                </p>
                {/* Barra de destaque na cor primária do Franqueado */}
                <div
                  className="w-7 h-1 rounded-full mx-auto mt-1.5 mb-3 transition-colors"
                  style={{ backgroundColor: colors.primary }}
                />
              </div>

              {/* Indicador de Progresso Conectado à Cor Primária */}
              <WhiteLabelProgressBar
                currentStep={1}
                totalSteps={2}
                stepTitle="Dados Pessoais"
                className="mb-0.5"
              />

              {erroCadastro && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2 animate-in fade-in"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{erroCadastro}</span>
                </div>
              )}

              {/* Foto de Perfil Obrigatória via Câmera do Celular */}
              <CameraPhotoCapture
                label="Sua foto de identificação"
                sublabel="Tire uma selfie ao vivo pela câmera"
                value={fotoUrl}
                onChange={(capturedUrl) => {
                  setFotoUrl(capturedUrl);
                  if (capturedUrl) {
                    try {
                      localStorage.setItem("partiu_user_avatar", capturedUrl);
                      localStorage.setItem("partiu_user_foto", capturedUrl);
                      localStorage.setItem("partiu_user_selfie", capturedUrl);
                    } catch {}
                  }
                  if (erroCadastro?.includes("foto")) setErroCadastro(null);
                }}
                required
              />

              <NativeInput
                label="Nome completo"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome completo"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
              />

              <div className="grid grid-cols-2 gap-2">
                <NativeInput
                  label="Celular"
                  required
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(82) 99999-9999"
                  leftIcon={
                    <div className="flex items-center gap-0.5 text-[11px] font-black text-slate-700 dark:text-slate-200 select-none">
                      <span>🇧🇷</span>
                    </div>
                  }
                />
                <NativeInput
                  label="CPF"
                  required
                  value={cpf}
                  onChange={(e) => {
                    setCpf(formatarCpf(e.target.value));
                    if (erroCadastro?.includes("CPF")) setErroCadastro(null);
                  }}
                  onBlur={async () => {
                    const raw = cpf.replace(/\D/g, "");
                    if (raw.length === 11) {
                      const check = await supabaseAuthService.isEmailOrCpfRegistered("", raw);
                      if (check.registered && check.field === "cpf") {
                        setErroCadastro(check.message || "Este CPF já está cadastrado.");
                      }
                    }
                  }}
                  placeholder="000.000.000-00"
                  leftIcon={<FileText className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <NativeInput
                label="E-mail"
                required
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (erroCadastro?.includes("e-mail") || erroCadastro?.includes("E-mail")) setErroCadastro(null);
                }}
                onBlur={async () => {
                  if (email.includes("@") && email.includes(".")) {
                    const check = await supabaseAuthService.isEmailOrCpfRegistered(email.trim().toLowerCase());
                    if (check.registered && check.field === "email") {
                      setErroCadastro(check.message || "Este e-mail já está cadastrado.");
                    }
                  }
                }}
                placeholder="seu.email@exemplo.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">
                  Senha de acesso
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="wppUpdates"
                  checked={receberWhatsApp}
                  onChange={(e) => setReceberWhatsApp(e.target.checked)}
                  className="h-4 w-4 rounded cursor-pointer shrink-0"
                  style={{ accentColor: colors.primary }}
                />
                <label
                  htmlFor="wppUpdates"
                  className="text-[11px] font-medium cursor-pointer leading-tight select-none text-left"
                  style={{ color: colors.textSecondary }}
                >
                  Receber comprovantes de corridas e código PIN no WhatsApp
                </label>
              </div>

              <div className="pt-2 space-y-2.5 mt-2">
                <button
                  type="submit"
                  disabled={carregando}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: ui.borderRadius || "0.75rem",
                  }}
                  className="w-full py-3.5 px-4 text-white text-xs sm:text-sm font-black tracking-wide shadow-md flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {carregando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <span>➔</span>
                      <span>Confirmar criação de conta</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <Link
                    to="/auth"
                    search={{ role: "PASSAGEIRO" }}
                    className="inline-flex items-center justify-center text-xs font-semibold hover:underline py-1 transition-colors"
                    style={{ color: colors.textSecondary }}
                  >
                    Já tem uma conta?{" "}
                    <span className="font-extrabold underline ml-1" style={{ color: colors.primary }}>
                      Ir para o login
                    </span>
                  </Link>
                </div>
              </div>

              {/* Rodapé Interno do Card */}
              <div className="border-t border-slate-100 pt-2.5 mt-2">
                <p className="text-[11px] text-slate-400 text-center">
                  © {new Date().getFullYear()} {appName} · Mobilidade conectada
                </p>
              </div>
            </form>
          </div>
        ) : (
          <NativeSurface
            elevation={2}
            padding="lg"
            className="text-center space-y-4 animate-in zoom-in-95"
          >
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
              style={{
                backgroundColor: `${colors.primary}18`,
                color: colors.primary,
              }}
            >
              <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black" style={{ color: colors.textPrimary }}>
              Conta criada com sucesso
            </h2>
            <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
              Bem-vindo ao {appName}, <span className="font-bold" style={{ color: colors.textPrimary }}>{nome}</span>! Seu
              cadastro foi confirmado com sucesso.
            </p>

            <div className="pt-3 space-y-2.5">
              <Link to="/auth" search={{ role: "PASSAGEIRO" }} className="block w-full">
                <NativeButton variant="filled" size="md" fullWidth>
                  Ir para o login
                </NativeButton>
              </Link>
              <Link to="/app" className="block w-full">
                <NativeButton variant="outlined" size="md" fullWidth>
                  Acessar aplicativo
                </NativeButton>
              </Link>
            </div>
          </NativeSurface>
        )}
      </main>

      <footer className="text-center text-[11px] text-muted-foreground">
        PARTIU Mobilidade Urbana & Entregas Flash • Plataforma Nacional
      </footer>
    </div>
  );
}
