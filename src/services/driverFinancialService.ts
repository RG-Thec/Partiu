/**
 * ==============================================================================
 * 📊 PARTIU DRIVER FINANCIAL & METRICS SERVICE (ZERO-CUSTODY P2P)
 * ==============================================================================
 * Gestão financeira, metas operacionais e inteligência de faturamento para o motorista:
 * - 100% Pagamentos Diretos P2P (PIX direto na conta bancária ou Dinheiro em mãos)
 * - 0% Retenção pela plataforma
 * - Acompanhamento de metas diárias e semanais para alto engajamento
 * - Métricas de eficiência: R$/KM rodado, R$/hora online e ticket médio
 * - Calculadora de lucro líquido real (Faturamento - Combustível - Amortização da Diária)
 * - Comparativo de economia real contra apps tradicionais (Uber/99 a 25% de taxa)
 * ==============================================================================
 */

import { getMonetizacaoConfig } from "@/lib/superadmin-config";

export interface DriverFinancialGoal {
  dailyGoalBrl: number;
  weeklyGoalBrl: number;
  fuelConsumptionKmPerLiter: number;
  fuelPricePerLiterBrl: number;
}

export interface SettledTripRecord {
  id: string;
  rideId: string;
  passengerName: string;
  destination: string;
  amountBrl: number;
  paymentMethod: "PIX" | "DINHEIRO";
  distanceKm: number;
  durationMinutes: number;
  timestamp: number;
}

export interface DriverFinancialMetrics {
  driverId: string;
  todayGrossBrl: number;
  todayPixBrl: number;
  todayDinheiroBrl: number;
  todayTripsCount: number;
  todayDistanceKm: number;
  todayOnlineMinutes: number;
  reaisPerKm: number;
  reaisPerHour: number;
  averageTicketBrl: number;
  estimatedFuelCostBrl: number;
  dailyFeeAmortizedBrl: number;
  realNetProfitBrl: number;
  savingsVersusTraditionalAppsBrl: number;
  dailyGoalProgress: {
    targetBrl: number;
    achievedBrl: number;
    percent: number;
    remainingBrl: number;
    isAchieved: boolean;
  };
  weeklyGoalProgress: {
    targetBrl: number;
    achievedBrl: number;
    percent: number;
    remainingBrl: number;
    isAchieved: boolean;
  };
  recentTrips: SettledTripRecord[];
}

const STORAGE_KEY_PREFIX_GOALS = "partiu_driver_financial_goals_";
const STORAGE_KEY_PREFIX_TRIPS = "partiu_driver_settled_trips_";

export class DriverFinancialService {
  private static instance: DriverFinancialService;

  public static getInstance(): DriverFinancialService {
    if (!DriverFinancialService.instance) {
      DriverFinancialService.instance = new DriverFinancialService();
    }
    return DriverFinancialService.instance;
  }

  /**
   * Obtém as metas configuradas pelo condutor
   */
  public getGoals(driverId: string): DriverFinancialGoal {
    if (typeof window === "undefined") {
      return {
        dailyGoalBrl: 250,
        weeklyGoalBrl: 1500,
        fuelConsumptionKmPerLiter: 10.5,
        fuelPricePerLiterBrl: 5.89,
      };
    }
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX_GOALS}${driverId}`);
    if (!raw) {
      return {
        dailyGoalBrl: 250,
        weeklyGoalBrl: 1500,
        fuelConsumptionKmPerLiter: 10.5,
        fuelPricePerLiterBrl: 5.89,
      };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        dailyGoalBrl: 250,
        weeklyGoalBrl: 1500,
        fuelConsumptionKmPerLiter: 10.5,
        fuelPricePerLiterBrl: 5.89,
      };
    }
  }

  /**
   * Salva metas customizadas pelo condutor
   */
  public saveGoals(driverId: string, goals: Partial<DriverFinancialGoal>): DriverFinancialGoal {
    const current = this.getGoals(driverId);
    const updated: DriverFinancialGoal = {
      ...current,
      ...goals,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEY_PREFIX_GOALS}${driverId}`, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("partiu:driver-financial-updated", { detail: { driverId } }));
    }
    return updated;
  }

  /**
   * Obtém histórico de viagens liquidadas do condutor
   */
  public getSettledTrips(driverId: string): SettledTripRecord[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX_TRIPS}${driverId}`);
    if (!raw) {
      // Mock inicial de demonstração se vazio
      return [
        {
          id: "TRIP-01",
          rideId: "COR-8821",
          passengerName: "Juliana Santos",
          destination: "Hospital São José",
          amountBrl: 28.5,
          paymentMethod: "PIX",
          distanceKm: 6.2,
          durationMinutes: 14,
          timestamp: Date.now() - 3600000 * 2,
        },
        {
          id: "TRIP-02",
          rideId: "COR-8819",
          passengerName: "Marcos Paulo",
          destination: "Shopping Itaperuna",
          amountBrl: 19.0,
          paymentMethod: "PIX",
          distanceKm: 4.1,
          durationMinutes: 10,
          timestamp: Date.now() - 3600000 * 4,
        },
        {
          id: "TRIP-03",
          rideId: "COR-8815",
          passengerName: "Ana Clara",
          destination: "Rodoviária",
          amountBrl: 22.0,
          paymentMethod: "DINHEIRO",
          distanceKm: 5.0,
          durationMinutes: 12,
          timestamp: Date.now() - 3600000 * 6,
        },
      ];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Registra uma nova viagem concluída e liquidada diretamente pelo passageiro
   */
  public recordSettledTrip(
    driverId: string,
    trip: Omit<SettledTripRecord, "id" | "timestamp">
  ): SettledTripRecord {
    const trips = this.getSettledTrips(driverId);
    const newRecord: SettledTripRecord = {
      ...trip,
      id: `SETTLED-${Date.now()}`,
      timestamp: Date.now(),
    };

    trips.unshift(newRecord);
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_KEY_PREFIX_TRIPS}${driverId}`, JSON.stringify(trips.slice(0, 100)));
      window.dispatchEvent(new CustomEvent("partiu:driver-financial-updated", { detail: { driverId } }));
    }
    return newRecord;
  }

  /**
   * Calcula todas as métricas financeiras consolidadas do motorista
   */
  public getMetrics(driverId: string, vehicleType: "CARRO" | "MOTO" = "CARRO"): DriverFinancialMetrics {
    const goals = this.getGoals(driverId);
    const trips = this.getSettledTrips(driverId);
    const monetizacaoConfig = getMonetizacaoConfig();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTimestamp = startOfToday.getTime();

    const startOfWeek = new Date();
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    const weekTimestamp = startOfWeek.getTime();

    // Filtros por período
    const todayTrips = trips.filter((t) => t.timestamp >= todayTimestamp);
    const weekTrips = trips.filter((t) => t.timestamp >= weekTimestamp);

    // Faturamento de hoje
    const todayGrossBrl = todayTrips.reduce((acc, t) => acc + t.amountBrl, 0);
    const todayPixBrl = todayTrips
      .filter((t) => t.paymentMethod === "PIX")
      .reduce((acc, t) => acc + t.amountBrl, 0);
    const todayDinheiroBrl = todayTrips
      .filter((t) => t.paymentMethod === "DINHEIRO")
      .reduce((acc, t) => acc + t.amountBrl, 0);
    const todayTripsCount = todayTrips.length;
    const todayDistanceKm = todayTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0);

    // Estimativa de tempo online (mínimo 60 min se houver corridas)
    const todayOnlineMinutes = Math.max(
      60,
      todayTrips.reduce((acc, t) => acc + (t.durationMinutes || 15), 0) + todayTripsCount * 10
    );
    const onlineHours = todayOnlineMinutes / 60;

    // Eficiência operacional
    const reaisPerKm = todayDistanceKm > 0 ? todayGrossBrl / todayDistanceKm : 0;
    const reaisPerHour = onlineHours > 0 ? todayGrossBrl / onlineHours : 0;
    const averageTicketBrl = todayTripsCount > 0 ? todayGrossBrl / todayTripsCount : 0;

    // Estimativa de custos reais
    const consumption = vehicleType === "MOTO" ? 35 : goals.fuelConsumptionKmPerLiter;
    const estimatedFuelCostBrl =
      consumption > 0 ? (todayDistanceKm / consumption) * goals.fuelPricePerLiterBrl : 0;

    const dailyFeeAmortizedBrl =
      vehicleType === "MOTO" ? monetizacaoConfig.diariaMoto : monetizacaoConfig.diariaCarro;

    // Lucro Líquido Real = Faturamento Bruto - Combustível - Diária
    const realNetProfitBrl = Math.max(0, todayGrossBrl - estimatedFuelCostBrl - dailyFeeAmortizedBrl);

    // Comparativo: Nas concorrentes (Uber/99), a taxa média é 25% do faturamento bruto
    const traditionalAppCommissionBrl = todayGrossBrl * 0.25;
    const savingsVersusTraditionalAppsBrl = Math.max(
      0,
      traditionalAppCommissionBrl - dailyFeeAmortizedBrl
    );

    // Progresso das Metas
    const dailyPercent = Math.min(100, Math.round((todayGrossBrl / (goals.dailyGoalBrl || 1)) * 100));
    const dailyRemaining = Math.max(0, goals.dailyGoalBrl - todayGrossBrl);

    const weekGrossBrl = weekTrips.reduce((acc, t) => acc + t.amountBrl, 0);
    const weeklyPercent = Math.min(100, Math.round((weekGrossBrl / (goals.weeklyGoalBrl || 1)) * 100));
    const weeklyRemaining = Math.max(0, goals.weeklyGoalBrl - weekGrossBrl);

    return {
      driverId,
      todayGrossBrl,
      todayPixBrl,
      todayDinheiroBrl,
      todayTripsCount,
      todayDistanceKm,
      todayOnlineMinutes,
      reaisPerKm: Number(reaisPerKm.toFixed(2)),
      reaisPerHour: Number(reaisPerHour.toFixed(2)),
      averageTicketBrl: Number(averageTicketBrl.toFixed(2)),
      estimatedFuelCostBrl: Number(estimatedFuelCostBrl.toFixed(2)),
      dailyFeeAmortizedBrl,
      realNetProfitBrl: Number(realNetProfitBrl.toFixed(2)),
      savingsVersusTraditionalAppsBrl: Number(savingsVersusTraditionalAppsBrl.toFixed(2)),
      dailyGoalProgress: {
        targetBrl: goals.dailyGoalBrl,
        achievedBrl: todayGrossBrl,
        percent: dailyPercent,
        remainingBrl: Number(dailyRemaining.toFixed(2)),
        isAchieved: todayGrossBrl >= goals.dailyGoalBrl,
      },
      weeklyGoalProgress: {
        targetBrl: goals.weeklyGoalBrl,
        achievedBrl: weekGrossBrl,
        percent: weeklyPercent,
        remainingBrl: Number(weeklyRemaining.toFixed(2)),
        isAchieved: weekGrossBrl >= goals.weeklyGoalBrl,
      },
      recentTrips: trips.slice(0, 10),
    };
  }
}

export const driverFinancialService = DriverFinancialService.getInstance();
