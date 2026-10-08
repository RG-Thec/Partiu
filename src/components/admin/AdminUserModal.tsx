import { useState } from "react";
import { X, ShieldCheck, Building2, User, Mail, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import type { AdminRole } from "@/lib/admin-rbac";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export interface AdminUserRecord {
  id: string;
  nome: string;
  email: string;
  role: AdminRole;
  tenant_id?: string | null;
  praca_nome?: string | null;
  ativo: boolean;
  created_at: string;
}

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AdminUserRecord) => void;
  initialUser?: AdminUserRecord | null;
  pracasDisponiveis: Array<{ id: string; nome: string }>;
}

export function AdminUserModal({
  isOpen,
  onClose,
  onSuccess,
  initialUser,
  pracasDisponiveis,
}: AdminUserModalProps) {
  const [nome, setNome] = useState(initialUser?.nome || "");
  const [email, setEmail] = useState(initialUser?.email || "");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<AdminRole>(initialUser?.role || "FRANQUEADO");
  const [tenantId, setTenantId] = useState<string>(initialUser?.tenant_id || pracasDisponiveis[0]?.id || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !email.trim()) {
      setErro("Preencha o nome e o e-mail corporativo.");
      return;
    }

    if (role === "FRANQUEADO" && !tenantId) {
      setErro("Para a função de Franqueado, selecione obrigatoriamente a praça/tenant de atuação.");
      return;
    }

    setSalvando(true);

    try {
      const pracaSelecionada = pracasDisponiveis.find((p) => p.id === tenantId);
      const isSuper = role === "SUPER_ADMIN";

      const novoUsuario: AdminUserRecord = {
        id: initialUser?.id || `usr_${Date.now()}`,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        role,
        tenant_id: isSuper ? null : tenantId,
        praca_nome: isSuper ? "Acesso Global (Todos os Tenants)" : pracaSelecionada?.nome || "Regional",
        ativo: true,
        created_at: initialUser?.created_at || new Date().toISOString(),
      };

      if (isSupabaseConfigured()) {
        try {
          await (supabase as any).from("admin_users").upsert({
            id: novoUsuario.id,
            email: novoUsuario.email,
            role: novoUsuario.role.toLowerCase(),
            is_super_admin: isSuper,
            tenant_id: novoUsuario.tenant_id,
            updated_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn("[AdminUserModal] Persistência remota em contingência:", dbErr);
        }
      }

      onSuccess(novoUsuario);
      onClose();
    } catch (err: any) {
      setErro(err?.message || "Erro ao salvar usuário administrativo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {initialUser ? "Editar Administrador" : "Novo Usuário Administrativo"}
              </h2>
              <p className="text-xs text-slate-400">
                Controle de Acesso RBAC • 2 Modalidades Estritas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Ex: Carlos Albuquerque"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="Ex: franqueado.macae@partiu.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {!initialUser && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Senha Provisória
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-primary transition"
                />
              </div>
            </div>
          )}

          {/* Seletor de Nível de Acesso (Strict RBAC: 2 opções) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Nível de Acesso (RBAC)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-primary transition cursor-pointer"
            >
              <option value="SUPER_ADMIN">Super Administrador (Acesso Total)</option>
              <option value="FRANQUEADO">Franqueado (Acesso Local)</option>
            </select>
          </div>

          {/* Campo condicional para Franqueado */}
          {role === "FRANQUEADO" ? (
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2 animate-in fade-in">
              <label className="block text-xs font-black uppercase tracking-wider text-indigo-300">
                Praça / Tenant Regional Vinculado *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                <select
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full bg-slate-950 border border-indigo-500/40 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white outline-none focus:border-indigo-400 transition cursor-pointer"
                >
                  <option value="">Selecione a praça do franqueado...</option>
                  {pracasDisponiveis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                🔒 <strong>Isolamento RLS:</strong> O Franqueado terá acesso restrito exclusivamente aos motoristas, corridas e faturamento desta praça.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Acesso Global Holding / Matriz</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                🌐 O Super Administrador possui visibilidade total de todos os tenants, configurações avançadas do sistema, finops consolidado e catálogos globais.
              </p>
            </div>
          )}

          {/* Footer com Ações */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black transition hover:brightness-110 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{salvando ? "Salvando..." : "Salvar Administrador"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
