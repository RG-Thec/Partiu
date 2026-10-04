import React, { memo } from "react";
import { Bell } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { PartiuLogo } from "@/components/common/PartiuLogo";

export interface HeaderProps {
  /** Nome do usuário para exibição personalizada */
  userName?: string;
  /** URL da foto de perfil do usuário */
  avatarUrl?: string;
  /** Nome dinâmico do aplicativo (caso queira sobrescrever o do branding) */
  appName?: string;
  /** Callback para abrir o menu lateral (Drawer) */
  onOpenDrawer?: () => void;
  /** Callback para abrir a central de notificações */
  onOpenNotifications?: () => void;
  /** Se há notificações não lidas para o badge de alerta */
  hasUnreadNotifications?: boolean;
  /** Quantidade exata de notificações não lidas para badge numérico */
  unreadCount?: number;
  /** Insets para safe area customizada (opcional) */
  insets?: { top?: number; bottom?: number; left?: number; right?: number };
  /** Classes CSS adicionais */
  className?: string;
  /** Estilos inline customizados */
  style?: React.CSSProperties;
}

/**
 * Header Slim-Balanced — PARTIU Mobilidade Urbana
 * Alinhado com 100% de fidelidade com Lealt Recomendado/2.png:
 * 1. Esquerda: Avatar circular (40x40) com borda e sombra sutil.
 * 2. Centro: Logotipo vetorial oficial PartiuLogo com símbolo aerodinâmico e wordmark.
 * 3. Direita: Sino de notificações com badge numérico em tempo real.
 */
export const Header = memo(function Header({
  userName,
  avatarUrl,
  appName,
  onOpenDrawer,
  onOpenNotifications,
  hasUnreadNotifications = false,
  unreadCount = 0,
  insets,
  className = "",
  style,
}: HeaderProps) {
  const { nomeApp, sloganApp, corPrimaria, corSecundaria } = useBrandTheme();
  const nomeExibicao = (userName || "Passageiro").trim();
  const primeiroNome = nomeExibicao.split(/\s+/)[0] || "Passageiro";
  const iniciais = primeiroNome.substring(0, 2).toUpperCase();

  // Padding superior seguro (respeita safe-area-inset-top de dispositivos móveis)
  const safeTopPadding = insets?.top
    ? `${insets.top + 10}px`
    : "max(0.75rem, calc(env(safe-area-inset-top, 0px) + 10px))";

  const hasUnread = unreadCount > 0 || hasUnreadNotifications;

  const [imgFailed, setImgFailed] = React.useState(false);

  React.useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  // Foto do passageiro (com fallback oficial de demonstração de alta qualidade)
  const effectiveAvatar = !imgFailed
    ? (avatarUrl || (typeof window !== "undefined" ? localStorage.getItem("partiu_user_avatar") : null) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
    : null;

  return (
    <header
      className={`absolute top-0 inset-x-0 z-30 w-full select-none pointer-events-none px-3.5 pt-[max(0.6rem,calc(env(safe-area-inset-top,0px)+6px))] pb-1.5 ${className}`}
      style={style}
      aria-label="Cabeçalho Principal"
    >
      <div
        className="w-full max-w-lg mx-auto flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/92 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] pointer-events-auto"
      >
      {/* ===================================================================== */}
      {/* 1. SEÇÃO ESQUERDA: AVATAR CIRCULAR COM FOTO DO PASSAGEIRO            */}
      {/* ===================================================================== */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="w-9 h-9 rounded-full border border-slate-200/90 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
          style={{
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
          aria-label="Abrir Menu Lateral e Perfil"
          title={`Perfil de ${nomeExibicao}`}
        >
          {effectiveAvatar ? (
            <img
              src={effectiveAvatar}
              alt={nomeExibicao}
              className="w-full h-full object-cover rounded-full"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-bold text-[10px]"
              style={{
                backgroundColor: `${corPrimaria || "#FF6B00"}18`,
                color: corPrimaria || "#FF6B00",
              }}
            >
              {iniciais}
            </div>
          )}
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 2. SEÇÃO CENTRAL: LOGOTIPO VETORIAL MODERNO SEGUINDO O PAINEL ADMIN    */}
      {/* ===================================================================== */}
      <div className="flex-1 flex items-center justify-center px-2">
        <PartiuLogo
          variant="full"
          size="sm"
          appName={appName || nomeApp || "PARTIU"}
          tagline={sloganApp || "MAIS MOBILIDADE PARA VOCÊ"}
          primaryColor={corPrimaria || "#FF6B00"}
          secondaryColor={corSecundaria || "#FFB800"}
          className="transition-transform hover:scale-102"
        />
      </div>

      {/* ===================================================================== */}
      {/* 3. SEÇÃO DIREITA: ÍCONE DE NOTIFICAÇÃO COM BADGE NUMÉRICO VERMELHO     */}
      {/* ===================================================================== */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onOpenNotifications}
          className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center relative shrink-0 cursor-pointer text-slate-700 hover:bg-slate-100 hover:text-brand-primary-vibrant active:scale-95 transition-all shadow-2xs"
          aria-label="Notificações"
          title="Notificações"
        >
          <Bell className="w-4 h-4 stroke-[1.8]" />

          {/* Badge Vermelho com quantidade não lida */}
          {hasUnread && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[13px] h-[13px] px-0.5 rounded-full bg-rose-600 text-white text-[8.5px] font-bold flex items-center justify-center ring-1.5 ring-white leading-none animate-pulse"
              aria-hidden="true"
            >
              {unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : ""}
            </span>
          )}
        </button>
      </div>
      </div>
    </header>
  );
});

export default Header;
