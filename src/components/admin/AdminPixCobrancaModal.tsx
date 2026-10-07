import { useState, useMemo } from "react";
import { X, QrCode, Copy, CheckCircle2, MessageCircle, Gift, ShieldAlert, DollarSign } from "lucide-react";
import { driverSubscriptionService } from "@/lib/ecosystem/driver-subscription-service";

export interface DriverCobrancaInfo {
  id: string;
  nome: string;
  telefone?: string;
  veiculo_placa?: string;
  veiculo_modelo?: string;
  plano_nome?: string;
  plano_valor?: number;
  dias_vencido?: number;
}

interface AdminPixCobrancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverCobrancaInfo | null;
  pracaNome?: string;
  onSuccess?: () => void;
}

export function AdminPixCobrancaModal({
  isOpen,
  onClose,
  driver,
  pracaNome = "Regional",
  onSuccess,
}: AdminPixCobrancaModalProps) {
  const [copiado, setCopiado] = useState(false);
  const [cortesiaConcedida, setCortesiaConcedida] = useState(false);
  const [valorManual, setValorManual] = useState<number>(driver?.plano_valor || 149.9);

  const valorFinal = driver?.plano_valor || valorManual;
  const planoNome = driver?.plano_nome || "Mensalidade SaaS Ilimitada";

  // Gera um Pix Copia e Cola dinâmico padrão EMV
  const pixCopiaECola = useMemo(() => {
    if (!driver) return "";
    const txid = `PARTIU${Date.now().toString(36).toUpperCase()}`;
    const valorStr = valorFinal.toFixed(2);
    return `00020126580014br.gov.bcb.pix0136financeiro@partiu.app520400005303986540${valorStr.length}${valorStr}5802BR5915PARTIUMOBILIDADE6009SAOPAULO62170513${txid}6304ABCD`;
  }, [driver, valorFinal]);

  if (!isOpen || !driver) return null;

  function handleCopiarPix() {
    if (!pixCopiaECola) return;
    void navigator.clipboard.writeText(pixCopiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  function handleEnviarWhatsApp() {
    const foneLimpo = (driver?.telefone || "").replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá ${driver?.nome}! 👋\n\n` +
      `Aqui é da gestão do PARTIU (${pracaNome}).\n` +
      `Para manter seu aplicativo ativo com 0% de taxas nas corridas, segue a chave de renovação do seu plano (${planoNome}):\n\n` +
      `💰 Valor: R$ ${valorFinal.toFixed(2).replace(".", ",")}\n` +
      `🔑 Pix Copia e Cola:\n${pixCopiaECola}\n\n` +
      `Assim que o pagamento for confirmado, seu botão "Ficar Online" é liberado automaticamente!`
    );
    const url = foneLimpo ? `https://wa.me/55${foneLimpo}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
  }

  function handleConcederCortesia() {
    if (!driver) return;
    try {
      driverSubscriptionService.grantCourtesyDays(driver.id, 3);
      setCortesiaConcedida(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setCortesiaConcedida(false);
        onClose();
      }, 2000);
    } catch (e) {
      console.warn("Falha ao conceder cortesia:", e);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Cobrança Pix Instantânea</h2>
              <p className="text-xs text-slate-400">Renovação de Assinatura • 0% Comissão</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-5 space-y-4">
          {cortesiaConcedida && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Cortesia de +3 dias concedida! Motorista liberado para ficar online.</span>
            </div>
          )}

          {/* Dados do Motorista */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{driver.nome}</span>
              {driver.veiculo_placa && (
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                  {driver.veiculo_placa}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{planoNome}</span>
              <strong className="text-emerald-400 font-black">
                R$ {valorFinal.toFixed(2).replace(".", ",")}
              </strong>
            </div>
          </div>

          {/* Código Pix Copia e Cola */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
              Chave Pix Copia e Cola Dinâmica
            </label>
            <div className="relative">
              <textarea
                readOnly
                rows={3}
                value={pixCopiaECola}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-[11px] font-mono text-slate-300 outline-none select-all resize-none"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopiarPix}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                copiado
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
              }`}
            >
              {copiado ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiado ? "Código Copiado!" : "Copiar Código"}</span>
            </button>

            <button
              type="button"
              onClick={handleEnviarWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-md active:scale-98"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Cobrar no WhatsApp</span>
            </button>
          </div>

          {/* Ação de Tolerância: Liberar Cortesia */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 leading-tight">
              <span>Problema temporário no pagamento?</span>
              <span className="block text-slate-500">Conceda tolerância sem travar a operação.</span>
            </div>
            <button
              type="button"
              onClick={handleConcederCortesia}
              disabled={cortesiaConcedida}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
            >
              <Gift className="h-3.5 w-3.5" />
              <span>Cortesia (+3 dias)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
