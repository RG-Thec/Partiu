import React, { useState } from "react";
import { Upload, AlertTriangle } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";

interface ImportThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ImportThemeModal({ isOpen, onClose, onImported }: ImportThemeModalProps) {
  const { importThemeJson } = useBrandTheme();
  const [importJsonText, setImportJsonText] = useState("");
  const [importErro, setImportErro] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-600" />
          Importar Configuração JSON White Label
        </h3>
        <p className="text-xs text-slate-400">
          Cole abaixo o payload JSON completo exportado previamente de outra franquia ou ambiente.
        </p>

        <textarea
          rows={8}
          value={importJsonText}
          onChange={(e) => setImportJsonText(e.target.value)}
          placeholder='{ "versaoSchema": 1, "brandCenter": { ... } }'
          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono"
        />

        {importErro && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{importErro}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!importJsonText.trim()}
            onClick={() => {
              const res = importThemeJson(importJsonText);
              if (res.success) {
                onClose();
                onImported();
              } else {
                setImportErro(res.error || "Erro ao importar JSON.");
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-black bg-primary-600 hover:bg-amber-300 text-slate-950 disabled:opacity-40 cursor-pointer shadow-md"
          >
            Validar e Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
