import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flag,
  MapPin,
  Navigation,
  Play,
  Send,
  Star,
  Car,
  Package,
  KeyRound,
  ShieldCheck,
  Phone,
  MessageCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Users,
  Activity,
  DollarSign,
  Flame,
  Zap,
  Radio,
  Sliders,
  X,
  Plus,
  Trash2,
  PauseCircle,
  PlayCircle,
  CloudRain,
  Calendar,
  Sparkles,
  Percent,
} from "lucide-react";
import { getCorridaAtiva, obterPainelSaudeCidade, type CorridaPartiu, type CityHealthDashboardData } from "@/lib/partiu-engine";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { AdminManualDispatchModal } from "@/components/admin/AdminManualDispatchModal";
import { useAdminCity } from "@/contexts/AdminCityContext";
import {
  type SurgeRule,
  type DispatchAlgorithmSettings,
  carregarConfiguracoesDespacho,
  salvarConfiguracoesDespacho,
  carregarRegrasSurge,
  salvarRegraSurge,
  alternarStatusRegraSurge,
  excluirRegraSurge,
  ativarLiveSurgeOverride,
  desativarLiveSurgeOverride,
} from "@/lib/surge-rules-service";

export const Route = createFileRoute("/app/admin/despacho")({
  head: () => ({
    meta: [
      { title: "Central de Despacho & Regras de Matching | PARTIU Admin" },
      {
        name: "description",
        content:
          "Controle de chamadas de corridas urbanas, entregas expressas, parâmetros do algoritmo de busca progressiva e tarifas dinâmicas (Surge Pricing).",
      },
    ],
  }),
  component: DespachoCentralCorridas,
});

interface ItemDespachoMock {
  id: string;
  tipo: "CORRIDA_POP" | "CORRIDA_MOTO" | "CORRIDA_PLUS" | "CORRIDA_MULHER" | "ENTREGA_FLASH";
  passageiro: string;
  telefone: string;
  origem: string;
  destino: string;
  motorista: string;
  veiculo: string;
  placa: string;
  valor: number;
  pin: string;
  status: "PROCURANDO" | "A_CAMINHO" | "EM_VIAGEM" | "CONCLUIDA";
  tempoDecorrido: string;
}

export function DespachoCentralCorridas() {
  const { pracaAtiva, isNacional } = useAdminCity();
  const [abaAtiva, setAbaAtiva] = useState<"FILA_DESPACHO" | "REGRAS_SURGE">("FILA_DESPACHO");
  
  // Fila de Despacho
  const [itens, setItens] = useState<ItemDespachoMock[]>([]);
  const [filtro, setFiltro] = useState<"TODAS" | "CORRIDAS" | "ENTREGAS">("TODAS");
  const [busca, setBusca] = useState("");
  const [modalNovoChamado, setModalNovoChamado] = useState(false);
  const saudeCidade = obterPainelSaudeCidade();

  // Configurações do Algoritmo de Despacho & Surge Pricing
  const [dispatchSettings, setDispatchSettings] = useState<DispatchAlgorithmSettings>(() =>
    carregarConfiguracoesDespacho()
  );
  const [surgeRules, setSurgeRules] = useState<SurgeRule[]>(() => carregarRegrasSurge());
  
  // Live Override Controls
  const [liveOverrideMultiplicador, setLiveOverrideMultiplicador] = useState(1.4);
  const [liveOverrideDuracaoMinutos, setLiveOverrideDuracaoMinutos] = useState(30);

  // Modal Nova Regra Surge
  const [modalNovaRegra, setModalNovaRegra] = useState(false);
  const [formRegraNome, setFormRegraNome] = useState("");
  const [formRegraDesc, setFormRegraDesc] = useState("");
  const [formRegraGatilho, setFormRegraGatilho] = useState<SurgeRule["gatilho"]>("HORARIO");
  const [formRegraInicio, setFormRegraInicio] = useState("18:00");
  const [formRegraFim, setFormRegraFim] = useState("20:00");
  const [formRegraDias, setFormRegraDias] = useState("Seg à Sex");
  const [formRegraMult, setFormRegraMult] = useState(1.3);

  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3500);
  };

  const recarregarConfiguracoes = () => {
    setDispatchSettings(carregarConfiguracoesDespacho());
    setSurgeRules(carregarRegrasSurge());
  };

  useEffect(() => {
    const handleSettingsUpdate = () => recarregarConfiguracoes();
    window.addEventListener("partiu:dispatch-settings-updated", handleSettingsUpdate);
    window.addEventListener("partiu:surge-rules-updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("partiu:dispatch-settings-updated", handleSettingsUpdate);
      window.removeEventListener("partiu:surge-rules-updated", handleSettingsUpdate);
    };
  }, []);

  // Sincronizar corridas reais do Supabase e eventos distribuídos
  useEffect(() => {
    async function carregarCorridasDoBanco() {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await (supabase as any)
            .from("partiu_corridas")
            .select("*, partiu_motoristas(nome, veiculo_marca_modelo, veiculo_placa)")
            .in("status", ["PROCURANDO", "OFERTADA", "A_CAMINHO", "CHEGOU", "EM_VIAGEM"])
            .order("created_at", { ascending: false })
            .limit(20);

          if (!error && data && data.length > 0) {
            const reais: ItemDespachoMock[] = data.map((c: any) => ({
              id: c.codigo_viagem || c.id,
              tipo: c.is_entrega || c.modalidade?.startsWith("ENTREGA")
                ? "ENTREGA_FLASH"
                : c.modalidade === "MOTO"
                  ? "CORRIDA_MOTO"
                  : c.modalidade === "PLUS"
                    ? "CORRIDA_PLUS"
                    : c.modalidade === "MULHER"
                      ? "CORRIDA_MULHER"
                      : "CORRIDA_POP",
              passageiro: c.passageiro_nome || "Passageiro",
              telefone: c.passageiro_telefone || "(22) 99999-0000",
              origem: c.origem_endereco || "Origem em rota",
              destino: c.destino_endereco || "Destino em rota",
              motorista: c.partiu_motoristas?.nome || "Buscando parceiro...",
              veiculo: c.partiu_motoristas?.veiculo_marca_modelo || "Aguardando aceite",
              placa: c.partiu_motoristas?.veiculo_placa || "---",
              valor: (c.valor_bruto_cents || 1600) / 100,
              pin: c.pin_seguranca || "----",
              status: c.status === "EM_VIAGEM" || c.status === "CHEGOU"
                ? "EM_VIAGEM"
                : c.status === "A_CAMINHO"
                  ? "A_CAMINHO"
                  : c.status === "CONCLUIDA"
                    ? "CONCLUIDA"
                    : "PROCURANDO",
              tempoDecorrido: "Ao vivo",
            }));

            setItens(reais);
          } else if (!error) {
            setItens([]);
          }
        } catch (err) {
          console.warn("[AdminDespacho] Falha ao consultar corridas:", err);
        }
      }
    }

    void carregarCorridasDoBanco();

    function verificarCorridaAtiva() {
      const real = getCorridaAtiva();
      if (real && (real.status as string) !== "IDLE") {
        const itemReal: ItemDespachoMock = {
          id: real.id,
          tipo: real.modalidade === "MOTO"
            ? "CORRIDA_MOTO"
            : real.isEntrega
              ? "ENTREGA_FLASH"
              : real.modalidade === "MULHER"
                ? "CORRIDA_MULHER"
                : "CORRIDA_POP",
          passageiro: real.passageiroNome || "Passageiro App",
          telefone: real.passageiroTelefone || "(22) 99999-0000",
          origem: real.origem || "Origem via GPS",
          destino: real.destino || "Destino via GPS",
          motorista: real.motorista?.nome || "Buscando parceiro...",
          veiculo: real.motorista?.veiculo || "Aguardando aceite",
          placa: real.motorista?.placa || "---",
          valor: real.valor || 14.5,
          pin: real.pin || "1234",
          status:
            real.status === "A_CAMINHO" || real.status === "CHEGOU"
              ? "A_CAMINHO"
              : real.status === "EM_VIAGEM"
                ? "EM_VIAGEM"
                : real.status === "CONCLUIDA"
                  ? "CONCLUIDA"
                  : "PROCURANDO",
          tempoDecorrido: "Ao vivo",
        };

        setItens((prev) => {
          const semEla = prev.filter((i) => i.id !== real.id);
          return [itemReal, ...semEla];
        });
      }
    }

    verificarCorridaAtiva();
    const interval = setInterval(verificarCorridaAtiva, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handlers de Parâmetros de Despacho
  const handleSalvarParametros = (e: React.FormEvent) => {
    e.preventDefault();
    salvarConfiguracoesDespacho(dispatchSettings);
    showToast("Parâmetros do algoritmo de despacho salvos com sucesso!");
  };

  // Handlers de Live Override
  const handleAtivarLiveOverride = () => {
    ativarLiveSurgeOverride(liveOverrideMultiplicador, liveOverrideDuracaoMinutos);
    recarregarConfiguracoes();
    showToast(`Sobretaxa de x${liveOverrideMultiplicador.toFixed(1)} aplicada por ${liveOverrideDuracaoMinutos} minutos!`);
  };

  const handleDesativarLiveOverride = () => {
    desativarLiveSurgeOverride();
    recarregarConfiguracoes();
    showToast("Sobretaxa administrativa desativada. Retornado à tarifa padrão.");
  };

  // Handlers de Regras de Surge
  const handleAlternarRegra = (id: string, nome: string) => {
    alternarStatusRegraSurge(id);
    recarregarConfiguracoes();
    showToast(`Status da regra ${nome} alterado.`);
  };

  const handleExcluirRegra = (id: string, nome: string) => {
    if (window.confirm(`Deseja remover a regra de tarifa dinâmica "${nome}"?`)) {
      excluirRegraSurge(id);
      recarregarConfiguracoes();
      showToast(`Regra ${nome} removida.`);
    }
  };

  const handleCriarRegra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRegraNome.trim()) return;

    salvarRegraSurge({
      nome: formRegraNome.trim(),
      descricao: formRegraDesc.trim() || "Regra automatizada de pico",
      gatilho: formRegraGatilho,
      horarioInicio: formRegraGatilho === "HORARIO" ? formRegraInicio : undefined,
      horarioFim: formRegraGatilho === "HORARIO" ? formRegraFim : undefined,
      diasSemana: formRegraGatilho === "HORARIO" ? formRegraDias : undefined,
      multiplicador: Number(formRegraMult),
      ativo: true,
    });

    setModalNovaRegra(false);
    setFormRegraNome("");
    setFormRegraDesc("");
    recarregarConfiguracoes();
    showToast(`Regra "${formRegraNome}" criada com sucesso!`);
  };

  const listaFiltrada = itens.filter((item) => {
    if (filtro === "CORRIDAS" && item.tipo === "ENTREGA_FLASH") return false;
    if (filtro === "ENTREGAS" && item.tipo !== "ENTREGA_FLASH") return false;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const matchPassageiro = item.passageiro.toLowerCase().includes(termo);
      const matchMotorista = item.motorista.toLowerCase().includes(termo);
      const matchPlaca = item.placa.toLowerCase().includes(termo);
      const matchPin = item.pin.includes(termo);
      if (!matchPassageiro && !matchMotorista && !matchPlaca && !matchPin) return false;
    }
    return true;
  });

  return (
    <div className="w-full space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 pt-5">
      {/* Header com Identidade PARTIU */}
      <header className="w-full bg-slate-950 p-6 sm:p-7 rounded-3xl text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0088FF]/20 px-4 py-1.5 text-xs font-black uppercase text-primary-500 border border-primary-600/30">
            <Package className="h-4 w-4" />
            <span>Torre de Despacho &amp; Radar em Tempo Real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Central de Despacho &amp; Regras de Matching
          </h1>
          <p className="text-sm text-slate-300 max-w-3xl font-medium leading-relaxed">
            Monitore o fluxo de chamadas ao vivo, configure os parâmetros do algoritmo de busca progressiva e automatize tarifas dinâmicas (Surge Pricing).
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setModalNovoChamado(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition active:scale-95 shadow-md cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>+ Novo Chamado (Central / Zap)</span>
          </button>
          
          {/* Seletor de Abas */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setAbaAtiva("FILA_DESPACHO")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                abaAtiva === "FILA_DESPACHO"
                  ? "bg-primary text-slate-950 font-black shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Fila ao Vivo
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva("REGRAS_SURGE")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                abaAtiva === "REGRAS_SURGE"
                  ? "bg-primary text-slate-950 font-black shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Regras &amp; Surge
            </button>
          </div>
        </div>
      </header>

      {/* Toast Feedback */}
      {toastFeedback && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: FILA DE DESPACHO AO VIVO */}
      {/* ========================================================================= */}
      {abaAtiva === "FILA_DESPACHO" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Painel de Saúde da Cidade */}
          <div className="w-full bg-card rounded-3xl p-6 border border-border/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                  Observabilidade Operacional
                </span>
                <h2 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  Painel de Saúde da Cidade {!isNacional ? `(${pracaAtiva.labelCompleto})` : "& Marketplace (Nacional)"}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Liquidez Saudável: 94.2% Atendimento</span>
              </div>
            </div>

            {/* 6 KPIs Estratégicos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-muted/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Motoristas Online</span>
                  <Users className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <span className="text-2xl font-black text-foreground">{saudeCidade.motoristasOnline}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                  {saudeCidade.motoristasEmViagem} em rota ativa
                </span>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Corridas Ativas</span>
                  <Car className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <span className="text-2xl font-black text-foreground">{saudeCidade.corridasAtivas}</span>
                <span className="text-[10px] text-primary font-bold block mt-0.5">Tempo real</span>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Tempo Médio Espera</span>
                  <Clock className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <span className="text-2xl font-black text-foreground">{saudeCidade.tempoMedioEsperaMinutos} min</span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">Dentro da meta</span>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Taxa Aceite</span>
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <span className="text-2xl font-black text-foreground">{saudeCidade.taxaAceitePercent}%</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">Alta conversão</span>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Receita Bruta Hoje</span>
                  <DollarSign className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <span className="text-2xl font-black text-foreground">
                  R$ {saudeCidade.receitaBrutaHojeBrl.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">GMV acumulado</span>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Índice Demanda</span>
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {dispatchSettings.liveOverrideAtivo
                    ? `x${dispatchSettings.liveOverrideMultiplicador.toFixed(1)}`
                    : `x${saudeCidade.zonasHotspots[0]?.surgeMultiplier?.toFixed(1) || "1.2"}`}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                  {dispatchSettings.liveOverrideAtivo ? "Override ativo" : "Multiplicador dinâmico"}
                </span>
              </div>
            </div>
          </div>

          {/* Filtros e Busca de Chamadas */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border/60 shadow-2xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por passageiro, motorista, placa ou código PIN..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full min-h-11 h-11 pl-10 pr-4 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(["TODAS", "CORRIDAS", "ENTREGAS"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFiltro(t)}
                  className={`min-h-10 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    filtro === t
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t === "TODAS" && "Todas as Chamadas"}
                  {t === "CORRIDAS" && "Apenas Corridas"}
                  {t === "ENTREGAS" && "Apenas Entregas Flash"}
                </button>
              ))}
            </div>
          </div>

          {/* Grade de Cartões de Despacho ao Vivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listaFiltrada.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-3xl border border-border/60">
                <Radio className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2 animate-pulse" />
                <p className="font-semibold text-sm">Nenhuma corrida em andamento no momento</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aguardando novas solicitações de passageiros ou chamados manuais da central.
                </p>
              </div>
            ) : (
              listaFiltrada.map((item) => (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl p-4 sm:p-5 border border-border/80 shadow-2xs hover:border-primary/40 transition-all space-y-3.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="font-mono text-xs font-bold text-muted-foreground">{item.id}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.status === "EM_VIAGEM"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : item.status === "A_CAMINHO"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {item.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Origem</span>
                        <span className="text-foreground font-medium truncate block">{item.origem}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Destino</span>
                        <span className="text-foreground font-medium truncate block">{item.destino}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-foreground block">{item.passageiro}</span>
                      <span className="text-[10px] text-muted-foreground">{item.telefone}</span>
                    </div>

                    <div className="text-center px-3 py-1 bg-primary text-primary-foreground rounded-lg shadow-2xs">
                      <span className="text-[8px] font-black uppercase block">PIN</span>
                      <span className="text-sm font-mono font-black">{item.pin}</span>
                    </div>
                  </div>

                  <div className="text-xs pt-1 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold block">Condutor Parceiro</span>
                      <span className="font-bold text-foreground">{item.motorista}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        {item.veiculo} • <strong>{item.placa}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Valor</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        R$ {item.valor.toFixed(2).replace(".", ",")}
                      </strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: REGRAS DE DESPACHO & TARIFAS DINÂMICAS (SURGE PRICING) */}
      {/* ========================================================================= */}
      {abaAtiva === "REGRAS_SURGE" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* CARD DE SOBRETAXA MANUAL IMEDIATA (LIVE OVERRIDE) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  dispatchSettings.liveOverrideAtivo
                    ? "bg-amber-500/10 text-amber-500 animate-pulse"
                    : "bg-primary/10 text-primary"
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-foreground">
                      Sobretaxa Administrativa Imediata (Live Override)
                    </h3>
                    {dispatchSettings.liveOverrideAtivo && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                        SOBRETAXA ATIVA x{dispatchSettings.liveOverrideMultiplicador.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Força multiplicador dinâmico de alta demanda instantaneamente em todas as novas corridas da praça.
                  </p>
                </div>
              </div>

              {dispatchSettings.liveOverrideAtivo ? (
                <button
                  type="button"
                  onClick={handleDesativarLiveOverride}
                  className="min-h-11 px-4 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Desativar Sobretaxa Agora
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAtivarLiveOverride}
                  className="min-h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  Aplicar Sobretaxa Imediata
                </button>
              )}
            </div>

            {/* Configurações Rápidas de Disparo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Multiplicador Instantâneo: <span className="text-primary font-black">x{liveOverrideMultiplicador.toFixed(1)}</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1.2, 1.4, 1.6, 1.8, 2.0].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLiveOverrideMultiplicador(m)}
                      className={`flex-1 min-h-10 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        liveOverrideMultiplicador === m
                          ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      x{m.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Duração do Override: <span className="text-primary font-black">{liveOverrideDuracaoMinutos} minutos</span>
                </label>
                <div className="flex items-center gap-2">
                  {[15, 30, 60, 120].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setLiveOverrideDuracaoMinutos(min)}
                      className={`flex-1 min-h-10 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        liveOverrideDuracaoMinutos === min
                          ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {min >= 60 ? `${min / 60}h` : `${min}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PARÂMETROS DO ALGORITMO DE DESPACHO & RAIO PROGRESSIVO */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    Parâmetros do Algoritmo de Raio Progressivo &amp; Take Rate
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ajuste o comportamento do matching de condutores e as taxas retidas pela plataforma.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSalvarParametros} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Raio Inicial de Busca (km)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="15"
                    required
                    value={dispatchSettings.raioInicialKm}
                    onChange={(e) =>
                      setDispatchSettings((prev) => ({
                        ...prev,
                        raioInicialKm: Number(e.target.value),
                      }))
                    }
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground block">Onda 1: motoristas imediatos</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Expansão por Minuto (km/min)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="5"
                    required
                    value={dispatchSettings.expansaoKmPorMinuto}
                    onChange={(e) =>
                      setDispatchSettings((prev) => ({
                        ...prev,
                        expansaoKmPorMinuto: Number(e.target.value),
                      }))
                    }
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground block">Crescimento radial a cada 60s</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Teto Radial Máximo (km)</label>
                  <input
                    type="number"
                    step="1"
                    min="3"
                    max="30"
                    required
                    value={dispatchSettings.raioMaximoKm}
                    onChange={(e) =>
                      setDispatchSettings((prev) => ({
                        ...prev,
                        raioMaximoKm: Number(e.target.value),
                      }))
                    }
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground block">Distância máxima motorista × corrida</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Timeout Geral de Busca (segundos)</label>
                  <input
                    type="number"
                    step="10"
                    min="30"
                    max="300"
                    required
                    value={dispatchSettings.timeoutGeralSegundos}
                    onChange={(e) =>
                      setDispatchSettings((prev) => ({
                        ...prev,
                        timeoutGeralSegundos: Number(e.target.value),
                      }))
                    }
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground block">Auto-cancelamento se ninguém aceitar</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Piso Mínimo Garantido (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="5"
                    max="50"
                    required
                    value={dispatchSettings.pisoMinimoCorrida}
                    onChange={(e) =>
                      setDispatchSettings((prev) => ({
                        ...prev,
                        pisoMinimoCorrida: Number(e.target.value),
                      }))
                    }
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground block">Tarifa mínima aceita</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tolerância Cancelamento (minutos)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="10"
                    required
                    value={dispatchSettings.toleranciaCancelamentoMinutos}
                    onChange={(e) =>
                      setDispatchSettings((prev) => ({
                        ...prev,
                        toleranciaCancelamentoMinutos: Number(e.target.value),
                      }))
                    }
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground block">Cancelamento sem cobrança de taxa</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Parada Adicional (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    max="20"
                    required
                    value={dispatchSettings.tarifaParadaAdicional}
                    onChange={(e) =>
                      setDispatchSettings((prev) => ({
                        ...prev,
                        tarifaParadaAdicional: Number(e.target.value),
                      }))
                    }
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground block">Adicional por parada intermediária</span>
                </div>
              </div>

              {/* Take Rate da Plataforma */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-primary" />
                    Take Rate da Plataforma (Comissão Retida do Motorista)
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Defina se a taxa retida pela central PARTIU é um percentual sobre o valor bruto ou uma taxa fixa em reais.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center p-1 rounded-xl bg-background border border-border">
                    <button
                      type="button"
                      onClick={() =>
                        setDispatchSettings((prev) => ({ ...prev, takeRateTipo: "PERCENTUAL" }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dispatchSettings.takeRateTipo === "PERCENTUAL"
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Percentual (%)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDispatchSettings((prev) => ({ ...prev, takeRateTipo: "FIXO" }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dispatchSettings.takeRateTipo === "FIXO"
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Fixo (R$)
                    </button>
                  </div>

                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={dispatchSettings.takeRateTipo === "PERCENTUAL" ? 50 : 20}
                    value={dispatchSettings.takeRateValor}
                    onChange={(e) =>
                      setDispatchSettings((prev) => ({
                        ...prev,
                        takeRateValor: Number(e.target.value),
                      }))
                    }
                    className="w-24 min-h-11 h-11 px-3 rounded-xl bg-background border border-border font-mono font-bold text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center"
                  />
                  <span className="text-xs font-bold text-muted-foreground">
                    {dispatchSettings.takeRateTipo === "PERCENTUAL" ? "%" : "R$"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  className="min-h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Parâmetros de Despacho
                </button>
              </div>
            </form>
          </div>

          {/* TARIFAS DINÂMICAS AUTOMATIZADAS (SURGE PRICING RULES) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    Regras Automatizadas de Tarifa Dinâmica (Surge Pricing)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Defina sobretaxas automáticas por janela de horário, fim de semana ou alerta climático.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalNovaRegra(true)}
                className="min-h-11 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Nova Regra Surge
              </button>
            </div>

            {/* Tabela de Regras */}
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 border-b border-border/60 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Nome da Regra</th>
                    <th className="py-3 px-4">Gatilho</th>
                    <th className="py-3 px-4">Janela / Condição</th>
                    <th className="py-3 px-4 text-center">Multiplicador</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {surgeRules.map((regra) => (
                    <tr key={regra.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-foreground">{regra.nome}</div>
                        <div className="text-xs text-muted-foreground">{regra.descricao}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-muted text-foreground">
                          {regra.gatilho === "HORARIO" && <Clock className="w-3 h-3 text-blue-500" />}
                          {regra.gatilho === "CLIMA" && <CloudRain className="w-3 h-3 text-cyan-500" />}
                          {regra.gatilho === "EVENTO" && <Sparkles className="w-3 h-3 text-purple-500" />}
                          {regra.gatilho}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-muted-foreground">
                        {regra.gatilho === "HORARIO"
                          ? `${regra.horarioInicio} às ${regra.horarioFim} (${regra.diasSemana})`
                          : regra.gatilho === "CLIMA"
                            ? "Precipitação / Chuva detectada"
                            : "Perímetro de Evento"}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          x{regra.multiplicador.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            regra.ativo
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              regra.ativo ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {regra.ativo ? "Ativa" : "Pausada"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAlternarRegra(regra.id, regra.nome)}
                            title={regra.ativo ? "Pausar Regra" : "Ativar Regra"}
                            className="min-h-9 min-w-9 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                          >
                            {regra.ativo ? (
                              <PauseCircle className="w-4 h-4 text-amber-500" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-emerald-500" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirRegra(regra.id, regra.nome)}
                            title="Excluir Regra"
                            className="min-h-9 min-w-9 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA REGRA DE TARIFA DINÂMICA */}
      {modalNovaRegra && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">Nova Regra de Tarifa Dinâmica</h2>
                  <p className="text-xs text-muted-foreground">Configure um multiplicador para horários de alta demanda.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaRegra(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarRegra} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Nome da Regra</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pico Happy Hour, Feriado Carnavalesco"
                  value={formRegraNome}
                  onChange={(e) => setFormRegraNome(e.target.value)}
                  className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Tipo de Gatilho</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["HORARIO", "CLIMA", "EVENTO"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormRegraGatilho(g)}
                      className={`min-h-10 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        formRegraGatilho === g
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {g === "HORARIO" && "Por Horário"}
                      {g === "CLIMA" && "Meteorológico"}
                      {g === "EVENTO" && "Evento Regional"}
                    </button>
                  ))}
                </div>
              </div>

              {formRegraGatilho === "HORARIO" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Início</label>
                    <input
                      type="time"
                      required
                      value={formRegraInicio}
                      onChange={(e) => setFormRegraInicio(e.target.value)}
                      className="w-full min-h-11 h-11 px-3 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Fim</label>
                    <input
                      type="time"
                      required
                      value={formRegraFim}
                      onChange={(e) => setFormRegraFim(e.target.value)}
                      className="w-full min-h-11 h-11 px-3 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Dias</label>
                    <input
                      type="text"
                      placeholder="Ex: Seg à Sex"
                      value={formRegraDias}
                      onChange={(e) => setFormRegraDias(e.target.value)}
                      className="w-full min-h-11 h-11 px-3 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Multiplicador da Sobretaxa: <span className="text-primary font-black">x{formRegraMult.toFixed(2)}</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">+{(Math.round((formRegraMult - 1) * 100))}% de valor</span>
                </div>
                <input
                  type="range"
                  min={1.1}
                  max={2.5}
                  step={0.05}
                  value={formRegraMult}
                  onChange={(e) => setFormRegraMult(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setModalNovaRegra(false)}
                  className="min-h-11 px-4 rounded-xl border border-border text-foreground font-semibold text-xs sm:text-sm hover:bg-accent transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Cadastrar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OFICIAL: CENTRAL DE DESPACHO MANUAL (CALL CENTER & WHATSAPP) */}
      <AdminManualDispatchModal
        isOpen={modalNovoChamado}
        onClose={() => setModalNovoChamado(false)}
        cidadePadrao={isNacional ? undefined : pracaAtiva.labelCompleto}
        onDispatchCreated={(novo) => {
          setItens((prev) => [novo, ...prev]);
        }}
      />
    </div>
  );
}
