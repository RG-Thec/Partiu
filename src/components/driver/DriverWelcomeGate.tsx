import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Car, ShieldCheck, ArrowRight, DollarSign, Clock, Zap, Sparkles, ArrowLeft } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { whiteLabelEngine } from "@/lib/white-label";

interface DriverWelcomeGateProps {
  onEnterDemo?: () => void;
}

export const DriverWelcomeGate: React.FC<DriverWelcomeGateProps> = ({ onEnterDemo }) => {
  const navigate = useNavigate();
  const { nomeApp, corPrimaria, corSecundaria, corCabecalhoInicio, corCabecalhoFim } =
    useBrandTheme();

  const brandGradient = `linear-gradient(135deg, ${corCabecalhoInicio || corPrimaria || "#FF6B00"} 0%, ${corCabecalhoFim || corSecundaria || "#FFB800"} 100%)`;

  const handleEnterDemo = () => {
    if (onEnterDemo) {
      onEnterDemo();
      return;
    }
    const currentTenant = whiteLabelEngine.getActiveTenantId() || "default";
    supabaseAuthService.saveStoredSession(
      {
        id: "usr-drv-demo-01",
        name: "Motorista Parceiro",
        email: "motorista@partiu.com.br",
        phone: "(11) 99999-0002",
        cpf: "000.000.000-02",
        role: "MOTORISTA",
        rating: 5.0,
        totalTrips: 48,
        vehiclePlate: "MOB2A00",
        vehicleModel: "Veículo Padrão (Prata)",
        driverApprovalStatus: "aprovado",
        avatarUrl: "",
        createdAt: Date.now(),
      },
      currentTenant,
    );
    window.location.reload();
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] font-sans animate-in fade-in duration-300">
      {/* Topo / Header com Identidade da Marca */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-1">
        <Link
          to="/"
          className="min-h-[38px] px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 shadow-2xs transition active:scale-95 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Início</span>
        </Link>
        <span
          className="text-[11px] font-bold uppercase px-3 py-1 rounded-full border shadow-2xs"
          style={{
            backgroundColor: `${corPrimaria}15`,
            color: corPrimaria,
            borderColor: `${corPrimaria}30`,
          }}
        >
          Portal do Parceiro
        </span>
        <Link
          to="/auth"
          search={{ role: "MOTORISTA" }}
          className="min-h-[38px] px-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition flex items-center"
        >
          Entrar
        </Link>
      </header>

      {/* Conteúdo Central */}
      <main className="w-full max-w-md mx-auto space-y-5 py-4 my-auto">
        <div className="text-center space-y-2">
          {/* Badge Ícone */}
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/15 mb-2.5 transition-transform hover:scale-105"
            style={{ background: brandGradient, color: "#FFFFFF" }}
          >
            <Car className="w-7 h-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Dirija e fature no {nomeApp}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
            Seja dono do seu tempo. Ganhe mais com taxas justas e receba na hora via PIX D+0.
          </p>
        </div>

        {/* 4 Vantagens Estratégicas em Cards Claros */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>Até 100% Líquido</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Planos com 0% de comissão por corrida.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
              <Zap className="w-4 h-4 shrink-0" />
              <span>Recebimento PIX D+0</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Valor direto na sua conta bancária sem intermediários.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-sky-600 font-bold text-xs">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Taxímetro de Rua</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Pegue corridas na rua e cobre via QR Code PIX.
            </p>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Segurança Máxima</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              PIN de 4 dígitos e leitura de mensagens por voz.
            </p>
          </div>
        </div>

        {/* Botões de Ação Proporcionais e Responsivos — Thumb Zone Veicular */}
        <div className="space-y-2.5 pt-1">
          {/* Botão Cadastrar Veículo */}
          <Link
            to="/cadastro-motorista"
            style={{ background: brandGradient, color: "#FFFFFF" }}
            className="w-full min-h-[50px] sm:min-h-[52px] rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition cursor-pointer"
          >
            <Car className="w-4 h-4" />
            <span>Cadastrar meu veículo (Carro ou Moto)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Botão Já sou cadastrado */}
          <Link
            to="/auth"
            search={{ role: "MOTORISTA" }}
            className="w-full min-h-[46px] rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition cursor-pointer shadow-2xs"
          >
            <span>Já sou parceiro cadastrado • Fazer login</span>
          </Link>

          {/* Botão de Demonstração / Teste Imediato do Cockpit */}
          <button
            type="button"
            onClick={handleEnterDemo}
            className="w-full min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Explorar Cockpit no Modo Demonstração</span>
          </button>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="w-full max-w-md mx-auto text-center text-[10px] text-slate-400 pt-3 border-t border-slate-200">
        © 2026 {nomeApp} Mobilidade Urbana • Plataforma Oficial do Parceiro
      </footer>
    </div>
  );
};
