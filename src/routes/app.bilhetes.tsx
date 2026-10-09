import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Car,
  Clock,
  Package,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Calendar,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Share2,
  HelpCircle,
  Send,
  Check,
  Phone,
} from "lucide-react";
import { rideService, type UserActivityItem } from "@/services/RideService";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

export const Route = createFileRoute("/app/bilhetes")({
  head: () => ({
    meta: [
      { title: "Atividade — Suas Viagens & Entregas | PARTIU" },
      {
        name: "description",
        content:
          "Consulte seu histórico de viagens urbanas, corridas de moto e entregas expressas com duplo PIN no PARTIU.",
      },
    ],
  }),
  component: AtividadePage,
});

export function AtividadePage() {
  const navigate = useNavigate();
  const { corPrimaria, corTextoPrimaria, nomeApp } = useBrandTheme();

  const [abaAtiva, setAbaAtiva] = useState<"todas" | "corridas" | "entregas">("todas");
  const [historico, setHistorico] = useState<UserActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recarregando, setRecarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [viagemDetalhe, setViagemDetalhe] = useState<UserActivityItem | null>(null);

  async function carregarHistorico() {
    setErro(null);
    try {
      const dados = await rideService.getUserActivityHistory();
      setHistorico(dados);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      setErro("Não foi possível carregar o histórico de atividades no momento.");
    } finally {
      setLoading(false);
      setRecarregando(false);
    }
  }

  useEffect(() => {
    carregarHistorico();
  }, []);

  function handleRecarregar() {
    setRecarregando(true);
    carregarHistorico();
  }

  // Ações de Suporte e Recibo
  const [modalObjetoAberto, setModalObjetoAberto] = useState(false);
  const [descricaoObjeto, setDescricaoObjeto] = useState("");
  const [telefoneObjeto, setTelefoneObjeto] = useState(() => {
    return (typeof window !== "undefined" ? localStorage.getItem("partiu_user_phone") : "") || "";
  });
  const [enviandoObjeto, setEnviandoObjeto] = useState(false);

  function handleCompartilharRecibo(item: UserActivityItem) {
    hapticFeedback.light();
    const texto = [
      `🧾 *COMPROVANTE OFICIAL DE VIAGEM — ${nomeApp || "PARTIU"}*`,
      `📅 Data: ${item.data}`,
      `🚗 Categoria: ${item.categoria}`,
      `💰 Valor: R$ ${item.valor.toFixed(2).replace(".", ",")}`,
      `📍 Embarque: ${item.origem}`,
      `🏁 Desembarque: ${item.destino}`,
      `👤 Motorista: ${item.motorista}`,
      `🚘 Veículo: ${item.veiculo}`,
      item.pinSeguranca ? `🔑 PIN: ${item.pinSeguranca}` : "",
      `🛡️ Status: Auditado & Confirmado`,
    ].filter(Boolean).join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `Recibo de Viagem ${nomeApp || "PARTIU"}`,
        text: texto,
      }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      alert("Comprovante copiado para a área de transferência!");
    }
  }

  function handleEnviarChamadoObjeto() {
    if (!descricaoObjeto.trim()) {
      alert("Por favor, descreva o objeto esquecido.");
      return;
    }
    setEnviandoObjeto(true);
    hapticFeedback.medium();

    try {
      const tickets = JSON.parse(localStorage.getItem("partiu_lost_items_tickets") || "[]");
      const novoTicket = {
        id: `ticket_${Date.now()}`,
        viagemId: viagemDetalhe?.id,
        motorista: viagemDetalhe?.motorista,
        dataViagem: viagemDetalhe?.data,
        descricao: descricaoObjeto,
        telefone: telefoneObjeto,
        status: "ABERTO",
        criadoEm: new Date().toISOString(),
      };
      localStorage.setItem("partiu_lost_items_tickets", JSON.stringify([novoTicket, ...tickets]));

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("partiu:lost_item_reported", { detail: novoTicket })
        );
      }

      alert("Chamado aberto com sucesso! O condutor e nossa central foram notificados. Caso o objeto seja localizado, o retorno será agendado diretamente com você.");
      setModalObjetoAberto(false);
      setDescricaoObjeto("");
    } catch {
      alert("Erro ao registrar chamado. Tente novamente.");
    } finally {
      setEnviandoObjeto(false);
    }
  }

  const listaFiltrada = historico.filter((item) => {
    if (abaAtiva === "corridas") return item.tipo === "corrida";
    if (abaAtiva === "entregas") return item.tipo === "entrega";
    return true;
  });

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground pb-16">
      {/* 1. CABEÇALHO */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md px-3.5 sm:px-4 pt-[max(0.6rem,calc(env(safe-area-inset-top,0px)+6px))] pb-2.5 min-h-[52px] border-b border-border flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Link
            to="/app"
            className="flex min-h-[36px] min-w-[36px] h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground/80 hover:bg-muted/80 active:scale-95 transition-all cursor-pointer border border-border"
            aria-label="Voltar para a página inicial"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              Uso Diário
            </span>
            <h1 className="text-sm font-bold text-foreground">Minhas viagens &amp; entregas</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRecarregar}
          disabled={recarregando}
          className="rounded-lg bg-muted text-foreground/80 hover:bg-muted/80 active:scale-95 transition-all cursor-pointer border border-border min-h-[34px] min-w-[34px] h-8.5 w-8.5 flex items-center justify-center"
          title="Atualizar Histórico"
          aria-label="Atualizar histórico"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${recarregando ? "animate-spin text-brand-primary-vibrant" : ""}`} />
        </button>
      </header>

      {/* 2. ABAS DE FILTRO */}
      <div className="bg-card border-b border-border px-3.5 sm:px-4 py-1.5 sticky top-[50px] z-20 shadow-2xs">
        <div className="flex gap-1.5 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setAbaAtiva("todas")}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[34px] h-8.5 ${
              abaAtiva === "todas"
                ? "bg-brand-primary-deep text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todas ({historico.length})
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("corridas")}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[34px] h-8.5 ${
              abaAtiva === "corridas"
                ? "bg-brand-primary-deep text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            Corridas
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("entregas")}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[34px] h-8.5 ${
              abaAtiva === "entregas"
                ? "bg-brand-primary-deep text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            Entregas
          </button>
        </div>
      </div>

      {/* 3. LISTA DE ATIVIDADES OU EMPTY STATE */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground text-xs space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-brand-primary-vibrant" />
            <p>Carregando suas viagens...</p>
          </div>
        ) : erro ? (
          <div className="py-14 text-center bg-card rounded-3xl border border-destructive/20 p-8 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Falha ao carregar histórico</h3>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
                {erro} Verifique sua conexão com a internet e tente novamente.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRecarregar}
              disabled={recarregando}
              style={
                corPrimaria
                  ? { backgroundColor: corPrimaria, color: corTextoPrimaria || "#FFFFFF" }
                  : undefined
              }
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer min-h-[44px] ${
                !corPrimaria ? "bg-brand-primary-vibrant text-white" : ""
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${recarregando ? "animate-spin" : ""}`} />
              <span>{recarregando ? "Tentando novamente..." : "Tentar novamente"}</span>
            </button>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="py-16 text-center bg-card rounded-3xl border border-border p-8 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              {abaAtiva === "entregas" ? (
                <Package className="h-7 w-7 text-muted-foreground" />
              ) : abaAtiva === "corridas" ? (
                <Car className="h-7 w-7 text-muted-foreground" />
              ) : (
                <Clock className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-base font-bold text-foreground">
              {abaAtiva === "entregas"
                ? "Nenhuma entrega realizada"
                : abaAtiva === "corridas"
                ? "Nenhuma corrida realizada"
                : "Nenhuma atividade encontrada"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
              {abaAtiva === "entregas"
                ? "Envie encomendas ou pacotes com segurança de duplo PIN para entrega expressa na cidade."
                : abaAtiva === "corridas"
                ? "Suas viagens de carro ou moto solicitadas pelo aplicativo aparecerão listadas aqui."
                : "Quando você solicitar uma corrida de carro ou moto, ou enviar um pacote, o histórico completo aparecerá aqui."}
            </p>
            <Link
              to="/app"
              style={
                corPrimaria
                  ? { backgroundColor: corPrimaria, color: corTextoPrimaria || "#FFFFFF" }
                  : undefined
              }
              className="inline-flex items-center justify-center mt-5 px-6 py-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-brand-primary-vibrant text-slate-950 hover:brightness-105 min-h-[44px]"
            >
              {abaAtiva === "entregas" ? "Enviar encomenda" : "Pedir corrida"}
            </Link>
          </div>
        ) : (
          listaFiltrada.map((item) => (
            <div
              key={item.id}
              onClick={() => setViagemDetalhe(item)}
              className="bg-card rounded-2xl border border-border p-4 shadow-xs hover:border-brand-primary-vibrant/40 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      item.tipo === "entrega"
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {item.tipo === "entrega" ? (
                      <Package className="h-5 w-5" />
                    ) : (
                      <Car className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{item.categoria}</h3>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {item.data}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-foreground">
                    R$ {item.valor.toFixed(2).replace(".", ",")}
                  </span>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    {item.status === "concluida" ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Concluída
                      </span>
                    ) : item.status === "em_andamento" ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> Em andamento
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-destructive flex items-center gap-0.5">
                        <XCircle className="h-3 w-3" /> Cancelada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ROTA */}
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/60 mt-1.5 shrink-0" />
                  <p className="text-muted-foreground line-clamp-1 flex-1 font-medium">{item.origem}</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-primary-vibrant mt-1.5 shrink-0" />
                  <p className="text-foreground font-bold line-clamp-1 flex-1">{item.destino}</p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Motorista: <strong className="text-foreground font-semibold">{item.motorista}</strong></span>
                <span className="text-brand-primary-vibrant flex items-center gap-0.5 font-bold">
                  Ver recibo <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </main>

      {/* 4. MODAL DE DETALHES DO RECIBO */}
      {viagemDetalhe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recibo Oficial PARTIU
                </span>
                <h3 className="text-base font-bold text-foreground">{viagemDetalhe.categoria}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViagemDetalhe(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Fechar recibo"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                <div className="flex justify-between items-center text-sm font-bold text-foreground">
                  <span>Valor total</span>
                  <span className="text-base font-black text-brand-primary-vibrant">
                    R$ {viagemDetalhe.valor.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Data: {viagemDetalhe.data}
                </div>
              </div>

              {viagemDetalhe.pinSeguranca && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <KeyRound className="h-4 w-4 text-brand-primary-vibrant" />
                    <span>PIN de Validação:</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-brand-primary-vibrant tracking-wider">
                    {viagemDetalhe.pinSeguranca}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Embarque</span>
                  <p className="text-foreground font-medium">{viagemDetalhe.origem}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Desembarque</span>
                  <p className="text-foreground font-bold">{viagemDetalhe.destino}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-muted-foreground">
                <div>
                  <p className="font-bold text-foreground">{viagemDetalhe.motorista}</p>
                  <p className="text-[11px] text-muted-foreground">{viagemDetalhe.veiculo}</p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  <ShieldCheck className="h-4 w-4" />
                  Auditado
                </div>
              </div>

              {/* AÇÕES DO RECIBO: COMPARTILHAR & SUPORTE */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={() => handleCompartilharRecibo(viagemDetalhe)}
                  className="w-full py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-brand-primary-vibrant" />
                  <span>Compartilhar Comprovante</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalObjetoAberto(true)}
                  className="w-full py-2 text-muted-foreground hover:text-amber-600 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Esqueci um objeto nesta viagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViagemDetalhe(null)}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 active:scale-95 transition-all cursor-pointer min-h-[44px]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPORTAR OBJETO ESQUECIDO */}
      {modalObjetoAberto && viagemDetalhe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card text-foreground rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Objeto Esquecido</h3>
                  <p className="text-[10px] text-muted-foreground">Viagem com {viagemDetalhe.motorista}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalObjetoAberto(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed font-medium">
              <strong>Como funciona a devolução:</strong> O motorista parceiro será notificado para checar o veículo. Caso o item seja localizado, você combinará a devolução e pagará diretamente a ele o valor do deslocamento de entrega.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">
                  Qual objeto foi esquecido?
                </label>
                <input
                  type="text"
                  value={descricaoObjeto}
                  onChange={(e) => setDescricaoObjeto(e.target.value)}
                  placeholder="Ex: Carteira preta, celular no banco traseiro..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">
                  Telefone de contato para devolução
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-3" />
                  <input
                    type="tel"
                    value={telefoneObjeto}
                    onChange={(e) => setTelefoneObjeto(e.target.value)}
                    placeholder="(22) 99999-9999"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={enviandoObjeto || !descricaoObjeto.trim()}
                onClick={handleEnviarChamadoObjeto}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{enviandoObjeto ? "Enviando..." : "Enviar Chamado ao Motorista"}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalObjetoAberto(false)}
                className="w-full py-2 text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer text-center"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
