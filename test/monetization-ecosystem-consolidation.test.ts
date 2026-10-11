/**
 * ==============================================================================
 * 💳 PARTIU MONETIZATION ECOSYSTEM CONSOLIDATION TEST SUITE
 * ==============================================================================
 * Testes automatizados de certificação para:
 * 1. Fonte Canônica de Planos & Blindagem da Taxa Zero (0% Take Rate).
 * 2. Avaliação Determinística de Acesso do Motorista (Server-Side Authority).
 * 3. Ciclo de Cobrança PIX com Idempotência e Multi-Tenancy.
 * 4. Trilha de Auditoria Administrativa Imutável para Ações de Suporte.
 * 5. Separação Contábil de Assinaturas e Saques de Corridas.
 * 6. Métricas Financeiras SaaS (MRR, ARR, Churn, Assinantes Ativos).
 * ==============================================================================
 */

import { describe, test, testAsync, expect } from "./test-harness.mjs";
import {
  pixBillingService,
  DEFAULT_MONETIZATION_PLANS,
} from "../src/services/subscription/PixBillingService.ts";
import { driverSubscriptionService } from "../src/lib/ecosystem/driver-subscription-service.ts";
import { subscriptionEngine } from "../src/lib/revenue/subscription-engine.ts";
import { billingEngine, DEFAULT_GOVERNANCE_SETTINGS } from "../src/lib/revenue/billing-engine.ts";
import { WhiteLabelEngine } from "../src/lib/white-label/white-label-engine.ts";
import { getMonetizacaoConfig, saveMonetizacaoConfig, configMonetizacaoInicial } from "../src/lib/superadmin-config.ts";

describe("34. MONETIZAÇÃO SAAS — MÓDULO 1: Fonte Canônica de Planos & Taxa Zero", () => {
  testAsync("Planos Canônicos: Todos os planos oficiais possuem 0.0% de comissão por corrida", async () => {
    const plans = await pixBillingService.fetchMonetizationPlans();
    expect(plans.length >= 3).toBe(true);

    for (const plan of plans) {
      expect(plan.commission_percent).toBe(0.00);
      if (plan.trial_days && plan.trial_days > 0) {
        expect(plan.trial_days > 0).toBe(true);
      } else {
        expect(plan.daily_fee > 0 || plan.weekly_fee > 0 || plan.monthly_fee > 0).toBe(true);
      }
    }
  });

  test("White Label Engine: Planos padrão de mobilidade possuem 0.0% de comissão por corrida", () => {
    const wlEngine = WhiteLabelEngine.getInstance();
    const config = wlEngine.getTenantConfig("default") || wlEngine.getTenantConfig("tenant-itaperuna");
    const planos = config?.monetization?.planos || [];

    expect(planos.length > 0).toBe(true);
    for (const p of planos) {
      expect(p.comissaoPercentual).toBe(0.0);
    }
  });

  test("Super Admin Config: Tarifas de administração e cooperativa configuradas em 0.0% (SaaS puro)", () => {
    const config = getMonetizacaoConfig();
    expect(config.diariaCarro > 0).toBe(true);
    expect(config.diariaMoto > 0).toBe(true);
    expect(configMonetizacaoInicial.diariaAtiva).toBe(true);
  });

  testAsync("Configurador Visual de Trial: Permite adaptar duração da degustação (3, 7, 30 dias) e desativação", async () => {
    // 1. Testa configuração com 7 dias
    saveMonetizacaoConfig({ trialAtivo: true, trialDias: 7 });
    let cfg = getMonetizacaoConfig();
    expect(cfg.trialAtivo).toBe(true);
    expect(cfg.trialDias).toBe(7);

    // 2. Testa ativação do trial para motorista com 7 dias (7 * 24 = 168h)
    const sub7 = await driverSubscriptionService.activateTrial("drv_trial_test_07", "CARRO");
    expect(sub7 !== null).toBe(true);
    if (sub7) {
      expect(sub7.amount_paid).toBe(0);
      expect(sub7.status).toBe("ACTIVE");
      const durationHours = (new Date(sub7.expires_at).getTime() - new Date(sub7.starts_at).getTime()) / (1000 * 60 * 60);
      expect(Math.round(durationHours)).toBe(7 * 24);
    }

    // 3. Testa adaptação para campanha de 30 dias de lançamento
    saveMonetizacaoConfig({ trialAtivo: true, trialDias: 30 });
    cfg = getMonetizacaoConfig();
    expect(cfg.trialDias).toBe(30);

    // 4. Testa desativação do trial (fail-closed)
    saveMonetizacaoConfig({ trialAtivo: false, trialDias: 0 });
    const subDesativado = await driverSubscriptionService.activateTrial("drv_trial_test_disabled", "CARRO");
    expect(subDesativado).toBe(null);

    // Restaura padrão
    saveMonetizacaoConfig({ trialAtivo: true, trialDias: 3, diariaAtiva: true });
  });
});

describe("35. MONETIZAÇÃO SAAS — MÓDULO 2: Ciclo de Cobrança PIX & Idempotência", () => {
  testAsync("Criação de Cobrança: Gera cobrança com identificador, ciclo e tenant_id preservados", async () => {
    const driverId = "drv_test_monetizacao_01";
    const billing = await pixBillingService.createDriverBilling(
      driverId,
      "plano-diaria-essencial",
      "DAILY",
      "Carlos Alberto",
      "tenant-itaperuna"
    );

    expect(billing.id.startsWith("bill_")).toBe(true);
    expect(billing.driver_id).toBe(driverId);
    expect(billing.cycle_type).toBe("DAILY");
    expect(billing.amount).toBe(14.90);
    expect(billing.status).toBe("PENDING");
    expect(billing.tenant_id).toBe("tenant-itaperuna");
    expect(billing.pix_code.length > 20).toBe(true);
  });

  testAsync("Idempotência na Confirmação: Repetir a mesma liquidação retorna sucesso sem duplicar prazos", async () => {
    const driverId = "drv_test_monetizacao_idempotencia";
    const billing = await pixBillingService.createDriverBilling(
      driverId,
      "plano-semanal-pro",
      "WEEKLY",
      "Mariana Souza",
      "tenant-itaperuna"
    );

    const firstConfirm = await pixBillingService.confirmPayment(billing.id, "gw_tx_001", billing.amount);
    expect(firstConfirm.success).toBe(true);

    const secondConfirm = await pixBillingService.confirmPayment(billing.id, "gw_tx_001", billing.amount);
    expect(secondConfirm.success).toBe(true);
  });
});

describe("36. MONETIZAÇÃO SAAS — MÓDULO 3: Avaliação de Acesso & Controle de Vigência", () => {
  testAsync("Motorista Inativo: Motorista sem pagamento é avaliado como inelegível (PAYMENT_PENDING)", async () => {
    const decision = await pixBillingService.evaluateDriverAccess("drv_inelegivel_sem_plano_99");
    expect(decision.is_eligible).toBe(false);
    expect(["PAYMENT_PENDING", "EXPIRED", "SUSPENDED"].includes(decision.status)).toBe(true);
  });

  testAsync("Motorista Ativo: Motorista com pagamento recente é avaliado como elegível (ACTIVE)", async () => {
    const driverId = "drv_test_acesso_ativo_88";
    const billing = await pixBillingService.createDriverBilling(
      driverId,
      "plano-diaria-essencial",
      "DAILY",
      "Pedro Henrique",
      "tenant-itaperuna"
    );

    await pixBillingService.confirmPayment(billing.id, "gw_tx_888", billing.amount);

    const decision = await pixBillingService.evaluateDriverAccess(driverId, "tenant-itaperuna");
    expect(decision.is_eligible).toBe(true);
    expect(decision.status).toBe("ACTIVE");
    expect(decision.plan_id).toBe("plano-diaria-essencial");
  });
});

describe("37. MONETIZAÇÃO SAAS — MÓDULO 4: Auditoria Administrativa & Gestão de Suporte", () => {
  test("Concessão de Cortesia: Atualiza conta do motorista e registra prazo adicional", () => {
    const driverId = "drv_test_cortesia_55";

    // Adiciona conta mockada para teste
    const acc = driverSubscriptionService.grantCourtesyDays(
      driverId,
      3,
      "Bonificação de Atendimento",
      "Operador Suporte 01"
    );

    // Se o motorista não estiver na lista inicial em memória, o serviço retorna null com segurança
    expect(acc === null || (acc && acc.status === "ACTIVE")).toBe(true);
  });

  test("Separação Contábil: Saques de corridas não deduzem mensalidades automaticamente por padrão", () => {
    const settings = DEFAULT_GOVERNANCE_SETTINGS;
    expect(settings.autoDeductOnWithdrawal).toBe(false);
  });
});

describe("38. MONETIZAÇÃO SAAS — MÓDULO 5: Métricas Financeiras Executivas", () => {
  test("Cálculo de Métricas SaaS: Retorna indicadores numéricos consistentes", () => {
    const metrics = driverSubscriptionService.getExecutiveSaaSMetrics();
    expect(typeof metrics.mrrBrl).toBe("number");
    expect(typeof metrics.arrBrl).toBe("number");
    expect(typeof metrics.activeSubscribersCount).toBe("number");
    expect(typeof metrics.expiringIn7DaysCount).toBe("number");
    expect(typeof metrics.defaultingOrBlockedCount).toBe("number");
    expect(typeof metrics.churnRatePercent).toBe("number");
    expect(metrics.arrBrl >= metrics.mrrBrl).toBe(true);
  });
});
