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
  Printer,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Sliders,
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

export interface SubItemMenuAdmin {
  to: string;
  label: string;
  icon?: any;
  badge?: string;
  badgeVariant?: "default" | "critical" | "warning";
}

export interface ItemMenuAdmin {
  to: string;
  label: string;
  icon: any;
  exact: boolean;
  badge?: string;
  badgeVariant?: "default" | "critical" | "warning";
  moduleId: AdminModuleId;
  descricao: string;
  subItens?: SubItemMenuAdmin[];
}

export interface CategoriaMenuAdmin {
  id: string;
  titulo: string;
  itens: ItemMenuAdmin[];
}

/**
 * 🏛️ CENTRAL DE OPERAÇÕES NACIONAL PARTIU — ESTRUTURA OFICIAL V5 POR CATEGORIAS
 * Organização Executiva de Alta Fidelidade (SaaS Enterprise Standard)
 */
const CATEGORIAS_MENU_ADMIN: CategoriaMenuAdmin[] = [
  {
    id: "comando",
    titulo: "Central de Comando",
    itens: [
      {
        to: "/app/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        exact: true,
        moduleId: "dashboard",
        descricao: "Centro nervoso & KPIs ao vivo",
        subItens: [
          { to: "/app/admin", label: "Visão Geral Executiva", icon: LayoutDashboard },
          { to: "/app/admin/diagnostico", label: "Diagnóstico GNSS & WebGL", icon: Activity, badge: "GPS" },
        ],
      },
      {
        to: "/app/admin/diagnostico",
        label: "Diagnóstico GNSS",
        icon: Activity,
        exact: false,
        moduleId: "dashboard",
        badge: "GNSS",
        descricao: "Telemetria & WebGL em tempo real",
      },
    ],
  },
  {
    id: "operacao",
    titulo: "Operação & Frotas",
    itens: [
      {
        to: "/app/admin/operacao",
        label: "Operação ao Vivo",
        icon: Radio,
        exact: false,
        badge: "Ao Vivo",
        moduleId: "operacao",
        descricao: "Corridas, entregas & despachos",
        subItens: [
          { to: "/app/admin/operacao", label: "Fila de Corridas", icon: Radio },
          { to: "/app/admin/sos", label: "Central SOS 190", icon: ShieldAlert, badge: "SOS 24h", badgeVariant: "critical" },
          { to: "/app/admin/despacho", label: "Despacho & Surge", icon: PhoneCall, badge: "Central" },
          { to: "/app/admin/locais", label: "Cidades & Praças", icon: MapPin, badge: "Praças" },
          { to: "/app/admin/veiculo", label: "Categorias & Modelos", icon: Car, badge: "Frota" },
          { to: "/app/admin/frota", label: "Vistoria de Veículos", icon: UserCheck },
          { to: "/app/admin/api-finops", label: "FinOps de APIs & Cache", icon: Compass, badge: "Cache" },
        ],
      },
      {
        to: "/app/admin/sos",
        label: "Central SOS 190",
        icon: ShieldAlert,
        exact: false,
        badge: "SOS 24h",
        badgeVariant: "critical",
        moduleId: "operacao",
        descricao: "Pânico & emergência 24h",
      },
      {
        to: "/app/admin/despacho",
        label: "Despacho & Matching",
        icon: PhoneCall,
        exact: false,
        badge: "Central",
        moduleId: "operacao",
        descricao: "Central telefônica & surge",
      },
      {
        to: "/app/admin/locais",
        label: "Cidades & Praças",
        icon: MapPin,
        exact: false,
        badge: "Praças",
        moduleId: "operacao",
        descricao: "Geofencing & raios operacionais",
      },
      {
        to: "/app/admin/veiculo",
        label: "Categorias & Veículos",
        icon: Car,
        exact: false,
        badge: "Frota",
        moduleId: "operacao",
        descricao: "Carro, Moto, Plus & Delas",
      },
      {
        to: "/app/admin/frota",
        label: "Vistorias de Frota",
        icon: UserCheck,
        exact: false,
        moduleId: "operacao",
        descricao: "Laudos & inspeções veiculares",
      },
      {
        to: "/app/admin/api-finops",
        label: "FinOps de APIs",
        icon: Compass,
        exact: false,
        badge: "APIs",
        moduleId: "operacao",
        descricao: "Cache de mapas & FinOps",
      },
    ],
  },
  {
    id: "usuarios",
    titulo: "Usuários & Cadastros",
    itens: [
      {
        to: "/app/admin/motoristas",
        label: "Motoristas",
        icon: Users,
        exact: false,
        badge: "Frota",
        moduleId: "motoristas",
        descricao: "Gestão completa de condutores",
        subItens: [
          { to: "/app/admin/motoristas", label: "Gestão de Motoristas", icon: Users },
          { to: "/app/admin/aprovacoes", label: "Fila de CNH & Documentos", icon: UserCheck, badge: "CNH" },
          { to: "/app/admin/passageiros", label: "Base de Passageiros", icon: Users, badge: "App" },
        ],
      },
      {
        to: "/app/admin/aprovacoes",
        label: "Fila de Aprovações",
        icon: UserCheck,
        exact: false,
        badge: "CNH",
        badgeVariant: "warning",
        moduleId: "motoristas",
        descricao: "Documentos, CNH & antecedentes",
      },
      {
        to: "/app/admin/passageiros",
        label: "Passageiros",
        icon: Users,
        exact: false,
        badge: "App",
        moduleId: "motoristas",
        descricao: "Base de clientes & histórico",
      },
    ],
  },
  {
    id: "financas",
    titulo: "Finanças & SaaS",
    itens: [
      {
        to: "/app/admin/financeiro",
        label: "Extrato & Repasses",
        icon: DollarSign,
        exact: false,
        badge: "D+0",
        moduleId: "financeiro",
        descricao: "Consolidado D+0 & split bancário",
        subItens: [
          { to: "/app/admin/financeiro", label: "Extrato D+0 & Repasses", icon: DollarSign },
          { to: "/app/admin/monetizacao", label: "Carteira, Gateways & SaaS", icon: CreditCard, badge: "Pix" },
          { to: "/app/admin/caixa", label: "Fechamento de Caixa", icon: Layers },
        ],
      },
      {
        to: "/app/admin/monetizacao",
        label: "Carteira & Gateways",
        icon: CreditCard,
        exact: false,
        badge: "Pix",
        moduleId: "financeiro",
        descricao: "Taxas SaaS & Pix integrado",
      },
      {
        to: "/app/admin/caixa",
        label: "Fechamento de Caixa",
        icon: Layers,
        exact: false,
        moduleId: "financeiro",
        descricao: "Conciliação diária de turnos",
      },
    ],
  },
  {
    id: "marketing",
    titulo: "Marketing & Growth",
    itens: [
      {
        to: "/app/admin/marketing",
        label: "Banners & Cupons",
        icon: Megaphone,
        exact: false,
        badge: "CMS",
        moduleId: "marketing",
        descricao: "Banners mobile & cupons",
        subItens: [
          { to: "/app/admin/marketing", label: "Banners Mobile & Cupons", icon: Megaphone },
          { to: "/app/admin/afiliados", label: "Clube de Vantagens & B2B", icon: Layers, badge: "B2B" },
          { to: "/app/admin/growth", label: "Indique & Ganhe (Fidelidade)", icon: TrendingUp, badge: "Viral" },
        ],
      },
      {
        to: "/app/admin/afiliados",
        label: "Clube & B2B",
        icon: Layers,
        exact: false,
        badge: "B2B",
        moduleId: "marketing",
        descricao: "Clube de vantagens & convênios",
      },
      {
        to: "/app/admin/growth",
        label: "Indique & Ganhe",
        icon: TrendingUp,
        exact: false,
        badge: "Viral",
        moduleId: "marketing",
        descricao: "Crescimento & retenção viral",
      },
    ],
  },
  {
    id: "sistema",
    titulo: "Sistema & Plataforma",
    itens: [
      {
        to: "/app/admin/configuracoes",
        label: "Configurações Gerais",
        icon: Sliders,
        exact: false,
        moduleId: "configuracoes",
        descricao: "Parâmetros do app & regras",
        subItens: [
          { to: "/app/admin/configuracoes", label: "Modo Essencial & Gateways", icon: Sliders },
          { to: "/app/admin/whitelabel", label: "White Label Studio OS", icon: Palette, badge: "Studio" },
          { to: "/app/admin/governanca", label: "Governança & Manutenção", icon: ShieldCheck, badge: "LGPD" },
        ],
      },
      {
        to: "/app/admin/whitelabel",
        label: "White Label Studio",
        icon: Palette,
        exact: false,
        badge: "Studio",
        moduleId: "configuracoes",
        descricao: "Design system & branding",
      },
      {
        to: "/app/admin/governanca",
        label: "Governança & LGPD",
        icon: ShieldCheck,
        exact: false,
        badge: "LGPD",
        moduleId: "configuracoes",
        descricao: "Auditoria, logs & conformidade",
      },
    ],
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
            if (item.to === "/app/admin/operacao" || item.to === "/app/admin/sos") {
              if (chamadosSOSAtivos > 0) {
                return {
                  ...item,
                  badge: `🚨 ${chamadosSOSAtivos} SOS`,
                  badgeVariant: "critical" as const,
                };
              }
            }
            if (item.to === "/app/admin/aprovacoes") {
              if (motoristasPendentes > 0) {
                return {
                  ...item,
                  badge: `${motoristasPendentes} Pend.`,
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
          <div className="shrink-0 space-y-2.5 pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              {!recolhido ? (
                <Link to="/app/admin" className="flex items-center gap-2 min-w-0">
                  <div
                    className="flex h-8 w-8 items-center justify-center text-white shadow-xs shrink-0 font-black rounded-lg"
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
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Perfil Operacional (RBAC)
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <select
                  value={roleAtiva}
                  onChange={(e) => handleTrocarRole(e.target.value as AdminRole)}
                  className="w-full bg-slate-950 border border-slate-800 text-[11px] font-bold text-white rounded-md px-2 py-1 h-7.5 focus:ring-1 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
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

          {/* Navegação Categorizada Profissional (Scrollable no Miolo) */}
          <nav className="flex-1 overflow-y-auto space-y-3 custom-admin-scrollbar pr-0.5 py-2 min-h-0">
            {categoriasFiltradas.map((cat) => (
              <div key={cat.id} className="space-y-1">
                {!recolhido && (
                  <p className="px-2 pt-1 text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>{cat.titulo}</span>
                    <span className="text-[9px] font-mono text-slate-600 font-normal">
                      {cat.itens.length}
                    </span>
                  </p>
                )}

                <div className="space-y-0.5">
                  {cat.itens.map((item) => {
                    const Icon = item.icon;
                    const isAtivo = item.exact
                      ? href === item.to || href === item.to + "/"
                      : href.startsWith(item.to) || (item.subItens?.some((s) => href.startsWith(s.to)) ?? false);

                    return (
                      <div key={item.to} className="space-y-0.5">
                        <Link
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
                          className={`group flex items-center justify-between px-2.5 py-1.5 text-xs font-bold transition-all relative rounded-lg ${
                            isAtivo
                              ? "font-black text-white shadow-xs"
                              : "text-slate-300 hover:bg-slate-900 hover:text-white"
                          } ${recolhido ? "justify-center px-1" : ""}`}
                          title={recolhido ? `${item.label} — ${item.descricao}` : undefined}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                                isAtivo ? "text-white stroke-[2.5]" : "text-slate-400 group-hover:text-slate-200"
                              }`}
                            />
                            {!recolhido && (
                              <div className="truncate">
                                <p className="truncate text-[11px] font-bold leading-tight">{item.label}</p>
                                <span
                                  className={`text-[9px] block font-normal truncate leading-none mt-0.5 ${
                                    isAtivo ? "text-white/90 font-medium" : "text-slate-400"
                                  }`}
                                >
                                  {item.descricao}
                                </span>
                              </div>
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

                        {/* Sub-itens quando ativo */}
                        {!recolhido && isAtivo && item.subItens && item.subItens.length > 0 && (
                          <div className="pl-2.5 pr-0.5 py-0.5 space-y-0.5 border-l border-slate-800 ml-3.5 my-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            {item.subItens.map((sub) => {
                              const SubIcon = sub.icon || ChevronRight;
                              const isSubAtivo = href === sub.to || (sub.to !== item.to && href.startsWith(sub.to));

                              return (
                                <Link
                                  key={sub.to}
                                  to={sub.to}
                                  className={`flex items-center justify-between px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                                    isSubAtivo
                                      ? "bg-slate-900 text-amber-400 font-bold border border-amber-400/30"
                                      : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <SubIcon className={`h-3 w-3 shrink-0 ${isSubAtivo ? "text-amber-400" : "text-slate-500"}`} />
                                    <span className="truncate">{sub.label}</span>
                                  </div>
                                  {sub.badge && (
                                    <span className="px-1 py-0.2 text-[8px] font-bold uppercase rounded bg-slate-800 text-slate-300">
                                      {sub.badge}
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Rodapé da Sidebar: Status Realtime & Conta Fixa no Fundo */}
          <div className="shrink-0 border-t border-slate-800/80 pt-2.5 mt-auto space-y-2">
            {/* Status Realtime de Conexão */}
            {!recolhido ? (
              <div className="flex items-center justify-between px-2 py-1 rounded-md bg-slate-900/50 border border-slate-800/50 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="truncate font-semibold">Supabase Realtime Ativo</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold shrink-0">v4.2</span>
              </div>
            ) : (
              <div className="flex justify-center" title="Supabase Realtime Conectado • v4.2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            )}

            {/* Card do Administrador & Ações */}
            {!recolhido ? (
              <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 gap-1.5">
                <div
                  onClick={abrirModalConta}
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer hover:opacity-85 transition"
                  title="Clique para editar credenciais"
                >
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
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
                    className="h-7 w-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                    title="Editar Credenciais"
                  >
                    <Key className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="h-7 w-7 rounded-md bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 flex items-center justify-center transition cursor-pointer"
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
                  className="mx-auto h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title={`Conta: ${contaAtiva.nome} (${contaAtiva.email})`}
                >
                  <Key className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mx-auto h-8 w-8 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 flex items-center justify-center transition cursor-pointer"
                  title="Sair"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* 2. Container Principal & Topbar */}
        <div className="flex-1 h-screen max-h-screen overflow-hidden flex flex-col min-w-0 bg-slate-50">
          <header className="shrink-0 h-13 pt-[env(safe-area-inset-top,0px)] bg-white border-b border-slate-200/80 px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-2 sm:gap-3 py-0.5 min-w-0">
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
            </div>

            <div className="flex items-center gap-1.5 shrink-0 py-0.5">
              {/* Alerta SOS em tempo real */}
              {chamadosSOSAtivos > 0 && (
                <Link
                  to="/app/admin/sos"
                  className="flex items-center gap-1 px-2.5 py-1 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold border border-red-500 animate-pulse shadow-xs transition-all shrink-0"
                >
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>{chamadosSOSAtivos} SOS</span>
                </Link>
              )}

              {/* Alerta de Motoristas Pendentes em tempo real */}
              {motoristasPendentes > 0 && (
                <Link
                  to="/app/admin/aprovacoes"
                  className="hidden lg:flex items-center gap-1 px-2.5 py-1 h-8 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 text-[11px] font-bold border border-amber-300 shadow-xs transition-all shrink-0"
                >
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>{motoristasPendentes} Pend.</span>
                </Link>
              )}

              {/* Atalho Rápido para Operação ao Vivo */}
              <Link
                to="/app/admin/operacao"
                className="flex items-center gap-1.5 px-2.5 py-1 h-8 rounded-lg bg-emerald-50 text-emerald-900 text-[11px] font-bold border border-emerald-300/80 hover:bg-emerald-100 active:scale-95 transition-all shadow-xs"
              >
                <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-600 shrink-0" />
                <span className="hidden md:inline">Ao Vivo</span>
              </Link>

              {/* Atalho Rápido para Despacho Telefônico & Flash */}
              <Link
                to="/app/admin/despacho"
                className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 h-8 rounded-lg bg-blue-50 text-blue-900 text-[11px] font-bold border border-blue-200/80 hover:bg-blue-100 active:scale-95 transition-all shadow-xs"
                title="Central Telefônica de Despacho e Atendimento"
              >
                <PhoneCall className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Despacho</span>
              </Link>

              {/* Atalho Rápido para Studio White Label OS */}
              <Link
                to="/app/admin/whitelabel"
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 h-8 rounded-lg bg-indigo-50 text-indigo-900 text-[11px] font-bold border border-indigo-200/80 hover:bg-indigo-100 active:scale-95 transition-all shadow-xs"
                title="White Label Studio OS (Design, Brand, Multi-Negócios)"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>Studio</span>
              </Link>

              {/* Imprimir Relatório (@media print) */}
              <button
                type="button"
                onClick={() => window.print()}
                title="Imprimir Relatório (PDF)"
                className="hidden sm:flex h-8 items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 px-2.5 text-[11px] font-semibold text-slate-700 transition-all border border-slate-200 cursor-pointer shadow-xs"
              >
                <Printer className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                <span className="hidden xl:inline">Imprimir</span>
              </button>

              {/* Minha Conta */}
              <button
                type="button"
                onClick={abrirModalConta}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 px-2.5 text-[11px] font-bold text-slate-800 transition-all border border-slate-200 cursor-pointer shadow-xs"
              >
                <Key className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="hidden lg:inline">{contaAtiva.nome ? contaAtiva.nome.split(" ")[0] : "Admin"}</span>
                <span className="lg:hidden text-[11px]">Conta</span>
              </button>

              {/* Sair */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-8 px-2.5 items-center gap-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-red-900 active:scale-95 transition-all cursor-pointer shadow-xs"
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
                      className="flex h-9 w-9 items-center justify-center text-white font-black shrink-0 rounded-xl"
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: ui.borderRadius,
                      }}
                    >
                      <Zap className="h-4.5 w-4.5 fill-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white leading-tight truncate">{branding.appName} OPS</p>
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
                    className="h-8 w-8 rounded-lg bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 shrink-0 cursor-pointer"
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

                {/* Seletor Mobile de Role */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Perfil de Acesso:</span>
                  <select
                    value={roleAtiva}
                    onChange={(e) => handleTrocarRole(e.target.value as AdminRole)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-lg h-8 px-2.5"
                  >
                    {ROLES_DISPONIVEIS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categorias e Itens no Mobile */}
                <nav className="space-y-3 pt-1">
                  {categoriasFiltradas.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <p className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {cat.titulo}
                      </p>
                      <div className="space-y-0.5">
                        {cat.itens.map((item) => {
                          const Icon = item.icon;
                          const isAtivo = item.exact
                            ? href === item.to || href === item.to + "/"
                            : href.startsWith(item.to) || (item.subItens?.some((s) => href.startsWith(s.to)) ?? false);

                          return (
                            <div key={item.to} className="space-y-0.5">
                              <Link
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
                                className={`flex items-center justify-between px-3 py-2 text-xs font-bold transition-all rounded-lg ${
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

                              {/* Sub-itens no mobile */}
                              {isAtivo && item.subItens && item.subItens.length > 0 && (
                                <div className="pl-3 pr-1 py-0.5 space-y-0.5 border-l border-slate-800 ml-3.5 my-0.5">
                                  {item.subItens.map((sub) => {
                                    const SubIcon = sub.icon || ChevronRight;
                                    const isSubAtivo = href === sub.to || (sub.to !== item.to && href.startsWith(sub.to));

                                    return (
                                      <Link
                                        key={sub.to}
                                        to={sub.to}
                                        onClick={() => setMenuAbertoMobile(false)}
                                        className={`flex items-center justify-between px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                                          isSubAtivo
                                            ? "bg-slate-900 text-amber-400 font-bold border border-amber-400/40"
                                            : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <SubIcon className={`h-3 w-3 shrink-0 ${isSubAtivo ? "text-amber-400" : "text-slate-500"}`} />
                                          <span className="truncate">{sub.label}</span>
                                        </div>
                                        {sub.badge && (
                                          <span className="px-1 py-0.2 text-[8px] font-bold uppercase rounded bg-slate-800 text-slate-300">
                                            {sub.badge}
                                          </span>
                                        )}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
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
      </div>
    </AdminCityProvider>
  );
}
