/**
 * ==============================================================================
 * 🧠 PARTIU — SMART DESTINATION SUGGESTIONS ENGINE (V3.0 REAL GEOLOCATION)
 * ==============================================================================
 * Motor 100% autêntico e inteligente de sugestões de destinos:
 *
 * 1. LOCAIS QUE VOCÊ FREQUENTA (Máximo 3 itens):
 *    - Baseado estritamente em hábitos reais do usuário ativo (Casa, Trabalho,
 *      Favoritos salvos por ele, contagem de frequência de destinos e histórico
 *      de corridas reais concluídas).
 *    - SE O USUÁRIO FOR NOVO OU NÃO TIVER LOCAIS FREQUENTADOS:
 *      Retorna lista VAZIA ([]). Zero mocks, zero dados herdados de outros
 *      perfis e zero polos artificiais de outras cidades.
 *    - Restrito a destinos dentro de raio de mobilidade urbana (< 80 km) em
 *      relação à posição atual do passageiro.
 *
 * 2. LOCAIS PRÓXIMOS DE VOCÊ (Máximo 3 itens):
 *    - Calculado em tempo real por proximidade geodésica estrita (metros/km)
 *      em torno das coordenadas GPS atuais do passageiro.
 *    - Utiliza bounding box (bbox) restrita (~4 km) e geocoding reverso/POIs
 *      para encontrar vias de acesso, avenidas, praças e referências locais reais.
 *    - Raio máximo estrito de 8 km. Qualquer local acima de 8 km é descartado.
 *    - Se o usuário estiver fora de Itaperuna, locais de Itaperuna JAMAIS são
 *      usados.
 * ==============================================================================
 */

import {
  calcularDistanciaHaversineMetros,
  formatarDistanciaLegivel,
  LUGARES_CURADOS_ITAPERUNA,
  type GeocodedPlace,
} from "@/services/GeocodingService";
import { addressService } from "@/services/AddressService";
import { getHistoricoViagens } from "@/lib/partiu-engine";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { MapboxConfig } from "@/config/MapboxConfig";
import { silentCatchWarn } from "@/lib/structured-logger";

export interface SuggestedPlaceItem {
  id: string;
  label: string;
  sublabel: string;
  endereco: string;
  coords: [number, number]; // [lng, lat]
  origemSugestao: "FREQUENTE" | "PROXIMO";
  distanciaMetros?: number;
  distanciaFormatada?: string;
  badge?: string;
  frequencia?: number;
  tipo?: string;
}

interface DestinoFrequenteRegistro {
  endereco: string;
  label: string;
  coords?: [number, number];
  contagem: number;
  ultimaVisita: number;
}

/**
 * Obtém a chave de armazenamento isolada estritamente por ID de usuário
 */
function getStorageFrequencyKey(uid?: string): string {
  if (typeof window === "undefined") return "partiu_user_destination_frequency_v3";
  const user = uid || supabaseAuthService.getStoredSession()?.id || localStorage.getItem("partiu_user_id");
  if (user && user !== "passageiro_default") {
    return `partiu_user_destination_frequency_v3_${user}`;
  }
  return "partiu_user_destination_frequency_v3_anon";
}

function normalizarTexto(txt: string): string {
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Registra o uso ou seleção de um destino pelo usuário para aprendizado contínuo
 */
export function registrarDestinoFrequente(
  label: string,
  endereco: string,
  coords?: [number, number],
  uid?: string
): void {
  if (typeof window === "undefined" || !endereco) return;
  try {
    const key = getStorageFrequencyKey(uid);
    const raw = localStorage.getItem(key);
    let registros: DestinoFrequenteRegistro[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) registros = parsed;
      } catch {}
    }

    const endNorm = normalizarTexto(endereco);
    const indexExistente = registros.findIndex(
      (r) => normalizarTexto(r.endereco) === endNorm || normalizarTexto(r.label) === normalizarTexto(label)
    );

    if (indexExistente >= 0) {
      registros[indexExistente].contagem += 1;
      registros[indexExistente].ultimaVisita = Date.now();
      if (coords && !registros[indexExistente].coords) {
        registros[indexExistente].coords = coords;
      }
    } else {
      registros.push({
        label,
        endereco,
        coords,
        contagem: 1,
        ultimaVisita: Date.now(),
      });
    }

    // Mantém ordenado por contagem e trunca para top 20
    registros.sort((a, b) => b.contagem - a.contagem);
    localStorage.setItem(key, JSON.stringify(registros.slice(0, 20)));
    window.dispatchEvent(new CustomEvent("partiu:frequent-destinations-updated"));
  } catch (err) {
    silentCatchWarn("smart-destination-suggestions", err);
  }
}

/**
 * Obtém até 3 locais que o usuário REALMENTE frequenta ou salvou.
 * Se o usuário não tiver locais frequentes (conta nova), retorna array vazio ([]).
 * Zero dados falsos, zero mocks e zero preenchimento com outras cidades.
 */
export async function getTop3LocaisFrequentados(
  coordsOrigem?: [number, number],
  uid?: string,
  phone?: string
): Promise<SuggestedPlaceItem[]> {
  const lugaresAgrupados = new Map<string, {
    label: string;
    endereco: string;
    coords?: [number, number];
    score: number;
    badge: string;
    frequencia: number;
  }>();

  // 1. Endereços salvos prioritários do próprio usuário (Casa e Trabalho)
  try {
    const casa = addressService.getCasa(uid);
    if (casa && casa.endereco) {
      // Ignora se for mock de ambiente de teste antigo
      const eMock = casa.endereco.includes("Itaperuna") && coordsOrigem && calcularDistanciaHaversineMetros(coordsOrigem, casa.coords) > 80000;
      if (!eMock) {
        const dist = coordsOrigem ? calcularDistanciaHaversineMetros(coordsOrigem, casa.coords) : undefined;
        // Só exibe se for na mesma macrorregião (< 80 km)
        if (dist === undefined || dist < 80000) {
          const norm = normalizarTexto(casa.endereco);
          lugaresAgrupados.set(norm, {
            label: "Casa",
            endereco: casa.endereco,
            coords: casa.coords,
            score: 100,
            badge: "Casa",
            frequencia: 10,
          });
        }
      }
    }

    const trabalho = addressService.getTrabalho(uid);
    if (trabalho && trabalho.endereco) {
      const eMock = trabalho.endereco.includes("Itaperuna") && coordsOrigem && calcularDistanciaHaversineMetros(coordsOrigem, trabalho.coords) > 80000;
      if (!eMock) {
        const dist = coordsOrigem ? calcularDistanciaHaversineMetros(coordsOrigem, trabalho.coords) : undefined;
        if (dist === undefined || dist < 80000) {
          const norm = normalizarTexto(trabalho.endereco);
          lugaresAgrupados.set(norm, {
            label: "Trabalho",
            endereco: trabalho.endereco,
            coords: trabalho.coords,
            score: 90,
            badge: "Trabalho",
            frequencia: 8,
          });
        }
      }
    }

    // Outros favoritos salvos no AddressService
    const outrosSalvos = addressService.getFavoritos(uid);
    for (const fav of outrosSalvos) {
      if (fav && fav.endereco) {
        const dist = coordsOrigem ? calcularDistanciaHaversineMetros(coordsOrigem, fav.coords) : undefined;
        if (dist === undefined || dist < 80000) {
          const norm = normalizarTexto(fav.endereco);
          if (!lugaresAgrupados.has(norm)) {
            lugaresAgrupados.set(norm, {
              label: fav.label || "Favorito",
              endereco: fav.endereco,
              coords: fav.coords,
              score: 75,
              badge: "Favorito",
              frequencia: 5,
            });
          }
        }
      }
    }
  } catch {}

  // 2. Histórico de frequência registrado localmente pelo usuário atual
  try {
    const key = getStorageFrequencyKey(uid);
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (raw) {
      const parsed: DestinoFrequenteRegistro[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const reg of parsed) {
          if (!reg || !reg.endereco) continue;
          if (coordsOrigem && reg.coords) {
            const dist = calcularDistanciaHaversineMetros(coordsOrigem, reg.coords);
            if (dist > 80000) continue; // Fora da macrorregião atual
          }

          const norm = normalizarTexto(reg.endereco);
          const pesoTempo = Date.now() - reg.ultimaVisita < 7 * 24 * 60 * 60 * 1000 ? 10 : 0;
          const score = (reg.contagem * 8) + pesoTempo;

          if (lugaresAgrupados.has(norm)) {
            const atual = lugaresAgrupados.get(norm)!;
            atual.score += score;
            atual.frequencia += reg.contagem;
          } else {
            lugaresAgrupados.set(norm, {
              label: reg.label || reg.endereco.split(",")[0]?.trim() || "Destino Frequente",
              endereco: reg.endereco,
              coords: reg.coords,
              score,
              badge: "Frequente",
              frequencia: reg.contagem,
            });
          }
        }
      }
    }
  } catch {}

  // 3. Viagens reais já realizadas no Partiu Engine por este usuário específico
  try {
    if (uid || phone) {
      const historicoViagens = getHistoricoViagens({ userId: uid, phone });
      if (Array.isArray(historicoViagens)) {
        for (const viagem of historicoViagens) {
          if (!viagem || !viagem.destino || viagem.id.startsWith("mock-")) continue;
          const coords: [number, number] | undefined = viagem.destinoCoords
            ? [viagem.destinoCoords.lng, viagem.destinoCoords.lat]
            : undefined;

          if (coordsOrigem && coords) {
            const dist = calcularDistanciaHaversineMetros(coordsOrigem, coords);
            if (dist > 80000) continue;
          }

          const norm = normalizarTexto(viagem.destino);
          if (lugaresAgrupados.has(norm)) {
            const item = lugaresAgrupados.get(norm)!;
            item.score += 6;
            item.frequencia += 1;
          } else {
            lugaresAgrupados.set(norm, {
              label: viagem.destino.split(",")[0]?.trim() || viagem.destino,
              endereco: viagem.destino,
              coords,
              score: 20,
              badge: "Frequente",
              frequencia: 1,
            });
          }
        }
      }
    }
  } catch {}

  // Se o usuário não tem nenhum dado real registrado, RETORNA VAZIO ([]).
  // Zero dados falsos ou preenchimentos arbitrários.
  if (lugaresAgrupados.size === 0) {
    return [];
  }

  // Ordena por pontuação de frequência real
  const candidatos = Array.from(lugaresAgrupados.values()).sort((a, b) => b.score - a.score);
  const resultadoFrequentes: SuggestedPlaceItem[] = [];

  for (const item of candidatos) {
    if (resultadoFrequentes.length >= 3) break;
    const coordsFinal = item.coords || coordsOrigem || [-47.935, -15.795];
    const distanciaMetros = coordsOrigem ? calcularDistanciaHaversineMetros(coordsOrigem, coordsFinal) : undefined;
    resultadoFrequentes.push({
      id: `freq-${normalizarTexto(item.label).slice(0, 15)}-${resultadoFrequentes.length}`,
      label: item.label,
      sublabel: item.endereco,
      endereco: item.endereco,
      coords: coordsFinal,
      origemSugestao: "FREQUENTE",
      distanciaMetros,
      distanciaFormatada: distanciaMetros !== undefined ? formatarDistanciaLegivel(distanciaMetros) : undefined,
      badge: item.badge,
      frequencia: item.frequencia,
    });
  }

  return resultadoFrequentes.slice(0, 3);
}

/**
 * Obtém até 3 locais reais mais próximos da localização GPS exata do usuário.
 * Raio máximo estrito de 8 km. Filtra qualquer local distante.
 */
export async function getTop3LocaisProximosReais(
  coordsOrigem: [number, number],
  excluirEnderecos: string[] = []
): Promise<SuggestedPlaceItem[]> {
  const normExcluidos = new Set(excluirEnderecos.map(normalizarTexto));
  const candidatosProximos: (SuggestedPlaceItem & { distanciaMetros: number })[] = [];

  const lng = coordsOrigem[0];
  const lat = coordsOrigem[1];

  // 1. Catálogo local se o usuário estiver estritamente na cidade de Itaperuna (raio < 25 km)
  const distItaperuna = calcularDistanciaHaversineMetros(coordsOrigem, [-41.888, -21.205]);
  const estaEmItaperuna = distItaperuna <= 25000;

  if (estaEmItaperuna) {
    for (const lugar of LUGARES_CURADOS_ITAPERUNA) {
      const endNorm = normalizarTexto(lugar.endereco);
      const labelNorm = normalizarTexto(lugar.label);
      if (normExcluidos.has(endNorm) || normExcluidos.has(labelNorm)) continue;

      const distancia = calcularDistanciaHaversineMetros(coordsOrigem, lugar.coords);
      // Ignora ponto de embarque imediato (<40m) ou fora do raio urbano (< 8km)
      if (distancia < 40 || distancia > 8000) continue;

      candidatosProximos.push({
        id: `prox-${lugar.id}`,
        label: lugar.label,
        sublabel: lugar.sublabel || lugar.endereco,
        endereco: lugar.endereco,
        coords: lugar.coords,
        origemSugestao: "PROXIMO",
        distanciaMetros: distancia,
        distanciaFormatada: formatarDistanciaLegivel(distancia),
        badge: formatarDistanciaLegivel(distancia),
        tipo: lugar.tipo,
      });
    }
  }

  // 2. Busca ao vivo de alta precisão via Mapbox Geocoding com Bounding Box (BBOX) restrita (~4 km)
  // Utiliza as coordenadas GPS reais do usuário em qualquer cidade do Brasil (ex: Brasília, SP, BH, etc.)
  if (candidatosProximos.length < 3) {
    try {
      const token = MapboxConfig.getAccessToken();
      if (token && token.startsWith("pk.") && !token.includes("example")) {
        const deltaLat = 0.035; // ~3.8 km
        const cosLat = Math.cos((lat * Math.PI) / 180) || 1;
        const deltaLng = Math.abs(0.035 / cosLat);
        const minLng = (lng - deltaLng).toFixed(5);
        const maxLng = (lng + deltaLng).toFixed(5);
        const minLat = (lat - deltaLat).toFixed(5);
        const maxLat = (lat + deltaLat).toFixed(5);
        const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;

        const termos = ["avenida", "praca", "mercado", "farmacia", "hospital"];
        const endpoints = termos.map(
          (termo) =>
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${termo}.json?proximity=${lng},${lat}&bbox=${bbox}&limit=3&country=br&language=pt&access_token=${token}`
        );

        const responses = await Promise.allSettled(
          endpoints.map((url) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2200);
            return fetch(url, { signal: controller.signal })
              .then((r) => {
                clearTimeout(timeout);
                return r.ok ? r.json() : null;
              })
              .catch(() => {
                clearTimeout(timeout);
                return null;
              });
          })
        );

        for (const resp of responses) {
          if (resp.status !== "fulfilled" || !resp.value || !Array.isArray(resp.value.features)) continue;
          for (const feat of resp.value.features) {
            const coords = feat.center as [number, number];
            if (!coords || !Array.isArray(coords)) continue;

            const dist = calcularDistanciaHaversineMetros(coordsOrigem, coords);
            // FILTRO ESTRITO: Descarta embarque (<40m) e descarta locais além de 8 km
            if (dist < 40 || dist > 8000) continue;

            const nome = feat.text || feat.place_name?.split(",")[0] || "Local Próximo";
            const enderecoCompleto = feat.place_name || nome;
            const norm = normalizarTexto(enderecoCompleto);
            const normNome = normalizarTexto(nome);

            if (normExcluidos.has(norm) || normExcluidos.has(normNome)) continue;

            // Evita duplicar local idêntico ou muito próximo (< 100m)
            const jaExiste = candidatosProximos.some(
              (c) =>
                calcularDistanciaHaversineMetros(c.coords, coords) < 100 ||
                normalizarTexto(c.label) === normNome
            );
            if (jaExiste) continue;

            candidatosProximos.push({
              id: `mapbox-prox-${coords[0].toFixed(4)}-${coords[1].toFixed(4)}`,
              label: nome,
              sublabel: feat.place_name || nome,
              endereco: enderecoCompleto,
              coords,
              origemSugestao: "PROXIMO",
              distanciaMetros: dist,
              distanciaFormatada: formatarDistanciaLegivel(dist),
              badge: formatarDistanciaLegivel(dist),
              tipo: "poi",
            });
          }
        }
      }
    } catch (err) {
      silentCatchWarn("getTop3LocaisProximosReais-Mapbox", err);
    }
  }

  // 3. Fallback complementar ao vivo via Photon OpenStreetMap (apenas com raio restrito < 8 km)
  if (candidatosProximos.length < 3) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);
      // Nota: Photon não suporta lang=pt (suporta default, de, en, fr)
      const photonUrl = `https://photon.komoot.io/api/?q=avenida&lat=${lat}&lon=${lng}&limit=6`;
      const res = await fetch(photonUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.features)) {
          for (const f of data.features) {
            if (!f.geometry || !Array.isArray(f.geometry.coordinates)) continue;
            const coords: [number, number] = [f.geometry.coordinates[0], f.geometry.coordinates[1]];
            const dist = calcularDistanciaHaversineMetros(coordsOrigem, coords);

            // FILTRO ESTRITO: Descarta locais a mais de 8 km
            if (dist < 40 || dist > 8000) continue;

            const props = f.properties || {};
            const nome = props.name || props.street || "Ponto de Referência";
            const cidade = props.city || props.town || "";
            const sublabel = props.district ? `${props.district} — ${cidade}` : cidade;
            const enderecoCompleto = `${nome}, ${sublabel}`;
            const norm = normalizarTexto(enderecoCompleto);
            const normNome = normalizarTexto(nome);

            if (normExcluidos.has(norm) || normExcluidos.has(normNome)) continue;

            const jaExiste = candidatosProximos.some(
              (c) =>
                calcularDistanciaHaversineMetros(c.coords, coords) < 100 ||
                normalizarTexto(c.label) === normNome
            );
            if (jaExiste) continue;

            candidatosProximos.push({
              id: `osm-prox-${coords[0].toFixed(4)}-${coords[1].toFixed(4)}`,
              label: nome,
              sublabel: sublabel || enderecoCompleto,
              endereco: enderecoCompleto,
              coords,
              origemSugestao: "PROXIMO",
              distanciaMetros: dist,
              distanciaFormatada: formatarDistanciaLegivel(dist),
              badge: formatarDistanciaLegivel(dist),
              tipo: "poi",
            });
          }
        }
      }
    } catch (err) {
      silentCatchWarn("getTop3LocaisProximosReais-Photon", err);
    }
  }

  // Ordena estritamente por distância crescente (o mais próximo primeiro: 200m, 500m, etc.)
  candidatosProximos.sort((a, b) => a.distanciaMetros - b.distanciaMetros);

  // Retorna os TOP 3 mais próximos reais dentro de 8 km
  return candidatosProximos.slice(0, 3);
}

/**
 * 🎯 Função Principal: Retorna sugestões 100% autênticas:
 * - Até 3 locais que o usuário frequenta (vazio se novo usuário sem histórico)
 * - Até 3 locais reais mais próximos da localização do passageiro (máximo 8 km)
 */
export async function getSeisSugestoesDestino(
  coordsOrigem: [number, number] = [-47.935, -15.795],
  uid?: string,
  phone?: string
): Promise<{
  frequentes: SuggestedPlaceItem[];
  proximos: SuggestedPlaceItem[];
  todas: SuggestedPlaceItem[];
}> {
  const frequentes = await getTop3LocaisFrequentados(coordsOrigem, uid, phone);
  const enderecosFrequentes = frequentes.map((f) => f.endereco);

  const proximos = await getTop3LocaisProximosReais(coordsOrigem, enderecosFrequentes);

  return {
    frequentes,
    proximos,
    todas: [...frequentes, ...proximos],
  };
}
