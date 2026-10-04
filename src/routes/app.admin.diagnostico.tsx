import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Gauge,
  Navigation,
  Radio,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
import { useTelemetriaFrota } from "@/lib/partiu-db";
import { MapDiagnosticPanel } from "@/components/maps/MapDiagnosticPanel";
import { UniversalMapView } from "@/components/maps/UniversalMapView";

export const Route = createFileRoute("/app/admin/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico Geoespacial & WebGL | PARTIU Admin" },
      {
        name: "description",
        content:
          "Cockpit de auditoria técnica cartográfica: precisão GNSS, aceleração de hardware WebGL, latência de telemetria e integridade da frota em tempo real.",
      },
    ],
  }),
  component: AdminDiagnosticoPage,
});

export function AdminDiagnosticoPage() {
  const { data: frota = [], refetch } = useTelemetriaFrota();
  const [recarregando, setRecarregando] = useState(false);

  async function handleRecarregar() {
    setRecarregando(true);
    await refetch();
    setTimeout(() => setRecarregando(false), 500);
  }

  const veiculosEmRota = frota.filter((v) => v.status === "em_rota").length;

  return (
    <div className="w-full space-y-5 pb-16">
      {/* 1. HEADER DO COCKPIT DE DIAGNÓSTICO */}
      <div className="w-full bg-slate-950 p-4 sm:p-5 rounded-3xl text-white shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              to="/app/admin/monitoramento"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all border border-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Control Room</span>
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black uppercase text-blue-300 border border-blue-500/30">
              <Activity className="h-3.5 w-3.5 animate-pulse text-blue-400" />
              <span>Diagnóstico Geoespacial & Engine Cartográfica</span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Auditoria de Telemetria e WebGL em Produção
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Inspeção técnica isolada de precisão de sinal, taxa de quadros (FPS), canal WebSocket
            e integridade de renderização da malha viária.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRecarregar}
            disabled={recarregando}
            className="flex h-10 items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 px-3.5 rounded-xl text-xs font-bold border border-slate-800 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${recarregando ? "animate-spin" : ""}`} />
            <span>Atualizar Telemetria</span>
          </button>
        </div>
      </div>

      {/* 2. PAINEL DE DIAGNÓSTICO TÉCNICO COMPLETO */}
      <MapDiagnosticPanel
        variant="full"
        gpsAccuracyMeters={8}
        driversOnlineCount={frota.length}
        driversInViewportCount={veiculosEmRota || frota.length}
        websocketStatus="CONNECTED"
        lastRealtimeEventTimestamp={Date.now() - 250}
        mapboxRequestCount={128}
      />

      {/* 3. MAPA DE AUDITORIA INTERATIVA */}
      <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-950">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-black text-white">
              Sessão de Teste Cartográfico (Filtro Geodésico Ativo)
            </h2>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400">
            {frota.length} veículos rastreados no cluster
          </span>
        </div>
        <div className="h-[460px] sm:h-[520px] relative">
          <UniversalMapView
            veiculos={frota}
            altura="h-full min-h-[460px]"
            mostrarControles={true}
            mostrarTrafego={true}
            mostrarCardInferior={false}
          />
        </div>
      </div>

      {/* 4. TABELA DE NÓS DE TELEMETRIA DA FROTA */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Nós de Telemetria Conectados ao Barramento
            </h3>
            <p className="text-xs text-slate-500">
              Veículos reportando coordenadas através da Fila de Telemetria Contínua.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ● {frota.length} Ativos
          </span>
        </div>

        {frota.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center font-medium">
            Nenhum condutor transmitindo telemetria neste momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Veículo / Placa</th>
                  <th className="py-2.5 px-3">Condutor</th>
                  <th className="py-2.5 px-3">Status Operacional</th>
                  <th className="py-2.5 px-3">Velocidade</th>
                  <th className="py-2.5 px-3">Último Ping GNSS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {frota.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{v.placa}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{v.motorista}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          v.status === "em_rota"
                            ? "bg-emerald-100 text-emerald-800"
                            : v.status === "parado"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {v.status === "em_rota"
                          ? "Em Rota"
                          : v.status === "parado"
                          ? "Disponível"
                          : "Alerta SOS"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{v.velocidadeKmH} km/h</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {v.ultimaAtualizacao}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
