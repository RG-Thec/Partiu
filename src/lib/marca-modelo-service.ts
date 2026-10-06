/**
 * 🚗 SERVIÇO DE CATÁLOGO RELACIONAL DE MARCAS E MODELOS (1:N)
 * Padronização de veículos para o onboarding estrito dos motoristas da rede PARTIU
 */

export interface ModeloVeiculo {
  id: string;
  marcaId: string;
  nome: string;
  categoriaSugerida: "PARTIU_CARRO" | "PARTIU_MOTO" | "PARTIU_EXECUTIVO" | "PARTIU_ENTREGA" | "PARTIU_VAN";
  anoMinimo: number;
  status: "HOMOLOGADO" | "DESCONTINUADO";
}

export interface MarcaVeiculo {
  id: string;
  nome: string;
  tipo: "CARRO" | "MOTO" | "VAN";
  paisOrigem: string;
  logoText?: string;
  totalModelos?: number;
}

const STORAGE_KEY_MARCAS = "partiu_marcas_catalogo";
const STORAGE_KEY_MODELOS = "partiu_modelos_catalogo";

export const MARCAS_PADRAO: MarcaVeiculo[] = [
  { id: "chevrolet", nome: "Chevrolet", tipo: "CARRO", paisOrigem: "EUA" },
  { id: "volkswagen", nome: "Volkswagen", tipo: "CARRO", paisOrigem: "Alemanha" },
  { id: "fiat", nome: "Fiat", tipo: "CARRO", paisOrigem: "Itália" },
  { id: "toyota", nome: "Toyota", tipo: "CARRO", paisOrigem: "Japão" },
  { id: "hyundai", nome: "Hyundai", tipo: "CARRO", paisOrigem: "Coreia do Sul" },
  { id: "renault", nome: "Renault", tipo: "CARRO", paisOrigem: "França" },
  { id: "honda", nome: "Honda", tipo: "MOTO", paisOrigem: "Japão" },
  { id: "yamaha", nome: "Yamaha", tipo: "MOTO", paisOrigem: "Japão" },
  { id: "nissan", nome: "Nissan", tipo: "CARRO", paisOrigem: "Japão" },
  { id: "ford", nome: "Ford", tipo: "CARRO", paisOrigem: "EUA" },
  { id: "jeep", nome: "Jeep", tipo: "CARRO", paisOrigem: "EUA" },
  { id: "mercedes", nome: "Mercedes-Benz", tipo: "VAN", paisOrigem: "Alemanha" },
];

export const MODELOS_PADRAO: ModeloVeiculo[] = [
  // Chevrolet
  { id: "onix", marcaId: "chevrolet", nome: "Onix", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2013, status: "HOMOLOGADO" },
  { id: "onix_plus", marcaId: "chevrolet", nome: "Onix Plus / Sedan", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2014, status: "HOMOLOGADO" },
  { id: "prisma", marcaId: "chevrolet", nome: "Prisma", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2013, status: "HOMOLOGADO" },
  { id: "spin", marcaId: "chevrolet", nome: "Spin (7 Lugares)", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2014, status: "HOMOLOGADO" },
  { id: "tracker", marcaId: "chevrolet", nome: "Tracker", categoriaSugerida: "PARTIU_EXECUTIVO", anoMinimo: 2016, status: "HOMOLOGADO" },
  { id: "cruze", marcaId: "chevrolet", nome: "Cruze Sedan", categoriaSugerida: "PARTIU_EXECUTIVO", anoMinimo: 2016, status: "HOMOLOGADO" },

  // Volkswagen
  { id: "gol", marcaId: "volkswagen", nome: "Gol G5/G6/G7/G8", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2012, status: "HOMOLOGADO" },
  { id: "voyage", marcaId: "volkswagen", nome: "Voyage", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2013, status: "HOMOLOGADO" },
  { id: "polo", marcaId: "volkswagen", nome: "Polo / Polo Track", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2018, status: "HOMOLOGADO" },
  { id: "virtus", marcaId: "volkswagen", nome: "Virtus", categoriaSugerida: "PARTIU_EXECUTIVO", anoMinimo: 2018, status: "HOMOLOGADO" },
  { id: "t_cross", marcaId: "volkswagen", nome: "T-Cross", categoriaSugerida: "PARTIU_EXECUTIVO", anoMinimo: 2019, status: "HOMOLOGADO" },

  // Fiat
  { id: "argo", marcaId: "fiat", nome: "Argo", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2017, status: "HOMOLOGADO" },
  { id: "cronos", marcaId: "fiat", nome: "Cronos", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2018, status: "HOMOLOGADO" },
  { id: "mobi", marcaId: "fiat", nome: "Mobi", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2016, status: "HOMOLOGADO" },
  { id: "siena", marcaId: "fiat", nome: "Grand Siena", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2013, status: "HOMOLOGADO" },
  { id: "pulse", marcaId: "fiat", nome: "Pulse", categoriaSugerida: "PARTIU_EXECUTIVO", anoMinimo: 2021, status: "HOMOLOGADO" },
  { id: "ducato", marcaId: "fiat", nome: "Ducato Minibus", categoriaSugerida: "PARTIU_VAN", anoMinimo: 2015, status: "HOMOLOGADO" },

  // Toyota
  { id: "corolla", marcaId: "toyota", nome: "Corolla", categoriaSugerida: "PARTIU_EXECUTIVO", anoMinimo: 2015, status: "HOMOLOGADO" },
  { id: "yaris", marcaId: "toyota", nome: "Yaris Hatch/Sedan", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2018, status: "HOMOLOGADO" },
  { id: "etios", marcaId: "toyota", nome: "Etios Hatch/Sedan", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2013, status: "HOMOLOGADO" },
  { id: "corolla_cross", marcaId: "toyota", nome: "Corolla Cross", categoriaSugerida: "PARTIU_EXECUTIVO", anoMinimo: 2021, status: "HOMOLOGADO" },

  // Hyundai
  { id: "hb20", marcaId: "hyundai", nome: "HB20", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2013, status: "HOMOLOGADO" },
  { id: "hb20s", marcaId: "hyundai", nome: "HB20S Sedan", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2013, status: "HOMOLOGADO" },
  { id: "creta", marcaId: "hyundai", nome: "Creta", categoriaSugerida: "PARTIU_EXECUTIVO", anoMinimo: 2017, status: "HOMOLOGADO" },

  // Renault
  { id: "kwid", marcaId: "renault", nome: "Kwid", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2017, status: "HOMOLOGADO" },
  { id: "sandero", marcaId: "renault", nome: "Sandero / Stepway", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2013, status: "HOMOLOGADO" },
  { id: "logan", marcaId: "renault", nome: "Logan", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2013, status: "HOMOLOGADO" },
  { id: "duster", marcaId: "renault", nome: "Duster", categoriaSugerida: "PARTIU_EXECUTIVO", anoMinimo: 2015, status: "HOMOLOGADO" },
  { id: "master", marcaId: "renault", nome: "Master Furgão/Van", categoriaSugerida: "PARTIU_VAN", anoMinimo: 2014, status: "HOMOLOGADO" },

  // Honda (Motos)
  { id: "cg160", marcaId: "honda", nome: "CG 160 Titan / Fan / Start", categoriaSugerida: "PARTIU_MOTO", anoMinimo: 2015, status: "HOMOLOGADO" },
  { id: "bros160", marcaId: "honda", nome: "NXR 160 Bros", categoriaSugerida: "PARTIU_MOTO", anoMinimo: 2015, status: "HOMOLOGADO" },
  { id: "biz125", marcaId: "honda", nome: "Biz 125 / 110i", categoriaSugerida: "PARTIU_MOTO", anoMinimo: 2014, status: "HOMOLOGADO" },
  { id: "cb_twister", marcaId: "honda", nome: "CB 250F / 300F Twister", categoriaSugerida: "PARTIU_MOTO", anoMinimo: 2016, status: "HOMOLOGADO" },
  { id: "xre300", marcaId: "honda", nome: "XRE 300 / Sahara", categoriaSugerida: "PARTIU_MOTO", anoMinimo: 2016, status: "HOMOLOGADO" },

  // Yamaha (Motos)
  { id: "factor150", marcaId: "yamaha", nome: "Factor 150 / 125i", categoriaSugerida: "PARTIU_MOTO", anoMinimo: 2015, status: "HOMOLOGADO" },
  { id: "fazer250", marcaId: "yamaha", nome: "Fazer FZ25 / FZ15", categoriaSugerida: "PARTIU_MOTO", anoMinimo: 2016, status: "HOMOLOGADO" },
  { id: "crosser150", marcaId: "yamaha", nome: "Crosser 150 Z/S", categoriaSugerida: "PARTIU_MOTO", anoMinimo: 2015, status: "HOMOLOGADO" },
  { id: "nmax160", marcaId: "yamaha", nome: "NMAX 160 Scooter", categoriaSugerida: "PARTIU_MOTO", anoMinimo: 2017, status: "HOMOLOGADO" },

  // Nissan
  { id: "kicks", marcaId: "nissan", nome: "Kicks", categoriaSugerida: "PARTIU_EXECUTIVO", anoMinimo: 2016, status: "HOMOLOGADO" },
  { id: "versa", marcaId: "nissan", nome: "Versa", categoriaSugerida: "PARTIU_CARRO", anoMinimo: 2014, status: "HOMOLOGADO" },

  // Mercedes-Benz (Vans)
  { id: "sprinter415", marcaId: "mercedes", nome: "Sprinter 415/515 CDI Minibus", categoriaSugerida: "PARTIU_VAN", anoMinimo: 2014, status: "HOMOLOGADO" },
];

export function carregarMarcas(): MarcaVeiculo[] {
  if (typeof window === "undefined") return MARCAS_PADRAO;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MARCAS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return MARCAS_PADRAO;
}

export function carregarModelos(): ModeloVeiculo[] {
  if (typeof window === "undefined") return MODELOS_PADRAO;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MODELOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return MODELOS_PADRAO;
}

export function salvarMarca(dados: Omit<MarcaVeiculo, "id"> & { id?: string }): MarcaVeiculo {
  const marcas = carregarMarcas();
  const slug = dados.nome.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const id = dados.id || `marca_${slug}_${Date.now().toString(36)}`;

  const nova: MarcaVeiculo = {
    id,
    nome: dados.nome.trim(),
    tipo: dados.tipo,
    paisOrigem: dados.paisOrigem.trim() || "Brasil",
  };

  const existentes = marcas.filter((m) => m.id !== id);
  existentes.push(nova);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_MARCAS, JSON.stringify(existentes));
    window.dispatchEvent(new CustomEvent("partiu:catalogo-veiculos-updated"));
  }

  return nova;
}

export function salvarModelo(dados: Omit<ModeloVeiculo, "id"> & { id?: string }): ModeloVeiculo {
  const modelos = carregarModelos();
  const slug = dados.nome.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const id = dados.id || `mod_${slug}_${Date.now().toString(36)}`;

  const novo: ModeloVeiculo = {
    id,
    marcaId: dados.marcaId,
    nome: dados.nome.trim(),
    categoriaSugerida: dados.categoriaSugerida,
    anoMinimo: Number(dados.anoMinimo) || 2012,
    status: dados.status || "HOMOLOGADO",
  };

  const existentes = modelos.filter((m) => m.id !== id);
  existentes.push(novo);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_MODELOS, JSON.stringify(existentes));
    window.dispatchEvent(new CustomEvent("partiu:catalogo-veiculos-updated"));
  }

  return novo;
}

export function alternarStatusModelo(id: string): ModeloVeiculo | null {
  const modelos = carregarModelos();
  const index = modelos.findIndex((m) => m.id === id);
  if (index < 0) return null;

  modelos[index].status = modelos[index].status === "HOMOLOGADO" ? "DESCONTINUADO" : "HOMOLOGADO";

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_MODELOS, JSON.stringify(modelos));
    window.dispatchEvent(new CustomEvent("partiu:catalogo-veiculos-updated"));
  }

  return modelos[index];
}

export function excluirModelo(id: string): boolean {
  const modelos = carregarModelos();
  const filtrados = modelos.filter((m) => m.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_MODELOS, JSON.stringify(filtrados));
    window.dispatchEvent(new CustomEvent("partiu:catalogo-veiculos-updated"));
  }
  return true;
}

export function exportarCatalogoCSV(): void {
  const marcas = carregarMarcas();
  const marcasMap = new Map(marcas.map((m) => [m.id, m.nome]));
  const modelos = carregarModelos();

  const headers = ["ID Modelo", "Marca", "Nome do Modelo", "Categoria Sugerida", "Ano Mínimo Aceito", "Status Homologação"];
  const rows = modelos.map((mod) => [
    mod.id,
    `"${marcasMap.get(mod.marcaId) || mod.marcaId}"`,
    `"${mod.nome}"`,
    mod.categoriaSugerida,
    mod.anoMinimo,
    mod.status,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `catalogo_marcas_modelos_partiu_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
