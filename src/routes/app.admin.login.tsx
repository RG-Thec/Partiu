import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  Lock,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { loginAdmin } from "@/lib/admin-rbac";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";

export const Route = createFileRoute("/app/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login Administrativo & Control Center | PARTIU" },
      {
        name: "description",
        content:
          "Área de autenticação restrita para o Proprietário (Owner) e Administradores da plataforma PARTIU.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const res = await loginAdmin(email, senha);
      if (!res.sucesso) {
        setErro(res.mensagem);
        setCarregando(false);
        return;
      }

      setSucesso(true);
      setTimeout(() => {
        void navigate({ to: "/app/admin" });
      }, 600);
    } catch {
      setErro("Falha inesperada ao validar credenciais administrativas.");
      setCarregando(false);
    }
  }


  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-white relative overflow-hidden">
      {/* Background decorativo cartográfico sutil */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${colors.primary} 1px, transparent 1px), linear-gradient(90deg, ${colors.primary} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header com Logo Oficial e Badge */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-black uppercase border"
            style={{
              backgroundColor: `${colors.primary}20`,
              borderColor: `${colors.primary}40`,
              color: colors.primary,
            }}
          >
            <Car className="h-3.5 w-3.5" style={{ color: colors.primary }} />
            <span>Painel de Comando Executivo • {branding.appName}</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 pt-2">
            <div
              className="flex h-12 w-12 items-center justify-center text-white shadow-xl font-black"
              style={{
                backgroundColor: colors.primary,
                borderRadius: ui.borderRadius,
                boxShadow: ui.buttonShadow,
              }}
            >
              <Car className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tight leading-none text-white">
                {branding.appName} <span style={{ color: colors.primary }}>Admin</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
                Backoffice &amp; Gestão de Mobilidade
              </p>
            </div>
          </div>
        </div>

        {/* Card do Formulário */}
        <div
          className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl"
          style={{ borderRadius: ui.borderRadius }}
        >
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-black text-white">Acesso Restrito</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Entre com as credenciais do seu cargo operacional para gerenciar o sistema.
            </p>
          </div>

          {erro && (
            <div className="rounded-2xl bg-red-950/60 border border-red-500/40 p-3.5 text-xs text-red-200 flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="rounded-2xl bg-emerald-950/60 border border-emerald-500/40 p-3.5 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Autenticado com sucesso! Redirecionando...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@partiumobe.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ borderRadius: ui.borderRadius }}
                  className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  style={{ borderRadius: ui.borderRadius }}
                  className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              style={{
                backgroundColor: colors.primary,
                borderRadius: ui.borderRadius,
                boxShadow: ui.buttonShadow,
              }}
              className="w-full flex h-12 items-center justify-center gap-2 text-white text-xs font-black transition-all hover:brightness-105 active:scale-[0.98] mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{carregando ? "Autenticando..." : "Acessar Painel de Controle"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Link para voltar ao app do passageiro */}
        <div className="text-center">
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold"
          >
            ← Voltar para o Portal de Passageiros
          </Link>
        </div>
      </div>
    </div>
  );
}
