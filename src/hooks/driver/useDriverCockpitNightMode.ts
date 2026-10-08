import { useState, useEffect, useCallback } from "react";

export type NightModePreference = "auto" | "night" | "day";

export function useDriverCockpitNightMode() {
  const [preference, setPreferenceState] = useState<NightModePreference>(() => {
    if (typeof window === "undefined") return "auto";
    const saved = localStorage.getItem("partiu_driver_night_mode_pref");
    if (saved === "night" || saved === "day" || saved === "auto") {
      return saved;
    }
    // Suporte retrocompatível ao boolean anterior
    const legacy = localStorage.getItem("partiu_driver_modo_noturno");
    if (legacy === "true") return "night";
    if (legacy === "false") return "day";
    return "auto";
  });

  const isNightHour = () => {
    const hours = new Date().getHours();
    return hours >= 18 || hours < 6;
  };

  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    if (preference === "night") return true;
    if (preference === "day") return false;
    return isNightHour();
  });

  // Atualiza periodicamente se estiver em modo auto
  useEffect(() => {
    function evaluate() {
      if (preference === "night") {
        setIsNightMode(true);
      } else if (preference === "day") {
        setIsNightMode(false);
      } else {
        setIsNightMode(isNightHour());
      }
    }

    evaluate();
    const interval = setInterval(evaluate, 60000); // Checa a cada minuto
    return () => clearInterval(interval);
  }, [preference]);

  const setPreference = useCallback((pref: NightModePreference) => {
    setPreferenceState(pref);
    if (typeof window !== "undefined") {
      localStorage.setItem("partiu_driver_night_mode_pref", pref);
      localStorage.setItem("partiu_driver_modo_noturno", String(pref === "night" || (pref === "auto" && isNightHour())));
    }
  }, []);

  const toggleNightMode = useCallback(() => {
    // Alterna direto entre night e day se o condutor tocar no ícone
    setPreferenceState((prev) => {
      const next: NightModePreference = prev === "night" ? "day" : "night";
      if (typeof window !== "undefined") {
        localStorage.setItem("partiu_driver_night_mode_pref", next);
        localStorage.setItem("partiu_driver_modo_noturno", String(next === "night"));
      }
      return next;
    });
  }, []);

  return {
    isNightMode,
    preference,
    setPreference,
    toggleNightMode,
  };
}
