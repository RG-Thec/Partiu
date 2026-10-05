import React, { useState, useRef, type ChangeEvent } from "react";
import { Camera, Image as ImageIcon, RefreshCw, CheckCircle2, AlertCircle, Trash2, User } from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";

export interface CameraPhotoCaptureProps {
  label?: string;
  sublabel?: string;
  value?: string;
  onChange: (photoDataUrl: string, file?: File) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Redimensiona e otimiza a imagem em um canvas para garantir carregamento leve
 * e evitar estouro de memória em conexões móveis (max 800x800, JPEG 85%).
 */
async function otimizarImagem(file: File): Promise<{ dataUrl: string; file: File }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Falha ao processar imagem"));
      img.onload = () => {
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ dataUrl: e.target?.result as string, file });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve({ dataUrl, file: optimizedFile });
            } else {
              resolve({ dataUrl, file });
            }
          },
          "image/jpeg",
          0.85
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const CameraPhotoCapture: React.FC<CameraPhotoCaptureProps> = ({
  label = "Sua foto de perfil",
  sublabel = "Tire uma foto nítida do seu rosto pela câmera do celular",
  value = "",
  onChange,
  required = true,
  disabled = false,
  className = "",
}) => {
  const { corPrimaria } = useBrandTheme();
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;
  const primary = corPrimaria || colors.primary;

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErro("Por favor, selecione um arquivo de imagem válido (JPG ou PNG).");
      return;
    }

    setProcessando(true);
    setErro(null);

    try {
      const { dataUrl, file: optimizedFile } = await otimizarImagem(file);
      onChange(dataUrl, optimizedFile);
    } catch (err: any) {
      setErro(err?.message || "Erro ao processar imagem.");
    } finally {
      setProcessando(false);
      // Limpa os inputs para permitir tirar outra foto com o mesmo nome
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleRemover = () => {
    onChange("");
    setErro(null);
  };

  const temFoto = Boolean(value && value.trim().length > 0);

  return (
    <div
      style={{
        borderRadius: ui.borderRadius,
      }}
      className={`p-3.5 sm:p-4 border transition-all ${
        temFoto
          ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/40"
          : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
      } ${className}`}
    >
      {/* Hidden inputs para câmera e galeria */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        disabled={disabled || processando}
        onChange={handleFileChange}
        className="hidden"
        id="camera-photo-input"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        disabled={disabled || processando}
        onChange={handleFileChange}
        className="hidden"
        id="gallery-photo-input"
      />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
        {/* Moldura circular do Avatar / Câmera */}
        <div className="relative shrink-0">
          <div
            style={{
              borderColor: temFoto ? "#10B981" : primary,
            }}
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full border-2 overflow-hidden flex items-center justify-center shadow-md bg-white dark:bg-slate-800 transition-all ${
              temFoto ? "ring-4 ring-emerald-500/20" : "ring-4 ring-primary/10"
            }`}
          >
            {temFoto ? (
              <img
                src={value}
                alt="Foto capturada"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-2 text-center">
                <User className="w-8 h-8 stroke-[1.8]" />
              </div>
            )}
          </div>

          {/* Badge de status no canto do círculo */}
          <div className="absolute -bottom-1 -right-1">
            {temFoto ? (
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </div>
            ) : (
              <div
                style={{ backgroundColor: primary }}
                className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900"
              >
                <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
            )}
          </div>
        </div>

        {/* Informações e Botões de Ação */}
        <div className="flex-1 text-center sm:text-left min-w-0 w-full">
          <div className="flex items-center justify-center sm:justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {label}
              </span>
              {required && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Obrigatório
                </span>
              )}
            </div>

            {temFoto && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Foto capturada
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug font-medium">
            {sublabel}
          </p>

          {erro && (
            <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{erro}</span>
            </div>
          )}

          {/* Botões de Ação Ergonômicos para Mobile */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
            {/* Botão Câmera (Prioritário no Celular) */}
            <button
              type="button"
              disabled={disabled || processando}
              onClick={() => cameraInputRef.current?.click()}
              style={{
                backgroundColor: temFoto ? "transparent" : primary,
                borderColor: temFoto ? primary : "transparent",
                color: temFoto ? primary : "#FFFFFF",
              }}
              className={`h-8.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs border ${
                temFoto
                  ? "hover:bg-primary/10 border"
                  : "hover:opacity-90 shadow-md text-white"
              }`}
            >
              {processando ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
              )}
              <span>{temFoto ? "Tirar outra foto" : "Abrir câmera do celular"}</span>
            </button>

            {/* Botão Galeria */}
            <button
              type="button"
              disabled={disabled || processando}
              onClick={() => galleryInputRef.current?.click()}
              className="h-8.5 px-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Galeria</span>
            </button>

            {/* Botão Remover (se já tiver foto) */}
            {temFoto && (
              <button
                type="button"
                disabled={disabled || processando}
                onClick={handleRemover}
                className="h-8.5 px-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                title="Excluir foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Remover</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
