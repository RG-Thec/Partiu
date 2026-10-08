import React, { useState } from "react";
import { Copy } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";

interface CloneTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloned: () => void;
}

export function CloneTenantModal({ isOpen, onClose, onCloned }: CloneTenantModalProps) {
  const { cloneTenant, switchTenant } = useBrandTheme();

  const [cloneCidadeNome, setCloneCidadeNome] = useState("");
  const [cloneEstadoUf, setCloneEstadoUf] = useState("RJ");
  const [cloneTenantId, setCloneTenantId] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Copy className="w-5 h-5 text-primary-600" />
          Clonar Franquia com 1-Click
        </h3>
        <p className="text-xs text-slate-400">
          Duplica 100% da configuração visual, comercial e operacional para uma nova cidade.
        </p>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-bold block mb-1">Nome da Nova Cidade</label>
            <input
              type="text"
              placeholder="ex: Campos dos Goytacazes"
              value={cloneCidadeNome}
              onChange={(e) => {
                setCloneCidadeNome(e.target.value);
                setCloneTenantId(
                  `tenant-${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-")}`
                );
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">Estado (UF)</label>
            <input
              type="text"
              placeholder="ex: RJ"
              value={cloneEstadoUf}
              onChange={(e) => setCloneEstadoUf(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">ID da Franquia (Slug)</label>
            <input
              type="text"
              placeholder="ex: tenant-campos"
              value={cloneTenantId}
              onChange={(e) => setCloneTenantId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!cloneCidadeNome || !cloneTenantId}
            onClick={() => {
              cloneTenant(cloneTenantId, cloneCidadeNome, cloneEstadoUf);
              switchTenant(cloneTenantId);
              onClose();
              onCloned();
            }}
            className="px-4 py-2 rounded-xl text-xs font-black bg-primary-600 hover:bg-amber-300 text-slate-950 disabled:opacity-40 cursor-pointer shadow-md"
          >
            Criar e Ativar Franquia
          </button>
        </div>
      </div>
    </div>
  );
}
