import React, { useState } from "react";
import { Plus, Eye, EyeOff, Sparkles, Building2, Mail, Lock, User, Phone, Check } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { toast } from "sonner";

interface CloneTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloned: () => void;
}

export function CloneTenantModal({ isOpen, onClose, onCloned }: CloneTenantModalProps) {
  const { cloneTenant, switchTenant } = useBrandTheme();

  const [nomeOperacao, setNomeOperacao] = useState("");
  const [cidadeNome, setCidadeNome] = useState("");
  const [estadoUf, setEstadoUf] = useState("MG");
  const [tenantId, setTenantId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminSenha, setAdminSenha] = useState("Franqueado2026!");
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelTelefone, setResponsavelTelefone] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  if (!isOpen) return null;

  function handleGerarSenha() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminSenha(pass);
    toast.success("Nova senha gerada!");
  }

  function handleCidadeChange(val: string) {
    setCidadeNome(val);
    const slug = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    if (!tenantId || tenantId.startsWith("tenant-")) {
      setTenantId(`tenant-${slug}`);
    }
    if (!nomeOperacao) {
      setNomeOperacao(`${val} Mob`);
    }
    if (!adminEmail) {
      setAdminEmail(`${slug}@partiu.app`);
    }
  }

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!cidadeNome.trim() || !tenantId.trim()) {
      toast.error("Informe pelo menos a cidade e o identificador da franquia.");
      return;
    }

    const emailFinal = adminEmail.trim().toLowerCase() || `${tenantId.replace("tenant-", "")}@partiu.app`;
    const senhaFinal = adminSenha.trim() || "Franqueado2026!";
    const operacaoFinal = nomeOperacao.trim() || `${cidadeNome.trim()} Mob`;

    try {
      cloneTenant(
        tenantId.trim(),
        cidadeNome.trim(),
        estadoUf.trim().toUpperCase(),
        operacaoFinal,
        emailFinal,
        senhaFinal,
        responsavelNome.trim() || "Gestor de Franquia",
        responsavelTelefone.trim() || "(00) 00000-0000"
      );

      switchTenant(tenantId.trim());
      toast.success(`Franquia ${operacaoFinal} criada com sucesso!`);
      onClose();
      onCloned();
    } catch (err: any) {
      toast.error(`Erro ao criar franquia: ${err?.message || "Falha inesperada"}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              Nova Franquia / Praça Regional
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cadastre a nova franquia com e-mail e senha de acesso para fornecer ao franqueado.
            </p>
          </div>
        </div>

        <form onSubmit={handleSalvar} className="space-y-4 text-xs">
          {/* Seção 1: Dados da Franquia */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 block">
              1. Identificação da Franquia
            </span>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Nome da Operação (White Label)</label>
              <input
                type="text"
                placeholder="ex: BH Mob, Rio Mobe, Curitiba Express"
                value={nomeOperacao}
                onChange={(e) => setNomeOperacao(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-slate-300 font-bold block mb-1">Cidade</label>
                <input
                  type="text"
                  placeholder="ex: Belo Horizonte"
                  value={cidadeNome}
                  onChange={(e) => handleCidadeChange(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Estado (UF)</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="ex: MG"
                  value={estadoUf}
                  onChange={(e) => setEstadoUf(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 font-bold text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">ID Único da Franquia (Slug do Tenant)</label>
              <input
                type="text"
                placeholder="ex: tenant-bhmob"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value.toLowerCase())}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 font-mono"
              />
            </div>
          </div>

          {/* Seção 2: Credenciais de Acesso do Franqueado */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-primary-500/30 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 flex items-center justify-between">
              <span>2. Acesso ao Painel do Franqueado</span>
              <span className="text-[10px] text-slate-400 font-normal">Super Admin pode alterar depois</span>
            </span>

            <div>
              <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary-400" />
                E-mail de Login do Franqueado
              </label>
              <input
                type="email"
                placeholder="ex: bhmob@partiu.app ou contato@bhmob.com.br"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary-400" />
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={handleGerarSenha}
                  className="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Gerar Senha
                </button>
              </div>

              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Defina a senha para o franqueado"
                  value={adminSenha}
                  onChange={(e) => setAdminSenha(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Seção 3: Responsável */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Dados do Gestor (Opcional)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nome do Gestor</label>
                <input
                  type="text"
                  placeholder="ex: Carlos Silva"
                  value={responsavelNome}
                  onChange={(e) => setResponsavelNome(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="ex: (31) 98765-4321"
                  value={responsavelTelefone}
                  onChange={(e) => setResponsavelTelefone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!cidadeNome || !tenantId}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-primary-600 hover:bg-primary-500 text-slate-950 disabled:opacity-40 cursor-pointer shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Criar e Ativar Franquia</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
