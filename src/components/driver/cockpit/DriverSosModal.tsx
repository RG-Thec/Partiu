import React, { useState } from "react";
import { AlertTriangle, Phone, X } from "lucide-react";
import { registrarETransmitirAlertaSOS } from "@/lib/partiu-realtime-service";
import { driverLocationService } from "@/services/DriverLocationService";

export interface DriverSosModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverProfile: {
    id: string;
    nome: string;
    telefone: string;
    placa?: string;
  };
  corridaAtiva?: {
    id: string;
    destino: any;
  } | null;
}

export function DriverSosModal({
  isOpen,
  onClose,
  driverProfile,
  corridaAtiva,
}: DriverSosModalProps) {
  const [acionandoSos, setAcionandoSos] = useState(false);

  if (!isOpen) return null;

  const handleAcionarPolicia = async () => {
    setAcionandoSos(true);
    try {
      const pos = driverLocationService.getCurrentPosition();
      let coords = pos ? `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}` : "";
      if (!coords && typeof navigator !== "undefined" && navigator.geolocation) {
        coords = await new Promise<string>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`),
            () => resolve(""),
            { timeout: 1200, maximumAge: 10000 }
          );
        });
      }

      await registrarETransmitirAlertaSOS({
        tipo: "seguranca",
        solicitanteNome: driverProfile.nome || "Motorista Parceiro PARTIU",
        solicitanteTelefone: driverProfile.telefone || "+5582999999999",
        motoristaNome: driverProfile.nome || "Motorista Parceiro",
        veiculoPlaca: driverProfile.placa || "PARTIU",
        rodovia:
          (typeof corridaAtiva?.destino === "string"
            ? corridaAtiva.destino
            : corridaAtiva?.destino?.endereco) || "Perímetro Urbano",
        coordenadas: coords || undefined,
        descricao: `Emergência SOS 190 acionada pelo motorista em rota. Corrida: ${corridaAtiva?.id || "N/A"}`,
        corridaId: corridaAtiva?.id,
        usuarioId: driverProfile.id,
      });
    } catch (e) {
      console.error("Erro ao registrar telemetria SOS motorista:", e);
    } finally {
      window.location.href = "tel:190";
      setAcionandoSos(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border-2 border-rose-500 rounded-3xl p-5 sm:p-6 max-w-sm w-full text-foreground shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-500/30 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Emergência &amp; SOS 190</h3>
            <p className="text-xs text-muted-foreground font-semibold">Acionamento Policial PARTIU</p>
          </div>
        </div>

        <div className="bg-muted/50 p-3.5 rounded-2xl border border-border text-xs space-y-2 text-foreground font-medium">
          <p className="leading-relaxed">
            Você está prestes a acionar a <strong>Central de Emergência 190</strong>.
          </p>
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span>Telemetria GPS enviada aos canais de apoio</span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={acionandoSos}
            onClick={handleAcionarPolicia}
            className="w-full h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            <Phone className="w-4 h-4" />
            <span>{acionandoSos ? "TRANSMITINDO TELEMETRIA..." : "LIGAR PARA POLÍCIA MILITAR (190)"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
