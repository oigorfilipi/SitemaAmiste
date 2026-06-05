import { beforeEach, describe, expect, it } from "vitest";
import { createEntity, deleteEntity, updateEntity } from "../erpService.js";
import { finalizeChecklist } from "../checklistService.js";
import { getDatabaseSnapshot, resetLocalDatabase } from "../local/localDatabase.js";

function buildSaleOriginVariants(saleId) {
  const numericSuffix = String(saleId || "").match(/(\d+)$/)?.[1];

  return [
    numericSuffix ? `Venda #${numericSuffix}` : "",
    `Venda ${String(saleId || "").slice(-5).toUpperCase()}`,
  ].filter(Boolean);
}

function findReceivableByOrigin(origin) {
  return getDatabaseSnapshot().receivables.find((receivable) => receivable.origin === origin);
}

function findReceivableBySaleId(saleId) {
  const origins = buildSaleOriginVariants(saleId);

  return getDatabaseSnapshot().receivables.find((receivable) => origins.includes(receivable.origin));
}

function buildCompatibleChecklist(machine, client) {
  return {
    accessories: {},
    clientId: client.id,
    code: "#TESTE-ERP",
    date: "2026-06-05",
    localSewerOk: machine.sewer === "Sim" ? "Sim" : "Nao",
    localWaterOk: machine.hydraulic === "Sim" ? "Sim" : "Nao",
    machineId: machine.id,
    notes: "Teste automatizado",
    outletAmperage: Number(machine.amperage || 20),
    quantity: 1,
    serviceType: "Instalacao",
    status: "rascunho",
    supplies: {},
    technician: "Teste",
    value: 100,
    waterOk: machine.hydraulic === "Sim" ? "Sim" : "Nao",
  };
}

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("erpService sales synchronization", () => {
  it("reconciles stock and receivable when a sale is created, edited and deleted", async () => {
    const snapshot = getDatabaseSnapshot();
    const product = snapshot.supplies.find((item) => Number(item.stock || 0) >= 5);
    const client = snapshot.clients[0];
    const stockBefore = Number(product.stock || 0);

    const sale = await createEntity("sales", {
      clientId: client.id,
      date: "2026-06-05",
      generateCharge: true,
      inventoryItem: `supplies:${product.id}`,
      paymentStatus: "pendente",
      quantity: 2,
      unitValue: Number(product.price || 10),
    });

    expect(getDatabaseSnapshot().supplies.find((item) => item.id === product.id).stock).toBe(stockBefore - 2);
    expect(findReceivableBySaleId(sale.id)).toMatchObject({
      clientId: client.id,
      status: "pendente",
      value: sale.totalValue,
    });

    const updatedSale = await updateEntity("sales", sale.id, { quantity: 3 });

    expect(updatedSale.totalValue).toBe(Number(product.price || 10) * 3);
    expect(getDatabaseSnapshot().supplies.find((item) => item.id === product.id).stock).toBe(stockBefore - 3);
    expect(findReceivableBySaleId(sale.id)).toMatchObject({
      value: updatedSale.totalValue,
    });

    await deleteEntity("sales", sale.id);

    expect(getDatabaseSnapshot().supplies.find((item) => item.id === product.id).stock).toBe(stockBefore);
    expect(findReceivableBySaleId(sale.id)).toBeUndefined();
  });
});

describe("erpService checklist synchronization", () => {
  it("finalizes a checklist once without duplicating stock or receivables", async () => {
    const snapshot = getDatabaseSnapshot();
    const machine = snapshot.machines.find((item) => Number(item.stock || 0) > 1);
    const client = snapshot.clients.find((item) => item.machineId === machine.id) || snapshot.clients[0];
    const stockBefore = Number(machine.stock || 0);
    const checklist = await createEntity("checklists", buildCompatibleChecklist(machine, client));

    const finalized = await finalizeChecklist(checklist, getDatabaseSnapshot());
    const stockAfterFirstFinalize = getDatabaseSnapshot().machines.find((item) => item.id === machine.id).stock;

    await finalizeChecklist(finalized, getDatabaseSnapshot());

    expect(stockAfterFirstFinalize).toBe(stockBefore - 1);
    expect(getDatabaseSnapshot().machines.find((item) => item.id === machine.id).stock).toBe(stockAfterFirstFinalize);
    expect(findReceivableByOrigin(`Checklist ${checklist.code}`)).toMatchObject({
      clientId: client.id,
      status: "pendente",
      value: checklist.value,
    });
  });
});
