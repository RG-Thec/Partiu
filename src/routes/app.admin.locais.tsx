import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  Edit2,
  Trash2,
  Navigation,
  Globe,
  Radio,
  Sliders,
  X,
  AlertCircle,
  Building2,
  ShieldCheck,
} from "lucide-react";
import {
  type AdminPracaOperacao,
  carregarPracasDisponiveis,
  salvarNovaPraca,
  atualizarPraca,
  removerPraca,
  alternarStatusPraca,
  exportarPracasCSV,
  setPracaAtiva,
} from "@/lib/admin-city-service";
import { useAdminCity } from "@/contexts/AdminCityContext";
import { getAdminRole, isFranqueado } from "@/lib/admin-rbac";

export const Route = createFileRoute("/app/admin/locais")({
  head: () => ({
    meta: [
      { title: "Cidades & Praças de Operação | PARTIU Admin" },
      {
        name: "description",
        content:
          "Gestão territorial de praças de operação, raios de cobertura em km, coordenadas centrais e status das cidades atendidas pela rede PARTIU.",
      },
    ],
  }),
  component: AdminLocaisPage,
});

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const COORDENADAS_PREDEFINIDAS: Record<string, { lat: number; lng: number }> = {
  "Itaperuna": { lat: -21.2054, lng: -41.8892 },
  "Campos dos Goytacazes": { lat: -21.7545, lng: -41.3244 },
  "São Paulo": { lat: -23.5505, lng: -46.6333 },
  "Rio de Janeiro": { lat: -22.9068, lng: -43.1729 },
  "Belo Horizonte": { lat: -19.9167, lng: -43.9345 },
  "Salvador": { lat: -12.9714, lng: -38.5014 },
  "Recife": { lat: -8.0476, lng: -34.8770 },
  "Fortaleza": { lat: -3.7319, lng: -38.5267 },
  "Brasília": { lat: -15.7975, lng: -47.8919 },
  "Curitiba": { lat: -25.4284, lng: -49.2733 },
};

export function AdminLocaisPage() {
  const { pracaAtiva, selecionarPraca } = useAdminCity();
  const adminRole = getAdminRole();
  const [pracas, setPracas] = useState<AdminPracaOperacao[]>(() =>
    carregarPracasDisponiveis().filter((p) => p.id !== "todas")
  );
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "ATIVA" | "EM_CONFIGURACAO" | "PAUSADA">("TODOS");
  
  // Modal de Criação / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [pracaEmEdicao, setPracaEmEdicao] = useState<AdminPracaOperacao | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formUf, setFormUf] = useState("AL");
  const [formLat, setFormLat] = useState("-9.6658");
  const [formLng, setFormLng] = useState("-35.7351");
  const [formRaioKm, setFormRaioKm] = useState(20);
  const [formStatus, setFormStatus] = useState<"ATIVA" | "EM_CONFIGURACAO" | "PAUSADA">("ATIVA");
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [sucessoFeedback, setSucessoFeedback] = useState<string | null>(null);

  const recarregarPracas = () => {
    setPracas(carregarPracasDisponiveis().filter((p) => p.id !== "todas"));
  };

  useEffect(() => {
    const handleListUpdate = () => recarregarPracas();
    window.addEventListener("partiu:pracas-list-updated", handleListUpdate);
    return () => {
      window.removeEventListener("partiu:pracas-list-updated", handleListUpdate);
    };
  }, []);

  const abrirModalNovo = () => {
    setPracaEmEdicao(null);
    setFormNome("");
    setFormUf("AL");
    setFormLat("-9.6658");
    setFormLng("-35.7351");
    setFormRaioKm(20);
    setFormStatus("ATIVA");
    setErroForm(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (praca: AdminPracaOperacao) => {
    setPracaEmEdicao(praca);
    setFormNome(praca.nome);
    setFormUf(praca.uf);
    setFormLat(String(praca.lat));
    setFormLng(String(praca.lng));
    setFormRaioKm(praca.raioKm);
    setFormStatus(praca.status);
    setErroForm(null);
    setModalAberto(true);
  };

  const handleSugestaoCidade = (cidade: string) => {
    setFormNome(cidade);
    if (COORDENADAS_PREDEFINIDAS[cidade]) {
      setFormLat(String(COORDENADAS_PREDEFINIDAS[cidade].lat));
      setFormLng(String(COORDENADAS_PREDEFINIDAS[cidade].lng));
    }
  };

  const handleSalvarPraca = (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    const nomeTrim = formNome.trim();
    if (!nomeTrim) {
      setErroForm("O nome da cidade é obrigatório.");
      return;
    }

    const latNum = parseFloat(formLat);
    const lngNum = parseFloat(formLng);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setErroForm("Latitude inválida (deve estar entre -90 e 90).");
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setErroForm("Longitude inválida (deve estar entre -180 e 180).");
      return;
    }

    if (formRaioKm < 1 || formRaioKm > 150) {
      setErroForm("O raio de operação deve estar entre 1 km e 150 km.");
      return;
    }

    if (pracaEmEdicao) {
      atualizarPraca({
        ...pracaEmEdicao,
        nome: nomeTrim,
        uf: formUf,
        lat: latNum,
        lng: lngNum,
        raioKm: formRaioKm,
        status: formStatus,
      });
      setSucessoFeedback(`Praça ${nomeTrim} atualizada com sucesso!`);
    } else {
      salvarNovaPraca({
        nome: nomeTrim,
        uf: formUf,
        lat: latNum,
        lng: lngNum,
        raioKm: formRaioKm,
        status: formStatus,
      });
      setSucessoFeedback(`Praça ${nomeTrim} criada e integrada ao sistema!`);
    }

    recarregarPracas();
    setModalAberto(false);
    setTimeout(() => setSucessoFeedback(null), 4000);
  };

  const handleAlternarStatus = (id: string, nome: string) => {
    alternarStatusPraca(id);
    recarregarPracas();
    setSucessoFeedback(`Status da praça ${nome} alterado.`);
    setTimeout(() => setSucessoFeedback(null), 3000);
  };

  const handleRemover = (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a praça "${nome}"? Esta ação removerá o raio de despacho desta região.`)) {
      removerPraca(id);
      recarregarPracas();
      setSucessoFeedback(`Praça ${nome} removida.`);
      setTimeout(() => setSucessoFeedback(null), 3000);
    }
  };

  const handleDefinirAtivaNoPainel = (id: string, nome: string) => {
    selecionarPraca(id);
    setSucessoFeedback(`Painel filtrado para a praça: ${nome}`);
    setTimeout(() => setSucessoFeedback(null), 3000);
  };

  // Filtragem
  const pracasFiltradas = pracas.filter((p) => {
    if (filtroStatus !== "TODOS" && p.status !== filtroStatus) return false;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const matchNome = p.nome.toLowerCase().includes(termo);
      const matchUf = p.uf.toLowerCase().includes(termo);
      if (!matchNome && !matchUf) return false;
    }
    return true;
  });

  // Métricas
  const totalPracas = pracas.length;
  const ativasCount = pracas.filter((p) => p.status === "ATIVA").length;
  const emConfigCount = pracas.filter((p) => p.status === "EM_CONFIGURACAO").length;
  const pausadasCount = pracas.filter((p) => p.status === "PAUSADA").length;
  const coberturaTotalKm = pracas.reduce((acc, p) => acc + p.raioKm, 0);

  return (
    <div className="w-full space-y-4 sm:space-y-5 pb-20">
      {/* 1. Header Executivo de Gestão Territorial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Expansão &amp; Gestão Territorial • {isFranqueado(adminRole) ? `Franquia ${pracaAtiva?.nome || "Regional"}` : "Gestão Nacional"}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Cidades &amp; Praças de Operação
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {ativasCount} ATIVAS
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Parametrização de raio de despacho (km), coordenadas do GPS e status de operação por praça.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportarPracasCSV}
            className="flex h-10 items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 text-xs font-black transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={abrirModalNovo}
            className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 text-xs font-black transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#0088FF]" />
            <span>Nova Praça</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {sucessoFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{sucessoFeedback}</span>
        </div>
      )}

      {/* 2. Cards de Métricas Regionais */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-black uppercase text-slate-500">Total de Praças</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{totalPracas}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Cidades cadastradas</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-black uppercase text-emerald-600">Praças Ativas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {ativasCount}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">Despacho em tempo real</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-black uppercase text-amber-600">Em Expansão / Config</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">
            {emConfigCount}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-0.5">Fase de cadastramento</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-black uppercase text-blue-600">Cobertura Total</span>
            <Navigation className="w-4 h-4 text-[#0088FF]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {coberturaTotalKm} <span className="text-xs font-bold text-slate-400">km raio</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Perímetro agregado</div>
        </div>
      </section>

      {/* 3. Controles de Busca e Filtro */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filtros de Status */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-x-auto no-scrollbar">
          {(["TODOS", "ATIVA", "EM_CONFIGURACAO", "PAUSADA"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFiltroStatus(status)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filtroStatus === status
                  ? "bg-slate-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {status === "TODOS" && "Todas"}
              {status === "ATIVA" && `Ativas (${ativasCount})`}
              {status === "EM_CONFIGURACAO" && `Configuração (${emConfigCount})`}
              {status === "PAUSADA" && `Pausadas (${pausadasCount})`}
            </button>
          ))}
        </div>

        {/* Campo de Busca */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cidade ou UF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl bg-white border border-slate-200/90 pl-9 pr-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0088FF] shadow-xs"
          />
        </div>
      </section>

      {/* 4. Tabela de Praças de Operação */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 sm:px-5">Cidade / UF</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Coordenadas Centrais (GPS)</th>
                <th className="py-3 px-4 text-center">Raio Despacho</th>
                <th className="py-3 px-4 text-center">Escopo do Painel</th>
                <th className="py-3 px-4 sm:px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pracasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <MapPin className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                    <p className="font-bold text-xs text-slate-600">Nenhuma praça encontrada</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tente outro termo de busca ou cadastre uma nova praça.
                    </p>
                  </td>
                </tr>
              ) : (
                pracasFiltradas.map((praca) => {
                  const isAtivaGlobal = pracaAtiva.id === praca.id;
                  return (
                    <tr key={praca.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0088FF] border border-blue-200/60 flex items-center justify-center font-black text-xs shrink-0">
                            {praca.uf}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {praca.nome}
                              {isAtivaGlobal && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                  Escopo Ativo
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{praca.labelCompleto}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {praca.status === "ATIVA" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativa
                          </span>
                        )}
                        {praca.status === "EM_CONFIGURACAO" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200/60">
                            <Clock className="w-3 h-3" />
                            Configuração
                          </span>
                        )}
                        {praca.status === "PAUSADA" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">
                            <PauseCircle className="w-3 h-3" />
                            Pausada
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        <div className="flex items-center gap-1 text-slate-700 font-semibold">
                          <MapPin className="w-3 h-3 text-[#0088FF]" />
                          <span>{praca.lat.toFixed(4)}, {praca.lng.toFixed(4)}</span>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${praca.lat},${praca.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#0088FF] hover:underline"
                        >
                          Ver no GPS
                        </a>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200/60">
                          <Radio className="w-3 h-3 text-[#0088FF]" />
                          {praca.raioKm} km
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isAtivaGlobal ? (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Ativo
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDefinirAtivaNoPainel(praca.id, praca.nome)}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                          >
                            Filtrar
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleAlternarStatus(praca.id, praca.nome)}
                            title={praca.status === "ATIVA" ? "Pausar Praça" : "Ativar Praça"}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {praca.status === "ATIVA" ? (
                              <PauseCircle className="w-4 h-4 text-amber-500" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-emerald-500" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(praca)}
                            title="Editar Praça"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemover(praca.id, praca.nome)}
                            title="Excluir Praça"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Praça */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0088FF] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {pracaEmEdicao ? "Editar Praça de Operação" : "Nova Praça de Operação"}
                  </h2>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Configure os parâmetros territoriais para a central de despacho.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {erroForm && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{erroForm}</span>
              </div>
            )}

            {/* Sugestões Rápidas de Cidades Brasileiras */}
            {!pracaEmEdicao && (
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Sugestões Rápidas:
                </label>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(COORDENADAS_PREDEFINIDAS).slice(0, 6).map((cidade) => (
                    <button
                      key={cidade}
                      type="button"
                      onClick={() => handleSugestaoCidade(cidade)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      {cidade}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSalvarPraca} className="space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Nome da Cidade</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: São Paulo, Rio de Janeiro"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">UF</label>
                  <select
                    value={formUf}
                    onChange={(e) => setFormUf(e.target.value)}
                    className="w-full h-8.5 px-2.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                  >
                    {ESTADOS_BRASIL.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Latitude Central</label>
                  <input
                    type="text"
                    required
                    placeholder="-9.6658"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Longitude Central</label>
                  <input
                    type="text"
                    required
                    placeholder="-35.7351"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    Raio de Despacho: <span className="text-primary font-black">{formRaioKm} km</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Padrão: 15-30 km</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={80}
                  step={1}
                  value={formRaioKm}
                  onChange={(e) => setFormRaioKm(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Status Operacional</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["ATIVA", "EM_CONFIGURACAO", "PAUSADA"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormStatus(st)}
                      className={`h-8 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        formStatus === st
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {st === "ATIVA" && "Ativa"}
                      {st === "EM_CONFIGURACAO" && "Em Config"}
                      {st === "PAUSADA" && "Pausada"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="h-8.5 px-3 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-8.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {pracaEmEdicao ? "Salvar Alterações" : "Cadastrar Praça"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
