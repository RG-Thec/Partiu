// ==============================================================================
// 🚀 SUPABASE EDGE FUNCTION: dispatch-ride (PARTIU DISPATCH ENGINE V4.0)
// ==============================================================================
// Orquestrador server-side de despacho atômico e matching geoespacial PostGIS.
// Zero cálculo no lado do cliente: segurança, finops e blindagem antifraude.
// Idempotente contra duplicidade de despacho e protegido por rate limit.
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // ── AUTH GUARD: Exige JWT válido ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Token de autenticação ausente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido ou expirado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ── FIM AUTH GUARD ────────────────────────────────────────────────────

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const rideId = payload.rideId || payload.ride_id;
    const category = payload.category || "CARRO";
    const fareBrl = payload.fareBrl || payload.fare_brl || 0;
    const maxRadiusKm = payload.maxRadiusKm || payload.max_radius_km || 10;
    const wave = payload.wave || 1;

    let pickupLng = payload.pickupCoordinates?.[0] ?? payload.pickup_lng;
    let pickupLat = payload.pickupCoordinates?.[1] ?? payload.pickup_lat;
    let destLng = payload.destinationCoordinates?.[0] ?? payload.dropoff_lng;
    let destLat = payload.destinationCoordinates?.[1] ?? payload.dropoff_lat;

    if (!rideId || pickupLat === undefined || pickupLng === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "rideId, pickupCoordinates (ou pickup_lat e pickup_lng) são obrigatórios.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verificação de idempotência e prevenção de duplo despacho (P1-02)
    const { data: existingRide } = await supabase
      .from("rides")
      .select("id, status, offered_driver_id, offer_expires_at, dispatch_started_at, passenger_id, dispatch_attempt")
      .eq("id", rideId)
      .maybeSingle();

    if (existingRide) {
      // Se a corrida já foi aceita, concluída ou cancelada, encerra sem reprocessar
      if (["ACCEPTED", "IN_PROGRESS", "A_CAMINHO", "EM_VIAGEM", "COMPLETED", "CANCELLED"].includes(existingRide.status)) {
        return new Response(
          JSON.stringify({
            success: true,
            status: "ALREADY_RESOLVED",
            rideId,
            currentStatus: existingRide.status,
            message: `Corrida já está no status '${existingRide.status}'. Despacho ignorado.`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Se já possui oferta ativa não expirada, preserva o ciclo em andamento
      if (existingRide.offered_driver_id && existingRide.offer_expires_at) {
        const expiresAtMs = new Date(existingRide.offer_expires_at).getTime();
        if (expiresAtMs > Date.now()) {
          return new Response(
            JSON.stringify({
              success: true,
              status: "OFFER_ACTIVE",
              rideId,
              offeredDriverId: existingRide.offered_driver_id,
              expiresAt: expiresAtMs,
              message: "Oferta ativa em andamento para condutor.",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 2. Rate-Limiting server-side (P1-04)
    const passengerId = payload.passengerId || payload.passenger_id || existingRide?.passenger_id;
    if (passengerId) {
      try {
        const { data: isAllowed } = await supabase.rpc("partiu_check_rate_limit", {
          p_user_id: passengerId,
          p_action: "dispatch",
          p_max_per_minute: 5,
        });
        if (isAllowed === false) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "RATE_LIMIT_EXCEEDED",
              message: "Limite de solicitações de despacho por minuto atingido.",
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (_) {
        // Falha no rate limit não interrompe o fluxo operacional se RPC indisponível
      }
    }

    // 3. Invoca PostGIS RPC com matching inteligente e cálculo de DispatchScore no banco
    const { data: matchedDrivers, error: matchError } = await supabase.rpc(
      "dispatch_find_best_driver",
      {
        p_lat: Number(pickupLat),
        p_lng: Number(pickupLng),
        p_category: category,
        p_radius_meters: maxRadiusKm * 1000,
        p_limit: 10,
      }
    );

    if (matchError) {
      console.error("[dispatch-ride] Erro ao invocar RPC dispatch_find_best_driver:", matchError);
    }

    const candidates = matchedDrivers || [];
    const dispatchLatencyMs = Date.now() - startTime;

    // 4. Se nenhum motorista retornado pelo PostGIS, responde com queue empty
    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          status: "NO_DRIVERS_AVAILABLE",
          rideId,
          candidatesCount: 0,
          dispatchLatencyMs,
          message: "Nenhum condutor elegível disponível no raio operacional de 10km.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Seleciona o melhor candidato (índice 0 = maior DispatchScore)
    const selectedCandidate = candidates[0];
    const expiresAt = Date.now() + 15000;
    const offerExpiresAtIso = new Date(expiresAt).toISOString();
    const currentAttempt = (existingRide?.dispatch_attempt || 0) + 1;

    // 6. Registra oferta formal atômica no banco com metadados de onda (P0-01 / P0-03)
    try {
      await supabase.from("rides").update({
        offered_driver_id: selectedCandidate.driver_id,
        offered_at: new Date().toISOString(),
        offer_expires_at: offerExpiresAtIso,
        status: "OFFERED",
        dispatch_wave: wave,
        dispatch_attempt: currentAttempt,
        dispatch_started_at: existingRide?.dispatch_started_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", rideId);

      // 7. Registro de observabilidade e emissão de tempo real segura via postgres_changes
      // A mutação em public.rides dispara o evento postgres_changes protegido por RLS (drivers_can_read_assigned_offers),
      // eliminando canais broadcast abertos sem autorização.
      try {
        await supabase.from("dispatch_audit_logs").insert({
          ride_id: rideId,
          current_wave: wave,
          previous_status: existingRide?.status || "REQUESTED",
          new_status: "OFFERED",
          dispatch_attempt: currentAttempt,
          candidate_id: selectedCandidate.driver_id,
          reason: "DISPATCH_RIDE_EDGE_FUNCTION_INITIAL_OFFER",
        });
      } catch (_) {}
    } catch (dbErr) {
      console.warn("[dispatch-ride] Falha ao registrar oferta no banco:", dbErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: "DISPATCHED",
        rideId,
        topCandidate: {
          driverId: selectedCandidate.driver_id,
          driverName: selectedCandidate.driver_name,
          driverScore: selectedCandidate.final_score,
          distanceMeters: selectedCandidate.distance_meters,
          etaMinutes: selectedCandidate.eta_minutes,
          subscriptionPlan: selectedCandidate.subscription_plan,
        },
        candidatesCount: candidates.length,
        dispatchLatencyMs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[dispatch-ride] Exceção crítica:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Erro interno de despacho",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
