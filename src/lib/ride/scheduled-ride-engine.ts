/**
 * ==============================================================================
 * 📅 PARTIU SCHEDULED RIDES & NIGHT CHECK-IN ENGINE (v1.0)
 * ==============================================================================
 * Gerencia o ciclo de vida completo de corridas agendadas com garantia de
 * embarque. Implementa o protocolo de Check-in Noturno (20h às 22h30 na véspera)
 * para viagens matinais de alto valor (rodoviárias, hospitais e aeroportos).
 * Se o motorista não confirmar, aciona realocação automática para a frota de
 * plantão antes do passageiro acordar.
 * ==============================================================================
 */

export type ScheduledRideStatus =
  | "SCHEDULED_SEARCHING"       // Aguardando motorista reservar
  | "DRIVER_CONFIRMED"          // Motorista reservou a corrida
  | "NIGHT_CHECKIN_PENDING"     // Janela noturna aberta (20:00 - 22:30), aguardando confirmação
  | "NIGHT_CHECKIN_CONFIRMED"   // Motorista confirmou o check-in noturno (100% Garantida)
  | "REALLOCATING"              // Perdeu check-in noturno -> realocando para frota de plantão
  | "DISPATCHED"                // Viagem convertida em despacho ao vivo
  | "COMPLETED"                 // Viagem concluída com sucesso
  | "CANCELLED";                // Cancelada por solicitação ou inviabilidade

export interface ScheduledRide {
  id: string;
  tenantId: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  pickupAddress: string;
  pickupCoords: { lat: number; lng: number };
  destinationAddress: string;
  destinationCoords: { lat: number; lng: number };
  scheduledFor: string; // ISO String (ex: 2026-10-21T05:30:00.000Z)
  category: string;
  estimatedFareCents: number;
  status: ScheduledRideStatus;
  assignedDriverId?: string;
  assignedDriverName?: string;
  assignedDriverVehicle?: string;
  assignedDriverPhone?: string;
  nightCheckinAt?: string;
  nightCheckinDeadline: string; // ISO String (ex: 2026-10-20T22:30:00.000Z)
  notes?: string;
  createdAt: string;
}

export interface CreateScheduledRideInput {
  tenantId?: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  pickupAddress: string;
  pickupCoords: { lat: number; lng: number };
  destinationAddress: string;
  destinationCoords: { lat: number; lng: number };
  scheduledFor: string;
  category: string;
  estimatedFareCents: number;
  notes?: string;
}

const STORAGE_KEY_SCHEDULED_RIDES = "partiu_scheduled_rides_store";

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

export class ScheduledRideEngine {
  private static instance: ScheduledRideEngine;
  private rides: Map<string, ScheduledRide> = new Map();

  private constructor() {
    this.restoreCache();
    this.seedSampleRidesIfEmpty();
  }

  public static getInstance(): ScheduledRideEngine {
    if (!ScheduledRideEngine.instance) {
      ScheduledRideEngine.instance = new ScheduledRideEngine();
    }
    return ScheduledRideEngine.instance;
  }

  private restoreCache(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SCHEDULED_RIDES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((ride: ScheduledRide) => {
            this.rides.set(ride.id, ride);
          });
        }
      }
    } catch {
      // Fallback
    }
  }

  private persistCache(): void {
    if (typeof window === "undefined") return;
    try {
      const arr = Array.from(this.rides.values());
      localStorage.setItem(STORAGE_KEY_SCHEDULED_RIDES, JSON.stringify(arr));
      window.dispatchEvent(new CustomEvent("partiu:scheduled-rides-updated"));
    } catch {
      // Fallback
    }
  }

  /**
   * Inicializa dados de demonstração para testes caso a base esteja vazia
   */
  private seedSampleRidesIfEmpty(): void {
    if (this.rides.size > 0) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(5, 30, 0, 0);

    const checkinDeadline = new Date();
    checkinDeadline.setHours(22, 30, 0, 0);

    const sampleRide: ScheduledRide = {
      id: "sched_demo_01",
      tenantId: "default",
      passengerId: "usr_marcos_01",
      passengerName: "Marcos Vinícius",
      passengerPhone: "(22) 99887-1122",
      pickupAddress: "Av. Cardoso Moreira, 450 - Centro",
      pickupCoords: { lat: -21.205, lng: -41.89 },
      destinationAddress: "Terminal Rodoviário de Itaperuna - BR-356",
      destinationCoords: { lat: -21.218, lng: -41.882 },
      scheduledFor: tomorrow.toISOString(),
      category: "Carro",
      estimatedFareCents: 3800, // R$ 38,00
      status: "SCHEDULED_SEARCHING",
      nightCheckinDeadline: checkinDeadline.toISOString(),
      notes: "Viagem com 2 malas grandes. Pontualidade essencial para embarque no ônibus das 06:15.",
      createdAt: new Date().toISOString(),
    };

    this.rides.set(sampleRide.id, sampleRide);
    this.persistCache();
  }

  /**
   * Cria um novo agendamento de corrida pelo passageiro
   */
  public createScheduledRide(input: CreateScheduledRideInput): ScheduledRide {
    const scheduledDate = new Date(input.scheduledFor);

    // Calcula prazo de check-in noturno: 22:30 da véspera da viagem
    const deadline = new Date(scheduledDate);
    deadline.setDate(deadline.getDate() - 1);
    deadline.setHours(22, 30, 0, 0);

    const ride: ScheduledRide = {
      id: `sched_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tenantId: input.tenantId || "default",
      passengerId: input.passengerId,
      passengerName: input.passengerName,
      passengerPhone: input.passengerPhone,
      pickupAddress: input.pickupAddress,
      pickupCoords: input.pickupCoords,
      destinationAddress: input.destinationAddress,
      destinationCoords: input.destinationCoords,
      scheduledFor: input.scheduledFor,
      category: input.category,
      estimatedFareCents: input.estimatedFareCents,
      status: "SCHEDULED_SEARCHING",
      nightCheckinDeadline: deadline.toISOString(),
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    this.rides.set(ride.id, ride);
    this.persistCache();
    return ride;
  }

  /**
   * Retorna todas as corridas agendadas de um passageiro
   */
  public getPassengerRides(passengerId: string): ScheduledRide[] {
    return Array.from(this.rides.values())
      .filter((r) => r.passengerId === passengerId && r.status !== "CANCELLED")
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  /**
   * Retorna as corridas agendadas disponíveis para reserva por motoristas próximos
   */
  public getAvailableRidesForDrivers(
    driverCoords: { lat: number; lng: number },
    maxDistanceKm: number = 25,
  ): ScheduledRide[] {
    return Array.from(this.rides.values())
      .filter((r) => r.status === "SCHEDULED_SEARCHING" || r.status === "REALLOCATING")
      .filter((r) => {
        const dist = haversineDistanceKm(
          driverCoords.lat,
          driverCoords.lng,
          r.pickupCoords.lat,
          r.pickupCoords.lng,
        );
        return dist <= maxDistanceKm;
      })
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  /**
   * Retorna corridas agendadas reservadas por um motorista específico
   */
  public getDriverClaimedRides(driverId: string): ScheduledRide[] {
    return Array.from(this.rides.values())
      .filter((r) => r.assignedDriverId === driverId && r.status !== "CANCELLED")
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  /**
   * Motorista reserva com antecedência uma viagem agendada
   */
  public claimScheduledRide(
    rideId: string,
    driverId: string,
    driverName: string,
    vehicleInfo: string,
    phone: string,
  ): { success: boolean; message?: string; ride?: ScheduledRide } {
    const ride = this.rides.get(rideId);
    if (!ride) {
      return { success: false, message: "Agendamento não encontrado." };
    }

    if (ride.status !== "SCHEDULED_SEARCHING" && ride.status !== "REALLOCATING") {
      return { success: false, message: "Esta corrida já foi reservada por outro condutor." };
    }

    ride.assignedDriverId = driverId;
    ride.assignedDriverName = driverName;
    ride.assignedDriverVehicle = vehicleInfo;
    ride.assignedDriverPhone = phone;
    ride.status = "DRIVER_CONFIRMED";

    this.rides.set(ride.id, ride);
    this.persistCache();

    return { success: true, ride };
  }

  /**
   * Avalia se a corrida está na janela de check-in noturno
   * A janela é das 20h00 até 22h30 na véspera de uma viagem matinal (ou se faltar menos de 10h)
   */
  public isNightCheckinWindow(ride: ScheduledRide, now: Date = new Date()): boolean {
    const tripTime = new Date(ride.scheduledFor).getTime();
    const nowTime = now.getTime();
    const hoursUntilTrip = (tripTime - nowTime) / (1000 * 60 * 60);

    // Janela ativa se a viagem for nas próximas 12 horas ou entre as 20h e o prazo limite
    const currentHour = now.getHours();
    const isEvening = currentHour >= 20 && currentHour <= 23;

    return (isEvening && hoursUntilTrip <= 16 && hoursUntilTrip >= 4) || (hoursUntilTrip > 0 && hoursUntilTrip <= 10);
  }

  /**
   * Motorista confirma o check-in noturno de garantia
   */
  public performNightCheckin(
    rideId: string,
    driverId: string,
  ): { success: boolean; message?: string; ride?: ScheduledRide } {
    const ride = this.rides.get(rideId);
    if (!ride) {
      return { success: false, message: "Agendamento não encontrado." };
    }

    if (ride.assignedDriverId !== driverId) {
      return { success: false, message: "Apenas o condutor escalado pode realizar o check-in." };
    }

    ride.nightCheckinAt = new Date().toISOString();
    ride.status = "NIGHT_CHECKIN_CONFIRMED";

    this.rides.set(ride.id, ride);
    this.persistCache();

    return { success: true, ride };
  }

  /**
   * Reatribui corridas cujo motorista perdeu o prazo de check-in noturno
   */
  public reallocateOverdueCheckins(now: Date = new Date()): ScheduledRide[] {
    const reallocated: ScheduledRide[] = [];
    const nowTime = now.getTime();

    this.rides.forEach((ride) => {
      if (ride.status === "DRIVER_CONFIRMED") {
        const deadline = new Date(ride.nightCheckinDeadline).getTime();
        const tripTime = new Date(ride.scheduledFor).getTime();
        const hoursUntilTrip = (tripTime - nowTime) / (1000 * 60 * 60);

        // Se passou do prazo de 22:30 ou faltam menos de 6 horas sem check-in realizado
        if ((nowTime > deadline || hoursUntilTrip < 6) && !ride.nightCheckinAt) {
          ride.status = "REALLOCATING";
          ride.assignedDriverId = undefined;
          ride.assignedDriverName = undefined;
          ride.assignedDriverVehicle = undefined;
          reallocated.push(ride);
        }
      }
    });

    if (reallocated.length > 0) {
      this.persistCache();
    }

    return reallocated;
  }

  /**
   * Cancela uma corrida agendada
   */
  public cancelScheduledRide(rideId: string, reason: string): boolean {
    const ride = this.rides.get(rideId);
    if (!ride) return false;

    ride.status = "CANCELLED";
    ride.notes = `${ride.notes ? ride.notes + " | " : ""}Cancelamento: ${reason}`;

    this.rides.set(ride.id, ride);
    this.persistCache();
    return true;
  }

  /**
   * Retorna todas as corridas agendadas para a central administrativa
   */
  public getAllScheduledRides(): ScheduledRide[] {
    return Array.from(this.rides.values()).sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
    );
  }
}

export const scheduledRideEngine = ScheduledRideEngine.getInstance();
