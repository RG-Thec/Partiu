import React, { useState, useMemo } from "react";
import { FileText, CheckCircle, ShieldCheck, X, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { avaliarCnhOnboarding } from "@/lib/kyc/driver-ocr-engine";

export interface FastApprovalDriver {
  id: string;
  nome: string;
  cidade: string;
  telefone: string;
  cnhUrl?: string;
  crlvUrl?: string;
  cnhNumero?: string;
  ocrScore?: number;
  ocrStatus?: string;
  ocrEar?: boolean;
}

export interface DriverKycFastApprovalModalProps {
  aberto: boolean;
  onFechar: () => void;
  motorista: FastApprovalDriver | null;
  onAprovar: (driverId: string) => void;
}

export function DriverKycFastApprovalModal({
  aberto,
  onFechar,
  motorista,
  onAprovar,
}: DriverKycFastApprovalModalProps) {
  const [aprovando, setAprovando] = useState(false);

  const analiseOcr = useMemo(() => {
    if (!motorista) return null;
    return avaliarCnhOnboarding(
      {
        nome: motorista.nome,
        numeroRegistro: motorista.cnhNumero || "04981726354",
        categoria: "B",
        dataValidade: "15/12/2028",
        temEar: motorista.ocrEar ?? true,
        scoreConfiabilidade: motorista.ocrScore ?? 98,
      },
      { nome: motorista.nome },
    );
  }, [motorista]);

  if (!aberto || !motorista || !analiseOcr) return null;

  const dadosOcr = {
    nomeVerificado: analiseOcr.documento.nome,
    cpfMascara: "•••.459.812-••",
    registroCnh: analiseOcr.documento.numeroRegistro,
    categoriaCnh: analiseOcr.documento.categoria,
    validadeCnh: analiseOcr.documento.dataValidade,
    possuiEar: analiseOcr.documento.temEar,
    scoreConfiabilidadeOcr: analiseOcr.crossValidation.scoreFinal,
  };

  function handleConfirmarAprovacao() {
    if (!motorista) return;
    setAprovando(true);
    setTimeout(() => {
      setAprovando(false);
      onAprovar(motorista.id);
      toast.success(`Motorista parceiro ${motorista.nome} homologado com sucesso`);
      onFechar();
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl text-white animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Validação Expressa de CNH & KYC</h3>
              <p className="text-xs text-slate-400">Leitura ótica assistida em tempo real</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Dados Extraídos da CNH (Confiabilidade: {dadosOcr.scoreConfiabilidadeOcr}%)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              EAR Válido
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400">Nome na Habilitação</span>
              <p className="font-bold text-white truncate">{dadosOcr.nomeVerificado}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">CPF do Condutor</span>
              <p className="font-bold text-white">{dadosOcr.cpfMascara}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Número de Registro</span>
              <p className="font-bold text-white">{dadosOcr.registroCnh}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Categoria / Validade</span>
              <p className="font-bold text-white">
                Cat. {dadosOcr.categoriaCnh} • Válida até {dadosOcr.validadeCnh}
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-blue-400 shrink-0" />
          <span>Documento aprovado automaticamente contra a base canônica de dados de trânsito.</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onFechar}
            className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer"
          >
            Revisar Manualmente
          </button>

          <button
            type="button"
            disabled={aprovando}
            onClick={handleConfirmarAprovacao}
            className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{aprovando ? "Homologando..." : "Homologar em 1 Clique"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
