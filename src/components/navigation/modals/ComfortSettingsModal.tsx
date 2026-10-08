import React from "react";
import { Settings, X, Bell, Volume2, Wind, VolumeX, Lock } from "lucide-react";

interface ComfortSettingsModalProps {
  open: boolean;
  onClose: () => void;
  pushNotificacoes: boolean;
  sonsVibracao: boolean;
  arCondicionado: boolean;
  viagemSilenciosa: boolean;
  exigirPin: boolean;
  onTogglePush: (val: boolean) => void;
  onToggleSons: (val: boolean) => void;
  onToggleAc: (val: boolean) => void;
  onToggleSilencio: (val: boolean) => void;
  onTogglePin: (val: boolean) => void;
  corPrimaria?: string;
}

export function ComfortSettingsModal({
  open,
  onClose,
  pushNotificacoes,
  sonsVibracao,
  arCondicionado,
  viagemSilenciosa,
  exigirPin,
  onTogglePush,
  onToggleSons,
  onToggleAc,
  onToggleSilencio,
  onTogglePin,
  corPrimaria,
}: ComfortSettingsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">Configurações &amp; Conforto</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Notificações no Dispositivo */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Notificações do App
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="h-4 w-4 text-slate-500" />
                <div>
                  <span className="block font-bold text-slate-800">Notificações Push no Celular</span>
                  <span className="text-[10px] text-slate-400">Motorista a caminho e chegada</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={pushNotificacoes}
                onChange={(e) => onTogglePush(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="h-4 w-4 text-slate-500" />
                <div>
                  <span className="block font-bold text-slate-800">Sons e Alertas Táteis</span>
                  <span className="text-[10px] text-slate-400">Vibrações e avisos de status</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sonsVibracao}
                onChange={(e) => onToggleSons(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 cursor-pointer"
              />
            </div>
          </div>

          {/* Preferências de Viagem */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Preferências de Viagem
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wind className="h-4 w-4" style={{ color: corPrimaria || "#FF6B00" }} />
                <div>
                  <span className="block font-bold text-slate-800">Sempre solicitar ar-condicionado</span>
                  <span className="text-[10px] text-slate-400">Preferência padrão em carros</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={arCondicionado}
                onChange={(e) => onToggleAc(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
                style={{ accentColor: corPrimaria || "#FF6B00" }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <VolumeX className="h-4 w-4 text-purple-500" />
                <div>
                  <span className="block font-bold text-slate-800">Viagem Silenciosa</span>
                  <span className="text-[10px] text-slate-400">Sem música alta ou conversas</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={viagemSilenciosa}
                onChange={(e) => onToggleSilencio(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="h-4 w-4 text-emerald-600" />
                <div>
                  <span className="block font-bold text-slate-800">Código PIN de Segurança</span>
                  <span className="text-[10px] text-slate-400">Validar 4 dígitos no embarque</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={exigirPin}
                onChange={(e) => onTogglePin(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
