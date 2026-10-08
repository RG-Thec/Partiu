import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Plus,
  ShieldCheck,
  Server,
  Layers,
  Search,
  ExternalLink,
  Trash2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { isSuperAdmin } from "@/lib/admin-rbac";
import {
  tenantDomainService,
  CANONICAL_CNAME_TARGET,
  CANONICAL_APEX_IP,
  type TenantDomainRecord,
  type DomainStatus,
} from "@/lib/white-label/tenant-domain-service";
import { WhiteLabelEngine } from "@/lib/white-label/white-label-engine";

export const Route = createFileRoute("/app/admin/dominios")({
  component: DominiosPage,
});

export default function DominiosPage() {
  const superAdmin = isSuperAdmin();

  const [dominios, setDominios] = useState<TenantDomainRecord[]>(() =>
    tenantDomainService.listDomains()
  );
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [rechecando, setRechecando] = useState<string | null>(null);

  // Modal para adicionar novo domínio
  const [modalAberto, setModalAberto] = useState(false);
  const [novoTenantId, setNovoTenantId] = useState("");
  const [novoDominio, setNovoDominio] = useState("");
  const [novoTenantNome, setNovoTenantNome] = useState("");

  const todosTenants = useMemo(() => {
    return WhiteLabelEngine.getInstance().getAllTenants();
  }, []);

  function recarregar() {
    setDominios(tenantDomainService.listDomains());
  }

  // Filtragem
  const dominiosFiltrados = useMemo(() => {
    return dominios.filter((d) => {
      const matchTexto =
        d.domain.toLowerCase().includes(termoBusca.toLowerCase()) ||
        d.tenantNome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        d.tenantId.toLowerCase().includes(termoBusca.toLowerCase());

      const matchStatus =
        filtroStatus === "TODOS" || d.status === filtroStatus;

      return matchTexto && matchStatus;
    });
  }, [dominios, termoBusca, filtroStatus]);

  // KPIs
  const totalDominios = dominios.length;
  const ativos = dominios.filter((d) => d.status === "ATIVO").length;
  const pendentes = dominios.filter((d) => d.status === "PENDENTE").length;
  const falhas = dominios.filter((d) => d.status === "DNS_FALHOU" || d.status === "REVOGADO").length;

  async function handleRechecarDns(domain: string) {
    setRechecando(domain);
    try {
      const res = await tenantDomainService.verifyDomainDns(domain);
      recarregar();
      if (res.sucesso) {
        toast.success(res.mensagem);
      } else {
        toast.warning(res.mensagem);
      }
    } catch (err: any) {
      toast.error(`Falha ao rechecar: ${err.message}`);
    } finally {
      setRechecando(null);
    }
  }

  function handleAprovarManualmente(domain: string) {
    try {
      tenantDomainService.approveDomain(domain);
      recarregar();
      toast.success(`Domínio '${domain}' aprovado e ativado com sucesso!`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function handleRevogar(domain: string) {
    if (!confirm(`Deseja revogar o acesso do domínio '${domain}'?`)) return;
    try {
      tenantDomainService.rejectDomain(domain);
      recarregar();
      toast.warning(`Domínio '${domain}' revogado.`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function handleExcluir(domain: string) {
    if (!confirm(`Tem certeza que deseja excluir o registro do domínio '${domain}'?`)) return;
    tenantDomainService.deleteDomain(domain);
    recarregar();
    toast.success("Domínio removido do registro.");
  }

  function handleCadastrarDominio(e: React.FormEvent) {
    e.preventDefault();
    if (!novoDominio.trim() || !novoTenantId) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const tenant = todosTenants.find((t) => t.tenantId === novoTenantId);
    const nomeFinal = novoTenantNome.trim() || tenant?.nomeOperacao || "Franquia Regional";

    const res = tenantDomainService.registerCustomDomain(
      novoTenantId,
      novoDominio.trim(),
      nomeFinal
    );

    if (!res.sucesso) {
      toast.error(res.mensagem);
      return;
    }

    toast.success("Domínio cadastrado! Instrua o franqueado a configurar o DNS.");
    setModalAberto(false);
    setNovoDominio("");
    setNovoTenantId("");
    setNovoTenantNome("");
    recarregar();
  }

  if (!superAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Acesso Restrito à Matriz (Super Admin)</h2>
          <p className="text-sm text-slate-400">
            Apenas a diretoria executiva e os administradores globais têm permissão para auditar e gerenciar a infraestrutura DNS e os domínios do ecossistema PARTIU MOBE.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold tracking-wide uppercase mb-3">
            <Globe className="w-3.5 h-3.5" />
            Infraestrutura Global & Edge DNS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestão & Aprovação de Domínios White-Label
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Painel exclusivo da Holding para aprovação, validação de registros CNAME/A e emissão de certificados SSL para todos os domínios customizados das franquias regionais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-slate-950 font-bold text-sm shadow-md hover:bg-primary/90 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Vincular Novo Domínio
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Total de Domínios</div>
          <div className="text-3xl font-black text-white mt-1">{totalDominios}</div>
          <div className="text-xs text-slate-500 mt-1">Registrados no ecossistema</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Domínios Ativos & SSL</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">{ativos}</div>
          <div className="text-xs text-emerald-500/80 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Resolução 100% propagada
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Pendentes de DNS</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{pendentes}</div>
          <div className="text-xs text-amber-500/80 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Aguardando entrada CNAME
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-xs font-medium text-slate-400">Falha ou Revogados</div>
          <div className="text-3xl font-black text-rose-400 mt-1">{falhas}</div>
          <div className="text-xs text-rose-500/80 mt-1 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Requer revisão técnica
          </div>
        </div>
      </div>

      {/* REGRAS DE DNS DA INFRAESTRUTURA */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Server className="w-4 h-4 text-primary" />
          Instruções Oficiais de Apontamento DNS da Plataforma
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Para que o tráfego dos franqueados seja roteado com sucesso e os certificados SSL sejam provisionados automaticamente via Edge, o franqueado deve cadastrar as seguintes entradas na sua zona de DNS:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
            <div className="text-indigo-400 font-bold font-sans">1. Subdomínios (Recomendado):</div>
            <div className="text-slate-300">Tipo: <strong className="text-white">CNAME</strong></div>
            <div className="text-slate-300">Entrada: <strong className="text-white">app</strong> (ou subdomínio desejado)</div>
            <div className="text-slate-300">Destino: <strong className="text-primary">{CANONICAL_CNAME_TARGET}</strong></div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
            <div className="text-indigo-400 font-bold font-sans">2. Domínio Apex / Raiz:</div>
            <div className="text-slate-300">Tipo: <strong className="text-white">A</strong></div>
            <div className="text-slate-300">Entrada: <strong className="text-white">@</strong></div>
            <div className="text-slate-300">Destino: <strong className="text-primary">{CANONICAL_APEX_IP}</strong></div>
          </div>
        </div>
      </div>

      {/* TABELA DE GESTÃO DE DOMÍNIOS */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por domínio, praça ou tenant..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="ATIVO">Ativos</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="DNS_FALHOU">Falhas de DNS</option>
              <option value="REVOGADO">Revogados</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Praça / Franquia</th>
                <th className="py-3 px-4">Domínio Customizado</th>
                <th className="py-3 px-4">Apontamento CNAME</th>
                <th className="py-3 px-4">Status DNS</th>
                <th className="py-3 px-4">SSL</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
              {dominiosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                    Nenhum domínio encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                dominiosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{item.tenantNome}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.tenantId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      <a
                        href={`https://${item.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {item.domain}
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {item.cnameTarget}
                    </td>
                    <td className="py-3 px-4">
                      {item.status === "ATIVO" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </span>
                      )}
                      {item.status === "PENDENTE" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> Pendente
                        </span>
                      )}
                      {item.status === "DNS_FALHOU" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                          <XCircle className="w-3 h-3" /> Falhou
                        </span>
                      )}
                      {item.status === "REVOGADO" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 text-[11px] font-bold">
                          Revogado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.sslStatus === "ATIVO" ? (
                        <span className="text-emerald-400 inline-flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Protegido
                        </span>
                      ) : (
                        <span className="text-slate-400">Pendente</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleRechecarDns(item.domain)}
                          disabled={rechecando === item.domain}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Rechecar DNS Agora"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${
                              rechecando === item.domain ? "animate-spin text-primary" : ""
                            }`}
                          />
                        </button>
                        {item.status !== "ATIVO" && (
                          <button
                            onClick={() => handleAprovarManualmente(item.domain)}
                            className="px-2 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 transition cursor-pointer"
                            title="Aprovar e Ativar Forçadamente"
                          >
                            Ativar
                          </button>
                        )}
                        {item.status === "ATIVO" && (
                          <button
                            onClick={() => handleRevogar(item.domain)}
                            className="px-2 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-[11px] font-bold border border-amber-500/40 transition cursor-pointer"
                            title="Revogar Acesso"
                          >
                            Revogar
                          </button>
                        )}
                        <button
                          onClick={() => handleExcluir(item.domain)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                          title="Excluir Domínio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA VINCULAR NOVO DOMÍNIO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Vincular Domínio a uma Franquia
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCadastrarDominio} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Selecione a Praça / Franquia:
                </label>
                <select
                  required
                  value={novoTenantId}
                  onChange={(e) => {
                    setNovoTenantId(e.target.value);
                    const t = todosTenants.find((item) => item.tenantId === e.target.value);
                    if (t) setNovoTenantNome(t.nomeOperacao);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Selecione uma praça cadastrada...</option>
                  {todosTenants.map((t) => (
                    <option key={t.tenantId} value={t.tenantId}>
                      {t.nomeOperacao} ({t.cidadeNome} - {t.uf})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome Amigável da Operação:
                </label>
                <input
                  type="text"
                  placeholder="Ex: PARTIU Noroeste"
                  value={novoTenantNome}
                  onChange={(e) => setNovoTenantNome(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Domínio Customizado:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                    https://
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="app.minhafranquia.com.br"
                    value={novoDominio}
                    onChange={(e) => setNovoDominio(e.target.value)}
                    className="w-full pl-20 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Informe o subdomínio completo sem o protocolo.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-slate-950 font-bold text-xs shadow hover:bg-primary/90 transition cursor-pointer"
                >
                  Cadastrar e Iniciar DNS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
