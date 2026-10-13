import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  Loader2,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
  Zap,
  Upload,
  Camera,
  FileText,
  Check,
  X,
} from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { driverFleetService } from "@/lib/ecosystem/driver-fleet-service";
import { supabaseAuthService } from "@/lib/auth/supabase-auth-service";
import { silentCatchWarn } from "@/lib/structured-logger";
import { useBrandTheme } from "@/hooks/useBrandTheme";
import { useTheme, DEFAULT_APP_CONFIG } from "@/contexts/WhiteLabelThemeContext";
import {
  NativeButton,
  NativeInput,
  NativeSurface,
} from "@/components/native";
import {
  WhiteLabelProgressBar,
} from "@/components/ui/white-label";
import { CameraPhotoCapture } from "@/components/common/CameraPhotoCapture";
import { Mail } from "lucide-react";
import { whiteLabelEngine } from "@/lib/white-label";

export const Route = createFileRoute("/cadastro-motorista")({
  validateSearch: (search: Record<string, unknown>): { tenant?: string; tenant_id?: string } => ({
    tenant: typeof search.tenant === "string" ? search.tenant : undefined,
    tenant_id: typeof search.tenant_id === "string" ? search.tenant_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Cadastro de Motorista & Entregador Parceiro | PARTIU" },
      {
        name: "description",
        content:
          "Cadastre seu carro ou moto para faturar com corridas urbanas e entregas expressas com planos a partir de 0% de taxa (até 100% de repasse líquido) e repasse imediato via PIX D+0.",
      },
    ],
  }),
  component: CadastroMotoristaPage,
});

export function CadastroMotoristaPage() {
  const search = Route.useSearch();
  const tenantParam = search.tenant || search.tenant_id;

  useEffect(() => {
    if (tenantParam && tenantParam.trim()) {
      try {
        whiteLabelEngine.switchTenant(tenantParam.trim());
      } catch {}
    }
  }, [tenantParam]);

  const {
    nomeApp,
    corPrimaria,
    corPrimariaHover,
    corSecundaria,
    corTextoPrimaria,
    corCabecalhoInicio,
    corCabecalhoFim,
  } = useBrandTheme();
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;

  const brandGradient = useMemo(() => {
    const start = corCabecalhoInicio || corPrimaria || "#FF6B00";
    const end = corCabecalhoFim || corSecundaria || "#FFB800";
    return `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
  }, [corCabecalhoInicio, corCabecalhoFim, corPrimaria, corSecundaria]);

  // Carrega rascunho salvo do sessionStorage para evitar perda acidental de dados
  const draftSalvo = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const data = sessionStorage.getItem("partiu_driver_reg_draft");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);

  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4>(() => (draftSalvo?.etapa as 1 | 2 | 3 | 4) || 1);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState<string | null>(null);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  function formatarTelefone(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  }

  function formatarCpf(val: string) {
    const raw = val.replace(/\D/g, "").slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
  }

  // Etapa 1: Dados Pessoais
  const [nome, setNome] = useState(() => draftSalvo?.nome || "");
  const [cpf, setCpf] = useState(() => draftSalvo?.cpf || "");
  const [whatsapp, setWhatsapp] = useState(() => draftSalvo?.whatsapp || "");
  const [email, setEmail] = useState(() => draftSalvo?.email || "");
  const [senha, setSenha] = useState(() => draftSalvo?.senha || "");

  // Etapa 2: Modalidade & Veículo
  const [tipoVeiculo, setTipoVeiculo] = useState<"carro" | "moto">(() => draftSalvo?.tipoVeiculo || "carro");
  const [veiculoModelo, setVeiculoModelo] = useState(() => draftSalvo?.veiculoModelo || "");
  const [veiculoAno, setVeiculoAno] = useState(() => draftSalvo?.veiculoAno || "");
  const [veiculoPlaca, setVeiculoPlaca] = useState(() => draftSalvo?.veiculoPlaca || "");
  const [veiculoCor, setVeiculoCor] = useState(() => draftSalvo?.veiculoCor || "");
  const [temArCondicionado, setTemArCondicionado] = useState(() => draftSalvo?.temArCondicionado ?? true);

  // Etapa 3: CNH & EAR
  const [cnh, setCnh] = useState(() => draftSalvo?.cnh || "");
  const [categoriaCNH, setCategoriaCNH] = useState<"B" | "A" | "AB">(() => draftSalvo?.categoriaCNH || "B");
  const [possuiEAR, setPossuiEAR] = useState(() => draftSalvo?.possuiEAR ?? true);

  // Documentos Reais (Upload)
  const [cnhUrl, setCnhUrl] = useState<string>(() => draftSalvo?.cnhUrl || "");
  const [crlvUrl, setCrlvUrl] = useState<string>(() => draftSalvo?.crlvUrl || "");
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState<string>(() => draftSalvo?.fotoPerfilUrl || "");
  const [uploadingDoc, setUploadingDoc] = useState<"cnh" | "crlv" | "foto" | null>(null);

  // Persistência automática do rascunho no sessionStorage
  useEffect(() => {
    if (sucesso) {
      try {
        sessionStorage.removeItem("partiu_driver_reg_draft");
      } catch { /* ignore */ }
      return;
    }
    try {
      sessionStorage.setItem("partiu_driver_reg_draft", JSON.stringify({
        etapa,
        nome,
        cpf,
        whatsapp,
        email,
        tipoVeiculo,
        veiculoModelo,
        veiculoAno,
        veiculoPlaca,
        veiculoCor,
        temArCondicionado,
        cnh,
        categoriaCNH,
        possuiEAR,
        cnhUrl,
        crlvUrl,
        fotoPerfilUrl,
      }));
    } catch { /* ignore */ }
  }, [
    sucesso, etapa, nome, cpf, whatsapp, email,
    tipoVeiculo, veiculoModelo, veiculoAno, veiculoPlaca, veiculoCor,
    temArCondicionado, cnh, categoriaCNH, possuiEAR, cnhUrl, crlvUrl, fotoPerfilUrl
  ]);

  // Alerta de proteção contra fechamento acidental se etapa > 1
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (etapa > 1 && !sucesso) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [etapa, sucesso]);



  useEffect(() => {
    async function preencherDeSessaoGoogle() {
      try {
        const sessao = await supabaseAuthService.checkAndHydrateSession();
        if (sessao) {
          if (sessao.name && !nome) setNome(sessao.name);
          if (sessao.email && !email) setEmail(sessao.email);
          if (sessao.phone && !whatsapp) setWhatsapp(formatarTelefone(sessao.phone));
        }
      } catch {
        // ignora
      }
    }
    void preencherDeSessaoGoogle();
  }, []);

  async function handleUploadArquivo(
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: "cnh" | "crlv" | "foto"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(tipo);

    let url = "";
    if (isSupabaseConfigured() && supabase) {
      try {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${tipo}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `motoristas/${fileName}`;

        const { error: upErr } = await supabase.storage
          .from("driver-documents")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (!upErr) {
          const { data: pubUrl } = supabase.storage
            .from("driver-documents")
            .getPublicUrl(filePath);
          if (pubUrl?.publicUrl) {
            url = pubUrl.publicUrl;
          }
        }
      } catch (err) {
        silentCatchWarn("uploadDriverDoc", err);
      }
    }

    if (!url) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (tipo === "cnh") setCnhUrl(base64);
        else if (tipo === "crlv") setCrlvUrl(base64);
        else setFotoPerfilUrl(base64);
        setUploadingDoc(null);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (tipo === "cnh") setCnhUrl(url);
    else if (tipo === "crlv") setCrlvUrl(url);
    else setFotoPerfilUrl(url);
    setUploadingDoc(null);
  }

  // Etapa 4: Chave PIX (D+0) - Obrigatório CPF do Titular
  const [chavePix, setChavePix] = useState("");
  const tipoChave = "cpf";

  async function handleFinalizarCadastro(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErroCadastro(null);

    const chavePixEfetiva = cpf || chavePix;

    const res = await supabaseAuthService.signUpDriver({
      name: nome,
      email,
      phone: whatsapp,
      cpf,
      password: senha || "partiu2026",
      vehicleType: tipoVeiculo,
      vehicleModel: veiculoModelo,
      vehiclePlate: veiculoPlaca.toUpperCase(),
      vehicleYear: veiculoAno,
      vehicleColor: veiculoCor,
      cnh,
      cnhCategory: categoriaCNH,
      hasEar: possuiEAR,
      cnhUrl,
      crlvUrl,
      fotoPerfilUrl,
      pixKey: chavePixEfetiva,
      pixKeyType: "CPF",
    });

    setCarregando(false);
    if (!res.success) {
      setErroCadastro(res.error || "Não foi possível concluir o cadastro.");
      return;
    }

    const motoristaNovo = {
      id: res.user?.id || "mot_" + Date.now(),
      nome,
      cpf,
      whatsapp,
      email,
      tipoVeiculo,
      modelo: veiculoModelo,
      ano: veiculoAno,
      placa: veiculoPlaca.toUpperCase(),
      cor: veiculoCor,
      temArCondicionado,
      cnh,
      categoriaCNH,
      possuiEAR,
      chavePix: chavePixEfetiva,
      tipoChave,
      status: "pendente",
      cadastradoEm: new Date().toISOString(),
    };

    try {
      const armazenados = JSON.parse(localStorage.getItem("partiu_motoristas_store") || "[]");
      armazenados.unshift(motoristaNovo);
      localStorage.setItem("partiu_motoristas_store", JSON.stringify(armazenados));
      localStorage.setItem("partiu_motorista_ativo", JSON.stringify(motoristaNovo));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("partiu:driver_registered", { detail: motoristaNovo }));
      }
    } catch (err) { silentCatchWarn("cadastro-motorista", err); }

    // Sincroniza via driverFleetService (com validação estrita MOTO/CARRO e dual-table)
    void driverFleetService.registerDriver({
      name: nome,
      phone: whatsapp,
      email: email || undefined,
      vehicle_type: tipoVeiculo === "moto" ? "MOTO" : "CARRO",
      vehicle_plate: veiculoPlaca.toUpperCase() || "SEM-PLACA",
      vehicle_model: veiculoModelo,
      cnh_number: cnh || "00000000000",
      pix_key: chavePix || undefined,
    });

    setSucesso(true);
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col font-sans transition-colors duration-200 overflow-x-hidden overflow-y-auto bg-slate-50"
      style={{
        backgroundColor: colors.background,
        color: colors.textPrimary,
        fontFamily: ui.fontFamily,
      }}
    >
      {/* Top Header Profissional e Compacto */}
      <div className="w-full max-w-xl mx-auto px-4 pt-[max(0.5rem,calc(env(safe-area-inset-top,0px)))] flex items-center justify-between pb-2">
        <Link
          to="/"
          search={tenantParam ? { tenant: tenantParam } : undefined}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
          aria-label="Voltar para início"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </Link>
        <span
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-2xs whitespace-nowrap"
          style={{
            borderColor: `${colors.primary}33`,
            backgroundColor: `${colors.primary}12`,
            color: colors.primary,
          }}
        >
          <Car className="h-3.5 w-3.5" />
          Motorista
        </span>
        <Link
          to="/auth"
          search={{ role: "MOTORISTA", ...(tenantParam ? { tenant: tenantParam } : {}) }}
          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 transition active:scale-95 shadow-2xs whitespace-nowrap"
          style={{ color: colors.primary }}
          aria-label="Entrar como motorista"
        >
          <span>Entrar</span>
        </Link>
      </div>

      <main className="flex-1 max-w-xl w-full mx-auto p-3.5 sm:p-5 flex flex-col justify-start pb-8 sm:pb-12">
        {!sucesso ? (
          <div
            className="w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xl sm:shadow-2xl shadow-slate-200/50 space-y-3 transition-all duration-200 relative"
            style={{ borderRadius: ui.borderRadius || "1.5rem" }}
          >
            {/* Cabeçalho do Card Padrão Design System */}
            <div className="text-center">
              <h1
                className="text-lg sm:text-xl font-black tracking-tight"
                style={{ color: colors.textPrimary }}
              >
                Cadastro de Motorista Parceiro
              </h1>
              <p className="text-[11px] sm:text-xs mt-0.5 font-normal" style={{ color: colors.textSecondary }}>
                Cadastre-se para faturar com seu veículo com planos a partir de 0% de taxa.
              </p>
              {/* Barra de destaque na cor primária do Franqueado */}
              <div
                className="w-7 h-1 rounded-full mx-auto mt-1.5 mb-3 transition-colors"
                style={{ backgroundColor: colors.primary }}
              />
            </div>

            {/* Error Banner */}
            {erroValidacao && (
              <div className="mb-2 p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{erroValidacao}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErroValidacao(null)}
                  className="p-1 hover:opacity-70 text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Header de Etapas Conectado à Cor Primária */}
            <div className="mb-2">
              <WhiteLabelProgressBar
                currentStep={etapa}
                totalSteps={4}
                stepTitle={
                  etapa === 1
                    ? "Dados Pessoais"
                    : etapa === 2
                    ? "Veículo"
                    : etapa === 3
                    ? "Habilitação (CNH)"
                    : "Repasse PIX D+0"
                }
              />
            </div>

            {/* ETAPA 1: DADOS PESSOAIS */}
            {etapa === 1 && (
              <div className="space-y-3 animate-in fade-in-50 duration-200 text-left">
                <div className="border-b pb-2" style={{ borderColor: colors.inputBorder }}>
                  <h2
                    className="text-base sm:text-lg font-black tracking-tight"
                    style={{ color: colors.textPrimary }}
                  >
                    Informações Pessoais
                  </h2>
                  <p className="text-[11px] sm:text-xs font-normal" style={{ color: colors.textSecondary }}>
                    Comece informando seus dados básicos para contato e validação
                  </p>
                </div>

                {/* Foto de Perfil Obrigatória via Câmera do Celular */}
                <CameraPhotoCapture
                  label="Sua foto de identificação"
                  sublabel="Tire uma selfie ao vivo pela câmera"
                  value={fotoPerfilUrl}
                  onChange={(capturedUrl) => {
                    setFotoPerfilUrl(capturedUrl);
                    if (erroValidacao?.includes("selfie") || erroValidacao?.includes("foto")) {
                      setErroValidacao(null);
                    }
                  }}
                  required
                />

                <NativeInput
                  label="Nome Completo"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome como na CNH"
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                />

                <div className="grid grid-cols-2 gap-2">
                  <NativeInput
                    label="CPF"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatarCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    leftIcon={<FileText className="w-4 h-4 text-slate-400" />}
                  />
                  <NativeInput
                    label="WhatsApp"
                    required
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatarTelefone(e.target.value))}
                    placeholder="(82) 99999-9999"
                    leftIcon={
                      <div className="flex items-center gap-1 pl-0.5 text-xs font-black text-slate-700 dark:text-slate-200 select-none">
                        <span className="text-sm leading-none">🇧🇷</span>
                        <span>+55</span>
                      </div>
                    }
                  />
                </div>

                <NativeInput
                  label="E-mail"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                />

                <NativeInput
                  label="Criar Senha de Acesso"
                  required
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 dígitos para entrar no App"
                  helperText="Crie uma senha de acesso para gerenciar suas corridas no cockpit."
                  leftIcon={<ShieldCheck className="w-4 h-4 text-slate-400" />}
                />

                <div className="pt-2 space-y-2 mt-2">
                  <NativeButton
                    type="button"
                    variant="filled"
                    size="lg"
                    fullWidth
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    onClick={async () => {
                      setErroValidacao(null);
                      if (!fotoPerfilUrl) {
                        setErroValidacao("A selfie oficial pela câmera do celular é obrigatória.");
                        return;
                      }
                      if (!nome || !cpf || !whatsapp || !email) {
                        setErroValidacao("Por favor, preencha todos os campos obrigatórios.");
                        return;
                      }
                      if (senha && senha.length < 6) {
                        setErroValidacao("A senha de acesso deve ter no mínimo 6 caracteres.");
                        return;
                      }
                      try {
                        const check = await supabaseAuthService.isEmailOrCpfRegistered(email, cpf);
                        if (check.registered) {
                          setErroValidacao(check.message || "E-mail ou CPF já cadastrado no sistema.");
                          return;
                        }
                      } catch (err) {
                        silentCatchWarn("cadastro-motorista:checkDuplicate", err);
                      }
                      setEtapa(2);
                    }}
                  >
                    Avançar para veículo
                  </NativeButton>

                  <div className="text-center pt-1">
                    <Link
                      to="/auth"
                      search={{ role: "MOTORISTA" }}
                      className="inline-flex items-center justify-center text-xs font-semibold hover:underline py-1 transition-colors"
                      style={{ color: colors.textSecondary }}
                    >
                      Já tem uma conta de parceiro?{" "}
                      <span className="font-extrabold underline ml-1" style={{ color: colors.primary }}>
                        Ir para o login
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: VEÍCULO */}
            {etapa === 2 && (
              <div className="space-y-3 animate-in fade-in-50 duration-200">
                <div className="border-b pb-2" style={{ borderColor: colors.inputBorder }}>
                  <h2 className="text-lg sm:text-xl font-black" style={{ color: colors.textPrimary }}>
                    Dados do Veículo
                  </h2>
                  <p className="text-[11px] sm:text-xs" style={{ color: colors.textSecondary }}>
                    Selecione a categoria que você vai dirigir no {nomeApp}
                  </p>
                </div>

                {/* Seletor Carro vs Moto */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoVeiculo("carro");
                      setCategoriaCNH("B");
                    }}
                    style={
                      tipoVeiculo === "carro"
                        ? {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                            color: "#FFFFFF",
                          }
                        : {
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.inputBorder,
                          }
                    }
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                      tipoVeiculo === "carro"
                        ? "shadow-2xs"
                        : "text-foreground/80 hover:text-foreground hover:bg-card"
                    }`}
                  >
                    <Car className="h-4 w-4" />
                    <span>Carro ({nomeApp} Pop)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoVeiculo("moto");
                      setCategoriaCNH("A");
                    }}
                    style={
                      tipoVeiculo === "moto"
                        ? {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                            color: "#FFFFFF",
                          }
                        : {
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.inputBorder,
                          }
                    }
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                      tipoVeiculo === "moto"
                        ? "shadow-2xs"
                        : "text-foreground/80 hover:text-foreground hover:bg-card"
                    }`}
                  >
                    <Bike className="h-4 w-4" />
                    <span>Moto & Flash</span>
                  </button>
                </div>

                <NativeInput
                  label="Modelo e Marca"
                  required
                  value={veiculoModelo}
                  onChange={(e) => setVeiculoModelo(e.target.value)}
                  placeholder={tipoVeiculo === "carro" ? "Ex: Chevrolet Onix 1.0" : "Ex: Honda CG 160 Fan"}
                  leftIcon={<Car className="w-4 h-4 text-slate-400" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <NativeInput
                    label="Ano de Fabricação"
                    required
                    value={veiculoAno}
                    onChange={(e) => setVeiculoAno(e.target.value)}
                    placeholder="2022"
                  />
                  <NativeInput
                    label="Placa do Veículo"
                    required
                    value={veiculoPlaca}
                    onChange={(e) => setVeiculoPlaca(e.target.value.toUpperCase())}
                    placeholder="ABC1D23"
                  />
                  <NativeInput
                    label="Cor do Veículo"
                    value={veiculoCor}
                    onChange={(e) => setVeiculoCor(e.target.value)}
                    placeholder="Branco"
                  />
                </div>

                {tipoVeiculo === "carro" && (
                  <div
                    className="flex items-center gap-2 p-2.5 rounded-xl border"
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                    }}
                  >
                    <input
                      type="checkbox"
                      id="arCond"
                      checked={temArCondicionado}
                      onChange={(e) => setTemArCondicionado(e.target.checked)}
                      style={{ accentColor: colors.primary }}
                      className="h-4 w-4 rounded cursor-pointer shrink-0"
                    />
                    <label htmlFor="arCond" className="text-xs text-foreground font-semibold cursor-pointer">
                      Possui Ar-Condicionado Funcionando
                    </label>
                  </div>
                )}

                <div className="pt-2.5 flex gap-2.5 mt-2">
                  <div className="w-1/3">
                    <NativeButton
                      type="button"
                      variant="outlined"
                      size="lg"
                      fullWidth
                      onClick={() => {
                        setErroValidacao(null);
                        setEtapa(1);
                      }}
                    >
                      Voltar
                    </NativeButton>
                  </div>
                  <div className="w-2/3">
                    <NativeButton
                      type="button"
                      variant="filled"
                      size="lg"
                      fullWidth
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      onClick={() => {
                        setErroValidacao(null);
                        if (!veiculoPlaca) {
                          setErroValidacao("Por favor, preencha a placa do veículo.");
                          return;
                        }
                        setEtapa(3);
                      }}
                    >
                      Avançar para CNH
                    </NativeButton>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: CNH & EAR */}
            {etapa === 3 && (
              <div className="space-y-3 animate-in fade-in-50 duration-200">
                <div className="border-b pb-2" style={{ borderColor: colors.inputBorder }}>
                  <h2 className="text-lg sm:text-xl font-black" style={{ color: colors.textPrimary }}>
                    Habilitação Profissional
                  </h2>
                  <p className="text-[11px] sm:text-xs" style={{ color: colors.textSecondary }}>
                    Sua CNH deve ter a observação EAR (Exerce Atividade Remunerada)
                  </p>
                </div>

                <NativeInput
                  label="Número do Registro da CNH"
                  required
                  leftIcon={<FileText className="w-4 h-4 text-slate-400" />}
                  value={cnh}
                  onChange={(e) => setCnh(e.target.value)}
                  placeholder="Ex: 01234567890"
                />

                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase" style={{ color: colors.textPrimary }}>
                    Categoria da CNH
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["B", "A", "AB"] as const).map((cat) => {
                      const isSelected = categoriaCNH === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategoriaCNH(cat)}
                          style={{
                            borderRadius: ui.borderRadius,
                            backgroundColor: isSelected ? colors.primary : colors.inputBackground,
                            borderColor: isSelected ? colors.primary : colors.inputBorder,
                            color: isSelected ? "#FFFFFF" : colors.textPrimary,
                          }}
                          className={`h-9 border font-black text-xs transition-all cursor-pointer ${
                            isSelected ? "shadow-2xs" : "hover:border-primary/50"
                          }`}
                        >
                          Categoria {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: ui.borderRadius,
                    backgroundColor: `${colors.primary}0D`,
                    borderColor: `${colors.primary}33`,
                  }}
                  className="p-3 border space-y-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: colors.primary }} />
                    <strong className="text-xs font-bold text-foreground">
                      Exerce Atividade Remunerada (EAR)
                    </strong>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Exigência legal do Código de Trânsito Brasileiro (CTB) para dirigir por aplicativo.
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="temEar"
                      checked={possuiEAR}
                      onChange={(e) => setPossuiEAR(e.target.checked)}
                      style={{ accentColor: colors.primary }}
                      className="h-4 w-4 rounded cursor-pointer shrink-0"
                    />
                    <label htmlFor="temEar" className="text-xs text-foreground font-semibold cursor-pointer">
                      Sim, minha CNH possui a sigla EAR
                    </label>
                  </div>
                </div>

                {/* Upload de Documentos Obrigatórios */}
                <div className="space-y-2.5 pt-1">
                  <label className="block text-xs font-semibold uppercase" style={{ color: colors.textPrimary }}>
                    Fotos dos Documentos (Auditoria &amp; Compliance)
                  </label>

                  {/* Foto da CNH */}
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                    }}
                    className="p-2.5 border space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" style={{ color: colors.primary }} />
                        <span className="text-xs font-semibold text-foreground">Foto da CNH (Frente/Verso)</span>
                      </div>
                      {cnhUrl && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/15 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                          <Check className="h-3 w-3" /> Anexada
                        </span>
                      )}
                    </div>
                    <label
                      style={{ borderRadius: ui.borderRadius }}
                      className="flex items-center justify-center gap-1.5 w-full h-9 bg-card border border-dashed border-input hover:border-primary text-xs font-semibold text-foreground cursor-pointer transition-colors"
                    >
                      {uploadingDoc === "cnh" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: colors.primary }} />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span>{cnhUrl ? "Trocar foto da CNH" : "Anexar CNH"}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleUploadArquivo(e, "cnh")}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Foto do CRLV */}
                  <div
                    style={{
                      borderRadius: ui.borderRadius,
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                    }}
                    className="p-2.5 border space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" style={{ color: colors.primary }} />
                        <span className="text-xs font-semibold text-foreground">Documento do Veículo (CRLV)</span>
                      </div>
                      {crlvUrl && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/15 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                          <Check className="h-3 w-3" /> Anexado
                        </span>
                      )}
                    </div>
                    <label
                      style={{ borderRadius: ui.borderRadius }}
                      className="flex items-center justify-center gap-1.5 w-full h-9 bg-card border border-dashed border-input hover:border-primary text-xs font-semibold text-foreground cursor-pointer transition-colors"
                    >
                      {uploadingDoc === "crlv" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: colors.primary }} />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span>{crlvUrl ? "Trocar CRLV" : "Anexar CRLV"}</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleUploadArquivo(e, "crlv")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-2.5 flex gap-2.5 mt-2">
                  <div className="w-1/3">
                    <NativeButton
                      type="button"
                      variant="outlined"
                      size="lg"
                      fullWidth
                      onClick={() => {
                        setErroValidacao(null);
                        setEtapa(2);
                      }}
                    >
                      Voltar
                    </NativeButton>
                  </div>
                  <div className="w-2/3">
                    <NativeButton
                      type="button"
                      variant="filled"
                      size="lg"
                      fullWidth
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      onClick={() => {
                        setErroValidacao(null);
                        if (!cnh) {
                          setErroValidacao("Por favor, preencha o número da CNH.");
                          return;
                        }
                        setEtapa(4);
                      }}
                    >
                      Avançar para PIX
                    </NativeButton>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 4: REPASSE PIX D+0 */}
            {etapa === 4 && (
              <form onSubmit={handleFinalizarCadastro} className="space-y-3 animate-in fade-in-50 duration-200">
                <div className="border-b pb-2" style={{ borderColor: colors.inputBorder }}>
                  <h2 className="text-lg sm:text-xl font-black" style={{ color: colors.textPrimary }}>
                    Chave PIX para Recebimentos
                  </h2>
                  <p className="text-[11px] sm:text-xs" style={{ color: colors.textSecondary }}>
                    No {nomeApp} você recebe com repasse imediato via PIX (D+0)
                  </p>
                </div>

                {/* Resumo Consolidado: PIX D+0 & Modelo de Repasse */}
                <div
                  style={{
                    borderRadius: ui.borderRadius,
                    backgroundColor: `${colors.primary}0D`,
                    borderColor: `${colors.primary}33`,
                  }}
                  className="p-3 border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase" style={{ color: colors.textPrimary }}>
                        Chave PIX (CPF):
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-black" style={{ color: colors.primary }}>
                        {cpf || "Preencha o CPF na Etapa 1"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                      Repasse D+0
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                    <span className="text-muted-foreground">Repasse automático na conta do titular</span>
                    <span className="font-extrabold text-emerald-600">Taxas a partir de 0%</span>
                  </div>
                </div>

                {erroCadastro && (
                  <div className="rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive flex items-center gap-2 mt-2 animate-in fade-in">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{erroCadastro}</span>
                  </div>
                )}

                <div className="pt-2 space-y-2 mt-2">
                  <button
                    type="submit"
                    id="btn-confirmar-cadastro-motorista"
                    disabled={carregando}
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: ui.borderRadius || "0.75rem",
                    }}
                    className="w-full py-3.5 px-4 text-white text-xs sm:text-sm font-black tracking-wide shadow-md flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {carregando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Cadastrando...</span>
                      </>
                    ) : (
                      <>
                        <span>➔</span>
                        <span>CONFIRMAR CRIAÇÃO DE CONTA</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      disabled={carregando}
                      onClick={() => {
                        setErroValidacao(null);
                        setEtapa(3);
                      }}
                      className="inline-flex items-center gap-1 font-semibold hover:underline py-1 transition-colors cursor-pointer"
                      style={{ color: colors.textSecondary }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar para CNH</span>
                    </button>

                    <Link
                      to="/auth"
                      search={{ role: "MOTORISTA" }}
                      className="inline-flex items-center font-semibold hover:underline py-1 transition-colors"
                      style={{ color: colors.textSecondary }}
                    >
                      Já tem conta?{" "}
                      <span className="font-extrabold underline ml-1" style={{ color: colors.primary }}>
                        Ir para o login
                      </span>
                    </Link>
                  </div>
                </div>
              </form>
            )}
          </div>
        ) : (
          <NativeSurface
            elevation={2}
            padding="lg"
            className="text-center space-y-4 animate-in zoom-in-95"
          >
            <div
              style={{
                borderRadius: ui.borderRadius,
                backgroundColor: `${colors.primary}15`,
                borderColor: `${colors.primary}30`,
                color: colors.primary,
              }}
              className="mx-auto flex h-16 w-16 items-center justify-center border shadow-lg"
            >
              <Clock className="h-9 w-9 stroke-[2.5]" />
            </div>

            <h2 className="text-2xl font-black text-foreground">Cadastro em análise</h2>
            
            <div
              style={{
                borderRadius: ui.borderRadius,
                backgroundColor: `${colors.primary}0D`,
                borderColor: `${colors.primary}30`,
              }}
              className="p-4 text-left space-y-2 border"
            >
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider" style={{ color: colors.primary }}>
                <ShieldAlert className="h-4 w-4" />
                <span>Status: Pendente de Aprovação Operacional</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Parabéns, <strong className="text-foreground">{nome}</strong>! Seu veículo{" "}
                <strong style={{ color: colors.primary }}>{veiculoModelo} ({veiculoPlaca.toUpperCase()})</strong>{" "}
                foi registrado na rede {nomeApp} com repasse PIX configurado.
              </p>
              <p className="text-[11px] font-medium" style={{ color: colors.primary }}>
                ⚡ Seu cadastro está em análise pela moderação. Assim que a aprovação for confirmada no Painel Administrativo, o botão <strong>"Ficar Online"</strong> será liberado instantaneamente em tempo real no seu cockpit!
              </p>
            </div>

            <div className="pt-3 space-y-2.5">
              <Link
                to="/auth"
                search={{ role: "MOTORISTA", ...(tenantParam ? { tenant: tenantParam } : {}) }}
                className="block w-full"
              >
                <NativeButton variant="filled" size="md" fullWidth>
                  Ir para o login
                </NativeButton>
              </Link>
              <Link
                to="/app/motorista"
                search={tenantParam ? { tenant: tenantParam } : undefined}
                className="block w-full"
              >
                <NativeButton variant="outlined" size="md" fullWidth>
                  Acessar cockpit
                </NativeButton>
              </Link>
            </div>
          </NativeSurface>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        {nomeApp} Mobilidade Urbana & Entregas Flash • Parceiro Oficial
      </footer>
    </div>
  );
}
