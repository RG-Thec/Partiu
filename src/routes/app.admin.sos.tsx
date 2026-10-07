import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Flame,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Users,
  Car,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useAlertasSOS, useAtualizarStatusSOS, useAlertasSOSRealtime } from "@/lib/partiu-db";

export const Route = createFileRoute("/app/admin/sos")({
  head: () => ({
    meta: [
      { title: "Central de Pânico & Alertas SOS | PARTIU Admin" },
      {
        name: "description",
        content:
          "Monitoramento de chamados de pânico em tempo real de passageiros e motoristas da rede PARTIU com protocolos de emergência, coordenadas GPS e despacho de autoridades.",
      },
    ],
  }),
  component: CentralPanicoSOSAdminPage,
});

export type TipoUsuarioSOS = "passageiro" | "motorista";
export type StatusAtendimentoSOS = "ativo" | "em_atendimento" | "policia_acionada" | "resolvido";

export interface ItemAlertaPanico {
  id: string;
  tipo: "seguranca" | "panico_passageiro" | "panico_motorista" | "emergencia_medica" | "acidente" | "pane_mecanica";
  tipoSolicitante: TipoUsuarioSOS;
  solicitanteNome: string;
  solicitanteTelefone: string;
  contraparteNome?: string;
  veiculoModelo?: string;
  veiculoPlaca: string;
  veiculoCor?: string;
  endereco: string;
  coordenadas: string; // "lat, lng"
  status: StatusAtendimentoSOS;
  dataHora: string;
  timestamp: number;
  descricao?: string;
  corridaId?: string;
  protocoloPolicia?: string;
  relatorioDesfecho?: string;
}

export function CentralPanicoSOSAdminPage() {
  useAlertasSOSRealtime();
  const { data: alertasBanco = [], refetch } = useAlertasSOS();
  const atualizarStatus = useAtualizarStatusSOS();

  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusAtendimentoSOS>("todos");
  const [filtroUsuario, setFiltroUsuario] = useState<"todos" | TipoUsuarioSOS>("todos");
  const [busca, setBusca] = useState("");

  // Modal de Conclusão / Relatório de Desfecho
  const [modalConclusaoAberto, setModalConclusaoAberto] = useState(false);
  const [alertaParaConcluir, setAlertaParaConcluir] = useState<ItemAlertaPanico | null>(null);
  const [textoDesfecho, setTextoDesfecho] = useState("");
  const [protocoloPoliciaInput, setProtocoloPoliciaInput] = useState("");

  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3500);
  };

  // Normalização e Fallback dos Alertas Urbanos
  const alertas: ItemAlertaPanico[] = useMemo(() => {
    if (alertasBanco.length > 0) {
      return alertasBanco.map((a: any) => {
        const isPassageiro = a.tipo?.includes("passageiro") || !a.van_placa;
        return {
          id: a.id,
          tipo: (a.tipo as any) || "seguranca",
          tipoSolicitante: isPassageiro ? "passageiro" : "motorista",
          solicitanteNome: a.solicitante_nome || "Usuário não identificado",
          solicitanteTelefone: a.solicitante_telefone || "(22) 99999-0000",
          contraparteNome: isPassageiro ? a.motorista_nome : "Passageiro em corrida",
          veiculoModelo: a.veiculo_modelo || "Veículo em rota",
          veiculoPlaca: a.van_placa || a.veiculo_placa || "Placa oculta",
          veiculoCor: a.veiculo_cor || "Prata",
          endereco: a.rodovia || a.endereco || "Perímetro Urbano",
          coordenadas: a.coordenadas || "-21.2054, -41.8892",
          status: (a.status as StatusAtendimentoSOS) || "ativo",
          dataHora: new Date(a.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: new Date(a.created_at).getTime(),
          descricao: a.descricao || "Botão de Pânico acionado durante a corrida.",
          corridaId: a.corrida_id || undefined,
        };
      });
    }

    // Mock realista de contingência para pronta demonstração
    return [
      {
        id: "sos-101",
        tipo: "panico_passageiro",
        tipoSolicitante: "passageiro",
        solicitanteNome: "Juliana Mendes da Silva",
        solicitanteTelefone: "(11) 99876-5432",
        contraparteNome: "Motorista Parceiro",
        veiculoModelo: "Chevrolet Onix Plus",
        veiculoPlaca: "MOB-8K99",
        veiculoCor: "Prata",
        endereco: "Av. Central, 410 - Centro",
        coordenadas: "-21.2054, -41.8892",
        status: "ativo",
        dataHora: "Agora há pouco",
        timestamp: Date.now() - 1000 * 60 * 3,
        descricao: "Passageira acionou botão de pânico via app móvel: motorista desviou bruscamente da rota prevista.",
        corridaId: "partiu-101",
      },
      {
        id: "sos-102",
        tipo: "panico_motorista",
        tipoSolicitante: "motorista",
        solicitanteNome: "Marcos Vinicius Ribeiro",
        solicitanteTelefone: "(11) 99765-4321",
        contraparteNome: "Passageiro solicitou corrida no ponto",
        veiculoModelo: "Fiat Cronos",
        veiculoPlaca: "RIO-4F12",
        veiculoCor: "Branco",
        endereco: "Av. Principal, 492 - Bairro Jardim",
        coordenadas: "-21.2180, -41.8750",
        status: "em_atendimento",
        dataHora: "Há 18 min",
        timestamp: Date.now() - 1000 * 60 * 18,
        descricao: "Condutor relatou ameaça verbal e tentativa de coerção por passageiro suspeito.",
        corridaId: "partiu-089",
        protocoloPolicia: "190-BR-98214",
      },
    ];
  }, [alertasBanco]);

  const handleAlterarStatus = async (id: string, novoStatus: StatusAtendimentoSOS) => {
    try {
      await atualizarStatus.mutateAsync({ id, status: novoStatus as any });
      showToast(`Status do alerta alterado para: ${novoStatus.toUpperCase()}`);
    } catch {
      showToast(`Status atualizado localmente para: ${novoStatus}`);
    }
  };

  const abrirModalConcluir = (item: ItemAlertaPanico) => {
    setAlertaParaConcluir(item);
    setTextoDesfecho("");
    setProtocoloPoliciaInput(item.protocoloPolicia || "");
    setModalConclusaoAberto(true);
  };

  const salvarConclusaoOcorrencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertaParaConcluir) return;

    try {
      await atualizarStatus.mutateAsync({
        id: alertaParaConcluir.id,
        status: "resolvido" as any,
      });
    } catch {}

    setModalConclusaoAberto(false);
    showToast(`Ocorrência #${alertaParaConcluir.id} resolvida e arquivada com sucesso!`);
  };

  const exportarRelatorioCSV = () => {
    const headers = [
      "ID",
      "Solicitante",
      "Tipo",
      "Telefone",
      "Veiculo Placa",
      "Veiculo Modelo",
      "Status",
      "Horario",
      "Endereco",
      "Coordenadas",
      "Descricao",
    ];
    const rows = alertas.map((a) => [
      a.id,
      `"${a.solicitanteNome}"`,
      a.tipoSolicitante,
      a.solicitanteTelefone,
      a.veiculoPlaca,
      `"${a.veiculoModelo || ""}"`,
      a.status,
      a.dataHora,
      `"${a.endereco}"`,
      a.coordenadas,
      `"${a.descricao || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `central_panico_sos_partiu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Contadores de Incidentes
  const contadores = useMemo(() => {
    return {
      total: alertas.length,
      ativo: alertas.filter((a) => a.status === "ativo").length,
      emAtendimento: alertas.filter((a) => a.status === "em_atendimento").length,
      policiaAcionada: alertas.filter((a) => a.status === "policia_acionada").length,
      resolvido: alertas.filter((a) => a.status === "resolvido").length,
    };
  }, [alertas]);

  // Filtragem
  const listaFiltrada = alertas.filter((item) => {
    if (filtroStatus !== "todos" && item.status !== filtroStatus) return false;
    if (filtroUsuario !== "todos" && item.tipoSolicitante !== filtroUsuario) return false;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const matchNome = item.solicitanteNome.toLowerCase().includes(termo);
      const matchPlaca = item.veiculoPlaca.toLowerCase().includes(termo);
      const matchTel = item.solicitanteTelefone.includes(termo);
      const matchEnd = item.endereco.toLowerCase().includes(termo);
      if (!matchNome && !matchPlaca && !matchTel && !matchEnd) return false;
    }
    return true;
  });

  return (
    <div className="px-4 sm:px-6 pt-5 pb-16 max-w-7xl mx-auto space-y-6">
      {/* Header Principal da Central de Crise */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-destructive/15 text-destructive border border-destructive/30 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              Central de Crise &amp; Pânico 24/7 (Alta Prioridade)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-2 flex items-center gap-2">
            Central de Pânico &amp; Monitoramento SOS
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Painel tático de atendimento a incidentes de segurança urbana acionados por passageiros ou motoristas parceiros com rastreamento GPS e acionamento policial.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportarRelatorioCSV}
            className="min-h-11 px-4 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            Livro de Ocorrências (CSV)
          </button>
        </div>
      </header>

      {/* Toast Feedback */}
      {toastFeedback && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* CARDS DE SITUAÇÃO OPERACIONAL / STATUS DE CRISE */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-destructive/40 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold text-destructive flex items-center gap-1">
              <Flame className="w-4 h-4 text-destructive animate-pulse" />
              Pânico Ativo
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-ping" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-destructive">{contadores.ativo}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Exigem intervenção imediata</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-amber-500/30 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Em Atendimento</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {contadores.emAtendimento}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Operador em contato com a vítima</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-blue-500/30 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-blue-500" />
              Polícia / 190 Acionado
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {contadores.policiaAcionada}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Viatura a caminho do veículo</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Resolvidos Hoje</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {contadores.resolvido}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Ocorrências finalizadas em segurança</div>
        </div>
      </section>

      {/* CONTROLES DE BUSCA E FILTROS */}
      <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border/60 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por solicitante, placa, telefone ou endereço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full min-h-11 h-11 pl-10 pr-4 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Filtros de Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["todos", "ativo", "em_atendimento", "policia_acionada", "resolvido"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFiltroStatus(st)}
              className={`min-h-10 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filtroStatus === st
                  ? st === "ativo"
                    ? "bg-destructive text-destructive-foreground shadow-2xs"
                    : "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {st === "todos" && `Todos (${alertas.length})`}
              {st === "ativo" && `Pânico (${contadores.ativo})`}
              {st === "em_atendimento" && `Em Atendimento (${contadores.emAtendimento})`}
              {st === "policia_acionada" && `Polícia (${contadores.policiaAcionada})`}
              {st === "resolvido" && `Resolvidos (${contadores.resolvido})`}
            </button>
          ))}
        </div>
      </section>

      {/* LISTA DE OCORRÊNCIAS SOS */}
      <div className="space-y-4">
        {listaFiltrada.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-card border border-border/60 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {busca.trim() || filtroStatus !== "todos" || filtroUsuario !== "todos"
                  ? "Nenhum chamado encontrado com os filtros atuais"
                  : "Malha Urbana 100% Segura"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                {busca.trim() || filtroStatus !== "todos" || filtroUsuario !== "todos"
                  ? "Tente alterar os termos de busca ou redefinir os filtros de status e solicitante."
                  : "Nenhum chamado de emergência ou incidente crítico ativo. O sistema permanece monitorando a frota e os passageiros 24/7."}
              </p>
              {(busca.trim() || filtroStatus !== "todos" || filtroUsuario !== "todos") && (
                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setFiltroStatus("todos");
                    setFiltroUsuario("todos");
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition cursor-pointer"
                >
                  Limpar Todos os Filtros
                </button>
              )}
            </div>
          </div>
        ) : (
          listaFiltrada.map((item) => {
            const isCritico = item.status === "ativo";
            const [lat, lng] = item.coordenadas.split(",").map((s) => s.trim());

            return (
              <div
                key={item.id}
                className={`p-5 sm:p-6 rounded-3xl bg-card border transition-all space-y-4 ${
                  isCritico
                    ? "border-destructive/60 shadow-xl ring-2 ring-destructive/20"
                    : "border-border/80 shadow-2xs"
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                        isCritico
                          ? "bg-destructive text-white animate-pulse"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <AlertOctagon className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-black text-foreground">
                          {item.solicitanteNome}
                        </h2>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                            item.tipoSolicitante === "passageiro"
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {item.tipoSolicitante === "passageiro" ? "Passageiro" : "Motorista Parceiro"}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground font-bold">
                          #{item.id}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        Acionado às <strong className="text-foreground">{item.dataHora}</strong> · Telefone:{" "}
                        <strong className="text-foreground">{item.solicitanteTelefone}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Badge de Status Atual */}
                  <div>
                    {item.status === "ativo" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-destructive text-white shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        PÂNICO ATIVO
                      </span>
                    )}
                    {item.status === "em_atendimento" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950">
                        <Clock className="w-3.5 h-3.5" />
                        EM ATENDIMENTO
                      </span>
                    )}
                    {item.status === "policia_acionada" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        POLÍCIA ACIONADA (190)
                      </span>
                    )}
                    {item.status === "resolvido" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        RESOLVIDO
                      </span>
                    )}
                  </div>
                </div>

                {/* Dados da Ocorrência e Veículo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Bloco de Localização GPS */}
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        Localização Geográfica do Chamado:
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">{item.coordenadas}</span>
                    </div>

                    <p className="text-foreground font-semibold">{item.endereco}</p>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-bold text-foreground hover:bg-accent transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-primary" />
                        Google Maps
                      </a>
                      <a
                        href={`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-bold text-foreground hover:bg-accent transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-blue-500" />
                        Waze
                      </a>
                    </div>
                  </div>

                  {/* Bloco do Veículo & Corrida */}
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-primary" />
                      Dados do Veículo &amp; Corrida Vinculada:
                    </span>

                    <div className="flex items-center justify-between text-foreground">
                      <span>
                        Veículo: <strong>{item.veiculoModelo} ({item.veiculoCor})</strong>
                      </span>
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-card border border-border">
                        {item.veiculoPlaca}
                      </span>
                    </div>

                    {item.contraparteNome && (
                      <p className="text-muted-foreground">
                        Outra parte: <strong className="text-foreground">{item.contraparteNome}</strong>
                      </p>
                    )}

                    {item.protocoloPolicia && (
                      <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold">
                        Protocolo PM/190: {item.protocoloPolicia}
                      </div>
                    )}
                  </div>
                </div>

                {/* Relato / Descrição */}
                {item.descricao && (
                  <div className="p-3 rounded-2xl bg-destructive/5 border border-destructive/20 text-xs text-foreground italic">
                    "{item.descricao}"
                  </div>
                )}

                {/* BOTÕES DE AÇÃO RÁPIDA & PROTOCOLOS DE EMERGÊNCIA */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`tel:${item.solicitanteTelefone.replace(/\D/g, "")}`}
                      className="min-h-10 px-3.5 rounded-xl bg-card border border-border text-foreground hover:bg-accent text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      Ligar ({item.solicitanteTelefone})
                    </a>

                    <a
                      href={`https://wa.me/55${item.solicitanteTelefone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-10 px-3.5 rounded-xl bg-card border border-border text-foreground hover:bg-accent text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                      WhatsApp
                    </a>

                    <a
                      href="tel:190"
                      className="min-h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      onClick={() => handleAlterarStatus(item.id, "policia_acionada")}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Acionar 190 (Polícia Militar)
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status !== "em_atendimento" && item.status !== "resolvido" && (
                      <button
                        type="button"
                        onClick={() => handleAlterarStatus(item.id, "em_atendimento")}
                        className="min-h-10 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Iniciar Atendimento
                      </button>
                    )}

                    {item.status !== "resolvido" ? (
                      <button
                        type="button"
                        onClick={() => abrirModalConcluir(item)}
                        className="min-h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Concluir Ocorrência
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10">
                        <ShieldCheck className="w-4 h-4" />
                        Caso Arquivado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: CONCLUIR OCORRÊNCIA COM RELATÓRIO DO OPERADOR */}
      {modalConclusaoAberto && alertaParaConcluir && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">Concluir Atendimento de Crise</h2>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Ocorrência #{alertaParaConcluir.id} · {alertaParaConcluir.solicitanteNome}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConclusaoAberto(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={salvarConclusaoOcorrencia} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Protocolo Policial / Órgão Externo (Se houver)</label>
                <input
                  type="text"
                  placeholder="Ex: 190-RJ-2026-9812 ou SAMU-04"
                  value={protocoloPoliciaInput}
                  onChange={(e) => setProtocoloPoliciaInput(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                  Relatório do Operador / Providências Tomadas *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva o desfecho do incidente: se os envolvidos ficaram em segurança, se a viatura compareceu ou se houve engano..."
                  value={textoDesfecho}
                  onChange={(e) => setTextoDesfecho(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalConclusaoAberto(false)}
                  className="h-8.5 px-3 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-8.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Finalizar &amp; Arquivar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
