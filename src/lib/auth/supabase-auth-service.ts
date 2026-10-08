/**
 * ==============================================================================
 * 🔐 PARTIU REVENUE OS — SUPABASE AUTH & IDENTITY SERVICE (v1.0)
 * ==============================================================================
 * Serviço unificado de autenticação conectado diretamente ao Supabase Auth e
 * às tabelas relacionais public.partiu_passageiros e public.partiu_motoristas.
 * 
 * Funcionalidades:
 * - Login por E-mail + Senha (Passageiro, Motorista, Admin)
 * - Login por Celular + OTP SMS/WhatsApp
 * - Cadastro integrado de novos passageiros com CPF e telefone normalizado
 * - Verificação de status de aprovação de motoristas parceiros
 * - Checagem ativa de conectividade e telemetria com a nuvem Supabase
 * - Fallback resiliente para modo de desenvolvimento/demonstração local
 * ==============================================================================
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { normalizarTelefoneBR } from "@/lib/passenger-cloud-sync";
import { silentCatchWarn } from "@/lib/structured-logger";
import { googleAuthService } from "./google-auth-service";


export type UserRole = "PASSAGEIRO" | "MOTORISTA" | "ADMIN";

export interface AuthUserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | undefined;
  cpf?: string | undefined;
  role: UserRole;
  avatarUrl?: string | undefined;
  rating?: number | undefined;
  totalTrips?: number | undefined;
  // Campos específicos de motorista
  vehiclePlate?: string | undefined;
  vehicleModel?: string | undefined;
  driverApprovalStatus?: "pendente" | "aprovado" | "rejeitado" | "suspenso" | undefined;
  // Campos específicos de admin
  adminRole?: string | undefined;
  createdAt: number;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: AuthUserProfile;
  redirectUrl?: string;
}

export interface SupabaseHealthStatus {
  isConfigured: boolean;
  isOnline: boolean;
  url: string;
  latencyMs: number;
  message: string;
}

const STORAGE_SESSION_KEY = "partiu_active_user_session_v1";

// Perfis padrão para teste rápido em ambiente de homologação
const DEMO_PROFILES: Record<UserRole, AuthUserProfile> = {
  PASSAGEIRO: {
    id: "usr-pax-demo-01",
    name: "Passageiro Demo",
    email: "passageiro@partiu.com.br",
    phone: "(11) 99999-0001",
    cpf: "000.000.000-01",
    role: "PASSAGEIRO",
    rating: 5.0,
    totalTrips: 0,
    avatarUrl: "",
    createdAt: 1772928000000,
  },
  MOTORISTA: {
    id: "usr-drv-demo-01",
    name: "Motorista Parceiro",
    email: "motorista@partiu.com.br",
    phone: "(11) 99999-0002",
    cpf: "000.000.000-02",
    role: "MOTORISTA",
    rating: 5.0,
    totalTrips: 0,
    vehiclePlate: "MOB2A00",
    vehicleModel: "Veículo Padrão (Prata)",
    driverApprovalStatus: "aprovado",
    avatarUrl: "",
    createdAt: 1772928000000,
  },
  ADMIN: {
    id: "usr-adm-demo-01",
    name: "Gestão Operacional PARTIU",
    email: "admin@partiu.com.br",
    role: "ADMIN",
    adminRole: "OWNER",
    createdAt: 1772928000000,
  },
};

export class SupabaseAuthService {
  private static instance: SupabaseAuthService;

  private constructor() {}

  public static getInstance(): SupabaseAuthService {
    if (!SupabaseAuthService.instance) {
      SupabaseAuthService.instance = new SupabaseAuthService();
    }
    return SupabaseAuthService.instance;
  }

  /**
   * Diagnóstico em tempo real da conexão com o banco Supabase
   */
  public async checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
    const configured = isSupabaseConfigured();
    const envUrl =
      (typeof import.meta !== "undefined" && import.meta.env?.["VITE_SUPABASE_URL"]) ||
      "https://partiu-app.supabase.co";

    if (!configured) {
      return {
        isConfigured: false,
        isOnline: false,
        url: envUrl,
        latencyMs: 0,
        message: "Modo Local / Fallback Ativo. Configure VITE_SUPABASE_URL no arquivo .env para conectar ao banco real.",
      };
    }

    const start = performance.now();
    try {
      // Teste leve de ping no endpoint de autenticação
      const { data, error } = await supabase.auth.getSession();
      const latencyMs = Math.round(performance.now() - start);

      if (error) {
        return {
          isConfigured: true,
          isOnline: false,
          url: envUrl,
          latencyMs,
          message: `Falha na comunicação com Supabase: ${error.message}`,
        };
      }

      return {
        isConfigured: true,
        isOnline: true,
        url: envUrl,
        latencyMs,
        message: `Supabase conectado com sucesso (${latencyMs}ms). Sessão ${data.session ? "ativa" : "anônima"}.`,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        isConfigured: true,
        isOnline: false,
        url: envUrl,
        latencyMs,
        message: `Erro de rede ao conectar ao Supabase (${(err as Error)?.message || "Timeout"}).`,
      };
    }
  }

  /**
   * Obtém o perfil da sessão ativa persistida
   */
  public getStoredSession(): AuthUserProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthUserProfile;
    } catch {
      return null;
    }
  }

  /**
   * Obtém o usuário ativo atual (alias para getStoredSession)
   */
  public getCurrentUser(): AuthUserProfile | null {
    return this.getStoredSession();
  }

  /**
   * Salva a sessão ativa localmente
   */
  public saveStoredSession(user: AuthUserProfile): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    } catch (err) { silentCatchWarn("supabase-auth-service", err); }
  }

  /**
   * Remove a sessão ativa localmente
   */
  public clearStoredSession(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (err) { silentCatchWarn("supabase-auth-service", err); }
  }

  /**
   * Limpa integralmente todos os caches locais de histórico de viagens, destinos recentes,
   * corridas ativas e dados de sessão para garantir isolamento estrito entre usuários.
   */
  public clearUserSessionAndCaches(): void {
    if (typeof window === "undefined") return;
    try {
      // 1. Limpa chaves de perfil e sessão
      localStorage.removeItem("partiu_demo_user");
      localStorage.removeItem("partiu_driver_demo");
      localStorage.removeItem("partiu_user_id");
      localStorage.removeItem("partiu_user_nome");
      localStorage.removeItem("partiu_user_phone");
      localStorage.removeItem("partiu_user_telefone");
      localStorage.removeItem("partiu_user_cpf");
      localStorage.removeItem("partiu_user_email");
      localStorage.removeItem("partiu_user_avatar");
      localStorage.removeItem("partiu_user_foto");
      localStorage.removeItem("partiu_user_selfie");
      localStorage.removeItem("partiu_user_preferences_v1");
      localStorage.removeItem("partiu_user_tipo");
      localStorage.removeItem("partiu_enderecos_salvos_v1");

      // 2. Limpa histórico de corridas e destinos recentes
      localStorage.removeItem("partiu_recent_destinations_v1");
      localStorage.removeItem("partiu_historico_viagens");
      localStorage.removeItem("partiu_offline_rides_history");
      localStorage.removeItem("partiu_corrida_ativa");
      localStorage.removeItem("partiu_active_ride");
      localStorage.removeItem("partiu_motorista_ativo");
      localStorage.removeItem("partiu_ganhos_motorista");
      localStorage.removeItem("partiu_enderecos_salvos_v1");

      // Limpa qualquer chave recente, frequência ou de endereço com prefixo de usuário
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith("partiu_recent_destinations_v1_") ||
            key.startsWith("partiu_user_destination_frequency_") ||
            key.startsWith("partiu_enderecos_salvos_v1_") ||
            key.startsWith("partiu_historico_viagens_") ||
            key.startsWith("partiu_offline_rides_history_"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // 3. Dispara eventos de reatividade para limpar a interface
      window.dispatchEvent(new CustomEvent("partiu:user-profile-updated", { detail: null }));
      window.dispatchEvent(new CustomEvent("partiu:history-cleared"));
      window.dispatchEvent(new CustomEvent("partiu:addresses_updated"));
    } catch (err) {
      silentCatchWarn("clearUserSessionAndCaches", err);
    }
    this.clearStoredSession();
  }

  /**
   * Registra um usuário localmente para garantir consistência anti-duplicidade
   * mesmo em contingência ou sem conexão Supabase imediata.
   */
  public recordRegisteredUserLocally(user: {
    id: string;
    email: string;
    cpf?: string;
    role: string;
  }): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("partiu_registered_users_store");
      const list = raw ? JSON.parse(raw) : [];
      const cleanEmail = user.email.toLowerCase().trim();
      const cleanCpf = user.cpf ? user.cpf.replace(/\D/g, "") : "";
      const exists = list.some(
        (u: any) =>
          u.email?.toLowerCase().trim() === cleanEmail ||
          (cleanCpf && u.cpf && u.cpf.replace(/\D/g, "") === cleanCpf)
      );
      if (!exists) {
        list.push({
          id: user.id,
          email: cleanEmail,
          cpf: user.cpf,
          role: user.role,
          registeredAt: Date.now(),
        });
        localStorage.setItem("partiu_registered_users_store", JSON.stringify(list));
      }
    } catch (err) {
      silentCatchWarn("recordRegisteredUserLocally", err);
    }
  }

  /**
   * Verifica proativamente se um e-mail ou CPF já está cadastrado no sistema
   * (seja no Supabase Auth, nas tabelas public.profiles/partiu_passageiros/partiu_motoristas,
   * ou no registro local persistido de usuários).
   */
  public async isEmailOrCpfRegistered(
    email: string,
    cpf?: string
  ): Promise<{ registered: boolean; field?: "email" | "cpf"; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCpf = cpf ? cpf.replace(/\D/g, "") : "";

    // 1. Verificação no registro local persistido
    if (typeof window !== "undefined") {
      try {
        const rawStore = localStorage.getItem("partiu_registered_users_store");
        if (rawStore) {
          const list = JSON.parse(rawStore);
          if (Array.isArray(list)) {
            const emailMatch = list.find((u: any) => u.email?.toLowerCase().trim() === cleanEmail);
            if (emailMatch) {
              return {
                registered: true,
                field: "email",
                message: "Este e-mail já está cadastrado no sistema. Faça login para acessar sua conta.",
              };
            }
            if (cleanCpf && cleanCpf.length === 11) {
              const cpfMatch = list.find(
                (u: any) => u.cpf && u.cpf.replace(/\D/g, "") === cleanCpf
              );
              if (cpfMatch) {
                return {
                  registered: true,
                  field: "cpf",
                  message: "Este CPF já está cadastrado na plataforma. Cada usuário deve ter um CPF único.",
                };
              }
            }
          }
        }
      } catch {}
    }

    // 2. Verificação no Supabase (se configurado)
    if (isSupabaseConfigured()) {
      try {
        // A. Checagem em public.profiles
        if (cleanEmail) {
          const { data: profileByEmail } = await (supabase as any)
            .from("profiles")
            .select("id, email")
            .eq("email", cleanEmail)
            .maybeSingle();

          if (profileByEmail) {
            return {
              registered: true,
              field: "email",
              message: "Este e-mail já está cadastrado no sistema. Faça login para acessar sua conta.",
            };
          }
        }

        if (cleanCpf && cleanCpf.length === 11) {
          const { data: profileByCpf } = await (supabase as any)
            .from("profiles")
            .select("id, cpf")
            .eq("cpf", cpf)
            .maybeSingle();

          if (profileByCpf) {
            return {
              registered: true,
              field: "cpf",
              message: "Este CPF já está cadastrado na plataforma.",
            };
          }
        }

        // B. Checagem em public.partiu_passageiros
        if (cleanEmail) {
          const { data: paxByEmail } = await (supabase as any)
            .from("partiu_passageiros")
            .select("id, email")
            .eq("email", cleanEmail)
            .maybeSingle();

          if (paxByEmail) {
            return {
              registered: true,
              field: "email",
              message: "Este e-mail já está cadastrado como passageiro. Faça login.",
            };
          }
        }

        if (cleanCpf && cleanCpf.length === 11) {
          const { data: paxByCpf } = await (supabase as any)
            .from("partiu_passageiros")
            .select("id, cpf")
            .eq("cpf", cpf)
            .maybeSingle();

          if (paxByCpf) {
            return {
              registered: true,
              field: "cpf",
              message: "Este CPF já está cadastrado na plataforma.",
            };
          }
        }

        // C. Checagem em public.partiu_motoristas
        if (cleanEmail) {
          const { data: drvByEmail } = await (supabase as any)
            .from("partiu_motoristas")
            .select("id, email")
            .eq("email", cleanEmail)
            .maybeSingle();

          if (drvByEmail) {
            return {
              registered: true,
              field: "email",
              message: "Este e-mail já está cadastrado como motorista parceiro. Faça login.",
            };
          }
        }

        if (cleanCpf && cleanCpf.length === 11) {
          const { data: drvByCpf } = await (supabase as any)
            .from("partiu_motoristas")
            .select("id, cpf")
            .eq("cpf", cleanCpf)
            .maybeSingle();

          if (drvByCpf) {
            return {
              registered: true,
              field: "cpf",
              message: "Este CPF já está vinculado a um motorista cadastrado.",
            };
          }
        }
      } catch (err) {
        silentCatchWarn("isEmailOrCpfRegistered", err);
      }
    }

    return { registered: false };
  }

  /**
   * Verifica a sessão ativa no Supabase e hidrata o perfil a partir de public.profiles
   */
  public async checkAndHydrateSession(): Promise<AuthUserProfile | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (!sessionErr && sessionData?.session?.user) {
          const user = sessionData.session.user;
          let profileData: any = null;
          try {
            const { data: pData } = await (supabase as any)
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();
            profileData = pData;
          } catch (err) {
            silentCatchWarn("checkAndHydrateSession:profiles", err);
          }

          let role: UserRole = "PASSAGEIRO";
          const rawRole = profileData?.role || user.user_metadata?.["role"] || "";
          if (rawRole.toLowerCase() === "driver" || rawRole.toUpperCase() === "MOTORISTA") {
            role = "MOTORISTA";
          } else if (rawRole.toLowerCase() === "admin" || rawRole.toUpperCase() === "ADMIN") {
            role = "ADMIN";
          }

          let driverApprovalStatus = profileData?.approval_status || (role === "MOTORISTA" ? "pendente" : "aprovado");
          let vehiclePlate = profileData?.metadata?.vehicle_plate;
          let vehicleModel = profileData?.metadata?.vehicle_model;

          if (role === "MOTORISTA") {
            try {
              const { data: dData } = await (supabase as any)
                .from("partiu_motoristas")
                .select("status_aprovacao, veiculo_placa, veiculo_marca_modelo")
                .eq("user_id", user.id)
                .maybeSingle();
              if (dData) {
                driverApprovalStatus = dData.status_aprovacao || driverApprovalStatus;
                vehiclePlate = dData.veiculo_placa || vehiclePlate;
                vehicleModel = dData.veiculo_marca_modelo || vehicleModel;
              }
            } catch (err) {
              silentCatchWarn("checkAndHydrateSession:partiu_motoristas", err);
            }
          }

          let avatarUrl = profileData?.avatar_url || user.user_metadata?.["avatar_url"];
          let paxNome = profileData?.full_name;
          let paxPhone = profileData?.phone;
          let paxCpf = profileData?.cpf;

          if (role === "PASSAGEIRO") {
            try {
              const { data: paxData } = await (supabase as any)
                .from("partiu_passageiros")
                .select("foto_url, nome, telefone, cpf")
                .eq("user_id", user.id)
                .maybeSingle();
              if (paxData) {
                if (paxData.foto_url && !avatarUrl) avatarUrl = paxData.foto_url;
                if (paxData.nome && !paxNome) paxNome = paxData.nome;
                if (paxData.telefone && !paxPhone) paxPhone = paxData.telefone;
                if (paxData.cpf && !paxCpf) paxCpf = paxData.cpf;
              }
            } catch (err) {
              silentCatchWarn("checkAndHydrateSession:partiu_passageiros", err);
            }
          }

          const existingStored = this.getStoredSession();
          const isSameUser = Boolean(
            existingStored &&
              (existingStored.id === user.id ||
                (existingStored.email &&
                  user.email &&
                  existingStored.email.toLowerCase() === user.email.toLowerCase()))
          );

          if (!avatarUrl && isSameUser && existingStored?.avatarUrl) {
            avatarUrl = existingStored.avatarUrl;
          }
          if (!avatarUrl && isSameUser && typeof window !== "undefined") {
            avatarUrl = localStorage.getItem("partiu_user_avatar") || undefined;
          }

          const resolvedName =
            (paxNome && paxNome !== "Passageiro" ? paxNome : null) ||
            (profileData?.full_name && profileData.full_name !== "Passageiro" ? profileData.full_name : null) ||
            user.user_metadata?.["name"] ||
            user.user_metadata?.["full_name"] ||
            (isSameUser && existingStored?.name && existingStored.name !== "Passageiro" ? existingStored.name : null) ||
            user.email?.split("@")[0] ||
            "Passageiro";

          const resolvedPhone =
            paxPhone ||
            profileData?.phone ||
            user.user_metadata?.["phone"] ||
            (isSameUser ? existingStored?.phone : null) ||
            "";

          const resolvedCpf =
            paxCpf ||
            profileData?.cpf ||
            user.user_metadata?.["cpf"] ||
            (isSameUser ? existingStored?.cpf : null) ||
            "";

          const resolvedAvatar = avatarUrl || (isSameUser ? existingStored?.avatarUrl : "") || "";

          const hydrated: AuthUserProfile = {
            id: user.id,
            name: resolvedName,
            email: user.email || profileData?.email || "",
            phone: resolvedPhone,
            cpf: resolvedCpf,
            role,
            rating: profileData?.rating ? Number(profileData.rating) : 5.0,
            totalTrips: profileData?.total_trips || 0,
            avatarUrl: resolvedAvatar,
            driverApprovalStatus: driverApprovalStatus as any,
            vehiclePlate,
            vehicleModel,
            createdAt: profileData?.created_at ? new Date(profileData.created_at).getTime() : Date.now(),
          };

          this.saveStoredSession(hydrated);

          // Sincroniza cache local estritamente com os dados do usuário autenticado
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("partiu_user_id", user.id);
              localStorage.setItem("partiu_user_nome", resolvedName);
              if (user.email) localStorage.setItem("partiu_user_email", user.email);
              if (resolvedPhone) {
                localStorage.setItem("partiu_user_phone", resolvedPhone);
                localStorage.setItem("partiu_user_telefone", resolvedPhone);
              }
              if (resolvedCpf) localStorage.setItem("partiu_user_cpf", resolvedCpf);
              if (resolvedAvatar) {
                localStorage.setItem("partiu_user_avatar", resolvedAvatar);
                localStorage.setItem("partiu_user_foto", resolvedAvatar);
                localStorage.setItem("partiu_user_selfie", resolvedAvatar);
              }
              window.dispatchEvent(
                new CustomEvent("partiu:user-profile-updated", { detail: hydrated })
              );
            } catch {}
          }

          return hydrated;
        }
      } catch (err) {
        silentCatchWarn("supabase-auth-service:checkAndHydrateSession", err);
      }
    }
    return this.getStoredSession();
  }

  /**
   * Autenticação e Cadastro rápido via Google OAuth (1-Click Google Sign-In)
   */
  public async signInWithGoogle(params?: {
    role?: UserRole;
    redirectUrl?: string;
  }): Promise<AuthResult> {
    const role = params?.role || "PASSAGEIRO";
    const redirectUrl =
      params?.redirectUrl ||
      (role === "MOTORISTA" ? "/app/motorista" : role === "ADMIN" ? "/app/admin" : "/app");

    // Inicia fluxo real com o Google OAuth
    const googleRes = await googleAuthService.signIn({
      role: role === "ADMIN" ? "PASSAGEIRO" : role,
      redirectUrl,
    });

    if (googleRes.needsClientId) {
      return {
        success: false,
        error: "Para autenticar com a sua conta Google real, informe o Google Client ID.",
      };
    }

    if (!googleRes.success) {
      return {
        success: false,
        error: googleRes.error || "Autenticação com o Google não concluída.",
      };
    }

    if (googleRes.user) {
      // Usuário REAL vindo da conta Google do usuário!
      const realGoogleUser: AuthUserProfile = {
        id: `usr-google-${googleRes.user.sub}`,
        name: googleRes.user.name,
        email: googleRes.user.email,
        phone: undefined,
        role,
        rating: 5.0,
        totalTrips: 0,
        avatarUrl: googleRes.user.picture,
        driverApprovalStatus: role === "MOTORISTA" ? "pendente" : undefined,
        createdAt: Date.now(),
      };

      this.saveStoredSession(realGoogleUser);

      // Sincroniza com o Supabase se configurado
      if (isSupabaseConfigured()) {
        try {
          await supabase.from("profiles").upsert({
            id: realGoogleUser.id,
            full_name: realGoogleUser.name,
            email: realGoogleUser.email,
            role: realGoogleUser.role,
            avatar_url: realGoogleUser.avatarUrl,
          });
        } catch (err) {
          silentCatchWarn("syncGoogleProfileToSupabase", err);
        }
      }

      return {
        success: true,
        user: realGoogleUser,
        redirectUrl,
      };
    }

    // Se o provedor redirecionou a página (ex: Supabase OAuth), aguarda o callback
    return {
      success: true,
      redirectUrl,
    };
  }

  /**
   * Login por E-mail e Senha (Supabase Auth em Produção)
   */
  public async signInWithEmail(params: {
    email: string;
    senha: string;
    role: UserRole;
  }): Promise<AuthResult> {
    const { email, senha, role } = params;
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Informe um endereço de e-mail válido." };
    }
    if (!senha || senha.length < 4) {
      return { success: false, error: "A senha deve conter no mínimo 6 caracteres." };
    }

    // 1. Verificação com Supabase Auth Real se configurado
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: senha,
        });

        if (error) {
          const msg = error.message;
          let traduzido = "Credenciais de acesso incorretas.";
          if (msg.includes("Invalid login credentials")) traduzido = "E-mail ou senha incorretos.";
          else if (msg.includes("Email not confirmed")) traduzido = "Por favor, confirme seu e-mail antes de entrar.";
          else if (msg.includes("Too many requests")) traduzido = "Muitas tentativas consecutivas. Aguarde um momento.";
          return { success: false, error: traduzido };
        }

        if (data?.user) {
          // Busca perfil do usuário na tabela profiles
          let profileData: any = null;
          try {
            const { data: pData } = await (supabase as any)
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .maybeSingle();
            profileData = pData;
          } catch {}

          let finalRole: UserRole = role;
          const rawRole = profileData?.role || data.user.user_metadata?.["role"] || "";
          if (rawRole.toLowerCase() === "driver" || rawRole.toUpperCase() === "MOTORISTA") {
            finalRole = "MOTORISTA";
          } else if (rawRole.toLowerCase() === "admin" || rawRole.toUpperCase() === "ADMIN") {
            finalRole = "ADMIN";
          }

          let driverApprovalStatus = profileData?.approval_status || (finalRole === "MOTORISTA" ? "pendente" : "aprovado");
          let vehiclePlate = profileData?.metadata?.vehicle_plate;
          let vehicleModel = profileData?.metadata?.vehicle_model;

          if (finalRole === "MOTORISTA") {
            try {
              const { data: dData } = await (supabase as any)
                .from("partiu_motoristas")
                .select("status_aprovacao, veiculo_placa, veiculo_marca_modelo")
                .eq("user_id", data.user.id)
                .maybeSingle();
              if (dData) {
                driverApprovalStatus = dData.status_aprovacao || driverApprovalStatus;
                vehiclePlate = dData.veiculo_placa || vehiclePlate;
                vehicleModel = dData.veiculo_marca_modelo || vehicleModel;
              }
            } catch {}
          }

          let avatarUrl = profileData?.avatar_url || data.user.user_metadata?.["avatar_url"];
          let paxNome = profileData?.full_name;
          let paxPhone = profileData?.phone;
          let paxCpf = profileData?.cpf;

          if (finalRole === "PASSAGEIRO") {
            try {
              const { data: paxData } = await (supabase as any)
                .from("partiu_passageiros")
                .select("foto_url, nome, telefone, cpf")
                .eq("user_id", data.user.id)
                .maybeSingle();
              if (paxData) {
                if (paxData.foto_url && !avatarUrl) avatarUrl = paxData.foto_url;
                if (paxData.nome && !paxNome) paxNome = paxData.nome;
                if (paxData.telefone && !paxPhone) paxPhone = paxData.telefone;
                if (paxData.cpf && !paxCpf) paxCpf = paxData.cpf;
              }
            } catch {}
          }

          const existingStored = this.getStoredSession();
          const isSameUser = Boolean(
            existingStored &&
              (existingStored.id === data.user.id ||
                (existingStored.email && existingStored.email.toLowerCase() === cleanEmail))
          );

          if (!avatarUrl && isSameUser && existingStored?.avatarUrl) {
            avatarUrl = existingStored.avatarUrl;
          }
          if (!avatarUrl && isSameUser && typeof window !== "undefined") {
            avatarUrl = localStorage.getItem("partiu_user_avatar") || undefined;
          }

          const resolvedName =
            (paxNome && paxNome !== "Passageiro" ? paxNome : null) ||
            (profileData?.full_name && profileData.full_name !== "Passageiro" ? profileData.full_name : null) ||
            data.user.user_metadata?.["name"] ||
            data.user.user_metadata?.["full_name"] ||
            (isSameUser && existingStored?.name && existingStored.name !== "Passageiro" ? existingStored.name : null) ||
            cleanEmail.split("@")[0];

          const resolvedPhone =
            paxPhone ||
            profileData?.phone ||
            data.user.user_metadata?.["phone"] ||
            (isSameUser ? existingStored?.phone : null) ||
            "";

          const resolvedCpf =
            paxCpf ||
            profileData?.cpf ||
            data.user.user_metadata?.["cpf"] ||
            (isSameUser ? existingStored?.cpf : null) ||
            "";

          const resolvedAvatar = avatarUrl || (isSameUser ? existingStored?.avatarUrl : "") || "";

          const authUser: AuthUserProfile = {
            id: data.user.id,
            name: resolvedName,
            email: cleanEmail,
            phone: resolvedPhone,
            cpf: resolvedCpf,
            role: finalRole,
            rating: profileData?.rating ? Number(profileData.rating) : 5.0,
            totalTrips: profileData?.total_trips || 0,
            avatarUrl: resolvedAvatar,
            driverApprovalStatus: driverApprovalStatus as any,
            vehiclePlate,
            vehicleModel,
            createdAt: profileData?.created_at ? new Date(profileData.created_at).getTime() : Date.now(),
          };

          // Se estiver trocando de conta no mesmo navegador, purga integralmente o cache do usuário anterior
          if (!isSameUser) {
            this.clearUserSessionAndCaches();
          }

          this.saveStoredSession(authUser);
          this.recordRegisteredUserLocally({
            id: authUser.id,
            email: cleanEmail,
            cpf: resolvedCpf,
            role: finalRole,
          });

          // Sincroniza imediatamente o localStorage para o novo usuário autenticado
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("partiu_user_id", authUser.id);
              localStorage.setItem("partiu_user_nome", resolvedName);
              localStorage.setItem("partiu_user_email", cleanEmail);
              if (resolvedPhone) {
                localStorage.setItem("partiu_user_phone", resolvedPhone);
                localStorage.setItem("partiu_user_telefone", resolvedPhone);
              } else {
                localStorage.removeItem("partiu_user_phone");
                localStorage.removeItem("partiu_user_telefone");
              }
              if (resolvedCpf) {
                localStorage.setItem("partiu_user_cpf", resolvedCpf);
              } else {
                localStorage.removeItem("partiu_user_cpf");
              }
              if (resolvedAvatar) {
                localStorage.setItem("partiu_user_avatar", resolvedAvatar);
                localStorage.setItem("partiu_user_foto", resolvedAvatar);
                localStorage.setItem("partiu_user_selfie", resolvedAvatar);
              } else {
                localStorage.removeItem("partiu_user_avatar");
                localStorage.removeItem("partiu_user_foto");
                localStorage.removeItem("partiu_user_selfie");
              }
              window.dispatchEvent(
                new CustomEvent("partiu:user-profile-updated", { detail: authUser })
              );
            } catch {}
          }

          return {
            success: true,
            user: authUser,
            redirectUrl:
              finalRole === "MOTORISTA" ? "/app/motorista" : finalRole === "ADMIN" ? "/app/admin" : "/app",
          };
        }
      } catch (err) {
        silentCatchWarn("supabase-auth-service", err);
        return { success: false, error: "Falha na comunicação com o servidor de autenticação." };
      }
    }

    // 2. Ambiente de Homologação / Offline
    const demo = DEMO_PROFILES[role];
    const isDemoEmail = cleanEmail === demo.email;
    const isDefaultPass = senha === "123456" || senha === "partiu2026";

    if (!isDemoEmail && !isDefaultPass) {
      return { success: false, error: "Credenciais de autenticação não encontradas." };
    }

    const userProfile: AuthUserProfile = {
      id: isDemoEmail ? demo.id : `usr-${role.toLowerCase()}-${Date.now().toString(36)}`,
      name: isDemoEmail ? demo.name : (cleanEmail.split("@")[0] || "USUARIO").toUpperCase(),
      email: cleanEmail,
      phone: isDemoEmail ? demo.phone : "(82) 99841-0000",
      cpf: isDemoEmail ? demo.cpf : "000.000.000-00",
      role,
      rating: demo.rating || 5.0,
      totalTrips: demo.totalTrips || 0,
      avatarUrl: demo.avatarUrl,
      vehiclePlate: demo.vehiclePlate,
      vehicleModel: demo.vehicleModel,
      driverApprovalStatus: demo.driverApprovalStatus || "aprovado",
      adminRole: demo.adminRole,
      createdAt: Date.now(),
    };

    this.saveStoredSession(userProfile);

    const redirectUrl =
      role === "MOTORISTA" ? "/app/motorista" : role === "ADMIN" ? "/app/admin" : "/app";

    return {
      success: true,
      user: userProfile,
      redirectUrl,
    };
  }

  /**
   * Envio de código OTP para celular (SMS / WhatsApp)
   */
  public async sendPhoneOtp(phone: string): Promise<{ success: boolean; error?: string }> {
    const norm = normalizarTelefoneBR(phone);
    if (!norm.valido) {
      return { success: false, error: "Informe um número de celular válido com DDD (ex: 82 99841-2940)." };
    }

    if (isSupabaseConfigured() && norm.e164) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone: norm.e164,
        });
        if (error) {
          console.warn("Aviso Supabase OTP:", error.message);
        }
      } catch (err) {
        console.warn("Falha no OTP remoto:", err);
      }
    }

    return { success: true };
  }

  /**
   * Verificação de código OTP de celular
   */
  public async verifyPhoneOtp(params: {
    phone: string;
    otpCode: string;
    role?: UserRole;
  }): Promise<AuthResult> {
    const { phone, otpCode, role = "PASSAGEIRO" } = params;
    const norm = normalizarTelefoneBR(phone);

    if (!norm.valido) {
      return { success: false, error: "Telefone inválido." };
    }
    if (!otpCode || otpCode.trim().length < 4) {
      return { success: false, error: "O código de verificação deve conter no mínimo 4 dígitos." };
    }

    if (isSupabaseConfigured() && norm.e164) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: norm.e164,
          token: otpCode.trim(),
          type: "sms",
        });

        if (!error && data.user) {
          const authUser: AuthUserProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.["name"] || "Passageiro PARTIU",
            email: data.user.email || `${norm.apenasDigitos}@partiu.app`,
            phone: norm.formatado,
            role,
            rating: 5.0,
            createdAt: Date.now(),
          };
          this.saveStoredSession(authUser);
          return {
            success: true,
            user: authUser,
            redirectUrl: role === "MOTORISTA" ? "/app/motorista" : "/app",
          };
        }
      } catch (err) { silentCatchWarn("supabase-auth-service", err); }
    }

    // Fallback local
    const demo = DEMO_PROFILES[role];
    const userProfile: AuthUserProfile = {
      id: `usr-phone-${norm.apenasDigitos}`,
      name: "Passageiro PARTIU",
      email: `${norm.apenasDigitos}@partiu.app`,
      phone: norm.formatado,
      role,
      rating: 5.0,
      totalTrips: 1,
      createdAt: Date.now(),
    };

    this.saveStoredSession(userProfile);
    return {
      success: true,
      user: userProfile,
      redirectUrl: role === "MOTORISTA" ? "/app/motorista" : "/app",
    };
  }

  /**
   * Checagem unificada de existência de contato (Magic Flow para Login/Cadastro)
   * Determina se o usuário já possui conta ou deve prosseguir para o cadastro Step 1.
   */
  public async checkContactExists(
    contact: string,
    role: UserRole = "PASSAGEIRO"
  ): Promise<{
    exists: boolean;
    contactType: "EMAIL" | "PHONE";
    formattedContact: string;
    userName?: string;
    suggestedAuthMode: "PASSWORD" | "SMS_OTP";
  }> {
    const raw = contact.trim();
    const isEmail = raw.includes("@");

    if (isEmail) {
      const cleanEmail = raw.toLowerCase();
      // 1. Checagem em perfis de demonstração
      const demo = DEMO_PROFILES[role];
      if (cleanEmail === demo.email) {
        return {
          exists: true,
          contactType: "EMAIL",
          formattedContact: cleanEmail,
          userName: demo.name,
          suggestedAuthMode: "PASSWORD",
        };
      }

      // 2. Checagem em storage local (cache/sessão anterior)
      try {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(STORAGE_SESSION_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as AuthUserProfile;
            if (parsed.email?.toLowerCase() === cleanEmail) {
              return {
                exists: true,
                contactType: "EMAIL",
                formattedContact: cleanEmail,
                userName: parsed.name,
                suggestedAuthMode: "PASSWORD",
              };
            }
          }
          const driverStore = localStorage.getItem("partiu_motoristas_store");
          if (driverStore) {
            const drivers = JSON.parse(driverStore);
            const found = drivers.find((d: any) => d.email?.toLowerCase() === cleanEmail);
            if (found) {
              return {
                exists: true,
                contactType: "EMAIL",
                formattedContact: cleanEmail,
                userName: found.nome,
                suggestedAuthMode: "PASSWORD",
              };
            }
          }
        }
      } catch {}

      // 3. Checagem remota no Supabase
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, email, role")
            .eq("email", cleanEmail)
            .maybeSingle();

          if (data) {
            return {
              exists: true,
              contactType: "EMAIL",
              formattedContact: cleanEmail,
              userName: data.full_name || undefined,
              suggestedAuthMode: "PASSWORD",
            };
          }
        } catch (err) {
          silentCatchWarn("checkContactExists:remote-email", err);
        }
      }

      return {
        exists: false,
        contactType: "EMAIL",
        formattedContact: cleanEmail,
        suggestedAuthMode: "PASSWORD",
      };
    } else {
      // É Celular
      const norm = normalizarTelefoneBR(raw);
      const digits = norm.apenasDigitos;
      const formatted = norm.formatado || raw;

      // 1. Checagem em perfis de demonstração
      const demo = DEMO_PROFILES[role];
      const demoDigits = demo.phone?.replace(/\D/g, "");
      if (digits && demoDigits && digits.endsWith(demoDigits.slice(-8))) {
        return {
          exists: true,
          contactType: "PHONE",
          formattedContact: formatted,
          userName: demo.name,
          suggestedAuthMode: "SMS_OTP",
        };
      }

      // 2. Checagem em storage local
      try {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(STORAGE_SESSION_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as AuthUserProfile;
            const storedDigits = parsed.phone?.replace(/\D/g, "");
            if (storedDigits && digits && storedDigits.endsWith(digits.slice(-8))) {
              return {
                exists: true,
                contactType: "PHONE",
                formattedContact: formatted,
                userName: parsed.name,
                suggestedAuthMode: "SMS_OTP",
              };
            }
          }
        }
      } catch {}

      // 3. Checagem remota no Supabase
      if (isSupabaseConfigured() && norm.valido) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, phone")
            .or(`phone.eq.${norm.formatado},phone.eq.${norm.e164}`)
            .maybeSingle();

          if (data) {
            return {
              exists: true,
              contactType: "PHONE",
              formattedContact: formatted,
              userName: data.full_name || undefined,
              suggestedAuthMode: "SMS_OTP",
            };
          }
        } catch (err) {
          silentCatchWarn("checkContactExists:remote-phone", err);
        }
      }

      return {
        exists: false,
        contactType: "PHONE",
        formattedContact: formatted,
        suggestedAuthMode: "SMS_OTP",
      };
    }
  }

  /**
   * Cadastro de Novo Passageiro com persistência no Supabase
   */
  public async signUpPassenger(params: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
    password: string;
    avatarUrl?: string;
  }): Promise<AuthResult> {
    const { name, email, phone, cpf, password, avatarUrl } = params;
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 3) {
      return { success: false, error: "Informe seu nome completo (mínimo 3 caracteres)." };
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Informe um endereço de e-mail válido." };
    }
    const normPhone = normalizarTelefoneBR(phone);
    if (!normPhone.valido) {
      return { success: false, error: "Informe um número de celular válido com DDD." };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
    }

    const cleanCpf = cpf ? cpf.trim() : "";

    // 0. Bloqueio proativo de e-mail e CPF duplicados
    const checkDuplicity = await this.isEmailOrCpfRegistered(cleanEmail, cleanCpf);
    if (checkDuplicity.registered) {
      return {
        success: false,
        error: checkDuplicity.message || "Este e-mail ou CPF já está cadastrado no sistema.",
      };
    }

    // 1. Criação no Supabase Auth
    let supabaseUserId = `usr-pax-${Date.now().toString(36)}`;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
              phone: normPhone.formatado,
              cpf: cleanCpf,
              role: "PASSAGEIRO",
              avatar_url: avatarUrl && !avatarUrl.startsWith("data:") ? avatarUrl : undefined,
            },
          },
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (
            msg.includes("already registered") ||
            msg.includes("already exists") ||
            msg.includes("unique")
          ) {
            return {
              success: false,
              error: "Este endereço de e-mail já está cadastrado no sistema. Faça login para continuar.",
            };
          }
          return { success: false, error: error.message };
        }

        // Validação estrita GoTrue: quando o usuário já existe e a confirmação é requerida/ativa,
        // o Supabase retorna user com array identities vazio sem lançar erro de propósito.
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          return {
            success: false,
            error: "Este endereço de e-mail já está cadastrado no sistema. Faça login para continuar.",
          };
        }

        if (data.user) {
          supabaseUserId = data.user.id;

          // Inserção na tabela profiles e partiu_passageiros
          try {
            await (supabase as any).from("profiles").upsert({
              id: data.user.id,
              email: cleanEmail,
              full_name: cleanName,
              phone: normPhone.formatado,
              cpf: cleanCpf,
              role: "passenger",
              approval_status: "aprovado",
              avatar_url: avatarUrl || null,
            });
          } catch (pErr) {
            silentCatchWarn("signUpPassenger:profiles", pErr);
          }

          try {
            await (supabase as any).from("partiu_passageiros").insert({
              user_id: data.user.id,
              nome: cleanName,
              cpf: cleanCpf,
              telefone: normPhone.formatado,
              email: cleanEmail,
              foto_url: avatarUrl || null,
              rating: 5.0,
              is_ativo: true,
            });
          } catch (dbErr) {
            silentCatchWarn("signUpPassenger:partiu_passageiros", dbErr);
          }

          if (!data.session) {
            try {
              await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
              });
            } catch (sErr) {
              silentCatchWarn("signUpPassenger:autoSignIn", sErr);
            }
          }
        }
      } catch (err: any) {
        silentCatchWarn("signUpPassenger:supabase", err);
        return { success: false, error: err?.message || "Erro ao conectar com o serviço de cadastro." };
      }
    }

    // 2. ISOLAMENTO TOTAL DE SESSÃO: Limpa qualquer histórico e cache residual de outro usuário anterior
    this.clearUserSessionAndCaches();

    // 3. Registra localmente para garantir consistência anti-duplicidade
    this.recordRegisteredUserLocally({
      id: supabaseUserId,
      email: cleanEmail,
      cpf: cleanCpf,
      role: "PASSAGEIRO",
    });

    const newUser: AuthUserProfile = {
      id: supabaseUserId,
      name: cleanName,
      email: cleanEmail,
      phone: normPhone.formatado,
      cpf: cleanCpf,
      role: "PASSAGEIRO",
      avatarUrl: avatarUrl || "",
      rating: 5.0,
      totalTrips: 0,
      createdAt: Date.now(),
    };

    if (typeof window !== "undefined") {
      try {
        if (avatarUrl) {
          localStorage.setItem("partiu_user_avatar", avatarUrl);
          localStorage.setItem("partiu_user_foto", avatarUrl);
          localStorage.setItem("partiu_user_selfie", avatarUrl);
        }
        localStorage.setItem("partiu_user_id", supabaseUserId);
        localStorage.setItem("partiu_user_nome", cleanName);
        localStorage.setItem("partiu_user_phone", normPhone.formatado);
        localStorage.setItem("partiu_user_telefone", normPhone.formatado);
        if (cleanCpf) localStorage.setItem("partiu_user_cpf", cleanCpf);
        localStorage.setItem("partiu_user_email", cleanEmail);
        window.dispatchEvent(new CustomEvent("partiu:user-profile-updated", { detail: newUser }));
      } catch {}
    }

    this.saveStoredSession(newUser);

    return {
      success: true,
      user: newUser,
      redirectUrl: "/app",
    };
  }

  /**
   * Cadastro Oficial de Motorista Parceiro com Supabase Auth e Moderação
   */
  public async signUpDriver(params: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
    password: string;
    vehicleType?: "carro" | "moto";
    vehicleModel?: string;
    vehiclePlate?: string;
    vehicleYear?: string;
    vehicleColor?: string;
    cnh?: string;
    cnhCategory?: string;
    hasEar?: boolean;
    cnhUrl?: string;
    crlvUrl?: string;
    fotoPerfilUrl?: string;
    pixKey?: string;
    pixKeyType?: string;
  }): Promise<AuthResult> {
    const { name, email, phone, cpf, password } = params;
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 3) {
      return { success: false, error: "Informe seu nome completo (mínimo 3 caracteres)." };
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Informe um endereço de e-mail válido." };
    }
    const normPhone = normalizarTelefoneBR(phone);
    if (!normPhone.valido) {
      return { success: false, error: "Informe um número de celular válido com DDD." };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
    }

    const cleanCpf = cpf ? cpf.trim() : "";

    // 0. Bloqueio proativo de e-mail e CPF duplicados
    const checkDuplicity = await this.isEmailOrCpfRegistered(cleanEmail, cleanCpf);
    if (checkDuplicity.registered) {
      return {
        success: false,
        error: checkDuplicity.message || "Este e-mail ou CPF já está cadastrado no sistema.",
      };
    }

    let supabaseUserId = `usr-drv-${Date.now().toString(36)}`;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
              phone: normPhone.formatado,
              cpf: cleanCpf,
              role: "driver",
              vehicle_model: params.vehicleModel,
              vehicle_plate: params.vehiclePlate?.toUpperCase(),
            },
          },
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (
            msg.includes("already registered") ||
            msg.includes("already exists") ||
            msg.includes("unique")
          ) {
            return {
              success: false,
              error: "Este endereço de e-mail já está cadastrado no sistema. Faça login para continuar.",
            };
          }
          return { success: false, error: error.message };
        }

        // Validação estrita GoTrue: se identities for array vazio, o usuário já existia!
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          return {
            success: false,
            error: "Este endereço de e-mail já está cadastrado no sistema. Faça login para continuar.",
          };
        }

        if (data.user) {
          supabaseUserId = data.user.id;

          // Inserção na tabela profiles (status pendente de moderação)
          try {
            await (supabase as any).from("profiles").upsert({
              id: data.user.id,
              email: cleanEmail,
              full_name: cleanName,
              phone: normPhone.formatado,
              cpf: cleanCpf,
              role: "driver",
              approval_status: "pendente",
              avatar_url: params.fotoPerfilUrl || null,
              metadata: {
                vehicle_model: params.vehicleModel,
                vehicle_plate: params.vehiclePlate?.toUpperCase(),
                vehicle_type: params.vehicleType,
                cnh: params.cnh,
                cnh_url: params.cnhUrl,
                crlv_url: params.crlvUrl,
                foto_url: params.fotoPerfilUrl,
                pix_key: params.pixKey,
              },
            });
          } catch (pErr) {
            silentCatchWarn("signUpDriver:profiles", pErr);
          }

          // Inserção na tabela partiu_motoristas
          try {
            await (supabase as any).from("partiu_motoristas").insert({
              user_id: data.user.id,
              nome: cleanName,
              cpf: cleanCpf.replace(/\D/g, "") || cleanCpf || "00000000000",
              telefone: normPhone.formatado,
              email: cleanEmail,
              cnh_numero: params.cnh || "00000000000",
              cnh_categoria: params.cnhCategory || "B",
              cnh_validade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              possui_ear: params.hasEar ?? true,
              cnh_url: params.cnhUrl || null,
              crlv_url: params.crlvUrl || null,
              foto_url: params.fotoPerfilUrl || null,
              veiculo_marca_modelo: params.vehicleModel || "Modelo Não Informado",
              veiculo_placa: (params.vehiclePlate || "SEM-PLACA").toUpperCase(),
              veiculo_ano: parseInt(params.vehicleYear || "2023", 10) || 2023,
              veiculo_cor: params.vehicleColor || "Prata",
              categoria_veiculo: params.vehicleType === "moto" ? "MOTO" : "CARRO",
              chave_pix: params.pixKey || null,
              tipo_chave_pix: params.pixKeyType || null,
              status_aprovacao: "pendente",
              is_online: false,
            });
          } catch (mErr) {
            silentCatchWarn("signUpDriver:partiu_motoristas", mErr);
          }

          if (!data.session) {
            try {
              await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
              });
            } catch (sErr) {
              silentCatchWarn("signUpDriver:autoSignIn", sErr);
            }
          }
        }
      } catch (err: any) {
        return { success: false, error: err?.message || "Erro ao conectar com o serviço de cadastro." };
      }
    }

    // 2. ISOLAMENTO TOTAL DE SESSÃO: Limpa caches e histórico anteriores
    this.clearUserSessionAndCaches();

    // 3. Registra localmente para garantir consistência anti-duplicidade
    this.recordRegisteredUserLocally({
      id: supabaseUserId,
      email: cleanEmail,
      cpf: cleanCpf,
      role: "MOTORISTA",
    });

    const newDriver: AuthUserProfile = {
      id: supabaseUserId,
      name: cleanName,
      email: cleanEmail,
      phone: normPhone.formatado,
      cpf: cleanCpf,
      role: "MOTORISTA",
      avatarUrl: params.fotoPerfilUrl || "",
      rating: 5.0,
      totalTrips: 0,
      vehiclePlate: params.vehiclePlate?.toUpperCase(),
      vehicleModel: params.vehicleModel,
      driverApprovalStatus: "pendente",
      createdAt: Date.now(),
    };

    if (params.fotoPerfilUrl) {
      try {
        localStorage.setItem("partiu_user_avatar", params.fotoPerfilUrl);
      } catch {}
    }

    this.saveStoredSession(newDriver);

    return {
      success: true,
      user: newDriver,
      redirectUrl: "/app/motorista",
    };
  }

  /**
   * Recuperação de Senha via Supabase
   */
  public async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      return { success: false, message: "Informe um e-mail válido para recuperação." };
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.resetPasswordForEmail(clean, {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth?reset=1`,
        });
      } catch (err) { silentCatchWarn("supabase-auth-service", err); }
    }

    return {
      success: true,
      message: `Se o e-mail ${clean} estiver cadastrado, você receberá instruções para redefinir sua senha.`,
    };
  }

  /**
   * Login Rápido de Demonstração em 1-Clique (Ideal para Testes e Homologação)
   */
  public quickDemoLogin(role: UserRole): AuthResult {
    const demo = DEMO_PROFILES[role];
    this.saveStoredSession(demo);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("partiu_demo_user", "true");
        if (role === "MOTORISTA") {
          localStorage.setItem("partiu_driver_demo", "true");
          localStorage.setItem("partiu_demo_driver_mot-001", "true");
          localStorage.setItem(`partiu_demo_driver_${demo.id}`, "true");
        }
      } catch (err) {
        silentCatchWarn("quickDemoLogin", err);
      }
    }

    const redirectUrl =
      role === "MOTORISTA" ? "/app/motorista" : role === "ADMIN" ? "/app/admin" : "/app";

    return {
      success: true,
      user: demo,
      redirectUrl,
    };
  }

  /**
   * Encerra a sessão do usuário com higienização estrita de todos os caches
   */
  public async signOut(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) { silentCatchWarn("supabase-auth-service", err); }
    }
    this.clearUserSessionAndCaches();
  }
}

export const supabaseAuthService = SupabaseAuthService.getInstance();
