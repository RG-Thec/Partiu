import React from "react";
import {
  MapPin,
  TrendingUp,
  Users,
  Car,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { AdminModal } from "../ui/AdminModal";
import { AdminBadge } from "../ui/AdminBadge";
import { AdminCard } from "../ui/AdminCard";
import { AdminDataTable, type AdminColumn } from "../ui/AdminDataTable";

export interface PracaComparativo {
  id: string;
  cidade: string;
  estado: string;
  corridasHoje: number;
  gmvHoje: number;
  motoristasAtivos: number;
  taxaSucesso: number;
  tempoMedioEsperaMin: number;
  statusOperacao: "NORMAL" | "ALTA_DEMANDA" | "EXPANSAO";
}

const DADOS_PRACAS: PracaComparativo[] = [
  {
    id: "itaperuna",
    cidade: "Itaperuna",
    estado: "RJ",
    corridasHoje: 184,
    gmvHoje: 4230.5,
    motoristasAtivos: 38,
    taxaSucesso: 97.4,
    tempoMedioEsperaMin: 4.2,
    statusOperacao: "NORMAL",
  },
  {
    id: "campos",
    cidade: "Campos dos Goytacazes",
    estado: "RJ",
    corridasHoje: 96,
    gmvHoje: 2180.0,
    motoristasAtivos: 22,
    taxaSucesso: 93.8,
    tempoMedioEsperaMin: 5.6,
    statusOperacao: "ALTA_DEMANDA",
  },
  {
    id: "bom_jesus",
    cidade: "Bom Jesus do Itabapoana",
    estado: "RJ",
    corridasHoje: 42,
    gmvHoje: 890.0,
    motoristasAtivos: 12,
    taxaSucesso: 98.1,
    tempoMedioEsperaMin: 3.8,
    statusOperacao: "NORMAL",
  },
  {
    id: "muriae",
    cidade: "Muriaé",
    estado: "MG",
    corridasHoje: 18,
    gmvHoje: 395.0,
    motoristasAtivos: 6,
    taxaSucesso: 91.2,
    tempoMedioEsperaMin: 6.4,
    statusOperacao: "EXPANSAO",
  },
];

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export interface DashboardCityComparisonModalProps {
  open: boolean;
  onClose: () => void;
  onSelecionarPraca?: (pracaId: string) => void;
}

export function DashboardCityComparisonModal({
  open,
  onClose,
  onSelecionarPraca,
}: DashboardCityComparisonModalProps) {
  const colunas: AdminColumn<PracaComparativo>[] = [
    {
      key: "cidade",
      header: "Praça / Cidade",
      render: (p) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {p.cidade}
            </p>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {p.estado}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "corridas",
      header: "Corridas Hoje",
      align: "center",
      render: (p) => (
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
          {p.corridasHoje}
        </span>
      ),
    },
    {
      key: "gmv",
      header: "Volume Bruto (GMV)",
      render: (p) => (
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
          {brl(p.gmvHoje)}
        </span>
      ),
    },
    {
      key: "frota",
      header: "Motoristas Ativos",
      align: "center",
      render: (p) => (
        <div className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
          <Car className="h-3 w-3 text-slate-400" />
          <span className="tabular-nums">{p.motoristasAtivos}</span>
        </div>
      ),
    },
    {
      key: "conversao",
      header: "Taxa de Sucesso",
      align: "center",
      render: (p) => (
        <span
          className={`font-mono font-bold text-xs ${
            p.taxaSucesso >= 95
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {p.taxaSucesso.toFixed(1)}%
        </span>
      ),
    },
    {
      key: "status",
      header: "Status Operacional",
      render: (p) => {
        const variantMap = {
          NORMAL: "success" as const,
          ALTA_DEMANDA: "warning" as const,
          EXPANSAO: "info" as const,
        };
        const labelMap = {
          NORMAL: "OPERANTE",
          ALTA_DEMANDA: "ALTA DEMANDA",
          EXPANSAO: "FASE PILOTO",
        };
        return (
          <AdminBadge variant={variantMap[p.statusOperacao]} size="sm">
            {labelMap[p.statusOperacao]}
          </AdminBadge>
        );
      },
    },
  ];

  const totalGMV = DADOS_PRACAS.reduce((acc, p) => acc + p.gmvHoje, 0);
  const totalCorridas = DADOS_PRACAS.reduce((acc, p) => acc + p.corridasHoje, 0);
  const totalFrota = DADOS_PRACAS.reduce((acc, p) => acc + p.motoristasAtivos, 0);

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      size="2xl"
      title="Comparativo Operacional Multi-Cidade"
      subtitle="Desempenho consolidado entre praças ativas do PARTIU"
      icon={<MapPin className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-5">
        {/* Sumário Consolidado Multi-Tenant */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              GMV Consolidado Hoje
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {brl(totalGMV)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Corridas Concluídas
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {totalCorridas}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Condutores em Rota
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {totalFrota}
            </span>
          </div>
        </div>

        {/* Tabela de Comparação de Praças */}
        <AdminDataTable
          columns={colunas}
          data={DADOS_PRACAS}
          keyExtractor={(p) => p.id}
          onRowClick={(p) => {
            onSelecionarPraca?.(p.id);
            onClose();
          }}
        />

        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
          <span>
            💡 <strong>Dica Multi-Tenant:</strong> Clique em qualquer praça para filtrar todo o painel executivo para aquela cidade.
          </span>
        </div>
      </div>
    </AdminModal>
  );
}
