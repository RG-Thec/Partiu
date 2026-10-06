import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import {
  Camera,
  User,
  CheckCircle2,
  Phone,
  Mail,
  ArrowLeft,
  X,
  Star,
  Sliders,
  ShieldCheck,
  LogOut,
  Sparkles,
  Car,
  Wind,
  VolumeX,
  CreditCard,
  Lock,
} from "lucide-react";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";
import { userService, type UserProfileData } from "@/services/UserService";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { WhiteLabelButton, WhiteLabelInput } from "@/components/ui/white-label";
import { CameraPhotoCapture } from "@/components/common/CameraPhotoCapture";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({
    meta: [
      { title: "Editar Perfil | PARTIU" },
      {
        name: "description",
        content:
          "Gerencie seus dados cadastrais, foto de perfil e preferências de viagem no PARTIU Mobilidade Urbana.",
      },
    ],
  }),
  component: ProfilePagePartiu,
});

export function ProfilePagePartiu() {
  const navigate = useNavigate();
  const { nomeApp, corPrimaria, corTextoPrimaria } = useBrandTheme();
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"dados" | "preferencias">("dados");

  // Campos do Formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [rating, setRating] = useState(4.9);
  const [totalViagens, setTotalViagens] = useState(0);

  // Preferências
  const [arCondicionado, setArCondicionado] = useState(true);
  const [viagemSilenciosa, setViagemSilenciosa] = useState(false);

  const [modalFotoAberto, setModalFotoAberto] = useState(false);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const perfil = await userService.getCurrentUserProfile();
        const cachedNome = typeof window !== "undefined" ? localStorage.getItem("partiu_user_nome") : "";
        const cachedEmail = typeof window !== "undefined" ? localStorage.getItem("partiu_user_email") : "";
        const cachedTelefone = typeof window !== "undefined"
          ? localStorage.getItem("partiu_user_phone") || localStorage.getItem("partiu_user_telefone")
          : "";
        const cachedCpf = typeof window !== "undefined" ? localStorage.getItem("partiu_user_cpf") : "";
        const cachedAvatar = typeof window !== "undefined"
          ? localStorage.getItem("partiu_user_avatar") ||
            localStorage.getItem("partiu_user_foto") ||
            localStorage.getItem("partiu_user_selfie")
          : "";

        setNome(perfil.name || cachedNome || "Passageiro");
        setEmail(perfil.email || cachedEmail || "");
        setTelefone(perfil.phone || cachedTelefone || "");
        setCpf(perfil.cpf || cachedCpf || "");
        setFotoUrl(perfil.avatarUrl || cachedAvatar || "");
        setRating(perfil.rating);
        setTotalViagens(perfil.totalTrips);
        setArCondicionado(perfil.preferences.prefAc);
        setViagemSilenciosa(perfil.preferences.prefQuietTrip);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    }
    carregarPerfil();
  }, []);

  // Listener para atualização reativa do perfil em tempo real
  useEffect(() => {
    const handleProfileUpdated = (e: any) => {
      const detail = e?.detail;
      if (detail?.avatarUrl) setFotoUrl(detail.avatarUrl);
      if (detail?.name) setNome(detail.name);
      if (detail?.phone) setTelefone(detail.phone);
      if (detail?.cpf) setCpf(detail.cpf);
    };
    window.addEventListener("partiu:user-profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("partiu:user-profile-updated", handleProfileUpdated);
  }, []);

  async function handleSalvarPerfil(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMensagemSucesso(null);
    setMensagemErro(null);

    try {
      const res = await userService.updateUserProfile({
        name: nome,
        phone: telefone,
        cpf,
        avatarUrl: fotoUrl,
      });

      if (res.success) {
        setMensagemSucesso("Perfil atualizado com sucesso!");
        setTimeout(() => setMensagemSucesso(null), 3000);
      } else {
        setMensagemErro(res.error || "Erro ao salvar perfil.");
      }
    } catch {
      setMensagemErro("Não foi possível salvar as alterações no momento.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarFoto(photoDataUrl: string, file?: File) {
    if (!photoDataUrl) {
      setFotoUrl("");
      if (typeof window !== "undefined") {
        localStorage.removeItem("partiu_user_avatar");
        localStorage.removeItem("partiu_user_foto");
        localStorage.removeItem("partiu_user_selfie");
      }
      await userService.updateUserProfile({
        name: nome,
        phone: telefone,
        cpf,
        avatarUrl: "",
      });
      setModalFotoAberto(false);
      setMensagemSucesso("Foto removida com sucesso!");
      setTimeout(() => setMensagemSucesso(null), 3000);
      return;
    }

    setUploadingFoto(true);
    setFotoUrl(photoDataUrl);
    if (typeof window !== "undefined") {
      localStorage.setItem("partiu_user_avatar", photoDataUrl);
      localStorage.setItem("partiu_user_foto", photoDataUrl);
      localStorage.setItem("partiu_user_selfie", photoDataUrl);
    }

    try {
      if (file) {
        const res = await userService.uploadAvatar(file);
        if (res.success && res.url) {
          setFotoUrl(res.url);
          await userService.updateUserProfile({
            name: nome,
            phone: telefone,
            cpf,
            avatarUrl: res.url,
          });
        } else {
          await userService.updateUserProfile({
            name: nome,
            phone: telefone,
            cpf,
            avatarUrl: photoDataUrl,
          });
        }
      } else {
        await userService.updateUserProfile({
          name: nome,
          phone: telefone,
          cpf,
          avatarUrl: photoDataUrl,
        });
      }
      setModalFotoAberto(false);
      setMensagemSucesso("Foto de perfil atualizada com sucesso!");
      setTimeout(() => setMensagemSucesso(null), 3000);
    } catch (err) {
      console.error(err);
      await userService.updateUserProfile({
        name: nome,
        phone: telefone,
        cpf,
        avatarUrl: photoDataUrl,
      });
      setModalFotoAberto(false);
      setMensagemSucesso("Foto de perfil atualizada!");
      setTimeout(() => setMensagemSucesso(null), 3000);
    } finally {
      setUploadingFoto(false);
    }
  }


  function handleToggleAc(val: boolean) {
    setArCondicionado(val);
    userService.updateUserPreferences({ prefAc: val });
  }

  function handleToggleSilencio(val: boolean) {
    setViagemSilenciosa(val);
    userService.updateUserPreferences({ prefQuietTrip: val });
  }

  async function handleSair() {
    if (confirm("Deseja realmente sair da sua conta?")) {
      await supabaseAuthService.signOut();
      localStorage.removeItem("partiu_enderecos_salvos_v1");
      navigate({ to: "/auth" });
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground pb-16">
      {/* 1. CABEÇALHO */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-3.5 sm:px-4 pt-[max(0.6rem,calc(env(safe-area-inset-top,0px)+6px))] pb-2.5 min-h-[52px] border-b border-border flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Link
            to="/app"
            style={{ borderRadius: ui.borderRadius }}
            className="flex min-h-[36px] min-w-[36px] h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground hover:bg-muted/80 active:scale-95 transition-all cursor-pointer border border-border"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span
              style={{ color: colors.primary }}
              className="text-[9px] font-black uppercase tracking-wider block"
            >
              Conta &amp; Cadastro
            </span>
            <h1 className="text-sm font-bold text-foreground">Editar perfil</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSair}
          aria-label="Sair da conta"
          style={{ borderRadius: ui.borderRadius }}
          className="flex min-h-[32px] h-8 items-center justify-center gap-1.5 px-2.5 bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold rounded-lg hover:bg-destructive/20 active:scale-95 transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">Sair</span>
        </button>
      </header>

      {/* 2. ALERTAS */}
      {mensagemSucesso && (
        <div className="mx-4 mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="mx-4 mt-4 p-3.5 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-in fade-in">
          <X className="h-4 w-4 text-destructive shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-5">
        {/* 3. CARD DE AVATAR & STATUS */}
        <section
          style={{ borderRadius: ui.borderRadius }}
          className="bg-card border border-border p-5 shadow-xs flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="relative group mb-3">
            <div
              className="w-24 h-24 rounded-full p-1 shadow-md bg-card border-2"
              style={{ borderColor: colors.primary }}
            >
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={nome || "Passageiro"}
                  className="w-full h-full object-cover rounded-full bg-muted"
                  onError={() => {
                    const fallback = typeof window !== "undefined"
                      ? localStorage.getItem("partiu_user_avatar") ||
                        localStorage.getItem("partiu_user_foto") ||
                        localStorage.getItem("partiu_user_selfie")
                      : null;
                    if (fallback && fallback !== fotoUrl) {
                      setFotoUrl(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <User className="h-10 w-10" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalFotoAberto(true)}
              className="absolute bottom-0 right-0 p-2 rounded-full shadow-lg text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
              style={{ backgroundColor: colors.primary }}
              title="Trocar Foto"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-lg font-bold text-foreground">{nome || "Passageiro"}</h2>
          <p className="text-xs text-muted-foreground">{email || "passageiro@partiu.app"}</p>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border w-full justify-center">
            <div
              style={{
                borderRadius: ui.borderRadius,
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}30`,
                color: colors.primary,
              }}
              className="flex items-center gap-1.5 px-3 py-1 border text-xs font-bold"
            >
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{rating.toFixed(1)} Verificado</span>
            </div>
            <div className="text-xs font-medium text-muted-foreground">
              <span className="font-bold text-foreground">{totalViagens}</span> viagens
            </div>
          </div>
        </section>

        {/* 4. SEGMENTED TABS (PROGRESSIVE DISCLOSURE) */}
        <div
          style={{
            borderRadius: ui.borderRadius,
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          }}
          className="p-1 border flex gap-1 select-none"
        >
          <button
            type="button"
            onClick={() => setAbaAtiva("dados")}
            style={{
              borderRadius: ui.borderRadius,
              backgroundColor: abaAtiva === "dados" ? colors.surface : "transparent",
              color: abaAtiva === "dados" ? colors.primary : colors.textSecondary,
              boxShadow: abaAtiva === "dados" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
            className="flex-1 py-2 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <User className="h-3.5 w-3.5" />
            <span>Dados pessoais</span>
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("preferencias")}
            style={{
              borderRadius: ui.borderRadius,
              backgroundColor: abaAtiva === "preferencias" ? colors.surface : "transparent",
              color: abaAtiva === "preferencias" ? colors.primary : colors.textSecondary,
              boxShadow: abaAtiva === "preferencias" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
            className="flex-1 py-2 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Preferências</span>
          </button>
        </div>

        {/* 5. ABA DADOS PESSOAIS */}
        {abaAtiva === "dados" && (
          <form
            onSubmit={handleSalvarPerfil}
            style={{ borderRadius: ui.borderRadius }}
            className="bg-card border border-border p-5 shadow-xs space-y-4 animate-in fade-in-50 duration-150"
          >
            <WhiteLabelInput
              label="Nome completo"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
            />

            <WhiteLabelInput
              label="Celular com DDD"
              type="tel"
              required
              leftIcon={<Phone className="h-4 w-4" />}
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(22) 99999-9999"
            />

            <WhiteLabelInput
              label="CPF"
              leftIcon={<CreditCard className="h-4 w-4" />}
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
            />

            <WhiteLabelInput
              label="E-mail"
              type="email"
              disabled
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              helperText="O e-mail é vinculado à sua credencial de acesso do Supabase."
            />

            <div className="pt-2">
              <WhiteLabelButton
                type="submit"
                variant="primary"
                fullWidth
                isLoading={salvando}
              >
                Salvar perfil
              </WhiteLabelButton>
            </div>
          </form>
        )}

        {/* 6. ABA PREFERÊNCIAS & SEGURANÇA */}
        {abaAtiva === "preferencias" && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <section
              style={{ borderRadius: ui.borderRadius }}
              className="bg-card border border-border p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Sliders className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-bold text-foreground">Conforto na corrida</h3>
              </div>

              {/* Ar-Condicionado */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                    className="p-2"
                  >
                    <Wind className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Ar-condicionado</p>
                    <p className="text-[11px] text-muted-foreground">Solicitar climatização ao motorista parceiro</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={arCondicionado}
                  onChange={(e) => handleToggleAc(e.target.checked)}
                  style={{ accentColor: colors.primary }}
                  className="w-5 h-5 rounded cursor-pointer"
                />
              </div>

              {/* Viagem Silenciosa */}
              <div className="flex items-center justify-between py-1 border-t border-border">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                    className="p-2"
                  >
                    <VolumeX className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Viagem silenciosa</p>
                    <p className="text-[11px] text-muted-foreground">Prefiro viajar sem som automotivo alto</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={viagemSilenciosa}
                  onChange={(e) => handleToggleSilencio(e.target.checked)}
                  style={{ accentColor: colors.primary }}
                  className="w-5 h-5 rounded cursor-pointer"
                />
              </div>
            </section>

            {/* GARANTIA DE SEGURANÇA */}
            <section
              style={{
                borderRadius: ui.borderRadius,
                backgroundColor: `${colors.primary}0D`,
                borderColor: `${colors.primary}30`,
              }}
              className="p-4 border flex items-start gap-3"
            >
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: colors.primary }} />
              <div>
                <h4 className="text-xs font-bold text-foreground">Privacidade &amp; Proteção de Dados</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Seus dados são protegidos por Row-Level Security no Supabase e utilizados estritamente para identificação durante corridas urbanas e entregas expressas.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* 7. BOTÃO DESCONECTAR / SAIR DA CONTA */}
        <section className="pt-4">
          <button
            type="button"
            onClick={handleSair}
            style={{ borderRadius: ui.borderRadius }}
            className="w-full h-11 min-h-[44px] flex items-center justify-center gap-2 border border-destructive/30 bg-destructive/10 text-destructive text-sm font-bold hover:bg-destructive/20 active:scale-[0.99] transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair da conta</span>
          </button>
        </section>
      </main>

      {/* MODAL DE SELEÇÃO/UPLOAD DE FOTO */}
      {modalFotoAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            style={{ borderRadius: `calc(${ui.borderRadius} * 1.5)` }}
            className="bg-card p-5 max-w-sm w-full shadow-2xl border border-border animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Sua Foto de Perfil</h3>
                <p className="text-[11px] text-muted-foreground">Tire sua foto ao vivo pela câmera do celular</p>
              </div>
              <button
                type="button"
                onClick={() => setModalFotoAberto(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <CameraPhotoCapture
              label="Sua selfie atual"
              sublabel="Tire uma nova selfie ao vivo ou confirme a atual"
              value={fotoUrl}
              required={false}
              disabled={uploadingFoto}
              onChange={handleSalvarFoto}
            />
          </div>
        </div>
      )}
    </div>
  );
}
