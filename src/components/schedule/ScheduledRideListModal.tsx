import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  Clock,
  MapPin,
  Car,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Star,
  Check,
  Ban,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  carregarAgendamentos,
  listarAgendamentosPassageiro,
  passageiroAceitarContraproposta,
  passageiroRecusarContraproposta,
  cancelarAgendamento,
  type ScheduledRide,
} from "@/lib/ride/scheduled-ride-engine";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

interface ScheduledRideListModalProps {
  aberto: boolean;
  onFechar: () => void;
  passageiroId?: string;
  onAtualizar?: () => void;
}

export function ScheduledRideListModal({
  aberto,
  onFechar,
  passageiroId = "passenger_default",
  onAtualizar,
}: ScheduledRideListModalProps) {
  const [agendamentos, setAgendamentos] = useState<ScheduledRide[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<"ativas" | "historico">("ativas");
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const { corPrimaria } = useBrandTheme();

  const recarregar = () => {
    const lista = listarAgendamentosPassageiro(passageiroId);
    setAgendamentos(lista);
    onAtualizar?.();
  };

  useEffect(() => {
    if (aberto) {
      recarregar();
    }
  }, [aberto, passageiroId]);

  if (!aberto) return null;

  const ativas = agendamentos.filter(
    (a) => a.status === "SOLICITADO" || a.status === "EM_NEGOCIACAO" || a.status === "AGENDADO",
  );
  const historico = agendamentos.filter(
    (a) => a.status === "CANCELADO" || a.status === "CONCLUIDO" || a.status === "INICIADO",
  );

  const listaExibida = abaAtiva === "ativas" ? ativas : historico;

  const handleAceitarContraproposta = (rideId: string) => {
    try {
      hapticFeedback.success();
      passageiroAceitarContraproposta(rideId);
      setMensagemSucesso("Contraproposta aceita! Sua corrida está agendada e confirmada");
      setErroAcao(null);
      recarregar();
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setErroAcao(err.message || "Erro ao aceitar contraproposta");
    }
  };

  const handleRecusarContraproposta = (rideId: string) => {
    try {
      hapticFeedback.warning();
      passageiroRecusarContraproposta(rideId);
      setMensagemSucesso("Contraproposta recusada. Seu pedido segue aberto para outros motoristas");
      setErroAcao(null);
      recarregar();
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setErroAcao(err.message || "Erro ao recusar contraproposta");
    }
  };

  const handleCancelar = (rideId: string) => {
    if (!window.confirm("Deseja realmente cancelar este agendamento?")) return;
    try {
      hapticFeedback.medium();
      cancelarAgendamento(rideId, "PASSAGEIRO", "Cancelado pelo passageiro no aplicativo");
      setMensagemSucesso("Agendamento cancelado com sucesso");
      setErroAcao(null);
      recarregar();
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setErroAcao(err.message || "Erro ao cancelar agendamento");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-meus-agendamentos"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col max-h-[90dvh] overflow-hidden">
        {/* CABEÇALHO */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${corPrimaria || "#FF6B00"}15`, color: corPrimaria || "#FF6B00" }}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
            >
              <CalendarClock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="titulo-meus-agendamentos" className="text-base font-extrabold text-slate-900 leading-tight">
                Minhas Corridas Agendadas
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {ativas.length} {ativas.length === 1 ? "compromisso ativo" : "compromissos ativos"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-95 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FEEDBACK DE SUCESSO OU ERRO */}
        {mensagemSucesso && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
        )}
        {erroAcao && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{erroAcao}</span>
          </div>
        )}

        {/* ABAS (ATIVAS / HISTÓRICO) */}
        <div className="px-5 pt-3 flex gap-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setAbaAtiva("ativas")}
            className={`pb-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
              abaAtiva === "ativas"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Ativas ({ativas.length})
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("historico")}
            className={`pb-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
              abaAtiva === "historico"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Histórico ({historico.length})
          </button>
        </div>

        {/* LISTAGEM DE AGENDAMENTOS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-slate-100">
          {listaExibida.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CalendarClock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhum agendamento encontrado</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {abaAtiva === "ativas"
                  ? "Você não possui agendamentos ativos no momento. Solicite um agendamento na aba principal."
                  : "Seu histórico de agendamentos está vazio."}
              </p>
            </div>
          ) : (
            listaExibida.map((ride) => {
              const dataFormatada = ride.dataAgendada.split("-").reverse().join("/");
              const temContraproposta =
                ride.status === "EM_NEGOCIACAO" && ride.contrapropostaMotorista;

              return (
                <div key={ride.id} className="pt-3.5 first:pt-0 space-y-3">
                  {/* CABEÇALHO DO CARD */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-extrabold text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        {dataFormatada} às {ride.horarioAgendado}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {ride.categoriaVeiculo}
                      </span>
                    </div>

                    {/* STATUS BADGE */}
                    {ride.status === "AGENDADO" && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmado
                      </span>
                    )}
                    {ride.status === "EM_NEGOCIACAO" && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 animate-pulse">
                        <AlertCircle className="w-3 h-3 text-amber-700" /> Contraproposta
                      </span>
                    )}
                    {ride.status === "SOLICITADO" && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                        Aguardando Motorista
                      </span>
                    )}
                    {ride.status === "CANCELADO" && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px]">
                        Cancelado
                      </span>
                    )}
                  </div>

                  {/* ENDEREÇOS */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 mt-1 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase font-bold text-slate-600">Origem</p>
                        <p className="font-semibold text-slate-800 truncate">{ride.origem.endereco}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-orange-100 mt-1 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase font-bold text-slate-600">Destino</p>
                        <p className="font-semibold text-slate-800 truncate">{ride.destino.endereco}</p>
                      </div>
                    </div>
                  </div>

                  {/* MOTORISTA ATRIBUÍDO */}
                  {ride.motoristaAtribuido && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {ride.motoristaAtribuido.fotoUrl ? (
                            <img
                              src={ride.motoristaAtribuido.fotoUrl}
                              alt={ride.motoristaAtribuido.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {ride.motoristaAtribuido.nome}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {ride.motoristaAtribuido.veiculoModelo || "Veículo cadastrado"} •{" "}
                            {ride.motoristaAtribuido.veiculoPlaca || "Placa confirmada"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{ride.motoristaAtribuido.avaliacao || "4.9"}</span>
                      </div>
                    </div>
                  )}

                  {/* BLOCO DE NEGOCIAÇÃO BILATERAL */}
                  {temContraproposta && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" /> Proposta do motorista
                        </span>
                        <span className="text-xs font-extrabold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-md">
                          R$ {ride.contrapropostaMotorista?.valor.toFixed(2)}
                        </span>
                      </div>

                      <p className="text-xs text-amber-900/90 italic bg-white/70 p-2.5 rounded-xl border border-amber-100">
                        "{ride.contrapropostaMotorista?.justificativa}"
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-amber-950/80 font-medium pt-0.5">
                        <span>Sua oferta inicial: R$ {ride.valorPropostoPassageiro.toFixed(2)}</span>
                        <span>Diferença: + R$ {((ride.contrapropostaMotorista?.valor || 0) - ride.valorPropostoPassageiro).toFixed(2)}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAceitarContraproposta(ride.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Aceitar Novo Valor
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRecusarContraproposta(ride.id)}
                          className="py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" /> Recusar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RODAPÉ DO CARD: VALORES E AÇÕES */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">
                        {ride.status === "AGENDADO" ? "Valor acordado" : "Sua oferta"}
                      </p>
                      <p className="text-sm font-black text-slate-900">
                        R$ {(ride.valorFinalAcordado || ride.valorPropostoPassageiro).toFixed(2)}
                      </p>
                    </div>

                    {ride.status !== "CANCELADO" && ride.status !== "CONCLUIDO" && (
                      <button
                        type="button"
                        onClick={() => handleCancelar(ride.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline p-1 cursor-pointer"
                      >
                        Cancelar agendamento
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RODAPÉ FIXO */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Agendamento protegido com 0% de comissão</span>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition active:scale-95 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
