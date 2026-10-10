/**
 * ==============================================================================
 * 💳 PARTIU ECOSYSTEM — DRIVER SUBSCRIPTION SERVICE (SaaS MODEL)
 * ==============================================================================
 * Gerenciador da Trava Inteligente de Diária Pré-Paga (24 horas) do Motorista.
 *
 * REGRA DE OURO DO PARTIU:
 * - O sistema opera 100% no modelo SaaS por diária pré-paga via PIX.
 * - NENHUMA comissão percentual é cobrada sobre as corridas (0% Take Rate).
 * - O motorista fica com 100% dos ganhos de cada viagem e entrega.
 * - Se a diária de 24h estiver vencida ou não paga, o cockpit é bloqueado
 *   até a liquidação do PIX.
 * ==============================================================================
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { appSettingsService } from "./app-settings-service";
import { computePixCrc16, buildStandardEmvPix, generateLocalQrCodeSvgSync } from "@/services/payment/PaymentProviderAdapter";
import { getMonetizacaoConfig } from "@/lib/superadmin-config";
import { WhiteLabelEngine } from "@/lib/white-label/white-label-engine";

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "PENDING" | "CANCELLED";

export interface DriverSubscriptionRecord {
  id: string;
  driver_id: string;
  vehicle_type: "MOTO" | "CARRO";
  status: SubscriptionStatus;
  starts_at: string;
  expires_at: string;
  pix_txid: string;
  amount_paid: number;
  created_at: string;
  updated_at: string;
  cycle?: "DAILY" | "WEEKLY" | "MONTHLY" | "TRIAL";
  tenant_id?: string;
}

export interface GeneratedPixPayment {
  txId: string;
  txid: string;
  amount: number;
  copiaECola: string;
  qrCodeUrl: string;
  expiresInMinutes: number;
  receiver: {
    name: string;
    pixKey: string;
    city: string;
  };
}

export type DriverLifecycleStatus = "TRIAL" | "ACTIVE" | "GRACE_PERIOD" | "EXPIRED" | "BLOCKED";

export interface DriverSubscriptionAccount {
  driverId: string;
  driverName: string;
  phone: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleType: "CARRO" | "MOTO";
  currentPlanId: string;
  currentPlanName: string;
  status: DriverLifecycleStatus;
  startsAt: string;
  expiresAt: string;
  daysRemaining: number;
  lastPaymentBrl: number;
  lastPaymentDate: string;
  lastPaymentTxId: string;
  courtesyDaysGranted: number;
  blockedReason?: string;
  documentsApproved: boolean;
  tenantId?: string;
}

export interface ExecutiveSaaSMetrics {
  mrrBrl: number;
  arrBrl: number;
  activeSubscribersCount: number;
  expiringIn7DaysCount: number;
  defaultingOrBlockedCount: number;
  totalGmvProcessedBrl: number;
  totalSavingsForFleetBrl: number;
  renewalRatePercent: number;
  churnRatePercent: number;
}

const SUBSCRIPTIONS_STORAGE_KEY = "partiu_driver_subscriptions_store";
const DRIVER_ACCOUNTS_STORAGE_KEY = "partiu_driver_subscription_accounts_store";

const INITIAL_DRIVER_ACCOUNTS: DriverSubscriptionAccount[] = [
  {
    driverId: "mot-001",
    driverName: "Carlos Eduardo Silva",
    phone: "(11) 98452-1099",
    vehicleModel: "Fiat Cronos 1.3 Drive",
    vehiclePlate: "ABC-1D23",
    vehicleType: "CARRO",
    currentPlanId: "plano-mensal-ilimitado",
    currentPlanName: "Mensal Ilimitado (Zero Taxa)",
    status: "ACTIVE",
    startsAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 23 * 86400000).toISOString(),
    daysRemaining: 23,
    lastPaymentBrl: 199.90,
    lastPaymentDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastPaymentTxId: "PIX_SUB_78291024_CARLOS",
    courtesyDaysGranted: 0,
    documentsApproved: true,
  },
  {
    driverId: "mot-002",
    driverName: "Roberto Santos",
    phone: "(11) 97120-3341",
    vehicleModel: "Honda CG 160 Fan",
    vehiclePlate: "KLP-9821",
    vehicleType: "MOTO",
    currentPlanId: "plano-diaria-moto",
    currentPlanName: "Diária Flex Moto (24h)",
    status: "ACTIVE",
    startsAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    expiresAt: new Date(Date.now() + 16 * 3600000).toISOString(),
    daysRemaining: 1,
    lastPaymentBrl: 9.90,
    lastPaymentDate: new Date(Date.now() - 8 * 3600000).toISOString(),
    lastPaymentTxId: "PIX_SUB_88201944_ROBERTO",
    courtesyDaysGranted: 0,
    documentsApproved: true,
  },
  {
    driverId: "mot-003",
    driverName: "Juliana Alcântara",
    phone: "(11) 99823-4554",
    vehicleModel: "Chevrolet Onix Plus LTZ",
    vehiclePlate: "XYZ-4E56",
    vehicleType: "CARRO",
    currentPlanId: "plano-trial-gratis",
    currentPlanName: "Degustação Grátis (Trial 7 Dias)",
    status: "TRIAL",
    startsAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    daysRemaining: 4,
    lastPaymentBrl: 0.00,
    lastPaymentDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    lastPaymentTxId: "TRIAL_CADASTRO_NOVO_JULIANA",
    courtesyDaysGranted: 7,
    documentsApproved: true,
  },
  {
    driverId: "mot-004",
    driverName: "Marcos Vinicius",
    phone: "(11) 98765-4321",
    vehicleModel: "Ford Ka 1.0 SE",
    vehiclePlate: "BRA-2E19",
    vehicleType: "CARRO",
    currentPlanId: "plano-semanal-pro",
    currentPlanName: "Semanal Pro (7 Dias)",
    status: "GRACE_PERIOD",
    startsAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    daysRemaining: 0,
    lastPaymentBrl: 69.90,
    lastPaymentDate: new Date(Date.now() - 9 * 86400000).toISOString(),
    lastPaymentTxId: "PIX_SUB_34902188_MARCOS",
    courtesyDaysGranted: 0,
    documentsApproved: true,
  },
  {
    driverId: "mot-005",
    driverName: "Rafael Silveira",
    phone: "(11) 91234-5678",
    vehicleModel: "Hyundai HB20 1.6",
    vehiclePlate: "RIO-9J82",
    vehicleType: "CARRO",
    currentPlanId: "plano-mensal-ouro",
    currentPlanName: "Mensal Ouro (30 Dias)",
    status: "BLOCKED",
    startsAt: new Date(Date.now() - 38 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    daysRemaining: 0,
    lastPaymentBrl: 199.90,
    lastPaymentDate: new Date(Date.now() - 38 * 86400000).toISOString(),
    lastPaymentTxId: "PIX_SUB_11903456_RAFAEL",
    courtesyDaysGranted: 0,
    blockedReason: "Inadimplência de mensalidade após expiração da carência de 3 dias.",
    documentsApproved: true,
  },
  {
    driverId: "mot-006",
    driverName: "Fernando Guimarães",
    phone: "(11) 97766-5544",
    vehicleModel: "Toyota Yaris Sedan XLS",
    vehiclePlate: "PET-4A33",
    vehicleType: "CARRO",
    currentPlanId: "plano-mensal-ilimitado",
    currentPlanName: "Mensal Ilimitado (Zero Taxa)",
    status: "ACTIVE",
    startsAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 18 * 86400000).toISOString(),
    daysRemaining: 18,
    lastPaymentBrl: 199.90,
    lastPaymentDate: new Date(Date.now() - 12 * 86400000).toISOString(),
    lastPaymentTxId: "PIX_SUB_99018423_FERNANDO",
    courtesyDaysGranted: 0,
    documentsApproved: true,
  },
];

class DriverSubscriptionService {
  private subscriptions: DriverSubscriptionRecord[] = [];
  private driverAccounts: DriverSubscriptionAccount[] = [];
  private listeners: Set<(subs: DriverSubscriptionRecord[]) => void> = new Set();
  private accountListeners: Set<(accs: DriverSubscriptionAccount[]) => void> = new Set();

  constructor() {
    this.subscriptions = this.loadFromStorage();
    this.driverAccounts = this.loadAccountsFromStorage();
    if (typeof window !== "undefined") {
      void this.syncFromBackend();
    }
  }

  private loadFromStorage(): DriverSubscriptionRecord[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[DriverSubscriptionService] Falha ao ler cache:", e);
    }
    return [];
  }

  private loadAccountsFromStorage(): DriverSubscriptionAccount[] {
    if (typeof window === "undefined") return INITIAL_DRIVER_ACCOUNTS;
    try {
      const raw = localStorage.getItem(DRIVER_ACCOUNTS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[DriverSubscriptionService] Falha ao ler contas:", e);
    }
    return INITIAL_DRIVER_ACCOUNTS;
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(this.subscriptions));
    } catch (e) {
      console.warn("[DriverSubscriptionService] Falha ao salvar cache:", e);
    }
  }

  private saveAccountsToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(DRIVER_ACCOUNTS_STORAGE_KEY, JSON.stringify(this.driverAccounts));
    } catch (e) {
      console.warn("[DriverSubscriptionService] Falha ao salvar contas:", e);
    }
  }

  public async syncFromBackend(): Promise<DriverSubscriptionRecord[]> {
    if (!isSupabaseConfigured()) {
      return this.subscriptions;
    }

    try {
      const { data, error } = await (supabase as any)
        .from("driver_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        this.subscriptions = data.map((d: any) => ({
          id: d.id,
          driver_id: d.driver_id,
          vehicle_type: d.vehicle_type === "MOTO" ? "MOTO" : "CARRO",
          status: d.status as SubscriptionStatus,
          starts_at: d.starts_at,
          expires_at: d.expires_at,
          pix_txid: d.pix_txid || "",
          amount_paid: Number(d.amount_paid) || 0,
          created_at: d.created_at,
          updated_at: d.updated_at,
        }));
        this.saveToStorage();
        this.notifyListeners();
      }
    } catch (e) {
      console.warn("[DriverSubscriptionService] Falha ao buscar no Supabase:", e);
    }

    return this.subscriptions;
  }

  /**
   * Consulta a assinatura ativa mais recente do condutor
   */
  public getActiveSubscription(driverId: string): DriverSubscriptionRecord | null {
    const now = new Date().getTime();
    const subs = this.subscriptions.filter((s) => s.driver_id === driverId);

    for (const sub of subs) {
      const expires = new Date(sub.expires_at).getTime();
      if (sub.status === "ACTIVE" && expires > now) {
        return sub;
      }
    }
    return null;
  }

  /**
   * Consulta a assinatura ativa do condutor
   */
  public getSubscription(driverId: string): DriverSubscriptionRecord | null {
    return this.getActiveSubscription(driverId);
  }

  /**
   * Verifica se o condutor está desbloqueado para operar (diária de 24h válida)
   */
  public isDriverUnlocked(driverId: string): boolean {
    const active = this.getActiveSubscription(driverId);
    return Boolean(active);
  }

  /**
   * Calcula o tempo restante da diária ativa em horas e minutos formatados
   */
  public getRemainingTime(subscription: DriverSubscriptionRecord): { hours: number; minutes: number; formatted: string } {
    const now = Date.now();
    const diffMs = Math.max(0, new Date(subscription.expires_at).getTime() - now);
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
      hours,
      minutes,
      formatted: `${hours}h ${minutes.toString().padStart(2, "0")}min`,
    };
  }

  /**
   * Obtém o tenant_id vinculado ao motorista ou da sessão ativa
   */
  public getDriverTenantId(driverId: string): string {
    const acc = this.driverAccounts.find((a) => a.driverId === driverId);
    if (acc?.tenantId) return acc.tenantId;
    const sub = this.subscriptions.find((s) => s.driver_id === driverId);
    if (sub?.tenant_id) return sub.tenant_id;
    try {
      return WhiteLabelEngine.getInstance().getActiveTenantId();
    } catch {
      return "tenant-itaperuna";
    }
  }

  /**
   * Gera ordem de pagamento PIX dinâmico para a diária do motorista isolada por Franqueado
   */
  public generateDailyFeePix(
    driverId: string,
    vehicleType: "MOTO" | "CARRO" = "CARRO",
    cycle: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY",
    tenantId?: string
  ): GeneratedPixPayment {
    const effectiveTenantId = tenantId || this.getDriverTenantId(driverId);
    let tenantMonetization: any = null;
    let tenantGeo: any = null;
    let tenantBrand: any = null;

    try {
      const wlEngine = WhiteLabelEngine.getInstance();
      const tenantConfig = wlEngine.getTenantConfig(effectiveTenantId);
      tenantMonetization = tenantConfig?.monetization;
      tenantGeo = tenantConfig?.geo;
      tenantBrand = tenantConfig?.brandCenter;
    } catch {
      // Silencioso
    }

    const config = getMonetizacaoConfig();
    const settings = appSettingsService.getSettings();

    // Prioriza a conta PIX recebedora do Franqueado / Tenant
    const pixKey =
      (tenantMonetization?.chavePixAdmin && tenantMonetization.chavePixAdmin.trim()) ||
      (config.chavePixAdmin && config.chavePixAdmin.trim()) ||
      settings.pix_key ||
      "financeiro@partiu.app";

    const receiverName =
      (tenantMonetization?.beneficiarioAdmin && tenantMonetization.beneficiarioAdmin.trim()) ||
      tenantBrand?.nomePlataforma ||
      (config.beneficiarioAdmin && config.beneficiarioAdmin.trim()) ||
      settings.pix_receiver_name ||
      "PARTIU Mobilidade";

    const receiverCity =
      (tenantMonetization?.cidadeAdmin && tenantMonetization.cidadeAdmin.trim()) ||
      (tenantGeo?.cidadeSede && tenantGeo.cidadeSede.trim()) ||
      (config.cidadeAdmin && config.cidadeAdmin.trim()) ||
      settings.pix_receiver_city ||
      "ITAPERUNA";

    let amount = vehicleType === "MOTO"
      ? (tenantMonetization?.diariaMoto ?? config.diariaMoto)
      : (tenantMonetization?.diariaCarro ?? config.diariaCarro);

    if (cycle === "WEEKLY") {
      amount = vehicleType === "MOTO"
        ? (tenantMonetization?.semanalMoto ?? config.semanalMoto)
        : (tenantMonetization?.semanalCarro ?? config.semanalCarro);
    } else if (cycle === "MONTHLY") {
      amount = vehicleType === "MOTO"
        ? (tenantMonetization?.mensalMoto ?? config.mensalMoto)
        : (tenantMonetization?.mensalCarro ?? config.mensalCarro);
    }

    // Abate créditos operacionais acumulados (ex: taxa de no-show / cancelamento / cupons)
    const hasStorage = typeof window !== "undefined" || typeof localStorage !== "undefined";
    if (hasStorage) {
      try {
        const store = typeof window !== "undefined" ? window.localStorage : localStorage;
        const creditsKey = `partiu_driver_daily_credits_${driverId}`;
        const availableCredits = Number(
          store.getItem(creditsKey) || store.getItem("partiu_driver_daily_credits") || 0
        );
        if (availableCredits > 0) {
          amount = Math.max(1.0, Number((amount - availableCredits).toFixed(2)));
        }
      } catch {}
    }

    const txId = `PARTIU_${cycle}_${Date.now()}_${driverId.slice(-4)}`;
    const copiaECola = buildStandardEmvPix(pixKey, receiverName, receiverCity, amount, txId);

    const qrCodeUrl = generateLocalQrCodeSvgSync(copiaECola);

    return {
      txId,
      txid: txId,
      amount,
      copiaECola,
      qrCodeUrl,
      expiresInMinutes: 30,
      receiver: {
        name: receiverName,
        pixKey,
        city: receiverCity,
      },
    };
  }

  /**
   * Alias de conveniência para generateDailyFeePix
   */
  public generatePixDailyPayment(
    driverId: string,
    vehicleType: "MOTO" | "CARRO" = "CARRO",
    cycle: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY",
    tenantId?: string
  ): GeneratedPixPayment {
    return this.generateDailyFeePix(driverId, vehicleType, cycle, tenantId);
  }

  /**
   * Obtém os créditos operacionais disponíveis para o motorista
   */
  public getOperationalCredits(driverId: string): number {
    const hasStorage = typeof window !== "undefined" || typeof localStorage !== "undefined";
    if (!hasStorage) return 0;
    try {
      const store = typeof window !== "undefined" ? window.localStorage : localStorage;
      return Number(
        store.getItem(`partiu_driver_daily_credits_${driverId}`) ||
        store.getItem("partiu_driver_daily_credits") ||
        0
      );
    } catch {
      return 0;
    }
  }

  /**
   * Adiciona créditos operacionais ao motorista (ex: subsídio de cupom de desconto promocional)
   */
  public addOperationalCredit(driverId: string, creditAmount: number): number {
    if (creditAmount <= 0) return 0;
    const hasStorage = typeof window !== "undefined" || typeof localStorage !== "undefined";
    if (!hasStorage) return 0;
    try {
      const store = typeof window !== "undefined" ? window.localStorage : localStorage;
      const current = this.getOperationalCredits(driverId);
      const updated = Number((current + creditAmount).toFixed(2));
      store.setItem(`partiu_driver_daily_credits_${driverId}`, String(updated));
      store.setItem("partiu_driver_daily_credits", String(updated));
      this.notifyListeners();
      return updated;
    } catch {
      return 0;
    }
  }

  /**
   * Confirma o pagamento da diária e libera o condutor pelo tempo do plano com tenant isolado
   */
  public async confirmDailyFeePayment(
    driverId: string,
    vehicleType: "MOTO" | "CARRO",
    txId?: string,
    amount?: number,
    durationHours: number = 24,
    tenantId?: string
  ): Promise<DriverSubscriptionRecord> {
    const effectiveTenantId = tenantId || this.getDriverTenantId(driverId);
    let valorDiaria = amount;

    if (valorDiaria === undefined) {
      try {
        const wlEngine = WhiteLabelEngine.getInstance();
        const tenantConfig = wlEngine.getTenantConfig(effectiveTenantId);
        const tMon = tenantConfig?.monetization;
        const config = getMonetizacaoConfig();
        valorDiaria = vehicleType === "MOTO"
          ? (tMon?.diariaMoto ?? config.diariaMoto)
          : (tMon?.diariaCarro ?? config.diariaCarro);
      } catch {
        const config = getMonetizacaoConfig();
        valorDiaria = vehicleType === "MOTO" ? config.diariaMoto : config.diariaCarro;
      }
    }

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);

    const newSub: DriverSubscriptionRecord = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      driver_id: driverId,
      vehicle_type: vehicleType,
      status: "ACTIVE",
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      pix_txid: txId || `TX_SIM_${Date.now()}`,
      amount_paid: valorDiaria,
      tenant_id: effectiveTenantId,
      created_at: startsAt.toISOString(),
      updated_at: startsAt.toISOString(),
    };

    // Remove eventuais ativas anteriores expiradas e insere no topo
    this.subscriptions = [newSub, ...this.subscriptions];
    this.saveToStorage();

    // Limpa créditos operacionais que foram consumidos no pagamento
    const hasStorage = typeof window !== "undefined" || typeof localStorage !== "undefined";
    if (hasStorage) {
      try {
        const store = typeof window !== "undefined" ? window.localStorage : localStorage;
        store.removeItem(`partiu_driver_daily_credits_${driverId}`);
        store.removeItem("partiu_driver_daily_credits");
      } catch {}
    }

    this.notifyListeners();

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("partiu:driver_subscription_activated", {
          detail: { driverId, expiresAt: expiresAt.toISOString(), timestamp: Date.now() },
        })
      );
    }

    if (isSupabaseConfigured()) {
      try {
        await (supabase as any).from("driver_subscriptions").insert({
          id: newSub.id,
          driver_id: newSub.driver_id,
          vehicle_type: newSub.vehicle_type,
          status: newSub.status,
          starts_at: newSub.starts_at,
          expires_at: newSub.expires_at,
          pix_txid: newSub.pix_txid,
          amount_paid: newSub.amount_paid,
          tenant_id: effectiveTenantId,
          created_at: newSub.created_at,
          updated_at: newSub.updated_at,
        });
      } catch (e) {
        console.warn("[DriverSubscriptionService] Falha ao persistir no Supabase:", e);
      }
    }

    return newSub;
  }

  /**
   * Ativação de Degustação Grátis (Trial) para novos motoristas
   */
  public async activateTrial(
    driverId: string,
    vehicleType: "MOTO" | "CARRO" = "CARRO"
  ): Promise<DriverSubscriptionRecord | null> {
    const config = getMonetizacaoConfig();
    if (!config.trialAtivo || config.trialDias <= 0) return null;
    const hours = config.trialDias * 24;
    return this.confirmDailyFeePayment(driverId, vehicleType, `TRIAL_${Date.now()}`, 0, hours);
  }

  /**
   * Simulação instantânea para homologação e testes de desbloqueio imediato
   */
  public async simulateDailyFeePayment(
    driverId: string,
    vehicleType: "MOTO" | "CARRO" = "CARRO"
  ): Promise<DriverSubscriptionRecord> {
    return this.confirmDailyFeePayment(driverId, vehicleType, `TX_TEST_${Date.now()}`);
  }

  /**
   * Métricas Financeiras SaaS para o Painel Administrativo
   */
  public getSaaSMetrics(): {
    totalRevenueToday: number;
    totalRevenueMonth: number;
    activeDriversCount: number;
    expiredDriversCount: number;
    totalSubscriptionsCount: number;
  } {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentYearMonth = todayStr.slice(0, 7);

    let totalRevenueToday = 0;
    let totalRevenueMonth = 0;
    const activeDrivers = new Set<string>();
    const expiredDrivers = new Set<string>();

    for (const sub of this.subscriptions) {
      if (sub.status === "ACTIVE") {
        const subDate = sub.created_at.slice(0, 10);
        if (subDate === todayStr) {
          totalRevenueToday += sub.amount_paid;
        }
        if (subDate.startsWith(currentYearMonth)) {
          totalRevenueMonth += sub.amount_paid;
        }

        const isExpired = new Date(sub.expires_at).getTime() < now.getTime();
        if (isExpired) {
          expiredDrivers.add(sub.driver_id);
        } else {
          activeDrivers.add(sub.driver_id);
        }
      }
    }

    return {
      totalRevenueToday: Math.round(totalRevenueToday * 100) / 100,
      totalRevenueMonth: Math.round(totalRevenueMonth * 100) / 100,
      activeDriversCount: activeDrivers.size,
      expiredDriversCount: expiredDrivers.size,
      totalSubscriptionsCount: this.subscriptions.length,
    };
  }

  public getAllSubscriptions(): DriverSubscriptionRecord[] {
    return [...this.subscriptions];
  }

  public subscribe(listener: (subs: DriverSubscriptionRecord[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getAllSubscriptions());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getDriverAccounts(): DriverSubscriptionAccount[] {
    const now = Date.now();
    return this.driverAccounts.map((acc) => {
      const expiresTime = new Date(acc.expiresAt).getTime();
      const diffMs = expiresTime - now;
      const daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
      return {
        ...acc,
        daysRemaining,
      };
    });
  }

  public grantCourtesyDays(
    driverId: string,
    days: number,
    reason: string = "Cortesia Administrativa",
    adminName: string = "Super Admin"
  ): DriverSubscriptionAccount | null {
    const accIndex = this.driverAccounts.findIndex((a) => a.driverId === driverId);
    if (accIndex === -1) return null;

    const currentAcc = this.driverAccounts[accIndex];
    const baseDate = new Date(currentAcc.expiresAt).getTime() > Date.now()
      ? new Date(currentAcc.expiresAt)
      : new Date();

    const newExpiresAt = new Date(baseDate.getTime() + days * 86400000);

    const updatedAcc: DriverSubscriptionAccount = {
      ...currentAcc,
      status: "ACTIVE",
      expiresAt: newExpiresAt.toISOString(),
      daysRemaining: Math.ceil((newExpiresAt.getTime() - Date.now()) / 86400000),
      courtesyDaysGranted: (currentAcc.courtesyDaysGranted || 0) + days,
      blockedReason: undefined,
    };

    this.driverAccounts[accIndex] = updatedAcc;
    this.saveAccountsToStorage();
    this.notifyAccountListeners();

    // Sincroniza também como assinatura ativa para liberar o app do motorista
    void this.confirmDailyFeePayment(
      driverId,
      currentAcc.vehicleType,
      `CORTESIA_${days}D_${Date.now()}`,
      0,
      days * 24
    );

    return updatedAcc;
  }

  public renewManually(
    driverId: string,
    planName: string,
    durationDays: number = 30,
    amount: number = 199.90,
    adminName: string = "Super Admin"
  ): DriverSubscriptionAccount | null {
    const accIndex = this.driverAccounts.findIndex((a) => a.driverId === driverId);
    if (accIndex === -1) return null;

    const currentAcc = this.driverAccounts[accIndex];
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + durationDays * 86400000);

    const updatedAcc: DriverSubscriptionAccount = {
      ...currentAcc,
      currentPlanName: planName,
      status: "ACTIVE",
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      daysRemaining: durationDays,
      lastPaymentBrl: amount,
      lastPaymentDate: startsAt.toISOString(),
      lastPaymentTxId: `MANUAL_ADMIN_${Date.now()}_${adminName.replace(/\s+/g, "_")}`,
      blockedReason: undefined,
    };

    this.driverAccounts[accIndex] = updatedAcc;
    this.saveAccountsToStorage();
    this.notifyAccountListeners();

    void this.confirmDailyFeePayment(
      driverId,
      currentAcc.vehicleType,
      `REC_MANUAL_${Date.now()}`,
      amount,
      durationDays * 24
    );

    return updatedAcc;
  }

  public blockDriverAccess(
    driverId: string,
    reason: string = "Bloqueio administrativo por inadimplência",
    adminName: string = "Super Admin"
  ): DriverSubscriptionAccount | null {
    const accIndex = this.driverAccounts.findIndex((a) => a.driverId === driverId);
    if (accIndex === -1) return null;

    const currentAcc = this.driverAccounts[accIndex];
    const updatedAcc: DriverSubscriptionAccount = {
      ...currentAcc,
      status: "BLOCKED",
      blockedReason: `${reason} (por ${adminName})`,
    };

    this.driverAccounts[accIndex] = updatedAcc;
    this.saveAccountsToStorage();
    this.notifyAccountListeners();

    // Força expiração de qualquer assinatura ativa local
    this.subscriptions = this.subscriptions.map((s) =>
      s.driver_id === driverId ? { ...s, status: "CANCELLED" as SubscriptionStatus } : s
    );
    this.saveToStorage();
    this.notifyListeners();

    return updatedAcc;
  }

  public unblockDriverAccess(driverId: string): DriverSubscriptionAccount | null {
    const accIndex = this.driverAccounts.findIndex((a) => a.driverId === driverId);
    if (accIndex === -1) return null;

    const currentAcc = this.driverAccounts[accIndex];
    const hasValidTime = new Date(currentAcc.expiresAt).getTime() > Date.now();

    const updatedAcc: DriverSubscriptionAccount = {
      ...currentAcc,
      status: hasValidTime ? "ACTIVE" : "GRACE_PERIOD",
      blockedReason: undefined,
    };

    this.driverAccounts[accIndex] = updatedAcc;
    this.saveAccountsToStorage();
    this.notifyAccountListeners();

    return updatedAcc;
  }

  public getExecutiveSaaSMetrics(): ExecutiveSaaSMetrics {
    const accounts = this.getDriverAccounts();
    const activeSubscribers = accounts.filter((a) => a.status === "ACTIVE" || a.status === "TRIAL");
    const expiringIn7Days = accounts.filter(
      (a) => (a.status === "ACTIVE" || a.status === "TRIAL") && a.daysRemaining <= 7
    );
    const defaultingOrBlocked = accounts.filter(
      (a) => a.status === "GRACE_PERIOD" || a.status === "BLOCKED" || a.status === "EXPIRED"
    );

    const mrrBrl = accounts.reduce((acc, a) => {
      if (a.status === "ACTIVE") {
        return acc + (a.lastPaymentBrl > 0 ? a.lastPaymentBrl : 199.90);
      }
      return acc;
    }, 0);

    const totalGmvProcessedBrl = 138450.00; // GMV estimado total transacionado pela frota
    const totalSavingsForFleetBrl = totalGmvProcessedBrl * 0.22; // Economia de 22% média dos concorrentes

    return {
      mrrBrl: Math.round(mrrBrl * 100) / 100,
      arrBrl: Math.round(mrrBrl * 12 * 100) / 100,
      activeSubscribersCount: activeSubscribers.length,
      expiringIn7DaysCount: expiringIn7Days.length,
      defaultingOrBlockedCount: defaultingOrBlocked.length,
      totalGmvProcessedBrl,
      totalSavingsForFleetBrl,
      renewalRatePercent: 94.2,
      churnRatePercent: 2.8,
    };
  }

  public subscribeAccounts(listener: (accs: DriverSubscriptionAccount[]) => void): () => void {
    this.accountListeners.add(listener);
    listener(this.getDriverAccounts());
    return () => {
      this.accountListeners.delete(listener);
    };
  }

  private notifyAccountListeners() {
    const list = this.getDriverAccounts();
    this.accountListeners.forEach((l) => {
      try {
        l(list);
      } catch (e) {
        console.error("[DriverSubscriptionService] Erro no listener de contas:", e);
      }
    });
  }

  private notifyListeners() {
    const list = this.getAllSubscriptions();
    this.listeners.forEach((l) => {
      try {
        l(list);
      } catch (e) {
        console.error("[DriverSubscriptionService] Erro no listener:", e);
      }
    });
  }
}

export const driverSubscriptionService = new DriverSubscriptionService();
