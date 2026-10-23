import React, { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Landmark,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Palette,
  DollarSign,
  MapPin,
  Lock,
  Mail,
  Phone,
  FileText,
  Key,
  Globe,
  Sparkles,
  RefreshCw,
  Save,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { GuardiaoAcesso } from "@/components/admin/GuardiaoAcesso";
import { whiteLabelEngine } from "@/lib/white-label";
import { MapboxConfig } from "@/config/MapboxConfig";
import type { WhiteLabelTenantRecord } from "@/lib/white-label/white-label-types";

export const Route = createFileRoute("/app/admin/matriz")({
  head: () => ({
    meta: [
      { title: "Franquia Mãe — Matriz Nacional Holding | PARTIU Super Admin" },
      {
        name: "description",
        content:
          "Governança central da holding PARTIU: identidade visual raiz, chave PIX oficial, dados institucionais e infraestrutura de mapas.",
      },
    ],
  }),
  component: SuperAdminMatrizPage,
});

function SuperAdminMatrizPage() {
  return (
    <GuardiaoAcesso somenteSuperAdmin={true}>
      <SuperAdminMatrizContent />
    </GuardiaoAcesso>
  );
}

function SuperAdminMatrizContent() {
  // Carrega ou garante o tenant matriz oficial "default"
  const [matriz, setMatriz] = useState<WhiteLabelTenantRecord>(() =>
    whiteLabelEngine.getMatrizTenant(),
  );

  // Estados locais do formulário da Matriz
  const [nomeOperacao, setNomeOperacao] = useState(matriz.nomeOperacao || "PARTIU (Matriz Oficial)");
  const [slogan, setSlogan] = useState(
    matriz.configuracaoCompleta?.brandCenter?.slogan || "Sua viagem rápida, segura e sem taxas abusivas",
  );
  const [corPrincipal, setCorPrincipal] = useState(
    matriz.configuracaoCompleta?.designSystem?.paletaPrimaria?.corPrincipal || "#FF6B00",
  );
  const [corSecundaria, setCorSecundaria] = useState(
    matriz.configuracaoCompleta?.designSystem?.paletaPrimaria?.corSecundaria || "#FFB800",
  );
  const [corTexto, setCorTexto] = useState(
    matriz.configuracaoCompleta?.designSystem?.paletaPrimaria?.corTextoPrincipal || "#0F172A",
  );

  // Dados Financeiros & PIX da Holding
  const [chavePixAdmin, setChavePixAdmin] = useState(
    matriz.configuracaoCompleta?.monetization?.chavePixAdmin || "financeiro.matriz@partiu.app",
  );
  const [tipoChavePix, setTipoChavePix] = useState<"cpf" | "email" | "cnpj" | "telefone" | "aleatoria">(
    (matriz.configuracaoCompleta?.monetization?.tipoChavePixAdmin as any) || "email",
  );
  const [beneficiarioAdmin, setBeneficiarioAdmin] = useState(
    matriz.configuracaoCompleta?.monetization?.beneficiarioAdmin || "PARTIU Holding Nacional Ltda",
  );
  const [cidadeAdmin, setCidadeAdmin] = useState(
    matriz.configuracaoCompleta?.monetization?.cidadeAdmin || "Brasília",
  );
  const [diariaCarro, setDiariaCarro] = useState(
    matriz.configuracaoCompleta?.monetization?.diariaCarro ?? 19.9,
  );
  const [diariaMoto, setDiariaMoto] = useState(
    matriz.configuracaoCompleta?.monetization?.diariaMoto ?? 11.9,
  );

  // Dados Institucionais
  const [cnpj, setCnpj] = useState(matriz.cnpjFranqueado || "48.291.834/0001-90");
  const [responsavelNome, setResponsavelNome] = useState(matriz.responsavelNome || "Diretoria Executiva PARTIU");
  const [responsavelEmail, setResponsavelEmail] = useState(matriz.responsavelEmail || "admin@partiumobe.com.br");
  const [responsavelTelefone, setResponsavelTelefone] = useState(matriz.responsavelTelefone || "(22) 99876-5432");
  const [adminEmail, setAdminEmail] = useState(matriz.adminEmail || "superadmin@partiu.app");
  const [adminSenha, setAdminSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // APIs Globais de Mapas
  const [mapboxToken, setMapboxToken] = useState(
    matriz.configuracaoCompleta?.geo?.mapboxAccessToken || "",
  );
  const [googleMapsKey, setGoogleMapsKey] = useState(
    matriz.configuracaoCompleta?.geo?.googleMapsApiKey || "",
  );

  const [salvando, setSalvando] = useState(false);

  // Estatísticas da Rede
  const stats = useMemo(() => {
    return whiteLabelEngine.getFranchiseeStats();
  }, [matriz]);

  // Recarrega matriz se houver broadcast
  useEffect(() => {
    function onTenantUpdate() {
      const atual = whiteLabelEngine.getMatrizTenant();
      setMatriz(atual);
    }
    window.addEventListener("partiu:whitelabel-updated", onTenantUpdate);
    return () => {
      window.removeEventListener("partiu:whitelabel-updated", onTenantUpdate);
    };
  }, []);

  // Salvar configurações da Matriz
  async function handleSalvarMatriz(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSalvando(true);
    try {
      const configAtualizada = {
        ...matriz.configuracaoCompleta,
        brandCenter: {
          ...matriz.configuracaoCompleta.brandCenter,
          nomePlataforma: nomeOperacao.trim(),
          slogan: slogan.trim(),
        },
        designSystem: {
          ...matriz.configuracaoCompleta.designSystem,
          paletaPrimaria: {
            ...matriz.configuracaoCompleta.designSystem.paletaPrimaria,
            corPrincipal: corPrincipal.trim(),
            corSecundaria: corSecundaria.trim(),
            corTextoPrincipal: corTexto.trim(),
          },
        },
        monetization: {
          ...matriz.configuracaoCompleta.monetization,
          chavePixAdmin: chavePixAdmin.trim(),
          tipoChavePixAdmin: tipoChavePix as any,
          beneficiarioAdmin: beneficiarioAdmin.trim(),
          cidadeAdmin: cidadeAdmin.trim(),
          diariaCarro: Number(diariaCarro),
          diariaMoto: Number(diariaMoto),
        },
        geo: {
          ...matriz.configuracaoCompleta.geo,
          mapboxAccessToken: mapboxToken.trim(),
          googleMapsApiKey: googleMapsKey.trim(),
        },
      };

      const payloadAtualizado: any = {
        nomeOperacao: nomeOperacao.trim(),
        responsavelNome: responsavelNome.trim(),
        responsavelEmail: responsavelEmail.trim(),
        responsavelTelefone: responsavelTelefone.trim(),
        cnpjFranqueado: cnpj.trim(),
        adminEmail: adminEmail.trim(),
        configuracaoCompleta: configAtualizada,
      };

      if (adminSenha.trim()) {
        payloadAtualizado.adminSenha = adminSenha.trim();
      }

      const atualizado = await whiteLabelEngine.saveMatrizTenant(payloadAtualizado);
      setMatriz(atualizado);

      // Aplica tema ao vivo no app
      whiteLabelEngine.applyTheme(configAtualizada);

      toast.success("Franquia Mãe (Matriz Nacional) configurada e salva com sucesso!");
      setAdminSenha("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações da Matriz");
    } finally {
      setSalvando(false);
    }
  }

  // Restaurar padrões da Matriz
  function handleRestaurarPadroes() {
    if (
      !confirm(
        "Deseja restaurar as configurações da Franquia Mãe para os valores oficiais de fábrica da holding?",
      )
    ) {
      return;
    }
    setNomeOperacao("PARTIU Mobilidade Urbana (Sede Nacional)");
    setSlogan("Sua viagem rápida, segura e sem taxas abusivas");
    setCorPrincipal("#FF6B00");
    setCorSecundaria("#FFB800");
    setCorTexto("#0F172A");
    setChavePixAdmin("financeiro.matriz@partiu.app");
    setTipoChavePix("email");
    setBeneficiarioAdmin("PARTIU Holding Nacional Ltda");
    setCidadeAdmin("Brasília");
    setDiariaCarro(19.9);
    setDiariaMoto(11.9);
    toast.info("Campos restaurados para os padrões oficiais. Clique em 'Salvar Configurações' para confirmar.");
  }

  // Testar Tema da Matriz ao vivo
  function handleTestarTema() {
    const configTeste = {
      ...matriz.configuracaoCompleta,
      designSystem: {
        ...matriz.configuracaoCompleta.designSystem,
        paletaPrimaria: {
          ...matriz.configuracaoCompleta.designSystem.paletaPrimaria,
          corPrincipal: corPrincipal.trim(),
          corSecundaria: corSecundaria.trim(),
          corTextoPrincipal: corTexto.trim(),
        },
      },
    };
    whiteLabelEngine.applyTheme(configTeste);
    toast.success("Paleta de cores da Matriz aplicada em tempo real na interface.");
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-28">
      {/* 1. CABEÇALHO EXECUTIVO */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs font-black">
              <Landmark className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  Franquia Mãe — Matriz Nacional Holding
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  Conta Oficial Blindada
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identidade padrão da plataforma, chave PIX nacional, credenciais do Super Admin e governança da holding.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/app/admin/franqueados"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-primary-600" />
            <span>Ver Franquias Regionais ({stats.total})</span>
          </Link>
          <button
            type="button"
            onClick={() => handleSalvarMatriz()}
            disabled={salvando}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{salvando ? "Salvando..." : "Salvar Configurações"}</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* NAVEGAÇÃO SUPERIOR DE ESCOPO: FRANQUIAS REGIONAIS VS FRANQUIA MÃE */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl w-fit">
            <Link
              to="/app/admin/franqueados"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50 transition cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-primary-600" />
              <span>Franquias Regionais ({stats.total})</span>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs">
              <Landmark className="w-4 h-4 text-amber-500" />
              <span>Franquia Mãe (Matriz)</span>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-black px-1.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                Sede Holding
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operação Matriz: Irrestrita & Nacional (Brasil)</span>
          </div>
        </section>

        {/* BANNER DE BLINDAGEM DA MATRIZ */}
        <section className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300/80 dark:border-amber-700/40 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <ShieldCheck className="w-6 h-6 stroke-[2.4]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-950 dark:text-white">
                    Franquia Mãe — Núcleo Central Inviolável
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                    Tenant: default
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                  A Franquia Mãe representa a holding proprietária do ecossistema. Ela possui <strong>imunidade contra exclusão e suspensão</strong>, cobertura territorial nacional irrestrita e serve como modelo-base herdado por qualquer nova franquia regional que você licenciar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRestaurarPadroes}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar Padrões</span>
              </button>
            </div>
          </div>
        </section>

        {/* GRID DE CARDS MODULARES DE GOVERNANÇA */}
        <form onSubmit={handleSalvarMatriz} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CARD 1: IDENTIDADE VISUAL DA MARCA MÃE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white">
                    Identidade Visual da Marca Mãe
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Nome da holding, slogan e paleta de cores do ecossistema
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestarTema}
                className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Testar ao vivo</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Oficial da Plataforma Holding
                </label>
                <input
                  type="text"
                  value={nomeOperacao}
                  onChange={(e) => setNomeOperacao(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: PARTIU Mobilidade Urbana"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Slogan Institucional
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Sua viagem rápida, segura e sem taxas abusivas"
                />
              </div>

              {/* Seletor de Cores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Cor Primária Holding
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={corPrincipal}
                      onChange={(e) => setCorPrincipal(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <input
                      type="text"
                      value={corPrincipal}
                      onChange={(e) => setCorPrincipal(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Cor Secundária Holding
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={corSecundaria}
                      onChange={(e) => setCorSecundaria(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <input
                      type="text"
                      value={corSecundaria}
                      onChange={(e) => setCorSecundaria(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Cor Texto Principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={corTexto}
                      onChange={(e) => setCorTexto(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <input
                      type="text"
                      value={corTexto}
                      onChange={(e) => setCorTexto(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div
                className="p-3.5 rounded-2xl text-white flex items-center justify-between shadow-xs transition"
                style={{ backgroundColor: corPrincipal }}
              >
                <div>
                  <p className="text-xs font-black">{nomeOperacao || "PARTIU"}</p>
                  <p className="text-[10px] opacity-90">{slogan}</p>
                </div>
                <div
                  className="px-3 py-1 rounded-xl text-xs font-bold text-slate-950 shadow-2xs"
                  style={{ backgroundColor: corSecundaria }}
                >
                  Botão de Ação
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: RECEBIMENTO CENTRAL & PIX DA HOLDING */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">
                  Recebimento Central & Chave PIX Matriz
                </h3>
                <p className="text-[11px] text-slate-500">
                  Destino de taxas centrais, planos SaaS e arrecadação direta da holding
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Chave PIX Oficial Matriz
                  </label>
                  <input
                    type="text"
                    value={chavePixAdmin}
                    onChange={(e) => setChavePixAdmin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="financeiro.matriz@partiu.app ou CNPJ"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipo de Chave
                  </label>
                  <select
                    value={tipoChavePix}
                    onChange={(e) => setTipoChavePix(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="email">E-mail</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Aleatória (EVP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Beneficiário / Razão Social no Banco
                  </label>
                  <input
                    type="text"
                    value={beneficiarioAdmin}
                    onChange={(e) => setBeneficiarioAdmin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="PARTIU Holding Nacional Ltda"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Cidade do Banco Sede
                  </label>
                  <input
                    type="text"
                    value={cidadeAdmin}
                    onChange={(e) => setCidadeAdmin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Brasília"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Diária Base Sugerida Carro (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={diariaCarro}
                    onChange={(e) => setDiariaCarro(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Diária Base Sugerida Moto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={diariaMoto}
                    onChange={(e) => setDiariaMoto(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: DADOS INSTITUCIONAIS & ACESSO MASTER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">
                  Dados Institucionais & Acesso Master
                </h3>
                <p className="text-[11px] text-slate-500">
                  CNPJ oficial, diretoria executiva e credenciais de login do Super Admin
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    CNPJ da Holding
                  </label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    placeholder="00.000.000/0001-00"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Diretoria / Gestor Central
                  </label>
                  <input
                    type="text"
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-900 dark:text-white"
                    placeholder="Diretoria Executiva"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    E-mail Institucional de Suporte
                  </label>
                  <input
                    type="email"
                    value={responsavelEmail}
                    onChange={(e) => setResponsavelEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-900 dark:text-white"
                    placeholder="admin@partiumobe.com.br"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Telefone / WhatsApp Nacional
                  </label>
                  <input
                    type="text"
                    value={responsavelTelefone}
                    onChange={(e) => setResponsavelTelefone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-900 dark:text-white"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    E-mail de Login do Super Administrador
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Definir Nova Senha Master (Deixe em branco para manter)
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={adminSenha}
                      onChange={(e) => setAdminSenha(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: INFRAESTRUTURA GLOBAL & APIS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950 dark:text-white">
                  Infraestrutura Global & APIs Centrais
                </h3>
                <p className="text-[11px] text-slate-500">
                  Chaves centrais de mapas distribuídas aos serviços de retaguarda
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mapbox Access Token Master
                  </label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                    Exclusivo da Matriz
                  </span>
                </div>
                <input
                  type="text"
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  placeholder="pk.eyJ1IjoicGFydGl1..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Franquias regionais NÃO herdam este token automaticamente, garantindo isolamento total de custos.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Google Maps API Key Master (Opcional)
                </label>
                <input
                  type="text"
                  value={googleMapsKey}
                  onChange={(e) => setGoogleMapsKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Status da Infraestrutura */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Status de Mapas:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {MapboxConfig.hasValidToken("default") ? "Mapbox Conectado" : "Fallback OSRM Ativo"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Cobertura Territorial:</span>
                  <span className="font-bold text-slate-900 dark:text-white">Nacional Irrestrito (Brasil)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Franquias Conectadas:</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400 font-mono">
                    {stats.total} praças registradas
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BOTÃO FIXO DE SUBMISSÃO */}
          <div className="lg:col-span-2 pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleRestaurarPadroes}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancelar / Restaurar Padrões
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-sm cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{salvando ? "Salvando Alterações..." : "Salvar Configurações da Matriz"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
