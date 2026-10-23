import React from "react";
import { MapPin, ArrowLeft, Check, Sparkles, Loader2 } from "lucide-react";
import { usePassengerRide } from "@/contexts/PassengerRideContext";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

export function PassengerConfirmPickupPin() {
  const {
    origem,
    backToReviewRoute,
    confirmPickupPin,
    categoriaVeiculo,
    isResolvingAddress,
    smartPickups,
    selectStrategicPickup,
  } = usePassengerRide();

  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  return (
    <>
      {/* 1. PINO CENTRAL FLUTUANTE NO MAPA COM PULSO */}
      <div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center -translate-y-8">
        <div className="relative flex flex-col items-center animate-bounce duration-1000">
          {/* Label Chamativo */}
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/90 text-white text-[11px] font-black shadow-xl border border-white/20 mb-1 flex items-center gap-1.5 backdrop-blur-xs whitespace-nowrap">
            {isResolvingAddress ? (
              <>
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
                <span>Identificando rua...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span>
                  Ponto de encontro do {categoriaVeiculo === "MOTO" ? "motoboy" : "motorista"}
                </span>
              </>
            )}
          </div>

          {/* Pino estilizado */}
          <div
            className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-primary/30"
            style={{ backgroundColor: colors.primary }}
          >
            <MapPin className="w-6 h-6 stroke-[2.5]" />
          </div>

          {/* Sombra de projeção no solo */}
          <div className="w-4 h-1.5 bg-black/30 rounded-full blur-[1px] mt-0.5" />
        </div>
      </div>

      {/* 2. CARD INFERIOR FLUTUANTE COM AÇÃO DE CONFIRMAÇÃO */}
      <div
        data-hide-bottom-nav="true"
        className="w-full max-w-md mx-auto px-4 pb-5 z-20 animate-in slide-in-from-bottom duration-300 mt-auto"
      >
        <div
          style={{ borderRadius: ui.borderRadius }}
          className="bg-card shadow-2xl border border-border p-4 sm:p-5 space-y-3 text-left backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={backToReviewRoute}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 -ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition cursor-pointer touch-manipulation active:scale-95"
              aria-label="Voltar para opções de viagem"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div className="flex-1 min-w-0">
              <span
                style={{ color: colors.primary }}
                className="text-[10px] font-black uppercase tracking-wider block"
              >
                Local de Embarque Selecionado
              </span>
              <p className="text-xs sm:text-sm font-black text-foreground truncate">
                {isResolvingAddress ? "Localizando endereço exato..." : origem}
              </p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
            Arraste o mapa para posicionar o pino na calçada onde você estará aguardando.
          </p>

          {/* Chips de Atalhos de Pontos Estratégicos Próximos (Green Pickup Dots) */}
          {smartPickups && smartPickups.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Pontos Verdes Recomendados</span>
                </span>
                <span className="text-emerald-700 font-bold">Snap de Embarque</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {smartPickups.slice(0, 4).map((p) => {
                  const isSelected = origem === p.nome;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectStrategicPickup(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex flex-col items-start gap-0.5 shrink-0 active:scale-95 cursor-pointer border text-left ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/40"
                          : "bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-950 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-amber-300" : "text-emerald-600"}`} />
                        <span className="truncate max-w-[140px] font-extrabold">{p.nome.split(" x ")[0]}</span>
                        <span className={`text-[10px] ml-auto ${isSelected ? "text-emerald-100" : "text-emerald-700"}`}>
                          ~{p.distanciaMetros}m
                        </span>
                      </div>
                      <span className={`text-[10px] leading-tight truncate max-w-[170px] ${isSelected ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"}`}>
                        {p.benefitMessage || "Embarque rápido e seguro"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={confirmPickupPin}
            style={{
              backgroundColor: colors.primary,
              color: colors.surface,
              borderRadius: ui.borderRadius,
              boxShadow: ui.buttonShadow,
            }}
            className="w-full h-14 py-3.5 px-4 font-extrabold text-sm sm:text-base active:scale-[0.98] transition flex items-center justify-center gap-2.5 cursor-pointer hover:brightness-105 touch-manipulation select-none"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>Confirmar Este Ponto de Embarque</span>
          </button>
        </div>
      </div>
    </>
  );
}
