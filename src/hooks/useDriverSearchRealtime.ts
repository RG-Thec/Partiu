/**
 * ==============================================================================
 * 🎯 USE DRIVER SEARCH REALTIME (TOP MODAL DINÂMICO v4.0)
 * ==============================================================================
 * Gerencia em tempo real os condutores candidatos contatados durante o despacho:
 * - Escuta eventos Supabase Realtime e delta updates do ProgressiveDispatchEngine
 * - Busca e resolve perfis de motoristas parceiros (foto, nome, nota, categoria, ETA)
 * - Controla transição animada fluida entre condutores sem layout shifts nem flickering
 * - Cleanup automático de ouvintes e canais
 * ==============================================================================
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePassengerRide } from "@/contexts/PassengerRideContext";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export interface ContactedDriver {
  id: string;
  name: string;
  firstName: string;
  avatarUrl: string;
  rating: number;
  category: string;
  vehicleModel: string;
  licensePlate: string;
  distanceKm: number;
  etaMinutes: number;
  dispatchStatus: string;
  cascadeSecondsRemaining: number;
}

export function useDriverSearchRealtime() {
  const { state, progressiveSession, categoriaVeiculo } = usePassengerRide();

  const [currentDriver, setCurrentDriver] = useState<ContactedDriver | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const previousDriverIdRef = useRef<string | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSearching =
    state === "FINDING_DRIVER" ||
    state === "REQUESTED" ||
    state === "SEARCHING_R1" ||
    state === "SEARCHING_R2" ||
    state === "SEARCHING_R3";

  // Resolve os dados do condutor ativo atual a partir da sessão ou delta update
  const resolveCandidateData = useCallback(
    (candidate: any, trustProfile?: any, cascadeSeconds?: number, status?: string): ContactedDriver | null => {
      if (!candidate && !trustProfile) return null;

      const id = candidate?.driverId || (candidate as any)?.id || trustProfile?.driverId || "drv-unknown";
      const fullName = trustProfile?.fullName || candidate?.name || "Motorista Parceiro";
      const firstName = trustProfile?.firstName || fullName.split(" ")[0] || "Motorista";
      const avatarUrl =
        trustProfile?.avatarUrl ||
        candidate?.avatarUrl ||
        "";
      const rating = Number(trustProfile?.rating || candidate?.rating || 5.0);
      const vehicleModel =
        trustProfile?.vehicleModel ||
        candidate?.vehicleModel ||
        (categoriaVeiculo === "MOTO" ? "Motocicleta" : "Veículo de Passeio");
      const licensePlate =
        trustProfile?.licensePlate || candidate?.licensePlate || "";
      const category = trustProfile?.category || (categoriaVeiculo === "MOTO" ? "Partiu Moto" : "Partiu Carro");
      const distanceMeters = candidate?.distanceMeters || 0;
      const distanceKm = Number((distanceMeters / 1000).toFixed(1));
      const etaMinutes = candidate?.etaMinutes || Math.max(1, Math.round(distanceKm * 2.5));

      return {
        id,
        name: fullName,
        firstName,
        avatarUrl,
        rating,
        category,
        vehicleModel,
        licensePlate,
        distanceKm,
        etaMinutes,
        dispatchStatus: status || "DRIVER_NOTIFIED",
        cascadeSecondsRemaining: cascadeSeconds ?? 12,
      };
    },
    [categoriaVeiculo]
  );

  // Efeito principal de sincronização reativa com transições suaves
  useEffect(() => {
    if (!isSearching || !progressiveSession) {
      setCurrentDriver(null);
      previousDriverIdRef.current = null;
      return;
    }

    const candidate = progressiveSession.currentCandidate;
    const trustProfile = progressiveSession.trustProfile;
    const cascadeSeconds = progressiveSession.cascadeSecondsRemaining;
    const status = progressiveSession.dispatchStatus;

    if (!candidate && !trustProfile) {
      if (status !== "DRIVER_DECLINED") {
        setCurrentDriver(null);
        previousDriverIdRef.current = null;
      }
      return;
    }

    const candidateId = candidate?.driverId || (candidate as any)?.id || trustProfile?.driverId || null;

    // Se houve troca de condutor, dispara animação suave de crossfade
    if (candidateId && candidateId !== previousDriverIdRef.current) {
      previousDriverIdRef.current = candidateId;
      setIsTransitioning(true);

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }

    const resolved = resolveCandidateData(candidate, trustProfile, cascadeSeconds, status);
    if (resolved) {
      setCurrentDriver(resolved);
    }
  }, [isSearching, progressiveSession, resolveCandidateData]);

  const [viewingDriver, setViewingDriver] = useState<any>(null);
  const [viewingDriversCount, setViewingDriversCount] = useState<number>(1);

  // Escuta delta updates do Live Ringing Engine e visualização de motorista em tempo real
  useEffect(() => {
    const handleDelta = (e: any) => {
      const delta = e.detail;
      if (!delta) return;

      if (delta.candidate || delta.trustProfile) {
        const resolved = resolveCandidateData(
          delta.candidate,
          delta.trustProfile,
          undefined,
          delta.dispatchStatus
        );
        if (resolved) {
          setCurrentDriver(resolved);
        }
      }
    };

    const handleViewing = (e: any) => {
      const detail = e.detail;
      if (detail?.viewingDriver) {
        setViewingDriver(detail.viewingDriver);
        setViewingDriversCount(detail.viewingDrivers?.length || 1);
      }
    };

    window.addEventListener("partiu:live_ringing_delta", handleDelta);
    window.addEventListener("partiu:driver_viewing_ride", handleViewing);

    return () => {
      window.removeEventListener("partiu:live_ringing_delta", handleDelta);
      window.removeEventListener("partiu:driver_viewing_ride", handleViewing);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    };
  }, [resolveCandidateData]);

  // Sincroniza visualização direta da sessão progressiva
  useEffect(() => {
    if (progressiveSession?.currentViewingDriver) {
      setViewingDriver(progressiveSession.currentViewingDriver);
      setViewingDriversCount(progressiveSession.viewingDrivers?.length || 1);
    }
  }, [progressiveSession?.currentViewingDriver, progressiveSession?.viewingDrivers]);

  const activeDisplayDriver = viewingDriver || currentDriver;

  return {
    isSearching,
    currentDriver: activeDisplayDriver,
    viewingDriver: activeDisplayDriver,
    viewingDriversCount: Math.max(1, viewingDriversCount, progressiveSession?.viewingDrivers?.length || 0),
    isViewing: Boolean(activeDisplayDriver),
    isTransitioning,
    hasActiveDriver: Boolean(activeDisplayDriver),
  };
}
