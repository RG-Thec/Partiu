import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Bike,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";
import { NativeSurface, NativeRipple } from "@/components/native";

export const Route = createFileRoute("/escolher-tipo-cadastro")({
  head: () => ({
    meta: [
      { title: "Como deseja se cadastrar? | PARTIU" },
      {
        name: "description",
        content:
          "Cadastre-se no PARTIU como passageiro para pedir corridas ou como motorista/entregador parceiro para faturar com seu veículo.",
      },
    ],
  }),
  component: EscolherTipoCadastroPage,
});

export function EscolherTipoCadastroPage() {
  const navigate = useNavigate();
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;
  const appName = branding?.appName || DEFAULT_APP_CONFIG.branding.appName;

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col font-sans transition-colors duration-200 overflow-x-hidden overflow-y-auto bg-slate-50 text-slate-900 p-3.5 sm:p-6 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]"
      style={{
        fontFamily: ui.fontFamily,
      }}
    >
      {/* Top Header */}
      <div className="mx-auto w-full max-w-md pt-[max(0.25rem,calc(env(safe-area-inset-top,0px)))] flex items-center justify-between pb-2">
        <Link
          to="/"
          className="flex min-h-[34px] min-w-[34px] h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs active:scale-95 transition-all cursor-pointer hover:bg-slate-100"
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: colors.primary }}
        >
          <ShieldCheck className="h-4 w-4" />
          Criar Nova Conta
        </span>
        <div className="w-8.5" />
      </div>

      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-start sm:justify-center py-3 sm:py-5">
        {/* Card Elevado do Design System */}
        <div
          className="w-full p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xl sm:shadow-2xl shadow-slate-200/50 space-y-5 transition-all duration-200"
          style={{ borderRadius: ui.borderRadius || "1.5rem" }}
        >
          {/* Cabeçalho do Card Padrão Design System */}
          <div className="text-center">
            <h1
              className="text-xl sm:text-[22px] font-black tracking-tight"
              style={{ color: colors.textPrimary }}
            >
              Criar Nova Conta
            </h1>
            <p className="text-xs mt-1 font-normal" style={{ color: colors.textSecondary }}>
              Como você deseja utilizar o aplicativo {appName}?
            </p>
            {/* Barra de destaque na cor primária do Franqueado */}
            <div
              className="w-8 h-1 rounded-full mx-auto mt-2.5 mb-5 transition-colors"
              style={{ backgroundColor: colors.primary }}
            />
          </div>

          {/* Opções de Perfil com Design Moderno */}
          <div className="space-y-3">
            {/* Opção 1: Sou Passageiro */}
            <Link to="/cadastro-passageiro" className="block w-full">
              <div
                className="group relative overflow-hidden flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer shadow-xs hover:shadow-md"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold shadow-xs group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Car className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                      Quero ser Passageiro
                    </p>
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: `${colors.primary}12`,
                        color: colors.primary,
                        borderColor: `${colors.primary}30`,
                      }}
                    >
                      Viagens
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">
                    Chame carros e motos com preço justo e PIN seguro.
                  </p>
                </div>
                <span className="text-slate-400 group-hover:text-slate-800 transition-transform group-hover:translate-x-0.5 font-bold text-sm">
                  ➔
                </span>
              </div>
            </Link>

            {/* Opção 2: Sou Motorista ou Entregador */}
            <Link to="/cadastro-motorista" className="block w-full">
              <div
                className="group relative overflow-hidden flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer shadow-xs hover:shadow-md"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs group-hover:scale-105 transition-transform bg-slate-100 text-slate-800 border border-slate-200"
                >
                  <Bike className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                      Motorista ou Entregador
                    </p>
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border bg-emerald-50 text-emerald-600 border-emerald-200"
                    >
                      0% Taxa
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">
                    Cadastre seu carro ou moto e fature até 100% líquido.
                  </p>
                </div>
                <span className="text-slate-400 group-hover:text-slate-800 transition-transform group-hover:translate-x-0.5 font-bold text-sm">
                  ➔
                </span>
              </div>
            </Link>
          </div>

          {/* Link para Login */}
          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500">
              Já possui uma conta ativa?{" "}
              <Link
                to="/auth"
                className="font-bold hover:underline ml-1"
                style={{ color: colors.primary }}
              >
                Fazer login
              </Link>
            </p>
          </div>

          {/* Rodapé Interno do Card */}
          <div className="border-t border-slate-100 pt-3.5 mt-5">
            <p className="text-[11px] text-slate-400 text-center">
              © {new Date().getFullYear()} {appName} · Mobilidade conectada
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé Operacional */}
      <div
        className="mx-auto w-full max-w-md pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500"
      >
        <Link to="/app" className="hover:text-slate-900 font-medium">
          App Passageiro
        </Link>
        <span>•</span>
        <Link to="/app/motorista" className="hover:text-slate-900 font-medium">
          Cockpit Motorista
        </Link>
        <span>•</span>
        <Link to="/app/admin/login" className="hover:text-slate-900 font-medium">
          Admin
        </Link>
      </div>
    </div>
  );
}
