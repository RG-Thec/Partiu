import React, { useState } from "react";
import { Star, X, Check, Heart, ThumbsUp, ShieldCheck, UserX, ShieldAlert } from "lucide-react";
import {
  rideRatingService,
  type RatingRole,
  TAGS_99_PASSENGER_TO_DRIVER_POSITIVE,
  TAGS_99_PASSENGER_TO_DRIVER_IMPROVEMENT,
  TAGS_99_DRIVER_TO_PASSENGER,
} from "@/services/RideRatingService";
import {
  driverBlacklistEngine,
  BLACKLIST_REASON_LABELS,
  type BlacklistReasonCode,
} from "@/lib/driver/driver-blacklist-engine";
import { toast } from "sonner";

export interface RideRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  targetName: string;
  targetPhoto?: string;
  role: RatingRole;
  onSubmitted?: () => void;
}

export const RideRatingModal: React.FC<RideRatingModalProps> = ({
  isOpen,
  onClose,
  rideId,
  fromUserId,
  toUserId,
  targetName,
  targetPhoto,
  role,
  onSubmitted,
}) => {
  const [score, setScore] = useState<number>(5);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Estados de Bloqueio Soberano Mútuo (Padrão 99 Blacklist)
  const [blockUserChecked, setBlockUserChecked] = useState(false);
  const [blockReasonCode, setBlockReasonCode] =
    useState<BlacklistReasonCode>("INAPPROPRIATE_BEHAVIOR");

  if (!isOpen) return null;

  const isPassengerEvaluatingDriver = role === "PASSENGER_TO_DRIVER";

  const availableTags = isPassengerEvaluatingDriver
    ? score >= 4
      ? TAGS_99_PASSENGER_TO_DRIVER_POSITIVE
      : TAGS_99_PASSENGER_TO_DRIVER_IMPROVEMENT
    : TAGS_99_DRIVER_TO_PASSENGER;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Processa bloqueio mútuo se solicitado
      if (blockUserChecked) {
        if (role === "DRIVER_TO_PASSENGER") {
          driverBlacklistEngine.blockPassenger({
            driverId: fromUserId,
            passengerId: toUserId,
            passengerName: targetName,
            rideId,
            reasonCode: blockReasonCode,
            reasonDetails: comment.trim() || undefined,
            blockedAt: Date.now(),
          });
          toast.success(
            `Passageiro ${targetName} bloqueado com sucesso. Você não receberá mais chamadas deste usuário.`,
          );
        } else {
          driverBlacklistEngine.blockDriverByPassenger({
            passengerId: fromUserId,
            driverId: toUserId,
            driverName: targetName,
            rideId,
            reason: comment.trim() || undefined,
            blockedAt: Date.now(),
          });
          toast.success(
            `Motorista parceiro ${targetName} bloqueado. Você não será mais pareado em viagens com ele.`,
          );
        }
      }

      // 2. Submete a avaliação no serviço de reputação
      await rideRatingService.submitRating({
        rideId,
        fromUserId,
        toUserId,
        role,
        score,
        tags: Array.from(selectedTags),
        comment: comment.trim() || undefined,
      });

      setSubmittedSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedSuccess(false);
        onSubmitted?.();
        onClose();
      }, 1400);
    } catch {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Cabeçalho Decorativo */}
        <div className="px-6 pt-6 pb-2 text-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Foto ou Avatar do Avaliado */}
          <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-400 to-brand-primary-vibrant shadow-lg mb-3">
            {targetPhoto ? (
              <img
                src={targetPhoto}
                alt={targetName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-800 text-white font-black text-xl flex items-center justify-center">
                {targetName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Como foi sua corrida com {targetName}?
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Sua avaliação anônima ajuda a manter o alto padrão de segurança do PARTIU.
          </p>
        </div>

        {submittedSuccess ? (
          <div className="py-12 px-6 text-center space-y-3 animate-in zoom-in-90 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h4 className="text-base font-black text-slate-900">Avaliação Enviada</h4>
            <p className="text-xs text-slate-500">Obrigado por ajudar a comunidade PARTIU.</p>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Seletor de 5 Estrelas */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverScore ?? score) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setScore(star);
                      if (star <= 2) {
                        setBlockUserChecked(true);
                      }
                    }}
                    onMouseEnter={() => setHoverScore(star)}
                    onMouseLeave={() => setHoverScore(null)}
                    aria-label={`${star} estrelas`}
                    className="p-1 focus:outline-none transition-transform hover:scale-125 active:scale-95 cursor-pointer"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        isFilled
                          ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                          : "fill-slate-100 text-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="text-center">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {score === 5 && "Excelente experiência"}
                {score === 4 && "Muito boa"}
                {score === 3 && "Regular"}
                {score === 2 && "Ruim"}
                {score === 1 && "Insatisfatória"}
              </span>
            </div>

            {/* Chips com Tags Qualitativas da 99 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {score >= 4 ? "O que você mais gostou?" : "O que pode melhorar?"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-400 text-slate-950 border-amber-400 shadow-xs scale-105 font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comentário Opcional */}
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Conte mais sobre sua viagem (opcional)..."
                maxLength={300}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-brand-primary-vibrant focus:ring-2 focus:ring-brand-primary-vibrant/20 transition resize-none"
              />
            </div>

            {/* =============================================================== */}
            {/* BLOQUEIO SOBERANO MÚTUO PÓS-CORRIDA (PADRÃO 99 / UBER BLACKLIST) */}
            {/* =============================================================== */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                blockUserChecked
                  ? "bg-rose-50/80 border-rose-300 shadow-sm"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockUserChecked}
                  onChange={(e) => setBlockUserChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer accent-rose-600"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <UserX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {role === "DRIVER_TO_PASSENGER"
                        ? "Bloquear passageiro"
                        : "Não viajar mais com este motorista"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {role === "DRIVER_TO_PASSENGER"
                      ? "Você não receberá mais solicitações deste usuário. Sua taxa de aceitação não será afetada."
                      : "O sistema evitará parear novas viagens com este condutor parceiro."}
                  </p>
                </div>
              </label>

              {blockUserChecked && role === "DRIVER_TO_PASSENGER" && (
                <div className="pt-2.5 mt-2 border-t border-rose-200/80 space-y-1.5 animate-in fade-in duration-150">
                  <span className="text-[10.5px] font-bold text-rose-950 uppercase tracking-tight block">
                    Motivo do bloqueio:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(BLACKLIST_REASON_LABELS) as BlacklistReasonCode[]).map(
                      (code) => {
                        const isSelected = blockReasonCode === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setBlockReasonCode(code)}
                            className={`p-2 rounded-xl text-[11px] font-bold border text-left transition cursor-pointer ${
                              isSelected
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                : "bg-white border-rose-200 text-rose-950 hover:bg-rose-100/60"
                            }`}
                          >
                            {BLACKLIST_REASON_LABELS[code]}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-brand-primary-vibrant to-brand-primary-deep hover:brightness-105 text-white font-black text-sm shadow-md active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? "Enviando..." : "Confirmar Avaliação"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                Pular avaliação
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
