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
  Send,
  ShieldCheck,
  Phone,
  MessageCircle,
} from "lucide-react";
import {
  carregarAgendamentos,
  listarAgendamentosDisponiveisMotorista,
  motoristaAceitarValor,
  motoristaEnviarContraproposta,
  type ScheduledRide,
} from "@/lib/ride/scheduled-ride-engine";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

interface ScheduledRidesDrawerProps {
  aberto: boolean;
  onFechar: () => void;
  motoristaId?: string;
  motoristaNome?: string;
  motoristaVeiculo?: string;
  motoristaPlaca?: string;
  motoristaTelefone?: string;
  motoristaFotoUrl?: string;
  motoristaAvaliacao?: number;
}

export function ScheduledRidesDrawer({
  aberto,
  onFechar,
  motoristaId = "driver_default",
  motoristaNome = "Motorista Parceiro",
  motoristaVeiculo = "Chevrolet Onix 2024",
  motoristaPlaca = "BRA2E19",
  motoristaTelefone = "(11) 98888-7777",
  motoristaFotoUrl = "",
  motoristaAvaliacao = 4.95,
}: ScheduledRidesDrawerProps) {
  const [agendamentos, setAgendamentos] = useState<ScheduledRide[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<"disponiveis" | "meus_agendamentos">("disponiveis");
  const [contrapropostaAbertaId, setContrapropostaAbertaId] = useState<string | null>(null);
  const [valorContraproposta, setValorContraproposta] = useState<string>("");
  const [justificativa, setJustificativa] = useState<string>("");
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const { corPrimaria } = useBrandTheme();

  const perfilMotorista = {
    id: motoristaId,
    nome: motoristaNome,
    veiculoModelo: motoristaVeiculo,
    veiculoPlaca: motoristaPlaca,
    telefone: motoristaTelefone,
    fotoUrl: motoristaFotoUrl,
    avaliacao: motoristaAvaliacao,
  };

  const recarregar = () => {
    const lista = listarAgendamentosDisponiveisMotorista(motoristaId);
    setAgendamentos(lista);
  };

  useEffect(() => {
    if (aberto) {
      recarregar();
    }
  }, [aberto, motoristaId]);

  if (!aberto) return null;

  const disponiveis = agendamentos.filter(
    (a) => a.status === "SOLICITADO" || (a.status === "EM_NEGOCIACAO" && a.motoristaAtribuido?.id !== motoristaId),
  );

  const meusAgendamentos = agendamentos.filter(
    (a) => a.motoristaAtribuido?.id === motoristaId,
  );

  const listaExibida = abaAtiva === "disponiveis" ? disponiveis : meusAgendamentos;

  const handleAceitarImediato = (ride: ScheduledRide) => {
    try {
      hapticFeedback.success();
      motoristaAceitarValor(ride.id, perfilMotorista);
      setMensagemSucesso(
        `Agendamento confirmado. A corrida para ${ride.horarioAgendado} está na sua agenda.`,
      );
      setErroAcao(null);
      recarregar();
      setAbaAtiva("meus_agendamentos");
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setErroAcao(err.message || "Erro ao aceitar corrida agendada");
    }
  };

  const handleEnviarContraproposta = (ride: ScheduledRide) => {
    const valor = parseFloat(valorContraproposta);
    if (!valor || Number.isNaN(valor)) {
      setErroAcao("Informe um valor válido para a contraproposta");
      return;
    }
    if (!justificativa.trim()) {
      setErroAcao("Informe uma justificativa (ex: horário noturno ou pedágio)");
      return;
    }

    try {
      hapticFeedback.light();
      motoristaEnviarContraproposta(ride.id, perfilMotorista, valor, justificativa);
      setMensagemSucesso("Contraproposta enviada ao passageiro. Aguardando aceite.");
      setErroAcao(null);
      setContrapropostaAbertaId(null);
      setValorContraproposta("");
      setJustificativa("");
      recarregar();
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err: any) {
      setErroAcao(err.message || "Erro ao enviar contraproposta");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-agendamentos-motorista"
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
              <h2 id="titulo-agendamentos-motorista" className="text-base font-extrabold text-slate-900 leading-tight">
                Mural de Agendamentos
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {disponiveis.length} disponíveis na sua região
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

        {/* ABAS */}
        <div className="px-5 pt-3 flex gap-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setAbaAtiva("disponiveis")}
            className={`pb-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
              abaAtiva === "disponiveis"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Disponíveis ({disponiveis.length})
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("meus_agendamentos")}
            className={`pb-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
              abaAtiva === "meus_agendamentos"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Meus Compromissos ({meusAgendamentos.length})
          </button>
        </div>

        {/* LISTAGEM DE CORRIDAS DISPONÍVEIS OU AGENDADAS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-slate-100">
          {listaExibida.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CalendarClock className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhuma corrida encontrada</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {abaAtiva === "disponiveis"
                  ? "Não há solicitações de agendamento abertas no momento. Assim que um passageiro solicitar, aparecerá aqui."
                  : "Você ainda não possui corridas agendadas na sua agenda."}
              </p>
            </div>
          ) : (
            listaExibida.map((ride) => {
              const dataFormatada = ride.dataAgendada.split("-").reverse().join("/");
              const isMinha = ride.motoristaAtribuido?.id === motoristaId;
              const emContraproposta = contrapropostaAbertaId === ride.id;

              return (
                <div key={ride.id} className="pt-3.5 first:pt-0 space-y-3">
                  {/* CABEÇALHO */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-extrabold text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      {dataFormatada} às {ride.horarioAgendado}
                    </span>

                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {ride.categoriaVeiculo} • ~{ride.distanciaKm} km
                    </span>
                  </div>

                  {/* ROTAS */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 mt-1 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase font-bold text-slate-600">Embarque</p>
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

                  {/* OBSERVAÇÃO DO PASSAGEIRO */}
                  {ride.observacoes && (
                    <div className="p-2.5 rounded-xl bg-slate-100/70 text-slate-700 text-xs italic">
                      "{ride.observacoes}"
                    </div>
                  )}

                  {/* VALOR E REMUNERAÇÃO PURE SAAS */}
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-900 uppercase">
                        {isMinha ? "Seu Ganho Líquido (100%)" : "Lance Inicial do Passageiro"}
                      </p>
                      <p className="text-base font-black text-emerald-950">
                        R$ {(ride.valorFinalAcordado || ride.valorPropostoPassageiro).toFixed(2)}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                      0% taxa da plataforma
                    </span>
                  </div>

                  {/* AÇÕES PARA MOTORISTA SE DISPONÍVEL */}
                  {!isMinha && (
                    <div className="space-y-2 pt-1">
                      {!emContraproposta ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAceitarImediato(ride)}
                            className="flex-1 min-h-[46px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" /> Aceitar por R$ {ride.valorPropostoPassageiro.toFixed(2)}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              hapticFeedback.light();
                              setContrapropostaAbertaId(ride.id);
                              setValorContraproposta((ride.valorPropostoPassageiro + 5).toFixed(2));
                              setJustificativa("Horário noturno com cobrança de retorno");
                            }}
                            className="min-h-[46px] py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer border border-slate-200/80"
                          >
                            Contraproposta
                          </button>
                        </div>
                      ) : (
                        /* FORMULÁRIO INLINE DE CONTRAPROPOSTA */
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-amber-950">
                              Enviar Contraproposta ao Passageiro
                            </span>
                            <button
                              type="button"
                              onClick={() => setContrapropostaAbertaId(null)}
                              className="text-amber-800 hover:text-amber-950 text-xs font-bold"
                            >
                              Cancelar
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                                Novo Valor (R$)
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                value={valorContraproposta}
                                onChange={(e) => setValorContraproposta(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-900 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-amber-900 block mb-0.5">
                                Justificativa
                              </label>
                              <input
                                type="text"
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                                placeholder="Ex: Pedágio incluso"
                                className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-xs text-slate-900 outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleEnviarContraproposta(ride)}
                            className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" /> Enviar Proposta para o Passageiro
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DETALHES SE JÁ FOR MEU AGENDAMENTO */}
                  {isMinha && (
                    <div className="p-2.5 rounded-xl bg-slate-100/90 text-xs text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Compromisso Confirmado</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Lembretes ativos (24h, 2h, 30m)
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* RODAPÉ */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">100% dos ganhos para você</span>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition active:scale-95 cursor-pointer shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
