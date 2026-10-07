import { describe, test, expect } from "./test-harness.mjs";
import {
  tenantDomainService,
  CANONICAL_CNAME_TARGET,
  CANONICAL_APEX_IP,
} from "../src/lib/white-label/tenant-domain-service.ts";

describe("🌐 WHITE-LABEL DOMAIN RESOLVER & DYNAMIC MANIFEST ENGINE", () => {
  test("1.1 Normalização e limpeza de hostnames (cleanHostname)", () => {
    expect(tenantDomainService.cleanHostname("https://app.mobe-saopaulo.com.br:3000/app")).toBe(
      "app.mobe-saopaulo.com.br"
    );
    expect(tenantDomainService.cleanHostname("HTTP://APP.PARTIUMOBE.COM.BR/")).toBe(
      "app.partiumobe.com.br"
    );
    expect(tenantDomainService.cleanHostname("localhost:5173")).toBe("localhost");
  });

  test("1.2 Identificação de hosts de desenvolvimento e infraestrutura da plataforma", () => {
    expect(tenantDomainService.isPlatformHost("localhost")).toBe(true);
    expect(tenantDomainService.isPlatformHost("127.0.0.1")).toBe(true);
    expect(tenantDomainService.isPlatformHost("novo-partiu-mobe.lovable.app")).toBe(true);
    expect(tenantDomainService.isPlatformHost("partiumobe.com.br")).toBe(true);
    expect(tenantDomainService.isPlatformHost("app.mobe-saopaulo.com.br")).toBe(false);
  });

  test("1.3 Resolução com parâmetro explícito na URL (?tenant=...)", () => {
    const params = new URLSearchParams("tenant=praca_maceio_al");
    const res = tenantDomainService.resolveTenantFromHost("novo-partiu-mobe.lovable.app", params);
    expect(res.status).toBe("OK");
    expect(res.tenantId).toBe("praca_maceio_al");
    expect(res.source).toBe("PARAM");
    expect(res.isCustomDomain).toBe(false);
  });

  test("1.4 Resolução em ambiente de desenvolvimento / plataforma core", () => {
    const res = tenantDomainService.resolveTenantFromHost("localhost");
    expect(res.status).toBe("OK");
    expect(res.isCustomDomain).toBe(false);
    expect(res.tenantId).toBe("tenant-itaperuna");
  });

  test("1.5 Resolução de domínio customizado ativo (app.mobe-saopaulo.com.br)", () => {
    const res = tenantDomainService.resolveTenantFromHost("app.mobe-saopaulo.com.br");
    expect(res.status).toBe("OK");
    expect(res.tenantId).toBe("tenant-campos");
    expect(res.source).toBe("DOMAIN");
    expect(res.isCustomDomain).toBe(true);
  });

  test("1.6 Resolução de domínio registrado com DNS pendente", () => {
    const res = tenantDomainService.resolveTenantFromHost("maceio.partiumobe.com.br");
    expect(res.status).toBe("DNS_PENDING");
    expect(res.tenantId).toBe("praca_maceio_al");
    expect(res.isCustomDomain).toBe(true);
    expect(res.error).toBeDefined();
  });

  test("1.7 Bloqueio e 404 para domínio desconhecido em produção", () => {
    const res = tenantDomainService.resolveTenantFromHost("dominio-fantasma-nao-registrado.com.br");
    expect(res.status).toBe("DOMAIN_NOT_FOUND");
    expect(res.tenantId).toBe("default");
    expect(res.isCustomDomain).toBe(true);
  });

  test("2.1 Geração dinâmica de Web App Manifest para PWA e APK", () => {
    const manifestCampos = tenantDomainService.generateDynamicManifest(
      "tenant-campos",
      "https://app.mobe-saopaulo.com.br"
    );
    expect(manifestCampos.short_name).toBe("GO MOBILIDADE");
    expect(manifestCampos.theme_color).toBe("#2563EB"); // Cor do preset Campos
    expect(manifestCampos.start_url).toBe("/app?tenant=tenant-campos");
    expect(manifestCampos.icons.length).toBeGreaterThan(0);
    expect(manifestCampos.display).toBe("standalone");

    const manifestItaperuna = tenantDomainService.generateDynamicManifest(
      "tenant-itaperuna",
      "https://app.partiumobe.com.br"
    );
    expect(manifestItaperuna.short_name).toBe("PARTIU");
    expect(manifestItaperuna.theme_color).toBe("#FF6B00"); // Laranja solar
    expect(manifestItaperuna.start_url).toBe("/app?tenant=tenant-itaperuna");
  });

  test("3.1 Ciclo de vida de domínio: Registro, validação e aprovação do Super Admin", async () => {
    const testDomain = "app.franquia-teste-v6.com.br";
    const reg = tenantDomainService.registerCustomDomain(
      "tenant-teste-v6",
      testDomain,
      "Franquia Teste V6"
    );
    expect(reg.sucesso).toBe(true);
    expect(reg.record?.status).toBe("PENDENTE");
    expect(reg.record?.cnameTarget).toBe(CANONICAL_CNAME_TARGET);

    // Validação de DNS
    const check = await tenantDomainService.verifyDomainDns(testDomain);
    expect(check.record.dnsRecords.length).toBeGreaterThan(0);

    // Aprovação manual pelo Super Admin
    const aprovado = tenantDomainService.approveDomain(testDomain);
    expect(aprovado.status).toBe("ATIVO");
    expect(aprovado.sslStatus).toBe("ATIVO");

    // Limpeza
    const deleted = tenantDomainService.deleteDomain(testDomain);
    expect(deleted).toBe(true);
  });
});
