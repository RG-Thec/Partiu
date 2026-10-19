import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  ShieldAlert,
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FFF8F3] selection:bg-[#FF7A00]/20 selection:text-[#FF5000]">
      {/* Coluna Esquerda: Fotografia Urbana com Camada de Fusão Suave (Overlay & Fade) */}
      <div className="hidden lg:block lg:w-1/2 relative min-h-screen overflow-hidden bg-slate-900 select-none">
        <img
          src="/assets/admin-login-hero.png"
          alt="Mobilidade urbana conectada"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />

        {/* 1. Sutil contraste superior e inferior para profundidade cinematográfica */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />

        {/* 2. Máscara de transição gradual na borda de encontro (elimina o corte seco vertical) */}
        <div
          className="absolute inset-y-0 right-0 w-36 xl:w-52 bg-gradient-to-r from-transparent via-[#FFF8F3]/60 to-[#FFF8F3] pointer-events-none"
          style={{
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        />
      </div>

      {/* Coluna Direita: Fundo Laranja Degradê Suave com Card Glassmorphism */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-gradient-to-br from-[#FFFFFF] via-[#FFF9F5] to-[#FFEFE5]">
        {/* Esferas de Iluminação Suave em Tons de Laranja no Fundo (Ambient Mesh Glow) */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-[#FF7A00]/12 to-[#FF5000]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-[#FF8A00]/10 to-[#FF5E00]/5 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-gradient-to-b from-[#FFF5EE]/60 to-transparent blur-2xl pointer-events-none" />

        {/* Container Centralizado do Formulário */}
        <div className="w-full max-w-[400px] my-auto relative z-10">
          {/* Card Flutuante com Efeito Glassmorphism & Elevação Suave */}
          <div
            className="rounded-3xl p-6 sm:p-8 space-y-5 text-center transition-all duration-300"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.88)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.9)",
              boxShadow:
                "0 20px 40px -15px rgba(255, 122, 0, 0.12), 0 0 20px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
            }}
          >
            {/* Cabeçalho do Card */}
            <div>
              <h1 className="text-xl sm:text-[22px] font-black text-[#1E2022] tracking-tight">
                Acesso Administrativo
              </h1>
              <p className="text-xs text-[#6B7280] mt-1 font-normal">
                Entre com suas credenciais para acessar o painel.
              </p>
              {/* Barra decorativa laranja vibrante com gradiente */}
              <div className="w-10 h-1 bg-gradient-to-r from-[#FF7A00] to-[#FF5000] rounded-full mx-auto mt-3 mb-5 shadow-xs shadow-orange-500/30" />
            </div>

            {/* Alertas de Erro / Sucesso */}
            {erro && (
              <div className="rounded-2xl bg-red-50/90 border border-red-200/80 p-3 text-xs text-red-700 flex items-start gap-2.5 text-left animate-in fade-in">
                <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            {sucesso && (
              <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200/80 p-3 text-xs text-emerald-700 flex items-center gap-2 text-left animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Autenticado com sucesso. Redirecionando...</span>
              </div>
            )}

            {/* Formulário com Micro-interações na Paleta Laranja */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Usuário ou e-mail
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] group-focus-within:text-[#FF7A00] transition-colors duration-200 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/90 border border-[#E5E7EB] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#1E2022] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] group-focus-within:text-[#FF7A00] transition-colors duration-200 pointer-events-none" />
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    required
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-white/90 border border-[#E5E7EB] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#1E2022] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FF7A00] focus:ring-2 focus:ring-[#FF7A00]/20 focus:bg-white transition-all duration-200 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#FF7A00] focus:outline-none cursor-pointer p-0.5 transition-colors duration-200"
                  >
                    {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Botão de Ação Primária: Gradiente Laranja de Alta Energia & Efeito Hover */}
              <button
                type="submit"
                disabled={carregando}
                className="w-full py-3 px-4 rounded-xl text-white text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-all duration-200 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-5 transform hover:-translate-y-0.5 active:translate-y-0 shadow-[0_10px_20px_-5px_rgba(255,106,0,0.4)] hover:shadow-[0_14px_25px_-5px_rgba(255,106,0,0.5)] active:shadow-[0_4px_10px_-2px_rgba(255,106,0,0.4)]"
                style={{
                  background: "linear-gradient(135deg, #FF7A00 0%, #FF5000 100%)",
                }}
              >
                <ArrowRight className="h-4 w-4" />
                <span>{carregando ? "Autenticando..." : "ENTRAR"}</span>
              </button>
            </form>

            {/* Link de Recuperação de Senha */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setModalEsqueciSenha(true)}
                className="text-xs text-[#6B7280] hover:text-[#FF6B00] hover:underline font-medium cursor-pointer transition-colors duration-200"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {/* Rodapé Interno do Card */}
            <div className="border-t border-[#F3F4F6] pt-3 mt-4">
              <p className="text-[11px] text-[#9CA3AF] text-center">
                © 2026 {branding.appName || "PARTIU"} · Mobilidade conectada
              </p>
            </div>
          </div>

          {/* Link para voltar ao portal de passageiros */}
          <div className="text-center mt-6 relative z-10">
            <Link
              to="/"
              className="text-xs text-[#6B7280] hover:text-[#FF6B00] hover:underline transition-colors duration-200 inline-flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar para o Portal de Passageiros</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal / Diálogo Informativo de Recuperação de Senha em Paleta Laranja */}
      {modalEsqueciSenha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center border border-white/80"
            style={{
              boxShadow: "0 25px 50px -12px rgba(255, 122, 0, 0.15)",
            }}
          >
            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#FF7A00] flex items-center justify-center mx-auto border border-orange-100 shadow-xs">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-base font-black text-[#1E2022]">Recuperação de Credencial</h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Por motivos de segurança operacional, a redefinição de acesso administrativo deve ser
              solicitada diretamente ao Administrador Titular da plataforma ou ao suporte
              corporativo.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalEsqueciSenha(false)}
                className="w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #FF7A00 0%, #FF5000 100%)",
                }}
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
