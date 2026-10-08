/**
 * 🎨 ADMIN DESIGN SYSTEM — TOKENS CENTRAIS
 * Fonte única de verdade para consistência visual em todas as rotas administrativas do PARTIU.
 */

export const adminTokens = {
  colors: {
    // Superfícies principais do painel
    pageBg: "bg-slate-50/60 dark:bg-slate-950",
    pageText: "text-slate-900 dark:text-slate-50",
    cardBg: "bg-white dark:bg-slate-900",
    cardBorder: "border-slate-200/80 dark:border-slate-800",
    cardBorderHover: "hover:border-slate-300 dark:hover:border-slate-700",
    mutedBg: "bg-slate-100/80 dark:bg-slate-800/60",
    sidebarBg: "bg-slate-950",

    // Paleta Semântica para Status e Alertas
    success: {
      solid: "bg-emerald-600 text-white",
      subtle: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60",
      dot: "bg-emerald-500",
      icon: "text-emerald-600 dark:text-emerald-400",
    },
    warning: {
      solid: "bg-amber-500 text-white",
      subtle: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
      dot: "bg-amber-500",
      icon: "text-amber-600 dark:text-amber-400",
    },
    critical: {
      solid: "bg-rose-600 text-white",
      subtle: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
      dot: "bg-rose-500",
      icon: "text-rose-600 dark:text-rose-400",
    },
    info: {
      solid: "bg-blue-600 text-white",
      subtle: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60",
      dot: "bg-blue-500",
      icon: "text-blue-600 dark:text-blue-400",
    },
    neutral: {
      solid: "bg-slate-700 text-white",
      subtle: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dot: "bg-slate-400",
      icon: "text-slate-500 dark:text-slate-400",
    },
    brand: {
      subtle: "bg-primary/10 text-primary border-primary/20",
      solid: "bg-primary text-primary-foreground",
      dot: "bg-primary",
      icon: "text-primary",
    },
  },

  radius: {
    badge: "rounded-full",
    tag: "rounded-md",
    button: "rounded-xl",
    card: "rounded-2xl",
    modal: "rounded-3xl",
    input: "rounded-xl",
  },

  spacing: {
    page: "p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto",
    card: "p-5 sm:p-6",
    cardSm: "p-4",
    grid: "grid gap-4 sm:gap-6",
    flexGap: "gap-3 sm:gap-4",
  },

  typography: {
    pageTitle: "text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight",
    pageSubtitle: "text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1",
    sectionTitle: "text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400",
    cardTitle: "text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100",
    cardSubtitle: "text-xs text-slate-500 dark:text-slate-400",
    kpiValue: "text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight tabular-nums",
    kpiLabel: "text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400",
    body: "text-sm text-slate-600 dark:text-slate-300 leading-relaxed",
    caption: "text-xs text-slate-400 dark:text-slate-500",
  },

  shadows: {
    card: "shadow-xs border",
    cardHover: "hover:shadow-md transition-shadow duration-200",
    elevated: "shadow-lg border",
    modal: "shadow-2xl border",
  },
} as const;
