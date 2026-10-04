import React, { useState, useCallback, useId } from "react";

export interface RippleItem {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface NativeRippleProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  color?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * NativeRipple — Efeito tátil de onda radial (Material Design 3 Ripple)
 *
 * Fornece feedback visual instantâneo ao toque com expansão orgânica
 * e desvanecimento suave, mantendo a superfície 100% responsiva ao White-Label.
 */
export const NativeRipple: React.FC<NativeRippleProps> = ({
  children,
  color = "currentColor",
  disabled = false,
  className = "",
  onPointerDown,
  ...props
}) => {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const instanceId = useId();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Diâmetro suficiente para cobrir qualquer canto do elemento
      const size = Math.max(rect.width, rect.height) * 2.2;

      const newRipple: RippleItem = {
        id: `${instanceId}-${Date.now()}-${Math.random()}`,
        x,
        y,
        size,
      };

      setRipples((prev) => [...prev, newRipple]);

      if (onPointerDown) {
        onPointerDown(e);
      }
    },
    [disabled, instanceId, onPointerDown]
  );

  const removeRipple = useCallback((id: string) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {children}

      {/* Camada de Ondas Táteis (Ripples) */}
      <span className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            onAnimationEnd={() => removeRipple(ripple.id)}
            style={{
              top: ripple.y - ripple.size / 2,
              left: ripple.x - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
            }}
            className="absolute rounded-full opacity-25 animate-native-ripple pointer-events-none"
          />
        ))}
      </span>
    </div>
  );
};
