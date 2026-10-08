import { useState, useEffect, useCallback } from "react";
import {
  driverSubscriptionService,
  type DriverSubscriptionRecord,
  type GeneratedPixPayment,
} from "@/lib/ecosystem/driver-subscription-service";
import { getMonetizacaoConfig } from "@/lib/superadmin-config";
import { toast } from "sonner";

export interface UseDriverDailyPassReturn {
  subscription: DriverSubscriptionRecord | null;
  isActive: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  minutesRemaining: number;
  diariaCountdownTexto: string;
  dailyFeeAmount: number;
  renovarComSaldo: (
    saldoDisponivel: number,
    onDeduzirSaldo: (valor: number) => void
  ) => Promise<boolean>;
  gerarPixRenovacao: (ciclo?: "DAILY" | "WEEKLY" | "MONTHLY") => GeneratedPixPayment;
  recarregarStatus: () => void;
}

export function useDriverDailyPass(
  driverId: string,
  vehicleType: "CARRO" | "MOTO" = "CARRO"
): UseDriverDailyPassReturn {
  const [subscription, setSubscription] = useState<DriverSubscriptionRecord | null>(() => {
    return driverSubscriptionService.getSubscription(driverId) || null;
  });

  const [diariaCountdownTexto, setDiariaCountdownTexto] = useState<string>("");
  const [minutesRemaining, setMinutesRemaining] = useState<number>(0);
  const [isExpiringSoon, setIsExpiringSoon] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(() => {
    return driverSubscriptionService.isDriverUnlocked(driverId);
  });
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const monetizacao = getMonetizacaoConfig();
  const dailyFeeAmount = vehicleType === "MOTO" ? monetizacao.diariaMoto : monetizacao.diariaCarro;

  const atualizarStatus = useCallback(() => {
    if (!driverId) return;

    const sub = driverSubscriptionService.getSubscription(driverId);
    setSubscription(sub || null);

    if (!sub || sub.status !== "ACTIVE") {
      setDiariaCountdownTexto("");
      setMinutesRemaining(0);
      setIsActive(false);
      setIsExpired(true);
      setIsExpiringSoon(false);
      return;
    }

    const expiresTime = new Date(sub.expires_at).getTime();
    const now = Date.now();
    const diffMs = expiresTime - now;

    if (diffMs <= 0) {
      setDiariaCountdownTexto("");
      setMinutesRemaining(0);
      setIsActive(false);
      setIsExpired(true);
      setIsExpiringSoon(false);
      return;
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    setMinutesRemaining(totalMinutes);
    setIsActive(true);
    setIsExpired(false);
    setIsExpiringSoon(totalMinutes <= 60);

    if (hours > 0) {
      setDiariaCountdownTexto(`${hours}h ${mins.toString().padStart(2, "0")}m`);
    } else {
      setDiariaCountdownTexto(`${mins}m`);
    }
  }, [driverId]);

  useEffect(() => {
    atualizarStatus();
    const interval = setInterval(atualizarStatus, 20000);

    const handleSubUpdated = () => atualizarStatus();
    window.addEventListener("partiu:driver_subscription_activated", handleSubUpdated);
    window.addEventListener("partiu:monetizacao-atualizada", handleSubUpdated);

    const unsub = driverSubscriptionService.subscribe(() => {
      atualizarStatus();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("partiu:driver_subscription_activated", handleSubUpdated);
      window.removeEventListener("partiu:monetizacao-atualizada", handleSubUpdated);
      unsub();
    };
  }, [atualizarStatus]);

  /**
   * Renovação em 1 Toque com débito direto dos ganhos de hoje (SaaS Zero-Atrito)
   */
  const renovarComSaldo = useCallback(
    async (
      saldoDisponivel: number,
      onDeduzirSaldo: (valor: number) => void
    ): Promise<boolean> => {
      if (saldoDisponivel < dailyFeeAmount) {
        toast.error("Saldo insuficiente hoje", {
          description: `Você tem R$ ${saldoDisponivel.toFixed(2)} e a diária custa R$ ${dailyFeeAmount.toFixed(2)}. Utilize a chave Pix para renovar.`,
        });
        return false;
      }

      try {
        const txId = `SALDO_AUTO_${Date.now()}_${driverId.slice(-4)}`;
        await driverSubscriptionService.confirmDailyFeePayment(
          driverId,
          vehicleType,
          txId,
          dailyFeeAmount,
          24
        );

        onDeduzirSaldo(dailyFeeAmount);
        atualizarStatus();

        toast.success("Diária renovada com sucesso!", {
          description: `R$ ${dailyFeeAmount.toFixed(2)} debitados do saldo. +24 horas liberadas no Trip Radar com 0% taxa!`,
        });
        return true;
      } catch (err) {
        toast.error("Não foi possível renovar com saldo.");
        return false;
      }
    },
    [dailyFeeAmount, driverId, vehicleType, atualizarStatus]
  );

  const gerarPixRenovacao = useCallback(
    (ciclo: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY"): GeneratedPixPayment => {
      return driverSubscriptionService.generateDailyFeePix(driverId, vehicleType, ciclo);
    },
    [driverId, vehicleType]
  );

  return {
    subscription,
    isActive,
    isExpired,
    isExpiringSoon,
    minutesRemaining,
    diariaCountdownTexto,
    dailyFeeAmount,
    renovarComSaldo,
    gerarPixRenovacao,
    recarregarStatus: atualizarStatus,
  };
}
