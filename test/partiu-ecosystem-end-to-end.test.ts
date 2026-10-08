import { describe, test, expect } from "./test-harness.mjs";
import { appSettingsService } from "@/lib/ecosystem/app-settings-service";
import { driverSubscriptionService } from "@/lib/ecosystem/driver-subscription-service";
import { bannerService } from "@/lib/ecosystem/banner-service";
import { driverFleetService } from "@/lib/ecosystem/driver-fleet-service";
import { calcularCotacoesPassageiro } from "@/lib/passenger/passenger-ride-machine";
import { calcularCotacaoEntrega } from "@/lib/delivery/delivery-dual-pin-machine";

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

describe("Ecosystem PARTIU End-to-End Integration Tests", () => {
  describe("1. Global Operating Settings & Dynamic Pricing", () => {
    test("should initialize default settings with R$ 10 Car and R$ 5 Moto daily fees", () => {
      localStorage.clear();
      const settings = appSettingsService.getSettings();
      expect(settings.daily_fee_car).toBe(10.0);
      expect(settings.daily_fee_moto).toBe(5.0);
      expect(settings.is_ride_active).toBe(true);
      expect(settings.is_delivery_active).toBe(true);
    });

    test("should compute dynamic passenger ride fares based on app settings", async () => {
      // Valor base padrão
      const quoteInitial = calcularCotacoesPassageiro(10, 20);
      expect(quoteInitial.moto.precoBrl).toBeGreaterThan(0);
      expect(quoteInitial.carro.precoBrl).toBeGreaterThan(quoteInitial.moto.precoBrl);
      expect(quoteInitial.moto.categoria).toBe("MOTO");
      expect(quoteInitial.carro.categoria).toBe("CARRO");

      // Altera o preço por km e tarifa base no admin
      await appSettingsService.updateSettings({
        base_fare_ride: 10.0,
        price_per_km: 3.0,
        price_per_minute: 0.5,
      });

      const quoteUpdated = calcularCotacoesPassageiro(10, 20);
      expect(quoteUpdated.carro.precoBrl).toBe(10 + 10 * 3 + 20 * 0.5); // 10 + 30 + 10 = 50.00
      expect(quoteUpdated.carro.precoBrl).toBeGreaterThan(quoteInitial.carro.precoBrl);
    });

    test("should compute dynamic delivery quotes for MOTO and CARRO based on app settings", async () => {
      const quoteMoto = calcularCotacaoEntrega("MOTO", 5, 15);
      const quoteCarro = calcularCotacaoEntrega("CARRO", 5, 15);

      expect(quoteMoto.precoBrl).toBeGreaterThan(0);
      expect(quoteCarro.precoBrl).toBeGreaterThan(quoteMoto.precoBrl);
      expect(quoteMoto.taxaSeguroBrl).toBe(1.0);
      expect(quoteCarro.taxaSeguroBrl).toBe(1.5);
    });
  });

  describe("2. Driver SaaS Daily Fee & Cockpit Paywall Gate", () => {
    const testDriverId = "driver-test-123";

    test("should lock cockpit when driver has no active subscription", () => {
      const isUnlocked = driverSubscriptionService.isDriverUnlocked(testDriverId);
      expect(isUnlocked).toBe(false);
    });

    test("should generate PIX daily fee payload for CARRO (R$ 10) and MOTO (R$ 5)", () => {
      const pixCar = driverSubscriptionService.generateDailyFeePix(testDriverId, "CARRO");
      expect(pixCar.amount).toBeGreaterThan(0);
      expect(pixCar.qrCodeUrl).toBeDefined();
      expect(pixCar.copiaECola).toBeDefined();
      expect(pixCar.txid).toBeDefined();

      const pixMoto = driverSubscriptionService.generateDailyFeePix(testDriverId, "MOTO");
      expect(pixMoto.amount).toBeGreaterThan(0);
      expect(pixMoto.qrCodeUrl).toBeDefined();
    });

    test("should unlock driver cockpit for 24h upon PIX confirmation and record SaaS metrics", async () => {
      const pix = driverSubscriptionService.generateDailyFeePix(testDriverId, "CARRO");
      const sub = await driverSubscriptionService.confirmDailyFeePayment(testDriverId, "CARRO", pix.txid);

      expect(sub.status).toBe("ACTIVE");
      expect(driverSubscriptionService.isDriverUnlocked(testDriverId)).toBe(true);

      const metrics = driverSubscriptionService.getSaaSMetrics();
      expect(metrics.activeDriversCount).toBeGreaterThanOrEqual(1);
      expect(metrics.totalRevenueToday).toBeGreaterThanOrEqual(10.0);
    });
  });

  describe("3. Banner CMS Engine & Dimensions Validation", () => {
    test("should create, toggle, and delete banners with category filtering", async () => {
      const newBanner = await bannerService.createBanner({
        title: "Super Desconto de Sexta",
        subtitle: "Corridas de Moto com 30% OFF",
        badge: "PROMOÇÃO",
        image_url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800",
        link_url: "/app",
        category: "PASSENGER",
        order_index: 1,
      });

      expect(newBanner.id).toBeDefined();
      expect(newBanner.is_active).toBe(true);

      const passengerBanners = bannerService.getActiveBanners("PASSENGER");
      expect(passengerBanners.some((b) => b.id === newBanner.id)).toBe(true);

      // Desativa o banner
      const novoStatus = await bannerService.toggleBannerStatus(newBanner.id);
      expect(novoStatus).toBe(false);

      const activeAfterToggle = bannerService.getActiveBanners("PASSENGER");
      expect(activeAfterToggle.some((b) => b.id === newBanner.id)).toBe(false);

      // Deleta o banner
      const deleted = await bannerService.deleteBanner(newBanner.id);
      expect(deleted).toBe(true);
      expect(bannerService.getAllBanners().some((b) => b.id === newBanner.id)).toBe(false);
    });

    test("should validate mobile carousel banner aspect ratios", async () => {
      const valEmpty = await bannerService.validateBannerDimensions("");
      expect(valEmpty.isValid).toBe(false);

      const valNormal = await bannerService.validateBannerDimensions("https://example.com/banner.jpg");
      expect(valNormal).toBeDefined();
    });
  });

  describe("4. Fleet Management with Strict MOTO and CARRO Category Rule", () => {
    test("should register a driver and strictly accept only MOTO or CARRO", async () => {
      const driverMoto = await driverFleetService.registerDriver({
        name: "Marcio Motoboy",
        phone: "(22) 99888-1122",
        vehicle_type: "MOTO",
        vehicle_plate: "XYZ-9988",
        vehicle_model: "Honda CG 160",
        cnh_number: "12345678900",
      });
      expect(driverMoto.vehicle_type).toBe("MOTO");
      expect(driverMoto.status).toBe("PENDENTE");

      const driverCar = await driverFleetService.registerDriver({
        name: "Luciana Condutora",
        phone: "(22) 99777-3344",
        vehicle_type: "CARRO",
        vehicle_plate: "KPW-4455",
        vehicle_model: "Chevrolet Onix",
        cnh_number: "98765432100",
      });
      expect(driverCar.vehicle_type).toBe("CARRO");

      let threw = false;
      try {
        await driverFleetService.registerDriver({
          name: "Van Invalida",
          phone: "(22) 99999-0000",
          vehicle_type: "VAN" as any,
          vehicle_plate: "VAN-0001",
          vehicle_model: "Renault Master",
          cnh_number: "00000000000",
        });
      } catch (err: any) {
        threw = true;
        expect(err.message).toContain("Estritamente MOTO ou CARRO");
      }
      expect(threw).toBe(true);
    });

    test("should approve and reject drivers updating lifecycle status immediately", async () => {
      const driver = await driverFleetService.registerDriver({
        name: "Carlos Teste Aprovacao",
        phone: "(22) 99111-2233",
        vehicle_type: "CARRO",
        vehicle_plate: "ABC-1234",
        vehicle_model: "Fiat Argo",
        cnh_number: "11122233344",
      });

      const approved = await driverFleetService.approveDriver(driver.id);
      expect(approved).toBe(true);
      const approvedDriver = driverFleetService.getAllDrivers().find((d) => d.id === driver.id);
      expect(approvedDriver?.status).toBe("APROVADO");

      const rejected = await driverFleetService.rejectDriver(driver.id, "CNH sem EAR legível");
      expect(rejected).toBe(true);
      const rejectedDriver = driverFleetService.getAllDrivers().find((d) => d.id === driver.id);
      expect(rejectedDriver?.status).toBe("REJEITADO");
      expect(rejectedDriver?.rejection_reason).toBe("CNH sem EAR legível");
    });
  });
});
