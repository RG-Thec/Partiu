import React from "react";
import { Clock, AlertTriangle } from "lucide-react";

export interface DriverApprovalAlertProps {
  driverApprovalStatus: string;
  subscriptionStatus?: string;
  accumulatedDebtBrl?: number;
  erroElegibilidade: string | null;
  onClearErro: () => void;
  onOpenRegularizacao: () => void;
}

export function DriverApprovalAlert({
  driverApprovalStatus,
  subscriptionStatus,
  accumulatedDebtBrl = 0,
  erroElegibilidade,
  onClearErro,
  onOpenRegularizacao,
}: DriverApprovalAlertProps) {
  return (
    <>
      {/* Alerta de Moderação Documental Pendente */}
      {driverApprovalStatus === "pendente" && (
        <div className="absolute top-[4.5rem] inset-x-3 z-40 max-w-lg mx-auto p-3.5 bg-amber-500/15 text-foreground text-xs font-semibold rounded-2xl shadow-xl flex items-start gap-3 border border-amber-500/30 animate-in slide-in-from-top duration-200">
          <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-xs uppercase tracking-tight block">
                Cadastro em Análise pela Moderação
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                Pendente
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-snug font-medium">
              Sua documentação (CNH com EAR e CRLV) está sob auditoria da equipe operacional. O botão <strong>ONLINE</strong> será liberado instantaneamente assim que for aprovado.
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Moderação Reprovada */}
      {driverApprovalStatus === "rejeitado" && (
        <div className="absolute top-[4.5rem] inset-x-3 z-40 max-w-lg mx-auto p-3.5 bg-destructive/15 text-destructive text-xs font-semibold rounded-2xl shadow-xl flex items-start gap-3 border border-destructive/30 animate-in slide-in-from-top duration-200">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-xs uppercase tracking-tight block">
                Cadastro Reprovado na Auditoria
              </span>
              <span className="text-[10px] bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                Reprovado
              </span>
            </div>
            <p className="text-xs text-destructive/80 mt-1 leading-snug font-medium">
              Houve inconsistências na sua documentação. Por favor, contate o suporte operacional para regularização.
            </p>
          </div>
        </div>
      )}

      {/* Alerta de Suspensão por Inadimplência */}
      {(subscriptionStatus === "SUSPENDED" || subscriptionStatus === "REACTIVATION_REQUIRED") && (
        <div className="absolute top-[4.5rem] inset-x-3 z-40 max-w-md mx-auto p-3.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <span className="text-base">🚨</span>
            <div>
              <span className="font-black block text-xs">CONTA SUSPENSA POR INADIMPLÊNCIA</span>
              <span className="text-xs opacity-90">
                Débito: {accumulatedDebtBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRegularizacao}
            className="px-3 py-1.5 bg-card text-destructive font-black text-xs hover:bg-muted rounded-xl shadow-md active:scale-95 transition cursor-pointer"
          >
            Regularizar
          </button>
        </div>
      )}

      {/* Alerta de Elegibilidade do Condutor */}
      {erroElegibilidade && !(subscriptionStatus === "SUSPENDED" || subscriptionStatus === "REACTIVATION_REQUIRED") && (
        <div className="absolute top-[4.5rem] inset-x-3 z-40 max-w-md mx-auto p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-200">
          <span>⚠️ {erroElegibilidade}</span>
          <button
            type="button"
            onClick={onClearErro}
            aria-label="Dispensar alerta de elegibilidade"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center p-2 text-destructive hover:bg-destructive/10 rounded-full transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
