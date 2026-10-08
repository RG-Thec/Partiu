import React from "react";
import {
  DollarSign,
  Car,
  Clock,
  Radio,
  TrendingUp,
  ShieldAlert,
  Zap,
  Users,
} from "lucide-react";
import { AdminKpiCard } from "../ui/AdminKpiCard";
import { AdminBadge } from "../ui/AdminBadge";

export interface DashboardKpisSectionProps {
  gmvHoje: number;
  faturamentoSaasHoje: number;
  corridasEmAndamento: number;
  motoristasOnline: number;
  chamadosSOSAtivos: number;
  taxaSucesso: number;
  ticketMedio: number;
  economiaMotoristas: number;
  onOpenSOS?: () => void;
  onOpenOperacao?: () => void;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function DashboardKpisSection({
  gmvHoje,
  faturamentoSaasHoje,
  corridasEmAndamento,
  motoristasOnline,
  chamadosSOSAtivos,
  taxaSucesso,
  ticketMedio,
  economiaMotoristas,
  onOpenSOS,
  onOpenOperacao,
}: DashboardKpisSectionProps) {
  return (
    <div className="space-y-4">
      {/* 4 Cards Principais de Desempenho Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Volume Total (GMV Hoje)"
          value={brl(gmvHoje)}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="brand"
          trend={{ value: "+14.2%", positive: true, label: "vs ontem" }}
          subtext="Total movimentado pelos condutores"
        />

        <AdminKpiCard
          label="Receita SaaS (Diárias da Praça)"
          value={brl(faturamentoSaasHoje)}
          icon={<Zap className="h-5 w-5" />}
          iconColor="success"
          trend={{ value: "+8.5%", positive: true, label: "recorrente" }}
          badge={
            <AdminBadge variant="success" size="sm">
              0% COMISSÃO
            </AdminBadge>
          }
          subtext="Faturamento real da plataforma"
        />

        <AdminKpiCard
          label="Corridas em Andamento"
          value={corridasEmAndamento}
          icon={<Radio className="h-5 w-5 text-emerald-600 animate-pulse" />}
          iconColor="success"
          onClick={onOpenOperacao}
          badge={
            corridasEmAndamento > 0 ? (
              <AdminBadge variant="success" dot pulse size="sm">
                Ao Vivo
              </AdminBadge>
            ) : undefined
          }
          subtext="Veículos transportando passageiros"
        />

        <AdminKpiCard
          label="Condutores Conectados"
          value={motoristasOnline}
          icon={<Car className="h-5 w-5" />}
          iconColor="info"
          subtext="Frota com GNSS ativo no mapa"
        />
      </div>

      {/* Faixa Secundária: Métricas Operacionais & Alertas Críticos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Taxa de Sucesso
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {taxaSucesso.toFixed(1)}%
            </span>
          </div>
          <AdminBadge variant="success" size="sm">
            ALTA
          </AdminBadge>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Ticket Médio
            </span>
            <span className="text-base font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {brl(ticketMedio)}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">por corrida</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Economia dos Condutores
            </span>
            <span className="text-base font-black text-primary tabular-nums">
              {brl(economiaMotoristas)}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">vs 25% Uber/99</span>
        </div>

        <div
          onClick={onOpenSOS}
          className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-2xs transition-all cursor-pointer ${
            chamadosSOSAtivos > 0
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 animate-pulse text-rose-900 dark:text-rose-200"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block">
              Chamados SOS 190
            </span>
            <span className="text-base font-black tabular-nums">
              {chamadosSOSAtivos > 0 ? `${chamadosSOSAtivos} ATIVO(S)` : "0 Chamados"}
            </span>
          </div>
          <ShieldAlert
            className={`h-5 w-5 ${
              chamadosSOSAtivos > 0 ? "text-rose-600 animate-bounce" : "text-emerald-500"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
