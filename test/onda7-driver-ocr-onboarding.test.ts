import { describe, test, expect, waitForAllTests } from "./test-harness.mjs";
import {
  extrairDadosCnh,
  executarCrossValidation,
  avaliarCnhOnboarding,
  calcularSimilaridadeNomes,
  analisarDataValidade,
  normalizarTexto,
} from "../src/lib/kyc/driver-ocr-engine";

describe("Onda 7 — Esteira de Homologação Cadastral Expressa com OCR de CNH", () => {
  test("TC-OCR-01: Extração estruturada e validação de CPF válido segundo algoritmo da Receita Federal", () => {
    // CPF válido de teste: 123.456.789-09
    const dados = extrairDadosCnh({
      nome: "Marcos Paulo Souza",
      cpf: "123.456.789-09",
      numeroRegistro: "04981726354",
      categoria: "B",
      dataValidade: "20/10/2029",
      temEar: true,
    });

    expect(dados.cpfValido).toBe(true);
    expect(dados.cpf).toBe("12345678909");
    expect(dados.cpfFormatado).toBe("123.456.789-09");
    expect(dados.status).toBe("APROVADO_AUTOMATICO");
    expect(dados.scoreConfiabilidade >= 90).toBe(true);
  });

  test("TC-OCR-02: Detecção de ausência de EAR rebaixa para status SEM_EAR com instrução de regularização", () => {
    const dados = extrairDadosCnh({
      nome: "Carlos Eduardo Silva",
      cpf: "123.456.789-09",
      numeroRegistro: "04981726354",
      categoria: "B",
      dataValidade: "15/05/2030",
      temEar: false, // Sem EAR
    });

    expect(dados.temEar).toBe(false);
    expect(dados.status).toBe("SEM_EAR");
    expect(dados.inconsistencias.some((i) => i.includes("EAR"))).toBe(true);
    expect(dados.sugestaoAcao.includes("EAR")).toBe(true);
  });

  test("TC-OCR-03: Detecção preventiva de CNH vencida com reprovação imediata CNH_EXPIRADA", () => {
    const dados = extrairDadosCnh({
      nome: "Roberto Carlos Almeida",
      cpf: "123.456.789-09",
      numeroRegistro: "04981726354",
      categoria: "B",
      dataValidade: "01/01/2020", // Data no passado
      temEar: true,
    });

    expect(dados.isValida).toBe(false);
    expect(dados.status).toBe("CNH_EXPIRADA");
    expect(dados.inconsistencias.some((i) => i.includes("expirada"))).toBe(true);
  });

  test("TC-OCR-04: Cross-validation com dados declarados idênticos autoriza aprovação expressa", () => {
    const avaliacao = avaliarCnhOnboarding(
      {
        nome: "JULIANA MENDES FERREIRA",
        cpf: "12345678909",
        numeroRegistro: "04981726354",
        categoria: "AB",
        dataValidade: "10/11/2028",
        temEar: true,
      },
      {
        nome: "Juliana Mendes Ferreira",
        cpf: "123.456.789-09",
      },
    );

    expect(avaliacao.crossValidation.cpfMatch).toBe(true);
    expect(avaliacao.crossValidation.nomeMatch).toBe(true);
    expect(avaliacao.crossValidation.podeAprovacaoExpressa).toBe(true);
    expect(avaliacao.crossValidation.scoreFinal >= 90).toBe(true);
    expect(avaliacao.crossValidation.alertas.length).toBe(0);
  });

  test("TC-OCR-05: Divergência de titularidade (CPF ou nome incompatível) bloqueia aprovação expressa", () => {
    const avaliacao = avaliarCnhOnboarding(
      {
        nome: "FERNANDO HENRIQUE LIMA",
        cpf: "12345678909",
        numeroRegistro: "04981726354",
        categoria: "B",
        dataValidade: "10/11/2028",
        temEar: true,
      },
      {
        nome: "Renata Souza Oliveira", // Nome totalmente divergente
        cpf: "11144477735", // CPF divergente
      },
    );

    expect(avaliacao.crossValidation.cpfMatch).toBe(false);
    expect(avaliacao.crossValidation.nomeMatch).toBe(false);
    expect(avaliacao.crossValidation.podeAprovacaoExpressa).toBe(false);
    expect(avaliacao.crossValidation.alertas.length > 0).toBe(true);
  });

  test("TC-OCR-06: Parsing de texto OCR bruto reconhece campos, categoria e presença de EAR", () => {
    const textoBrutoOcr = `
      REPUBLICA FEDERATIVA DO BRASIL
      MINISTERIO DA INFRAESTRUTURA
      DEPARTAMENTO NACIONAL DE TRANSITO
      CARTEIRA NACIONAL DE HABILITACAO
      NOME: RICARDO MENEZES DOS SANTOS
      DOC IDENTIDADE: 2459812 SSP/AL
      CPF: 123.456.789-09
      DATA NASCIMENTO: 14/04/1988
      REGISTRO: 04981726354
      VALIDADE: 28/08/2029
      CATEGORIA: AB
      OBSERVACOES: EXERCE ATIVIDADE REMUNERADA (EAR)
    `;

    const dados = extrairDadosCnh(textoBrutoOcr);
    expect(dados.cpfValido).toBe(true);
    expect(dados.cpf).toBe("12345678909");
    expect(dados.temEar).toBe(true);
    expect(dados.categoria).toBe("AB");
    expect(dados.isValida).toBe(true);
  });
});

if (process.argv[1] && process.argv[1].includes("onda7")) {
  void (async () => {
    await waitForAllTests();
    setTimeout(() => {
      process.exit(0);
    }, 100);
  })();
}
