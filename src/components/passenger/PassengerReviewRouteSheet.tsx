import React, { useState, useEffect, useCallback, memo } from "react";
import {
  Clock,
  Navigation,
  ArrowLeft,
  X,
  Plus,
  User,
  ShieldCheck,
  QrCode,
  CreditCard,
  Banknote,
} from "lucide-react";
import { usePassengerRide } from "@/contexts/PassengerRideContext";
import type { PassengerVehicleCategory } from "@/lib/passenger/passenger-ride-machine";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { useBottomSheetGesture } from "@/hooks/useBottomSheetGesture";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";
import { couponService, type ActiveCoupon } from "@/services/CouponService";
import { VehicleOptionCard } from "./route-sheet/VehicleOptionCard";
import { PaymentSelectionModal } from "./route-sheet/PaymentSelectionModal";
import { RouteStopsModal } from "./route-sheet/RouteStopsModal";
import { PassengerSelectionModal } from "./route-sheet/PassengerSelectionModal";
import { RouteSheetFooter } from "./route-sheet/RouteSheetFooter";

/**
 * 🚗 PASSENGER REVIEW ROUTE SHEET (MODAL "ESCOLHA SUA CATEGORIA")
 * ==============================================================================
 * Decomposto e otimizado para máxima performance a 60 FPS:
 * 1. Altura compactada e física gestual com molas calibradas (Zero Scroll)
 * 2. Visualização de Carro e Moto com renders 3D e preços garantidos
 * 3. Modais táteis desacoplados para paradas, pagamento e escolha de passageiro
 * 4. Rodapé fixo seguro com botão de confirmação com gradiente da marca
 * ==============================================================================
 */
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
    setParadaIntermediaria,
    horarioDesembarquePrevisto,
    preferences,
    togglePreference,
  } = usePassengerRide();

  const { corPrimaria, corSecundaria, nomeApp } = useBrandTheme();
  const { appConfig } = useTheme();
  const { colors } = appConfig.branding;

  // Modais secundários compactos
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [modalParadaAberto, setModalParadaAberto] = useState(false);
  const [modalPassageiroAberto, setModalPassageiroAberto] = useState(false);

  // Cupom promocional ativo
  const [cupomAtivo, setCupomAtivo] = useState<ActiveCoupon | null>(() =>
    couponService.getActiveRideCoupon()
  );

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

  const handleSelectCategory = useCallback(
    (cat: PassengerVehicleCategory) => {
      hapticFeedback.medium();
      selectVehicle(cat);
    },
    [selectVehicle]
  );

  const handleOpenPayment = useCallback(() => {
    hapticFeedback.light();
    setModalPagamentoAberto(true);
  }, []);

  // Taxa de cancelamento pendente de corrida anterior (se houver)
  const [taxaCancelamentoPendente] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("partiu_pending_cancellation_fee") || 0);
  });

  const handleConfirm = useCallback(() => {
    hapticFeedback.heavy();
    if (typeof window !== "undefined") {
      localStorage.removeItem("partiu_pending_cancellation_fee");
    }
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

  const rawMotoBase = quoteMoto?.priceBrl ?? cotacoes?.moto?.precoBrl ?? 7.5;
  const rawPopBase = quotePop?.priceBrl ?? cotacoes?.carro?.precoBrl ?? 11.5;

  // Aplica taxa de cancelamento pendente (se houver débito anterior com condutor a caminho)
  const rawMoto = rawMotoBase + taxaCancelamentoPendente;
  const rawPop = rawPopBase + taxaCancelamentoPendente;

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
  const precoMotoOriginal = motoCalc.hasDiscount
    ? `R$ ${rawMoto.toFixed(2).replace(".", ",")}`
    : undefined;

  const precoPop = `R$ ${popCalc.discounted.toFixed(2).replace(".", ",")}`;
  const precoPopOriginal = popCalc.hasDiscount
    ? `R$ ${rawPop.toFixed(2).replace(".", ",")}`
    : undefined;

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
        {/* SEÇÃO A — HEADER COMPACTO FIXO */}
        <div className="px-3.5 sm:px-4 pt-1 shrink-0">
          <div
            {...handlers}
            onClick={() => snapTo(activeSnapKey === "COLLAPSED" ? "HALF" : "COLLAPSED")}
            className="w-full pt-0.5 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none group"
            aria-label={
              activeSnapKey === "COLLAPSED" ? "Expandir detalhes da corrida" : "Recolher para visão compacta"
            }
          >
            <div
              className={`h-1 rounded-full transition-all duration-200 ${
                isDragging ? "bg-brand-primary-vibrant w-12" : "bg-slate-300 w-10 group-hover:bg-slate-400"
              }`}
            />
          </div>

          {/* 1. LINHA ENXUTA UNIFICADA: Voltar + Chips de Distância/Tempo + Fechar */}
          <div className="flex flex-row items-center justify-between gap-2 pb-1 border-b border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[44px] h-9 sm:h-10 px-3 text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:scale-95 rounded-xl transition cursor-pointer flex flex-row items-center gap-1.5 font-bold text-xs border border-slate-200/80 bg-white shadow-2xs shrink-0"
              title="Voltar e alterar endereço"
              aria-label="Voltar para busca de endereço"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.4]" />
              <span>Voltar</span>
            </button>

            {/* Chips Enxutos de Distância e Tempo */}
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

            {/* Botão Fechar / Cancelar */}
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-[44px] min-w-[44px] rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition cursor-pointer flex items-center justify-center shrink-0 touch-manipulation"
              title="Cancelar e voltar ao mapa"
              aria-label="Cancelar e voltar ao mapa"
            >
              <span className="h-8 w-8 rounded-full border border-slate-200/80 bg-white flex items-center justify-center shadow-xs">
                <X className="w-4 h-4 stroke-[2.4]" />
              </span>
            </button>
          </div>
        </div>

        {/* SEÇÃO B — CONTEÚDO PRINCIPAL (CATEGORIAS + CHIPS) */}
        <div className="flex-1 min-h-0 flex flex-col px-3.5 sm:px-4 py-1 space-y-1.5 overflow-y-auto">
          <div className="flex flex-row items-center justify-between pt-0.5 pb-0.5 shrink-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
              Escolha sua categoria
            </h3>
          </div>

          {/* 2. SELEÇÃO DE VEÍCULOS */}
          <div className="space-y-1.5 shrink-0">
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

          {/* BANNER DE PREÇO FIXO GARANTIDO */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.2]" />
            <p className="text-[11px] sm:text-xs font-semibold leading-tight text-slate-600">
              <strong className="text-slate-900">Preço fixo garantido:</strong> Sem alteração com trânsito ou semáforos.
            </p>
          </div>

          {/* AVISO DE TAXA DE CANCELAMENTO PENDENTE DE VIAGEM ANTERIOR */}
          {taxaCancelamentoPendente > 0 && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium shrink-0 animate-in fade-in">
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">
                  Inclui <strong>R$ {taxaCancelamentoPendente.toFixed(2).replace(".", ",")}</strong> de taxa por cancelamento anterior
                </span>
              </div>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded-md font-bold shrink-0 ml-1">
                Taxa
              </span>
            </div>
          )}

          {/* 3. CHIPS DE OPÇÕES EXTRAS (PARADA / PASSAGEIRO / MULHER) */}
          <div className="flex flex-row items-center justify-between gap-1.5 pt-0.5 shrink-0">
            {/* Chip de Parada */}
            <div className="flex-1 min-w-0 flex items-center">
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
                className={`min-h-[44px] h-9 w-full flex flex-row items-center justify-between gap-1.5 font-semibold text-xs px-2.5 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer touch-manipulation ${
                  paradas.length > 0
                    ? "font-bold"
                    : "bg-slate-100/90 text-slate-700 hover:text-slate-950 border-slate-200/80"
                }`}
              >
                <div className="flex flex-row items-center gap-1.5 truncate">
                  <Plus
                    className="w-3.5 h-3.5 stroke-[2.5] shrink-0"
                    style={{ color: paradas.length > 0 ? colors.primary : undefined }}
                  />
                  <span className="truncate">
                    {paradas.length === 0
                      ? "+ Parada"
                      : paradas.length === 1
                      ? "1 Parada"
                      : "2 Paradas"}
                  </span>
                </div>
                {paradas.length > 0 && (
                  <span
                    className="w-5 h-5 -mr-0.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center font-bold text-[11px] shrink-0"
                    title="Paradas adicionadas"
                  >
                    {paradas.length}
                  </span>
                )}
              </button>
              {paradas.length > 0 && (
                <button
                  type="button"
                  aria-label="Remover paradas intermediárias"
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticFeedback.light();
                    setParadaIntermediaria(null);
                  }}
                  className="ml-1 min-h-[44px] min-w-[36px] flex items-center justify-center text-rose-600 hover:text-rose-800 p-1.5 rounded-xl hover:bg-rose-50 transition active:scale-90 cursor-pointer shrink-0"
                  title="Remover paradas"
                >
                  ✕
                </button>
              )}
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
                className={`min-h-[44px] h-9 w-full flex flex-row items-center justify-center gap-1.5 font-semibold text-xs px-2.5 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer touch-manipulation ${
                  viajanteOutraPessoa
                    ? "font-bold"
                    : "bg-slate-100/90 text-slate-700 hover:text-slate-950 border-slate-200/80"
                }`}
              >
                <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate">
                  {viajanteOutraPessoa
                    ? nomeOutroPassageiro
                      ? `Para: ${nomeOutroPassageiro.slice(0, 10)}`
                      : "Outro"
                    : "Para mim"}
                </span>
              </button>
            </div>

            {/* Chip Mulher (Motoristas Mulheres) */}
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.medium();
                  togglePreference("isFemaleOnly");
                }}
                className={`min-h-[44px] h-9 w-full flex flex-row items-center justify-center gap-1.5 font-semibold text-xs px-2.5 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer touch-manipulation ${
                  preferences?.isFemaleOnly
                    ? "bg-purple-50 text-purple-900 border-purple-300 shadow-2xs font-bold"
                    : "bg-slate-100/90 text-slate-700 hover:text-slate-950 border-slate-200/80"
                }`}
                title={`${nomeApp} Mulher — Apenas condutoras mulheres`}
              >
                <ShieldCheck
                  className={`w-3.5 h-3.5 ${
                    preferences?.isFemaleOnly ? "text-purple-600 stroke-[2.4]" : "text-slate-500"
                  } shrink-0`}
                />
                <span className="truncate">{nomeApp} Mulher</span>
              </button>
            </div>
          </div>
        </div>

        {/* SEÇÃO C — FOOTER FIXO SEGURO */}
        <RouteSheetFooter
          cupomAtivo={cupomAtivo}
          paymentInfo={paymentInfo}
          formaPagamento={formaPagamento}
          pagamentoNaMaquininha={pagamentoNaMaquininha}
          onOpenPayment={handleOpenPayment}
          onConfirm={handleConfirm}
          isMoto={isMoto}
          nomeVeiculoAtivo={nomeVeiculoAtivo}
          precoAtivo={precoAtivo}
          corPrimaria={corPrimaria}
          corSecundaria={corSecundaria}
        />
      </div>

      {/* SUBMODAL: SELEÇÃO DA FORMA DE PAGAMENTO */}
      <PaymentSelectionModal
        isOpen={modalPagamentoAberto}
        onClose={() => setModalPagamentoAberto(false)}
        formaPagamento={formaPagamento}
        pagamentoNaMaquininha={pagamentoNaMaquininha}
        onSelectPayment={(method, naMaquininha) => {
          selectPaymentMethod(method);
          setPagamentoNaMaquininha(naMaquininha);
        }}
        corPrimaria={corPrimaria}
        colors={colors}
      />

      {/* SUBMODAL: PARADAS NO TRAJETO */}
      <RouteStopsModal
        isOpen={modalParadaAberto}
        onClose={() => setModalParadaAberto(false)}
        origem={origem}
        destino={destino}
        paradas={paradas}
        onAdicionarParada={adicionarParada}
        onRemoverParada={removerParada}
        corPrimaria={corPrimaria}
        colors={colors}
      />

      {/* SUBMODAL: QUEM VAI EMBARCAR */}
      <PassengerSelectionModal
        isOpen={modalPassageiroAberto}
        onClose={() => setModalPassageiroAberto(false)}
        viajanteOutraPessoa={viajanteOutraPessoa}
        setViajanteOutraPessoa={setViajanteOutraPessoa}
        nomeOutroPassageiro={nomeOutroPassageiro}
        setNomeOutroPassageiro={setNomeOutroPassageiro}
        telefoneOutroPassageiro={telefoneOutroPassageiro}
        setTelefoneOutroPassageiro={setTelefoneOutroPassageiro}
        colors={colors}
      />
    </div>
  );
});

export default PassengerReviewRouteSheet;
