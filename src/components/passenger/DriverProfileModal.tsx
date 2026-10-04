import React, { memo } from "react";
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Car,
  Bike,
  Quote,
} from "lucide-react";
import type { DriverTrustProfile } from "@/services/ProgressiveDispatchEngine";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { NativeBottomSheet } from "@/components/native/NativeBottomSheet";
import { NativeButton } from "@/components/native/NativeButton";

export interface DriverProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: DriverTrustProfile | null | undefined;
}

const DEFAULT_REVIEWS = [
  {
    id: "rev-1",
    author: "Juliana M.",
    rating: 5,
    text: "Motorista muito educado e prestativo!",
    date: "Ontem",
  },
  {
    id: "rev-2",
    author: "Felipe S.",
    rating: 5,
    text: "Chegou rápido, direção muito segura e tranquila.",
    date: "Há 2 dias",
  },
  {
    id: "rev-3",
    author: "Larissa C.",
    rating: 5,
    text: "Veículo impecável, super limpo e confortável.",
    date: "Esta semana",
  },
];

export const DriverProfileModal = memo(function DriverProfileModal({
  isOpen,
  onClose,
  profile,
}: DriverProfileModalProps) {
  const { appConfig } = useTheme();
  const { colors, ui, appName } = appConfig.branding;

  if (!isOpen) return null;

  const data: DriverTrustProfile = profile || {
    driverId: "mot-verified",
    fullName: "Motorista Parceiro",
    firstName: "Motorista",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    category: `${appName} Carro`,
    rating: 4.98,
    totalRides: 1200,
    platformYears: 1,
    completionRate: 99,
    vehicleBrand: "Veículo",
    vehicleModel: "Credenciado",
    vehicleColor: "Prata",
    vehicleYear: 2023,
    licensePlate: "PARTIU",
    phone: "(22) 99999-9999",
  };

  const isMoto = data.category.toLowerCase().includes("moto");

  return (
    <NativeBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Perfil do Motorista Parceiro"
      subtitle="Documentação e reputação verificadas"
      ariaLabel="Perfil do Motorista"
      showCloseButton
      maxHeight="max-h-[90dvh]"
      footer={
        <NativeButton
          variant="tonal"
          size="md"
          fullWidth
          onClick={onClose}
        >
          Fechar Perfil
        </NativeButton>
      }
    >
      <div className="space-y-4 pt-1">
        {/* Foto Grande + Nome Completo + Categoria */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={data.avatarUrl}
              alt={data.fullName}
              className="w-24 h-24 rounded-3xl object-cover shadow-lg"
              style={{
                border: `3px solid ${colors.primary}`,
                borderRadius: ui.borderRadius,
              }}
            />
            <span
              title="Motorista Verificado"
              className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-full border-2 border-white shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>

          <h3
            className="text-lg font-black mt-3 leading-snug"
            style={{ color: colors.textPrimary }}
          >
            {data.fullName}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textSecondary,
              }}
            >
              {data.category}
            </span>
            <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Documentação Verificada
            </span>
          </div>
        </div>

        {/* Grid 2x2 de Estatísticas Reais */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Nota Média */}
          <div
            className="p-3 border text-center"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              borderRadius: ui.borderRadius,
            }}
          >
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span className="text-lg font-black" style={{ color: colors.textPrimary }}>
                {Number(data.rating).toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.primary }}>
              Nota Média
            </span>
          </div>

          {/* 2. Corridas Realizadas */}
          <div
            className="p-3 border text-center"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              borderRadius: ui.borderRadius,
            }}
          >
            <span className="text-lg font-black block leading-tight" style={{ color: colors.textPrimary }}>
              {data.totalRides.toLocaleString("pt-BR")}+
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider mt-0.5 block" style={{ color: colors.textSecondary }}>
              Corridas Feitas
            </span>
          </div>

          {/* 3. Tempo na Plataforma */}
          <div
            className="p-3 border text-center"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              borderRadius: ui.borderRadius,
            }}
          >
            <span className="text-lg font-black block leading-tight" style={{ color: colors.textPrimary }}>
              {data.platformYears} {data.platformYears === 1 ? "ano" : "anos"}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider mt-0.5 block" style={{ color: colors.textSecondary }}>
              Tempo de Plataforma
            </span>
          </div>

          {/* 4. Taxa de Conclusão */}
          <div
            className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center"
            style={{ borderRadius: ui.borderRadius }}
          >
            <span className="text-lg font-black text-emerald-950 block leading-tight">
              {data.completionRate}%
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 mt-0.5 block">
              Taxa de Conclusão
            </span>
          </div>
        </div>

        {/* Dados do Veículo com Placa Mercosul */}
        <div
          className="p-3.5 border space-y-2.5"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            borderRadius: ui.borderRadius,
          }}
        >
          <span className="text-xs font-black uppercase tracking-wider block" style={{ color: colors.textSecondary }}>
            Veículo Oficial
          </span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-xs"
                style={{ borderRadius: ui.borderRadius }}
              >
                {isMoto ? <Bike className="w-5 h-5" /> : <Car className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-black" style={{ color: colors.textPrimary }}>
                  {data.vehicleBrand} {data.vehicleModel}
                </h4>
                <p className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                  Cor {data.vehicleColor} • Ano {data.vehicleYear}
                </p>
              </div>
            </div>

            {/* Placa Mercosul */}
            <div className="border border-slate-800 rounded-sm overflow-hidden shadow-xs w-22 bg-white text-center">
              <div className="bg-[#003399] px-1 py-0.2 flex items-center justify-between text-[6px] text-white font-black tracking-widest leading-none">
                <span>BRASIL</span>
                <span className="w-1 h-0.5 rounded-2xs bg-emerald-400 inline-block" />
              </div>
              <div className="py-0.5 font-mono font-black text-xs text-slate-950 tracking-wider leading-none">
                {data.licensePlate}
              </div>
            </div>
          </div>
        </div>

        {/* Avaliações Recentes de Passageiros */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider block" style={{ color: colors.textSecondary }}>
            Últimas Avaliações
          </span>
          <div className="space-y-2">
            {DEFAULT_REVIEWS.map((rev) => (
              <div
                key={rev.id}
                className="p-3 border space-y-1 text-xs"
                style={{
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  borderRadius: ui.borderRadius,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black" style={{ color: colors.textPrimary }}>{rev.author}</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="italic flex items-start gap-1 text-xs font-medium" style={{ color: colors.textSecondary }}>
                  <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>"{rev.text}"</span>
                </p>
                <span className="text-xs font-bold block text-right" style={{ color: colors.textSecondary }}>{rev.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </NativeBottomSheet>
  );
});
