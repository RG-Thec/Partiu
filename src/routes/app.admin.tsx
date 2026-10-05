import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Bell,
  Car,
  ChevronDown,
  CreditCard,
  Crown,
  DollarSign,
  Key,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Sliders,
  Sparkles,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  getAdminRole,
  setAdminRole,
  getRoleMetadata,
  isAutenticadoAdmin,
  logoutAdmin,
  getContaAtiva,
  atualizarCredenciaisContaAtiva,
  canAccessModule,
  type AdminRole,
  type AdminAccount,
  type AdminModuleId,
} from "@/lib/admin-rbac";
import { useNavigate } from "@tanstack/react-router";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";

export const Route = createFileRoute("/app/admin")({
  ssr: false,
  component: SuperAdminLayout,
});

interface ItemMenuAdmin {
  to: string;
  label: string;
  icon: any;
  exact: boolean;
  badge?: string;
  moduleId: AdminModuleId;
  descricao: string;
}

/**
 * 🏛️ CENTRAL DE OPERAÇÕES NACIONAL PARTIU — ESTRUTURA OFICIAL V4
 * Estritamente 6 Módulos Operacionais Principais (Padrão Uber / 99 / Stripe)
 */
const MENU_PRINCIPAL: ItemMenuAdmin[] = [
  {
    to: "/app/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
    moduleId: "dashboard",
    descricao: "Centro nervoso & Mapa em tempo real",
  },
  {
    to: "/app/admin/operacao",
    label: "Operação",
    icon: Radio,
    exact: false,
    badge: "Ao Vivo",
    moduleId: "operacao",
    descricao: "Corridas, Entregas & Fila SOS",
  },
  {
    to: "/app/admin/motoristas",
    label: "Motoristas",
    icon: Users,
    exact: false,
    badge: "Carro/Moto",
    moduleId: "motoristas",
    descricao: "Frota & Aprovação Inteligente",
  },
  {
    to: "/app/admin/financeiro",
    label: "Financeiro",
    icon: DollarSign,
    exact: false,
    badge: "D+0",
    moduleId: "financeiro",
    descricao: "Consolidado, Diárias SaaS & Tarifas",
  },
  {
    to: "/app/admin/marketing",
    label: "Marketing",
    icon: Megaphone,
    exact: false,
    badge: "CMS",
    moduleId: "marketing",
    descricao: "Banners Mobile, Cupons & Push",
  },
  {
    to: "/app/admin/configuracoes",
    label: "Configurações",
    icon: Sliders,
    exact: false,
    badge: "White Label",
    moduleId: "configuracoes",
    descricao: "Modo Essencial & Assistente de Cidades",
  },
];

const ROLES_DISPONIVEIS: { id: AdminRole; label: string; badge: string }[] = [
  { id: "super_admin", label: "Super Admin", badge: "bg-primary-600 text-slate-950" },
  { id: "admin", label: "Administrador", badge: "bg-blue-600 text-white" },
  { id: "franqueado", label: "Franqueado", badge: "bg-indigo-600 text-white" },
  { id: "operador", label: "Operador", badge: "bg-emerald-600 text-white" },
  { id: "suporte", label: "Suporte / SOS", badge: "bg-rose-600 text-white" },
];

function SuperAdminLayout() {
  const navigate = useNavigate();
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;

  const [roleAtiva, setRoleAtiva] = useState<AdminRole>(() => getAdminRole());
  const [contaAtiva, setContaAtiva] = useState<AdminAccount>(() => getContaAtiva());
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [mensagemConta, setMensagemConta] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  const [menuAbertoMobile, setMenuAbertoMobile] = useState(false);
  const [recolhido, setRecolhido] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const href = pathname;
  const isLoginRoute = pathname === "/app/admin/login" || pathname.startsWith("/app/admin/login");

  // Proteger rotas filhas do Admin se não for a rota de login
  useEffect(() => {
    if (!isLoginRoute && !isAutenticadoAdmin()) {
      void navigate({ to: "/app/admin/login" });
    }
  }, [isLoginRoute, navigate]);

  // Escutar eventos de alteração de papel ou conta
  useEffect(() => {
    function onRoleChange(e: any) {
      if (e.detail?.role) {
        setRoleAtiva(e.detail.role);
        setContaAtiva(getContaAtiva());
      }
    }
    function onAccountChange() {
      setContaAtiva(getContaAtiva());
    }
    window.addEventListener("partiu:role-changed", onRoleChange);
    window.addEventListener("partiu:account-updated", onAccountChange);
    return () => {
      window.removeEventListener("partiu:role-changed", onRoleChange);
      window.removeEventListener("partiu:account-updated", onAccountChange);
    };
  }, []);

  function handleTrocarRole(novaRole: AdminRole) {
    setAdminRole(novaRole);
    setRoleAtiva(novaRole);
    setContaAtiva(getContaAtiva());
  }

  function handleLogout() {
    logoutAdmin();
    void navigate({ to: "/app/admin/login" });
  }

  function abrirModalConta() {
    const atual = getContaAtiva();
    setNovoEmail(atual.email);
    setNovoNome(atual.nome);
    setNovaSenha("");
    setMensagemConta(null);
    setModalContaAberto(true);
  }

  function handleSalvarConta(e: React.FormEvent) {
    e.preventDefault();
    setMensagemConta(null);
    const res = atualizarCredenciaisContaAtiva(novoEmail, novaSenha, novoNome);
    if (!res.sucesso) {
      setMensagemConta({ tipo: "erro", texto: res.mensagem });
      return;
    }
    setMensagemConta({ tipo: "sucesso", texto: "Credenciais atualizadas com sucesso!" });
    setContaAtiva(getContaAtiva());
    setTimeout(() => {
      setModalContaAberto(false);
    }, 1200);
  }

  const roleMeta = getRoleMetadata(roleAtiva);

  // Filtrar estritamente os módulos autorizados para o perfil ativo
  const menuFiltrado = MENU_PRINCIPAL.filter((item) => canAccessModule(item.moduleId, roleAtiva));

  if (isLoginRoute) {
    return <Outlet />;
  }

  return (
    <div
      className="admin-scope min-h-screen w-full flex flex-col md:flex-row text-slate-900 font-sans"
      style={{ backgroundColor: colors.background }}
    >
      {/* 1. Sidebar Fixa no Desktop (6 Módulos Oficiais) */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-slate-950 text-white border-r border-slate-800 shrink-0 sticky top-0 h-screen transition-all duration-300 z-40 ${
          recolhido ? "w-24 p-3" : "w-80 lg:w-96 xl:w-[410px] p-5 sm:p-6"
        }`}
      >
        <div className="space-y-4 sm:space-y-5 flex-1 flex flex-col min-h-0">
          {/* Topo da Sidebar: Logo & Botão de Recolher */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            {!recolhido ? (
              <Link to="/app/admin" className="flex items-center gap-3.5 min-w-0">
                <div
                  className="flex h-13 w-13 items-center justify-center text-white shadow-md shrink-0 font-black rounded-2xl"
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: ui.borderRadius,
                    boxShadow: ui.buttonShadow,
                  }}
                >
                  <Zap className="h-7 w-7 fill-white stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl lg:text-2xl font-black tracking-tight leading-none text-white truncate">
                    {branding.appName.toUpperCase()} <span style={{ color: colors.primary }}>OPERATIONS</span>
                  </p>
                  <span
                    className="text-xs sm:text-sm lg:text-base font-black tracking-wider uppercase mt-1.5 block truncate"
                    style={{ color: colors.primary }}
                  >
                    {roleMeta.titulo}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="mx-auto">
                <div
                  className="flex h-12 w-12 items-center justify-center text-white shadow-md rounded-2xl"
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: ui.borderRadius,
                    boxShadow: ui.buttonShadow,
                  }}
                >
                  <Zap className="h-6 w-6 fill-white stroke-[2.5]" />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setRecolhido(!recolhido)}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800 cursor-pointer ${
                recolhido ? "mx-auto mt-1" : ""
              }`}
              title={recolhido ? "Expandir Menu" : "Recolher Menu"}
            >
              {recolhido ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>

          {/* Seletor de Perfil RBAC (5 Perfis Nacionais) */}
          {!recolhido && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wider text-slate-400">
                  Perfil Operacional (RBAC)
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <select
                value={roleAtiva}
                onChange={(e) => handleTrocarRole(e.target.value as AdminRole)}
                className="w-full bg-slate-950 border border-slate-800 text-sm sm:text-base font-black text-white rounded-2xl px-4 py-3 h-13 sm:h-14 focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
              >
                {ROLES_DISPONIVEIS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-950 text-white font-bold text-base py-1">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 6 MÓDULOS OFICIAIS DE NAVEGAÇÃO */}
          <nav className="flex-1 overflow-y-auto space-y-2.5 custom-admin-scrollbar pr-0.5">
            {!recolhido && (
              <p className="px-2 pt-1 text-xs sm:text-sm lg:text-base font-black uppercase tracking-wider text-slate-400">
                Menu de Operações ({menuFiltrado.length})
              </p>
            )}

            {menuFiltrado.map((item) => {
              const Icon = item.icon;
              const isAtivo = item.exact
                ? href === item.to || href === item.to + "/"
                : href.startsWith(item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={
                    isAtivo
                      ? {
                          backgroundColor: colors.primary,
                          color: "#FFFFFF",
                          borderRadius: ui.borderRadius,
                          boxShadow: ui.buttonShadow,
                        }
                      : { borderRadius: ui.borderRadius }
                  }
                  className={`group flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 text-base sm:text-lg font-bold transition-all relative min-h-[64px] ${
                    isAtivo
                      ? "font-black"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  } ${recolhido ? "justify-center px-2" : ""}`}
                  title={recolhido ? item.label : undefined}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Icon
                      className={`h-6 w-6 sm:h-7 sm:w-7 shrink-0 transition-transform group-hover:scale-110 ${
                        isAtivo ? "text-white stroke-[2.5]" : "text-slate-400"
                      }`}
                    />
                    {!recolhido && (
                      <div className="truncate">
                        <p className="truncate text-base sm:text-lg xl:text-xl font-black leading-snug">{item.label}</p>
                        <span className={`text-xs sm:text-sm xl:text-base block font-medium truncate mt-1 ${
                          isAtivo ? "text-white/95 font-semibold" : "text-slate-400"
                        }`}>
                          {item.descricao}
                        </span>
                      </div>
                    )}
                  </div>

                  {!recolhido && item.badge && (
                    <span
                      className={`ml-2 px-3 py-1 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shrink-0 ${
                        isAtivo
                          ? "bg-slate-950 text-white"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar: Sessão & Logout */}
        <div className="border-t border-slate-800/80 pt-4 mt-2 space-y-2">
          {!recolhido ? (
            <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80">
              <div className="min-w-0 pr-2">
                <p className="text-base sm:text-lg font-black text-white truncate">{contaAtiva.nome}</p>
                <p className="text-xs sm:text-sm lg:text-base text-slate-400 truncate mt-0.5 font-medium">{contaAtiva.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="mx-auto h-12 w-12 rounded-2xl bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      {/* 2. Container Principal & Topbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="min-h-20 sm:min-h-24 h-20 sm:h-24 pt-[env(safe-area-inset-top,0px)] bg-white border-b border-slate-200/80 px-4 sm:px-8 lg:px-10 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3 sm:gap-4 py-1">
            <button
              type="button"
              onClick={() => setMenuAbertoMobile(true)}
              className="flex md:hidden h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition cursor-pointer shrink-0"
              aria-label="Abrir Menu de Navegação"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden sm:flex items-center gap-3 text-base font-semibold text-slate-500">
              <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-900 font-black text-lg sm:text-xl lg:text-2xl">Central Nacional Ativa:</span>
              <span className="bg-slate-100 text-slate-900 px-4 py-1.5 rounded-xl font-mono text-base sm:text-lg font-black border border-slate-200">1.000 Cidades</span>
            </div>

            <div className="flex sm:hidden items-center gap-2.5 min-w-0">
              <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-lg font-black text-slate-900 truncate">PARTIU Ops</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 py-1">
            {/* Atalho Rápido para Operação ao Vivo */}
            <Link
              to="/app/admin/operacao"
              className="flex items-center gap-2.5 px-4 sm:px-6 py-2.5 h-12 sm:h-14 rounded-2xl bg-emerald-50 text-emerald-900 text-xs sm:text-sm lg:text-base font-black border border-emerald-300/80 hover:bg-emerald-100 active:scale-95 transition-all shadow-xs"
            >
              <Radio className="h-5 w-5 animate-pulse text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Operação Realtime</span>
              <span className="sm:hidden text-xs">Ao Vivo</span>
            </Link>

            {/* Minha Conta */}
            <button
              type="button"
              onClick={abrirModalConta}
              className="flex h-12 sm:h-14 items-center gap-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 px-4 sm:px-6 text-xs sm:text-sm lg:text-base font-black text-slate-800 transition-all border border-slate-200 cursor-pointer shadow-xs"
            >
              <Key className="h-5 w-5 text-primary-700 shrink-0" />
              <span className="hidden lg:inline">{contaAtiva.email}</span>
              <span className="lg:hidden text-xs">Conta</span>
            </button>

            {/* Sair */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-12 sm:h-14 px-4 sm:px-6 items-center gap-2 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm lg:text-base font-black hover:bg-red-900 active:scale-95 transition-all cursor-pointer shadow-xs"
              title="Sair da Conta"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 w-full min-w-0 pb-safe">
          <Outlet />
        </main>
      </div>

      {/* 3. Drawer Mobile (Apenas os 6 Módulos) */}
      {menuAbertoMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuAbertoMobile(false)}
          />
          <div className="relative w-[90vw] max-w-sm bg-slate-950 text-white flex flex-col justify-between p-5 sm:p-6 h-full overflow-y-auto shadow-2xl z-10 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-12 w-12 items-center justify-center text-white font-black shrink-0 rounded-2xl"
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: ui.borderRadius,
                    }}
                  >
                    <Zap className="h-6 w-6 fill-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl font-black text-white leading-tight truncate">{branding.appName} Admin</p>
                    <span
                      className="text-xs sm:text-sm font-bold uppercase truncate block mt-0.5"
                      style={{ color: colors.primary }}
                    >
                      {roleMeta.titulo}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuAbertoMobile(false)}
                  className="h-11 w-11 rounded-2xl bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 shrink-0 cursor-pointer"
                  aria-label="Fechar Menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Seletor Mobile de Role */}
              <div className="space-y-2">
                <span className="text-xs sm:text-sm font-black uppercase text-slate-400 block">Perfil de Acesso:</span>
                <select
                  value={roleAtiva}
                  onChange={(e) => handleTrocarRole(e.target.value as AdminRole)}
                  className="w-full bg-slate-900 border border-slate-800 text-sm sm:text-base font-bold text-white rounded-2xl h-13 px-4"
                >
                  {ROLES_DISPONIVEIS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <nav className="space-y-2 pt-2">
                {menuFiltrado.map((item) => {
                  const Icon = item.icon;
                  const isAtivo = item.exact
                    ? href === item.to || href === item.to + "/"
                    : href.startsWith(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMenuAbertoMobile(false)}
                      style={
                        isAtivo
                          ? {
                              backgroundColor: colors.primary,
                              color: "#FFFFFF",
                              borderRadius: ui.borderRadius,
                            }
                          : { borderRadius: ui.borderRadius }
                      }
                      className={`flex items-center justify-between px-4 sm:px-5 py-4 text-base sm:text-lg font-bold transition-all min-h-[58px] rounded-2xl ${
                        isAtivo
                          ? "font-black"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className={`h-6 w-6 ${isAtivo ? "text-white" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-xs sm:text-sm px-3 py-1 rounded-xl bg-slate-900 text-primary-500 font-black">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 text-red-400 text-base font-black hover:bg-red-950 min-h-[56px] cursor-pointer transition active:scale-95"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTA */}
      {modalContaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5"
            style={{ borderRadius: ui.borderRadius }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5">
                <Key className="h-6 w-6" style={{ color: colors.primary }} />
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Credenciais Administrativas</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalContaAberto(false)}
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarConta} className="space-y-4">
              {mensagemConta && (
                <div
                  className={`p-4 rounded-2xl text-sm font-bold ${
                    mensagemConta.tipo === "sucesso"
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                      : "bg-red-50 text-red-900 border border-red-200"
                  }`}
                >
                  {mensagemConta.texto}
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Nome:</label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderRadius: ui.borderRadius,
                  }}
                  className="w-full h-12 sm:h-14 px-4 border text-sm sm:text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">E-mail de Acesso:</label>
                <input
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderRadius: ui.borderRadius,
                  }}
                  className="w-full h-12 sm:h-14 px-4 border text-sm sm:text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">Nova Senha (Opcional):</label>
                <input
                  type="password"
                  placeholder="Deixe em branco para manter a atual"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderRadius: ui.borderRadius,
                  }}
                  className="w-full h-12 sm:h-14 px-4 border text-sm sm:text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalContaAberto(false)}
                  style={{ borderRadius: ui.borderRadius }}
                  className="h-12 sm:h-14 bg-slate-100 text-slate-700 font-black text-xs sm:text-sm hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: ui.borderRadius,
                    boxShadow: ui.buttonShadow,
                  }}
                  className="h-12 sm:h-14 text-white font-black text-xs sm:text-sm hover:brightness-105 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Salvar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
