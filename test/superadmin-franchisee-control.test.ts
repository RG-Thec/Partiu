import { describe, test, expect } from "./test-harness.mjs";
import { MapboxConfig } from "@/config/MapboxConfig";
import { WhiteLabelEngine } from "@/lib/white-label/white-label-engine";

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

describe("SUITE: Super Admin Franchisee Governance, Kill Switch & Mapbox Isolation", () => {
  const wlEngine = WhiteLabelEngine.getInstance();

  describe("1. Strict Mapbox API Key Isolation Policy", () => {
    test("should allow ONLY Super Admin official Partiu account to use the pre-configured official Mapbox API", () => {
      // 1. Matriz Oficial / Partiu Oficial tem acesso ao token oficial pré-configurado
      expect(MapboxConfig.isOfficialMatrizTenant("default")).toBe(true);
      expect(MapboxConfig.isOfficialMatrizTenant(undefined)).toBe(true);

      const tokenMatriz = MapboxConfig.getAccessToken("default");
      expect(typeof tokenMatriz === "string" && tokenMatriz.startsWith("pk.")).toBe(true);
      expect(tokenMatriz.length).toBeGreaterThan(20);
    });

    test("should BLOCK franchisees without custom keys from using Super Admin Mapbox API", () => {
      // Cria/reseta franqueado sem token de mapa
      const tokenCamposAntes = wlEngine.getTenantConfig("tenant-campos");
      wlEngine.updateActiveConfig({
        geo: {
          ...tokenCamposAntes.geo,
          mapboxAccessToken: "", // chave vazia propositalmente
        },
      });

      // Franqueado não é matriz
      expect(MapboxConfig.isOfficialMatrizTenant("tenant-campos")).toBe(false);

      // Franqueado SEM chave NÃO deve receber a chave do Super Admin
      const tokenCampos = MapboxConfig.getAccessToken("tenant-campos");
      expect(tokenCampos).toBe("");
      expect(MapboxConfig.hasValidToken("tenant-campos")).toBe(false);
    });

    test("should use franchisee's own Mapbox key when properly configured", () => {
      const customFranchiseKey = "pk.eyJ1IjoiZnJhbnF1aWFkby1jYW1wb3MiLCJhIjoiY2x4eXoxMjM0NTY3In0.ZXhhbXBsZV9mcmFucXVpYV9rZXk";
      const config = wlEngine.getTenantConfig("tenant-campos");

      wlEngine.updateActiveConfig({
        geo: {
          ...config.geo,
          mapboxAccessToken: customFranchiseKey,
        },
      });

      const resolvedToken = MapboxConfig.getAccessToken("tenant-campos");
      expect(resolvedToken).toBe(customFranchiseKey);
      expect(MapboxConfig.hasValidToken("tenant-campos")).toBe(true);
    });
  });

  describe("2. Franchisee Lifecycle & Kill Switch (Ativação e Desativação de Plano)", () => {
    test("should accurately report active vs suspended status", () => {
      expect(wlEngine.isTenantActive("default")).toBe(true);
      expect(wlEngine.isTenantSuspended("default")).toBe(false);
    });

    test("should allow Super Admin to deactivate a franchisee plan (kill switch)", async () => {
      const motivo = "Inadimplência de mensalidade da plataforma SaaS";
      const result = await wlEngine.setTenantStatus("tenant-campos", "SUSPENSO", motivo);

      expect(result).toBe(true);
      expect(wlEngine.isTenantActive("tenant-campos")).toBe(false);
      expect(wlEngine.isTenantSuspended("tenant-campos")).toBe(true);

      const tenantCampos = wlEngine.getAllTenants().find((t) => t.tenantId === "tenant-campos");
      expect(tenantCampos?.ativo).toBe(false);
      expect(tenantCampos?.statusPlano).toBe("SUSPENSO");
      expect(tenantCampos?.motivoBloqueio).toBe(motivo);
    });

    test("should allow Super Admin to reactivate a suspended franchisee plan", async () => {
      const result = await wlEngine.setTenantStatus("tenant-campos", "ATIVO");

      expect(result).toBe(true);
      expect(wlEngine.isTenantActive("tenant-campos")).toBe(true);
      expect(wlEngine.isTenantSuspended("tenant-campos")).toBe(false);

      const tenantCampos = wlEngine.getAllTenants().find((t) => t.tenantId === "tenant-campos");
      expect(tenantCampos?.ativo).toBe(true);
      expect(tenantCampos?.statusPlano).toBe("ATIVO");
    });

    test("should prevent Super Admin official Matriz account from ever being suspended", async () => {
      let erroDisparado = false;
      try {
        await wlEngine.setTenantStatus("default", "SUSPENSO");
      } catch (err: any) {
        erroDisparado = true;
        expect(err.message).toContain("Matriz Partiu não pode ser suspensa");
      }
      expect(erroDisparado).toBe(true);
      expect(wlEngine.isTenantActive("default")).toBe(true);
    });
  });

  describe("3. Franchisee Account Deletion Safeguards", () => {
    test("should protect official Matriz accounts from deletion", async () => {
      let erroMatriz = false;
      try {
        await wlEngine.deleteTenant("default");
      } catch (err: any) {
        erroMatriz = true;
        expect(err.message).toContain("protegida e não pode ser excluída");
      }
      expect(erroMatriz).toBe(true);
    });

    test("should allow Super Admin to clone and delete a regional franchisee account", async () => {
      const novaFranquia = wlEngine.cloneTenant(
        "default",
        "tenant-resende",
        "Resende",
        "RJ",
        "PARTIU Resende Sul"
      );

      expect(novaFranquia.tenantId).toBe("tenant-resende");
      expect(novaFranquia.statusPlano).toBe("ATIVO");
      expect(wlEngine.isTenantActive("tenant-resende")).toBe(true);

      const totalAntes = wlEngine.getAllTenants().length;

      // Exclui a franquia recém-criada
      const deletado = await wlEngine.deleteTenant("tenant-resende");
      expect(deletado).toBe(true);

      const totalDepois = wlEngine.getAllTenants().length;
      expect(totalDepois).toBe(totalAntes - 1);
      expect(wlEngine.getAllTenants().some((t) => t.tenantId === "tenant-resende")).toBe(false);
    });
  });

  describe("4. Super Admin Franchisee Consolidation & Metrics", () => {
    test("should calculate global franchisee stats accurately", () => {
      const stats = wlEngine.getFranchiseeStats();
      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.ativos).toBeGreaterThanOrEqual(1);
      expect(stats.ativos + stats.suspensos).toBe(stats.total);
    });
  });
});
