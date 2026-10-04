/**
 * ==============================================================================
 * 📍 PARTIU — SMART PICKUP POINTS ENGINE (PONTOS ESTRATÉGICOS DE EMBARQUE)
 * ==============================================================================
 * Identifica e gera pontos de encontro seguros, esquinas de fácil acesso e
 * baias de parada próximas à localização atual do passageiro.
 *
 * Princípios de Design:
 * - Evitar paradas perigosas ou vias de trânsito rápido sem recuo.
 * - Priorizar locais iluminados, esquinas amplas e pontos de referência reconhecidos.
 * - Indicar tempo de caminhada a pé (~80 metros/minuto).
 * ==============================================================================
 */

import {
  LUGARES_CURADOS_ITAPERUNA,
  calcularDistanciaHaversineMetros,
  formatarDistanciaLegivel,
} from "@/services/GeocodingService";

export type SmartPickupType = "esquina" | "avenida" | "referencia" | "seguro";

export interface StrategicPickupPoint {
  id: string;
  nome: string;
  endereco: string;
  descricao: string;
  tipo: SmartPickupType;
  coords: [number, number]; // [lng, lat]
  distanciaMetros: number;
  tempoCaminhadaMin: number;
  badge: string;
}

/**
 * Retorna exclusivamente pontos estratégicos de embarque REAIS e verificados
 * próximos à localização atual do passageiro (dentro de um raio caminhável de até 450m).
 * Se nenhum ponto real estiver próximo, retorna vazio para não exibir locais fictícios.
 */
export function getStrategicPickupPoints(
  currentLocation: [number, number] = [-41.8880, -21.2050]
): StrategicPickupPoint[] {
  const [currentLng, currentLat] = currentLocation;
  if (isNaN(currentLng) || isNaN(currentLat)) return [];

  const RAIO_MAXIMO_METROS = 450; // Raio máximo de caminhada a pé (~5 min)

  const pontosReaisProximos: StrategicPickupPoint[] = [];

  for (const lugar of LUGARES_CURADOS_ITAPERUNA) {
    const distancia = calcularDistanciaHaversineMetros(currentLocation, lugar.coords);

    if (distancia <= RAIO_MAXIMO_METROS) {
      let tipo: SmartPickupType = "referencia";
      let badge = "Ponto de Referência";

      if (lugar.tipo === "rua") {
        tipo = "esquina";
        badge = "Embarque na Via";
      } else if (lugar.tipo === "ponto_interesse" || lugar.tipo === "comercio") {
        tipo = "seguro";
        badge = "Ponto Seguro e Iluminado";
      } else if (lugar.tipo === "hospital" || lugar.tipo === "faculdade" || lugar.tipo === "transporte") {
        tipo = "referencia";
        badge = "Ponto Oficial";
      }

      pontosReaisProximos.push({
        id: `real-pickup-${lugar.id}`,
        nome: lugar.label,
        endereco: lugar.endereco,
        descricao: lugar.sublabel || `Próximo a ${lugar.label}`,
        tipo,
        coords: lugar.coords,
        distanciaMetros: distancia,
        tempoCaminhadaMin: Math.max(1, Math.round(distancia / 80)),
        badge,
      });
    }
  }

  // Ordena pelo ponto real mais próximo do usuário
  pontosReaisProximos.sort((a, b) => a.distanciaMetros - b.distanciaMetros);

  return pontosReaisProximos.slice(0, 4);
}
