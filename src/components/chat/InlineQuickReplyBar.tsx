import React, { useState, useMemo } from "react";
import { Zap, Check, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  quickCannedRepliesEngine,
  type QuickReplyStage,
  type QuickReplyItem,
} from "@/lib/chat/quick-canned-replies";

export interface InlineQuickReplyBarProps {
  rideId: string;
  senderType: "DRIVER" | "PASSENGER";
  senderId: string;
  rideStatus: string;
  onOpenFullChat?: () => void;
  className?: string;
  unreadCount?: number;
}

export const InlineQuickReplyBar: React.FC<InlineQuickReplyBarProps> = ({
  rideId,
  senderType,
  senderId,
  rideStatus,
  onOpenFullChat,
  className = "",
  unreadCount = 0,
}) => {
  const [enviandoTexto, setEnviandoTexto] = useState<string | null>(null);
  const [enviadoComSucesso, setEnviadoComSucesso] = useState<string | null>(null);

  const stage: QuickReplyStage = useMemo(
    () => quickCannedRepliesEngine.resolveStage(rideStatus),
    [rideStatus],
  );

  const replies: QuickReplyItem[] = useMemo(
    () => quickCannedRepliesEngine.getReplies(senderType, stage),
    [senderType, stage],
  );

  async function handleDispararResposta(item: QuickReplyItem) {
    if (enviandoTexto) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }

    setEnviandoTexto(item.id);
    try {
      const res = await quickCannedRepliesEngine.sendQuickReply({
        rideId,
        senderType,
        senderId,
        replyText: item.text,
      });

      if (res.success) {
        setEnviadoComSucesso(item.id);
        toast.success(`Mensagem enviada: "${item.text}"`);
        setTimeout(() => setEnviadoComSucesso(null), 1800);
      } else {
        toast.info(res.error || "Aguarde um instante antes de enviar.");
      }
    } catch {
      toast.error("Falha ao transmitir mensagem.");
    } finally {
      setEnviandoTexto(null);
    }
  }

  if (replies.length === 0) return null;

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl bg-slate-900/90 dark:bg-slate-950 border border-slate-800/90 p-2 shadow-md backdrop-blur-xs ${className}`}
      aria-label="Respostas rápidas hands-free"
    >
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
            Respostas Rápidas (1 Toque)
          </span>
        </div>

        {onOpenFullChat && (
          <button
            type="button"
            onClick={onOpenFullChat}
            className="text-[10px] font-bold text-[#0088FF] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Abrir chat completo</span>
            {unreadCount > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-pan-x">
        {replies.map((item) => {
          const isEnviando = enviandoTexto === item.id;
          const isEnviado = enviadoComSucesso === item.id;

          return (
            <button
              key={item.id}
              type="button"
              disabled={Boolean(enviandoTexto)}
              onClick={() => void handleDispararResposta(item)}
              className={`h-9 min-h-[36px] px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 disabled:opacity-50 ${
                isEnviado
                  ? "bg-emerald-600 text-white border border-emerald-500 shadow-sm"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600"
              }`}
            >
              {isEnviando ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
              ) : isEnviado ? (
                <Check className="w-3.5 h-3.5 text-white" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
              )}
              <span>{item.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
