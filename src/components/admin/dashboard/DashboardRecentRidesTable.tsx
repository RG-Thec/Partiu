import React from "react";
import { Clock, ExternalLink, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AdminCard, AdminCardHeader } from "../ui/AdminCard";
import { AdminDataTable, type AdminColumn } from "../ui/AdminDataTable";
import { AdminBadge } from "../ui/AdminBadge";

export interface DashboardRecentRidesTableProps {
  rides: any[];
}

const brl = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function DashboardRecentRidesTable({
  rides,
}: DashboardRecentRidesTableProps) {
  const colunas: AdminColumn<any>[] = [
    {
      key: "hora",
      header: "Horário",
      render: (r) => (
        <span className="text-xs font-mono font-medium text-slate-500">
          {r.created_at
            ? new Date(r.created_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Recente"}
        </span>
      ),
    },
    {
      key: "passageiro",
      header: "Passageiro",
      render: (r) => (
        <span className="font-bold text-slate-800 dark:text-slate-200">
          {r.passenger_name || "Passageiro Anônimo"}
        </span>
      ),
    },
    {
      key: "motorista",
      header: "Condutor Atribuído",
      render: (r) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {r.driver_name || (r.driver_id ? `Motorista #${r.driver_id.slice(0, 5)}` : "Aguardando")}
        </span>
      ),
    },
    {
      key: "trajeto",
      header: "Origem ➔ Destino",
      render: (r) => (
        <div className="text-xs max-w-xs truncate text-slate-600 dark:text-slate-400">
          <span className="font-medium">{r.pickup_address || "Origem"}</span>
          <span className="text-slate-400 mx-1">➔</span>
          <span>{r.destination_address || "Destino"}</span>
        </div>
      ),
    },
    {
      key: "valor",
      header: "Valor",
      render: (r) => (
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
          {brl(r.fare_brl || 0)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        let variant: "success" | "warning" | "info" | "critical" = "info";
        let label = r.status || "PENDENTE";

        if (r.status === "COMPLETED") {
          variant = "success";
          label = "CONCLUÍDA";
        } else if (r.status === "CANCELLED" || r.status === "TIMEOUT") {
          variant = "critical";
          label = "CANCELADA";
        } else if (r.status === "IN_PROGRESS" || r.status === "DRIVER_ASSIGNED") {
          variant = "info";
          label = "EM ANDAMENTO";
        } else {
          variant = "warning";
          label = "BUSCANDO";
        }

        return (
          <AdminBadge variant={variant} size="sm">
            {label}
          </AdminBadge>
        );
      },
    },
  ];

  return (
    <AdminCard>
      <AdminCardHeader
        title="Últimas Solicitações na Praça"
        subtitle="Fluxo de corridas e entregas registradas em tempo real"
        icon={<Clock className="h-5 w-5 text-primary" />}
        action={
          <Link
            to="/app/admin/historico"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver histórico completo
            <ExternalLink className="h-3 w-3" />
          </Link>
        }
      />

      <AdminDataTable
        columns={colunas}
        data={rides}
        keyExtractor={(r, idx) => r.id || idx}
        emptyTitle="Nenhuma corrida registrada recentemente"
        emptyDescription="O feed de solicitações exibirá as corridas geradas pelos passageiros."
      />
    </AdminCard>
  );
}
