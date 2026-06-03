import {
  createRecord,
  deleteRecord,
  getDatabaseSnapshot,
  listRecords,
  setCollection,
  updateRecord,
} from "./local/localDatabase.js";

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

async function persistStockCollection(database, collectionName) {
  if (!collectionName || !Array.isArray(database?.[collectionName])) {
    return;
  }

  await setCollection(collectionName, database[collectionName]);
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
  const checklist = await createRecord("checklists", payload);

  /* --- SECAO: INTEGRACAO OPERACIONAL ---
   * Checklists finalizados ja movimentam estoque e financeiro no MVP local.
   */
  if (payload.status === "finalizado") {
    const database = getDatabaseSnapshot();
    adjustStock(database, "machines", payload.machineId, -Number(payload.quantity || 1));
    await persistStockCollection(database, "machines");

    if (Number(payload.value || 0) > 0) {
      await createRecord("receivables", {
        origin: `Checklist ${payload.code || checklist.id}`,
        clientId: payload.clientId,
        dueDate: payload.date,
        value: Number(payload.value || 0),
        status: "pendente",
        notes: "Cobranca gerada automaticamente pelo checklist finalizado.",
      });
    }
  }

  return checklist;
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
  return updateRecord(collectionName, id, payload, historyConfig);
}

export async function deleteEntity(collectionName, id) {
  return deleteRecord(collectionName, id);
}

export async function getErpSnapshot() {
  return getDatabaseSnapshot();
}
