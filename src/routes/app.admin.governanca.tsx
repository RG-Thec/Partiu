import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  Archive,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileCheck,
  FileSpreadsheet,
  HardDrive,
  History,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  type RegistroSoftDelete,
  type RegistroPurgaExecutada,
  type BackupDumpMetadata,
  type CategoriaPurga,
  type JanelaCorteDias,
  type TipoEntidadeSoftDelete,
  listarSoftDeletes,
  executarSoftDelete,
  restaurarRegistroSoftDelete,
  listarPurgas,
  executarPurgaColdStorage,
  estimarRegistrosPurga,
  listarBackups,
  gerarDumpPreventivo,
} from "@/lib/data-governance-service";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";

export const Route = createFileRoute("/app/admin/governanca")({
  head: () => ({
    meta: [
      { title: "Governança de Dados, Cold Storage & Soft Delete | PARTIU Admin" },
      {
        name: "description",
        content:
          "Ciclo de vida dos dados, exclusão lógica em compliance com a LGPD, arquivamento e purga em cold storage e dumps preventivos.",
      },
    ],
  }),
  component: DataGovernanceAdminPage,
});

type AbaGovernanca = "soft_delete" | "cold_storage" | "backup_dump";

export function DataGovernanceAdminPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaGovernanca>("soft_delete");
  const [softDeletes, setSoftDeletes] = useState<RegistroSoftDelete[]>(() => listarSoftDeletes());
  const [purgas, setPurgas] = useState<RegistroPurgaExecutada[]>(() => listarPurgas());
  const [backups, setBackups] = useState<BackupDumpMetadata[]>(() => listarBackups());

  // Filtros Soft Delete
  const [buscaSoftDelete, setBuscaSoftDelete] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");

  // Modal Soft Delete
  const [modalDeleteAberto, setModalDeleteAberto] = useState(false);
  const [tipoNovoDelete, setTipoNovoDelete] = useState<TipoEntidadeSoftDelete>("MOTORISTA");
  const [idNovoDelete, setIdNovoDelete] = useState("");
  const [nomeNovoDelete, setNomeNovoDelete] = useState("");
  const [cpfNovoDelete, setCpfNovoDelete] = useState("");
  const [telefoneNovoDelete, setTelefoneNovoDelete] = useState("");
  const [motivoNovoDelete, setMotivoNovoDelete] = useState("");

  // Formulário Cold Storage
  const [categoriaPurga, setCategoriaPurga] = useState<CategoriaPurga>("TELEMETRIA_GPS");
  const [janelaDiasPurga, setJanelaDiasPurga] = useState<JanelaCorteDias>(30);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function mostrarToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  function recarregarDados() {
    setSoftDeletes(listarSoftDeletes());
    setPurgas(listarPurgas());
    setBackups(listarBackups());
  }

  useEffect(() => {
    const handleUpdate = () => recarregarDados();
    window.addEventListener("partiu:governance-updated", handleUpdate);
    return () => window.removeEventListener("partiu:governance-updated", handleUpdate);
  }, []);

  const estimativaPurga = useMemo(() => {
    return estimarRegistrosPurga(categoriaPurga, janelaDiasPurga);
  }, [categoriaPurga, janelaDiasPurga]);

  const softDeletesFiltrados = useMemo(() => {
    return softDeletes.filter((item) => {
      const matchTipo = filtroTipo === "TODOS" || item.tipo === filtroTipo;
      const q = buscaSoftDelete.toLowerCase().trim();
      const matchTexto =
        !q ||
        item.nome.toLowerCase().includes(q) ||
        item.entidadeId.toLowerCase().includes(q) ||
        item.motivo.toLowerCase().includes(q);
      return matchTipo && matchTexto;
    });
  }, [softDeletes, filtroTipo, buscaSoftDelete]);

  const handleSalvarSoftDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNovoDelete.trim() || !nomeNovoDelete.trim()) {
      mostrarToast("Informe o identificador e o nome do titular.");
      return;
    }

    executarSoftDelete({
      tipo: tipoNovoDelete,
      entidadeId: idNovoDelete.trim(),
      nome: nomeNovoDelete.trim(),
      cpfOriginal: cpfNovoDelete.trim(),
      telefoneOriginal: telefoneNovoDelete.trim(),
      motivo: motivoNovoDelete.trim() || "Exclusão lógica solicitada",
      operador: "Super Admin",
    });

    setModalDeleteAberto(false);
    setIdNovoDelete("");
    setNomeNovoDelete("");
    setCpfNovoDelete("");
    setTelefoneNovoDelete("");
    setMotivoNovoDelete("");
    recarregarDados();
    mostrarToast("Exclusão lógica auditada registrada com sucesso!");
  };

  const handleRestaurar = (id: string, nome: string) => {
    if (window.confirm(`Deseja restaurar o cadastro de ${nome}? O acesso será restabelecido.`)) {
      restaurarRegistroSoftDelete(id, "Super Admin");
      recarregarDados();
      mostrarToast(`Cadastro de ${nome} restaurado com sucesso!`);
    }
  };

  const handleExecutarPurga = () => {
    const catLabel =
      categoriaPurga === "TELEMETRIA_GPS"
        ? "Telemetria GPS Bruta"
        : categoriaPurga === "CORRIDAS_FINALIZADAS"
        ? "Corridas Finalizadas Antigas"
        : categoriaPurga === "NOTIFICACOES_LOGS"
        ? "Notificações & Logs"
        : "Chamados de Suporte";

    if (
      window.confirm(
        `Confirma a execução de purga e arquivamento para [${catLabel}] com corte anterior a ${janelaDiasPurga} dias? Aproximadamente ${estimativaPurga.registrosEstimados} registros serão arquivados.`
      )
    ) {
      executarPurgaColdStorage(categoriaPurga, janelaDiasPurga, "Super Admin");
      recarregarDados();
      mostrarToast("Rotina de Cold Storage e Purga executada com sucesso!");
    }
  };

  const handleGerarDump = () => {
    const novo = gerarDumpPreventivo("Super Admin");
    recarregarDados();
    mostrarToast(`Dump preventivo #${novo.id} gerado com sucesso!`);
  };

  const handleBaixarDump = (b: BackupDumpMetadata) => {
    const payload = {
      backupId: b.id,
      timestamp: b.dataCriacao,
      versaoSchema: b.versaoSchema,
      totalTabelas: b.totalTabelas,
      totalRegistros: b.totalRegistros,
      checksumSha256: b.checksumSha256,
      geradoPor: b.operador,
      metadata: "Partiu Mobilidade Urbana • Enterprise Backup Snapshot",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${b.id}.json`;
    a.click();
    mostrarToast(`Download do dump #${b.id} iniciado!`);
  };

  return (
    <GuardiaoAcesso permissao="governance:view_audit_logs">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Toast Notificação */}
        {toastMsg && (
          <div className="fixed top-4 right-4 z-50 bg-slate-950 text-white text-xs px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header do Módulo */}
        <div className="bg-gradient-to-r from-purple-600/15 via-indigo-500/10 to-transparent border border-purple-600/30 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-600 text-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 fill-current" />
              Módulo 11 • Governança & Ciclo de Vida dos Dados
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950">
              Governança, Cold Storage & Backup Preventivo
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Compliance estrito com a LGPD através de soft delete (exclusão lógica sem perda de histórico contábil), arquivamento de telemetria bruta e ferramenta de dumps preventivos.
            </p>
          </div>
          <button
            type="button"
            onClick={recarregarDados}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Seletor de Abas */}
        <div className="flex border-b border-slate-200 gap-2 pb-1 overflow-x-auto scrollbar-none">
          {[
            { id: "soft_delete", label: "Soft Delete & LGPD", icon: UserCheck },
            { id: "cold_storage", label: "Cold Storage & Purga", icon: Archive },
            { id: "backup_dump", label: "Backups & Dumps Preventivos", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = abaAtiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAbaAtiva(tab.id as AbaGovernanca)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* ABA 1: SOFT DELETE & COMPLIANCE LGPD                                */}
        {/* =================================================================== */}
        {abaAtiva === "soft_delete" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buscaSoftDelete}
                    onChange={(e) => setBuscaSoftDelete(e.target.value)}
                    placeholder="Buscar titular, ID ou motivo..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  {["TODOS", "MOTORISTA", "PASSAGEIRO"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFiltroTipo(t)}
                      className={`px-3 py-1 rounded-lg transition ${
                        filtroTipo === t
                          ? "bg-white text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalDeleteAberto(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Exclusão Lógica</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-2">Titular / Entidade</th>
                    <th className="py-3 px-2">Tipo</th>
                    <th className="py-3 px-2">Documento / Telefone</th>
                    <th className="py-3 px-2">Motivo & Operador</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {softDeletesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        Nenhum registro de exclusão lógica encontrado.
                      </td>
                    </tr>
                  ) : (
                    softDeletesFiltrados.map((item) => {
                      const isExcluido = item.status === "EXCLUIDO_LOGICO";
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-2">
                            <div className="font-bold text-slate-950">{item.nome}</div>
                            <div className="font-mono text-[10px] text-slate-400">#{item.entidadeId}</div>
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                item.tipo === "MOTORISTA"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {item.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="font-mono text-slate-600">{item.documentoMascarado}</div>
                            <div className="text-[11px] text-slate-500">{item.telefoneMascarado}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-slate-800 max-w-sm truncate" title={item.motivo}>
                              {item.motivo}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Excluído por {item.excluidoPor} em{" "}
                              {new Date(item.dataExclusao).toLocaleDateString("pt-BR")}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            {isExcluido ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                                <Lock className="w-3 h-3 text-red-600" />
                                Excluído (Lógico)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Restaurado
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {isExcluido && (
                              <button
                                type="button"
                                onClick={() => handleRestaurar(item.id, item.nome)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-xs flex items-center gap-1.5 ml-auto transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Restaurar</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 2: COLD STORAGE & PURGA DE DADOS ANTIGOS                        */}
        {/* =================================================================== */}
        {abaAtiva === "cold_storage" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Painel de Execução de Purga */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-black text-slate-950 flex items-center gap-2">
                    <Archive className="w-4 h-4 text-purple-600" />
                    Configurar Janela de Arquivamento
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Mova dados antigos para Cold Storage para economizar disco e acelerar queries do banco operacional.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Categoria de Dados
                    </label>
                    <select
                      value={categoriaPurga}
                      onChange={(e) => setCategoriaPurga(e.target.value as CategoriaPurga)}
                      className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    >
                      <option value="TELEMETRIA_GPS">Telemetria GPS Bruta (Waypoints de Tracking)</option>
                      <option value="CORRIDAS_FINALIZADAS">Corridas Encerradas Antigas (Cold Storage)</option>
                      <option value="NOTIFICACOES_LOGS">Notificações Push e Logs Operacionais</option>
                      <option value="CHAMADOS_SUPORTE">Chamados de Suporte e Ocorrências Resolvidas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Janela de Corte (Idade dos Registros)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[30, 90, 180, 365].map((dias) => (
                        <button
                          key={dias}
                          type="button"
                          onClick={() => setJanelaDiasPurga(dias as JanelaCorteDias)}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            janelaDiasPurga === dias
                              ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          +{dias}d
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Estimativa de Impacto */}
                  <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-100 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 block">
                      Estimativa de Economia
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Registros Elegíveis:</span>
                      <span className="font-black text-slate-950">
                        ~{estimativaPurga.registrosEstimados.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Espaço em Disco Liberado:</span>
                      <span className="font-black text-purple-700">
                        ~{estimativaPurga.espacoEstimadoMb} MB
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecutarPurga}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Executar Purga & Arquivamento</span>
                  </button>
                </div>
              </div>

              {/* Histórico de Purgas */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-black text-slate-950 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-600" />
                    Histórico de Rotinas de Cold Storage
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Registro de execuções preventivas com volume de registros e disco liberado.
                  </p>
                </div>

                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 bg-white">
                      <tr>
                        <th className="py-2.5 px-2">Data / Hora</th>
                        <th className="py-2.5 px-2">Categoria</th>
                        <th className="py-2.5 px-2">Corte</th>
                        <th className="py-2.5 px-2">Registros</th>
                        <th className="py-2.5 px-2 text-right">Espaço Liberado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purgas.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-2 text-[11px] text-slate-600">
                            {new Date(p.dataHora).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-800">
                            {p.categoria.replace(/_/g, " ")}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 font-mono">
                            +{p.janelaDias} dias
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-950">
                            {p.registrosAfetados.toLocaleString("pt-BR")}
                          </td>
                          <td className="py-2.5 px-2 text-right font-black text-emerald-700">
                            +{p.espacoLiberadoMb} MB
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 3: BACKUPS & DUMPS PREVENTIVOS                                  */}
        {/* =================================================================== */}
        {abaAtiva === "backup_dump" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  Dumps Relacionais Preventivos
                </h2>
                <p className="text-[11px] text-slate-500">
                  Gere cópias de segurança instantâneas das tabelas e esquemas relacionais da plataforma com integridade SHA-256.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGerarDump}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Gerar Dump Preventivo Agora</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {backups.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-slate-950">#{b.id}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Concluído
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium">{b.versaoSchema}</p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Tabelas</span>
                        <span className="font-black text-slate-800">{b.totalTabelas}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Registros</span>
                        <span className="font-black text-slate-800">
                          {b.totalRegistros.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 truncate" title={b.checksumSha256}>
                      SHA256: {b.checksumSha256}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-bold">
                      {(b.tamanhoKb / 1024).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBaixarDump(b)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Dump</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: NOVA EXCLUSÃO LÓGICA (SOFT DELETE) */}
        {modalDeleteAberto && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-950">
                      Nova Exclusão Lógica (Soft Delete)
                    </h3>
                    <p className="text-[11px] text-slate-500">Compliance LGPD Art. 18</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalDeleteAberto(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSalvarSoftDelete} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Tipo do Usuário
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoNovoDelete("MOTORISTA")}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        tipoNovoDelete === "MOTORISTA"
                          ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      Motorista
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoNovoDelete("PASSAGEIRO")}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        tipoNovoDelete === "PASSAGEIRO"
                          ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      Passageiro
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      ID do Usuário
                    </label>
                    <input
                      type="text"
                      value={idNovoDelete}
                      onChange={(e) => setIdNovoDelete(e.target.value)}
                      placeholder="mot-123 ou pas-456"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={nomeNovoDelete}
                      onChange={(e) => setNomeNovoDelete(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      CPF (será anonimizado)
                    </label>
                    <input
                      type="text"
                      value={cpfNovoDelete}
                      onChange={(e) => setCpfNovoDelete(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={telefoneNovoDelete}
                      onChange={(e) => setTelefoneNovoDelete(e.target.value)}
                      placeholder="(22) 99999-9999"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Motivo Legal / Administrativo
                  </label>
                  <textarea
                    rows={2}
                    value={motivoNovoDelete}
                    onChange={(e) => setMotivoNovoDelete(e.target.value)}
                    placeholder="Ex: Solicitação formal de exclusão pelo titular via suporte (Art. 18 LGPD)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalDeleteAberto(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs"
                  >
                    Confirmar Exclusão Lógica
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </GuardiaoAcesso>
  );
}
