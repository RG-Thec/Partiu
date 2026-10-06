import { useState, useEffect, useCallback } from "react";
import { silentCatchWarn } from "@/lib/structured-logger";


export interface CoordenadasGPS {
  latitude: number;
  longitude: number;
  precisaoMetros?: number;
}

export interface LocalizacaoDetectada {
  cidade: string;
  pontoEmbarque: string;
  referencia: string;
  distanciaKm: number;
  coords: [number, number];
}

// Base de coordenadas de referência urbana nacional
export const PONTOS_GEOGRAFICOS_REFERENCIA: LocalizacaoDetectada[] = [
  {
    cidade: "São Paulo",
    pontoEmbarque: "São Paulo (Centro)",
    referencia: "Marco Zero • Centro",
    distanciaKm: 0,
    coords: [-23.5505, -46.6333],
  },
  {
    cidade: "Rio de Janeiro",
    pontoEmbarque: "Rio de Janeiro (Centro)",
    referencia: "Centro Metropolitano",
    distanciaKm: 0,
    coords: [-22.9068, -43.1729],
  },
  {
    cidade: "Belo Horizonte",
    pontoEmbarque: "Belo Horizonte (Centro)",
    referencia: "Praça Sete",
    distanciaKm: 0,
    coords: [-19.9167, -43.9345],
  },
  {
    cidade: "Brasília",
    pontoEmbarque: "Brasília (Plano Piloto)",
    referencia: "Eixo Monumental",
    distanciaKm: 0,
    coords: [-15.7975, -47.8919],
  },
];

export const PONTOS_GEOGRAFICOS_ALAGOAS = PONTOS_GEOGRAFICOS_REFERENCIA;

export function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function encontrarPontoMaisProximo(lat: number, lng: number): LocalizacaoDetectada | null {
  let maisProximo: LocalizacaoDetectada | null = null;
  let menorDistancia = Infinity;

  for (const ponto of PONTOS_GEOGRAFICOS_REFERENCIA) {
    const dist = calcularDistanciaKm(lat, lng, ponto.coords[0], ponto.coords[1]);
    if (dist < menorDistancia) {
      menorDistancia = dist;
      maisProximo = { ...ponto, distanciaKm: dist };
    }
  }

  if (menorDistancia > 50) {
    return {
      cidade: "Perímetro Urbano",
      pontoEmbarque: "Localização GPS",
      referencia: "Ponto em Trânsito",
      distanciaKm: menorDistancia,
      coords: [lat, lng],
    };
  }

  return maisProximo;
}

export function useGeolocation() {
  const [coords, setCoords] = useState<CoordenadasGPS | null>(null);
  const [localDetectado, setLocalDetectado] = useState<LocalizacaoDetectada | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [permissaoConcedida, setPermissaoConcedida] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const solicitarLocalizacao = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErro("Geolocalização não suportada neste dispositivo.");
      setLocalDetectado(null);
      return;
    }

    setCarregando(true);
    setErro(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude, precisaoMetros: accuracy });
        setPermissaoConcedida(true);
        try {
          localStorage.setItem("partiu_gps_permitido", "true");
        } catch (err) { silentCatchWarn("use-geolocation", err); }

        const ponto = encontrarPontoMaisProximo(latitude, longitude);
        setLocalDetectado(ponto);
        setCarregando(false);
      },
      (err) => {
        console.warn("[use-geolocation] GPS físico indisponível ou negado:", err.message);
        setCarregando(false);
        setPermissaoConcedida(false);
        setErro(err.message || "GPS indisponível");
        setLocalDetectado(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 },
    );
  }, []);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem("partiu_gps_permitido");
      if (salvo === "true") {
        setPermissaoConcedida(true);
        solicitarLocalizacao();
      }
    } catch (err) { silentCatchWarn("use-geolocation", err); }
  }, [solicitarLocalizacao]);

  return {
    coords,
    localDetectado,
    carregando,
    permissaoConcedida,
    erro,
    solicitarLocalizacao,
  };
}
