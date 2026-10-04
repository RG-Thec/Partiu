import React, { memo, useState, useEffect, useMemo } from "react";
import {
  X,
  Target,
  TrendingUp,
  DollarSign,
  Fuel,
  Clock,
  Navigation,
  ShieldCheck,
  Award,
  Zap,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Edit2,
  Check,
  Calendar,
} from "lucide-react";
import { driverFinancialService, type DriverFinancialMetrics } from "@/services/driverFinancialService";
import { driverSubscriptionService, type DriverSubscriptionRecord } from "@/lib/ecosystem/driver-subscription-service";
import { getMonetizacaoConfig } from "@/lib/superadmin-config";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

interface DriverFinancialDashboardModalProps {
  isOpen: boolean;
  driverId: string;
  driverName: string;
  vehicleType?: "CARRO" | "MOTO";
  onClose: () => void;
  onOpenSubscriptionPlans: () => void;
}

export const DriverFinancialDashboardModal = memo(function DriverFinancialDashboardModal({
  isOpen,
  driverId,
  driverName,
  vehicleType = "CARRO",
  onClose,
  onOpenSubscriptionPlans,
}: DriverFinancialDashboardModalProps) {
  const [metrics, setMetrics] = useState<DriverFinancialMetrics>(() =>
    driverFinancialService.getMetrics(driverId, vehicleType)
  );
  const [subscription, setSubscription] = useState<DriverSubscriptionRecord | null>(() =>
    driverSubscriptionService.getSubscription(driverId)
  );

  // Estados de edição da meta diária
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalBrl, setTempGoalBrl] = useState<number>(() => metrics.dailyGoalProgress.targetBrl);

  // Recarrega métricas e assinatura
  const refreshData = () => {
    setMetrics(driverFinancialService.getMetrics(driverId, vehicleType));
    setSubscription(driverSubscriptionService.getSubscription(driverId));
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener("partiu:driver-financial-updated", handleUpdate);
    window.addEventListener("partiu:driver_subscription_activated", handleUpdate);

    return () => {
      window.removeEventListener("partiu:driver-financial-updated", handleUpdate);
      window.removeEventListener("partiu:driver_subscription_activated", handleUpdate);
    };
  }, [isOpen, driverId, vehicleType]);

  // Tempo restante da diária / assinatura
  const timeRemainingText = useMemo(() => {
    if (!subscription || subscription.status !== "ACTIVE") {
      return "Expirada / Inativa";
    }
    const expiresTime = new Date(subscription.expires_at).getTime();
    const diff = expiresTime - Date.now();
    if (diff <= 0) return "Expirada";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}min restantes`;
  }, [subscription]);

  const isSubscriptionActive =
    subscription?.status === "ACTIVE" && new Date(subscription.expires_at).getTime() > Date.now();

  const handleSaveGoal = () => {
    if (tempGoalBrl <= 0) return;
    driverFinancialService.saveGoals(driverId, { dailyGoalBrl: tempGoalBrl });
    setIsEditingGoal(false);
    hapticFeedback.success();
    refreshData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom duration-300 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-primary-deep to-brand-primary-vibrant text-white flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">Central Financeira &amp; Metas</h3>
              <p className="text-xs text-slate-700 font-semibold">Gestão P2P com 0% de Retenção</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STATUS DA DIÁRIA SAAS / ASSINATURA ATIVA COM CONTAGEM REGRESSIVA        */}
        {/* ========================================================================= */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
            isSubscriptionActive
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950"
              : "bg-amber-500/10 border-amber-500/30 text-amber-950"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              {isSubscriptionActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isSubscriptionActive ? "bg-emerald-600" : "bg-amber-500"
                }`}
              />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-tight">
                  {isSubscriptionActive
                    ? subscription?.cycle === "TRIAL"
                      ? "Degustação Grátis Ativa"
                      : `Acesso SaaS Ativo (${subscription?.cycle || "Diária"})`
                    : "Diária Expirada / Offline"}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                <span>{timeRemainingText}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSubscriptionPlans();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition active:scale-95 shrink-0 cursor-pointer shadow-xs"
          >
            {isSubscriptionActive ? "Renovar / Planos" : "Pagar Diária"}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* WIDGET DE META DO DIA (ENGAJAMENTO & MOTIVAÇÃO)                           */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-black tracking-tight uppercase text-slate-200">
                Meta de Faturamento do Dia
              </span>
            </div>

            {!isEditingGoal ? (
              <button
                type="button"
                onClick={() => {
                  setTempGoalBrl(metrics.dailyGoalProgress.targetBrl);
                  setIsEditingGoal(true);
                }}
                className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Ajustar Meta</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSaveGoal}
                  className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 cursor-pointer flex items-center gap-0.5"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Salvar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(false)}
                  className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-bold text-xs hover:bg-white/20 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Valor da Meta e Progresso */}
          {isEditingGoal ? (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm font-bold text-slate-300">R$</span>
              <input
                type="number"
                value={tempGoalBrl}
                onChange={(e) => setTempGoalBrl(Number(e.target.value))}
                className="w-32 bg-white/15 border border-white/20 rounded-xl px-2.5 py-1 text-white font-black text-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                min={50}
                step={10}
                autoFocus
              />
              <span className="text-xs text-slate-300 font-medium">Defina sua meta desejada</span>
            </div>
          ) : (
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-3xl font-black text-emerald-400 leading-tight">
                  {metrics.todayGrossBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <span className="text-xs text-slate-300 font-medium ml-2">
                  de {metrics.dailyGoalProgress.targetBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <span className="text-xs font-black text-white px-2 py-0.5 rounded-full bg-white/10">
                {metrics.dailyGoalProgress.percent}%
              </span>
            </div>
          )}

          {/* Barra de Progresso Visual */}
          <div className="w-full h-3 rounded-full bg-white/15 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.dailyGoalProgress.isAchieved
                  ? "bg-gradient-to-r from-emerald-400 to-teal-300"
                  : "bg-gradient-to-r from-brand-primary-vibrant to-emerald-400"
              }`}
              style={{ width: `${Math.min(100, metrics.dailyGoalProgress.percent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-200 font-medium">
            {metrics.dailyGoalProgress.isAchieved ? (
              <span className="flex items-center gap-1 text-emerald-300 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parabéns! Meta do dia alcançada! 🏆</span>
              </span>
            ) : (
              <span>
                Faltam{" "}
                <strong className="text-white">
                  {metrics.dailyGoalProgress.remainingBrl.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>{" "}
                para bater sua meta hoje (~{Math.ceil(metrics.dailyGoalProgress.remainingBrl / 22)} corridas).
              </span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FATURAMENTO BRUTO & DIVISÃO TRANSPARENTE: PIX vs DINHEIRO                 */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-2">
          {/* Card PIX Direto */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-800">⚡ PIX Direto</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded-md">
                No Banco
              </span>
            </div>
            <div className="text-xl font-black text-emerald-700">
              {metrics.todayPixBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-slate-700 font-semibold">100% recebido na sua conta</p>
          </div>

          {/* Card Dinheiro em Mãos */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-800">💵 Dinheiro</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-1.5 py-0.2 rounded-md">
                Em Mãos
              </span>
            </div>
            <div className="text-xl font-black text-amber-700">
              {metrics.todayDinheiroBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-slate-700 font-semibold">Recebido dos passageiros</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EFICIÊNCIA OPERACIONAL (KM, R$/KM, R$/HORA)                               */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-tight text-slate-900">
              Eficiência Operacional de Hoje
            </span>
            <span className="text-xs font-bold text-slate-700">
              {metrics.todayTripsCount} {metrics.todayTripsCount === 1 ? "corrida" : "corridas"} concluídas
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-600 font-extrabold block uppercase tracking-wider">Distância</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block">
                {metrics.todayDistanceKm.toFixed(1)} km
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-600 font-extrabold block uppercase tracking-wider">Por KM</span>
              <span className="text-sm font-black text-emerald-600 mt-0.5 block">
                R$ {metrics.reaisPerKm.toFixed(2)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-600 font-extrabold block uppercase tracking-wider">Por Hora</span>
              <span className="text-sm font-black text-brand-primary-deep mt-0.5 block">
                R$ {metrics.reaisPerHour.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CALCULADORA DE LUCRO LÍQUIDO REAL NO BOLSO                                */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-tight">
            <Fuel className="w-4 h-4 text-slate-700" />
            <span>Demonstrativo de Lucro Líquido Real</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-800 font-medium">
              <span>(+) Faturamento Bruto de Hoje:</span>
              <span className="font-bold text-slate-900">
                {metrics.todayGrossBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-700 font-semibold">
              <span>(-) Custo Estimado de Combustível:</span>
              <span className="font-bold text-rose-600">
                -{metrics.estimatedFuelCostBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-700 font-semibold">
              <span>(-) Custo da Diária PARTIU ({vehicleType}):</span>
              <span className="font-bold text-rose-600">
                -{metrics.dailyFeeAmortizedBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-xs font-black text-slate-900 block">(=) Lucro Líquido no Seu Bolso:</span>
                <span className="text-xs text-slate-700 font-semibold">Livre de despesas operacionais</span>
              </div>
              <span className="text-xl font-black text-emerald-700">
                {metrics.realNetProfitBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* WIDGET ECONOMIA "ZERO TAXAS" (VS. UBER / 99 A 25%)                        */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-slate-900 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              0%
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-tight">
                Economia Real no PARTIU
              </h4>
              <p className="text-[11px] text-emerald-900 font-bold">Comparativo contra taxas de 25% de outros apps</p>
            </div>
          </div>

          <div className="p-3 bg-white/80 rounded-xl border border-emerald-200/60 space-y-1 text-xs">
            <div className="flex justify-between text-slate-800 font-medium">
              <span>Se você rodasse no app tradicional (25% taxa):</span>
              <span className="font-bold text-rose-700">
                -{(metrics.todayGrossBrl * 0.25).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <div className="flex justify-between text-slate-800 font-medium">
              <span>No PARTIU você pagou apenas a diária:</span>
              <span className="font-bold text-emerald-700">
                -{metrics.dailyFeeAmortizedBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <div className="pt-1.5 border-t border-emerald-200 flex justify-between items-center font-black text-emerald-900">
              <span>Você economizou hoje:</span>
              <span className="text-base text-emerald-700">
                +{metrics.savingsVersusTraditionalAppsBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXTRATO DAS CORRIDAS DO DIA (P2P SETTLEMENT)                              */}
        {/* ========================================================================= */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
              Últimas Corridas do Dia
            </span>
            <span className="text-xs text-slate-700 font-bold">100% P2P</span>
          </div>

          {metrics.recentTrips.length === 0 ? (
            <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
              Nenhuma corrida finalizada hoje ainda. Fique online para começar a faturar!
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.recentTrips.slice(0, 5).map((trip) => (
                <div
                  key={trip.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-900 truncate">{trip.passengerName}</strong>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                          trip.paymentMethod === "PIX"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {trip.paymentMethod}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium truncate mt-0.5">
                      Destino: {trip.destination} • {trip.distanceKm} km
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 block">
                      {trip.amountBrl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <span className="text-xs font-black text-emerald-700 block">✓ Repasse 100%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm transition cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  );
});
