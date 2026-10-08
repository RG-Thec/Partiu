import React from "react";
import { Headphones, X, MessageSquare, Phone, ExternalLink } from "lucide-react";
import type { GlobalAppSettings } from "@/services";

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
  appSettings: GlobalAppSettings;
}

export function SupportModal({ open, onClose, appSettings }: SupportModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">Central de Ajuda 24h</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <a
            href={`https://wa.me/55${appSettings.whatsappSupport.replace(/\D/g, "")}?text=${encodeURIComponent("Olá, preciso de suporte no app PARTIU!")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between hover:bg-emerald-100/70 transition-all text-emerald-900 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Atendimento Humano Suporte</h4>
                <p className="text-[10px] text-emerald-700">{appSettings.whatsappSupport}</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <a
            href={`tel:${appSettings.phoneEmergency.replace(/\D/g, "")}`}
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between hover:bg-rose-100/70 transition-all text-rose-900 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-600 text-white">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Emergência e Segurança</h4>
                <p className="text-[10px] text-rose-700">Polícia Militar ({appSettings.phoneEmergency})</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-rose-600 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-800">Dúvidas Frequentes</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              • <strong>Como pagar?</strong> Ao finalizar a corrida, o motorista apresenta o QR Code do PIX na tela dele para você pagar diretamente pelo seu banco.
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              • <strong>Como funciona o PIN?</strong> No início da corrida ou entrega, informe o PIN de 4 dígitos ao motorista para validação segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
