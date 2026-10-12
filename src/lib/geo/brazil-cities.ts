/**
 * ==============================================================================
 * 🇧🇷 BASE GEOGRÁFICA CANÔNICA DE CIDADES BRASILEIRAS (PARTIU GEO ENGINE)
 * ==============================================================================
 * Dicionário com capitais, regiões metropolitanas e principais polos urbanos
 * de todos os 26 estados brasileiros + Distrito Federal.
 *
 * Utilizado para preenchimento automático instantâneo de coordenadas, UF,
 * e delimitação de exclusividade territorial no cadastro de novas franquias.
 * ==============================================================================
 */

export interface CidadeBrasilGeo {
  nome: string;
  uf: string;
  lat: number;
  lng: number;
  raioSugeridoKm: number;
  populacaoAprox?: number;
}

export type CidadeBrasil = CidadeBrasilGeo;

export const CIDADES_BRASIL_CANONICAS: CidadeBrasilGeo[] = [
  // DISTRITO FEDERAL
  { nome: "Brasília", uf: "DF", lat: -15.7975, lng: -47.8919, raioSugeridoKm: 35 },
  { nome: "Taguatinga", uf: "DF", lat: -15.8331, lng: -48.0567, raioSugeridoKm: 20 },
  { nome: "Ceilândia", uf: "DF", lat: -15.8197, lng: -48.1108, raioSugeridoKm: 20 },

  // MINAS GERAIS
  { nome: "Belo Horizonte", uf: "MG", lat: -19.9167, lng: -43.9345, raioSugeridoKm: 30 },
  { nome: "Contagem", uf: "MG", lat: -19.9317, lng: -44.0536, raioSugeridoKm: 20 },
  { nome: "Betim", uf: "MG", lat: -19.9678, lng: -44.1983, raioSugeridoKm: 20 },
  { nome: "Uberlândia", uf: "MG", lat: -18.9186, lng: -48.2772, raioSugeridoKm: 25 },
  { nome: "Juiz de Fora", uf: "MG", lat: -21.7642, lng: -43.3496, raioSugeridoKm: 20 },
  { nome: "Montes Claros", uf: "MG", lat: -16.7281, lng: -43.8617, raioSugeridoKm: 20 },
  { nome: "Uberaba", uf: "MG", lat: -19.7478, lng: -47.9392, raioSugeridoKm: 20 },
  { nome: "Governador Valadares", uf: "MG", lat: -18.8511, lng: -41.9494, raioSugeridoKm: 20 },
  { nome: "Ipatinga", uf: "MG", lat: -19.4683, lng: -42.5367, raioSugeridoKm: 20 },
  { nome: "Divinópolis", uf: "MG", lat: -20.1439, lng: -44.8878, raioSugeridoKm: 20 },
  { nome: "Poços de Caldas", uf: "MG", lat: -21.7878, lng: -46.5614, raioSugeridoKm: 18 },
  { nome: "Patos de Minas", uf: "MG", lat: -18.5789, lng: -46.5181, raioSugeridoKm: 18 },
  { nome: "Pouso Alegre", uf: "MG", lat: -22.2300, lng: -45.9364, raioSugeridoKm: 18 },
  { nome: "Varginha", uf: "MG", lat: -21.5517, lng: -45.4303, raioSugeridoKm: 18 },
  { nome: "Sete Lagoas", uf: "MG", lat: -19.4608, lng: -44.2467, raioSugeridoKm: 18 },

  // RIO DE JANEIRO
  { nome: "Rio de Janeiro", uf: "RJ", lat: -22.9068, lng: -43.1729, raioSugeridoKm: 35 },
  { nome: "Niterói", uf: "RJ", lat: -22.8833, lng: -43.1036, raioSugeridoKm: 20 },
  { nome: "São Gonçalo", uf: "RJ", lat: -22.8269, lng: -43.0539, raioSugeridoKm: 20 },
  { nome: "Duque de Caxias", uf: "RJ", lat: -22.7856, lng: -43.3117, raioSugeridoKm: 20 },
  { nome: "Nova Iguaçu", uf: "RJ", lat: -22.7556, lng: -43.4603, raioSugeridoKm: 20 },
  { nome: "Campos dos Goytacazes", uf: "RJ", lat: -21.7544, lng: -41.3244, raioSugeridoKm: 25 },
  { nome: "Itaperuna", uf: "RJ", lat: -21.2054, lng: -41.8892, raioSugeridoKm: 18 },
  { nome: "Macaé", uf: "RJ", lat: -22.3769, lng: -41.7869, raioSugeridoKm: 20 },
  { nome: "Cabo Frio", uf: "RJ", lat: -22.8794, lng: -42.0189, raioSugeridoKm: 20 },
  { nome: "Petrópolis", uf: "RJ", lat: -22.5050, lng: -43.1789, raioSugeridoKm: 20 },
  { nome: "Volta Redonda", uf: "RJ", lat: -22.5231, lng: -44.1042, raioSugeridoKm: 20 },
  { nome: "Resende", uf: "RJ", lat: -22.4689, lng: -44.4469, raioSugeridoKm: 18 },

  // SÃO PAULO
  { nome: "São Paulo", uf: "SP", lat: -23.5505, lng: -46.6333, raioSugeridoKm: 40 },
  { nome: "Guarulhos", uf: "SP", lat: -23.4628, lng: -46.5333, raioSugeridoKm: 25 },
  { nome: "Campinas", uf: "SP", lat: -22.9099, lng: -47.0626, raioSugeridoKm: 30 },
  { nome: "São Bernardo do Campo", uf: "SP", lat: -23.6939, lng: -46.5650, raioSugeridoKm: 20 },
  { nome: "Santo André", uf: "SP", lat: -23.6639, lng: -46.5383, raioSugeridoKm: 20 },
  { nome: "Osasco", uf: "SP", lat: -23.5325, lng: -46.7917, raioSugeridoKm: 20 },
  { nome: "São José dos Campos", uf: "SP", lat: -23.1896, lng: -45.8841, raioSugeridoKm: 25 },
  { nome: "Ribeirão Preto", uf: "SP", lat: -21.1775, lng: -47.8103, raioSugeridoKm: 25 },
  { nome: "Sorocaba", uf: "SP", lat: -23.5017, lng: -47.4581, raioSugeridoKm: 25 },
  { nome: "Santos", uf: "SP", lat: -23.9608, lng: -46.3336, raioSugeridoKm: 20 },
  { nome: "São José do Rio Preto", uf: "SP", lat: -20.8197, lng: -49.3794, raioSugeridoKm: 20 },
  { nome: "Mogi das Cruzes", uf: "SP", lat: -23.5206, lng: -46.1856, raioSugeridoKm: 20 },
  { nome: "Jundiaí", uf: "SP", lat: -23.1864, lng: -46.8844, raioSugeridoKm: 20 },
  { nome: "Piracicaba", uf: "SP", lat: -22.7253, lng: -47.6492, raioSugeridoKm: 20 },
  { nome: "Bauru", uf: "SP", lat: -22.3147, lng: -49.0606, raioSugeridoKm: 20 },
  { nome: "Franca", uf: "SP", lat: -20.5386, lng: -47.4008, raioSugeridoKm: 20 },
  { nome: "São Carlos", uf: "SP", lat: -22.0175, lng: -47.8908, raioSugeridoKm: 18 },
  { nome: "Marília", uf: "SP", lat: -22.2139, lng: -49.9458, raioSugeridoKm: 18 },
  { nome: "Presidente Prudente", uf: "SP", lat: -22.1256, lng: -51.3889, raioSugeridoKm: 18 },

  // PARANÁ
  { nome: "Curitiba", uf: "PR", lat: -25.4284, lng: -49.2733, raioSugeridoKm: 30 },
  { nome: "Londrina", uf: "PR", lat: -23.3045, lng: -51.1696, raioSugeridoKm: 25 },
  { nome: "Maringá", uf: "PR", lat: -23.4205, lng: -51.9333, raioSugeridoKm: 20 },
  { nome: "Ponta Grossa", uf: "PR", lat: -25.0950, lng: -50.1619, raioSugeridoKm: 20 },
  { nome: "Cascavel", uf: "PR", lat: -24.9558, lng: -53.4553, raioSugeridoKm: 20 },
  { nome: "Foz do Iguaçu", uf: "PR", lat: -25.5478, lng: -54.5881, raioSugeridoKm: 20 },
  { nome: "São José dos Pinhais", uf: "PR", lat: -25.5347, lng: -49.2064, raioSugeridoKm: 18 },

  // SANTA CATARINA
  { nome: "Florianópolis", uf: "SC", lat: -27.5954, lng: -48.5480, raioSugeridoKm: 25 },
  { nome: "Joinville", uf: "SC", lat: -26.3045, lng: -48.8487, raioSugeridoKm: 25 },
  { nome: "Blumenau", uf: "SC", lat: -26.9194, lng: -49.0661, raioSugeridoKm: 20 },
  { nome: "Itajaí", uf: "SC", lat: -26.9078, lng: -48.6619, raioSugeridoKm: 18 },
  { nome: "Balneário Camboriú", uf: "SC", lat: -26.9928, lng: -48.6353, raioSugeridoKm: 15 },
  { nome: "Chapecó", uf: "SC", lat: -27.1006, lng: -52.6153, raioSugeridoKm: 20 },
  { nome: "Criciúma", uf: "SC", lat: -28.6775, lng: -49.3697, raioSugeridoKm: 18 },

  // RIO GRANDE DO SUL
  { nome: "Porto Alegre", uf: "RS", lat: -30.0346, lng: -51.2177, raioSugeridoKm: 30 },
  { nome: "Caxias do Sul", uf: "RS", lat: -29.1678, lng: -51.1794, raioSugeridoKm: 25 },
  { nome: "Canoas", uf: "RS", lat: -29.9178, lng: -51.1836, raioSugeridoKm: 20 },
  { nome: "Pelotas", uf: "RS", lat: -31.7654, lng: -52.3376, raioSugeridoKm: 20 },
  { nome: "Santa Maria", uf: "RS", lat: -29.6842, lng: -53.8069, raioSugeridoKm: 20 },
  { nome: "Gravataí", uf: "RS", lat: -29.9439, lng: -50.9922, raioSugeridoKm: 18 },
  { nome: "Novo Hamburgo", uf: "RS", lat: -29.6783, lng: -51.1306, raioSugeridoKm: 18 },
  { nome: "Passo Fundo", uf: "RS", lat: -28.2611, lng: -52.4083, raioSugeridoKm: 18 },

  // BAHIA
  { nome: "Salvador", uf: "BA", lat: -12.9777, lng: -38.5016, raioSugeridoKm: 35 },
  { nome: "Feira de Santana", uf: "BA", lat: -12.2667, lng: -38.9667, raioSugeridoKm: 25 },
  { nome: "Vitória da Conquista", uf: "BA", lat: -14.8661, lng: -40.8394, raioSugeridoKm: 20 },
  { nome: "Camaçari", uf: "BA", lat: -12.6975, lng: -38.3242, raioSugeridoKm: 20 },
  { nome: "Itabuna", uf: "BA", lat: -14.7939, lng: -39.2789, raioSugeridoKm: 18 },
  { nome: "Juazeiro", uf: "BA", lat: -9.4167, lng: -40.5033, raioSugeridoKm: 18 },
  { nome: "Ilhéus", uf: "BA", lat: -14.7889, lng: -39.0494, raioSugeridoKm: 18 },
  { nome: "Lauro de Freitas", uf: "BA", lat: -12.8944, lng: -38.3272, raioSugeridoKm: 18 },
  { nome: "Porto Seguro", uf: "BA", lat: -16.4497, lng: -39.0647, raioSugeridoKm: 20 },

  // GOIÁS
  { nome: "Goiânia", uf: "GO", lat: -16.6869, lng: -49.2648, raioSugeridoKm: 30 },
  { nome: "Aparecida de Goiânia", uf: "GO", lat: -16.8236, lng: -49.2439, raioSugeridoKm: 20 },
  { nome: "Anápolis", uf: "GO", lat: -16.3267, lng: -48.9533, raioSugeridoKm: 20 },
  { nome: "Rio Verde", uf: "GO", lat: -17.7928, lng: -50.9192, raioSugeridoKm: 18 },
  { nome: "Luziânia", uf: "GO", lat: -16.2525, lng: -47.9500, raioSugeridoKm: 18 },
  { nome: "Águas Lindas de Goiás", uf: "GO", lat: -15.7625, lng: -48.2817, raioSugeridoKm: 18 },

  // CEARÁ
  { nome: "Fortaleza", uf: "CE", lat: -3.7319, lng: -38.5267, raioSugeridoKm: 30 },
  { nome: "Caucaia", uf: "CE", lat: -3.7361, lng: -38.6531, raioSugeridoKm: 20 },
  { nome: "Juazeiro do Norte", uf: "CE", lat: -7.2131, lng: -39.3150, raioSugeridoKm: 20 },
  { nome: "Maracanaú", uf: "CE", lat: -3.8667, lng: -38.6333, raioSugeridoKm: 18 },
  { nome: "Sobral", uf: "CE", lat: -3.6894, lng: -40.3486, raioSugeridoKm: 18 },

  // PERNAMBUCO
  { nome: "Recife", uf: "PE", lat: -8.0476, lng: -34.8770, raioSugeridoKm: 30 },
  { nome: "Jaboatão dos Guararapes", uf: "PE", lat: -8.1128, lng: -35.0153, raioSugeridoKm: 20 },
  { nome: "Olinda", uf: "PE", lat: -7.9989, lng: -34.8450, raioSugeridoKm: 18 },
  { nome: "Caruaru", uf: "PE", lat: -8.2833, lng: -35.9667, raioSugeridoKm: 20 },
  { nome: "Petrolina", uf: "PE", lat: -9.3986, lng: -40.5008, raioSugeridoKm: 20 },
  { nome: "Paulista", uf: "PE", lat: -7.9408, lng: -34.8731, raioSugeridoKm: 18 },

  // PARÁ
  { nome: "Belém", uf: "PA", lat: -1.4558, lng: -48.4902, raioSugeridoKm: 30 },
  { nome: "Ananindeua", uf: "PA", lat: -1.3656, lng: -48.3744, raioSugeridoKm: 20 },
  { nome: "Santarém", uf: "PA", lat: -2.4431, lng: -54.7083, raioSugeridoKm: 20 },
  { nome: "Marabá", uf: "PA", lat: -5.3686, lng: -49.1178, raioSugeridoKm: 20 },
  { nome: "Parauapebas", uf: "PA", lat: -6.0678, lng: -49.9022, raioSugeridoKm: 18 },

  // AMAZONAS
  { nome: "Manaus", uf: "AM", lat: -3.1190, lng: -60.0217, raioSugeridoKm: 35 },
  { nome: "Parintins", uf: "AM", lat: -2.6289, lng: -56.7358, raioSugeridoKm: 15 },

  // ESPÍRITO SANTO
  { nome: "Vitória", uf: "ES", lat: -20.3155, lng: -40.3128, raioSugeridoKm: 20 },
  { nome: "Vila Velha", uf: "ES", lat: -20.3297, lng: -40.2925, raioSugeridoKm: 20 },
  { nome: "Serra", uf: "ES", lat: -20.1286, lng: -40.3078, raioSugeridoKm: 20 },
  { nome: "Cariacica", uf: "ES", lat: -20.3631, lng: -40.4200, raioSugeridoKm: 18 },
  { nome: "Cachoeiro de Itapemirim", uf: "ES", lat: -20.8489, lng: -41.1128, raioSugeridoKm: 20 },
  { nome: "Linhares", uf: "ES", lat: -19.3911, lng: -40.0722, raioSugeridoKm: 18 },
  { nome: "Colatina", uf: "ES", lat: -19.5392, lng: -40.6306, raioSugeridoKm: 18 },

  // MATO GROSSO
  { nome: "Cuiabá", uf: "MT", lat: -15.6014, lng: -56.0979, raioSugeridoKm: 25 },
  { nome: "Várzea Grande", uf: "MT", lat: -15.6467, lng: -56.1325, raioSugeridoKm: 20 },
  { nome: "Rondonópolis", uf: "MT", lat: -16.4678, lng: -54.6367, raioSugeridoKm: 20 },
  { nome: "Sinop", uf: "MT", lat: -11.8606, lng: -55.5097, raioSugeridoKm: 20 },

  // MATO GROSSO DO SUL
  { nome: "Campo Grande", uf: "MS", lat: -20.4697, lng: -54.6201, raioSugeridoKm: 25 },
  { nome: "Dourados", uf: "MS", lat: -22.2211, lng: -54.8056, raioSugeridoKm: 20 },
  { nome: "Três Lagoas", uf: "MS", lat: -20.7511, lng: -51.6783, raioSugeridoKm: 18 },

  // MARANHÃO
  { nome: "São Luís", uf: "MA", lat: -2.5307, lng: -44.3068, raioSugeridoKm: 30 },
  { nome: "Imperatriz", uf: "MA", lat: -5.5264, lng: -47.4778, raioSugeridoKm: 20 },
  { nome: "Caxias", uf: "MA", lat: -4.8589, lng: -43.3561, raioSugeridoKm: 18 },

  // PARAÍBA
  { nome: "João Pessoa", uf: "PB", lat: -7.1195, lng: -34.8450, raioSugeridoKm: 25 },
  { nome: "Campina Grande", uf: "PB", lat: -7.2247, lng: -35.8811, raioSugeridoKm: 20 },

  // RIO GRANDE DO NORTE
  { nome: "Natal", uf: "RN", lat: -5.7945, lng: -35.2110, raioSugeridoKm: 25 },
  { nome: "Mossoró", uf: "RN", lat: -5.1878, lng: -37.3439, raioSugeridoKm: 20 },
  { nome: "Parnamirim", uf: "RN", lat: -5.9156, lng: -35.2628, raioSugeridoKm: 18 },

  // ALAGOAS
  { nome: "Maceió", uf: "AL", lat: -9.6658, lng: -35.7350, raioSugeridoKm: 25 },
  { nome: "Arapiraca", uf: "AL", lat: -9.7517, lng: -36.6606, raioSugeridoKm: 18 },

  // PIAUÍ
  { nome: "Teresina", uf: "PI", lat: -5.0920, lng: -42.8038, raioSugeridoKm: 25 },
  { nome: "Parnaíba", uf: "PI", lat: -2.9039, lng: -41.7769, raioSugeridoKm: 18 },

  // SERGIPE
  { nome: "Aracaju", uf: "SE", lat: -10.9472, lng: -37.0731, raioSugeridoKm: 25 },
  { nome: "Nossa Senhora do Socorro", uf: "SE", lat: -10.8547, lng: -37.1261, raioSugeridoKm: 18 },

  // RONDÔNIA
  { nome: "Porto Velho", uf: "RO", lat: -8.7619, lng: -63.9039, raioSugeridoKm: 25 },
  { nome: "Ji-Paraná", uf: "RO", lat: -10.8828, lng: -61.9514, raioSugeridoKm: 18 },

  // TOCANTINS
  { nome: "Palmas", uf: "TO", lat: -10.1844, lng: -48.3336, raioSugeridoKm: 25 },
  { nome: "Araguaína", uf: "TO", lat: -7.1925, lng: -48.2044, raioSugeridoKm: 18 },

  // ACRE
  { nome: "Rio Branco", uf: "AC", lat: -9.9749, lng: -67.8243, raioSugeridoKm: 25 },

  // AMAPÁ
  { nome: "Macapá", uf: "AP", lat: 0.0356, lng: -51.0705, raioSugeridoKm: 25 },

  // RORAIMA
  { nome: "Boa Vista", uf: "RR", lat: 2.8235, lng: -60.6758, raioSugeridoKm: 25 },
];

/**
 * Normaliza texto para busca insensível a acentos e maiúsculas
 */
function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Busca inteligente de cidades brasileiras com correspondência exata ou aproximada
 */
export function buscarCidadesBrasil(query: string, limite = 8): CidadeBrasilGeo[] {
  if (!query || query.trim().length < 2) return [];

  const termo = normalizarTexto(query);

  const exatas = CIDADES_BRASIL_CANONICAS.filter(
    (c) => normalizarTexto(c.nome) === termo
  );

  const queComecamCom = CIDADES_BRASIL_CANONICAS.filter(
    (c) => normalizarTexto(c.nome).startsWith(termo) && normalizarTexto(c.nome) !== termo
  );

  const queContem = CIDADES_BRASIL_CANONICAS.filter(
    (c) =>
      normalizarTexto(c.nome).includes(termo) &&
      !normalizarTexto(c.nome).startsWith(termo)
  );

  return [...exatas, ...queComecamCom, ...queContem].slice(0, limite);
}

/**
 * Obtém os dados geográficos canônicos de uma cidade por nome e opcional UF.
 * Se não encontrar, retorna uma estimativa central para o Brasil.
 */
export function resolverCidadeBrasil(cidade: string, uf?: string): CidadeBrasilGeo {
  const termoCidade = normalizarTexto(cidade);
  const termoUf = uf ? normalizarTexto(uf) : null;

  const encontrada = CIDADES_BRASIL_CANONICAS.find((c) => {
    const matchCidade = normalizarTexto(c.nome) === termoCidade;
    if (termoUf) {
      return matchCidade && normalizarTexto(c.uf) === termoUf;
    }
    return matchCidade;
  });

  if (encontrada) {
    return encontrada;
  }

  // Fallback padrão se não catalogada diretamente
  return {
    nome: cidade.trim(),
    uf: (uf || "BR").toUpperCase(),
    lat: -15.7975,
    lng: -47.8919,
    raioSugeridoKm: 20,
  };
}
