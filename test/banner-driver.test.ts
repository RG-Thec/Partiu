import { describe, it, expect } from "vitest";
import { bannerService } from "../src/lib/ecosystem/banner-service";

describe("Banner Service — Driver Recruitment Banner in APK", () => {
  it("should return 'Seja Motorista Parceiro' in active banners for PASSENGER app", () => {
    const banners = bannerService.getActiveBanners("PASSENGER");

    expect(banners.length).toBeGreaterThanOrEqual(3);

    const driverBanner = banners.find(
      (b) => b.id === "banner-motorista-saas" || b.link_url === "/cadastro-motorista",
    );

    expect(driverBanner).toBeDefined();
    expect(driverBanner?.is_active).toBe(true);
    expect(driverBanner?.title).toBe("Seja Motorista Parceiro");
    expect(driverBanner?.link_url).toBe("/cadastro-motorista");
  });
});
