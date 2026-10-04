import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
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
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import {
  NativeButton,
  NativeInput,
  NativeSurface,
} from "@/components/native";
import {
  WhiteLabelProgressBar,
} from "@/components/ui/white-label";
import { GoogleIcon } from "@/components/common/GoogleIcon";

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
  const { colors, ui, appName } = appConfig.branding;

  // Estados limpos sem dados mockados pré-preenchidos
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
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
      });

      if (!res.success) {
        setErroCadastro(res.error || "Não foi possível concluir o cadastro no momento. Tente novamente.");
        setCarregando(false);
        return;
      }

      // Registro de preferências locais de cache para navegação instantânea
      try {
        localStorage.setItem("partiu_user_nome", cleanNome);
        localStorage.setItem("partiu_user_telefone", telefone);
        if (permissaoConcedida) {
          localStorage.setItem("partiu_gps_permitido", "true");
        }
      } catch {
        // storage resiliente
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
      className="min-h-[100dvh] flex flex-col justify-between p-4 sm:p-6 w-full pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] transition-colors duration-200"
      style={{
        backgroundColor: colors.background,
        color: colors.textPrimary,
        fontFamily: ui.fontFamily,
      }}
    >
      {/* Top Header */}
      <div className="mx-auto w-full max-w-md flex items-center justify-between">
        <Link
          to="/"
          className="flex min-h-[34px] min-w-[34px] h-8.5 w-8.5 items-center justify-center rounded-lg border text-foreground/80 shadow-2xs active:scale-95 transition-all cursor-pointer hover:opacity-80"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.inputBorder,
            color: colors.textSecondary,
          }}
          aria-label="Voltar para login"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span
          className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: colors.primary }}
        >
          <ShieldCheck className="h-4 w-4" />
          Passageiro {appName}
        </span>
        <div className="w-8.5" />
      </div>

      <main className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-4">
        {!sucesso ? (
          <NativeSurface
            elevation={1}
            padding="none"
            className="w-full p-5 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.05)] space-y-4 transition-all duration-200"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Indicador de Progresso Conectado à Cor Primária */}
              <WhiteLabelProgressBar
                currentStep={1}
                totalSteps={2}
                stepTitle="Dados pessoais"
              />

              <div className="text-left border-b pb-3" style={{ borderColor: colors.inputBorder }}>
                <div className="flex items-center gap-2.5 mb-1">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black shadow-sm"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Zap className="h-5 w-5 stroke-[2.5]" />
                  </div>
                  <h1
                    className="text-xl sm:text-2xl font-black tracking-tight"
                    style={{ color: colors.textPrimary }}
                  >
                    Cadastro de passageiro
                  </h1>
                </div>
                <p className="text-xs font-normal" style={{ color: colors.textSecondary }}>
                  Crie sua conta para solicitar corridas de carro, moto e entregas com segurança.
                </p>
              </div>

              {/* Botão de Cadastro 1-Click via Google */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setCarregando(true);
                      setErroCadastro(null);
                      const res = await supabaseAuthService.signInWithGoogle({
                        role: "PASSAGEIRO",
                        redirectUrl: "/app",
                      });
                      if (res.success) {
                        if (res.user) {
                          setNome(res.user.name || "");
                          setEmail(res.user.email || "");
                        }
                        if (res.redirectUrl && !res.redirectUrl.startsWith("http")) {
                          void navigate({ to: res.redirectUrl as any });
                        }
                      } else if (res.error) {
                        setErroCadastro(res.error);
                      }
                    } catch (err: any) {
                      setErroCadastro(err?.message || "Falha ao autenticar com o Google.");
                    } finally {
                      setCarregando(false);
                    }
                  }}
                  disabled={carregando}
                  className="w-full h-11 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>Cadastrar com o Google</span>
                </button>

                <div className="relative flex items-center justify-center my-0.5">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-2.5 text-[9.5px] text-slate-400 font-medium uppercase tracking-wider">
                    ou preencha seus dados
                  </span>
                </div>
              </div>

              {erroCadastro && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2 animate-in fade-in"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{erroCadastro}</span>
                </div>
              )}

              <NativeInput
                label="Nome completo"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome completo"
                leftIcon={<User className="w-5 h-5 text-slate-400" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NativeInput
                  label="Celular"
                  required
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(82) 99999-9999"
                  leftIcon={
                    <div className="flex items-center gap-1.5 pl-0.5 text-xs font-black text-slate-700 dark:text-slate-200 select-none">
                      <span className="text-base leading-none">🇧🇷</span>
                      <span>+55</span>
                    </div>
                  }
                />
                <NativeInput
                  label="CPF"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(formatarCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  leftIcon={<FileText className="w-5 h-5 text-slate-400" />}
                />
              </div>

              <NativeInput
                label="E-mail"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                leftIcon={<Mail className="w-5 h-5 text-slate-400" />}
              />

              <NativeInput
                label="Senha de acesso"
                required
                type={showPassword ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 dígitos"
                helperText="Crie uma senha de acesso para gerenciar suas corridas no app."
                leftIcon={<Lock className="w-5 h-5 text-slate-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="min-h-[48px] min-w-[48px] -mr-3 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {/* Localização GPS Integrada */}
              <div
                className="rounded-2xl p-3.5 border space-y-2.5"
                style={{
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white shrink-0 font-black shadow-xs"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold block" style={{ color: colors.textPrimary }}>
                      Localização para embarque
                    </strong>
                    <p className="text-[11px]" style={{ color: colors.textSecondary }}>
                      Garante precisão milimétrica para o motorista te encontrar
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between text-xs p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.inputBorder,
                  }}
                >
                  <span className="truncate mr-2 font-medium" style={{ color: colors.textPrimary }}>
                    {permissaoConcedida && localDetectado
                      ? `📍 ${localDetectado.pontoEmbarque}`
                      : carregandoGPS
                        ? "🛰️ Calibrando sinal GPS..."
                        : "📍 Localização automática via GPS"}
                  </span>
                  <button
                    type="button"
                    onClick={solicitarLocalizacao}
                    className="min-h-[28px] h-7.5 px-2.5 rounded-lg text-xs font-medium shrink-0 transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center text-white"
                    style={{
                      backgroundColor: colors.primary,
                    }}
                  >
                    {permissaoConcedida ? "Ativo ✓" : "Ativar GPS"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="wppUpdates"
                  checked={receberWhatsApp}
                  onChange={(e) => setReceberWhatsApp(e.target.checked)}
                  className="h-4.5 w-4.5 rounded cursor-pointer"
                  style={{ accentColor: colors.primary }}
                />
                <label
                  htmlFor="wppUpdates"
                  className="text-xs font-medium cursor-pointer leading-tight select-none"
                  style={{ color: colors.textSecondary }}
                >
                  Receber comprovantes de corridas e código PIN de segurança no WhatsApp
                </label>
              </div>

              <div className="pt-2">
                <NativeButton
                  type="submit"
                  variant="filled"
                  size="md"
                  fullWidth
                  isLoading={carregando}
                  rightIcon={<CheckCircle2 className="h-4.5 w-4.5" />}
                >
                  Concluir cadastro
                </NativeButton>
              </div>

              <div className="text-center pt-1">
                <Link
                  to="/auth"
                  className="min-h-[48px] inline-flex items-center justify-center text-xs font-bold hover:underline transition-colors py-1"
                  style={{ color: colors.textSecondary }}
                >
                  Já tem uma conta?{" "}
                  <span className="font-extrabold underline ml-1" style={{ color: colors.primary }}>
                    Fazer login
                  </span>
                </Link>
              </div>
            </form>
          </NativeSurface>
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
              cadastro está pronto e conectado para você solicitar corridas e entregas agora mesmo.
            </p>

            <div className="pt-3">
              <Link to="/app" className="block w-full">
                <NativeButton variant="filled" size="md" fullWidth>
                  Pedir corrida
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
