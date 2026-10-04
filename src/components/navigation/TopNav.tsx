import { Link } from "@tanstack/react-router";
import { ArrowRight, Zap } from "lucide-react";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";

export function TopNav() {
  const { appConfig } = useTheme();
  const { colors, ui, appName } = appConfig.branding;

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-xl border-b border-border px-3 sm:px-4 py-1.5 shadow-2xs">
      <div className="mx-auto flex w-full max-w-full sm:max-w-4xl items-center justify-between gap-2.5">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer">
          <div
            style={{
              borderRadius: ui.borderRadius,
              backgroundColor: colors.primary,
              color: "#FFFFFF",
            }}
            className="h-7.5 w-7.5 flex items-center justify-center font-black text-xs shadow-2xs"
          >
            <Zap className="h-3.5 w-3.5 fill-current stroke-[2.5]" />
          </div>
          <div className="leading-tight">
            <p className="text-xs sm:text-sm font-extrabold tracking-tight text-foreground uppercase">
              {appName}{" "}
              <span style={{ color: colors.primary }} className="font-extrabold">
                MOBILIDADE
              </span>
            </p>
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground block">
              Corridas &amp; entregas flash
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/app/motorista"
            className="min-h-[28px] h-7.5 flex items-center bg-muted/80 hover:bg-muted px-2.5 py-1 text-xs font-medium text-foreground transition-colors cursor-pointer active:scale-95 border border-border rounded-lg"
          >
            Motorista parceiro
          </Link>
          <Link
            to="/app"
            style={{
              backgroundColor: colors.primary,
              color: "#FFFFFF",
            }}
            className="min-h-[28px] h-7.5 flex items-center gap-1 px-3 py-1 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer hover:opacity-95 rounded-lg"
          >
            <span>Pedir agora</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default TopNav;
