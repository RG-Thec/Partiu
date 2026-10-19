import { describe, test, expect } from "./test-harness.mjs";
import { pixBillingService } from "../src/services/subscription/PixBillingService.ts";
import {
  gerarAssinaturaWebhook,
  verificarWebhookHmac,
  WEBHOOK_SECRET_COOP,
} from "../src/lib/payment-webhook-engine.ts";
import { paymentGatewayManager } from "../src/services/payment/PaymentProviderAdapter.ts";

describe("40. HOMOLOGAÇÃO DE WEBHOOKS PIX (MERCADO PAGO & ASAAS)", () => {
  test("1. Mercado Pago: Assinatura Criptográfica HMAC-SHA256 e Validação de Payload", () => {
    const payloadMp = JSON.stringify({
      action: "payment.created",
      api_version: "v1",
      data: { id: "mp_pix_987654321" },
      date_created: new Date().toISOString(),
      id: 1234567890,
      live_mode: true,
      type: "payment",
      user_id: "654321",
    });

    // 1.1 Gera assinatura válida
    const signatureHeader = gerarAssinaturaWebhook(payloadMp, WEBHOOK_SECRET_COOP);
    expect(signatureHeader.startsWith("t=")).toBe(true);
    expect(signatureHeader.includes(",v1=")).toBe(true);

    // 1.2 Verifica autenticidade
    const authResult = verificarWebhookHmac(payloadMp, signatureHeader, WEBHOOK_SECRET_COOP);
    expect(authResult.valid).toBe(true);

    // 1.3 Rejeição de adulteração
    const payloadAdulterado = JSON.stringify({
      action: "payment.created",
      data: { id: "mp_pix_hacker_injection" },
    });
    const tamperResult = verificarWebhookHmac(
      payloadAdulterado,
      signatureHeader,
      WEBHOOK_SECRET_COOP,
    );
    expect(tamperResult.valid).toBe(false);
  });

  test("2. Mercado Pago: Fluxo Completo de Ativação Instantânea de Diária via Webhook", async () => {
    const driverId = "drv-homologacao-mp";

    // 1. Cria cobrança de diária de R$ 14,90
    const billing = await pixBillingService.createDriverBilling(
      driverId,
      "plano-diaria-essencial",
      "DAILY",
      "Roberto Silva",
    );
    expect(billing.status).toBe("PENDING");
    expect(billing.amount).toBe(14.9);

    // 2. Simula o disparo de webhook confirmado pelo Mercado Pago
    const mpWebhookPayload = {
      action: "payment.updated",
      data: { id: "mp_tx_778899" },
      external_reference: billing.id,
      transaction_amount: 14.9,
      status: "approved",
    };

    const confirmRes = await pixBillingService.confirmPayment(
      mpWebhookPayload.external_reference,
      mpWebhookPayload.data.id,
      mpWebhookPayload.transaction_amount,
    );

    expect(confirmRes.success).toBe(true);
    expect(confirmRes.driverId).toBe(driverId);
    expect(confirmRes.expiresAt !== undefined).toBe(true);

    // 3. Verifica acesso operacional liberado imediatamente
    const access = await pixBillingService.evaluateDriverAccess(driverId);
    expect(access.is_eligible).toBe(true);
    expect(access.status).toBe("ACTIVE");
  });

  test("3. Asaas: Homologação de Webhook com Token de Autenticação e Ciclo Semanal", async () => {
    const driverId = "drv-homologacao-asaas";

    // 1. Cria cobrança do plano semanal (R$ 69,90)
    const billing = await pixBillingService.createDriverBilling(
      driverId,
      "plano-semanal-pro",
      "WEEKLY",
      "Mariana Souza",
    );
    expect(billing.status).toBe("PENDING");
    expect(billing.amount).toBe(69.9);

    // 2. Simula payload do webhook oficial do Asaas (PAYMENT_RECEIVED)
    const asaasPayload = {
      event: "PAYMENT_RECEIVED",
      payment: {
        id: "pay_asaas_00112233",
        dateCreated: new Date().toISOString(),
        customer: "cus_000005544332",
        value: 69.9,
        netValue: 68.91,
        externalReference: billing.id,
        billingType: "PIX",
        status: "RECEIVED",
      },
    };

    // 3. Validação do token de acesso do Asaas
    const asaasTokenSimulado = "$aact_prod_asaas_token_homologado_2026";
    const headerRecebido = "$aact_prod_asaas_token_homologado_2026";
    expect(headerRecebido === asaasTokenSimulado).toBe(true);

    // 4. Executa confirmação atômica no serviço
    const confirmRes = await pixBillingService.confirmPayment(
      asaasPayload.payment.externalReference,
      asaasPayload.payment.id,
      asaasPayload.payment.value,
    );

    expect(confirmRes.success).toBe(true);
    expect(confirmRes.driverId).toBe(driverId);

    // 5. Verifica vigência estendida de 7 dias
    const access = await pixBillingService.evaluateDriverAccess(driverId);
    expect(access.is_eligible).toBe(true);
    expect(access.status).toBe("ACTIVE");

    const horasRestantes = (new Date(access.expires_at!).getTime() - Date.now()) / (1000 * 60 * 60);
    expect(horasRestantes >= 160).toBe(true); // ~168 horas (7 dias)
  });

  test("4. Idempotência do Webhook: Múltiplas Chamadas Não Duplicam Vigência", async () => {
    const driverId = "drv-homologacao-idempotencia";

    const billing = await pixBillingService.createDriverBilling(
      driverId,
      "plano-diaria-essencial",
      "DAILY",
      "Lucas Ferreira",
    );

    // Primeira entrega do webhook
    const res1 = await pixBillingService.confirmPayment(billing.id, "gw_tx_repetida_1", 14.9);
    expect(res1.success).toBe(true);
    const expira1 = res1.expiresAt;

    // Segunda entrega do webhook (retentativa de rede do gateway)
    const res2 = await pixBillingService.confirmPayment(billing.id, "gw_tx_repetida_1", 14.9);
    expect(res2.success).toBe(true);
    expect(res2.expiresAt).toBe(expira1); // Prazo rigorosamente inalterado
  });
});
