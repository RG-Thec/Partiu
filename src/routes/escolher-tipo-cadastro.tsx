import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Car,
  Bike,
  ShieldCheck,
  ChevronRight,
  User,
} from "lucide-react";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";

export const Route = createFileRoute("/escolher-tipo-cadastro")({
  head: () => ({
    meta: [
      { title: "Como deseja se cadastrar? | PARTIU" },
      {
        name: "description",
        content:
          "Cadastre-se no PARTIU como passageiro para pedir corridas ou como motorista parceiro para faturar com seu veículo.",
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
      className="min-h-[100dvh] w-full flex flex-col font-sans transition-colors duration-200 overflow-x-hidden overflow-y-auto bg-slate-50 text-slate-900 p-4 sm:p-6 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]"
      style={{
        fontFamily: ui.fontFamily,
      }}
    >
      {/* Top Header Limpo */}
      <header className="mx-auto w-full max-w-md pt-[max(0.5rem,calc(env(safe-area-inset-top,0px)))] flex items-center justify-between pb-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition active:scale-95 shadow-2xs"
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Início</span>
        </Link>
        <span
          className="text-xs font-bold tracking-tight flex items-center gap-1.5 px-3 py-1 rounded-full border"
          style={{
            borderColor: `${colors.primary}25`,
            backgroundColor: `${colors.primary}0D`,
            color: colors.primary,
          }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Criar Conta</span>
        </span>
        <div className="w-14" />
      </header>

      <main className="w-full max-w-md mx-auto flex-1 flex flex-col justify-start sm:justify-center py-2 pb-8 sm:pb-12">
        {/* Card Elevado do Design System */}
        <div
          className="w-full p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-100/80 space-y-5 transition-all duration-200"
          style={{ borderRadius: ui.borderRadius || "1.25rem" }}
        >
          {/* Cabeçalho */}
          <div className="text-center pb-1">
            <h1
              className="text-xl sm:text-[22px] font-black tracking-tight text-slate-900"
            >
              Como deseja se cadastrar?
            </h1>
            <p className="text-xs mt-1 font-normal text-slate-500">
              Escolha seu perfil de acesso no {appName}
            </p>
            <div
              className="w-7 h-0.5 rounded-full mx-auto mt-2 transition-colors"
              style={{ backgroundColor: colors.primary }}
            />
          </div>

          {/* Opções de Perfil com Design Moderno */}
          <div className="space-y-3">
            {/* Opção 1: Passageiro */}
            <Link to="/cadastro-passageiro" className="block w-full group">
              <div
                className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all active:scale-[0.99] cursor-pointer shadow-xs hover:shadow-sm"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold shadow-xs transition-transform group-hover:scale-105"
                  style={{ backgroundColor: colors.primary }}
                >
                  <User className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      Quero ser Passageiro
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 font-normal mt-0.5 leading-snug">
                    Solicite viagens e entregas com preço justo e acompanhamento em tempo real.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Opção 2: Motorista Parceiro */}
            <Link to="/cadastro-motorista" className="block w-full group">
              <div
                className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 transition-all active:scale-[0.99] cursor-pointer shadow-xs hover:shadow-sm"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-bold shadow-xs transition-transform group-hover:scale-105"
                >
                  <Car className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 leading-tight">
                      Motorista Parceiro
                    </p>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      PIX D+0
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-normal mt-0.5 leading-snug">
                    Cadastre seu carro ou moto e fature com autonomia e repasse imediato.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>

          {/* Link para Login */}
          <div className="border-t border-slate-100 pt-3 text-center">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center text-xs font-medium text-slate-600 hover:underline py-1 transition-colors"
            >
              Já possui uma conta?{" "}
              <span className="font-bold underline ml-1" style={{ color: colors.primary }}>
                Entrar
              </span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-slate-400 py-2">
        {appName} Mobilidade Urbana & Logística Expressa
      </footer>
    </div>
  );
}
