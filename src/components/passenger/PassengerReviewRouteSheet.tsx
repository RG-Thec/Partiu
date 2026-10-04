import React, { useState, useEffect, useCallback, memo } from "react";
import {
  Bike,
  Car,
  Clock,
  Navigation,
  ArrowLeft,
  Banknote,
  QrCode,
  CreditCard,
  X,
  Plus,
  ChevronRight,
  User,
  Pencil,
  Check,
  ShieldCheck,
  Sparkles,
  Tag,
  Briefcase,
} from "lucide-react";
import { usePassengerRide } from "@/contexts/PassengerRideContext";
import type { PassengerVehicleCategory } from "@/lib/passenger/passenger-ride-machine";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { useBottomSheetGesture } from "@/hooks/useBottomSheetGesture";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";
import { CategoryQuoteSkeleton } from "@/components/ui/skeleton";
import { VehiclePerspectiveGraphic } from "./VehiclePerspectiveGraphic";
import { couponService, type ActiveCoupon } from "@/services/CouponService";
import {
  NativeBottomSheet,
  NativeButton,
  NativeSurface,
} from "@/components/native";

/**
 * 🚗 PASSENGER REVIEW ROUTE SHEET (MODAL "ESCOLHA SUA CATEGORIA")
 * ==============================================================================
 * Alinhado com 100% de fidelidade com Lealt Recomendado/4.png:
 * 1. Título "Escolha sua categoria" e subtítulo "Veja o tempo de chegada e o valor da corrida."
 * 2. Três cards verticais amplos (Partiu Pop, Partiu Moto, Partiu Plus) com renders 3D
 * 3. Card de pagamento seguro PIX D+0
 * 4. Botão de confirmação amplo com gradiente e identificação do veículo selecionado
 * ==============================================================================
 */
interface VehicleOptionCardProps {
  isSelected: boolean;
  category: PassengerVehicleCategory;
  title: string;
  description?: string;
  badgeText?: string;
  badgeClass?: string;
  etaMinutes: number;
  capacityText: string;
  luggageText?: string;
  price: string;
  originalPrice?: string;
  vehicleGraphicCategory: "POP" | "MOTO" | "PLUS";
  onSelect: (cat: PassengerVehicleCategory) => void;
  corPrimaria?: string;
  corSecundaria?: string;
}

/** Item de Categoria Compacto Horizontal no Padrão Uber Zero-Scroll (~48-52px) */
const VehicleOptionCard = memo(function VehicleOptionCard({
  isSelected,
  category,
  title,
  badgeText,
  badgeClass,
  etaMinutes,
  capacityText,
  luggageText,
  price,
  originalPrice,
  vehicleGraphicCategory,
  onSelect,
  corPrimaria,
}: VehicleOptionCardProps) {
  const handleClick = useCallback(() => {
    onSelect(category);
  }, [onSelect, category]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
      style={
        isSelected && corPrimaria
          ? {
              borderColor: corPrimaria,
              backgroundColor: `${corPrimaria}12`,
            }
          : undefined
      }
      className={`w-full px-3.5 py-2.5 sm:py-3 rounded-2xl border transition-all cursor-pointer flex flex-row items-center justify-between select-none active:scale-[0.99] gap-2.5 sm:gap-3 ${
        isSelected
          ? "border-brand-primary-vibrant bg-brand-soft/25 shadow-2xs ring-1 ring-brand-primary-vibrant/30"
          : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70"
      }`}
    >
      {/* 1. THUMBNAIL DO VEÍCULO (ESQUERDA: FIXO 48-52px) */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
        <VehiclePerspectiveGraphic
          category={vehicleGraphicCategory}
          className="w-full h-full object-contain drop-shadow-2xs"
        />
      </div>

      {/* 2. DADOS DA CATEGORIA (CENTRO flex-1: NOME + ETA + CAPACIDADE) */}
      <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="text-sm font-bold text-slate-900 leading-tight">
            {title}
          </h4>
          {badgeText && (
            <span
              className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md shrink-0 ${
                badgeClass || "bg-brand-soft text-brand-primary-vibrant border border-brand-primary-vibrant/20"
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1 flex-wrap">
          <span className="flex items-center gap-1 shrink-0 font-semibold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>~{etaMinutes} min</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 shrink-0">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{capacityText}</span>
          </span>
          {luggageText && (
            <>
              <span className="text-slate-300 hidden xs:inline">•</span>
              <span className="hidden xs:flex items-center gap-1 shrink-0">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{luggageText}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. PREÇO EM DESTAQUE E INDICADOR DE SELEÇÃO / RADIO BUTTON (DIREITA) */}
      <div className="flex flex-row items-center gap-3 shrink-0 pl-1">
        <div className="flex flex-col items-end text-right">
          {originalPrice && (
            <span className="text-[11px] text-slate-400 line-through font-semibold leading-none mb-0.5">
              {originalPrice}
            </span>
          )}
          <span
            style={isSelected && corPrimaria ? { color: corPrimaria } : undefined}
            className={`text-sm sm:text-base font-extrabold leading-tight tracking-tight whitespace-nowrap ${
              isSelected ? "text-brand-primary-deep" : "text-slate-900"
            }`}
          >
            {price}
          </span>
        </div>

        {/* Radio Button Indicator */}
        <div
          style={isSelected && corPrimaria ? { borderColor: corPrimaria } : undefined}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? "border-brand-primary-vibrant bg-white shadow-xs"
              : "border-slate-300 bg-white"
          }`}
        >
          {isSelected && (
            <div
              style={corPrimaria ? { backgroundColor: corPrimaria } : undefined}
              className="w-2.5 h-2.5 rounded-full bg-brand-primary-vibrant"
            />
          )}
        </div>
      </div>
    </div>
  );
});

export const PassengerReviewRouteSheet = memo(function PassengerReviewRouteSheet() {
  const {
    categoriaVeiculo,
    selectVehicle,
    formaPagamento,
    selectPaymentMethod,
    cotacoes,
    multiCategoryQuotes,
    distanciaKm,
    duracaoMin,
    origem,
    destino,
    startSearch,
    confirmPickupAndFindDriver,
    resetToIdle,
    pagamentoNaMaquininha,
    setPagamentoNaMaquininha,
    viajanteOutraPessoa,
    nomeOutroPassageiro,
    telefoneOutroPassageiro,
    setViajanteOutraPessoa,
    setNomeOutroPassageiro,
    setTelefoneOutroPassageiro,
    paradas,
    adicionarParada,
    removerParada,
    paradaIntermediaria,
    setParadaIntermediaria,
    horarioDesembarquePrevisto,
    preferences,
    togglePreference,
  } = usePassengerRide();

  const { corPrimaria, corSecundaria, corTextoPrimaria } = useBrandTheme();
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  // Modais secundários compactos para manter a tela principal 100% "Above the Fold"
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [modalParadaAberto, setModalParadaAberto] = useState(false);
  const [modalPassageiroAberto, setModalPassageiroAberto] = useState(false);
  const [inputParada, setInputParada] = useState(paradaIntermediaria || "");

  // Cupom promocional ativo
  const [cupomAtivo, setCupomAtivo] = useState<ActiveCoupon | null>(() => couponService.getActiveRideCoupon());

  useEffect(() => {
    const handleCupomUpdate = () => {
      setCupomAtivo(couponService.getActiveRideCoupon());
    };
    window.addEventListener("partiu:cupom-aplicado", handleCupomUpdate);
    window.addEventListener("partiu:cupom-removido", handleCupomUpdate);
    return () => {
      window.removeEventListener("partiu:cupom-aplicado", handleCupomUpdate);
      window.removeEventListener("partiu:cupom-removido", handleCupomUpdate);
    };
  }, []);

  // Hook Gestual com Física de Mola e Snap Points calibrados para Zero Scroll (HALF 52% / COLLAPSED 38%)
  const { currentHeight, isDragging, handlers, activeSnapKey, snapTo } = useBottomSheetGesture({
    snapPoints: [
      { key: "COLLAPSED", height: 0.38 },
      { key: "HALF", height: 0.52 },
    ],
    initialSnapKey: "HALF",
  });

  const handleSelectCategory = useCallback((cat: PassengerVehicleCategory) => {
    hapticFeedback.medium();
    selectVehicle(cat);
  }, [selectVehicle]);

  const handleOpenPayment = useCallback(() => {
    hapticFeedback.light();
    setModalPagamentoAberto(true);
  }, []);

  const handleConfirm = useCallback(() => {
    hapticFeedback.heavy();
    confirmPickupAndFindDriver();
  }, [confirmPickupAndFindDriver]);

  const handleBack = useCallback(() => {
    hapticFeedback.light();
    startSearch();
  }, [startSearch]);

  const handleCancel = useCallback(() => {
    hapticFeedback.light();
    resetToIdle();
  }, [resetToIdle]);

  // Cotações e métricas oficiais das categorias homologadas (Carro Comum e Moto Comum)
  const isMoto = categoriaVeiculo === "MOTO";
  const isPop = !isMoto;

  const quoteMoto = multiCategoryQuotes?.["PARTIU_MOTO"];
  const quotePop = multiCategoryQuotes?.["PARTIU_CARRO"];

  const rawMoto = quoteMoto?.priceBrl ?? cotacoes?.moto?.precoBrl ?? 7.5;
  const rawPop = quotePop?.priceBrl ?? cotacoes?.carro?.precoBrl ?? 11.5;

  const calculateDiscounted = (basePrice: number) => {
    if (!cupomAtivo) return { discounted: basePrice, hasDiscount: false };
    let discount = 0;
    const cupomValor = Number(cupomAtivo.valor) || 0;
    if (cupomAtivo.tipo === "porcentagem") {
      discount = (basePrice * cupomValor) / 100;
    } else {
      discount = cupomValor;
    }
    const finalPrice = Math.max(2.0, Math.round((basePrice - discount) * 100) / 100);
    return { discounted: finalPrice, hasDiscount: true };
  };

  const motoCalc = calculateDiscounted(rawMoto);
  const popCalc = calculateDiscounted(rawPop);

  const precoMoto = `R$ ${motoCalc.discounted.toFixed(2).replace(".", ",")}`;
  const precoMotoOriginal = motoCalc.hasDiscount ? `R$ ${rawMoto.toFixed(2).replace(".", ",")}` : undefined;

  const precoPop = `R$ ${popCalc.discounted.toFixed(2).replace(".", ",")}`;
  const precoPopOriginal = popCalc.hasDiscount ? `R$ ${rawPop.toFixed(2).replace(".", ",")}` : undefined;

  const pickupMinMoto = quoteMoto?.driverPickupMinutes ?? 3;
  const pickupMinPop = quotePop?.driverPickupMinutes ?? 4;

  const precoAtivo = isMoto ? precoMoto : precoPop;
  const nomeVeiculoAtivo = isMoto ? "Moto Comum" : "Carro Comum";

  // Metadados visuais do pagamento atual
  function getPaymentInfo() {
    if (pagamentoNaMaquininha) {
      return {
        label: "Maquininha do Motorista",
        sublabel: "Débito ou Crédito na maquininha",
        icon: CreditCard,
        color: "text-slate-700 bg-slate-100 border-slate-200",
      };
    }
    if (formaPagamento === "pix") {
      return {
        label: "PIX Direto",
        sublabel: "Pagar na chave do motorista",
        icon: QrCode,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    }
    return {
      label: "Dinheiro em Espécie",
      sublabel: "Pagar ao motorista no desembarque",
      icon: Banknote,
      color: "text-slate-700 bg-slate-100 border-slate-200",
    };
  }

  const paymentInfo = getPaymentInfo();
  const PaymentIcon = paymentInfo.icon;

  function handleAdicionarParada() {
    if (inputParada.trim()) {
      adicionarParada(inputParada.trim());
      setInputParada("");
    }
  }

  return (
    <div
      data-hide-bottom-nav="true"
      className="w-full max-w-md mx-auto px-2.5 sm:px-4 pb-0.5 sm:pb-1 z-20 animate-in slide-in-from-bottom duration-300 pointer-events-auto"
    >
      {/* CARD PRINCIPAL: Altura compactada "Above the Fold" sem scroll vertical */}
      <div
        style={{
          maxHeight: "88vh",
          height: currentHeight > 0 ? `${currentHeight}px` : undefined,
          transition: isDragging
            ? "none"
            : "height 260ms cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: isDragging ? "height" : "auto",
        }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col text-left overflow-hidden select-none"
      >
        {/* ════════════════════════════════════════════════════════════════════
            SEÇÃO A — HEADER COMPACTO FIXO (NUNCA ROLA)
            ════════════════════════════════════════════════════════════════════ */}
        <div className="px-3.5 sm:px-4 pt-1 shrink-0">
          {/* BARRA SUPERIOR INDICADORA DE ARRASTE GESTUAL COM SPRING */}
          <div
            {...handlers}
            onClick={() => snapTo(activeSnapKey === "COLLAPSED" ? "HALF" : "COLLAPSED")}
            className="w-full pt-0.5 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none group"
            aria-label={activeSnapKey === "COLLAPSED" ? "Expandir detalhes da corrida" : "Recolher para visão compacta"}
          >
            <div
              className={`h-1 rounded-full transition-all duration-200 ${
                isDragging ? "bg-brand-primary-vibrant w-12" : "bg-slate-300 w-10 group-hover:bg-slate-400"
              }`}
            />
          </div>

          {/* 1. LINHA ENXUTA UNIFICADA: Voltar + Chips de Distância/Tempo + Fechar */}
          <div className="flex flex-row items-center justify-between gap-2 pb-1 border-b border-slate-100">
            {/* Botão Voltar */}
            <button
              type="button"
              onClick={handleBack}
              className="h-7.5 px-2.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:scale-95 rounded-xl transition cursor-pointer flex flex-row items-center gap-1 font-bold text-xs border border-slate-200/80 bg-white shadow-2xs shrink-0"
              title="Voltar e alterar endereço"
              aria-label="Voltar para busca de endereço"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Voltar</span>
            </button>

            {/* Chips Enxutos de Distância e Tempo (12-13px) */}
            <div className="flex flex-row items-center gap-1.5 text-xs font-bold shrink-0">
              <span className="text-slate-700 flex flex-row items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-brand-primary-vibrant stroke-[2.2]" />
                <span>{distanciaKm} km</span>
              </span>
              <span className="text-slate-300">•</span>
              <span
                style={{
                  backgroundColor: `${colors.primary}14`,
                  borderColor: `${colors.primary}35`,
                }}
                className="text-foreground border px-2 py-0.5 rounded-full flex flex-row items-center gap-1 font-semibold text-xs"
              >
                <Clock className="w-3 h-3 stroke-[2.4]" style={{ color: colors.primary }} />
                <span>~{horarioDesembarquePrevisto || `${duracaoMin || 8} min`}</span>
              </span>
            </div>

            {/* Botão Fechar / Cancelar (Touch Target Ergonômico 48dp) */}
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-[48px] min-w-[48px] rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition cursor-pointer flex items-center justify-center shrink-0 touch-manipulation"
              title="Cancelar e voltar ao mapa"
              aria-label="Cancelar e voltar ao mapa"
            >
              <span className="h-8 w-8 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shadow-xs">
                <X className="w-4 h-4 stroke-[2.4]" />
              </span>
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SEÇÃO B — CONTEÚDO PRINCIPAL (ZERO-SCROLL: CATEGORIAS + CHIPS)
            ════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-h-0 flex flex-col px-3.5 sm:px-4 py-1 space-y-1.5 overflow-y-auto">
          {/* TÍTULO COMPACTO "ESCOLHA SUA CATEGORIA" COM PADDING REDUZIDO */}
          <div className="flex flex-row items-center justify-between pt-0.5 pb-0.5 shrink-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
              Escolha sua categoria
            </h3>
          </div>

          {/* 2. SELEÇÃO DE VEÍCULOS (LISTA HORIZONTAL COMPACTA ZERO-SCROLL) */}
          <div className="space-y-1.5 shrink-0">
            {/* CARD 1: CARRO COMUM */}
            <VehicleOptionCard
              isSelected={isPop}
              category="CARRO"
              title="Carro Comum"
              badgeText="Conforto"
              badgeClass="text-blue-700 bg-blue-50 border border-blue-200"
              etaMinutes={pickupMinPop || 4}
              capacityText="4 passageiros"
              luggageText="2 malas"
              price={precoPop}
              originalPrice={precoPopOriginal}
              vehicleGraphicCategory="POP"
              onSelect={handleSelectCategory}
              corPrimaria={corPrimaria}
              corSecundaria={corSecundaria}
            />

            {/* CARD 2: MOTO COMUM */}
            <VehicleOptionCard
              isSelected={isMoto}
              category="MOTO"
              title="Moto Comum"
              badgeText="Mais Rápido"
              badgeClass="text-emerald-700 bg-emerald-50 border border-emerald-200"
              etaMinutes={pickupMinMoto || 3}
              capacityText="1 passageiro"
              luggageText="Mochila"
              price={precoMoto}
              originalPrice={precoMotoOriginal}
              vehicleGraphicCategory="MOTO"
              onSelect={handleSelectCategory}
              corPrimaria={corPrimaria}
              corSecundaria={corSecundaria}
            />
          </div>

          {/* BANNER DE PREÇO FIXO GARANTIDO (TRANSPARÊNCIA E CONFIANÇA) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.2]" />
            <p className="text-[11px] sm:text-xs font-semibold leading-tight text-slate-600">
              <strong className="text-slate-900">Preço fixo garantido:</strong> Sem alteração com trânsito ou semáforos.
            </p>
          </div>

          {/* 3. CHIPS DE OPÇÕES EXTRAS (PARADA / PASSAGEIRO / MULHER) */}
          <div className="flex flex-row items-center justify-between gap-1.5 pt-0.5 shrink-0">
            {/* Chip de Parada */}
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light();
                  setModalParadaAberto(true);
                }}
                style={
                  paradas.length > 0 && corPrimaria
                    ? {
                        backgroundColor: `${corPrimaria}15`,
                        color: corPrimaria,
                        borderColor: corPrimaria,
                      }
                    : undefined
                }
                className={`min-h-[34px] h-8.5 w-full flex flex-row items-center justify-between gap-1.5 font-semibold text-[11px] px-2.5 py-1 rounded-xl border transition active:scale-95 cursor-pointer touch-manipulation ${
                  paradas.length > 0
                    ? "font-bold"
                    : "bg-slate-100/90 text-slate-700 hover:text-slate-950 border-slate-200/80"
                }`}
              >
                <div className="flex flex-row items-center gap-1.5 truncate">
                  <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" style={{ color: paradas.length > 0 ? colors.primary : undefined }} />
                  <span className="truncate">
                    {paradas.length === 0
                      ? "+ Parada"
                      : paradas.length === 1
                      ? `1 Parada`
                      : `2 Paradas`}
                  </span>
                </div>
                {paradas.length > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Remover paradas intermediárias"
                    onClick={(e) => {
                      e.stopPropagation();
                      hapticFeedback.light();
                      setParadaIntermediaria(null);
                    }}
                    className="w-4.5 h-4.5 -mr-0.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center font-bold active:scale-90 transition shrink-0 text-[10px]"
                  >
                    ✕
                  </span>
                )}
              </button>
            </div>

            {/* Chip de Passageiro */}
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light();
                  setModalPassageiroAberto(true);
                }}
                style={
                  viajanteOutraPessoa && corPrimaria
                    ? {
                        backgroundColor: `${corPrimaria}15`,
                        color: corPrimaria,
                        borderColor: corPrimaria,
                      }
                    : undefined
                }
                className={`min-h-[34px] h-8.5 w-full flex flex-row items-center justify-center gap-1.5 font-semibold text-[11px] px-2.5 py-1 rounded-xl border transition active:scale-95 cursor-pointer touch-manipulation ${
                  viajanteOutraPessoa
                    ? "font-bold"
                    : "bg-slate-100/90 text-slate-700 hover:text-slate-950 border-slate-200/80"
                }`}
              >
                <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate">
                  {viajanteOutraPessoa
                    ? (nomeOutroPassageiro ? `Para: ${nomeOutroPassageiro.slice(0, 10)}` : "Outro")
                    : "Para mim"}
                </span>
              </button>
            </div>

            {/* Chip Partiu Mulher (Segurança Feminina) */}
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.medium();
                  togglePreference("isFemaleOnly");
                }}
                className={`min-h-[34px] h-8.5 w-full flex flex-row items-center justify-center gap-1.5 font-semibold text-[11px] px-2.5 py-1 rounded-xl border transition active:scale-95 cursor-pointer touch-manipulation ${
                  preferences?.isFemaleOnly
                    ? "bg-purple-50 text-purple-900 border-purple-300 shadow-2xs font-bold"
                    : "bg-slate-100/90 text-slate-700 hover:text-slate-950 border-slate-200/80"
                }`}
                title="Partiu Mulher — Apenas motoristas mulheres"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${preferences?.isFemaleOnly ? "text-purple-600 stroke-[2.4]" : "text-slate-500"} shrink-0`} />
                <span className="truncate">
                  Partiu Mulher
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SEÇÃO C — FOOTER FIXO SEGURO (NUNCA ROLA, VISIBILIDADE OBRIGATÓRIA)
            Barra Fixa de Pagamento + Botão de Confirmação + Safe Area Padding
            ════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            paddingBottom: "max(12px, env(safe-area-inset-bottom, 16px))",
          }}
          className="px-3.5 sm:px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,16px))] shrink-0 border-t border-slate-200/60 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] space-y-2 z-20"
        >
          {/* BANNER DE CUPOM APLICADO (SE HOUVER) */}
          {cupomAtivo && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold animate-in fade-in">
              <div className="flex items-center gap-1.5 min-w-0">
                <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Cupom <span className="font-extrabold text-emerald-700">{cupomAtivo.codigo}</span> ({(cupomAtivo as any).descontoFormatado || (cupomAtivo.tipo === "porcentagem" ? `${cupomAtivo.valor}%` : `R$ ${cupomAtivo.valor}`)} OFF)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light();
                  couponService.clearActiveRideCoupon();
                }}
                className="text-slate-400 hover:text-rose-600 text-[11px] font-bold p-0.5 ml-1.5 shrink-0 cursor-pointer"
                title="Remover cupom"
              >
                Remover
              </button>
            </div>
          )}

          {/* BARRA FIXA DE FORMA DE PAGAMENTO (COMPACTA, DIRETA E NUNCA ESCONDIDA) */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleOpenPayment}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleOpenPayment();
            }}
            className="w-full flex flex-row items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 active:scale-[0.99] transition cursor-pointer border border-slate-200/80"
          >
            <div className="flex flex-row items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <PaymentIcon className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-slate-800 truncate">
                {pagamentoNaMaquininha
                  ? "Maquininha do Motorista"
                  : formaPagamento === "pix"
                  ? "PIX Direto"
                  : paymentInfo.label}
              </span>
              <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full shrink-0">
                {pagamentoNaMaquininha ? "Cartão" : formaPagamento === "pix" ? "Instantâneo" : "Presencial"}
              </span>
            </div>

            <div
              className="flex flex-row items-center gap-1 text-xs font-bold text-brand-primary-vibrant hover:underline shrink-0"
              style={corPrimaria ? { color: corPrimaria } : undefined}
            >
              <span>Trocar</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* BOTÃO PRINCIPAL DE CONFIRMAÇÃO DA CORRIDA */}
          <button
            type="button"
            onClick={handleConfirm}
            aria-label={`Confirmar corrida ${nomeVeiculoAtivo} por ${precoAtivo}`}
            className="w-full h-9.5 sm:h-10 rounded-xl bg-gradient-to-r from-brand-primary-vibrant to-brand-primary-deep hover:brightness-105 text-white font-semibold text-xs sm:text-[13px] active:scale-[0.99] transition-all duration-150 flex flex-row items-center justify-center gap-2 cursor-pointer shadow-2xs shadow-brand-primary-vibrant/20 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={
              corPrimaria && corSecundaria
                ? {
                    backgroundImage: `linear-gradient(to right, ${corPrimaria}, ${corSecundaria})`,
                  }
                : corPrimaria
                ? { backgroundColor: corPrimaria }
                : undefined
            }
          >
            {isMoto ? (
              <Bike className="w-4 h-4 text-white stroke-[2.2]" />
            ) : (
              <Car className="w-4 h-4 text-white stroke-[2.2]" />
            )}
            <span className="opacity-40 font-light">|</span>
            <span>Confirmar • {precoAtivo}</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BOTTOM SHEET SECUNDÁRIA: SELEÇÃO DA FORMA DE PAGAMENTO                */}
      {/* ===================================================================== */}
      <NativeBottomSheet
        isOpen={modalPagamentoAberto}
        onClose={() => setModalPagamentoAberto(false)}
        title="Forma de pagamento"
        subtitle="Pagamento direto no desembarque"
        showDragHandle
        showCloseButton
      >
        <div className="space-y-3 pb-3">
          {/* OPÇÃO 1: PIX DIRETO */}
          <NativeSurface
            elevation={1}
            interactive
            padding="sm"
            onClick={() => {
              selectPaymentMethod("pix");
              setPagamentoNaMaquininha(false);
              setModalPagamentoAberto(false);
            }}
            style={
              formaPagamento === "pix" && !pagamentoNaMaquininha
                ? {
                    border: `1.5px solid ${colors.primary}`,
                    backgroundColor: `${colors.primary}12`,
                  }
                : undefined
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${colors.primary}18`,
                  color: colors.primary,
                }}
              >
                <QrCode className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black block" style={{ color: colors.textPrimary }}>
                  PIX Direto
                </span>
                <span className="text-xs font-medium block" style={{ color: colors.textSecondary }}>
                  Transferência instantânea para o motorista
                </span>
              </div>
            </div>
            {formaPagamento === "pix" && !pagamentoNaMaquininha && (
              <Check className="w-5 h-5 stroke-[3]" style={{ color: colors.primary }} />
            )}
          </NativeSurface>

          {/* OPÇÃO 2: DINHEIRO EM ESPÉCIE */}
          <NativeSurface
            elevation={1}
            interactive
            padding="sm"
            onClick={() => {
              selectPaymentMethod("dinheiro");
              setPagamentoNaMaquininha(false);
              setModalPagamentoAberto(false);
            }}
            style={
              formaPagamento === "dinheiro" && !pagamentoNaMaquininha
                ? {
                    border: `1.5px solid ${colors.primary}`,
                    backgroundColor: `${colors.primary}12`,
                  }
                : undefined
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black block" style={{ color: colors.textPrimary }}>
                  Dinheiro
                </span>
                <span className="text-xs font-medium block" style={{ color: colors.textSecondary }}>
                  Pagar em espécie diretamente ao condutor
                </span>
              </div>
            </div>
            {formaPagamento === "dinheiro" && !pagamentoNaMaquininha && (
              <Check className="w-5 h-5 stroke-[3]" style={{ color: colors.primary }} />
            )}
          </NativeSurface>

          {/* OPÇÃO 3: MAQUININHA DO MOTORISTA */}
          <NativeSurface
            elevation={1}
            interactive
            padding="sm"
            onClick={() => {
              selectPaymentMethod("dinheiro");
              setPagamentoNaMaquininha(true);
              setModalPagamentoAberto(false);
            }}
            style={
              pagamentoNaMaquininha
                ? {
                    border: `1.5px solid ${colors.primary}`,
                    backgroundColor: `${colors.primary}12`,
                  }
                : undefined
            }
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${colors.primary}18`,
                  color: colors.primary,
                }}
              >
                <CreditCard className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black block" style={{ color: colors.textPrimary }}>
                  Maquininha do Motorista
                </span>
                <span className="text-xs font-medium block" style={{ color: colors.textSecondary }}>
                  Cartão de débito ou crédito no veículo
                </span>
              </div>
            </div>
            {pagamentoNaMaquininha && (
              <Check className="w-5 h-5 stroke-[3]" style={{ color: colors.primary }} />
            )}
          </NativeSurface>
        </div>
      </NativeBottomSheet>

      {/* ===================================================================== */}
      {/* BOTTOM SHEET SECUNDÁRIA: ADICIONAR PARADA INTERMEDIÁRIA               */}
      {/* ===================================================================== */}
      <NativeBottomSheet
        isOpen={modalParadaAberto}
        onClose={() => setModalParadaAberto(false)}
        title="Paradas no trajeto"
        subtitle="Adicione até 2 paradas (+ R$ 2,50/parada)"
        showDragHandle
        showCloseButton
      >
        <div className="space-y-3 pb-3">
          {/* Ponto 1: Origem */}
          <NativeSurface elevation={1} padding="sm" className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] uppercase font-extrabold text-slate-500 block">Embarque</span>
              <span className="font-bold truncate block text-xs" style={{ color: colors.textPrimary }}>{origem}</span>
            </div>
          </NativeSurface>

          {/* Lista de Paradas Cadastradas */}
          {paradas.map((p, idx) => (
            <NativeSurface
              key={p.id}
              elevation={1}
              padding="sm"
              style={
                corPrimaria
                  ? {
                      backgroundColor: `${corPrimaria}10`,
                      border: `1.5px solid ${corPrimaria}30`,
                    }
                  : undefined
              }
              className="flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  style={{ backgroundColor: colors.primary, color: "#FFFFFF" }}
                  className="w-5 h-5 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-2xs"
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <span
                    style={{ color: colors.primary }}
                    className="text-[10px] uppercase font-black block"
                  >
                    Parada {idx + 1}
                  </span>
                  <span className="font-bold truncate block text-xs" style={{ color: colors.textPrimary }}>{p.endereco}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light();
                  removerParada(p.id);
                }}
                className="min-h-[44px] px-3 py-1.5 text-rose-700 hover:text-rose-900 hover:bg-rose-100/60 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer"
              >
                Remover
              </button>
            </NativeSurface>
          ))}

          {/* Campo para Adicionar Parada (se < 2) */}
          {paradas.length < 2 ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputParada}
                  onChange={(e) => setInputParada(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdicionarParada();
                    }
                  }}
                  placeholder={paradas.length === 0 ? "Endereço da 1ª parada..." : "Endereço da 2ª parada..."}
                  className="flex-1 text-xs sm:text-sm font-medium min-h-[48px] px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderColor: colors.inputBorder,
                  }}
                  autoFocus
                />
                <NativeButton
                  type="button"
                  size="sm"
                  disabled={!inputParada.trim()}
                  onClick={() => {
                    hapticFeedback.light();
                    handleAdicionarParada();
                  }}
                >
                  + Add
                </NativeButton>
              </div>
            </div>
          ) : (
            <p
              style={{
                backgroundColor: `${colors.primary}12`,
                color: colors.primary,
                borderColor: `${colors.primary}25`,
              }}
              className="text-xs p-3 rounded-xl text-center font-bold border"
            >
              ✓ Limite máximo de 2 paradas intermediárias atingido.
            </p>
          )}

          {/* Ponto Final: Destino */}
          <NativeSurface elevation={1} padding="sm" className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-sm bg-rose-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] uppercase font-extrabold text-slate-500 block">Destino</span>
              <span className="font-bold truncate block text-xs" style={{ color: colors.textPrimary }}>{destino}</span>
            </div>
          </NativeSurface>

          <div className="pt-2">
            <NativeButton
              variant="filled"
              size="md"
              fullWidth
              onClick={() => setModalParadaAberto(false)}
            >
              Concluir
            </NativeButton>
          </div>
        </div>
      </NativeBottomSheet>

      {/* ===================================================================== */}
      {/* BOTTOM SHEET SECUNDÁRIA: ESCOLHA DO PASSAGEIRO                        */}
      {/* ===================================================================== */}
      <NativeBottomSheet
        isOpen={modalPassageiroAberto}
        onClose={() => setModalPassageiroAberto(false)}
        title="Quem vai embarcar?"
        subtitle="Escolha quem irá viajar"
        showDragHandle
        showCloseButton
      >
        <div className="space-y-4 pb-3">
          <div className="grid grid-cols-2 gap-3">
            <NativeButton
              variant={!viajanteOutraPessoa ? "filled" : "tonal"}
              size="md"
              onClick={() => setViajanteOutraPessoa(false)}
            >
              Para mim
            </NativeButton>

            <NativeButton
              variant={viajanteOutraPessoa ? "filled" : "tonal"}
              size="md"
              onClick={() => setViajanteOutraPessoa(true)}
            >
              Outra pessoa
            </NativeButton>
          </div>

          {viajanteOutraPessoa && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
                  Nome do passageiro
                </label>
                <input
                  type="text"
                  value={nomeOutroPassageiro}
                  onChange={(e) => setNomeOutroPassageiro(e.target.value)}
                  placeholder="Nome completo (ex: Maria Silva)..."
                  className="w-full text-xs sm:text-sm font-medium min-h-[48px] px-4 rounded-xl border"
                  style={{
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderColor: colors.inputBorder,
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: colors.textSecondary }}>
                  Telefone de contato
                </label>
                <input
                  type="tel"
                  value={telefoneOutroPassageiro}
                  onChange={(e) => setTelefoneOutroPassageiro(e.target.value)}
                  placeholder="(82) 99999-9999"
                  className="w-full text-xs sm:text-sm font-medium min-h-[48px] px-4 rounded-xl border"
                  style={{
                    backgroundColor: colors.inputBackground,
                    color: colors.textPrimary,
                    borderColor: colors.inputBorder,
                  }}
                />
              </div>

              <NativeSurface elevation={1} padding="sm" className="text-xs font-medium text-slate-700">
                💡 O motorista verá que a corrida foi pedida por você e poderá falar diretamente com quem vai embarcar.
              </NativeSurface>
            </div>
          )}

          <div className="pt-2">
            <NativeButton
              variant="filled"
              size="md"
              fullWidth
              onClick={() => setModalPassageiroAberto(false)}
            >
              Concluir
            </NativeButton>
          </div>
        </div>
      </NativeBottomSheet>
    </div>
  );
});
