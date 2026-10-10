/**
 * Armazenamento de sessão de autenticação do Supabase.
 * Retorna localStorage no cliente ou undefined em ambiente server-side (SSR).
 */
export function brokeredPreviewStorage() {
  if (typeof window === "undefined") return undefined;
  return typeof localStorage !== "undefined" ? localStorage : undefined;
}
