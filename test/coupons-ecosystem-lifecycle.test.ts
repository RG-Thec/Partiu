import { describe, test, expect } from "./test-harness.mjs";
import { couponService, type CouponCampaign } from "@/services/CouponService";
import { driverSubscriptionService } from "@/lib/ecosystem/driver-subscription-service";

// In-memory Storage polyfill para ambiente Node puro
if (typeof globalThis.localStorage === "undefined") {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe("Coupon System & Driver Daily Fee Subsidy Lifecycle", () => {
  describe("1. Canonical Fare Discount Math & Safety Boundaries", () => {
    test("should correctly compute percentage discount (20% off)", () => {
      const coupon: CouponCampaign = {
        id: "cupom-pct",
        code: "DESCONTO20",
        discountType: "PERCENT",
        discountValue: 20,
        isActive: true,
      };

      const result = couponService.calculateFareDiscount(30.0, coupon);
      expect(result.hasDiscount).toBe(true);
      expect(result.discountBrl).toBe(6.0); // 20% de 30.0
      expect(result.finalFareBrl).toBe(24.0);
    });

    test("should correctly compute fixed value discount (R$ 5 off)", () => {
      const coupon: CouponCampaign = {
        id: "cupom-fixo",
        code: "CINCOOFF",
        discountType: "FIXED_CENTS",
        discountValue: 500, // 500 centavos = R$ 5,00
        isActive: true,
      };

      const result = couponService.calculateFareDiscount(25.0, coupon);
      expect(result.hasDiscount).toBe(true);
      expect(result.discountBrl).toBe(5.0);
      expect(result.finalFareBrl).toBe(20.0);
    });

    test("should respect minimum safety floor of R$ 2.00 on excessive discount", () => {
      const coupon: CouponCampaign = {
        id: "cupom-gigante",
        code: "QUASEGRATIS",
        discountType: "FIXED_CENTS",
        discountValue: 5000, // R$ 50,00 de desconto
        isActive: true,
      };

      const result = couponService.calculateFareDiscount(10.0, coupon);
      expect(result.hasDiscount).toBe(true);
      expect(result.finalFareBrl).toBe(2.0); // Não permite corrida abaixo de R$ 2,00
      expect(result.discountBrl).toBe(8.0);
    });

    test("should reject inactive coupon", () => {
      const coupon: CouponCampaign = {
        id: "cupom-inativo",
        code: "INATIVO",
        discountType: "PERCENT",
        discountValue: 10,
        isActive: false,
      };

      const result = couponService.calculateFareDiscount(20.0, coupon);
      expect(result.hasDiscount).toBe(false);
      expect(result.discountBrl).toBe(0);
      expect(result.finalFareBrl).toBe(20.0);
    });

    test("should reject expired coupon", () => {
      const coupon: CouponCampaign = {
        id: "cupom-vencido",
        code: "VENCIDO",
        discountType: "PERCENT",
        discountValue: 15,
        isActive: true,
        validUntil: new Date(Date.now() - 86400000).toISOString(), // ontem
      };

      const result = couponService.calculateFareDiscount(20.0, coupon);
      expect(result.hasDiscount).toBe(false);
      expect(result.discountBrl).toBe(0);
      expect(result.finalFareBrl).toBe(20.0);
    });
  });

  describe("2. Admin Coupon Management & State Persistence", () => {
    test("should save, list, toggle and delete admin coupons in storage", async () => {
      localStorage.clear();

      const newCoupon: CouponCampaign = {
        id: "cupom-admin-1",
        code: "PROMOADMIN",
        discountType: "FIXED_CENTS",
        discountValue: 700,
        description: "Cupom de Teste Admin R$ 7",
        isActive: true,
        maxRedemptions: 100,
        redeemedCount: 0,
      };

      await couponService.saveAdminCoupon(newCoupon);
      let list = await couponService.listAdminCoupons();
      expect(list.some((c) => c.codigo === "PROMOADMIN" || (c as any).code === "PROMOADMIN")).toBe(true);

      // Toggle status (desativa)
      await couponService.toggleAdminCoupon("PROMOADMIN", false);
      list = await couponService.listAdminCoupons();
      const updated = list.find((c) => c.codigo === "PROMOADMIN");
      expect(updated?.ativo).toBe(false);

      // Exclusão
      await couponService.deleteAdminCoupon("PROMOADMIN");
      list = await couponService.listAdminCoupons();
      expect(list.some((c) => c.codigo === "PROMOADMIN")).toBe(false);
    });
  });

  describe("3. Zero-Custody Driver Daily Fee Subsidy Engine", () => {
    test("should accumulate coupon discount as operational credits for the driver", () => {
      localStorage.clear();
      const driverId = "mot-teste-101";

      expect(driverSubscriptionService.getOperationalCredits(driverId)).toBe(0);

      // Corrida teve cupom de R$ 4,50
      const credit1 = driverSubscriptionService.addOperationalCredit(driverId, 4.5);
      expect(credit1).toBe(4.5);
      expect(driverSubscriptionService.getOperationalCredits(driverId)).toBe(4.5);

      // Outra corrida com cupom de R$ 3,00
      const credit2 = driverSubscriptionService.addOperationalCredit(driverId, 3.0);
      expect(credit2).toBe(7.5);
      expect(driverSubscriptionService.getOperationalCredits(driverId)).toBe(7.5);
    });

    test("should deduct accumulated operational credits from driver daily fee payment", () => {
      localStorage.clear();
      const driverId = "mot-teste-102";

      // Diária de carro oficial é R$ 19,90
      // Motorista acumulou R$ 6,00 de crédito de subsídios de cupons
      driverSubscriptionService.addOperationalCredit(driverId, 6.0);
      expect(driverSubscriptionService.getOperationalCredits(driverId)).toBe(6.0);

      const pixPayment = driverSubscriptionService.generatePixDailyPayment(
        driverId,
        "CARRO",
        "DAILY"
      );

      // Valor final do PIX deve ser R$ 19,90 - R$ 6,00 = R$ 13,90
      expect(pixPayment.amount).toBe(13.9);
    });

    test("should consume credits upon daily fee confirmation", async () => {
      localStorage.clear();
      const driverId = "mot-teste-103";

      driverSubscriptionService.addOperationalCredit(driverId, 5.0);
      expect(driverSubscriptionService.getOperationalCredits(driverId)).toBe(5.0);

      // Confirma pagamento da diária
      await driverSubscriptionService.confirmDailyFeePayment(driverId, "CARRO", "TX_TEST_01", 5.0);

      // Créditos consumidos
      expect(driverSubscriptionService.getOperationalCredits(driverId)).toBe(0);
      expect(driverSubscriptionService.isDriverUnlocked(driverId)).toBe(true);
    });
  });
});
