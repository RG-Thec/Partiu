/**
 * ==============================================================================
 * 🎟️ PARTIU REVENUE OS — PROMOTIONAL COUPONS & CAMPAIGNS SERVICE
 * ==============================================================================
 * Validação, listagem e resgate de cupons de desconto conectados ao Painel Admin
 * (tabela campaigns_coupons e storage partiu_cupons_db) e ao perfil do passageiro.
 * Sincronização em tempo real entre Super Admin, Franqueados e Aplicativo.
 * ==============================================================================
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { silentCatchWarn } from "@/lib/structured-logger";
import { WhiteLabelEngine } from "@/lib/white-label/white-label-engine";

export interface ActiveCoupon {
  id: string;
  codigo: string;
  descontoDescricao: string;
  expiracao: string;
  ativo: boolean;
  tipo: "porcentagem" | "fixo";
  valor: number;
  minTripCents?: number;
  maxRedemptions?: number;
  redeemedCount?: number;
  validUntil?: string;
  tenantId?: string;
}

export interface NewCouponPayload {
  id?: string;
  codigo: string;
  descricao?: string;
  tipo: "porcentagem" | "fixo";
  valor: number;
  minTripCents?: number;
  maxRedemptions?: number;
  validoAte?: string;
  ativo?: boolean;
  tenantId?: string;
}

const STORAGE_CUPONS_KEY = "partiu_cupons_ativos_v1";
const STORAGE_CUPOM_APLICADO_KEY = "partiu_cupom_ativo";
const STORAGE_ADMIN_CUPONS_KEY = "partiu_cupons_db";

const DEFAULT_SEEDED_COUPONS: ActiveCoupon[] = [
  {
    id: "cup-welcome-20",
    codigo: "BEMVINDO20",
    descontoDescricao: "20% OFF na sua corrida de estreia no PARTIU",
    expiracao: "Válido para novos usuários",
    ativo: true,
    tipo: "porcentagem",
    valor: 20,
    maxRedemptions: 500,
    redeemedCount: 184,
    tenantId: "tenant-itaperuna",
  },
  {
    id: "cup-partiu-10",
    codigo: "PARTIU10",
    descontoDescricao: "R$ 10,00 de desconto em corridas ou entregas",
    expiracao: "Válido até 31/12/2026",
    ativo: true,
    tipo: "fixo",
    valor: 10,
    minTripCents: 1500,
    maxRedemptions: 1000,
    redeemedCount: 720,
    tenantId: "tenant-itaperuna",
  },
  {
    id: "cup-partiu-5",
    codigo: "PARTIU5",
    descontoDescricao: "R$ 5,00 OFF em qualquer corrida",
    expiracao: "Promoção ativa",
    ativo: true,
    tipo: "fixo",
    valor: 5,
    maxRedemptions: 1000,
    redeemedCount: 310,
    tenantId: "tenant-itaperuna",
  },
];

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
   * Cupons salvos na carteira do usuário no dispositivo local
   */
  public getLocalCoupons(): ActiveCoupon[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_CUPONS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (err) {
      silentCatchWarn("CouponService:getLocalCoupons", err);
    }
    return [];
  }

  public saveLocalCoupons(coupons: ActiveCoupon[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_CUPONS_KEY, JSON.stringify(coupons));
    } catch (err) {
      silentCatchWarn("CouponService:saveLocalCoupons", err);
    }
  }

  /**
   * Obtém o tenant_id efetivo da operação atual
   */
  public getEffectiveTenantId(tenantId?: string): string {
    if (tenantId && tenantId.trim().length > 0) return tenantId.trim();
    try {
      return WhiteLabelEngine.getInstance().getActiveTenantId();
    } catch {
      return "tenant-itaperuna";
    }
  }

  /**
   * Lista todos os cupons gerenciados pelo Administrador filtrados por praça/tenant
   */
  public async listAdminCoupons(tenantId?: string): Promise<ActiveCoupon[]> {
    const effectiveTenantId = this.getEffectiveTenantId(tenantId);
    const map = new Map<string, ActiveCoupon>();

    // 1. Injeta os sementes oficiais iniciais apenas se coincidirem com o tenant ou tenant default
    for (const c of DEFAULT_SEEDED_COUPONS) {
      if (!c.tenantId || c.tenantId === effectiveTenantId || effectiveTenantId === "all") {
        map.set(c.codigo, { ...c, tenantId: c.tenantId || effectiveTenantId });
      }
    }

    // 2. Mescla com o armazenamento local do administrador para este tenant
    const hasStorage = typeof window !== "undefined" || typeof localStorage !== "undefined";
    if (hasStorage) {
      try {
        const store = typeof window !== "undefined" ? window.localStorage : localStorage;
        const tenantKey = `${STORAGE_ADMIN_CUPONS_KEY}_${effectiveTenantId}`;
        const stored = store.getItem(tenantKey) || (effectiveTenantId === "tenant-itaperuna" ? store.getItem(STORAGE_ADMIN_CUPONS_KEY) : null);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              const code = (item.codigo || item.code || "").toUpperCase().trim();
              if (code && (!item.tenantId || item.tenantId === effectiveTenantId || effectiveTenantId === "all")) {
                map.set(code, {
                  id: item.id || `cup-admin-${code}`,
                  codigo: code,
                  descontoDescricao:
                    item.descricao ||
                    item.descontoDescricao ||
                    (item.tipo === "porcentagem"
                      ? `${item.valor}% de desconto`
                      : `R$ ${Number(item.valor).toFixed(2).replace(".", ",")} OFF`),
                  expiracao: item.expiraEm || item.expiracao || "Válido até 31/12/2026",
                  ativo: item.ativo !== false && (item as any).isActive !== false,
                  tipo: item.tipo === "porcentagem" || item.discount_type === "PERCENT" ? "porcentagem" : "fixo",
                  valor: Number(item.valor || item.discount_value) || 5,
                  minTripCents: item.minTripCents || item.min_trip_cents || 0,
                  maxRedemptions: item.maxRedemptions || item.max_redemptions || 1000,
                  redeemedCount: item.redeemedCount || item.redeemed_count || 0,
                  tenantId: item.tenantId || effectiveTenantId,
                });
              }
            }
          }
        }
      } catch (err) {
        silentCatchWarn("CouponService:listAdminCoupons:local", err);
      }
    }

    // 3. Tenta sincronizar com a tabela campaigns_coupons do Supabase com filtro de tenant
    if (isSupabaseConfigured()) {
      try {
        let query = (supabase as any)
          .from("campaigns_coupons")
          .select("*");

        if (effectiveTenantId && effectiveTenantId !== "all") {
          query = query.or(`tenant_id.eq.${effectiveTenantId},tenant_id.is.null`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (!error && data && Array.isArray(data)) {
          for (const camp of data) {
            const code = (camp.code || "").toUpperCase().trim();
            if (code) {
              const localOverride = map.get(code);
              map.set(code, {
                id: localOverride?.id || camp.id,
                codigo: code,
                descontoDescricao:
                  camp.description ||
                  localOverride?.descontoDescricao ||
                  (camp.discount_type === "PERCENT"
                    ? `${camp.discount_value}% de desconto na corrida`
                    : `R$ ${Number(camp.discount_value).toFixed(2).replace(".", ",")} de desconto`),
                expiracao: camp.valid_until
                  ? `Válido até ${new Date(camp.valid_until).toLocaleDateString("pt-BR")}`
                  : "Promoção ativa",
                ativo: localOverride !== undefined ? localOverride.ativo : camp.is_active !== false,
                tipo: camp.discount_type === "PERCENT" ? "porcentagem" : "fixo",
                valor: Number(camp.discount_value) || 0,
                minTripCents: camp.min_trip_cents || 0,
                maxRedemptions: camp.max_redemptions || 1000,
                redeemedCount: camp.redeemed_count || 0,
                validUntil: camp.valid_until,
                tenantId: camp.tenant_id || effectiveTenantId,
              });
            }
          }
        }
      } catch (err) {
        silentCatchWarn("CouponService:listAdminCoupons:supabase", err);
      }
    }

    const resultado = Array.from(map.values());

    // Atualiza cache local sincronizado para este tenant
    if (hasStorage && effectiveTenantId !== "all") {
      try {
        const store = typeof window !== "undefined" ? window.localStorage : localStorage;
        store.setItem(`${STORAGE_ADMIN_CUPONS_KEY}_${effectiveTenantId}`, JSON.stringify(resultado));
      } catch {}
    }

    return resultado;
  }

  /**
   * Salva ou cria um novo cupom no Painel Administrativo com isolamento de tenant
   */
  public async saveAdminCoupon(payload: NewCouponPayload | any, tenantIdParam?: string): Promise<ActiveCoupon> {
    const rawCode = payload.codigo || payload.code || "";
    const cleanCode = String(rawCode).trim().toUpperCase().replace(/\s+/g, "");
    const rawTipo = payload.tipo || payload.discountType;
    const tipo = rawTipo === "porcentagem" || rawTipo === "PERCENT" ? "porcentagem" : "fixo";
    const valor = Number(payload.valor !== undefined ? payload.valor : payload.discountValue) || 5;
    const desc =
      payload.descricao?.trim() ||
      payload.description?.trim() ||
      (tipo === "porcentagem"
        ? `${valor}% OFF em corridas urbanas`
        : `R$ ${valor.toFixed(2).replace(".", ",")} de desconto na corrida`);
    const validoAte = payload.validoAte || payload.validUntil;
    const effectiveTenantId = payload.tenantId || tenantIdParam || this.getEffectiveTenantId();

    const novoCupom: ActiveCoupon = {
      id: payload.id || `cup-${Date.now()}`,
      codigo: cleanCode,
      descontoDescricao: desc,
      expiracao: validoAte ? `Válido até ${new Date(validoAte).toLocaleDateString("pt-BR")}` : "Válido até 31/12/2026",
      ativo: payload.ativo !== false && payload.isActive !== false,
      tipo,
      valor,
      minTripCents: payload.minTripCents || payload.min_trip_cents || 0,
      maxRedemptions: payload.maxRedemptions || payload.max_redemptions || 500,
      redeemedCount: payload.redeemedCount || payload.redeemed_count || 0,
      validUntil: validoAte,
      tenantId: effectiveTenantId,
    };

    // 1. Persistência remota no Supabase com tenant_id
    if (isSupabaseConfigured()) {
      try {
        await (supabase as any)
          .from("campaigns_coupons")
          .upsert(
            {
              code: cleanCode,
              description: desc,
              discount_type: tipo === "porcentagem" ? "PERCENT" : "FIXED_CENTS",
              discount_value: valor,
              min_trip_cents: payload.minTripCents || 0,
              max_redemptions: payload.maxRedemptions || 500,
              is_active: novoCupom.ativo,
              tenant_id: effectiveTenantId,
              valid_until: validoAte ? new Date(validoAte).toISOString() : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "code" }
          );
      } catch (err) {
        silentCatchWarn("CouponService:saveAdminCoupon:supabase", err);
      }
    }

    // 2. Persistência no armazenamento local isolado por tenant
    const atuais = await this.listAdminCoupons(effectiveTenantId);
    const filtrados = atuais.filter((c) => c.codigo !== cleanCode);
    const atualizados = [novoCupom, ...filtrados];

    const hasStorage = typeof window !== "undefined" || typeof localStorage !== "undefined";
    if (hasStorage) {
      try {
        const store = typeof window !== "undefined" ? window.localStorage : localStorage;
        store.setItem(`${STORAGE_ADMIN_CUPONS_KEY}_${effectiveTenantId}`, JSON.stringify(atualizados));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("partiu:cupons-atualizados", { detail: atualizados }));
        }
      } catch {}
    }

    return novoCupom;
  }

  /**
   * Alterna status Ativo/Inativo de um cupom
   */
  public async toggleAdminCoupon(identificador: string, novoStatus: boolean, tenantIdParam?: string): Promise<boolean> {
    const effectiveTenantId = this.getEffectiveTenantId(tenantIdParam);
    const clean = String(identificador).trim().toUpperCase();
    const atuais = await this.listAdminCoupons(effectiveTenantId);
    const cupomAlvo = atuais.find((c) => c.codigo.toUpperCase() === clean || c.id === identificador);
    const codeParaAtualizar = cupomAlvo ? cupomAlvo.codigo : clean;

    if (isSupabaseConfigured()) {
      try {
        await (supabase as any)
          .from("campaigns_coupons")
          .update({ is_active: novoStatus, updated_at: new Date().toISOString() })
          .eq("code", codeParaAtualizar);
      } catch (err) {
        silentCatchWarn("CouponService:toggleAdminCoupon:supabase", err);
      }
    }

    const atualizados = atuais.map((c) =>
      c.codigo.toUpperCase() === clean || c.id === identificador || (cupomAlvo && c.codigo === cupomAlvo.codigo)
        ? { ...c, ativo: novoStatus }
        : c
    );

    const hasStorage = typeof window !== "undefined" || typeof localStorage !== "undefined";
    if (hasStorage) {
      try {
        const store = typeof window !== "undefined" ? window.localStorage : localStorage;
        store.setItem(`${STORAGE_ADMIN_CUPONS_KEY}_${effectiveTenantId}`, JSON.stringify(atualizados));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("partiu:cupons-atualizados", { detail: atualizados }));
        }
      } catch {}
    }

    return true;
  }

  /**
   * Remove um cupom do painel administrativo
   */
  public async deleteAdminCoupon(identificador: string, tenantIdParam?: string): Promise<boolean> {
    const effectiveTenantId = this.getEffectiveTenantId(tenantIdParam);
    const clean = String(identificador).trim().toUpperCase();
    const atuais = await this.listAdminCoupons(effectiveTenantId);
    const cupomAlvo = atuais.find((c) => c.codigo.toUpperCase() === clean || c.id === identificador);
    const codeParaDeletar = cupomAlvo ? cupomAlvo.codigo : clean;

    if (isSupabaseConfigured()) {
      try {
        await (supabase as any)
          .from("campaigns_coupons")
          .delete()
          .eq("code", codeParaDeletar);
      } catch (err) {
        silentCatchWarn("CouponService:deleteAdminCoupon:supabase", err);
      }
    }

    const atualizados = atuais.filter(
      (c) => c.codigo.toUpperCase() !== clean && c.id !== identificador && (!cupomAlvo || c.codigo !== cupomAlvo.codigo)
    );

    const hasStorage = typeof window !== "undefined" || typeof localStorage !== "undefined";
    if (hasStorage) {
      try {
        const store = typeof window !== "undefined" ? window.localStorage : localStorage;
        store.setItem(`${STORAGE_ADMIN_CUPONS_KEY}_${effectiveTenantId}`, JSON.stringify(atualizados));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("partiu:cupons-atualizados", { detail: atualizados }));
        }
      } catch {}
    }

    return true;
  }

  /**
   * Busca todas as promoções e cupons disponíveis para resgate na praça/tenant
   */
  public async getAvailablePromotions(tenantId?: string): Promise<ActiveCoupon[]> {
    const todos = await this.listAdminCoupons(tenantId);
    return todos.filter((c) => c.ativo);
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
      silentCatchWarn("CouponService:getActiveCoupons", err);
    }

    if (local.length === 0) {
      const promotions = await this.getAvailablePromotions();
      this.saveLocalCoupons(promotions);
      return promotions;
    }

    return local;
  }

  /**
   * Valida código contra as promoções do Admin ou Supabase e associa na conta do passageiro,
   * respeitando o isolamento estrito de praça/tenant
   */
  public async redeemCoupon(
    codigoParam: string,
    userIdParam?: string,
    tenantIdParam?: string
  ): Promise<{ success: boolean; message: string; coupons: ActiveCoupon[] }> {
    const cleanCode = codigoParam.trim().toUpperCase().replace(/\s+/g, "");
    const local = this.getLocalCoupons();
    const effectiveTenantId = this.getEffectiveTenantId(tenantIdParam);

    if (!cleanCode) {
      return { success: false, message: "Informe um código de cupom válido.", coupons: local };
    }

    if (local.some((c) => c.codigo === cleanCode && (!c.tenantId || c.tenantId === effectiveTenantId))) {
      return { success: false, message: "Este cupom já está ativo em sua carteira.", coupons: local };
    }

    const promotions = await this.getAvailablePromotions(effectiveTenantId);
    const promoFound = promotions.find(
      (p) => p.codigo === cleanCode && (!p.tenantId || p.tenantId === effectiveTenantId)
    );

    const isReferralCode =
      /^[A-Z0-9_-]{4,15}$/.test(cleanCode) &&
      (cleanCode.includes("10") || cleanCode.includes("5") || cleanCode.startsWith("IND") || cleanCode.startsWith("PARTIU"));

    if (!promoFound && !isReferralCode) {
      return {
        success: false,
        message: `O cupom "${cleanCode}" não foi encontrado ou não é válido nesta praça.`,
        coupons: local,
      };
    }

    const session = supabaseAuthService.getStoredSession();
    const userId = userIdParam || session?.id;

    const discountDesc = promoFound
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

        // Incrementa contagem de usos no Supabase
        await (supabase as any).rpc("increment_coupon_redemption", { coupon_code: cleanCode }).catch(() => {});
      } catch (err) {
        silentCatchWarn("CouponService:redeemCoupon:supabase", err);
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
      tenantId: promoFound?.tenantId || effectiveTenantId,
    };

    const updated = [newCoupon, ...local];
    this.saveLocalCoupons(updated);

    // Seleciona automaticamente para uso na próxima viagem
    this.applyCouponForRide(newCoupon);

    return {
      success: true,
      message: `Cupom ${cleanCode} resgatado com sucesso!`,
      coupons: updated,
    };
  }

  /**
   * Valida se um cupom é aplicável para a corrida corrente na praça/tenant especificado
   */
  public async validateCoupon(
    codigo: string,
    tripCents: number = 0,
    tenantIdParam?: string
  ): Promise<{
    valido: boolean;
    motivo?: string;
    cupom?: ActiveCoupon;
  }> {
    const cleanCode = (codigo || "").trim().toUpperCase();
    if (!cleanCode) {
      return { valido: false, motivo: "Código de cupom não informado" };
    }

    const effectiveTenantId = this.getEffectiveTenantId(tenantIdParam);
    const cuponsDisponiveis = await this.listAdminCoupons(effectiveTenantId);
    const cupom = cuponsDisponiveis.find((c) => c.codigo.toUpperCase() === cleanCode);

    if (!cupom) {
      return { valido: false, motivo: `Cupom ${cleanCode} não encontrado ou não aplicável nesta praça` };
    }

    if (!cupom.ativo) {
      return { valido: false, motivo: `O cupom ${cleanCode} está desativado pelo administrador` };
    }

    if (cupom.validUntil) {
      const exp = new Date(cupom.validUntil).getTime();
      if (!isNaN(exp) && exp < Date.now()) {
        return { valido: false, motivo: `O cupom ${cleanCode} expirou` };
      }
    }

    if (cupom.minTripCents && tripCents > 0 && tripCents < cupom.minTripCents) {
      const minBrl = (cupom.minTripCents / 100).toFixed(2).replace(".", ",");
      return { valido: false, motivo: `Valor mínimo da corrida para este cupom é de R$ ${minBrl}` };
    }

    return { valido: true, cupom };
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
      silentCatchWarn("CouponService:applyCouponForRide", err);
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
      silentCatchWarn("CouponService:getActiveRideCoupon", err);
    }
    return null;
  }

  /**
   * Limpa o cupom ativo após o despacho da corrida
   */
  public clearActiveRideCoupon(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_CUPOM_APLICADO_KEY);
      window.dispatchEvent(new CustomEvent("partiu:cupom-removido"));
    } catch (err) {
      silentCatchWarn("CouponService:clearActiveRideCoupon", err);
    }
  }

  /**
   * Calcula o valor descontado garantindo tarifa mínima de segurança (R$ 2,00)
   */
  public calculateFareDiscount(
    baseFare: number,
    coupon: ActiveCoupon | any | null
  ): {
    originalFare: number;
    discountAmount: number;
    discountBrl: number;
    finalFare: number;
    finalFareBrl: number;
    hasDiscount: boolean;
  } {
    const isAtivo = coupon ? (coupon.ativo !== undefined ? Boolean(coupon.ativo) : Boolean(coupon.isActive)) : false;

    if (!coupon || !isAtivo || baseFare <= 0) {
      return {
        originalFare: baseFare,
        discountAmount: 0,
        discountBrl: 0,
        finalFare: baseFare,
        finalFareBrl: baseFare,
        hasDiscount: false,
      };
    }

    // Validação de expiração de data se informada
    const validUntil = coupon.validUntil || coupon.validoAte;
    if (validUntil) {
      const expTime = new Date(validUntil).getTime();
      if (!isNaN(expTime) && expTime < Date.now()) {
        return {
          originalFare: baseFare,
          discountAmount: 0,
          discountBrl: 0,
          finalFare: baseFare,
          finalFareBrl: baseFare,
          hasDiscount: false,
        };
      }
    }

    const valorRaw = coupon.valor !== undefined ? coupon.valor : coupon.discountValue;
    const tipoRaw = coupon.tipo || coupon.discountType;
    const isPorcentagem = tipoRaw === "porcentagem" || tipoRaw === "PERCENT";
    const valor = Number(valorRaw) || 0;
    let rawDiscount = 0;

    if (isPorcentagem) {
      rawDiscount = (baseFare * valor) / 100;
    } else {
      // Se for centavos (ex: 500 centavos = R$ 5,00)
      if (tipoRaw === "FIXED_CENTS" && valor >= 100) {
        rawDiscount = valor / 100;
      } else {
        rawDiscount = valor;
      }
    }

    // Tarifa mínima de R$ 2,00 para garantir viabilidade operacional
    const maxDiscountAllowed = Math.max(0, baseFare - 2.0);
    const discountAmount = Number(Math.min(rawDiscount, maxDiscountAllowed).toFixed(2));
    const finalFare = Number(Math.max(2.0, baseFare - discountAmount).toFixed(2));

    return {
      originalFare: baseFare,
      discountAmount,
      discountBrl: discountAmount,
      finalFare,
      finalFareBrl: finalFare,
      hasDiscount: discountAmount > 0,
    };
  }
}

export const couponService = CouponService.getInstance();
