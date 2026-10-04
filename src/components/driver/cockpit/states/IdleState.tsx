import { Power, Wallet, Compass, Car, Flame, ArrowUpRight, ChevronRight, Target, TrendingUp, Clock, Radio } from "lucide-react";
import type { DriverDestination } from "@/services/DriverDestinationModeService";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

interface IdleStateProps {
  ganhosHoje: number;
  corridasFeitas: number;
  destinoAtivo: DriverDestination | null;
  remainingDestinationUses: number;
  diariaRestanteTexto?: string;
  onToggleOnline: () => void;
  onOpenSaquePix: () => void;
  onOpenFinancialDashboard?: () => void;
  onOpenModoDestino: () => void;
  onClearDestino: () => void;
  onOpenTaximetro: () => void;
  onOpenEconomia: () => void;
  onOpenPlanos: () => void;
}

export function IdleState({
  ganhosHoje,
  corridasFeitas,
  destinoAtivo,
  remainingDestinationUses,
  diariaRestanteTexto,
  onToggleOnline,
  onOpenSaquePix,
  onOpenFinancialDashboard,
  onOpenModoDestino,
  onClearDestino,
  onOpenTaximetro,
  onOpenEconomia,
  onOpenPlanos,
}: IdleStateProps) {
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;
  const handleOpenFinance = onOpenFinancialDashboard || onOpenSaquePix;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-300">
      {/* Radar Scanner Visual Widget (Figma Caber Driver Home Screen 79:1634) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <Radio className="w-4 h-4 text-emerald-600 relative z-10" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate leading-tight">
              Radar ativo em 10 km
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block truncate">
              Aguardando novas solicitações de passageiros
            </span>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0 border border-emerald-300/60">
          Alta Demanda
        </span>
      </div>

      {/* Linha 1: Status do Trip Radar & Botão Ficar Offline */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-status-green opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-status-green" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-none truncate">
                Trip radar ativo
              </h3>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300 shrink-0">
                Online
              </span>
              {diariaRestanteTexto && (
                <span
                  style={{
                    color: colors.primary,
                    backgroundColor: `${colors.primary}12`,
                    borderColor: `${colors.primary}30`,
                  }}
                  className="text-xs font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0"
                >
                  <Clock className="w-3 h-3" style={{ color: colors.primary }} />
                  <span>{diariaRestanteTexto}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-1 truncate">
              Buscando chamadas próximas
            </p>
          </div>
        </div>

        {/* Botão Ergonômico Ficar Offline */}
        <button
          type="button"
          onClick={onToggleOnline}
          className="h-9 min-h-[36px] px-3 rounded-xl bg-muted/60 hover:bg-rose-50 hover:text-rose-700 text-muted-foreground font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 border border-border shadow-2xs"
          title="Ficar offline"
          aria-label="Ficar offline e pausar recebimento de corridas"
        >
          <Power className="w-3.5 h-3.5 text-muted-foreground group-hover:text-rose-600" />
          <span>Offline</span>
        </button>
      </div>

      {/* Linha 2: Resumo de Faturamento Direto P2P (100% Seu • 0% Comissão) */}
      <div
        style={{
          borderRadius: ui.borderRadius,
          backgroundColor: `${colors.primary}0D`,
          borderColor: `${colors.primary}30`,
        }}
        className="flex items-center justify-between p-3 border gap-2.5 shadow-2xs"
      >
        <button
          type="button"
          onClick={handleOpenFinance}
          className="flex items-center gap-2.5 text-left active:scale-98 transition cursor-pointer flex-1 min-w-0"
        >
          <div
            style={{ borderRadius: ui.borderRadius, borderColor: `${colors.primary}30` }}
            className="w-9 h-9 bg-white flex items-center justify-center shrink-0 border shadow-xs"
          >
            <TrendingUp className="w-4 h-4" style={{ color: colors.primary }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wide block truncate">
                Ganhos de hoje
              </span>
              <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded shrink-0">
                0% taxa
              </span>
            </div>
            <div
              style={{ color: colors.primary }}
              className="text-lg sm:text-xl font-extrabold leading-tight truncate my-0.5"
            >
              {ganhosHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 block truncate">
              {corridasFeitas} {corridasFeitas === 1 ? "corrida hoje" : "corridas hoje"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={handleOpenFinance}
          style={{
            backgroundColor: colors.primary,
            color: colors.surface,
            borderRadius: ui.borderRadius,
            boxShadow: ui.buttonShadow,
          }}
          className="h-9 min-h-[36px] px-3 hover:brightness-105 active:scale-95 font-bold text-xs transition cursor-pointer shrink-0 flex items-center gap-1.5"
          aria-label="Abrir extrato e metas"
        >
          <Target className="w-3.5 h-3.5 stroke-[2.4]" />
          <span>Extrato</span>
        </button>
      </div>

      {/* Linha 3: Ferramentas Operacionais Estratégicas (Modo Destino e Taxímetro) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Modo Destino */}
        {destinoAtivo ? (
          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-left min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-black text-amber-900 uppercase tracking-tight truncate">
                🎯 Destino ativo
              </span>
              <button
                type="button"
                onClick={onClearDestino}
                className="text-xs font-black text-rose-700 hover:underline cursor-pointer"
              >
                ✕ Sair
              </button>
            </div>
            <p className="text-xs font-bold text-slate-900 truncate mt-1">
              {destinoAtivo.address}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenModoDestino}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-left transition active:scale-95 cursor-pointer flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">🎯</span>
              <span className="text-xs font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                {remainingDestinationUses} restantes
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-xs font-black text-slate-900 block leading-tight">Modo destino</span>
              <span className="text-xs text-slate-500 font-medium">Direcionar rota</span>
            </div>
          </button>
        )}

        {/* Taxímetro Virtual */}
        <button
          type="button"
          onClick={onOpenTaximetro}
          className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-left transition active:scale-95 cursor-pointer flex flex-col justify-between shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">⏱️</span>
            <span
              style={{
                color: colors.primary,
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}30`,
              }}
              className="text-xs font-bold px-2 py-0.5 rounded-full border"
            >
              Corrida de rua
            </span>
          </div>
          <div className="mt-1.5">
            <span className="text-xs font-black text-slate-900 block leading-tight">Taxímetro</span>
            <span className="text-xs text-slate-500 font-medium">Passageiro de rua</span>
          </div>
        </button>
      </div>

      {/* Linha 4: Acesso Secundário Discreto a Planos e Economia */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/50 text-xs font-bold text-muted-foreground">
        <button
          type="button"
          onClick={onOpenEconomia}
          className="hover:text-foreground transition cursor-pointer flex items-center gap-1 py-1"
        >
          <span>Economia</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onOpenPlanos}
          className="hover:text-foreground transition cursor-pointer flex items-center gap-1 py-1"
        >
          <span>Planos</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
