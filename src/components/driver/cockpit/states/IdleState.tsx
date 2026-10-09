import { Power, Wallet, Compass, Car, Flame, ArrowUpRight, ChevronRight, Target, TrendingUp, Clock } from "lucide-react";
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
      {/* Linha 1: Status Operacional Unificado & Botão Ficar Offline */}
      <div className="flex items-center justify-between gap-2.5 p-3 rounded-2xl bg-card border border-border shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/15 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-foreground leading-tight truncate">
                Você está online
              </h3>
              {diariaRestanteTexto && (
                <span
                  style={{
                    color: colors.primary,
                    backgroundColor: `${colors.primary}12`,
                    borderColor: `${colors.primary}30`,
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0"
                >
                  <Clock className="w-2.5 h-2.5" style={{ color: colors.primary }} />
                  <span>{diariaRestanteTexto}</span>
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate mt-0.5">
              Radar ativo • Aguardando chamadas na região
            </p>
          </div>
        </div>

        {/* Botão Ergonômico Ficar Offline */}
        <button
          type="button"
          onClick={onToggleOnline}
          className="h-8.5 px-3 rounded-full bg-muted hover:bg-rose-500/10 hover:text-rose-600 text-foreground font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 border border-border shadow-2xs"
          title="Ficar offline"
          aria-label="Ficar offline e pausar recebimento de corridas"
        >
          <Power className="w-3.5 h-3.5 text-muted-foreground group-hover:text-rose-600" />
          <span>Pausar</span>
        </button>
      </div>

      {/* Linha 2: Resumo de Faturamento Direto P2P (100% Seu • 0% Comissão) */}
      <div
        className="flex items-center justify-between p-3.5 rounded-3xl bg-card border border-border shadow-[0_4px_16px_rgba(0,0,0,0.03)] gap-3"
      >
        <button
          type="button"
          onClick={handleOpenFinance}
          className="flex items-center gap-3 text-left active:scale-[0.99] transition cursor-pointer flex-1 min-w-0"
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs"
            style={{
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}25`,
            }}
          >
            <TrendingUp className="w-5 h-5" style={{ color: colors.primary }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] text-muted-foreground font-bold uppercase tracking-wider block truncate">
                Ganhos de hoje
              </span>
              <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded-full shrink-0">
                0% taxa
              </span>
            </div>
            <div
              style={{ color: colors.primary }}
              className="text-xl sm:text-2xl font-black leading-tight truncate my-0.5"
            >
              {ganhosHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block truncate">
              {corridasFeitas} {corridasFeitas === 1 ? "corrida hoje" : "corridas hoje"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={handleOpenFinance}
          style={{
            backgroundColor: colors.primary,
            color: "#FFFFFF",
            boxShadow: `0 2px 10px ${colors.primary}35`,
          }}
          className="h-9 min-h-[36px] px-3.5 rounded-full hover:brightness-105 active:scale-95 font-bold text-xs transition cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
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
          <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-left min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight truncate">
                🎯 Destino ativo
              </span>
              <button
                type="button"
                onClick={onClearDestino}
                className="text-xs font-black text-rose-600 hover:underline cursor-pointer"
              >
                ✕ Sair
              </button>
            </div>
            <p className="text-xs font-bold text-foreground truncate mt-1">
              {destinoAtivo.address}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenModoDestino}
            className="p-3 rounded-2xl bg-card hover:bg-muted/60 border border-border text-left transition active:scale-95 cursor-pointer flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">🎯</span>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                {remainingDestinationUses} restantes
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xs font-extrabold text-foreground block leading-tight">Modo destino</span>
              <span className="text-[10.5px] text-muted-foreground font-medium">Direcionar trajeto</span>
            </div>
          </button>
        )}

        {/* Taxímetro Virtual */}
        <button
          type="button"
          onClick={onOpenTaximetro}
          className="p-3 rounded-2xl bg-card hover:bg-muted/60 border border-border text-left transition active:scale-95 cursor-pointer flex flex-col justify-between shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-lg">⏱️</span>
            <span
              style={{
                color: colors.primary,
                backgroundColor: `${colors.primary}12`,
                borderColor: `${colors.primary}25`,
              }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
            >
              Corrida de rua
            </span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-extrabold text-foreground block leading-tight">Taxímetro</span>
            <span className="text-[10.5px] text-muted-foreground font-medium">Passageiro de rua</span>
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
