import React, { useState, useEffect, memo } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
import { driverAudioHudEngine } from "@/lib/driver/audio-hud-engine";

interface AudioHudToggleProps {
  className?: string;
}

export const AudioHudToggle: React.FC<AudioHudToggleProps> = memo(({ className = "" }) => {
  const [enabled, setEnabled] = useState(() => driverAudioHudEngine.isAudioHudEnabled());
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const unsub = driverAudioHudEngine.subscribeSpeaking((isSpk) => {
      setSpeaking(isSpk);
    });
    return unsub;
  }, []);

  const handleToggle = () => {
    const next = !enabled;
    driverAudioHudEngine.setAudioHudEnabled(next);
    setEnabled(next);
    if (next) {
      driverAudioHudEngine.speak("Áudio HUD ativado");
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`relative flex items-center justify-center p-2 rounded-xl transition-all shadow-md active:scale-95 ${
        enabled
          ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
          : "bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-slate-200"
      } ${className}`}
      title={enabled ? "Áudio HUD Ativado (Clique para desativar)" : "Áudio HUD Desativado (Clique para ativar)"}
      aria-label="Controle de Áudio HUD"
    >
      {enabled ? (
        <Volume2 className={`w-4 h-4 stroke-[2.5] ${speaking ? "animate-pulse text-emerald-300" : ""}`} />
      ) : (
        <VolumeX className="w-4 h-4 stroke-[2]" />
      )}

      {speaking && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      )}
    </button>
  );
});

AudioHudToggle.displayName = "AudioHudToggle";
