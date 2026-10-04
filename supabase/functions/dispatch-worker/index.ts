// ==============================================================================
// 🚀 SUPABASE EDGE FUNCTION: dispatch-worker (PARTIU DISPATCH WORKER ENGINE)
// ==============================================================================
// Worker server-side durável para varredura e avanço autônomo de ondas expiradas.
// Executa com SKIP LOCKED para suportar concorrência de múltiplos schedulers.
// Zero dependência do ciclo de vida ou conectividade do aplicativo do passageiro.
// ==============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // ── AUTH GUARD: Exige cron secret ou service role key ─────────────────
    // Este worker é invocado exclusivamente por cron interno ou scheduler.
    // Requisições externas sem credencial válida são rejeitadas.
    const cronSecret = Deno.env.get("DISPATCH_CRON_SECRET") || Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization") || "";
    const apikeyHeader = req.headers.get("apikey") || "";

    let isAuthorized = false;

    // Aceita service_role_key (invocação via Supabase Dashboard / CLI)
    if (supabaseServiceKey && (authHeader === `Bearer ${supabaseServiceKey}` || apikeyHeader === supabaseServiceKey)) {
      isAuthorized = true;
    }

    // Aceita cron secret dedicado (invocação via cron HTTP externo)
    if (!isAuthorized && cronSecret && (authHeader === `Bearer ${cronSecret}` || req.headers.get("x-cron-secret") === cronSecret)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ success: false, error: "Acesso negado. Este endpoint requer credencial de cron ou service role." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ── FIM AUTH GUARD ────────────────────────────────────────────────────

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let batchSize = 25;
    let timeoutSeconds = 15;

    try {
      const body = await req.json();
      if (body.batchSize) batchSize = Number(body.batchSize) || 25;
      if (body.timeoutSeconds) timeoutSeconds = Number(body.timeoutSeconds) || 15;
    } catch (_) {
      // Permite requisições GET ou sem corpo (para invocação por cron HTTP puro)
    }

    // Executa a varredura atômica e serializada via PostgreSQL
    const { data: sweepResult, error: sweepError } = await supabase.rpc(
      "dispatch_sweep_and_advance_expired_waves",
      {
        p_batch_size: batchSize,
        p_timeout_seconds: timeoutSeconds,
      }
    );

    if (sweepError) {
      console.error("[dispatch-worker] Erro ao executar varredura de ondas:", sweepError);
      return new Response(
        JSON.stringify({
          success: false,
          error: sweepError.message,
          latencyMs: Date.now() - startTime,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const latencyMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: sweepResult,
        latencyMs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[dispatch-worker] Exceção crítica:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Erro interno do worker de despacho",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
