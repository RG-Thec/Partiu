/**
 * ==============================================================================
 * 🌐 PARTIU - GOOGLE REAL OAUTH & IDENTITY SERVICE
 * ==============================================================================
 * Autenticação real com o Google via:
 * 1. Supabase Auth OAuth (se Supabase estiver configurado com provedor Google)
 * 2. Google Identity Services (GIS) / Google OAuth 2.0 Web Client com Client ID
 * 3. Validação real de token e perfil via endpoint oficial da Google:
 *    https://www.googleapis.com/oauth2/v3/userinfo
 * ==============================================================================
 */

import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { silentCatchWarn } from "@/lib/structured-logger";

export interface GoogleUserProfile {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified?: boolean;
}

export interface GoogleAuthResult {
  success: boolean;
  user?: GoogleUserProfile;
  error?: string;
  needsClientId?: boolean;
}

const STORAGE_GOOGLE_CLIENT_ID = "partiu_google_client_id";

class GoogleAuthService {
  private static instance: GoogleAuthService;

  private constructor() {}

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Obtém o Client ID do Google configurado (.env ou localStorage)
   */
  public getGoogleClientId(): string | null {
    if (typeof window === "undefined") return null;
    const envId =
      (typeof import.meta !== "undefined" && import.meta.env?.["VITE_GOOGLE_CLIENT_ID"]) ||
      (typeof process !== "undefined" && process.env?.["VITE_GOOGLE_CLIENT_ID"]);

    if (envId && envId.trim() && !envId.includes("SEU_GOOGLE_CLIENT_ID")) {
      return envId.trim();
    }

    try {
      const stored = localStorage.getItem(STORAGE_GOOGLE_CLIENT_ID);
      if (stored && stored.trim()) {
        return stored.trim();
      }
    } catch {
      // storage resiliente
    }

    return null;
  }

  /**
   * Define o Client ID do Google no armazenamento local do navegador
   */
  public setGoogleClientId(clientId: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_GOOGLE_CLIENT_ID, clientId.trim());
    } catch {
      // storage resiliente
    }
  }

  /**
   * Carrega o SDK oficial do Google Identity Services (GIS)
   */
  public async loadGisScript(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if ((window as any).google?.accounts?.id || (window as any).google?.accounts?.oauth2) {
      return true;
    }

    return new Promise((resolve) => {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  /**
   * Decodifica JWT ID Token do Google (sem dependência externa)
   */
  public parseJwtPayload(token: string): GoogleUserProfile | null {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload) as GoogleUserProfile;
    } catch {
      return null;
    }
  }

  /**
   * Busca os dados reais do perfil do Google via Access Token oficial
   */
  public async fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserProfile | null> {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) return null;
      return (await res.json()) as GoogleUserProfile;
    } catch (err) {
      silentCatchWarn("fetchGoogleUserInfo", err);
      return null;
    }
  }

  /**
   * Inicia o fluxo real de autenticação com o Google
   */
  public async signIn(params?: {
    role?: "PASSAGEIRO" | "MOTORISTA";
    redirectUrl?: string;
  }): Promise<GoogleAuthResult> {
    const role = params?.role || "PASSAGEIRO";
    const redirectUrl =
      params?.redirectUrl || (role === "MOTORISTA" ? "/app/motorista" : "/app");

    // 1. Prioridade A: Supabase com Provedor Google configurado
    if (isSupabaseConfigured()) {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const redirectTo = `${origin}/auth?redirect=${encodeURIComponent(redirectUrl)}&role=${role}`;

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });

        if (error) {
          silentCatchWarn("supabase-google-oauth-error", error);
        } else if (data?.url) {
          if (typeof window !== "undefined") {
            window.location.href = data.url;
          }
          return { success: true };
        }
      } catch (err) {
        silentCatchWarn("supabase-google-oauth-catch", err);
      }
    }

    // 2. Prioridade B: Google Identity Services / OAuth 2.0 Direto via Client ID
    const clientId = this.getGoogleClientId();

    if (!clientId) {
      // Dispara evento para abrir modal de configuração do Google Client ID
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("partiu:request_google_client_id", {
            detail: { role, redirectUrl },
          })
        );
      }
      return {
        success: false,
        needsClientId: true,
        error: "Google Client ID não configurado.",
      };
    }

    // Carrega o SDK oficial do Google
    await this.loadGisScript();

    return new Promise((resolve) => {
      try {
        const googleObj = (window as any).google;
        if (googleObj?.accounts?.oauth2) {
          // Usa o Token Client oficial do Google (Abre popup nativo do Google com escolha de contas)
          const client = googleObj.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: "openid profile email",
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                resolve({
                  success: false,
                  error: `Google Login cancelado ou com erro: ${tokenResponse.error}`,
                });
                return;
              }

              if (tokenResponse.access_token) {
                const profile = await this.fetchGoogleUserInfo(tokenResponse.access_token);
                if (profile) {
                  resolve({
                    success: true,
                    user: profile,
                  });
                  return;
                }
              }

              resolve({
                success: false,
                error: "Não foi possível obter os dados do seu perfil Google.",
              });
            },
            error_callback: (err: any) => {
              resolve({
                success: false,
                error: err?.message || "Erro na janela de autenticação do Google.",
              });
            },
          });

          client.requestAccessToken({ prompt: "select_account" });
          return;
        }

        // Fallback para Popup OAuth direto da Google
        const origin = window.location.origin;
        const state = Math.random().toString(36).substring(2);
        const nonce = Math.random().toString(36).substring(2);
        const redirectUri = `${origin}/auth`;

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          clientId
        )}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=token%20id_token&scope=openid%20profile%20email&state=${state}&nonce=${nonce}&prompt=select_account`;

        const width = 500;
        const height = 620;
        const left = Math.max(0, (window.screen.width - width) / 2);
        const top = Math.max(0, (window.screen.height - height) / 2);

        const popup = window.open(
          authUrl,
          "google-oauth-popup",
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
        );

        if (!popup) {
          // Bloqueador de popups ativo: redireciona na mesma aba
          window.location.href = authUrl;
          return;
        }

        // Monitora o popup para capturar a resposta
        const interval = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(interval);
              resolve({ success: false, error: "Janela do Google fechada pelo usuário." });
              return;
            }

            if (popup.location.href.includes(redirectUri)) {
              const hash = popup.location.hash;
              popup.close();
              clearInterval(interval);

              const params = new URLSearchParams(hash.replace(/^#/, ""));
              const accessToken = params.get("access_token");
              const idToken = params.get("id_token");

              if (idToken) {
                const profile = this.parseJwtPayload(idToken);
                if (profile) {
                  resolve({ success: true, user: profile });
                  return;
                }
              }

              if (accessToken) {
                void this.fetchGoogleUserInfo(accessToken).then((profile) => {
                  if (profile) {
                    resolve({ success: true, user: profile });
                  } else {
                    resolve({ success: false, error: "Falha ao ler dados da conta Google." });
                  }
                });
                return;
              }

              resolve({ success: false, error: "Token não retornado pelo Google." });
            }
          } catch {
            // cross-origin esperado enquanto estiver no domínio accounts.google.com
          }
        }, 500);
      } catch (err: any) {
        resolve({
          success: false,
          error: err?.message || "Não foi possível abrir o Google Login.",
        });
      }
    });
  }
}

export const googleAuthService = GoogleAuthService.getInstance();
