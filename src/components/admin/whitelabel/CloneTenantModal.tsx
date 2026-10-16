import React, { useState } from "react";
import {
  Plus,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Check,
  MapPin,
  ShieldCheck,
  Radio,
  Sliders,
  Compass,
} from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { toast } from "sonner";
import { buscarCidadesBrasil, type CidadeBrasil } from "@/lib/geo/brazil-cities";
import { type ModoExclusividadeTerritorial } from "@/lib/white-label/white-label-types";

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

  // Estados de Territorialidade & Exclusividade
  const [sugestoes, setSugestoes] = useState<CidadeBrasil[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [latCentro, setLatCentro] = useState<number>(-19.916681);
  const [lngCentro, setLngCentro] = useState<number>(-43.934493);
  const [raioKm, setRaioKm] = useState<number>(30);
  const [modoExclusividade, setModoExclusividade] = useState<ModoExclusividadeTerritorial>("CIDADE_ESTRITA");
  const [bloquearFora, setBloquearFora] = useState(true);
  const [bloquearNovasContas, setBloquearNovasContas] = useState(true);
  const [bloquearFrotaVizinha, setBloquearFrotaVizinha] = useState(true);
  const [cidadesExpansaoTexto, setCidadesExpansaoTexto] = useState("");

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
    const matches = buscarCidadesBrasil(val);
    setSugestoes(matches);
    setMostrarSugestoes(matches.length > 0 && val.trim().length >= 2);

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
    if (!nomeOperacao || nomeOperacao.endsWith(" Mob")) {
      setNomeOperacao(`${val} Mob`);
    }
    if (!adminEmail || adminEmail.includes("@partiu.app")) {
      setAdminEmail(`${slug}@partiu.app`);
    }
  }

  function selecionarCidadeSugestao(cid: CidadeBrasil) {
    setCidadeNome(cid.nome);
    setEstadoUf(cid.uf);
    setLatCentro(cid.lat);
    setLngCentro(cid.lng);
    setRaioKm(cid.raioSugeridoKm);
    setMostrarSugestoes(false);

    const slug = cid.nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    setTenantId(`tenant-${slug}`);
    setNomeOperacao(`${cid.nome} Mob`);
    setAdminEmail(`${slug}@partiu.app`);
    toast.success(`Geolocalização e raio de ${cid.nome}/${cid.uf} definidos automaticamente!`);
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

    // Processa cidades de expansão compradas/licenciadas
    const adicionais = cidadesExpansaoTexto
      .split(/[,;\n]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const modoFinal: ModoExclusividadeTerritorial =
      adicionais.length > 0 ? "MULTI_CIDADES_EXPANSAO" : modoExclusividade;

    const territorioConfig = {
      modo: modoFinal,
      isMatrizNacional: false,
      cidadeSede: cidadeNome.trim(),
      estadoUf: estadoUf.trim().toUpperCase(),
      latCentro: Number(latCentro),
      lngCentro: Number(lngCentro),
      raioMaximoKm: Number(raioKm),
      cidadesLicenciadas: [cidadeNome.trim(), ...adicionais],
      bloquearChamadasForaTerritorio: bloquearFora,
      bloquearNovasContasForaTerritorio: bloquearNovasContas,
      bloquearDespachoFrotaVizinha: bloquearFrotaVizinha,
      permitirExpansaoPaga: true,
      valorExpansaoPorCidadeBrl: 1500,
      notasExclusividade: `Praça exclusiva outorgada para ${cidadeNome}/${estadoUf} com raio de ${raioKm}km.`,
    };

    try {
      cloneTenant(
        tenantId.trim(),
        cidadeNome.trim(),
        estadoUf.trim().toUpperCase(),
        operacaoFinal,
        emailFinal,
        senhaFinal,
        responsavelNome.trim() || "Gestor de Franquia",
        responsavelTelefone.trim() || "(00) 00000-0000",
        territorioConfig
      );

      switchTenant(tenantId.trim());
      toast.success(`Franquia ${operacaoFinal} criada com território exclusivo ativo!`);
      onClose();
      onCloned();
    } catch (err: any) {
      toast.error(`Erro ao criar franquia: ${err?.message || "Falha inesperada"}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              Nova Franquia / Praça Regional Exclusiva
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cadastre a nova franquia com demarcação territorial obrigatória, blindagem de frota e credenciais de acesso.
            </p>
          </div>
        </div>

        <form onSubmit={handleSalvar} className="space-y-4 text-xs">
          {/* Seção 1: Dados da Franquia & Cidade */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 block">
              1. Identificação da Franquia & Cidade Base
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

            <div className="grid grid-cols-3 gap-2 relative">
              <div className="col-span-2 relative">
                <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-400" />
                  Cidade de Atuação
                </label>
                <input
                  type="text"
                  placeholder="Digite a cidade (ex: Curitiba, Campinas, Belo Horizonte)..."
                  value={cidadeNome}
                  onChange={(e) => handleCidadeChange(e.target.value)}
                  onFocus={() => {
                    if (sugestoes.length > 0) setMostrarSugestoes(true);
                  }}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 font-medium"
                />

                {/* Autocomplete Dropdown */}
                {mostrarSugestoes && sugestoes.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {sugestoes.map((s, idx) => (
                      <button
                        key={`${s.nome}-${s.uf}-${idx}`}
                        type="button"
                        onClick={() => selecionarCidadeSugestao(s)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-800 text-xs text-white border-b border-slate-800/80 last:border-b-0 flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-semibold">
                          {s.nome} — <span className="text-primary-400 font-bold">{s.uf}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Raio sugerido: {s.raioSugeridoKm}km
                        </span>
                      </button>
                    ))}
                  </div>
                )}
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

          {/* Seção 2: Prioridade Territorial & Exclusividade */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-primary-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-400" />
                2. Prioridade Territorial & Geofencing Exclusivo
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-950 text-primary-300 border border-primary-800 font-bold">
                Anti-Invasão Ativo
              </span>
            </div>

            {/* Resumo do Território Vinculado */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>
                  <strong>Praça:</strong> {cidadeNome || "Não definida"} ({estadoUf})
                </span>
              </div>
              <span className="font-mono text-primary-400 font-bold">
                Raio: {raioKm} km
              </span>
            </div>

            {/* Coordenadas e Raio */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Latitude Central</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latCentro}
                  onChange={(e) => setLatCentro(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Longitude Central</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lngCentro}
                  onChange={(e) => setLngCentro(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Raio Máx (km)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={raioKm}
                  onChange={(e) => setRaioKm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono text-[11px] font-bold text-center"
                />
              </div>
            </div>

            {/* Travas de Não-Canibalização */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bloquearFora}
                  onChange={(e) => setBloquearFora(e.target.checked)}
                  className="rounded border-slate-700 text-primary-600 focus:ring-0"
                />
                <span className="font-medium">
                  Bloquear chamadas de passageiros fora da cidade/raio desta franquia
                </span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bloquearNovasContas}
                  onChange={(e) => setBloquearNovasContas(e.target.checked)}
                  className="rounded border-slate-700 text-primary-600 focus:ring-0"
                />
                <span className="font-medium">
                  Bloquear novos cadastros de usuários fora da cidade/raio desta franquia
                </span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bloquearFrotaVizinha}
                  onChange={(e) => setBloquearFrotaVizinha(e.target.checked)}
                  className="rounded border-slate-700 text-primary-600 focus:ring-0"
                />
                <span className="font-medium">
                  Bloquear despacho de frotas vizinhas (evitar canibalização entre cidades)
                </span>
              </label>
            </div>

            {/* Cidades Adicionais de Expansão */}
            <div className="pt-1">
              <label className="text-slate-300 font-bold block mb-1">
                Cidades Adicionais Licenciadas (Expansão Territorial)
              </label>
              <input
                type="text"
                placeholder="Ex: Contagem, Betim, Nova Lima (separadas por vírgula)"
                value={cidadesExpansaoTexto}
                onChange={(e) => setCidadesExpansaoTexto(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Caso a franquia tenha adquirido direito de expansão para municípios vizinhos.
              </p>
            </div>
          </div>

          {/* Seção 3: Credenciais de Acesso do Franqueado */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>3. Acesso ao Painel do Franqueado</span>
              <span className="text-[10px] text-slate-500 font-normal">Super Admin pode alterar depois</span>
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

          {/* Seção 4: Responsável */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              4. Dados do Gestor (Opcional)
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
              <span>Criar e Ativar Franquia Exclusiva</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
