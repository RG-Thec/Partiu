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
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
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
  const { branding } = appConfig;
  const { colors, ui, appName } = branding;

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
        {/* Logo e Título */}
        <div className="text-center mb-5">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md mb-2.5"
            style={{ backgroundColor: colors.primary }}
          >
            <Zap className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h1
            className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900"
          >
            Como deseja usar o {appName}?
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Selecione uma opção para continuar seu cadastro com e-mail ou celular
          </p>
        </div>

        {/* Cards de Opção Proporcionais e Fluidos */}
        <div className="space-y-2">
          {/* Opção 1: Sou Passageiro */}
          <Link to="/cadastro-passageiro" className="block w-full">
            <NativeSurface
              elevation={1}
              padding="none"
              className="group relative overflow-hidden flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <NativeRipple color={colors.primary} />
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white font-bold shadow-2xs group-hover:scale-105 transition-transform"
                style={{ backgroundColor: colors.primary }}
              >
                <Car className="h-4.5 w-4.5 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
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
              <ArrowRight
                className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-slate-800"
              />
            </NativeSurface>
          </Link>

          {/* Opção 2: Sou Motorista ou Entregador */}
          <Link to="/cadastro-motorista" className="block w-full">
            <NativeSurface
              elevation={1}
              padding="none"
              className="group relative overflow-hidden flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <NativeRipple color={colors.primary} />
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold shadow-2xs group-hover:scale-105 transition-transform bg-slate-100 text-slate-800 border border-slate-200"
              >
                <Bike className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight">
                    Motorista ou Entregador Parceiro
                  </p>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border bg-emerald-50 text-emerald-600 border-emerald-200"
                  >
                    PIX D+0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">
                  Cadastre seu carro ou moto e fature com até 100% líquido.
                </p>
              </div>
              <ArrowRight
                className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-slate-800"
              />
            </NativeSurface>
          </Link>
        </div>

        {/* Link para Login */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Já possui uma conta ativa no {appName}?{" "}
            <Link
              to="/auth"
              className="font-bold hover:underline ml-1"
              style={{ color: colors.primary }}
            >
              Fazer Login
            </Link>
          </p>
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
