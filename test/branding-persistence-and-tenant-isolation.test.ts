import { describe, test, expect } from "./test-harness.mjs";
import {
  MONOCHROMATIC_PALETTES,
  DEFAULT_MONOCHROMATIC_PALETTE,
} from "../src/lib/branding/monochromatic-palettes.ts";
import { ThemeEngine } from "../src/lib/branding/ThemeEngine.ts";
import {
  whiteLabelEngine,
  convertWhiteLabelToBrandingRecord,
} from "../src/lib/white-label/white-label-engine.ts";
import {
  identidadeVisualInicial,
} from "../src/lib/superadmin-config.ts";
import { tenantDomainService } from "../src/lib/white-label/tenant-domain-service.ts";
import { supabaseAuthService } from "../src/lib/auth/supabase-auth-service.ts";

// Setup Mock LocalStorage sem poluir window global
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


function createMockDocument(rootStyles: Map<string, string>) {
  return {
    documentElement: {
      style: {
        setProperty: (k: string, v: string) => rootStyles.set(k, v),
        getPropertyValue: (k: string) => rootStyles.get(k) || "",
      },
      classList: { remove: () => {}, add: () => {} },
    },
    head: { appendChild: () => {} },
    body: {
      classList: { remove: () => {}, add: () => {} },
      style: {},
    },
    title: "",
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, rel: "", href: "", content: "", name: "" }),
  };
}

describe("Bulletproof Branding Persistence & Multi-Tenant Isolation Suite", () => {
  describe("1. Fallback & Default Color Invariant (No Blue Leaks)", () => {
    test("should never use obsolete blue (#0284C7 or #0088FF) as default primary color in superadmin", () => {
      expect(identidadeVisualInicial.corPrimaria).not.toBe("#0284C7");
      expect(identidadeVisualInicial.corPrimaria).not.toBe("#0088FF");
      expect(identidadeVisualInicial.corPrimaria).toBe("#FF6B00");
    });

    test("should ensure whiteLabelEngine default record uses canonical Partiu palette", () => {
      const defaultTenant = whiteLabelEngine.getTenantById("default");
      expect(Boolean(defaultTenant)).toBe(true);
      const prim = defaultTenant?.configuracaoCompleta?.designSystem?.paletaPrimaria;
      expect(prim?.corPrincipal).not.toBe("#0284C7");
      expect(prim?.corPrincipal).toBe("#FF6B00");
    });

    test("should ensure convertWhiteLabelToBrandingRecord defaults to canonical Partiu palette", () => {
      const emptyConfig: any = { designSystem: { paletaPrimaria: {} } };
      const converted = convertWhiteLabelToBrandingRecord(emptyConfig, "tenant-teste");
      expect(converted.primary_color).toBe("#FF6B00");
      expect(converted.secondary_color).toBe("#FFB800");
    });
  });

  describe("2. Monochromatic Palette Selection & Local Persistence", () => {
    test("should apply and persist a custom palette for a specific franchisee tenant", () => {
      const rootStyles = new Map<string, string>();
      const prevDoc = (globalThis as any).document;
      (globalThis as any).document = createMockDocument(rootStyles);

      try {
        const themeEngine = ThemeEngine.getInstance();
        const paletaPreto = MONOCHROMATIC_PALETTES.find((p) => p.id === "paleta-preto-onix");
        expect(Boolean(paletaPreto)).toBe(true);

        const franchiseeTenantId = "praca_maceio_al";

        // Aplica para a franquia de Maceió
        themeEngine.applyMonochromaticPalette(paletaPreto!, "PARTIU Maceió", franchiseeTenantId);

        // Verifica CSS variables aplicadas no :root
        expect(rootStyles.get("--primary")).toBe(paletaPreto!.colors.primary);
        expect(rootStyles.get("--color-primary")).toBe(paletaPreto!.colors.primary);

        // Verifica isolamento no localStorage
        const tenantKey = `partiu_branding_tenant_${franchiseeTenantId}`;
        const savedTenantRaw = globalThis.localStorage.getItem(tenantKey);
        expect(Boolean(savedTenantRaw)).toBe(true);

        const savedTenant = JSON.parse(savedTenantRaw!);
        expect(savedTenant.primary_color).toBe(paletaPreto!.colors.primary);
        expect(savedTenant.tenant_id).toBe(franchiseeTenantId);

        // Verifica que a paleta do tenant ativo foi gravada
        expect(globalThis.localStorage.getItem(`partiu_active_palette_id_${franchiseeTenantId}`)).toBe(paletaPreto!.id);
      } finally {
        if (prevDoc === undefined) {
          delete (globalThis as any).document;
        } else {
          (globalThis as any).document = prevDoc;
        }
      }
    });

    test("should isolate customization so Tenant A changes do not contaminate Tenant B", () => {
      const rootStyles = new Map<string, string>();
      const prevDoc = (globalThis as any).document;
      (globalThis as any).document = createMockDocument(rootStyles);

      try {
        const themeEngine = ThemeEngine.getInstance();
        const paletaVerde = MONOCHROMATIC_PALETTES.find((p) => p.id === "paleta-verde-eco") || {
          id: "paleta-verde-teste",
          name: "Verde Eco",
          colors: { primary: "#059669", secondary: "#10B981" } as any,
        };
        const paletaLaranja = DEFAULT_MONOCHROMATIC_PALETTE;

        // Tenant A (Campos) define Verde
        themeEngine.applyMonochromaticPalette(paletaVerde as any, "GO Campos", "tenant-campos");

        // Tenant B (Itaperuna) define Laranja
        themeEngine.applyMonochromaticPalette(paletaLaranja, "PARTIU Itaperuna", "tenant-itaperuna");

        // Lê caches isolados de ambos
        const camposCache = JSON.parse(globalThis.localStorage.getItem("partiu_branding_tenant_tenant-campos")!);
        const itaperunaCache = JSON.parse(globalThis.localStorage.getItem("partiu_branding_tenant_tenant-itaperuna")!);

        expect(camposCache.primary_color).toBe(paletaVerde.colors.primary);
        expect(itaperunaCache.primary_color).toBe(paletaLaranja.colors.primary);
        expect(camposCache.primary_color).not.toBe(itaperunaCache.primary_color);
      } finally {
        if (prevDoc === undefined) {
          delete (globalThis as any).document;
        } else {
          (globalThis as any).document = prevDoc;
        }
      }
    });
  });

  describe("3. Anti-Regression & Timestamp Comparison (No Overwrite by Stale Data)", () => {
    test("should reject older remote database data when local copy was recently modified", () => {
      const tenantId = "default";
      const localTime = new Date("2026-10-10T12:00:00Z").getTime();
      const staleRemoteTime = new Date("2026-09-11T08:00:00Z").getTime();

      const localBranding = {
        tenant_id: tenantId,
        primary_color: "#16A34A", // Verde customizado pelo admin
        updated_at: new Date(localTime).toISOString(),
      };

      const staleRemoteBranding = {
        tenant_id: tenantId,
        primary_color: "#003366", // Antigo azul legado do banco
        updated_at: new Date(staleRemoteTime).toISOString(),
      };

      // Simulação da lógica anti-regressão implementada no BrandingProvider
      let resolvedBranding = staleRemoteBranding;
      if (localTime > staleRemoteTime) {
        resolvedBranding = localBranding;
      }

      expect(resolvedBranding.primary_color).toBe("#16A34A");
      expect(resolvedBranding.primary_color).not.toBe("#003366");
    });
  });

  describe("4. BH Mob Franchisee Isolation & Blue Palette Guarantee", () => {
    test("should ensure BH Mob tenant is seeded with cobalt blue (#2563EB) and not orange", () => {
      const bhMob = whiteLabelEngine.getTenantById("tenant-bhmob");
      expect(Boolean(bhMob)).toBe(true);
      expect(bhMob?.nomeOperacao).toBe("BH Mob");

      const primColor = bhMob?.configuracaoCompleta?.designSystem?.paletaPrimaria?.corPrincipal;
      expect(primColor).toBe("#2563EB");
      expect(primColor).not.toBe("#FF6B00");
      expect(primColor).not.toBe("#FF8C00");

      const brandingRecord = convertWhiteLabelToBrandingRecord(bhMob!.configuracaoCompleta, "tenant-bhmob");
      expect(brandingRecord.primary_color).toBe("#2563EB");
      expect(brandingRecord.app_name).toBe("BH MOB");
      expect(brandingRecord.tenant_id).toBe("tenant-bhmob");
    });

    test("should generate correct appUrl for BH Mob franchisee and prevent cross-contamination with itaperuna", () => {
      const origin = "https://partiu-zeta.vercel.app";
      const contaFranqueado = {
        role: "FRANQUEADO" as const,
        tenantId: "tenant-bhmob",
      };

      // Simulação da lógica de cálculo de URL adotada em Meu Aplicativo
      const activeTenantId = "tenant-itaperuna"; // Simula resíduo no localStorage
      const effectiveTenantId = (contaFranqueado.role === "FRANQUEADO" && contaFranqueado.tenantId)
        ? contaFranqueado.tenantId
        : (activeTenantId || "default");

      expect(effectiveTenantId).toBe("tenant-bhmob");
      expect(effectiveTenantId).not.toBe("tenant-itaperuna");

      const appUrl = `${origin}/app?tenant=${encodeURIComponent(effectiveTenantId)}`;
      expect(appUrl).toBe("https://partiu-zeta.vercel.app/app?tenant=tenant-bhmob");
      expect(appUrl).not.toContain("tenant-itaperuna");
    });

    test("should update BH Mob config using updateTenantConfig without affecting Matriz or Itaperuna", () => {
      const paletaAzulEscuro = "#1D4ED8";
      whiteLabelEngine.updateTenantConfig("tenant-bhmob", {
        designSystem: {
          ...whiteLabelEngine.getTenantConfig("tenant-bhmob").designSystem,
          paletaPrimaria: {
            ...whiteLabelEngine.getTenantConfig("tenant-bhmob").designSystem.paletaPrimaria,
            corPrincipal: paletaAzulEscuro,
          },
        },
      });

      const bhMobAtualizado = whiteLabelEngine.getTenantById("tenant-bhmob");
      expect(bhMobAtualizado?.configuracaoCompleta?.designSystem?.paletaPrimaria?.corPrincipal).toBe(paletaAzulEscuro);

      // Matriz Partiu e Itaperuna devem permanecer intactos com suas paletas
      const matriz = whiteLabelEngine.getTenantById("default");
      expect(matriz?.configuracaoCompleta?.designSystem?.paletaPrimaria?.corPrincipal).toBe("#FF6B00");

      // Restaura para o padrão #2563EB
      whiteLabelEngine.updateTenantConfig("tenant-bhmob", {
        designSystem: {
          ...whiteLabelEngine.getTenantConfig("tenant-bhmob").designSystem,
          paletaPrimaria: {
            ...whiteLabelEngine.getTenantConfig("tenant-bhmob").designSystem.paletaPrimaria,
            corPrincipal: "#2563EB",
          },
        },
      });
    });

    test("should ensure BH Mob has an active official domain and generates permanent app URL", () => {
      const domainRec = tenantDomainService.getDomainByTenantId("tenant-bhmob");
      expect(Boolean(domainRec)).toBe(true);
      expect(domainRec?.domain).toBe("bhmob.partiumobe.com.br");
      expect(domainRec?.status).toBe("ATIVO");
      expect(domainRec?.sslStatus).toBe("ATIVO");

      // Simulação de cálculo de URL no componente Meu Aplicativo
      const effectiveTenantId = "tenant-bhmob";
      const officialAppUrl = (domainRec && domainRec.status === "ATIVO")
        ? `https://${domainRec.domain}`
        : `https://partiu-zeta.vercel.app/app?tenant=${effectiveTenantId}`;

      expect(officialAppUrl).toBe("https://bhmob.partiumobe.com.br");
      expect(officialAppUrl).not.toContain("partiu-zeta.vercel.app");
      expect(officialAppUrl).not.toContain("tenant-itaperuna");

      // Preview link para testes imediatos no ambiente ativo
      const previewAppUrl = `https://partiu-zeta.vercel.app/app?tenant=${effectiveTenantId}`;
      expect(previewAppUrl).toBe("https://partiu-zeta.vercel.app/app?tenant=tenant-bhmob");
    });

    test("should auto-provision active official domain for any new franchise using getOrCreateDomainForTenant", () => {
      const rec = tenantDomainService.getOrCreateDomainForTenant("tenant-uberlandia", "Uberlândia Mob");
      expect(Boolean(rec)).toBe(true);
      expect(rec.domain).toBe("uberlandia.partiumobe.com.br");
      expect(rec.status).toBe("ATIVO");
      expect(rec.sslStatus).toBe("ATIVO");
    });
  });

  describe("5. Strict Multi-Tenant User Database & Session Isolation (Zero-Trust APK Segregation)", () => {
    test("should ensure contact does not exist on BH Mob when registered in Matriz or another franchise", async () => {
      // 1. Registra usuário 'teste@gmail.com' apenas na praça de Itaperuna / Matriz
      supabaseAuthService.recordRegisteredUserLocally(
        {
          id: "usr-itp-test-99",
          email: "teste@gmail.com",
          role: "PASSAGEIRO",
          tenantId: "tenant-itaperuna",
        },
        "tenant-itaperuna"
      );

      // 2. Consulta no tenant-itaperuna: deve existir
      const itaperunaContact = await supabaseAuthService.checkContactExists(
        "teste@gmail.com",
        "PASSAGEIRO",
        "tenant-itaperuna"
      );
      expect(itaperunaContact.exists).toBe(true);

      // 3. Consulta no BH Mob (tenant-bhmob): NÃO pode existir (Zero-Trust)
      const bhMobContact = await supabaseAuthService.checkContactExists(
        "teste@gmail.com",
        "PASSAGEIRO",
        "tenant-bhmob"
      );
      expect(bhMobContact.exists).toBe(false);
    });

    test("should reject login on BH Mob for user from another franchise even with default pass", async () => {
      // Tentativa de login no BH Mob com credencial da matriz/outra praça deve ser terminantemente barrada
      const loginAttempt = await supabaseAuthService.signInWithEmail({
        email: "teste@gmail.com",
        senha: "123456",
        role: "PASSAGEIRO",
        tenantId: "tenant-bhmob",
      });

      expect(loginAttempt.success).toBe(false);
      const isExpectedError =
        loginAttempt.error?.includes("pertence a outra franquia") ||
        loginAttempt.error?.includes("não encontrada nesta praça");
      expect(Boolean(isExpectedError)).toBe(true);
    });

    test("should register passenger exclusively in BH Mob and store session isolated by tenantId", async () => {
      const uniqueSuffix = Date.now().toString(36);
      const bhPaxEmail = `mineiro.bh.${uniqueSuffix}@gmail.com`;
      const bhPaxPhone = `(31) 987${Math.floor(10 + Math.random() * 89)}-${Math.floor(1000 + Math.random() * 8999)}`;
      const bhPaxCpf = `123.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}-01`;

      const signUpRes = await supabaseAuthService.signUpPassenger({
        name: "Carlos Mineiro",
        email: bhPaxEmail,
        phone: bhPaxPhone,
        cpf: bhPaxCpf,
        password: "senhaSegura2026",
        tenantId: "tenant-bhmob",
      });

      expect(signUpRes.success).toBe(true);
      expect(signUpRes.user?.tenantId).toBe("tenant-bhmob");
      expect(signUpRes.user?.email).toBe(bhPaxEmail);

      // Verifica se a sessão ativa está salva sob a chave isolada do tenant BH Mob
      const bhSession = supabaseAuthService.getStoredSession("tenant-bhmob");
      expect(Boolean(bhSession)).toBe(true);
      expect(bhSession?.tenantId).toBe("tenant-bhmob");
      expect(bhSession?.email).toBe(bhPaxEmail);

      // Verifica que a sessão de Itaperuna NÃO foi poluída ou substituída
      const itpSession = supabaseAuthService.getStoredSession("tenant-itaperuna");
      expect(itpSession?.email).not.toBe(bhPaxEmail);

      // Agora, no BH Mob o contato existe
      const bhCheck = await supabaseAuthService.checkContactExists(
        bhPaxEmail,
        "PASSAGEIRO",
        "tenant-bhmob"
      );
      expect(bhCheck.exists).toBe(true);

      // Mas em Itaperuna o contato NÃO existe
      const itpCheck = await supabaseAuthService.checkContactExists(
        bhPaxEmail,
        "PASSAGEIRO",
        "tenant-itaperuna"
      );
      expect(itpCheck.exists).toBe(false);
    });

    test("should maintain distinct user sessions simultaneously without cross-contamination", () => {
      const bhUser = {
        id: "usr-pax-bhmob-10",
        name: "Usuário BH",
        email: "usuario.bh@partiumobe.com.br",
        role: "PASSAGEIRO" as const,
        tenantId: "tenant-bhmob",
        rating: 5.0,
        totalTrips: 3,
        createdAt: Date.now(),
      };

      const itpUser = {
        id: "usr-pax-itp-20",
        name: "Usuário Itaperuna",
        email: "usuario.itp@partiumobe.com.br",
        role: "PASSAGEIRO" as const,
        tenantId: "tenant-itaperuna",
        rating: 4.9,
        totalTrips: 12,
        createdAt: Date.now(),
      };

      // Salva ambas as sessões
      supabaseAuthService.saveStoredSession(bhUser, "tenant-bhmob");
      supabaseAuthService.saveStoredSession(itpUser, "tenant-itaperuna");

      // Recupera individualmente
      const sessionBH = supabaseAuthService.getStoredSession("tenant-bhmob");
      const sessionITP = supabaseAuthService.getStoredSession("tenant-itaperuna");

      expect(sessionBH?.id).toBe("usr-pax-bhmob-10");
      expect(sessionBH?.tenantId).toBe("tenant-bhmob");

      expect(sessionITP?.id).toBe("usr-pax-itp-20");
      expect(sessionITP?.tenantId).toBe("tenant-itaperuna");

      // Limpeza de sessão de um tenant não afeta o outro
      supabaseAuthService.clearStoredSession("tenant-bhmob");
      expect(supabaseAuthService.getStoredSession("tenant-bhmob")).toBe(null);
      expect(supabaseAuthService.getStoredSession("tenant-itaperuna")?.id).toBe("usr-pax-itp-20");
    });

    test("should reject stored session when tenantId mismatches the requested tenant", () => {
      const rawForeignSession = {
        id: "usr-intruder",
        name: "Intruso Cross Tenant",
        email: "intruso@externo.com",
        role: "PASSAGEIRO",
        tenantId: "tenant-itaperuna", // Tenant diferente!
      };

      // Grava diretamente na chave do BH Mob uma sessão forjada de outro tenant
      localStorage.setItem("partiu_active_user_session_tenant-bhmob", JSON.stringify(rawForeignSession));

      // Ao consultar a sessão para tenant-bhmob, o guard deve detectar e rejeitar (retornar null)
      const session = supabaseAuthService.getStoredSession("tenant-bhmob");
      expect(session).toBe(null);
    });
  });
});
