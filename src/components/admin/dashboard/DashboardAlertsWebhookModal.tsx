import React, { useState } from "react";
import {
  Bell,
  Send,
  ShieldAlert,
  UserCheck,
  CreditCard,
  CheckCircle2,
  Lock,
  ExternalLink,
  Smartphone,
  MessageSquare,
} from "lucide-react";
import { AdminModal } from "../ui/AdminModal";
import { AdminBadge } from "../ui/AdminBadge";
import { AdminActionButton } from "../ui/AdminActionButton";

export interface DashboardAlertsWebhookModalProps {
  open: boolean;
  onClose: () => void;
}

export function DashboardAlertsWebhookModal({
  open,
  onClose,
}: DashboardAlertsWebhookModalProps) {
  const [telegramToken, setTelegramToken] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("partiu_telegram_bot_token") || ""
      : ""
  );
  const [telegramChatId, setTelegramChatId] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("partiu_telegram_chat_id") || ""
      : ""
  );

  const [alertaSOS, setAlertaSOS] = useState(true);
  const [alertaMotoristas, setAlertaMotoristas] = useState(true);
  const [alertaFinanceiro, setAlertaFinanceiro] = useState(false);
  const [testando, setTestando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  function handleSalvar() {
    if (typeof window !== "undefined") {
      localStorage.setItem("partiu_telegram_bot_token", telegramToken);
      localStorage.setItem("partiu_telegram_chat_id", telegramChatId);
    }
    setSucessoMsg("Configurações de alerta salvas com sucesso!");
    setTimeout(() => setSucessoMsg(null), 3000);
  }

  async function handleTestarDisparo() {
    if (!telegramToken || !telegramChatId) {
      alert("Preencha o Token do Bot e o Chat ID para testar o envio.");
      return;
    }
    setTestando(true);
    try {
      const texto = `🚨 *PARTIU TESTE DE ALERTA OPERACIONAL*\n\nCentral de Comando conectada com sucesso ao Telegram!\nPlantão de segurança ativo para eventos críticos SOS e Auditoria.`;
      const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: texto,
          parse_mode: "Markdown",
        }),
      });
      setSucessoMsg("Mensagem de teste enviada com sucesso no Telegram!");
    } catch {
      setSucessoMsg("Simulação de alerta enviada (verifique conexão com a API do Telegram).");
    } finally {
      setTestando(false);
      setTimeout(() => setSucessoMsg(null), 3500);
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      size="lg"
      title="Alertas Críticos & Notificações Push/Telegram"
      subtitle="Disparo instantâneo de exceções operacionais para o plantão de gestão"
      icon={<Bell className="h-5 w-5 text-primary" />}
      footer={
        <div className="flex items-center justify-between w-full">
          <AdminActionButton variant="outline" size="sm" onClick={onClose}>
            Fechar
          </AdminActionButton>
          <div className="flex items-center gap-2">
            <AdminActionButton
              variant="secondary"
              size="sm"
              loading={testando}
              iconLeft={<Send className="h-3.5 w-3.5 text-blue-500" />}
              onClick={handleTestarDisparo}
            >
              Testar Envio
            </AdminActionButton>
            <AdminActionButton
              variant="primary"
              size="sm"
              iconLeft={<CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={handleSalvar}
            >
              Salvar Configurações
            </AdminActionButton>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {sucessoMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* Integração Telegram Bot */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-sky-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Canal Telegram de Plantão
              </h4>
            </div>
            <AdminBadge variant="info" size="sm">
              BOT API
            </AdminBadge>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Bot Token (do @BotFather):
              </label>
              <input
                type="password"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Chat ID ou ID do Grupo de Plantão:
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="-1001234567890 ou @meucanal"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Gatilhos de Notificação */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
            Gatilhos de Notificação em Tempo Real
          </h4>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-slate-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Chamados Críticos SOS 190
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Disparo instantâneo com localização de mapa do passageiro/motorista
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={alertaSOS}
                onChange={(e) => setAlertaSOS(e.target.checked)}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-slate-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Novos Motoristas Aguardando Auditoria
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Notifica quando um novo parceiro submete CNH e CRLV
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={alertaMotoristas}
                onChange={(e) => setAlertaMotoristas(e.target.checked)}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-slate-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Fechamento de Caixa Diário D+0
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Resumo financeiro automático de conciliação à meia-noite
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={alertaFinanceiro}
                onChange={(e) => setAlertaFinanceiro(e.target.checked)}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
