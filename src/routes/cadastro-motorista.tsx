import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Car,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Upload,
  User,
  Check,
  X,
  CreditCard,
} from "lucide-react";
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
import { whiteLabelEngine } from "@/lib/white-label";

export const Route = createFileRoute("/cadastro-motorista")({
  validateSearch: (search: Record<string, unknown>): { tenant?: string; tenant_id?: string } => ({
    tenant: typeof search.tenant === "string" ? search.tenant : undefined,
    tenant_id: typeof search.tenant_id === "string" ? search.tenant_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Cadastro de Motorista Parceiro | PARTIU" },
      {
        name: "description",
        content:
          "Cadastre seu carro ou moto para faturar com corridas urbanas e entregas expressas com planos a partir de 0% de taxa e repasse imediato via PIX D+0.",
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
    corTextoPrimaria,
  } = useBrandTheme();
  const { appConfig } = useTheme();
  const branding = appConfig?.branding || DEFAULT_APP_CONFIG.branding;
  const colors = branding?.colors || DEFAULT_APP_CONFIG.branding.colors;
  const ui = branding?.ui || DEFAULT_APP_CONFIG.branding.ui;

  // Carrega rascunho salvo do sessionStorage
  const draftSalvo = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const data = sessionStorage.getItem("partiu_driver_reg_draft");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);

  const [etapa, setEtapa] = useState<1 | 2 | 3>(() => {
    const saved = draftSalvo?.etapa;
    return saved === 1 || saved === 2 || saved === 3 ? (saved as 1 | 2 | 3) : 1;
  });
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

  // Etapa 1: Dados Pessoais & Contato
  const [nome, setNome] = useState(() => draftSalvo?.nome || "");
  const [cpf, setCpf] = useState(() => draftSalvo?.cpf || "");
  const [whatsapp, setWhatsapp] = useState(() => draftSalvo?.whatsapp || "");
  const [email, setEmail] = useState(() => draftSalvo?.email || "");
  const [senha, setSenha] = useState(() => draftSalvo?.senha || "");

  // Etapa 2: Veículo & Categoria
  const [tipoVeiculo, setTipoVeiculo] = useState<"carro" | "moto">(() => draftSalvo?.tipoVeiculo || "carro");
  const [veiculoModelo, setVeiculoModelo] = useState(() => draftSalvo?.veiculoModelo || "");
  const [veiculoAno, setVeiculoAno] = useState(() => draftSalvo?.veiculoAno || "");
  const [veiculoPlaca, setVeiculoPlaca] = useState(() => draftSalvo?.veiculoPlaca || "");
  const [veiculoCor, setVeiculoCor] = useState(() => draftSalvo?.veiculoCor || "");
  const [temArCondicionado, setTemArCondicionado] = useState(() => draftSalvo?.temArCondicionado ?? true);

  // Etapa 3: Habilitação, Documentos & Repasse PIX
  const [cnh, setCnh] = useState(() => draftSalvo?.cnh || "");
  const [categoriaCNH, setCategoriaCNH] = useState<"B" | "A" | "AB">(() => draftSalvo?.categoriaCNH || "B");
  const [possuiEAR, setPossuiEAR] = useState(() => draftSalvo?.possuiEAR ?? true);
  const [cnhUrl, setCnhUrl] = useState<string>(() => draftSalvo?.cnhUrl || "");
  const [crlvUrl, setCrlvUrl] = useState<string>(() => draftSalvo?.crlvUrl || "");
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState<string>(() => draftSalvo?.fotoPerfilUrl || "");
  const [uploadingDoc, setUploadingDoc] = useState<"cnh" | "crlv" | null>(null);

  // Persistência automática do rascunho
  useEffect(() => {
    if (sucesso) {
      try {
        sessionStorage.removeItem("partiu_driver_reg_draft");
      } catch {}
      return;
    }
    try {
      sessionStorage.setItem(
        "partiu_driver_reg_draft",
        JSON.stringify({
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
        })
      );
    } catch {}
  }, [
    sucesso, etapa, nome, cpf, whatsapp, email,
    tipoVeiculo, veiculoModelo, veiculoAno, veiculoPlaca, veiculoCor,
    temArCondicionado, cnh, categoriaCNH, possuiEAR, cnhUrl, crlvUrl, fotoPerfilUrl
  ]);

  // Alerta de proteção contra fechamento acidental
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
      } catch {}
    }
    void preencherDeSessaoGoogle();
  }, []);

  async function handleUploadArquivo(
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: "cnh" | "crlv"
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
        else setCrlvUrl(base64);
        setUploadingDoc(null);
      };
      reader.readAsDataURL(file);
      return;
    }

    if (tipo === "cnh") setCnhUrl(url);
    else setCrlvUrl(url);
    setUploadingDoc(null);
  }

  async function handleFinalizarCadastro(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErroCadastro(null);
    setErroValidacao(null);

    if (!cnh || cnh.trim().length < 9) {
      setErroValidacao("Digite um número de CNH válido.");
      setCarregando(false);
      return;
    }

    if (!fotoPerfilUrl) {
      setErroValidacao("Sua foto de identificação de perfil é obrigatória.");
      setCarregando(false);
      return;
    }

    const chavePixEfetiva = cpf.replace(/\D/g, "");

    const res = await supabaseAuthService.signUpDriver({
      name: nome.trim(),
      email: email.trim().toLowerCase(),
      phone: whatsapp,
      cpf,
      password: senha || "partiu2026",
      vehicleType: tipoVeiculo,
      vehicleModel: veiculoModelo.trim(),
      vehiclePlate: veiculoPlaca.toUpperCase().trim(),
      vehicleYear: veiculoAno.trim(),
      vehicleColor: veiculoCor.trim(),
      cnh: cnh.trim(),
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
      setErroCadastro(res.error || "Não foi possível concluir o cadastro no momento.");
      return;
    }

    const motoristaNovo = {
      id: res.user?.id || "mot_" + Date.now(),
      nome: nome.trim(),
      cpf,
      whatsapp,
      email: email.trim().toLowerCase(),
      tipoVeiculo,
      modelo: veiculoModelo.trim(),
      ano: veiculoAno.trim(),
      placa: veiculoPlaca.toUpperCase().trim(),
      cor: veiculoCor.trim(),
      temArCondicionado,
      cnh: cnh.trim(),
      categoriaCNH,
      possuiEAR,
      chavePix: chavePixEfetiva,
      tipoChave: "cpf",
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
    } catch (err) {
      silentCatchWarn("cadastro-motorista", err);
    }

    void driverFleetService.registerDriver({
      name: nome.trim(),
      phone: whatsapp,
      email: email.trim() || undefined,
      vehicle_type: tipoVeiculo === "moto" ? "MOTO" : "CARRO",
      vehicle_plate: veiculoPlaca.toUpperCase().trim() || "SEM-PLACA",
      vehicle_model: veiculoModelo.trim(),
      cnh_number: cnh.trim() || "00000000000",
      pix_key: chavePixEfetiva || undefined,
    });

    setSucesso(true);
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col font-sans transition-colors duration-200 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]"
      style={{
        backgroundColor: colors.background,
        color: colors.textPrimary,
        fontFamily: ui.fontFamily,
      }}
    >
      {/* Top Header Limpo */}
      <header className="mx-auto w-full max-w-lg pt-[max(0.5rem,calc(env(safe-area-inset-top,0px)))] flex items-center justify-between pb-3">
        <Link
          to="/"
          search={tenantParam ? { tenant: tenantParam } : undefined}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition active:scale-95 shadow-2xs"
          aria-label="Voltar para início"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar</span>
        </Link>

        <span
          className="text-xs font-bold tracking-tight flex items-center gap-1.5 px-3 py-1 rounded-full border"
          style={{
            borderColor: `${colors.primary}25`,
            backgroundColor: `${colors.primary}0D`,
            color: colors.primary,
          }}
        >
          <Car className="h-3.5 w-3.5" />
          <span>Motorista Parceiro</span>
        </span>

        <Link
          to="/auth"
          search={{ role: "MOTORISTA", ...(tenantParam ? { tenant: tenantParam } : {}) }}
          className="text-xs font-bold hover:underline transition px-2 py-1"
          style={{ color: colors.primary }}
          aria-label="Entrar como motorista"
        >
          Entrar
        </Link>
      </header>

      {/* Conteúdo Principal */}
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-start py-2 pb-8 sm:pb-12">
        {!sucesso ? (
          <div
            className="w-full p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-100/80 transition-all duration-200 relative"
            style={{ borderRadius: ui.borderRadius || "1.25rem" }}
          >
            {/* Cabeçalho do Card */}
            <div className="text-center pb-2">
              <h1
                className="text-xl sm:text-[22px] font-black tracking-tight"
                style={{ color: colors.textPrimary }}
              >
                Cadastro de Motorista Parceiro
              </h1>
              <p className="text-xs mt-1 font-normal" style={{ color: colors.textSecondary }}>
                Dirija com autonomia, repasse imediato via PIX e taxas justas
              </p>
              <div
                className="w-7 h-0.5 rounded-full mx-auto mt-2 transition-colors"
                style={{ backgroundColor: colors.primary }}
              />
            </div>

            {/* Stepper de 3 Etapas Estratégicas */}
            <div className="py-1">
              <WhiteLabelProgressBar
                currentStep={etapa}
                totalSteps={3}
                stepTitle={
                  etapa === 1
                    ? "Dados Pessoais"
                    : etapa === 2
                    ? "Veículo"
                    : "Habilitação & Repasse"
                }
              />
            </div>

            {/* Alerta de Validação Contextual */}
            {erroValidacao && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center justify-between gap-2 animate-in fade-in"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{erroValidacao}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErroValidacao(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ETAPA 1: DADOS PESSOAIS & CONTATO */}
            {etapa === 1 && (
              <div className="space-y-3.5 pt-2 animate-in fade-in-50 duration-200 text-left">
                <NativeInput
                  label="Nome completo"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome idêntico ao da CNH"
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                />

                <div className="grid grid-cols-2 gap-2.5">
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
                      <div className="flex items-center gap-0.5 text-[11px] font-bold text-slate-700 select-none">
                        <span>🇧🇷</span>
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
                  label="Criar senha de acesso"
                  required
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres para entrar no Cockpit"
                  leftIcon={<ShieldCheck className="w-4 h-4 text-slate-400" />}
                />

                <div className="pt-3 space-y-2.5">
                  <NativeButton
                    type="button"
                    variant="filled"
                    size="md"
                    fullWidth
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    onClick={async () => {
                      setErroValidacao(null);
                      if (!nome.trim() || !cpf.trim() || !whatsapp.trim() || !email.trim()) {
                        setErroValidacao("Preencha todos os campos obrigatórios.");
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
                    Avançar para dados do veículo
                  </NativeButton>

                  <div className="text-center pt-1">
                    <Link
                      to="/auth"
                      search={{ role: "MOTORISTA" }}
                      className="inline-flex items-center justify-center text-xs font-medium hover:underline py-1 transition-colors text-slate-600"
                    >
                      Já tem uma conta de parceiro?{" "}
                      <span className="font-bold underline ml-1" style={{ color: colors.primary }}>
                        Entrar
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: VEÍCULO & CATEGORIA */}
            {etapa === 2 && (
              <div className="space-y-3.5 pt-2 animate-in fade-in-50 duration-200 text-left">
                {/* Seletor Carro vs Moto com Design Sóbrio */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-tight text-slate-800">
                    Tipo de veículo
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoVeiculo("carro");
                        setCategoriaCNH("B");
                      }}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        tipoVeiculo === "carro"
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      style={
                        tipoVeiculo === "carro"
                          ? {
                              borderColor: colors.primary,
                              backgroundColor: `${colors.primary}12`,
                              color: colors.primary,
                            }
                          : {}
                      }
                    >
                      <Car className="h-4 w-4" />
                      <span>Carro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipoVeiculo("moto");
                        setCategoriaCNH("A");
                      }}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        tipoVeiculo === "moto"
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      style={
                        tipoVeiculo === "moto"
                          ? {
                              borderColor: colors.primary,
                              backgroundColor: `${colors.primary}12`,
                              color: colors.primary,
                            }
                          : {}
                      }
                    >
                      <Bike className="h-4 w-4" />
                      <span>Moto</span>
                    </button>
                  </div>
                </div>

                <NativeInput
                  label="Modelo e marca"
                  required
                  value={veiculoModelo}
                  onChange={(e) => setVeiculoModelo(e.target.value)}
                  placeholder={tipoVeiculo === "carro" ? "Ex: Chevrolet Onix 1.0" : "Ex: Honda CG 160 Fan"}
                  leftIcon={<Car className="w-4 h-4 text-slate-400" />}
                />

                <div className="grid grid-cols-3 gap-2">
                  <NativeInput
                    label="Ano"
                    required
                    value={veiculoAno}
                    onChange={(e) => setVeiculoAno(e.target.value)}
                    placeholder="2022"
                  />
                  <NativeInput
                    label="Placa"
                    required
                    value={veiculoPlaca}
                    onChange={(e) => setVeiculoPlaca(e.target.value.toUpperCase())}
                    placeholder="ABC1D23"
                  />
                  <NativeInput
                    label="Cor"
                    value={veiculoCor}
                    onChange={(e) => setVeiculoCor(e.target.value)}
                    placeholder="Branco"
                  />
                </div>

                {tipoVeiculo === "carro" && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <input
                      type="checkbox"
                      id="arCond"
                      checked={temArCondicionado}
                      onChange={(e) => setTemArCondicionado(e.target.checked)}
                      style={{ accentColor: colors.primary }}
                      className="h-4 w-4 rounded cursor-pointer shrink-0"
                    />
                    <label htmlFor="arCond" className="text-xs text-slate-700 font-medium cursor-pointer">
                      Possui ar-condicionado em funcionamento
                    </label>
                  </div>
                )}

                <div className="pt-3 flex gap-2.5">
                  <div className="w-1/3">
                    <NativeButton
                      type="button"
                      variant="outlined"
                      size="md"
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
                      size="md"
                      fullWidth
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      onClick={() => {
                        setErroValidacao(null);
                        if (!veiculoModelo.trim()) {
                          setErroValidacao("Informe o modelo e marca do veículo.");
                          return;
                        }
                        if (!veiculoPlaca.trim()) {
                          setErroValidacao("Informe a placa do veículo.");
                          return;
                        }
                        setEtapa(3);
                      }}
                    >
                      Avançar para documentos
                    </NativeButton>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 3: HABILITAÇÃO, DOCUMENTOS & REPASSE PIX */}
            {etapa === 3 && (
              <form onSubmit={handleFinalizarCadastro} className="space-y-3.5 pt-2 animate-in fade-in-50 duration-200 text-left">
                <NativeInput
                  label="Número do registro da CNH"
                  required
                  leftIcon={<FileText className="w-4 h-4 text-slate-400" />}
                  value={cnh}
                  onChange={(e) => setCnh(e.target.value)}
                  placeholder="Ex: 01234567890"
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold tracking-tight text-slate-800">
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
                          className={`h-9 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary text-white shadow-2xs"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: colors.primary,
                                  borderColor: colors.primary,
                                }
                              : {}
                          }
                        >
                          Categoria {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* EAR Toggle Discreto */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <input
                    type="checkbox"
                    id="temEar"
                    checked={possuiEAR}
                    onChange={(e) => setPossuiEAR(e.target.checked)}
                    style={{ accentColor: colors.primary }}
                    className="h-4 w-4 rounded cursor-pointer shrink-0"
                  />
                  <label htmlFor="temEar" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Possui observação <strong>EAR</strong> (Exerce Atividade Remunerada) na CNH
                  </label>
                </div>

                {/* Foto de Perfil / Selfie Oficial */}
                <div className="pt-1">
                  <CameraPhotoCapture
                    label="Selfie de identificação"
                    sublabel="Tire uma foto sua para o perfil do motorista"
                    value={fotoPerfilUrl}
                    onChange={(capturedUrl) => {
                      setFotoPerfilUrl(capturedUrl);
                      if (erroValidacao?.includes("foto") || erroValidacao?.includes("identificação")) {
                        setErroValidacao(null);
                      }
                    }}
                    required
                  />
                </div>

                {/* Anexos de CNH e CRLV */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-semibold tracking-tight text-slate-800">
                    Fotos dos documentos (opcional no pré-cadastro)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* CNH */}
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">Foto CNH</span>
                        {cnhUrl && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            <Check className="h-3 w-3" /> Anexada
                          </span>
                        )}
                      </div>
                      <label className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg bg-white border border-dashed border-slate-300 hover:border-slate-400 text-xs font-medium text-slate-700 cursor-pointer transition-colors">
                        {uploadingDoc === "cnh" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>{cnhUrl ? "Trocar" : "Anexar"}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleUploadArquivo(e, "cnh")}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* CRLV */}
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">Foto CRLV</span>
                        {crlvUrl && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            <Check className="h-3 w-3" /> Anexada
                          </span>
                        )}
                      </div>
                      <label className="flex items-center justify-center gap-1.5 w-full h-8 rounded-lg bg-white border border-dashed border-slate-300 hover:border-slate-400 text-xs font-medium text-slate-700 cursor-pointer transition-colors">
                        {uploadingDoc === "crlv" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>{crlvUrl ? "Trocar" : "Anexar"}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleUploadArquivo(e, "crlv")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Cartão de Repasse PIX D+0 Limpo */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      Chave PIX de Recebimento
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                      PIX D+0
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Seus repasses serão liquidados no CPF do titular cadastrado ({cpf || "CPF"}).
                  </p>
                </div>

                {erroCadastro && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2 animate-in fade-in">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{erroCadastro}</span>
                  </div>
                )}

                <div className="pt-3 flex gap-2.5">
                  <div className="w-1/3">
                    <NativeButton
                      type="button"
                      variant="outlined"
                      size="md"
                      fullWidth
                      disabled={carregando}
                      onClick={() => {
                        setErroValidacao(null);
                        setEtapa(2);
                      }}
                    >
                      Voltar
                    </NativeButton>
                  </div>
                  <div className="w-2/3">
                    <button
                      type="submit"
                      id="btn-confirmar-cadastro-motorista"
                      disabled={carregando}
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: ui.borderRadius || "0.75rem",
                      }}
                      className="w-full py-3 px-4 text-white text-xs sm:text-sm font-bold tracking-wide shadow-md flex items-center justify-center gap-2 transition hover:brightness-105 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      {carregando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Finalizando...</span>
                        </>
                      ) : (
                        <span>Finalizar cadastro</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        ) : (
          <NativeSurface
            elevation={2}
            padding="lg"
            className="text-center space-y-4 animate-in zoom-in-95 bg-white border border-slate-200"
          >
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
              style={{
                backgroundColor: `${colors.primary}15`,
                color: colors.primary,
              }}
            >
              <Clock className="h-8 w-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">Cadastro em análise</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Parabéns, <span className="font-bold text-slate-900">{nome}</span>. Seu veículo{" "}
                <strong style={{ color: colors.primary }}>{veiculoModelo} ({veiculoPlaca.toUpperCase()})</strong>{" "}
                foi registrado na rede {nomeApp}.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-left text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Auditoria operacional em andamento</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                A aprovação dos dados é realizada pela equipe de moderação. Assim que aprovado, seu acesso ao Cockpit fica ativo.
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

      <footer className="text-center text-[11px] text-slate-400 py-2">
        {nomeApp} Mobilidade Urbana & Logística Expressa
      </footer>
    </div>
  );
}
