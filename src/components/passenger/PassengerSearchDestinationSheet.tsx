import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Search,
  MapPin,
  Clock,
  Navigation,
  X,
  ChevronRight,
  ArrowUpDown,
  Building2,
  GraduationCap,
  Cross,
  Bus,
  ShoppingBag,
  Home,
  Briefcase,
  Star,
  User,
  Users,
  Compass,
  Loader2,
  Sparkles,
} from "lucide-react";
import { usePassengerRide } from "@/contexts/PassengerRideContext";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme } from "@/contexts/WhiteLabelThemeContext";
import { DEFAULT_ORIGIN } from "@/lib/passenger/passenger-ride-machine";
import { calcularDistanciaHaversine } from "@/lib/passenger/eta-service";
import {
  geocodingService,
  type GeocodedPlace,
  LUGARES_CURADOS_ITAPERUNA,
} from "@/lib/passenger/geocoding-service";
import { reverseGeocodingService } from "@/services/ReverseGeocodingService";
import { addressService } from "@/services/AddressService";
import {
  getSeisSugestoesDestino,
  registrarDestinoFrequente,
  type SuggestedPlaceItem,
} from "@/lib/passenger/smart-destination-suggestions";
import { AddressSetupModal } from "@/components/passenger/AddressSetupModal";
import { FavoritesManagerModal } from "@/components/passenger/FavoritesManagerModal";
import { AddressSearchSkeleton } from "@/components/ui/skeleton";
import { hapticFeedback } from "@/lib/haptics/haptic-feedback";
import { silentCatchWarn } from "@/lib/structured-logger";
import { getHistoricoViagens } from "@/lib/partiu-engine";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";

function getStorageRecentKey(): string {
  if (typeof window === "undefined") return "partiu_recent_destinations_v1";
  try {
    const session = supabaseAuthService.getStoredSession();
    const uid = session?.id || localStorage.getItem("partiu_user_id");
    if (uid) return `partiu_recent_destinations_v1_${uid}`;
  } catch {}
  return "partiu_recent_destinations_v1";
}

interface RecentItem {
  id: string;
  label: string;
  endereco: string;
  coords?: [number, number] | undefined;
  timestamp: number;
}

/**
 * Recupera o histórico autêntico e real de viagens exclusivo do passageiro ativo.
 * Se não houver viagens reais para o usuário atual, retorna array vazio `[]`.
 */
function carregarHistoricoReal(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getStorageRecentKey();
    const salvo = localStorage.getItem(key);
    if (salvo) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed)) {
        // Expurgar qualquer dado mock/fake legado
        const validos = parsed.filter(
          (item: any) =>
            item &&
            typeof item === "object" &&
            item.id &&
            !item.id.startsWith("mock-") &&
            item.id !== "rec-1" &&
            item.id !== "rec-2" &&
            item.endereco &&
            !item.endereco.includes("Itaperuna")
        );
        // Higieniza o storage para não deixar resíduos em disco/cache
        if (validos.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(validos));
        }
        if (validos.length > 0) {
          return validos.slice(0, 2);
        }
      }
    }

    // Se o storage recente deste usuário estiver limpo, consulta corridas reais dele
    const session = supabaseAuthService.getStoredSession();
    const userPhone = session?.phone || localStorage.getItem("partiu_user_phone");

    const historicoEngine = getHistoricoViagens(userPhone ? { phone: userPhone } : undefined);
    if (Array.isArray(historicoEngine) && historicoEngine.length > 0) {
      const corridasValidas = historicoEngine
        .filter(
          (c) =>
            c &&
            c.destino &&
            c.id &&
            !c.id.startsWith("mock-")
        )
        .slice(0, 2);

      if (corridasValidas.length > 0) {
        return corridasValidas.map((c) => ({
          id: `ride-${c.id}`,
          label: c.destino.split(",")[0]?.trim() || c.destino,
          endereco: c.destino,
          coords: c.destinoCoords
            ? [c.destinoCoords.lng, c.destinoCoords.lat]
            : undefined,
          timestamp: new Date(c.criadoEm).getTime() || Date.now(),
        }));
      }
    }
  } catch (err) {
    silentCatchWarn("PassengerSearchDestinationSheet", err);
  }

  return [];
}

interface SearchDestinationItemRowProps {
  item: GeocodedPlace | SuggestedPlaceItem;
  distText: string | null;
  badge?: string;
  onSelect: (item: any) => void;
  getIcon: (label: string, origemSugestao?: string) => React.ReactNode;
}

const SearchDestinationItemRow = React.memo(function SearchDestinationItemRow({
  item,
  distText,
  badge,
  onSelect,
  getIcon,
}: SearchDestinationItemRowProps) {
  const handleClick = React.useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  const placeItem = item as SuggestedPlaceItem;
  const badgeFinal = badge || placeItem.badge;
  const isFrequente = placeItem.origemSugestao === "FREQUENTE";

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full p-3 flex items-center gap-3 text-left hover:bg-slate-50 rounded-2xl transition active:scale-[0.99] cursor-pointer group"
    >
      <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0 transition">
        {getIcon(item.label, placeItem.origemSugestao)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs sm:text-sm font-black text-slate-900 truncate leading-tight transition">
            {item.label}
          </p>
          {badgeFinal && (
            <span
              className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                isFrequente || badgeFinal === "Casa" || badgeFinal === "Trabalho" || badgeFinal === "Favorito" || badgeFinal === "Frequente"
                  ? "text-amber-800 bg-amber-50 border-amber-200"
                  : "text-blue-800 bg-blue-50 border-blue-200"
              }`}
            >
              {badgeFinal}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-700 truncate mt-0.5 font-medium">
          {item.sublabel || item.endereco}
        </p>
      </div>

      {(item.distanciaFormatada || distText) && (
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300 shrink-0">
          {item.distanciaFormatada ? `~${item.distanciaFormatada}` : distText}
        </span>
      )}

      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 transition" />
    </button>
  );
});

interface RecentTripItemRowProps {
  item: RecentItem;
  distText: string | null;
  onSelect: (endereco: string, coords?: [number, number], label?: string) => void;
}

const RecentTripItemRow = React.memo(function RecentTripItemRow({
  item,
  distText,
  onSelect,
}: RecentTripItemRowProps) {
  const handleClick = React.useCallback(() => {
    onSelect(item.endereco, item.coords, item.label);
  }, [item, onSelect]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full p-3 flex items-center gap-3 text-left hover:bg-slate-50 rounded-2xl transition active:scale-[0.99] cursor-pointer group"
    >
      <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 transition">
        <Clock className="w-4 h-4 stroke-[2.2]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-black text-slate-900 truncate leading-tight transition">
            {item.label}
          </span>
          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
            Recente
          </span>
        </div>
        <p className="text-xs text-slate-700 truncate mt-0.5 font-medium">
          {item.endereco}
        </p>
      </div>

      {distText && (
        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300 shrink-0">
          {distText}
        </span>
      )}

      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 transition" />
    </button>
  );
});

export const PassengerSearchDestinationSheet = React.memo(function PassengerSearchDestinationSheet() {
  const { corPrimaria, corSecundaria, corTextoPrimaria } = useBrandTheme();
  const { appConfig } = useTheme();
  const { colors, ui } = appConfig.branding;

  const {
    state,
    origem,
    origemCoords,
    destino,
    destinoCoords,
    setOrigemEndereco,
    swapOrigemDestino,
    selectDestination,
    selectDestinationOnMap,
    cancelSearch,
    viajanteOutraPessoa,
    nomeOutroPassageiro,
    setViajanteOutraPessoa,
    setNomeOutroPassageiro,
  } = usePassengerRide();

  // Estado dos inputs: Origem preenchida automaticamente com o GPS e Destino em branco
  const [origemLocal, setOrigemLocal] = useState<string>(() => {
    if (origem && origem !== "Meu Local Atual" && !origem.includes("Localizando")) {
      return origem;
    }
    const coords = origemCoords || DEFAULT_ORIGIN.coords;
    const instant = reverseGeocodingService.resolveInstantProximityAddress(coords);
    return instant || DEFAULT_ORIGIN.endereco;
  });
  const [buscaDestino, setBuscaDestino] = useState<string>(() => {
    return destino && destino !== "Definir no mapa" ? destino : "";
  });
  const [isResolvingGps, setIsResolvingGps] = useState(false);
  const hasUserClearedOriginRef = useRef(false);

  useEffect(() => {
    if (hasUserClearedOriginRef.current) return;
    if (origem && !origem.includes("Localizando") && origem !== "Meu Local Atual") {
      setOrigemLocal(origem);
    }
  }, [origem]);

  // Resolução imediata proativa ao montar caso a origem ainda esteja no valor padrão ou pendente
  useEffect(() => {
    if (hasUserClearedOriginRef.current) return;
    if (!origem || origem.includes("Localizando") || origem === "Meu Local Atual" || origem === DEFAULT_ORIGIN.endereco) {
      const coords = origemCoords || DEFAULT_ORIGIN.coords;
      const instant = reverseGeocodingService.resolveInstantProximityAddress(coords);
      if (instant && instant !== origemLocal) {
        setOrigemLocal(instant);
        setOrigemEndereco(instant, coords);
      }

      geocodingService.geocodificarReverso(coords).then((nomeVia) => {
        if (hasUserClearedOriginRef.current) return;
        if (nomeVia && !nomeVia.includes("Local no mapa")) {
          setOrigemLocal(nomeVia);
          setOrigemEndereco(nomeVia, coords);
        }
      }).catch(() => {});
    }
  }, [origem, origemCoords, origemLocal, setOrigemEndereco]);

  // Campo ativo: Foco inicial direto no Embarque se state for EDITING_PICKUP, caso contrário no Destino
  const [campoAtivo, setCampoAtivo] = useState<"embarque" | "destino">(() => {
    return state === "EDITING_PICKUP" ? "embarque" : "destino";
  });

  useEffect(() => {
    if (state === "EDITING_PICKUP") {
      setCampoAtivo("embarque");
    }
  }, [state]);
  const [modalPassageiroAberto, setModalPassageiroAberto] = useState(false);
  const [modalEnderecoAberto, setModalEnderecoAberto] = useState<"casa" | "trabalho" | null>(null);
  const [modalFavoritosAberto, setModalFavoritosAberto] = useState(false);

  // Handlers reativos dos atalhos com verificação de Estado Duplo (Cadastrado / Não Cadastrado)
  const handleShortcutCasa = () => {
    hapticFeedback.light();
    const casa = addressService.getCasa();
    if (casa && casa.endereco) {
      handleSelectDestino(casa.endereco, casa.coords, "Casa");
    } else {
      setModalEnderecoAberto("casa");
    }
  };

  const handleShortcutTrabalho = () => {
    hapticFeedback.light();
    const trabalho = addressService.getTrabalho();
    if (trabalho && trabalho.endereco) {
      handleSelectDestino(trabalho.endereco, trabalho.coords, "Trabalho");
    } else {
      setModalEnderecoAberto("trabalho");
    }
  };

  const handleShortcutFavoritos = () => {
    hapticFeedback.light();
    setModalFavoritosAberto(true);
  };

  // Sugestões dinâmicas e histórico recente (estritamente as 2 últimas viagens)
  const [lugaresEncontrados, setLugaresEncontrados] = useState<GeocodedPlace[]>([]);
  const [carregandoLugares, setCarregandoLugares] = useState(false);

  // 6 Sugestões inteligentes: 3 que o usuário mais frequenta + 3 mais próximos da localização GPS real
  const [sugestoesInteligentes, setSugestoesInteligentes] = useState<{
    frequentes: SuggestedPlaceItem[];
    proximos: SuggestedPlaceItem[];
    todas: SuggestedPlaceItem[];
  }>({ frequentes: [], proximos: [], todas: [] });
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(true);

  const [historicoRecente, setHistoricoRecente] = useState<RecentItem[]>(() => carregarHistoricoReal());

  const inputDestinoRef = useRef<HTMLInputElement>(null);
  const inputOrigemRef = useRef<HTMLInputElement>(null);

  // 1. Notificação para esconder barra de navegação no modal
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("partiu:toggle-bottom-nav", { detail: { visible: false } }));
    return () => {
      window.dispatchEvent(new CustomEvent("partiu:toggle-bottom-nav", { detail: { visible: true } }));
    };
  }, []);

  // 2. Foco automático imediato no Destino ao abrir a tela
  useEffect(() => {
    const timer = setTimeout(() => {
      if (campoAtivo === "destino") {
        inputDestinoRef.current?.focus();
      } else {
        inputOrigemRef.current?.focus();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [campoAtivo]);


  // 4. Autocompletar Dinâmico em Tempo Real estilo Google (com geobias na localização do usuário)
  useEffect(() => {
    let ativo = true;
    const termo = campoAtivo === "embarque" ? origemLocal : buscaDestino;
    const estaEmItaperuna = origemCoords
      ? calcularDistanciaHaversine(origemCoords, [-41.888, -21.205]) <= 25
      : false;
    const fallbackLugares = estaEmItaperuna ? LUGARES_CURADOS_ITAPERUNA : [];

    if (!termo.trim() || (campoAtivo === "embarque" && termo === "Meu Local Atual")) {
      geocodingService
        .buscarLugares("", origemCoords)
        .then((locaisProximos) => {
          if (ativo) setLugaresEncontrados(locaisProximos);
        })
        .catch(() => {
          if (ativo) setLugaresEncontrados(fallbackLugares);
        });
      return;
    }

    setCarregandoLugares(true);
    const timer = setTimeout(async () => {
      try {
        const resultados = await geocodingService.buscarLugares(termo, origemCoords);
        if (ativo) {
          setLugaresEncontrados(resultados);
        }
      } catch {
        if (ativo) setLugaresEncontrados(fallbackLugares);
      } finally {
        if (ativo) setCarregandoLugares(false);
      }
    }, 180);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [buscaDestino, origemLocal, campoAtivo, origemCoords]);

  // 4.1 Carregamento inteligente e em tempo real das 6 sugestões reais de destino (3 frequentes + 3 próximos)
  useEffect(() => {
    let ativo = true;
    const coordsRef = origemCoords || DEFAULT_ORIGIN.coords;
    const session = supabaseAuthService.getStoredSession();
    const uid = session?.id || (typeof window !== "undefined" ? localStorage.getItem("partiu_user_id") || undefined : undefined);
    const phone = session?.phone || (typeof window !== "undefined" ? localStorage.getItem("partiu_user_phone") || undefined : undefined);

    setCarregandoSugestoes(true);
    getSeisSugestoesDestino(coordsRef, uid, phone)
      .then((res) => {
        if (ativo) {
          setSugestoesInteligentes(res);
          setCarregandoSugestoes(false);
        }
      })
      .catch((err) => {
        silentCatchWarn("PassengerSearchDestinationSheet", err);
        if (ativo) setCarregandoSugestoes(false);
      });

    const handleAtualizar = () => {
      getSeisSugestoesDestino(coordsRef, uid, phone)
        .then((res) => {
          if (ativo) setSugestoesInteligentes(res);
        })
        .catch(() => {});
    };

    window.addEventListener("partiu:frequent-destinations-updated", handleAtualizar);
    window.addEventListener("partiu:addresses_updated", handleAtualizar);

    return () => {
      ativo = false;
      window.removeEventListener("partiu:frequent-destinations-updated", handleAtualizar);
      window.removeEventListener("partiu:addresses_updated", handleAtualizar);
    };
  }, [origemCoords]);

  // 4.2 Limpar histórico recente e atualizar sugestões ao alternar de usuário ou logout
  useEffect(() => {
    const handleHistoryCleared = () => {
      setHistoricoRecente([]);
      const coordsRef = origemCoords || DEFAULT_ORIGIN.coords;
      getSeisSugestoesDestino(coordsRef).then((res) => {
        setSugestoesInteligentes(res);
      }).catch(() => {});
    };
    window.addEventListener("partiu:history-cleared", handleHistoryCleared);
    return () => window.removeEventListener("partiu:history-cleared", handleHistoryCleared);
  }, [origemCoords]);

  // 5. Salvar e recuperar no histórico persistente escopado por usuário
  function registrarViagemRecente(label: string, endereco: string, coords?: [number, number]) {
    try {
      const novo: RecentItem = {
        id: `rec-${Date.now()}`,
        label,
        endereco,
        coords,
        timestamp: Date.now(),
      };
      const filtrados = historicoRecente.filter(
        (h) => h.endereco.toLowerCase() !== endereco.toLowerCase()
      );
      const atualizados = [novo, ...filtrados].slice(0, 2);
      setHistoricoRecente(atualizados);
      localStorage.setItem(getStorageRecentKey(), JSON.stringify(atualizados));
    } catch (err) { silentCatchWarn("PassengerSearchDestinationSheet", err); }
  }

  // 6. Seleção Rápida de Destino com Avanço Automático para a Próxima Etapa
  function handleSelectDestino(endereco: string, coords?: [number, number], label?: string) {
    hapticFeedback.selection();
    let coordsFinal = coords;
    if (!coordsFinal) {
      const match =
        sugestoesInteligentes.todas.find(
          (s) => s.endereco.toLowerCase() === endereco.toLowerCase() || s.label.toLowerCase() === endereco.toLowerCase()
        ) ||
        lugaresEncontrados.find(
          (l) => l.endereco.toLowerCase() === endereco.toLowerCase() || l.label.toLowerCase() === endereco.toLowerCase()
        ) ||
        lugaresEncontrados[0] ||
        LUGARES_CURADOS_ITAPERUNA[0];
      coordsFinal = match ? match.coords : [-41.886, -21.2065];
    }

    const rotuloFinal = label || endereco.split(",")[0] || endereco;
    registrarViagemRecente(rotuloFinal, endereco, coordsFinal);
    registrarDestinoFrequente(rotuloFinal, endereco, coordsFinal);
    setBuscaDestino(rotuloFinal);

    // Se a origem estiver preenchida, avança automaticamente para o modal de seleção de veículo!
    selectDestination(endereco, coordsFinal);
  }

  // 7. Seleção de Origem por Sugestão da Lista
  function handleSelectOrigem(lugar: GeocodedPlace) {
    hapticFeedback.selection();
    hasUserClearedOriginRef.current = false;
    setOrigemLocal(lugar.label);
    setOrigemEndereco(lugar.endereco, lugar.coords);
    // Move o foco automaticamente para o destino se estiver vazio
    if (!buscaDestino.trim()) {
      setCampoAtivo("destino");
      setTimeout(() => inputDestinoRef.current?.focus(), 60);
    } else {
      // Se o destino já estiver preenchido, avança direto mantendo o destino e suas coordenadas
      selectDestination(buscaDestino, destinoCoords);
    }
  }

  // 8. Seleção de Origem Personalizada (Digitada pelo Usuário)
  function handleCustomOrigem(termo: string) {
    hapticFeedback.selection();
    const termoLimpo = termo.trim();
    if (!termoLimpo) return;
    hasUserClearedOriginRef.current = false;
    const match = lugaresEncontrados.find(
      (l) => l.label.toLowerCase() === termoLimpo.toLowerCase() || l.endereco.toLowerCase() === termoLimpo.toLowerCase()
    ) || lugaresEncontrados[0];
    const coordsFinal = match ? match.coords : (origemCoords || DEFAULT_ORIGIN.coords);
    const rotuloFinal = match ? match.label : termoLimpo;
    const enderecoFinal = match ? match.endereco : termoLimpo;
    setOrigemLocal(rotuloFinal);
    setOrigemEndereco(enderecoFinal, coordsFinal);
    if (!buscaDestino.trim()) {
      setCampoAtivo("destino");
      setTimeout(() => inputDestinoRef.current?.focus(), 60);
    } else {
      selectDestination(buscaDestino, destinoCoords);
    }
  }

  // 9. Restaurar e Sincronizar com GPS Atual
  async function handleUsarGpsAtual() {
    hapticFeedback.light();
    hasUserClearedOriginRef.current = false;
    try {
      localStorage.removeItem("partiu_origin_user_locked");
    } catch (_) {}
    setIsResolvingGps(true);
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          const instant = reverseGeocodingService.resolveInstantProximityAddress(coords);
          if (instant) {
            setOrigemLocal(instant);
            setOrigemEndereco(instant, coords);
          }
          setIsResolvingGps(false);
          const nomeVia = await geocodingService.geocodificarReverso(coords);
          if (nomeVia && !nomeVia.includes("Local no mapa")) {
            setOrigemLocal(nomeVia);
            setOrigemEndereco(nomeVia, coords);
          }
        },
        () => {
          navigator.geolocation.getCurrentPosition(
            async (pos2) => {
              const coords2: [number, number] = [pos2.coords.longitude, pos2.coords.latitude];
              const nomeVia = await geocodingService.geocodificarReverso(coords2);
              setOrigemLocal(nomeVia);
              setOrigemEndereco(nomeVia, coords2);
              setIsResolvingGps(false);
            },
            () => {
              setIsResolvingGps(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        },
        { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 }
      );
    } else {
      setIsResolvingGps(false);
    }
  }

  // Cálculo de distância em relação à origem atual
  function getDistanciaTexto(coords?: [number, number]): string | null {
    if (!coords || !origemCoords) return null;
    try {
      const metros = calcularDistanciaHaversine(origemCoords, coords);
      if (metros < 1000) {
        return `~${Math.round(metros / 50) * 50} m`;
      }
      return `~${(metros / 1000).toFixed(1).replace(".", ",")} km`;
    } catch {
      return null;
    }
  }

  // Ícone por categoria
  function getCategoryIcon(label: string, origemSugestao?: string) {
    const l = label.toLowerCase();
    if (l === "casa" || l.startsWith("casa ") || l.includes("minha casa")) {
      return <Home className="w-4 h-4 text-emerald-600" />;
    }
    if (l === "trabalho" || l.startsWith("trabalho ") || l.includes("meu trabalho")) {
      return <Briefcase className="w-4 h-4 text-blue-600" />;
    }
    if (l === "favorito" || l.includes("favorito")) {
      return <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />;
    }
    if (l.includes("hospital") || l.includes("avaí") || l.includes("upa") || l.includes("saúde") || l.includes("clínica")) {
      return <Cross className="w-4 h-4 text-rose-500" />;
    }
    if (l.includes("redentor") || l.includes("afya") || l.includes("faculdade") || l.includes("escola") || l.includes("universidade")) {
      return <GraduationCap className="w-4 h-4 text-indigo-500" />;
    }
    if (l.includes("rodoviário") || l.includes("terminal") || l.includes("balsa") || l.includes("estação")) {
      return <Bus className="w-4 h-4 text-blue-500" />;
    }
    if (l.includes("mercado") || l.includes("fluminense") || l.includes("shopping") || l.includes("supermercado")) {
      return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
    }
    if (origemSugestao === "FREQUENTE") {
      return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
    if (origemSugestao === "PROXIMO") {
      return <MapPin className="w-4 h-4 text-blue-600" />;
    }
    return <Building2 className="w-4 h-4 text-slate-500" />;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-hide-bottom-nav="true"
      onClick={cancelSearch}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-[92dvh] sm:h-[86dvh] max-h-[100dvh] bg-white rounded-t-[32px] sm:rounded-3xl flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom duration-250 select-none pb-safe"
      >
        {/* Barra superior de arraste suave com gesto de swipe-down */}
        <div
          onTouchStart={(e) => {
            (e.currentTarget as any)._startY = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            const startY = (e.currentTarget as any)._startY;
            if (startY && e.changedTouches[0].clientY - startY > 50) {
              hapticFeedback.light();
              cancelSearch();
            }
          }}
          className="pt-2 pb-1.5 flex justify-center cursor-grab active:cursor-grabbing shrink-0 sm:hidden touch-none"
        >
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* 1. CABEÇALHO LIMPO COM SELETOR DE PASSAGEIRO (ESTILO 99) */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-2.5">
            {/* Botão Voltar */}
            <button
              type="button"
              onClick={() => {
                hapticFeedback.light();
                cancelSearch();
              }}
              aria-label="Voltar para o mapa"
              className="min-w-[48px] min-h-[48px] -ml-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:scale-95 rounded-full transition cursor-pointer flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
            </button>

            {/* Seletor de Passageiro ("Para mim ▾" / "Outra pessoa ▾") */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModalPassageiroAberto(!modalPassageiroAberto)}
                className="min-h-[44px] px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-slate-200/70"
              >
                {viajanteOutraPessoa ? (
                  <Users className="w-3.5 h-3.5 text-primary-700" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span>
                  {viajanteOutraPessoa
                    ? `Para: ${nomeOutroPassageiro || "Outra pessoa"}`
                    : "Para mim"}
                </span>
                <span className="text-xs text-slate-500">▾</span>
              </button>

              {/* Dropdown Flutuante do Seletor de Passageiro */}
              {modalPassageiroAberto && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-30 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Quem vai viajar?
                  </p>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setViajanteOutraPessoa(false);
                        setModalPassageiroAberto(false);
                      }}
                      style={
                        !viajanteOutraPessoa
                          ? { backgroundColor: colors.primary, color: colors.surface, borderRadius: ui.borderRadius }
                          : { borderRadius: ui.borderRadius }
                      }
                      className={`py-2 px-2.5 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                        !viajanteOutraPessoa ? "shadow-2xs" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span>Para mim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViajanteOutraPessoa(true)}
                      style={
                        viajanteOutraPessoa
                          ? { backgroundColor: colors.primary, color: colors.surface, borderRadius: ui.borderRadius }
                          : { borderRadius: ui.borderRadius }
                      }
                      className={`py-2 px-2.5 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                        viajanteOutraPessoa ? "shadow-2xs" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Users className="w-3 h-3" />
                      <span>Outra pessoa</span>
                    </button>
                  </div>

                  {viajanteOutraPessoa && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={nomeOutroPassageiro}
                        onChange={(e) => setNomeOutroPassageiro(e.target.value)}
                        placeholder="Nome do passageiro..."
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setModalPassageiroAberto(false)}
                        className="w-full mt-2 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-black cursor-pointer hover:bg-slate-800"
                      >
                        Salvar Passageiro
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Atalho no Topo: Definir no Mapa */}
          <button
            type="button"
            onClick={selectDestinationOnMap}
            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="Escolher destino diretamente no mapa"
          >
            <Compass className="w-3.5 h-3.5 text-primary-700 stroke-[2.4]" />
            <span>No mapa</span>
          </button>
        </div>

        {/* 2. CAMPOS CONECTADOS DE ORIGEM E DESTINO (LIMPO E INTUITIVO ESTILO 99) */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-slate-100 shrink-0 space-y-2.5">
          <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-3 relative flex items-center gap-3">
            {/* Coluna Visual com Indicadores Conectados Padrão 99 */}
            <div className="flex flex-col items-center justify-between h-20 py-2 shrink-0">
              {/* Ponto Verde de Embarque */}
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              {/* Linha Conectora */}
              <div className="w-0.5 flex-1 bg-slate-300 my-1" />
              {/* Marcador de Destino */}
              <div
                style={{
                  backgroundColor: colors.primary,
                  boxShadow: `0 0 0 4px ${colors.primary}25`,
                }}
                className="w-2.5 h-2.5 rounded-[2px]"
              />
            </div>

            {/* Coluna dos Inputs de Texto */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* CAMPO 1: ORIGEM (LOCAL DE EMBARQUE) */}
              <div className="flex items-center justify-between gap-2">
                <input
                  ref={inputOrigemRef}
                  type="text"
                  value={origemLocal}
                  onFocus={() => setCampoAtivo("embarque")}
                  onChange={(e) => {
                    hasUserClearedOriginRef.current = true;
                    setOrigemLocal(e.target.value);
                    setOrigemEndereco(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && origemLocal.trim()) {
                      handleCustomOrigem(origemLocal.trim());
                    }
                  }}
                  placeholder="Local de embarque..."
                  className={`w-full text-xs sm:text-[13px] font-semibold bg-transparent placeholder:text-slate-400 truncate outline-none py-1 transition ${
                    campoAtivo === "embarque" ? "text-slate-950 font-bold" : "text-slate-700"
                  }`}
                />

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={isResolvingGps}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleUsarGpsAtual();
                    }}
                    className="px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition hover:opacity-80 disabled:opacity-50"
                    style={{ color: colors.primary }}
                    title="Restaurar GPS atual"
                  >
                    {isResolvingGps ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: colors.primary }} />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" style={{ fill: colors.primary, color: colors.primary }} />
                    )}
                    <span>GPS</span>
                  </button>

                  {origemLocal && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticFeedback.light();
                        hasUserClearedOriginRef.current = true;
                        setOrigemLocal("");
                        setOrigemEndereco("");
                        setCampoAtivo("embarque");
                        inputOrigemRef.current?.focus();
                      }}
                      className="min-w-[36px] min-h-[36px] p-1.5 text-slate-500 hover:text-slate-800 rounded-full cursor-pointer flex items-center justify-center -mr-1 transition"
                      title="Limpar embarque"
                      aria-label="Limpar campo de embarque"
                    >
                      <X className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  )}
                </div>
              </div>

              {/* DIVISOR INTERNO SUTIL */}
              <div className="border-t border-slate-200" />

              {/* CAMPO 2: DESTINO (PARA ONDE VAMOS? - COM FOCO INICIAL) */}
              <div className="flex items-center justify-between gap-2">
                <input
                  ref={inputDestinoRef}
                  type="text"
                  value={buscaDestino}
                  onFocus={() => setCampoAtivo("destino")}
                  onChange={(e) => setBuscaDestino(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && buscaDestino.trim()) {
                      handleSelectDestino(buscaDestino.trim(), undefined, buscaDestino.trim());
                    }
                  }}
                  placeholder="Para onde você vai?"
                  className="w-full text-xs sm:text-[13px] font-bold text-slate-950 bg-transparent placeholder:text-slate-400 placeholder:font-normal truncate outline-none py-1"
                />

                {buscaDestino && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBuscaDestino("");
                      setCampoAtivo("destino");
                      inputDestinoRef.current?.focus();
                    }}
                    className="min-w-[36px] min-h-[36px] p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer shrink-0 flex items-center justify-center -mr-1 transition"
                    title="Limpar destino"
                    aria-label="Limpar campo de destino"
                  >
                    <X className="w-4 h-4 stroke-[2.2]" />
                  </button>
                )}
              </div>
            </div>

            {/* BOTÃO SWAP (⇅ INVERTER ORIGEM E DESTINO) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                hapticFeedback.light();
                const tempOrigem = origemLocal;
                const tempDestino = buscaDestino;
                setOrigemLocal(tempDestino || origem || "Meu Local Atual");
                setBuscaDestino(tempOrigem);
                swapOrigemDestino();
              }}
              className="min-w-[40px] min-h-[40px] rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 shadow-2xs text-slate-700 hover:text-slate-950 flex items-center justify-center shrink-0 transition active:scale-90 cursor-pointer"
              title="Inverter origem e destino"
              aria-label="Inverter origem e destino"
            >
              <ArrowUpDown className="w-4 h-4 stroke-[2.4]" />
            </button>
          </div>

          {/* 3. ATALHOS RÁPIDOS PADRÃO 99: CASA, TRABALHO, FAVORITOS E NO MAPA */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={handleShortcutCasa}
              className="min-h-[44px] px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 shadow-2xs"
            >
              <Home className="w-4 h-4 text-primary-700" />
              <span>Casa</span>
            </button>

            <button
              type="button"
              onClick={handleShortcutTrabalho}
              className="min-h-[44px] px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 shadow-2xs"
            >
              <Briefcase className="w-4 h-4" style={{ color: colors.primary }} />
              <span>Trabalho</span>
            </button>

            <button
              type="button"
              onClick={handleShortcutFavoritos}
              className="min-h-[44px] px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 shadow-2xs"
            >
              <Star className="w-4 h-4 text-primary-600 fill-amber-500" />
              <span>Favoritos</span>
            </button>

            <button
              type="button"
              onClick={selectDestinationOnMap}
              className="min-h-[44px] px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 shadow-2xs"
            >
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>No Mapa</span>
            </button>
          </div>
        </div>

        {/* 4. CONTEÚDO DINÂMICO ROLÁVEL COM TECLADO ERGONÔMICO */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-4 sm:px-5 py-2">
          {campoAtivo === "embarque" ? (
            /* ========================================================
               MODO 1: CAMPO DE EMBARQUE SELECIONADO / EM EDIÇÃO
               ======================================================== */
            origemLocal.trim().length > 0 ? (
              <div className="space-y-1 pt-1 pb-3">
                {/* Opção Rápida no Topo: Definir texto digitado como local de embarque */}
                <button
                  type="button"
                  onClick={() => handleCustomOrigem(origemLocal.trim())}
                  style={{
                    borderColor: `${colors.primary}60`,
                    backgroundColor: `${colors.primary}15`,
                    borderRadius: ui.borderRadius,
                  }}
                  className="w-full p-3 flex items-center gap-3 text-left transition active:scale-[0.99] cursor-pointer border mb-2 shadow-2xs"
                >
                  <div
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.surface,
                      borderRadius: ui.borderRadius,
                    }}
                    className="w-8 h-8 flex items-center justify-center shrink-0 font-black shadow-2xs"
                  >
                    <MapPin className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-950 truncate">
                      Definir &ldquo;{origemLocal}&rdquo; como local de embarque
                    </p>
                    <p className="text-xs text-slate-700 truncate font-medium">
                      Definir este endereço como ponto de partida
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>

                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block px-1 pb-1">
                  Sugestões de Embarque (Tempo Real)
                </span>

                {/* Lista Refinada a Cada Letra Digitada */}
                {carregandoLugares ? (
                  <AddressSearchSkeleton />
                ) : (
                  lugaresEncontrados.map((item) => (
                    <SearchDestinationItemRow
                      key={item.id}
                      item={item}
                      distText={getDistanciaTexto(item.coords)}
                      onSelect={handleSelectOrigem}
                      getIcon={getCategoryIcon}
                    />
                  ))
                )}
              </div>
            ) : (
              /* ESTADO: EMBARQUE VAZIO (EX: USUÁRIO CLICOU NO 'X') */
              <div className="space-y-3 pt-1 pb-4">
                {/* Botão de Destaque: Restaurar GPS Oficial */}
                <button
                  type="button"
                  onClick={handleUsarGpsAtual}
                  disabled={isResolvingGps}
                  style={{
                    borderRadius: ui.borderRadius,
                  }}
                  className="w-full p-3 flex items-center gap-3 text-left transition active:scale-[0.99] cursor-pointer bg-emerald-50 border border-emerald-200/90 hover:bg-emerald-100/70 shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    {isResolvingGps ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Navigation className="w-4 h-4 fill-white text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-emerald-950 truncate">
                      Usar minha localização atual (GPS)
                    </p>
                    <p className="text-xs text-emerald-700 truncate font-medium">
                      Identificar ponto de embarque automaticamente
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
                </button>

                {/* Sugestões de locais próximos para embarque (reais por GPS) */}
                {sugestoesInteligentes.proximos.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 block px-1 pb-1">
                      Locais Próximos Sugeridos para Embarque
                    </span>
                    <div className="space-y-1">
                      {sugestoesInteligentes.proximos.slice(0, 3).map((lugar) => (
                        <SearchDestinationItemRow
                          key={lugar.id}
                          item={lugar}
                          distText={lugar.distanciaFormatada || getDistanciaTexto(lugar.coords)}
                          onSelect={handleSelectOrigem}
                          getIcon={getCategoryIcon}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            /* ========================================================
               MODO 2: CAMPO DE DESTINO SELECIONADO / EM BUSCA
               ======================================================== */
            buscaDestino.trim().length > 0 ? (
              <div className="space-y-1 pt-1 pb-3">
                {/* Opção Rápida no Topo: Buscar texto exato no mapa */}
                <button
                  type="button"
                  onClick={() => handleSelectDestino(buscaDestino.trim(), undefined, buscaDestino.trim())}
                  style={{
                    borderColor: `${colors.primary}60`,
                    backgroundColor: `${colors.primary}15`,
                    borderRadius: ui.borderRadius,
                  }}
                  className="w-full p-3 flex items-center gap-3 text-left transition active:scale-[0.99] cursor-pointer border mb-2 shadow-2xs"
                >
                  <div
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.surface,
                      borderRadius: ui.borderRadius,
                    }}
                    className="w-8 h-8 flex items-center justify-center shrink-0 font-black shadow-2xs"
                  >
                    <Search className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-950 truncate">
                      Buscar &ldquo;{buscaDestino}&rdquo;
                    </p>
                    <p className="text-xs text-slate-700 truncate font-medium">
                      Definir este endereço como destino no mapa
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>

                <span className="text-xs font-black uppercase tracking-wider text-slate-700 block px-1 pb-1">
                  Sugestões de Endereço (Tempo Real)
                </span>

                {/* Lista Refinada a Cada Letra Digitada ou Shimmer Skeleton */}
                {carregandoLugares ? (
                  <AddressSearchSkeleton />
                ) : (
                  lugaresEncontrados.map((item) => (
                    <SearchDestinationItemRow
                      key={item.id}
                      item={item}
                      distText={getDistanciaTexto(item.coords)}
                      onSelect={(lugar) => handleSelectDestino(lugar.endereco, lugar.coords, lugar.label)}
                      getIcon={getCategoryIcon}
                    />
                  ))
                )}
              </div>
            ) : (
              /* CASO B: SEM DIGITAÇÃO NO DESTINO -> HISTÓRICO E LOCAIS POPULARES */
              <div className="space-y-3 pt-1 pb-4">
                {/* HISTÓRICO DAS ÚLTIMAS 2 VIAGENS */}
                {historicoRecente && historicoRecente.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-1 py-1">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        <span>Últimas Viagens</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      {historicoRecente.slice(0, 2).map((item) => (
                        <RecentTripItemRow
                          key={item.id}
                          item={item}
                          distText={getDistanciaTexto(item.coords)}
                          onSelect={handleSelectDestino}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* SEÇÃO INTELIGENTE DE SUGESTÕES (6 ITENS REAIS: 3 QUE O USUÁRIO FREQUENTA + 3 PRÓXIMOS REAIS) */}
                <div className={`space-y-3 ${historicoRecente && historicoRecente.length > 0 ? "pt-2 border-t border-slate-100" : ""}`}>
                  {/* BLOCO 1: 3 LOCAIS QUE O USUÁRIO MAIS FREQUENTA */}
                  {sugestoesInteligentes.frequentes.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-1 py-1">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Locais que Você Frequenta</span>
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Acesso Rápido
                        </span>
                      </div>

                      <div className="space-y-1">
                        {sugestoesInteligentes.frequentes.map((lugar) => (
                          <SearchDestinationItemRow
                            key={lugar.id}
                            item={lugar}
                            badge={lugar.badge || "Frequente"}
                            distText={lugar.distanciaFormatada || getDistanciaTexto(lugar.coords)}
                            onSelect={(itemSel) =>
                              handleSelectDestino(itemSel.endereco, itemSel.coords, itemSel.label)
                            }
                            getIcon={getCategoryIcon}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BLOCO 2: 3 LOCAIS REAIS MAIS PRÓXIMOS PELA LOCALIZAÇÃO GPS DO USUÁRIO */}
                  {sugestoesInteligentes.proximos.length > 0 && (
                    <div className={`space-y-1 ${sugestoesInteligentes.frequentes.length > 0 ? "pt-2 border-t border-slate-100" : ""}`}>
                      <div className="flex items-center justify-between px-1 py-1">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>Locais Próximos de Você</span>
                        </span>
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          Por Proximidade GPS
                        </span>
                      </div>

                      <div className="space-y-1">
                        {sugestoesInteligentes.proximos.map((lugar) => (
                          <SearchDestinationItemRow
                            key={lugar.id}
                            item={lugar}
                            badge={lugar.distanciaFormatada ? `~${lugar.distanciaFormatada}` : undefined}
                            distText={lugar.distanciaFormatada || getDistanciaTexto(lugar.coords)}
                            onSelect={(itemSel) =>
                              handleSelectDestino(itemSel.endereco, itemSel.coords, itemSel.label)
                            }
                            getIcon={getCategoryIcon}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shimmer de carregamento enquanto calcula distâncias GPS */}
                  {carregandoSugestoes && sugestoesInteligentes.todas.length === 0 && (
                    <AddressSearchSkeleton />
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* MODAL DE CADASTRO DE CASA OU TRABALHO ("ONDE VOCÊ MORA?" / "ONDE VOCÊ TRABALHA?") */}
      {modalEnderecoAberto && (
        <AddressSetupModal
          isOpen={!!modalEnderecoAberto}
          tipo={modalEnderecoAberto}
          onClose={() => setModalEnderecoAberto(null)}
          onAddressSelected={(item) => {
            handleSelectDestino(item.endereco, item.coords, item.label);
            setModalEnderecoAberto(null);
          }}
        />
      )}

      {/* MODAL DE GESTÃO DE LOCAIS FAVORITOS (ESTADO VAZIO VETORIAL E LISTA DE FAVORITOS) */}
      {modalFavoritosAberto && (
        <FavoritesManagerModal
          isOpen={modalFavoritosAberto}
          onClose={() => setModalFavoritosAberto(false)}
          onSelectFavorite={(endereco, coords, label) => {
            handleSelectDestino(endereco, coords, label);
            setModalFavoritosAberto(false);
          }}
        />
      )}
    </div>
  );
});
