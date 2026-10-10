import React, { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Building2,
  Users,
  Car,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Plus,
  Download,
  ShieldCheck,
  ShieldAlert,
  Power,
  Trash2,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  FileSpreadsheet,
  Palette,
  AlertOctagon,
  Key,
  DollarSign,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Sparkles,
  RefreshCw,
  Copy,
  KeyRound,
  Share2,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";
import { whiteLabelEngine } from "@/lib/white-label";
import { type WhiteLabelTenantRecord } from "@/lib/white-label/white-label-types";
import { MapboxConfig } from "@/config/MapboxConfig";
import { listarPassageiros, type PassageiroAdmin } from "@/lib/passageiros.functions";
import { useMotoristas } from "@/lib/partiu-db";
import { usePartiuRides, type PartiuRideRecord } from "@/lib/partiu-db";
import { exportarParaCSV } from "@/lib/export-csv";
import { CloneTenantModal } from "@/components/admin/whitelabel/CloneTenantModal";
import { useBrandTheme } from "@/hooks/useBrandTheme";

export const Route = createFileRoute("/app/admin/franqueados")({
  head: () => ({
    meta: [
      { title: "Gestão Central de Franqueados & Multi-Tenant | PARTIU Super Admin" },
      {
        name: "description",
        content:
          "Controle total de franqueados da holding: ativação/desativação de planos (kill switch), gestão de APIs, listas de passageiros e motoristas e exportação.",
      },
    ],
  }),
  component: SuperAdminFranqueadosPage,
});

function SuperAdminFranqueadosPage() {
  return (
    <GuardiaoAcesso somenteSuperAdmin>
      <SuperAdminFranqueadosContent />
    </GuardiaoAcesso>
  );
}

function SuperAdminFranqueadosContent() {
  const navigate = useNavigate();
  const { switchTenant } = useBrandTheme();

  // 1. Dados de Tenants / Franqueados
  const [tenants, setTenants] = useState<WhiteLabelTenantRecord[]>(() =>
    whiteLabelEngine.getAllTenants()
  );

  const recarregarTenants = () => {
    setTenants(whiteLabelEngine.getAllTenants());
  };

  useEffect(() => {
    function onTenantUpdate() {
      recarregarTenants();
    }
    window.addEventListener("partiu:tenant-status-changed", onTenantUpdate);
    window.addEventListener("partiu:tenant-deleted", onTenantUpdate);
    window.addEventListener("partiu:whitelabel-updated", onTenantUpdate);
    return () => {
      window.removeEventListener("partiu:tenant-status-changed", onTenantUpdate);
      window.removeEventListener("partiu:tenant-deleted", onTenantUpdate);
      window.removeEventListener("partiu:whitelabel-updated", onTenantUpdate);
    };
  }, []);

  // 2. Base de Passageiros
  const listar = useServerFn(listarPassageiros);
  const { data: todosPassageiros = [], isLoading: carregandoPassageiros } = useQuery({
    queryKey: ["admin", "passageiros"],
    queryFn: () => listar(),
  });

  // 3. Base de Motoristas
  const { data: todosMotoristas = [], isLoading: carregandoMotoristas } = useMotoristas();

  // 4. Corridas Globais
  const { data: todasCorridas = [] } = usePartiuRides(500);

  // Estados de Filtros e Busca
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "ATIVOS" | "SUSPENSOS">("TODOS");

  // Modais de Controle
  const [modalClonarAberto, setModalClonarAberto] = useState(false);
  const [tenantParaDesativar, setTenantParaDesativar] = useState<WhiteLabelTenantRecord | null>(null);
  const [motivoDesativacao, setMotivoDesativacao] = useState("");
  const [tenantParaExcluir, setTenantParaExcluir] = useState<WhiteLabelTenantRecord | null>(null);
  const [confirmacaoExclusaoTexto, setConfirmacaoExclusaoTexto] = useState("");

  // Modais de Inspeção de Usuários por Franqueado
  const [tenantInspecaoPassageiros, setTenantInspecaoPassageiros] = useState<WhiteLabelTenantRecord | null>(null);
  const [tenantInspecaoMotoristas, setTenantInspecaoMotoristas] = useState<WhiteLabelTenantRecord | null>(null);
  const [buscaModalUsuario, setBuscaModalUsuario] = useState("");

  // Modal de Credenciais do Franqueado
  const [tenantParaCredenciais, setTenantParaCredenciais] = useState<WhiteLabelTenantRecord | null>(null);
  const [credencialEmail, setCredencialEmail] = useState("");
  const [credencialSenha, setCredencialSenha] = useState("");
  const [mostrarSenhaModal, setMostrarSenhaModal] = useState(false);
  const [senhasVisiveis, setSenhasVisiveis] = useState<Record<string, boolean>>({});

  // Modal de APIs de Mapas do Franqueado
  const [tenantParaMapa, setTenantParaMapa] = useState<WhiteLabelTenantRecord | null>(null);
  const [mapProviderModal, setMapProviderModal] = useState<"mapbox" | "google" | "osm">("mapbox");
  const [mapboxTokenModal, setMapboxTokenModal] = useState("");
  const [googleKeyModal, setGoogleKeyModal] = useState("");
  const [centerLatModal, setCenterLatModal] = useState<number>(-21.2054);
  const [centerLngModal, setCenterLngModal] = useState<number>(-41.8892);
  const [radiusKmModal, setRadiusKmModal] = useState<number>(15);
  const [testandoMapaModal, setTestandoMapaModal] = useState(false);
  const [resultadoTesteMapaModal, setResultadoTesteMapaModal] = useState<{ valid: boolean; message: string } | null>(null);
  const [mostrarTokenModal, setMostrarTokenModal] = useState(false);

  const toggleVerSenhaCard = (tenantId: string) => {
    setSenhasVisiveis((prev) => ({ ...prev, [tenantId]: !prev[tenantId] }));
  };

  function handleCopiarLinkApp(tenant: WhiteLabelTenantRecord) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://partiumobe.com.br";
    const url = `${origin}/app?tenant=${encodeURIComponent(tenant.tenantId)}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link de passageiros de ${tenant.nomeOperacao} copiado!`);
  }

  function handleCopiarLinkMotorista(tenant: WhiteLabelTenantRecord) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://partiumobe.com.br";
    const url = `${origin}/app/motorista?tenant=${encodeURIComponent(tenant.tenantId)}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link do portal do motorista de ${tenant.nomeOperacao} copiado!`);
  }

  function handleAbrirApp(tenant: WhiteLabelTenantRecord) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://partiumobe.com.br";
    const url = `${origin}/app?tenant=${encodeURIComponent(tenant.tenantId)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleAbrirMotorista(tenant: WhiteLabelTenantRecord) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://partiumobe.com.br";
    const url = `${origin}/app/motorista?tenant=${encodeURIComponent(tenant.tenantId)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function abrirModalMapa(tenant: WhiteLabelTenantRecord) {
    setTenantParaMapa(tenant);
    const cfg = MapboxConfig.getTenantMapConfig(tenant.tenantId);
    setMapProviderModal(cfg.provider);
    setMapboxTokenModal(cfg.mapboxAccessToken);
    setGoogleKeyModal(cfg.googleMapsApiKey);
    setCenterLatModal(cfg.center[1]);
    setCenterLngModal(cfg.center[0]);
    setRadiusKmModal(tenant.configuracaoCompleta?.geo?.raioOperacaoPadraoKm || 15);
    setResultadoTesteMapaModal(null);
    setMostrarTokenModal(false);
  }

  async function handleTestarChaveMapaModal() {
    setTestandoMapaModal(true);
    setResultadoTesteMapaModal(null);
    try {
      if (mapProviderModal === "mapbox") {
        const res = await MapboxConfig.testMapboxToken(mapboxTokenModal.trim());
        setResultadoTesteMapaModal(res);
        if (res.valid) toast.success(res.message);
        else toast.error(res.message);
      } else if (mapProviderModal === "google") {
        const res = await MapboxConfig.testGoogleMapsApiKey(googleKeyModal.trim());
        setResultadoTesteMapaModal(res);
        if (res.valid) toast.success(res.message);
        else toast.error(res.message);
      } else {
        const res = { valid: true, message: "OpenStreetMap / CARTO selecionado (camada pública sem custos de API)." };
        setResultadoTesteMapaModal(res);
        toast.success(res.message);
      }
    } catch (err: any) {
      const res = { valid: false, message: err?.message || "Falha ao validar chave." };
      setResultadoTesteMapaModal(res);
      toast.error(res.message);
    } finally {
      setTestandoMapaModal(false);
    }
  }

  function handleSalvarMapaModal(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantParaMapa) return;
    const prevGeo = tenantParaMapa.configuracaoCompleta?.geo || {};
    const updatedGeo = {
      ...prevGeo,
      mapProvider: mapProviderModal,
      mapboxAccessToken: mapboxTokenModal.trim(),
      googleMapsApiKey: googleKeyModal.trim(),
      coordenadasCentroLat: Number(centerLatModal),
      coordenadasCentroLng: Number(centerLngModal),
      raioOperacaoPadraoKm: Number(radiusKmModal),
    };
    whiteLabelEngine.updateTenantConfig(tenantParaMapa.tenantId, { geo: updatedGeo });
    recarregarTenants();
    toast.success(`APIs de Mapa da franquia ${tenantParaMapa.nomeOperacao} configuradas e ativadas!`);
    setTenantParaMapa(null);
  }

  function handleCopiarKitAcesso(tenant: WhiteLabelTenantRecord) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://partiumobe.com.br";
    const email = tenant.adminEmail || tenant.responsavelEmail || `${tenant.tenantId.replace("tenant-", "")}@partiu.app`;
    const senha = tenant.adminSenha || "Franqueado2026!";
    const urlApp = `${origin}/app?tenant=${encodeURIComponent(tenant.tenantId)}`;
    const urlMotorista = `${origin}/app/motorista?tenant=${encodeURIComponent(tenant.tenantId)}`;
    const urlPainel = `${origin}/app/admin/login`;

    const texto = `🚗 KIT DE ACESSO EXCLUSIVO — ${tenant.nomeOperacao.toUpperCase()}\n\n` +
      `📍 Praça: ${tenant.cidadeNome} — ${tenant.uf}\n\n` +
      `📲 Link de Passageiros (Solicitar Corridas):\n${urlApp}\n\n` +
      `🚘 Link do Portal do Motorista (Cadastro & Assinatura):\n${urlMotorista}\n\n` +
      `🔐 Painel Administrativo do Franqueado:\n${urlPainel}\n` +
      `📧 E-mail de Login: ${email}\n` +
      `🔑 Senha de Acesso: ${senha}\n\n` +
      `Guarde estas credenciais em segurança e acesse para gerenciar sua praça.`;

    navigator.clipboard.writeText(texto);
    toast.success("Kit completo de acesso copiado com links de passageiro e motorista!");
  }

  function handleSalvarCredenciais(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantParaCredenciais) return;
    if (!credencialEmail.trim() || !credencialSenha.trim()) {
      toast.error("Informe e-mail e senha válidos.");
      return;
    }
    whiteLabelEngine.updateTenantCredentials(
      tenantParaCredenciais.tenantId,
      credencialEmail.trim(),
      credencialSenha.trim()
    );
    recarregarTenants();
    toast.success(`Credenciais de ${tenantParaCredenciais.nomeOperacao} atualizadas com sucesso!`);
    setTenantParaCredenciais(null);
  }

  function handleGerarSenhaModal() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCredencialSenha(pass);
    toast.success("Nova senha segura gerada!");
  }

  // Associação de Passageiros por Franqueado
  const passageirosPorTenant = useMemo(() => {
    const mapa = new Map<string, PassageiroAdmin[]>();
    tenants.forEach((t) => mapa.set(t.tenantId, []));

    todosPassageiros.forEach((p) => {
      const pCidade = ((p as any).cidade || (p as any).city || "").toLowerCase();
      const pTenantId = (p as any).tenant_id;

      // Se tiver tenant_id explícito
      if (pTenantId && mapa.has(pTenantId)) {
        mapa.get(pTenantId)!.push(p);
        return;
      }

      // Associação por cidade da franquia ou corrida
      let associado = false;
      for (const t of tenants) {
        const nomeCidade = t.cidadeNome.toLowerCase();
        if (pCidade.includes(nomeCidade)) {
          mapa.get(t.tenantId)!.push(p);
          associado = true;
          break;
        }
      }

      // Se não associado a uma praça regional, atribui à Matriz Oficial
      if (!associado && mapa.has("default")) {
        mapa.get("default")!.push(p);
      } else if (!associado && mapa.has("tenant-itaperuna")) {
        mapa.get("tenant-itaperuna")!.push(p);
      }
    });

    return mapa;
  }, [tenants, todosPassageiros]);

  // Associação de Motoristas por Franqueado
  const motoristasPorTenant = useMemo(() => {
    const mapa = new Map<string, typeof todosMotoristas>();
    tenants.forEach((t) => mapa.set(t.tenantId, []));

    todosMotoristas.forEach((m) => {
      const mCidade = ((m as any).cidade || (m as any).city || "").toLowerCase();
      const mTenantId = (m as any).tenant_id;

      if (mTenantId && mapa.has(mTenantId)) {
        mapa.get(mTenantId)!.push(m);
        return;
      }

      let associado = false;
      for (const t of tenants) {
        const nomeCidade = t.cidadeNome.toLowerCase();
        if (mCidade.includes(nomeCidade)) {
          mapa.get(t.tenantId)!.push(m);
          associado = true;
          break;
        }
      }

      if (!associado && mapa.has("default")) {
        mapa.get("default")!.push(m);
      } else if (!associado && mapa.has("tenant-itaperuna")) {
        mapa.get("tenant-itaperuna")!.push(m);
      }
    });

    return mapa;
  }, [tenants, todosMotoristas]);

  // Filtragem da Lista de Franqueados Regionais
  const franqueadosFiltrados = useMemo(() => {
    return tenants.filter((t) => {
      // O tenant "default" representa a Matriz Holding, não uma franquia regional
      if (t.tenantId === "default") return false;

      const isAtivo = t.ativo !== false && t.statusPlano !== "SUSPENSO" && t.statusPlano !== "CANCELADO";
      if (filtroStatus === "ATIVOS" && !isAtivo) return false;
      if (filtroStatus === "SUSPENSOS" && isAtivo) return false;

      if (busca) {
        const q = busca.toLowerCase();
        const textoCompleto = `${t.nomeOperacao} ${t.cidadeNome} ${t.uf} ${t.responsavelNome} ${t.responsavelEmail} ${t.cnpjFranqueado} ${t.tenantId}`.toLowerCase();
        return textoCompleto.includes(q);
      }
      return true;
    });
  }, [tenants, busca, filtroStatus]);

  // Estatísticas Globais de Franquias Regionais
  const stats = useMemo(() => {
    const franquiasRegionais = tenants.filter((t) => t.tenantId !== "default");
    const total = franquiasRegionais.length;
    const ativos = franquiasRegionais.filter(
      (t) => t.ativo !== false && t.statusPlano !== "SUSPENSO" && t.statusPlano !== "CANCELADO"
    ).length;
    const suspensos = total - ativos;
    const totalPassageirosRede = todosPassageiros.length;
    const totalMotoristasRede = todosMotoristas.length;
    return { total, ativos, suspensos, totalPassageirosRede, totalMotoristasRede };
  }, [tenants, todosPassageiros, todosMotoristas]);

  // Ação: Alternar Status do Plano (Kill Switch)
  async function executarAlternanciaPlano() {
    if (!tenantParaDesativar) return;
    const isAtivo = tenantParaDesativar.ativo !== false && tenantParaDesativar.statusPlano !== "SUSPENSO";
    const novoStatus = isAtivo ? "SUSPENSO" : "ATIVO";

    try {
      await whiteLabelEngine.setTenantStatus(
        tenantParaDesativar.tenantId,
        novoStatus,
        isAtivo ? motivoDesativacao || "Plano desativado pela administração central" : undefined
      );
      setTenantParaDesativar(null);
      setMotivoDesativacao("");
      recarregarTenants();
    } catch (e: any) {
      alert(e.message || "Erro ao alterar status da franquia");
    }
  }

  // Ação: Excluir Franqueado
  async function executarExclusaoFranqueado() {
    if (!tenantParaExcluir) return;
    try {
      await whiteLabelEngine.deleteTenant(tenantParaExcluir.tenantId);
      setTenantParaExcluir(null);
      setConfirmacaoExclusaoTexto("");
      recarregarTenants();
    } catch (e: any) {
      alert(e.message || "Erro ao excluir conta do franqueado");
    }
  }

  // Exportação CSV de Passageiros do Franqueado
  function exportarPassageirosFranqueado(tenant: WhiteLabelTenantRecord) {
    const lista = passageirosPorTenant.get(tenant.tenantId) || [];
    const cabecalhos = ["ID", "Nome Completo", "E-mail", "Telefone", "CPF", "Status", "Data de Cadastro"];
    const linhas = lista.map((p) => [
      p.id,
      p.full_name || "Sem Nome",
      p.email || "",
      p.phone || "",
      p.cpf || "",
      p.status || "ativo",
      p.created_at ? p.created_at.slice(0, 10) : "",
    ]);
    exportarParaCSV(`passageiros_${tenant.cidadeNome.toLowerCase()}`, cabecalhos, linhas);
  }

  // Exportação CSV de Motoristas do Franqueado
  function exportarMotoristasFranqueado(tenant: WhiteLabelTenantRecord) {
    const lista = motoristasPorTenant.get(tenant.tenantId) || [];
    const cabecalhos = ["ID", "Nome", "Telefone", "CPF", "Veículo", "Placa", "Categoria"];
    const linhas = lista.map((m) => [
      m.id,
      m.full_name || "Sem Nome",
      m.phone || "",
      m.cpf || "",
      m.veiculo_modelo || "",
      m.veiculo_placa || "",
      m.categoria || "CARRO",
    ]);
    exportarParaCSV(`motoristas_${tenant.cidadeNome.toLowerCase()}`, cabecalhos, linhas);
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24">
      {/* 1. CABEÇALHO EXECUTIVO */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  Gestão Central de Franqueados & Multi-Tenant
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                  Super Admin Geral
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ativação e desativação de planos, controle de APIs, listas de passageiros e motoristas por praça.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalClonarAberto(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Franquia / Praça</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* 2. CARDS DE KPIS GLOBAIS EM TEMPO REAL */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Total Franquias
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-black text-slate-950 dark:text-white">{stats.total}</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              Planos Ativos
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.ativos}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-800/40 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
              Suspensos / Offline
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.suspensos}</span>
              <AlertOctagon className="w-4 h-4 text-rose-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Motoristas na Rede
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-black text-slate-950 dark:text-white">{stats.totalMotoristasRede}</span>
              <Car className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Passageiros na Rede
            </span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-black text-slate-950 dark:text-white">{stats.totalPassageirosRede}</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </section>

        {/* 3. BARRA DE BUSCA E FILTROS */}
        <section className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome da franquia, cidade, responsável ou CNPJ..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setFiltroStatus("TODOS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                filtroStatus === "TODOS"
                  ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus("ATIVOS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                filtroStatus === "ATIVOS"
                  ? "bg-emerald-500 text-white shadow-2xs"
                  : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              }`}
            >
              Ativos ({stats.ativos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus("SUSPENSOS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                filtroStatus === "SUSPENSOS"
                  ? "bg-rose-500 text-white shadow-2xs"
                  : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              }`}
            >
              Suspensos ({stats.suspensos})
            </button>
          </div>
        </section>

        {/* 4. LISTA DE FRANQUEADOS COM MÉTRICAS E CONTROLE TOTAL */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Franquias e Praças ({franqueadosFiltrados.length})
            </h2>
            <span className="text-xs text-slate-500">
              Apenas a Matriz Oficial utiliza a chave Mapbox configurada no sistema.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {franqueadosFiltrados.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4 shadow-2xs">
                <div className="w-16 h-16 rounded-3xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto">
                  <Building2 className="w-8 h-8 stroke-[1.8]" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-black text-slate-950 dark:text-white">
                    Nenhuma Franquia Regional Cadastrada
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    O ecossistema está operando no núcleo Matriz. Cadastre uma nova praça franqueada para gerar links personalizados de passageiro e motorista, credenciais de acesso exclusivas e APIs de mapas próprias.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalClonarAberto(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Nova Franquia</span>
                </button>
              </div>
            ) : (
              franqueadosFiltrados.map((tenant) => {
              const isMatriz = MapboxConfig.isOfficialMatrizTenant(tenant.tenantId);
              const isAtivo = tenant.ativo !== false && tenant.statusPlano !== "SUSPENSO" && tenant.statusPlano !== "CANCELADO";
              const passageirosCount = passageirosPorTenant.get(tenant.tenantId)?.length || 0;
              const motoristasCount = motoristasPorTenant.get(tenant.tenantId)?.length || 0;
              const hasMapboxKey = Boolean(tenant.configuracaoCompleta?.geo?.mapboxAccessToken?.startsWith("pk."));
              const hasGoogleKey = Boolean(tenant.configuracaoCompleta?.geo?.googleMapsApiKey && tenant.configuracaoCompleta.geo.googleMapsApiKey.length > 10);
              const hasPixKey = Boolean(tenant.configuracaoCompleta?.monetization?.chavePixAdmin);

              return (
                <div
                  key={tenant.tenantId}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs transition-all ${
                    !isAtivo
                      ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Identificação da Franquia */}
                    <div className="flex items-start gap-3.5 min-w-[280px]">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shrink-0 shadow-2xs text-lg"
                        style={{
                          backgroundColor:
                            tenant.configuracaoCompleta?.designSystem?.paletaPrimaria?.corPrincipal || "#FF6B00",
                        }}
                      >
                        {tenant.cidadeNome.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-slate-950 dark:text-white">
                            {tenant.nomeOperacao}
                          </h3>
                          {isMatriz && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 border border-primary-200">
                              Matriz Oficial
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isAtivo
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 animate-pulse"
                            }`}
                          >
                            {isAtivo ? "PLANO ATIVO" : "SUSPENSO / OFFLINE"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {tenant.cidadeNome} — {tenant.uf}
                          </span>
                          <span>•</span>
                          <span>CNPJ: {tenant.cnpjFranqueado || "Não informado"}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-slate-400">id: {tenant.tenantId}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {tenant.adminEmail || tenant.responsavelEmail}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {tenant.responsavelTelefone}
                          </span>
                          <span>({tenant.responsavelNome})</span>
                        </div>

                        {/* Link Funcional do Aplicativo & Credenciais Administrativas */}
                        <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          {/* Link de Passageiros */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5 text-primary-500" />
                              App Passageiros:
                            </span>
                            <code className="text-[11px] font-mono text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-md border border-primary-200/50 dark:border-primary-800/40 truncate max-w-[280px]">
                              {typeof window !== "undefined" ? `${window.location.origin}/app?tenant=${tenant.tenantId}` : `/app?tenant=${tenant.tenantId}`}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopiarLinkApp(tenant)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="Copiar Link de Passageiros"
                            >
                              <Copy className="w-3 h-3" />
                              Copiar Link
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAbrirApp(tenant)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/60 dark:hover:bg-primary-900/60 text-[10px] font-bold text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 transition cursor-pointer"
                              title="Abrir App de Passageiros em Nova Aba"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Abrir
                            </button>
                          </div>

                          {/* Link do Motorista */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <Car className="w-3.5 h-3.5 text-emerald-500" />
                              Portal Motoristas:
                            </span>
                            <code className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40 truncate max-w-[280px]">
                              {typeof window !== "undefined" ? `${window.location.origin}/app/motorista?tenant=${tenant.tenantId}` : `/app/motorista?tenant=${tenant.tenantId}`}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopiarLinkMotorista(tenant)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 transition cursor-pointer"
                              title="Copiar Link do Portal do Motorista"
                            >
                              <Copy className="w-3 h-3" />
                              Copiar Link Motorista
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAbrirMotorista(tenant)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                              title="Abrir Portal do Motorista em Nova Aba"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Abrir
                            </button>
                          </div>

                          {/* Credenciais de Acesso */}
                          {!isMatriz && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-500" />
                                Login Painel:
                              </span>
                              <span className="font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {tenant.adminEmail || tenant.responsavelEmail}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {senhasVisiveis[tenant.tenantId]
                                  ? (tenant.adminSenha || "Franqueado2026!")
                                  : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleVerSenhaCard(tenant.tenantId)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                title={senhasVisiveis[tenant.tenantId] ? "Ocultar Senha" : "Ver Senha"}
                              >
                                {senhasVisiveis[tenant.tenantId] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>

                        {!isAtivo && tenant.motivoBloqueio && (
                          <div className="mt-1.5 p-2 rounded-xl bg-rose-100/60 dark:bg-rose-950/40 text-[11px] text-rose-800 dark:text-rose-300 font-medium">
                            Motivo do bloqueio: {tenant.motivoBloqueio}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status de APIs e Compliance */}
                    <div className="flex flex-wrap items-center gap-2 lg:max-w-[260px]">
                      {/* Badge Mapbox */}
                      {isMatriz ? (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-blue-600" />
                          API Oficial Matriz
                        </span>
                      ) : hasMapboxKey ? (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-emerald-600" />
                          Mapbox Próprio (OK)
                        </span>
                      ) : hasGoogleKey ? (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-emerald-600" />
                          Google Maps (OK)
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5" title="Franqueado precisa cadastrar chave de mapa própria">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Sem Chave de Mapa
                        </span>
                      )}

                      {/* Botão Configurar APIs de Mapa (Exclusivo Franqueados) */}
                      {!isMatriz && (
                        <button
                          type="button"
                          onClick={() => abrirModalMapa(tenant)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-primary-50 dark:bg-primary-950/70 hover:bg-primary-100 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                          title="Conectar ou editar chave de API Google Maps / Mapbox"
                        >
                          <Navigation className="w-3 h-3" />
                          Configurar Mapas
                        </button>
                      )}

                      {/* Badge PIX */}
                      {hasPixKey ? (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          PIX Configurado
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          PIX Pendente
                        </span>
                      )}
                    </div>

                    {/* Métricas e Listas Rápidas */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTenantInspecaoPassageiros(tenant)}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left transition cursor-pointer"
                        title="Ver lista de passageiros cadastrados desta franquia"
                      >
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <Users className="w-3 h-3" />
                          Passageiros
                        </div>
                        <div className="text-base font-black text-slate-950 dark:text-white mt-0.5">
                          {passageirosCount}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTenantInspecaoMotoristas(tenant)}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left transition cursor-pointer"
                        title="Ver lista de motoristas cadastrados desta franquia"
                      >
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <Car className="w-3 h-3" />
                          Motoristas
                        </div>
                        <div className="text-base font-black text-slate-950 dark:text-white mt-0.5">
                          {motoristasCount}
                        </div>
                      </button>
                    </div>

                    {/* Botões de Ação Imediata */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Ativar/Desativar Plano (Kill Switch) */}
                      {!isMatriz && (
                        <button
                          type="button"
                          onClick={() => setTenantParaDesativar(tenant)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                            isAtivo
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                          }`}
                          title={isAtivo ? "Suspender plano e tirar app do ar" : "Reativar plano e colocar app no ar"}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{isAtivo ? "Suspender Plano" : "Reativar Plano"}</span>
                        </button>
                      )}

                      {/* Abrir White-Label Studio para esta franquia */}
                      <button
                        type="button"
                        onClick={() => {
                          switchTenant(tenant.tenantId);
                          void navigate({ to: "/app/admin/whitelabel" });
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
                        title="Personalizar identidade visual e configurações no White Label Studio"
                      >
                        <Palette className="w-3.5 h-3.5 text-primary-600" />
                        <span>Customizar</span>
                      </button>

                      {/* Gerenciar Credenciais do Franqueado */}
                      {!isMatriz && (
                        <button
                          type="button"
                          onClick={() => {
                            setTenantParaCredenciais(tenant);
                            setCredencialEmail(tenant.adminEmail || tenant.responsavelEmail || `${tenant.tenantId.replace("tenant-", "")}@partiu.app`);
                            setCredencialSenha(tenant.adminSenha || "Franqueado2026!");
                            setMostrarSenhaModal(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                          title="Gerenciar e-mail e senha de acesso ao painel do franqueado"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>Credenciais</span>
                        </button>
                      )}

                      {/* Copiar Kit de Acesso do Franqueado */}
                      {!isMatriz && (
                        <button
                          type="button"
                          onClick={() => handleCopiarKitAcesso(tenant)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                          title="Copiar dados completos de acesso (link do app, login e senha) para enviar ao franqueado"
                        >
                          <Share2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copiar Acesso</span>
                        </button>
                      )}

                      {/* Excluir Franqueado */}
                      {!isMatriz && (
                        <button
                          type="button"
                          onClick={() => setTenantParaExcluir(tenant)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Excluir conta do franqueado permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </section>
      </main>

      {/* 5. MODAL: INSPEÇÃO & DOWNLOAD DE PASSAGEIROS DA FRANQUIA */}
      {tenantInspecaoPassageiros && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-3xl w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  Passageiros Cadastrados — {tenantInspecaoPassageiros.nomeOperacao}
                </h3>
                <p className="text-xs text-slate-500">
                  Total de {passageirosPorTenant.get(tenantInspecaoPassageiros.tenantId)?.length || 0} passageiros vinculados a esta praça.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportarPassageirosFranqueado(tenantInspecaoPassageiros)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTenantInspecaoPassageiros(null);
                    setBuscaModalUsuario("");
                  }}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por nome, telefone ou e-mail..."
                value={buscaModalUsuario}
                onChange={(e) => setBuscaModalUsuario(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const lista = (passageirosPorTenant.get(tenantInspecaoPassageiros.tenantId) || []).filter((p) => {
                  if (!buscaModalUsuario) return true;
                  const q = buscaModalUsuario.toLowerCase();
                  return (
                    (p.full_name && p.full_name.toLowerCase().includes(q)) ||
                    (p.email && p.email.toLowerCase().includes(q)) ||
                    (p.phone && p.phone.toLowerCase().includes(q))
                  );
                });

                if (lista.length === 0) {
                  return (
                    <p className="text-center py-8 text-xs text-slate-500">
                      Nenhum passageiro encontrado nesta praça.
                    </p>
                  );
                }

                return (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-2">Nome</th>
                        <th className="py-2 px-2">Telefone</th>
                        <th className="py-2 px-2">E-mail</th>
                        <th className="py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {lista.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-2 font-medium text-slate-900 dark:text-white">
                            {p.full_name || "Sem Nome"}
                          </td>
                          <td className="py-2 px-2 text-slate-600 dark:text-slate-300">{p.phone || "-"}</td>
                          <td className="py-2 px-2 text-slate-500">{p.email || "-"}</td>
                          <td className="py-2 px-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                p.status === "ativo"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {p.status || "ativo"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: INSPEÇÃO & DOWNLOAD DE MOTORISTAS DA FRANQUIA */}
      {tenantInspecaoMotoristas && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-3xl w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary-600" />
                  Motoristas Cadastrados — {tenantInspecaoMotoristas.nomeOperacao}
                </h3>
                <p className="text-xs text-slate-500">
                  Total de {motoristasPorTenant.get(tenantInspecaoMotoristas.tenantId)?.length || 0} condutores parceiros vinculados.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportarMotoristasFranqueado(tenantInspecaoMotoristas)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTenantInspecaoMotoristas(null);
                    setBuscaModalUsuario("");
                  }}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por nome, veículo ou placa..."
                value={buscaModalUsuario}
                onChange={(e) => setBuscaModalUsuario(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const lista = (motoristasPorTenant.get(tenantInspecaoMotoristas.tenantId) || []).filter((m) => {
                  if (!buscaModalUsuario) return true;
                  const q = buscaModalUsuario.toLowerCase();
                  return (
                    (m.full_name && m.full_name.toLowerCase().includes(q)) ||
                    (m.veiculo_modelo && m.veiculo_modelo.toLowerCase().includes(q)) ||
                    (m.veiculo_placa && m.veiculo_placa.toLowerCase().includes(q))
                  );
                });

                if (lista.length === 0) {
                  return (
                    <p className="text-center py-8 text-xs text-slate-500">
                      Nenhum motorista cadastrado nesta praça.
                    </p>
                  );
                }

                return (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2 px-2">Motorista</th>
                        <th className="py-2 px-2">Telefone</th>
                        <th className="py-2 px-2">Veículo / Placa</th>
                        <th className="py-2 px-2">Modal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {lista.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-2 font-medium text-slate-900 dark:text-white">
                            {m.full_name || "Sem Nome"}
                          </td>
                          <td className="py-2 px-2 text-slate-600 dark:text-slate-300">{m.phone || "-"}</td>
                          <td className="py-2 px-2 text-slate-600 dark:text-slate-300">
                            {m.veiculo_modelo || "-"} • <span className="font-mono font-bold">{m.veiculo_placa || "-"}</span>
                          </td>
                          <td className="py-2 px-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {m.categoria || "CARRO"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: KILL SWITCH — ATIVAR OU DESATIVAR PLANO DA FRANQUIA */}
      {tenantParaDesativar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  tenantParaDesativar.ativo !== false && tenantParaDesativar.statusPlano !== "SUSPENSO"
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  {tenantParaDesativar.ativo !== false && tenantParaDesativar.statusPlano !== "SUSPENSO"
                    ? "Suspender Plano e Desativar App"
                    : "Reativar Plano da Franquia"}
                </h3>
                <p className="text-xs text-slate-500">{tenantParaDesativar.nomeOperacao}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {tenantParaDesativar.ativo !== false && tenantParaDesativar.statusPlano !== "SUSPENSO"
                ? "Ao suspender o plano, o aplicativo desta franquia será retirado do ar imediatamente para motoristas e passageiros, e o acesso do gestor ao painel administrativo será bloqueado."
                : "Ao reativar, o aplicativo da praça voltará a operar normalmente e o gestor terá seu acesso administrativo restabelecido."}
            </p>

            {tenantParaDesativar.ativo !== false && tenantParaDesativar.statusPlano !== "SUSPENSO" && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Motivo da suspensão (exibido ao gestor)
                </label>
                <input
                  type="text"
                  placeholder="ex: Inadimplência de mensalidade SaaS, descumprimento contratual..."
                  value={motivoDesativacao}
                  onChange={(e) => setMotivoDesativacao(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTenantParaDesativar(null);
                  setMotivoDesativacao("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executarAlternanciaPlano}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer ${
                  tenantParaDesativar.ativo !== false && tenantParaDesativar.statusPlano !== "SUSPENSO"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {tenantParaDesativar.ativo !== false && tenantParaDesativar.statusPlano !== "SUSPENSO"
                  ? "Confirmar Suspensão"
                  : "Confirmar Reativação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: EXCLUSÃO PERMANENTE DE FRANQUEADO */}
      {tenantParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/60 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                  Excluir Franqueado Permanentemente
                </h3>
                <p className="text-xs text-slate-500">{tenantParaExcluir.nomeOperacao}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Esta ação é <strong>irreversível</strong>. A conta do franqueado, as customizações White-Label e os acessos locais serão excluídos do sistema.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Digite o nome da cidade (<span className="text-rose-600">{tenantParaExcluir.cidadeNome}</span>) para confirmar:
              </label>
              <input
                type="text"
                placeholder={tenantParaExcluir.cidadeNome}
                value={confirmacaoExclusaoTexto}
                onChange={(e) => setConfirmacaoExclusaoTexto(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTenantParaExcluir(null);
                  setConfirmacaoExclusaoTexto("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmacaoExclusaoTexto.trim().toLowerCase() !== tenantParaExcluir.cidadeNome.trim().toLowerCase()}
                onClick={executarExclusaoFranqueado}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white transition cursor-pointer"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: GERENCIAMENTO DE CREDENCIAIS DO FRANQUEADO */}
      {tenantParaCredenciais && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">
                    Credenciais do Franqueado
                  </h3>
                  <p className="text-xs text-slate-500">
                    {tenantParaCredenciais.nomeOperacao} ({tenantParaCredenciais.cidadeNome} — {tenantParaCredenciais.uf})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTenantParaCredenciais(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarCredenciais} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  E-mail de Acesso ao Painel
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={credencialEmail}
                    onChange={(e) => setCredencialEmail(e.target.value)}
                    placeholder="franqueado@suamarca.app"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Este e-mail será usado para fazer login no painel administrativo desta franquia.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={handleGerarSenhaModal}
                    className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Gerar senha forte
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostrarSenhaModal ? "text" : "password"}
                    required
                    value={credencialSenha}
                    onChange={(e) => setCredencialSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaModal(!mostrarSenhaModal)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {mostrarSenhaModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Isolamento de Segurança Garantido
                </div>
                <p className="text-[11px] leading-relaxed">
                  Ao salvar, o franqueado poderá acessar imediatamente o painel em <span className="font-mono text-slate-800 dark:text-slate-300">/app/admin/login</span> com estas credenciais e gerenciar apenas os dados de sua praça.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTenantParaCredenciais(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-500 text-white transition shadow-xs cursor-pointer"
                >
                  Salvar Credenciais
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: CONFIGURAÇÃO DE APIS DE MAPAS DO FRANQUEADO */}
      {tenantParaMapa && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">
                    Conectar APIs de Mapas Própria
                  </h3>
                  <p className="text-xs text-slate-500">
                    {tenantParaMapa.nomeOperacao} ({tenantParaMapa.cidadeNome} — {tenantParaMapa.uf})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTenantParaMapa(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Aviso de Isolamento de Cotas */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Isolamento Estrito de Cotas da Holding</p>
                <p className="text-[11px] mt-0.5 leading-relaxed text-amber-700 dark:text-amber-400">
                  A chave da Matriz é de uso exclusivo do Super Administrador. Cada franqueado deve conectar seu próprio Mapbox ou Google Maps para isolar seus custos. Se nenhuma chave for cadastrada, a praça operará na camada gratuita CARTO/OSM.
                </p>
              </div>
            </div>

            <form onSubmit={handleSalvarMapaModal} className="space-y-4">
              {/* Provedor de Mapas */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Provedor de Mapas Ativo
                </label>
                <select
                  value={mapProviderModal}
                  onChange={(e: any) => setMapProviderModal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-semibold outline-none"
                >
                  <option value="mapbox">Mapbox GL JS (Nativo)</option>
                  <option value="google">Google Maps Platform</option>
                  <option value="osm">OpenStreetMap / CARTO (Gratuito / Sem chave)</option>
                </select>
              </div>

              {/* Chave Mapbox */}
              {mapProviderModal === "mapbox" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Token Público Mapbox do Franqueado (pk.*)
                    </label>
                    <a
                      href="https://account.mapbox.com/access-tokens/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      Obter token <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={mostrarTokenModal ? "text" : "password"}
                      value={mapboxTokenModal}
                      onChange={(e) => setMapboxTokenModal(e.target.value.trim())}
                      placeholder="pk.eyJ1I..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2.5 text-xs font-mono text-slate-900 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarTokenModal(!mostrarTokenModal)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {mostrarTokenModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Chave Google Maps */}
              {mapProviderModal === "google" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Chave API Google Maps Platform (AIzaSy...)
                    </label>
                    <a
                      href="https://console.cloud.google.com/google/maps-apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      Console Google <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={mostrarTokenModal ? "text" : "password"}
                      value={googleKeyModal}
                      onChange={(e) => setGoogleKeyModal(e.target.value.trim())}
                      placeholder="AIzaSy..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-10 py-2.5 text-xs font-mono text-slate-900 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarTokenModal(!mostrarTokenModal)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {mostrarTokenModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Coordenadas e Raio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Latitude Central
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={centerLatModal}
                    onChange={(e) => setCenterLatModal(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Longitude Central
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={centerLngModal}
                    onChange={(e) => setCenterLngModal(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Raio Operação (km)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={radiusKmModal}
                    onChange={(e) => setRadiusKmModal(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Botão Testar Conexão */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTestarChaveMapaModal}
                  disabled={testandoMapaModal}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {testandoMapaModal ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-500" />
                      <span>Validando Endpoint da Chave...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Testar Conexão com Servidor de Mapas</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resultado do Teste */}
              {resultadoTesteMapaModal && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    resultadoTesteMapaModal.valid
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                  }`}
                >
                  {resultadoTesteMapaModal.valid ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{resultadoTesteMapaModal.message}</span>
                </div>
              )}

              {/* Ações do Modal */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTenantParaMapa(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-500 text-white transition shadow-xs cursor-pointer"
                >
                  Salvar e Ativar na Praça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. MODAL: CLONAGEM / NOVA CIDADE FRANQUEADA */}
      <CloneTenantModal
        isOpen={modalClonarAberto}
        onClose={() => setModalClonarAberto(false)}
        onCloned={() => {
          recarregarTenants();
          setModalClonarAberto(false);
        }}
      />
    </div>
  );
}
