import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Car,
  Bike,
  Shield,
  Package,
  Truck,
  Bus,
  Plus,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Sliders,
  DollarSign,
  Calendar,
  X,
  Filter,
  Users,
} from "lucide-react";
import {
  type MarcaVeiculo,
  type ModeloVeiculo,
  carregarMarcas,
  carregarModelos,
  salvarMarca,
  salvarModelo,
  alternarStatusModelo,
  excluirModelo,
  exportarCatalogoCSV,
} from "@/lib/marca-modelo-service";
import { appSettingsService } from "@/lib/ecosystem/app-settings-service";

export const Route = createFileRoute("/app/admin/veiculo")({
  head: () => ({
    meta: [
      { title: "Categorias, Marcas & Modelos | PARTIU Admin" },
      {
        name: "description",
        content:
          "Gestão de modalidades tarifárias da plataforma PARTIU e catálogo relacional 1:N de marcas e modelos para onboarding seguro de motoristas.",
      },
    ],
  }),
  component: AdminVeiculoCatalogoPage,
});

interface CategoriaTarifaCustom {
  id: string;
  nome: string;
  tag: string;
  icone: "car" | "bike" | "shield" | "package" | "truck" | "bus" | "mulher";
  descricao: string;
  capacidade: number;
  tarifaBase: number;
  precoKm: number;
  precoMinuto: number;
  tarifaMinima: number;
  multiplicador: number;
  ativo: boolean;
  badge?: string;
}

const STORAGE_KEY_CATEGORIAS_CUSTOM = "partiu_admin_categorias_tarifas";

const CATEGORIAS_INICIAIS: CategoriaTarifaCustom[] = [
  {
    id: "PARTIU_MOTO",
    nome: "Partiu Moto",
    tag: "MOTO",
    icone: "bike",
    descricao: "Transporte individual ágil e econômico",
    capacidade: 1,
    tarifaBase: 4.5,
    precoKm: 1.35,
    precoMinuto: 0.22,
    tarifaMinima: 7.0,
    multiplicador: 0.75,
    ativo: true,
    badge: "Mais Rápido",
  },
  {
    id: "PARTIU_CARRO",
    nome: "Partiu Carro (Pop)",
    tag: "CARRO",
    icone: "car",
    descricao: "Carro confortável de 4 portas com ar-condicionado",
    capacidade: 4,
    tarifaBase: 6.0,
    precoKm: 1.8,
    precoMinuto: 0.3,
    tarifaMinima: 10.0,
    multiplicador: 1.0,
    ativo: true,
    badge: "Mais Popular",
  },
  {
    id: "PARTIU_MULHER",
    nome: "Partiu Mulher",
    tag: "MULHER",
    icone: "mulher",
    descricao: "Exclusivo para condutoras e passageiras mulheres",
    capacidade: 4,
    tarifaBase: 6.5,
    precoKm: 1.9,
    precoMinuto: 0.32,
    tarifaMinima: 11.0,
    multiplicador: 1.05,
    ativo: true,
    badge: "Segurança Delas",
  },
  {
    id: "PARTIU_EXECUTIVO",
    nome: "Partiu Executivo (Black)",
    tag: "EXECUTIVO",
    icone: "shield",
    descricao: "Sedans executivos topo de linha com motoristas VIP",
    capacidade: 4,
    tarifaBase: 8.5,
    precoKm: 2.5,
    precoMinuto: 0.42,
    tarifaMinima: 15.0,
    multiplicador: 1.4,
    ativo: true,
    badge: "Conforto Black",
  },
  {
    id: "PARTIU_FLASH",
    nome: "Partiu Flash (Envio)",
    tag: "FLASH",
    icone: "package",
    descricao: "Envio expresso de envelopes, documentos e caixas pequenas",
    capacidade: 1,
    tarifaBase: 5.0,
    precoKm: 1.5,
    precoMinuto: 0.25,
    tarifaMinima: 8.5,
    multiplicador: 0.85,
    ativo: true,
    badge: "Entrega Flash",
  },
  {
    id: "PARTIU_ENTREGA",
    nome: "Partiu Utilitários (Frete)",
    tag: "ENTREGA",
    icone: "truck",
    descricao: "Transporte de cargas médias, compras e volumes maiores",
    capacidade: 2,
    tarifaBase: 7.5,
    precoKm: 2.25,
    precoMinuto: 0.35,
    tarifaMinima: 16.0,
    multiplicador: 1.25,
    ativo: true,
  },
  {
    id: "PARTIU_VAN",
    nome: "Partiu Van & Turismo",
    tag: "VAN",
    icone: "bus",
    descricao: "Transporte executivo para grupos de até 15 passageiros",
    capacidade: 15,
    tarifaBase: 15.0,
    precoKm: 3.5,
    precoMinuto: 0.55,
    tarifaMinima: 35.0,
    multiplicador: 1.9,
    ativo: true,
    badge: "Grupos e Equipes",
  },
];

export function AdminVeiculoCatalogoPage() {
  const [abaAtiva, setAbaAtiva] = useState<"CATEGORIAS" | "MARCAS_MODELOS">("CATEGORIAS");
  
  // Categorias de Veículos e Tarifas
  const [categorias, setCategorias] = useState<CategoriaTarifaCustom[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CATEGORIAS_CUSTOM);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return CATEGORIAS_INICIAIS;
  });

  const [modalEdicaoCategoria, setModalEdicaoCategoria] = useState(false);
  const [catSelecionada, setCatSelecionada] = useState<CategoriaTarifaCustom | null>(null);
  const [formCatTarifaBase, setFormCatTarifaBase] = useState(6.0);
  const [formCatPrecoKm, setFormCatPrecoKm] = useState(1.8);
  const [formCatPrecoMinuto, setFormCatPrecoMinuto] = useState(0.3);
  const [formCatTarifaMinima, setFormCatTarifaMinima] = useState(10.0);
  const [formCatMultiplicador, setFormCatMultiplicador] = useState(1.0);
  const [formCatAtivo, setFormCatAtivo] = useState(true);

  // Marcas e Modelos (Relacional 1:N)
  const [marcas, setMarcas] = useState<MarcaVeiculo[]>(() => carregarMarcas());
  const [modelos, setModelos] = useState<ModeloVeiculo[]>(() => carregarModelos());
  const [buscaModelo, setBuscaModelo] = useState("");
  const [filtroMarca, setFiltroMarca] = useState<string>("TODAS");
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | "CARRO" | "MOTO" | "VAN">("TODOS");

  // Modais de Marca e Modelo
  const [modalNovaMarca, setModalNovaMarca] = useState(false);
  const [formMarcaNome, setFormMarcaNome] = useState("");
  const [formMarcaTipo, setFormMarcaTipo] = useState<"CARRO" | "MOTO" | "VAN">("CARRO");
  const [formMarcaPais, setFormMarcaPais] = useState("Brasil");

  const [modalNovoModelo, setModalNovoModelo] = useState(false);
  const [formModeloMarcaId, setFormModeloMarcaId] = useState("");
  const [formModeloNome, setFormModeloNome] = useState("");
  const [formModeloSugestao, setFormModeloSugestao] = useState<ModeloVeiculo["categoriaSugerida"]>("PARTIU_CARRO");
  const [formModeloAnoMinimo, setFormModeloAnoMinimo] = useState(2013);

  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3500);
  };

  const recarregarCatalogo = () => {
    setMarcas(carregarMarcas());
    setModelos(carregarModelos());
  };

  useEffect(() => {
    const handleUpdate = () => recarregarCatalogo();
    window.addEventListener("partiu:catalogo-veiculos-updated", handleUpdate);
    return () => {
      window.removeEventListener("partiu:catalogo-veiculos-updated", handleUpdate);
    };
  }, []);

  // Handlers de Categorias de Veículos
  const abrirEdicaoCategoria = (cat: CategoriaTarifaCustom) => {
    setCatSelecionada(cat);
    setFormCatTarifaBase(cat.tarifaBase);
    setFormCatPrecoKm(cat.precoKm);
    setFormCatPrecoMinuto(cat.precoMinuto);
    setFormCatTarifaMinima(cat.tarifaMinima);
    setFormCatMultiplicador(cat.multiplicador);
    setFormCatAtivo(cat.ativo);
    setModalEdicaoCategoria(true);
  };

  const salvarEdicaoCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catSelecionada) return;

    const novasCategorias = categorias.map((c) => {
      if (c.id === catSelecionada.id) {
        return {
          ...c,
          tarifaBase: Number(formCatTarifaBase),
          precoKm: Number(formCatPrecoKm),
          precoMinuto: Number(formCatPrecoMinuto),
          tarifaMinima: Number(formCatTarifaMinima),
          multiplicador: Number(formCatMultiplicador),
          ativo: formCatAtivo,
        };
      }
      return c;
    });

    setCategorias(novasCategorias);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_CATEGORIAS_CUSTOM, JSON.stringify(novasCategorias));
    }

    // Se a categoria editada for CARRO ou MOTO, atualiza também as configurações essenciais do ecossistema
    if (catSelecionada.id === "PARTIU_CARRO") {
      appSettingsService.updateSettings({
        base_fare_ride: Number(formCatTarifaBase),
        price_per_km: Number(formCatPrecoKm),
        price_per_minute: Number(formCatPrecoMinuto),
      });
    }

    setModalEdicaoCategoria(false);
    showToast(`Tarifas da modalidade ${catSelecionada.nome} atualizadas com sucesso!`);
  };

  // Handlers de Marcas e Modelos
  const handleCriarMarca = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMarcaNome.trim()) return;

    salvarMarca({
      nome: formMarcaNome.trim(),
      tipo: formMarcaTipo,
      paisOrigem: formMarcaPais.trim() || "Brasil",
    });

    setModalNovaMarca(false);
    setFormMarcaNome("");
    recarregarCatalogo();
    showToast(`Marca ${formMarcaNome} homologada com sucesso!`);
  };

  const handleCriarModelo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formModeloNome.trim() || !formModeloMarcaId) return;

    salvarModelo({
      marcaId: formModeloMarcaId,
      nome: formModeloNome.trim(),
      categoriaSugerida: formModeloSugestao,
      anoMinimo: Number(formModeloAnoMinimo) || 2013,
      status: "HOMOLOGADO",
    });

    setModalNovoModelo(false);
    setFormModeloNome("");
    recarregarCatalogo();
    showToast(`Modelo ${formModeloNome} cadastrado com sucesso!`);
  };

  const handleAlternarStatusModelo = (id: string, nome: string) => {
    alternarStatusModelo(id);
    recarregarCatalogo();
    showToast(`Status de homologação do modelo ${nome} alterado.`);
  };

  const handleExcluirModelo = (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o modelo "${nome}" do catálogo?`)) {
      excluirModelo(id);
      recarregarCatalogo();
      showToast(`Modelo ${nome} excluído do catálogo.`);
    }
  };

  // Filtragem de Modelos
  const marcasMap = new Map(marcas.map((m) => [m.id, m]));

  const modelosFiltrados = modelos.filter((mod) => {
    const marca = marcasMap.get(mod.marcaId);
    if (filtroTipo !== "TODOS" && marca && marca.tipo !== filtroTipo) return false;
    if (filtroMarca !== "TODAS" && mod.marcaId !== filtroMarca) return false;
    if (buscaModelo.trim()) {
      const termo = buscaModelo.toLowerCase();
      const matchMod = mod.nome.toLowerCase().includes(termo);
      const matchMarca = marca?.nome.toLowerCase().includes(termo);
      if (!matchMod && !matchMarca) return false;
    }
    return true;
  });

  // Ícones por modalidade
  const renderIconeCategoria = (icone: string) => {
    switch (icone) {
      case "bike":
        return <Bike className="w-5 h-5 text-amber-500" />;
      case "shield":
        return <Shield className="w-5 h-5 text-indigo-500" />;
      case "package":
        return <Package className="w-5 h-5 text-purple-500" />;
      case "truck":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "bus":
        return <Bus className="w-5 h-5 text-emerald-500" />;
      case "mulher":
        return <Sparkles className="w-5 h-5 text-rose-500" />;
      default:
        return <Car className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="px-4 sm:px-6 pt-5 pb-16 max-w-7xl mx-auto space-y-6">
      {/* Header Principal */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <Layers className="w-3.5 h-3.5" />
              Frota, Modalidades & Catálogo Padronizado
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-2">
            Categorias, Marcas & Modelos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Configure a composição tarifária de cada modalidade e mantenha o catálogo relacional 1:N
            de marcas e modelos aceitos no onboarding da frota parceira.
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center p-1 rounded-2xl bg-muted/60 border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAbaAtiva("CATEGORIAS")}
            className={`min-h-10 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              abaAtiva === "CATEGORIAS"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign className="w-4 h-4 text-primary" />
            Modalidades & Tarifação
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("MARCAS_MODELOS")}
            className={`min-h-10 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              abaAtiva === "MARCAS_MODELOS"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Car className="w-4 h-4 text-primary" />
            Marcas & Modelos (1:N)
          </button>
        </div>
      </header>

      {/* Toast Feedback */}
      {toastFeedback && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: MODALIDADES E TARIFAS */}
      {/* ========================================================================= */}
      {abaAtiva === "CATEGORIAS" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Alerta de Fórmula Padrão */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Sliders className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Fórmula Oficial de Cálculo de Tarifas (Padrão 99 / Uber)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preço = Tarifa Base + (Distância × Preço/Km) + (Duração × Preço/Minuto).
                  Se o valor for inferior à Tarifa Mínima, o piso garantido é aplicado.
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-mono font-bold text-foreground whitespace-nowrap self-start sm:self-auto">
              Simulação de 5km e 12min
            </div>
          </div>

          {/* Cards de Categorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map((cat) => {
              // Simulação de preço para 5 km e 12 minutos
              const valorBruto = cat.tarifaBase + 5 * cat.precoKm + 12 * cat.precoMinuto;
              const valorEstimado = Math.max(cat.tarifaMinima, valorBruto);

              return (
                <div
                  key={cat.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    cat.ativo
                      ? "bg-card border-border/80 shadow-2xs hover:border-primary/40"
                      : "bg-muted/30 border-border/40 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center">
                        {renderIconeCategoria(cat.icone)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-foreground text-base">{cat.nome}</h3>
                          {cat.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                              {cat.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Capacidade: {cat.capacidade} {cat.capacidade === 1 ? "pessoa" : "passageiros"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => abrirEdicaoCategoria(cat)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-accent transition-colors cursor-pointer"
                      title="Configurar Tarifas"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                    {cat.descricao}
                  </p>

                  {/* Detalhamento Tarifário */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-border/50">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Tarifa Base</span>
                      <strong className="text-foreground font-mono">
                        R$ {cat.tarifaBase.toFixed(2).replace(".", ",")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Preço por Km</span>
                      <strong className="text-foreground font-mono">
                        R$ {cat.precoKm.toFixed(2).replace(".", ",")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Preço por Minuto</span>
                      <strong className="text-foreground font-mono">
                        R$ {cat.precoMinuto.toFixed(2).replace(".", ",")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Tarifa Mínima</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        R$ {cat.tarifaMinima.toFixed(2).replace(".", ",")}
                      </strong>
                    </div>
                  </div>

                  {/* Rodapé do Card com Estimativa */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                        Exemplo 5km / 12min
                      </span>
                      <span className="text-base font-black text-foreground font-mono">
                        R$ {valorEstimado.toFixed(2).replace(".", ",")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cat.ativo ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {cat.ativo ? "Disponível" : "Desativada"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: MARCAS & MODELOS (1:N) */}
      {/* ========================================================================= */}
      {abaAtiva === "MARCAS_MODELOS" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Métricas do Catálogo */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-semibold">Total de Marcas</span>
                <Car className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">{marcas.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Montadoras cadastradas</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-semibold">Modelos Homologados</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {modelos.filter((m) => m.status === "HOMOLOGADO").length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Veículos aceitos no cadastro</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-semibold">Modelos de Carro</span>
                <Car className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                {modelos.filter((m) => marcasMap.get(m.marcaId)?.tipo === "CARRO").length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Hatches, Sedans e SUVs</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-semibold">Modelos de Moto</span>
                <Bike className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground">
                {modelos.filter((m) => marcasMap.get(m.marcaId)?.tipo === "MOTO").length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Motos e Scooters</div>
            </div>
          </section>

          {/* Controles de Busca e Filtros */}
          <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border/60 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar modelo ou montadora (ex: Onix, Gol, Honda CG)..."
                  value={buscaModelo}
                  onChange={(e) => setBuscaModelo(e.target.value)}
                  className="w-full min-h-11 h-11 pl-10 pr-4 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Filtro por Marca */}
              <select
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
                className="min-h-11 h-11 px-3 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="TODAS">Todas as Marcas</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} ({m.tipo})
                  </option>
                ))}
              </select>

              {/* Filtro por Tipo */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(["TODOS", "CARRO", "MOTO", "VAN"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFiltroTipo(tipo)}
                    className={`min-h-10 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      filtroTipo === tipo
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tipo === "TODOS" ? "Todos" : tipo}
                  </button>
                ))}
              </div>
            </div>

            {/* Ações de Criação e Exportação */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={exportarCatalogoCSV}
                className="min-h-11 px-3.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-muted-foreground" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => setModalNovaMarca(true)}
                className="min-h-11 px-3.5 rounded-xl border border-border bg-card hover:bg-accent text-foreground text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nova Marca
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormModeloMarcaId(marcas[0]?.id || "");
                  setModalNovoModelo(true);
                }}
                className="min-h-11 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Modelo
              </button>
            </div>
          </section>

          {/* Tabela de Modelos Cadastrados (1:N) */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 border-b border-border/60 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Modelo do Veículo</th>
                    <th className="py-3.5 px-4">Montadora (Marca)</th>
                    <th className="py-3.5 px-4">Categoria Homologada</th>
                    <th className="py-3.5 px-4 text-center">Ano Mínimo</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {modelosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <Car className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="font-semibold text-sm">Nenhum modelo encontrado</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tente ajustar a busca ou adicione um novo modelo.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    modelosFiltrados.map((mod) => {
                      const marca = marcasMap.get(mod.marcaId);
                      return (
                        <tr key={mod.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="font-bold text-foreground">{mod.nome}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{mod.id}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-muted text-foreground border border-border/60">
                              {marca?.nome || mod.marcaId}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-xs font-semibold text-foreground">
                              {mod.categoriaSugerida.replace("PARTIU_", "Partiu ")}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-muted/60 text-foreground">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {mod.anoMinimo}+
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {mod.status === "HOMOLOGADO" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Homologado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                                Descontinuado
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAlternarStatusModelo(mod.id, mod.nome)}
                                title={mod.status === "HOMOLOGADO" ? "Descontinuar modelo" : "Homologar modelo"}
                                className="min-h-9 min-w-9 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                              >
                                {mod.status === "HOMOLOGADO" ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <X className="w-4 h-4 text-amber-500" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExcluirModelo(mod.id, mod.nome)}
                                title="Excluir modelo"
                                className="min-h-9 min-w-9 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIÇÃO DE TARIFAS DE CATEGORIA */}
      {/* ========================================================================= */}
      {modalEdicaoCategoria && catSelecionada && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {renderIconeCategoria(catSelecionada.icone)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">
                    Tarifas: {catSelecionada.nome}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Ajuste a composição de custos e o piso mínimo por corrida.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEdicaoCategoria(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicaoCategoria} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tarifa Base (R$)</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={formCatTarifaBase}
                    onChange={(e) => setFormCatTarifaBase(Number(e.target.value))}
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Preço por Km (R$)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    required
                    value={formCatPrecoKm}
                    onChange={(e) => setFormCatPrecoKm(Number(e.target.value))}
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Preço por Minuto (R$)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    required
                    value={formCatPrecoMinuto}
                    onChange={(e) => setFormCatPrecoMinuto(Number(e.target.value))}
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Tarifa Mínima Garantida (R$)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    value={formCatTarifaMinima}
                    onChange={(e) => setFormCatTarifaMinima(Number(e.target.value))}
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Multiplicador da Categoria</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={formCatMultiplicador}
                    onChange={(e) => setFormCatMultiplicador(Number(e.target.value))}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="font-mono font-bold text-sm text-primary w-14 text-right">
                    x{formCatMultiplicador.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60">
                <div>
                  <span className="text-xs font-bold text-foreground block">Modalidade Ativa</span>
                  <span className="text-[11px] text-muted-foreground">Exibir como opção de escolha aos passageiros</span>
                </div>
                <input
                  type="checkbox"
                  checked={formCatAtivo}
                  onChange={(e) => setFormCatAtivo(e.target.checked)}
                  className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setModalEdicaoCategoria(false)}
                  className="min-h-11 px-4 rounded-xl border border-border text-foreground font-semibold text-xs sm:text-sm hover:bg-accent transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Tarifas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA MARCA */}
      {/* ========================================================================= */}
      {modalNovaMarca && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">Nova Marca / Montadora</h2>
                  <p className="text-xs text-muted-foreground">Cadastre uma nova fabricante de veículos.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaMarca(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarMarca} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Nome da Marca</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: BYD, Chery, BMW"
                  value={formMarcaNome}
                  onChange={(e) => setFormMarcaNome(e.target.value)}
                  className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Tipo de Veículo Principal</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["CARRO", "MOTO", "VAN"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormMarcaTipo(t)}
                      className={`min-h-10 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        formMarcaTipo === t
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">País de Origem</label>
                <input
                  type="text"
                  placeholder="Ex: Japão, Alemanha, China"
                  value={formMarcaPais}
                  onChange={(e) => setFormMarcaPais(e.target.value)}
                  className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setModalNovaMarca(false)}
                  className="min-h-11 px-4 rounded-xl border border-border text-foreground font-semibold text-xs sm:text-sm hover:bg-accent transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Cadastrar Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO MODELO (1:N) */}
      {/* ========================================================================= */}
      {modalNovoModelo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">Novo Modelo de Veículo</h2>
                  <p className="text-xs text-muted-foreground">Homologue um modelo vinculado a uma marca.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoModelo(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarModelo} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Montadora (Marca)</label>
                  <select
                    required
                    value={formModeloMarcaId}
                    onChange={(e) => setFormModeloMarcaId(e.target.value)}
                    className="w-full min-h-11 h-11 px-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} ({m.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nome do Modelo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dolphin, Tracker, T-Cross"
                    value={formModeloNome}
                    onChange={(e) => setFormModeloNome(e.target.value)}
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Categoria Sugerida</label>
                  <select
                    value={formModeloSugestao}
                    onChange={(e) => setFormModeloSugestao(e.target.value as any)}
                    className="w-full min-h-11 h-11 px-3 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    <option value="PARTIU_CARRO">Partiu Carro (Pop)</option>
                    <option value="PARTIU_MOTO">Partiu Moto</option>
                    <option value="PARTIU_EXECUTIVO">Partiu Executivo (Black)</option>
                    <option value="PARTIU_ENTREGA">Partiu Entrega / Utilitário</option>
                    <option value="PARTIU_VAN">Partiu Van / Minibus</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Ano Mínimo de Fabricação</label>
                  <input
                    type="number"
                    min={2005}
                    max={2030}
                    value={formModeloAnoMinimo}
                    onChange={(e) => setFormModeloAnoMinimo(Number(e.target.value))}
                    className="w-full min-h-11 h-11 px-3.5 rounded-xl bg-background border border-border font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setModalNovoModelo(false)}
                  className="min-h-11 px-4 rounded-xl border border-border text-foreground font-semibold text-xs sm:text-sm hover:bg-accent transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Homologar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
