/**
 * ==============================================================================
 * 🧠 PARTIU — SMART DESTINATION SUGGESTIONS ENGINE (V2.0)
 * ==============================================================================
 * Motor inteligente de sugestões de destinos com:
 * - 3 Locais Mais Frequentados pelo usuário (aprendizado de frequência real,
 *   destinos favoritos, histórico de viagens e preferências)
 * - 3 Locais Próximos Reais calculados geograficamente a partir da localização
 *   GPS exata do passageiro.
 * Total: Exatamente 6 sugestões inteligentes, reais e contextualizadas.
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

function getStorageFrequencyKey(uid?: string): string {
  if (typeof window === "undefined") return "partiu_user_destination_frequency_v2";
  const user = uid || supabaseAuthService.getStoredSession()?.id || localStorage.getItem("partiu_user_id");
  if (user && user !== "passageiro_default") {
    return `partiu_user_destination_frequency_v2_${user}`;
  }
  return "partiu_user_destination_frequency_v2";
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
  if (typeof window === "undefined") return;
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
 * Obtém os 3 locais que o usuário mais frequenta
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

  // 1. Endereços salvos prioritários (Casa e Trabalho)
  try {
    const casa = addressService.getCasa();
    if (casa && casa.endereco) {
      const norm = normalizarTexto(casa.endereco);
      lugaresAgrupados.set(norm, {
        label: "Casa",
        endereco: casa.endereco,
        coords: casa.coords,
        score: 100, // Prioridade máxima
        badge: "Casa",
        frequencia: 15,
      });
    }

    const trabalho = addressService.getTrabalho();
    if (trabalho && trabalho.endereco) {
      const norm = normalizarTexto(trabalho.endereco);
      lugaresAgrupados.set(norm, {
        label: "Trabalho",
        endereco: trabalho.endereco,
        coords: trabalho.coords,
        score: 90, // Alta prioridade
        badge: "Trabalho",
        frequencia: 12,
      });
    }

    // Outros favoritos salvos no AddressService
    const outrosSalvos = addressService.getLocalAddresses();
    for (const fav of outrosSalvos) {
      if (fav && fav.endereco && fav.id !== "loc-casa" && fav.id !== "loc-trabalho") {
        const norm = normalizarTexto(fav.endereco);
        if (!lugaresAgrupados.has(norm)) {
          lugaresAgrupados.set(norm, {
            label: fav.label || "Favorito",
            endereco: fav.endereco,
            coords: fav.coords,
            score: 75,
            badge: "Favorito",
            frequencia: 8,
          });
        }
      }
    }
  } catch {}

  // 2. Histórico de frequência registrado localmente
  try {
    const key = getStorageFrequencyKey(uid);
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (raw) {
      const parsed: DestinoFrequenteRegistro[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const reg of parsed) {
          if (!reg || !reg.endereco) continue;
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

  // 3. Viagens reais já realizadas no Partiu Engine
  try {
    const historicoViagens = getHistoricoViagens(
      uid || phone ? { userId: uid, phone } : undefined
    );
    if (Array.isArray(historicoViagens)) {
      for (const viagem of historicoViagens) {
        if (!viagem || !viagem.destino || viagem.id.startsWith("mock-")) continue;
        const norm = normalizarTexto(viagem.destino);
        const coords: [number, number] | undefined = viagem.destinoCoords
          ? [viagem.destinoCoords.lng, viagem.destinoCoords.lat]
          : undefined;

        if (lugaresAgrupados.has(norm)) {
          const item = lugaresAgrupados.get(norm)!;
          item.score += 6;
          item.frequencia += 1;
        } else {
          lugaresAgrupados.set(norm, {
            label: viagem.destino.split(",")[0]?.trim() || viagem.destino,
            endereco: viagem.destino,
            coords,
            score: 15,
            badge: "Frequente",
            frequencia: 1,
          });
        }
      }
    }
  } catch {}

  // Converte o mapa em lista e ordena por pontuação de frequência
  const candidatos = Array.from(lugaresAgrupados.values()).sort((a, b) => b.score - a.score);

  const resultadoFrequentes: SuggestedPlaceItem[] = [];

  for (const item of candidatos) {
    if (resultadoFrequentes.length >= 3) break;
    const coordsFinal = item.coords || [-41.886, -21.2065];
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

  // Se o usuário ainda não tiver 3 locais frequentes cadastrados (ex: conta nova com 0 ou 1 corrida),
  // complementa os slots vazios com os principais polos cívicos/comerciais de referência da cidade:
  if (resultadoFrequentes.length < 3) {
    const enderecosJaAdicionados = new Set(resultadoFrequentes.map((r) => normalizarTexto(r.endereco)));

    // Polos de alta frequência urbana garantidos
    const polosReferencia: GeocodedPlace[] = LUGARES_CURADOS_ITAPERUNA.filter(
      (l) => l.tipo === "comercio" || l.tipo === "hospital" || l.tipo === "transporte" || l.tipo === "faculdade"
    );

    for (const polo of polosReferencia) {
      if (resultadoFrequentes.length >= 3) break;
      const norm = normalizarTexto(polo.endereco);
      if (!enderecosJaAdicionados.has(norm)) {
        enderecosJaAdicionados.add(norm);
        const dist = coordsOrigem ? calcularDistanciaHaversineMetros(coordsOrigem, polo.coords) : undefined;
        resultadoFrequentes.push({
          id: `freq-ref-${polo.id}`,
          label: polo.label,
          sublabel: polo.sublabel || polo.endereco,
          endereco: polo.endereco,
          coords: polo.coords,
          origemSugestao: "FREQUENTE",
          distanciaMetros: dist,
          distanciaFormatada: dist !== undefined ? formatarDistanciaLegivel(dist) : undefined,
          badge: "Mais Buscado",
          frequencia: 1,
        });
      }
    }
  }

  return resultadoFrequentes.slice(0, 3);
}

/**
 * Obtém os 3 locais reais mais próximos da localização GPS exata do usuário
 */
export async function getTop3LocaisProximosReais(
  coordsOrigem: [number, number],
  excluirEnderecos: string[] = []
): Promise<SuggestedPlaceItem[]> {
  const normExcluidos = new Set(excluirEnderecos.map(normalizarTexto));
  const candidatosProximos: (SuggestedPlaceItem & { distanciaMetros: number })[] = [];

  // 1. Busca em catálogo local estruturado de alta fidelidade
  for (const lugar of LUGARES_CURADOS_ITAPERUNA) {
    const endNorm = normalizarTexto(lugar.endereco);
    const labelNorm = normalizarTexto(lugar.label);
    if (normExcluidos.has(endNorm) || normExcluidos.has(labelNorm)) continue;

    const distancia = calcularDistanciaHaversineMetros(coordsOrigem, lugar.coords);

    // Ignora se estiver a menos de 40m (é a própria posição do passageiro)
    if (distancia < 40) continue;

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

  // 2. Busca remota ao vivo via Mapbox Places API ou Photon OSM
  // Se o usuário estiver em qualquer outra praça/cidade fora de Itaperuna
  const distanciaItaperuna = calcularDistanciaHaversineMetros(coordsOrigem, [-41.888, -21.205]);
  const estaForaDeItaperuna = distanciaItaperuna > 25000;

  if (estaForaDeItaperuna || candidatosProximos.length < 5) {
    try {
      const token = MapboxConfig.getAccessToken();
      if (token && token.startsWith("pk.")) {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/shopping,hospital,farmacia,praca.json?proximity=${coordsOrigem[0]},${coordsOrigem[1]}&types=poi,address&limit=6&language=pt&access_token=${token}`;
        const res = await fetch(endpoint, { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.features)) {
            for (const feat of data.features) {
              const coords = feat.center as [number, number];
              if (!coords || !Array.isArray(coords)) continue;

              const dist = calcularDistanciaHaversineMetros(coordsOrigem, coords);
              if (dist < 40) continue; // Ponto de embarque imediato

              const nome = feat.text || feat.place_name?.split(",")[0] || "Local Próximo";
              const enderecoCompleto = feat.place_name || nome;
              const norm = normalizarTexto(enderecoCompleto);

              if (normExcluidos.has(norm)) continue;

              candidatosProximos.push({
                id: `mapbox-poi-${coords[0].toFixed(4)}-${coords[1].toFixed(4)}`,
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
      }
    } catch (_) {
      // Fallback gracioso
    }

    // Fallback secundário ao vivo via Photon OpenStreetMap
    if (candidatosProximos.length < 3) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1800);
        const photonUrl = `https://photon.komoot.io/api/?q=centro&lat=${coordsOrigem[1]}&lon=${coordsOrigem[0]}&limit=6&lang=pt`;
        const res = await fetch(photonUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.features)) {
            for (const f of data.features) {
              if (!f.geometry || !Array.isArray(f.geometry.coordinates)) continue;
              const coords: [number, number] = [f.geometry.coordinates[0], f.geometry.coordinates[1]];
              const dist = calcularDistanciaHaversineMetros(coordsOrigem, coords);
              if (dist < 40) continue;

              const props = f.properties || {};
              const nome = props.name || props.street || "Ponto de Referência";
              const cidade = props.city || props.town || "";
              const sublabel = props.district ? `${props.district} — ${cidade}` : cidade;
              const enderecoCompleto = `${nome}, ${sublabel}`;
              const norm = normalizarTexto(enderecoCompleto);

              if (normExcluidos.has(norm)) continue;

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
      } catch (_) {}
    }
  }

  // Ordena estritamente pela menor distância (mais próximo primeiro)
  candidatosProximos.sort((a, b) => a.distanciaMetros - b.distanciaMetros);

  // Filtra itens duplicados por coordenadas muito próximas (< 80 metros)
  const filtrados: SuggestedPlaceItem[] = [];
  for (const c of candidatosProximos) {
    if (filtrados.length >= 3) break;
    const jaTemMuitoPerto = filtrados.some(
      (f) => calcularDistanciaHaversineMetros(f.coords, c.coords) < 80
    );
    if (!jaTemMuitoPerto) {
      filtrados.push(c);
    }
  }

  return filtrados;
}

/**
 * 🎯 Função Principal: Retorna exatamente 6 sugestões reais e inteligentes:
 * - 3 locais que o usuário frequenta (aprendizado de histórico/favoritos)
 * - 3 locais reais mais próximos da localização do passageiro
 */
export async function getSeisSugestoesDestino(
  coordsOrigem: [number, number] = [-41.8880, -21.2050],
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

  const todas = [...frequentes, ...proximos];

  return {
    frequentes,
    proximos,
    todas,
  };
}
