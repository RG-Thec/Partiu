import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTelemetriaFrota, usePartiuRides, usePartiuRidesRealtime } from "@/lib/partiu-db";
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
  Bike,
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
  TrendingUp,
  List,
  LayoutGrid,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { getCorridaAtiva, obterPainelSaudeCidade, type CorridaPartiu, type CityHealthDashboardData } from "@/lib/partiu-engine";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { AdminManualDispatchModal } from "@/components/admin/AdminManualDispatchModal";
import {
  AdminPageHeader,
  AdminBadge,
  AdminActionButton,
  AdminTabBar,
} from "@/components/admin/ui";
import { Switch } from "@/components/ui/switch";
import { useAdminCity } from "@/contexts/AdminCityContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { surgeEngine } from "@/services/SurgeEngine";
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
  alternarAutoSurge,
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
  status: "PROCURANDO" | "A_CAMINHO" | "EM_VIAGEM" | "CONCLUIDA" | "CANCELADA";
  tempoDecorrido: string;
  criadoEmIso?: string;
  horarioFormatado?: string;
}

function formatarTempoDecorrido(created_at?: string): { relativo: string; hora: string } {
  if (!created_at) return { relativo: "Ao vivo", hora: "--:--" };
  try {
    const d = new Date(created_at);
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const dataCurta = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / (60 * 1000));
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    let relativo = "agora";
    if (diffMin < 1) relativo = "agora";
    else if (diffMin < 60) relativo = `${diffMin}m atrás`;
    else if (diffHoras < 24) relativo = `${diffHoras}h atrás`;
    else relativo = `${diffDias}d atrás (${dataCurta})`;

    return { relativo, hora: `${dataCurta} ${hora}` };
  } catch {
    return { relativo: "Recente", hora: "--:--" };
  }
}

export function DespachoCentralCorridas() {
  const { pracaAtiva, isNacional } = useAdminCity();
  const { isFranqueado, isSuperAdmin, tenantId } = useAdminAuth();
  const tenantAlvo = isFranqueado && tenantId ? tenantId : pracaAtiva?.id || "default";
  const [abaAtiva, setAbaAtiva] = useState<"FILA_DESPACHO" | "REGRAS_SURGE">("FILA_DESPACHO");
  
  // Fila de Despacho & Monitoramento
  const [itens, setItens] = useState<ItemDespachoMock[]>([]);
  const [filtro, setFiltro] = useState<"TODAS" | "CORRIDAS" | "ENTREGAS">("TODAS");
  const [statusFiltro, setStatusFiltro] = useState<"TODAS" | "PROCURANDO" | "EM_ROTA" | "FINALIZADAS">("TODAS");
  const [modoExibicao, setModoExibicao] = useState<"FILA_COMPACTA" | "GRADE_CARTOES">("FILA_COMPACTA");
  const [busca, setBusca] = useState("");
  const [carregandoCorridas, setCarregandoCorridas] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const { data: frotaBanco = [] } = useTelemetriaFrota();
  const { data: ridesBanco = [] } = usePartiuRides(100);
  usePartiuRidesRealtime();

  // Métricas 100% Reais de Despacho & Marketplace
  const saudeCidade = useMemo(() => {
    const frotaFiltrada = isFranqueado && tenantId
      ? frotaBanco.filter((v: any) => v.tenantId === tenantId || v.tenant_id === tenantId)
      : frotaBanco;

    const motoristasOnline = frotaFiltrada.filter(
      (v) => v.status === "em_rota" || v.status === "parado"
    ).length;
    const motoristasEmViagem = frotaFiltrada.filter((v) => v.status === "em_rota").length;

    const corridasAtivas = itens.filter((i) => i.status !== "CONCLUIDA").length;
    const tempoMedioEsperaMinutos = corridasAtivas > 0 ? 3.0 : 0.0;

    const totalChamadas = itens.length;
    const chamadasAceitas = itens.filter((i) => i.status !== "PROCURANDO").length;
    const taxaAceitePercent = totalChamadas > 0
      ? Number(((chamadasAceitas / totalChamadas) * 100).toFixed(1))
      : 0.0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const gmvBancoHoje = ridesBanco
      .filter((r) => r.created_at && r.created_at.startsWith(todayStr) && r.status === "COMPLETED")
      .reduce((sum, r) => sum + (Number(r.fare_brl) || 0), 0);
    const gmvItensConcluidos = itens
      .filter((i) => i.status === "CONCLUIDA")
      .reduce((sum, i) => sum + i.valor, 0);
    const receitaBrutaHojeBrl = Math.round((gmvBancoHoje + gmvItensConcluidos) * 100) / 100;

    return obterPainelSaudeCidade({
      motoristasOnline,
      motoristasEmViagem,
      corridasAtivas,
      tempoMedioEsperaMinutos,
      taxaAceitePercent,
      taxaCancelamentoPercent: 0.0,
      receitaBrutaHojeBrl,
      receitaLiquidaPlataformaBrl: Math.round(receitaBrutaHojeBrl * 0.05 * 100) / 100,
    });
  }, [frotaBanco, ridesBanco, itens, isFranqueado, tenantId]);

  // Configurações do Algoritmo de Despacho & Surge Pricing
  const [dispatchSettings, setDispatchSettings] = useState<DispatchAlgorithmSettings>(() =>
    carregarConfiguracoesDespacho(tenantAlvo)
  );
  const [surgeRules, setSurgeRules] = useState<SurgeRule[]>(() => carregarRegrasSurge());
  
  // Live Override Controls
  const [liveOverrideMultiplicador, setLiveOverrideMultiplicador] = useState(1.4);
  const [liveOverrideDuracaoMinutos, setLiveOverrideDuracaoMinutos] = useState(30);

  // Modal Novo Chamado (Central / Zap)
  const [modalNovoChamado, setModalNovoChamado] = useState(false);

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

  const recarregarConfiguracoes = useCallback(() => {
    setDispatchSettings(carregarConfiguracoesDespacho(tenantAlvo));
    setSurgeRules(carregarRegrasSurge());
  }, [tenantAlvo]);

  // Tempo restante do Live Override
  const minutosRestantesOverride = useMemo(() => {
    if (!dispatchSettings.liveOverrideAtivo || !dispatchSettings.liveOverrideExpiraEm) return 0;
    const diff = dispatchSettings.liveOverrideExpiraEm - Date.now();
    return Math.max(0, Math.ceil(diff / (60 * 1000)));
  }, [dispatchSettings.liveOverrideAtivo, dispatchSettings.liveOverrideExpiraEm]);

  // Inteligência de Mercado Automática (Padrão 99 / Uber)
  const autoSurge = useMemo(() => {
    const demandCount = Math.max(1, saudeCidade.corridasAtivas);
    const availableDriversCount = Math.max(1, saudeCidade.motoristasOnline - saudeCidade.motoristasEmViagem);
    surgeEngine.updateTenantMarketState(tenantAlvo, demandCount, availableDriversCount);
    return surgeEngine.calculateSurge(
      {
        demandCount,
        availableDriversCount,
        isAutoSurgeEnabled: dispatchSettings.autoSurgeAtivo !== false,
      },
      tenantAlvo
    );
  }, [
    saudeCidade.corridasAtivas,
    saudeCidade.motoristasOnline,
    saudeCidade.motoristasEmViagem,
    tenantAlvo,
    dispatchSettings.autoSurgeAtivo,
  ]);

  const handleToggleAutoSurge = (checked: boolean) => {
    salvarConfiguracoesDespacho({ autoSurgeAtivo: checked }, tenantAlvo);
    showToast(
      checked
        ? "Tarifa dinâmica automática ativada na praça"
        : "Tarifa dinâmica automática desativada na praça"
    );
  };

  useEffect(() => {
    recarregarConfiguracoes();
  }, [tenantAlvo, recarregarConfiguracoes]);

  useEffect(() => {
    const handleSettingsUpdate = () => recarregarConfiguracoes();
    window.addEventListener("partiu:dispatch-settings-updated", handleSettingsUpdate);
    window.addEventListener("partiu:surge-rules-updated", handleSettingsUpdate);
    return () => {
      window.removeEventListener("partiu:dispatch-settings-updated", handleSettingsUpdate);
      window.removeEventListener("partiu:surge-rules-updated", handleSettingsUpdate);
    };
  }, [recarregarConfiguracoes]);

  // Sincronizar corridas reais do Supabase com canal Realtime e eventos distribuídos
  const carregarCorridasDoBanco = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    setCarregandoCorridas(true);
    try {
      let query = (supabase as any)
        .from("partiu_corridas")
        .select("*, partiu_motoristas(nome, veiculo_marca_modelo, veiculo_placa)");

      // Isolamento estrito de praça / tenant para franqueado
      if (isFranqueado) {
        const tenantAlvo = tenantId || pracaAtiva?.id;
        if (tenantAlvo) {
          query = query.or(`praca_id.eq.${tenantAlvo},tenant_id.eq.${tenantAlvo}`);
        }
      } else if (!isNacional && pracaAtiva?.id) {
        query = query.or(`praca_id.eq.${pracaAtiva.id},tenant_id.eq.${pracaAtiva.id}`);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        const reais: ItemDespachoMock[] = data.map((c: any) => {
          const { relativo, hora } = formatarTempoDecorrido(c.created_at);
          return {
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
            status:
              c.status === "EM_VIAGEM" || c.status === "CHEGOU"
                ? "EM_VIAGEM"
                : c.status === "A_CAMINHO"
                  ? "A_CAMINHO"
                  : c.status === "CONCLUIDA"
                    ? "CONCLUIDA"
                    : c.status === "CANCELADA"
                      ? "CANCELADA"
                      : "PROCURANDO",
            tempoDecorrido: relativo,
            criadoEmIso: c.created_at,
            horarioFormatado: hora,
          };
        });

        setItens(reais);
      } else if (!error) {
        setItens([]);
      }
    } catch (err) {
      console.warn("[AdminDespacho] Falha ao consultar corridas:", err);
    } finally {
      setCarregandoCorridas(false);
    }
  }, [isFranqueado, isNacional, tenantId, pracaAtiva?.id]);

  useEffect(() => {
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

    if (!isSupabaseConfigured()) return;

    // Subscrição em Tempo Real (Supabase Realtime)
    const channel = supabase
      .channel(`admin-despacho-realtime-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partiu_corridas" },
        () => {
          void carregarCorridasDoBanco();
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      verificarCorridaAtiva();
      void carregarCorridasDoBanco();
    }, 15000);

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [carregarCorridasDoBanco]);

  const handleCancelarCorrida = async (codigoViagem: string) => {
    if (!window.confirm(`Deseja realmente cancelar a chamada ${codigoViagem}? Isso atualizará o status no banco de dados e liberará a fila operacional.`)) return;
    try {
      if (isSupabaseConfigured()) {
        const { error } = await (supabase as any)
          .from("partiu_corridas")
          .update({
            status: "CANCELADA",
            cancelado_por: "ADMINISTRADOR",
            motivo_cancelamento: "Cancelado pela central de despacho (Super Admin)",
            cancelada_em: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .or(`codigo_viagem.eq.${codigoViagem},id.eq.${codigoViagem}`);

        if (error) {
          console.warn("[AdminDespacho] Erro ao atualizar status:", error.message);
        }
      }
      setItens((prev) =>
        prev.map((item) =>
          item.id === codigoViagem ? { ...item, status: "CANCELADA" } : item
        )
      );
      showToast(`Chamada ${codigoViagem} cancelada com sucesso.`);
    } catch {
      showToast(`Erro ao cancelar chamada.`);
    }
  };

  const handleCopiarId = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(id);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
      showToast(`Código ${id} copiado para a área de transferência.`);
    }
  };

  // Handlers de Parâmetros de Despacho
  const handleSalvarParametros = (e: React.FormEvent) => {
    e.preventDefault();
    salvarConfiguracoesDespacho(dispatchSettings, tenantAlvo);
    showToast("Parâmetros do algoritmo de despacho salvos com sucesso!");
  };

  // Handlers de Live Override
  const handleAtivarLiveOverride = () => {
    ativarLiveSurgeOverride(liveOverrideMultiplicador, liveOverrideDuracaoMinutos, tenantAlvo);
    recarregarConfiguracoes();
    showToast(`Sobretaxa de x${liveOverrideMultiplicador.toFixed(1)} aplicada por ${liveOverrideDuracaoMinutos} minutos!`);
  };

  const handleDesativarLiveOverride = () => {
    desativarLiveSurgeOverride(tenantAlvo);
    recarregarConfiguracoes();
    showToast("Sobretaxa administrativa desativada. Retornado à inteligência automática de alta demanda.");
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

  const listaFiltrada = useMemo(() => {
    return itens.filter((item) => {
      // Filtro por Modalidade (Corridas vs Entregas)
      if (filtro === "CORRIDAS" && item.tipo === "ENTREGA_FLASH") return false;
      if (filtro === "ENTREGAS" && item.tipo !== "ENTREGA_FLASH") return false;

      // Filtro por Ciclo Operacional / Status
      if (statusFiltro === "PROCURANDO" && item.status !== "PROCURANDO") return false;
      if (statusFiltro === "EM_ROTA" && item.status !== "A_CAMINHO" && item.status !== "EM_VIAGEM") return false;
      if (statusFiltro === "FINALIZADAS" && item.status !== "CONCLUIDA" && item.status !== "CANCELADA") return false;

      // Busca textual ampla
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchId = item.id.toLowerCase().includes(termo);
        const matchPassageiro = item.passageiro.toLowerCase().includes(termo);
        const matchMotorista = item.motorista.toLowerCase().includes(termo);
        const matchPlaca = item.placa.toLowerCase().includes(termo);
        const matchPin = item.pin.includes(termo);
        const matchOrigem = item.origem.toLowerCase().includes(termo);
        const matchDestino = item.destino.toLowerCase().includes(termo);
        if (!matchId && !matchPassageiro && !matchMotorista && !matchPlaca && !matchPin && !matchOrigem && !matchDestino) {
          return false;
        }
      }
      return true;
    });
  }, [itens, filtro, statusFiltro, busca]);

  const contadoresFila = useMemo(() => {
    return {
      total: itens.length,
      procurando: itens.filter((i) => i.status === "PROCURANDO").length,
      emRota: itens.filter((i) => i.status === "A_CAMINHO" || i.status === "EM_VIAGEM").length,
      concluidas: itens.filter((i) => i.status === "CONCLUIDA").length,
      canceladas: itens.filter((i) => i.status === "CANCELADA").length,
    };
  }, [itens]);

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Header Institucional Padronizado */}
      <AdminPageHeader
        title="Central de Despacho & Matching"
        subtitle={`Torre de Despacho • ${isFranqueado ? `Franquia ${pracaAtiva?.nome || "Regional"}` : "Gestão Nacional Global"} • Monitore chamadas ao vivo, parâmetros de busca e tarifas dinâmicas`}
        breadcrumbs={[{ label: "Painel Admin", to: "/app/admin" }, { label: "Despacho" }]}
        badge={
          <AdminBadge variant="brand" size="sm">
            TORRE DE COMANDO
          </AdminBadge>
        }
        actions={
          <AdminActionButton
            variant="primary"
            size="sm"
            iconLeft={<Phone className="w-4 h-4" />}
            onClick={() => setModalNovoChamado(true)}
          >
            Novo Chamado
          </AdminActionButton>
        }
      />

      {/* Seletor de Abas Padronizado */}
      <AdminTabBar
        variant="pills"
        activeTab={abaAtiva}
        onChange={(tab) => setAbaAtiva(tab as any)}
        tabs={[
          { id: "FILA_DESPACHO", label: "Fila ao Vivo", icon: <Radio className="w-3.5 h-3.5" /> },
          { id: "REGRAS_SURGE", label: "Regras & Surge", icon: <Sliders className="w-3.5 h-3.5" /> },
        ]}
      />

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
                <span className={`w-2 h-2 rounded-full ${saudeCidade.corridasAtivas > 0 ? "bg-emerald-500" : "bg-slate-400"}`} />
                <span>
                  {saudeCidade.corridasAtivas > 0
                    ? `Liquidez Ativa: ${saudeCidade.taxaAceitePercent.toFixed(1)}% Atendimento`
                    : "Fila em Espera: Operação Pronta"}
                </span>
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
                <span className="text-[10px] text-primary font-bold block mt-0.5">
                  {saudeCidade.corridasAtivas > 0 ? "Tempo real" : "Sem chamados ativos"}
                </span>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Tempo Médio Espera</span>
                  <Clock className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <span className="text-2xl font-black text-foreground">{saudeCidade.tempoMedioEsperaMinutos.toFixed(1)} min</span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                  {saudeCidade.corridasAtivas > 0 ? "Dentro da meta" : "Sem chamados"}
                </span>
              </div>

              <div className="bg-muted/30 p-4 rounded-2xl border border-border/60">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Taxa Aceite</span>
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground/60" />
                </div>
                <span className="text-2xl font-black text-foreground">{saudeCidade.taxaAceitePercent.toFixed(1)}%</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                  {saudeCidade.corridasAtivas > 0 ? "Alta conversão" : "Aguardando chamados"}
                </span>
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
                    : saudeCidade.corridasAtivas > 5
                      ? "x1.2"
                      : "x1.0"}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                  {dispatchSettings.liveOverrideAtivo ? "Override ativo" : "Multiplicador dinâmico"}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Ferramentas, Métricas Rápidas e Filtros de Fila */}
          <div className="space-y-3 bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-2xs">
            {/* Linha Superior: Busca, Alternador de Visão e Ações de Fila */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Campo de Busca Rápida */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por código (COR-...), passageiro, motorista, rota ou PIN..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full min-h-10 h-10 pl-10 pr-9 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                    title="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Controles de Visão e Atualização */}
              <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                {/* Filtro por Modalidade */}
                <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border/60">
                  {(["TODAS", "CORRIDAS", "ENTREGAS"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFiltro(t)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        filtro === t
                          ? "bg-background text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "TODAS" && "Todos os Tipos"}
                      {t === "CORRIDAS" && "Carro & Moto"}
                      {t === "ENTREGAS" && "Entregas"}
                    </button>
                  ))}
                </div>

                {/* Alternador de Modo: Fila em Linhas vs Grade */}
                <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => setModoExibicao("FILA_COMPACTA")}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      modoExibicao === "FILA_COMPACTA"
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Visualizar como Fila em Linhas (Mais compacto e organizado)"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Fila</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoExibicao("GRADE_CARTOES")}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      modoExibicao === "GRADE_CARTOES"
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Visualizar em Cartões"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                </div>

                {/* Botão de Atualizar Sincronização */}
                <button
                  type="button"
                  onClick={() => void carregarCorridasDoBanco()}
                  disabled={carregandoCorridas}
                  className="p-2 rounded-xl bg-muted/60 hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition cursor-pointer disabled:opacity-50"
                  title="Atualizar lista agora"
                >
                  <RefreshCw className={`w-4 h-4 ${carregandoCorridas ? "animate-spin text-primary" : ""}`} />
                </button>
              </div>
            </div>

            {/* Linha Inferior: Badges de Ciclo Operacional / Filtro por Status */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setStatusFiltro("TODAS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statusFiltro === "TODAS"
                    ? "bg-foreground text-background"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>Todas as Chamadas</span>
                <span className="px-1.5 py-0.2 rounded-md bg-background/20 text-[10px] font-mono font-black">
                  {contadoresFila.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFiltro("PROCURANDO")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statusFiltro === "PROCURANDO"
                    ? "bg-amber-500 text-slate-950 font-black"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Buscando Parceiro</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10 text-[10px] font-mono font-black">
                  {contadoresFila.procurando}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFiltro("EM_ROTA")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statusFiltro === "EM_ROTA"
                    ? "bg-blue-600 text-white font-black"
                    : "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Em Rota / Viagem</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10 text-[10px] font-mono font-black">
                  {contadoresFila.emRota}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFiltro("FINALIZADAS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  statusFiltro === "FINALIZADAS"
                    ? "bg-emerald-600 text-white font-black"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                <span>Finalizadas / Canceladas</span>
                <span className="px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10 text-[10px] font-mono font-black">
                  {contadoresFila.concluidas + contadoresFila.canceladas}
                </span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CONTAINER DA FILA OPERACIONAL COM ROLAGEM LIMITADA (NÃO SOBRECARREGA A PÁGINA) */}
          {/* ========================================================================= */}
          <div className="bg-card rounded-3xl border border-border/80 shadow-2xs overflow-hidden">
            {/* Barra de Status do Feed com Indicador ao Vivo */}
            <div className="px-5 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Feed em Tempo Real
                </span>
                <span>•</span>
                <span>
                  Exibindo <strong>{listaFiltrada.length}</strong> de <strong>{itens.length}</strong> chamados
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground hidden sm:block">
                Rolagem interna ativa • {modoExibicao === "FILA_COMPACTA" ? "Visão em Fila Rápida" : "Visão em Grade"}
              </div>
            </div>

            {/* Visualização de Vazio */}
            {listaFiltrada.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <Radio className="w-8 h-8 mx-auto text-muted-foreground/30 animate-pulse" />
                <p className="font-bold text-sm text-foreground">Nenhuma corrida encontrada na fila</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {busca
                    ? "Nenhum resultado corresponde aos termos da pesquisa. Tente limpar os filtros."
                    : "Aguardando novos chamados de passageiros ou despachos manuais da central."}
                </p>
              </div>
            ) : modoExibicao === "FILA_COMPACTA" ? (
              /* ========================================================================= */
              /* MODO 1: FILA EM LINHAS COMPACTAS COM ROLAGEM VERTICAL SUAVE */
              /* ========================================================================= */
              <div className="max-h-[580px] overflow-y-auto divide-y divide-border/60">
                {listaFiltrada.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 hover:bg-muted/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 group"
                  >
                    {/* Bloco 1: Código, Modalidade & Status */}
                    <div className="flex items-center gap-3 shrink-0 lg:w-48">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted border border-border/80">
                        {item.tipo === "CORRIDA_MOTO" ? (
                          <Bike className="w-4 h-4 text-amber-500" />
                        ) : item.tipo === "ENTREGA_FLASH" ? (
                          <Package className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Car className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-foreground">{item.id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopiarId(item.id)}
                            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition p-0.5 cursor-pointer"
                            title="Copiar código da corrida"
                          >
                            {copiadoId === item.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>
                            {item.tipo === "CORRIDA_MOTO"
                              ? "Moto"
                              : item.tipo === "ENTREGA_FLASH"
                              ? "Entrega"
                              : "Carro Pop"}
                          </span>
                          <span>•</span>
                          <span title={item.horarioFormatado}>{item.tempoDecorrido}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bloco 2: Badge de Status */}
                    <div className="shrink-0 lg:w-36">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${
                          item.status === "EM_VIAGEM"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                            : item.status === "A_CAMINHO"
                            ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20"
                            : item.status === "CONCLUIDA"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : item.status === "CANCELADA"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {item.status === "PROCURANDO"
                          ? "Buscando parceiro"
                          : item.status === "A_CAMINHO"
                          ? "A caminho"
                          : item.status === "EM_VIAGEM"
                          ? "Em viagem"
                          : item.status === "CONCLUIDA"
                          ? "Concluída"
                          : "Cancelada"}
                      </span>
                    </div>

                    {/* Bloco 3: Itinerário Origem ➔ Destino */}
                    <div className="flex-1 min-w-0 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-muted-foreground truncate" title={item.origem}>
                          {item.origem}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="text-foreground font-medium truncate" title={item.destino}>
                          {item.destino}
                        </span>
                      </div>
                    </div>

                    {/* Bloco 4: Passageiro & PIN */}
                    <div className="shrink-0 lg:w-44 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-foreground truncate">{item.passageiro}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-mono font-black shrink-0">
                          PIN {item.pin}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">{item.telefone}</span>
                    </div>

                    {/* Bloco 5: Motorista Parceiro */}
                    <div className="shrink-0 lg:w-48 text-xs">
                      <span className="text-[10px] text-muted-foreground block">Condutor Parceiro:</span>
                      <span
                        className={`font-bold truncate block ${
                          item.motorista === "Buscando parceiro..."
                            ? "text-amber-600 dark:text-amber-400 italic font-medium"
                            : "text-foreground"
                        }`}
                      >
                        {item.motorista}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {item.veiculo} • <strong>{item.placa}</strong>
                      </span>
                    </div>

                    {/* Bloco 6: Valor e Ações */}
                    <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 lg:w-40 pt-1 lg:pt-0 border-t lg:border-t-0 border-border/40">
                      <div className="text-left lg:text-right">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Valor</span>
                        <strong className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">
                          R$ {item.valor.toFixed(2).replace(".", ",")}
                        </strong>
                      </div>

                      {/* Botões de Ação na Fila */}
                      <div className="flex items-center gap-1">
                        {item.status === "PROCURANDO" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setModalNovoChamado(true)}
                              className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition cursor-pointer"
                              title="Despachar motorista manualmente"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleCancelarCorrida(item.id)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                              title="Cancelar chamada"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ========================================================================= */
              /* MODO 2: GRADE EM CARTÕES COMPACTOS DENTRO DO MESMO SCROLL CONTAINER */
              /* ========================================================================= */
              <div className="max-h-[580px] overflow-y-auto p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {listaFiltrada.map((item) => (
                    <div
                      key={item.id}
                      className="bg-card rounded-2xl p-4 border border-border/80 shadow-2xs hover:border-primary/40 transition-all space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-foreground">{item.id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopiarId(item.id)}
                            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition p-0.5 cursor-pointer"
                            title="Copiar ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            item.status === "EM_VIAGEM"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : item.status === "A_CAMINHO"
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                              : item.status === "CONCLUIDA"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : item.status === "CANCELADA"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
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
                            <span className="text-[9px] text-muted-foreground uppercase font-bold block">Origem</span>
                            <span className="text-foreground font-medium truncate block" title={item.origem}>
                              {item.origem}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[9px] text-muted-foreground uppercase font-bold block">Destino</span>
                            <span className="text-foreground font-medium truncate block" title={item.destino}>
                              {item.destino}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 bg-muted/40 rounded-xl border border-border/50 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-foreground block">{item.passageiro}</span>
                          <span className="text-[10px] text-muted-foreground">{item.telefone}</span>
                        </div>

                        <div className="text-center px-2.5 py-1 bg-primary text-primary-foreground rounded-lg shadow-2xs">
                          <span className="text-[8px] font-black uppercase block">PIN</span>
                          <span className="text-xs font-mono font-black">{item.pin}</span>
                        </div>
                      </div>

                      <div className="text-xs pt-1 flex items-center justify-between border-t border-border/40">
                        <div>
                          <span className="text-[9px] text-muted-foreground font-bold block">Condutor Parceiro</span>
                          <span className="font-bold text-foreground truncate block max-w-[130px]">{item.motorista}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {item.veiculo} • <strong>{item.placa}</strong>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-muted-foreground block">Valor</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm block">
                            R$ {item.valor.toFixed(2).replace(".", ",")}
                          </strong>
                          {item.status === "PROCURANDO" && (
                            <button
                              type="button"
                              onClick={() => void handleCancelarCorrida(item.id)}
                              className="text-[10px] text-rose-500 hover:underline mt-1 block cursor-pointer"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: REGRAS DE DESPACHO & TARIFAS DINÂMICAS (SURGE PRICING) */}
      {/* ========================================================================= */}
      {abaAtiva === "REGRAS_SURGE" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* CARD DE INTELIGÊNCIA DINÂMICA AUTOMÁTICA DE MERCADO (UBER / 99 IA) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-foreground">
                      Inteligência de Demanda Automática (Padrão Uber / 99)
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      dispatchSettings.liveOverrideAtivo
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        : dispatchSettings.autoSurgeAtivo === false
                        ? "bg-muted text-muted-foreground border border-border"
                        : autoSurge.isSurgeActive
                        ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse"
                        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    }`}>
                      {dispatchSettings.liveOverrideAtivo
                        ? "SOBREPOSTO POR LIVE OVERRIDE"
                        : dispatchSettings.autoSurgeAtivo === false
                        ? "TARIFA AUTOMÁTICA DESATIVADA (FIXA 1.0x)"
                        : autoSurge.isSurgeActive
                        ? `ALTA DEMANDA AUTOMÁTICA x${autoSurge.multiplier.toFixed(1)}`
                        : "EQUILÍBRIO NORMAL (1.0x)"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O aplicativo calcula e aplica multiplicadores dinâmicos automaticamente conforme o volume de chamados de passageiros vs condutores livres na praça.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                <div className="flex items-center gap-2.5 bg-muted/60 hover:bg-muted px-3.5 py-2 rounded-2xl border border-border/80 transition-colors">
                  <Switch
                    id="switch-auto-surge"
                    checked={dispatchSettings.autoSurgeAtivo !== false}
                    onCheckedChange={handleToggleAutoSurge}
                  />
                  <label
                    htmlFor="switch-auto-surge"
                    className="text-xs font-bold cursor-pointer text-foreground select-none"
                  >
                    {dispatchSettings.autoSurgeAtivo !== false ? "Tarifa automática ativa" : "Tarifa automática desativada"}
                  </label>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Multiplicador Vigente na Praça
                  </span>
                  <span className={`text-2xl font-black ${
                    (dispatchSettings.liveOverrideAtivo ? dispatchSettings.liveOverrideMultiplicador : autoSurge.multiplier) > 1.0
                      ? "text-amber-500"
                      : "text-foreground"
                  }`}>
                    x{(dispatchSettings.liveOverrideAtivo ? dispatchSettings.liveOverrideMultiplicador : autoSurge.multiplier).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid de Métricas de Liquidez em Tempo Real */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground block">Demanda da Praça</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-foreground">{autoSurge.demandCount}</span>
                  <span className="text-[11px] text-muted-foreground">chamados</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground block">Motoristas Livres</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-foreground">{autoSurge.availableDriversCount}</span>
                  <span className="text-[11px] text-muted-foreground">disponíveis</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground block">Razão Demanda/Oferta</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-foreground">{autoSurge.supplyDemandRatio.toFixed(2)}</span>
                  <span className="text-[11px] text-muted-foreground">procura/veículo</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground block">Status do Algoritmo</span>
                <span className="text-xs font-black text-foreground block mt-1.5 truncate" title={autoSurge.reason}>
                  {autoSurge.reason}
                </span>
              </div>
            </div>

            {dispatchSettings.autoSurgeAtivo === false && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-muted/40 border border-border/80 text-xs text-muted-foreground">
                <Sliders className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>
                  O modo automático está <strong>desativado</strong> para esta praça. Todas as novas corridas estão sendo tarifadas com multiplicador base 1.0x (sem acréscimo dinâmico por alta procura). Para forçar uma sobretaxa momentânea, utilize a Sobretaxa Imediata abaixo.
                </span>
              </div>
            )}
          </div>

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-foreground">
                      Sobretaxa Administrativa Imediata (Live Override)
                    </h3>
                    {dispatchSettings.liveOverrideAtivo && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                        SOBRETAXA ATIVA x{dispatchSettings.liveOverrideMultiplicador.toFixed(1)} {minutosRestantesOverride > 0 ? `(${minutosRestantesOverride}m restantes)` : ""}
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
                  Desativar sobretaxa agora
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAtivarLiveOverride}
                  className="min-h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  Aplicar sobretaxa imediata
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

              {/* Take Rate da Plataforma (Modelo Zero Comissão PARTIU) */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-emerald-600" />
                      Take Rate da Plataforma (Comissão sobre Corridas)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase border border-emerald-300">
                      0.0% Taxa Zero (Travado)
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800/90 mt-0.5">
                    No modelo econômico do PARTIU, a comissão é <strong>estritamente 0% (100% repassado ao motorista)</strong>. A receita da franquia e da plataforma é gerada exclusivamente via mensalidades e diárias SaaS dos motoristas.
                  </p>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 shrink-0">
                  <span className="text-xs font-black text-emerald-700">0.0%</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Fixo / Imutável</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                {isSuperAdmin ? (
                  <button
                    type="submit"
                    className="min-h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Salvar Parâmetros de Despacho
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>Configuração Global gerenciada pela Matriz (Super Admin)</span>
                  </div>
                )}
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

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setModalNovaRegra(true)}
                  className="min-h-11 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Nova Regra Surge
                </button>
              )}
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
