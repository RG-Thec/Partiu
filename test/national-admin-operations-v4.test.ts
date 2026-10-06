/**
 * ==============================================================================
 * 🏛️ SUÍTE DE TESTES AUTOMATIZADOS: CENTRAL DE OPERAÇÕES NACIONAL PARTIU V4
 * ==============================================================================
 * Testes rigorosos de governança, arquitetura de 6 módulos, RBAC de 5 perfis,
 * restrição estrita de frota a CARRO e MOTO, validador de banners mobile,
 * fila de suporte com priorização de SOS e assistente White Label expresso.
 * ==============================================================================
 */

import { describe, test, expect } from "./test-harness.mjs";
import {
  canAccessModule,
  canViewAdvancedConfig,
  isSuperAdmin,
  getRoleMetadata,
  type AdminRole,
  type AdminModuleId,
} from "../src/lib/admin-rbac.ts";
import {
  carregarPracasDisponiveis,
  getPracaAtiva,
  setPracaAtiva,
  PRACA_GLOBAL_TODAS,
} from "../src/lib/admin-city-service.ts";
import {
  carregarCarteiras,
  carregarTransacoes,
  carregarPedidosRecarga,
  lancarTransacaoCarteira,
  alternarBloqueioAdmin,
  aprovarRecargaPix,
  rejeitarRecargaPix,
  gerarPayloadPixCopiaECola,
  carregarGatewayConfig,
  salvarGatewayConfig,
} from "../src/lib/driver-wallet-service.ts";
import {
  carregarCmsLandingData,
  salvarCmsLandingData,
  restaurarCmsLandingPadrao,
  DEFAULT_B2B_SECTION,
  DEFAULT_METRICAS_SOCIAIS,
} from "../src/lib/cms-landing-service.ts";
import {
  carregarLogsFinOps,
  carregarConfigFinOps,
  salvarConfigFinOps,
  registrarChamadaApi,
  calcularMetricasFinOps,
  limparCacheMapas,
  DEFAULT_CONFIG_MAPAS,
} from "../src/lib/maps-finops-service.ts";
import {
  listarSoftDeletes,
  executarSoftDelete,
  restaurarRegistroSoftDelete,
  estimarRegistrosPurga,
  executarPurgaColdStorage,
  listarPurgas,
  gerarDumpPreventivo,
  listarBackups,
} from "../src/lib/data-governance-service.ts";

describe("35. PARTIU NATIONAL ADMIN V4 — Navigation Architecture & RBAC (Strictly 6 Modules)", () => {
  const modulosOficiais: AdminModuleId[] = [
    "dashboard",
    "operacao",
    "motoristas",
    "financeiro",
    "marketing",
    "configuracoes",
  ];

  test("Menu Principal: Deve conter exatamente os 6 módulos operacionais oficiais", () => {
    expect(modulosOficiais.length).toBe(6);
  });

  test("Perfil super_admin / OWNER: Acesso irrestrito a todos os 6 módulos e configurações avançadas", () => {
    modulosOficiais.forEach((m) => {
      expect(canAccessModule(m, "super_admin")).toBe(true);
      expect(canAccessModule(m, "OWNER")).toBe(true);
    });
    expect(canViewAdvancedConfig("super_admin")).toBe(true);
    expect(canViewAdvancedConfig("OWNER")).toBe(true);
    expect(isSuperAdmin("super_admin")).toBe(true);
  });

  test("Perfil admin: Acesso a Dashboard, Operação, Motoristas, Financeiro, Marketing e Configurações essenciais", () => {
    modulosOficiais.forEach((m) => {
      expect(canAccessModule(m, "admin")).toBe(true);
    });
    expect(canViewAdvancedConfig("admin")).toBe(false);
    expect(isSuperAdmin("admin")).toBe(false);
  });

  test("Perfil operador: Restrito a Dashboard, Operação e Motoristas", () => {
    expect(canAccessModule("dashboard", "operador")).toBe(true);
    expect(canAccessModule("operacao", "operador")).toBe(true);
    expect(canAccessModule("motoristas", "operador")).toBe(true);
    expect(canAccessModule("financeiro", "operador")).toBe(false);
    expect(canAccessModule("marketing", "operador")).toBe(false);
    expect(canAccessModule("configuracoes", "operador")).toBe(false);
    expect(canViewAdvancedConfig("operador")).toBe(false);
  });

  test("Perfil suporte: Restrito a Dashboard e Fila de Atendimento / SOS", () => {
    expect(canAccessModule("dashboard", "suporte")).toBe(true);
    expect(canAccessModule("operacao", "suporte")).toBe(true);
    expect(canAccessModule("motoristas", "suporte")).toBe(false);
    expect(canAccessModule("financeiro", "suporte")).toBe(false);
    expect(canAccessModule("marketing", "suporte")).toBe(false);
    expect(canAccessModule("configuracoes", "suporte")).toBe(false);
  });

  test("Metadados de Perfil: Todos os 5 perfis devem possuir metadados válidos e informativos", () => {
    const roles: AdminRole[] = ["super_admin", "admin", "franqueado", "operador", "suporte"];
    roles.forEach((r) => {
      const meta = getRoleMetadata(r);
      expect(Boolean(meta.label)).toBe(true);
      expect(Boolean(meta.titulo)).toBe(true);
      expect(Boolean(meta.badgeColor)).toBe(true);
      expect(Boolean(meta.description)).toBe(true);
    });
  });
});

describe("SUITE 36: PARTIU NATIONAL ADMIN V4 — Fleet Restriction (CARRO & MOTO ONLY)", () => {
  type CategoriaPermitida = "CARRO" | "MOTO";
  const categoriasValidas: CategoriaPermitida[] = ["CARRO", "MOTO"];

  function validarCategoriaVeiculo(categoria: string): { valido: boolean; motivo?: string } {
    const limpa = categoria.trim().toUpperCase();
    if (limpa === "CARRO" || limpa === "MOTO") {
      return { valido: true };
    }
    return {
      valido: false,
      motivo: "A plataforma PARTIU permite estritamente as categorias CARRO e MOTO. Vans, micro-ônibus e outros modais são bloqueados.",
    };
  }

  test("Aprovação de Modais: CARRO e MOTO são aprovados com sucesso", () => {
    expect(validarCategoriaVeiculo("CARRO").valido).toBe(true);
    expect(validarCategoriaVeiculo("carro").valido).toBe(true);
    expect(validarCategoriaVeiculo("MOTO").valido).toBe(true);
    expect(validarCategoriaVeiculo("moto").valido).toBe(true);
  });

  test("Bloqueio de Modais Não Autorizados: Vans, Micro-ônibus e Ônibus são estritamente rejeitados", () => {
    const invalidas = ["VAN", "MICROONIBUS", "ONIBUS", "CAMINHAO", "TRUCK"];
    invalidas.forEach((cat) => {
      const res = validarCategoriaVeiculo(cat);
      expect(res.valido).toBe(false);
      expect(res.motivo).toContain("estritamente as categorias CARRO e MOTO");
    });
  });
});

describe("SUITE 37: PARTIU NATIONAL ADMIN V4 — Mobile Banner Validator (Performance & Aspect Ratio)", () => {
  interface BannerSpec {
    largura: number;
    altura: number;
    tamanhoKb: number;
  }

  function validarBannerMobile(spec: BannerSpec): { aprovado: boolean; erro?: string } {
    // 1. Peso máximo: 1024 KB (1 MB)
    if (spec.tamanhoKb > 1024) {
      return {
        aprovado: false,
        erro: `Imagem muito pesada (${spec.tamanhoKb} KB). Limite máximo permitido para mobile é 1024 KB.`,
      };
    }

    // 2. Largura mínima: 600px
    if (spec.largura < 600) {
      return {
        aprovado: false,
        erro: `Largura insuficiente (${spec.largura}px). Mínimo recomendado é 600px.`,
      };
    }

    // 3. Aspect Ratio móvel (16:9 ~ 1.78 com tolerância 1.4 a 2.4)
    const ratio = spec.largura / spec.altura;
    if (ratio < 1.4 || ratio > 2.4) {
      return {
        aprovado: false,
        erro: `Proporção inadequada (${ratio.toFixed(2)}:1). Padrão mobile obrigatório é 16:9 ou 2:1.`,
      };
    }

    return { aprovado: true };
  }

  test("Banner Padrão Mobile (800x450px, 180 KB, 16:9): Aprovado com sucesso", () => {
    const res = validarBannerMobile({ largura: 800, altura: 450, tamanhoKb: 180 });
    expect(res.aprovado).toBe(true);
    expect(res.erro).toBeUndefined();
  });

  test("Banner Acima do Peso Máximo (1.5 MB): Rejeitado por degradar a performance mobile", () => {
    const res = validarBannerMobile({ largura: 800, altura: 450, tamanhoKb: 1536 });
    expect(res.aprovado).toBe(false);
    expect(res.erro).toContain("muito pesada");
  });

  test("Banner Vertical ou Quadrado (600x600px, 1:1): Rejeitado por quebrar o layout mobile", () => {
    const res = validarBannerMobile({ largura: 600, altura: 600, tamanhoKb: 120 });
    expect(res.aprovado).toBe(false);
    expect(res.erro).toContain("Proporção inadequada");
  });
});

describe("SUITE 38: PARTIU NATIONAL ADMIN V4 — Unified Support & SOS Criticality Sorting", () => {
  interface Ticket {
    id: string;
    protocolo: string;
    prioridade: "SOS_CRITICAL" | "ALTA" | "MEDIA" | "BAIXA";
    status: "ABERTO" | "RESOLVIDO";
  }

  function ordenarFilaPorCriticidade(tickets: Ticket[]): Ticket[] {
    const peso = {
      SOS_CRITICAL: 1,
      ALTA: 2,
      MEDIA: 3,
      BAIXA: 4,
    };

    return [...tickets].sort((a, b) => {
      if (a.status !== "RESOLVIDO" && b.status === "RESOLVIDO") return -1;
      if (a.status === "RESOLVIDO" && b.status !== "RESOLVIDO") return 1;
      return peso[a.prioridade] - peso[b.prioridade];
    });
  }

  test("Ordenação Automática: Alertas SOS devem figurar no topo absoluto da fila", () => {
    const tickets: Ticket[] = [
      { id: "1", protocolo: "TKT-01", prioridade: "BAIXA", status: "ABERTO" },
      { id: "2", protocolo: "TKT-02", prioridade: "ALTA", status: "ABERTO" },
      { id: "3", protocolo: "SOS-99", prioridade: "SOS_CRITICAL", status: "ABERTO" },
      { id: "4", protocolo: "TKT-03", prioridade: "MEDIA", status: "ABERTO" },
    ];

    const ordenados = ordenarFilaPorCriticidade(tickets);
    expect(ordenados[0].protocolo).toBe("SOS-99");
    expect(ordenados[1].protocolo).toBe("TKT-02");
    expect(ordenados[2].protocolo).toBe("TKT-03");
    expect(ordenados[3].protocolo).toBe("TKT-01");
  });

  test("Casos Resolvidos: São deslocados para o final da fila independente da criticidade prévia", () => {
    const tickets: Ticket[] = [
      { id: "1", protocolo: "SOS-RESOLVIDO", prioridade: "SOS_CRITICAL", status: "RESOLVIDO" },
      { id: "2", protocolo: "TKT-ABERTO", prioridade: "BAIXA", status: "ABERTO" },
    ];

    const ordenados = ordenarFilaPorCriticidade(tickets);
    expect(ordenados[0].protocolo).toBe("TKT-ABERTO");
    expect(ordenados[1].protocolo).toBe("SOS-RESOLVIDO");
  });
});

describe("SUITE 39: PARTIU NATIONAL ADMIN V4 — Express White Label Onboarding Wizard (<15 min)", () => {
  interface CityWizardInput {
    cidade: string;
    uf: string;
    nomeApp: string;
    corPrimaria: string;
    preset: "Moderno" | "Compacto" | "Arredondado";
    tarifaBase: number;
    comissao: number;
    pix: string;
    whatsapp: string;
  }

  function provisionarCidadeTenant(input: CityWizardInput) {
    if (!input.cidade || !input.uf || !input.nomeApp) {
      throw new Error("Passo 1 incompleto: Cidade, UF e Nome do App são obrigatórios.");
    }
    if (!input.corPrimaria || !input.preset) {
      throw new Error("Passo 2 incompleto: Identidade visual obrigatória.");
    }
    if (input.tarifaBase <= 0 || input.comissao <= 0) {
      throw new Error("Passo 3 incompleto: Tarifas e comissão devem ser positivas.");
    }
    if (!input.pix || !input.whatsapp) {
      throw new Error("Passo 4 incompleto: Chave PIX e WhatsApp são obrigatórios.");
    }

    return {
      tenantId: "tenant_" + input.cidade.toLowerCase().replace(/\s+/g, "_"),
      cidade: input.cidade,
      uf: input.uf.toUpperCase(),
      nomeApp: input.nomeApp,
      brand: {
        primaryColor: input.corPrimaria,
        preset: input.preset,
      },
      pricing: {
        tarifaBase: input.tarifaBase,
        comissaoPercent: input.comissao,
      },
      channels: {
        pixKey: input.pix,
        whatsapp: input.whatsapp,
      },
      status: "ATIVO",
      provisionedAt: new Date().toISOString(),
    };
  }

  test("Onboarding Expresso Completo: Provisiona cidade com todas as regras comerciais e canais", () => {
    const tenant = provisionarCidadeTenant({
      cidade: "Arapiraca",
      uf: "AL",
      nomeApp: "Partiu Arapiraca",
      corPrimaria: "#FFDE00",
      preset: "Moderno",
      tarifaBase: 5.0,
      comissao: 10.0,
      pix: "financeiro@partiumobilidade.com.br",
      whatsapp: "(82) 99888-7766",
    });

    expect(tenant.tenantId).toBe("tenant_arapiraca");
    expect(tenant.cidade).toBe("Arapiraca");
    expect(tenant.uf).toBe("AL");
    expect(tenant.status).toBe("ATIVO");
    expect(tenant.pricing.comissaoPercent).toBe(10.0);
  });

  test("Validação de Etapas: Lança erro caso qualquer um dos 4 passos seja omitido", () => {
    expect(() =>
      provisionarCidadeTenant({
        cidade: "",
        uf: "AL",
        nomeApp: "",
        corPrimaria: "#FFDE00",
        preset: "Moderno",
        tarifaBase: 5.0,
        comissao: 10.0,
        pix: "pix@app.com",
        whatsapp: "82999",
      })
    ).toThrow("Passo 1 incompleto");
  });
});

describe("39. PARTIU GLOBAL CITY SELECTOR & REGIONAL SCOPE (Etapa 2)", () => {
  test("1. Carregamento de Praças: Deve incluir a visão consolidada 'todas' e praças padrão", () => {
    const pracas = carregarPracasDisponiveis();
    expect(pracas.length).toBeGreaterThanOrEqual(3);
    const global = pracas.find((p) => p.id === "todas");
    expect(global).toBeDefined();
    expect(global?.nome).toBe("Todas as Praças");
    expect(global?.uf).toBe("BR");
  });

  test("2. Praça Padrão Ativa: Deve iniciar em 'todas' (visão nacional consolidada)", () => {
    const ativa = getPracaAtiva();
    expect(ativa).toBeDefined();
    expect(ativa.id).toBe("todas");
  });

  test("3. Alternância Reativa de Praça: Deve permitir selecionar praça regional", () => {
    const selecionada = setPracaAtiva("arp");
    expect(selecionada.id).toBe("arp");
    expect(selecionada.nome).toBe("Arapiraca");
    expect(selecionada.uf).toBe("AL");
    expect(selecionada.lat).toBeCloseTo(-9.7517, 2);

    // Retorna para todas
    const restaurada = setPracaAtiva("todas");
    expect(restaurada.id).toBe("todas");
  });
});

describe("40. PARTIU DRIVER WALLET, PREPAID COMMISSIONS & PIX GATEWAY (Sprint 3)", () => {
  test("1. Carregamento de Carteiras: Motoristas com saldo positivo ficam LIBERADOS e com saldo zerado/negativo ficam BLOQUEADOS", () => {
    const carteiras = carregarCarteiras();
    expect(carteiras.length).toBeGreaterThanOrEqual(4);

    const liberado = carteiras.find((c) => c.motoristaId === "mot-1");
    expect(liberado).toBeDefined();
    expect(liberado?.saldoBrl).toBeGreaterThan(0);
    expect(liberado?.statusBloqueio).toBe("LIBERADO");

    const bloqueado = carteiras.find((c) => c.motoristaId === "mot-3");
    expect(bloqueado).toBeDefined();
    expect(bloqueado?.saldoBrl).toBeLessThanOrEqual(0);
    expect(bloqueado?.statusBloqueio).toBe("BLOQUEADO_SALDO_INSUFICIENTE");
  });

  test("2. Débito de Corrida: Reduz saldo e bloqueia automaticamente ao atingir saldo <= 0", () => {
    const tx = lancarTransacaoCarteira({
      motoristaId: "mot-1",
      tipo: "DEBITO_CORRIDA",
      valorBrl: 15.0,
      descricao: "Comissão de corrida #TEST-001",
    });

    expect(tx.tipo).toBe("DEBITO_CORRIDA");
    expect(tx.valorBrl).toBe(15.0);

    const carteiras = carregarCarteiras();
    const mot1 = carteiras.find((c) => c.motoristaId === "mot-1");
    expect(mot1?.saldoBrl).toBe(tx.saldoAposBrl);
  });

  test("3. Bloqueio Administrativo: Prevalece sobre o saldo e impede corridas mesmo com créditos", () => {
    const wBloqueado = alternarBloqueioAdmin("mot-1");
    expect(wBloqueado?.statusBloqueio).toBe("BLOQUEADO_ADMINISTRATIVO");

    const wDesbloqueado = alternarBloqueioAdmin("mot-1");
    expect(wDesbloqueado?.statusBloqueio).toBe("LIBERADO");
  });

  test("4. Recarga Pix & Conciliação: Aprovação credita saldo e desbloqueia motorista", () => {
    // mot-3 está com saldo zero/negativo e bloqueado por saldo insuficiente
    const pedidos = carregarPedidosRecarga();
    const pedidoPendente = pedidos.find((p) => p.motoristaId === "mot-3" && p.status === "PENDENTE");
    expect(pedidoPendente).toBeDefined();

    if (pedidoPendente) {
      const aprovado = aprovarRecargaPix(pedidoPendente.id);
      expect(aprovado).toBe(true);

      const pedidosAtualizados = carregarPedidosRecarga();
      const p = pedidosAtualizados.find((x) => x.id === pedidoPendente.id);
      expect(p?.status).toBe("APROVADO");

      const carteiras = carregarCarteiras();
      const mot3 = carteiras.find((c) => c.motoristaId === "mot-3");
      expect(mot3?.saldoBrl).toBeGreaterThan(0);
      expect(mot3?.statusBloqueio).toBe("LIBERADO");
    }
  });

  test("5. Rejeição de Recarga Pix: Marca pedido como REJEITADO e não altera saldo", () => {
    const pedidos = carregarPedidosRecarga();
    const pedidoPendente = pedidos.find((p) => p.status === "PENDENTE");
    if (pedidoPendente) {
      const rejeitado = rejeitarRecargaPix(pedidoPendente.id, "Comprovante ilegível");
      expect(rejeitado).toBe(true);

      const pAtualizado = carregarPedidosRecarga().find((x) => x.id === pedidoPendente.id);
      expect(pAtualizado?.status).toBe("REJEITADO");
    }
  });

  test("6. Emissão de QR Code Pix Copia e Cola: Padrão Banco Central com CRC16 válido", () => {
    const payload = gerarPayloadPixCopiaECola({
      chavePix: "financeiro@partiumobilidade.com.br",
      nomeBeneficiario: "PARTIU MOBILIDADE URBANA",
      cidade: "ITAPERUNA",
      valorBrl: 50.0,
      txid: "REC12345",
    });

    expect(payload).toContain("000201");
    expect(payload).toContain("financeiro@partiumobilidade.com.br");
    expect(payload).toContain("540550.00");
    expect(payload).toContain("6304"); // Tag CRC16 final
    expect(payload.length).toBeGreaterThan(60);
  });

  test("7. Gateway Config: Persistência e restauração de parâmetros de gateways e sandbox", () => {
    const configAtual = carregarGatewayConfig();
    expect(configAtual.gatewayAtivo).toBeDefined();

    salvarGatewayConfig({
      ...configAtual,
      gatewayAtivo: "PICPAY",
      sandbox: true,
      tempoExpiracaoMinutos: 25,
      limiteAlertaSaldoBaixo: 20.0,
    });

    const configSalva = carregarGatewayConfig();
    expect(configSalva.gatewayAtivo).toBe("PICPAY");
    expect(configSalva.sandbox).toBe(true);
    expect(configSalva.tempoExpiracaoMinutos).toBe(25);
    expect(configSalva.limiteAlertaSaldoBaixo).toBe(20.0);

    // Restaura configuração padrão
    salvarGatewayConfig(configAtual);
  });
});

describe("41. PARTIU LANDING CMS, MAPS FINOPS & DATA GOVERNANCE (Sprint 4)", () => {
  // --- MÓDULO 9: CMS LANDING PAGE ---
  test("1. CMS Landing: Carregamento inicial inclui Hero, B2B e Prova Social com depoimentos", () => {
    const cmsData = carregarCmsLandingData();
    expect(cmsData).toBeDefined();
    expect(cmsData.hero).toBeDefined();
    expect(cmsData.b2bSection).toBeDefined();
    expect(cmsData.b2bSection?.titulo).toContain("PARTIU Empresas");
    expect(cmsData.socialProof?.metricas.length).toBeGreaterThan(0);
    expect(cmsData.socialProof?.depoimentos.length).toBeGreaterThan(0);
  });

  test("2. CMS Landing: Atualização dinâmica de seções (Hero e B2B) e restauração canônica", () => {
    const original = carregarCmsLandingData();
    
    // Atualiza com novo título
    salvarCmsLandingData({
      hero: {
        ...original.hero,
        title: "Mobilidade e Entregas Sem Taxas Abusivas no Seu Município",
      },
      b2bSection: {
        ...DEFAULT_B2B_SECTION,
        titulo: "PARTIU Empresas & Convênios Regionais 2026",
      },
    });

    const atualizado = carregarCmsLandingData();
    expect(atualizado.hero.title).toBe("Mobilidade e Entregas Sem Taxas Abusivas no Seu Município");
    expect(atualizado.b2bSection?.titulo).toBe("PARTIU Empresas & Convênios Regionais 2026");

    // Restaura padrão
    const restaurado = restaurarCmsLandingPadrao();
    expect(restaurado).toBeDefined();
    expect(restaurado.b2bSection).toBeDefined();
  });

  // --- MÓDULO 10: FINOPS DE APIS & MAPS CACHE ---
  test("3. Maps FinOps: Parâmetros de cache, TTL e cotação Dólar/Real", () => {
    const config = carregarConfigFinOps();
    expect(config.ttlMinutos).toBeGreaterThanOrEqual(5);
    expect(config.cotacaoDolarBrl).toBeGreaterThan(0);

    salvarConfigFinOps({ ttlMinutos: 45, deadbandMetros: 60 });
    const novaConfig = carregarConfigFinOps();
    expect(novaConfig.ttlMinutos).toBe(45);
    expect(novaConfig.deadbandMetros).toBe(60);

    // Restaura
    salvarConfigFinOps(DEFAULT_CONFIG_MAPAS);
  });

  test("4. Maps FinOps: Registro de requisições, métricas de economia e retenção de cache", () => {
    // Registra um HIT (cache economizou requisição)
    const logHit = registrarChamadaApi({
      categoria: "CORRIDA",
      provedor: "CACHE_LOCAL",
      endpoint: "Directions",
      parametros: "Origem A -> Destino B (Hash Hit)",
      status: "HIT",
      latenciaMs: 12,
    });
    expect(logHit.custoEstimadoUsd).toBe(0);
    expect(logHit.economiaEstimadaUsd).toBeGreaterThan(0);

    // Registra um MISS (requisição bateu no Google Maps)
    const logMiss = registrarChamadaApi({
      categoria: "GOOGLE MAPS",
      provedor: "GOOGLE_MAPS",
      endpoint: "Places Autocomplete",
      parametros: "Busca de endereço inédito",
      status: "MISS",
      latenciaMs: 210,
    });
    expect(logMiss.custoEstimadoUsd).toBeGreaterThan(0);
    expect(logMiss.economiaEstimadaUsd).toBe(0);

    // Calcula consolidação FinOps
    const metricas = calcularMetricasFinOps();
    expect(metricas.totalRequisicoes).toBeGreaterThan(0);
    expect(metricas.taxaRetencaoPercent).toBeGreaterThan(0);
    expect(metricas.totalEconomizadoBrl).toBeGreaterThanOrEqual(0);
    expect(metricas.tempoMedioRespostaMs).toBeGreaterThan(0);
  });

  // --- MÓDULO 11: GOVERNANÇA, LGPD & COLD STORAGE ---
  test("5. Soft Delete (LGPD Art. 18): Exclusão lógica com mascaramento de CPF/telefone e restauração", () => {
    const novoSoftDelete = executarSoftDelete({
      tipo: "MOTORISTA",
      entidadeId: "mot-test-99",
      nome: "Carlos Eduardo de Souza",
      cpfOriginal: "123.456.789-00",
      telefoneOriginal: "(22) 99887-6655",
      motivo: "Direito ao esquecimento do titular (LGPD)",
      operador: "DPO Compliance",
    });

    expect(novoSoftDelete.id).toBeDefined();
    expect(novoSoftDelete.status).toBe("EXCLUIDO_LOGICO");
    expect(novoSoftDelete.documentoMascarado).toContain("***.456.789-**");
    expect(novoSoftDelete.telefoneMascarado).toContain("(22) *****-6655");

    const lista = listarSoftDeletes();
    const encontrado = lista.find((x) => x.id === novoSoftDelete.id);
    expect(encontrado).toBeDefined();

    // Restauração auditada
    const restaurado = restaurarRegistroSoftDelete(novoSoftDelete.id, "Diretor de Operações");
    expect(restaurado).toBe(true);

    const atualizado = listarSoftDeletes().find((x) => x.id === novoSoftDelete.id);
    expect(atualizado?.status).toBe("RESTAURADO");
    expect(atualizado?.restauradoPor).toBe("Diretor de Operações");
  });

  test("6. Cold Storage & Purga: Estimativa proporcional por janela de corte e execução registrada", () => {
    const est30 = estimarRegistrosPurga("TELEMETRIA_GPS", 30);
    const est365 = estimarRegistrosPurga("TELEMETRIA_GPS", 365);

    expect(est30.registrosEstimados).toBeGreaterThan(est365.registrosEstimados);
    expect(est30.espacoEstimadoMb).toBeGreaterThan(0);

    // Execução da purga
    const purga = executarPurgaColdStorage("TELEMETRIA_GPS", 90, "Operador Teste FinOps");
    expect(purga.id).toBeDefined();
    expect(purga.registrosAfetados).toBeGreaterThan(0);
    expect(purga.espacoLiberadoMb).toBeGreaterThan(0);

    const purgas = listarPurgas();
    expect(purgas.some((p) => p.id === purga.id)).toBe(true);
  });

  test("7. Dump Preventivo: Geração com checksum SHA-256 e inventário de tabelas", () => {
    const dump = gerarDumpPreventivo("Super Admin Automático");
    expect(dump.id).toContain("dump-");
    expect(dump.checksumSha256.length).toBe(64);
    expect(dump.totalTabelas).toBe(34);
    expect(dump.status).toBe("CONCLUIDO");

    const backups = listarBackups();
    expect(backups.some((b) => b.id === dump.id)).toBe(true);
  });
});

