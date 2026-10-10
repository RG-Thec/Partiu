import React from "react";
import { DollarSign, QrCode, ShieldCheck, Building2, Wallet } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";

interface MonetizationTabProps {
  onSaveFeedback: () => void;
}

export function MonetizationTab({ onSaveFeedback }: MonetizationTabProps) {
  const { monetization, updateConfig } = useBrandTheme();

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-xs text-slate-900 animate-in fade-in">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-[#003366] flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          Módulo 7: Planos &amp; Monetização da Franquia
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure a chave PIX exclusiva para recebimento das diárias SaaS dos motoristas e defina os planos de acesso da sua praça.
        </p>
      </div>

      {/* SEÇÃO 1: CONTA PIX RECEBEDORA ISOLADA DA FRANQUIA */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <QrCode className="w-4 h-4 text-emerald-600" />
          <span>Conta PIX Recebedora das Diárias &amp; Assinaturas (Exclusiva da Praça)</span>
        </div>
        <p className="text-xs text-slate-500">
          Esta chave PIX será impressa no QR Code e no código Copia-e-Cola exibidos aos motoristas cadastrados nesta cidade no momento da ativação do acesso de 24h.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Chave PIX da Franquia
            </label>
            <input
              type="text"
              value={monetization?.chavePixAdmin || ""}
              onChange={(e) => {
                updateConfig({
                  monetization: {
                    ...monetization,
                    chavePixAdmin: e.target.value.trim(),
                  },
                });
                onSaveFeedback();
              }}
              placeholder="ex: financeiro@suacidade.com.br"
              className="w-full bg-white border border-slate-200 focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Tipo de Chave
            </label>
            <select
              value={monetization?.tipoChavePixAdmin || "email"}
              onChange={(e: any) => {
                updateConfig({
                  monetization: {
                    ...monetization,
                    tipoChavePixAdmin: e.target.value,
                  },
                });
                onSaveFeedback();
              }}
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
              value={monetization?.beneficiarioAdmin || ""}
              onChange={(e) => {
                updateConfig({
                  monetization: {
                    ...monetization,
                    beneficiarioAdmin: e.target.value,
                  },
                });
                onSaveFeedback();
              }}
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
              value={monetization?.cidadeAdmin || ""}
              onChange={(e) => {
                updateConfig({
                  monetization: {
                    ...monetization,
                    cidadeAdmin: e.target.value,
                  },
                });
                onSaveFeedback();
              }}
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
              value={monetization?.diariaCarro ?? 19.90}
              onChange={(e) => {
                updateConfig({
                  monetization: {
                    ...monetization,
                    diariaCarro: Number(e.target.value) || 19.90,
                  },
                });
                onSaveFeedback();
              }}
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
              value={monetization?.diariaMoto ?? 11.90}
              onChange={(e) => {
                updateConfig({
                  monetization: {
                    ...monetization,
                    diariaMoto: Number(e.target.value) || 11.90,
                  },
                });
                onSaveFeedback();
              }}
              className="w-full bg-white border border-slate-200 focus:border-[#0088FF] rounded-xl px-3 py-2 text-xs text-slate-800 font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Gateway Financeiro
            </label>
            <select
              value={monetization?.gatewayProvider || "mercadopago"}
              onChange={(e: any) => {
                updateConfig({
                  monetization: {
                    ...monetization,
                    gatewayProvider: e.target.value,
                  },
                });
                onSaveFeedback();
              }}
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

        {monetization?.planos?.map((plano) => (
          <div
            key={plano.id}
            className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4"
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
                <span className="font-bold text-white">
                  R$ {plano.diariaBrl.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Despacho VIP</span>
                <span className="font-bold text-primary-600">
                  {plano.pesoDespacho}x
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
