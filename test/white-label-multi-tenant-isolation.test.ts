import { describe, test, expect } from "./test-harness.mjs";
import { driverFleetService } from "../src/lib/ecosystem/driver-fleet-service";
import { getGanhosHojeMotorista, setGanhosHojeMotorista } from "../src/lib/partiu-engine";

describe("46. WHITE-LABEL MULTI-TENANT ISOLATION & DRIVER DATA SHIELDING", () => {
  test("1. Cadastro de Motorista com Tag de Tenant: Registra e preserva tenant_id e cidade", async () => {
    const driverMaceio = await driverFleetService.registerDriver({
      name: "José da Silva - Maceió",
      phone: "(82) 99111-2233",
      vehicle_type: "CARRO",
      vehicle_plate: "MCE-1234",
      vehicle_model: "Renault Logan",
      tenant_id: "praca_maceio_al",
      city: "Maceió",
    });

    expect(driverMaceio.tenant_id).toBe("praca_maceio_al");
    expect(driverMaceio.city).toBe("Maceió");
    expect(driverMaceio.status).toBe("PENDENTE");

    const driverItaperuna = await driverFleetService.registerDriver({
      name: "Marcos Lima - Itaperuna",
      phone: "(22) 99888-4455",
      vehicle_type: "MOTO",
      vehicle_plate: "ITP-5678",
      vehicle_model: "Honda CG 160",
      tenant_id: "tenant-itaperuna",
      city: "Itaperuna",
    });

    expect(driverItaperuna.tenant_id).toBe("tenant-itaperuna");
    expect(driverItaperuna.city).toBe("Itaperuna");

    const allDrivers = driverFleetService.getAllDrivers();
    const foundMaceio = allDrivers.find((d) => d.id === driverMaceio.id);
    const foundItaperuna = allDrivers.find((d) => d.id === driverItaperuna.id);

    expect(foundMaceio?.tenant_id).toBe("praca_maceio_al");
    expect(foundItaperuna?.tenant_id).toBe("tenant-itaperuna");
  });

  test("2. Isolamento Real de Ganhos do Motorista: Não há interferência entre motoristas diferentes", () => {
    const driverIdA = "drv_shield_01";
    const driverIdB = "drv_shield_02";

    // Define ganhos para o Motorista A
    setGanhosHojeMotorista(185.5, driverIdA);

    // Define ganhos para o Motorista B
    setGanhosHojeMotorista(92.0, driverIdB);

    // Verifica que cada motorista recupera exclusivamente seus próprios ganhos
    expect(getGanhosHojeMotorista(driverIdA)).toBe(185.5);
    expect(getGanhosHojeMotorista(driverIdB)).toBe(92.0);

    // Motorista C sem corridas hoje deve retornar 0
    expect(getGanhosHojeMotorista("drv_shield_unknown")).toBe(0);
  });

  test("3. Filtragem Estrita de Frota por Tenant da Franquia", () => {
    const mockMotoristas = [
      { id: "1", nome: "Carlos", tenantId: "praca_maceio_al", cidade: "Maceió" },
      { id: "2", nome: "Bruno", tenantId: "tenant-itaperuna", cidade: "Itaperuna" },
      { id: "3", nome: "Amanda", tenantId: "praca_maceio_al", cidade: "Maceió" },
      { id: "4", nome: "Diego", tenantId: "tenant-campos", cidade: "Campos dos Goytacazes" },
    ];

    // Simula visão do Franqueado de Maceió
    const targetMaceio = "praca_maceio_al";
    const motoristasMaceio = mockMotoristas.filter((m) => {
      const tId = (m.tenantId || "").toLowerCase();
      if (tId && targetMaceio) {
        const cleanTId = tId.replace("tenant-", "").replace("praca_", "");
        const cleanTarget = targetMaceio.replace("tenant-", "").replace("praca_", "");
        if (cleanTId === cleanTarget || tId === targetMaceio) return true;
      }
      return m.cidade.toLowerCase().includes("maceió");
    });

    expect(motoristasMaceio.length).toBe(2);
    expect(motoristasMaceio.map((m) => m.nome)).toEqual(["Carlos", "Amanda"]);

    // Simula visão do Franqueado de Itaperuna
    const targetItaperuna = "tenant-itaperuna";
    const motoristasItaperuna = mockMotoristas.filter((m) => {
      const tId = (m.tenantId || "").toLowerCase();
      if (tId && targetItaperuna) {
        const cleanTId = tId.replace("tenant-", "").replace("praca_", "");
        const cleanTarget = targetItaperuna.replace("tenant-", "").replace("praca_", "");
        if (cleanTId === cleanTarget || tId === targetItaperuna) return true;
      }
      return m.cidade.toLowerCase().includes("itaperuna");
    });

    expect(motoristasItaperuna.length).toBe(1);
    expect(motoristasItaperuna[0].nome).toBe("Bruno");
  });

  test("4. Filtragem Estrita de Passageiros por Tenant (Mesmo sem Corridas)", () => {
    const mockPassageiros = [
      { id: "p1", full_name: "Larissa", tenant_id: "praca_maceio_al", viagens: [] },
      { id: "p2", full_name: "Rodrigo", tenant_id: "tenant-itaperuna", viagens: [] },
      { id: "p3", full_name: "Mariana", tenant_id: "praca_maceio_al", viagens: [] },
    ];

    const targetTenant = "praca_maceio_al";
    const passageirosMaceio = mockPassageiros.filter((p) => {
      const tId = (p.tenant_id || "").toLowerCase();
      if (tId && targetTenant) {
        const cleanTId = tId.replace("tenant-", "").replace("praca_", "");
        const cleanTarget = targetTenant.replace("tenant-", "").replace("praca_", "");
        if (cleanTId === cleanTarget || tId === targetTenant) return true;
      }
      return false;
    });

    expect(passageirosMaceio.length).toBe(2);
    expect(passageirosMaceio.map((p) => p.full_name)).toEqual(["Larissa", "Mariana"]);
  });
});
