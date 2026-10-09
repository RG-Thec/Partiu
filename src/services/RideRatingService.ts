/**
 * ==============================================================================
 * ⭐ PARTIU SOCIAL SAFETY & QUALITATIVE REPUTATION ENGINE (PADRÃO 99)
 * ==============================================================================
 * Sistema de avaliações mútuas com notas de 1 a 5 estrelas e chips qualitativos
 * com tags de elogios e pontos de melhoria, alimentando o score de reputação.
 * ==============================================================================
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { silentCatchWarn } from "@/lib/structured-logger";
import { useQuery } from "@tanstack/react-query";

export type RatingRole = "PASSENGER_TO_DRIVER" | "DRIVER_TO_PASSENGER";

export interface RideRating {
  id: string;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  role: RatingRole;
  score: number; // 1 a 5
  tags: string[];
  comment?: string | null;
  tenantId: string;
  createdAt: string;
}

export interface SubmitRatingInput {
  rideId: string;
  fromUserId: string;
  toUserId: string;
  role: RatingRole;
  score: number;
  tags: string[];
  comment?: string;
  tenantId?: string;
}

export const TAGS_99_PASSENGER_TO_DRIVER_POSITIVE = [
  "Carro limpo",
  "Ar-condicionado ligado",
  "Direção segura",
  "Excelente conversa",
  "Música agradável",
  "Veículo cheiroso",
  "Rota rápida",
  "Gentil e educado",
];

export const TAGS_99_PASSENGER_TO_DRIVER_IMPROVEMENT = [
  "Direção brusca",
  "Carro sujo",
  "Não ligou o ar",
  "Desvio de trajeto",
  "Celular ao volante",
  "Música alta",
];

export const TAGS_99_DRIVER_TO_PASSENGER = [
  "Pontual no embarque",
  "Gentil e educado",
  "Local de fácil parada",
  "Respeitou o veículo",
  "Excelente passageiro",
];

export class RideRatingService {
  private static instance: RideRatingService;
  private localRatings: Map<string, RideRating> = new Map();

  private constructor() {}

  public static getInstance(): RideRatingService {
    if (!RideRatingService.instance) {
      RideRatingService.instance = new RideRatingService();
    }
    return RideRatingService.instance;
  }

  /**
   * Envia uma avaliação mútua
   */
  public async submitRating(input: SubmitRatingInput): Promise<RideRating> {
    const id = `rate-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    const rating: RideRating = {
      id,
      rideId: input.rideId,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      role: input.role,
      score: Math.min(Math.max(Math.round(input.score), 1), 5),
      tags: input.tags || [],
      comment: input.comment || null,
      tenantId: input.tenantId || "default",
      createdAt: now,
    };

    // Salva no store em memória
    this.localRatings.set(rating.id, rating);

    // Recalcula imediatamente a média atualizada do usuário avaliado
    let newAverage = rating.score;
    try {
      const summary = await this.getUserRatingSummary(rating.toUserId);
      if (summary.totalRatings > 0) {
        newAverage = summary.averageScore;
      }
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await (supabase as any).from("ride_ratings").insert({
          id: rating.id,
          ride_id: rating.rideId,
          from_user_id: rating.fromUserId,
          to_user_id: rating.toUserId,
          role: rating.role,
          score: rating.score,
          tags: rating.tags,
          comment: rating.comment,
          tenant_id: rating.tenantId,
          created_at: rating.createdAt,
        });

        if (error) {
          silentCatchWarn("RideRatingService.submitRating", error);
        } else {
          // Atualização de contingência direta na tabela correspondente
          if (rating.role === "DRIVER_TO_PASSENGER") {
            void (supabase as any)
              .from("partiu_passageiros")
              .update({ rating: newAverage, updated_at: now })
              .or(`user_id.eq.${rating.toUserId},id.eq.${rating.toUserId}`);
            void (supabase as any)
              .from("profiles")
              .update({ rating: newAverage, updated_at: now })
              .eq("id", rating.toUserId);
          } else if (rating.role === "PASSENGER_TO_DRIVER") {
            void (supabase as any)
              .from("partiu_motoristas")
              .update({ rating: newAverage, updated_at: now })
              .or(`user_id.eq.${rating.toUserId},id.eq.${rating.toUserId}`);
            void (supabase as any)
              .from("profiles")
              .update({ rating: newAverage, updated_at: now })
              .eq("id", rating.toUserId);
          }
        }
      } catch (err) {
        silentCatchWarn("RideRatingService.submitRating", err);
      }
    }

    // Se o usuário avaliado for o usuário ativo localmente, atualiza cache e emite evento
    if (typeof window !== "undefined") {
      const currentUserId = localStorage.getItem("partiu_user_id") || localStorage.getItem("partiu_user_phone");
      if (currentUserId && (currentUserId === rating.toUserId || rating.toUserId.includes(currentUserId))) {
        try {
          localStorage.setItem("partiu_user_rating", String(newAverage));
        } catch {}
      }
      window.dispatchEvent(new CustomEvent("partiu:user-profile-updated", { detail: { rating: newAverage } }));
      window.dispatchEvent(new CustomEvent("partiu:rating-submitted", { detail: rating }));
    }

    return rating;
  }

  /**
   * Obtém histórico e média calculada de um condutor ou passageiro
   */
  public async getUserRatingSummary(toUserId: string): Promise<{
    averageScore: number;
    totalRatings: number;
    topTags: { tag: string; count: number }[];
    recentRatings: RideRating[];
  }> {
    let list: RideRating[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await (supabase as any)
          .from("ride_ratings")
          .select("*")
          .eq("to_user_id", toUserId)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          list = data.map(this.mapRowToRating);
        }
      } catch (err) {
        silentCatchWarn("RideRatingService.getUserRatingSummary", err);
      }
    }

    if (list.length === 0) {
      list = Array.from(this.localRatings.values()).filter((r) => r.toUserId === toUserId);
    }

    if (list.length === 0) {
      return {
        averageScore: 5.0,
        totalRatings: 0,
        topTags: [],
        recentRatings: [],
      };
    }

    const total = list.length;
    const sum = list.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = Math.round((sum / total) * 100) / 100;

    // Contagem de frequência de tags
    const tagCountMap = new Map<string, number>();
    for (const r of list) {
      for (const t of r.tags) {
        tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1);
      }
    }

    const topTags = Array.from(tagCountMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      averageScore,
      totalRatings: total,
      topTags,
      recentRatings: list.slice(0, 10),
    };
  }

  private mapRowToRating(row: any): RideRating {
    return {
      id: row.id,
      rideId: row.ride_id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      role: row.role,
      score: row.score,
      tags: row.tags || [],
      comment: row.comment,
      tenantId: row.tenant_id,
      createdAt: row.created_at,
    };
  }

  private ensureSeedRatings(): void {
    if (this.localRatings.size > 0) return;
    const seeds: RideRating[] = [
      {
        id: "rate-001",
        rideId: "ride_8921",
        fromUserId: "Juliana Peixoto",
        toUserId: "Motorista Parceiro",
        role: "PASSENGER_TO_DRIVER",
        score: 1,
        tags: ["Direção brusca", "Não ligou o ar"],
        comment: "Motorista acelerou além do limite na Av. Fernandes Lima e recusou ligar o ar-condicionado.",
        tenantId: "default",
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
      {
        id: "rate-002",
        rideId: "ride_8920",
        fromUserId: "Rodrigo Vasconcelos",
        toUserId: "Marcos Lima",
        role: "PASSENGER_TO_DRIVER",
        score: 5,
        tags: ["Carro limpo", "Direção segura", "Gentil e educado"],
        comment: "Excelente corrida! Motorista muito atencioso, veículo impecável e direção suave.",
        tenantId: "default",
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
      {
        id: "rate-003",
        rideId: "ride_8919",
        fromUserId: "Motorista Parceiro",
        toUserId: "Helena Castro",
        role: "DRIVER_TO_PASSENGER",
        score: 2,
        tags: ["Local de difícil parada"],
        comment: "Passageiro demorou quase 8 minutos para embarcar em vaga de trânsito intenso proibida.",
        tenantId: "default",
        createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      },
      {
        id: "rate-004",
        rideId: "ride_8918",
        fromUserId: "Lucas Prado",
        toUserId: "Renato Santos",
        role: "PASSENGER_TO_DRIVER",
        score: 2,
        tags: ["Desvio de trajeto"],
        comment: "Fez um retorno desnecessário que aumentou o tempo da viagem em 12 minutos.",
        tenantId: "default",
        createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
      },
      {
        id: "rate-005",
        rideId: "ride_8917",
        fromUserId: "Marcos Lima",
        toUserId: "Mariana Alencar",
        role: "DRIVER_TO_PASSENGER",
        score: 5,
        tags: ["Pontual no embarque", "Excelente passageiro"],
        comment: "Passageiro nota 10, aguardava no ponto exato e foi muito gentil.",
        tenantId: "default",
        createdAt: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
      },
      {
        id: "rate-006",
        rideId: "ride_8916",
        fromUserId: "Camila Duarte",
        toUserId: "Fabio Henrique",
        role: "PASSENGER_TO_DRIVER",
        score: 5,
        tags: ["Veículo cheiroso", "Música agradável", "Ar-condicionado ligado"],
        comment: "Melhor experiência de corrida na cidade. Super recomendo!",
        tenantId: "default",
        createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      },
    ];
    for (const r of seeds) {
      this.localRatings.set(r.id, r);
    }
  }

  public async getAllRatings(limit = 100): Promise<RideRating[]> {
    this.ensureSeedRatings();
    let list: RideRating[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await (supabase as any)
          .from("ride_ratings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          list = data.map(this.mapRowToRating);
        }
      } catch (err) {
        silentCatchWarn("RideRatingService.getAllRatings", err);
      }
    }

    if (list.length === 0) {
      list = Array.from(this.localRatings.values());
    }

    return list.slice(0, limit);
  }

  public resetLocalStore(): void {
    this.localRatings.clear();
  }
}

export const rideRatingService = RideRatingService.getInstance();

export function useRideRatings(limit: number = 100) {
  return useQuery({
    queryKey: ["admin", "ride_ratings", limit],
    queryFn: () => rideRatingService.getAllRatings(limit),
  });
}
