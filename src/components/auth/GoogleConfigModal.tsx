import React, { useState, useEffect } from "react";
import {
  X,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { GoogleIcon } from "@/components/common/GoogleIcon";
import { googleAuthService } from "@/lib/auth/google-auth-service";
import { NativeButton, NativeInput } from "@/components/native";
import { useBrandTheme } from "@/hooks/useBrandTheme";

export const GoogleConfigModal: React.FC = () => {
  const { corPrimaria, nomeApp } = useBrandTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    role?: "PASSAGEIRO" | "MOTORISTA";
    redirectUrl?: string;
  } | null>(null);

  useEffect(() => {
    const handleRequest = (e: CustomEvent) => {
      setPendingAction(e.detail || null);
      setErrorMessage(null);
      setSuccessMessage(null);
      const existingId = googleAuthService.getGoogleClientId();
      if (existingId) {
        setClientIdInput(existingId);
      }
      setIsOpen(true);
    };

    window.addEventListener(
      "partiu:request_google_client_id" as any,
      handleRequest as any
    );
    return () => {
      window.removeEventListener(
        "partiu:request_google_client_id" as any,
        handleRequest as any
      );
    };
  }, []);

  if (!isOpen) return null;

  const handleSaveAndProceed = async () => {
    setErrorMessage(null);
    const cleanId = clientIdInput.trim();

    if (!cleanId) {
      setErrorMessage("Por favor, cole seu Google Client ID para continuar.");
      return;
    }

    if (!cleanId.includes(".apps.googleusercontent.com") && cleanId.length < 15) {
      setErrorMessage(
        "Formato inválido. O Google Client ID geralmente termina com '.apps.googleusercontent.com'."
      );
      return;
    }

    googleAuthService.setGoogleClientId(cleanId);
    setSuccessMessage("Google Client ID configurado com sucesso! Abrindo o Google...");

    setTimeout(async () => {
      setIsOpen(false);
      // Reexecuta o login com Google imediatamente
      await googleAuthService.signIn(pendingAction || undefined);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs">
              <GoogleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Conectar Conta Google Real
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Autenticação oficial Google OAuth 2.0 no {nomeApp}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informação */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Configuração do Provedor Google</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
            Para que a janela oficial do Google abra e você possa selecionar sua conta real, insira abaixo o seu <strong>Google Client ID</strong> (ou defina <code className="font-mono bg-white/70 dark:bg-black/30 px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> no arquivo <code className="font-mono bg-white/70 dark:bg-black/30 px-1 py-0.5 rounded">.env</code>).
          </p>
        </div>

        {/* Feedback de erro/sucesso */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Input do Google Client ID */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
            Google Client ID (OAuth 2.0 Web Client)
          </label>
          <NativeInput
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
            placeholder="Ex: 123456789-abcdef.apps.googleusercontent.com"
            leftIcon={<KeyRound className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Tutorial Rápido Sanfona */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTutorial(!showTutorial)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-between text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Como obter o Google Client ID em 2 minutos (grátis)</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showTutorial ? "rotate-180" : ""
              }`}
            />
          </button>

          {showTutorial && (
            <div className="p-3.5 space-y-2 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
              <ol className="list-decimal pl-4 space-y-1">
                <li>
                  Acesse o{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-bold inline-flex items-center gap-0.5"
                  >
                    Google Cloud Console <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </li>
                <li>Clique em <strong>Criar Credenciais</strong> &gt; <strong>ID do cliente OAuth</strong>.</li>
                <li>Selecione o tipo <strong>Aplicativo da Web</strong>.</li>
                <li>
                  Em <strong>Origens JavaScript autorizadas</strong>, adicione:
                  <div className="font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded mt-0.5 text-[10px]">
                    http://localhost:8080
                  </div>
                </li>
                <li>
                  Em <strong>URIs de redirecionamento autorizados</strong>, adicione:
                  <div className="font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded mt-0.5 text-[10px]">
                    http://localhost:8080/auth
                  </div>
                </li>
                <li>Copie o <strong>ID do cliente</strong> gerado e cole no campo acima.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <NativeButton
            type="button"
            variant="outlined"
            size="md"
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </NativeButton>
          <NativeButton
            type="button"
            variant="filled"
            size="md"
            onClick={handleSaveAndProceed}
            rightIcon={<GoogleIcon className="w-4 h-4" />}
          >
            Salvar e Entrar com Google
          </NativeButton>
        </div>
      </div>
    </div>
  );
};
