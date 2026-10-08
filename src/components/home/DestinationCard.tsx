import React, { memo, useCallback } from "react";
import { Search, Clock, ChevronRight, Home, Briefcase, MapPin, Star } from "lucide-react";
import type { RecentAddressItem } from "./home-mock-data";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";
import { useBrandTheme } from "@/hooks/useBrandTheme";

export interface DestinationCardProps {
  onSearchClick: () => void;
  onEditPickupClick?: () => void;
  onAdjustPinOnMap?: () => void;
  onSelectAddress?: (item: RecentAddressItem) => void;
  onSelectCasa?: () => void;
  onSelectTrabalho?: () => void;
  recentAddresses?: RecentAddressItem[];
  currentAddress?: string;
  userAccuracyMeters?: number | null;
}

/** Item de endereço recente memorizado com 100% de paridade com 2.png */
const RecentAddressItemRow = memo(function RecentAddressItemRow({
  item,
  onSelect,
}: {
  item: RecentAddressItem;
  onSelect?: (item: RecentAddressItem) => void;
}) {
  const handleClick = useCallback(() => {
    hapticFeedback.light();
    onSelect?.(item);
  }, [item, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full py-3 px-1 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50/80 rounded-xl transition active:scale-[0.99] cursor-pointer group text-left"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 shrink-0 group-hover:text-brand-primary-vibrant transition-colors">
          <Clock className="w-5 h-5 stroke-[2]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-primary-vibrant truncate transition-colors">
            {item.titulo}
          </p>
          <p className="text-xs text-slate-600 font-medium truncate mt-0.5">{item.endereco}</p>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-800 shrink-0 transition-colors ml-2" />
    </button>
  );
});

/**
 * 📍 DESTINATION CARD — HOME DO PASSAGEIRO
 * ==============================================================================
 * Alinhado com 100% de fidelidade estética e estrutural com Lealt Recomendado/2.png:
 * 1. Superfície com cantos superiores arredondados rounded-t-[32px]
 * 2. Drag Handle central cinza
 * 3. Pílula de Busca "Para onde vamos?" com botão circular azul (#0088FF)
 * 4. Cabeçalho "Destinos recentes" com link "Ver todos >"
 * 5. Lista de endereços recentes com ícone de relógio e chevron
 * ==============================================================================
 */
export const DestinationCard = memo(function DestinationCard({
  onSearchClick,
  onEditPickupClick,
  onAdjustPinOnMap,
  onSelectAddress,
  onSelectCasa,
  onSelectTrabalho,
  recentAddresses = [],
  currentAddress,
}: DestinationCardProps) {
  const { corPrimaria, corTextoPrimaria } = useBrandTheme();

  const temHistorico = recentAddresses && recentAddresses.length > 0;
  const itensHistorico = temHistorico ? recentAddresses.slice(0, 2) : [];

  const handleSearch = useCallback(() => {
    hapticFeedback.light();
    onSearchClick();
  }, [onSearchClick]);

  const handleCasaClick = useCallback(() => {
    hapticFeedback.light();
    if (onSelectCasa) onSelectCasa();
    else onSearchClick();
  }, [onSelectCasa, onSearchClick]);

  const handleTrabalhoClick = useCallback(() => {
    hapticFeedback.light();
    if (onSelectTrabalho) onSelectTrabalho();
    else onSearchClick();
  }, [onSelectTrabalho, onSearchClick]);

  return (
    <div className="w-full z-20 pointer-events-auto select-none">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-200/80 p-3 sm:p-4 space-y-2.5 sm:space-y-3 text-left">
        {/* DRAG HANDLE BAR CENTRAL */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto" />

        {/* INDICADOR DE EMBARQUE ATUAL (AUTO-PREENCHIDO COM OPÇÃO DE ALTERAR) */}
        {currentAddress && currentAddress !== "Meu Local Atual" && (
          <div className="flex items-center justify-between px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-50/90 border border-slate-200/60 rounded-xl text-xs">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" />
              <span className="text-[11px] sm:text-[11.5px] font-medium text-slate-700 truncate">
                Embarque: <span className="font-bold text-slate-900">{currentAddress}</span>
              </span>
            </div>
            {onEditPickupClick && (
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light();
                  onEditPickupClick();
                }}
                className="text-[10px] sm:text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 ml-2 shrink-0 cursor-pointer hover:underline"
              >
                Alterar
              </button>
            )}
          </div>
        )}

        {/* 1. PÍLULA DE BUSCA "PARA ONDE VAMOS?" ESTILO DRIVELUX SCREEN 2 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSearch}
            className="group flex-1 h-9.5 sm:h-11 px-2.5 sm:px-3 rounded-2xl border border-slate-200 bg-slate-50/90 hover:bg-slate-100/80 flex items-center transition-all duration-200 active:scale-[0.99] cursor-pointer text-left shadow-2xs"
            aria-label="Para onde vamos? Buscar endereços"
          >
            {/* Lupa estilizada com a cor primária */}
            <div
              className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
              style={{
                backgroundColor: corPrimaria || "var(--brand-primary-vibrant)",
                color: corTextoPrimaria || "#FFFFFF",
              }}
            >
              <Search className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>

            <div className="flex-1 min-w-0 ml-2 sm:ml-2.5">
              <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate leading-tight">
                Para onde vamos hoje?
              </span>
            </div>
          </button>

          {onAdjustPinOnMap && (
            <button
              type="button"
              onClick={() => {
                hapticFeedback.light();
                onAdjustPinOnMap();
              }}
              className="h-9.5 sm:h-11 px-2 sm:px-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center gap-1.5 text-slate-700 hover:text-slate-900 transition-all active:scale-95 shadow-2xs shrink-0 cursor-pointer"
              title="Escolher destino diretamente no mapa"
              aria-label="Escolher destino no mapa"
            >
              <div
                className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${corPrimaria || "#FF6B00"}15`,
                  color: corPrimaria || "#FF6B00",
                }}
              >
                <MapPin className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-700 tracking-tight">
                No mapa
              </span>
            </button>
          )}
        </div>

        {/* 2. PÍLULAS RÁPIDAS HORIZONTAIS MINIMALISTAS */}
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={handleCasaClick}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition active:scale-[0.98] cursor-pointer shrink-0 shadow-2xs"
          >
            <Home className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
            <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-800">Casa</span>
          </button>

          <button
            type="button"
            onClick={handleTrabalhoClick}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition active:scale-[0.98] cursor-pointer shrink-0 shadow-2xs"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-600 stroke-[2.2]" />
            <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-800">Trabalho</span>
          </button>

          <button
            type="button"
            onClick={handleSearch}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition active:scale-[0.98] cursor-pointer shrink-0 shadow-2xs"
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 stroke-[2.2]" />
            <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-800">Favoritos</span>
          </button>
        </div>

        {/* 3. HISTÓRICO RECENTE ULTRA COMPACTO */}
        {temHistorico && (
          <div className="border-t border-slate-100 pt-0.5">
            {itensHistorico.slice(0, 1).map((item) => (
              <RecentAddressItemRow
                key={item.id}
                item={item}
                onSelect={onSelectAddress}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default DestinationCard;
