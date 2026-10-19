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
import { geocodingService, type GeocodedPlace } from "@/lib/passenger/geocoding-service";
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
            !item.endereco.includes("Itaperuna"),
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
        .filter((c) => c && c.destino && c.id && !c.id.startsWith("mock-"))
        .slice(0, 2);

      if (corridasValidas.length > 0) {
        return corridasValidas.map((c) => ({
          id: `ride-${c.id}`,
          label: c.destino.split(",")[0]?.trim() || c.destino,
          endereco: c.destino,
          coords: c.destinoCoords ? [c.destinoCoords.lng, c.destinoCoords.lat] : undefined,
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

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full py-2.5 px-3 flex items-center gap-3 text-left hover:bg-slate-50/80 rounded-xl transition active:scale-[0.99] cursor-pointer group"
    >
      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200/70 text-slate-600 flex items-center justify-center shrink-0 transition">
        {getIcon(item.label, placeItem.origemSugestao)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate leading-snug">{item.label}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">
          {item.sublabel || item.endereco}
        </p>
      </div>

      {(item.distanciaFormatada || distText) && (
        <span className="text-xs font-medium text-slate-400 shrink-0 ml-1">
          {item.distanciaFormatada ? `~${item.distanciaFormatada}` : distText}
        </span>
      )}

      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition" />
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
      className="w-full py-2.5 px-3 flex items-center gap-3 text-left hover:bg-slate-50/80 rounded-xl transition active:scale-[0.99] cursor-pointer group"
    >
      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200/70 text-slate-500 flex items-center justify-center shrink-0 transition">
        <Clock className="w-4 h-4 stroke-[2]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate leading-snug">{item.label}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5 font-normal">{item.endereco}</p>
      </div>

      {distText && (
        <span className="text-xs font-medium text-slate-400 shrink-0 ml-1">{distText}</span>
      )}

      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition" />
    </button>
  );
});

export const PassengerSearchDestinationSheet = React.memo(
  function PassengerSearchDestinationSheet() {
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
      if (
        !origem ||
        origem.includes("Localizando") ||
        origem === "Meu Local Atual" ||
        origem === DEFAULT_ORIGIN.endereco
      ) {
        const coords = origemCoords || DEFAULT_ORIGIN.coords;
        const instant = reverseGeocodingService.resolveInstantProximityAddress(coords);
        if (instant && instant !== origemLocal) {
          setOrigemLocal(instant);
          setOrigemEndereco(instant, coords);
        }

        geocodingService
          .geocodificarReverso(coords)
          .then((nomeVia) => {
            if (hasUserClearedOriginRef.current) return;
            if (nomeVia && !nomeVia.includes("Local no mapa")) {
              setOrigemLocal(nomeVia);
              setOrigemEndereco(nomeVia, coords);
            }
          })
          .catch(() => {});
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
    const [modalEnderecoAberto, setModalEnderecoAberto] = useState<"casa" | "trabalho" | null>(
      null,
    );
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

    const [historicoRecente, setHistoricoRecente] = useState<RecentItem[]>(() =>
      carregarHistoricoReal(),
    );

    const inputDestinoRef = useRef<HTMLInputElement>(null);
    const inputOrigemRef = useRef<HTMLInputElement>(null);

    // 1. Notificação para esconder barra de navegação no modal
    useEffect(() => {
      window.dispatchEvent(
        new CustomEvent("partiu:toggle-bottom-nav", { detail: { visible: false } }),
      );
      return () => {
        window.dispatchEvent(
          new CustomEvent("partiu:toggle-bottom-nav", { detail: { visible: true } }),
        );
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

      if (!termo.trim() || (campoAtivo === "embarque" && termo === "Meu Local Atual")) {
        geocodingService
          .buscarLugares("", origemCoords)
          .then((locaisProximos) => {
            if (ativo) setLugaresEncontrados(locaisProximos);
          })
          .catch(() => {
            if (ativo) setLugaresEncontrados([]);
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
          if (ativo) setLugaresEncontrados([]);
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
      const uid =
        session?.id ||
        (typeof window !== "undefined"
          ? localStorage.getItem("partiu_user_id") || undefined
          : undefined);
      const phone =
        session?.phone ||
        (typeof window !== "undefined"
          ? localStorage.getItem("partiu_user_phone") || undefined
          : undefined);

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
        getSeisSugestoesDestino(coordsRef)
          .then((res) => {
            setSugestoesInteligentes(res);
          })
          .catch(() => {});
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
          (h) => h.endereco.toLowerCase() !== endereco.toLowerCase(),
        );
        const atualizados = [novo, ...filtrados].slice(0, 2);
        setHistoricoRecente(atualizados);
        localStorage.setItem(getStorageRecentKey(), JSON.stringify(atualizados));
      } catch (err) {
        silentCatchWarn("PassengerSearchDestinationSheet", err);
      }
    }

    // 6. Seleção Rápida de Destino com Avanço Automático para a Próxima Etapa
    function handleSelectDestino(endereco: string, coords?: [number, number], label?: string) {
      hapticFeedback.selection();
      let coordsFinal = coords;
      if (!coordsFinal) {
        const match =
          sugestoesInteligentes.todas.find(
            (s) =>
              s.endereco.toLowerCase() === endereco.toLowerCase() ||
              s.label.toLowerCase() === endereco.toLowerCase(),
          ) ||
          lugaresEncontrados.find(
            (l) =>
              l.endereco.toLowerCase() === endereco.toLowerCase() ||
              l.label.toLowerCase() === endereco.toLowerCase(),
          ) ||
          lugaresEncontrados[0];
        coordsFinal = match ? match.coords : origemCoords || DEFAULT_ORIGIN.coords;
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
      const match =
        lugaresEncontrados.find(
          (l) =>
            l.label.toLowerCase() === termoLimpo.toLowerCase() ||
            l.endereco.toLowerCase() === termoLimpo.toLowerCase(),
        ) || lugaresEncontrados[0];
      const coordsFinal = match ? match.coords : origemCoords || DEFAULT_ORIGIN.coords;
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
              { enableHighAccuracy: true, timeout: 8000 },
            );
          },
          { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 },
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
        return <Briefcase className="w-4 h-4" style={{ color: colors.primary }} />;
      }
      if (l === "favorito" || l.includes("favorito")) {
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />;
      }
      if (
        l.includes("hospital") ||
        l.includes("avaí") ||
        l.includes("upa") ||
        l.includes("saúde") ||
        l.includes("clínica")
      ) {
        return <Cross className="w-4 h-4 text-rose-500" />;
      }
      if (
        l.includes("redentor") ||
        l.includes("afya") ||
        l.includes("faculdade") ||
        l.includes("escola") ||
        l.includes("universidade")
      ) {
        return <GraduationCap className="w-4 h-4 text-indigo-500" />;
      }
      if (
        l.includes("rodoviário") ||
        l.includes("terminal") ||
        l.includes("balsa") ||
        l.includes("estação")
      ) {
        return <Bus className="w-4 h-4" style={{ color: colors.secondary }} />;
      }
      if (
        l.includes("mercado") ||
        l.includes("fluminense") ||
        l.includes("shopping") ||
        l.includes("supermercado")
      ) {
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      }
      if (origemSugestao === "FREQUENTE") {
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      }
      if (origemSugestao === "PROXIMO") {
        return <MapPin className="w-4 h-4" style={{ color: colors.primary }} />;
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

          {/* 1. CABEÇALHO LIMPO E ELEGANTE */}
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback.light();
                  cancelSearch();
                }}
                aria-label="Voltar para o mapa"
                className="w-9 h-9 text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:scale-95 rounded-full transition cursor-pointer flex items-center justify-center -ml-1"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
              <h2 className="text-sm font-bold text-slate-900">Escolher destino</h2>
            </div>

            {/* Seletor de Passageiro ("Para mim" / "Outra pessoa") */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModalPassageiroAberto(!modalPassageiroAberto)}
                className="h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                {viajanteOutraPessoa ? (
                  <Users className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>
                  {viajanteOutraPessoa
                    ? nomeOutroPassageiro
                      ? `Para: ${nomeOutroPassageiro.split(" ")[0]}`
                      : "Outra pessoa"
                    : "Para mim"}
                </span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              {/* Dropdown do Passageiro */}
              {modalPassageiroAberto && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-30 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[11px] font-bold text-slate-500">Quem vai viajar?</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setViajanteOutraPessoa(false);
                        setModalPassageiroAberto(false);
                      }}
                      style={
                        !viajanteOutraPessoa
                          ? { backgroundColor: colors.primary, color: "#FFFFFF" }
                          : {}
                      }
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        !viajanteOutraPessoa
                          ? "shadow-2xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
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
                          ? { backgroundColor: colors.primary, color: "#FFFFFF" }
                          : {}
                      }
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                        viajanteOutraPessoa
                          ? "shadow-2xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
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
                        className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setModalPassageiroAberto(false)}
                        className="w-full mt-2 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800"
                      >
                        Confirmar passageiro
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. CAMPOS CONECTADOS DE EMBARQUE E DESTINO */}
          <div className="p-3.5 sm:p-4 bg-white border-b border-slate-100 shrink-0 space-y-2.5">
            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3 flex items-center gap-3">
              {/* Trilho Visual Conector */}
              <div className="flex flex-col items-center justify-between h-20 py-2 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                <div
                  style={{
                    backgroundColor: colors.primary,
                    boxShadow: `0 0 0 4px ${colors.primary}20`,
                  }}
                  className="w-2.5 h-2.5 rounded-[2px]"
                />
              </div>

              {/* Coluna dos Inputs */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* CAMPO EMBARQUE */}
                <div className="flex items-center justify-between gap-1.5">
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
                    className={`w-full text-xs sm:text-[13px] bg-transparent placeholder:text-slate-400 truncate outline-none py-1 transition ${
                      campoAtivo === "embarque"
                        ? "text-slate-950 font-bold"
                        : "text-slate-700 font-medium"
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
                      className="px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition hover:bg-slate-100 disabled:opacity-50"
                      style={{ color: colors.primary }}
                      title="Restaurar GPS atual"
                    >
                      {isResolvingGps ? (
                        <Loader2
                          className="w-3.5 h-3.5 animate-spin"
                          style={{ color: colors.primary }}
                        />
                      ) : (
                        <Navigation
                          className="w-3.5 h-3.5"
                          style={{ fill: colors.primary, color: colors.primary }}
                        />
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
                        className="w-7 h-7 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer flex items-center justify-center transition"
                        title="Limpar embarque"
                        aria-label="Limpar campo de embarque"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Divisor */}
                <div className="border-t border-slate-200/70" />

                {/* CAMPO DESTINO */}
                <div className="flex items-center justify-between gap-1.5">
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
                      className="w-7 h-7 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer shrink-0 flex items-center justify-center transition"
                      title="Limpar destino"
                      aria-label="Limpar campo de destino"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Botão Swap */}
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
                className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 shadow-2xs text-slate-600 hover:text-slate-900 flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer"
                title="Inverter embarque e destino"
                aria-label="Inverter embarque e destino"
              >
                <ArrowUpDown className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* 3. ATALHOS RÁPIDOS HARMONIOSOS (CHIPS) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
              <button
                type="button"
                onClick={handleShortcutCasa}
                className="h-8.5 px-3.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
              >
                <Home className="w-3.5 h-3.5 text-slate-600" />
                <span>Casa</span>
              </button>

              <button
                type="button"
                onClick={handleShortcutTrabalho}
                className="h-8.5 px-3.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
              >
                <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                <span>Trabalho</span>
              </button>

              <button
                type="button"
                onClick={handleShortcutFavoritos}
                className="h-8.5 px-3.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                <span>Favoritos</span>
              </button>

              <button
                type="button"
                onClick={selectDestinationOnMap}
                className="h-8.5 px-3.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
              >
                <MapPin className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                <span>No mapa</span>
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
                    className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition active:scale-[0.99] cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80 mb-2"
                  >
                    <div
                      style={{
                        backgroundColor: `${colors.primary}18`,
                        color: colors.primary,
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    >
                      <MapPin className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        Definir &ldquo;{origemLocal}&rdquo;
                      </p>
                      <p className="text-xs text-slate-500 truncate">Usar como ponto de partida</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>

                  <span className="text-xs font-semibold text-slate-500 block px-1 pb-1">
                    Sugestões de embarque
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
                    className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition active:scale-[0.99] cursor-pointer bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-100/60"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      {isResolvingGps ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Navigation className="w-4 h-4 fill-white text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-950 truncate">
                        Usar localização atual
                      </p>
                      <p className="text-xs text-emerald-700/90 truncate">
                        Identificar ponto de partida pelo GPS
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  </button>

                  {/* Sugestões de locais próximos para embarque (reais por GPS) */}
                  {sugestoesInteligentes.proximos.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-xs font-semibold text-slate-500 block px-1 pb-1">
                        Locais próximos
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
            ) : /* ========================================================
               MODO 2: CAMPO DE DESTINO SELECIONADO / EM BUSCA
               ======================================================== */
            buscaDestino.trim().length > 0 ? (
              <div className="space-y-1 pt-1 pb-3">
                {/* Opção Rápida no Topo: Buscar texto exato no mapa */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectDestino(buscaDestino.trim(), undefined, buscaDestino.trim())
                  }
                  className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition active:scale-[0.99] cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80 mb-2"
                >
                  <div
                    style={{
                      backgroundColor: `${colors.primary}18`,
                      color: colors.primary,
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  >
                    <Search className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      Buscar &ldquo;{buscaDestino}&rdquo;
                    </p>
                    <p className="text-xs text-slate-500 truncate">Definir como destino no mapa</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                <span className="text-xs font-semibold text-slate-500 block px-1 pb-1">
                  Sugestões de endereço
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
                      onSelect={(lugar) =>
                        handleSelectDestino(lugar.endereco, lugar.coords, lugar.label)
                      }
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
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Últimas viagens</span>
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
                <div
                  className={`space-y-3 ${historicoRecente && historicoRecente.length > 0 ? "pt-2 border-t border-slate-100" : ""}`}
                >
                  {/* BLOCO 1: 3 LOCAIS QUE O USUÁRIO MAIS FREQUENTA */}
                  {sugestoesInteligentes.frequentes.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-1 py-1">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Locais frequentes</span>
                        </span>
                      </div>

                      <div className="space-y-1">
                        {sugestoesInteligentes.frequentes.map((lugar) => (
                          <SearchDestinationItemRow
                            key={lugar.id}
                            item={lugar}
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
                    <div
                      className={`space-y-1 ${sugestoesInteligentes.frequentes.length > 0 ? "pt-2 border-t border-slate-100" : ""}`}
                    >
                      <div className="flex items-center justify-between px-1 py-1">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                          <span>Locais próximos</span>
                        </span>
                      </div>

                      <div className="space-y-1">
                        {sugestoesInteligentes.proximos.map((lugar) => (
                          <SearchDestinationItemRow
                            key={lugar.id}
                            item={lugar}
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
  },
);
