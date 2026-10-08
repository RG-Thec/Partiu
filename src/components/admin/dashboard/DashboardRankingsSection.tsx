import React, { useState } from "react";
import { Trophy, Star, Users, ArrowUpRight, Award, Car } from "lucide-react";
import { AdminCard, AdminCardHeader } from "../ui/AdminCard";
import { AdminTabBar } from "../ui/AdminTabBar";
import { AdminBadge } from "../ui/AdminBadge";

export interface RankingMotorista {
  nome: string;
  corridas: number;
  gmv: number;
  rating: number;
}

export interface RankingPassageiro {
  nome: string;
  telefone: string;
  corridas: number;
  gastoTotal: number;
}

export interface DashboardRankingsSectionProps {
  topMotoristas: RankingMotorista[];
  topPassageiros: RankingPassageiro[];
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function DashboardRankingsSection({
  topMotoristas,
  topPassageiros,
}: DashboardRankingsSectionProps) {
  const [abaRanking, setAbaRanking] = useState<"motoristas" | "passageiros">("motoristas");

  return (
    <AdminCard>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Rankings de Engajamento
            </h3>
            <p className="text-xs text-slate-500">
              Principais parceiros e clientes com maior recorrência
            </p>
          </div>
        </div>

        <AdminTabBar
          variant="pills"
          activeTab={abaRanking}
          onChange={(id) => setAbaRanking(id as any)}
          tabs={[
            { id: "motoristas", label: "Top Motoristas", icon: <Car className="h-3.5 w-3.5" /> },
            { id: "passageiros", label: "Top Passageiros", icon: <Users className="h-3.5 w-3.5" /> },
          ]}
        />
      </div>

      <div className="space-y-2.5">
        {abaRanking === "motoristas" ? (
          topMotoristas.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                    idx === 0
                      ? "bg-amber-400 text-slate-950 shadow-2xs"
                      : idx === 1
                      ? "bg-slate-300 text-slate-800"
                      : idx === 2
                      ? "bg-amber-600/30 text-amber-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  #{idx + 1}
                </span>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {m.nome}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                      <Star className="h-3 w-3 fill-current" />
                      {m.rating.toFixed(1)}
                    </span>
                    <span>•</span>
                    <span>{m.corridas} corridas realizadas</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 tabular-nums block">
                  {brl(m.gmv)}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  100% Repasse
                </span>
              </div>
            </div>
          ))
        ) : (
          topPassageiros.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                    idx === 0
                      ? "bg-amber-400 text-slate-950 shadow-2xs"
                      : idx === 1
                      ? "bg-slate-300 text-slate-800"
                      : idx === 2
                      ? "bg-amber-600/30 text-amber-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  #{idx + 1}
                </span>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {p.nome}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {p.corridas} viagens no histórico
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 tabular-nums block">
                  {brl(p.gastoTotal)}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Gasto Total
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminCard>
  );
}
