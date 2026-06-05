import { beforeEach, describe, expect, it } from "vitest";
import { deleteEntity } from "../erpService.js";
import { createRecord, getDatabaseSnapshot, resetLocalDatabase } from "../local/localDatabase.js";

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("reference integrity", () => {
  it("blocks deletion of a machine linked to operational records", async () => {
    const snapshot = getDatabaseSnapshot();
    const linkedMachine = snapshot.machines.find((machine) =>
      snapshot.clients.some((client) => client.machineId === machine.id)
    );

    await expect(deleteEntity("machines", linkedMachine.id)).rejects.toThrow(/existem vinculos ativos/i);
  });

  it("allows deletion when the record has no active references", async () => {
    const machine = await createRecord("machines", {
      amperage: 10,
      category: "Expresso",
      hydraulic: "Nao",
      minStock: 0,
      name: "Maquina Sem Vinculo",
      priceRent: 0,
      priceSale: 1,
      status: "ativo",
      stock: 1,
      voltage: "Bivolt",
    });

    await expect(deleteEntity("machines", machine.id)).resolves.toMatchObject({
      id: machine.id,
    });
  });
});
