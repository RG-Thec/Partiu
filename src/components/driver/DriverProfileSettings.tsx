import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  X,
  Camera,
  ShieldCheck,
  Lock,
  Car,
  Bike,
  User,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  LogOut,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import type { DriverProfileRecord } from "@/lib/driver/driver-eligibility-engine";
import { toast } from "sonner";

export interface DriverProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  driverProfile: DriverProfileRecord;
  onSave?: (updatedProfile: DriverProfileRecord) => void;
  onLogout?: () => void;
}

export function DriverProfileSettings({
  isOpen,
  onClose,
  driverProfile,
  onSave,
  onLogout,
}: DriverProfileSettingsProps) {
  const navigate = useNavigate();
  const {
    corPrimaria,
    corPrimariaHover,
    corSecundaria,
    corTextoPrimaria,
    corCabecalhoInicio,
    corCabecalhoFim,
  } = useBrandTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const brandGradient = useMemo(() => {
    const start = corCabecalhoInicio || corPrimaria || "#FF6B00";
    const end = corCabecalhoFim || corSecundaria || "#FFB800";
    return `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
  }, [corCabecalhoInicio, corCabecalhoFim, corPrimaria, corSecundaria]);

  // Estados dos campos do Condutor
  const [nome, setNome] = useState(driverProfile.nome || "");
  const [telefone, setTelefone] = useState(driverProfile.telefone || "");
  const [email, setEmail] = useState(driverProfile.email || "");
  const [fotoUrl, setFotoUrl] = useState(driverProfile.fotoUrl || "");

  // Estados do Veículo
  const [veiculoMarcaModelo, setVeiculoMarcaModelo] = useState(
    driverProfile.veiculoMarcaModelo || ""
  );
  const [veiculoPlaca, setVeiculoPlaca] = useState(driverProfile.veiculoPlaca || "");
  const [veiculoCor, setVeiculoCor] = useState(driverProfile.veiculoCor || "");
  const [veiculoAno, setVeiculoAno] = useState<number>(
    driverProfile.veiculoAno || new Date().getFullYear()
  );
  const [categoriaVeiculo, setCategoriaVeiculo] = useState<
    "CARRO" | "MOTO" | "PLUS" | "MULHER"
  >(driverProfile.categoriaVeiculo || "CARRO");

  // Estado de controle de upload e persistência
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmSairAberto, setConfirmSairAberto] = useState(false);
  const [toastFeedback, setToastFeedback] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);

  // Sincroniza estado quando o modal abre ou perfil muda
  useEffect(() => {
    if (isOpen) {
      setNome(driverProfile.nome || "");
      setTelefone(driverProfile.telefone || "");
      setEmail(driverProfile.email || "");
      setFotoUrl(driverProfile.fotoUrl || "");
      setVeiculoMarcaModelo(driverProfile.veiculoMarcaModelo || "");
      setVeiculoPlaca(driverProfile.veiculoPlaca || "");
      setVeiculoCor(driverProfile.veiculoCor || "");
      setVeiculoAno(driverProfile.veiculoAno || new Date().getFullYear());
      setCategoriaVeiculo(driverProfile.categoriaVeiculo || "CARRO");
      setToastFeedback(null);
    }
  }, [isOpen, driverProfile]);

  if (!isOpen) return null;

  // Upload de Foto de Perfil (Supabase Storage bucket 'avatars' com fallback resiliente)
  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      let publicUrl = "";

      if (isSupabaseConfigured()) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const sanitizedExt = fileExt.replace(/[^a-zA-Z0-9]/g, "");
        const fileName = `driver_${driverProfile.id}_${Date.now()}.${sanitizedExt}`;
        const filePath = `avatars/${fileName}`;

        // Tenta bucket 'avatars' ou fallback para 'avatares'
        let uploadResult = await (supabase.storage as any)
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadResult.error) {
          uploadResult = await (supabase.storage as any)
            .from("avatares")
            .upload(filePath, file, { upsert: true });
        }

        if (!uploadResult.error) {
          const { data } = (supabase.storage as any).from("avatars").getPublicUrl(filePath);
          publicUrl = data?.publicUrl || "";
        }
      }

      // Fallback local via FileReader (garante funcionamento mesmo offline ou durante testes)
      if (!publicUrl) {
        const reader = new FileReader();
        publicUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      setFotoUrl(publicUrl);
      toast.success("Foto de perfil carregada com sucesso!");
    } catch (err) {
      console.error("[DriverProfileSettings] Erro no upload da foto:", err);
      toast.error("Não foi possível enviar a foto. Tente novamente.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // Submissão das alterações do perfil pessoal (dados do veículo são gerenciados pelo admin)
  async function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("O nome completo é obrigatório.");
      return;
    }

    if (!telefone.trim()) {
      toast.error("O telefone para contato é obrigatório.");
      return;
    }

    setIsSaving(true);
    setToastFeedback(null);

    try {
      // Atualiza no Supabase caso configurado (apenas dados pessoais)
      if (isSupabaseConfigured()) {
        // 1. Atualiza dados pessoais na tabela partiu_motoristas
        await (supabase as any)
          .from("partiu_motoristas")
          .update({
            nome: nome.trim(),
            telefone: telefone.trim(),
            foto_url: fotoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", driverProfile.id);

        // 2. Atualiza perfil de usuário na tabela profiles se existir userId
        if (driverProfile.userId) {
          await (supabase as any)
            .from("profiles")
            .update({
              name: nome.trim(),
              phone: telefone.trim(),
              avatar_url: fotoUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", driverProfile.userId);
        }
      }

      // Constrói o objeto atualizado (mantém dados do veículo inalterados)
      const updatedProfile: DriverProfileRecord = {
        ...driverProfile,
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        fotoUrl: fotoUrl,
      };

      toast.success("Dados do perfil atualizados com sucesso!");

      onSave?.(updatedProfile);
      setTimeout(() => {
        onClose();
      }, 350);
    } catch (err: any) {
      console.error("[DriverProfileSettings] Erro ao salvar dados:", err);
      toast.error(err?.message || "Erro ao salvar alterações.");
      setToastFeedback({
        tipo: "erro",
        mensagem: "Erro ao sincronizar dados. Verifique sua conexão.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Encerramento de sessão do condutor com confirmação ergonômica
  function handleSairConta() {
    setConfirmSairAberto(true);
  }

  async function executarSairConta() {
    setConfirmSairAberto(false);
    onClose();
    if (onLogout) {
      onLogout();
    } else {
      await supabaseAuthService.signOut();
      try {
        localStorage.removeItem("partiu_driver_demo");
        localStorage.removeItem("partiu_demo_driver_mot-001");
        localStorage.removeItem("partiu_active_user_session_v1");
      } catch {}
      navigate({ to: "/auth" });
    }
  }

  // Iniciais do motorista para avatar de fallback
  const iniciais = (nome || "Motorista")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="driver-profile-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-end sm:items-center animate-in fade-in duration-200 select-none"
    >
      <div className="w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] bg-[#F8FAFC] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 text-slate-900 border border-slate-200">
        {/* ================================================================= */}
        {/* CABEÇALHO COM IDENTIDADE VISUAL WHITE LABEL                       */}
        {/* ================================================================= */}
        <div className="px-5 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
              style={{
                background: brandGradient,
                color: corTextoPrimaria || "#FFFFFF",
              }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="driver-profile-title"
                className="text-base font-black tracking-tight text-slate-900 leading-tight"
              >
                Perfil do Motorista
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Gestão cadastral e do veículo parceiro
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="Fechar configurações de perfil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* CORPO DO FORMULÁRIO ROLÁVEL                                       */}
        {/* ================================================================= */}
        <form onSubmit={handleSalvarPerfil} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. SEÇÃO DE AVATAR COM UPLOAD */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt={nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-xl font-black" style={{ color: corPrimaria || "#FF6B00" }}>{iniciais}</span>
                )}
              </div>

              {/* Botão de disparo de câmera/galeria */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                style={{
                  backgroundColor: corPrimaria || "#FF6B00",
                  color: corTextoPrimaria || "#FFFFFF",
                }}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition cursor-pointer border-2 border-white disabled:opacity-50"
                title="Alterar foto de perfil"
                aria-label="Alterar foto de perfil"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
                aria-hidden="true"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {nome || "Seu Nome"}
                </h3>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verificado
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {email || "motorista@partiu.com.br"}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                style={{ color: corPrimaria || "#FF6B00" }}
                className="mt-2 text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Trocar foto do perfil</span>
              </button>
            </div>
          </div>

          {/* 2. DADOS PESSOAIS DO CONDUTOR */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" style={{ color: corPrimaria || "#FF6B00" }} />
              <span>Identificação do Condutor</span>
            </h3>

            {/* Nome Completo */}
            <div className="space-y-1">
              <label htmlFor="driver-name" className="text-xs font-bold text-slate-700 block">
                Nome Completo
              </label>
              <input
                id="driver-name"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Ex: João da Silva"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:bg-white focus:border-brand-primary-vibrant focus:ring-2 focus:ring-brand-primary-vibrant/20 transition outline-none"
              />
            </div>

            {/* Telefone de Contato */}
            <div className="space-y-1">
              <label htmlFor="driver-phone" className="text-xs font-bold text-slate-700 block">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="driver-phone"
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                  placeholder="(22) 99999-9999"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:bg-white focus:border-brand-primary-vibrant focus:ring-2 focus:ring-brand-primary-vibrant/20 transition outline-none"
                />
              </div>
            </div>

            {/* E-mail */}
            <div className="space-y-1">
              <label htmlFor="driver-email" className="text-xs font-bold text-slate-700 block">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="driver-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="motorista@email.com"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-900 focus:bg-white focus:border-brand-primary-vibrant focus:ring-2 focus:ring-brand-primary-vibrant/20 transition outline-none"
                />
              </div>
            </div>

            {/* TRAVA DE SEGURANÇA ANTIFRAUDE: CPF & CHAVE PIX BLOQUEADOS */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>CPF &amp; Chave PIX (Bloqueado)</span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                  Imutável
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-800 bg-white px-3 py-2 rounded-lg border border-slate-200">
                <span>{driverProfile.cpf || driverProfile.chavePix || "000.000.000-00"}</span>
                <span className="text-[11px] text-emerald-600 font-sans font-semibold">
                  Chave CPF Ativa
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                <strong>Segurança Antifraude:</strong> Por regulamentação do Banco Central e
                conformidade bancária PARTIU, o repasse de saques é restrito exclusivamente ao CPF
                do condutor titular registrado.
              </p>
            </div>
          </div>

          {/* 3. DADOS DO VEÍCULO — SOMENTE LEITURA (Gerenciado pelo Painel Administrativo) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" style={{ color: corPrimaria || "#FF6B00" }} />
                <span>Dados do Veículo</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                CNH {driverProfile.cnhCategoria || "B"}
              </span>
            </div>

            {/* Categoria de Atendimento — Badge Somente Leitura (Atribuída pelo Admin) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Categoria de Atendimento
              </label>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black border shadow-xs"
                  style={{
                    backgroundColor: `${corPrimaria || "#FF6B00"}15`,
                    borderColor: `${corPrimaria || "#FF6B00"}40`,
                    color: corPrimaria || "#FF6B00",
                  }}
                >
                  {categoriaVeiculo === "MOTO" ? (
                    <Bike className="w-3.5 h-3.5" />
                  ) : (
                    <Car className="w-3.5 h-3.5" />
                  )}
                  {categoriaVeiculo}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Definido pela operação
                </span>
              </div>
            </div>

            {/* Modelo / Marca — Somente Leitura */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Modelo e Marca
              </label>
              <div className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 flex items-center">
                {veiculoMarcaModelo || "Não informado"}
              </div>
            </div>

            {/* Grid: Placa, Cor e Ano — Somente Leitura */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Placa */}
              <div className="space-y-1 sm:col-span-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Placa
                </label>
                <div className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono font-bold text-slate-700 uppercase flex items-center">
                  {veiculoPlaca || "—"}
                </div>
              </div>

              {/* Cor */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Cor
                </label>
                <div className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 flex items-center">
                  {veiculoCor || "—"}
                </div>
              </div>

              {/* Ano */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Ano
                </label>
                <div className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 flex items-center">
                  {veiculoAno}
                </div>
              </div>
            </div>

            {/* Aviso informativo sobre alteração de dados */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Dados gerenciados pela operação</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-700">
                A categoria de atendimento e os dados do veículo são definidos e auditados
                pela equipe administrativa. Para solicitar alterações, entre em contato com
                o suporte da plataforma.
              </p>
            </div>
          </div>

          {/* Feedback de erro se houver */}
          {toastFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                toastFeedback.tipo === "sucesso"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {toastFeedback.tipo === "sucesso" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{toastFeedback.mensagem}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* BOTÃO DE SALVAR COM GRADIENTE OFICIAL WHITE LABEL                  */}
          {/* ================================================================= */}
          <div className="pt-2 sticky bottom-0 bg-[#F8FAFC] pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
            <button
              type="submit"
              disabled={isSaving || isUploadingAvatar}
              style={{
                background: brandGradient,
                color: corTextoPrimaria || "#FFFFFF",
              }}
              className="w-full h-12 rounded-2xl font-black text-sm shadow-lg hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SALVANDO ALTERAÇÕES...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SALVAR PERFIL E VEÍCULO</span>
                </>
              )}
            </button>

            {/* BOTÃO OFICIAL DE SAIR DO APLICATIVO */}
            <button
              type="button"
              onClick={handleSairConta}
              className="w-full h-11 rounded-2xl bg-white border border-rose-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50 font-black text-xs flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4 h-4 stroke-[2.2]" />
              <span>SAIR DA CONTA DE MOTORISTA</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL NATIVO DE CONFIRMAÇÃO DE SAÍDA */}
      {confirmSairAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-sair-perfil-titulo"
          className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmSairAberto(false);
          }}
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in slide-in-from-bottom duration-300 select-none">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100 shadow-2xs">
              <LogOut className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="space-y-1.5">
              <h3 id="confirm-sair-perfil-titulo" className="text-lg font-black text-slate-900 tracking-tight">
                Sair da Conta de Motorista?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Você será desconectado e não receberá corridas enquanto estiver desconectado.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSairAberto(false)}
                style={{
                  background: brandGradient,
                  color: corTextoPrimaria || "#FFFFFF",
                }}
                className="w-full h-12 min-h-[48px] rounded-2xl font-black text-xs sm:text-sm shadow-md transition active:scale-[0.98] cursor-pointer hover:brightness-105 flex items-center justify-center"
              >
                Continuar Conectado
              </button>
              <button
                type="button"
                onClick={executarSairConta}
                className="w-full h-11 min-h-[44px] rounded-2xl bg-slate-100 hover:bg-rose-50 text-rose-700 font-bold text-xs transition active:scale-[0.98] cursor-pointer border border-slate-200 hover:border-rose-300 flex items-center justify-center"
              >
                Encerrar e Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverProfileSettings;
