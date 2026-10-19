import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Car, Package } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

interface ModeTabSelectorProps {
  className?: string;
}

export function ModeTabSelector({ className = "" }: ModeTabSelectorProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { corPrimaria, corTextoPrimaria } = useBrandTheme();

  const isEntrega = pathname.startsWith("/app/encomendas");
  const isCorrida = !isEntrega;

  const handleSelect = (to: "/app" | "/app/encomendas") => {
    hapticFeedback.light();
    void navigate({
      to,
      search: (prev: any) => prev,
    });
  };

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl bg-white/95 backdrop-blur-md shadow-2xs border border-slate-200/80 transition-all pointer-events-auto relative z-30 select-none ${className}`}
      role="tablist"
      aria-label="Modalidade Partiu"
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
          backgroundColor: isCorrida ? corPrimaria || "#FF6B00" : "transparent",
          color: isCorrida ? "#FFFFFF" : undefined,
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none active:scale-95 touch-manipulation ${
          isCorrida
            ? "shadow-2xs text-white"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
        }`}
      >
        <Car className="w-3.5 h-3.5 stroke-[2.2]" />
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
          backgroundColor: isEntrega ? corPrimaria || "#FF6B00" : "transparent",
          color: isEntrega ? "#FFFFFF" : undefined,
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none active:scale-95 touch-manipulation ${
          isEntrega
            ? "shadow-2xs text-white"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
        }`}
      >
        <Package className="w-3.5 h-3.5 stroke-[2.2]" />
        <span>Entrega</span>
      </Link>
    </div>
  );
}
