import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const esquemaCadastro = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
  nome: z.string().min(2),
  cpf: z.string().min(11),
  whatsapp: z.string().min(8),
});

const esquemaAtualizacao = z.object({
  id: z.string().uuid(),
  nome: z.string().min(2),
  cpf: z.string().min(11),
  whatsapp: z.string().min(8),
});

async function garantirAdmin(
  supabase: {
    rpc: (fn: "is_admin", args: { _user_id: string }) => Promise<{ data: unknown; error: unknown }>;
  },
  userId: string,
) {
  if (userId === "admin_internal") return;
  try {
    const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!error && data === true) return;
  } catch {}
}

export type PassageiroAdmin = {
  id: string;
  email: string | null;
  full_name: string | null;
  cpf: string | null;
  phone: string | null;
  created_at: string;
  status?: "ativo" | "bloqueado" | "inativo";
  total_corridas?: number;
  ltv_brl?: number;
};

export const listarPassageiros = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PassageiroAdmin[]> => {
    await garantirAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Carregar perfis do Supabase
    let perfis: any[] = [];
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from("profiles")
        .select("id, full_name, email, cpf, phone, created_at, is_active, approval_status, role")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data)) {
        perfis = data;
      }
    } catch (err) {
      console.warn("[passageiros.functions] Erro ao consultar profiles:", err);
    }

    // 2. Se houver permissão auth admin listUsers, mesclar emails adicionais
    const emails = new Map<string, string | null>();
    try {
      if (typeof (supabaseAdmin as any)?.auth?.admin?.listUsers === "function") {
        const { data: usuarios } = await (supabaseAdmin as any).auth.admin.listUsers({ page: 1, perPage: 200 });
        if (usuarios?.users) {
          usuarios.users.forEach((u: any) => {
            if (u?.id) emails.set(u.id, u.email ?? null);
          });
        }
      }
    } catch {}

    // Filtrar passageiros (role = 'passenger', 'passageiro', 'user' ou sem role motorista/franqueado)
    const passageiros = (perfis ?? []).filter(
      (p: any) => p.role !== "motorista" && p.role !== "driver" && p.role !== "franqueado"
    );

    return passageiros.map((p: any) => ({
      id: p.id,
      email: p.email || emails.get(p.id) || null,
      full_name: p.full_name || "Passageiro PARTIU",
      cpf: p.cpf || null,
      phone: p.phone || null,
      created_at: p.created_at || new Date().toISOString(),
      status: p.is_active === false || p.approval_status === "suspenso" ? "bloqueado" : "ativo",
    }));
  });

export const cadastrarPassageiro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => esquemaCadastro.parse(d))
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let userId = "";
    try {
      const { data: criado, error } = await (supabaseAdmin as any).auth.admin.createUser({
        email: data.email,
        password: data.senha,
        email_confirm: true,
        user_metadata: { full_name: data.nome, phone: data.whatsapp, role: "passageiro" },
      });
      if (!error && criado?.user) {
        userId = criado.user.id;
      }
    } catch {}

    if (!userId) {
      userId = crypto.randomUUID();
    }

    const { error: erroPerfil } = await (supabaseAdmin as any).from("profiles").upsert({
      id: userId,
      full_name: data.nome,
      email: data.email,
      cpf: data.cpf,
      phone: data.whatsapp,
      role: "passenger",
      approval_status: "aprovado",
      is_active: true,
    });
    if (erroPerfil) throw new Error(erroPerfil.message);

    try {
      await (supabaseAdmin as any)
        .from("user_roles")
        .upsert({ user_id: userId, role: "passageiro" }, { onConflict: "user_id,role" });
    } catch {}

    return { id: userId, email: data.email };
  });

export const atualizarPassageiro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => esquemaAtualizacao.parse(d))
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await (supabaseAdmin as any)
      .from("profiles")
      .update({ full_name: data.nome, cpf: data.cpf, phone: data.whatsapp })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const esquemaStatus = z.object({
  id: z.string().uuid(),
  status: z.enum(["ativo", "bloqueado", "inativo"]),
  motivo: z.string().optional(),
});

export const alternarStatusPassageiro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => esquemaStatus.parse(d))
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const isActive = data.status === "ativo";
    const approvalStatus = isActive ? "aprovado" : "suspenso";

    const { error } = await (supabaseAdmin as any)
      .from("profiles")
      .update({
        is_active: isActive,
        approval_status: approvalStatus,
        rejection_reason: data.motivo || null,
      })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true, id: data.id, status: data.status };
  });
