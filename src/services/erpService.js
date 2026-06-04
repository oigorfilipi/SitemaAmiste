import {
  createRecord,
  deleteRecord,
  getDatabaseSnapshot,
  listRecords,
  setCollection,
  updateRecord,
} from "./local/localDatabase.js";
import {
  buildDeletionBlockedMessage,
  getDeletionBlockers,
} from "./referenceIntegrityService.js";

function asCurrencyNumber(value) {
  return Number(value || 0);
}

function asQuantity(value, fallback = 1) {
  const numericValue = Number(value ?? fallback);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function findRecord(database, collectionName, id) {
  return database[collectionName]?.find((record) => record.id === id) || null;
}

function validateSelectedInventoryStock(database, collectionName, selectionMap = {}, label) {
  for (const [recordId, selection] of Object.entries(selectionMap)) {
    const quantity = getSelectedQuantity(selection);

    if (!quantity) {
      continue;
    }

    const record = findRecord(database, collectionName, recordId);

    if (!record) {
      return `${label} selecionado nao existe mais no cadastro. Revise a selecao.`;
    }

    if (quantity > Number(record.stock || 0)) {
      return `Estoque insuficiente: ${record.name} possui ${Number(record.stock || 0)} unidade(s) disponiveis.`;
    }
  }

  return "";
}

function resolveSaleProductParts(payload = {}, existingSale = {}) {
  const inventoryItem = payload.inventoryItem ?? existingSale.inventoryItem;

  if (inventoryItem) {
    const [productCollection, productId] = String(inventoryItem).split(":");

    return { productCollection, productId };
  }

  return {
    productCollection: payload.productCollection ?? existingSale.productCollection,
    productId: payload.productId ?? existingSale.productId,
  };
}

function buildSalePayload(payload, existingSale = {}) {
  const { productCollection, productId } = resolveSaleProductParts(payload, existingSale);
  const quantity = asQuantity(payload.quantity ?? existingSale.quantity);
  const unitValue = asCurrencyNumber(payload.unitValue ?? existingSale.unitValue);

  return {
    ...payload,
    clientId: payload.clientId ?? existingSale.clientId,
    date: payload.date ?? existingSale.date,
    generateCharge: Boolean(payload.generateCharge ?? existingSale.generateCharge),
    inventoryItem: `${productCollection || ""}:${productId || ""}`,
    paymentStatus: payload.paymentStatus ?? existingSale.paymentStatus ?? "pendente",
    productCollection,
    productId,
    quantity,
    totalValue: quantity * unitValue,
    unitValue,
  };
}

function saleUsesSameProduct(firstSale = {}, secondSale = {}) {
  return firstSale.productCollection === secondSale.productCollection && firstSale.productId === secondSale.productId;
}

function buildSaleReceivableOrigin(sale) {
  const numericSuffix = String(sale.id || "").match(/(\d+)$/)?.[1];

  return numericSuffix ? `Venda #${numericSuffix}` : `Venda ${String(sale.id || "").slice(-5).toUpperCase()}`;
}

function getSaleReceivableOrigins(sale) {
  return Array.from(new Set([
    buildSaleReceivableOrigin(sale),
    `Venda ${String(sale.id || "").slice(-5).toUpperCase()}`,
  ].filter(Boolean)));
}

function findSaleReceivable(database, sale) {
  const origins = getSaleReceivableOrigins(sale);

  return (database.receivables || []).find((receivable) => origins.includes(receivable.origin)) || null;
}

function adjustStock(database, collectionName, id, quantityDelta) {
  if (!collectionName || !id || !database[collectionName]) {
    return database;
  }

  database[collectionName] = database[collectionName].map((item) => {
    if (item.id !== id) {
      return item;
    }

    return {
      ...item,
      stock: Math.max(0, Number(item.stock || 0) + quantityDelta),
      status: Number(item.stock || 0) + quantityDelta <= Number(item.minStock || 0) ? "pedir" : item.status,
    };
  });

  return database;
}

function getSelectedQuantity(selection) {
  if (!selection?.selected) {
    return 0;
  }

  return Math.max(1, Number(selection.quantity ?? 1));
}

function validateSalePayload(database, payload, existingSale = null) {
  const sale = buildSalePayload(payload, existingSale || {});
  const quantity = asQuantity(sale.quantity);
  const unitValue = asCurrencyNumber(sale.unitValue);

  if (!sale.clientId) {
    return "Selecione o cliente da venda.";
  }

  if (!findRecord(database, "clients", sale.clientId)) {
    return "Cliente selecionado nao encontrado. Selecione um cliente valido.";
  }

  if (!sale.date) {
    return "Informe a data da venda.";
  }

  if (!["supplies", "accessories"].includes(sale.productCollection)) {
    return "Selecione um item de estoque valido.";
  }

  const product = findRecord(database, sale.productCollection, sale.productId);

  if (!product) {
    return "Selecione um produto valido.";
  }

  if (quantity <= 0) {
    return "Informe uma quantidade maior que zero.";
  }

  const availableStock = Number(product.stock || 0) + (
    existingSale && saleUsesSameProduct(sale, existingSale) ? asQuantity(existingSale.quantity) : 0
  );

  if (quantity > availableStock) {
    return `Estoque insuficiente: ${product.name} possui ${availableStock} unidade(s) disponiveis.`;
  }

  if (unitValue <= 0) {
    return "Informe um valor unitario maior que zero.";
  }

  return "";
}

function adjustChecklistInventory(database, checklist, quantityDirection = -1) {
  adjustStock(database, "machines", checklist.machineId, quantityDirection * Number(checklist.quantity ?? checklist.machineQuantity ?? 1));

  Object.entries(checklist.supplies || {}).forEach(([supplyId, selection]) => {
    const quantity = getSelectedQuantity(selection);

    if (quantity > 0) {
      adjustStock(database, "supplies", supplyId, quantityDirection * quantity);
    }
  });

  Object.entries(checklist.accessories || {}).forEach(([accessoryId, selection]) => {
    const quantity = getSelectedQuantity(selection);

    if (quantity > 0) {
      adjustStock(database, "accessories", accessoryId, quantityDirection * quantity);
    }
  });
}

function buildChecklistReceivableOrigin(checklist) {
  return `Checklist ${checklist.code || checklist.id}`;
}

function hasChecklistReceivable(database, checklist) {
  const origin = buildChecklistReceivableOrigin(checklist);

  return (database.receivables || []).some((receivable) => receivable.origin === origin);
}

function validateChecklistCompletionPayload(database, checklist) {
  if (checklist.status !== "finalizado") {
    return "";
  }

  const machineQuantity = asQuantity(checklist.quantity ?? checklist.machineQuantity);

  if (!checklist.clientId && checklist.serviceScope !== "Evento") {
    return "Selecione o cliente do checklist.";
  }

  if (checklist.clientId && !findRecord(database, "clients", checklist.clientId)) {
    return "Cliente selecionado nao encontrado. Selecione um cliente valido.";
  }

  const machine = findRecord(database, "machines", checklist.machineId);

  if (!machine) {
    return "Maquina selecionada nao encontrada. Selecione uma maquina valida.";
  }

  if (machineQuantity <= 0) {
    return "Informe uma quantidade de maquinas maior que zero.";
  }

  if (machineQuantity > Number(machine.stock || 0)) {
    return `Estoque insuficiente: ${machine.name} possui ${Number(machine.stock || 0)} unidade(s) disponiveis.`;
  }

  const suppliesError = validateSelectedInventoryStock(database, "supplies", checklist.supplies, "Insumo");

  if (suppliesError) {
    return suppliesError;
  }

  const accessoriesError = validateSelectedInventoryStock(database, "accessories", checklist.accessories, "Acessorio");

  if (accessoriesError) {
    return accessoriesError;
  }

  return "";
}

async function persistStockCollection(database, collectionName) {
  if (!collectionName || !Array.isArray(database?.[collectionName])) {
    return;
  }

  await setCollection(collectionName, database[collectionName]);
}

async function persistChecklistInventory(database) {
  await persistStockCollection(database, "machines");
  await persistStockCollection(database, "supplies");
  await persistStockCollection(database, "accessories");
}

async function persistSaleStockDelta(previousSale, nextSale) {
  const database = getDatabaseSnapshot();
  const touchedCollections = new Set();

  if (previousSale?.productCollection && previousSale?.productId) {
    adjustStock(database, previousSale.productCollection, previousSale.productId, asQuantity(previousSale.quantity));
    touchedCollections.add(previousSale.productCollection);
  }

  if (nextSale?.productCollection && nextSale?.productId) {
    adjustStock(database, nextSale.productCollection, nextSale.productId, -asQuantity(nextSale.quantity));
    touchedCollections.add(nextSale.productCollection);
  }

  for (const collectionName of touchedCollections) {
    await persistStockCollection(database, collectionName);
  }
}

async function syncSaleReceivable(sale, previousSale = sale) {
  const database = getDatabaseSnapshot();
  const receivable = findSaleReceivable(database, sale) || findSaleReceivable(database, previousSale);
  const receivablePayload = {
    origin: buildSaleReceivableOrigin(sale),
    clientId: sale.clientId,
    dueDate: sale.date,
    value: asCurrencyNumber(sale.totalValue),
    status: sale.paymentStatus === "pago" ? "pago" : "pendente",
    notes: "Cobranca gerada automaticamente pela venda rapida.",
  };

  if (sale.generateCharge) {
    if (receivable) {
      await updateRecord("receivables", receivable.id, receivablePayload, {
        action: "Sincronizou",
        details: `${receivablePayload.origin}: valor ${receivablePayload.value} | status ${receivablePayload.status}`,
        module: "Financeiro",
        title: receivablePayload.origin,
      });
      return;
    }

    await createRecord("receivables", receivablePayload);
    return;
  }

  if (receivable) {
    await deleteRecord("receivables", receivable.id);
  }
}

async function createSale(payload) {
  const database = getDatabaseSnapshot();
  const validationMessage = validateSalePayload(database, payload);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const normalizedPayload = buildSalePayload(payload);

  const sale = await createRecord("sales", {
    ...normalizedPayload,
  });

  await persistSaleStockDelta(null, sale);

  await syncSaleReceivable(sale);

  return sale;
}

async function updateSale(id, payload, historyConfig) {
  const database = getDatabaseSnapshot();
  const existingSale = findRecord(database, "sales", id);

  if (!existingSale) {
    throw new Error("Venda nao encontrada.");
  }

  const normalizedPayload = buildSalePayload(payload, existingSale);
  const validationMessage = validateSalePayload(database, normalizedPayload, existingSale);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const updatedSale = await updateRecord("sales", id, normalizedPayload, historyConfig);

  await persistSaleStockDelta(existingSale, updatedSale);
  await syncSaleReceivable(updatedSale, existingSale);

  return updatedSale;
}

async function deleteSale(id) {
  const database = getDatabaseSnapshot();
  const existingSale = findRecord(database, "sales", id);

  if (!existingSale) {
    throw new Error("Venda nao encontrada.");
  }

  const deletedSale = await deleteRecord("sales", id);

  await persistSaleStockDelta(deletedSale, null);
  await syncSaleReceivable({ ...deletedSale, generateCharge: false }, deletedSale);

  return deletedSale;
}

async function createChecklist(payload) {
  const shouldSyncCompletion = payload.status === "finalizado";
  const syncDate = new Date().toISOString();

  if (shouldSyncCompletion) {
    const validationMessage = validateChecklistCompletionPayload(getDatabaseSnapshot(), payload);

    if (validationMessage) {
      throw new Error(validationMessage);
    }
  }

  const checklist = await createRecord("checklists", shouldSyncCompletion
    ? {
      ...payload,
      financeSyncedAt: Number(payload.value || 0) > 0 ? syncDate : payload.financeSyncedAt,
      inventorySyncedAt: syncDate,
    }
    : payload);

  /* --- SECAO: INTEGRACAO OPERACIONAL ---
   * Checklists finalizados ja movimentam estoque e financeiro no MVP local.
   */
  if (shouldSyncCompletion) {
    const database = getDatabaseSnapshot();
    adjustChecklistInventory(database, checklist);
    await persistChecklistInventory(database);

    if (Number(checklist.value || 0) > 0 && !hasChecklistReceivable(database, checklist)) {
      await createRecord("receivables", {
        origin: buildChecklistReceivableOrigin(checklist),
        clientId: checklist.clientId,
        dueDate: checklist.date,
        value: Number(checklist.value || 0),
        status: "pendente",
        notes: "Cobranca gerada automaticamente pelo checklist finalizado.",
      });
    }
  }

  return checklist;
}

async function updateChecklist(id, payload, historyConfig) {
  const database = getDatabaseSnapshot();
  const existingChecklist = (database.checklists || []).find((checklist) => checklist.id === id);
  const finalizingNow = payload.status === "finalizado" && existingChecklist?.status !== "finalizado";
  const shouldSyncInventory = finalizingNow && !existingChecklist?.inventorySyncedAt;
  const syncDate = new Date().toISOString();

  if (shouldSyncInventory) {
    const validationMessage = validateChecklistCompletionPayload(database, {
      ...(existingChecklist || {}),
      ...payload,
    });

    if (validationMessage) {
      throw new Error(validationMessage);
    }
  }

  const updatedChecklist = await updateRecord("checklists", id, shouldSyncInventory
    ? {
      ...payload,
      financeSyncedAt: Number(payload.value || existingChecklist?.value || 0) > 0 ? syncDate : payload.financeSyncedAt,
      inventorySyncedAt: syncDate,
    }
    : payload, historyConfig);

  /* --- SECAO: FINALIZACAO IDEMPOTENTE ---
   * A baixa de estoque e a criacao de recebivel acontecem apenas na primeira
   * transicao para finalizado. Edicoes posteriores nao duplicam movimentos.
   */
  if (shouldSyncInventory) {
    const nextDatabase = getDatabaseSnapshot();
    adjustChecklistInventory(nextDatabase, updatedChecklist);
    await persistChecklistInventory(nextDatabase);

    if (Number(updatedChecklist.value || 0) > 0 && !hasChecklistReceivable(nextDatabase, updatedChecklist)) {
      await createRecord("receivables", {
        origin: buildChecklistReceivableOrigin(updatedChecklist),
        clientId: updatedChecklist.clientId,
        dueDate: updatedChecklist.date,
        value: Number(updatedChecklist.value || 0),
        status: "pendente",
        notes: "Cobranca gerada automaticamente pelo checklist finalizado.",
      });
    }
  }

  return updatedChecklist;
}

export async function listEntity(collectionName) {
  return listRecords(collectionName);
}

export async function createEntity(collectionName, payload) {
  if (collectionName === "sales") {
    return createSale(payload);
  }

  if (collectionName === "checklists") {
    return createChecklist(payload);
  }

  return createRecord(collectionName, payload);
}

export async function updateEntity(collectionName, id, payload, historyConfig) {
  if (collectionName === "sales") {
    return updateSale(id, payload, historyConfig);
  }

  if (collectionName === "checklists") {
    return updateChecklist(id, payload, historyConfig);
  }

  return updateRecord(collectionName, id, payload, historyConfig);
}

export async function deleteEntity(collectionName, id) {
  const database = getDatabaseSnapshot();
  const blockers = getDeletionBlockers(database, collectionName, id);

  if (blockers.length) {
    throw new Error(buildDeletionBlockedMessage(collectionName, id, blockers));
  }

  if (collectionName === "sales") {
    return deleteSale(id);
  }

  return deleteRecord(collectionName, id);
}

export async function getErpSnapshot() {
  return getDatabaseSnapshot();
}
