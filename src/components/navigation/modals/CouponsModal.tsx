import React, { useState } from "react";
import { Tag, X, Check, Copy } from "lucide-react";
import type { ActiveCoupon } from "@/services/CouponService";

interface CouponsModalProps {
  open: boolean;
  onClose: () => void;
  promocoesDisponiveis: ActiveCoupon[];
  cupomAtivo: ActiveCoupon | null;
  onAplicarCupom: (codigo: string) => Promise<boolean>;
  onSelecionarCupom: (cupom: ActiveCoupon) => void;
  corPrimaria?: string;
  corTextoPrimaria?: string;
}

export function CouponsModal({
  open,
  onClose,
  promocoesDisponiveis,
  cupomAtivo,
  onAplicarCupom,
  onSelecionarCupom,
  corPrimaria,
  corTextoPrimaria,
}: CouponsModalProps) {
  const [inputCupom, setInputCupom] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [cupomMensagem, setCupomMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [cupomCopiado, setCupomCopiado] = useState<string | null>(null);

  if (!open) return null;

  async function handleResgatar() {
    if (!inputCupom.trim()) return;
    setValidandoCupom(true);
    setCupomMensagem(null);
    try {
      const sucesso = await onAplicarCupom(inputCupom.trim());
      if (sucesso) {
        setCupomMensagem({ tipo: "sucesso", texto: "Cupom resgatado e ativado com sucesso!" });
        setInputCupom("");
      } else {
        setCupomMensagem({ tipo: "erro", texto: "Código inválido, expirado ou esgotado." });
      }
    } catch {
      setCupomMensagem({ tipo: "erro", texto: "Não foi possível validar o cupom." });
    } finally {
      setValidandoCupom(false);
    }
  }

  function handleCopiar(codigo: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(codigo);
    }
    setCupomCopiado(codigo);
    setTimeout(() => setCupomCopiado(null), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${corPrimaria || "#FF6B00"}15`, color: corPrimaria || "#FF6B00" }}
            >
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Cupons de Desconto</h3>
              <p className="text-[10px] text-slate-500 font-medium">Promoções ativas da plataforma</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Input de Inserção de Cupom */}
        <div className="space-y-1 mb-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Possui um código de desconto?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: PARTIU10"
              value={inputCupom}
              onChange={(e) => setInputCupom(e.target.value.toUpperCase())}
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 uppercase font-bold tracking-wider focus:outline-none focus:border-slate-800"
            />
            <button
              type="button"
              disabled={validandoCupom}
              onClick={handleResgatar}
              className="px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: corPrimaria || "#FF6B00", color: corTextoPrimaria || "#FFFFFF" }}
            >
              {validandoCupom ? "..." : "Resgatar"}
            </button>
          </div>

          {cupomMensagem && (
            <p
              className={`text-[11px] font-bold mt-1.5 ${
                cupomMensagem.tipo === "sucesso" ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {cupomMensagem.texto}
            </p>
          )}
        </div>

        {/* Lista de Promoções Reais */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
            Disponíveis para Você
          </span>

          {promocoesDisponiveis.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
              <Tag className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Nenhum cupom ativo no momento</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Fique atento às notificações do aplicativo!</p>
            </div>
          ) : (
            promocoesDisponiveis.map((cupom) => {
              const isAtivo = cupomAtivo?.codigo === cupom.codigo;
              return (
                <div
                  key={cupom.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isAtivo
                      ? "bg-emerald-50/70 border-emerald-300 shadow-xs"
                      : "bg-gradient-to-r from-slate-50 to-amber-50/40 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-200 shadow-2xs">
                      {cupom.codigo}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopiar(cupom.codigo)}
                        className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        title="Copiar código"
                      >
                        {cupomCopiado === cupom.codigo ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelecionarCupom(cupom)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                          isAtivo
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        {isAtivo ? "✓ Ativo" : "Usar"}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-slate-800 mt-2">{cupom.descontoDescricao}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{cupom.expiracao}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
