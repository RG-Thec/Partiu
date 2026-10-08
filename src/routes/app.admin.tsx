import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Car,
  CheckCircle2,
  ChevronRight,
  Compass,
  CreditCard,
  DollarSign,
  Globe,
  Key,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PhoneCall,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  TrendingUp,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  useAlertasSOS,
  useAlertasSOSRealtime,
  useMotoristas,
} from "@/lib/partiu-db";
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
import { AdminCityProvider } from "@/contexts/AdminCityContext";
import { AdminCitySelector } from "@/components/admin/AdminCitySelector";

export const Route = createFileRoute("/app/admin")({
  ssr: false,
  component: SuperAdminLayout,
});

export interface ItemMenuAdmin {
  to: string;
  label: string;
  icon: any;
  exact: boolean;
  badge?: string;
  badgeVariant?: "default" | "critical" | "warning";
  moduleId: AdminModuleId;
}

export interface CategoriaMenuAdmin {
  id: string;
  titulo: string;
  itens: ItemMenuAdmin[];
}

/**
 * 🏛️ CENTRAL DE OPERAÇÕES NACIONAL PARTIU — ESTRUTURA OFICIAL ENXUTA
 * Menu principal consolidado nos 5-6 módulos essenciais de alta produtividade.
 */
const CATEGORIAS_MENU_ADMIN: CategoriaMenuAdmin[] = [
  {
    id: "operacao_saas",
    titulo: "Navegação Principal",
    itens: [
      {
        to: "/app/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
        moduleId: "dashboard",
      },
      {
        to: "/app/admin/motoristas",
        label: "Motoristas & Assinaturas",
        icon: Users,
        exact: false,
        moduleId: "motoristas",
      },
      {
        to: "/app/admin/despacho",
        label: "Corridas & Radar",
        icon: Radio,
        exact: false,
        moduleId: "operacao",
      },
      {
        to: "/app/admin/meu-aplicativo",
        label: "Meu Aplicativo / APK",
        icon: Smartphone,
        exact: false,
        moduleId: "aplicativo",
      },
      {
        to: "/app/admin/whitelabel",
        label: "Identidade & White Label",
        icon: Palette,
        exact: false,
        moduleId: "whitelabel",
      },
      {
        to: "/app/admin/dominios",
        label: "Domínios & DNS",
        icon: Globe,
        exact: false,
        moduleId: "dominios",
      },
      {
        to: "/app/admin/financeiro",
        label: "Financeiro & SaaS",
        icon: DollarSign,
        exact: false,
        moduleId: "financeiro",
      },
      {
        to: "/app/admin/configuracoes",
        label: "Configurações",
        icon: Sliders,
        exact: false,
        moduleId: "configuracoes",
      },
      {
        to: "/app/admin/sos",
        label: "Central SOS 190",
        icon: ShieldAlert,
        exact: false,
        badgeVariant: "critical",
        moduleId: "operacao",
      },
    ],
  },
];

/**
 * Catálogo completo de módulos do sistema indexados na Command Palette (Ctrl+K)
 */
const TODOS_MODULOS_SISTEMA = [
  { to: "/app/admin", label: "Dashboard Geral", categoriaTitulo: "Comando", icon: LayoutDashboard },
  { to: "/app/admin/motoristas", label: "Motoristas & Assinaturas", categoriaTitulo: "Cadastros", icon: Users },
  { to: "/app/admin/aprovacoes", label: "Fila de Aprovações (CNH/OCR)", categoriaTitulo: "Cadastros", icon: UserCheck },
  { to: "/app/admin/passageiros", label: "Passageiros Cadastrados", categoriaTitulo: "Cadastros", icon: User },
  { to: "/app/admin/despacho", label: "Corridas & Despacho", categoriaTitulo: "Operação", icon: PhoneCall },
  { to: "/app/admin/operacao", label: "Cockpit Operacional ao Vivo", categoriaTitulo: "Operação", icon: Radio },
  { to: "/app/admin/meu-aplicativo", label: "Meu Aplicativo & PWA / APK", categoriaTitulo: "Aplicativo", icon: Smartphone },
  { to: "/app/admin/dominios", label: "Domínios & DNS (White-Label)", categoriaTitulo: "Sistema", icon: Globe },
  { to: "/app/admin/sos", label: "Central SOS 190 (Emergências)", categoriaTitulo: "Operação", icon: ShieldAlert },
  { to: "/app/admin/veiculo", label: "Categorias & Veículos", categoriaTitulo: "Operação", icon: Car },
  { to: "/app/admin/frota", label: "Vistorias de Frota", categoriaTitulo: "Operação", icon: UserCheck },
  { to: "/app/admin/locais", label: "Cidades & Praças", categoriaTitulo: "Operação", icon: MapPin },
  { to: "/app/admin/financeiro", label: "Cockpit Financeiro", categoriaTitulo: "Finanças", icon: DollarSign },
  { to: "/app/admin/monetizacao", label: "Planos SaaS & Diárias", categoriaTitulo: "Finanças", icon: CreditCard },
  { to: "/app/admin/caixa", label: "Fechamento de Caixa", categoriaTitulo: "Finanças", icon: Layers },
  { to: "/app/admin/configuracoes", label: "Configurações Globais", categoriaTitulo: "Sistema", icon: Sliders },
  { to: "/app/admin/whitelabel", label: "White Label Studio", categoriaTitulo: "Sistema", icon: Palette },
  { to: "/app/admin/governanca", label: "Governança & LGPD", categoriaTitulo: "Sistema", icon: ShieldCheck },
  { to: "/app/admin/marketing", label: "Banners & Cupons", categoriaTitulo: "Marketing", icon: Megaphone },
  { to: "/app/admin/afiliados", label: "Clube & B2B", categoriaTitulo: "Marketing", icon: Layers },
  { to: "/app/admin/growth", label: "Indique & Ganhe", categoriaTitulo: "Marketing", icon: TrendingUp },
  { to: "/app/admin/diagnostico", label: "Diagnóstico GNSS", categoriaTitulo: "Comando", icon: Activity },
  { to: "/app/admin/api-finops", label: "FinOps de APIs", categoriaTitulo: "Operação", icon: Compass },
];

const ROLES_DISPONIVEIS: { id: AdminRole; label: string; badge: string }[] = [
  { id: "SUPER_ADMIN", label: "Super Administrador (Acesso Total)", badge: "bg-primary-600 text-slate-950" },
  { id: "FRANQUEADO", label: "Franqueado (Acesso Local)", badge: "bg-indigo-600 text-white" },
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
  const [buscaRapidaAberta, setBuscaRapidaAberta] = useState(false);
  const [termoBuscaRapida, setTermoBuscaRapida] = useState("");

  // Atalho Global de Teclado (Ctrl+K ou Cmd+K para abrir; Escape para fechar)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscaRapidaAberta((prev) => !prev);
      } else if (e.key === "Escape" && buscaRapidaAberta) {
        setBuscaRapidaAberta(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [buscaRapidaAberta]);

  // Monitoramento em tempo real de SOS e Cadastros Pendentes
  useAlertasSOSRealtime();
  const { data: alertasSOS = [] } = useAlertasSOS();
  const { data: motoristasBanco = [] } = useMotoristas();

  const chamadosSOSAtivos = useMemo(() => {
    return alertasSOS.filter((a) => a.status !== "resolvido").length;
  }, [alertasSOS]);

  const motoristasPendentes = useMemo(() => {
    return motoristasBanco.filter((m: any) => m.status_aprovacao === "pendente" || m.status === "pendente").length;
  }, [motoristasBanco]);

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

  // Filtrar categorias e itens estritamente pelos módulos autorizados no RBAC e aplicar badges dinâmicos
  const categoriasFiltradas: CategoriaMenuAdmin[] = useMemo(() => {
    return CATEGORIAS_MENU_ADMIN
      .map((cat) => {
        const itensAutorizados = cat.itens
          .filter((item) => canAccessModule(item.moduleId, roleAtiva))
          .map((item) => {
            if (item.to === "/app/admin/sos" || item.to === "/app/admin/operacao") {
              if (chamadosSOSAtivos > 0) {
                return {
                  ...item,
                  badge: `${chamadosSOSAtivos} SOS`,
                  badgeVariant: "critical" as const,
                };
              }
            }
            if (item.to === "/app/admin/aprovacoes") {
              if (motoristasPendentes > 0) {
                return {
                  ...item,
                  badge: `${motoristasPendentes}`,
                  badgeVariant: "warning" as const,
                };
              }
            }
            return item;
          });

        return {
          ...cat,
          itens: itensAutorizados,
        };
      })
      .filter((cat) => cat.itens.length > 0);
  }, [roleAtiva, chamadosSOSAtivos, motoristasPendentes]);

  // Lista de módulos para a Command Palette (Ctrl+K)
  const itensBuscaRapida = useMemo(() => {
    const permitidos = TODOS_MODULOS_SISTEMA.filter((mod) => {
      // Se for franqueado, não exibir configurações exclusivas da Matriz/Holding
      if (
        roleAtiva === "FRANQUEADO" &&
        (mod.to.includes("configuracoes") ||
          mod.to.includes("governanca") ||
          mod.to.includes("dominios"))
      ) {
        return false;
      }
      return true;
    });

    if (!termoBuscaRapida.trim()) return permitidos.slice(0, 10);
    const q = termoBuscaRapida.toLowerCase().trim();
    return permitidos.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.categoriaTitulo.toLowerCase().includes(q) ||
        it.to.toLowerCase().includes(q)
    );
  }, [roleAtiva, termoBuscaRapida]);

  // Busca rápida de motoristas/veículos/placas na Command Palette (Ctrl+K)
  const motoristasEncontrados = useMemo(() => {
    if (!termoBuscaRapida.trim() || termoBuscaRapida.trim().length < 2) return [];
    const q = termoBuscaRapida.toLowerCase().trim();
    return motoristasBanco
      .filter((m: any) => {
        const nome = (m.full_name || m.nome || "").toLowerCase();
        const placa = (m.vehicle_plate || m.placa || "").toLowerCase();
        const fone = (m.phone || m.telefone || "").toLowerCase();
        const modelo = (m.vehicle_model || m.modelo || "").toLowerCase();
        return nome.includes(q) || placa.includes(q) || fone.includes(q) || modelo.includes(q);
      })
      .slice(0, 6);
  }, [motoristasBanco, termoBuscaRapida]);

  if (isLoginRoute) {
    return <Outlet />;
  }

  return (
    <AdminCityProvider>
      <div
        className="admin-scope h-screen max-h-screen overflow-hidden w-full flex flex-col md:flex-row text-slate-900 font-sans"
        style={{ backgroundColor: colors.background }}
      >
        {/* 1. Sidebar Fixa no Desktop (Estende 100% até o Rodapé) */}
        <aside
          className={`hidden md:flex flex-col justify-between bg-slate-950 text-white border-r border-slate-800/80 shrink-0 sticky top-0 h-screen max-h-screen h-[100dvh] transition-all duration-300 z-40 select-none ${
            recolhido ? "w-16 p-2" : "w-56 lg:w-60 p-3"
          }`}
        >
          {/* Topo da Sidebar: Brand & Collapse */}
          <div className="shrink-0 space-y-2 pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              {!recolhido ? (
                <Link to="/app/admin" className="flex items-center gap-2 min-w-0 group">
                  <div
                    className="flex h-8 w-8 items-center justify-center text-white shadow-xs shrink-0 font-black rounded-lg transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: ui.borderRadius,
                      boxShadow: ui.buttonShadow,
                    }}
                  >
                    <Zap className="h-4 w-4 fill-white stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black tracking-tight leading-none text-white truncate">
                      {branding.appName.toUpperCase()} <span style={{ color: colors.primary }}>OPS</span>
                    </p>
                    <span
                      className="text-[10px] font-bold tracking-wider uppercase mt-0.5 block truncate"
                      style={{ color: colors.primary }}
                    >
                      {roleMeta.titulo}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="mx-auto">
                  <div
                    className="flex h-8 w-8 items-center justify-center text-white shadow-xs rounded-lg"
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: ui.borderRadius,
                      boxShadow: ui.buttonShadow,
                    }}
                  >
                    <Zap className="h-4 w-4 fill-white stroke-[2.5]" />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setRecolhido(!recolhido)}
                className={`flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800 cursor-pointer ${
                  recolhido ? "mx-auto mt-0.5" : ""
                }`}
                title={recolhido ? "Expandir Menu" : "Recolher Menu"}
              >
                {recolhido ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Seletor de Perfil RBAC */}
            {!recolhido && (
              <div className="px-2 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/90 flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Perfil:
                </span>
                <select
                  value={roleAtiva}
                  onChange={(e) => handleTrocarRole(e.target.value as AdminRole)}
                  className="w-full bg-slate-950 border border-slate-800 text-[10px] font-bold text-white rounded-md px-1.5 py-0.5 h-6.5 focus:ring-1 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
                >
                  {ROLES_DISPONIVEIS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-950 text-white font-bold text-xs py-1">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Navegação Categorizada Limpa (Sem duplicações e sem textões) */}
          <nav className="flex-1 overflow-y-auto space-y-3 custom-admin-scrollbar pr-0.5 py-2 min-h-0">
            {categoriasFiltradas.map((cat) => (
              <div key={cat.id} className="space-y-0.5">
                {!recolhido && (
                  <p className="px-2 pt-1 pb-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    {cat.titulo}
                  </p>
                )}

                <div className="space-y-0.5">
                  {cat.itens.map((item) => {
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
                        className={`group flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold transition-all relative rounded-lg ${
                          isAtivo
                            ? "font-black text-white shadow-xs"
                            : "text-slate-300 hover:bg-slate-900/90 hover:text-white"
                        } ${recolhido ? "justify-center px-1" : ""}`}
                        title={recolhido ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                              isAtivo ? "text-white stroke-[2.5]" : "text-slate-400 group-hover:text-slate-200"
                            }`}
                          />
                          {!recolhido && (
                            <span className="truncate text-[11px] leading-tight font-medium">
                              {item.label}
                            </span>
                          )}
                        </div>

                        {recolhido && item.badgeVariant === "critical" && (
                          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 animate-pulse border-2 border-slate-950" />
                        )}
                        {recolhido && item.badgeVariant === "warning" && (
                          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 border-2 border-slate-950" />
                        )}

                        {!recolhido && item.badge && (
                          <span
                            className={`ml-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                              item.badgeVariant === "critical"
                                ? "bg-red-600 text-white animate-pulse"
                                : item.badgeVariant === "warning"
                                ? "bg-amber-400 text-slate-950 font-black"
                                : isAtivo
                                ? "bg-slate-950/70 text-white"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Rodapé da Sidebar: Status Realtime & Conta do Administrador */}
          <div className="shrink-0 border-t border-slate-800/80 pt-2 mt-auto space-y-1.5">
            {!recolhido ? (
              <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-lg border border-slate-800/80 gap-1.5">
                <div
                  onClick={abrirModalConta}
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer hover:opacity-85 transition"
                  title="Configurar perfil e credenciais"
                >
                  <div className="h-6.5 w-6.5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                    {contaAtiva.nome ? contaAtiva.nome.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white truncate leading-tight">{contaAtiva.nome}</p>
                    <p className="text-[9px] text-slate-400 truncate leading-tight">{contaAtiva.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={abrirModalConta}
                    className="h-6.5 w-6.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                    title="Editar Credenciais"
                  >
                    <Key className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-6.5 w-6.5 rounded-md bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 flex items-center justify-center transition cursor-pointer"
                    title="Sair do Painel"
                  >
                    <LogOut className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={abrirModalConta}
                  className="mx-auto h-7.5 w-7.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title={`Conta: ${contaAtiva.nome} (${contaAtiva.email})`}
                >
                  <Key className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mx-auto h-7.5 w-7.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 flex items-center justify-center transition cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* 2. Container Principal & Topbar Executiva */}
        <div className="flex-1 h-screen max-h-screen overflow-hidden flex flex-col min-w-0 bg-slate-50">
          <header className="shrink-0 min-h-12 h-auto pt-[max(0.4rem,calc(env(safe-area-inset-top,0px)+4px))] pb-2 bg-white border-b border-slate-200/80 px-2.5 sm:px-5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-1.5 sm:gap-3 py-0.5 min-w-0 flex-1 mr-2">
              <button
                type="button"
                onClick={() => setMenuAbertoMobile(true)}
                className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition cursor-pointer shrink-0"
                aria-label="Abrir Menu de Navegação"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* Breadcrumb visual contextual */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1 shrink-0">
                <span className="text-slate-400">PARTIU OPS</span>
                <ChevronRight className="h-3 w-3 text-slate-300" />
                <span className="text-slate-800 font-bold">{roleMeta.titulo}</span>
              </div>

              {/* Seletor Global Interativo de Cidade / Praça de Operação */}
              <AdminCitySelector />

              {/* Botão de Busca Rápida / Command Palette (Ctrl+K) */}
              <button
                type="button"
                onClick={() => setBuscaRapidaAberta(true)}
                className="hidden sm:flex items-center gap-2 h-7.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 text-[11px] font-medium transition cursor-pointer"
                title="Acesso Rápido a Módulos (Ctrl+K)"
              >
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden md:inline">Navegar...</span>
                <kbd className="px-1.5 py-0.2 rounded bg-white text-[9px] font-mono text-slate-500 border border-slate-200 shadow-2xs">
                  Ctrl K
                </kbd>
              </button>
              <button
                type="button"
                onClick={() => setBuscaRapidaAberta(true)}
                className="flex sm:hidden h-7.5 w-7.5 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 cursor-pointer shrink-0"
                title="Buscar Módulo (Ctrl+K)"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 py-0.5">
              {/* Alerta SOS em tempo real (Apenas se houver chamado ativo) */}
              {chamadosSOSAtivos > 0 && (
                <Link
                  to="/app/admin/sos"
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 h-7.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold border border-red-500 animate-pulse shadow-xs transition-all shrink-0"
                >
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>{chamadosSOSAtivos} SOS</span>
                </Link>
              )}

              {/* Alerta de Motoristas Pendentes em tempo real (Apenas se houver pendentes) */}
              {motoristasPendentes > 0 && (
                <Link
                  to="/app/admin/aprovacoes"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 h-7.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 text-[11px] font-bold border border-amber-300 shadow-xs transition-all shrink-0"
                >
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>{motoristasPendentes} Pend.</span>
                </Link>
              )}

              {/* Atalho Rápido para Operação ao Vivo */}
              <Link
                to="/app/admin/operacao"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 h-7.5 rounded-lg bg-emerald-50 text-emerald-900 text-[11px] font-bold border border-emerald-300/80 hover:bg-emerald-100 active:scale-95 transition-all shadow-xs"
                title="Operação ao Vivo"
              >
                <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">Ao Vivo</span>
              </Link>

              {/* Conta / Perfil */}
              <button
                type="button"
                onClick={abrirModalConta}
                className="flex h-7.5 items-center gap-1 sm:gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 px-2 sm:px-2.5 text-[11px] font-bold text-slate-800 transition-all border border-slate-200 cursor-pointer shadow-xs"
                title="Configurar Perfil"
              >
                <Key className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">{contaAtiva.nome ? contaAtiva.nome.split(" ")[0] : "Admin"}</span>
              </button>

              {/* Sair */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-7.5 px-2 sm:px-2.5 items-center gap-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-red-950 active:scale-95 transition-all cursor-pointer shadow-xs"
                title="Sair da Conta"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 w-full min-w-0 pb-safe custom-admin-scrollbar">
            <Outlet />
          </main>
        </div>

        {/* 3. Drawer Mobile Categorizado */}
        {menuAbertoMobile && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
              onClick={() => setMenuAbertoMobile(false)}
            />
            <div className="relative w-[85vw] max-w-xs bg-slate-950 text-white flex flex-col justify-between p-4 h-full overflow-y-auto shadow-2xl z-10 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="flex h-8 w-8 items-center justify-center text-white font-black shrink-0 rounded-lg"
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: ui.borderRadius,
                      }}
                    >
                      <Zap className="h-4 w-4 fill-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white leading-tight truncate">{branding.appName} OPS</p>
                      <span
                        className="text-[10px] font-bold uppercase truncate block mt-0.5"
                        style={{ color: colors.primary }}
                      >
                        {roleMeta.titulo}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMenuAbertoMobile(false)}
                    className="h-7 w-7 rounded-lg bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 shrink-0 cursor-pointer"
                    aria-label="Fechar Menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Seletor Mobile de Praça de Operação */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Praça Operacional:</span>
                  <AdminCitySelector />
                </div>

                {/* Categorias e Itens no Mobile */}
                <nav className="space-y-3 pt-1">
                  {categoriasFiltradas.map((cat) => (
                    <div key={cat.id} className="space-y-0.5">
                      <p className="px-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {cat.titulo}
                      </p>
                      <div className="space-y-0.5">
                        {cat.itens.map((item) => {
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
                              className={`flex items-center justify-between px-3 py-2 text-xs font-semibold transition-all rounded-lg ${
                                isAtivo
                                  ? "font-black"
                                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className={`h-4 w-4 ${isAtivo ? "text-white" : "text-slate-400"}`} />
                                <span>{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider ${
                                  item.badgeVariant === "critical"
                                    ? "bg-red-600 text-white animate-pulse"
                                    : item.badgeVariant === "warning"
                                    ? "bg-amber-400 text-slate-950 font-black"
                                    : "bg-slate-900 text-primary-500"
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Rodapé Mobile */}
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <div className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <p className="font-bold text-white truncate">{contaAtiva.nome}</p>
                  <p className="text-[10px] text-slate-400 truncate">{contaAtiva.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-900 text-red-400 text-xs font-bold hover:bg-red-950 cursor-pointer transition active:scale-95"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. MODAL EXECUTIVO: CREDENCIAIS ADMINISTRATIVAS */}
        {modalContaAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-2xl p-5 sm:p-6 space-y-4">
              {/* Topo do Modal */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center shrink-0">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">Credenciais Administrativas</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight">
                      Gerencie os dados de acesso do perfil administrativo
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalContaAberto(false)}
                  className="h-7 w-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSalvarConta} className="space-y-3.5">
                {mensagemConta && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      mensagemConta.tipo === "sucesso"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                        : "bg-red-950/80 text-red-300 border border-red-800"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>{mensagemConta.texto}</span>
                  </div>
                )}

                {/* Nome */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nome Completo:
                  </label>
                  <div className="relative">
                    <User className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      placeholder="Nome do administrador"
                      className="w-full h-8.5 pl-8 pr-3 bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-xs font-medium rounded-lg placeholder:text-slate-600 transition"
                    />
                  </div>
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    E-mail de Acesso:
                  </label>
                  <div className="relative">
                    <Mail className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      required
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      placeholder="email@empresa.com"
                      className="w-full h-8.5 pl-8 pr-3 bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-xs font-medium rounded-lg placeholder:text-slate-600 transition"
                    />
                  </div>
                </div>

                {/* Nova Senha */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nova Senha (Opcional):
                  </label>
                  <div className="relative">
                    <Lock className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="password"
                      placeholder="Deixe em branco para manter a atual"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full h-8.5 pl-8 pr-3 bg-slate-950 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-xs font-medium rounded-lg placeholder:text-slate-600 transition"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Recomendado no mínimo 6 caracteres alfanuméricos.
                  </span>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalContaAberto(false)}
                    className="h-8.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="h-8.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Salvar Dados</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. MODAL COMMAND PALETTE (CTRL+K) — NAVEGAÇÃO ULTRARRÁPIDA */}
        {buscaRapidaAberta && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4 animate-in fade-in duration-150">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setBuscaRapidaAberta(false)}
            />
            <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-white flex flex-col max-h-[75vh]">
              {/* Barra de Entrada da Busca */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/60">
                <Search className="h-4 w-4 text-amber-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={termoBuscaRapida}
                  onChange={(e) => setTermoBuscaRapida(e.target.value)}
                  placeholder="Navegar no painel... (ex: motoristas, diárias, sos, caixa, financeiro)"
                  className="w-full bg-transparent text-xs sm:text-sm font-medium text-white placeholder:text-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setBuscaRapidaAberta(false)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-400 hover:text-white transition cursor-pointer"
                >
                  ESC
                </button>
              </div>

              {/* Lista de Resultados Filtrados */}
              <div className="overflow-y-auto p-2 divide-y divide-slate-800/40 custom-admin-scrollbar space-y-1">
                {/* 1. Seção de Motoristas & Placas (Busca Instantânea de Condutor) */}
                {motoristasEncontrados.length > 0 && (
                  <div className="pb-2">
                    <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      Motoristas &amp; Placas ({motoristasEncontrados.length})
                    </p>
                    <div className="space-y-1 mt-1">
                      {motoristasEncontrados.map((m: any) => {
                        const nome = m.full_name || m.nome || "Motorista Parceiro";
                        const placa = m.vehicle_plate || m.placa || "";
                        const modelo = m.vehicle_model || m.modelo || "";
                        const fone = m.phone || m.telefone || "";
                        const termoBuscaDestino = placa || nome;
                        return (
                          <Link
                            key={m.id}
                            to="/app/admin/motoristas"
                            onClick={() => {
                              setBuscaRapidaAberta(false);
                              setTermoBuscaRapida("");
                              if (typeof window !== "undefined") {
                                const url = new URL(window.location.href);
                                url.pathname = "/app/admin/motoristas";
                                url.searchParams.set("busca", termoBuscaDestino);
                                window.history.pushState({}, "", url.toString());
                                window.dispatchEvent(new Event("popstate"));
                              }
                            }}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/90 transition group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-7 w-7 rounded-lg bg-amber-400/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                                <Car className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                                    {nome}
                                  </p>
                                  {placa && (
                                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-black border border-slate-700">
                                      {placa}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {modelo ? `${modelo} • ` : ""}{fone || "Tel não informado"}
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 shrink-0">
                              Acessar Perfil →
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Seção de Módulos & Ferramentas */}
                {itensBuscaRapida.length > 0 && (
                  <div className="pt-1">
                    {motoristasEncontrados.length > 0 && (
                      <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Módulos do Sistema
                      </p>
                    )}
                    {itensBuscaRapida.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => {
                            setBuscaRapidaAberta(false);
                            setTermoBuscaRapida("");
                          }}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 active:bg-slate-800 transition group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-slate-800 text-slate-300 group-hover:bg-amber-400 group-hover:text-slate-950 transition flex items-center justify-center shrink-0">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                                {item.label}
                              </p>
                              <span className="text-[10px] text-slate-500 truncate block">
                                {item.categoriaTitulo} • {item.to}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 group-hover:text-slate-300">Ir →</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {itensBuscaRapida.length === 0 && motoristasEncontrados.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-xs px-4">
                    Nenhum módulo ou motorista encontrado para &quot;{termoBuscaRapida}&quot;. Digite o nome de um motorista, placa, ou termos como{" "}
                    <strong className="text-slate-400">diárias</strong>,{" "}
                    <strong className="text-slate-400">caixa</strong> ou{" "}
                    <strong className="text-slate-400">sos</strong>.
                  </div>
                )}
              </div>

              {/* Rodapé Informativo */}
              <div className="px-3.5 py-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>Dica: Use as setas ou clique para acessar diretamente</span>
                <span className="font-mono">Pressione ESC para fechar</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminCityProvider>
  );
}
