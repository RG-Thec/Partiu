import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Banknote,
  Lock,
  Plus,
  RotateCcw,
  Wallet,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  useCaixaAdmin,
  useSalvarCaixa,
  useAlterarStatusCaixa,
  useMotoristas,
} from "@/lib/partiu-db";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";
import {
  AdminPageHeader,
  AdminKpiCard,
  AdminBadge,
  AdminActionButton,
  AdminFilterBar,
  AdminDataTable,
  AdminModal,
  type AdminColumn,
} from "@/components/admin/ui";
import { exportarParaCSV } from "@/lib/export-csv";

export const Route = createFileRoute("/app/admin/caixa")({
  head: () => ({
    meta: [
      { title: "Conciliação & Fechamento de Caixa Diário | PARTIU Admin" },
      {
        name: "description",
        content:
          "Conciliação financeira automatizada e fechamento diário com repasse líquido D+0 (Zero Comissão).",
      },
    ],
  }),
  component: AdminCaixaPage,
});

const brl = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AdminCaixaPage() {
  const { data: caixas = [], isLoading, error } = useCaixaAdmin();
  const { data: motoristas = [] } = useMotoristas();
  const salvar = useSalvarCaixa();
  const alterarStatus = useAlterarStatusCaixa();

  const [modalNovoFechamento, setModalNovoFechamento] = useState(false);
  const [motoristaId, setMotoristaId] = useState("");
  const [dataRef, setDataRef] = useState(() => new Date().toISOString().slice(0, 10));
  const [totalBruto, setTotalBruto] = useState("0");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");

  const consolidado = useMemo(() => {
    return caixas.reduce(
      (acc, c) => ({
        bruto: acc.bruto + Number(c.total_bruto),
        cooperativa: acc.cooperativa + Number(c.valor_cooperativa),
        motoristas: acc.motoristas + Number(c.valor_liquido_motorista || c.total_bruto),
      }),
      { bruto: 0, cooperativa: 0, motoristas: 0 }
    );
  }, [caixas]);

  const caixasFiltrados = useMemo(() => {
    return caixas.filter((c) => {
      const matchStatus = filtroStatus === "TODOS" || c.status === filtroStatus;
      const matchBusca =
        !busca.trim() ||
        c.data_referencia.includes(busca) ||
        c.status.toLowerCase().includes(busca.toLowerCase());
      return matchStatus && matchBusca;
    });
  }, [caixas, filtroStatus, busca]);

  const pendentesLiquidacao = useMemo(
    () => caixas.filter((c) => c.status === "aberto" || c.status === "fechado").length,
    [caixas]
  );

  async function handleSalvarFechamento(e: React.FormEvent) {
    e.preventDefault();
    const bruto = Number(totalBruto) || 0;
    await salvar.mutateAsync({
      motorista_id: motoristaId,
      data_referencia: dataRef,
      total_bruto: bruto,
      taxa_cooperativa_pct: 0,
      valor_cooperativa: 0,
      valor_liquido_motorista: bruto,
      status: "aberto",
    });
    setModalNovoFechamento(false);
    setTotalBruto("0");
    setMotoristaId("");
  }

  // Colunas para a tabela corporativa
  const colunas: AdminColumn<(typeof caixas)[0]>[] = [
    {
      key: "data",
      header: "Data de Referência",
      render: (c) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {new Date(`${c.data_referencia}T00:00:00`).toLocaleDateString("pt-BR")}
          </span>
        </div>
      ),
    },
    {
      key: "motorista",
      header: "Motorista Beneficiário",
      render: (c) => {
        const m = motoristas.find((mot) => mot.id === c.motorista_id);
        return (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {m?.full_name || `Motorista #${c.motorista_id.slice(0, 8)}`}
          </span>
        );
      },
    },
    {
      key: "bruto",
      header: "Total Bruto (GMV)",
      render: (c) => (
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
          {brl(c.total_bruto)}
        </span>
      ),
    },
    {
      key: "taxa",
      header: "Taxa Plataforma",
      render: () => (
        <AdminBadge variant="success" size="sm">
          R$ 0,00 (0%)
        </AdminBadge>
      ),
    },
    {
      key: "repasse",
      header: "Repasse Líquido D+0",
      render: (c) => (
        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
          {brl(c.valor_liquido_motorista || c.total_bruto)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status da Liquidação",
      render: (c) => {
        const variantMap: Record<string, "warning" | "info" | "success"> = {
          aberto: "warning",
          fechado: "info",
          pago_ao_motorista: "success",
        };
        const labelMap: Record<string, string> = {
          aberto: "EM ABERTO",
          fechado: "CONCILIADO",
          pago_ao_motorista: "LIQUIDADO (PIX D+0)",
        };
        return (
          <AdminBadge
            variant={variantMap[c.status] || "warning"}
            size="sm"
            dot
            pulse={c.status === "aberto"}
          >
            {labelMap[c.status] || c.status.toUpperCase()}
          </AdminBadge>
        );
      },
    },
    {
      key: "acoes",
      header: "Ações",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          {c.status === "aberto" && (
            <AdminActionButton
              variant="outline"
              size="xs"
              iconLeft={<Lock className="h-3 w-3" />}
              onClick={() => alterarStatus.mutate({ id: c.id, status: "fechado" })}
            >
              Fechar Caixa
            </AdminActionButton>
          )}

          {c.status === "fechado" && (
            <AdminActionButton
              variant="success"
              size="xs"
              iconLeft={<CheckCircle2 className="h-3 w-3" />}
              onClick={() => alterarStatus.mutate({ id: c.id, status: "pago_ao_motorista" })}
            >
              Liquidar Pix
            </AdminActionButton>
          )}

          {c.status === "pago_ao_motorista" && (
            <AdminActionButton
              variant="ghost"
              size="xs"
              iconLeft={<RotateCcw className="h-3 w-3" />}
              onClick={() => alterarStatus.mutate({ id: c.id, status: "aberto" })}
              title="Reabrir conciliação"
            >
              Reabrir
            </AdminActionButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <GuardiaoAcesso somenteOwner>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Oficial do Admin Design System */}
        <AdminPageHeader
          title="Conciliação & Fechamento de Caixa Diário"
          subtitle="Repasse financeiro D+0 com conformidade contábil. No PARTIU, 100% da corrida pertence ao motorista (monetização via SaaS e Diárias)."
          breadcrumbs={[
            { label: "Dashboard", to: "/app/admin" },
            { label: "Financeiro", to: "/app/admin/financeiro" },
            { label: "Fechamento de Caixa" },
          ]}
          badge={
            <AdminBadge variant="success" size="sm">
              0% COMISSÃO • DIÁRIA FIXA
            </AdminBadge>
          }
          actions={
            <div className="flex items-center gap-2">
              <AdminActionButton
                variant="secondary"
                size="sm"
                iconLeft={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
                onClick={() => {
                  exportarParaCSV(
                    "fechamento_caixa_partiu",
                    ["Data", "Motorista ID", "Total Bruto", "Taxa Plataforma", "Repasse Liquido", "Status"],
                    caixasFiltrados.map((c) => [
                      c.data_referencia,
                      c.motorista_id,
                      c.total_bruto,
                      c.valor_cooperativa,
                      c.valor_liquido_motorista || c.total_bruto,
                      c.status,
                    ])
                  );
                }}
              >
                Exportar Demonstrativo
              </AdminActionButton>

              <AdminActionButton
                variant="primary"
                size="sm"
                iconLeft={<Plus className="h-4 w-4" />}
                onClick={() => setModalNovoFechamento(true)}
              >
                Novo Fechamento
              </AdminActionButton>
            </div>
          }
        />

        {/* 4 Cards de KPI com Valores Consolidados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminKpiCard
            label="Volume Bruto (GMV)"
            value={brl(consolidado.bruto)}
            icon={<Wallet className="h-5 w-5" />}
            iconColor="brand"
            subtext="Total movimentado em corridas"
          />

          <AdminKpiCard
            label="Repasse Líquido D+0 (100%)"
            value={brl(consolidado.motoristas)}
            icon={<Banknote className="h-5 w-5" />}
            iconColor="success"
            subtext="Transferido integralmente aos condutores"
          />

          <AdminKpiCard
            label="Taxa da Plataforma (0%)"
            value="R$ 0,00"
            icon={<Zap className="h-5 w-5" />}
            iconColor="info"
            subtext="Zero desconto na corrida"
          />

          <AdminKpiCard
            label="Pendentes de Liquidação"
            value={pendentesLiquidacao}
            icon={<Lock className="h-5 w-5" />}
            iconColor={pendentesLiquidacao > 0 ? "warning" : "success"}
            badge={
              pendentesLiquidacao > 0 ? (
                <AdminBadge variant="warning" size="sm" dot pulse>
                  Aberto
                </AdminBadge>
              ) : (
                <AdminBadge variant="success" size="sm">
                  Liquidado
                </AdminBadge>
              )
            }
            subtext="Registros em aberto ou conferência"
          />
        </div>

        {/* Barra de Filtros */}
        <AdminFilterBar
          searchQuery={busca}
          onSearchChange={setBusca}
          searchPlaceholder="Filtrar por data (AAAA-MM-DD) ou status..."
          totalResults={caixasFiltrados.length}
          totalLabel="fechamentos"
          hasActiveFilters={filtroStatus !== "TODOS" || Boolean(busca)}
          onResetFilters={() => {
            setFiltroStatus("TODOS");
            setBusca("");
          }}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["TODOS", "aberto", "fechado", "pago_ao_motorista"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFiltroStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filtroStatus === st
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {st === "TODOS"
                  ? "Todos"
                  : st === "aberto"
                  ? "Em Aberto"
                  : st === "fechado"
                  ? "Conciliados"
                  : "Liquidados"}
              </button>
            ))}
          </div>
        </AdminFilterBar>

        {/* Tabela de Dados Corporativa */}
        <AdminDataTable
          columns={colunas}
          data={caixasFiltrados}
          keyExtractor={(c) => c.id}
          loading={isLoading}
          emptyTitle="Nenhum fechamento registrado"
          emptyDescription="Utilize o botão 'Novo Fechamento' para registrar conciliações diárias de corridas."
        />

        {/* Modal de Novo Fechamento */}
        <AdminModal
          open={modalNovoFechamento}
          onClose={() => setModalNovoFechamento(false)}
          title="Novo Fechamento de Caixa Diário"
          subtitle="Registro contábil de repasse D+0 com Taxa Zero"
          icon={<Banknote className="h-5 w-5 text-primary" />}
        >
          <form onSubmit={handleSalvarFechamento} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Motorista Parceiro *
              </label>
              <select
                required
                value={motoristaId}
                onChange={(e) => setMotoristaId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecione o motorista</option>
                {motoristas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Data de Referência *
                </label>
                <input
                  type="date"
                  required
                  value={dataRef}
                  onChange={(e) => setDataRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Total Bruto das Corridas (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={totalBruto}
                  onChange={(e) => setTotalBruto(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Demonstrativo da Taxa Zero */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300 font-bold">
                <span>Taxa da Plataforma (0% Padrão):</span>
                <span>R$ 0,00</span>
              </div>
              <div className="flex items-center justify-between text-emerald-950 dark:text-emerald-200 font-black text-sm pt-1 border-t border-emerald-200/60 dark:border-emerald-800">
                <span>Repasse Líquido D+0:</span>
                <span>{brl(Number(totalBruto) || 0)}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <AdminActionButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalNovoFechamento(false)}
              >
                Cancelar
              </AdminActionButton>
              <AdminActionButton
                type="submit"
                variant="primary"
                size="sm"
                loading={salvar.isPending}
              >
                Registrar Fechamento
              </AdminActionButton>
            </div>
          </form>
        </AdminModal>
      </div>
    </GuardiaoAcesso>
  );
}
