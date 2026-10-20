import React, { useState } from "react";
import { UserCheck, Sparkles, Send, Users, Car, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

export interface ReengagementCrmModalProps {
  aberto: boolean;
  onFechar: () => void;
  pracaNome: string;
}

export function ReengagementCrmModal({
  aberto,
  onFechar,
  pracaNome,
}: ReengagementCrmModalProps) {
  const [motoristasInativos] = useState(14);
  const [passageirosInativos] = useState(38);
  const [disparando, setDisparando] = useState<string | null>(null);

  if (!aberto) return null;

  function handleDispararMotoristas() {
    setDisparando("motoristas");
    setTimeout(() => {
      setDisparando(null);
      toast.success(
        `Campanha disparada para ${motoristasInativos} condutores inativos em ${pracaNome}! Benefício: 1ª diária bonificada no retorno.`
      );
    }, 1200);
  }

  function handleDispararPassageiros() {
    setDisparando("passageiros");
    setTimeout(() => {
      setDisparando(null);
      toast.success(
        `Campanha disparada para ${passageirosInativos} passageiros inativos em ${pracaNome}! Cupom VOLTEIPARTIU aplicado.`
      );
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl text-white animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary-600/20 text-primary-400 flex items-center justify-center border border-primary-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">CRM de Reengajamento Inteligente</h3>
              <p className="text-xs text-slate-400">Reativação de usuários inativos (&gt; 7 dias)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Dispare incentivos direcionados para recuperar usuários e condutores que reduziram sua
          atividade na praça <strong className="text-white">{pracaNome}</strong>.
        </p>

        <div className="space-y-3">
          {/* Card 1: Motoristas */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Car className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white">Motoristas Parceiros Inativos</h4>
                <p className="text-[11px] text-slate-400">
                  <strong className="text-blue-400">{motoristasInativos}</strong> sem corridas na última semana
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  Incentivo: Isenção da primeira diária de retorno
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={disparando === "motoristas"}
              onClick={handleDispararMotoristas}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{disparando === "motoristas" ? "Enviando..." : "Reativar"}</span>
            </button>
          </div>

          {/* Card 2: Passageiros */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white">Passageiros Sumidos</h4>
                <p className="text-[11px] text-slate-400">
                  <strong className="text-emerald-400">{passageirosInativos}</strong> sem viagens nos últimos 7 dias
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  Incentivo: Cupom de R$ 5,00 (VOLTEIPARTIU)
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={disparando === "passageiros"}
              onClick={handleDispararPassageiros}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{disparando === "passageiros" ? "Enviando..." : "Reativar"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
