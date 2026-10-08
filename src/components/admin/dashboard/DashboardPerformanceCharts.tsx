import React from "react";
import { BarChart3, PieChart } from "lucide-react";
import { AdminCard, AdminCardHeader } from "../ui/AdminCard";

export interface Dados7DiasItem {
  data: string;
  label: string;
  total: number;
  concluidas: number;
  receita: number;
}

export interface DashboardPerformanceChartsProps {
  dados7Dias: {
    dias: Dados7DiasItem[];
    maxTotal: number;
    totalSemana: number;
    receitaSemana: number;
  };
  distribuicao: {
    total: number;
    concluidas: { qtd: number; pct: number };
    emAndamento: { qtd: number; pct: number };
    buscando: { qtd: number; pct: number };
    canceladas: { qtd: number; pct: number };
  };
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function DashboardPerformanceCharts({
  dados7Dias,
  distribuicao,
}: DashboardPerformanceChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Gráfico de Volume dos Últimos 7 Dias */}
      <AdminCard className="lg:col-span-2">
        <AdminCardHeader
          title="Volume Operacional (Últimos 7 Dias)"
          subtitle={`Total de ${dados7Dias.totalSemana} corridas registradas • ${brl(dados7Dias.receitaSemana)} movimentados`}
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
        />

        <div className="pt-4">
          <div className="flex items-end justify-between gap-2 h-44 px-2">
            {dados7Dias.dias.map((d, idx) => {
              const alturaPct = Math.max(
                Math.round((d.total / dados7Dias.maxTotal) * 100),
                8
              );
              const isHoje = idx === dados7Dias.dias.length - 1;

              return (
                <div key={d.data} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 tabular-nums">
                    {d.total}
                  </span>

                  <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-t-xl h-36 flex items-end overflow-hidden p-0.5">
                    <div
                      style={{ height: `${alturaPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isHoje
                          ? "bg-primary shadow-xs"
                          : "bg-slate-300 dark:bg-slate-600 group-hover:bg-primary/80"
                      }`}
                    />
                  </div>

                  <span
                    className={`text-[11px] font-bold ${
                      isHoje
                        ? "text-primary"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </AdminCard>

      {/* Distribuição por Status das Solicitações */}
      <AdminCard>
        <AdminCardHeader
          title="Status das Solicitações"
          subtitle={`Amostra de ${distribuicao.total} chamados na praça`}
          icon={<PieChart className="h-5 w-5 text-indigo-500" />}
        />

        <div className="pt-2 space-y-3.5">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Concluídas com Sucesso
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {distribuicao.concluidas.qtd} ({distribuicao.concluidas.pct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${distribuicao.concluidas.pct}%` }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Em Andamento / Rota
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {distribuicao.emAndamento.qtd} ({distribuicao.emAndamento.pct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${distribuicao.emAndamento.pct}%` }}
                className="h-full bg-blue-500 rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Buscando Condutor
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {distribuicao.buscando.qtd} ({distribuicao.buscando.pct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${distribuicao.buscando.pct}%` }}
                className="h-full bg-amber-500 rounded-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Canceladas / Timeout
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {distribuicao.canceladas.qtd} ({distribuicao.canceladas.pct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${distribuicao.canceladas.pct}%` }}
                className="h-full bg-rose-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
