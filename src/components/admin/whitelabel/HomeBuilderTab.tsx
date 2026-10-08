import React from "react";
import { Layout, ArrowUp, ArrowDown } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";

interface HomeBuilderTabProps {
  onSaveFeedback: () => void;
}

export function HomeBuilderTab({ onSaveFeedback }: HomeBuilderTabProps) {
  const { homePage, reorderHomeBlocks } = useBrandTheme();

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
          <Layout className="w-5 h-5 text-primary-600" />
          Módulo 5: Home Page Builder
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Ordene blocos, ative/desative componentes e configure a experiência da tela inicial.
        </p>
      </div>

      {/* Lista de Blocos Reordenáveis */}
      <div className="space-y-2.5">
        {homePage?.blocos
          ?.sort((a, b) => a.ordem - b.ordem)
          ?.map((bloco, idx, arr) => (
            <div
              key={bloco.id}
              className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-2xl gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center">
                  {bloco.ordem}
                </span>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {bloco.titulo}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Tipo: {bloco.tipo}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Ativo */}
                <button
                  type="button"
                  onClick={() => {
                    const updatedBlocos = homePage.blocos.map((b) =>
                      b.id === bloco.id ? { ...b, ativo: !b.ativo } : b
                    );
                    reorderHomeBlocks(updatedBlocos);
                    onSaveFeedback();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    bloco.ativo
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {bloco.ativo ? "Visível" : "Oculto"}
                </button>

                {/* Mover para Cima */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => {
                    if (idx > 0) {
                      const newArr = [...arr];
                      const prev = newArr[idx - 1];
                      const curr = newArr[idx];
                      if (prev && curr) {
                        const temp = prev.ordem;
                        prev.ordem = curr.ordem;
                        curr.ordem = temp;
                        reorderHomeBlocks(newArr);
                        onSaveFeedback();
                      }
                    }
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 cursor-pointer"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                {/* Mover para Baixo */}
                <button
                  type="button"
                  disabled={idx === arr.length - 1}
                  onClick={() => {
                    if (idx < arr.length - 1) {
                      const newArr = [...arr];
                      const next = newArr[idx + 1];
                      const curr = newArr[idx];
                      if (next && curr) {
                        const temp = next.ordem;
                        next.ordem = curr.ordem;
                        curr.ordem = temp;
                        reorderHomeBlocks(newArr);
                        onSaveFeedback();
                      }
                    }
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 cursor-pointer"
                  title="Mover para baixo"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
