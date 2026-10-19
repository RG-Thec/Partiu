import { describe, test, expect } from "./test-harness.mjs";
import {
  buscarCidadesBrasil,
  resolverCidadeBrasil,
  CIDADES_BRASIL_CANONICAS,
} from "../src/lib/geo/brazil-cities.ts";
import {
  validarAcessoTerritorial,
  validarAcessoTerritorialParaCadastro,
  criarTerritorioPadrao,
  calcularDistanciaHaversineKm,
} from "../src/lib/geo/territory-guard.ts";
import { whiteLabelEngine } from "../src/lib/white-label/white-label-engine.ts";
import { MatchingEngine } from "../src/services/MatchingEngine.ts";
import { supabaseAuthService } from "../src/lib/auth/supabase-auth-service.ts";

describe("39. GEOFENCING & PRIORIDADE TERRITORIAL DE FRANQUIAS (SUPER ADMIN)", () => {
  test("Base Geográfica Canônica: Busca e Autocomplete de Cidades Brasileiras", () => {
    // 1. Busca por prefixo/nome parcial
    const buscaBH = buscarCidadesBrasil("Belo");
    expect(buscaBH.length).toBeGreaterThanOrEqual(1);
    expect(buscaBH[0].nome).toBe("Belo Horizonte");
    expect(buscaBH[0].uf).toBe("MG");
    expect(buscaBH[0].lat).toBeCloseTo(-19.9167, 2);
    expect(buscaBH[0].raioSugeridoKm).toBeGreaterThanOrEqual(25);

    // 2. Busca insensível a acentuação
    const buscaBrasilia = buscarCidadesBrasil("brasilia");
    expect(buscaBrasilia.length).toBeGreaterThanOrEqual(1);
    expect(buscaBrasilia[0].nome).toBe("Brasília");
    expect(buscaBrasilia[0].uf).toBe("DF");

    // 3. Resolução canônica exata
    const resolvida = resolverCidadeBrasil("Curitiba", "PR");
    expect(resolvida).toBeDefined();
    expect(resolvida?.nome).toBe("Curitiba");
    expect(resolvida?.uf).toBe("PR");
    expect(resolvida?.raioSugeridoKm).toBe(30);
  });

  test("Cálculo Haversine Geodésico: Distâncias entre Cidades Brasileiras", () => {
    // Distância BH (-19.9167, -43.9345) até Contagem (-19.9321, -44.0539) ~12.5km
    const distBhContagem = calcularDistanciaHaversineKm(-19.9167, -43.9345, -19.9321, -44.0539);
    expect(distBhContagem).toBeLessThan(20);
    expect(distBhContagem).toBeGreaterThan(10);

    // Distância BH até Rio de Janeiro ~340km
    const distBhRio = calcularDistanciaHaversineKm(-19.9167, -43.9345, -22.9068, -43.1729);
    expect(distBhRio).toBeGreaterThan(300);
    expect(distBhRio).toBeLessThan(400);
  });

  test("Regra da Matriz Nacional (Franquia Mãe): Cobertura Irrestrita em Todo o Brasil", () => {
    const matriz = whiteLabelEngine.getTenantById("default");
    expect(matriz).toBeDefined();

    // 1. Matriz em São Paulo
    const emSp = validarAcessoTerritorial(matriz!, -23.5505, -46.6333);
    expect(emSp.permitido).toBe(true);
    expect(emSp.modo).toBe("NACIONAL_IRRESTRITO");

    // 2. Matriz em Manaus
    const emManaus = validarAcessoTerritorial(matriz!, -3.119, -60.0217);
    expect(emManaus.permitido).toBe(true);

    // 3. Matriz em Porto Alegre
    const emPoa = validarAcessoTerritorial(matriz!, -30.0346, -51.2177);
    expect(emPoa.permitido).toBe(true);
  });

  test("Franquia Regional: Bloqueio Estrito Fora do Território Autorizado (Anti-Invasão)", () => {
    // Cria uma franquia regional restrita a Curitiba (raio 25km)
    const franquiaCuritiba = whiteLabelEngine.cloneTenant(
      "default",
      "tenant-curitiba-express",
      "Curitiba",
      "PR",
      "Curitiba Express",
      "curitiba@partiu.app",
      "Senha123!",
      "Gestor Curitiba",
      "(41) 98888-7777",
    );

    expect(franquiaCuritiba.territorio).toBeDefined();
    expect(franquiaCuritiba.territorio?.cidadeSede).toBe("Curitiba");

    // Coordenada dentro de Curitiba (-25.4284, -49.2733) -> PERMITIDO
    const dentroCuritiba = validarAcessoTerritorial(franquiaCuritiba, -25.43, -49.27);
    expect(dentroCuritiba.permitido).toBe(true);

    // Coordenada em São Paulo (-23.5505, -46.6333) (~340km) -> BLOQUEADO
    const tentativaSp = validarAcessoTerritorial(franquiaCuritiba, -23.5505, -46.6333);
    expect(tentativaSp.permitido).toBe(false);
    expect(tentativaSp.distanciaKm).toBeGreaterThan(200);
  });

  test("Direito de Expansão Territorial: Licenciamento de Cidades Vizinhas pelo Super Admin", () => {
    const tenantId = "tenant-teste-expansao";
    const novaFranquia = whiteLabelEngine.cloneTenant(
      "default",
      tenantId,
      "Campinas",
      "SP",
      "Campinas Mob",
    );

    // 1. Inicialmente, apenas Campinas está autorizada
    const emCampinas = validarAcessoTerritorial(novaFranquia, -22.9056, -47.0608);
    expect(emCampinas.permitido).toBe(true);

    // Paulínia ou Jundiaí (fora do raio inicial de Campinas)
    const emJundiai = validarAcessoTerritorial(novaFranquia, -23.1857, -46.8978); // ~40km
    expect(emJundiai.distanciaKm).toBeGreaterThan(30);

    // 2. Super Admin atualiza a franquia concedendo Expansão Territorial Paga para Jundiaí
    const franquiaExpandida = whiteLabelEngine.updateTenantTerritory(tenantId, {
      modo: "MULTI_CIDADES_EXPANSAO",
      cidadesLicenciadas: ["Campinas", "Jundiaí", "Valinhos"],
      raioMaximoKm: 60,
    });

    expect(franquiaExpandida.territorio?.cidadesLicenciadas).toContain("Jundiaí");
    expect(franquiaExpandida.territorio?.cidadesLicenciadas).toContain("Valinhos");
    expect(franquiaExpandida.territorio?.raioMaximoKm).toBe(60);

    // Agora o acesso na região expandida de Jundiaí é aprovado
    const aposExpansao = validarAcessoTerritorial(franquiaExpandida, -23.1857, -46.8978);
    expect(aposExpansao.permitido).toBe(true);
  });

  test("MatchingEngine: Respeita Limites Territoriais no Despacho de Corridas", async () => {
    const matchingEngine = MatchingEngine.getInstance();

    // 1. Matriz Nacional chamando corrida em qualquer lugar do Brasil -> Encontra candidatos normalmente
    const chamadaMatriz = await matchingEngine.findBestDrivers({
      tenantId: "default",
      passengerLat: -15.793889,
      passengerLng: -47.882778,
      category: "POP",
    });
    expect(chamadaMatriz.length).toBeGreaterThan(0);

    // 2. Franquia regional chamando corrida fora de sua praça -> Retorna lista vazia (bloqueada pelo guard)
    const franquiaRegional = whiteLabelEngine.getTenantById("tenant-teste-expansao");
    expect(franquiaRegional).toBeDefined();

    // Chamada em Manaus (-3.119, -60.0217) para uma franquia de Campinas -> Bloqueada imediatamente
    const chamadaFora = await matchingEngine.findBestDrivers({
      tenantId: franquiaRegional!.tenantId,
      passengerLat: -3.119,
      passengerLng: -60.0217,
      category: "POP",
    });
    expect(chamadaFora.length).toBe(0);
  });

  test("Governança de Cadastro: Bloqueio de Novas Contas Fora da Região da Franquia", () => {
    const franquiaCuritiba = whiteLabelEngine.getTenantById("tenant-curitiba-express");
    expect(franquiaCuritiba).toBeDefined();

    // 1. Cadastro dentro de Curitiba (coordenadas locais) -> PERMITIDO
    const cadastroDentro = validarAcessoTerritorialParaCadastro(franquiaCuritiba, {
      lat: -25.4284,
      lng: -49.2733,
    });
    expect(cadastroDentro.permitido).toBe(true);
    expect(cadastroDentro.motivo).toBe("DENTRO_DO_RAIO");

    // 2. Cadastro por cidade autorizada ("Curitiba") -> PERMITIDO
    const cadastroCidadeAutorizada = validarAcessoTerritorialParaCadastro(
      franquiaCuritiba,
      null,
      "Curitiba",
    );
    expect(cadastroCidadeAutorizada.permitido).toBe(true);
    expect(cadastroCidadeAutorizada.motivo).toBe("CIDADE_LICENCIADA");

    // 3. Tentativa de cadastro a partir de São Paulo para a franquia de Curitiba -> BLOQUEADO
    const cadastroSp = validarAcessoTerritorialParaCadastro(franquiaCuritiba, {
      lat: -23.5505,
      lng: -46.6333,
    });
    expect(cadastroSp.permitido).toBe(false);
    expect(cadastroSp.motivo).toBe("CADASTRO_FORA_DA_PRACA");
    expect(cadastroSp.mensagem).toContain("atua exclusivamente em Curitiba");

    // 4. Tentativa informando cidade de outra região ("Fortaleza") -> BLOQUEADO
    const cadastroOutraCidade = validarAcessoTerritorialParaCadastro(
      franquiaCuritiba,
      null,
      "Fortaleza",
    );
    expect(cadastroOutraCidade.permitido).toBe(false);
    expect(cadastroOutraCidade.motivo).toBe("CIDADE_NAO_LICENCIADA");

    // 5. Matriz Nacional permite cadastro de qualquer localização
    const matriz = whiteLabelEngine.getTenantById("default");
    const cadastroMatrizSp = validarAcessoTerritorialParaCadastro(
      matriz,
      { lat: -23.5505, lng: -46.6333 },
      "São Paulo",
    );
    expect(cadastroMatrizSp.permitido).toBe(true);
    expect(cadastroMatrizSp.motivo).toBe("MATRIZ_NACIONAL");
  });

  test("Governança de Cadastro: Integração Direta com supabaseAuthService.signUpPassenger", async () => {
    const franquiaCuritiba = whiteLabelEngine.getTenantById("tenant-curitiba-express");
    expect(franquiaCuritiba).toBeDefined();

    // 1. Tentativa de cadastro em franquia de Curitiba com localização em Porto Alegre -> BLOQUEIO ATÔMICO
    const resBloqueado = await supabaseAuthService.signUpPassenger({
      name: "Passageiro de Fora",
      email: "fora@teste.com",
      phone: "(51) 99999-8888",
      cpf: "12345678901",
      password: "SenhaSegura123!",
      tenantId: franquiaCuritiba!.tenantId,
      coordinates: { lat: -30.0346, lng: -51.2177 }, // Porto Alegre (~540km de Curitiba)
    });

    expect(resBloqueado.success).toBe(false);
    expect(resBloqueado.error).toContain("atua exclusivamente em Curitiba");

    // 2. Cadastro na Matriz Nacional com qualquer localização -> PERMITIDO
    const resMatriz = await supabaseAuthService.signUpPassenger({
      name: "Passageiro Matriz Nacional",
      email: "nacional@teste.com",
      phone: "(61) 99999-7777",
      cpf: "98765432100",
      password: "SenhaSegura123!",
      tenantId: "default",
      coordinates: { lat: -30.0346, lng: -51.2177 },
    });

    expect(resMatriz.success).toBe(true);
  });
});
