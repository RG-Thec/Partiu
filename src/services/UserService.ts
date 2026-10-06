/**
 * ==============================================================================
 * 👤 PARTIU REVENUE OS — USER & PROFILE SERVICE
 * ==============================================================================
 * Gerenciamento centralizado do perfil do passageiro, sessão ativa do Supabase,
 * preferências de viagem com debounce, e upload de avatar no Supabase Storage.
 * ==============================================================================
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { supabaseAuthService, type AuthUserProfile } from "@/lib/auth/supabase-auth-service";
import { silentCatchWarn } from "@/lib/structured-logger";


export interface UserPreferences {
  prefPushNotifications: boolean;
  prefSoundsHaptics: boolean;
  prefAc: boolean;
  prefQuietTrip: boolean;
  prefRequirePin: boolean;
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  avatarUrl: string;
  rating: number;
  totalTrips: number;
  preferences: UserPreferences;
}

const STORAGE_PREFERENCES_KEY = "partiu_user_preferences_v1";

const DEFAULT_PROFILE: UserProfileData = {
  id: "",
  name: "Passageiro",
  email: "",
  phone: "",
  cpf: "",
  avatarUrl: "",
  rating: 5.0,
  totalTrips: 0,
  preferences: {
    prefPushNotifications: true,
    prefSoundsHaptics: true,
    prefAc: true,
    prefQuietTrip: false,
    prefRequirePin: true,
  },
};

export class UserService {
  private static instance: UserService;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Recupera o perfil completo do usuário atual mesclando sessão, banco e cache local
   */
  public async getCurrentUserProfile(): Promise<UserProfileData> {
    let session = supabaseAuthService.getStoredSession();
    if (!session && isSupabaseConfigured()) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          session = await supabaseAuthService.checkAndHydrateSession();
        }
      } catch {}
    }

    const localName = typeof window !== "undefined" ? localStorage.getItem("partiu_user_nome") : null;
    const localAvatar = typeof window !== "undefined"
      ? localStorage.getItem("partiu_user_avatar") ||
        localStorage.getItem("partiu_user_foto") ||
        localStorage.getItem("partiu_user_selfie")
      : null;
    const localPhone = typeof window !== "undefined"
      ? localStorage.getItem("partiu_user_phone") || localStorage.getItem("partiu_user_telefone")
      : null;
    const localCpf = typeof window !== "undefined" ? localStorage.getItem("partiu_user_cpf") : null;
    const localEmail = typeof window !== "undefined" ? localStorage.getItem("partiu_user_email") : null;

    const sessionName = session?.name && session.name !== "Passageiro" ? session.name : null;
    const sessionEmail = session?.email || null;
    const sessionPhone = session?.phone || null;
    const sessionCpf = session?.cpf || null;
    const sessionAvatar = session?.avatarUrl || null;

    let base: UserProfileData = {
      ...DEFAULT_PROFILE,
      id: session?.id || DEFAULT_PROFILE.id,
      name:
        sessionName ||
        (localName && localName !== "Passageiro" ? localName : null) ||
        session?.name ||
        localName ||
        DEFAULT_PROFILE.name,
      email: sessionEmail || localEmail || DEFAULT_PROFILE.email,
      phone: sessionPhone || localPhone || DEFAULT_PROFILE.phone,
      cpf: sessionCpf || localCpf || DEFAULT_PROFILE.cpf,
      avatarUrl: sessionAvatar || localAvatar || DEFAULT_PROFILE.avatarUrl,
      rating: session?.rating || DEFAULT_PROFILE.rating,
      totalTrips: session?.totalTrips || DEFAULT_PROFILE.totalTrips,
      preferences: this.getStoredPreferences(),
    };

    if (!isSupabaseConfigured()) {
      return base;
    }

    try {
      const targetUserId = session?.id;
      if (targetUserId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);

        const fetchRemote = async (): Promise<{ paxData: any; profData: any }> => {
          let query = (supabase as any).from("partiu_passageiros").select("*");
          if (isUuid) {
            query = query.or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`);
          } else {
            query = query.eq("user_id", targetUserId);
          }
          const { data: paxData } = await query.maybeSingle();
          if (paxData) return { paxData, profData: null };

          if (isUuid) {
            const { data: profData } = await (supabase as any)
              .from("profiles")
              .select("*")
              .eq("id", targetUserId)
              .maybeSingle();
            return { paxData: null, profData };
          }
          return { paxData: null, profData: null };
        };

        const timeoutPromise = new Promise<{ paxData: any; profData: any }>((resolve) =>
          setTimeout(() => resolve({ paxData: null, profData: null }), 2000)
        );

        const { paxData, profData } = await Promise.race([fetchRemote(), timeoutPromise]);

        if (paxData) {
          base = {
            ...base,
            name: (paxData.nome && paxData.nome !== "Passageiro" ? paxData.nome : null) || base.name,
            phone: paxData.telefone || base.phone,
            cpf: paxData.cpf || base.cpf,
            email: paxData.email || base.email,
            avatarUrl: paxData.foto_url || base.avatarUrl,
            rating: paxData.rating ? Number(paxData.rating) : base.rating,
            totalTrips: paxData.total_viagens || base.totalTrips,
            preferences: {
              prefPushNotifications: paxData.pref_push_notifications ?? base.preferences.prefPushNotifications,
              prefSoundsHaptics: paxData.pref_sounds_haptics ?? base.preferences.prefSoundsHaptics,
              prefAc: paxData.pref_ac ?? base.preferences.prefAc,
              prefQuietTrip: paxData.pref_quiet_trip ?? base.preferences.prefQuietTrip,
              prefRequirePin: paxData.pref_require_pin ?? base.preferences.prefRequirePin,
            },
          };
          if (base.avatarUrl && typeof window !== "undefined") {
            try {
              localStorage.setItem("partiu_user_avatar", base.avatarUrl);
              localStorage.setItem("partiu_user_foto", base.avatarUrl);
              localStorage.setItem("partiu_user_selfie", base.avatarUrl);
            } catch {}
          }
          if (base.name && base.name !== "Passageiro" && typeof window !== "undefined") {
            try { localStorage.setItem("partiu_user_nome", base.name); } catch {}
          }
          if (base.phone && typeof window !== "undefined") {
            try {
              localStorage.setItem("partiu_user_phone", base.phone);
              localStorage.setItem("partiu_user_telefone", base.phone);
            } catch {}
          }
          if (base.cpf && typeof window !== "undefined") {
            try { localStorage.setItem("partiu_user_cpf", base.cpf); } catch {}
          }
          if (base.email && typeof window !== "undefined") {
            try { localStorage.setItem("partiu_user_email", base.email); } catch {}
          }
          this.saveStoredPreferences(base.preferences);
          return base;
        }

        if (profData) {
          base = {
            ...base,
            name: (profData.full_name && profData.full_name !== "Passageiro" ? profData.full_name : null) || base.name,
            phone: profData.phone || base.phone,
            cpf: profData.cpf || base.cpf,
            avatarUrl: profData.avatar_url || base.avatarUrl,
          };
          if (base.avatarUrl && typeof window !== "undefined") {
            try {
              localStorage.setItem("partiu_user_avatar", base.avatarUrl);
              localStorage.setItem("partiu_user_foto", base.avatarUrl);
              localStorage.setItem("partiu_user_selfie", base.avatarUrl);
            } catch {}
          }
          if (base.name && base.name !== "Passageiro" && typeof window !== "undefined") {
            try { localStorage.setItem("partiu_user_nome", base.name); } catch {}
          }
          if (base.phone && typeof window !== "undefined") {
            try {
              localStorage.setItem("partiu_user_phone", base.phone);
              localStorage.setItem("partiu_user_telefone", base.phone);
            } catch {}
          }
          if (base.cpf && typeof window !== "undefined") {
            try { localStorage.setItem("partiu_user_cpf", base.cpf); } catch {}
          }
          if (base.email && typeof window !== "undefined") {
            try { localStorage.setItem("partiu_user_email", base.email); } catch {}
          }
        }
      }
    } catch (err) { silentCatchWarn("UserService", err); }

    return base;
  }

  /**
   * Atualização com formulário funcional (PATCH / UPDATE)
   */
  public async updateUserProfile(data: {
    name: string;
    phone: string;
    cpf?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const session = supabaseAuthService.getStoredSession();
    const userId = session?.id || DEFAULT_PROFILE.id;

    // 1. Atualiza cache local instantâneo
    if (typeof window !== "undefined") {
      if (data.name) localStorage.setItem("partiu_user_nome", data.name);
      if (data.phone) {
        localStorage.setItem("partiu_user_phone", data.phone);
        localStorage.setItem("partiu_user_telefone", data.phone);
      }
      if (data.cpf) localStorage.setItem("partiu_user_cpf", data.cpf);
      if (data.avatarUrl) {
        localStorage.setItem("partiu_user_avatar", data.avatarUrl);
        localStorage.setItem("partiu_user_foto", data.avatarUrl);
        localStorage.setItem("partiu_user_selfie", data.avatarUrl);
      }
      window.dispatchEvent(
        new CustomEvent("partiu:user-profile-updated", {
          detail: { name: data.name, avatarUrl: data.avatarUrl, phone: data.phone, cpf: data.cpf },
        })
      );
    }

    const updatedSession: AuthUserProfile = session
      ? {
          ...session,
          name: data.name || session.name,
          phone: data.phone || session.phone,
          cpf: data.cpf || session.cpf,
          avatarUrl: data.avatarUrl || session.avatarUrl,
        }
      : {
          id: userId || `usr-pax-${Date.now().toString(36)}`,
          name: data.name || "Passageiro",
          email: typeof window !== "undefined" ? localStorage.getItem("partiu_user_email") || "" : "",
          phone: data.phone || "",
          cpf: data.cpf || "",
          role: "PASSAGEIRO",
          avatarUrl: data.avatarUrl || "",
          rating: 5.0,
          totalTrips: 0,
          createdAt: Date.now(),
        };
    supabaseAuthService.saveStoredSession(updatedSession);

    // 2. Atualiza Supabase
    if (isSupabaseConfigured() && userId) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        let paxQuery = (supabase as any)
          .from("partiu_passageiros")
          .update({
            nome: data.name,
            telefone: data.phone,
            cpf: data.cpf || undefined,
            foto_url: data.avatarUrl || undefined,
            updated_at: new Date().toISOString(),
          });

        if (isUuid) {
          paxQuery = paxQuery.or(`user_id.eq.${userId},id.eq.${userId}`);
        } else {
          paxQuery = paxQuery.eq("user_id", userId);
        }

        await paxQuery;

        if (isUuid) {
          await (supabase as any)
            .from("profiles")
            .update({
              full_name: data.name,
              phone: data.phone,
              cpf: data.cpf || undefined,
              avatar_url: data.avatarUrl || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
      } catch (err: any) {
        console.warn("Aviso ao persistir perfil no Supabase:", err?.message);
      }
    }

    return { success: true };
  }

  /**
   * Upload real de avatar no Supabase Storage (bucket 'avatares')
   */
  public async uploadAvatar(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!file) return { success: false, error: "Arquivo inválido" };

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `passageiros/${fileName}`;

    if (isSupabaseConfigured()) {
      try {
        const { error: uploadError } = await supabase.storage
          .from("avatares")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (!uploadError) {
          const { data } = supabase.storage.from("avatares").getPublicUrl(filePath);
          if (data?.publicUrl) {
            await this.updateUserProfile({
              name: typeof window !== "undefined" ? localStorage.getItem("partiu_user_nome") || "Passageiro" : "Passageiro",
              phone: typeof window !== "undefined" ? localStorage.getItem("partiu_user_phone") || "" : "",
              avatarUrl: data.publicUrl,
            });
            return { success: true, url: data.publicUrl };
          }
        }
      } catch (err: any) {
        console.warn("Falha no upload do Supabase Storage:", err?.message);
      }
    }

    // Fallback base64 local
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        if (typeof window !== "undefined") {
          localStorage.setItem("partiu_user_avatar", base64);
          localStorage.setItem("partiu_user_foto", base64);
          localStorage.setItem("partiu_user_selfie", base64);
        }
        await this.updateUserProfile({
          name: typeof window !== "undefined" ? localStorage.getItem("partiu_user_nome") || "Passageiro" : "Passageiro",
          phone: typeof window !== "undefined" ? localStorage.getItem("partiu_user_phone") || "" : "",
          avatarUrl: base64,
        });
        resolve({ success: true, url: base64 });
      };
      reader.onerror = () => resolve({ success: false, error: "Erro ao ler arquivo local" });
      reader.readAsDataURL(file);
    });
  }

  /**
   * Atualização de preferências com debounce no Supabase
   */
  public updateUserPreferences(prefs: Partial<UserPreferences>): void {
    const current = this.getStoredPreferences();
    const updated: UserPreferences = { ...current, ...prefs };
    this.saveStoredPreferences(updated);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      if (!isSupabaseConfigured()) return;
      const session = supabaseAuthService.getStoredSession();
      const userId = session?.id;
      if (!userId) return;

      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
        let updateQuery = (supabase as any)
          .from("partiu_passageiros")
          .update({
            pref_push_notifications: updated.prefPushNotifications,
            pref_sounds_haptics: updated.prefSoundsHaptics,
            pref_ac: updated.prefAc,
            pref_quiet_trip: updated.prefQuietTrip,
            pref_require_pin: updated.prefRequirePin,
            updated_at: new Date().toISOString(),
          });

        if (isUuid) {
          updateQuery = updateQuery.or(`user_id.eq.${userId},id.eq.${userId}`);
        } else {
          updateQuery = updateQuery.eq("user_id", userId);
        }

        await updateQuery;
      } catch (err) { silentCatchWarn("UserService", err); }
    }, 800);
  }

  public getStoredPreferences(): UserPreferences {
    if (typeof window === "undefined") return DEFAULT_PROFILE.preferences;
    try {
      const raw = localStorage.getItem(STORAGE_PREFERENCES_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) { silentCatchWarn("UserService", err); }
    return DEFAULT_PROFILE.preferences;
  }

  private saveStoredPreferences(prefs: UserPreferences): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (err) { silentCatchWarn("UserService", err); }
  }
}

export const userService = UserService.getInstance();
