import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  ShieldAlert,
  X,
} from "lucide-react";
import { loginAdmin, isAutenticadoAdmin } from "@/lib/admin-rbac";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";

export const Route = createFileRoute("/app/admin/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login Administrativo | PARTIU" },
      {
        name: "description",
        content:
          "Área de autenticação restrita para o Proprietário e Administradores da plataforma PARTIU.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [modalEsqueciSenha, setModalEsqueciSenha] = useState(false);

  useEffect(() => {
    if (isAutenticadoAdmin()) {
      void navigate({ to: "/app/admin" });
    }
  }, [navigate]);

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#10335c]">
      {/* Coluna Esquerda: Fotografia de mobilidade urbana em tela cheia no Desktop */}
      <div className="hidden lg:block lg:w-1/2 relative min-h-screen overflow-hidden bg-slate-900 select-none">
        <img
          src="/assets/admin-login-hero.png"
          alt="Mobilidade urbana conectada"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        {/* Gradiente sutil apenas na borda direita para transição suave com o fundo azul marinho */}
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-[#10335c]/30 pointer-events-none" />
      </div>

      {/* Coluna Direita: Fundo Azul Marinho com Card Branco Flutuante Centralizado */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[390px] my-auto">
          {/* Card Flutuante Branco Conforme Mockup de Referência */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/25 space-y-5 text-center">
            {/* Cabeçalho */}
            <div>
              <h1 className="text-xl sm:text-[22px] font-black text-[#0c2e59] tracking-tight">
                Acesso Administrativo
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                Entre com suas credenciais para acessar o painel.
              </p>
              {/* Barra decorativa laranja */}
              <div className="w-8 h-1 bg-[#f97316] rounded-full mx-auto mt-3 mb-5" />
            </div>

            {/* Alertas de Erro / Sucesso */}
            {erro && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2.5 text-left animate-in fade-in">
                <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            {sucesso && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-2 text-left animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Autenticado com sucesso. Redirecionando...</span>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Usuário ou e-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0969DA] focus:ring-1 focus:ring-[#0969DA] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    required
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0969DA] focus:ring-1 focus:ring-[#0969DA] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5"
                  >
                    {mostrarSenha ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão de Ação Primária Azul */}
              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3 px-4 rounded-xl bg-[#0969DA] hover:bg-[#0854B0] text-white text-xs font-black tracking-wide shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-5"
              >
                <span>➔</span>
                <span>{carregando ? "Autenticando..." : "ENTRAR"}</span>
              </button>
            </form>

            {/* Link de Recuperação de Senha */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setModalEsqueciSenha(true)}
                className="text-xs text-[#0969DA] hover:underline font-medium cursor-pointer transition-colors"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {/* Rodapé Interno do Card */}
            <div className="border-t border-slate-100 pt-3 mt-4">
              <p className="text-[11px] text-slate-400 text-center">
                © 2026 {branding.appName || "Cliente"} · Mobilidade conectada
              </p>
            </div>
          </div>

          {/* Link para voltar ao portal de passageiros */}
          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-xs text-slate-300/80 hover:text-white transition-colors inline-flex items-center gap-1.5 font-medium"
            >
              <span>←</span>
              <span>Voltar para o Portal de Passageiros</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal / Diálogo Informativo de Recuperação de Senha */}
      {modalEsqueciSenha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0969DA] flex items-center justify-center mx-auto">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Recuperação de Credencial
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Por motivos de segurança operacional, a redefinição de acesso
              administrativo deve ser solicitada diretamente ao Administrador
              Titular da plataforma ou ao suporte corporativo.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalEsqueciSenha(false)}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Compreendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

