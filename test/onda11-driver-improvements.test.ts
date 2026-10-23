/**
 * ==============================================================================
 * 🧪 SUÍTE DE TESTES: ONDA 11 — MELHORIAS DO APP DO MOTORISTA (REA 99 AUDIT)
 * ==============================================================================
 * Testa as duas inovações do APK 99 Motorista:
 * 1. Troco Digital no Acerto em Dinheiro (Digital Change Engine)
 * 2. Bloqueio Soberano de Passageiro Pós-Corrida (Mutual Blacklist Engine)
 * ==============================================================================
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { digitalChangeEngine } from "../src/lib/payment/digital-change-engine";
import { driverBlacklistEngine } from "../src/lib/driver/driver-blacklist-engine";
import { partiuWalletEngine } from "../src/lib/finance/partiu-wallet";
import { dispatchQueueBuilder } from "../src/services/DispatchQueueBuilder";
import { matchingEngine } from "../src/services/MatchingEngine";

describe("ONDA 11: Troco Digital no Acerto em Dinheiro (Padrão 99Pay)", () => {
  it("1.1 Deve calcular o troco com precisão para pagamento com nota superior", () => {
    const calc = digitalChangeEngine.calculateChange(22.0, 50.0);
    assert.equal(calc.isValid, true);
    assert.equal(calc.isExactPayment, false);
    assert.equal(calc.changeBrl, 28.0);
    assert.equal(calc.cashReceivedBrl, 50.0);
    assert.equal(calc.fareBrl, 22.0);
  });

  it("1.2 Deve identificar pagamento em valor exato (sem troco a devolver)", () => {
    const calc = digitalChangeEngine.calculateChange(18.5, 18.5);
    assert.equal(calc.isValid, true);
    assert.equal(calc.isExactPayment, true);
    assert.equal(calc.changeBrl, 0);
  });

  it("1.3 Deve reprovar valor em espécie inferior ao total da corrida", () => {
    const calc = digitalChangeEngine.calculateChange(35.0, 20.0);
    assert.equal(calc.isValid, false);
    assert.equal(calc.isExactPayment, false);
    assert.equal(calc.insufficientAmountBrl, 15.0);
    assert.match(calc.errorMessage || "", /Faltam R\$ 15,00/);
  });

  it("1.4 Deve rejeitar valores negativos ou nulos", () => {
    const calc = digitalChangeEngine.calculateChange(20.0, 0);
    assert.equal(calc.isValid, false);
  });

  it("1.5 Deve creditar o troco digital na carteira do passageiro com 0% de comissão retida", () => {
    digitalChangeEngine.resetForTesting();
    const testPassengerId = `pax-troco-test-${Date.now()}`;
    const testDriverId = "driver-troco-test-1";

    const initialWallet = partiuWalletEngine.getOrCreateWallet(testPassengerId, "PASSENGER");
    const initialBalance = initialWallet.balance;

    const depositResult = digitalChangeEngine.depositDigitalChange({
      rideId: "ride-troco-101",
      driverId: testDriverId,
      driverName: "Carlos Condutor",
      passengerId: testPassengerId,
      passengerName: "Juliana Passageira",
      changeBrl: 28.0,
    });

    assert.equal(depositResult.success, true);
    assert.equal(depositResult.changeBrl, 28.0);
    assert.equal(depositResult.newPassengerBalance, initialBalance + 28.0);
    assert.match(depositResult.receiptMessage, /R\$ 28,00 creditado com sucesso/);

    // Consulta extrato contábil da carteira
    const updatedWallet = partiuWalletEngine.getOrCreateWallet(testPassengerId, "PASSENGER");
    assert.equal(updatedWallet.balance, initialBalance + 28.0);

    // Idempotência: Repetir depósito para a mesma corrida não gera duplo crédito
    const repeatDeposit = digitalChangeEngine.depositDigitalChange({
      rideId: "ride-troco-101",
      driverId: testDriverId,
      driverName: "Carlos Condutor",
      passengerId: testPassengerId,
      passengerName: "Juliana Passageira",
      changeBrl: 28.0,
    });

    assert.equal(repeatDeposit.transactionId, depositResult.transactionId);
    assert.equal(updatedWallet.balance, initialBalance + 28.0);
  });
});

describe("ONDA 11: Bloqueio Soberano de Passageiro Pós-Corrida (Mutual Blacklist)", () => {
  it("2.1 Deve registrar o bloqueio soberano de passageiro pelo motorista", () => {
    driverBlacklistEngine.resetForTesting();
    const driverId = "driver-alpha";
    const passengerId = "pax-troublesome";

    assert.equal(driverBlacklistEngine.isPassengerBlockedByDriver(driverId, passengerId), false);

    driverBlacklistEngine.blockPassenger({
      driverId,
      passengerId,
      passengerName: "Passageiro Problemático",
      rideId: "ride-bad-001",
      reasonCode: "INAPPROPRIATE_BEHAVIOR",
      reasonDetails: "Comportamento desrespeitoso durante o trajeto",
      blockedAt: Date.now(),
    });

    assert.equal(driverBlacklistEngine.isPassengerBlockedByDriver(driverId, passengerId), true);
    assert.equal(driverBlacklistEngine.isMutualBlocked(driverId, passengerId), true);

    const list = driverBlacklistEngine.listBlockedPassengers(driverId);
    assert.equal(list.length, 1);
    assert.equal(list[0].reasonCode, "INAPPROPRIATE_BEHAVIOR");
  });

  it("2.2 Deve suportar o bloqueio mútuo iniciado pelo passageiro", () => {
    const driverId = "driver-beta";
    const passengerId = "pax-secure";

    assert.equal(driverBlacklistEngine.isDriverBlockedByPassenger(passengerId, driverId), false);

    driverBlacklistEngine.blockDriverByPassenger({
      passengerId,
      driverId,
      driverName: "Motorista Imprudente",
      rideId: "ride-speeding-002",
      reason: "Excesso de velocidade",
      blockedAt: Date.now(),
    });

    assert.equal(driverBlacklistEngine.isDriverBlockedByPassenger(passengerId, driverId), true);
    assert.equal(driverBlacklistEngine.isMutualBlocked(driverId, passengerId), true);
  });

  it("2.3 Deve listar motoristas excluídos para um passageiro específico", () => {
    const passengerId = "pax-targeted";
    const driver1 = "driver-blocker-1";
    const driver2 = "driver-blocker-2";

    driverBlacklistEngine.blockPassenger({
      driverId: driver1,
      passengerId,
      reasonCode: "PAYMENT_ISSUE",
      blockedAt: Date.now(),
    });

    driverBlacklistEngine.blockDriverByPassenger({
      passengerId,
      driverId: driver2,
      blockedAt: Date.now(),
    });

    const excludedDrivers = driverBlacklistEngine.getBlockedDriverIdsForPassenger(passengerId);
    assert.ok(excludedDrivers.includes(driver1));
    assert.ok(excludedDrivers.includes(driver2));
  });

  it("2.4 Deve permitir o desbloqueio manual", () => {
    const driverId = "driver-gamma";
    const passengerId = "pax-forgiven";

    driverBlacklistEngine.blockPassenger({
      driverId,
      passengerId,
      reasonCode: "OTHER",
      blockedAt: Date.now(),
    });

    assert.equal(driverBlacklistEngine.isPassengerBlockedByDriver(driverId, passengerId), true);

    driverBlacklistEngine.unblockPassenger(driverId, passengerId);
    assert.equal(driverBlacklistEngine.isPassengerBlockedByDriver(driverId, passengerId), false);
  });

  it("2.5 Deve suprimir motoristas bloqueados no DispatchQueueBuilder em cascata", async () => {
    const passengerId = "pax-cascade-test";
    const blockedDriverId = "test-driver-1";

    driverBlacklistEngine.blockPassenger({
      driverId: blockedDriverId,
      passengerId,
      reasonCode: "SECURITY_RISK",
      blockedAt: Date.now(),
    });

    // Inicia cascata com riderId informado
    const session = await dispatchQueueBuilder.startCascadeDispatch({
      rideId: "ride-cascade-blacklist-101",
      category: "PARTIU_CARRO",
      pickupCoords: [-46.65, -23.55],
      destinationCoords: [-46.66, -23.56],
      fareBrl: 25.0,
      riderId: passengerId,
    });

    // Garante que o motorista bloqueado foi excluído dos candidatos
    const candidateIds = session.candidates.map((c) => c.driverId);
    assert.ok(
      !candidateIds.includes(blockedDriverId),
      `O motorista bloqueado ${blockedDriverId} não pode estar na lista de candidatos`,
    );

    dispatchQueueBuilder.cancelCascade("ride-cascade-blacklist-101");
  });
});
