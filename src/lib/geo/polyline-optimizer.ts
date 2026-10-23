/**
 * ==============================================================================
 * 🚀 PARTIU — POLYLINE OPTIMIZER & 60 FPS MAP ENGINE (v1.0)
 * ==============================================================================
 * Módulo de otimização geométrica e telemetria para mapas vetoriais de alto desempenho.
 *
 * Implementa:
 * 1. Algoritmo Ramer-Douglas-Peucker (RDP) para simplificação de polylines vetoriais,
 *    reduzindo entre 40% e 75% dos vértices redundantes sem perda visual de fidelidade viária.
 * 2. Filtro Deadband de GPS para amortecimento de micro-vibrações (< 2.5m) em veículos parados.
 * 3. Interpolação angular (Bearing Smoothing) com resolução contínua pelo menor arco.
 * 4. Interpolação linear (LERP) para garantir renderização estável a 60 FPS no Mapbox GL.
 * ==============================================================================
 */

export interface PolylineOptimizationResult {
  originalCount: number;
  simplifiedCount: number;
  reductionRatio: number;
  coordinates: [number, number][];
}

/**
 * Calcula a distância perpendicular em coordenadas geográficas de um ponto P
 * até o segmento de reta formado pelos pontos A e B.
 *
 * Ajusta o eixo longitudinal pela latitude média para precisão métrica.
 */
function perpendicularDistance(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const [pLng, pLat] = p;
  const [aLng, aLat] = a;
  const [bLng, bLat] = b;

  // Se os extremos forem coincidentes, calcula distância pontual
  const dLng = bLng - aLng;
  const dLat = bLat - aLat;

  if (dLng === 0 && dLat === 0) {
    const latDiff = pLat - aLat;
    const lngDiff = (pLng - aLng) * Math.cos(((aLat + pLat) / 2) * (Math.PI / 180));
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  // Fator de escala da longitude baseado na latitude média da região
  const meanLatRad = ((aLat + bLat + pLat) / 3) * (Math.PI / 180);
  const cosLat = Math.cos(meanLatRad);

  const ax = aLng * cosLat;
  const ay = aLat;
  const bx = bLng * cosLat;
  const by = bLat;
  const px = pLng * cosLat;
  const py = pLat;

  const dx = bx - ax;
  const dy = by - ay;

  // Projeção escalar sobre o segmento
  const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);

  let projX: number;
  let projY: number;

  if (t < 0) {
    projX = ax;
    projY = ay;
  } else if (t > 1) {
    projX = bx;
    projY = by;
  } else {
    projX = ax + t * dx;
    projY = ay + t * dy;
  }

  const distX = px - projX;
  const distY = py - projY;

  return Math.sqrt(distX * distX + distY * distY);
}

/**
 * Executa o algoritmo de Ramer-Douglas-Peucker (RDP) de forma recursiva.
 * @param points Array de coordenadas [longitude, latitude]
 * @param epsilon Limiar de tolerância em graus (~0.00004 a 0.00006 equivale a ~4-6m)
 */
export function simplifyPolyline(
  points: [number, number][],
  epsilon: number = 0.00005
): [number, number][] {
  if (points.length <= 2) {
    return points;
  }

  let dmax = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  if (dmax > epsilon) {
    const recResults1 = simplifyPolyline(points.slice(0, index + 1), epsilon);
    const recResults2 = simplifyPolyline(points.slice(index), epsilon);

    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  }

  return [points[0], points[end]];
}

/**
 * Otimiza uma polyline viária e retorna métricas detalhadas de compressão geométrica.
 */
export function optimizeRoutePolyline(
  points: [number, number][],
  epsilon: number = 0.00005
): PolylineOptimizationResult {
  const originalCount = points.length;
  if (originalCount <= 2) {
    return {
      originalCount,
      simplifiedCount: originalCount,
      reductionRatio: 0,
      coordinates: points,
    };
  }

  const simplified = simplifyPolyline(points, epsilon);
  const simplifiedCount = simplified.length;
  const reductionRatio = Number((1 - simplifiedCount / originalCount).toFixed(4));

  return {
    originalCount,
    simplifiedCount,
    reductionRatio,
    coordinates: simplified,
  };
}

/**
 * Calcula a distância Haversine em metros entre dois pontos geográficos.
 */
export function haversineDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371e3; // Raio da Terra em metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Filtro de Deadband de GPS.
 * Elimina flutuações e jitter causados por ruído de antena quando o veículo
 * está parado ou deslocando-se em velocidade residual (< minDistanceMeters).
 */
export function filterGpsJitter(
  newCoord: [number, number],
  previousCoord: [number, number] | null,
  deadbandMeters: number = 2.5
): [number, number] {
  if (!previousCoord) {
    return newCoord;
  }

  const dist = haversineDistanceMeters(newCoord, previousCoord);
  if (dist < deadbandMeters) {
    return previousCoord;
  }

  return newCoord;
}

/**
 * Interpolação linear de coordenadas (LERP) para animações fluidas a 60 FPS.
 */
export function lerpCoordinate(
  start: [number, number],
  end: [number, number],
  factor: number
): [number, number] {
  const clampedFactor = Math.max(0, Math.min(1, factor));
  return [
    start[0] + (end[0] - start[0]) * clampedFactor,
    start[1] + (end[1] - start[1]) * clampedFactor,
  ];
}

/**
 * Calcula o azimute (bearing) em graus (0 a 360) entre dois pontos geográficos.
 */
export function calculateBearing(
  start: [number, number],
  end: [number, number]
): number {
  const [lon1, lat1] = start;
  const [lon2, lat2] = end;

  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);

  const bearingRad = Math.atan2(y, x);
  return (bearingRad * (180 / Math.PI) + 360) % 360;
}

/**
 * Suaviza a rotação do veículo resolvendo pelo menor arco angular (evita girar 350° em vez de -10°).
 */
export function smoothBearing(
  currentBearing: number,
  targetBearing: number,
  factor: number = 0.15
): number {
  let diff = (targetBearing - currentBearing) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  const smoothed = (currentBearing + diff * factor) % 360;
  return (smoothed + 360) % 360;
}
