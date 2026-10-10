import React, { useEffect, useState, useMemo } from "react";
import { useBranding } from "@/hooks/useBranding";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { Car, ShieldCheck } from "lucide-react";

export interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

/**
 * 🚀 SPLASH SCREEN ULTRA-CLEAN & RÁPIDA (PADRÃO UBER / LYFT)
 * - Carregamento ágil (~500ms) sem travar a navegação do usuário.
 * - Transição fluida com curva cubic-bezier acelerada.
 * - Emblema minimalista e tipografia hierarquizada.
 */
export function SplashScreen({ onFinish, minDurationMs = 550 }: SplashScreenProps) {
  const { branding } = useBranding();
  const brandTheme = useBrandTheme();

  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasLogoError, setHasLogoError] = useState(false);

  // Mapeamento dinâmico estrito do White Label corporativo
  const appName = branding?.app_name || brandTheme.nomeApp || "PARTIU";
  const companyName = branding?.company_name || brandTheme.sloganApp || "Mobilidade urbana";
  const primaryColor = branding?.primary_color || brandTheme.corPrimaria || "#FF6B00";
  const secondaryColor = branding?.secondary_color || brandTheme.corSecundaria || "#FFB800";
  const logoSrc = branding?.splash_logo_url || branding?.logo_url || "/favicon.svg";

  useEffect(() => {
    const startTime = Date.now();
    const duration = Math.max(minDurationMs, 400);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min((elapsed / duration) * 100, 100);
      setProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          setIsVisible(false);
          onFinish?.();
        }, 220);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [minDurationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Carregando aplicativo ${appName}`}
      className={`fixed inset-0 z-[9999] flex flex-col justify-between items-center select-none overflow-hidden bg-white transition-all duration-400 ease-out ${
        isFadingOut ? "opacity-0 scale-102 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* 1. LUZ AMBIENTE SUAVE NO CENTRO (TOM CLARO, REFINADO & MODERNO) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-[0.08] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Grid Cartográfica Sutil em Tom Claro */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #0F172A 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* Espaçador Superior Seguro */}
      <div className="w-full pt-[max(1rem,env(safe-area-inset-top))]" />

      {/* ================================================================= */}
      {/* CENTRO: IDENTIDADE VISUAL LIMPA, LOGO E INDICADOR DE CARREGAMENTO */}
      {/* ================================================================= */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full my-auto space-y-5">
        {/* Emblema Minimalista em Squircle Flutuante */}
        <div className="relative flex items-center justify-center">
          {/* Pulso de luz suave ao redor */}
          <div
            className="absolute -inset-2 rounded-3xl opacity-20 blur-md pointer-events-none animate-pulse"
            style={{
              backgroundColor: primaryColor,
              animationDuration: "3s",
            }}
            aria-hidden="true"
          />

          <div
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-3.5 flex items-center justify-center border border-slate-100 shadow-[0_12px_36px_rgba(0,0,0,0.08)] transition-transform duration-500"
          >
            {hasLogoError || !logoSrc ? (
              <div
                className="w-full h-full rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                }}
              >
                <Car className="w-10 h-10 text-white drop-shadow-xs" />
              </div>
            ) : (
              <img
                src={logoSrc}
                alt={appName}
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={() => setHasLogoError(true)}
              />
            )}
          </div>
        </div>

        {/* Nome do Aplicativo Oficial com Tipografia Moderna e Forte */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {appName}
          </h1>
          <p className="text-xs sm:text-[13px] font-medium text-slate-500 max-w-[260px] mx-auto leading-relaxed">
            {companyName}
          </p>
        </div>

        {/* BARRA DE CARREGAMENTO ULTRAFINA & MINIMALISTA */}
        <div className="w-full max-w-[200px] sm:max-w-[220px] pt-4 space-y-2">
          {/* Trilha e Barra com Gradiente da Marca */}
          <div className="relative w-full h-1.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-100 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <span>Iniciando</span>
            <span className="font-mono text-slate-600 font-bold">{Math.round(progress)}%</span>
          </div>
        </div>
      </main>

      {/* ================================================================= */}
      {/* RODAPÉ: ASSINATURA DISCRETA E ELEGANTE                             */}
      {/* ================================================================= */}
      <footer className="relative z-10 w-full pb-[max(1.5rem,env(safe-area-inset-bottom))] px-6 flex items-center justify-center text-center">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Ambiente Seguro &amp; Conexão Criptografada</span>
        </div>
      </footer>
    </div>
  );
}

export default SplashScreen;
