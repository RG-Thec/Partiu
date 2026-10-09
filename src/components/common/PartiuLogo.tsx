import React, { memo } from "react";

export interface PartiuLogoProps {
  className?: string;
  variant?: "full" | "compact" | "icon";
  size?: "sm" | "md" | "lg" | "xl";
  appName?: string;       // Nome da marca configurado no painel admin (padrão PARTIU)
  tagline?: string;       // Slogan/tagline configurado no painel admin (padrão MAIS MOBILIDADE PARA VOCÊ)
  primaryColor?: string;  // Cor primária do símbolo aerodinâmico (padrão #FF6B00 Laranja)
  secondaryColor?: string;// Cor secundária do texto da marca (padrão #FFB800 Amarelo)
  accentColor?: string;   // Suporte retrocompatível
}

/**
 * ⚡ PARTIU LOGO — LOGOTIPO VETORIAL OFICIAL DE ALTA PRECISÃO (100% SEM IMAGEM)
 * ==============================================================================
 * Renderiza o logotipo oficial moderno do PARTIU com pureza vetorial e reatividade total:
 * 1. Símbolo "P" Aerodinâmico de Velocidade com 2 frisos e haste de aceleração.
 * 2. Wordmark tipográfico de alto impacto que segue dinamicamente o nome da plataforma
 *    configurado no Painel Administrativo.
 * 3. Subtítulo institucional/slogan dinâmico que segue a configuração do painel.
 * 4. Paleta de cores moderna: Símbolo em Laranja (#FF6B00) e Tipografia em Amarelo (#FFB800)
 *    com total personalização via White Label e Supabase Realtime.
 * ==============================================================================
 */
export const PartiuLogo = memo(function PartiuLogo({
  className = "",
  variant = "full",
  size = "md",
  appName,
  tagline,
  primaryColor,
  secondaryColor,
  accentColor,
}: PartiuLogoProps) {
  // Configuração de altura base conforme tamanho
  const heightMap = {
    sm: 24,
    md: 32,
    lg: 42,
    xl: 54,
  };

  const targetHeight = heightMap[size] || 32;

  // Resolução de cores dinâmicas da marca (Padrão Oficial: #FF6B00 e #FFB800)
  const symbolColor = primaryColor || "var(--brand-primary-vibrant, var(--color-primary, #FF6B00))";
  const textColor = secondaryColor || accentColor || "var(--brand-primary-accent, var(--color-secondary, #FFB800))";
  const taglineColor = secondaryColor || accentColor || "var(--brand-primary-accent, var(--color-secondary, #FFB800))";

  // Textos dinâmicos que seguem o Painel Administrativo
  const displayAppName = (appName || "PARTIU").trim();
  const displayTagline = tagline !== undefined ? tagline : "MAIS MOBILIDADE PARA VOCÊ";

  // 1. Variante ÍCONE (Apenas o símbolo "P" aerodinâmico de velocidade)
  if (variant === "icon") {
    return (
      <svg
        width={Math.round(targetHeight * 0.95)}
        height={targetHeight}
        viewBox="0 0 54 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        aria-label={`${displayAppName} Ícone de Velocidade`}
      >
        {/* Friso superior de velocidade com curvatura aerodinâmica */}
        <path
          d="M6 11C6 8.79 7.79 7 10 7H34C42.28 7 49 13.72 49 22C49 30.28 42.28 37 34 37H24C21.79 37 20 35.21 20 33C20 30.79 21.79 29 24 29H34C37.87 29 41 25.87 41 22C41 18.13 37.87 15 34 15H10C7.79 15 6 13.21 6 11Z"
          fill={symbolColor}
        />
        {/* Friso intermediário de velocidade */}
        <path
          d="M2 22C2 19.79 3.79 18 6 18H26C28.21 18 30 19.79 30 22C30 24.21 28.21 26 26 26H6C3.79 26 2 24.21 2 22Z"
          fill={symbolColor}
        />
        {/* Haste inferior de aceleração */}
        <path
          d="M18 29L10 43C9.1 44.6 7.2 45.5 5.3 45C3.1 44.4 1.9 42 2.8 40L9 29H18Z"
          fill={symbolColor}
        />
      </svg>
    );
  }

  // 2. Variante COMPACTA (Símbolo + Nome configurado sem subtítulo)
  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <svg
          width={Math.round(targetHeight * 0.95)}
          height={targetHeight}
          viewBox="0 0 54 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
          aria-hidden="true"
        >
          <path
            d="M6 11C6 8.79 7.79 7 10 7H34C42.28 7 49 13.72 49 22C49 30.28 42.28 37 34 37H24C21.79 37 20 35.21 20 33C20 30.79 21.79 29 24 29H34C37.87 29 41 25.87 41 22C41 18.13 37.87 15 34 15H10C7.79 15 6 13.21 6 11Z"
            fill={symbolColor}
          />
          <path
            d="M2 22C2 19.79 3.79 18 6 18H26C28.21 18 30 19.79 30 22C30 24.21 28.21 26 26 26H6C3.79 26 2 24.21 2 22Z"
            fill={symbolColor}
          />
          <path
            d="M18 29L10 43C9.1 44.6 7.2 45.5 5.3 45C3.1 44.4 1.9 42 2.8 40L9 29H18Z"
            fill={symbolColor}
          />
        </svg>

        <span
          style={{
            color: textColor,
            fontSize: targetHeight * 0.68,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
          className="tracking-tight uppercase font-black"
        >
          {displayAppName}
        </span>
      </div>
    );
  }

  // 3. Variante COMPLETA (Símbolo + Nome configurado + Tagline configurada — 100% Sem Imagem)
  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      role="banner"
      aria-label={`${displayAppName} — ${displayTagline}`}
    >
      {/* SÍMBOLO AERODINÂMICO VETORIAL */}
      <svg
        width={Math.round(targetHeight * 0.95)}
        height={targetHeight}
        viewBox="0 0 54 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M6 11C6 8.79 7.79 7 10 7H34C42.28 7 49 13.72 49 22C49 30.28 42.28 37 34 37H24C21.79 37 20 35.21 20 33C20 30.79 21.79 29 24 29H34C37.87 29 41 25.87 41 22C41 18.13 37.87 15 34 15H10C7.79 15 6 13.21 6 11Z"
          fill={symbolColor}
        />
        <path
          d="M2 22C2 19.79 3.79 18 6 18H26C28.21 18 30 19.79 30 22C30 24.21 28.21 26 26 26H6C3.79 26 2 24.21 2 22Z"
          fill={symbolColor}
        />
        <path
          d="M18 29L10 43C9.1 44.6 7.2 45.5 5.3 45C3.1 44.4 1.9 42 2.8 40L9 29H18Z"
          fill={symbolColor}
        />
      </svg>

      {/* BLOCO TIPOGRÁFICO GEOMÉTRICO DINÂMICO */}
      <div className="flex flex-col justify-center leading-none text-left">
        <span
          style={{
            color: textColor,
            fontSize: targetHeight * 0.65,
            fontWeight: 900,
            letterSpacing: "-0.015em",
            lineHeight: 1,
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
          className="font-black uppercase tracking-tight"
        >
          {displayAppName}
        </span>

        {displayTagline && (
          <span
            style={{
              color: taglineColor,
              fontSize: Math.max(6.5, targetHeight * 0.19),
              fontWeight: 800,
              letterSpacing: "0.16em",
              lineHeight: 1,
              marginTop: 3,
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              opacity: 0.95,
            }}
            className="uppercase font-bold tracking-widest whitespace-nowrap"
          >
            {displayTagline}
          </span>
        )}
      </div>
    </div>
  );
});

export default PartiuLogo;
