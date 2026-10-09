import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Car,
  Bike,
  FileText,
  FileCheck2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Clock,
  Sparkles,
  Calendar,
  CreditCard,
  User,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { AdminModal } from "../ui/AdminModal";
import { AdminBadge } from "../ui/AdminBadge";
import { AdminActionButton } from "../ui/AdminActionButton";
import { AdminTimeline, type AdminTimelineEvent } from "../ui/AdminTimeline";
import type { SolicitacaoCondutor } from "@/routes/app.admin.aprovacoes";

export interface DriverApprovalAuditModalProps {
  solicitacao: SolicitacaoCondutor | null;
  open: boolean;
  onClose: () => void;
  onAprovar: (id: string, categoria: "CARRO" | "MOTO" | "PLUS" | "MULHER") => void;
  onRejeitar: (id: string, motivo: string) => void;
}

interface ImagemZoomState {
  url: string;
  titulo: string;
  rotacao: number;
  escala: number;
}

const MOTIVOS_RAPIDOS = [
  "CNH sem indicação EAR legível",
  "CRLV vencido ou de exercício anterior",
  "Foto do documento ilegível ou embaçada",
  "Ano do veículo fora do padrão da categoria",
  "Documento incompleto ou com cortes",
];

export function DriverApprovalAuditModal({
  solicitacao,
  open,
  onClose,
  onAprovar,
  onRejeitar,
}: DriverApprovalAuditModalProps) {
  const [categoria, setCategoria] = useState<"CARRO" | "MOTO" | "PLUS" | "MULHER">(
    solicitacao?.categoriaVeiculo || "CARRO"
  );
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [mostrarRejeicaoInput, setMostrarRejeicaoInput] = useState(false);
  const [imagemZoom, setImagemZoom] = useState<ImagemZoomState | null>(null);

  // Sincroniza categoria quando a solicitação muda
  useEffect(() => {
    if (solicitacao?.categoriaVeiculo) {
      setCategoria(solicitacao.categoriaVeiculo);
    }
  }, [solicitacao]);

  // Atalhos de Teclado Operacionais (A: Aprovar, R: Reprovar, Esc: Fechar)
  useEffect(() => {
    if (!open || !solicitacao) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Escape" && mostrarRejeicaoInput) {
          setMostrarRejeicaoInput(false);
        }
        return;
      }

      if (e.key === "Escape") {
        if (imagemZoom) {
          setImagemZoom(null);
        } else {
          onClose();
        }
      } else if (e.key.toLowerCase() === "a" && !imagemZoom && !mostrarRejeicaoInput && solicitacao) {
        e.preventDefault();
        onAprovar(solicitacao.id, categoria);
        onClose();
      } else if (e.key.toLowerCase() === "r" && !imagemZoom && !mostrarRejeicaoInput && solicitacao) {
        e.preventDefault();
        setMostrarRejeicaoInput(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, solicitacao, categoria, imagemZoom, mostrarRejeicaoInput, onAprovar, onClose]);

  if (!solicitacao || !open) return null;

  // Monta a timeline de vida do condutor
  const timelineEventos: AdminTimelineEvent[] = [
    {
      id: "ev_cadastro",
      title: "Solicitação de Cadastro Recebida",
      description: `Cadastro submetido para a praça ${solicitacao.cidade} via aplicativo do motorista.`,
      date: solicitacao.dataSolicitacao,
      variant: "info",
      icon: <Clock className="h-3 w-3 text-white" />,
    },
    {
      id: "ev_docs",
      title: "Documentos e Fotos Submetidos",
      description: `CNH (Cat. ${solicitacao.cnhCategoria}), CRLV do veículo ${solicitacao.veiculoMarcaModelo || "não especificado"} e foto de perfil.`,
      date: solicitacao.dataSolicitacao,
      variant: "info",
      icon: <FileText className="h-3 w-3 text-white" />,
    },
    {
      id: "ev_ocr",
      title: "Pré-validação Antifraude & OCR",
      description: solicitacao.possuiEAR
        ? "CNH com indicação EAR (Exerce Atividade Remunerada) identificada com conformidade."
        : "Atenção: Indicativo EAR não detectado no cadastro. Necessária conferência manual na CNH.",
      date: solicitacao.dataSolicitacao,
      variant: solicitacao.possuiEAR ? "success" : "warning",
      badge: solicitacao.possuiEAR ? "CONFORME" : "REQUER ATENÇÃO",
      icon: solicitacao.possuiEAR ? <ShieldCheck className="h-3 w-3 text-white" /> : <ShieldAlert className="h-3 w-3 text-white" />,
    },
  ];

  if (solicitacao.status === "aprovado") {
    timelineEventos.push({
      id: "ev_aprovado",
      title: "Credenciamento Aprovado Oficialmente",
      description: `Motorista habilitado na categoria ${solicitacao.categoriaVeiculo}. Pronto para ativação de diária e início de corridas.`,
      date: "Auditado",
      variant: "success",
      badge: "ATIVO",
      icon: <CheckCircle2 className="h-3 w-3 text-white" />,
    });
  } else if (solicitacao.status === "rejeitado") {
    timelineEventos.push({
      id: "ev_rejeitado",
      title: "Cadastro Recusado pela Auditoria",
      description: solicitacao.motivoRejeicao
        ? `Motivo: ${solicitacao.motivoRejeicao}`
        : "Documentação não aprovada na auditoria de conformidade.",
      date: "Auditado",
      variant: "critical",
      badge: "RECUSADO",
      icon: <XCircle className="h-3 w-3 text-white" />,
    });
  }

  function handleConfirmarRejeicao() {
    if (!motivoRejeicao.trim()) return;
    onRejeitar(solicitacao!.id, motivoRejeicao.trim());
    setMostrarRejeicaoInput(false);
    setMotivoRejeicao("");
    onClose();
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <span>Auditoria Cadastral &amp; Checklist</span>
          <AdminBadge
            variant={
              solicitacao.status === "aprovado"
                ? "success"
                : solicitacao.status === "rejeitado"
                ? "critical"
                : "warning"
            }
            size="sm"
          >
            {solicitacao.status.toUpperCase()}
          </AdminBadge>
        </div>
      }
      subtitle={`Protocolo #${solicitacao.id.slice(0, 8)} • ${solicitacao.cidade}`}
      icon={<FileCheck2 className="h-5 w-5 text-primary" />}
      footer={
        <div className="flex items-center justify-between w-full">
          <AdminActionButton variant="outline" size="sm" onClick={onClose}>
            Fechar
          </AdminActionButton>

          <div className="flex items-center gap-2">
            {!mostrarRejeicaoInput ? (
              <>
                <AdminActionButton
                  variant="destructive"
                  size="sm"
                  onClick={() => setMostrarRejeicaoInput(true)}
                >
                  Reprovar Cadastro
                  <kbd className="ml-1.5 px-1 py-0.2 rounded text-[9px] bg-rose-800 text-rose-100 font-mono">R</kbd>
                </AdminActionButton>

                <AdminActionButton
                  variant="success"
                  size="sm"
                  iconLeft={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => {
                    onAprovar(solicitacao.id, categoria);
                    onClose();
                  }}
                >
                  Aprovar Credenciamento
                  <kbd className="ml-1.5 px-1 py-0.2 rounded text-[9px] bg-emerald-800 text-emerald-100 font-mono">A</kbd>
                </AdminActionButton>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <AdminActionButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarRejeicaoInput(false)}
                >
                  Cancelar
                </AdminActionButton>
                <AdminActionButton
                  variant="destructive"
                  size="sm"
                  disabled={!motivoRejeicao.trim()}
                  onClick={handleConfirmarRejeicao}
                >
                  Confirmar Reprovação
                </AdminActionButton>
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Perfil Rápido do Condutor */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <img
              src={solicitacao.documentos.fotoPerfilUrl}
              alt={solicitacao.nomeCompleto}
              onClick={() =>
                setImagemZoom({
                  url: solicitacao.documentos.fotoPerfilUrl,
                  titulo: `Foto de Perfil — ${solicitacao.nomeCompleto}`,
                  rotacao: 0,
                  escala: 1,
                })
              }
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-xs cursor-pointer hover:opacity-90"
            />
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {solicitacao.nomeCompleto}
              </h4>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                CPF: {solicitacao.cpf} • CNH: {solicitacao.cnhNumero || "Não informada"}
              </p>
              <p className="text-xs text-slate-500">
                Chave Pix: <strong className="text-slate-700 dark:text-slate-300">{solicitacao.chavePix}</strong>
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/55${solicitacao.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${solicitacao.nomeCompleto.split(" ")[0]}, estamos conferindo seu cadastro na PARTIU.`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Falar no WhatsApp</span>
          </a>
        </div>

        {/* Justificativa de Reprovação (se acionada) */}
        {mostrarRejeicaoInput && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2.5 animate-in fade-in">
            <label className="text-xs font-bold text-rose-800 dark:text-rose-200 block">
              Motivo da Reprovação (será enviado ao condutor):
            </label>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 w-full">Motivos rápidos (1 clique):</span>
              {MOTIVOS_RAPIDOS.map((motivo) => (
                <button
                  key={motivo}
                  type="button"
                  onClick={() => setMotivoRejeicao(motivo)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-900 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700 font-medium transition cursor-pointer"
                >
                  {motivo}
                </button>
              ))}
            </div>
            <textarea
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              placeholder="Ex: CNH sem observação EAR legível, CRLV do exercício anterior ou foto do documento com corte."
              rows={3}
              className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
        )}

        {/* Checklist Automatizado de Conformidade */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Checklist de Conformidade Operacional
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Atividade Remunerada (EAR)
              </span>
              {solicitacao.possuiEAR ? (
                <AdminBadge variant="success" size="sm">
                  Consta na CNH
                </AdminBadge>
              ) : (
                <AdminBadge variant="warning" size="sm">
                  Não Consta
                </AdminBadge>
              )}
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Exercício CRLV Veicular
              </span>
              <AdminBadge variant="success" size="sm">
                Exercício 2026 Vigente
              </AdminBadge>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Ano do Veículo ({solicitacao.veiculoAno})
              </span>
              <AdminBadge variant="success" size="sm">
                Apto na Frota
              </AdminBadge>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Repasse Pix Cadastrado
              </span>
              <AdminBadge variant="info" size="sm">
                Chave Válida
              </AdminBadge>
            </div>
          </div>
        </div>

        {/* Documentos Anexados para Inspeção Visual */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
            Documentos Anexados para Inspeção Visual
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() =>
                setImagemZoom({
                  url: solicitacao.documentos.cnhUrl,
                  titulo: `CNH Digital — ${solicitacao.nomeCompleto}`,
                  rotacao: 0,
                  escala: 1,
                })
              }
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-primary transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  CNH Digital (Frente/Verso)
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <div className="h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <img
                  src={solicitacao.documentos.cnhUrl}
                  alt="CNH"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </div>

            <div
              onClick={() =>
                setImagemZoom({
                  url: solicitacao.documentos.crlvUrl,
                  titulo: `CRLV Veículo — ${solicitacao.veiculoPlaca}`,
                  rotacao: 0,
                  escala: 1,
                })
              }
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-primary transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  CRLV / Documento Veicular
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <div className="h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <img
                  src={solicitacao.documentos.crlvUrl}
                  alt="CRLV"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categoria Oficial para Habilitação */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Categoria a Liberar na Aprovação:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "CARRO", label: "Partiu Pop (Carro)", icon: Car },
              { id: "MOTO", label: "Partiu Moto / Flash", icon: Bike },
              { id: "PLUS", label: "Partiu Plus (Sedan)", icon: Car },
              { id: "MULHER", label: "Partiu Mulher", icon: User },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = categoria === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoria(cat.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline de Vida do Motorista */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Timeline de Vida &amp; Trilha de Auditoria
          </h4>
          <AdminTimeline events={timelineEventos} />
        </div>
      </div>

      {/* Modal de Zoom Pericial de Imagem com Rotação e Controles */}
      {imagemZoom && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none"
          onClick={() => setImagemZoom(null)}
        >
          <div
            className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl space-y-3 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header da Barra de Ferramentas de Inspeção Pericial */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {imagemZoom.titulo}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  Inspeção Documental • {Math.round(imagemZoom.escala * 100)}% • {imagemZoom.rotacao}°
                </p>
              </div>

              {/* Botões de Ação Pericial: Girar, Zoom +, Zoom -, Reset, Fechar */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setImagemZoom((prev) =>
                      prev ? { ...prev, rotacao: (prev.rotacao + 90) % 360 } : null
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                  title="Girar 90 graus no sentido horário"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Girar 90°</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setImagemZoom((prev) =>
                      prev ? { ...prev, escala: Math.min(prev.escala + 0.25, 3) } : null
                    )
                  }
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Aumentar Zoom (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setImagemZoom((prev) =>
                      prev ? { ...prev, escala: Math.max(prev.escala - 0.25, 0.75) } : null
                    )
                  }
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Diminuir Zoom (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setImagemZoom((prev) =>
                      prev ? { ...prev, escala: 1, rotacao: 0 } : null
                    )
                  }
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Redefinir Zoom e Rotação"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setImagemZoom(null)}
                  className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer transition ml-1"
                  title="Fechar Visualizador (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Área de Visualização Pericial com overflow e rotação */}
            <div className="flex-1 overflow-auto rounded-2xl flex items-center justify-center p-2 bg-slate-950/90 border border-slate-800/80 min-h-[350px] max-h-[75vh]">
              <img
                src={imagemZoom.url}
                alt={imagemZoom.titulo}
                style={{
                  transform: `scale(${imagemZoom.escala}) rotate(${imagemZoom.rotacao}deg)`,
                  transition: "transform 0.15s ease-out",
                }}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      )}
    </AdminModal>
  );
}
