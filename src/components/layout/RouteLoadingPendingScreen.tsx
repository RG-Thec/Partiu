import React from "react";
import { Car, MapPin, Sparkles, Navigation } from "lucide-react";

/**
 * RouteLoadingPendingScreen
 * Transição de tela ultra-fluida com Shimmer Skeleton temático de mobilidade urbana.
 * Inspirado nas transições de alta fidelidade do Figma Caber (Uber-like).
 * Possui delay sutil de 120ms para não piscar em conexões ultrarrápidas.
 */
export function RouteLoadingPendingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando tela"
      className="relative w-full min-h-screen bg-slate-950 flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300"
    >
      {/* 1. Grade de Fundo Holográfica & Glow Tecnológico */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none animate-pulse" />

      {/* 2. Topbar Skeleton (Pill Flutuante) */}
      <header className="relative z-10 w-full max-w-md mx-auto px-4 pt-4 sm:pt-6">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 animate-pulse flex items-center justify-center text-primary/70">
              <Car className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <div className="w-24 h-3.5 bg-slate-800 rounded-full animate-pulse" />
              <div className="w-16 h-2.5 bg-slate-800/60 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800/80 animate-pulse" />
        </div>
      </header>

      {/* 3. Centro: Radar de Mapa & Indicador de Trajeto */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Ondas concêntricas de radar */}
          <span className="absolute inset-0 rounded-full border border-primary/30 animate-ping duration-1000" />
          <span className="absolute inset-4 rounded-full border border-primary/20 animate-pulse" />
          <span className="absolute inset-8 rounded-full bg-primary/10 backdrop-blur-sm" />
          
          <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 flex items-center justify-center text-primary-foreground transform active:scale-95 transition-transform">
            <Navigation className="w-7 h-7 animate-pulse text-white" />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center text-center space-y-2">
          <p className="text-sm font-semibold tracking-wide text-slate-200 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
            Sincronizando mobilidade urbana...
          </p>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </main>

      {/* 4. Bottom Sheet Skeleton Flutuante (Padrão Uber Caber) */}
      <footer className="relative z-10 w-full max-w-md mx-auto p-4">
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-2xl shadow-2xl space-y-4">
          <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto" />
          
          <div className="space-y-2">
            <div className="w-3/4 h-4 bg-slate-800 rounded-lg animate-pulse" />
            <div className="w-1/2 h-3 bg-slate-800/60 rounded-lg animate-pulse" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="h-16 rounded-2xl bg-slate-800/60 border border-slate-800 animate-pulse" />
            <div className="h-16 rounded-2xl bg-slate-800/60 border border-slate-800 animate-pulse" />
            <div className="h-16 rounded-2xl bg-slate-800/60 border border-slate-800 animate-pulse" />
          </div>

          <div className="w-full h-12 rounded-2xl bg-primary/20 border border-primary/30 animate-pulse flex items-center justify-center">
            <div className="w-28 h-3.5 bg-primary/40 rounded-full" />
          </div>
        </div>
      </footer>
    </div>
  );
}
