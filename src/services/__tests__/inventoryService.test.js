import { beforeEach, describe, expect, it, vi } from "vitest";

const erpMocks = vi.hoisted(() => ({
  createEntity: vi.fn(),
  deleteEntity: vi.fn(),
  listEntity: vi.fn(),
  replaceEntityCollection: vi.fn(),
  updateEntity: vi.fn(),
}));

vi.mock("../erpService.js", () => erpMocks);

import {
  buildPhysicalInventoryRows,
  buildRealtimeInventoryRows,
  createImportedInventoryItems,
  mergeImportedCountRows,
  saveInventoryAuditCount,
} from "../inventoryService.js";

beforeEach(() => {
  vi.clearAllMocks();
  erpMocks.createEntity.mockImplementation(async (_collectionName, payload) => ({
    id: "inventoryCounts_1",
    ...payload,
  }));
  erpMocks.listEntity.mockResolvedValue([]);
  erpMocks.replaceEntityCollection.mockImplementation(async (_collectionName, records) => records);
});

describe("inventoryService", () => {
  it("cadastra itens importados em lote sem duplicar nomes existentes", async () => {
    erpMocks.listEntity.mockResolvedValue([
      { id: "supply_1", name: "Cafe", stock: 2 },
    ]);

    const result = await createImportedInventoryItems({
      groupId: "supplies",
      importedRows: [
        { name: "Café", quantity: 10 },
        { name: "Chocolate", quantity: 5 },
        { name: "Chocolate", quantity: 5 },
      ],
    });

    expect(result.createdRecords).toHaveLength(1);
    expect(result.createdRecords[0]).toMatchObject({
      name: "Chocolate",
      stock: 0,
    });
    expect(erpMocks.replaceEntityCollection).toHaveBeenCalledTimes(1);
    expect(erpMocks.replaceEntityCollection.mock.calls[0][1]).toHaveLength(2);
    expect(erpMocks.replaceEntityCollection.mock.calls[0][1].map((record) => record.name)).toEqual([
      "Cafe",
      "Chocolate",
    ]);
  });

  it("reordena cadastros existentes e novos conforme um arquivo misto", async () => {
    erpMocks.listEntity.mockResolvedValue([
      { id: "supply_1", name: "Cafe", stock: 2 },
      { id: "supply_2", name: "Acucar", stock: 4 },
    ]);

    const result = await createImportedInventoryItems({
      groupId: "supplies",
      importedRows: [
        { name: "Chocolate", quantity: 5 },
        { name: "Acucar", quantity: 4 },
        { name: "Cafe", quantity: 2 },
      ],
    });

    expect(result.records.map((record) => record.name)).toEqual([
      "Chocolate",
      "Acucar",
      "Cafe",
    ]);
    expect(result.records.map((record) => record.inventoryOrder)).toEqual([0, 1, 2]);
  });

  it("preserva a ordem do arquivo ao preencher itens ja cadastrados", () => {
    const snapshot = {
      inventoryCounts: [],
      supplies: [
        { id: "supply_1", name: "Cafe" },
        { id: "supply_2", name: "Chocolate" },
        { id: "supply_3", name: "Acucar" },
      ],
    };
    const currentRows = [
      { itemId: "supply_1", itemName: "Cafe", quantity: "" },
      { itemId: "supply_2", itemName: "Chocolate", quantity: "" },
      { itemId: "supply_3", itemName: "Acucar", quantity: "" },
    ];

    const result = mergeImportedCountRows({
      currentRows,
      groupId: "supplies",
      importedRows: [
        { name: "Acucar", quantity: 3 },
        { name: "Cafe", quantity: 8 },
        { name: "Chocolate", quantity: 5 },
      ],
      snapshot,
    });

    expect(result.rows.map((row) => row.itemName)).toEqual([
      "Acucar",
      "Cafe",
      "Chocolate",
    ]);
  });

  it("usa a ordem da ultima contagem nas duas listas de estoque", () => {
    const snapshot = {
      inventoryCounts: [
        {
          countedAt: "2026-06-25T12:00:00.000Z",
          groupId: "supplies",
          items: [
            { itemId: "supply_3", itemName: "Acucar", quantity: 3 },
            { itemId: "supply_1", itemName: "Cafe", quantity: 8 },
            { itemId: "supply_2", itemName: "Chocolate", quantity: 5 },
          ],
          status: "finalizado",
        },
      ],
      supplies: [
        { id: "supply_2", minStock: 1, name: "Chocolate", stock: 5 },
        { id: "supply_1", minStock: 1, name: "Cafe", stock: 8 },
        { id: "supply_3", minStock: 1, name: "Acucar", stock: 3 },
      ],
    };

    expect(buildPhysicalInventoryRows(snapshot, "supplies").map((row) => row.name)).toEqual([
      "Acucar",
      "Cafe",
      "Chocolate",
    ]);
    expect(buildRealtimeInventoryRows(snapshot, "supplies").map((row) => row.name)).toEqual([
      "Acucar",
      "Cafe",
      "Chocolate",
    ]);
  });

  it("impede finalizar uma contagem vazia", async () => {
    await expect(saveInventoryAuditCount({
      groupId: "supplies",
      rows: [],
      status: "finalizado",
      user: { displayName: "Igor" },
    })).rejects.toThrow(/contagem esta vazia/i);

    expect(erpMocks.createEntity).not.toHaveBeenCalled();
  });

  it("salva em rascunho os itens importados ainda sem vinculo", async () => {
    await saveInventoryAuditCount({
      groupId: "supplies",
      pendingItems: [{ id: "pending_1", name: "Chocolate", quantity: 8 }],
      rows: [],
      status: "rascunho",
      user: { displayName: "Igor" },
    });

    expect(erpMocks.createEntity).toHaveBeenCalledWith(
      "inventoryCounts",
      expect.objectContaining({
        pendingItems: [expect.objectContaining({ name: "Chocolate" })],
        status: "rascunho",
        totalItems: 1,
      })
    );
  });

  it("bloqueia a finalizacao enquanto houver itens sem vinculo", async () => {
    await expect(saveInventoryAuditCount({
      groupId: "supplies",
      pendingItems: [{ id: "pending_1", name: "Chocolate", quantity: 8 }],
      rows: [],
      status: "finalizado",
      user: { displayName: "Igor" },
    })).rejects.toThrow(/1 item\(ns\) sem vinculo/i);
  });

  it("sincroniza a colecao de estoque em uma unica operacao", async () => {
    erpMocks.listEntity.mockResolvedValue([
      { id: "supply_1", minStock: 1, name: "Cafe", status: "ativo", stock: 2 },
      { id: "supply_2", minStock: 1, name: "Chocolate", status: "ativo", stock: 3 },
    ]);

    await saveInventoryAuditCount({
      groupId: "supplies",
      rows: [
        {
          assets: [],
          currentStatus: "ativo",
          itemId: "supply_1",
          itemName: "Cafe",
          minStock: 1,
          quantity: 12,
        },
        {
          assets: [],
          currentStatus: "ativo",
          itemId: "supply_2",
          itemName: "Chocolate",
          minStock: 1,
          quantity: 7,
        },
      ],
      status: "finalizado",
      user: { displayName: "Igor" },
    });

    expect(erpMocks.replaceEntityCollection).toHaveBeenCalledTimes(1);
    expect(erpMocks.replaceEntityCollection).toHaveBeenCalledWith(
      "supplies",
      expect.arrayContaining([
        expect.objectContaining({ id: "supply_1", stock: 12 }),
        expect.objectContaining({ id: "supply_2", stock: 7 }),
      ])
    );
  });
});
