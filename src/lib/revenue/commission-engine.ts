import { silentCatchWarn } from "@/lib/structured-logger";

/**
 * ==============================================================================
 * 💸 PARTIU REVENUE OS — COMMISSION & FARE SPLIT ENGINE (v1.0)
 * ==============================================================================
 * Motor de Comissões e Split Transparente por Corrida:
 * - Aritmética estrita em centavos inteiros (minor units) eliminando floating-point drift
 * - Invariante contábil: Bruto === Líquido + Taxa Plataforma + Fundo de Proteção
 * - Cálculo dinâmico conforme o plano de assinatura do condutor
 * - Comparativo instantâneo de economia real frente a taxas concorrentes (Uber 20%)
 * ==============================================================================
 */

export interface DriverPlanFeeConfig {
  planId: string;
  planName: string;
  commissionPercent: number; // Oficial: 5% (FREE), 3% (Bronze), 1% (Prata), 0% (Ouro)
  monthlyFeeBrl: number;
  fixedFeePerRideCents?: number | undefined;
  billingCycle?: "DAILY" | "WEEKLY" | "MONTHLY" | undefined;
}

export interface ProtectionFundConfig {
  enabled: boolean;
  retentionPerTripBrl: number; // Padrão: R$ 0,30
  retentionPerTripCents: number; // 30 centavos
  targetCapBrl: number; // Padrão: R$ 30,00
  targetCapCents: number; // 3000 centavos
}

export interface GoldPlanProtectionConfig {
  thresholdMonthlyBrl: number; // Padrão: R$ 8.000,00
  thresholdMonthlyCents: number; // 800.000 centavos
  postThresholdCommissionPercent: number; // Padrão: 0.5%
}

export const DEFAULT_GOLD_PROTECTION_CONFIG: GoldPlanProtectionConfig = {
  thresholdMonthlyBrl: 8000.0,
  thresholdMonthlyCents: 800000,
  postThresholdCommissionPercent: 0.5,
};

export interface EconomicSimulatorInput {
  activeDriversCount: number;
  avgTripsPerDriverPerMonth: number;
  avgGrossFareBrl: number;
  distribution: {
    freePercent: number; // ex: 40
    bronzePercent: number; // ex: 35
    silverPercent: number; // ex: 15
    goldPercent: number; // ex: 10
  };
  serverCostPerTripBrl?: number; // padrão: R$ 0,08
  supportCostPerDriverBrl?: number; // padrão: R$ 4,50/mês
  paymentGatewayPixPercent?: number; // padrão: 0,3%
}

export interface EconomicSimulatorOutput {
  totalMonthlyTrips: number;
  totalMarketplaceGMVBrl: number;
  saasSubscriptionRevenueBrl: number;
  takeRateCommissionsRevenueBrl: number;
  grossPlatformRevenueBrl: number;
  totalOperationalCostBrl: number;
  netPlatformProfitBrl: number;
  netMarginPercent: number;
  effectiveTakeRatePercent: number;
  totalDriverEarningsBrl: number;
  totalDriverSavingsVsUber20Brl: number;
  breakevenDriversCount: number;
  cacEstimatedBrl: number;
  ltvEstimatedBrl: number;
  ltvCacRatio: number;
}

export interface RideCommissionSettlement {
  rideId: string;
  driverId: string;
  planId: string;
  planName: string;
  commissionPercent: number;
  grossFareBrl: number;
  grossFareCents: number;
  platformCommissionBrl: number;
  platformCommissionCents: number;
  protectionFundContributionBrl: number;
  protectionFundContributionCents: number;
  totalPlatformDeductionBrl: number;
  totalPlatformDeductionCents: number;
  driverNetEarningsBrl: number;
  driverNetEarningsCents: number;
  // Comparativo de economia
  competitorBenchmarkTakeRatePercent: number; // 20%
  competitorTakeRateBrl: number;
  savingsVersusCompetitorBrl: number;
  savingsVersusCompetitorCents: number;
  timestamp: number;
}

export const DEFAULT_PROTECTION_CONFIG: ProtectionFundConfig = {
  enabled: false,
  retentionPerTripBrl: 0.0,
  retentionPerTripCents: 0,
  targetCapBrl: 0.0,
  targetCapCents: 0,
};

export const STANDARD_DRIVER_PLANS = {
  LIVRE: {
    planId: "plano-livre",
    planName: "Livre (Trial / Degustação)",
    commissionPercent: 0.0,
    monthlyFeeBrl: 0.0,
    billingCycle: "MONTHLY",
  },
  BRONZE: {
    planId: "plano-bronze",
    planName: "Bronze (Diária Flex)",
    commissionPercent: 0.0,
    monthlyFeeBrl: 29.90,
    billingCycle: "DAILY",
  },
  PRATA: {
    planId: "plano-prata",
    planName: "Prata (Semanal Pro)",
    commissionPercent: 0.0,
    monthlyFeeBrl: 69.90,
    billingCycle: "WEEKLY",
  },
  OURO: {
    planId: "plano-ouro",
    planName: "Ouro (Mensal Ilimitado)",
    commissionPercent: 0.0,
    monthlyFeeBrl: 149.90,
    billingCycle: "MONTHLY",
  },
} as const satisfies Record<string, DriverPlanFeeConfig>;

const STORAGE_PROTECTION_KEY = "partiu_protection_fund_config_v1";
const STORAGE_GOLD_PROTECTION_KEY = "partiu_gold_protection_config_v1";

export class CommissionEngine {
  private static instance: CommissionEngine;
  private protectionConfig: ProtectionFundConfig = { ...DEFAULT_PROTECTION_CONFIG };
  private goldProtectionConfig: GoldPlanProtectionConfig = { ...DEFAULT_GOLD_PROTECTION_CONFIG };

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): CommissionEngine {
    if (!CommissionEngine.instance) {
      CommissionEngine.instance = new CommissionEngine();
    }
    return CommissionEngine.instance;
  }

  private loadConfig(): void {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_PROTECTION_KEY);
      if (saved) {
        this.protectionConfig = { ...DEFAULT_PROTECTION_CONFIG, ...JSON.parse(saved) };
      }
      const savedGold = localStorage.getItem(STORAGE_GOLD_PROTECTION_KEY);
      if (savedGold) {
        this.goldProtectionConfig = { ...DEFAULT_GOLD_PROTECTION_CONFIG, ...JSON.parse(savedGold) };
      }
    } catch (err) { silentCatchWarn("commission-engine", err); }
  }

  public getProtectionConfig(): ProtectionFundConfig {
    return { ...this.protectionConfig };
  }

  public updateProtectionConfig(updates: Partial<ProtectionFundConfig>): ProtectionFundConfig {
    this.protectionConfig = {
      ...this.protectionConfig,
      ...updates,
      retentionPerTripCents: updates.retentionPerTripBrl !== undefined ? Math.round(updates.retentionPerTripBrl * 100) : this.protectionConfig.retentionPerTripCents,
      targetCapCents: updates.targetCapBrl !== undefined ? Math.round(updates.targetCapBrl * 100) : this.protectionConfig.targetCapCents,
    };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_PROTECTION_KEY, JSON.stringify(this.protectionConfig));
      } catch (err) { silentCatchWarn("commission-engine", err); }
    }
    return { ...this.protectionConfig };
  }

  public getGoldProtectionConfig(): GoldPlanProtectionConfig {
    return { ...this.goldProtectionConfig };
  }

  public updateGoldProtectionConfig(updates: Partial<GoldPlanProtectionConfig>): GoldPlanProtectionConfig {
    this.goldProtectionConfig = {
      ...this.goldProtectionConfig,
      ...updates,
      thresholdMonthlyCents: updates.thresholdMonthlyBrl !== undefined
        ? Math.round(updates.thresholdMonthlyBrl * 100)
        : this.goldProtectionConfig.thresholdMonthlyCents,
    };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_GOLD_PROTECTION_KEY, JSON.stringify(this.goldProtectionConfig));
      } catch (err) { silentCatchWarn("commission-engine", err); }
    }
    return { ...this.goldProtectionConfig };
  }

  /**
   * Executa a apuração transparente da corrida
   */
  public calculateRideSplit(params: {
    rideId: string;
    driverId: string;
    grossFareBrl: number;
    plan?: DriverPlanFeeConfig | undefined;
    currentProtectionBalanceCents?: number | undefined;
    protectionConfig?: ProtectionFundConfig | undefined;
    monthlyAccumulatedGrossBrl?: number | undefined;
    goldProtectionConfig?: GoldPlanProtectionConfig | undefined;
  }): RideCommissionSettlement {
    const plan: DriverPlanFeeConfig = params.plan || STANDARD_DRIVER_PLANS.BRONZE;
    const protectionConfig = params.protectionConfig || this.protectionConfig;
    const goldConfig = params.goldProtectionConfig || this.goldProtectionConfig;
    const currentProtection = params.currentProtectionBalanceCents ?? 0;
    const monthlyAccCents = Math.round((params.monthlyAccumulatedGrossBrl ?? 0) * 100);

    const grossFareCents = Math.round(params.grossFareBrl * 100);

    // REGRA DE OURO PARTIU: 0% Take Rate por corrida (100% repassado ao motorista)
    const effectiveCommissionPercent = 0.0;
    const platformCommissionCents = 0;
    const platformCommissionBrl = 0.0;

    // Fundo de proteção operacional descontinuado no modelo SaaS puro
    const protectionFundContributionCents = 0;
    const protectionFundContributionBrl = 0.0;

    // Dedução total da plataforma é estritamente zero
    const totalPlatformDeductionCents = 0;
    const totalPlatformDeductionBrl = 0.0;

    // 100% do ganho bruto pertence ao condutor parceiro
    const driverNetEarningsCents = grossFareCents;
    const driverNetEarningsBrl = Number((grossFareCents / 100).toFixed(2));

    // Invariante Contábil Inegociável: Bruto === Líquido + Dedução Total
    if (driverNetEarningsCents + totalPlatformDeductionCents !== grossFareCents) {
      throw new Error(
        `INVARIANTE_VIOLADA: Split contábil divergente (Bruto: ${grossFareCents}, Líquido: ${driverNetEarningsCents}, Dedução: ${totalPlatformDeductionCents})`
      );
    }

    // Benchmark de Mercado: Mostra exatamente o quanto o motorista economizou vs Uber/99 (20%)
    const competitorTakeRatePercent = 20.0;
    const competitorTakeRateCents = Math.round(grossFareCents * (competitorTakeRatePercent / 100));
    const savingsVersusCompetitorCents = competitorTakeRateCents;

    return {
      rideId: params.rideId,
      driverId: params.driverId,
      planId: plan.planId,
      planName: plan.planName,
      commissionPercent: effectiveCommissionPercent,
      grossFareBrl: grossFareCents / 100,
      grossFareCents,
      platformCommissionBrl,
      platformCommissionCents,
      protectionFundContributionBrl,
      protectionFundContributionCents,
      totalPlatformDeductionBrl,
      totalPlatformDeductionCents,
      driverNetEarningsBrl,
      driverNetEarningsCents,
      competitorBenchmarkTakeRatePercent: competitorTakeRatePercent,
      competitorTakeRateBrl: competitorTakeRateCents / 100,
      savingsVersusCompetitorBrl: savingsVersusCompetitorCents / 100,
      savingsVersusCompetitorCents,
      timestamp: Date.now(),
    };
  }

  /**
   * FASE 1: SIMULADOR INTERNO DE ECONOMIA & SUSTENTABILIDADE DE PLATAFORMA (MODELO SAAS PURO)
   */
  public simulatePlatformEconomics(input: EconomicSimulatorInput): EconomicSimulatorOutput {
    const {
      activeDriversCount,
      avgTripsPerDriverPerMonth,
      avgGrossFareBrl,
      distribution,
      serverCostPerTripBrl = 0.08,
      supportCostPerDriverBrl = 4.50,
      paymentGatewayPixPercent = 0.3,
    } = input;

    const totalMonthlyTrips = activeDriversCount * avgTripsPerDriverPerMonth;
    const totalMarketplaceGMVBrl = totalMonthlyTrips * avgGrossFareBrl;

    // Motoristas por plano
    const freeDrivers = Math.round(activeDriversCount * (distribution.freePercent / 100));
    const bronzeDrivers = Math.round(activeDriversCount * (distribution.bronzePercent / 100));
    const silverDrivers = Math.round(activeDriversCount * (distribution.silverPercent / 100));
    const goldDrivers = Math.round(activeDriversCount * (distribution.goldPercent / 100));

    // Receita de Assinaturas SaaS (MRR)
    const saasSubscriptionRevenueBrl =
      (bronzeDrivers * STANDARD_DRIVER_PLANS.BRONZE.monthlyFeeBrl) +
      (silverDrivers * STANDARD_DRIVER_PLANS.PRATA.monthlyFeeBrl) +
      (goldDrivers * STANDARD_DRIVER_PLANS.OURO.monthlyFeeBrl);

    // No modelo de mensalidade pura (0% Take Rate), a comissão variável é ZERO
    const takeRateCommissionsRevenueBrl = 0.0;
    const grossPlatformRevenueBrl = saasSubscriptionRevenueBrl;

    // Custos operacionais
    const serverHostingCost = totalMonthlyTrips * serverCostPerTripBrl;
    const supportCost = activeDriversCount * supportCostPerDriverBrl;
    const gatewayPixCost = totalMarketplaceGMVBrl * (paymentGatewayPixPercent / 100);
    const totalOperationalCostBrl = serverHostingCost + supportCost + gatewayPixCost;

    const netPlatformProfitBrl = grossPlatformRevenueBrl - totalOperationalCostBrl;
    const netMarginPercent = grossPlatformRevenueBrl > 0 ? (netPlatformProfitBrl / grossPlatformRevenueBrl) * 100 : 0;
    const effectiveTakeRatePercent = totalMarketplaceGMVBrl > 0 ? (grossPlatformRevenueBrl / totalMarketplaceGMVBrl) * 100 : 0;

    // Economia do motorista comparado à Uber (20%)
    const competitorTakeRate20 = totalMarketplaceGMVBrl * 0.20;
    const totalDriverEarningsBrl = totalMarketplaceGMVBrl - grossPlatformRevenueBrl;
    const totalDriverSavingsVsUber20Brl = Math.max(0, competitorTakeRate20 - grossPlatformRevenueBrl);

    // Breakeven & CAC / LTV
    const fixedMonthlyOverheadBrl = 3500.00;
    const avgRevenuePerDriverBrl = activeDriversCount > 0 ? grossPlatformRevenueBrl / activeDriversCount : 0;
    const avgCostPerDriverBrl = activeDriversCount > 0 ? totalOperationalCostBrl / activeDriversCount : 0;
    const marginPerDriverBrl = Math.max(1, avgRevenuePerDriverBrl - avgCostPerDriverBrl);
    const breakevenDriversCount = Math.ceil(fixedMonthlyOverheadBrl / marginPerDriverBrl);

    const cacEstimatedBrl = 45.00;
    const avgDriverLifespanMonths = 14;
    const ltvEstimatedBrl = marginPerDriverBrl * avgDriverLifespanMonths;
    const ltvCacRatio = cacEstimatedBrl > 0 ? Number((ltvEstimatedBrl / cacEstimatedBrl).toFixed(1)) : 0;

    return {
      totalMonthlyTrips,
      totalMarketplaceGMVBrl,
      saasSubscriptionRevenueBrl: Number(saasSubscriptionRevenueBrl.toFixed(2)),
      takeRateCommissionsRevenueBrl: Number(takeRateCommissionsRevenueBrl.toFixed(2)),
      grossPlatformRevenueBrl: Number(grossPlatformRevenueBrl.toFixed(2)),
      totalOperationalCostBrl: Number(totalOperationalCostBrl.toFixed(2)),
      netPlatformProfitBrl: Number(netPlatformProfitBrl.toFixed(2)),
      netMarginPercent: Number(netMarginPercent.toFixed(1)),
      effectiveTakeRatePercent: Number(effectiveTakeRatePercent.toFixed(2)),
      totalDriverEarningsBrl: Number(totalDriverEarningsBrl.toFixed(2)),
      totalDriverSavingsVsUber20Brl: Number(totalDriverSavingsVsUber20Brl.toFixed(2)),
      breakevenDriversCount,
      cacEstimatedBrl,
      ltvEstimatedBrl: Number(ltvEstimatedBrl.toFixed(2)),
      ltvCacRatio,
    };
  }
}

export const commissionEngine = CommissionEngine.getInstance();
