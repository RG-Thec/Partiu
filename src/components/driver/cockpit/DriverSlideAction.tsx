import React, { useState, useRef, useEffect, memo } from "react";
import { ArrowRight, Check } from "lucide-react";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

export interface DriverSlideActionProps {
  label: string;
  confirmedLabel?: string;
  onConfirm: () => void;
  gradient?: string;
  thumbColor?: string;
  icon?: React.ReactNode;
  confirmedIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const DriverSlideAction = memo(function DriverSlideAction({
  label,
  confirmedLabel = "✓ AÇÃO CONFIRMADA",
  onConfirm,
  gradient = "linear-gradient(90deg, #10B981 0%, #059669 100%)",
  thumbColor = "#FFFFFF",
  icon = <ArrowRight className="w-5 h-5 stroke-[2.8]" />,
  confirmedIcon = <Check className="w-5 h-5 stroke-[3]" />,
  disabled = false,
  className = "",
}: DriverSlideActionProps) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleComplete = () => {
    if (isConfirmed || disabled) return;
    setIsConfirmed(true);
    hapticFeedback.heavy();
    onConfirm();
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !sliderRef.current || isConfirmed || disabled) return;
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const rect = sliderRef.current.getBoundingClientRect();
      const maxSlide = rect.width - 64;
      const currentOffset = Math.max(0, Math.min(clientX - rect.left - 24, maxSlide));
      setSliderPosition(currentOffset);

      if (Math.round(currentOffset) % 25 === 0) {
        hapticFeedback.selection();
      }

      if (currentOffset >= maxSlide * 0.85) {
        isDragging.current = false;
        setSliderPosition(maxSlide);
        handleComplete();
      }
    };

    const handleEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (!isConfirmed) {
        setSliderPosition(0);
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isConfirmed, disabled]);

  return (
    <div
      ref={sliderRef}
      style={{
        background: gradient,
      }}
      className={`relative w-full h-14 min-h-[56px] p-2 flex items-center justify-center select-none overflow-hidden rounded-2xl shadow-lg transition active:scale-[0.99] touch-none ${
        disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
      } ${className}`}
    >
      {/* Rótulo Central */}
      <span className="font-black text-xs sm:text-sm text-white uppercase tracking-wider pl-9 pointer-events-none drop-shadow-xs">
        {isConfirmed ? confirmedLabel : label}
      </span>

      {/* Botão Deslizante com Seta / Ícone */}
      <div
        onMouseDown={(e) => {
          if (disabled || isConfirmed) return;
          e.preventDefault();
          isDragging.current = true;
        }}
        onTouchStart={() => {
          if (disabled || isConfirmed) return;
          isDragging.current = true;
        }}
        style={{
          transform: `translateX(${sliderPosition}px)`,
          transition: isDragging.current ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          backgroundColor: thumbColor,
        }}
        className="absolute left-2 top-2 bottom-2 w-11 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition cursor-grab active:cursor-grabbing text-slate-900"
      >
        {isConfirmed ? confirmedIcon : icon}
      </div>
    </div>
  );
});
