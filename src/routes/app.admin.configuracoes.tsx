import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Key,
  Layers,
  Lock,
  MessageSquare,
  Paintbrush,
  Palette,
  Percent,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Unlock,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Building2,
  Edit3,
  X,
  Zap,
} from "lucide-react";
import { getSuperAdminConfig, saveSuperAdminConfig } from "@/lib/superadmin-config";
import { appSettingsService } from "@/lib/ecosystem/app-settings-service";
import { isSuperAdmin, getAdminRole } from "@/lib/admin-rbac";
import { useBranding } from "@/hooks/useBranding";
import { whiteLabelEngine } from "@/lib/white-label";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";
import { AdminUserModal, type AdminUserRecord } from "@/components/admin/AdminUserModal";

export const Route = createFileRoute("/app/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações Globais & Parâmetros do Sistema | PARTIU Admin" },
      {
        name: "description",
        content:
          "Progressive Disclosure: Modo Essencial com parâmetros operacionais, Modo Avançado protegido e Governança de Usuários RBAC.",
      },
    ],
  }),
  component: ConfiguracoesAdminPage,
});

type AbaConfig = "essencial" | "avancado" | "equipe";

export function ConfiguracoesAdminPage() {
  const { branding } = useBranding();

  const [abaAtiva, setAbaAtiva] = useState<AbaConfig>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "avancado" || tab === "equipe") return tab;
    }
    return "essencial";
  });

  const config = getSuperAdminConfig();
  const role = getAdminRole();
  const ehSuperAdmin = isSuperAdmin(role);

  // 4. GESTÃO DE ADMINISTRADORES & RBAC
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([
    {
      id: "usr_super_1",
      nome: "Super Administrador (Holding)",
      email: "dono@partiu.app",
      role: "SUPER_ADMIN",
      tenant_id: null,
      praca_nome: "Acesso Global (Todos os Tenants)",
      ativo: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "usr_franq_1",
      nome: "Operador Regional Macaé",
      email: "franqueado@partiu.app",
      role: "FRANQUEADO",
      tenant_id: "ten_macae",
      praca_nome: "Macaé - RJ",
      ativo: true,
      created_at: new Date().toISOString(),
    },
  ]);
  const [modalAdminUserAberto, setModalAdminUserAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<AdminUserRecord | null>(null);

  useEffect(() => {
    async function carregarUsuariosAdmin() {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await (supabase as any)
            .from("admin_users")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && data && data.length > 0) {
            const mapped: AdminUserRecord[] = data.map((u: any) => ({
              id: u.id,
              nome: u.nome || u.email?.split("@")[0] || "Administrador",
              email: u.email,
              role: u.is_super_admin || u.role === "super_admin" ? "SUPER_ADMIN" : "FRANQUEADO",
              tenant_id: u.tenant_id,
              praca_nome: u.is_super_admin
                ? "Acesso Global (Holding)"
                : u.tenant_id
                  ? `Praça ${u.tenant_id}`
                  : "Regional",
              ativo: u.ativo !== false,
              created_at: u.created_at || new Date().toISOString(),
            }));
            setAdminUsers(mapped);
          }
        } catch (err) {
          console.warn("[Configuracoes] Contingência ao listar admin_users:", err);
        }
      }
    }
    void carregarUsuariosAdmin();
  }, []);

  // 1. MODO ESSENCIAL (SEMPRE VISÍVEL)
  const [cidadeOperacao, setCidadeOperacao] = useState("Matriz Central");
  const [tarifaBaseEssencial, setTarifaBaseEssencial] = useState("5.50");
  const [valorKmEssencial, setValorKmEssencial] = useState("2.10");
  const [valorMinutoEssencial, setValorMinutoEssencial] = useState("0.35");
  const [tarifaMinimaEssencial, setTarifaMinimaEssencial] = useState("8.00");
  const [comissaoFranquia, setComissaoFranquia] = useState("10.0");
  const [whatsappSuporte, setWhatsappSuporte] = useState("");
  const [chavePixPadrao, setChavePixPadrao] = useState("financeiro@partiu.app");
  const [sucessoEssencial, setSucessoEssencial] = useState(false);

  // Parâmetros de Despacho & Tarifação da Plataforma (Paridade com Painel Demo)
  const [taxaAppModo, setTaxaAppModo] = useState<"percentual" | "fixo">("percentual");
  const [taxaAppPercentual, setTaxaAppPercentual] = useState("10.0");
  const [taxaAppFixa, setTaxaAppFixa] = useState("2.50");
  const [raioInicialKm, setRaioInicialKm] = useState("3.0");
  const [raioIncrementoKmPorMin, setRaioIncrementoKmPorMin] = useState("1.5");
  const [tempoLimiteBuscaMin, setTempoLimiteBuscaMin] = useState("5");

  // 2. MODO AVANÇADO (PROTEGIDO POR CONFIRMAÇÃO / DESBLOQUEIO)
  const [modoAvancadoDesbloqueado, setModoAvancadoDesbloqueado] = useState(false);
  const [modalDesbloquearAberto, setModalDesbloquearAberto] = useState(false);
  const [confirmacaoTexto, setConfirmacaoTexto] = useState("");
  const [erroDesbloqueio, setErroDesbloqueio] = useState<string | null>(null);

  // Parâmetros Técnicos Avançados
  const [googleMapsKey, setGoogleMapsKey] = useState("AIzaSyB*****************************");
  const [stripeSecretKey, setStripeSecretKey] = useState("sk_live_****************************");
  const [asaasApiKey, setAsaasApiKey] = useState("$aact_******************************");
  const [webhookSecret, setWebhookSecret] = useState("whsec_*****************************");
  const [dnsUrl, setDnsUrl] = useState("https://api.partiumobilidade.com.br");
  const [timeoutDespachoSec, setTimeoutDespachoSec] = useState("600");
  const [mostrarChaves, setMostrarChaves] = useState(false);
  const [sucessoAvancado, setSucessoAvancado] = useState(false);

  // Gateway Primário & Mercado Pago
  const [activeGateway, setActiveGateway] = useState<
    "MERCADO_PAGO" | "ASAAS" | "EFI_BANK" | "MANUAL"
  >("MERCADO_PAGO");
  const [mercadopagoAccessToken, setMercadopagoAccessToken] = useState("");
  const [mercadopagoPublicKey, setMercadopagoPublicKey] = useState("");
  const [mercadopagoWebhookSecret, setMercadopagoWebhookSecret] = useState("");
  const [mercadopagoSandbox, setMercadopagoSandbox] = useState(false);
  const [salvandoTecnico, setSalvandoTecnico] = useState(false);
  const [copiadoWebhookUrl, setCopiadoWebhookUrl] = useState(false);

  useEffect(() => {
    const s = appSettingsService.getSettings();
    if (s.active_gateway) setActiveGateway(s.active_gateway);
    if (s.mercadopago_access_token) setMercadopagoAccessToken(s.mercadopago_access_token);
    if (s.mercadopago_public_key) setMercadopagoPublicKey(s.mercadopago_public_key);
    if (s.mercadopago_sandbox !== undefined) setMercadopagoSandbox(s.mercadopago_sandbox);
    if (s.base_fare_ride) setTarifaBaseEssencial(String(s.base_fare_ride));
    if (s.price_per_km) setValorKmEssencial(String(s.price_per_km));
    if (s.price_per_minute) setValorMinutoEssencial(String(s.price_per_minute));
    if (s.pix_key) setChavePixPadrao(s.pix_key);

    if (isSupabaseConfigured()) {
      (supabase as any)
        .rpc("fn_get_admin_gateway_secrets")
        .then((res: any) => {
          if (res.data?.mercadopago_access_token) {
            setMercadopagoAccessToken(res.data.mercadopago_access_token);
          }
          if (res.data?.mercadopago_webhook_secret) {
            setMercadopagoWebhookSecret(res.data.mercadopago_webhook_secret);
          }
        })
        .catch(() => {});
    }

    try {
      const cfg = getSuperAdminConfig();
      if (cfg.tarifas?.raioBuscaKm) setRaioInicialKm(String(cfg.tarifas.raioBuscaKm));
      if (cfg.tarifas?.partiuPop) {
        if (cfg.tarifas.partiuPop.tarifaBase)
          setTarifaBaseEssencial(String(cfg.tarifas.partiuPop.tarifaBase));
        if (cfg.tarifas.partiuPop.valorKm)
          setValorKmEssencial(String(cfg.tarifas.partiuPop.valorKm));
        if (cfg.tarifas.partiuPop.valorMinuto)
          setValorMinutoEssencial(String(cfg.tarifas.partiuPop.valorMinuto));
        if (cfg.tarifas.partiuPop.tarifaMinima)
          setTarifaMinimaEssencial(String(cfg.tarifas.partiuPop.tarifaMinima));
      }
      if (cfg.estrategicos?.taxaCooperativaPercent) {
        setComissaoFranquia(String(cfg.estrategicos.taxaCooperativaPercent));
        setTaxaAppPercentual(String(cfg.estrategicos.taxaCooperativaPercent));
      }
      if (cfg.pix?.chavePixManual) {
        setChavePixPadrao(cfg.pix.chavePixManual);
      }
    } catch {}
  }, []);

  async function handleSalvarTecnico(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSalvandoTecnico(true);
    try {
      await appSettingsService.updateSettings({
        active_gateway: activeGateway,
        mercadopago_access_token: mercadopagoAccessToken,
        mercadopago_public_key: mercadopagoPublicKey,
        mercadopago_webhook_secret: mercadopagoWebhookSecret,
        mercadopago_sandbox: mercadopagoSandbox,
      });

      const superAdminConfig = getSuperAdminConfig();
      if (superAdminConfig.pix) {
        superAdminConfig.pix.gateway =
          activeGateway === "MERCADO_PAGO"
            ? "mercadopago"
            : activeGateway === "ASAAS"
              ? "asaas"
              : "manual";
        superAdminConfig.pix.mercadoPagoAccessToken = mercadopagoAccessToken;
        superAdminConfig.pix.mercadoPagoPublicKey = mercadopagoPublicKey;
        superAdminConfig.pix.mercadoPagoWebhookSecret = mercadopagoWebhookSecret;
        superAdminConfig.pix.sandbox = mercadopagoSandbox;
        saveSuperAdminConfig(superAdminConfig);
      }

      setSucessoAvancado(true);
      setTimeout(() => setSucessoAvancado(false), 3500);
    } finally {
      setSalvandoTecnico(false);
    }
  }

  // Praças disponíveis para concessão de acesso no RBAC (derivadas canonicamente do WhiteLabelEngine)
  const pracasDisponiveis = useMemo(() => {
    return whiteLabelEngine.getAllTenants().map((t) => ({
      id: t.tenantId,
      nome: `${t.cidadeNome || t.nomeOperacao} - ${t.uf}`,
    }));
  }, []);

  async function handleSalvarEssencial(e: React.FormEvent) {
    e.preventDefault();
    try {
      // 1. Persistência Canônica no Supabase (Fonte da verdade consumida por PricingService e Apps)
      await appSettingsService.updateSettings({
        base_fare_ride: Number(tarifaBaseEssencial) || 5.5,
        price_per_km: Number(valorKmEssencial) || 2.1,
        price_per_minute: Number(valorMinutoEssencial) || 0.35,
        pix_key: chavePixPadrao,
      });

      // 2. Persistência de sincronização local/legada no SuperAdminConfig
      const superAdminConfig = getSuperAdminConfig();
      if (superAdminConfig.tarifas) {
        superAdminConfig.tarifas.raioBuscaKm = Number(raioInicialKm) || 3;
        if (superAdminConfig.tarifas.partiuPop) {
          superAdminConfig.tarifas.partiuPop.tarifaBase = Number(tarifaBaseEssencial) || 5.5;
          superAdminConfig.tarifas.partiuPop.valorKm = Number(valorKmEssencial) || 2.1;
          superAdminConfig.tarifas.partiuPop.valorMinuto = Number(valorMinutoEssencial) || 0.35;
          superAdminConfig.tarifas.partiuPop.tarifaMinima = Number(tarifaMinimaEssencial) || 8.0;
        }
      }
      if (superAdminConfig.estrategicos) {
        superAdminConfig.estrategicos.taxaCooperativaPercent = 0.0;
      }
      if (superAdminConfig.pix) {
        superAdminConfig.pix.chavePixManual = chavePixPadrao;
      }
      saveSuperAdminConfig(superAdminConfig);
    } catch (err) {
      console.warn("Falha ao salvar configurações essenciais:", err);
    }
    setSucessoEssencial(true);
    setTimeout(() => setSucessoEssencial(false), 2500);
  }

  function handleDesbloquearAvancado(e: React.FormEvent) {
    e.preventDefault();
    if (confirmacaoTexto.trim().toUpperCase() === "DESBLOQUEAR") {
      setModoAvancadoDesbloqueado(true);
      setModalDesbloquearAberto(false);
      setConfirmacaoTexto("");
      setErroDesbloqueio(null);
    } else {
      setErroDesbloqueio("Digite exatamente a palavra 'DESBLOQUEAR' para confirmar.");
    }
  }

  if (!ehSuperAdmin) {
    return <GuardiaoAcesso somenteSuperAdmin children={<></>} />;
  }

  return (
    <div className="w-full space-y-5 pb-12">
      {/* 1. Header Executivo Configurações */}
      <div className="rounded-2xl bg-slate-950 p-5 sm:p-6 text-white shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0088FF]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0088FF] border border-[#0088FF]/30 mb-2">
              <Sliders className="h-4 w-4 text-[#0088FF]" />
              <span>Configurações Globais do Sistema</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
              Parâmetros Operacionais &amp; <span className="text-[#0088FF]">Infraestrutura</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal mt-1 leading-relaxed">
              Controle de tarifas base, raios de atendimento, gateways de pagamento, integrações de mapas e controle de acesso RBAC.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/app/admin/whitelabel"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0088FF] hover:bg-[#0077EE] text-white text-xs sm:text-sm font-black shadow-md transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>White Label Studio OS</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Atalho Limpo para White Label Studio & Franquias */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-linear-to-r from-blue-900/10 via-slate-900/5 to-primary/10 border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md">
            <Palette className="h-5 w-5 text-[#0088FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                White Label Studio OS &amp; Gestão de Franquias
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-black uppercase">
                Central Unificada
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Identidade visual, logos, temas, frotas e criação de praças foram unificadas no White Label Studio e na Central da Matriz para evitar duplicidade de formulários.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/app/admin/whitelabel"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-[#0088FF]" />
            <span>Abrir White Label Studio</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/app/admin/matriz"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span>Franquia Mãe</span>
          </Link>
          <Link
            to="/app/admin/franqueados"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Users className="h-4 w-4 text-indigo-600" />
            <span>Franquias Regionais</span>
          </Link>
        </div>
      </div>

      {/* 2. Barra de Abas (Modo Essencial | Modo Avançado Protegido | Usuários & RBAC) */}
      <div className="flex flex-wrap items-center gap-2.5 p-2 sm:p-2.5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm max-w-full overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setAbaAtiva("essencial")}
          className={`flex items-center gap-2.5 px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm lg:text-base font-black transition-all cursor-pointer ${
            abaAtiva === "essencial"
              ? "bg-slate-950 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="h-5 w-5 text-[#0088FF]" />
          <span>Modo Essencial</span>
          <span className="ml-1 rounded-full bg-emerald-100 px-3 py-1 text-xs sm:text-sm text-emerald-900 font-bold">
            Operacional
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("avancado")}
          className={`flex items-center gap-2.5 px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm lg:text-base font-black transition-all cursor-pointer ${
            abaAtiva === "avancado"
              ? "bg-slate-950 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          {modoAvancadoDesbloqueado ? (
            <Unlock className="h-5 w-5 text-emerald-400" />
          ) : (
            <Lock className="h-5 w-5 text-rose-500" />
          )}
          <span>Modo Avançado</span>
          <span
            className={`ml-1 rounded-full px-3 py-1 text-xs sm:text-sm font-bold ${
              modoAvancadoDesbloqueado
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {modoAvancadoDesbloqueado ? "Desbloqueado" : "Protegido"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("equipe")}
          className={`flex items-center gap-2.5 px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm lg:text-base font-black transition-all cursor-pointer ${
            abaAtiva === "equipe"
              ? "bg-slate-950 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Shield className="h-5 w-5 text-indigo-500" />
          <span>Usuários &amp; RBAC</span>
          <span className="ml-1 rounded-full bg-indigo-100 px-3 py-1 text-xs sm:text-sm text-indigo-900 font-bold">
            Equipe
          </span>
        </button>

        <Link
          to="/app/admin/whitelabel"
          className="flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm lg:text-base font-black text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-dashed border-slate-300 ml-auto transition-all cursor-pointer"
        >
          <Sparkles className="h-5 w-5 text-primary" />
          <span>White Label Studio</span>
          <ExternalLink className="h-4 w-4 text-slate-400" />
        </Link>
      </div>

      {/* 3. ABA 1: MODO ESSENCIAL (SEMPRE VISÍVEL) */}
      {abaAtiva === "essencial" && (
        <form onSubmit={handleSalvarEssencial} className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Configurações Operacionais Essenciais
              </h2>
              <p className="text-base sm:text-lg text-slate-600 font-medium mt-1">
                Parâmetros vitais de operação diária sem exposição a dados técnicos complexos.
              </p>
            </div>
            <button
              type="submit"
              className="flex h-14 sm:h-16 items-center justify-center gap-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-8 sm:px-10 text-base sm:text-lg font-black shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Save className="h-5.5 w-5.5 text-[#0088FF]" />
              <span>Salvar Modificações</span>
            </button>
          </div>

          {sucessoEssencial && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-base font-bold flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <span>Configurações essenciais salvas com sucesso no banco de dados!</span>
            </div>
          )}

          {/* Card de Resumo de Marca & Atalho White Label */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shrink-0 border-2 border-white ring-2 ring-slate-100"
                style={{ backgroundColor: branding?.primary_color || "#FF6B00" }}
              >
                {(branding?.app_name || "P")[0]}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Identidade Visual Ativa: {branding?.app_name || "PARTIU"}
                  </h3>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                    style={{
                      backgroundColor: `${branding?.primary_color || "#FF6B00"}18`,
                      color: branding?.primary_color || "#FF6B00",
                    }}
                  >
                    {branding?.primary_color || "#FF6B00"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                  Paletas completas, contraste WCAG, logotipos, favicons e personalização de frotas são governados no White Label Studio.
                </p>
              </div>
            </div>

            <Link
              to="/app/admin/whitelabel"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black transition cursor-pointer shrink-0 active:scale-95 shadow-sm"
            >
              <Palette className="h-4 w-4 text-[#0088FF]" />
              <span>Personalizar Marca no Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card de Tarifação Base de Mobilidade (PARTIU Pop) */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-7 w-7 text-emerald-600" />
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Tarifação Base de Corridas (PARTIU Pop)
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
                  Composição de valores por quilometragem e tempo para cálculo de estimativa e
                  encerramento.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-black border border-emerald-200 self-start sm:self-auto">
                <Zap className="h-4 w-4 text-emerald-600" />
                Cálculo em Tempo Real
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Tarifa Base / Bandeirada
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    value={tarifaBaseEssencial}
                    onChange={(e) => setTarifaBaseEssencial(e.target.value)}
                    className="w-full h-14 sm:h-16 pl-12 pr-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">Valor fixo de partida.</p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Valor por KM Rodado
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    value={valorKmEssencial}
                    onChange={(e) => setValorKmEssencial(e.target.value)}
                    className="w-full h-14 sm:h-16 pl-12 pr-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">Multiplicado pelos km totais.</p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Valor por Minuto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    value={valorMinutoEssencial}
                    onChange={(e) => setValorMinutoEssencial(e.target.value)}
                    className="w-full h-14 sm:h-16 pl-12 pr-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Multiplicado pelo tempo em trânsito.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Tarifa Mínima Garantida (Piso)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.50"
                    value={tarifaMinimaEssencial}
                    onChange={(e) => setTarifaMinimaEssencial(e.target.value)}
                    className="w-full h-14 sm:h-16 pl-12 pr-4 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Valor mínimo cobrado por corrida.
                </p>
              </div>
            </div>
          </div>

          {/* Card de Parâmetros de Despacho & Comissão da Plataforma */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <Radio className="h-7 w-7 text-[#0088FF]" />
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Parâmetros de Despacho &amp; Comissão da Plataforma
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
                  Configurações de retenção da plataforma e algoritmos progressivos de despacho de
                  motoristas.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-900 text-xs sm:text-sm font-black border border-blue-200 self-start sm:self-auto">
                <Radio className="h-4 w-4 text-[#0088FF]" />
                Algoritmo Inteligente
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Modelo de Monetização SaaS (Taxa Zero por Corrida) */}
              <div className="md:col-span-2 p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Monetização por Corrida (Taxa 0%)
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                    0% Take Rate • Padrão PARTIU
                  </span>
                </div>
                <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                  A plataforma opera com <strong>taxa zero por viagem</strong>. O motorista recebe
                  100% do valor da corrida. O faturamento da franquia e da plataforma é gerado
                  exclusivamente por assinaturas e diárias SaaS gerenciadas no módulo de
                  Monetização.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[11px] font-bold text-emerald-800">
                  <span>Repasse Líquido D+0: 100%</span>
                  <span>•</span>
                  <span>Retenção de Viagem: R$ 0,00</span>
                </div>
              </div>

              {/* Raio Inicial */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Raio Inicial de Busca
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={raioInicialKm}
                    onChange={(e) => setRaioInicialKm(e.target.value)}
                    className="w-full h-14 sm:h-16 px-5 pr-14 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-400">
                    km
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Distância inicial dos motoristas mais próximos.
                </p>
              </div>

              {/* Expansão do Raio & Limite */}
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Expansão do Raio / Minuto
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={raioIncrementoKmPorMin}
                    onChange={(e) => setRaioIncrementoKmPorMin(e.target.value)}
                    className="w-full h-14 sm:h-16 px-5 pr-18 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-400">
                    km/min
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Aumenta o raio a cada minuto de busca.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2.5">
                <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                  Tempo Limite Máximo de Busca
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tempoLimiteBuscaMin}
                    onChange={(e) => setTempoLimiteBuscaMin(e.target.value)}
                    className="w-full h-14 sm:h-16 px-5 pr-16 rounded-2xl border border-slate-300 text-base sm:text-lg font-black text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-bold text-slate-400">
                    min
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Tempo até declarar sem motoristas disponíveis.
                </p>
              </div>

              <div className="space-y-2.5 flex flex-col justify-end">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-3">
                  <Clock className="h-6 w-6 text-[#0088FF] shrink-0" />
                  <span>
                    O algoritmo expande progressivamente o despacho a partir de{" "}
                    <strong>{raioInicialKm} km</strong>, aumentando{" "}
                    <strong>+{raioIncrementoKmPorMin} km</strong> por minuto até o limite de{" "}
                    <strong>{tempoLimiteBuscaMin} min</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Cidade de Operação */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">
                Cidade de Operação Ativa
              </label>
              <input
                type="text"
                value={cidadeOperacao}
                onChange={(e) => setCidadeOperacao(e.target.value)}
                className="w-full h-14 sm:h-16 px-5 rounded-2xl border border-slate-300 text-base sm:text-lg font-bold text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
              />
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Região de cobertura padrão das corridas.
              </p>
            </div>

            {/* Modelo Econômico da Franquia */}
            <div className="bg-emerald-50/70 p-6 sm:p-7 rounded-3xl border border-emerald-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-emerald-950">
                  Taxa de Serviço por Corrida
                </label>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  0% Taxa Zero
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-900 font-medium leading-relaxed">
                No modelo PARTIU, nenhuma comissão é retida sobre corridas. O faturamento da
                franquia e plataforma ocorre exclusivamente via planos de acesso do motorista
                (diárias, semanais e mensais).
              </p>
            </div>

            {/* WhatsApp Central */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">
                WhatsApp Central de Atendimento
              </label>
              <input
                type="text"
                value={whatsappSuporte}
                onChange={(e) => setWhatsappSuporte(e.target.value)}
                className="w-full h-14 sm:h-16 px-5 rounded-2xl border border-slate-300 text-base sm:text-lg font-bold text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
              />
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Canal direto de suporte ao passageiro.
              </p>
            </div>

            {/* Chave PIX */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-3 lg:col-span-3">
              <label className="block text-sm sm:text-base font-black uppercase tracking-wider text-slate-700">
                Chave PIX Oficial de Recebimento da Matriz / Franquia
              </label>
              <input
                type="text"
                value={chavePixPadrao}
                onChange={(e) => setChavePixPadrao(e.target.value)}
                className="w-full h-14 sm:h-16 px-5 rounded-2xl border border-slate-300 text-base sm:text-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#0088FF]"
              />
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Chave utilizada para emissão de cobranças PIX Copia e Cola nos aplicativos.
              </p>
            </div>
          </div>
        </form>
      )}

      {/* 4. ABA 2: MODO AVANÇADO (PROTEGIDO POR CONFIRMAÇÃO) */}
      {abaAtiva === "avancado" && (
        <div className="space-y-6">
          {!modoAvancadoDesbloqueado ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-6 max-w-2xl mx-auto">
              <div className="h-20 w-20 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Área Técnica Protegida (Modo Avançado)
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg mx-auto font-medium">
                  Esta seção contém credenciais críticas de infraestrutura (API Keys, Webhooks, DNS
                  e Variáveis de Sistema). O acesso requer confirmação explícita para evitar
                  alterações acidentais.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalDesbloquearAberto(true)}
                className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm sm:text-base shadow-lg transition-all inline-flex items-center gap-3 cursor-pointer active:scale-95"
              >
                <Unlock className="h-5 w-5 text-[#0088FF]" />
                <span>Desbloquear Configurações Técnicas</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 p-4 sm:p-5 rounded-2xl border border-amber-300">
                <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-amber-950">
                  <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0" />
                  <span>
                    Modo Avançado Desbloqueado com Sucesso. Atenção ao alterar chaves de produção.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setModoAvancadoDesbloqueado(false)}
                  className="h-10 px-4 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-black hover:bg-slate-800 transition active:scale-95 cursor-pointer shrink-0"
                >
                  Bloquear Novamente
                </button>
              </div>

              {/* Card Destaque: Gateway Mercado Pago Oficial */}
              <div className="bg-gradient-to-br from-sky-900/10 via-white to-white p-6 sm:p-8 rounded-3xl border-2 border-sky-500/30 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-sm shrink-0">
                      <CreditCard className="w-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                          Mercado Pago Oficial (PIX D+0)
                        </h3>
                        <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                          Recomendado • Produção
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                        Receba pagamentos das diárias e assinaturas de motoristas com liquidação
                        instantânea via PIX.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMostrarChaves(!mostrarChaves)}
                      className="h-10 px-4 text-xs sm:text-sm font-black text-slate-700 flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-xs cursor-pointer transition active:scale-95"
                    >
                      {mostrarChaves ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      <span>{mostrarChaves ? "Ocultar Chaves" : "Revelar Chaves"}</span>
                    </button>
                  </div>
                </div>

                {/* Seleção do Gateway Ativo */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                    Provedor de Pagamento PIX Ativo no Ecossistema:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: "MERCADO_PAGO", label: "Mercado Pago", desc: "Oficial (PIX D+0)" },
                      { id: "ASAAS", label: "Asaas", desc: "Subcontas & Split" },
                      { id: "EFI_BANK", label: "Efí Bank", desc: "BACEN Direto" },
                      { id: "MANUAL", label: "PIX Estático", desc: "Chave Manual" },
                    ].map((gw) => (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setActiveGateway(gw.id as any)}
                        className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          activeGateway === gw.id
                            ? "border-sky-500 bg-sky-50/50 text-sky-950 font-bold ring-2 ring-sky-500/20"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
                        }`}
                      >
                        <span className="text-sm font-black">{gw.label}</span>
                        <span className="text-xs text-slate-500 mt-1 font-medium">{gw.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Formulário de Credenciais Mercado Pago */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Mercado Pago Access Token (Produção ou Sandbox):
                    </label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={mercadopagoAccessToken}
                      onChange={(e) => setMercadopagoAccessToken(e.target.value)}
                      placeholder="APP_USR-0000000000000000-000000-00000000000000000000000000000000-000000000"
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition font-bold"
                    />
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">
                      Obtenha em:{" "}
                      <a
                        href="https://www.mercadopago.com.br/developers/panel"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 underline font-bold"
                      >
                        Mercado Pago Developers
                      </a>{" "}
                      &gt; Suas integrações &gt; Credenciais de produção.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Mercado Pago Public Key:
                    </label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={mercadopagoPublicKey}
                      onChange={(e) => setMercadopagoPublicKey(e.target.value)}
                      placeholder="APP_USR-00000000-0000-0000-0000-000000000000"
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      Webhook Secret (Chave Secreta de Assinatura):
                    </label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={mercadopagoWebhookSecret}
                      onChange={(e) => setMercadopagoWebhookSecret(e.target.value)}
                      placeholder="Ex: whsec_... ou chave de assinatura do webhook"
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition font-bold"
                    />
                  </div>
                </div>

                {/* Modo Sandbox & URL de Webhook para Cadastro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="block text-sm sm:text-base font-bold text-slate-800">
                        Modo Sandbox (Testes)
                      </span>
                      <span className="text-xs sm:text-sm text-slate-500 font-medium">
                        {mercadopagoSandbox
                          ? "Usando ambiente de testes do Mercado Pago"
                          : "Operando em ambiente real de Produção"}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mercadopagoSandbox}
                        onChange={(e) => setMercadopagoSandbox(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
                    <span className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 mb-1.5">
                      URL de Webhook no Mercado Pago (Edge Function):
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={
                          typeof import.meta !== "undefined" &&
                          import.meta.env?.VITE_SUPABASE_URL &&
                          !import.meta.env.VITE_SUPABASE_URL.includes("SEU_PROJETO")
                            ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/payment-webhook`
                            : "https://<SEU_PROJETO>.supabase.co/functions/v1/payment-webhook"
                        }
                        className="w-full h-10 sm:h-11 px-3 rounded-xl border border-slate-200 font-mono text-xs bg-slate-100 text-slate-700 select-all font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url =
                            typeof import.meta !== "undefined" &&
                            import.meta.env?.VITE_SUPABASE_URL &&
                            !import.meta.env.VITE_SUPABASE_URL.includes("SEU_PROJETO")
                              ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/payment-webhook`
                              : "https://<SEU_PROJETO>.supabase.co/functions/v1/payment-webhook";
                          navigator.clipboard?.writeText(url);
                          setCopiadoWebhookUrl(true);
                          setTimeout(() => setCopiadoWebhookUrl(false), 2000);
                        }}
                        className="h-10 sm:h-11 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 transition cursor-pointer active:scale-95 shadow-xs"
                      >
                        {copiadoWebhookUrl ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span>{copiadoWebhookUrl ? "Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Secundário: Demais Credenciais de Infraestrutura */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Demais Credenciais &amp; Parâmetros de Cluster
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Google Maps Platform API Key:
                    </label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={googleMapsKey}
                      onChange={(e) => setGoogleMapsKey(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Asaas API Token (Fallback):
                    </label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={asaasApiKey}
                      onChange={(e) => setAsaasApiKey(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Stripe Secret Key (Opcional):
                    </label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Global Webhook Secret (HMAC):
                    </label>
                    <input
                      type={mostrarChaves ? "text" : "password"}
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-xs sm:text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      DNS / Endpoint Base:
                    </label>
                    <input
                      type="text"
                      value={dnsUrl}
                      onChange={(e) => setDnsUrl(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-mono text-sm sm:text-base font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Tempo de Busca / Timeout de Despacho (Segundos):
                    </label>
                    <input
                      type="number"
                      min="60"
                      max="1200"
                      value={timeoutDespachoSec}
                      onChange={(e) => setTimeoutDespachoSec(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 text-sm sm:text-base font-bold text-slate-900"
                    />
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5">
                      Padrão atual: 600s (10 minutos). Se nenhum motorista aceitar, o passageiro
                      poderá continuar buscando ou cancelar.
                    </p>
                  </div>
                </div>

                {sucessoAvancado && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>
                      Configurações do Mercado Pago e parâmetros técnicos salvos com sucesso no
                      cluster!
                    </span>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={salvandoTecnico}
                    onClick={() => handleSalvarTecnico()}
                    className="h-12 sm:h-14 px-7 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2.5 cursor-pointer transition disabled:opacity-50 active:scale-95"
                  >
                    {salvandoTecnico ? (
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Save className="h-4.5 w-4.5" />
                    )}
                    <span>
                      {salvandoTecnico
                        ? "Salvando no Cluster..."
                        : "Salvar Configurações Técnicas & Mercado Pago"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. ABA 4: GESTÃO DE ADMINISTRADORES & RBAC PURIFICADO */}
      {abaAtiva === "equipe" && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase mb-2">
                <Shield className="h-3.5 w-3.5" />
                <span>Governança RBAC • 2 Modalidades Estritas</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Gestão de Administradores &amp; Acesso
              </h2>
              <p className="text-base sm:text-lg text-slate-600 font-medium mt-1">
                Controle simplificado e purificado: Matriz Global (Super Admin) ou Operador Regional
                (Franqueado).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setUsuarioEditando(null);
                setModalAdminUserAberto(true);
              }}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95 self-start sm:self-auto"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Novo Administrador</span>
            </button>
          </div>

          {/* Cards Explicativos das 2 Modalidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                <span>Super Administrador (Acesso Total)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Acesso global irrestrito a todos os tenants e praças, configurações avançadas do
                sistema, ledger contábil central, gateways e catálogos globais.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-950 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm text-indigo-900">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <span>Franqueado (Acesso Local Regional)</span>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Isolamento estrito multi-tenant garantido por Row Level Security (RLS). Autonomia
                para gerenciar exclusivamente a sua praça, motoristas, chamados e faturamento local.
              </p>
            </div>
          </div>

          {/* Tabela de Usuários Administrativos */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-4 px-6">Usuário / Nome</th>
                    <th className="py-4 px-6">E-mail Corporativo</th>
                    <th className="py-4 px-6">Nível de Acesso (RBAC)</th>
                    <th className="py-4 px-6">Escopo / Praça Vinculada</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {adminUsers.map((u) => {
                    const isSuper = u.role === "SUPER_ADMIN";
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-6 font-bold text-slate-900">{u.nome}</td>
                        <td className="py-4 px-6 text-slate-600 font-mono">{u.email}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                              isSuper
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-indigo-100 text-indigo-900 border border-indigo-300"
                            }`}
                          >
                            {isSuper ? (
                              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                            ) : (
                              <Building2 className="h-3.5 w-3.5 text-indigo-700" />
                            )}
                            {isSuper
                              ? "Super Administrador (Acesso Total)"
                              : "Franqueado (Acesso Local)"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-semibold">
                          {u.praca_nome || (isSuper ? "Acesso Global (Todos)" : "Regional")}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Ativo
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setUsuarioEditando(u);
                              setModalAdminUserAberto(true);
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="Editar Administrador"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DESBLOQUEAR MODO AVANÇADO */}
      {modalDesbloquearAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5 text-rose-600">
                <ShieldAlert className="h-6 w-6" />
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Confirmação de Segurança
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDesbloquearAberto(false)}
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDesbloquearAvancado} className="space-y-4">
              <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                Para liberar as configurações avançadas e chaves de API, digite a palavra{" "}
                <strong className="text-slate-950 font-black">DESBLOQUEAR</strong> abaixo:
              </p>

              <input
                type="text"
                required
                placeholder="Digite DESBLOQUEAR"
                value={confirmacaoTexto}
                onChange={(e) => setConfirmacaoTexto(e.target.value)}
                className="w-full h-12 sm:h-14 px-4 rounded-2xl border border-slate-300 font-black uppercase text-center text-base sm:text-lg tracking-widest focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />

              {erroDesbloqueio && (
                <p className="text-red-600 font-bold text-xs sm:text-sm">{erroDesbloqueio}</p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalDesbloquearAberto(false)}
                  className="h-12 sm:h-14 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-12 sm:h-14 rounded-2xl bg-rose-600 text-white font-black text-xs sm:text-sm hover:bg-rose-700 shadow-md transition cursor-pointer active:scale-95"
                >
                  Confirmar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR / EDITAR USUÁRIO ADMINISTRATIVO */}
      <AdminUserModal
        isOpen={modalAdminUserAberto}
        onClose={() => {
          setModalAdminUserAberto(false);
          setUsuarioEditando(null);
        }}
        initialUser={usuarioEditando}
        pracasDisponiveis={pracasDisponiveis}
        onSuccess={(salvo) => {
          setAdminUsers((prev) => {
            const index = prev.findIndex((u) => u.id === salvo.id || u.email === salvo.email);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = salvo;
              return copy;
            }
            return [salvo, ...prev];
          });
        }}
      />
    </div>
  );
}
