import React, { useState, useEffect } from "react";
import {
  X,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Sparkles,
  Shield,
  Navigation,
  Clock,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { driverAudioHudEngine } from "@/lib/driver/audio-hud-engine";

export interface DriverQuickPreferencesModalProps {
  open: boolean;
  onClose: () => void;
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  somAtivo: boolean;
  onToggleSom: () => void;
  onOpenZonasExclusao?: () => void;
  onOpenModoDestino?: () => void;
  destinoAtivoTexto?: string | null;
  diariaBadgeText?: string;
  onOpenDiaria?: () => void;
}

export function DriverQuickPreferencesModal({
  open,
  onClose,
  isNightMode = false,
  onToggleNightMode,
  somAtivo,
  onToggleSom,
  onOpenZonasExclusao,
  onOpenModoDestino,
  destinoAtivoTexto,
  diariaBadgeText,
  onOpenDiaria,
}: DriverQuickPreferencesModalProps) {
  const [audioHudEnabled, setAudioHudEnabled] = useState(() =>
    driverAudioHudEngine.isAudioHudEnabled(),
  );

  useEffect(() => {
    if (!open) return;
    setAudioHudEnabled(driverAudioHudEngine.isAudioHudEnabled());
  }, [open]);

  const handleToggleAudioHud = () => {
    const next = !audioHudEnabled;
    driverAudioHudEngine.setAudioHudEnabled(next);
    setAudioHudEnabled(next);
    if (next) {
      driverAudioHudEngine.speak("Áudio HUD ativado");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Preferências do Cockpit"
        className="relative w-full max-w-md bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 pb-8 sm:pb-6 text-foreground z-10 animate-in slide-in-from-bottom duration-200 select-none"
      >
        {/* Puxador visual para mobile */}
        <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Topo do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Preferências do Cockpit
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Ajustes rápidos de condução e conforto
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer active:scale-90"
            aria-label="Fechar preferências"
          >
            <X className="w-4.5 h-4.5 stroke-[2]" />
          </button>
        </div>

        {/* Lista de Opções */}
        <div className="space-y-4 pt-4">
          {/* 1. Modo Noturno */}
          {onToggleNightMode && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isNightMode
                      ? "bg-amber-500/15 text-amber-500"
                      : "bg-slate-500/15 text-muted-foreground"
                  }`}
                >
                  {isNightMode ? (
                    <Sun className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Moon className="w-4 h-4 stroke-[2]" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate">
                    Modo Noturno do Mapa
                  </span>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    {isNightMode ? "Tema escuro de alto contraste ativo" : "Tema padrão do sistema"}
                  </span>
                </div>
              </div>
              <Switch
                checked={isNightMode}
                onCheckedChange={onToggleNightMode}
                aria-label="Alternar modo noturno do mapa"
              />
            </div>
          )}

          {/* 2. Alertas Sonoros de Corrida */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  somAtivo
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/15 text-rose-500"
                }`}
              >
                {somAtivo ? (
                  <Volume2 className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <VolumeX className="w-4 h-4 stroke-[2]" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-foreground block truncate">
                  Sons e Alertas de Corrida
                </span>
                <span className="text-[11px] text-muted-foreground block truncate">
                  {somAtivo ? "Tocar sinal sonoro ao receber chamadas" : "Alertas sonoros silenciados"}
                </span>
              </div>
            </div>
            <Switch
              checked={somAtivo}
              onCheckedChange={onToggleSom}
              aria-label="Alternar alertas sonoros de corrida"
            />
          </div>

          {/* 3. Áudio HUD Hands-Free */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  audioHudEnabled
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    : "bg-slate-500/15 text-muted-foreground"
                }`}
              >
                <Sparkles className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-foreground block truncate">
                  Áudio HUD por Voz
                </span>
                <span className="text-[11px] text-muted-foreground block truncate">
                  {audioHudEnabled ? "Leitura automática de orientações ativada" : "Sintetizador desativado"}
                </span>
              </div>
            </div>
            <Switch
              checked={audioHudEnabled}
              onCheckedChange={handleToggleAudioHud}
              aria-label="Alternar áudio HUD por voz"
            />
          </div>

          {/* 4. Modo Destino (Rota para Casa) */}
          {onOpenModoDestino && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenModoDestino();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 border border-border/60 transition active:scale-[0.99] text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate">
                    Definir Meu Destino
                  </span>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    {destinoAtivoTexto ? `Ativo: ${destinoAtivoTexto}` : "Filtrar chamadas na sua rota de retorno"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
                <span>{destinoAtivoTexto ? "Alterar" : "Definir"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}

          {/* 5. Zonas de Exclusão Pessoal */}
          {onOpenZonasExclusao && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenZonasExclusao();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-muted/70 border border-border/60 transition active:scale-[0.99] text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate">
                    Zonas de Exclusão Pessoal
                  </span>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    Configurar bairros e áreas bloqueadas
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
                <span>Ajustar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}

          {/* 6. Diária SaaS (0% de Comissão) */}
          {onOpenDiaria && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDiaria();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 transition active:scale-[0.99] text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate">
                    Diária do Aplicativo
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block truncate">
                    {diariaBadgeText ? `Tempo restante: ${diariaBadgeText}` : "0% de taxa por corrida"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                <span>Planos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
