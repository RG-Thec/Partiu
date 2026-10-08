import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LogOut,
  User,
  Car,
  Bike,
  TrendingUp,
  Zap,
  Clock,
  Navigation,
  Bell,
  Headphones,
  ShieldAlert,
  ArrowRightLeft,
  Star,
  ChevronRight,
  X,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import type { DriverProfileRecord } from "@/lib/driver/driver-eligibility-engine";
import { toast } from "sonner";

export interface DriverDrawerProps {
  open: boolean;
  onClose: () => void;
  driverProfile: DriverProfileRecord;
  isOnline: boolean;
  ganhosHoje?: number;
  diariaCountdownTexto?: string;
  unreadCount?: number;
  onOpenProfile: () => void;
  onOpenFinanceiro?: () => void;
  onOpenPlanos?: () => void;
  onOpenTaximetro?: () => void;
  onOpenDestino?: () => void;
  onOpenNotificacoes?: () => void;
  onOpenSos?: () => void;
  onLogout?: () => void;
}

export function DriverDrawer({
  open,
  onClose,
  driverProfile,
  isOnline,
  ganhosHoje = 0,
  diariaCountdownTexto,
  unreadCount = 0,
  onOpenProfile,
  onOpenFinanceiro,
  onOpenPlanos,
  onOpenTaximetro,
  onOpenDestino,
  onOpenNotificacoes,
  onOpenSos,
  onLogout,
}: DriverDrawerProps) {
  const navigate = useNavigate();
  const { nomeApp, corPrimaria, corSecundaria, corTextoPrimaria } = useBrandTheme();
  const [confirmSairAberto, setConfirmSairAberto] = useState(false);

  // Fecha o drawer com a tecla ESC
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmSairAberto) {
          setConfirmSairAberto(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, confirmSairAberto]);

  if (!open) return null;

  // Iniciais do motorista para avatar de fallback
  const driverInitials = (driverProfile.nome || "Motorista")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Abertura do modal ergonômico de confirmação
  function handleSairAplicativo() {
    setConfirmSairAberto(true);
  }

  // Execução real do logout após confirmação deliberada
  async function executarSairAplicativo() {
    try {
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
        toast.success("Sessão finalizada com sucesso.");
        navigate({ to: "/auth" });
      }
    } catch (err) {
      console.error("[DriverDrawer] Erro ao deslogar:", err);
      toast.error("Não foi possível encerrar a sessão. Redirecionando...");
      navigate({ to: "/auth" });
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu Principal do Motorista"
      className="fixed inset-0 z-50 overflow-hidden flex text-slate-900 animate-in fade-in duration-200 select-none"
    >
      {/* Backdrop com desfoque */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel do Drawer Lateral */}
      <aside className="relative w-full max-w-xs sm:max-w-sm h-full bg-white shadow-2xl z-10 flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-out border-r border-slate-200">
        <div className="flex-1">
          {/* ================================================================= */}
          {/* 1. HEADER DO MOTORISTA (PERFIL, FOTO, ESTRELA E VEÍCULO)          */}
          {/* ================================================================= */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className="w-14 h-14 rounded-2xl border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-md cursor-pointer active:scale-95 transition-all relative"
                  style={{ borderColor: corPrimaria }}
                  title="Editar Perfil e Veículo"
                >
                  {driverProfile.fotoUrl ? (
                    <img
                      src={driverProfile.fotoUrl}
                      alt={driverProfile.nome}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span
                      className="text-base font-black tracking-tight"
                      style={{ color: corPrimaria }}
                    >
                      {driverInitials}
                    </span>
                  )}
                  {/* Status Indicator no Avatar */}
                  <span
                    className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-black text-slate-900 leading-tight truncate">
                      {driverProfile.nome || "Motorista Parceiro"}
                    </h2>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100/80 text-amber-900 border border-amber-300/60 shrink-0">
                      <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                      {typeof driverProfile.rating === "number"
                        ? driverProfile.rating.toFixed(1)
                        : (driverProfile as any).avaliacao || "4.9"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-md">
                      {driverProfile.categoriaVeiculo === "MOTO" ? (
                        <Bike className="w-3 h-3" />
                      ) : (
                        <Car className="w-3 h-3" />
                      )}
                      <span>
                        {driverProfile.veiculoPlaca || driverProfile.categoriaVeiculo || "CARRO"}
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProfile();
                    }}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors mt-1 text-left inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Editar perfil &amp; veículo</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Operacional Banner */}
            <div
              className={`mt-3.5 p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                isOnline
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950"
                  : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-ping" : "bg-slate-400"
                  }`}
                />
                <span>{isOnline ? "CONECTADO • RECEBENDO CHAMADAS" : "OFFLINE • TOQUE EM CONECTAR"}</span>
              </div>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-white/70">
                {isOnline ? "Ativo" : "Pausa"}
              </span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 2. CARD DESTAQUE: MUDAR PARA O APP DO PASSAGEIRO                  */}
          {/* ================================================================= */}
          <div className="p-4 py-3 border-b border-slate-100 bg-gradient-to-r from-orange-50/50 to-amber-50/30">
            <Link
              to="/app"
              onClick={onClose}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-amber-200/80 shadow-xs hover:border-amber-300 hover:shadow-sm active:scale-[0.99] transition-all text-slate-900 group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl shrink-0 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria || corPrimaria} 100%)`,
                    color: corTextoPrimaria,
                  }}
                >
                  <ArrowRightLeft className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-black block leading-tight text-slate-950">
                    Modo Passageiro
                  </span>
                  <span className="text-[11px] text-slate-700 font-semibold mt-0.5 block">
                    Pedir corridas ou entregas como cliente
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
            </Link>
          </div>

          {/* ================================================================= */}
          {/* 3. SEÇÃO: OPERAÇÃO & GESTÃO DO MOTORISTA                          */}
          {/* ================================================================= */}
          <div className="p-4 py-3 border-b border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 px-3 block mb-1.5">
              Operação &amp; Ganhos
            </span>

            <nav className="space-y-0.5">
              {/* Central Financeira & Metas */}
              {onOpenFinanceiro && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFinanceiro();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 active:scale-[0.99] transition-all text-slate-800 group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <TrendingUp className="h-4 w-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block leading-none text-slate-900">
                        Central Financeira &amp; Metas
                      </span>
                      <span className="text-xs text-emerald-700 font-bold mt-1 block">
                        Ganhos hoje: {ganhosHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </button>
              )}

              {/* Planos & Diária SaaS */}
              {onOpenPlanos && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPlanos();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 active:scale-[0.99] transition-all text-slate-800 group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: `${corPrimaria}15`,
                        color: corPrimaria,
                      }}
                    >
                      <Zap className="h-4 w-4 stroke-[2.2]" style={{ color: corPrimaria }} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block leading-none text-slate-900">
                        Planos &amp; Diária SaaS
                      </span>
                      <span className="text-xs text-slate-700 font-semibold mt-1 block">
                        {diariaCountdownTexto ? `Tempo: ${diariaCountdownTexto}` : "Acesso 0% Comissão"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </button>
              )}

              {/* Taxímetro Virtual Inteligente */}
              {onOpenTaximetro && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTaximetro();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 active:scale-[0.99] transition-all text-slate-800 group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Clock className="h-4 w-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block leading-none text-slate-900">
                        Taxímetro Virtual Inteligente
                      </span>
                      <span className="text-xs text-slate-700 font-medium mt-1 block">
                        Corrida de rua • Pega direto
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </button>
              )}

              {/* Definir Destino / Rota de Volta */}
              {onOpenDestino && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDestino();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 active:scale-[0.99] transition-all text-slate-800 group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/60 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Navigation className="h-4 w-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block leading-none text-slate-900">
                        Definir Destino
                      </span>
                      <span className="text-xs text-slate-700 font-medium mt-1 block">
                        Receba chamadas no caminho de casa
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </button>
              )}

              {/* Notificações Operacionais */}
              {onOpenNotificacoes && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNotificacoes();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 active:scale-[0.99] transition-all text-slate-800 group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform relative">
                      <Bell className="h-4 w-4 stroke-[2.2]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold block leading-none text-slate-900">
                          Notificações Operacionais
                        </span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-700 font-medium mt-1 block">
                        Comunicados e avisos da central
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </button>
              )}
            </nav>
          </div>

          {/* ================================================================= */}
          {/* 4. SEÇÃO: SEGURANÇA & SUPORTE                                     */}
          {/* ================================================================= */}
          <div className="p-4 py-3 border-b border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 px-3 block mb-1.5">
              Segurança &amp; Suporte
            </span>

            <nav className="space-y-0.5">
              {/* Emergência Policial 190 */}
              {onOpenSos && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSos();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-50/60 active:scale-[0.99] transition-all text-slate-800 group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ShieldAlert className="h-4 w-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold block leading-none text-slate-900">
                          Botão SOS • Polícia 190
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                          Emergência
                        </span>
                      </div>
                      <span className="text-xs text-slate-700 font-medium mt-1 block">
                        Acionamento policial com telemetria GPS
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                </button>
              )}

              {/* Suporte Operacional WhatsApp */}
              <a
                href="https://wa.me/5522999605162?text=Ol%C3%A1!%20Sou%20motorista%20parceiro%20Partiu%20e%20preciso%20de%20suporte%20operacional."
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 active:scale-[0.99] transition-all text-slate-800 group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Phone className="h-4 w-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-none text-slate-900">
                      Suporte Operacional 24h
                    </span>
                    <span className="text-xs text-slate-700 font-medium mt-1 block">
                      Fale com a central pelo WhatsApp
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
              </a>
            </nav>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 5. RODAPÉ DO MENU COM VERSÃO E BOTÃO OFICIAL DE SAIR               */}
        {/* ================================================================= */}
        <div className="p-5 border-t border-slate-200 bg-slate-50/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-1">
            <span>{nomeApp} Motorista v1.0.0</span>
            <span>Itaperuna, RJ</span>
          </div>

          {/* BOTÃO OFICIAL: SAIR DO APLICATIVO */}
          <button
            type="button"
            onClick={handleSairAplicativo}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border-2 border-rose-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50 active:scale-[0.99] transition-all font-black text-xs shadow-xs cursor-pointer"
          >
            <LogOut className="h-4 w-4 stroke-[2.5]" />
            <span>SAIR DO APLICATIVO</span>
          </button>
        </div>
      </aside>

      {/* MODAL NATIVO DE CONFIRMAÇÃO DE LOGOUT DO MOTORISTA */}
      {confirmSairAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-sair-titulo"
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
              <h3 id="confirm-sair-titulo" className="text-lg font-black text-slate-900 tracking-tight">
                Encerrar Plantão de Motorista?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Ao sair da sua conta, você ficará offline e deixará de receber ofertas de corridas no {nomeApp}.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSairAberto(false)}
                style={{
                  backgroundColor: corPrimaria || "#FF6B00",
                  color: corTextoPrimaria || "#FFFFFF",
                }}
                className="w-full h-12 min-h-[48px] rounded-2xl font-black text-xs sm:text-sm shadow-md transition active:scale-[0.98] cursor-pointer hover:brightness-105 flex items-center justify-center"
              >
                Continuar Trabalhando
              </button>
              <button
                type="button"
                onClick={executarSairAplicativo}
                className="w-full h-11 min-h-[44px] rounded-2xl bg-slate-100 hover:bg-rose-50 text-rose-700 font-bold text-xs transition active:scale-[0.98] cursor-pointer border border-slate-200 hover:border-rose-300 flex items-center justify-center"
              >
                Encerrar Plantão e Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
