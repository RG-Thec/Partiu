import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Layers,
  Megaphone,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Ticket,
  Trash2,
  Upload,
  X,
  Zap,
  Globe,
  Building2,
  Save,
  Star,
} from "lucide-react";
import {
  bannerService,
  type BannerItem as EcosystemBannerItem,
} from "@/lib/ecosystem/banner-service";
import {
  type CmsLandingExtendedData,
  carregarCmsLandingData,
  salvarCmsLandingData,
  restaurarCmsLandingPadrao,
} from "@/lib/cms-landing-service";
import { couponService, type ActiveCoupon } from "@/services/CouponService";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing, Banners Mobile, Cupons & CMS | PARTIU Admin" },
      {
        name: "description",
        content:
          "Gestão de banners com validação rigorosa de aspect ratio e peso mobile, cupons de desconto, disparos de notificações push e CMS da Landing Page.",
      },
    ],
  }),
  component: MarketingAdminPage,
});

type AbaMarketing = "banners" | "cupons" | "push" | "cms_landing";

interface BannerItem {
  id: string;
  titulo: string;
  subtitulo: string;
  imagemUrl: string;
  linkDestino: string;
  aspectRatio: string;
  pesoKb: number;
  dimensoes: string;
  ativo: boolean;
  ordem: number;
}

export function MarketingAdminPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaMarketing>("banners");
  const [banners, setBanners] = useState<EcosystemBannerItem[]>(() => bannerService.getAllBanners());

  useEffect(() => {
    const unsub = bannerService.subscribe((list) => {
      setBanners(list);
    });
    return () => unsub();
  }, []);

  // Cupons promocionais sincronizados com Supabase e LocalStorage
  const [cupons, setCupons] = useState<ActiveCoupon[]>([]);
  const [carregandoCupons, setCarregandoCupons] = useState(false);

  const carregarCupons = async () => {
    setCarregandoCupons(true);
    try {
      const lista = await couponService.listAdminCoupons();
      setCupons(lista);
    } finally {
      setCarregandoCupons(false);
    }
  };

  useEffect(() => {
    void carregarCupons();
    const handleUpdate = () => {
      void carregarCupons();
    };
    window.addEventListener("partiu:cupons-atualizados", handleUpdate);
    return () => window.removeEventListener("partiu:cupons-atualizados", handleUpdate);
  }, []);

  // Modal de Novo Banner e Validação Rígida Mobile
  const [modalBannerAberto, setModalBannerAberto] = useState(false);
  const [novoTituloBanner, setNovoTituloBanner] = useState("");
  const [novoSubtituloBanner, setNovoSubtituloBanner] = useState("");
  const [novoLinkBanner, setNovoLinkBanner] = useState("");
  const [arquivoBanner, setArquivoBanner] = useState<File | null>(null);
  const [previewBannerUrl, setPreviewBannerUrl] = useState<string | null>(null);
  const [validacaoErro, setValidacaoErro] = useState<string | null>(null);
  const [validacaoInfo, setValidacaoInfo] = useState<{
    largura: number;
    altura: number;
    aspectRatio: number;
    tamanhoKb: number;
  } | null>(null);

  // Modal de Novo Cupom
  const [modalCupomAberto, setModalCupomAberto] = useState(false);
  const [novoCupomCodigo, setNovoCupomCodigo] = useState("");
  const [novoCupomDescricao, setNovoCupomDescricao] = useState("");
  const [novoCupomTipo, setNovoCupomTipo] = useState<"porcentagem" | "fixo">("porcentagem");
  const [novoCupomValor, setNovoCupomValor] = useState("10");
  const [novoCupomLimite, setNovoCupomLimite] = useState("100");
  const [novoCupomValidade, setNovoCupomValidade] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [salvandoCupom, setSalvandoCupom] = useState(false);

  // Estados da Notificação Push (Campanhas futuras)
  const [pushTitulo, setPushTitulo] = useState("Sua próxima corrida tem desconto especial!");
  const [pushMensagem, setPushMensagem] = useState("Abra o app PARTIU agora e aproveite 15% OFF em todas as viagens de carro e moto até às 20h.");
  const [pushPublico, setPushPublico] = useState<"TODOS" | "PASSAGEIROS" | "MOTORISTAS">("PASSAGEIROS");
  const [pushCidade, setPushCidade] = useState("Todas as Cidades");
  const [pushAgendamento, setPushAgendamento] = useState("IMEDIATO");

  // Estados do Módulo 9: CMS da Landing Page
  const [cmsData, setCmsData] = useState<CmsLandingExtendedData>(() => carregarCmsLandingData());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function mostrarToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  function handleSalvarCms(e: React.FormEvent) {
    e.preventDefault();
    salvarCmsLandingData(cmsData);
    mostrarToast("Conteúdo da Landing Page atualizado com sucesso!");
  }

  function handleRestaurarCms() {
    if (window.confirm("Deseja restaurar os textos e seções padrão de fábrica da Landing Page?")) {
      const reset = restaurarCmsLandingPadrao();
      setCmsData(reset);
      mostrarToast("Landing Page restaurada para o padrão oficial!");
    }
  }

  /**
   * VALIDAÇÃO OBRIGATÓRIA DE BANNERS ANTES DO UPLOAD
   * Verifica:
   * 1. Peso: máximo 1 MB (ideal < 500 KB)
   * 2. Largura mínima: 600 px
   * 3. Proporção (Aspect Ratio): entre 1.20 e 2.40 (padrão mobile 16:9 a 4:3, recomendado 800x450px a 800x600px)
   */
  function handleArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    setValidacaoErro(null);
    setValidacaoInfo(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validar Tipo de Arquivo
    if (!file.type.startsWith("image/")) {
      setValidacaoErro("O arquivo selecionado não é uma imagem válida.");
      return;
    }

    // 2. Validar Peso Máximo (1 MB)
    const tamanhoKb = Math.round(file.size / 1024);
    if (tamanhoKb > 1024) {
      setValidacaoErro(`Imagem muito pesada (${tamanhoKb} KB). O limite máximo permitido para dispositivos móveis é 1024 KB (1 MB).`);
      return;
    }

    // 3. Inspecionar Dimensões & Aspect Ratio
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      const largura = img.naturalWidth;
      const altura = img.naturalHeight;
      const ratio = largura / altura;

      setValidacaoInfo({
        largura,
        altura,
        aspectRatio: Number(ratio.toFixed(2)),
        tamanhoKb,
      });

      // Validação de Largura Mínima
      if (largura < 600) {
        setValidacaoErro(`Largura insuficiente (${largura}px). Mínimo recomendado: 600px para nitidez em telas Retina/OLED.`);
        return;
      }

      // Validação de Aspect Ratio (16:9 ~ 1.78 a 4:3 ~ 1.33 com tolerância 1.20 a 2.40)
      if (ratio < 1.2 || ratio > 2.4) {
        setValidacaoErro(`Proporção inadequada (${ratio.toFixed(2)}:1). Para o carrossel mobile, use proporções entre 4:3 (1.33) e 16:9 (1.78), recomendado 800x450px a 800x600px. Evite imagens verticais ou panorâmicas extremas.`);
        return;
      }

      setArquivoBanner(file);
      setPreviewBannerUrl(objectUrl);
    };
  }

  async function handleSalvarBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!previewBannerUrl || validacaoErro) return;

    await bannerService.createBanner({
      title: novoTituloBanner || "Banner Promocional",
      subtitle: novoSubtituloBanner || "",
      image_url: previewBannerUrl,
      link_url: novoLinkBanner || "/app",
      category: "PASSENGER",
      badge: "DESTAQUE",
      is_active: true,
      order_index: banners.length + 1,
    });

    setModalBannerAberto(false);
    setNovoTituloBanner("");
    setNovoSubtituloBanner("");
    setNovoLinkBanner("");
    setArquivoBanner(null);
    setPreviewBannerUrl(null);
  }

  async function handleSalvarCupom(e: React.FormEvent) {
    e.preventDefault();
    if (!novoCupomCodigo.trim()) return;

    setSalvandoCupom(true);
    try {
      await couponService.saveAdminCoupon({
        codigo: novoCupomCodigo.trim().toUpperCase(),
        descricao: novoCupomDescricao.trim() || undefined,
        tipo: novoCupomTipo,
        valor: Number(novoCupomValor) || 5,
        maxRedemptions: Number(novoCupomLimite) || 100,
        validoAte: novoCupomValidade,
        ativo: true,
      });

      toast.success(`Cupom ${novoCupomCodigo.trim().toUpperCase()} cadastrado e sincronizado com sucesso!`);
      setModalCupomAberto(false);
      setNovoCupomCodigo("");
      setNovoCupomDescricao("");
      setNovoCupomValor("10");
      setNovoCupomLimite("100");
      void carregarCupons();
    } catch (err: any) {
      console.error("[Marketing] Erro ao salvar cupom:", err);
      toast.error("Não foi possível salvar o cupom promocional.");
    } finally {
      setSalvandoCupom(false);
    }
  }

  async function handleToggleCupom(codigo: string, statusAtual: boolean) {
    try {
      await couponService.toggleAdminCoupon(codigo, !statusAtual);
      toast.success(`Cupom ${codigo} ${!statusAtual ? "ativado" : "desativado"} com sucesso.`);
      void carregarCupons();
    } catch {
      toast.error("Erro ao alterar status do cupom.");
    }
  }

  async function handleExcluirCupom(codigo: string) {
    if (!confirm(`Deseja realmente remover o cupom ${codigo}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await couponService.deleteAdminCoupon(codigo);
      toast.success(`Cupom ${codigo} removido com sucesso.`);
      void carregarCupons();
    } catch {
      toast.error("Erro ao remover cupom.");
    }
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-20">
      {/* 1. Header Executivo Marketing */}
      <div className="rounded-2xl bg-slate-950 p-5 sm:p-6 text-white shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0088FF]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0088FF] border border-[#0088FF]/30 mb-2">
              <Megaphone className="h-3.5 w-3.5 text-[#0088FF]" />
              <span>Crescimento, Atração &amp; Retenção Urbana</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              Marketing, <span className="text-[#0088FF]">Banners &amp; Cupons</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed mt-1">
              Controle dos banners exibidos nos apps de passageiro e motorista com validação rigorosa de peso, cupons e campanhas de engajamento.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Barra de Abas (Banners Mobile | Cupons | Notificações Push) */}
      <div className="flex items-center gap-2 p-1.5 sm:p-2 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm max-w-fit overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setAbaAtiva("banners")}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            abaAtiva === "banners" ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[#0088FF]" />
          <span>Banners Mobile</span>
          <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-white font-bold">
            {banners.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("cupons")}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            abaAtiva === "cupons" ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-[#0088FF]" />
          <span>Gestão de Cupons</span>
          <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-white font-bold">
            {cupons.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("push")}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            abaAtiva === "push" ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#0088FF]" />
          <span>Campanhas Push (FCM)</span>
          <span className="ml-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            Planejador
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("cms_landing")}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            abaAtiva === "cms_landing"
              ? "bg-slate-950 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-[#0088FF]" />
          <span>CMS Landing Page</span>
          <span className="ml-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
            Público
          </span>
        </button>
      </div>

      {/* 3. ABA 1: BANNERS MOBILE */}
      {abaAtiva === "banners" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Banners Ativos no Aplicativo</h2>
              <p className="text-xs text-slate-500">Exibição sincronizada em tempo real com o app do passageiro.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/app/admin/banners"
                className="flex h-11 items-center gap-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <ExternalLink className="h-4 w-4 text-slate-500" />
                <span>Gerenciador Avançado</span>
              </Link>
              <button
                type="button"
                onClick={() => setModalBannerAberto(true)}
                className="flex h-11 items-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-4 text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4 text-[#0088FF]" />
                <span>Novo Banner Mobile</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img
                      src={b.image_url}
                      alt={b.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-black">
                        {b.badge || "DESTAQUE"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/90 text-white text-[10px] font-black">
                        #{b.order_index}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <h3 className="text-sm font-black text-slate-900 leading-tight">{b.title}</h3>
                    <p className="text-xs text-slate-500 leading-snug">{b.subtitle || "Sem descrição"}</p>
                    <p className="text-[11px] font-mono text-slate-400 pt-1 truncate">
                      Link: {b.link_url}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await bannerService.toggleBannerStatus(b.id);
                    }}
                    className={`text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-colors ${
                      b.is_active ? "text-emerald-600 hover:text-emerald-700" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <span>{b.is_active ? "● Ativo no App" : "○ Desativado"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm("Deseja realmente remover este banner do aplicativo?")) {
                        await bannerService.deleteBanner(b.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    title="Excluir Banner"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ABA 2: GESTÃO DE CUPONS */}
      {abaAtiva === "cupons" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Cupons Promocionais</h2>
              <p className="text-xs text-slate-500">Códigos de desconto para ativação e retenção de passageiros.</p>
            </div>
            <button
              type="button"
              onClick={() => setModalCupomAberto(true)}
              className="flex h-11 items-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-4 text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#0088FF]" />
              <span>Criar Novo Cupom</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-4">Código</th>
                    <th className="p-4">Descrição &amp; Desconto</th>
                    <th className="p-4">Usos / Limite</th>
                    <th className="p-4">Validade</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {carregandoCupons ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                        Carregando cupons promocionais...
                      </td>
                    </tr>
                  ) : cupons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Nenhum cupom cadastrado no momento. Clique em <strong>Criar Novo Cupom</strong> para começar.
                      </td>
                    </tr>
                  ) : (
                    cupons.map((c) => {
                      const limite = c.maxRedemptions || 1000;
                      const usos = c.redeemedCount || 0;
                      const percentUsado = Math.min(100, Math.round((usos / limite) * 100));

                      return (
                        <tr key={c.id || c.codigo} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <span className="font-mono font-black text-sm px-2.5 py-1 bg-primary-50 text-yellow-950 border border-primary-500 rounded-lg">
                              {c.codigo}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">
                              {c.tipo === "porcentagem" ? `${c.valor}% OFF` : `R$ ${Number(c.valor).toFixed(2).replace(".", ",")} OFF`}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate max-w-xs">
                              {c.descontoDescricao}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1 max-w-[120px]">
                              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                <span>{usos}</span>
                                <span>{limite}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-slate-900 rounded-full"
                                  style={{ width: `${percentUsado}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-slate-600">{c.expiracao}</td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => void handleToggleCupom(c.codigo, c.ativo)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer transition-all ${
                                c.ativo
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                              title={c.ativo ? "Clique para desativar" : "Clique para ativar"}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${c.ativo ? "bg-emerald-600 animate-pulse" : "bg-slate-400"}`} />
                              <span>{c.ativo ? "Ativo" : "Inativo"}</span>
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(c.codigo);
                                  toast.success(`Código ${c.codigo} copiado!`);
                                }}
                                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                                title="Copiar Código"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleExcluirCupom(c.codigo)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Excluir Cupom"
                              >
                                <Trash2 className="h-4 w-4" />
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

      {/* 5. ABA 3: NOTIFICAÇÕES PUSH (PREPARADOR DE CAMPANHAS) */}
      {abaAtiva === "push" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-black text-slate-900">Configurar Campanha de Notificação Push</h2>
              <p className="text-xs text-slate-500">
                Dispare avisos promocionais, alertas climáticos ou cupons diretamente na barra de notificações dos usuários.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Título da Notificação:</label>
                  <input
                    type="text"
                    value={pushTitulo}
                    onChange={(e) => setPushTitulo(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mensagem (Corpo do Push):</label>
                  <textarea
                    rows={3}
                    value={pushMensagem}
                    onChange={(e) => setPushMensagem(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-slate-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Público-Alvo:</label>
                    <select
                      value={pushPublico}
                      onChange={(e: any) => setPushPublico(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="PASSAGEIROS">Passageiros (Todos)</option>
                      <option value="MOTORISTAS">Motoristas Parceiros</option>
                      <option value="TODOS">Toda a Base</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cidade:</label>
                    <select
                      value={pushCidade}
                      onChange={(e) => setPushCidade(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Todas as Cidades">Todas as Cidades</option>
                      <option value="Operação Principal">Operação Principal</option>
                      <option value="Região Metropolitana">Região Metropolitana</option>
                      <option value="Interior e Polos Regionais">Interior e Polos Regionais</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert("Estrutura de push registrada no plano operacional! O serviço de envio será conectado ao Firebase Cloud Messaging (FCM) no módulo de infraestrutura.");
                    }}
                    className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Send className="h-4 w-4 text-[#0088FF]" />
                    <span>Salvar Campanha de Push</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Simulador Smartphone (Visualização do Push em Tempo Real) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-sm rounded-[40px] bg-slate-900 p-4 shadow-2xl border-4 border-slate-800 text-white">
              <div className="mx-auto h-4 w-28 rounded-full bg-slate-800 mb-6" />

              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-light">14:45</p>
                  <p className="text-xs text-slate-400">Segunda-feira, 9 de setembro</p>
                </div>

                {/* Card do Push no Smartphone */}
                <div className="p-3.5 rounded-2xl bg-slate-800/90 backdrop-blur-md border border-slate-700/80 shadow-lg space-y-1 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-md bg-[#0088FF] flex items-center justify-center">
                        <Zap className="h-2.5 w-2.5 text-slate-950 fill-slate-950" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">PARTIU</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Agora</span>
                  </div>
                  <p className="text-xs font-black text-white leading-tight">{pushTitulo}</p>
                  <p className="text-[11px] text-slate-300 leading-snug">{pushMensagem}</p>
                </div>
              </div>

              <div className="mx-auto h-1 w-24 rounded-full bg-slate-700 mt-20 mb-2" />
            </div>
          </div>
        </div>
      )}

      {/* 5. ABA 4: CMS DA LANDING PAGE INSTITUCIONAL */}
      {abaAtiva === "cms_landing" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header com Ações da Landing */}
          <div className="bg-gradient-to-r from-blue-600/15 via-indigo-500/10 to-transparent border border-blue-600/30 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 fill-current" />
                Módulo 9 • CMS Público da Landing Page
              </div>
              <h2 className="text-xl font-black text-slate-950">
                Gestão de Conteúdo da Landing Page Institucional
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl">
                Personalize em tempo real a página pública inicial (Hero, benefícios, apelo para motoristas e passageiros, soluções corporativas B2B e depoimentos). As alterações refletem imediatamente na raiz do site.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-xs"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>Ver Landing Page</span>
              </a>
              <button
                type="button"
                onClick={handleRestaurarCms}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Restaurar Padrão
              </button>
            </div>
          </div>

          <form onSubmit={handleSalvarCms} className="space-y-6">
            {/* SEÇÃO 1: HERO (TOPO) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  1. Seção Hero (Chamada Principal)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                  Primeira Dobra
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Kicker / Tag de Localização (Chip Superior)
                    </label>
                    <input
                      type="text"
                      value={cmsData.hero?.locationChipText || ""}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, locationChipText: e.target.value },
                        }))
                      }
                      placeholder="Ex: Disponível na sua região"
                      className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Título de Impacto (Headline)
                    </label>
                    <input
                      type="text"
                      value={cmsData.hero?.headline || ""}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, headline: e.target.value },
                        }))
                      }
                      placeholder="Ex: Vá de Partiu com rapidez e preço justo"
                      className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Subtítulo / Descrição da Proposta de Valor
                    </label>
                    <textarea
                      rows={3}
                      value={cmsData.hero?.description || ""}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, description: e.target.value },
                        }))
                      }
                      placeholder="Ex: Conectamos você ao seu destino com segurança, conforto e rapidez. Carros e motos em poucos minutos."
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      URL da Imagem do Veículo / Mockup
                    </label>
                    <input
                      type="text"
                      value={cmsData.hero?.carImageUrl || ""}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, carImageUrl: e.target.value },
                        }))
                      }
                      placeholder="https://... ou caminho relativo"
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Imagem de Fundo Opcional (Skyline / Cidade)
                    </label>
                    <input
                      type="text"
                      value={cmsData.hero?.cityBackgroundImageUrl || ""}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, cityBackgroundImageUrl: e.target.value },
                        }))
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-mono"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <span className="font-bold text-slate-700 block">Dica de Responsividade:</span>
                    <p>A imagem do veículo se ajusta automaticamente entre desktop e telas compactas. Recomendamos imagens em formato PNG com transparência ou WebP leve.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: EMPRESAS & B2B */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  2. Ecossistema B2B & Convênios Empresariais
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                  Portal Corporativo
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Título da Seção Corporativa
                    </label>
                    <input
                      type="text"
                      value={cmsData.b2bSection?.titulo || ""}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          b2bSection: {
                            ...(prev.b2bSection || {
                              subtitulo: "",
                              descricao: "",
                              ctaTexto: "",
                              ctaUrl: "",
                              beneficios: [],
                            }),
                            titulo: e.target.value,
                          },
                        }))
                      }
                      className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Subtítulo / Proposta B2B
                    </label>
                    <input
                      type="text"
                      value={cmsData.b2bSection?.subtitulo || ""}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          b2bSection: {
                            ...(prev.b2bSection || {
                              titulo: "",
                              descricao: "",
                              ctaTexto: "",
                              ctaUrl: "",
                              beneficios: [],
                            }),
                            subtitulo: e.target.value,
                          },
                        }))
                      }
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Descrição do Serviço Empresarial
                    </label>
                    <textarea
                      rows={3}
                      value={cmsData.b2bSection?.descricao || ""}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          b2bSection: {
                            ...(prev.b2bSection || {
                              titulo: "",
                              subtitulo: "",
                              ctaTexto: "",
                              ctaUrl: "",
                              beneficios: [],
                            }),
                            descricao: e.target.value,
                          },
                        }))
                      }
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Texto do Botão B2B
                      </label>
                      <input
                        type="text"
                        value={cmsData.b2bSection?.ctaTexto || ""}
                        onChange={(e) =>
                          setCmsData((prev) => ({
                            ...prev,
                            b2bSection: {
                              ...(prev.b2bSection || {
                                titulo: "",
                                subtitulo: "",
                                descricao: "",
                                ctaUrl: "",
                                beneficios: [],
                              }),
                              ctaTexto: e.target.value,
                            },
                          }))
                        }
                        className="w-full text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Link de Destino B2B
                      </label>
                      <input
                        type="text"
                        value={cmsData.b2bSection?.ctaUrl || ""}
                        onChange={(e) =>
                          setCmsData((prev) => ({
                            ...prev,
                            b2bSection: {
                              ...(prev.b2bSection || {
                                titulo: "",
                                subtitulo: "",
                                descricao: "",
                                ctaTexto: "",
                                beneficios: [],
                              }),
                              ctaUrl: e.target.value,
                            },
                          }))
                        }
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Benefícios Exibidos no Card (Um por linha)
                    </label>
                    <textarea
                      rows={4}
                      value={(cmsData.b2bSection?.beneficios || []).join("\n")}
                      onChange={(e) =>
                        setCmsData((prev) => ({
                          ...prev,
                          b2bSection: {
                            ...(prev.b2bSection || {
                              titulo: "",
                              subtitulo: "",
                              descricao: "",
                              ctaTexto: "",
                              ctaUrl: "",
                            }),
                            beneficios: e.target.value.split("\n").filter((l) => l.trim().length > 0),
                          },
                        }))
                      }
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: PROVA SOCIAL & DEPOIMENTOS */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  3. Prova Social & Números de Destaque
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                  Credibilidade
                </span>
              </div>

              {/* 4 KPIs de Destaque */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(cmsData.socialProof?.metricas || []).map((m, idx) => (
                  <div key={m.id || idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <input
                      type="text"
                      value={m.valor}
                      onChange={(e) => {
                        const next = [...(cmsData.socialProof?.metricas || [])];
                        next[idx] = { ...next[idx], valor: e.target.value };
                        setCmsData((prev) => ({
                          ...prev,
                          socialProof: { ...(prev.socialProof || { depoimentos: [] }), metricas: next },
                        }));
                      }}
                      className="w-full text-lg font-black text-slate-950 bg-white border border-slate-200 rounded-lg px-2 py-1"
                    />
                    <input
                      type="text"
                      value={m.rotulo}
                      onChange={(e) => {
                        const next = [...(cmsData.socialProof?.metricas || [])];
                        next[idx] = { ...next[idx], rotulo: e.target.value };
                        setCmsData((prev) => ({
                          ...prev,
                          socialProof: { ...(prev.socialProof || { depoimentos: [] }), metricas: next },
                        }));
                      }}
                      className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-0.5"
                    />
                  </div>
                ))}
              </div>

              {/* Depoimentos */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  Depoimentos em Destaque (Passageiros, Motoristas e Empresas)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(cmsData.socialProof?.depoimentos || []).map((d, dIdx) => (
                    <div key={d.id || dIdx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={d.fotoUrl}
                          alt={d.nome}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={d.nome}
                            onChange={(e) => {
                              const next = [...(cmsData.socialProof?.depoimentos || [])];
                              next[dIdx] = { ...next[dIdx], nome: e.target.value };
                              setCmsData((prev) => ({
                                ...prev,
                                socialProof: { ...(prev.socialProof || { metricas: [] }), depoimentos: next },
                              }));
                            }}
                            className="w-full text-xs font-bold text-slate-950 bg-white border border-slate-200 rounded px-1.5 py-0.5"
                          />
                          <input
                            type="text"
                            value={d.cidade}
                            onChange={(e) => {
                              const next = [...(cmsData.socialProof?.depoimentos || [])];
                              next[dIdx] = { ...next[dIdx], cidade: e.target.value };
                              setCmsData((prev) => ({
                                ...prev,
                                socialProof: { ...(prev.socialProof || { metricas: [] }), depoimentos: next },
                              }));
                            }}
                            className="w-full text-[10px] text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5 mt-0.5"
                          />
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        value={d.comentario}
                        onChange={(e) => {
                          const next = [...(cmsData.socialProof?.depoimentos || [])];
                          next[dIdx] = { ...next[dIdx], comentario: e.target.value };
                          setCmsData((prev) => ({
                            ...prev,
                            socialProof: { ...(prev.socialProof || { metricas: [] }), depoimentos: next },
                          }));
                        }}
                        className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg p-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOTÃO DE SALVAR CMS */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Salvar e Publicar na Landing Page</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL NOVO BANNER COM VALIDAÇÃO RÍGIDA */}
      {modalBannerAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <ImageIcon className="h-5 w-5 text-primary-600" />
                <h3 className="text-base font-black">Upload de Banner Mobile</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalBannerAberto(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarBanner} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corrida com Desconto no Almoço"
                  value={novoTituloBanner}
                  onChange={(e) => setNovoTituloBanner(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-slate-950"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtítulo (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ex: Válido até às 14h em toda a cidade"
                  value={novoSubtituloBanner}
                  onChange={(e) => setNovoSubtituloBanner(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-slate-950"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Link de Destino / Ação:</label>
                <input
                  type="text"
                  placeholder="/app/encomendas ou https://..."
                  value={novoLinkBanner}
                  onChange={(e) => setNovoLinkBanner(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-slate-950"
                />
              </div>

              {/* Upload com Validação Obrigatória */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Arquivo de Imagem (Recomendado: 800x450px a 800x600px - Proporção 16:9 a 4:3, máx 1 MB):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleArquivoSelecionado}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />
              </div>

              {/* Alerta de Validação de Imagem */}
              {validacaoErro && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="font-bold text-xs">{validacaoErro}</p>
                </div>
              )}

              {validacaoInfo && !validacaoErro && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">Imagem aprovada para o carrossel mobile!</p>
                    <p className="text-[11px] text-emerald-800">
                      Dimensões: {validacaoInfo.largura}x{validacaoInfo.altura}px | Aspect: {validacaoInfo.aspectRatio}:1 | Peso: {validacaoInfo.tamanhoKb} KB
                    </p>
                  </div>
                </div>
              )}

              {previewBannerUrl && !validacaoErro && (
                <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-inner">
                  <img src={previewBannerUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-mono">
                    Pré-visualização Mobile (cover)
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalBannerAberto(false)}
                  className="h-11 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!previewBannerUrl || !!validacaoErro}
                  className="h-11 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Publicar Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO CUPOM */}
      {modalCupomAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <Ticket className="h-5 w-5 text-primary-600" />
                <h3 className="text-base font-black">Criar Cupom de Desconto</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalCupomAberto(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarCupom} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código do Cupom:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PARTIU10"
                  value={novoCupomCodigo}
                  onChange={(e) => setNovoCupomCodigo(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-slate-950"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição Promocional (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ex: R$ 10 OFF em corridas urbanas"
                  value={novoCupomDescricao}
                  onChange={(e) => setNovoCupomDescricao(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo:</label>
                  <select
                    value={novoCupomTipo}
                    onChange={(e: any) => setNovoCupomTipo(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="porcentagem">Percentual (%)</option>
                    <option value="fixo">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {novoCupomTipo === "porcentagem" ? "Desconto (%)" : "Desconto (R$)"}:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    min="1"
                    value={novoCupomValor}
                    onChange={(e) => setNovoCupomValor(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Limite de Usos:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={novoCupomLimite}
                    onChange={(e) => setNovoCupomLimite(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Válido Até:</label>
                  <input
                    type="date"
                    required
                    value={novoCupomValidade}
                    onChange={(e) => setNovoCupomValidade(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  disabled={salvandoCupom}
                  onClick={() => setModalCupomAberto(false)}
                  className="h-11 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoCupom}
                  className="h-11 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{salvandoCupom ? "Salvando..." : "Salvar Cupom"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
