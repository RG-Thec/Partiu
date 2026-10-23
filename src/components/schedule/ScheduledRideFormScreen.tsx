import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  MapPin,
  Calendar,
  Clock,
  Car,
  Bike,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Bell,
  User,
  ArrowRight,
  Plus,
  Minus,
  HelpCircle,
} from "lucide-react";
import { ModeTabSelector } from "@/components/navigation/ModeTabSelector";
import { ScheduledRideListModal } from "./ScheduledRideListModal";
import {
  calcularPisoMinimo,
  validarAntecedenciaMinima,
  solicitarAgendamento,
  listarAgendamentosPassageiro,
  type CategoriaAgendamento,
} from "@/lib/ride/scheduled-ride-engine";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";

interface ScheduledRideFormScreenProps {
  userName?: string;
  userAvatarUrl?: string;
  onOpenNotifications?: () => void;
  pushActive?: boolean;
}

export function ScheduledRideFormScreen({
  userName = "Passageiro",
  userAvatarUrl = "",
  onOpenNotifications,
  pushActive = false,
}: ScheduledRideFormScreenProps) {
  const navigate = useNavigate();
  const {
    corPrimaria,
    corSecundaria,
    corTextoPrimaria,
    corCabecalhoInicio,
    corCabecalhoFim,
    nomeApp,
  } = useBrandTheme();

  const primeiroNome = (userName || "").trim().split(/\s+/)[0] || "Passageiro";
  const appName = nomeApp || "Partiu";

  // Estados do formulário
  const [origem, setOrigem] = useState("Meu Local Atual");
  const [destino, setDestino] = useState("Aeroporto Internacional");
  const [distanciaKm, setDistanciaKm] = useState(12.4);
  const [duracaoMin, setDuracaoMin] = useState(25);
  const [categoria, setCategoria] = useState<CategoriaAgendamento>("CARRO");
  const [observacoes, setObservacoes] = useState("");

  // Cálculo da data e horário padrão (amanhã às 08:00)
  const [dataAgendada, setDataAgendada] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [horarioAgendado, setHorarioAgendado] = useState("08:00");

  // Métricas de tarifa e piso mínimo operacional anti-dumping
  const metricas = useMemo(() => {
    return calcularPisoMinimo(distanciaKm, categoria);
  }, [distanciaKm, categoria]);

  // Valor proposto pelo passageiro (inicia na tarifa sugerida)
  const [valorProposto, setValorProposto] = useState<number>(() => metricas.tarifaSugerida);

  // Sincroniza valor proposto quando categoria ou rota mudar significativamente
  useEffect(() => {
    setValorProposto((prev) => {
      if (prev < metricas.pisoMinimo) return metricas.pisoMinimo;
      return metricas.tarifaSugerida;
    });
  }, [metricas.tarifaSugerida, metricas.pisoMinimo]);

  // Modal de listagem de agendamentos do passageiro
  const [modalListaAberto, setModalListaAberto] = useState(false);
  const [totalAgendamentosAtivos, setTotalAgendamentosAtivos] = useState(0);

  // Estados de submissão
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [sucessoCriacao, setSucessoCriacao] = useState<boolean>(false);

  const atualizarContador = () => {
    const lista = listarAgendamentosPassageiro();
    const ativas = lista.filter(
      (a) => a.status === "SOLICITADO" || a.status === "EM_NEGOCIACAO" || a.status === "AGENDADO",
    );
    setTotalAgendamentosAtivos(ativas.length);
  };

  useEffect(() => {
    atualizarContador();
    const handleAtualizacao = () => atualizarContador();
    window.addEventListener("partiu:agendamento-atualizado", handleAtualizacao);
    return () => {
      window.removeEventListener("partiu:agendamento-atualizado", handleAtualizacao);
    };
  }, []);

  // Atalhos rápidos de data e horário
  const aplicarAtalhoHorario = (diasAdicionais: number, hora: string) => {
    hapticFeedback.light();
    const d = new Date();
    d.setDate(d.getDate() + diasAdicionais);
    setDataAgendada(d.toISOString().split("T")[0]);
    setHorarioAgendado(hora);
    setErroValidacao(null);
  };

  const ajustarValor = (delta: number) => {
    hapticFeedback.light();
    setValorProposto((prev) => {
      const novo = Math.round((prev + delta) * 100) / 100;
      if (novo < metricas.pisoMinimo) {
        return metricas.pisoMinimo;
      }
      return novo;
    });
    setErroValidacao(null);
  };

  // Submissão do agendamento
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao(null);

    // Validação de antecedência
    const checagemTempo = validarAntecedenciaMinima(dataAgendada, horarioAgendado, 30);
    if (!checagemTempo.valido) {
      hapticFeedback.error();
      setErroValidacao(checagemTempo.mensagem || "Horário inválido");
      return;
    }

    // Validação de piso mínimo
    if (valorProposto < metricas.pisoMinimo) {
      hapticFeedback.error();
      setErroValidacao(
        `O valor não pode ser menor que o piso mínimo operacional de R$ ${metricas.pisoMinimo.toFixed(2)}`,
      );
      return;
    }

    try {
      hapticFeedback.success();
      solicitarAgendamento({
        origem: { endereco: origem },
        destino: { endereco: destino },
        dataAgendada,
        horarioAgendado,
        categoriaVeiculo: categoria,
        distanciaKm,
        duracaoMin,
        valorProposto,
        observacoes,
      });

      setSucessoCriacao(true);
      atualizarContador();

      // Rola suavemente para o topo e abre modal de listagem após breve delay
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        setSucessoCriacao(false);
        setModalListaAberto(true);
      }, 1500);
    } catch (err: any) {
      hapticFeedback.error();
      setErroValidacao(err.message || "Erro ao agendar corrida");
    }
  };

  const hojeStr = new Date().toISOString().split("T")[0];

  return (
    <div className="w-full flex flex-col font-sans bg-slate-50 text-slate-900 select-none pb-28">
      {/* 1. HEADER TOPO COM GRADIENTE CONSISTENTE */}
      <header
        style={{
          background: `linear-gradient(135deg, ${corCabecalhoInicio || corPrimaria || "#FF6B00"} 0%, ${corCabecalhoFim || corSecundaria || corPrimaria || "#FFB800"} 100%)`,
          color: corTextoPrimaria || "#FFFFFF",
        }}
        className="pt-2.5 pb-2.5 px-4 relative z-10 flex items-center justify-between shadow-sm transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-full overflow-hidden border border-white/80 shadow-2xs bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            {userAvatarUrl ? (
              <img src={userAvatarUrl} alt={primeiroNome} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4.5 h-4.5 text-white/90" />
            )}
          </div>
          <span className="text-sm sm:text-base font-extrabold tracking-tight leading-tight">
            Olá, {primeiroNome}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Meus Agendamentos com Badge Ativo */}
          <button
            type="button"
            onClick={() => {
              hapticFeedback.light();
              setModalListaAberto(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            aria-label="Ver minhas corridas agendadas"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Meus Agendamentos</span>
            {totalAgendamentosAtivos > 0 && (
              <span className="w-4.5 h-4.5 rounded-full bg-white text-slate-900 text-[10px] font-black flex items-center justify-center ml-0.5">
                {totalAgendamentosAtivos}
              </span>
            )}
          </button>

          {/* Notificações */}
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notificações"
            className="relative p-1.5 text-inherit hover:bg-black/10 active:scale-95 rounded-full transition cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 stroke-[1.8]" />
            {pushActive && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
            )}
          </button>
        </div>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <div className="flex-1 px-4 sm:px-6 pt-4 space-y-4 max-w-xl mx-auto w-full">
        {/* TÍTULO E SUBTÍTULO */}
        <div className="text-center space-y-1">
          <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-700">
            COMPROMISSO PONTUAL
          </p>
          <div className="flex items-center justify-center gap-2">
            <div
              style={{
                background: `linear-gradient(135deg, ${corPrimaria || "#FF6B00"} 0%, ${corSecundaria || corPrimaria || "#FFB800"} 100%)`,
                color: corTextoPrimaria || "#FFFFFF",
              }}
              className="w-6 h-6 rounded-md flex items-center justify-center font-black text-xs shadow-2xs"
            >
              ➔
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {appName} Agendar
            </h1>
          </div>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Reserve sua viagem com antecedência, faça sua proposta e combine direto com o motorista parceiro com 0% de taxas.
          </p>
        </div>

        {/* SELETOR DE MODALIDADE GLOBAL (CORRIDA / ENTREGA / AGENDAR) */}
        <div className="flex items-center justify-center pt-0.5 pb-1">
          <ModeTabSelector className="shadow-xs" />
        </div>

        {/* FEEDBACK DE SUCESSO */}
        {sucessoCriacao && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-extrabold text-sm">Agendamento registrado com sucesso!</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Os motoristas parceiros próximos receberam sua proposta. Abrindo seus agendamentos...
              </p>
            </div>
          </div>
        )}

        {/* FEEDBACK DE ERRO */}
        {erroValidacao && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{erroValidacao}</span>
          </div>
        )}

        {/* FORMULÁRIO PRINCIPAL */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CARD 1: ORIGEM E DESTINO */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-700" />
              <span>Trajeto Planejado</span>
            </h2>

            <div className="space-y-2.5">
              {/* Origem */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Local de Partida
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-slate-400 focus-within:bg-white transition">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" />
                  <input
                    type="text"
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value)}
                    placeholder="Endereço de partida..."
                    className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Destino */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Local de Chegada
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-slate-400 focus-within:bg-white transition">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-100 shrink-0" />
                  <input
                    type="text"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Para onde você vai?"
                    className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Estimativa de rota */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600 font-semibold px-1">
                <span>Distância estimada: ~{distanciaKm} km</span>
                <span>Tempo de rota: ~{duracaoMin} min</span>
              </div>
            </div>
          </div>

          {/* CARD 2: DATA E HORÁRIO DO EMBARQUE */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-700" />
              <span>Data e Horário</span>
            </h2>

            {/* Atalhos Rápidos */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => aplicarAtalhoHorario(1, "08:00")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition active:scale-95 cursor-pointer"
              >
                <p className="text-[10px] font-bold text-slate-500 uppercase">Amanhã</p>
                <p className="text-xs font-extrabold text-slate-900">08:00 (Manhã)</p>
              </button>
              <button
                type="button"
                onClick={() => aplicarAtalhoHorario(1, "14:00")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition active:scale-95 cursor-pointer"
              >
                <p className="text-[10px] font-bold text-slate-500 uppercase">Amanhã</p>
                <p className="text-xs font-extrabold text-slate-900">14:00 (Tarde)</p>
              </button>
              <button
                type="button"
                onClick={() => aplicarAtalhoHorario(1, "20:00")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition active:scale-95 cursor-pointer"
              >
                <p className="text-[10px] font-bold text-slate-500 uppercase">Amanhã</p>
                <p className="text-xs font-extrabold text-slate-900">20:00 (Noite)</p>
              </button>
            </div>

            {/* Inputs Nativos de Data e Hora */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Data</label>
                <input
                  type="date"
                  min={hojeStr}
                  value={dataAgendada}
                  onChange={(e) => setDataAgendada(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white outline-none cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Horário</label>
                <input
                  type="time"
                  value={horarioAgendado}
                  onChange={(e) => setHorarioAgendado(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white outline-none cursor-pointer"
                  required
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Antecedência mínima de 30 minutos para aceite do motorista</span>
            </p>
          </div>

          {/* CARD 3: ESCOLHA DA CATEGORIA */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-slate-700" />
              <span>Categoria de Veículo</span>
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {/* CARRO */}
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light();
                  setCategoria("CARRO");
                }}
                className={`p-3 rounded-2xl border text-center transition active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  categoria === "CARRO"
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Car className="w-5 h-5 stroke-[2.2]" />
                <span className="text-xs font-extrabold">Carro POP</span>
                <span className="text-[10px] opacity-80">Ideal no dia a dia</span>
              </button>

              {/* MOTO */}
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light();
                  setCategoria("MOTO");
                }}
                className={`p-3 rounded-2xl border text-center transition active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  categoria === "MOTO"
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Bike className="w-5 h-5 stroke-[2.2]" />
                <span className="text-xs font-extrabold">Partiu Moto</span>
                <span className="text-[10px] opacity-80">Rápido e solo</span>
              </button>

              {/* PREMIUM */}
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light();
                  setCategoria("PREMIUM");
                }}
                className={`p-3 rounded-2xl border text-center transition active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  categoria === "PREMIUM"
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="w-5 h-5 stroke-[2.2]" />
                <span className="text-xs font-extrabold">Conforto</span>
                <span className="text-[10px] opacity-80">Veículos premium</span>
              </button>
            </div>
          </div>

          {/* CARD 4: PROPOSTA DE VALOR & ANTI-LEILÃO PREDATÓRIO (CAMINHO a) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Oferta e Negociação Bilateral</span>
              </h2>

              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[10px]">
                0% taxa plataforma
              </span>
            </div>

            {/* Comparativo Sugerido vs Piso Mínimo */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">Tarifa Sugerida</p>
                <p className="text-sm font-extrabold text-slate-800">
                  R$ {metricas.tarifaSugerida.toFixed(2)}
                </p>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">Piso Mínimo Protegido</p>
                <p className="text-sm font-extrabold text-amber-700">
                  R$ {metricas.pisoMinimo.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Controle de Ajuste de Valor do Passageiro */}
            <div className="pt-1 space-y-2">
              <label className="text-xs font-extrabold text-slate-800 block text-center">
                Sua Proposta para a Corrida
              </label>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => ajustarValor(-2)}
                  disabled={valorProposto <= metricas.pisoMinimo}
                  className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-800 transition cursor-pointer"
                  aria-label="Diminuir valor"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="px-5 py-2 rounded-2xl bg-slate-100/80 border border-slate-200 text-center min-w-[140px]">
                  <span className="text-2xl font-black text-slate-950 tracking-tight">
                    R$ {valorProposto.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => ajustarValor(2)}
                  className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center font-bold text-slate-800 transition cursor-pointer"
                  aria-label="Aumentar valor"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Botões Rápidos */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback.light();
                    setValorProposto(metricas.tarifaSugerida);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition cursor-pointer"
                >
                  Tarifa Sugerida (R$ {metricas.tarifaSugerida.toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback.light();
                    setValorProposto(metricas.pisoMinimo);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-800 transition cursor-pointer"
                >
                  Piso Mínimo (R$ {metricas.pisoMinimo.toFixed(2)})
                </button>
              </div>

              {/* Explicação da Garantia Anti-Predatória */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Proteção Pure SaaS e Sustentabilidade</span>
                </div>
                <p className="leading-relaxed text-emerald-900/90">
                  O valor mínimo protege o custo real da rota. O motorista pode aceitar imediatamente ou propor um ajuste antes do horário marcado. 100% do valor vai para o motorista parceiro.
                </p>
              </div>
            </div>
          </div>

          {/* CARD 5: OBSERVAÇÕES OPCIONAIS */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/90 space-y-2">
            <label className="text-[11px] font-bold text-slate-600 block">
              Observações ou Detalhes para o Motorista (Opcional)
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Viagem com 2 malas grandes para o aeroporto"
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white outline-none"
            />
          </div>

          {/* BOTÃO PRINCIPAL DE ENVIO */}
          <button
            type="submit"
            style={{
              backgroundColor: corPrimaria || "#FF6B00",
              color: corTextoPrimaria || "#FFFFFF",
              boxShadow: `0 4px 18px ${(corPrimaria || "#FF6B00")}40`,
            }}
            className="w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition cursor-pointer"
          >
            <CalendarClock className="w-4 h-4" />
            <span>Confirmar Solicitação de Agendamento</span>
          </button>
        </form>
      </div>

      {/* MODAL DE LISTAGEM DOS AGENDAMENTOS */}
      <ScheduledRideListModal
        aberto={modalListaAberto}
        onFechar={() => setModalListaAberto(false)}
        onAtualizar={atualizarContador}
      />
    </div>
  );
}
