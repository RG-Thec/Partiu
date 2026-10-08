import React from "react";
import { Compass } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";

interface MenuBuilderTabProps {
  onSaveFeedback: () => void;
}

export function MenuBuilderTab({ onSaveFeedback }: MenuBuilderTabProps) {
  const { menuBuilder, updateConfig } = useBrandTheme();

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
          <Compass className="w-5 h-5 text-primary-600" />
          Módulo 5: Menu &amp; Navigation Builder
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adicione, renomeie ou ordene itens no Menu Drawer lateral e abas da barra de navegação inferior.
        </p>
      </div>

      {/* Itens do Drawer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-primary-600">
            Itens do Menu Drawer Lateral
          </h3>
        </div>

        <div className="space-y-2">
          {menuBuilder?.itensDrawer?.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">{item.rotulo}</span>
                <span className="text-slate-400 font-mono">{item.rota}</span>
                {item.badge && (
                  <span className="bg-primary-600/20 text-primary-500 px-2 py-0.5 rounded text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const updated = menuBuilder.itensDrawer.map((i) =>
                      i.id === item.id ? { ...i, visivel: !i.visivel } : i
                    );
                    updateConfig({
                      menuBuilder: { ...menuBuilder, itensDrawer: updated },
                    });
                    onSaveFeedback();
                  }}
                  className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                    item.visivel
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {item.visivel ? "Ativo" : "Inativo"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
