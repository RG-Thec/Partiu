import React, { useState, memo } from "react";
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  MapPin,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { scheduledRideEngine, type ScheduledRide } from "@/lib/ride/scheduled-ride-engine";

interface ScheduleRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  pickupCoords: { lat: number; lng: number };
  destinationAddress: string;
  destinationCoords: { lat: number; lng: number };
  estimatedFareCents: number;
  category: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  onRideScheduled?: (ride: ScheduledRide) => void;
}

export const ScheduleRideModal: React.FC<ScheduleRideModalProps> = memo(
  ({
    isOpen,
    onClose,
    pickupAddress,
    pickupCoords,
    destinationAddress,
    destinationCoords,
    estimatedFareCents,
    category,
    passengerId,
    passengerName,
    passengerPhone,
    onRideScheduled,
  }) => {
    // Inicializa com amanhã às 06:00
    const [selectedDate, setSelectedDate] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    });
    const [selectedTime, setSelectedTime] = useState("06:00");
    const [notes, setNotes] = useState("");
    const [createdRide, setCreatedRide] = useState<ScheduledRide | null>(null);

    if (!isOpen) return null;

    const handleConfirmSchedule = () => {
      const scheduledIso = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const ride = scheduledRideEngine.createScheduledRide({
        passengerId,
        passengerName,
        passengerPhone,
        pickupAddress,
        pickupCoords,
        destinationAddress,
        destinationCoords,
        scheduledFor: scheduledIso,
        category,
        estimatedFareCents,
        notes: notes.trim() || undefined,
      });

      setCreatedRide(ride);
      if (onRideScheduled) {
        onRideScheduled(ride);
      }
    };

    const handleFinish = () => {
      setCreatedRide(null);
      onClose();
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-900 animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Agendar Corrida</h3>
                <span className="text-xs text-slate-500">
                  Garantia de embarque com check-in noturno
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

          {createdRide ? (
            <div className="space-y-4 py-3 text-center animate-in fade-in">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-950">Viagem Agendada com Sucesso</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Sua solicitação foi enviada para os melhores motoristas da região. O condutor escalado realizará o check-in noturno na véspera para garantir sua viagem.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1 text-left">
                <div className="font-semibold text-slate-900">
                  Data: {new Date(createdRide.scheduledFor).toLocaleString("pt-BR")}
                </div>
                <div>Embarque: {createdRide.pickupAddress}</div>
                <div>Destino: {createdRide.destinationAddress}</div>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                Concluir
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selo de Garantia */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-950 text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Garantia de Pontualidade:</strong> O motorista escala sua viagem com antecedência e confirma no check-in noturno da véspera. Caso ocorra imprevisto, nossa frota de plantão é acionada automaticamente.
                </p>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Data</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Horário</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Resumo do Trajeto */}
              <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="truncate">{pickupAddress}</span>
                </div>
                <div className="flex items-start gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                  <span className="truncate">{destinationAddress}</span>
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Observações para o Motorista (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Viagem com 2 malas grandes / Rodoviária"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Tarifa Estimada */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div>
                  <span className="text-xs text-emerald-800 font-medium block">Valor Garantido</span>
                  <span className="text-[11px] text-emerald-700">Categoria: {category}</span>
                </div>
                <span className="text-base font-black text-emerald-700">
                  R$ {(estimatedFareCents / 100).toFixed(2).replace(".", ",")}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmSchedule}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Agendamento</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  },
);

ScheduleRideModal.displayName = "ScheduleRideModal";
