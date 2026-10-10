import { describe, test, expect } from "./test-harness.mjs";
import { MapboxConfig } from "@/config/MapboxConfig";
import { WhiteLabelEngine } from "@/lib/white-label/white-label-engine";
import { driverSubscriptionService } from "@/lib/ecosystem/driver-subscription-service";
import { couponService } from "@/services/CouponService";

// In-memory Storage polyfill para ambiente Node
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

describe("Tenant Multi-Tenancy & Franchisee Isolation Suite", () => {
  describe("1. Geospatial & Map Isolation (API Keys & Geo Center)", () => {
    test("should resolve distinct geographic centers per franchisee", () => {
      const centerItaperuna = MapboxConfig.getDefaultCenter("tenant-itaperuna");
      const centerCampos = MapboxConfig.getDefaultCenter("tenant-campos");
      const centerMatriz = MapboxConfig.getDefaultCenter("default");

      // Itaperuna: [-41.888, -21.205]
      expect(centerItaperuna[0]).toBe(-41.888);
      expect(centerItaperuna[1]).toBe(-21.205);

      // Campos: [-41.3244, -21.7545]
      expect(centerCampos[0]).toBe(-41.3244);
      expect(centerCampos[1]).toBe(-21.7545);

      // Matriz (Brasília): [-47.882778, -15.793889]
      expect(centerMatriz[0]).toBe(-47.882778);
      expect(centerMatriz[1]).toBe(-15.793889);

      // Ensure centers are completely different
      expect(centerItaperuna[0]).not.toBe(centerCampos[0]);
      expect(centerItaperuna[1]).not.toBe(centerCampos[1]);
    });

    test("should dynamically update and isolate custom Mapbox API tokens per tenant", () => {
      const wlEngine = WhiteLabelEngine.getInstance();
      
      // Configure custom Mapbox token for Campos tenant
      const camposToken = "pk.eyJ1IjoiY2FtcG9zLWZyYW5xdWlhIiwiYSI6ImNsdGVzdDAwMDAwIn0.dGVzdF90b2tlbl9jYW1wb3M";
      const camposTenant = wlEngine.getTenantConfig("tenant-campos");
      wlEngine.switchTenant("tenant-campos");
      wlEngine.updateActiveConfig({
        geo: {
          ...camposTenant.geo,
          mapboxAccessToken: camposToken,
        },
      });

      // Verify Campos uses its own custom token
      const resolvedCamposToken = MapboxConfig.getAccessToken("tenant-campos");
      expect(resolvedCamposToken).toBe(camposToken);

      // Verify Itaperuna does NOT inherit Campos's token
      const resolvedItaperunaToken = MapboxConfig.getAccessToken("tenant-itaperuna");
      expect(resolvedItaperunaToken).not.toBe(camposToken);
    });
  });

  describe("2. Financial & SaaS Daily Fee PIX Isolation", () => {
    test("should generate PIX daily fee payment with franchisee's exact receiver account", () => {
      // Itaperuna driver daily fee
      const pixItaperuna = driverSubscriptionService.generateDailyFeePix(
        "mot-ita-01",
        "CARRO",
        "DAILY",
        "tenant-itaperuna"
      );

      expect(pixItaperuna.receiver.pixKey).toBe("pix.itaperuna@partiu.app");
      expect(pixItaperuna.receiver.city).toBe("Itaperuna");
      expect(pixItaperuna.amount).toBe(19.90);
      expect(pixItaperuna.copiaECola.includes("pix.itaperuna@partiu.app")).toBe(true);

      // Campos driver daily fee
      const pixCampos = driverSubscriptionService.generateDailyFeePix(
        "mot-cmp-01",
        "CARRO",
        "DAILY",
        "tenant-campos"
      );

      expect(pixCampos.receiver.pixKey).toBe("financeiro@gomobilidade.com.br");
      expect(pixCampos.receiver.city).toBe("Campos dos Goytacazes");
      expect(pixCampos.amount).toBe(22.00);
      expect(pixCampos.copiaECola.includes("financeiro@gomobilidade.com.br")).toBe(true);

      // Ensure no crossover
      expect(pixItaperuna.receiver.pixKey).not.toBe(pixCampos.receiver.pixKey);
      expect(pixItaperuna.receiver.city).not.toBe(pixCampos.receiver.city);
      expect(pixItaperuna.amount).not.toBe(pixCampos.amount);
    });

    test("should isolate driver subscription records by tenant_id upon confirmation", async () => {
      const subIta = await driverSubscriptionService.confirmDailyFeePayment(
        "mot-ita-02",
        "MOTO",
        "TX_TEST_ITA",
        11.90,
        24,
        "tenant-itaperuna"
      );
      expect(subIta.tenant_id).toBe("tenant-itaperuna");
      expect(subIta.amount_paid).toBe(11.90);

      const subCmp = await driverSubscriptionService.confirmDailyFeePayment(
        "mot-cmp-02",
        "MOTO",
        "TX_TEST_CMP",
        14.00,
        24,
        "tenant-campos"
      );
      expect(subCmp.tenant_id).toBe("tenant-campos");
      expect(subCmp.amount_paid).toBe(14.00);
    });
  });

  describe("3. Promotional Coupon Tenant Isolation", () => {
    test("should isolate coupons so that a coupon created in one tenant is not listed in another", async () => {
      // Create coupon exclusive to Itaperuna
      await couponService.saveAdminCoupon(
        {
          codigo: "ITA15OFF",
          descricao: "R$ 15 OFF em Itaperuna",
          tipo: "fixo",
          valor: 15,
          ativo: true,
          tenantId: "tenant-itaperuna",
        },
        "tenant-itaperuna"
      );

      // Create coupon exclusive to Campos
      await couponService.saveAdminCoupon(
        {
          codigo: "CAMPOS25",
          descricao: "25% OFF em Campos dos Goytacazes",
          tipo: "porcentagem",
          valor: 25,
          ativo: true,
          tenantId: "tenant-campos",
        },
        "tenant-campos"
      );

      // Query coupons for Itaperuna
      const couponsItaperuna = await couponService.listAdminCoupons("tenant-itaperuna");
      const hasIta = couponsItaperuna.some((c) => c.codigo === "ITA15OFF");
      const hasCmpInIta = couponsItaperuna.some((c) => c.codigo === "CAMPOS25");

      expect(hasIta).toBe(true);
      expect(hasCmpInIta).toBe(false);

      // Query coupons for Campos
      const couponsCampos = await couponService.listAdminCoupons("tenant-campos");
      const hasCmp = couponsCampos.some((c) => c.codigo === "CAMPOS25");
      const hasItaInCmp = couponsCampos.some((c) => c.codigo === "ITA15OFF");

      expect(hasCmp).toBe(true);
      expect(hasItaInCmp).toBe(false);
    });

    test("should reject coupon redemption and checkout validation across different tenants", async () => {
      // Validate Campos coupon inside Itaperuna tenant -> MUST BE REJECTED
      const validationCross = await couponService.validateCoupon("CAMPOS25", 3000, "tenant-itaperuna");
      expect(validationCross.valido).toBe(false);
      expect(validationCross.motivo?.includes("não encontrado ou não aplicável")).toBe(true);

      // Validate Campos coupon inside Campos tenant -> MUST BE VALID
      const validationValid = await couponService.validateCoupon("CAMPOS25", 3000, "tenant-campos");
      expect(validationValid.valido).toBe(true);
      expect(validationValid.cupom?.codigo).toBe("CAMPOS25");
      expect(validationValid.cupom?.valor).toBe(25);

      // Validate Itaperuna coupon inside Itaperuna tenant -> MUST BE VALID
      const validationIta = await couponService.validateCoupon("ITA15OFF", 3000, "tenant-itaperuna");
      expect(validationIta.valido).toBe(true);
      expect(validationIta.cupom?.codigo).toBe("ITA15OFF");
      expect(validationIta.cupom?.valor).toBe(15);
    });
  });
});
