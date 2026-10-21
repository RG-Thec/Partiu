import React, { useState, useEffect, memo } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  User,
  Car,
  Trash2,
} from "lucide-react";
import {
  scheduledRideEngine,
  type ScheduledRide,
} from "@/lib/ride/scheduled-ride-engine";

interface ScheduledRidesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  passengerId: string;
}

export const ScheduledRidesSheet: React.FC<ScheduledRidesSheetProps> = memo(
  ({ isOpen, onClose, passengerId }) => {
    const [rides, setRides] = useState<ScheduledRide[]>([]);

    const refresh = () => {
      setRides(scheduledRideEngine.getPassengerRides(passengerId));
    };

    useEffect(() => {
      if (isOpen) {
        refresh();
      }
    }, [isOpen, passengerId]);

    if (!isOpen) return null;

    const handleCancel = (rideId: string) => {
      if (window.confirm("Deseja realmente cancelar este agendamento?")) {
        scheduledRideEngine.cancelScheduledRide(rideId, "Cancelado pelo passageiro");
        refresh();
      }
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-900 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Minhas Viagens Agendadas</h3>
                <span className="text-xs text-slate-500">
                  {rides.length} agendamento{rides.length !== 1 ? "s" : ""} ativo{rides.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {rides.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">
                  Você não possui nenhuma corrida agendada.
                </p>
              </div>
            ) : (
              rides.map((ride) => {
                const tripDate = new Date(ride.scheduledFor);
                const isCheckinOk = ride.status === "NIGHT_CHECKIN_CONFIRMED";

                return (
                  <div
                    key={ride.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {tripDate.toLocaleDateString("pt-BR", {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                            })}{" "}
                            às{" "}
                            {tripDate.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {ride.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-600">
                          R$ {(ride.estimatedFareCents / 100).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="truncate">{ride.pickupAddress}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                        <span className="truncate">{ride.destinationAddress}</span>
                      </div>
                    </div>

                    {/* Status e Motorista */}
                    {ride.assignedDriverName ? (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-600" />
                            <span className="font-bold text-slate-900">{ride.assignedDriverName}</span>
                          </div>
                          {isCheckinOk && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              Check-in Noturno Confirmado
                            </span>
                          )}
                        </div>
                        {ride.assignedDriverVehicle && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Car className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ride.assignedDriverVehicle}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                        Localizando e alocando o melhor motorista da região...
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleCancel(ride.id)}
                        className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancelar Agendamento</span>
                      </button>
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

ScheduledRidesSheet.displayName = "ScheduledRidesSheet";
