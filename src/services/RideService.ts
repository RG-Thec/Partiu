/**
 * ==============================================================================
 * 🚗 PARTIU REVENUE OS — RIDE & DELIVERY HISTORY SERVICE
 * ==============================================================================
 * Serviço unificado para consulta de atividades do passageiro (corridas urbanas
 * e entregas com duplo PIN) conectado à tabela oficial public.rides.
 * ==============================================================================
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";

export interface UserActivityItem {
  id: string;
  tipo: "corrida" | "entrega";
  categoria: string;
  data: string;
  origem: string;
  destino: string;
  valor: number;
  status: "concluida" | "cancelada" | "em_andamento";
  motorista: string;
  veiculo: string;
  pinSeguranca?: string;
  createdTimestamp: number;
}

export class RideService {
  private static instance: RideService;

  private constructor() {}

  public static getInstance(): RideService {
    if (!RideService.instance) {
      RideService.instance = new RideService();
    }
    return RideService.instance;
  }

  /**
   * Busca o histórico autêntico de corridas e entregas ordenado pelas mais recentes.
   * Se o usuário não tiver corridas, retorna lista vazia para exibição do Empty State.
   */
  public async getUserActivityHistory(userIdParam?: string): Promise<UserActivityItem[]> {
    const session = supabaseAuthService.getStoredSession();
    const userId = userIdParam || session?.id;

    // Se houver corridas salvas no cache de sessão offline/local, carrega-as
    const localRides: UserActivityItem[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("partiu_offline_rides_history");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localRides.push(...parsed);
          }
        }
      } catch {
        // ignore
      }
    }

    if (!isSupabaseConfigured()) {
      return localRides;
    }

    try {
      // 1. Busca corridas reais do passageiro na tabela public.rides
      let ridesQuery = (supabase as any)
        .from("rides")
        .select(`
          id,
          category,
          status,
          pickup_address,
          destination_address,
          fare_brl,
          created_at,
          driver_id,
          is_delivery,
          pickup_otp,
          delivery_otp
        `)
        .order("created_at", { ascending: false })
        .limit(30);

      if (userId && !userId.startsWith("usr-pax-demo")) {
        ridesQuery = ridesQuery.eq("passenger_id", userId);
      }

      const { data: rides, error: errRides } = await ridesQuery;

      if (errRides || !rides || rides.length === 0) {
        return localRides;
      }

      const items: UserActivityItem[] = rides.map((c: any) => {
        const isEntrega = Boolean(c.is_delivery || c.category?.includes("ENTREGA") || c.category?.includes("FLASH"));
        const valorReal = Number(c.fare_brl || 0);
        const dataObj = new Date(c.created_at || Date.now());
        const dataFormatada = dataObj.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });

        const statusMap: Record<string, "concluida" | "cancelada" | "em_andamento"> = {
          COMPLETED: "concluida",
          CONCLUIDA: "concluida",
          CANCELLED: "cancelada",
          CANCELADA: "cancelada",
          TIMEOUT: "cancelada",
          IN_PROGRESS: "em_andamento",
          EM_VIAGEM: "em_andamento",
          DRIVER_ASSIGNED: "em_andamento",
          DRIVER_ARRIVING: "em_andamento",
          A_CAMINHO: "em_andamento",
          SEARCHING_R1: "em_andamento",
          SEARCHING_R2: "em_andamento",
          SEARCHING_R3: "em_andamento",
          REQUESTED: "em_andamento",
          PROCURANDO: "em_andamento",
        };

        const catFormatada = isEntrega
          ? "PARTIU Flash Entrega"
          : c.category === "MOTO" || c.category === "PARTIU_MOTO"
          ? "PARTIU Moto"
          : "PARTIU Pop";

        return {
          id: c.id,
          tipo: isEntrega ? "entrega" : "corrida",
          categoria: catFormatada,
          data: dataFormatada,
          origem: c.pickup_address || "Ponto de Partida",
          destino: c.destination_address || "Destino Final",
          valor: valorReal,
          status: statusMap[c.status] || "concluida",
          motorista: c.driver_id ? "Motorista Parceiro" : "Buscando Condutor",
          veiculo: "Veículo Verificado",
          pinSeguranca: c.pickup_otp || undefined,
          createdTimestamp: dataObj.getTime(),
        };
      });

      return items;
    } catch {
      return localRides;
    }
  }

  /**
   * Registra uma atividade no histórico local (para resposta instantânea otimista)
   */
  public saveOptimisticActivity(item: UserActivityItem): void {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("partiu_offline_rides_history");
      const list: UserActivityItem[] = stored ? JSON.parse(stored) : [];
      list.unshift(item);
      localStorage.setItem("partiu_offline_rides_history", JSON.stringify(list.slice(0, 30)));
    } catch {
      // storage resiliente
    }
  }
}

export const rideService = RideService.getInstance();
