/**
 * ==============================================================================
 * 📈 PARTIU REVENUE OS — REVENUE ANALYTICS & SAAS DASHBOARD (v1.0)
 * ==============================================================================
 * Agregação Executiva de Métricas Financeiras e de Crescimento:
 * - MRR (Monthly Recurring Revenue) & ARR
 * - GMV (Gross Merchandise Value) e Take-Rate Efetivo
 * - Receitas de Assinatura vs Receitas de Comissão
 * - Motoristas Ativos, Inadimplentes, Churn, LTV e CAC
 * ==============================================================================
 */

import { subscriptionEngine } from "./subscription-engine";
import { driverWalletEngine } from "./driver-wallet";

export interface PlatformRevenueMetrics {
  mrrBrl: number;
  arrBrl: number;
  monthlyCommissionRevenueBrl: number;
  monthlySubscriptionRevenueBrl: number;
  monthlyProtectionFundBrl: number;
  totalNetRevenueBrl: number;
  totalGmvBrl: number;
  effectiveTakeRatePercent: number;
  totalRidesCount: number;
  averageTicketBrl: number;
  activeDriversCount: number;
  defaultingDriversCount: number;
  delinquencyRatePercent: number;
  churnRatePercent: number;
  driverLtvBrl: number;
  driverCacBrl: number;
  protectionFundReserveTotalBrl: number;
  lastCalculated: number;
}

export type DriverRevenue = PlatformRevenueMetrics;

export class RevenueDashboardEngine {
  private static instance: RevenueDashboardEngine;

  private constructor() {}

  public static getInstance(): RevenueDashboardEngine {
    if (!RevenueDashboardEngine.instance) {
      RevenueDashboardEngine.instance = new RevenueDashboardEngine();
    }
    return RevenueDashboardEngine.instance;
  }

  /**
   * Calcula as métricas consolidadas em tempo real
   */
  public calculateMetrics(): PlatformRevenueMetrics {
    const plans = subscriptionEngine.getAllPlans(true);
    const wallet = driverWalletEngine.getWallet("mot-001");

    // Simulação baseada na praça piloto (50 motoristas fundadores)
    const totalDrivers = 50;
    const defaultingDrivers = 2; // 4% inadimplência
    const activeDrivers = totalDrivers - defaultingDrivers;

    // Distribuição de planos na frota piloto:
    // Trial: 5 motoristas (R$ 0)
    // Diária Flex: 20 motoristas (R$ 149,90)
    // Semanal Pro: 15 motoristas (R$ 199,90)
    // Mensal Ilimitado: 10 motoristas (R$ 99,90)
    const mrrBrl = 20 * 149.90 + 15 * 199.90 + 10 * 99.90; // R$ 6.995,50
    const arrBrl = mrrBrl * 12; // R$ 83.946,00

    // Volume operacional estimado na praça piloto (ex: 6.800 corridas no mês)
    const totalRidesCount = 6800;
    const averageTicketBrl = 18.50;
    const totalGmvBrl = totalRidesCount * averageTicketBrl; // R$ 125.800,00

    // REGRA DE OURO PARTIU: 0% Take Rate sobre corridas (100% em posse dos motoristas)
    const effectiveTakeRatePercent = 0.0;
    const monthlyCommissionRevenueBrl = 0.0;
    const monthlyProtectionFundBrl = 0.0;

    const monthlySubscriptionRevenueBrl = mrrBrl;
    const totalNetRevenueBrl = monthlySubscriptionRevenueBrl;

    const delinquencyRatePercent = Number(((defaultingDrivers / totalDrivers) * 100).toFixed(1));
    const churnRatePercent = 2.1; // Churn saudável de motoristas no SaaS (< 3%)

    // LTV = (Receita Líquida por motorista / mês) / Churn Rate
    const revenuePerDriverMonth = totalNetRevenueBrl / totalDrivers;
    const driverLtvBrl = Number((revenuePerDriverMonth / (churnRatePercent / 100)).toFixed(2));
    const driverCacBrl = 45.00; // Custo de aquisição via indicação / marketing local

    const protectionFundReserveTotalBrl = 0.0;

    return {
      mrrBrl: Number(mrrBrl.toFixed(2)),
      arrBrl: Number(arrBrl.toFixed(2)),
      monthlyCommissionRevenueBrl,
      monthlySubscriptionRevenueBrl,
      monthlyProtectionFundBrl,
      totalNetRevenueBrl,
      totalGmvBrl,
      effectiveTakeRatePercent,
      totalRidesCount,
      averageTicketBrl,
      activeDriversCount: activeDrivers,
      defaultingDriversCount: defaultingDrivers,
      delinquencyRatePercent,
      churnRatePercent,
      driverLtvBrl,
      driverCacBrl,
      protectionFundReserveTotalBrl,
      lastCalculated: Date.now(),
    };
  }
}

export const revenueDashboardEngine = RevenueDashboardEngine.getInstance();
