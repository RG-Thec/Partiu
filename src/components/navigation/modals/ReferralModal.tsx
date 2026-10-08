import React, { useState } from "react";
import { Gift, X, Check, Copy, Share2 } from "lucide-react";
import type { UserProfileData, GlobalAppSettings } from "@/services";

interface ReferralModalProps {
  open: boolean;
  onClose: () => void;
  userProfile: UserProfileData | null;
  appSettings: GlobalAppSettings;
  onResgatarCodigoAmigo: (codigo: string) => Promise<boolean>;
  corPrimaria?: string;
  corTextoPrimaria?: string;
}

export function ReferralModal({
  open,
  onClose,
  userProfile,
  appSettings,
  onResgatarCodigoAmigo,
  corPrimaria,
  corTextoPrimaria,
}: ReferralModalProps) {
  const [codigoAmigoInput, setCodigoAmigoInput] = useState("");
  const [resgatandoAmigo, setResgatandoAmigo] = useState(false);
  const [mensagemAmigo, setMensagemAmigo] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [cupomCopiado, setCupomCopiado] = useState(false);

  if (!open) return null;

  const codigoPessoal = userProfile?.name
    ? (userProfile.name.split(" ")[0].toUpperCase() + (appSettings.referralBonusBrl || 5))
    : `PARTIU${appSettings.referralBonusBrl || 5}`;

  function handleCopiar() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(codigoPessoal);
    }
    setCupomCopiado(true);
    setTimeout(() => setCupomCopiado(false), 2500);
  }

  function handleCompartilhar() {
    const texto = `Baixe o app PARTIU e ganhe R$ ${appSettings.referralDiscountBrl || 5},00 de desconto na sua primeira corrida com o meu código: ${codigoPessoal}!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      void navigator.share({
        title: "Convite PARTIU",
        text: texto,
        url: window.location.origin,
      });
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, "_blank");
    }
  }

  async function handleResgatar() {
    if (!codigoAmigoInput.trim()) return;
    setResgatandoAmigo(true);
    setMensagemAmigo(null);
    try {
      const sucesso = await onResgatarCodigoAmigo(codigoAmigoInput.trim());
      if (sucesso) {
        setMensagemAmigo({ tipo: "sucesso", texto: "Código de indicação resgatado com sucesso!" });
        setCodigoAmigoInput("");
      } else {
        setMensagemAmigo({ tipo: "erro", texto: "Código inválido ou já utilizado." });
      }
    } catch {
      setMensagemAmigo({ tipo: "erro", texto: "Não foi possível resgatar o código." });
    } finally {
      setResgatandoAmigo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 text-center">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
          style={{ backgroundColor: `${corPrimaria || "#FF6B00"}15`, color: corPrimaria || "#FF6B00" }}
        >
          <Gift className="h-7 w-7" />
        </div>

        <h3 className="text-base font-black text-slate-900">
          Indique Amigos e Ganhe R$ {appSettings.referralBonusBrl || 5},00
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Compartilhe seu código exclusivo. Quando seu amigo fizer a primeira corrida, você ganha{" "}
          <strong>R$ {appSettings.referralBonusBrl || 5},00</strong> e ele ganha{" "}
          <strong>R$ {appSettings.referralDiscountBrl || 5},00 de desconto</strong>!
        </p>

        {/* Código Pessoal do Usuário */}
        <div className="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block text-left">
              Seu Código de Indicação
            </span>
            <span className="text-sm font-mono font-black text-slate-900">
              {codigoPessoal}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopiar}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-bold"
          >
            {cupomCopiado ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{cupomCopiado ? "Copiado" : "Copiar"}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleCompartilhar}
          className="w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mb-4"
          style={{ backgroundColor: corPrimaria || "#FF6B00", color: corTextoPrimaria || "#FFFFFF" }}
        >
          <Share2 className="h-4 w-4" />
          Compartilhar Convite no WhatsApp
        </button>

        {/* Campo: Foi Indicado por um Amigo? */}
        <div className="pt-3 border-t border-slate-100 text-left">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
            Foi indicado por alguém?
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Código do seu amigo"
              value={codigoAmigoInput}
              onChange={(e) => setCodigoAmigoInput(e.target.value.toUpperCase())}
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 uppercase font-bold tracking-wider focus:outline-none focus:border-slate-800"
            />
            <button
              type="button"
              disabled={resgatandoAmigo}
              onClick={handleResgatar}
              className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {resgatandoAmigo ? "..." : "Resgatar"}
            </button>
          </div>

          {mensagemAmigo && (
            <p
              className={`text-[11px] font-bold mt-1.5 ${
                mensagemAmigo.tipo === "sucesso" ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {mensagemAmigo.texto}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
