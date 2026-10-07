import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
import { useBanners } from "@/lib/partiu-db";
import {
  type CmsLandingExtendedData,
  carregarCmsLandingData,
  salvarCmsLandingData,
  restaurarCmsLandingPadrao,
} from "@/lib/cms-landing-service";

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

interface CupomItem {
  id: string;
  codigo: string;
  tipo: "PERCENTUAL" | "VALOR_FIXO";
  valor: number;
  limiteUsos: number;
  usosAtuais: number;
  validoAte: string;
  status: "ATIVO" | "EXPIRADO" | "ESGOTADO";
}

export function MarketingAdminPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaMarketing>("banners");
  const { data: bannersBanco = [] } = useBanners();

  // Banners com dados reais e fallback
  const [banners, setBanners] = useState<BannerItem[]>([
    {
      id: "ban_01",
      titulo: "Partiu Flash: Entregas Expressas",
      subtitulo: "Envie encomendas pela cidade a partir de R$ 7,50",
      imagemUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80",
      linkDestino: "/app/encomendas",
      aspectRatio: "16:9",
      pesoKb: 142,
      dimensoes: "800x450 px",
      ativo: true,
      ordem: 1,
    },
    {
      id: "ban_02",
      titulo: "Desconto de 20% na Primeira Corrida",
      subtitulo: "Use o cupom BEMVINDO e viaje com segurança",
      imagemUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&auto=format&fit=crop&q=80",
      linkDestino: "/app/perfil",
      aspectRatio: "16:9",
      pesoKb: 198,
      dimensoes: "800x450 px",
      ativo: true,
      ordem: 2,
    },
  ]);

  // Cupons promocionais
  const [cupons, setCupons] = useState<CupomItem[]>([
    {
      id: "cup_01",
      codigo: "BEMVINDO20",
      tipo: "PERCENTUAL",
      valor: 20,
      limiteUsos: 500,
      usosAtuais: 184,
      validoAte: "31/12/2026",
      status: "ATIVO",
    },
    {
      id: "cup_02",
      codigo: "PARTIU5",
      tipo: "VALOR_FIXO",
      valor: 5,
      limiteUsos: 1000,
      usosAtuais: 720,
      validoAte: "30/11/2026",
      status: "ATIVO",
    },
    {
      id: "cup_03",
      codigo: "FLASHMOTO",
      tipo: "PERCENTUAL",
      valor: 15,
      limiteUsos: 200,
      usosAtuais: 200,
      validoAte: "15/10/2026",
      status: "ESGOTADO",
    },
  ]);

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
  const [novoCupomTipo, setNovoCupomTipo] = useState<"PERCENTUAL" | "VALOR_FIXO">("PERCENTUAL");
  const [novoCupomValor, setNovoCupomValor] = useState("10");
  const [novoCupomLimite, setNovoCupomLimite] = useState("100");
  const [novoCupomValidade, setNovoCupomValidade] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));

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
   * 2. Largura mínima: 640 px
   * 3. Proporção (Aspect Ratio): entre 1.6 e 2.2 (padrão mobile 16:9 a 2:1)
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

      // Validação de Aspect Ratio (16:9 ~ 1.77 ou 2:1 ~ 2.0 com tolerância)
      if (ratio < 1.4 || ratio > 2.4) {
        setValidacaoErro(`Proporção inadequada (${ratio.toFixed(2)}:1). Para mobile, o padrão obrigatório é 16:9 (1.78) ou 2:1 (2.00). Evite banners verticais ou quadrados.`);
        return;
      }

      setArquivoBanner(file);
      setPreviewBannerUrl(objectUrl);
    };
  }

  function handleSalvarBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!previewBannerUrl || validacaoErro) return;

    const novoBanner: BannerItem = {
      id: "ban_" + Date.now(),
      titulo: novoTituloBanner || "Banner Promocional",
      subtitulo: novoSubtituloBanner || "",
      imagemUrl: previewBannerUrl,
      linkDestino: novoLinkBanner || "/app",
      aspectRatio: validacaoInfo ? `${validacaoInfo.aspectRatio}:1` : "16:9",
      pesoKb: validacaoInfo?.tamanhoKb || 200,
      dimensoes: validacaoInfo ? `${validacaoInfo.largura}x${validacaoInfo.altura} px` : "800x450 px",
      ativo: true,
      ordem: banners.length + 1,
    };

    setBanners((prev) => [novoBanner, ...prev]);
    setModalBannerAberto(false);
    setNovoTituloBanner("");
    setNovoSubtituloBanner("");
    setNovoLinkBanner("");
    setArquivoBanner(null);
    setPreviewBannerUrl(null);
  }

  function handleSalvarCupom(e: React.FormEvent) {
    e.preventDefault();
    if (!novoCupomCodigo) return;

    const cupom: CupomItem = {
      id: "cup_" + Date.now(),
      codigo: novoCupomCodigo.trim().toUpperCase(),
      tipo: novoCupomTipo,
      valor: Number(novoCupomValor) || 10,
      limiteUsos: Number(novoCupomLimite) || 100,
      usosAtuais: 0,
      validoAte: novoCupomValidade,
      status: "ATIVO",
    };

    setCupons((prev) => [cupom, ...prev]);
    setModalCupomAberto(false);
    setNovoCupomCodigo("");
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Banners Ativos no Aplicativo</h2>
              <p className="text-xs text-slate-500">Padrão mobile verificado: Proporção 16:9 e peso menor que 1 MB.</p>
            </div>
            <button
              type="button"
              onClick={() => setModalBannerAberto(true)}
              className="flex h-11 items-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-4 text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#0088FF]" />
              <span>Novo Banner Mobile</span>
            </button>
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
                      src={b.imagemUrl}
                      alt={b.titulo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-black">
                        {b.dimensoes}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-black">
                        {b.pesoKb} KB
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <h3 className="text-sm font-black text-slate-900 leading-tight">{b.titulo}</h3>
                    <p className="text-xs text-slate-500 leading-snug">{b.subtitulo}</p>
                    <p className="text-[11px] font-mono text-slate-400 pt-1 truncate">
                      Link: {b.linkDestino}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                  <span className={`text-[10px] font-black uppercase ${b.ativo ? "text-emerald-600" : "text-slate-400"}`}>
                    {b.ativo ? "● Ativo no App" : "○ Desativado"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBanners((prev) => prev.filter((item) => item.id !== b.id))}
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
                    <th className="p-4">Tipo &amp; Desconto</th>
                    <th className="p-4">Limite de Usos</th>
                    <th className="p-4">Validade</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-black text-sm px-2.5 py-1 bg-primary-50 text-yellow-950 border border-primary-500 rounded-lg">
                          {c.codigo}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900">
                          {c.tipo === "PERCENTUAL" ? `${c.valor}% OFF` : `R$ ${c.valor.toFixed(2)} OFF`}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span>{c.usosAtuais}</span>
                            <span>{c.limiteUsos}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-900 rounded-full"
                              style={{ width: `${Math.min(100, (c.usosAtuais / c.limiteUsos) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{c.validoAte}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          c.status === "ATIVO"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "ESGOTADO"
                            ? "bg-primary-50 text-amber-800"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(c.codigo);
                            alert(`Código ${c.codigo} copiado para a área de transferência!`);
                          }}
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                          title="Copiar Código"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
                  Arquivo de Imagem (Obrigatório: Padrão Mobile 16:9, máx 1 MB):
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
                    <p className="font-bold">Imagem aprovada para dispositivos móveis!</p>
                    <p className="text-[11px] text-emerald-800">
                      Dimensões: {validacaoInfo.largura}x{validacaoInfo.altura}px | Aspect: {validacaoInfo.aspectRatio}:1 | Peso: {validacaoInfo.tamanhoKb} KB
                    </p>
                  </div>
                </div>
              )}

              {previewBannerUrl && !validacaoErro && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200">
                  <img src={previewBannerUrl} alt="Preview" className="w-full h-full object-cover" />
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo:</label>
                  <select
                    value={novoCupomTipo}
                    onChange={(e: any) => setNovoCupomTipo(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                  >
                    <option value="PERCENTUAL">Percentual (%)</option>
                    <option value="VALOR_FIXO">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {novoCupomTipo === "PERCENTUAL" ? "Desconto (%)" : "Desconto (R$)"}:
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
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
                  onClick={() => setModalCupomAberto(false)}
                  className="h-11 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xs cursor-pointer"
                >
                  Ativar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
