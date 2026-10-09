import { useEffect } from "react";

export type NightModePreference = "day";

/**
 * Hook de Modo Noturno do Cockpit do Motorista.
 * Travado estritamente em Modo Claro (Light Mode) absoluto para conformidade com a paleta White-Label.
 */
export function useDriverCockpitNightMode() {
  // Purga preferências legadas do localStorage para evitar ressurgimento do modo escuro
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("partiu_driver_modo_noturno");
        localStorage.setItem("partiu_driver_night_mode_pref", "day");
      } catch {}
    }
  }, []);

  return {
    isNightMode: false,
    preference: "day" as NightModePreference,
    setPreference: (_pref: NightModePreference) => {},
    toggleNightMode: () => {},
  };
}
