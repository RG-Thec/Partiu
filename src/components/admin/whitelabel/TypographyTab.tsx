import React from "react";
import { Type } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import type { FontFamilyOption } from "@/lib/white-label";

interface TypographyTabProps {
  onSaveFeedback: () => void;
}

export function TypographyTab({ onSaveFeedback }: TypographyTabProps) {
  const { typography, updateConfig } = useBrandTheme();

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
          <Type className="w-5 h-5 text-primary-600" />
          Módulo 3: Typography Center
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Selecione as fontes do Google Fonts, escala de títulos, entrelinha e pesos de botões.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Família da Fonte Principal
          </label>
          <select
            value={typography?.familiaPrincipal || "Plus Jakarta Sans"}
            onChange={(e) => {
              updateConfig({
                typography: {
                  ...typography,
                  familiaPrincipal: e.target.value as FontFamilyOption,
                },
              });
              onSaveFeedback();
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 cursor-pointer outline-none"
          >
            <option value="Plus Jakarta Sans">Plus Jakarta Sans (Padrão PARTIU)</option>
            <option value="Inter">Inter (Estilo Uber)</option>
            <option value="Poppins">Poppins (Geométrica e Moderna)</option>
            <option value="Roboto">Roboto (Google Material)</option>
            <option value="Montserrat">Montserrat (Impacto Comercial)</option>
            <option value="Nunito">Nunito (Amigável e Arredondada)</option>
            <option value="Open Sans">Open Sans (Alta Legibilidade)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Família para Títulos &amp; Números
          </label>
          <select
            value={typography?.familiaTitulos || "Plus Jakarta Sans"}
            onChange={(e) => {
              updateConfig({
                typography: {
                  ...typography,
                  familiaTitulos: e.target.value as FontFamilyOption,
                },
              });
              onSaveFeedback();
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 cursor-pointer outline-none"
          >
            <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
            <option value="Inter">Inter</option>
            <option value="Poppins">Poppins</option>
            <option value="Roboto">Roboto</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Nunito">Nunito</option>
            <option value="Open Sans">Open Sans</option>
          </select>
        </div>
      </div>

      {/* Escala de Tamanhos */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-primary-600">
          Escala Tipográfica (Valores em REM)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1 font-bold">Títulos</span>
            <input
              type="number"
              step="0.05"
              value={typography?.tamanhoTitulosRem || 1.5}
              onChange={(e) => {
                updateConfig({
                  typography: {
                    ...typography,
                    tamanhoTitulosRem: parseFloat(e.target.value) || 1.5,
                  },
                });
                onSaveFeedback();
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1 font-bold">Subtítulos</span>
            <input
              type="number"
              step="0.05"
              value={typography?.tamanhoSubtitulosRem || 1.125}
              onChange={(e) => {
                updateConfig({
                  typography: {
                    ...typography,
                    tamanhoSubtitulosRem: parseFloat(e.target.value) || 1.125,
                  },
                });
                onSaveFeedback();
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1 font-bold">Corpo / Base</span>
            <input
              type="number"
              step="0.05"
              value={typography?.tamanhoTextoBaseRem || 0.875}
              onChange={(e) => {
                updateConfig({
                  typography: {
                    ...typography,
                    tamanhoTextoBaseRem: parseFloat(e.target.value) || 0.875,
                  },
                });
                onSaveFeedback();
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1 font-bold">Botões</span>
            <input
              type="number"
              step="0.05"
              value={typography?.tamanhoBotoesRem || 0.875}
              onChange={(e) => {
                updateConfig({
                  typography: {
                    ...typography,
                    tamanhoBotoesRem: parseFloat(e.target.value) || 0.875,
                  },
                });
                onSaveFeedback();
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-mono outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
