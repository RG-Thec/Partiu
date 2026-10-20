/**
 * ==============================================================================
 * 🛡️ PARTIU — MOCK LOCATION SHIELD (ANTI-FAKE GPS ENGINE)
 * ==============================================================================
 * Protege a plataforma contra condutores desonestos que utilizam aplicativos de
 * simulação de coordenadas ("Fake GPS" / "Mock Location") para furar filas em
 * rodoviárias, trevos ou manipular tarifas dinâmicas.
 *
 * Combina detecção de provedor de teste, coerência física cinemática
 * (velocidade máxima e aceleração inercial) e verificação temporal de satélite.
 * ==============================================================================
 */

export interface TelemetryPoint {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed?: number | null; // m/s
  accuracy?: number | null; // metros
  timestamp: number; // ms
  isMock?: boolean;
}

export type SpoofRiskLevel = "SAFE" | "LOW_RISK" | "HIGH_RISK" | "CRITICAL_SPOOF";

export interface SpoofValidationResult {
  isAuthentic: boolean;
  riskLevel: SpoofRiskLevel;
  confidenceScore: number; // 0 a 100%
  reasons: string[];
}

export class MockLocationShield {
  // Limites cinemáticos da física veicular terrestre
  private static MAX_SPEED_KMH = 180; // 180 km/h limite superior
  private static MAX_ACCELERATION_MS2 = 12; // 12 m/s² (aceleração esportiva máxima terrestre)
  private static MAX_ALTITUDE_DELTA_PER_SEC = 50; // 50m por segundo (exceto queda livre)
  private static MIN_ACCEPTABLE_ACCURACY = 2; // Menos de 2 metros de margem em celular padrão é suspeito de injeção perfeita

  /**
   * Distância Haversine em metros entre dois pontos
   */
  public static calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Valida a integridade de um ponto de telemetria em relação ao ponto anterior
   */
  public static validatePoint(
    current: TelemetryPoint,
    previous?: TelemetryPoint | null
  ): SpoofValidationResult {
    const reasons: string[] = [];
    let penaltyScore = 0;

    // 1. Verificação explícita de provedor simulado (Android mock flag)
    if (current.isMock === true) {
      return {
        isAuthentic: false,
        riskLevel: "CRITICAL_SPOOF",
        confidenceScore: 0,
        reasons: ["Dispositivo reportou provedor de localização simulada ativo (Mock Provider detectado)"],
      };
    }

    // 2. Verificação de Acurácia Fake Perfeita (Sintética)
    // Coordenadas simuladas muitas vezes injetam accuracy = 0 ou exata sem ruído de satélite
    if (current.accuracy !== undefined && current.accuracy !== null && current.accuracy < 1) {
      penaltyScore += 25;
      reasons.push("Precisão artificialmente perfeita (< 1m), indício de injeção sintética de GPS.");
    }

    if (previous) {
      const deltaMs = current.timestamp - previous.timestamp;
      const deltaSec = deltaMs / 1000;

      // 3. Verificação de Inversão Temporal ou Timestamp Congelado
      if (deltaMs <= 0) {
        penaltyScore += 35;
        reasons.push("Timestamp congelado ou retroativo em relação à telemetria anterior.");
      } else if (deltaSec > 0) {
        const distanceM = this.calculateDistanceMeters(
          previous.latitude,
          previous.longitude,
          current.latitude,
          current.longitude
        );

        const calculatedSpeedMs = distanceM / deltaSec;
        const calculatedSpeedKmh = calculatedSpeedMs * 3.6;

        // 4. Salto de Teleporte Cinemático (> 180 km/h)
        if (calculatedSpeedKmh > this.MAX_SPEED_KMH) {
          penaltyScore += 70;
          reasons.push(
            `Salto cinemático impossível: deslocamento de ${distanceM.toFixed(0)}m em ${deltaSec.toFixed(1)}s (${calculatedSpeedKmh.toFixed(0)} km/h).`
          );
        }

        // 5. Aceleração Inercial Anômala
        if (previous.speed !== null && previous.speed !== undefined && current.speed !== null && current.speed !== undefined) {
          const deltaSpeedMs = Math.abs(current.speed - previous.speed);
          const acceleration = deltaSpeedMs / deltaSec;
          if (acceleration > this.MAX_ACCELERATION_MS2 && calculatedSpeedKmh > 60) {
            penaltyScore += 30;
            reasons.push(
              `Aceleração anômala incompatível com automóveis: ${acceleration.toFixed(1)} m/s².`
            );
          }
        }

        // 6. Salto Vertical / Variação de Altitude Anômala
        if (
          previous.altitude !== undefined &&
          previous.altitude !== null &&
          current.altitude !== undefined &&
          current.altitude !== null
        ) {
          const deltaAlt = Math.abs(current.altitude - previous.altitude);
          const altRate = deltaAlt / deltaSec;
          if (altRate > this.MAX_ALTITUDE_DELTA_PER_SEC) {
            penaltyScore += 20;
            reasons.push(`Variação vertical abrupta de altitude (${altRate.toFixed(1)}m/s).`);
          }
        }
      }
    }

    // Cálculo final do nível de risco
    let riskLevel: SpoofRiskLevel = "SAFE";
    if (penaltyScore >= 70) {
      riskLevel = "CRITICAL_SPOOF";
    } else if (penaltyScore >= 40) {
      riskLevel = "HIGH_RISK";
    } else if (penaltyScore > 10) {
      riskLevel = "LOW_RISK";
    }

    const confidenceScore = Math.max(0, 100 - penaltyScore);

    return {
      isAuthentic: riskLevel !== "CRITICAL_SPOOF",
      riskLevel,
      confidenceScore,
      reasons,
    };
  }
}
