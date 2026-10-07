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
    <div className="px-4 sm:px-6 pt-5 pb-16 max-w-7xl mx-auto space-y-6">
      {/* Header Principal */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <Globe className="w-3.5 h-3.5" />
              Gestão Territorial & Escopo Regional
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-2">
            Cidades & Praças de Operação
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Cadastre as cidades atendidas, parametrize as coordenadas centrais do GPS,
            defina o raio radial de busca dos motoristas (km) e controle o status operacional.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportarPracasCSV}
            className="min-h-12 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={abrirModalNovo}
            className="min-h-12 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Praça de Operação
          </button>
        </div>
      </header>

      {/* Toast Feedback */}
      {sucessoFeedback && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{sucessoFeedback}</span>
        </div>
      )}

      {/* Cards de Métricas Regionais */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold">Total de Praças</span>
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">{totalPracas}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Cidades registradas</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold">Praças Ativas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {ativasCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Recebendo corridas agora</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold">Em Expansão / Config</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {emConfigCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Fase de onboarding</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-semibold">Cobertura Radial</span>
            <Navigation className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {coberturaTotalKm} <span className="text-base font-bold text-muted-foreground">km</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Soma dos perímetros operacionais</div>
        </div>
      </section>

      {/* Controles de Busca e Filtro */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border/60 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cidade ou UF (ex: Itaperuna, RJ, SP)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full min-h-12 h-12 pl-10 pr-4 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["TODOS", "ATIVA", "EM_CONFIGURACAO", "PAUSADA"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFiltroStatus(status)}
              className={`min-h-10 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filtroStatus === status
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {status === "TODOS" && "Todas as Praças"}
              {status === "ATIVA" && `Ativas (${ativasCount})`}
              {status === "EM_CONFIGURACAO" && `Configuração (${emConfigCount})`}
              {status === "PAUSADA" && `Pausadas (${pausadasCount})`}
            </button>
          ))}
        </div>
      </section>

      {/* Tabela de Praças de Operação */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 border-b border-border/60 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Cidade / UF</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Coordenadas Centrais (GPS)</th>
                <th className="py-3.5 px-4 text-center">Raio de Despacho</th>
                <th className="py-3.5 px-4 text-center">Escopo do Painel</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {pracasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-semibold text-sm">Nenhuma praça encontrada</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tente outro termo de busca ou adicione uma nova cidade.
                    </p>
                  </td>
                </tr>
              ) : (
                pracasFiltradas.map((praca) => {
                  const isAtivaGlobal = pracaAtiva.id === praca.id;
                  return (
                    <tr key={praca.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                            {praca.uf}
                          </div>
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              {praca.nome}
                              {isAtivaGlobal && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-primary-foreground">
                                  Ativa no Painel
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{praca.labelCompleto}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {praca.status === "ATIVA" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Ativa
                          </span>
                        )}
                        {praca.status === "EM_CONFIGURACAO" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            Em Configuração
                          </span>
                        )}
                        {praca.status === "PAUSADA" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                            <PauseCircle className="w-3 h-3" />
                            Pausada
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                        <div className="flex items-center gap-1 text-foreground font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>{praca.lat.toFixed(4)}, {praca.lng.toFixed(4)}</span>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${praca.lat},${praca.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-primary hover:underline"
                        >
                          Ver no Mapa
                        </a>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Radio className="w-3 h-3" />
                          {praca.raioKm} km
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {isAtivaGlobal ? (
                          <span className="text-xs font-bold text-primary flex items-center justify-center gap-1">
                            <ShieldCheck className="w-4 h-4" />
                            Escopo Atual
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDefinirAtivaNoPainel(praca.id, praca.nome)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer"
                          >
                            Filtrar Painel
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAlternarStatus(praca.id, praca.nome)}
                            title={praca.status === "ATIVA" ? "Pausar Praça" : "Ativar Praça"}
                            className="min-h-9 min-w-9 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
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
                            className="min-h-9 min-w-9 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemover(praca.id, praca.nome)}
                            title="Excluir Praça"
                            className="min-h-9 min-w-9 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
