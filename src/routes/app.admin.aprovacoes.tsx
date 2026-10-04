import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bike,
  Car,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  Loader2,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import {
  usePartiuTodasSolicitacoesMotoristas,
  useAprovarPartiuMotorista,
  useRejeitarPartiuMotorista,
} from "@/lib/univans-db";
import { driverFleetService } from "@/lib/ecosystem/driver-fleet-service";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/admin/aprovacoes")({
  head: () => ({
    meta: [
      { title: "Aprovação de Motoristas & Entregadores | PARTIU Admin" },
      {
        name: "description",
        content:
          "Central de auditoria documental e aprovação de motoristas autônomos (Partiu Pop) e entregadores (Partiu Moto / Flash).",
      },
    ],
  }),
  component: AdminAprovacoesPage,
});

export interface SolicitacaoCondutor {
  id: string;
  nomeCompleto: string;
  cpf: string;
  whatsapp: string;
  email: string;
  cidade: string;
  modalidade: "pop_carro" | "moto_flash";
  cnhNumero: string;
  cnhCategoria: "B (EAR)" | "A (EAR)" | "AB (EAR)";
  possuiEAR: boolean;
  veiculoMarcaModelo: string;
  veiculoAno: string;
  veiculoPlaca: string;
  veiculoCor: string;
  crlvAnoExercicio: string;
  chavePix: string;
  dataSolicitacao: string;
  status: "pendente" | "aprovado" | "rejeitado";
  motivoRejeicao?: string | undefined;
  categoriaVeiculo: "CARRO" | "MOTO" | "PLUS" | "MULHER";
  documentos: {
    cnhUrl: string;
    crlvUrl: string;
    fotoPerfilUrl: string;
  };
}

export function AdminAprovacoesPage() {
  const qc = useQueryClient();
  const { data: todasReais = [], isLoading } = usePartiuTodasSolicitacoesMotoristas();
  const aprovarMutation = useAprovarPartiuMotorista();
  const rejeitarMutation = useRejeitarPartiuMotorista();

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCondutor[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    "CARRO" | "MOTO" | "PLUS" | "MULHER"
  >("CARRO");

  // Sincroniza dados reais com o estado local
  useEffect(() => {
    if (todasReais && todasReais.length > 0) {
      const convertidas: SolicitacaoCondutor[] = todasReais.map((p) => {
        const catOriginal = (p.categoria_veiculo?.toUpperCase() as any) || (p.categoria_veiculo === "MOTO" ? "MOTO" : "CARRO");
        const catValida: "CARRO" | "MOTO" | "PLUS" | "MULHER" =
          catOriginal === "MOTO" || catOriginal === "PLUS" || catOriginal === "MULHER" ? catOriginal : "CARRO";

        return {
          id: p.id,
          nomeCompleto: p.nome,
          cpf: p.cpf,
          whatsapp: p.telefone,
          email: p.email || "Não informado",
          cidade: "Maceió / AL",
          modalidade: catValida === "MOTO" ? "moto_flash" : "pop_carro",
          cnhNumero: p.cnh_numero,
          cnhCategoria: (catValida === "MOTO" ? "A (EAR)" : "B (EAR)") as any,
          possuiEAR: p.possui_ear,
          veiculoMarcaModelo: p.veiculo_marca_modelo,
          veiculoAno: String(p.veiculo_ano),
          veiculoPlaca: p.veiculo_placa,
          veiculoCor: p.veiculo_cor,
          crlvAnoExercicio: "2026",
          chavePix: p.chave_pix || "Não cadastrada",
          dataSolicitacao: p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "Recente",
          status: (p.status_aprovacao as any) || "pendente",
          motivoRejeicao: (p as any).motivo_rejeicao,
          categoriaVeiculo: catValida,
          documentos: {
            cnhUrl:
              (p as any).cnh_url ||
              (p as any).cnh_foto_url ||
              "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80",
            crlvUrl:
              (p as any).crlv_url ||
              (p as any).crlv_foto_url ||
              "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop&q=80",
            fotoPerfilUrl:
              (p as any).foto_url ||
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
          },
        };
      });
      setSolicitacoes(convertidas);
    } else {
      setSolicitacoes([]);
    }
  }, [todasReais]);

  // Sincronização em tempo real via Supabase Realtime
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel("admin_motoristas_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "partiu_motoristas",
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["admin", "solicitacoes_motoristas"] });
          void qc.invalidateQueries({ queryKey: ["admin", "motoristas_pendentes"] });
          void qc.invalidateQueries({ queryKey: ["admin", "motoristas"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const [filtro, setFiltro] = useState<"todas" | "pendente" | "aprovado" | "rejeitado">("todas");
  const [busca, setBusca] = useState("");
  const [modalDetalhes, setModalDetalhes] = useState<SolicitacaoCondutor | null>(null);
  const [motivoRejeicaoInput, setMotivoRejeicaoInput] = useState("");
  const [mostrarRejeitarModal, setMostrarRejeitarModal] = useState(false);
  const [imagemZoom, setImagemZoom] = useState<{ url: string; titulo: string } | null>(null);

  function abrirModalDetalhes(sol: SolicitacaoCondutor) {
    setModalDetalhes(sol);
    setCategoriaSelecionada(sol.categoriaVeiculo || (sol.modalidade === "moto_flash" ? "MOTO" : "CARRO"));
    setMostrarRejeitarModal(false);
  }

  function alterarStatus(
    id: string,
    novoStatus: "aprovado" | "rejeitado",
    motivo?: string,
    catVeiculo?: "CARRO" | "MOTO" | "PLUS" | "MULHER"
  ) {
    const categoriaFinal = catVeiculo || categoriaSelecionada;
    if (novoStatus === "aprovado") {
      aprovarMutation.mutate({ id, categoriaVeiculo: categoriaFinal });
      void driverFleetService.approveDriver(id, categoriaFinal === "MOTO" ? "MOTO" : "CARRO");
    } else {
      rejeitarMutation.mutate({ id, motivo: motivo || "Documentação reprovada pelo operador" });
      void driverFleetService.rejectDriver(id, motivo || "Documentação reprovada pelo operador");
    }
    setSolicitacoes((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: novoStatus,
              motivoRejeicao: motivo,
              categoriaVeiculo: categoriaFinal,
            }
          : s
      ),
    );
    setMostrarRejeitarModal(false);
    setModalDetalhes(null);
  }

  const listaFiltrada = solicitacoes
    .filter((s) => filtro === "todas" || s.status === filtro)
    .filter((s) => {
      if (!busca.trim()) return true;
      const t = busca.toLowerCase();
      return (
        s.nomeCompleto.toLowerCase().includes(t) ||
        s.veiculoPlaca.toLowerCase().includes(t) ||
        s.veiculoMarcaModelo.toLowerCase().includes(t) ||
        s.cpf.includes(t)
      );
    });

  const totalPendentes = solicitacoes.filter((s) => s.status === "pendente").length;
  const totalAprovados = solicitacoes.filter((s) => s.status === "aprovado").length;
  const totalRejeitados = solicitacoes.filter((s) => s.status === "rejeitado").length;

  return (
    <div className="w-full space-y-6 pb-20">
      {/* 1. Header do Módulo */}
      <div className="w-full rounded-3xl bg-slate-950 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0088FF]/20 px-4 py-1.5 text-xs font-black uppercase text-primary-500 border border-primary-600/30">
            <CheckCircle2 className="h-4 w-4 text-[#0088FF]" />
            <span>Auditoria Cadastral de Condutores</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Aprovações de Condutores &amp; Frota
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
            Analise CNH com EAR, CRLV do veículo e libere o acesso aos parceiros das categorias Partiu Pop (Carro) e Partiu Moto / Flash.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-2.5 border border-white/20 text-center">
            <span className="text-[10px] font-black uppercase text-primary-500 block">Pendentes</span>
            <span className="text-xl font-black text-white">{totalPendentes}</span>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-2.5 border border-white/20 text-center">
            <span className="text-[10px] font-black uppercase text-emerald-400 block">Aprovados</span>
            <span className="text-xl font-black text-white">{totalAprovados}</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Busca e Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filtros de Status */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {[
            { id: "todas", label: `Todas (${solicitacoes.length})` },
            { id: "pendente", label: `Pendentes (${totalPendentes})` },
            { id: "aprovado", label: `Aprovados (${totalAprovados})` },
            { id: "rejeitado", label: `Rejeitados (${totalRejeitados})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltro(item.id as any)}
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
                filtro === item.id
                  ? "bg-[#0088FF] text-slate-950 shadow-md shadow-primary-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, placa ou CPF..."
            className="w-full rounded-2xl bg-white border border-slate-200 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-yellow-400"
          />
        </div>
      </div>

      {/* 3. Lista de Solicitações ou Estados Especiais */}
      {isLoading ? (
        <div className="rounded-3xl bg-white p-12 border border-slate-200 text-center shadow-xs space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary-vibrant mx-auto" />
          <p className="text-xs font-bold text-slate-600">Sincronizando fila de cadastros com o banco...</p>
        </div>
      ) : listaFiltrada.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 border border-slate-200 text-center shadow-xs space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-slate-900">
              {busca ? "Nenhum cadastro encontrado" : "Tudo em dia na Moderação!"}
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {busca
                ? `Não encontramos nenhum motorista ou entregador correspondente ao termo "${busca}".`
                : filtro === "pendente"
                ? "Nenhum motorista ou entregador aguardando auditoria documental no momento."
                : "Nenhum cadastro registrado nesta categoria de filtro."}
            </p>
          </div>
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {listaFiltrada.map((item) => {
            const isCarro = item.modalidade === "pop_carro";

          return (
            <div
              key={item.id}
              className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Topo do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.documentos.fotoPerfilUrl}
                      alt={item.nomeCompleto}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200"
                    />
                    <div>
                      <h3 className="text-base font-black text-slate-950 leading-tight">
                        {item.nomeCompleto}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.cidade} · CPF: <span className="font-semibold">{item.cpf}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase shrink-0 ${
                      item.status === "pendente"
                        ? "bg-primary-50 text-amber-900 border border-primary-500"
                        : item.status === "aprovado"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-rose-100 text-rose-900 border border-rose-300"
                    }`}
                  >
                    ● {item.status}
                  </span>
                </div>

                {/* Badge da Modalidade e Categoria Atribuída */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black ${
                      isCarro
                        ? "bg-slate-950 text-white"
                        : "bg-amber-500 text-slate-950"
                    }`}
                  >
                    {isCarro ? <Car className="w-3.5 h-3.5" /> : <Bike className="w-3.5 h-3.5" />}
                    <span>{isCarro ? "Partiu Pop (Carro)" : "Partiu Moto & Flash"}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                    <span className="text-[10px] text-blue-500 uppercase">Cat:</span>
                    <strong className="font-black">{item.categoriaVeiculo}</strong>
                  </span>

                  <span className="text-[11px] font-bold text-slate-500">
                    Solicitado {item.dataSolicitacao}
                  </span>
                </div>

                {/* Dados do Veículo */}
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 space-y-1 text-xs font-medium text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Veículo:</span>
                    <strong className="text-slate-900">{item.veiculoMarcaModelo} ({item.veiculoAno})</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Placa / Cor:</span>
                    <span className="font-black text-slate-900 uppercase">
                      {item.veiculoPlaca} · {item.veiculoCor}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Exercício CRLV:</span>
                    <span className="font-bold text-emerald-700">Vigente ({item.crlvAnoExercicio})</span>
                  </div>
                </div>

                {/* Checklist Documental */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>CNH: <strong>{item.cnhCategoria}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-800">
                    {item.possuiEAR ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{item.possuiEAR ? "EAR Averbado ✓" : "Sem EAR ✗"}</span>
                  </div>
                </div>

                {/* Motivo de Rejeição (se houver) */}
                {item.motivoRejeicao && (
                  <div className="rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs text-rose-800">
                    <strong>Motivo da Reprovação:</strong> {item.motivoRejeicao}
                  </div>
                )}
              </div>

              {/* Ações do Administrador */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => abrirModalDetalhes(item)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-black text-slate-800 transition-colors cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  Ver Documentos &amp; Categoria
                </button>

                {item.status === "pendente" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        abrirModalDetalhes(item);
                        setMostrarRejeitarModal(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 px-3.5 py-2.5 text-xs font-black text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <XCircle className="h-4 w-4" /> Recusar
                    </button>

                    <button
                      type="button"
                      onClick={() => abrirModalDetalhes(item)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Aprovar...
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* MODAL DE AUDITORIA DE DOCUMENTOS E DEFINIÇÃO DE CATEGORIA */}
      {modalDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={modalDetalhes.documentos.fotoPerfilUrl}
                  alt={modalDetalhes.nomeCompleto}
                  className="w-12 h-12 rounded-2xl object-cover"
                />
                <div>
                  <h2 className="text-lg font-black text-slate-950">{modalDetalhes.nomeCompleto}</h2>
                  <p className="text-xs text-slate-500">
                    {modalDetalhes.modalidade === "pop_carro" ? "Partiu Pop (Carro)" : "Partiu Moto & Flash"} · WhatsApp: {modalDetalhes.whatsapp}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalDetalhes(null);
                  setMostrarRejeitarModal(false);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Imagens de CNH e CRLV */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                Documentos Anexados pelo Condutor
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setImagemZoom({
                      url: modalDetalhes.documentos.cnhUrl,
                      titulo: `CNH do Condutor - ${modalDetalhes.nomeCompleto}`,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setImagemZoom({
                        url: modalDetalhes.documentos.cnhUrl,
                        titulo: `CNH do Condutor - ${modalDetalhes.nomeCompleto}`,
                      });
                    }
                  }}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 cursor-zoom-in group relative transition-all hover:border-primary/50 shadow-xs"
                >
                  <div className="p-3 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>CNH com EAR</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Nº {modalDetalhes.cnhNumero}
                    </span>
                  </div>
                  <div className="relative overflow-hidden h-44">
                    <img
                      src={modalDetalhes.documentos.cnhUrl}
                      alt="CNH do Condutor"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/25 flex items-center justify-center transition-colors">
                      <span className="opacity-0 group-hover:opacity-100 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-opacity flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" /> Clique para Ampliar
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setImagemZoom({
                      url: modalDetalhes.documentos.crlvUrl,
                      titulo: `CRLV do Veículo - Placa ${modalDetalhes.veiculoPlaca}`,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setImagemZoom({
                        url: modalDetalhes.documentos.crlvUrl,
                        titulo: `CRLV do Veículo - Placa ${modalDetalhes.veiculoPlaca}`,
                      });
                    }
                  }}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 cursor-zoom-in group relative transition-all hover:border-primary/50 shadow-xs"
                >
                  <div className="p-3 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>CRLV do Veículo</span>
                    <span className="text-[10px] text-slate-800 bg-slate-200 px-2 py-0.5 rounded font-black flex items-center gap-1">
                      <Car className="w-3 h-3" /> Placa: {modalDetalhes.veiculoPlaca}
                    </span>
                  </div>
                  <div className="relative overflow-hidden h-44">
                    <img
                      src={modalDetalhes.documentos.crlvUrl}
                      alt="CRLV do Veículo"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/25 flex items-center justify-center transition-colors">
                      <span className="opacity-0 group-hover:opacity-100 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-opacity flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" /> Clique para Ampliar
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo do Veículo */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-1.5">
              <span className="font-black text-slate-900 uppercase tracking-wider block">Veículo Declarado no Cadastro:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Modelo / Marca</span>
                  <strong>{modalDetalhes.veiculoMarcaModelo}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Ano de Fabricação</span>
                  <strong>{modalDetalhes.veiculoAno}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Placa</span>
                  <strong className="uppercase">{modalDetalhes.veiculoPlaca}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Cor</span>
                  <strong>{modalDetalhes.veiculoCor}</strong>
                </div>
              </div>
            </div>

            {/* Chave PIX e Repasse */}
            <div className="rounded-2xl bg-primary-50/70 p-4 border border-amber-200 text-xs space-y-1">
              <span className="font-black text-amber-950 block">Conta PIX de Repasse (D+0):</span>
              <p className="text-amber-900 font-semibold">{modalDetalhes.chavePix}</p>
            </div>

            {/* DEFINIÇÃO ADMINISTRATIVA DA CATEGORIA DE ATENDIMENTO */}
            <div className="space-y-2 p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider">
                  Atribuir Categoria de Atendimento (Controle Administrativo):
                </label>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-300">
                  Exclusivo Operação
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Audite os dados do veículo e selecione a categoria oficial permitida para este parceiro:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {(["CARRO", "MOTO", "PLUS", "MULHER"] as const).map((cat) => {
                  const isSelected = categoriaSelecionada === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaSelecionada(cat)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs font-black">{cat}</span>
                      <span className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                        {cat === "CARRO" && "Partiu Pop"}
                        {cat === "MOTO" && "Moto & Flash"}
                        {cat === "PLUS" && "Sedan Executivo"}
                        {cat === "MULHER" && "Partiu Delas"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formulário de Rejeição */}
            {mostrarRejeitarModal ? (
              <div className="space-y-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <label className="block text-xs font-black text-rose-950">
                  Informe o motivo da reprovação documental:
                </label>
                <textarea
                  rows={3}
                  value={motivoRejeicaoInput}
                  onChange={(e) => setMotivoRejeicaoInput(e.target.value)}
                  placeholder="Ex: CNH sem observação EAR; Veículo fabricado antes de 2013..."
                  className="w-full rounded-xl bg-white border border-rose-300 p-3 text-xs font-medium text-slate-900 outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMostrarRejeitarModal(false)}
                    className="px-4 py-2 rounded-xl bg-white text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      alterarStatus(modalDetalhes.id, "rejeitado", motivoRejeicaoInput)
                    }
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-500 cursor-pointer"
                  >
                    Confirmar Reprovação
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarRejeitarModal(true)}
                  className="px-5 py-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-black hover:bg-rose-100 border border-rose-200 cursor-pointer"
                >
                  Reprovar Cadastro
                </button>
                <button
                  type="button"
                  onClick={() => alterarStatus(modalDetalhes.id, "aprovado", undefined, categoriaSelecionada)}
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-500 shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Aprovar como {categoriaSelecionada}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX DE INSPEÇÃO DOCUMENTAL EM ALTA RESOLUÇÃO (FIGMA CABER VIEW DOCUMENT) */}
      {imagemZoom && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setImagemZoom(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Lightbox */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950 text-white">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold truncate">{imagemZoom.titulo}</span>
              </div>
              <button
                type="button"
                onClick={() => setImagemZoom(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Imagem em alta resolução */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/50">
              <img
                src={imagemZoom.url}
                alt={imagemZoom.titulo}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg border border-slate-800"
              />
            </div>

            {/* Rodapé com atalho */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span>Auditoria de conformidade legal de condutores</span>
              <button
                type="button"
                onClick={() => setImagemZoom(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
