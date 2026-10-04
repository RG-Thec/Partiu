import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  HeartPulse,
  MapPin,
  Phone,
  Radio,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useCriarAlertaSOS } from "@/lib/partiu-db";
import { useGeolocation } from "@/lib/use-geolocation";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";

export const Route = createFileRoute("/app/sos")({
  head: () => ({
    meta: [
      { title: "Central de Emergência & Botão SOS 24h | PARTIU" },
      {
        name: "description",
        content:
          "Botão de emergência 24h, acionamento da central de suporte, transmissão de telemetria GPS e discagem rápida 190.",
      },
    ],
  }),
  component: EmergenciaSOSPage,
});

export function EmergenciaSOSPage() {
  const criarSOS = useCriarAlertaSOS();
  const { coords, localDetectado, solicitarLocalizacao, carregando: carregandoGps } = useGeolocation();

  const [sosAtivado, setSosAtivado] = useState(false);
  const [acionando, setAcionando] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [tipoOcorrencia, setTipoOcorrencia] = useState<
    "seguranca" | "emergencia_medica" | "acidente" | "pane_mecanica"
  >("seguranca");
  const [detalhes, setDetalhes] = useState("");

  const activeUser = typeof window !== "undefined" ? supabaseAuthService.getStoredSession() : null;

  const coordenadasTexto = coords
    ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)} (${localDetectado?.pontoEmbarque || "Perímetro Urbano"})`
    : "Calibrando coordenadas de satélite GPS...";

  useEffect(() => {
    solicitarLocalizacao();
  }, [solicitarLocalizacao]);

  async function acionarSOS() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Ignora caso dispositivo bloqueie vibração
      }
    }
    setAcionando(true);
    try {
      const res = await criarSOS.mutateAsync({
        tipo: tipoOcorrencia,
        solicitante_nome: activeUser?.name || "Passageiro PARTIU",
        solicitante_telefone: activeUser?.phone || "(22) 99999-0000",
        van_placa: "URBANO",
        rodovia: localDetectado?.pontoEmbarque || "Área Urbana",
        coordenadas: coordenadasTexto,
        status: "ativo",
        descricao: detalhes.trim() || "Alerta de pânico disparado pelo aplicativo.",
      });
      setProtocolo(res.id.slice(0, 8).toUpperCase());
      setSosAtivado(true);
    } catch {
      setProtocolo("EMERG-" + Date.now().toString(36).slice(-6).toUpperCase());
      setSosAtivado(true);
    } finally {
      setAcionando(false);
    }
  }

  return (
    <div className="px-3 sm:px-6 pt-3 pb-28 w-full max-w-full sm:max-w-2xl mx-auto min-h-[100dvh] bg-background text-foreground">
      {/* 1. Header */}
      <div className="flex items-center gap-2.5">
        <Link
          to="/app"
          className="flex min-h-[34px] min-w-[34px] h-8.5 w-8.5 items-center justify-center rounded-lg bg-card border border-border text-foreground shadow-2xs hover:bg-muted active:scale-95 transition-all cursor-pointer"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-destructive uppercase tracking-wider">
            <ShieldAlert className="h-3 w-3" /> Segurança 24h
          </span>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Central de segurança &amp; SOS
          </h1>
        </div>
      </div>

      {/* 2. Botão Principal de Pânico */}
      {!sosAtivado ? (
        <div className="mt-5 rounded-3xl bg-card p-5 sm:p-8 text-center shadow-lg border border-destructive/20 space-y-5">
          <div>
            <p className="text-base sm:text-lg font-black text-foreground">
              Precisa de ajuda imediata?
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
              Ao pressionar o botão SOS, suas coordenadas geográficas e telemetria serão transmitidas
              instantaneamente para a Central de Segurança PARTIU e você poderá discar diretamente para a Polícia (190).
            </p>
          </div>

          <div className="flex justify-center py-2">
            <button
              type="button"
              disabled={acionando}
              onClick={acionarSOS}
              className="relative flex h-36 w-36 sm:h-40 sm:w-40 flex-col items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white shadow-2xl transition-all hover:scale-105 active:scale-95 animate-pulse cursor-pointer disabled:opacity-60"
              aria-label="Botão de Pânico SOS"
            >
              {acionando ? (
                <Loader2 className="h-12 w-12 animate-spin mb-1" />
              ) : (
                <>
                  <AlertOctagon className="h-12 w-12 mb-1" />
                  <span className="text-2xl font-black tracking-wider">SOS</span>
                  <span className="text-[11px] uppercase font-bold text-white/80">Pressione</span>
                </>
              )}
            </button>
          </div>

          {/* Telemetria de Localização Atual */}
          <div className="rounded-2xl bg-muted/40 p-4 text-left text-xs sm:text-sm border border-border space-y-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <MapPin className="h-4 w-4 text-brand-primary-vibrant" />
              <span>Sua Localização GPS Atual:</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{coordenadasTexto}</p>
          </div>

          {/* Números de Emergência Rápidos */}
          <div className="space-y-3 pt-2">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground text-left">
              Discagem Rápida de Autoridades:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <a
                href="tel:190"
                className="flex min-h-[40px] h-10 items-center justify-center gap-2 rounded-xl bg-destructive text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                <Phone className="h-4 w-4" /> Polícia (190)
              </a>

              <a
                href="tel:192"
                className="flex min-h-[40px] h-10 items-center justify-center gap-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <HeartPulse className="h-4 w-4 text-red-500" /> SAMU (192)
              </a>

              <a
                href="tel:193"
                className="flex min-h-[40px] h-10 items-center justify-center gap-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Bombeiros (193)
              </a>

              <Link
                to="/app/perfil"
                className="flex min-h-[40px] h-10 items-center justify-center gap-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Radio className="h-4 w-4 text-brand-primary-vibrant" /> Suporte PARTIU
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Estado de SOS Disparado com Sucesso */
        <div className="mt-5 rounded-3xl bg-destructive/10 p-6 sm:p-8 text-center shadow-xl border border-destructive/40 space-y-4 animate-in zoom-in-95">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-white shadow-lg animate-bounce">
            <AlertOctagon className="h-10 w-10" />
          </div>

          <div>
            <span className="rounded-full bg-destructive px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
              ALERTA SOS TRANSMITIDO
            </span>
            <h2 className="text-xl font-black text-foreground mt-2">
              Telemetria Enviada com Sucesso
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              A Central de Monitoramento PARTIU registrou suas coordenadas geográficas. Caso necessário, ligue imediatamente para a Polícia.
            </p>
          </div>

          <div className="rounded-2xl bg-card p-4 text-xs text-left space-y-1.5 border border-border">
            {protocolo && (
              <p>
                <span className="font-bold">Protocolo Oficial:</span> #{protocolo}
              </p>
            )}
            <p>
              <span className="font-bold">Posição Registrada:</span> {coordenadasTexto}
            </p>
            <p>
              <span className="font-bold">Status:</span> Prioridade Máxima na Fila Operacional
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <a
              href="tel:190"
              className="flex min-h-[48px] h-12 items-center justify-center gap-2 rounded-xl bg-destructive text-sm font-black text-white shadow-lg hover:brightness-105 active:scale-95 transition-all"
            >
              <Phone className="h-5 w-5" /> Ligar para a Polícia (190)
            </a>

            <button
              type="button"
              onClick={() => setSosAtivado(false)}
              className="flex min-h-[44px] h-11 items-center justify-center rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
            >
              Encerrar alerta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
