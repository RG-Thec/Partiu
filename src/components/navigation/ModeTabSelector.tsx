import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Car, Package, CalendarClock } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

interface ModeTabSelectorProps {
  className?: string;
}

export function ModeTabSelector({ className = "" }: ModeTabSelectorProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { corPrimaria, corSecundaria, corTextoPrimaria } = useBrandTheme();

  const isAgendar = pathname.startsWith("/app/agendar");
  const isEntrega = pathname.startsWith("/app/encomendas");
  const isCorrida = !isAgendar && !isEntrega;

  const handleSelect = (to: "/app" | "/app/encomendas" | "/app/agendar") => {
    hapticFeedback.light();
    void navigate({
      to,
      search: (prev: any) => prev,
    });
  };

  const primaryColor = corPrimaria || "#FF6B00";
  const textColor = corTextoPrimaria || "#FFFFFF";

  return (
    <div
      className={`inline-flex items-center p-1 rounded-2xl bg-white/95 backdrop-blur-xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] border border-slate-200/90 transition-all pointer-events-auto relative z-30 select-none ring-1 ring-black/5 ${className}`}
      role="tablist"
      aria-label="Modalidade de Transporte Partiu"
    >
      {/* Aba 1: Corrida */}
      <Link
        to="/app"
        search={(prev: any) => prev}
        role="tab"
        aria-selected={isCorrida}
        onClick={(e) => {
          e.preventDefault();
          handleSelect("/app");
        }}
        style={{
          backgroundColor: isCorrida ? primaryColor : "transparent",
          color: isCorrida ? textColor : undefined,
          boxShadow: isCorrida ? `0 2px 10px ${primaryColor}40` : "none",
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none active:scale-95 touch-manipulation ${
          isCorrida
            ? "text-white"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
        }`}
      >
        <Car className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isCorrida ? "stroke-[2.4]" : "stroke-[2]"}`} />
        <span>Corrida</span>
      </Link>

      {/* Aba 2: Entrega */}
      <Link
        to="/app/encomendas"
        search={(prev: any) => prev}
        role="tab"
        aria-selected={isEntrega}
        onClick={(e) => {
          e.preventDefault();
          handleSelect("/app/encomendas");
        }}
        style={{
          backgroundColor: isEntrega ? primaryColor : "transparent",
          color: isEntrega ? textColor : undefined,
          boxShadow: isEntrega ? `0 2px 10px ${primaryColor}40` : "none",
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none active:scale-95 touch-manipulation ${
          isEntrega
            ? "text-white"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
        }`}
      >
        <Package className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isEntrega ? "stroke-[2.4]" : "stroke-[2]"}`} />
        <span>Entrega</span>
      </Link>

      {/* Aba 3: Agendar */}
      <Link
        to="/app/agendar"
        search={(prev: any) => prev}
        role="tab"
        aria-selected={isAgendar}
        onClick={(e) => {
          e.preventDefault();
          handleSelect("/app/agendar");
        }}
        style={{
          backgroundColor: isAgendar ? primaryColor : "transparent",
          color: isAgendar ? textColor : undefined,
          boxShadow: isAgendar ? `0 2px 10px ${primaryColor}40` : "none",
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none active:scale-95 touch-manipulation ${
          isAgendar
            ? "text-white"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
        }`}
      >
        <CalendarClock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isAgendar ? "stroke-[2.4]" : "stroke-[2]"}`} />
        <span>Agendar</span>
      </Link>
    </div>
  );
}
