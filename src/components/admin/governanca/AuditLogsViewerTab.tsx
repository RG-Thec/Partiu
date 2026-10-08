import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  FileSpreadsheet,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
  Key,
  Database,
  Lock,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  AdminCard,
  AdminBadge,
  AdminActionButton,
  AdminFilterBar,
  AdminDataTable,
  AdminTimeline,
  AdminModal,
  type AdminColumn,
  type AdminTimelineEvent,
} from "../ui";
import { exportarParaCSV } from "@/lib/export-csv";

export interface AuditRecord {
  id: string | number;
  organization_id?: string | null;
  user_id?: string | null;
  action: string;
  entity_name: string;
  entity_id?: string | null;
  ip_address?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

const DEMO_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 1,
    action: "BRANDING_UPDATE",
    entity_name: "branding_settings",
    entity_id: "tenant_itaperuna",
    user_id: "usr_admin_master",
    ip_address: "189.40.112.5",
    metadata: {
      corPrimaria: "#FF6B00",
      themeEngineVersion: "2.0.0",
      broadcastSuccess: true,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 2,
    action: "DRIVER_APPROVED",
    entity_name: "partiu_motoristas",
    entity_id: "mot_9281a",
    user_id: "usr_admin_maria",
    ip_address: "177.18.99.42",
    metadata: {
      nome: "Carlos Eduardo Silva",
      categoria: "CARRO",
      cnhValidaEAR: true,
      veiculoAno: 2024,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 3,
    action: "SETTLEMENT_CREATED",
    entity_name: "settlements",
    entity_id: "set_20261008",
    user_id: "usr_cron_worker",
    ip_address: "127.0.0.1",
    metadata: {
      totalBruto: 4250.0,
      repasseLiquidoD0: 4250.0,
      taxaPlataforma: 0.0,
      status: "APPROVED",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 4,
    action: "AUTH_LOGIN_SUCCESS",
    entity_name: "admin_users",
    entity_id: "usr_admin_master",
    user_id: "usr_admin_master",
    ip_address: "189.40.112.5",
    metadata: {
      mfaVerified: true,
      role: "superadmin",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 5,
    action: "DATA_EXPORT_CSV",
    entity_name: "partiu_motoristas",
    entity_id: "export_batch_01",
    user_id: "usr_admin_carlos",
    ip_address: "186.204.15.80",
    metadata: {
      totalLinhas: 48,
      motivo: "Auditoria contábil mensal",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

export function AuditLogsViewerTab() {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("TODAS");
  const [visualizacao, setVisualizacao] = useState<"tabela" | "timeline">("tabela");
  const [detalhesLog, setDetalhesLog] = useState<AuditRecord | null>(null);

  async function carregarLogs() {
    setCarregando(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await (supabase as any)
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          setLogs(data as unknown as AuditRecord[]);
          return;
        }
      }
      // Fallback para logs de contingência / auditoria demonstrativa
      setLogs(DEMO_AUDIT_LOGS);
    } catch {
      setLogs(DEMO_AUDIT_LOGS);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarLogs();
  }, []);

  const logsFiltrados = useMemo(() => {
    return logs.filter((log) => {
      const matchCat =
        filtroCategoria === "TODAS" ||
        (filtroCategoria === "AUTH" && log.action.startsWith("AUTH")) ||
        (filtroCategoria === "DRIVER" && log.action.includes("DRIVER")) ||
        (filtroCategoria === "FINANCIAL" && (log.action.includes("SETTLEMENT") || log.action.includes("FINANCE") || log.action.includes("CAIXA"))) ||
        (filtroCategoria === "BRANDING" && log.action.includes("BRANDING"));

      const q = busca.toLowerCase().trim();
      const matchTexto =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.entity_name.toLowerCase().includes(q) ||
        (log.ip_address && log.ip_address.includes(q)) ||
        (log.user_id && log.user_id.toLowerCase().includes(q));

      return matchCat && matchTexto;
    });
  }, [logs, filtroCategoria, busca]);

  const colunasTabela: AdminColumn<AuditRecord>[] = [
    {
      key: "data",
      header: "Data / Hora",
      width: "160px",
      render: (log) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {new Date(log.created_at).toLocaleDateString("pt-BR")}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {new Date(log.created_at).toLocaleTimeString("pt-BR")}
          </span>
        </div>
      ),
    },
    {
      key: "acao",
      header: "Ação Auditada",
      render: (log) => {
        let variant: "info" | "success" | "warning" | "critical" = "info";
        if (log.action.includes("APPROVED") || log.action.includes("SUCCESS")) variant = "success";
        if (log.action.includes("BLOCKED") || log.action.includes("DELETE")) variant = "critical";
        if (log.action.includes("UPDATE") || log.action.includes("WARN")) variant = "warning";

        return (
          <AdminBadge variant={variant} size="sm">
            {log.action}
          </AdminBadge>
        );
      },
    },
    {
      key: "entidade",
      header: "Entidade & ID",
      render: (log) => (
        <div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block text-xs">
            {log.entity_name}
          </span>
          {log.entity_id && (
            <span className="text-[10px] text-slate-400 font-mono">
              ID: {log.entity_id}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "responsavel",
      header: "Operador / Usuário",
      render: (log) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="font-medium truncate max-w-[130px]">
            {log.user_id || "Sistema Automático"}
          </span>
        </div>
      ),
    },
    {
      key: "ip",
      header: "Endereço IP",
      render: (log) => (
        <span className="font-mono text-xs text-slate-500">
          {log.ip_address || "—"}
        </span>
      ),
    },
    {
      key: "acoes",
      header: "Metadados",
      align: "right",
      render: (log) => (
        <AdminActionButton
          variant="ghost"
          size="xs"
          iconLeft={<Eye className="h-3 w-3" />}
          onClick={() => setDetalhesLog(log)}
        >
          Inspecionar
        </AdminActionButton>
      ),
    },
  ];

  const timelineEventos: AdminTimelineEvent[] = logsFiltrados.map((log) => {
    let variant: "info" | "success" | "warning" | "critical" = "info";
    if (log.action.includes("APPROVED") || log.action.includes("SUCCESS")) variant = "success";
    if (log.action.includes("BLOCKED") || log.action.includes("DELETE")) variant = "critical";
    if (log.action.includes("UPDATE") || log.action.includes("WARN")) variant = "warning";

    return {
      id: String(log.id),
      title: log.action,
      description: (
        <div className="space-y-1 mt-0.5">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Entidade: <strong className="font-mono">{log.entity_name}</strong> {log.entity_id && `(${log.entity_id})`}
          </p>
          {log.metadata && (
            <pre className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-[10px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          )}
        </div>
      ),
      date: new Date(log.created_at).toLocaleString("pt-BR"),
      author: `${log.user_id || "Sistema"} (${log.ip_address || "IP n/d"})`,
      variant,
      badge: log.entity_name,
    };
  });

  return (
    <div className="space-y-4">
      {/* Barra de Controles e Filtros */}
      <AdminFilterBar
        searchQuery={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar por ação, entidade, IP ou operador..."
        totalResults={logsFiltrados.length}
        totalLabel="registros de auditoria"
        hasActiveFilters={filtroCategoria !== "TODAS" || Boolean(busca)}
        onResetFilters={() => {
          setFiltroCategoria("TODAS");
          setBusca("");
        }}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "TODAS", label: "Todas" },
            { id: "AUTH", label: "Autenticação" },
            { id: "DRIVER", label: "Motoristas" },
            { id: "FINANCIAL", label: "Financeiro" },
            { id: "BRANDING", label: "White Label" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFiltroCategoria(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filtroCategoria === cat.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Alternar Visualização */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setVisualizacao("tabela")}
              className={`p-1 rounded-md text-xs font-bold transition-all ${
                visualizacao === "tabela"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Visualização em Tabela"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setVisualizacao("timeline")}
              className={`p-1 rounded-md text-xs font-bold transition-all ${
                visualizacao === "timeline"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Visualização em Timeline"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
          </div>

          <AdminActionButton
            variant="outline"
            size="sm"
            iconLeft={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
            onClick={() => {
              exportarParaCSV(
                "audit_logs_partiu",
                ["ID", "Data", "Ação", "Entidade", "Entidade ID", "Operador", "IP", "Metadados"],
                logsFiltrados.map((l) => [
                  l.id,
                  l.created_at,
                  l.action,
                  l.entity_name,
                  l.entity_id || "",
                  l.user_id || "",
                  l.ip_address || "",
                  JSON.stringify(l.metadata || {}),
                ])
              );
            }}
          >
            Exportar CSV
          </AdminActionButton>

          <AdminActionButton
            variant="ghost"
            size="sm"
            iconLeft={<RefreshCw className={`h-3.5 w-3.5 ${carregando ? "animate-spin" : ""}`} />}
            onClick={carregarLogs}
            title="Recarregar logs do Supabase"
          />
        </div>
      </AdminFilterBar>

      {/* Exibição dos Logs */}
      {visualizacao === "tabela" ? (
        <AdminDataTable
          columns={colunasTabela}
          data={logsFiltrados}
          keyExtractor={(l) => l.id}
          loading={carregando}
          emptyTitle="Nenhum log de auditoria encontrado"
          emptyDescription="Ajuste os filtros ou o termo de busca para visualizar eventos de segurança."
          onRowClick={(l) => setDetalhesLog(l)}
        />
      ) : (
        <AdminCard padding="default">
          <AdminTimeline events={timelineEventos} />
        </AdminCard>
      )}

      {/* Modal de Detalhes dos Metadados do Log */}
      <AdminModal
        open={Boolean(detalhesLog)}
        onClose={() => setDetalhesLog(null)}
        title={
          <div className="flex items-center gap-2">
            <span>Detalhes do Evento de Auditoria</span>
            {detalhesLog && (
              <AdminBadge variant="info" size="sm">
                #{detalhesLog.id}
              </AdminBadge>
            )}
          </div>
        }
        subtitle={detalhesLog ? `${detalhesLog.action} • ${detalhesLog.entity_name}` : ""}
        icon={<FileText className="h-5 w-5 text-primary" />}
      >
        {detalhesLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Ação:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{detalhesLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Entidade:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{detalhesLog.entity_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Operador:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{detalhesLog.user_id || "Sistema"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Endereço IP:</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{detalhesLog.ip_address || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Carimbo de Data/Hora:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(detalhesLog.created_at).toLocaleString("pt-BR")}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Payload JSON de Metadados (Imutável):
              </span>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-60 border border-slate-800 leading-relaxed">
                {JSON.stringify(detalhesLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
