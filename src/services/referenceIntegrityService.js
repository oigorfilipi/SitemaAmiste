const COLLECTION_LABELS = {
  accessories: "Acessorios",
  checklists: "Checklists",
  clients: "Clientes",
  labels: "Etiquetas",
  machineConfigs: "Configuracoes de Maquina",
  machines: "Maquinas",
  proposals: "Portfolios",
  receivables: "Contas a Receber",
  recipes: "Receitas",
  repairOrders: "Consertos SLA",
  sales: "Vendas",
  serviceSheets: "Fichas Operacionais",
  supplies: "Insumos",
  wikiSolutions: "Wiki",
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getRecordLabel(record = {}) {
  return record.name || record.code || record.origin || record.description || record.problem || record.sheetType || record.id;
}

function getCollectionLabel(collectionName) {
  return COLLECTION_LABELS[collectionName] || collectionName;
}

function findById(database, collectionName, id) {
  return asArray(database[collectionName]).find((record) => record.id === id) || null;
}

function matchesReference(record, fieldName, id) {
  return record?.[fieldName] === id;
}

function matchesInventoryProduct(record, collectionName, id) {
  return record?.productCollection === collectionName && record?.productId === id;
}

function matchesChecklistSelection(record, fieldName, id) {
  const selection = record?.[fieldName]?.[id];

  return Boolean(selection && (selection.selected || Number(selection.quantity || 0) > 0));
}

function matchesLabelCategory(record, prefix, name) {
  return Boolean(name && record?.category === `${prefix}: ${name}`);
}

function valueEqualsOption(value, optionValue, optionName) {
  if (Array.isArray(value)) {
    return value.some((item) => valueEqualsOption(item, optionValue, optionName));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => valueEqualsOption(item, optionValue, optionName));
  }

  return value === optionValue || value === optionName;
}

function matchesOptionUsage(record, option) {
  return Object.entries(record || {})
    .filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key))
    .some(([, value]) => valueEqualsOption(value, option.value, option.name));
}

function buildBlocker(collectionName, records) {
  if (!records.length) {
    return null;
  }

  return {
    collectionName,
    count: records.length,
    examples: records.slice(0, 3).map(getRecordLabel),
    label: getCollectionLabel(collectionName),
  };
}

function collectBlocker(database, collectionName, predicate) {
  return buildBlocker(collectionName, asArray(database[collectionName]).filter(predicate));
}

function compactBlockers(blockers) {
  return blockers.filter(Boolean);
}

function buildMachineBlockers(database, machine) {
  return compactBlockers([
    collectBlocker(database, "clients", (record) => matchesReference(record, "machineId", machine.id)),
    collectBlocker(database, "checklists", (record) => matchesReference(record, "machineId", machine.id)),
    collectBlocker(database, "repairOrders", (record) => matchesReference(record, "machineId", machine.id)),
    collectBlocker(database, "proposals", (record) => matchesReference(record, "machineId", machine.id)),
    collectBlocker(database, "serviceSheets", (record) => matchesReference(record, "machineId", machine.id)),
    collectBlocker(database, "machineConfigs", (record) => matchesReference(record, "machineId", machine.id)),
    collectBlocker(database, "wikiSolutions", (record) => matchesReference(record, "machineId", machine.id)),
    collectBlocker(database, "labels", (record) => matchesLabelCategory(record, "Maquina", machine.name)),
  ]);
}

function buildClientBlockers(database, client) {
  return compactBlockers([
    collectBlocker(database, "machineConfigs", (record) => matchesReference(record, "clientId", client.id)),
    collectBlocker(database, "checklists", (record) => matchesReference(record, "clientId", client.id)),
    collectBlocker(database, "repairOrders", (record) => matchesReference(record, "clientId", client.id)),
    collectBlocker(database, "proposals", (record) => matchesReference(record, "clientId", client.id)),
    collectBlocker(database, "serviceSheets", (record) => matchesReference(record, "clientId", client.id)),
    collectBlocker(database, "sales", (record) => matchesReference(record, "clientId", client.id)),
    collectBlocker(database, "receivables", (record) => matchesReference(record, "clientId", client.id)),
  ]);
}

function buildSupplyBlockers(database, supply) {
  return compactBlockers([
    collectBlocker(database, "recipes", (record) => matchesReference(record, "supplyId", supply.id)),
    collectBlocker(database, "sales", (record) => matchesInventoryProduct(record, "supplies", supply.id)),
    collectBlocker(database, "checklists", (record) => matchesChecklistSelection(record, "supplies", supply.id)),
    collectBlocker(database, "labels", (record) => matchesLabelCategory(record, "Produto", supply.name)),
  ]);
}

function buildAccessoryBlockers(database, accessory) {
  return compactBlockers([
    collectBlocker(database, "sales", (record) => matchesInventoryProduct(record, "accessories", accessory.id)),
    collectBlocker(database, "checklists", (record) => matchesChecklistSelection(record, "accessories", accessory.id)),
    collectBlocker(database, "labels", (record) => matchesLabelCategory(record, "Acessorio", accessory.name)),
  ]);
}

function buildOptionBlockers(database, option) {
  const ignoredCollections = new Set(["history", "options"]);

  return Object.keys(database)
    .filter((collectionName) => !ignoredCollections.has(collectionName))
    .map((collectionName) => collectBlocker(database, collectionName, (record) => matchesOptionUsage(record, option)))
    .filter(Boolean);
}

export function getDeletionBlockers(database, collectionName, id) {
  const record = findById(database, collectionName, id);

  if (!record) {
    return [];
  }

  if (collectionName === "machines") {
    return buildMachineBlockers(database, record);
  }

  if (collectionName === "clients") {
    return buildClientBlockers(database, record);
  }

  if (collectionName === "supplies") {
    return buildSupplyBlockers(database, record);
  }

  if (collectionName === "accessories") {
    return buildAccessoryBlockers(database, record);
  }

  if (collectionName === "machineConfigs") {
    return compactBlockers([
      collectBlocker(database, "proposals", (item) => matchesReference(item, "machineConfigId", id)),
    ]);
  }

  if (collectionName === "checklists") {
    return compactBlockers([
      collectBlocker(database, "serviceSheets", (item) => matchesReference(item, "checklistId", id)),
    ]);
  }

  if (collectionName === "proposals") {
    return compactBlockers([
      collectBlocker(database, "serviceSheets", (item) => matchesReference(item, "proposalId", id)),
    ]);
  }

  if (collectionName === "options") {
    return buildOptionBlockers(database, record);
  }

  return [];
}

export function buildDeletionBlockedMessage(collectionName, recordId, blockers) {
  const recordLabel = recordId ? `${getCollectionLabel(collectionName)} ${recordId}` : getCollectionLabel(collectionName);
  const details = blockers
    .map((blocker) => {
      const examples = blocker.examples.length ? ` Ex.: ${blocker.examples.join(", ")}.` : "";

      return `${blocker.label}: ${blocker.count} registro(s).${examples}`;
    })
    .join(" ");

  return `Nao foi possivel excluir ${recordLabel}. Existem vinculos ativos. ${details} Remova ou transfira esses vinculos antes de excluir.`;
}
