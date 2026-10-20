import React, { useState } from "react";
import { Navigation, ExternalLink, MapPin, Check } from "lucide-react";

export interface ExternalNavigationButtonProps {
  destinationLat: number;
  destinationLng: number;
  destinationAddress?: string;
  className?: string;
  variant?: "floating" | "button";
}

export function ExternalNavigationButton({
  destinationLat,
  destinationLng,
  destinationAddress,
  className = "",
  variant = "button",
}: ExternalNavigationButtonProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [preferencia, setPreferencia] = useState<string | null>(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("partiu_preferred_navigation_app");
    }
    return null;
  });

  function abrirNavegacao(app: "waze" | "google") {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("partiu_preferred_navigation_app", app);
    }
    setPreferencia(app);

    let url = "";
    if (app === "waze") {
      // Deep link Waze universal
      url = `https://waze.com/ul?ll=${destinationLat},${destinationLng}&navigate=yes`;
    } else {
      // Deep link Google Maps universal
      url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    setModalAberto(false);
  }

  function handleCliquePrincipal() {
    if (preferencia === "waze") {
      abrirNavegacao("waze");
    } else if (preferencia === "google") {
      abrirNavegacao("google");
    } else {
      setModalAberto(true);
    }
  }

  if (variant === "floating") {
    return (
      <>
        <button
          type="button"
          onClick={handleCliquePrincipal}
          onContextMenu={(e) => {
            e.preventDefault();
            setModalAberto(true);
          }}
          className={`h-11 px-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl flex items-center gap-2 border border-blue-400/30 active:scale-95 transition-all cursor-pointer ${className}`}
          title="Abrir no Waze ou Google Maps (Pressione para trocar de aplicativo)"
        >
          <Navigation className="h-4 w-4 shrink-0 fill-current" />
          <span>{preferencia === "waze" ? "Navegar Waze" : preferencia === "google" ? "Google Maps" : "Navegar GPS"}</span>
        </button>

        {modalAberto && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                    <Navigation className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Escolha seu Navegador GPS</h3>
                    <p className="text-[11px] text-slate-400">Direcionamento para rotas reais</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Fechar
                </button>
              </div>

              {destinationAddress && (
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-2 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="truncate text-slate-300">{destinationAddress}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => abrirNavegacao("waze")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${
                    preferencia === "waze"
                      ? "bg-cyan-950/60 border-cyan-500/80 text-cyan-300 ring-2 ring-cyan-500/30"
                      : "bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200"
                  }`}
                >
                  <div className="h-9 w-9 rounded-xl bg-cyan-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md mb-2">
                    W
                  </div>
                  <span className="text-xs font-bold">Waze</span>
                  <span className="text-[10px] text-slate-400">Radares e trânsito</span>
                  {preferencia === "waze" && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-cyan-400 font-bold mt-1">
                      <Check className="h-3 w-3" /> Padrão
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => abrirNavegacao("google")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${
                    preferencia === "google"
                      ? "bg-emerald-950/60 border-emerald-500/80 text-emerald-300 ring-2 ring-emerald-500/30"
                      : "bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200"
                  }`}
                >
                  <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-md mb-2">
                    G
                  </div>
                  <span className="text-xs font-bold">Google Maps</span>
                  <span className="text-[10px] text-slate-400">Rotas e vias</span>
                  {preferencia === "google" && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold mt-1">
                      <Check className="h-3 w-3" /> Padrão
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCliquePrincipal}
      className={`h-9 px-3 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 border border-blue-400/40 active:scale-95 transition-all cursor-pointer ${className}`}
    >
      <Navigation className="h-3.5 w-3.5 fill-current" />
      <span>Navegar GPS</span>
      <ExternalLink className="h-3 w-3 opacity-70" />
    </button>
  );
}
