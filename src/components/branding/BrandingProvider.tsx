import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  type AppBrandingRecord,
  type BrandingContextValue,
  DEFAULT_BRANDING,
  BRANDING_PRESETS,
  themeEngine,
} from "@/lib/branding";
import { supabase } from "@/integrations/supabase/client";
import { silentCatchWarn } from "@/lib/structured-logger";
import { Globe, Radio } from "lucide-react";
import { tenantDomainService, type TenantDomainResolution } from "@/lib/white-label/tenant-domain-service";

const STORAGE_KEY_BRANDING = "partiu_active_branding_v2";
const STORAGE_KEY_TENANT = "partiu_active_tenant_id_v2";

export const BrandingContext = createContext<BrandingContextValue | null>(null);

function getInitialTenantId(): string {
  if (typeof window === "undefined") return "default";
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const resolution = tenantDomainService.resolveTenantFromHost(window.location.hostname, urlParams);
    if (resolution.tenantId && resolution.tenantId !== "default") {
      return resolution.tenantId;
    }

    const tenantParam = urlParams.get("tenant") || urlParams.get("tenant_id");
    if (tenantParam) return tenantParam.trim();

    const stored = localStorage.getItem(STORAGE_KEY_TENANT);
    if (stored) return stored.trim();
  } catch {}
  return "default";
}

function getInitialBranding(tenantId: string): AppBrandingRecord {
  if (typeof window === "undefined") return DEFAULT_BRANDING;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_BRANDING);
    if (stored) {
      const parsed = JSON.parse(stored) as AppBrandingRecord;
      if (parsed && (parsed.tenant_id === tenantId || tenantId === "default")) {
        // Se os dados salvos ainda forem o azul legado da antiga migração (#003366 com fundo escuro #0B132B)
        // e o usuário não escolheu explicitamente a paleta azul real, migra para o padrão Laranja Solar
        const savedPalette = localStorage.getItem("partiu_active_palette_id");
        if (
          parsed.primary_color === "#003366" &&
          (parsed.background_color === "#0B132B" || !savedPalette)
        ) {
          return { ...DEFAULT_BRANDING, tenant_id: tenantId };
        }
        return parsed;
      }
    }
  } catch {}
  return { ...DEFAULT_BRANDING, tenant_id: tenantId };
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [activeTenantId, setActiveTenantIdState] = useState<string>(getInitialTenantId);
  const [isMounted, setIsMounted] = useState(false);
  const [domainResolution, setDomainResolution] = useState<TenantDomainResolution>(() => {
    if (typeof window === "undefined") {
      return { tenantId: "default", source: "DEFAULT", isCustomDomain: false, status: "OK" };
    }
    const urlParams = new URLSearchParams(window.location.search);
    return tenantDomainService.resolveTenantFromHost(window.location.hostname, urlParams);
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [branding, setBrandingState] = useState<AppBrandingRecord>(() => {
    const init = getInitialBranding(getInitialTenantId());
    themeEngine.applyTheme(init);
    return init;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const activeTenantRef = useRef(activeTenantId);
  activeTenantRef.current = activeTenantId;

  // Atualiza a tag <link rel="manifest"> no DOM para apontar para o manifesto dinâmico do tenant ativo
  useEffect(() => {
    if (typeof document === "undefined") return;
    try {
      let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "manifest";
        document.head.appendChild(link);
      }
      const targetHref = `/manifest.webmanifest?tenant=${encodeURIComponent(activeTenantId)}`;
      if (link.getAttribute("href") !== targetHref) {
        link.setAttribute("href", targetHref);
      }
    } catch {}
  }, [activeTenantId]);

  // Aplicação de tema síncrona
  const applyBrandingTheme = useCallback((b: AppBrandingRecord) => {
    setBrandingState(b);
    themeEngine.applyTheme(b);
    try {
      localStorage.setItem(STORAGE_KEY_BRANDING, JSON.stringify(b));
    } catch {}
  }, []);

  // Escuta seleção dinâmica de paletas monocromáticas
  useEffect(() => {
    function handlePaletteUpdated(e: Event) {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { palette, primaryColor, branding: eventBranding } = customEvent.detail;
        if (palette?.colors?.primary) {
          const pal = palette;
          setBrandingState((prev) => ({
            ...prev,
            primary_color: pal.colors.primary,
            secondary_color: pal.colors.secondary || prev.secondary_color,
            accent_color: pal.colors.accent || prev.accent_color,
            background_color: pal.colors.background || prev.background_color,
            surface_color: pal.colors.surface || prev.surface_color,
            text_primary: pal.colors.textPrimary || prev.text_primary,
            text_secondary: pal.colors.textSecondary || prev.text_secondary,
            header_gradient_start: pal.colors.headerGradientStart || prev.header_gradient_start,
            header_gradient_end: pal.colors.headerGradientEnd || prev.header_gradient_end,
            footer_gradient_start: pal.colors.headerGradientStart || prev.footer_gradient_start,
            footer_gradient_end: pal.colors.headerGradientEnd || prev.footer_gradient_end,
          }));
        } else if (eventBranding) {
          setBrandingState((prev) => ({
            ...prev,
            ...eventBranding,
            primary_color: eventBranding.primary_color || primaryColor || prev.primary_color,
          }));
        } else if (primaryColor) {
          setBrandingState((prev) => ({
            ...prev,
            primary_color: primaryColor,
          }));
        }
      }
    }
    window.addEventListener("partiu:theme-palette-updated", handlePaletteUpdated);
    return () => window.removeEventListener("partiu:theme-palette-updated", handlePaletteUpdated);
  }, []);

  // Busca do Supabase
  const fetchTenantBranding = useCallback(async (tenantId: string) => {
    setIsLoading(true);
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from("app_branding" as any)
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (error) {
        // Se a tabela não existir ou outro erro suave de rede
        silentCatchWarn("BrandingProvider:fetchTenantBranding", error);
      } else if (data) {
        const loaded = data as unknown as AppBrandingRecord;
        const savedPaletteId = typeof window !== "undefined" ? localStorage.getItem("partiu_active_palette_id") : null;
        
        // Aplica fielmente a identidade visual configurada no banco de dados
        applyBrandingTheme(loaded);
        setLastSyncedAt(new Date());
      } else if (tenantId !== "default") {
        // Fallback para default
        const { data: defaultData } = await supabase
          .from("app_branding" as any)
          .select("*")
          .eq("tenant_id", "default")
          .maybeSingle();
        if (defaultData) {
          applyBrandingTheme(defaultData as unknown as AppBrandingRecord);
          setLastSyncedAt(new Date());
        }
      }
    } catch (err) {
      silentCatchWarn("BrandingProvider:fetchTenantBranding:exception", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [applyBrandingTheme]);

  // Carregar e sincronizar quando o activeTenantId mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TENANT, activeTenantId);
    } catch {}

    fetchTenantBranding(activeTenantId);

    // Canal Realtime Supabase
    const channel = supabase
      .channel(`realtime_branding_${activeTenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_branding",
        },
        (payload) => {
          const newRec = payload.new as unknown as AppBrandingRecord;
          if (newRec && (newRec.tenant_id === activeTenantRef.current || newRec.tenant_id === "default")) {
            applyBrandingTheme(newRec);
            setLastSyncedAt(new Date());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTenantId, fetchTenantBranding, applyBrandingTheme]);

  // Alternar Tenant
  const setTenantId = useCallback(async (newTenantId: string) => {
    const cleanId = newTenantId.trim();
    if (!cleanId || cleanId === activeTenantRef.current) return;
    setActiveTenantIdState(cleanId);
    await fetchTenantBranding(cleanId);
  }, [fetchTenantBranding]);

  // Atualizar branding no banco e localmente
  const updateBranding = useCallback(async (partial: Partial<AppBrandingRecord>): Promise<boolean> => {
    setIsSyncing(true);
    const updated: AppBrandingRecord = {
      ...branding,
      ...partial,
      tenant_id: activeTenantRef.current,
      updated_at: new Date().toISOString(),
    };

    // Aplica imediatamente na UI (Zero Latency)
    applyBrandingTheme(updated);

    try {
      const { error } = await supabase
        .from("app_branding" as any)
        .upsert(updated as any, { onConflict: "tenant_id" });

      if (error) {
        silentCatchWarn("BrandingProvider:updateBranding:db", error);
        return false;
      }
      setLastSyncedAt(new Date());
      return true;
    } catch (err) {
      silentCatchWarn("BrandingProvider:updateBranding:exception", err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [branding, applyBrandingTheme]);

  // Aplicar Preset em 1 clique
  const applyPreset = useCallback(async (presetId: string): Promise<boolean> => {
    const preset = BRANDING_PRESETS.find((p) => p.id === presetId);
    if (!preset) return false;

    const merged: AppBrandingRecord = {
      ...branding,
      ...preset.branding,
      tenant_id: activeTenantRef.current,
    };

    return updateBranding(merged);
  }, [branding, updateBranding]);

  // Upload de Mídia para Supabase Storage (branding-assets)
  const uploadAsset = useCallback(async (file: File, type: "logo" | "splash" | "favicon" | "app_icon" | "push_icon"): Promise<string | null> => {
    if (!file) return null;

    // Validação rígida: tamanho máximo 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error("O arquivo excede o limite máximo permitido de 5MB.");
    }

    // Validação de tipo MIME
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Formato inválido. Apenas PNG, SVG, WEBP e JPEG são aceitos.");
    }

    try {
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `${activeTenantRef.current}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `tenants/${fileName}`;

      const { data, error } = await supabase.storage
        .from("branding-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from("branding-assets")
        .getPublicUrl(filePath);

      const url = publicUrlData?.publicUrl;
      if (url) {
        const patch: Partial<AppBrandingRecord> = {};
        if (type === "logo") patch.logo_url = url;
        if (type === "splash") patch.splash_logo_url = url;
        if (type === "favicon") patch.favicon_url = url;
        if (type === "app_icon") patch.app_icon_url = url;
        if (type === "push_icon") patch.push_icon_url = url;
        await updateBranding(patch);
        return url;
      }
      return null;
    } catch (err: any) {
      silentCatchWarn("BrandingProvider:uploadAsset", err);
      throw err;
    }
  }, [updateBranding]);

  // Resetar aos padrões canônicos
  const resetToDefault = useCallback(async (): Promise<boolean> => {
    return updateBranding({
      ...DEFAULT_BRANDING,
      tenant_id: activeTenantRef.current,
    });
  }, [updateBranding]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      branding,
      activeTenantId,
      isLoading,
      isSyncing,
      lastSyncedAt,
      setTenantId,
      updateBranding,
      applyPreset,
      uploadAsset,
      resetToDefault,
    }),
    [
      branding,
      activeTenantId,
      isLoading,
      isSyncing,
      lastSyncedAt,
      setTenantId,
      updateBranding,
      applyPreset,
      uploadAsset,
      resetToDefault,
    ]
  );

  return (
    <BrandingContext.Provider value={value}>
      {isMounted && domainResolution.status === "DOMAIN_NOT_FOUND" ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center">
          <div className="max-w-md w-full p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Globe className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white">404 - Franquia Não Encontrada</h1>
            <p className="mt-2 text-sm text-slate-400">
              O domínio <strong className="text-amber-400 font-mono">{domainResolution.matchedDomain}</strong> não está associado a nenhuma praça ativa do ecossistema PARTIU MOBE.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href="https://partiumobe.com.br"
                className="w-full py-3 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow hover:bg-amber-400 transition"
              >
                Acessar Portal Principal
              </a>
              <button
                onClick={() => {
                  setDomainResolution({ ...domainResolution, status: "OK" });
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700 transition cursor-pointer"
              >
                Acessar em Modo de Demonstração (Tenant Padrão)
              </button>
            </div>
          </div>
        </div>
      ) : isMounted && domainResolution.status === "DNS_PENDING" ? (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center">
          <div className="max-w-md w-full p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 text-blue-400">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-white">Domínio em Propagação DNS</h1>
            <p className="mt-2 text-sm text-slate-400">
              O domínio <strong className="text-blue-400 font-mono">{domainResolution.matchedDomain}</strong> foi cadastrado, mas o apontamento DNS (<code className="text-blue-300">CNAME cname.partiumobe.com.br</code>) ainda está em propagação.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm shadow hover:bg-blue-500 transition cursor-pointer"
              >
                Rechecar Propagação DNS
              </button>
              <button
                onClick={() => {
                  setDomainResolution({ ...domainResolution, status: "OK" });
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium text-xs hover:bg-slate-700 transition cursor-pointer"
              >
                Continuar Mesmo Assim (Testes)
              </button>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </BrandingContext.Provider>
  );
}
