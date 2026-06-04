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

  return Math.max(1, Number(selection.quantity || 1));
}

function adjustChecklistInventory(database, checklist, quantityDirection = -1) {
  adjustStock(database, "machines", checklist.machineId, quantityDirection * Number(checklist.quantity || checklist.machineQuantity || 1));

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

async function createSale(payload) {
  const [productCollection, productId] = String(payload.inventoryItem || "").split(":");
  const quantity = Number(payload.quantity || 1);
  const unitValue = asCurrencyNumber(payload.unitValue);
  const totalValue = quantity * unitValue;

  const sale = await createRecord("sales", {
    ...payload,
    productCollection,
    productId,
    quantity,
    unitValue,
    totalValue,
  });

  const database = getDatabaseSnapshot();
  adjustStock(database, productCollection, productId, -quantity);
  await persistStockCollection(database, productCollection);

  if (payload.generateCharge) {
    await createRecord("receivables", {
      origin: `Venda ${sale.id.slice(-5).toUpperCase()}`,
      clientId: payload.clientId,
      dueDate: payload.date,
      value: totalValue,
      status: payload.paymentStatus === "pago" ? "pago" : "pendente",
      notes: "Cobranca gerada automaticamente pela venda rapida.",
    });
  }

  return sale;
}

async function createChecklist(payload) {
  const shouldSyncCompletion = payload.status === "finalizado";
  const syncDate = new Date().toISOString();
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

  return deleteRecord(collectionName, id);
}

export async function getErpSnapshot() {
  return getDatabaseSnapshot();
}
