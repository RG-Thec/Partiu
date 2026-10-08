import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, CheckCircle2, Car, Bike } from "lucide-react";

interface DriverSignupModalProps {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  initialPhone?: string;
  onEnviarCandidatura: (dados: {
    nome: string;
    telefone: string;
    tipoVeiculo: "CARRO" | "MOTO";
    modelo: string;
    placa: string;
  }) => Promise<boolean>;
  corPrimaria?: string;
  corTextoPrimaria?: string;
}

export function DriverSignupModal({
  open,
  onClose,
  initialName = "",
  initialPhone = "",
  onEnviarCandidatura,
  corPrimaria,
  corTextoPrimaria,
}: DriverSignupModalProps) {
  const [driverName, setDriverName] = useState(initialName);
  const [driverPhone, setDriverPhone] = useState(initialPhone);
  const [driverVehicleType, setDriverVehicleType] = useState<"CARRO" | "MOTO">("CARRO");
  const [driverVehicleModel, setDriverVehicleModel] = useState("");
  const [driverPlate, setDriverPlate] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const ok = await onEnviarCandidatura({
        nome: driverName,
        telefone: driverPhone,
        tipoVeiculo: driverVehicleType,
        modelo: driverVehicleModel,
        placa: driverPlate,
      });
      if (ok) setSucesso(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700">
              Modelo Diária Fixa • 0% Taxa
            </span>
            <h3 className="text-sm font-bold text-slate-900">Quero Ser Motorista Partiu</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sucesso ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Candidatura Enviada!</h4>
            <p className="text-xs text-slate-500">
              Nossa equipe entrará em contato para liberação imediata da sua conta.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Seu Nome Completo
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-medium"
                placeholder="Nome"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                WhatsApp para Contato
              </label>
              <input
                type="tel"
                required
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-medium"
                placeholder="(22) 99999-9999"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDriverVehicleType("CARRO")}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  driverVehicleType === "CARRO"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <Car className="h-3.5 w-3.5" />
                Carro
              </button>
              <button
                type="button"
                onClick={() => setDriverVehicleType("MOTO")}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  driverVehicleType === "MOTO"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <Bike className="h-3.5 w-3.5" />
                Moto
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Modelo do Veículo
              </label>
              <input
                type="text"
                required
                value={driverVehicleModel}
                onChange={(e) => setDriverVehicleModel(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-medium"
                placeholder="Ex: Onix 1.0 ou CG 160"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Placa do Veículo
              </label>
              <input
                type="text"
                required
                value={driverPlate}
                onChange={(e) => setDriverPlate(e.target.value.toUpperCase())}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-800 font-mono uppercase font-bold"
                placeholder="BRA2E19"
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: corPrimaria || "#FF6B00", color: corTextoPrimaria || "#FFFFFF" }}
            >
              {enviando ? "Enviando Dados..." : "Enviar Candidatura Expressa"}
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              Você também pode fazer o cadastro completo com CNH em{" "}
              <Link to="/cadastro-motorista" onClick={onClose} className="underline font-bold text-slate-600">
                cadastro completo
              </Link>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
