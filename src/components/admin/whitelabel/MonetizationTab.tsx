import React, { useState, useEffect, useRef, useCallback } from "react";
import { DollarSign, QrCode, Building2, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { saveMonetizacaoConfig } from "@/lib/superadmin-config";

interface MonetizationTabProps {
  onSaveFeedback: () => void;
}

type TipoChavePix = "cpf" | "email" | "cnpj" | "telefone" | "aleatoria";
type GatewayProvider = "mercadopago" | "asaas" | "efi" | "manual";

interface MonetizationFormData {
  chavePixAdmin: string;
  tipoChavePixAdmin: TipoChavePix;
  beneficiarioAdmin: string;
  cidadeAdmin: string;
  diariaCarro: number;
  diariaMoto: number;
  gatewayProvider: GatewayProvider;
}

export function MonetizationTab({ onSaveFeedback }: MonetizationTabProps) {
  const { monetization, updateConfig } = useBrandTheme();

  const [formData, setFormData] = useState<MonetizationFormData>(() => ({
    chavePixAdmin: monetization?.chavePixAdmin || "",
    tipoChavePixAdmin: (monetization?.tipoChavePixAdmin as TipoChavePix) || "email",
    beneficiarioAdmin: monetization?.beneficiarioAdmin || "",
    cidadeAdmin: monetization?.cidadeAdmin || "",
    diariaCarro: monetization?.diariaCarro ?? 19.9,
    diariaMoto: monetization?.diariaMoto ?? 11.9,
    gatewayProvider: (monetization?.gatewayProvider as GatewayProvider) || "mercadopago",
  }));

  const pendingDataRef = useRef<MonetizationFormData>(formData);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const flushUpdates = useCallback(
    (overrideData?: MonetizationFormData) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      isTypingRef.current = false;
      const current = overrideData || pendingDataRef.current;

      const updated = {
        ...monetization,
        ...current,
      };
      updateConfig({
        monetization: updated,
      });
      saveMonetizacaoConfig({
        chavePixAdmin: updated.chavePixAdmin,
        tipoChavePixAdmin: updated.tipoChavePixAdmin,
        beneficiarioAdmin: updated.beneficiarioAdmin,
        cidadeAdmin: updated.cidadeAdmin,
        diariaCarro: updated.diariaCarro,
        diariaMoto: updated.diariaMoto,
        gateway: updated.gatewayProvider,
      });
      onSaveFeedback();
    },
    [monetization, updateConfig, onSaveFeedback],
  );

  const handleFieldChange = useCallback(
    (field: keyof MonetizationFormData, value: any) => {
      isTypingRef.current = true;
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        pendingDataRef.current = next;
        return next;
      });

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        flushUpdates();
      }, 400);
    },
    [flushUpdates],
  );

  const handleBlur = useCallback(() => {
    if (debounceTimerRef.current) {
      flushUpdates();
    }
  }, [flushUpdates]);

  // Sincroniza se vierem atualizações externas
  useEffect(() => {
    if (isTypingRef.current || debounceTimerRef.current) return;
    const next: MonetizationFormData = {
      chavePixAdmin: monetization?.chavePixAdmin || "",
      tipoChavePixAdmin: (monetization?.tipoChavePixAdmin as TipoChavePix) || "email",
      beneficiarioAdmin: monetization?.beneficiarioAdmin || "",
      cidadeAdmin: monetization?.cidadeAdmin || "",
      diariaCarro: monetization?.diariaCarro ?? 19.9,
      diariaMoto: monetization?.diariaMoto ?? 11.9,
      gatewayProvider: (monetization?.gatewayProvider as GatewayProvider) || "mercadopago",
    };
    setFormData(next);
    pendingDataRef.current = next;
  }, [
    monetization?.chavePixAdmin,
    monetization?.tipoChavePixAdmin,
    monetization?.beneficiarioAdmin,
    monetization?.cidadeAdmin,
    monetization?.diariaCarro,
    monetization?.diariaMoto,
    monetization?.gatewayProvider,
  ]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        flushUpdates();
      }
    };
  }, [flushUpdates]);

  function handleTogglePlano(planoId: string, ativo: boolean) {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const planosAtualizados = (monetization?.planos || []).map((p) =>
      p.id === planoId ? { ...p, ativo } : p,
    );
    const updated = {
      ...monetization,
      ...pendingDataRef.current,
      planos: planosAtualizados,
    };
    updateConfig({ monetization: updated });
    saveMonetizacaoConfig({
      chavePixAdmin: updated.chavePixAdmin,
      tipoChavePixAdmin: updated.tipoChavePixAdmin,
      beneficiarioAdmin: updated.beneficiarioAdmin,
      cidadeAdmin: updated.cidadeAdmin,
      diariaCarro: updated.diariaCarro,
      diariaMoto: updated.diariaMoto,
      gateway: updated.gatewayProvider,
    });
    onSaveFeedback();
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          Módulo 8: Planos &amp; Monetização da Franquia
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure a chave PIX exclusiva para recebimento das diárias SaaS dos motoristas e defina
          os planos de acesso da sua praça. Sincronização imediata no aplicativo do motorista.
        </p>
      </div>

      {/* SEÇÃO 1: CONTA PIX RECEBEDORA ISOLADA DA FRANQUIA */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <QrCode className="w-4 h-4 text-emerald-600" />
          <span>Conta PIX Recebedora das Diárias &amp; Assinaturas (Exclusiva da Praça)</span>
        </div>
        <p className="text-xs text-slate-500">
          Esta chave PIX será impressa no QR Code e no código Copia-e-Cola exibidos aos motoristas
          cadastrados nesta cidade no momento da ativação do acesso de 24h.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Chave PIX da Franquia
            </label>
            <input
              type="text"
              value={formData.chavePixAdmin}
              onChange={(e) => handleFieldChange("chavePixAdmin", e.target.value.trim())}
              onBlur={handleBlur}
              placeholder="ex: financeiro@suacidade.com.br"
              className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Chave</label>
            <select
              value={formData.tipoChavePixAdmin}
              onChange={(e: any) =>
                handleFieldChange("tipoChavePixAdmin", e.target.value as TipoChavePix)
              }
              className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
            >
              <option value="email">E-mail</option>
              <option value="cnpj">CNPJ</option>
              <option value="cpf">CPF</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Chave Aleatória (EVP)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nome do Beneficiário (BACEN)
            </label>
            <input
              type="text"
              value={formData.beneficiarioAdmin}
              onChange={(e) => handleFieldChange("beneficiarioAdmin", e.target.value)}
              onBlur={handleBlur}
              placeholder="Razão Social ou Titular"
              className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Cidade do Beneficiário
            </label>
            <input
              type="text"
              value={formData.cidadeAdmin}
              onChange={(e) => handleFieldChange("cidadeAdmin", e.target.value)}
              onBlur={handleBlur}
              placeholder="ex: Itaperuna"
              className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Valor Diária Carro (R$)
            </label>
            <input
              type="number"
              step="0.10"
              value={formData.diariaCarro}
              onChange={(e) => handleFieldChange("diariaCarro", Number(e.target.value) || 19.9)}
              onBlur={handleBlur}
              className="w-full bg-white border border-slate-200 focus:border-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Valor Diária Moto (R$)
            </label>
            <input
              type="number"
              step="0.10"
              value={formData.diariaMoto}
              onChange={(e) => handleFieldChange("diariaMoto", Number(e.target.value) || 11.9)}
              onBlur={handleBlur}
              className="w-full bg-white border border-slate-200 focus:border-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Gateway Financeiro
            </label>
            <select
              value={formData.gatewayProvider}
              onChange={(e: any) =>
                handleFieldChange("gatewayProvider", e.target.value as GatewayProvider)
              }
              className="w-full bg-white border border-slate-200 focus:border-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
            >
              <option value="mercadopago">Mercado Pago</option>
              <option value="asaas">Asaas</option>
              <option value="efi">Efí (Gerencianet)</option>
              <option value="manual">PIX Direto / Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: PLANOS DE ACESSO DO MOTORISTA */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Wallet className="w-4 h-4 text-primary-600" />
          <span>Planos de Acesso Cadastrados para a Frota</span>
        </div>

        {monetization?.planos?.map((plano) => {
          const isAtivo = plano.ativo !== false;
          return (
            <div
              key={plano.id}
              className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                isAtivo
                  ? "bg-slate-900 border-slate-800"
                  : "bg-slate-900/50 border-slate-800/60 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black text-white">{plano.nome}</span>
                  <span
                    style={{ backgroundColor: plano.badgeCor }}
                    className="text-slate-950 px-2 py-0.5 rounded text-[10px] font-black"
                  >
                    {plano.comissaoPercentual === 0 ? "Taxa Zero" : `${plano.comissaoPercentual}%`}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAtivo
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isAtivo ? "Ativo" : "Desativado"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{plano.descricao}</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Mensalidade</span>
                  <span className="font-bold text-emerald-400">
                    R$ {plano.mensalidadeBrl.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Diária</span>
                  <span className="font-bold text-white">R$ {plano.diariaBrl.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Despacho VIP</span>
                  <span className="font-bold text-primary-600">{plano.pesoDespacho}x</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePlano(plano.id, !isAtivo)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isAtivo
                      ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {isAtivo ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
