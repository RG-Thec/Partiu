/**
 * ==============================================================================
 * 📍 PARTIU REVENUE OS — ADDRESS PERSISTENCE & CLOUD SYNC SERVICE (V2)
 * ==============================================================================
 * Gerencia os endereços salvos do passageiro (Casa, Trabalho, Favoritos) com
 * persistência local prioritária em "partiu_enderecos_salvos_v1" e sincronização
 * bidirecional em nuvem via tabela public.user_addresses no Supabase.
 * ==============================================================================
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { SAVED_LOCATIONS, type SavedLocation } from "@/lib/passenger/passenger-ride-machine";
import { silentCatchWarn } from "@/lib/structured-logger";


export const STORAGE_ENDERECOS_KEY = "partiu_enderecos_salvos_v1";

export interface UserAddressItem {
  id: string;
  userId?: string;
  tag: "casa" | "trabalho" | "favorito";
  label: string;
  sublabel?: string;
  endereco: string;
  coords: [number, number];
  icon?: string;
  is_favorite?: boolean;
  created_at?: string;
}

export class AddressService {
  private static instance: AddressService;

  private constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_ENDERECOS_KEY) {
          window.dispatchEvent(new CustomEvent("partiu:addresses_updated"));
        }
      });
    }
  }

  public static getInstance(): AddressService {
    if (!AddressService.instance) {
      AddressService.instance = new AddressService();
    }
    return AddressService.instance;
  }

  /**
   * Obtém a chave de armazenamento isolada por usuário para prevenir vazamento cross-account
   */
  public getStorageKey(userIdParam?: string): string {
    if (typeof window === "undefined") return STORAGE_ENDERECOS_KEY;
    const session = supabaseAuthService.getStoredSession();
    const uid = userIdParam || session?.id || localStorage.getItem("partiu_user_id");
    if (uid && uid !== "passageiro_default") {
      return `partiu_enderecos_salvos_v1_${uid}`;
    }
    return STORAGE_ENDERECOS_KEY;
  }

  /**
   * Leitura rápida síncrona do cache local (0ms de latência), isolada por usuário
   */
  public getLocalAddresses(userIdParam?: string): SavedLocation[] {
    if (typeof window === "undefined") return [];
    try {
      const key = this.getStorageKey(userIdParam);
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: SavedLocation[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filtra itens residuais mockados de ambientes legados
          return parsed.filter(
            (a) =>
              a &&
              a.endereco &&
              a.endereco !== "Rua Dez de Maio, 188 - Centro, Itaperuna - RJ" &&
              a.endereco !== "Av. Cardoso Moreira, 310 - Centro, Itaperuna - RJ" &&
              a.endereco !== "Av. Vinhosa, 780 - Vinhosa, Itaperuna - RJ"
          );
        }
      }
    } catch (err) { silentCatchWarn("AddressService", err); }
    return [];
  }

  /**
   * Salva lista no armazenamento local e notifica os componentes reativos
   */
  public saveLocalAddresses(lista: SavedLocation[], userIdParam?: string): void {
    if (typeof window === "undefined") return;
    try {
      const key = this.getStorageKey(userIdParam);
      localStorage.setItem(key, JSON.stringify(lista));
      window.dispatchEvent(new CustomEvent("partiu:addresses_updated"));
    } catch (err) { silentCatchWarn("AddressService", err); }
  }

  /**
   * Retorna o endereço de Casa (ou null se não cadastrado)
   */
  public getCasa(userIdParam?: string): UserAddressItem | null {
    const addresses = this.getLocalAddresses(userIdParam);
    const found = addresses.find(
      (a) => a.id === "loc-casa" || a.label.trim().toLowerCase() === "casa" || a.icone === "home"
    );
    if (!found) return null;
    return {
      id: found.id,
      tag: "casa",
      label: found.label || "Casa",
      sublabel: found.sublabel,
      endereco: found.endereco,
      coords: found.coords,
      icon: "home",
      is_favorite: true,
    };
  }

  /**
   * Retorna o endereço de Trabalho (ou null se não cadastrado)
   */
  public getTrabalho(userIdParam?: string): UserAddressItem | null {
    const addresses = this.getLocalAddresses(userIdParam);
    const found = addresses.find(
      (a) => a.id === "loc-trabalho" || a.label.trim().toLowerCase() === "trabalho" || a.icone === "work"
    );
    if (!found) return null;
    return {
      id: found.id,
      tag: "trabalho",
      label: found.label || "Trabalho",
      sublabel: found.sublabel,
      endereco: found.endereco,
      coords: found.coords,
      icon: "briefcase",
      is_favorite: true,
    };
  }

  /**
   * Retorna a lista de locais favoritos customizados (excluindo Casa e Trabalho)
   */
  public getFavoritos(userIdParam?: string): UserAddressItem[] {
    const addresses = this.getLocalAddresses(userIdParam);
    return addresses
      .filter((a) => {
        const lbl = a.label.trim().toLowerCase();
        return lbl !== "casa" && lbl !== "trabalho" && a.id !== "loc-casa" && a.id !== "loc-trabalho";
      })
      .map((a) => ({
        id: a.id,
        tag: "favorito",
        label: a.label,
        sublabel: a.sublabel,
        endereco: a.endereco,
        coords: a.coords,
        icon: a.icone === "home" || a.icone === "work" ? "star" : a.icone,
        is_favorite: true,
      }));
  }

  /**
   * Carrega endereços locais e sincroniza em background com o Supabase
   */
  public async getAddresses(userIdParam?: string): Promise<SavedLocation[]> {
    const local = this.getLocalAddresses();
    const session = supabaseAuthService.getStoredSession();
    const userId = userIdParam || session?.id;

    if (!isSupabaseConfigured() || !userId) {
      return local;
    }

    try {
      const { data, error } = await (supabase as any)
        .from("user_addresses")
        .select("*")
        .eq("user_id", userId);

      if (!error && data && data.length > 0) {
        const cloudLocations: SavedLocation[] = data.map((d: any) => {
          let icone: SavedLocation["icone"] = "cart";
          const lbl = (d.label || "").toLowerCase();
          if (lbl === "casa" || d.icon === "home") icone = "home";
          else if (lbl === "trabalho" || d.icon === "work" || d.icon === "briefcase") icone = "work";

          return {
            id: d.id,
            label: d.label,
            sublabel: d.address,
            endereco: d.address,
            coords: [Number(d.longitude) || -41.888, Number(d.latitude) || -21.205],
            icone,
          };
        });

        // Mescla garantindo prioridade de itens mais recentes
        const ids = new Set(cloudLocations.map((c) => c.id));
        const labels = new Set(cloudLocations.map((c) => c.label.toLowerCase()));
        const merged = [...cloudLocations];
        for (const loc of local) {
          if (!ids.has(loc.id) && !labels.has(loc.label.toLowerCase())) {
            merged.push(loc);
          }
        }

        this.saveLocalAddresses(merged);
        return merged;
      }
    } catch (err) { silentCatchWarn("AddressService", err); }

    return local;
  }

  /**
   * Salva o endereço de Casa (Upsert local e nuvem)
   */
  public async saveCasa(endereco: string, coords: [number, number], userIdParam?: string): Promise<UserAddressItem> {
    const item: SavedLocation = {
      id: "loc-casa",
      label: "Casa",
      sublabel: endereco.split(",")[0] || endereco,
      endereco: endereco.trim(),
      coords,
      icone: "home",
    };

    const atuais = this.getLocalAddresses(userIdParam).filter(
      (a) => a.id !== "loc-casa" && a.label.trim().toLowerCase() !== "casa"
    );
    const atualizados = [item, ...atuais];
    this.saveLocalAddresses(atualizados, userIdParam);

    this.syncToCloud(item, userIdParam, "home");

    return {
      id: item.id,
      tag: "casa",
      label: "Casa",
      sublabel: item.sublabel,
      endereco: item.endereco,
      coords: item.coords,
      icon: "home",
      is_favorite: true,
    };
  }

  /**
   * Salva o endereço de Trabalho (Upsert local e nuvem)
   */
  public async saveTrabalho(endereco: string, coords: [number, number], userIdParam?: string): Promise<UserAddressItem> {
    const item: SavedLocation = {
      id: "loc-trabalho",
      label: "Trabalho",
      sublabel: endereco.split(",")[0] || endereco,
      endereco: endereco.trim(),
      coords,
      icone: "work",
    };

    const atuais = this.getLocalAddresses(userIdParam).filter(
      (a) => a.id !== "loc-trabalho" && a.label.trim().toLowerCase() !== "trabalho"
    );
    const atualizados = [item, ...atuais];
    this.saveLocalAddresses(atualizados, userIdParam);

    this.syncToCloud(item, userIdParam, "briefcase");

    return {
      id: item.id,
      tag: "trabalho",
      label: "Trabalho",
      sublabel: item.sublabel,
      endereco: item.endereco,
      coords: item.coords,
      icon: "briefcase",
      is_favorite: true,
    };
  }

  /**
   * Salva um novo local favorito customizado
   */
  public async saveFavorito(
    label: string,
    endereco: string,
    coords: [number, number],
    icon = "star",
    userIdParam?: string
  ): Promise<UserAddressItem> {
    const item: SavedLocation = {
      id: `loc-fav-${Date.now()}`,
      label: label.trim(),
      sublabel: endereco.split(",")[0] || endereco,
      endereco: endereco.trim(),
      coords,
      icone: "cart",
    };

    const atuais = this.getLocalAddresses(userIdParam);
    const atualizados = [...atuais, item];
    this.saveLocalAddresses(atualizados, userIdParam);

    this.syncToCloud(item, userIdParam, icon);

    return {
      id: item.id,
      tag: "favorito",
      label: item.label,
      sublabel: item.sublabel,
      endereco: item.endereco,
      coords: item.coords,
      icon,
      is_favorite: true,
    };
  }

  private async syncToCloud(item: SavedLocation, userIdParam?: string, iconName = "map-pin") {
    const session = supabaseAuthService.getStoredSession();
    const userId = userIdParam || session?.id;

    if (!isSupabaseConfigured() || !userId) return;

    try {
      if (item.label.toLowerCase() === "casa" || item.label.toLowerCase() === "trabalho") {
        await (supabase as any)
          .from("user_addresses")
          .delete()
          .eq("user_id", userId)
          .ilike("label", item.label);
      }

      await (supabase as any).from("user_addresses").insert({
        user_id: userId,
        label: item.label,
        address: item.endereco,
        latitude: item.coords[1],
        longitude: item.coords[0],
        icon: iconName,
        is_favorite: true,
      });
    } catch (err) {
      console.warn("Aviso ao persistir endereço no Supabase:", err);
    }
  }

  public async addAddress(
    novo: { label: string; endereco: string; coords?: [number, number]; icone?: SavedLocation["icone"] },
    userIdParam?: string
  ): Promise<SavedLocation[]> {
    const session = supabaseAuthService.getStoredSession();
    const userId = userIdParam || session?.id;

    const item: SavedLocation = {
      id: `loc-${Date.now()}`,
      label: novo.label.trim(),
      sublabel: novo.endereco.trim(),
      endereco: novo.endereco.trim(),
      coords: novo.coords || [-41.888, -21.205],
      icone: novo.icone || "cart",
    };

    const atuais = this.getLocalAddresses();
    const atualizados = [...atuais, item];
    this.saveLocalAddresses(atualizados);

    if (isSupabaseConfigured() && userId) {
      try {
        await (supabase as any).from("user_addresses").insert({
          user_id: userId,
          label: item.label,
          address: item.endereco,
          latitude: item.coords[1],
          longitude: item.coords[0],
          icon: item.icone,
        });
      } catch (err) {
        console.warn("Aviso ao sincronizar endereço no Supabase:", err);
      }
    }

    return atualizados;
  }

  public async removeAddress(id: string, userIdParam?: string): Promise<SavedLocation[]> {
    const session = supabaseAuthService.getStoredSession();
    const userId = userIdParam || session?.id;

    const atuais = this.getLocalAddresses();
    const atualizados = atuais.filter((a) => a.id !== id);
    this.saveLocalAddresses(atualizados);

    if (isSupabaseConfigured() && userId) {
      try {
        await (supabase as any)
          .from("user_addresses")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);
      } catch (err) { silentCatchWarn("AddressService", err); }
    }

    return atualizados;
  }
}

export const addressService = AddressService.getInstance();
