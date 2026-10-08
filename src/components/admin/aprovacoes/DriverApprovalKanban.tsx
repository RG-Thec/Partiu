import React from "react";
import {
  Car,
  Bike,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Eye,
  Check,
  X,
  FileCheck2,
} from "lucide-react";
import { AdminCard } from "../ui/AdminCard";
import { AdminBadge } from "../ui/AdminBadge";
import { AdminActionButton } from "../ui/AdminActionButton";
import { adminTokens } from "../ui/tokens";
import type { SolicitacaoCondutor } from "@/routes/app.admin.aprovacoes";

export interface DriverApprovalKanbanProps {
  solicitacoes: SolicitacaoCondutor[];
  onAuditar: (sol: SolicitacaoCondutor) => void;
  onAprovarRapido: (id: string, categoria: "CARRO" | "MOTO" | "PLUS" | "MULHER") => void;
  onRejeitarRapido: (sol: SolicitacaoCondutor) => void;
}

export function DriverApprovalKanban({
  solicitacoes,
  onAuditar,
  onAprovarRapido,
  onRejeitarRapido,
}: DriverApprovalKanbanProps) {
  const pendentes = solicitacoes.filter((s) => s.status === "pendente");
  const aprovados = solicitacoes.filter((s) => s.status === "aprovado");
  const rejeitados = solicitacoes.filter((s) => s.status === "rejeitado");

  const colunas = [
    {
      id: "pendentes",
      titulo: "Recebidos / Pendentes",
      icone: <Clock className="h-4 w-4 text-amber-500" />,
      badgeVariant: "warning" as const,
      pulse: true,
      itens: pendentes,
      emptyTexto: "Nenhuma solicitação aguardando auditoria.",
    },
    {
      id: "aprovados",
      titulo: "Aprovados & Credenciados",
      icone: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      badgeVariant: "success" as const,
      pulse: false,
      itens: aprovados,
      emptyTexto: "Nenhum motorista aprovado neste filtro.",
    },
    {
      id: "rejeitados",
      titulo: "Reprovados / Incompletos",
      icone: <XCircle className="h-4 w-4 text-rose-500" />,
      badgeVariant: "critical" as const,
      pulse: false,
      itens: rejeitados,
      emptyTexto: "Nenhum cadastro reprovado.",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-start">
      {colunas.map((col) => (
        <div
          key={col.id}
          className="bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col min-h-[500px]"
        >
          {/* Cabeçalho da Coluna Kanban */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {col.icone}
              <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                {col.titulo}
              </h3>
            </div>
            <AdminBadge variant={col.badgeVariant} size="sm" dot pulse={col.pulse}>
              {col.itens.length}
            </AdminBadge>
          </div>

          {/* Cards da Coluna */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[75vh] pr-0.5">
            {col.itens.length === 0 ? (
              <div className="text-center py-10 px-3 text-xs text-slate-400 dark:text-slate-500 font-medium border-2 border-dashed border-slate-200/60 dark:border-slate-800/80 rounded-xl">
                {col.emptyTexto}
              </div>
            ) : (
              col.itens.map((sol) => {
                const isMoto = sol.modalidade === "moto_flash" || sol.categoriaVeiculo === "MOTO";
                return (
                  <div
                    key={sol.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                  >
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <img
                            src={sol.documentos.fotoPerfilUrl}
                            alt={sol.nomeCompleto}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 p-0.5 rounded-md ${
                              isMoto ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {isMoto ? <Bike className="h-2.5 w-2.5" /> : <Car className="h-2.5 w-2.5" />}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {sol.nomeCompleto}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {sol.cidade} • {sol.dataSolicitacao}
                          </p>
                        </div>
                      </div>

                      <AdminBadge
                        variant={isMoto ? "warning" : "info"}
                        size="sm"
                      >
                        {isMoto ? "MOTO" : "POP"}
                      </AdminBadge>
                    </div>

                    {/* Detalhes do Veículo e EAR */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-[11px] space-y-1 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="font-medium truncate max-w-[140px]">
                          {sol.veiculoMarcaModelo || "Veículo não inf."}
                        </span>
                        <span className="font-mono font-bold uppercase text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                          {sol.veiculoPlaca || "SEM PLACA"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-medium">EAR na CNH:</span>
                        {sol.possuiEAR ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-0.5">
                            <ShieldCheck className="h-3 w-3" /> Conforme
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-0.5">
                            <ShieldAlert className="h-3 w-3" /> Ausente
                          </span>
                        )}
                      </div>
                    </div>

                    {sol.motivoRejeicao && (
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 text-[10px] text-rose-700 dark:text-rose-300">
                        <strong>Motivo:</strong> {sol.motivoRejeicao}
                      </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="pt-1 flex items-center justify-between gap-1.5 border-t border-slate-100 dark:border-slate-800">
                      <AdminActionButton
                        variant="outline"
                        size="xs"
                        iconLeft={<Eye className="h-3 w-3" />}
                        onClick={() => onAuditar(sol)}
                        className="flex-1"
                      >
                        Auditar
                      </AdminActionButton>

                      {sol.status === "pendente" && (
                        <>
                          <button
                            type="button"
                            onClick={() => onAprovarRapido(sol.id, sol.categoriaVeiculo)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs"
                            title="Aprovar com 1 clique"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRejeitarRapido(sol)}
                            className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition-all cursor-pointer"
                            title="Reprovar solicitação"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}

                      <a
                        href={`https://wa.me/55${sol.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        title="Falar no WhatsApp"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
