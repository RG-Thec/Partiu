import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Eye,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Car,
  Bike,
} from "lucide-react";
import {
  usePartiuTodasSolicitacoesMotoristas,
  useAprovarPartiuMotorista,
  useRejeitarPartiuMotorista,
} from "@/lib/partiu-db";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { exportarParaCSV } from "@/lib/export-csv";
import { getAdminRole, isFranqueado } from "@/lib/admin-rbac";
import { useAdminCity } from "@/contexts/AdminCityContext";
import {
  AdminPageHeader,
  AdminKpiCard,
  AdminFilterBar,
  AdminTabBar,
  AdminDataTable,
  AdminBadge,
  AdminActionButton,
  type AdminColumn,
} from "@/components/admin/ui";
import { DriverApprovalKanban } from "@/components/admin/aprovacoes/DriverApprovalKanban";
import { DriverApprovalAuditModal } from "@/components/admin/aprovacoes/DriverApprovalAuditModal";

export const Route = createFileRoute("/app/admin/aprovacoes")({
  head: () => ({
    meta: [
      { title: "Pipeline de Aprovação de Motoristas | PARTIU Admin" },
      {
        name: "description",
        content:
          "Pipeline Kanban operacional, auditoria documental e timeline de vida de motoristas e entregadores.",
      },
    ],
  }),
  component: AdminAprovacoesPage,
});

export interface SolicitacaoCondutor {
  id: string;
  nomeCompleto: string;
  cpf: string;
  whatsapp: string;
  email: string;
  cidade: string;
  modalidade: "pop_carro" | "moto_flash";
  cnhNumero: string;
  cnhCategoria: "B (EAR)" | "A (EAR)" | "AB (EAR)";
  possuiEAR: boolean;
  veiculoMarcaModelo: string;
  veiculoAno: string;
  veiculoPlaca: string;
  veiculoCor: string;
  crlvAnoExercicio: string;
  chavePix: string;
  dataSolicitacao: string;
  status: "pendente" | "aprovado" | "rejeitado";
  motivoRejeicao?: string | undefined;
  categoriaVeiculo: "CARRO" | "MOTO" | "PLUS" | "MULHER";
  documentos: {
    cnhUrl: string;
    crlvUrl: string;
    fotoPerfilUrl: string;
  };
}

export function AdminAprovacoesPage() {
  const qc = useQueryClient();
  const { data: todasReais = [], isLoading } = usePartiuTodasSolicitacoesMotoristas();
  const aprovarMutation = useAprovarPartiuMotorista();
  const rejeitarMutation = useRejeitarPartiuMotorista();
  const { pracaAtiva } = useAdminCity();
  const adminRole = getAdminRole();

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCondutor[]>([]);
  const [visualizacao, setVisualizacao] = useState<"kanban" | "tabela">("kanban");
  const [filtroStatus, setFiltroStatus] = useState<"todas" | "pendente" | "aprovado" | "rejeitado">("todas");
  const [busca, setBusca] = useState("");
  const [modalAuditoria, setModalAuditoria] = useState<SolicitacaoCondutor | null>(null);

  // Sincroniza dados do backend
  useEffect(() => {
    if (todasReais && todasReais.length > 0) {
      const convertidas: SolicitacaoCondutor[] = todasReais.map((p) => {
        const catOriginal = (p.categoria_veiculo?.toUpperCase() as any) || (p.categoria_veiculo === "MOTO" ? "MOTO" : "CARRO");
        const catValida: "CARRO" | "MOTO" | "PLUS" | "MULHER" =
          catOriginal === "MOTO" || catOriginal === "PLUS" || catOriginal === "MULHER" ? catOriginal : "CARRO";

        return {
          id: p.id,
          nomeCompleto: p.nome,
          cpf: p.cpf,
          whatsapp: p.telefone,
          email: p.email || "Não informado",
          cidade: (p as any).cidade || (p as any).city || "Praça Regional",
          modalidade: catValida === "MOTO" ? "moto_flash" : "pop_carro",
          cnhNumero: p.cnh_numero,
          cnhCategoria: (catValida === "MOTO" ? "A (EAR)" : "B (EAR)") as any,
          possuiEAR: p.possui_ear,
          veiculoMarcaModelo: p.veiculo_marca_modelo,
          veiculoAno: String(p.veiculo_ano),
          veiculoPlaca: p.veiculo_placa,
          veiculoCor: p.veiculo_cor,
          crlvAnoExercicio: "2026",
          chavePix: p.chave_pix || "Não cadastrada",
          dataSolicitacao: p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "Recente",
          status: (p.status_aprovacao as any) || "pendente",
          motivoRejeicao: (p as any).motivo_rejeicao,
          categoriaVeiculo: catValida,
          documentos: {
            cnhUrl:
              (p as any).cnh_url ||
              (p as any).cnh_foto_url ||
              "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80",
            crlvUrl:
              (p as any).crlv_url ||
              (p as any).crlv_foto_url ||
              "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop&q=80",
            fotoPerfilUrl:
              (p as any).foto_url ||
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
          },
        };
      });
      setSolicitacoes(convertidas);
    } else {
      setSolicitacoes([]);
    }
  }, [todasReais]);

  // Sincronização em tempo real via Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let channel: any = null;
    try {
      const channelId = `admin_motoristas_rt_${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "partiu_motoristas" },
          () => {
            void qc.invalidateQueries({ queryKey: ["admin", "solicitacoes_motoristas"] });
            void qc.invalidateQueries({ queryKey: ["admin", "motoristas_pendentes"] });
            void qc.invalidateQueries({ queryKey: ["admin", "motoristas"] });
          }
        )
        .subscribe();
    } catch {}

    return () => {
      if (channel) {
        try {
          void supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [qc]);

  // Filtros combinados
  const listaFiltrada = useMemo(() => {
    return solicitacoes.filter((s) => {
      const atendeStatus = filtroStatus === "todas" ? true : s.status === filtroStatus;
      const atendeBusca =
        !busca.trim() ||
        s.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
        s.cpf.includes(busca) ||
        s.whatsapp.includes(busca) ||
        s.veiculoPlaca.toLowerCase().includes(busca.toLowerCase());
      return atendeStatus && atendeBusca;
    });
  }, [solicitacoes, filtroStatus, busca]);

  const totalPendentes = useMemo(() => solicitacoes.filter((s) => s.status === "pendente").length, [solicitacoes]);
  const totalAprovados = useMemo(() => solicitacoes.filter((s) => s.status === "aprovado").length, [solicitacoes]);
  const totalRejeitados = useMemo(() => solicitacoes.filter((s) => s.status === "rejeitado").length, [solicitacoes]);

  // Mutação de aprovação
  function handleAprovar(id: string, categoria: "CARRO" | "MOTO" | "PLUS" | "MULHER") {
    aprovarMutation.mutate({ id, categoriaVeiculo: categoria });
  }

  // Mutação de rejeição
  function handleRejeitar(id: string, motivo: string) {
    rejeitarMutation.mutate({ id, motivo });
  }

  // Definição das colunas para visualização em Tabela
  const colunasTabela: AdminColumn<SolicitacaoCondutor>[] = [
    {
      key: "condutor",
      header: "Condutor",
      render: (s) => (
        <div className="flex items-center gap-3">
          <img
            src={s.documentos.fotoPerfilUrl}
            alt={s.nomeCompleto}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{s.nomeCompleto}</p>
            <p className="text-[11px] text-slate-500 font-mono">CPF: {s.cpf}</p>
          </div>
        </div>
      ),
    },
    {
      key: "modalidade",
      header: "Modalidade",
      render: (s) => (
        <AdminBadge variant={s.modalidade === "moto_flash" ? "warning" : "info"} size="sm">
          {s.modalidade === "moto_flash" ? "MOTO" : "POP"}
        </AdminBadge>
      ),
    },
    {
      key: "veiculo",
      header: "Veículo & Placa",
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{s.veiculoMarcaModelo}</p>
          <p className="text-[11px] font-mono font-bold text-slate-500 uppercase">{s.veiculoPlaca}</p>
        </div>
      ),
    },
    {
      key: "ear",
      header: "EAR na CNH",
      render: (s) =>
        s.possuiEAR ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" /> Sim
          </span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-1 text-xs">
            <ShieldAlert className="h-3.5 w-3.5" /> Ausente
          </span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <AdminBadge
          variant={
            s.status === "aprovado" ? "success" : s.status === "rejeitado" ? "critical" : "warning"
          }
          size="sm"
          dot
          pulse={s.status === "pendente"}
        >
          {s.status.toUpperCase()}
        </AdminBadge>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <AdminActionButton
            variant="outline"
            size="xs"
            iconLeft={<Eye className="h-3 w-3" />}
            onClick={() => setModalAuditoria(s)}
          >
            Auditar
          </AdminActionButton>
          <a
            href={`https://wa.me/55${s.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-20">
      {/* 1. Header Oficial do Painel */}
      <AdminPageHeader
        title="Pipeline de Aprovação de Motoristas"
        subtitle={`Auditoria cadastral de condutores, verificação de CNH com EAR e governança de frota — ${
          isFranqueado(adminRole) ? `Franquia ${pracaAtiva?.nome || "Regional"}` : "Gestão Nacional"
        }`}
        breadcrumbs={[
          { label: "Dashboard", to: "/app/admin" },
          { label: "Frota", to: "/app/admin/motoristas" },
          { label: "Aprovações" },
        ]}
        badge={
          totalPendentes > 0 ? (
            <AdminBadge variant="warning" dot pulse size="sm">
              {totalPendentes} PENDENTES
            </AdminBadge>
          ) : (
            <AdminBadge variant="success" size="sm">
              EM DIA
            </AdminBadge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Seletor de Modo de Visualização */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setVisualizacao("kanban")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  visualizacao === "kanban"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setVisualizacao("tabela")}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  visualizacao === "tabela"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tabela</span>
              </button>
            </div>

            <AdminActionButton
              variant="secondary"
              size="sm"
              iconLeft={<FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />}
              onClick={() => {
                exportarParaCSV(
                  "motoristas_solicitacoes",
                  [
                    "Nome",
                    "CPF",
                    "Telefone",
                    "Email",
                    "Cidade",
                    "Modalidade",
                    "CNH",
                    "EAR",
                    "Veículo",
                    "Placa",
                    "Status",
                    "Data",
                  ],
                  listaFiltrada.map((s) => [
                    s.nomeCompleto,
                    s.cpf,
                    s.whatsapp,
                    s.email,
                    s.cidade,
                    s.modalidade,
                    s.cnhNumero,
                    s.possuiEAR ? "Sim" : "Não",
                    s.veiculoMarcaModelo,
                    s.veiculoPlaca,
                    s.status,
                    s.dataSolicitacao,
                  ])
                );
              }}
            >
              Exportar CSV
            </AdminActionButton>
          </div>
        }
      />

      {/* 2. Quatro KPI Cards com Tendências */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Total de Cadastros"
          value={solicitacoes.length}
          icon={<Users className="h-5 w-5" />}
          iconColor="brand"
        />

        <AdminKpiCard
          label="Aguardando Auditoria"
          value={totalPendentes}
          icon={<Clock className="h-5 w-5" />}
          iconColor="warning"
          badge={
            totalPendentes > 0 ? (
              <AdminBadge variant="warning" dot pulse size="sm">
                Ação Requerida
              </AdminBadge>
            ) : undefined
          }
        />

        <AdminKpiCard
          label="Credenciados Ativos"
          value={totalAprovados}
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="success"
        />

        <AdminKpiCard
          label="Reprovados / Incompletos"
          value={totalRejeitados}
          icon={<XCircle className="h-5 w-5" />}
          iconColor="critical"
        />
      </div>

      {/* 3. Barra de Filtros e Busca */}
      <AdminFilterBar
        searchQuery={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar por nome, CPF, telefone ou placa..."
        totalResults={listaFiltrada.length}
        totalLabel="solicitações listadas"
        hasActiveFilters={filtroStatus !== "todas" || Boolean(busca)}
        onResetFilters={() => {
          setFiltroStatus("todas");
          setBusca("");
        }}
      >
        <AdminTabBar
          variant="pills"
          activeTab={filtroStatus}
          onChange={(tab) => setFiltroStatus(tab as any)}
          tabs={[
            { id: "todas", label: "Todas", badge: solicitacoes.length },
            { id: "pendente", label: "Pendentes", badge: totalPendentes, badgeVariant: "warning" },
            { id: "aprovado", label: "Aprovados", badge: totalAprovados },
            { id: "rejeitado", label: "Reprovados", badge: totalRejeitados },
          ]}
        />
      </AdminFilterBar>

      {/* 4. Corpo Principal: Kanban ou Tabela */}
      {visualizacao === "kanban" ? (
        <DriverApprovalKanban
          solicitacoes={listaFiltrada}
          onAuditar={(s) => setModalAuditoria(s)}
          onAprovarRapido={(id, cat) => handleAprovar(id, cat)}
          onRejeitarRapido={(s) => setModalAuditoria(s)}
        />
      ) : (
        <AdminDataTable
          columns={colunasTabela}
          data={listaFiltrada}
          keyExtractor={(s) => s.id}
          loading={isLoading}
          emptyTitle="Nenhuma solicitação encontrada"
          emptyDescription="Ajuste os filtros de status ou o termo de busca para visualizar registros."
          onRowClick={(s) => setModalAuditoria(s)}
        />
      )}

      {/* 5. Modal de Auditoria e Checklist com Timeline de Vida */}
      <DriverApprovalAuditModal
        solicitacao={modalAuditoria}
        open={Boolean(modalAuditoria)}
        onClose={() => setModalAuditoria(null)}
        onAprovar={handleAprovar}
        onRejeitar={handleRejeitar}
      />
    </div>
  );
}
