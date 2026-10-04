/**
 * ==============================================================================
 * 🎟️ PARTIU REVENUE OS — PROMOTIONAL COUPONS & CAMPAIGNS SERVICE
 * ==============================================================================
 * Validação, listagem e resgate de cupons de desconto conectados ao Painel Admin
 * (tabela campaigns_coupons e storage partiu_cupons_db) e ao perfil do passageiro.
 * ==============================================================================
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { silentCatchWarn } from "@/lib/structured-logger";

export interface ActiveCoupon {
  id: string;
  codigo: string;
  descontoDescricao: string;
  expiracao: string;
  ativo: boolean;
  tipo?: "porcentagem" | "fixo";
  valor?: number;
}

const STORAGE_CUPONS_KEY = "partiu_cupons_ativos_v1";
const STORAGE_CUPOM_APLICADO_KEY = "partiu_cupom_ativo";
const STORAGE_ADMIN_CUPONS_KEY = "partiu_cupons_db";

export class CouponService {
  private static instance: CouponService;

  private constructor() {}

  public static getInstance(): CouponService {
    if (!CouponService.instance) {
      CouponService.instance = new CouponService();
    }
    return CouponService.instance;
  }

  /**
   * Cupons salvos na carteira do usuário no dispositivo
   */
  public getLocalCoupons(): ActiveCoupon[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_CUPONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (err) {
      silentCatchWarn("CouponService", err);
    }
    return [];
  }

  public saveLocalCoupons(coupons: ActiveCoupon[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_CUPONS_KEY, JSON.stringify(coupons));
    } catch (err) {
      silentCatchWarn("CouponService", err);
    }
  }

  /**
   * Busca todas as promoções e cupons criados pelo Administrador no Painel
   */
  public async getAvailablePromotions(): Promise<ActiveCoupon[]> {
    const list: ActiveCoupon[] = [];
    const addedCodes = new Set<string>();

    // 1. Carrega do banco de cupons configurado pelo Admin no Painel (localStorage)
    if (typeof window !== "undefined") {
      try {
        const adminStored = localStorage.getItem(STORAGE_ADMIN_CUPONS_KEY);
        if (adminStored) {
          const parsed = JSON.parse(adminStored);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item.ativo && item.codigo && !addedCodes.has(item.codigo)) {
                addedCodes.add(item.codigo);
                list.push({
                  id: item.id || `cup-admin-${item.codigo}`,
                  codigo: item.codigo,
                  descontoDescricao:
                    item.descricao ||
                    (item.tipo === "porcentagem"
                      ? `${item.valor}% de desconto na corrida`
                      : `R$ ${Number(item.valor).toFixed(2).replace(".", ",")} de desconto`),
                  expiracao: item.expiraEm
                    ? `Válido até ${new Date(item.expiraEm).toLocaleDateString("pt-BR")}`
                    : "Promoção ativa",
                  ativo: true,
                  tipo: item.tipo,
                  valor: item.valor,
                });
              }
            }
          }
        }
      } catch (err) {
        silentCatchWarn("CouponService", err);
      }
    }

    // 2. Tenta sincronizar com Supabase campaigns_coupons se configurado
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any)
          .from("campaigns_coupons")
          .select("*")
          .eq("is_active", true);

        if (!error && data && Array.isArray(data)) {
          for (const camp of data) {
            const code = (camp.code || "").toUpperCase();
            if (code && !addedCodes.has(code)) {
              addedCodes.add(code);
              list.push({
                id: camp.id,
                codigo: code,
                descontoDescricao:
                  camp.description ||
                  (camp.discount_type === "PERCENT"
                    ? `${camp.discount_value}% de desconto`
                    : `R$ ${Number(camp.discount_value).toFixed(2).replace(".", ",")} de desconto`),
                expiracao: camp.valid_until
                  ? `Válido até ${new Date(camp.valid_until).toLocaleDateString("pt-BR")}`
                  : "Por tempo limitado",
                ativo: true,
                tipo: camp.discount_type === "PERCENT" ? "porcentagem" : "fixo",
                valor: Number(camp.discount_value) || 0,
              });
            }
          }
        }
      } catch (err) {
        silentCatchWarn("CouponService", err);
      }
    }

    // 3. Fallback inteligente de boas-vindas da cidade caso o admin ainda não tenha cadastrado
    if (list.length === 0) {
      list.push({
        id: "cup-welcome",
        codigo: "BEMVINDO",
        descontoDescricao: "R$ 5,00 OFF na sua primeira corrida com PARTIU",
        expiracao: "Válido para novos usuários",
        ativo: true,
        tipo: "fixo",
        valor: 5,
      });
    }

    return list;
  }

  /**
   * Lista cupons resgatados na conta do usuário
   */
  public async getActiveCoupons(userIdParam?: string): Promise<ActiveCoupon[]> {
    const local = this.getLocalCoupons();
    const session = supabaseAuthService.getStoredSession();
    const userId = userIdParam || session?.id;

    if (!isSupabaseConfigured() || !userId) {
      if (local.length === 0) {
        const promotions = await this.getAvailablePromotions();
        this.saveLocalCoupons(promotions);
        return promotions;
      }
      return local;
    }

    try {
      const { data, error } = await (supabase as any)
        .from("user_coupons")
        .select(`
          id,
          code,
          is_active,
          campaigns_coupons (
            description,
            valid_until,
            discount_type,
            discount_value
          )
        `)
        .eq("user_id", userId)
        .eq("is_active", true);

      if (!error && data && data.length > 0) {
        const cloudCoupons: ActiveCoupon[] = data.map((d: any) => ({
          id: d.id,
          codigo: d.code,
          descontoDescricao: d.campaigns_coupons?.description || "Desconto promocional aplicado",
          expiracao: d.campaigns_coupons?.valid_until
            ? `Válido até ${new Date(d.campaigns_coupons.valid_until).toLocaleDateString("pt-BR")}`
            : "Válido por 30 dias",
          ativo: d.is_active,
          tipo: d.campaigns_coupons?.discount_type === "PERCENT" ? "porcentagem" : "fixo",
          valor: Number(d.campaigns_coupons?.discount_value) || 0,
        }));

        const codigos = new Set(cloudCoupons.map((c) => c.codigo));
        const merged = [...cloudCoupons];
        for (const c of local) {
          if (!codigos.has(c.codigo)) {
            merged.push(c);
          }
        }

        this.saveLocalCoupons(merged);
        return merged;
      }
    } catch (err) {
      silentCatchWarn("CouponService", err);
    }

    if (local.length === 0) {
      const promotions = await this.getAvailablePromotions();
      this.saveLocalCoupons(promotions);
      return promotions;
    }

    return local;
  }

  /**
   * Valida código contra as promoções do Admin ou Supabase e associa na conta do passageiro
   */
  public async redeemCoupon(
    codigoParam: string,
    userIdParam?: string
  ): Promise<{ success: boolean; message: string; coupons: ActiveCoupon[] }> {
    const cleanCode = codigoParam.trim().toUpperCase().replace(/\s+/g, "");
    const local = this.getLocalCoupons();

    if (!cleanCode) {
      return { success: false, message: "Informe um código de cupom válido.", coupons: local };
    }

    if (local.some((c) => c.codigo === cleanCode)) {
      return { success: false, message: "Este cupom já está ativo em sua carteira.", coupons: local };
    }

    const promotions = await this.getAvailablePromotions();
    const promoFound = promotions.find((p) => p.codigo === cleanCode);

    const isReferralCode = /^[A-Z0-9_-]{4,15}$/.test(cleanCode) && (cleanCode.includes("10") || cleanCode.includes("5") || cleanCode.startsWith("IND") || cleanCode.startsWith("PARTIU"));

    if (!promoFound && !isReferralCode) {
      return {
        success: false,
        message: `O cupom "${cleanCode}" não foi encontrado ou expirou.`,
        coupons: local,
      };
    }

    const session = supabaseAuthService.getStoredSession();
    const userId = userIdParam || session?.id;

    let discountDesc = promoFound
      ? promoFound.descontoDescricao
      : "Desconto de indicação de amigo: R$ 5,00 OFF";

    if (isSupabaseConfigured() && userId && promoFound?.id) {
      try {
        await (supabase as any).from("user_coupons").insert({
          user_id: userId,
          coupon_id: promoFound.id.startsWith("cup-admin") ? null : promoFound.id,
          code: cleanCode,
          is_active: true,
        });
      } catch (err) {
        silentCatchWarn("CouponService", err);
      }
    }

    const newCoupon: ActiveCoupon = {
      id: `cup-${Date.now()}`,
      codigo: cleanCode,
      descontoDescricao: discountDesc,
      expiracao: promoFound?.expiracao || "Válido por 30 dias",
      ativo: true,
      tipo: promoFound?.tipo || "fixo",
      valor: promoFound?.valor || 5,
    };

    const updated = [newCoupon, ...local];
    this.saveLocalCoupons(updated);

    // Seleciona automaticamente para uso na próxima viagem
    this.applyCouponForRide(newCoupon);

    return {
      success: true,
      message: `Cupom ${cleanCode} aplicado com sucesso!`,
      coupons: updated,
    };
  }

  /**
   * Define o cupom ativo selecionado para a próxima corrida
   */
  public applyCouponForRide(coupon: ActiveCoupon): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_CUPOM_APLICADO_KEY, JSON.stringify(coupon));
      window.dispatchEvent(new CustomEvent("partiu:cupom-aplicado", { detail: coupon }));
    } catch (err) {
      silentCatchWarn("CouponService", err);
    }
  }

  /**
   * Obtém o cupom ativo selecionado
   */
  public getActiveRideCoupon(): ActiveCoupon | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_CUPOM_APLICADO_KEY);
      if (stored) return JSON.parse(stored);
    } catch (err) {
      silentCatchWarn("CouponService", err);
    }
    return null;
  }

  /**
   * Limpa o cupom ativo após a corrida
   */
  public clearActiveRideCoupon(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_CUPOM_APLICADO_KEY);
      window.dispatchEvent(new CustomEvent("partiu:cupom-removido"));
    } catch (err) {
      silentCatchWarn("CouponService", err);
    }
  }
}

export const couponService = CouponService.getInstance();
