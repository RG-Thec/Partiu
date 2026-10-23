import { describe, test, expect } from "./test-harness.mjs";
import {
  calcularPisoMinimo,
  validarAntecedenciaMinima,
  formatarDataLocal,
  formatarHoraLocal,
  solicitarAgendamento,
  motoristaAceitarValor,
  motoristaEnviarContraproposta,
  passageiroAceitarContraproposta,
  passageiroRecusarContraproposta,
  cancelarAgendamento,
  listarAgendamentosPassageiro,
  listarAgendamentosDisponiveisMotorista,
  checarLembretesAgendamento,
  type MotoristaAgendado,
} from "../src/lib/ride/scheduled-ride-engine";

describe("28. Scheduled Rides Bilateral Engine & Anti-Predatory Protection", () => {
  const motoristaExemplo: MotoristaAgendado = {
    id: "drv_12345",
    nome: "Carlos Eduardo Silva",
    veiculoModelo: "Chevrolet Onix Plus 2024",
    veiculoPlaca: "RIO2A18",
    avaliacao: 4.96,
    telefone: "(21) 98765-4321",
  };

  test("Piso Operacional: Calcula tarifa sugerida e piso protetivo para todas as categorias", () => {
    const carro = calcularPisoMinimo(10, "CARRO");
    expect(carro.tarifaSugerida > 0).toBe(true);
    expect(carro.pisoMinimo > 0).toBe(true);
    expect(carro.pisoMinimo < carro.tarifaSugerida).toBe(true);
    expect(carro.pisoMinimo >= carro.tarifaSugerida * 0.8).toBe(true);

    const moto = calcularPisoMinimo(10, "MOTO");
    expect(moto.tarifaSugerida < carro.tarifaSugerida).toBe(true);
    expect(moto.pisoMinimo > 0).toBe(true);

    const premium = calcularPisoMinimo(10, "PREMIUM");
    expect(premium.tarifaSugerida > carro.tarifaSugerida).toBe(true);
  });

  test("Antecedência Temporal: Rejeita agendamentos com menos de 30 minutos de antecedência", () => {
    const agora = new Date();
    // Horário de 10 minutos no futuro no horário local
    const dezMinFuturo = new Date(agora.getTime() + 10 * 60 * 1000);
    const dataStr = formatarDataLocal(dezMinFuturo);
    const horaStr = formatarHoraLocal(dezMinFuturo);

    const validacao10m = validarAntecedenciaMinima(dataStr, horaStr, 30);
    expect(validacao10m.valido).toBe(false);
    expect(validacao10m.mensagem?.includes("30 minutos")).toBe(true);

    // Horário de amanhã às 15:00 (antecedência ampla)
    const amanha = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
    const dataAmanhaStr = formatarDataLocal(amanha);
    const validacaoAmanha = validarAntecedenciaMinima(dataAmanhaStr, "15:00", 30);
    expect(validacaoAmanha.valido).toBe(true);
  });

  test("Proteção Anti-Leilão: Rejeita proposta de passageiro abaixo do piso operacional", () => {
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dataAmanhaStr = formatarDataLocal(amanha);

    let erroLancado = false;
    try {
      solicitarAgendamento({
        passageiroId: "user_test_1",
        origem: { endereco: "Rua das Flores, 100" },
        destino: { endereco: "Aeroporto Santos Dumont" },
        dataAgendada: dataAmanhaStr,
        horarioAgendado: "10:00",
        categoriaVeiculo: "CARRO",
        distanciaKm: 15,
        duracaoMin: 30,
        valorProposto: 10.0, // Valor predatório muito abaixo do piso operacional
      });
    } catch (err: any) {
      erroLancado = true;
      expect(/abaixo do piso mínimo/i.test(err.message)).toBe(true);
    }
    expect(erroLancado).toBe(true);
  });

  test("Fluxo de Sucesso 1: Passageiro solicita agendamento respeitando piso e motorista aceita de imediato", () => {
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dataAmanhaStr = formatarDataLocal(amanha);
    const metricas = calcularPisoMinimo(8, "CARRO");

    const corrida = solicitarAgendamento({
      passageiroId: "user_ana_clara",
      passageiroNome: "Ana Clara",
      origem: { endereco: "Av. Paulista, 1000" },
      destino: { endereco: "Shopping Morumbi" },
      dataAgendada: dataAmanhaStr,
      horarioAgendado: "09:30",
      categoriaVeiculo: "CARRO",
      distanciaKm: 8,
      duracaoMin: 22,
      valorProposto: metricas.tarifaSugerida,
      observacoes: "Viagem com pasta executiva",
    });

    expect(corrida.status).toBe("SOLICITADO");
    expect(corrida.valorPropostoPassageiro).toBe(metricas.tarifaSugerida);

    // Motorista aceita pelo valor proposto
    const confirmada = motoristaAceitarValor(corrida.id, motoristaExemplo);

    expect(confirmada.status).toBe("AGENDADO");
    expect(confirmada.valorFinalAcordado).toBe(metricas.tarifaSugerida);
    expect(confirmada.motoristaAtribuido?.id).toBe(motoristaExemplo.id);
  });

  test("Fluxo de Sucesso 2: Motorista envia contraproposta justificada e passageiro aceita", () => {
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dataAmanhaStr = formatarDataLocal(amanha);
    const metricas = calcularPisoMinimo(25, "CARRO");

    const corrida = solicitarAgendamento({
      passageiroId: "user_roberto",
      passageiroNome: "Roberto Santos",
      origem: { endereco: "Centro Histórico" },
      destino: { endereco: "Zona Rural Norte" },
      dataAgendada: dataAmanhaStr,
      horarioAgendado: "22:00",
      categoriaVeiculo: "CARRO",
      distanciaKm: 25,
      duracaoMin: 45,
      valorProposto: metricas.pisoMinimo,
    });

    expect(corrida.status).toBe("SOLICITADO");

    // Motorista envia contraproposta (ex: + R$ 15 por retorno vazio e horário noturno)
    const valorContraproposta = metricas.pisoMinimo + 15;
    const emNegociacao = motoristaEnviarContraproposta(
      corrida.id,
      motoristaExemplo,
      valorContraproposta,
      "Retorno vazio em estrada não pavimentada após às 22h",
    );

    expect(emNegociacao.status).toBe("EM_NEGOCIACAO");
    expect(emNegociacao.contrapropostaMotorista?.valor).toBe(valorContraproposta);
    expect(emNegociacao.contrapropostaMotorista?.status).toBe("PENDENTE");

    // Passageiro avalia e aceita
    const acordada = passageiroAceitarContraproposta(corrida.id);
    expect(acordada.status).toBe("AGENDADO");
    expect(acordada.valorFinalAcordado).toBe(valorContraproposta);
    expect(acordada.contrapropostaMotorista?.status).toBe("ACEITA");
  });

  test("Fluxo de Recusa: Passageiro recusa contraproposta e corrida volta a ficar disponível", () => {
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dataAmanhaStr = formatarDataLocal(amanha);
    const metricas = calcularPisoMinimo(12, "CARRO");

    const corrida = solicitarAgendamento({
      passageiroId: "user_marcos",
      passageiroNome: "Marcos Lima",
      origem: { endereco: "Barra da Tijuca" },
      destino: { endereco: "Copacabana" },
      dataAgendada: dataAmanhaStr,
      horarioAgendado: "14:00",
      categoriaVeiculo: "CARRO",
      distanciaKm: 12,
      duracaoMin: 30,
      valorProposto: metricas.tarifaSugerida,
    });

    motoristaEnviarContraproposta(
      corrida.id,
      motoristaExemplo,
      metricas.tarifaSugerida + 20,
      "Pedágio de linha amarela",
    );

    // Passageiro recusa
    const liberada = passageiroRecusarContraproposta(corrida.id);
    expect(liberada.status).toBe("SOLICITADO");
    expect(liberada.motoristaAtribuido).toBe(undefined);
    expect(liberada.contrapropostaMotorista).toBe(undefined);
  });

  test("Cancelamento: Passageiro pode cancelar agendamento", () => {
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dataAmanhaStr = formatarDataLocal(amanha);
    const metricas = calcularPisoMinimo(5, "CARRO");

    const corrida = solicitarAgendamento({
      passageiroId: "user_cancel_test",
      origem: { endereco: "Rua A" },
      destino: { endereco: "Rua B" },
      dataAgendada: dataAmanhaStr,
      horarioAgendado: "16:00",
      distanciaKm: 5,
      valorProposto: metricas.tarifaSugerida,
    });

    const cancelada = cancelarAgendamento(corrida.id, "PASSAGEIRO", "Compromisso adiado");
    expect(cancelada.status).toBe("CANCELADO");
    expect(cancelada.observacoes?.includes("Compromisso adiado")).toBe(true);
  });

  test("Régua de Lembretes: Dispara avisos de 24h, 2h e 30m nos prazos corretos", () => {
    const agora = Date.now();
    // Cria corrida agendada para daqui a exatas 2 horas (100 minutos)
    const em2Horas = new Date(agora + 100 * 60 * 1000);
    const dataStr = formatarDataLocal(em2Horas);
    const horaStr = formatarHoraLocal(em2Horas);

    const metricas = calcularPisoMinimo(6, "CARRO");
    const corrida = solicitarAgendamento({
      passageiroId: "user_lembrete",
      origem: { endereco: "Rua 1" },
      destino: { endereco: "Rua 2" },
      dataAgendada: dataStr,
      horarioAgendado: horaStr,
      distanciaKm: 6,
      valorProposto: metricas.tarifaSugerida,
    });

    motoristaAceitarValor(corrida.id, motoristaExemplo);

    // Executa checagem de lembretes
    const resultado = checarLembretesAgendamento(agora);
    expect(resultado.lembretesEnviados >= 1).toBe(true);
    const notificacao2h = resultado.notificacoes.find((n) => n.rideId === corrida.id && n.tipo === "2h");
    expect(Boolean(notificacao2h)).toBe(true);
    expect(notificacao2h?.mensagem.includes("2 horas")).toBe(true);
  });
});
