import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  MapPin,
  ChevronDown,
  Check,
  Globe,
  PlusCircle,
  Search,
  Sliders,
  Layers,
} from "lucide-react";
import { useAdminCity } from "@/contexts/AdminCityContext";
import { Link } from "@tanstack/react-router";

export function AdminCitySelector() {
  const { pracaAtiva, pracas, isNacional, selecionarPraca } = useAdminCity();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }
    if (aberto) {
      document.addEventListener("mousedown", handleClickFora);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickFora);
    };
  }, [aberto]);

  const pracasFiltradas = useMemo(() => {
    if (!busca.trim()) return pracas;
    const termo = busca.toLowerCase().trim();
    return pracas.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        p.uf.toLowerCase().includes(termo) ||
        p.labelCompleto.toLowerCase().includes(termo)
    );
  }, [pracas, busca]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão Gatilho no Topbar */}
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2 py-1 h-8 rounded-lg border transition-all text-left cursor-pointer active:scale-98 shadow-xs ${
          isNacional
            ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
            : "bg-blue-50/90 hover:bg-blue-100/90 border-blue-200 text-blue-900"
        }`}
        title="Alternar Praça de Operação / Cidade Ativa"
      >
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-md shrink-0 ${
            isNacional ? "bg-slate-200/80 text-slate-700" : "bg-blue-600 text-white"
          }`}
        >
          {isNacional ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
        </div>

        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1">
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                isNacional ? "bg-emerald-500 animate-pulse" : "bg-blue-600"
              }`}
            />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Praça
            </span>
          </div>
          <p className="text-xs font-bold truncate max-w-[100px] sm:max-w-[140px] leading-tight">
            {isNacional ? "Rede Nacional" : pracaAtiva.nome}
          </p>
        </div>

        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform text-slate-400 ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Flutuante */}
      {aberto && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[310px] sm:w-[360px] bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Cabeçalho do Dropdown */}
          <div className="p-3.5 sm:p-4 bg-slate-950 text-white border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base font-black flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary-400" />
                  Praças de Operação
                </p>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
                  Filtre frotas, corridas e métricas por cidade
                </p>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-primary-400 border border-slate-700">
                {pracas.length - 1} Cidades
              </span>
            </div>

            {/* Campo de Busca Rápida se houver 3 ou mais cidades */}
            {pracas.length > 3 && (
              <div className="relative mt-3">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar praça ou estado..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-primary-500 font-medium"
                />
              </div>
            )}
          </div>

          {/* Lista com Scroll */}
          <div className="max-h-[320px] overflow-y-auto p-2 space-y-1 custom-admin-scrollbar">
            {pracasFiltradas.map((p) => {
              const selecionada = pracaAtiva.id === p.id;
              const isGlobal = p.id === "todas";

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    selecionarPraca(p.id);
                    setAberto(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all text-left cursor-pointer ${
                    selecionada
                      ? "bg-slate-900 text-white shadow-xs font-bold"
                      : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 font-black text-xs ${
                        selecionada
                          ? "bg-primary-500 text-slate-950"
                          : isGlobal
                          ? "bg-slate-200 text-slate-700"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {isGlobal ? <Globe className="h-4 w-4" /> : p.uf}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-black truncate leading-tight ${
                          selecionada ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {p.nome}
                      </p>
                      <span
                        className={`text-[10px] sm:text-xs block font-medium truncate mt-0.5 ${
                          selecionada ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {isGlobal ? "Todas as praças integradas" : `Raio de ${p.raioKm} km • UF ${p.uf}`}
                      </span>
                    </div>
                  </div>

                  {selecionada && (
                    <div className="h-6 w-6 rounded-full bg-primary-400 text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}

            {pracasFiltradas.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                Nenhuma praça encontrada com "{busca}".
              </div>
            )}
          </div>

          {/* Rodapé: Atalho para Gestão de Cidades e Onboarding */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <Link
              to="/app/admin/configuracoes"
              onClick={() => setAberto(false)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-black transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5 text-blue-600" />
              <span>Gerenciar / Nova Praça de Operação</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
