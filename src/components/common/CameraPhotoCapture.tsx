import React, { useState, useRef, useEffect, type ChangeEvent } from "react";
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  User,
  X,
  SwitchCamera,
  Sparkles,
} from "lucide-react";
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
 * Redimensiona e otimiza a imagem em um canvas (max 600x600, JPEG 85%)
 * para tráfego leve e rápido no upload do Supabase.
 */
async function otimizarImagem(file: File): Promise<{ dataUrl: string; file: File }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Falha ao processar imagem"));
      img.onload = () => {
        const MAX_DIM = 600;
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
  label = "Sua foto de identificação",
  sublabel = "Tire uma selfie ao vivo pela câmera",
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

  // Estados do Modal da Câmera em Tempo Real (WebRTC)
  const [modalCameraAberto, setModalCameraAberto] = useState(false);
  const [iniciandoCamera, setIniciandoCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [temMultiplasCameras, setTemMultiplasCameras] = useState(false);
  const [cameraErro, setCameraErro] = useState<string | null>(null);

  // Fallback nativo (apenas câmera com capture="user")
  const fallbackCameraInputRef = useRef<HTMLInputElement>(null);

  // Referências de Streaming de Vídeo
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const effectivePhoto =
    value && value.trim().length > 0
      ? value
      : typeof window !== "undefined"
      ? localStorage.getItem("partiu_user_avatar") ||
        localStorage.getItem("partiu_user_foto") ||
        localStorage.getItem("partiu_user_selfie") ||
        ""
      : "";
  const temFoto = Boolean(effectivePhoto && effectivePhoto.trim().length > 0);

  // Encerra os tracks da câmera
  const pararStreamCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Limpa o stream ao desmontar o componente
  useEffect(() => {
    return () => {
      pararStreamCamera();
    };
  }, []);

  // Inicia a câmera ao vivo via WebRTC getUserMedia
  const iniciarStreamCamera = async (mode: "user" | "environment" = facingMode) => {
    setIniciandoCamera(true);
    setCameraErro(null);

    // Encerra qualquer stream pré-existente
    pararStreamCamera();

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("WEBRTC_UNSUPPORTED");
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Verifica se o dispositivo possui mais de uma câmera para exibir o botão de inverter
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setTemMultiplasCameras(videoInputs.length > 1);
      } catch {
        setTemMultiplasCameras(false);
      }
    } catch (err: any) {
      console.warn("Erro ao iniciar câmera WebRTC:", err);
      let mensagem = "Não foi possível abrir a câmera em tempo real.";
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        mensagem = "Acesso à câmera bloqueado. Permita o uso da câmera nas configurações do navegador.";
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        mensagem = "Nenhuma câmera ou webcam detectada no dispositivo.";
      } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
        mensagem = "A câmera já está em uso por outro aplicativo.";
      } else if (err?.message === "WEBRTC_UNSUPPORTED") {
        mensagem = "Navegador sem suporte a WebRTC. Você pode usar a câmera nativa do sistema.";
      }
      setCameraErro(mensagem);
    } finally {
      setIniciandoCamera(false);
    }
  };

  // Abre a interface da câmera
  const handleAbrirCamera = async () => {
    if (disabled || processando) return;
    setErro(null);
    setModalCameraAberto(true);
    // Aguarda montagem do DOM para vincular o videoRef
    setTimeout(() => {
      void iniciarStreamCamera(facingMode);
    }, 100);
  };

  // Alterna entre câmera frontal e traseira
  const handleAlternarCamera = () => {
    const novoModo = facingMode === "user" ? "environment" : "user";
    setFacingMode(novoModo);
    void iniciarStreamCamera(novoModo);
  };

  // Fecha a janela da câmera
  const handleFecharModalCamera = () => {
    pararStreamCamera();
    setModalCameraAberto(false);
    setCameraErro(null);
  };

  // Captura o quadro congelado do vídeo da câmera
  const handleCapturarFoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setCameraErro("Aguarde a inicialização do vídeo para fotografar.");
      return;
    }

    setProcessando(true);
    try {
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const tamanho = Math.min(vw, vh);
      const sx = (vw - tamanho) / 2;
      const sy = (vh - tamanho) / 2;

      const targetDim = 600;
      const canvas = document.createElement("canvas");
      canvas.width = targetDim;
      canvas.height = targetDim;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Falha ao inicializar o processador gráfico da imagem.");
      }

      // Se estiver na câmera frontal ("user"), espelha a imagem para o usuário se ver naturalmente
      if (facingMode === "user") {
        ctx.translate(targetDim, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, sx, sy, tamanho, tamanho, 0, 0, targetDim, targetDim);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

      canvas.toBlob(
        (blob) => {
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("partiu_user_avatar", dataUrl);
              localStorage.setItem("partiu_user_foto", dataUrl);
              localStorage.setItem("partiu_user_selfie", dataUrl);
              window.dispatchEvent(
                new CustomEvent("partiu:user-profile-updated", {
                  detail: { avatarUrl: dataUrl },
                })
              );
            } catch {}
          }
          if (blob) {
            const file = new File([blob], `selfie_${Date.now()}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            onChange(dataUrl, file);
          } else {
            onChange(dataUrl);
          }
        },
        "image/jpeg",
        0.88
      );

      handleFecharModalCamera();
    } catch (err: any) {
      setCameraErro(err?.message || "Erro ao capturar foto.");
    } finally {
      setProcessando(false);
    }
  };

  // Fallback nativo: caso o WebRTC falhe, abre o seletor nativo de câmera (sem galeria)
  const handleFallbackFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErro("Por favor, capture uma imagem válida.");
      return;
    }

    setProcessando(true);
    setErro(null);

    try {
      const { dataUrl, file: optimizedFile } = await otimizarImagem(file);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("partiu_user_avatar", dataUrl);
          localStorage.setItem("partiu_user_foto", dataUrl);
          localStorage.setItem("partiu_user_selfie", dataUrl);
          window.dispatchEvent(
            new CustomEvent("partiu:user-profile-updated", {
              detail: { avatarUrl: dataUrl },
            })
          );
        } catch {}
      }
      onChange(dataUrl, optimizedFile);
      handleFecharModalCamera();
    } catch (err: any) {
      setErro(err?.message || "Erro ao processar imagem.");
    } finally {
      setProcessando(false);
      if (fallbackCameraInputRef.current) fallbackCameraInputRef.current.value = "";
    }
  };

  const handleRemover = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("partiu_user_avatar");
        localStorage.removeItem("partiu_user_foto");
        localStorage.removeItem("partiu_user_selfie");
        window.dispatchEvent(
          new CustomEvent("partiu:user-profile-updated", {
            detail: { avatarUrl: "" },
          })
        );
      } catch {}
    }
    onChange("");
    setErro(null);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Input de fallback nativo caso WebRTC não seja acessível (estritamente com capture="user") */}
      <input
        ref={fallbackCameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        disabled={disabled || processando}
        onChange={handleFallbackFileChange}
        className="hidden"
        id="camera-photo-capture-native-fallback"
      />

      {/* CARD PRINCIPAL COMPACTO E ERGONÔMICO (Espaço economizado na tela) */}
      <div
        style={{
          borderRadius: ui.borderRadius,
        }}
        className={`p-2.5 sm:p-3 border transition-all flex items-center justify-between gap-3 ${
          temFoto
            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40"
            : "bg-slate-50/90 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar circular compacto */}
          <div className="relative shrink-0">
            <div
              style={{
                borderColor: temFoto ? "#10B981" : primary,
              }}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 overflow-hidden flex items-center justify-center shadow-2xs bg-white dark:bg-slate-800 transition-all ${
                temFoto ? "ring-2 ring-emerald-500/20" : "ring-2 ring-primary/15"
              }`}
            >
              {temFoto ? (
                <img
                  src={effectivePhoto}
                  alt="Foto capturada"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <User className="w-6 h-6 stroke-[1.8]" />
                </div>
              )}
            </div>

            {/* Ícone de status */}
            <div className="absolute -bottom-0.5 -right-0.5">
              {temFoto ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              ) : (
                <div
                  style={{ backgroundColor: primary }}
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900"
                >
                  <Camera className="w-3 h-3 stroke-[2.2]" />
                </div>
              )}
            </div>
          </div>

          {/* Textos informativos */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {label}
              </span>
              {required && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Obrigatório
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-tight">
              {temFoto ? "Selfie capturada com sucesso!" : sublabel}
            </p>

            {erro && (
              <div className="mt-1 text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span className="truncate">{erro}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botão de Ação: Apenas Câmera (Sem Galeria) */}
        <div className="shrink-0 flex items-center gap-1.5">
          <button
            type="button"
            disabled={disabled || processando}
            onClick={handleAbrirCamera}
            style={{
              backgroundColor: temFoto ? "transparent" : primary,
              borderColor: temFoto ? primary : "transparent",
              color: temFoto ? primary : "#FFFFFF",
            }}
            className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs border ${
              temFoto ? "hover:bg-primary/10 border" : "hover:opacity-90 shadow-md text-white"
            }`}
          >
            {processando ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
            )}
            <span>{temFoto ? "Tirar outra" : "Abrir câmera"}</span>
          </button>

          {temFoto && (
            <button
              type="button"
              disabled={disabled || processando}
              onClick={handleRemover}
              className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center active:scale-95 transition cursor-pointer"
              title="Excluir foto"
              aria-label="Excluir foto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 📸 MODAL DE CÂMERA AO VIVO EM TEMPO REAL (WEBRTC / WEBCAM VIEWFINDER) */}
      {/* ===================================================================== */}
      {modalCameraAberto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between items-center p-4 sm:p-6 animate-in fade-in select-none">
          {/* TOPO: Controles e Instruções */}
          <div className="w-full max-w-md flex items-center justify-between z-10 pt-[max(0.5rem,calc(env(safe-area-inset-top,0px)))]">
            <button
              type="button"
              onClick={handleFecharModalCamera}
              className="w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition flex items-center justify-center cursor-pointer shadow-md backdrop-blur-md"
              aria-label="Fechar câmera"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center px-2">
              <span className="text-xs sm:text-sm font-black text-white tracking-wide block">
                Foto de Identificação
              </span>
              <span className="text-[10px] text-white/70 block">
                Posicione seu rosto centralizado no círculo
              </span>
            </div>

            {/* Alternar Câmera Frontal / Traseira */}
            {temMultiplasCameras ? (
              <button
                type="button"
                onClick={handleAlternarCamera}
                className="w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 transition flex items-center justify-center cursor-pointer shadow-md backdrop-blur-md"
                aria-label="Inverter câmera"
                title="Inverter câmera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10" />
            )}
          </div>

          {/* CENTRO: Viewfinder da Câmera com Guia de Rosto */}
          <div className="relative w-full max-w-sm flex-1 flex items-center justify-center overflow-hidden my-3">
            {/* Elemento de Vídeo com Stream Ativo */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full max-h-[65vh] object-cover rounded-3xl shadow-2xl transition-all ${
                facingMode === "user" ? "-scale-x-100" : ""
              }`}
            />

            {/* Overlay: Guia Circular para Enquadramento do Rosto */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div
                style={{
                  borderColor: primary,
                }}
                className="w-60 h-60 sm:w-68 sm:h-68 rounded-full border-3 border-dashed shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] ring-4 ring-white/30 animate-pulse flex items-center justify-center"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>

              <div className="mt-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Mantenha o rosto iluminado e de frente</span>
              </div>
            </div>

            {/* Mensagem de Carregamento ou Erro */}
            {iniciandoCamera && (
              <div className="absolute inset-0 bg-black/80 rounded-3xl flex flex-col items-center justify-center text-white gap-2 z-20">
                <RefreshCw className="w-8 h-8 animate-spin text-white/80" />
                <span className="text-xs font-bold">Iniciando câmera...</span>
              </div>
            )}

            {cameraErro && (
              <div className="absolute inset-4 bg-slate-900/95 border border-rose-500/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center text-white gap-3 z-30">
                <AlertCircle className="w-8 h-8 text-rose-500" />
                <p className="text-xs font-semibold text-rose-200">{cameraErro}</p>
                <div className="flex flex-col gap-2 w-full max-w-xs mt-1">
                  <button
                    type="button"
                    onClick={() => void iniciarStreamCamera(facingMode)}
                    style={{ backgroundColor: primary }}
                    className="h-9 px-4 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition"
                  >
                    Tentar Novamente
                  </button>
                  <button
                    type="button"
                    onClick={() => fallbackCameraInputRef.current?.click()}
                    className="h-9 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 transition"
                  >
                    Usar Câmera do Sistema
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BASE: Botão Disparador (Shutter Button Estilo Câmera Nativa) */}
          <div className="w-full max-w-md flex flex-col items-center pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)))] z-10 space-y-2">
            <button
              type="button"
              disabled={iniciandoCamera || Boolean(cameraErro)}
              onClick={handleCapturarFoto}
              aria-label="Tirar foto agora"
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/25 active:scale-90 hover:scale-105 transition-all cursor-pointer shadow-[0_4px_25px_rgba(255,255,255,0.3)] disabled:opacity-50"
            >
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-white flex items-center justify-center shadow-inner text-slate-900">
                <Camera className="w-7 h-7 stroke-[2.2]" style={{ color: primary }} />
              </div>
            </button>

            <span className="text-[11px] font-semibold text-white/80">
              Toque no botão para capturar sua foto
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
