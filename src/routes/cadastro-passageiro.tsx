import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Zap,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  FileText,
  Sparkles,
} from "lucide-react";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";
import {
  NativeButton,
  NativeInput,
  NativeSurface,
} from "@/components/native";
import { CameraPhotoCapture } from "@/components/common/CameraPhotoCapture";
import { whiteLabelEngine } from "@/lib/white-label";

export const Route = createFileRoute("/cadastro-passageiro")({
  validateSearch: (search: Record<string, unknown>): { tenant?: string; tenant_id?: string } => ({
    tenant: typeof search.tenant === "string" ? search.tenant : undefined,
    tenant_id: typeof search.tenant_id === "string" ? search.tenant_id : undefined,
  }),
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
  const search = Route.useSearch();
  const tenantParam = search.tenant || search.tenant_id;
  const { corPrimaria, corTextoPrimaria } = useBrandTheme();

  useEffect(() => {
    if (tenantParam && tenantParam.trim()) {
      try {
        whiteLabelEngine.switchTenant(tenantParam.trim());
      } catch {}
    }
  }, [tenantParam]);

  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;
  const appName = branding?.appName || DEFAULT_APP_CONFIG.branding.appName;

  // Estados do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [receberWhatsApp, setReceberWhatsApp] = useState(true);

  // Estados de feedback operacional
  const [carregando, setCarregando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

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
      setErroCadastro("Digite seu nome completo (ao menos 3 letras).");
      return;
    }
    if (rawTelefone.length < 10) {
      setErroCadastro("Digite um número de celular válido com DDD.");
      return;
    }
    if (rawCpf.length !== 11) {
      setErroCadastro("Digite um CPF válido com 11 dígitos.");
      return;
    }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErroCadastro("Digite um e-mail válido.");
      return;
    }
    if (senha.length < 6) {
      setErroCadastro("A senha de acesso deve ter pelo menos 6 caracteres.");
      return;
    }
    if (!fotoUrl) {
      setErroCadastro("Tire sua foto de identificação para segurança no embarque.");
      return;
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
        tenantId: tenantParam || undefined,
      });

      if (!res.success) {
        setErroCadastro(res.error || "Não foi possível concluir o cadastro. Tente novamente.");
        setCarregando(false);
        return;
      }

      setSucesso(true);
      const targetTenant = tenantParam || whiteLabelEngine.getActiveTenantId() || "default";
      const dest = targetTenant && targetTenant !== "default"
        ? `/app?tenant=${encodeURIComponent(targetTenant)}`
        : "/app";
      setTimeout(() => {
        void navigate({ to: dest as any, replace: true });
      }, 1200);
    } catch (err: any) {
      setErroCadastro(err?.message || "Instabilidade na conexão. Verifique sua internet.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col font-sans transition-colors duration-200 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]"
      style={{
        backgroundColor: colors.background,
        color: colors.textPrimary,
        fontFamily: ui.fontFamily,
      }}
    >
      {/* Top Header Limpo e Simétrico */}
      <header className="mx-auto w-full max-w-md pt-[max(0.5rem,calc(env(safe-area-inset-top,0px)))] flex items-center justify-between pb-3">
        <Link
          to="/"
          search={tenantParam ? { tenant: tenantParam } : undefined}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition active:scale-95 shadow-2xs"
          aria-label="Voltar para início"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </Link>

        <span
          className="text-xs font-bold tracking-tight flex items-center gap-1.5 px-3 py-1 rounded-full border"
          style={{
            borderColor: `${colors.primary}25`,
            backgroundColor: `${colors.primary}0D`,
            color: colors.primary,
          }}
        >
          <Zap className="h-3 w-3" />
          <span>Passageiro</span>
        </span>

        <Link
          to="/auth"
          search={{ role: "PASSAGEIRO", ...(tenantParam ? { tenant: tenantParam } : {}) }}
          className="text-xs font-bold hover:underline transition px-2 py-1"
          style={{ color: colors.primary }}
        >
          Entrar
        </Link>
      </header>

      {/* Conteúdo Central */}
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col justify-start py-2 pb-8 sm:pb-12">
        {!sucesso ? (
          <div
            className="w-full p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-100/80 transition-all duration-200 relative"
            style={{ borderRadius: ui.borderRadius || "1.25rem" }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cabeçalho do Card */}
              <div className="text-center pb-1">
                <h1
                  className="text-xl sm:text-[22px] font-black tracking-tight"
                  style={{ color: colors.textPrimary }}
                >
                  Criar conta de Passageiro
                </h1>
                <p className="text-xs mt-1 font-normal" style={{ color: colors.textSecondary }}>
                  Suas corridas com preço justo, rapidez e segurança
                </p>
                <div
                  className="w-7 h-0.5 rounded-full mx-auto mt-2 transition-colors"
                  style={{ backgroundColor: colors.primary }}
                />
              </div>

              {/* Banner de Erro Não-Intrusivo */}
              {erroCadastro && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2 animate-in fade-in"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span className="leading-snug">{erroCadastro}</span>
                </div>
              )}

              {/* Bloco 1: Dados Pessoais Básicos */}
              <div className="space-y-3">
                <NativeInput
                  label="Nome completo"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome e sobrenome"
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <NativeInput
                    label="Celular"
                    required
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    placeholder="(82) 99999-9999"
                    leftIcon={
                      <div className="flex items-center gap-0.5 text-[11px] font-bold text-slate-700 select-none">
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

                {/* Senha com Toggle de Visualização */}
                <div className="text-left space-y-1.5">
                  <label className="block text-xs font-semibold tracking-tight select-none text-slate-800">
                    Criar senha de acesso <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition"
                      style={{
                        borderRadius: ui.borderRadius || "0.75rem",
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

                {/* Foto de Identificação Integrada */}
                <div className="pt-1">
                  <CameraPhotoCapture
                    label="Foto de identificação"
                    sublabel="Sua selfie para identificação segura no embarque"
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
                </div>
              </div>

              {/* Preferência WhatsApp */}
              <div className="flex items-center gap-2 pt-1">
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
                  className="text-xs font-medium cursor-pointer leading-tight select-none text-slate-600"
                >
                  Receber comprovantes de viagens e código PIN no WhatsApp
                </label>
              </div>

              {/* Botão de Envio e Link de Login */}
              <div className="pt-2 space-y-2.5">
                <button
                  id="btn-confirmar-cadastro"
                  type="submit"
                  disabled={carregando}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: ui.borderRadius || "0.75rem",
                  }}
                  className="w-full py-3.5 px-4 text-white text-xs sm:text-sm font-bold tracking-wide shadow-md flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  {carregando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Criando conta...</span>
                    </>
                  ) : (
                    <span>Criar minha conta</span>
                  )}
                </button>

                <div className="text-center pt-1">
                  <Link
                    to="/auth"
                    search={{ role: "PASSAGEIRO", ...(tenantParam ? { tenant: tenantParam } : {}) }}
                    className="inline-flex items-center justify-center text-xs font-medium hover:underline py-1 transition-colors text-slate-600"
                  >
                    Já tem uma conta?{" "}
                    <span className="font-bold underline ml-1" style={{ color: colors.primary }}>
                      Entrar
                    </span>
                  </Link>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <NativeSurface
            elevation={2}
            padding="lg"
            className="text-center space-y-4 animate-in zoom-in-95 bg-white border border-slate-200"
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
              style={{
                backgroundColor: `${colors.primary}15`,
                color: colors.primary,
              }}
            >
              <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">
                Conta criada com sucesso
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bem-vindo ao {appName}, <span className="font-bold text-slate-900">{nome}</span>. Seu cadastro está ativo.
              </p>
            </div>

            <div className="pt-3 space-y-2.5">
              <Link
                to="/app"
                search={tenantParam ? { tenant: tenantParam } : undefined}
                className="block w-full"
              >
                <NativeButton variant="filled" size="md" fullWidth>
                  Acessar aplicativo agora
                </NativeButton>
              </Link>
              <Link
                to="/"
                search={tenantParam ? { tenant: tenantParam } : undefined}
                className="block w-full"
              >
                <NativeButton variant="outlined" size="md" fullWidth>
                  Voltar ao início
                </NativeButton>
              </Link>
            </div>
          </NativeSurface>
        )}
      </main>

      <footer className="text-center text-[11px] text-slate-400 py-2">
        {appName} Mobilidade Urbana & Logística Expressa
      </footer>
    </div>
  );
}
