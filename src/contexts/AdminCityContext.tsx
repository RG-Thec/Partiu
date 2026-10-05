import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  type AdminPracaOperacao,
  PRACA_GLOBAL_TODAS,
  carregarPracasDisponiveis,
  getPracaAtiva,
  setPracaAtiva as setPracaAtivaStorage,
} from "@/lib/admin-city-service";

export interface AdminCityContextValue {
  pracaAtiva: AdminPracaOperacao;
  pracas: AdminPracaOperacao[];
  isNacional: boolean;
  selecionarPraca: (pracaId: string) => void;
  recarregarPracas: () => void;
}

const AdminCityContext = createContext<AdminCityContextValue | null>(null);

export function AdminCityProvider({ children }: { children: React.ReactNode }) {
  const [pracas, setPracas] = useState<AdminPracaOperacao[]>(() => carregarPracasDisponiveis());
  const [pracaAtiva, setPracaAtivaState] = useState<AdminPracaOperacao>(() => getPracaAtiva());

  const recarregarPracas = useCallback(() => {
    const listaAtualizada = carregarPracasDisponiveis();
    setPracas(listaAtualizada);
    const ativaAtualizada = getPracaAtiva();
    setPracaAtivaState(ativaAtualizada);
  }, []);

  const selecionarPraca = useCallback((pracaId: string) => {
    const nova = setPracaAtivaStorage(pracaId);
    setPracaAtivaState(nova);
  }, []);

  useEffect(() => {
    function onPracaChanged(e: any) {
      if (e.detail) {
        setPracaAtivaState(e.detail);
      }
    }

    function onStorageEvent(e: StorageEvent) {
      if (e.key === "partiu_admin_praca_ativa" || e.key === "partiu_cidades_ativas") {
        recarregarPracas();
      }
    }

    window.addEventListener("partiu:praca-changed", onPracaChanged);
    window.addEventListener("storage", onStorageEvent);

    return () => {
      window.removeEventListener("partiu:praca-changed", onPracaChanged);
      window.removeEventListener("storage", onStorageEvent);
    };
  }, [recarregarPracas]);

  const isNacional = useMemo(() => pracaAtiva.id === "todas", [pracaAtiva.id]);

  const value = useMemo<AdminCityContextValue>(
    () => ({
      pracaAtiva,
      pracas,
      isNacional,
      selecionarPraca,
      recarregarPracas,
    }),
    [pracaAtiva, pracas, isNacional, selecionarPraca, recarregarPracas]
  );

  return <AdminCityContext.Provider value={value}>{children}</AdminCityContext.Provider>;
}

export function useAdminCity(): AdminCityContextValue {
  const context = useContext(AdminCityContext);
  if (!context) {
    // Fallback gracioso se renderizado fora do provider
    return {
      pracaAtiva: PRACA_GLOBAL_TODAS,
      pracas: carregarPracasDisponiveis(),
      isNacional: true,
      selecionarPraca: () => {},
      recarregarPracas: () => {},
    };
  }
  return context;
}

export const useAdminPracaAtiva = useAdminCity;
