import React, { useState, memo } from "react";
import { X, ShieldAlert, Plus, Trash2, Clock, MapPin, Check } from "lucide-react";
import {
  driverExclusionZonesEngine,
  type DriverExclusionZone,
} from "@/lib/geo/driver-exclusion-zones";

interface ExclusionZonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
}

export const ExclusionZonesModal: React.FC<ExclusionZonesModalProps> = memo(
  ({ isOpen, onClose, driverId }) => {
    const [zones, setZones] = useState<DriverExclusionZone[]>(() =>
      driverExclusionZonesEngine.getZones(driverId),
    );
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState("");
    const [radiusKm, setRadiusKm] = useState(1.5);
    const [startHour, setStartHour] = useState(20);
    const [endHour, setEndHour] = useState(6);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSaveZone = () => {
      if (!name.trim()) {
        setErrorMsg("Informe o nome do bairro ou região.");
        return;
      }
      setErrorMsg(null);

      // Coordenadas mock padrão no centro para simulação (ex: Itaperuna)
      const res = driverExclusionZonesEngine.saveZone(driverId, {
        name: name.trim(),
        center: { lat: -21.205, lng: -41.89 },
        radiusKm,
        startHour,
        endHour,
        active: true,
      });

      if (!res.success) {
        setErrorMsg(res.message || "Erro ao salvar zona.");
        return;
      }

      setZones(driverExclusionZonesEngine.getZones(driverId));
      setIsCreating(false);
      setName("");
    };

    const handleToggle = (zoneId: string) => {
      driverExclusionZonesEngine.toggleZone(driverId, zoneId);
      setZones(driverExclusionZonesEngine.getZones(driverId));
    };

    const handleDelete = (zoneId: string) => {
      driverExclusionZonesEngine.removeZone(driverId, zoneId);
      setZones(driverExclusionZonesEngine.getZones(driverId));
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Zonas de Exclusão Pessoal</h3>
                <span className="text-xs text-slate-400">
                  {zones.length} de 3 zonas cadastradas
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Configure bairros ou trechos onde você prefere não receber chamadas após determinado horário (ex: à noite).
          </p>

          {/* Lista de Zonas */}
          <div className="space-y-2.5">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  zone.active
                    ? "bg-slate-800/80 border-slate-700 text-white"
                    : "bg-slate-900/50 border-slate-800/80 text-slate-500 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold">{zone.name}</span>
                    <span className="text-[10px] bg-slate-700/80 text-slate-300 px-1.5 py-0.5 rounded">
                      Raio {zone.radiusKm} km
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(zone.id)}
                      className={`text-xs px-3 py-1.5 min-h-[36px] rounded-lg font-semibold transition active:scale-95 cursor-pointer ${
                        zone.active
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {zone.active ? "Ativa" : "Pausada"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(zone.id)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-slate-800 transition active:scale-95 cursor-pointer"
                      title="Excluir zona"
                      aria-label={`Excluir zona ${zone.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Ativa das {String(zone.startHour).padStart(2, "0")}:00 às{" "}
                    {String(zone.endHour).padStart(2, "0")}:00
                  </span>
                </div>
              </div>
            ))}

            {zones.length === 0 && !isCreating && (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl space-y-2">
                <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Nenhuma zona de exclusão configurada.</p>
              </div>
            )}
          </div>

          {/* Formulário de Criação */}
          {isCreating ? (
            <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-xl space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Nova Zona</h4>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Nome do Bairro ou Ponto</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Trevo Norte / Bairro X"
                  className="w-full min-h-[42px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Início (Hora)</label>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full min-h-[42px] bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden"
                  >
                    {[18, 19, 20, 21, 22, 23].map((h) => (
                      <option key={h} value={h}>
                        {h}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Término (Hora)</label>
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="w-full min-h-[42px] bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden"
                  >
                    {[4, 5, 6, 7, 8].map((h) => (
                      <option key={h} value={h}>
                        {h}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Raio de Bloqueio</span>
                  <span className="font-bold text-amber-400">{radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveZone}
                  className="flex-1 min-h-[46px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-3 rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-xs"
                >
                  Salvar Zona
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="min-h-[46px] px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            zones.length < 3 && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full min-h-[46px] flex items-center justify-center gap-1.5 py-3 rounded-xl border border-dashed border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-semibold transition active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Zona de Exclusão</span>
              </button>
            )
          )}
        </div>
      </div>
    );
  },
);

ExclusionZonesModal.displayName = "ExclusionZonesModal";
