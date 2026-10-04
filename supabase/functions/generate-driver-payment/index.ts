// ==============================================================================
// 🚀 SUPABASE EDGE FUNCTION: generate-driver-payment (PARTIU DRIVER ACCESS ENGINE V4)
// ==============================================================================
// Geração segura server-side de cobrança PIX para acesso operacional de condutores.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // ── AUTH GUARD: Exige JWT válido ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação ausente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ── FIM AUTH GUARD ────────────────────────────────────────────────────

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { driver_id, plan_id, cycle_type = "DAILY" } = await req.json();

    if (!driver_id || !plan_id) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios: driver_id e plan_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Busca plano no banco de dados
    const { data: plan, error: planErr } = await supabaseClient
      .from("monetization_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planErr || !plan) {
      return new Response(
        JSON.stringify({ error: "Plano de monetização não localizado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = cycle_type === "MONTHLY"
      ? Number(plan.monthly_fee)
      : cycle_type === "WEEKLY"
      ? Number(plan.weekly_fee)
      : Number(plan.daily_fee);

    const billingId = `bill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

    // 2. Consulta configurações ativas cadastradas pelo Painel Admin
    const { data: appSettings } = await supabaseClient
      .from("app_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    const { data: driverProfile } = await supabaseClient
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", driver_id)
      .maybeSingle();

    const payerEmail = driverProfile?.email || "financeiro@partiumobilidade.com.br";
    const payerFullName = driverProfile?.full_name || "Motorista Parceiro";
    const [payerFirstName, ...payerLastNameParts] = payerFullName.split(" ");
    const payerLastName = payerLastNameParts.join(" ") || "Parceiro";

    // Credenciais Mercado Pago (prioriza o que o admin configurou na tabela app_settings)
    const mpAccessToken =
      appSettings?.mercadopago_access_token ||
      Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ||
      Deno.env.get("MP_ACCESS_TOKEN");

    let copiaECola = "";
    let qrCodeUrl = "";
    let gatewayRef = `gw_${Date.now()}`;
    let gatewayUsed = "LOCAL_EMV";

    // 2.1 Integração Primária: Mercado Pago Oficial (PIX API v1)
    if (mpAccessToken) {
      try {
        const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${mpAccessToken}`,
            "X-Idempotency-Key": billingId,
          },
          body: JSON.stringify({
            transaction_amount: amount,
            description: `Acesso Operacional PARTIU - Plano ${plan.name} (${cycle_type})`,
            payment_method_id: "pix",
            payer: {
              email: payerEmail,
              first_name: payerFirstName || "Motorista",
              last_name: payerLastName || "Parceiro",
            },
            external_reference: billingId,
          }),
        });

        if (mpRes.ok) {
          const mpData = await mpRes.json();
          gatewayRef = String(mpData.id);
          gatewayUsed = "MERCADO_PAGO";

          const pointOfInteraction = mpData.point_of_interaction?.transaction_data;
          if (pointOfInteraction?.qr_code) {
            copiaECola = pointOfInteraction.qr_code;
          }
          if (pointOfInteraction?.qr_code_base64) {
            qrCodeUrl = `data:image/png;base64,${pointOfInteraction.qr_code_base64}`;
          } else if (copiaECola) {
            try {
              qrCodeUrl = await QRCode.toDataURL(copiaECola, { width: 300, margin: 1 });
            } catch {
              qrCodeUrl = "";
            }
          }
        } else {
          const errText = await mpRes.text();
          console.warn("[generate-driver-payment] Mercado Pago retornou erro:", mpRes.status, errText);
        }
      } catch (mpErr) {
        console.warn("[generate-driver-payment] Exceção ao chamar Mercado Pago:", mpErr);
      }
    }

    // 2.2 Contingência: Gateway Asaas
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    const asaasBaseUrl = Deno.env.get("ASAAS_ENV") === "sandbox"
      ? "https://sandbox.asaas.com/v3"
      : "https://api.asaas.com/v3";

    if (!copiaECola && asaasApiKey) {
      try {
        const asaasRes = await fetch(`${asaasBaseUrl}/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "access_token": asaasApiKey,
          },
          body: JSON.stringify({
            billingType: "PIX",
            value: amount,
            dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            description: `Acesso Operacional PARTIU - Plano ${plan.name} (${cycle_type})`,
            externalReference: billingId,
          }),
        });

        if (asaasRes.ok) {
          const asaasData = await asaasRes.json();
          gatewayRef = asaasData.id;
          gatewayUsed = "ASAAS";

          const qrRes = await fetch(`${asaasBaseUrl}/payments/${asaasData.id}/pixQrCode`, {
            headers: { "access_token": asaasApiKey },
          });

          if (qrRes.ok) {
            const qrData = await qrRes.json();
            copiaECola = qrData.payload || "";
            qrCodeUrl = qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : "";
          }
        }
      } catch (asaasErr) {
        console.warn("[generate-driver-payment] Falha no gateway Asaas, acionando fallback EMV padrão:", asaasErr);
      }
    }

    // Fallback: Geração local do EMV padrão Banco Central caso Gateway não configurado
    if (!copiaECola) {
      const pixKey = Deno.env.get("PIX_DEFAULT_KEY") || "financeiro@partiumobilidade.com.br";
      const formattedAmount = amount.toFixed(2);
      const amountStr = `${formattedAmount.length.toString().padStart(2, "0")}${formattedAmount}`;
      const cleanKey = pixKey.trim();
      const keyLen = cleanKey.length.toString().padStart(2, "0");

      function calculateCRC16(payload: string): string {
        let crc = 0xFFFF;
        for (let i = 0; i < payload.length; i++) {
          crc ^= payload.charCodeAt(i) << 8;
          for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
              crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
              crc = (crc << 1) & 0xFFFF;
            }
          }
        }
        return crc.toString(16).toUpperCase().padStart(4, "0");
      }

      const rawPayloadSemCrc =
        `00020126580014BR.GOV.BCB.PIX01${keyLen}${cleanKey}520400005303986540${amountStr}5802BR` +
        `5918PARTIU TECNOLOGIA6005MACAE62070503${billingId.slice(-3)}6304`;
      const crc = calculateCRC16(rawPayloadSemCrc);
      copiaECola = `${rawPayloadSemCrc}${crc}`;
      try {
        qrCodeUrl = await QRCode.toDataURL(copiaECola, { width: 300, margin: 1 });
      } catch {
        qrCodeUrl = "";
      }
    }

    // 3. Persistência na tabela driver_billing
    const { error: insertErr } = await supabaseClient.from("driver_billing").insert({
      id: billingId,
      driver_id,
      plan_id,
      cycle_type,
      amount,
      gateway: gatewayUsed,
      gateway_reference: gatewayRef,
      pix_code: copiaECola,
      qr_code_url: qrCodeUrl,
      status: "PENDING",
      expires_at: expiresAt,
    });

    if (insertErr) {
      throw insertErr;
    }

    return new Response(
      JSON.stringify({
        success: true,
        billing_id: billingId,
        amount,
        pix_code: copiaECola,
        qr_code_url: qrCodeUrl,
        expires_at: expiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao processar cobrança PIX" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
