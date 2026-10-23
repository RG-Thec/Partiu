import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent, useMemo } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Flame,
  Image as ImageIcon,
  Layers,
  Plus,
  Radio,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Eye,
  Check,
  Tag,
  AlertTriangle,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  bannerService,
  type BannerItem,
  type BannerCategory,
} from "@/lib/ecosystem/banner-service";
import { useAdminCity } from "@/contexts/AdminCityContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export const Route = createFileRoute("/app/admin/banners")({
  head: () => ({
    meta: [
      { title: "Gerenciador de Banners do App | PARTIU Admin" },
      {
        name: "description",
        content:
          "Gerencie o carrossel de banners da tela inicial do aplicativo do passageiro em tempo real.",
      },
    ],
  }),
  component: AdminBannersPage,
});

const IMAGENS_PRESET = [
  {
    nome: "Carro Urbano",
    url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop&q=80",
  },
  {
    nome: "Entrega Flash",
    url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80",
  },
  {
    nome: "Motorista Parceiro",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
  },
  {
    nome: "Partiu Mulher",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
  },
  {
    nome: "Cidade Noturna",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80",
  },
];

export function AdminBannersPage() {
  const { pracaAtiva, isNacional: isContextNacional } = useAdminCity();
  const { isFranqueado, tenantId: authTenantId } = useAdminAuth();
  const isNacional = !isFranqueado && isContextNacional;
  const tenantAlvo = isFranqueado && authTenantId ? authTenantId : (!isNacional && pracaAtiva?.id !== "todas" ? pracaAtiva?.id : undefined);

  const [banners, setBanners] = useState<BannerItem[]>(() => bannerService.getAllBanners(tenantAlvo));

  useEffect(() => {
    setBanners(bannerService.getAllBanners(tenantAlvo));
  }, [tenantAlvo]);

  const [salvo, setSalvo] = useState(false);
  const [formAberto, setFormAberto] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<"ALL" | "PASSENGER" | "DRIVER">("ALL");

  // Simulador interativo
  const [slideSimuladorIdx, setSlideSimuladorIdx] = useState(0);
  const [autoPlaySimulador, setAutoPlaySimulador] = useState(true);

  // Formulário de novo banner
  const [categoria, setCategoria] = useState<BannerCategory>("PASSENGER");
  const [badge, setBadge] = useState("CORRIDAS COM DESCONTO");
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [extra, setExtra] = useState("Ar-condicionado garantido");
  const [imagem, setImagem] = useState(IMAGENS_PRESET[0]?.url ?? "");
  const [linkDestino, setLinkDestino] = useState("/app");
  const [validacaoDimensoes, setValidacaoDimensoes] = useState<{
    isValid: boolean;
    message: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
  } | null>(null);

  // Validação em tempo real de dimensões de imagem
  useEffect(() => {
    if (imagem && imagem.startsWith("http")) {
      void bannerService.validateBannerDimensions(imagem).then(setValidacaoDimensoes);
    } else {
      setValidacaoDimensoes(null);
    }
  }, [imagem]);

  // Inscrição reativa para sincronização com o banco
  useEffect(() => {
    return bannerService.subscribe(() => {
      setBanners(bannerService.getAllBanners(tenantAlvo));
    });
  }, [tenantAlvo]);

  // Banners ativos para o simulador
  const bannersAtivos = useMemo(() => {
    return banners.filter((b) => b.is_active);
  }, [banners]);

  // Rotação automática do simulador
  useEffect(() => {
    if (!autoPlaySimulador || bannersAtivos.length <= 1) return;
    const interval = setInterval(() => {
      setSlideSimuladorIdx((prev) => (prev + 1) % bannersAtivos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoPlaySimulador, bannersAtivos.length]);

  // Banners filtrados por categoria
  const bannersFiltrados = useMemo(() => {
    if (filtroCategoria === "ALL") return banners;
    return banners.filter((b) => b.category === filtroCategoria || b.category === "ALL");
  }, [banners, filtroCategoria]);

  async function handleCriarBanner(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !subtitulo.trim()) {
      toast.error("Preencha o título e subtítulo do banner.");
      return;
    }

    await bannerService.createBanner({
      title: titulo.trim(),
      subtitle: subtitulo.trim(),
      badge: badge.trim(),
      image_url: imagem || IMAGENS_PRESET[0]?.url || "",
      link_url: linkDestino,
      category: categoria,
      order_index: banners.length + 1,
      is_active: true,
      tenant_id: tenantAlvo || null,
    });

    setTitulo("");
    setSubtitulo("");
    setFormAberto(false);
    toast.success("Slide promocional publicado com sucesso!");
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  }

  async function toggleAtivo(id: string) {
    await bannerService.toggleBannerStatus(id);
    toast.success("Status do slide atualizado!");
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  async function removerBanner(id: string) {
    if (confirm("Tem certeza que deseja excluir este slide do carrossel?")) {
      await bannerService.deleteBanner(id);
      toast.success("Slide removido do carrossel.");
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    }
  }

  return (
    <div className="w-full space-y-6 pb-16">
      {/* 1. HEADER EXECUTIVO COM STATS RÁPIDOS (Linear/Stripe Style) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold tracking-wide uppercase mb-2">
            <ImageIcon className="w-3.5 h-3.5" />
            Marketing &amp; Campanhas no App
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Carrossel de Imagens do Passageiro
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Gerencie os slides promocionais dinâmicos exibidos na home do aplicativo. Sincronização
            em tempo real e visualização exata de como o usuário final enxerga.
          </p>
        </div>

        {/* CONTROLES E BOTÃO DE AÇÃO */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFormAberto(!formAberto)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition active:scale-95 cursor-pointer ${
              formAberto
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                : "bg-primary text-slate-950 hover:bg-primary/90"
            }`}
          >
            {formAberto ? (
              <>
                <X className="w-4 h-4" />
                Fechar Formulário
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Novo Slide Promocional
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. BARRA DE STATUS / KPIS COMPACTOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total de Slides
            </span>
            <span className="text-xl font-black text-white mt-0.5 block">{banners.length}</span>
          </div>
          <Layers className="w-6 h-6 text-slate-600" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Ativos no App
            </span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">
              {banners.filter((b) => b.is_active).length}
            </span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500/60" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pausados
            </span>
            <span className="text-xl font-black text-slate-400 mt-0.5 block">
              {banners.filter((b) => !b.is_active).length}
            </span>
          </div>
          <Pause className="w-6 h-6 text-slate-600" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Atualização
            </span>
            <span className="text-xs font-bold text-slate-200 mt-1 block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tempo Real D+0
            </span>
          </div>
          <Sparkles className="w-6 h-6 text-primary/60" />
        </div>
      </div>

      {/* 3. FORMULÁRIO COLAPSÁVEL DE NOVO BANNER (Não ocupa espaço permanentemente) */}
      {formAberto && (
        <form
          onSubmit={handleCriarBanner}
          className="p-6 rounded-2xl bg-slate-900/95 border border-primary/30 shadow-2xl space-y-5 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Criar &amp; Publicar Novo Slide</h2>
            </div>
            <button
              type="button"
              onClick={() => setFormAberto(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Badge Promocional
              </label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white border border-slate-700 focus:border-primary focus:outline-none"
              >
                <option value="CORRIDAS COM DESCONTO">CORRIDAS COM DESCONTO</option>
                <option value="ENTREGAS URBANAS FLASH">ENTREGAS URBANAS FLASH</option>
                <option value="MOTORISTAS & ENTREGADORES">MOTORISTAS &amp; ENTREGADORES</option>
                <option value="PARTIU MULHER">PARTIU MULHER (SEGURANÇA)</option>
                <option value="CASHBACK & BENEFÍCIOS">CASHBACK &amp; BENEFÍCIOS</option>
                <option value="NOVIDADES PARTIU">NOVIDADES PARTIU</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Público Alvo
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as BannerCategory)}
                className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white border border-slate-700 focus:border-primary focus:outline-none"
              >
                <option value="PASSENGER">Passageiro (Tela Inicial)</option>
                <option value="DRIVER">Motorista (Cockpit)</option>
                <option value="ALL">Ambos os Aplicativos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Destino ao Tocar
              </label>
              <select
                value={linkDestino}
                onChange={(e) => setLinkDestino(e.target.value)}
                className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white border border-slate-700 focus:border-primary focus:outline-none"
              >
                <option value="/app">Solicitar Corrida (/app)</option>
                <option value="/app/encomendas">PARTIU Entrega Flash (/app/encomendas)</option>
                <option value="/app/motorista">Cockpit do Motorista (/app/motorista)</option>
                <option value="/app/bilhetes">Histórico de Atividades (/app/bilhetes)</option>
                <option value="/app/perfil">Carteira &amp; Perfil (/app/perfil)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Título Principal
              </label>
              <input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Vá de Partiu com 20% OFF"
                className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs text-white border border-slate-700 focus:border-primary focus:outline-none placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Subtítulo / Descrição Curta
              </label>
              <input
                required
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Ex: Use o cupom PARTIU10 na sua próxima viagem"
                className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs text-white border border-slate-700 focus:border-primary focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* SELETOR DE IMAGENS PRESET COMPACTO */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Imagem do Banner (Presets de Alta Resolução ou URL Própria)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2.5">
              {IMAGENS_PRESET.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImagem(p.url)}
                  className={`p-1.5 rounded-xl border transition flex items-center gap-2 cursor-pointer ${
                    imagem === p.url
                      ? "bg-primary/20 border-primary text-white ring-1 ring-primary"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <img src={p.url} alt={p.nome} className="w-7 h-7 rounded-lg object-cover" />
                  <span className="text-[11px] font-bold truncate">{p.nome}</span>
                </button>
              ))}
            </div>

            <input
              value={imagem}
              onChange={(e) => setImagem(e.target.value)}
              placeholder="Ou cole a URL direta de uma imagem personalizada..."
              className="w-full rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-mono text-slate-300 border border-slate-800 focus:border-primary focus:outline-none placeholder:text-slate-600"
            />

            {validacaoDimensoes && (
              <div
                className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                  validacaoDimensoes.isValid
                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                    : "bg-amber-950/40 text-amber-300 border border-amber-800/60"
                }`}
              >
                <span>{validacaoDimensoes.isValid ? "✅" : "⚠️"}</span>
                <span>{validacaoDimensoes.message}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setFormAberto(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-primary text-slate-950 font-black text-xs shadow-md hover:bg-primary/90 transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Publicar Slide no Carrossel
            </button>
          </div>
        </form>
      )}

      {/* 4. WORKSPACE EM 2 COLUNAS: LISTA DE SLIDES (ESQ) + SIMULADOR AO VIVO (DIR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LISTA DE BANNERS CADASTRADOS (7/12 ou 8/12) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Slides no Carrossel ({bannersFiltrados.length})
              </h2>
            </div>

            {/* FILTROS DE SEGMENTO */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFiltroCategoria("ALL")}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  filtroCategoria === "ALL"
                    ? "bg-primary text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroCategoria("PASSENGER")}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  filtroCategoria === "PASSENGER"
                    ? "bg-primary text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Passageiro
              </button>
              <button
                type="button"
                onClick={() => setFiltroCategoria("DRIVER")}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  filtroCategoria === "DRIVER"
                    ? "bg-primary text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Motorista
              </button>
            </div>
          </div>

          {bannersFiltrados.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
              <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">
                Nenhum slide cadastrado nesta categoria.
              </p>
              <button
                onClick={() => setFormAberto(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-slate-950 font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar Primeiro Slide
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bannersFiltrados.map((banner, index) => (
                <div
                  key={banner.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-4 ${
                    banner.is_active
                      ? "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                      : "bg-slate-950/60 border-slate-900 opacity-60"
                  }`}
                >
                  {/* Thumbnail 16:9 Compacto */}
                  <div className="relative w-full sm:w-36 h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/80 text-[9px] font-black uppercase text-primary border border-white/10 backdrop-blur-xs">
                      #{banner.order_index || index + 1}
                    </span>
                  </div>

                  {/* Informações do Slide */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-black uppercase">
                        {banner.badge}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold uppercase">
                        {banner.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white truncate">{banner.title}</h3>
                    <p className="text-xs text-slate-400 truncate">{banner.subtitle}</p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                      <span>Destino:</span>
                      <span className="text-primary truncate">{banner.link_url}</span>
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <button
                      type="button"
                      onClick={() => toggleAtivo(banner.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer w-full sm:w-auto text-center ${
                        banner.is_active
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                      }`}
                    >
                      {banner.is_active ? "● Ativo no App" : "○ Pausado"}
                    </button>

                    <button
                      type="button"
                      onClick={() => removerBanner(banner.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
                      title="Excluir Slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIMULADOR AO VIVO DO CARROSSEL NO APP (5/12 ou 4/12) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 sticky top-6">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Simulador Mobile ao Vivo
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setAutoPlaySimulador(!autoPlaySimulador)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
            >
              {autoPlaySimulador ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {autoPlaySimulador ? "Pausar" : "Girar"}
            </button>
          </div>

          {/* MOCKUP DO CELULAR */}
          <div className="mx-auto max-w-[310px] rounded-[36px] bg-slate-950 p-3.5 border-4 border-slate-800 shadow-2xl space-y-3">
            {/* Barra de Status do Celular */}
            <div className="flex items-center justify-between px-3 text-[10px] text-slate-400 font-mono">
              <span>09:41</span>
              <div className="w-16 h-3.5 bg-slate-900 rounded-full border border-slate-800 mx-auto" />
              <div className="flex items-center gap-1">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Cabeçalho do App Simulado */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Praça Ativa</span>
                <span className="text-xs font-bold text-white">PARTIU Cidade</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* CARROSSEL REAL EM AÇÃO */}
            {bannersAtivos.length > 0 ? (
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner group">
                {(() => {
                  const bAtual = bannersAtivos[slideSimuladorIdx % bannersAtivos.length];
                  return (
                    <div
                      key={bAtual.id}
                      className="relative w-full h-full animate-in fade-in duration-300"
                    >
                      <img
                        src={bAtual.image_url}
                        alt={bAtual.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3.5 flex flex-col justify-between text-white">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full bg-primary text-slate-950 font-black text-[9px] uppercase tracking-wider">
                            {bAtual.badge}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white backdrop-blur-xs">
                            {(slideSimuladorIdx % bannersAtivos.length) + 1}/{bannersAtivos.length}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-white leading-tight drop-shadow-md">
                            {bAtual.title}
                          </h4>
                          <p className="text-[10px] text-slate-200 mt-0.5 line-clamp-1 drop-shadow">
                            {bAtual.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Controles de Navegação do Carrossel */}
                {bannersAtivos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideSimuladorIdx(
                          (prev) => (prev - 1 + bannersAtivos.length) % bannersAtivos.length,
                        )
                      }
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSlideSimuladorIdx((prev) => (prev + 1) % bannersAtivos.length)
                      }
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {/* Indicadores (Dots) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  {bannersAtivos.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all ${
                        i === slideSimuladorIdx % bannersAtivos.length
                          ? "w-4 bg-primary"
                          : "w-1 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs p-4 text-center">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                Nenhum banner ativo para exibição no carrossel.
              </div>
            )}

            {/* Simulação de Ações do Passageiro */}
            <div className="space-y-2 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Onde você quer ir hoje?</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-center">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white">
                  🚗 Viagem Pop
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white">
                  📦 Entrega Flash
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
