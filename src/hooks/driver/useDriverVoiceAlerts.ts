import { useCallback, useRef } from "react";
import {
  obterAudioContext,
  tocarAlertaRadar,
  tocarAlertaChegada,
  tocarAlertaInicioViagem,
  tocarAlertaFimViagem,
} from "@/lib/partiu-engine";

export interface UseDriverVoiceAlertsOptions {
  enabled?: boolean;
}

export function useDriverVoiceAlerts(enabled: boolean = true) {
  const lastSpokenRef = useRef<string>("");
  const lastSpokenTimeRef = useRef<number>(0);

  const falar = useCallback(
    (mensagem: string, force: boolean = false) => {
      if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      // Evita repetição excessiva da mesma frase em curto intervalo (< 4s)
      const now = Date.now();
      if (!force && lastSpokenRef.current === mensagem && now - lastSpokenTimeRef.current < 4000) {
        return;
      }

      try {
        window.speechSynthesis.cancel(); // Interrompe fala anterior se ainda estiver rodando

        const utterance = new SpeechSynthesisUtterance(mensagem);
        utterance.lang = "pt-BR";
        utterance.rate = 1.05; // Leve aceleração natural para o trânsito
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Procura voz feminina ou masculina brasileira nativa se disponível
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(
          (v) => v.lang.startsWith("pt") || v.lang.replace("_", "-") === "pt-BR"
        );
        if (ptVoice) {
          utterance.voice = ptVoice;
        }

        lastSpokenRef.current = mensagem;
        lastSpokenTimeRef.current = now;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[VoiceAlerts] Síntese de voz indisponível:", err);
      }
    },
    [enabled]
  );

  const anunciarNovaOferta = useCallback(
    (distanciaKm: number, valor: number, modalidade: string = "Corrida") => {
      obterAudioContext();
      tocarAlertaRadar();
      const distFormatada = distanciaKm > 0 ? `${distanciaKm.toFixed(1).replace(".", ",")} quilômetros` : "próxima";
      const valorFormatado = `${Math.round(valor)} reais`;
      falar(`Nova ${modalidade}. Distância de ${distFormatada}. Valor: ${valorFormatado}.`);
    },
    [falar]
  );

  const anunciarChegadaEmbarque = useCallback(() => {
    obterAudioContext();
    tocarAlertaChegada();
    falar("Você chegou ao local de embarque. O passageiro foi notificado.");
  }, [falar]);

  const anunciarInicioViagem = useCallback(
    (destino?: string) => {
      obterAudioContext();
      tocarAlertaInicioViagem();
      if (destino) {
        falar(`Viagem iniciada com sucesso. Rota traçada para ${destino}.`);
      } else {
        falar("Viagem iniciada. Dirija com cuidado.");
      }
    },
    [falar]
  );

  const anunciarFimViagem = useCallback(
    (valor?: number) => {
      obterAudioContext();
      tocarAlertaFimViagem();
      if (valor && valor > 0) {
        falar(`Corrida concluída. Valor de ${valor.toFixed(2).replace(".", ",")} reais recebido com sucesso.`);
      } else {
        falar("Corrida concluída com sucesso. Excelente trabalho!");
      }
    },
    [falar]
  );

  const anunciarDiariaExpirando = useCallback(
    (minutos: number) => {
      falar(`Atenção parceiro: sua diária encerra em ${minutos} minutos. Toque para renovar.`);
    },
    [falar]
  );

  return {
    falar,
    anunciarNovaOferta,
    anunciarChegadaEmbarque,
    anunciarInicioViagem,
    anunciarFimViagem,
    anunciarDiariaExpirando,
  };
}
