/**
 * ==============================================================================
 * 🏛️ PARTIU MOBILIDADE URBANA & ENTREGAS — UNIFIED DATA LAYER
 * ==============================================================================
 * Camada de dados centralizada conectada às tabelas oficiais public.rides,
 * profiles, driver_withdrawals e alertas_sos com suporte a Supabase Realtime.
 * ==============================================================================
 */

import { useEffect } from "react";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

// Re-exporta compatibilidade operacional
export * from "./partiu-fleet-db";

export interface PartiuRideRecord {
  id: string;
  tenant_id?: string;
  passenger_id: string;
  passenger_name: string;
  passenger_phone?: string;
  driver_id?: string | null;
  driver_name?: string | null;
  category: "CARRO" | "MOTO" | "PARTIU_MOTO" | "PARTIU_CARRO" | "POP" | "ENTREGA" | string;
  status:
    | "REQUESTED"
    | "SEARCHING_R1"
    | "SEARCHING_R2"
    | "SEARCHING_R3"
    | "DRIVER_ASSIGNED"
    | "DRIVER_ARRIVING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "TIMEOUT"
    | "CANCELLED";
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  destination_lat: number;
  destination_lng: number;
  destination_address: string;
  fare_brl: number;
  distance_km: number;
  duration_minutes: number;
  payment_method: "pix" | "dinheiro" | "cartao" | string;
  is_delivery?: boolean;
  pickup_otp?: string;
  delivery_otp?: string;
  created_at: string;
}

export const CHAVES_PARTIU_RIDES = ["admin", "partiu_rides"] as const;

/**
 * Hook para consulta de todas as corridas reais urbanas na tabela public.rides
 */
export function usePartiuRides(limit: number = 50): UseQueryResult<PartiuRideRecord[]> {
  return useQuery({
    queryKey: [...CHAVES_PARTIU_RIDES, limit],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return [];
      }
      try {
        const { data, error } = await (supabase as any)
          .from("rides")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          console.warn("[partiu-db] Erro ao carregar rides:", error.message);
          return [];
        }
        return (data || []) as PartiuRideRecord[];
      } catch {
        return [];
      }
    },
    staleTime: 5000,
  });
}

/**
 * Subscrição em tempo real na tabela public.rides para atualizar o painel admin
 */
export function usePartiuRidesRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let channel: any = null;
    try {
      const channelId = `admin_rides_live_${Math.random().toString(36).substring(2, 9)}`;
      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rides",
          },
          () => {
            void qc.invalidateQueries({ queryKey: CHAVES_PARTIU_RIDES });
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("Falha ao registrar canal de rides:", err);
    }

    return () => {
      if (channel) {
        try {
          void supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [qc]);
}

export interface PartiuAdminMetrics {
  receitaHoje: number;
  corridasEmAndamento: number;
  corridasFinalizadasHoje: number;
  motoristasOnline: number;
  entregasEmAndamento: number;
  chamadosSOSAtivos: number;
}

/**
 * Hook com métricas autênticas sem mocks ilusórios
 */
export function usePartiuMetrics(rides: PartiuRideRecord[], sosCount: number, onlineDriversCount: number): PartiuAdminMetrics {
  const todayStr = new Date().toISOString().slice(0, 10);

  const ridesToday = rides.filter((r) => r.created_at && r.created_at.startsWith(todayStr));

  const receitaHoje = ridesToday
    .filter((r) => r.status === "COMPLETED")
    .reduce((acc, r) => acc + (Number(r.fare_brl) || 0), 0);

  const corridasEmAndamento = rides.filter((r) =>
    ["REQUESTED", "SEARCHING_R1", "SEARCHING_R2", "SEARCHING_R3", "DRIVER_ASSIGNED", "DRIVER_ARRIVING", "IN_PROGRESS"].includes(r.status) &&
    !r.is_delivery
  ).length;

  const entregasEmAndamento = rides.filter((r) =>
    ["REQUESTED", "SEARCHING_R1", "SEARCHING_R2", "SEARCHING_R3", "DRIVER_ASSIGNED", "DRIVER_ARRIVING", "IN_PROGRESS"].includes(r.status) &&
    r.is_delivery
  ).length;

  const corridasFinalizadasHoje = ridesToday.filter((r) => r.status === "COMPLETED").length;

  return {
    receitaHoje,
    corridasEmAndamento,
    corridasFinalizadasHoje,
    motoristasOnline: onlineDriversCount,
    entregasEmAndamento,
    chamadosSOSAtivos: sosCount,
  };
}
