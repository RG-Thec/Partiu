import { useState, useEffect, useCallback } from "react";
import {
  getIdentidadeVisual,
  type ConfigIdentidadeVisual,
} from "@/lib/superadmin-config";
import {
  whiteLabelEngine,
  type WhiteLabelFullConfig,
  type WhiteLabelTenantRecord,
  type BusinessVerticalId,
  type HomeBlockItem,
} from "@/lib/white-label";

import { useBranding } from "@/hooks/useBranding";

export function useBrandTheme() {
  const brandingCtx = useBranding();
  const branding = brandingCtx?.branding;
  const [identidade, setIdentidade] = useState<ConfigIdentidadeVisual>(() => {
    return getIdentidadeVisual();
  });

  const [config, setConfig] = useState<WhiteLabelFullConfig>(() => {
    return whiteLabelEngine.getActiveConfig();
  });

  const [activeTenant, setActiveTenant] = useState<WhiteLabelTenantRecord>(() => {
    return whiteLabelEngine.getActiveTenant();
  });

  useEffect(() => {
    function handleWhiteLabelAtualizacao(e: any) {
      const novaConfig = (e.detail?.config || (e.detail?.brandCenter ? e.detail : null)) || whiteLabelEngine.getActiveConfig();
      setConfig(novaConfig);
      setActiveTenant(whiteLabelEngine.getActiveTenant());
    }

    function handleIdentidadeLegada(e: any) {
      if (e.detail) {
        setIdentidade(e.detail);
      } else {
        setIdentidade(getIdentidadeVisual());
      }
    }

    window.addEventListener("partiu:whitelabel-updated", handleWhiteLabelAtualizacao);
    window.addEventListener("partiu:identidade-atualizada", handleIdentidadeLegada);
    window.addEventListener("storage", handleWhiteLabelAtualizacao);

    return () => {
      window.removeEventListener("partiu:whitelabel-updated", handleWhiteLabelAtualizacao);
      window.removeEventListener("partiu:identidade-atualizada", handleIdentidadeLegada);
      window.removeEventListener("storage", handleWhiteLabelAtualizacao);
    };
  }, []);

  // Handlers de mutação reativa sincronizados com Supabase e BrandingProvider
  const updateConfig = useCallback(
    (partial: Partial<WhiteLabelFullConfig>) => {
      const updated = whiteLabelEngine.updateActiveConfig(partial);
      setConfig(updated);
      setActiveTenant(whiteLabelEngine.getActiveTenant());

      // Sincroniza em lockstep com o BrandingProvider e Supabase
      if (brandingCtx?.updateBranding) {
        const prim = updated.designSystem?.paletaPrimaria;
        void brandingCtx.updateBranding({
          app_name: updated.brandCenter?.nomePlataforma,
          company_name: updated.nativeApp?.razaoSocial || updated.brandCenter?.slogan,
          primary_color: prim?.corPrincipal,
          secondary_color: prim?.corSecundaria,
          accent_color: prim?.corTerciaria || prim?.corSecundaria,
          background_color: prim?.corFundoApp,
          surface_color: prim?.corSuperficieCard,
          text_primary: prim?.corTextoPrincipal,
          header_gradient_start: prim?.corPrincipal,
          header_gradient_end: prim?.corSecundaria,
          logo_url: updated.brandCenter?.logos?.logoPrincipalUrl,
          favicon_url: updated.brandCenter?.favicons?.faviconDesktopUrl,
          splash_logo_url: updated.brandCenter?.splash?.splashAndroidUrl || updated.nativeApp?.splashAndroidUrl,
        });
      }

      return updated;
    },
    [brandingCtx]
  );

  const switchTenant = useCallback((tenantId: string) => {
    const t = whiteLabelEngine.switchTenant(tenantId);
    if (t) {
      setActiveTenant(t);
      setConfig(t.configuracaoCompleta);
      if (brandingCtx?.setTenantId) {
        void brandingCtx.setTenantId(tenantId);
      }
    }
    return t;
  }, [brandingCtx]);

  const cloneTenant = useCallback(
    (targetTenantId: string, nomeCidade: string, estadoUf: string) => {
      const cloned = whiteLabelEngine.cloneTenant(
        activeTenant.tenantId,
        targetTenantId,
        nomeCidade,
        estadoUf
      );
      return cloned;
    },
    [activeTenant.tenantId]
  );

  const toggleBusinessModel = useCallback(
    (verticalId: BusinessVerticalId, ativo: boolean) => {
      const updated = whiteLabelEngine.toggleBusinessModel(verticalId, ativo);
      setConfig(updated);
      return updated;
    },
    []
  );

  const reorderHomeBlocks = useCallback((blocks: HomeBlockItem[]) => {
    const updated = whiteLabelEngine.reorderHomeBlocks(blocks);
    setConfig(updated);
    return updated;
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const updated = whiteLabelEngine.applyPreset(presetId);
    if (updated) {
      setConfig(updated);
      if (brandingCtx?.applyPreset) {
        void brandingCtx.applyPreset(presetId);
      }
    }
    return Boolean(updated);
  }, [brandingCtx]);

  const resetToDefaults = useCallback(() => {
    const fresh = whiteLabelEngine.resetToDefaults();
    setConfig(fresh);
    if (brandingCtx?.resetToDefault) {
      void brandingCtx.resetToDefault();
    }
    return fresh;
  }, [brandingCtx]);

  // Mapeamentos unificados: Branding Supabase Realtime tem precedência máxima, seguido de WhiteLabel e legado
  const nomeApp = branding?.app_name || config.brandCenter?.nomePlataforma || identidade.nomeApp || "PARTIU";
  const sloganApp = branding?.company_name || config.brandCenter?.slogan || identidade.sloganApp || "Mobilidade inteligente para sua cidade";
  const corPrimaria = branding?.primary_color || config.designSystem?.paletaPrimaria?.corPrincipal || identidade.corPrimaria || "#FF6B00";
  const corPrimariaHover = config.designSystem?.paletaPrimaria?.corPrincipalHover || branding?.secondary_color || identidade.corPrimariaHover || "#EA580C";
  const corSecundaria = branding?.secondary_color || config.designSystem?.paletaPrimaria?.corSecundaria || identidade.corSecundaria || "#FFB800";
  const corTextoPrimaria = branding?.text_primary || config.designSystem?.paletaPrimaria?.corTextoPrincipal || identidade.corTextoPrimaria || "#0F172A";
  const corFundoApp = branding?.background_color || config.designSystem?.paletaPrimaria?.corFundoApp || identidade.corFundoApp || "#FAFAFA";
  const nomeModuloPay = "99Pay";
  const nomeModuloEntrega = config.businessModels?.verticais?.DELIVERY_FLASH?.nomeExibicao || "Entrega";

  // Gradientes e Sincronização Cabeçalho ↔ Rodapé
  const corCabecalhoInicio = branding?.header_gradient_start || corPrimaria || "#FF6B00";
  const corCabecalhoFim = branding?.header_gradient_end || corSecundaria || "#EA580C";
  const rodapeSincronizadoComCabecalho = branding?.footer_sync_with_header !== false;
  const corRodapeInicio = rodapeSincronizadoComCabecalho
    ? corCabecalhoInicio
    : (branding?.footer_gradient_start || corCabecalhoInicio);
  const corRodapeFim = rodapeSincronizadoComCabecalho
    ? corCabecalhoFim
    : (branding?.footer_gradient_end || corCabecalhoFim);

  return {
    // Legado 100% preservado
    identidade,
    nomeApp,
    sloganApp,
    corPrimaria,
    corPrimariaHover,
    corSecundaria,
    corTextoPrimaria,
    corFundoApp,
    nomeModuloPay,
    nomeModuloEntrega,
    corCabecalhoInicio,
    corCabecalhoFim,
    rodapeSincronizadoComCabecalho,
    corRodapeInicio,
    corRodapeFim,
    bannerComunicacao: identidade.bannerComunicacao,
    bannersComunicacao: identidade.bannersComunicacao?.length
      ? identidade.bannersComunicacao
      : (identidade.bannerComunicacao ? [identidade.bannerComunicacao] : []),
    cardsMobilidade: identidade.cardsMobilidade || [],
    bannerCredito: identidade.bannerCredito || identidade.bannerComunicacao,
    cardsFinancas: identidade.cardsFinancas || [],

    // White Label Enterprise V1
    config,
    brand: config.brandCenter,
    designSystem: config.designSystem,
    typography: config.typography,
    homePage: config.homePage,
    menuBuilder: config.menuBuilder,
    businessModels: config.businessModels,
    driverPlans: config.monetization?.planos || [],
    monetization: config.monetization,
    bannerCms: config.cms,
    geo: config.geo,
    appConfig: config.nativeApp,
    activeTenant,
    allTenants: whiteLabelEngine.getAllTenants(),

    // Ações de Governança
    updateConfig,
    switchTenant,
    cloneTenant,
    toggleBusinessModel,
    reorderHomeBlocks,
    applyPreset,
    exportThemeJson: () => whiteLabelEngine.exportThemeJson(),
    importThemeJson: (json: string) => {
      try {
        const imported = whiteLabelEngine.importThemeJson(json);
        setConfig(imported);
        return { success: true, config: imported };
      } catch (err: any) {
        return { success: false, error: err?.message || "Falha ao importar tema JSON." };
      }
    },
    resetToDefaults,
    branding,
    brandingCtx,
  };
}
