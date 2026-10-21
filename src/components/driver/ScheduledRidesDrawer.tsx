import React, { useState, useEffect, memo } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import {
  scheduledRideEngine,
  type ScheduledRide,
} from "@/lib/ride/scheduled-ride-engine";

interface ScheduledRidesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  driverName: string;
  driverVehicle: string;
  driverPhone: string;
  driverCoords: { lat: number; lng: number };
}

export const ScheduledRidesDrawer: React.FC<ScheduledRidesDrawerProps> = memo(
  ({
    isOpen,
    onClose,
    driverId,
    driverName,
    driverVehicle,
    driverPhone,
    driverCoords,
  }) => {
    const [tab, setTab] = useState<"claimed" | "available">("claimed");
    const [myRides, setMyRides] = useState<ScheduledRide[]>([]);
    const [availableRides, setAvailableRides] = useState<ScheduledRide[]>([]);
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    const refreshRides = () => {
      setMyRides(scheduledRideEngine.getDriverClaimedRides(driverId));
      setAvailableRides(
        scheduledRideEngine.getAvailableRidesForDrivers(driverCoords),
      );
    };

    useEffect(() => {
      if (isOpen) {
        refreshRides();
      }
    }, [isOpen, driverId, driverCoords]);

    if (!isOpen) return null;

    const handleClaim = (rideId: string) => {
      const res = scheduledRideEngine.claimScheduledRide(
        rideId,
        driverId,
        driverName,
        driverVehicle,
        driverPhone,
      );
      if (res.success) {
        setActionMsg("Viagem reservada com sucesso. Fique atento ao check-in noturno!");
        refreshRides();
        setTab("claimed");
      } else {
        setActionMsg(res.message || "Erro ao reservar viagem.");
      }
    };

    const handleCheckin = (rideId: string) => {
      const res = scheduledRideEngine.performNightCheckin(rideId, driverId);
      if (res.success) {
        setActionMsg("Check-in Noturno confirmado. Sua escala está 100% garantida!");
        refreshRides();
      } else {
        setActionMsg(res.message || "Erro ao realizar check-in.");
      }
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Escala de Viagens Agendadas</h3>
                <span className="text-xs text-slate-400">
                  Garantia de pontualidade e check-in noturno
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

          {/* Abas */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTab("claimed");
                setActionMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                tab === "claimed"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Minhas Reservas ({myRides.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("available");
                setActionMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                tab === "available"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Disponíveis ({availableRides.length})
            </button>
          </div>

          {actionMsg && (
            <div className="p-3 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-xs text-indigo-300">
              {actionMsg}
            </div>
          )}

          {/* Lista com Scroll */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {tab === "claimed" ? (
              myRides.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl space-y-2">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Você ainda não tem viagens agendadas para amanhã.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("available")}
                    className="text-xs text-indigo-400 font-bold hover:underline"
                  >
                    Ver viagens disponíveis
                  </button>
                </div>
              ) : (
                myRides.map((ride) => {
                  const tripDate = new Date(ride.scheduledFor);
                  const isCheckinConfirmed = ride.status === "NIGHT_CHECKIN_CONFIRMED";
                  const isPendingCheckin = !isCheckinConfirmed;

                  return (
                    <div
                      key={ride.id}
                      className="p-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-400">
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
                          <h4 className="text-sm font-bold text-white mt-0.5">
                            {ride.passengerName}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-400">
                            R$ {(ride.estimatedFareCents / 100).toFixed(2).replace(".", ",")}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            Tarifa Líquida
                          </span>
                        </div>
                      </div>

                      {/* Itinerário */}
                      <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="truncate">{ride.pickupAddress}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                          <span className="truncate">{ride.destinationAddress}</span>
                        </div>
                      </div>

                      {/* Status de Check-in Noturno */}
                      {isCheckinConfirmed ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Check-in Noturno Confirmado — Viagem 100% Garantida</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>
                              Confirme o Check-in Noturno na véspera para manter a escala e evitar a realocação para plantonistas.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCheckin(ride.id)}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirmar Check-in Noturno</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            ) : availableRides.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl space-y-2">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Nenhuma corrida agendada disponível na região no momento.
                </p>
              </div>
            ) : (
              availableRides.map((ride) => {
                const tripDate = new Date(ride.scheduledFor);
                return (
                  <div
                    key={ride.id}
                    className="p-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-indigo-400">
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
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          {ride.passengerName}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-emerald-400">
                          R$ {(ride.estimatedFareCents / 100).toFixed(2).replace(".", ",")}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Tarifa Líquida
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="truncate">{ride.pickupAddress}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <span className="truncate">{ride.destinationAddress}</span>
                      </div>
                    </div>

                    {ride.notes && (
                      <p className="text-[11px] text-slate-400 italic">
                        "{ride.notes}"
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => handleClaim(ride.id)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Reservar Viagem</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
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

ScheduledRidesDrawer.displayName = "ScheduledRidesDrawer";
