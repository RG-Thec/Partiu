import React, { useState } from "react";
import { MapPin, X, Trash2, Plus } from "lucide-react";
import type { SavedLocation } from "@/lib/passenger/passenger-ride-machine";

interface SavedAddressesModalProps {
  open: boolean;
  onClose: () => void;
  enderecos: SavedLocation[];
  onAddEndereco: (label: string, rua: string) => void;
  onRemoveEndereco: (id: string) => void;
  corPrimaria?: string;
  corTextoPrimaria?: string;
}

export function SavedAddressesModal({
  open,
  onClose,
  enderecos,
  onAddEndereco,
  onRemoveEndereco,
  corPrimaria,
  corTextoPrimaria,
}: SavedAddressesModalProps) {
  const [mostrandoFormNovoEndereco, setMostrandoFormNovoEndereco] = useState(false);
  const [novoEnderecoLabel, setNovoEnderecoLabel] = useState("");
  const [novoEnderecoRua, setNovoEnderecoRua] = useState("");

  if (!open) return null;

  function handleSubmit() {
    if (!novoEnderecoLabel.trim() || !novoEnderecoRua.trim()) return;
    onAddEndereco(novoEnderecoLabel.trim(), novoEnderecoRua.trim());
    setNovoEnderecoLabel("");
    setNovoEnderecoRua("");
    setMostrandoFormNovoEndereco(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">Meus Endereços Salvos</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {enderecos.map((end) => (
            <div
              key={end.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">{end.label}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{end.endereco}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveEndereco(end.id)}
                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                title="Remover endereço"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {mostrandoFormNovoEndereco ? (
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <input
              type="text"
              placeholder="Nome do local (Ex: Casa, Trabalho)"
              value={novoEnderecoLabel}
              onChange={(e) => setNovoEnderecoLabel(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-medium"
            />
            <input
              type="text"
              placeholder="Rua, número e bairro"
              value={novoEnderecoRua}
              onChange={(e) => setNovoEnderecoRua(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-medium"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMostrandoFormNovoEndereco(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-2 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer"
                style={{ backgroundColor: corPrimaria || "#FF6B00", color: corTextoPrimaria || "#FFFFFF" }}
              >
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMostrandoFormNovoEndereco(true)}
            className="w-full mt-4 py-2.5 px-3 rounded-xl border border-dashed border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Adicionar Novo Endereço
          </button>
        )}
      </div>
    </div>
  );
}
