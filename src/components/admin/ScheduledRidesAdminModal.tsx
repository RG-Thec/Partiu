import React, { useState, useEffect, memo } from "react";
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  ArrowRight,
  RefreshCw,
  User,
} from "lucide-react";
import {
  scheduledRideEngine,
  type ScheduledRide,
} from "@/lib/ride/scheduled-ride-engine";

interface ScheduledRidesAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduledRidesAdminModal: React.FC<ScheduledRidesAdminModalProps> = memo(
  ({ isOpen, onClose }) => {
    const [rides, setRides] = useState<ScheduledRide[]>([]);

    const refresh = () => {
      setRides(scheduledRideEngine.getAllScheduledRides());
    };

    useEffect(() => {
      if (isOpen) {
        refresh();
      }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleReallocateCheckins = () => {
      const reallocated = scheduledRideEngine.reallocateOverdueCheckins();
      alert(
        reallocated.length > 0
          ? `${reallocated.length} corrida(s) sem check-in noturno foram realocadas para plantonistas.`
          : "Nenhuma corrida em atraso de check-in.",
      );
      refresh();
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-2xl w-full space-y-4 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Central de Agendamentos & Escala Noturna</h3>
                <span className="text-xs text-slate-400">
                  Monitoramento de check-ins noturnos e corridas de alto valor
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReallocateCheckins}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/50 text-xs font-semibold transition"
                title="Verificar atrasos e realocar para plantonistas"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Auditar Check-ins</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {rides.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl space-y-2">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Nenhuma corrida agendada na praça.</p>
              </div>
            ) : (
              rides.map((ride) => {
                const tripDate = new Date(ride.scheduledFor);
                const isCheckinConfirmed = ride.status === "NIGHT_CHECKIN_CONFIRMED";
                const isReallocating = ride.status === "REALLOCATING";

                return (
                  <div
                    key={ride.id}
                    className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {tripDate.toLocaleDateString("pt-BR")} às{" "}
                            {tripDate.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          {ride.passengerName} ({ride.passengerPhone})
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400">
                          R$ {(ride.estimatedFareCents / 100).toFixed(2).replace(".", ",")}
                        </span>
                        <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {ride.category}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="truncate">{ride.pickupAddress}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <span className="truncate">{ride.destinationAddress}</span>
                      </div>
                    </div>

                    {/* Status de Alocação e Check-in */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      {ride.assignedDriverName ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Motorista: <strong>{ride.assignedDriverName}</strong>
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-medium">
                          Aguardando motorista reservar
                        </span>
                      )}

                      {isCheckinConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Check-in Noturno Realizado
                        </span>
                      ) : isReallocating ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Check-in Perdido (Realocando)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          Pendente de Check-in Noturno
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  },
);

ScheduledRidesAdminModal.displayName = "ScheduledRidesAdminModal";
