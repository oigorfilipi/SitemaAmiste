import {
  createEntity,
  deleteEntity,
  listEntity,
  replaceEntityCollection,
  updateEntity,
} from "./erpService.js";
import { exportRecordsToCsv } from "./exportService.js";

export const INVENTORY_GROUPS = [
  { id: "supplies", label: "Insumos", unitLabel: "un.", valueKey: "cost" },
  { id: "machines", label: "Maquinas", unitLabel: "equip.", valueKey: "priceSale" },
  { id: "accessories", label: "Acessorios", unitLabel: "un.", valueKey: "cost" },
];

const INVENTORY_EXPORT_COLUMNS = [
  { key: "name", label: "Item" },
  { key: "category", label: "Categoria" },
  { key: "physicalQuantity", label: "Estoque Fisico" },
  { key: "stock", label: "Tempo Real" },
  { key: "minStock", label: "Minimo" },
  { key: "stockStatusLabel", label: "Status Estoque" },
  { key: "turnoverStatus", label: "Status Giro" },
  { key: "lastAuditLabel", label: "Ultima Auditoria" },
  { key: "countedBy", label: "Responsavel" },
];

function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(asNumber(value));
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function buildAuditActor(user) {
  return user?.displayName || user?.fullName || "Sistema Local";
}

function buildId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function levenshteinDistance(firstValue, secondValue) {
  const first = normalizeText(firstValue);
  const second = normalizeText(secondValue);
  const matrix = Array.from({ length: first.length + 1 }, (_, rowIndex) => [rowIndex]);

  for (let columnIndex = 1; columnIndex <= second.length; columnIndex += 1) {
    matrix[0][columnIndex] = columnIndex;
  }

  for (let rowIndex = 1; rowIndex <= first.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= second.length; columnIndex += 1) {
      const cost = first[rowIndex - 1] === second[columnIndex - 1] ? 0 : 1;

      matrix[rowIndex][columnIndex] = Math.min(
        matrix[rowIndex - 1][columnIndex] + 1,
        matrix[rowIndex][columnIndex - 1] + 1,
        matrix[rowIndex - 1][columnIndex - 1] + cost
      );
    }
  }

  return matrix[first.length][second.length];
}

export function getInventoryGroup(groupId) {
  return INVENTORY_GROUPS.find((group) => group.id === groupId) || INVENTORY_GROUPS[0];
}

export function resolveInventoryStatus(item, countedStock) {
  const nextStock = asNumber(countedStock);
  const minStock = asNumber(item.minStock);

  if (nextStock <= 0) {
    return "acabou";
  }

  if (nextStock <= minStock) {
    return "pedir";
  }

  return item.status === "pedir" || item.status === "acabou" ? "ativo" : item.status || "ativo";
}

export function resolveStockStatus(item, quantity) {
  const currentQuantity = asNumber(quantity);
  const minStock = asNumber(item.minStock);

  if (currentQuantity <= 0) {
    return { label: "Acabou", status: "cancelado", tone: "red" };
  }

  if (currentQuantity <= minStock) {
    return { label: "Pedir", status: "rascunho", tone: "yellow" };
  }

  return { label: "Satisfatorio", status: "concluido", tone: "green" };
}

function resolveTurnoverStatus(physicalQuantity, realTimeQuantity) {
  const movement = Math.abs(asNumber(realTimeQuantity) - asNumber(physicalQuantity));

  if (movement === 0) {
    return "Sem movimentacao";
  }

  if (movement <= 2) {
    return "Baixo giro";
  }

  if (movement <= 8) {
    return "Giro medio";
  }

  return "Alto giro";
}

function getGroupRecords(snapshot, groupId) {
  return snapshot[getInventoryGroup(groupId).id] || [];
}

function buildImportedCatalogRecord(groupId, importedRow) {
  const now = new Date().toISOString();

  return {
    category: "Importado pela contagem",
    cost: 0,
    createdAt: now,
    description: "Cadastro criado automaticamente durante a importacao da contagem de estoque.",
    id: buildId(groupId),
    minStock: 1,
    name: String(importedRow.name || "").trim(),
    price: 0,
    status: "acabou",
    stock: 0,
    unit: "un.",
    updatedAt: now,
  };
}

function getInventoryCounts(snapshot, groupId) {
  return (snapshot.inventoryCounts || [])
    .filter((count) => count.groupId === groupId)
    .sort((first, second) => new Date(second.countedAt || second.createdAt || 0) - new Date(first.countedAt || first.createdAt || 0));
}

export function getLatestInventoryCount(snapshot, groupId) {
  return getInventoryCounts(snapshot, groupId).find((count) => count.status === "finalizado") || null;
}

export function getLatestDraftInventoryCount(snapshot, groupId) {
  return getInventoryCounts(snapshot, groupId).find((count) => count.status === "rascunho") || null;
}

export function getDraftInventoryCounts(snapshot, groupId) {
  return getInventoryCounts(snapshot, groupId).filter((count) => count.status === "rascunho");
}

export function getInventoryCountForDate(snapshot, groupId, selectedDate) {
  const targetDate = selectedDate ? new Date(`${selectedDate}T23:59:59.999`) : new Date();
  const targetTime = Number.isNaN(targetDate.getTime()) ? Date.now() : targetDate.getTime();

  return getInventoryCounts(snapshot, groupId)
    .filter((count) => count.status === "finalizado")
    .find((count) => new Date(count.countedAt || count.createdAt || 0).getTime() <= targetTime) || null;
}

function buildFallbackCountItem(item) {
  return {
    assets: item.inventoryAssets || [],
    itemId: item.id,
    itemName: item.name,
    quantity: asNumber(item.stock),
  };
}

function resolvePhysicalItem(count, item) {
  if (!count) {
    return buildFallbackCountItem(item);
  }

  return (count.items || []).find((countItem) => countItem.itemId === item.id) || {
    assets: [],
    itemId: item.id,
    itemName: item.name,
    quantity: 0,
  };
}

function buildInventoryBaseRows(snapshot, groupId) {
  const group = getInventoryGroup(groupId);
  const latestCount = getLatestInventoryCount(snapshot, groupId);

  return getGroupRecords(snapshot, groupId).map((item) => {
    const physicalItem = resolvePhysicalItem(latestCount, item);
    const physicalQuantity = asNumber(physicalItem.quantity);
    const stock = asNumber(item.stock);
    const minStock = asNumber(item.minStock);
    const unitValue = asNumber(item[group.valueKey] || item.price || item.cost || item.priceSale);
    const stockStatus = resolveStockStatus(item, stock);

    return {
      ...item,
      assets: Array.isArray(physicalItem.assets) ? physicalItem.assets : [],
      countedBy: latestCount?.countedBy || "Sem contagem",
      countId: latestCount?.id || "",
      groupId,
      isLowStock: stock <= minStock,
      isOutOfStock: stock <= 0,
      lastAudit: latestCount?.countedAt || "",
      lastAuditLabel: latestCount ? formatDateTime(latestCount.countedAt) : "Sem contagem",
      minStock,
      missingToMin: Math.max(0, minStock - stock),
      physicalQuantity,
      stock,
      stockStatus,
      stockStatusLabel: stockStatus.label,
      stockValue: stock * unitValue,
      turnoverStatus: resolveTurnoverStatus(physicalQuantity, stock),
      unitValue,
    };
  });
}

export function buildInventoryRows(snapshot, groupId) {
  return buildRealtimeInventoryRows(snapshot, groupId);
}

export function buildPhysicalInventoryRows(snapshot, groupId) {
  return buildInventoryBaseRows(snapshot, groupId).sort((first, second) => String(first.name).localeCompare(String(second.name)));
}

export function buildRealtimeInventoryRows(snapshot, groupId) {
  return buildInventoryBaseRows(snapshot, groupId).sort((first, second) => {
    if (first.isOutOfStock !== second.isOutOfStock) {
      return first.isOutOfStock ? -1 : 1;
    }

    if (first.isLowStock !== second.isLowStock) {
      return first.isLowStock ? -1 : 1;
    }

    return String(first.name).localeCompare(String(second.name));
  });
}

export function buildInventoryMetrics(snapshot, groupId) {
  const rows = buildRealtimeInventoryRows(snapshot, groupId);
  const lowStockRows = rows.filter((item) => item.isLowStock);
  const outOfStockRows = rows.filter((item) => item.isOutOfStock);
  const totalStock = rows.reduce((total, item) => total + item.stock, 0);
  const totalValue = rows.reduce((total, item) => total + item.stockValue, 0);

  return [
    {
      id: "items",
      icon: "boxes",
      label: "Itens auditados",
      value: rows.length,
      detail: `${totalStock} unidades no grupo`,
      tone: "blue",
    },
    {
      id: "lowStock",
      icon: "packagePlus",
      label: "Abaixo do minimo",
      value: lowStockRows.length,
      detail: `${outOfStockRows.length} zerados`,
      tone: lowStockRows.length ? "yellow" : "green",
    },
    {
      id: "stockValue",
      icon: "money",
      label: "Valor em estoque",
      value: formatCurrency(totalValue),
      detail: "baseado no custo/preco cadastrado",
      tone: "green",
    },
    {
      id: "coverage",
      icon: "gauge",
      label: "Cobertura critica",
      value: rows.length ? `${Math.round(((rows.length - lowStockRows.length) / rows.length) * 100)}%` : "0%",
      detail: "itens acima do minimo",
      tone: lowStockRows.length ? "red" : "green",
    },
  ];
}

export function buildManualCountRows(snapshot, groupId) {
  return getGroupRecords(snapshot, groupId).map((item) => ({
    assets: [],
    currentStatus: item.status,
    itemId: item.id,
    itemName: item.name,
    minStock: item.minStock,
    quantity: "",
    sourceName: item.name,
  }));
}

export function parseInventoryText(text = "") {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const normalizedLine = line.replace(/^nome\s+do\s+item\s*[,;:\t]\s*quantidade$/i, "");
      const [namePart, quantityPart] = normalizedLine.split(/[:;,\t]/);

      return {
        name: String(namePart || "").trim(),
        quantity: asNumber(String(quantityPart || "").replace(",", ".")),
      };
    })
    .filter((row) => row.name);
}

function findBestItemMatch(name, items) {
  const normalizedName = normalizeText(name);
  const exactMatch = items.find((item) => normalizeText(item.name) === normalizedName);

  if (exactMatch) {
    return { confidence: "exact", item: exactMatch };
  }

  const containsMatch = items.find((item) => {
    const itemName = normalizeText(item.name);
    return itemName.includes(normalizedName) || normalizedName.includes(itemName);
  });

  if (containsMatch) {
    return { confidence: "partial", item: containsMatch };
  }

  const fuzzyMatches = items
    .map((item) => ({
      distance: levenshteinDistance(name, item.name),
      item,
    }))
    .sort((first, second) => first.distance - second.distance);

  if (fuzzyMatches[0]?.distance <= 2) {
    return { confidence: "suggested", item: fuzzyMatches[0].item };
  }

  return { confidence: "unmatched", item: null };
}

export function mergeImportedCountRows({ currentRows, groupId, importedRows, snapshot }) {
  const items = getGroupRecords(snapshot, groupId);
  let matchedCount = 0;
  let suggestedCount = 0;
  let unmatchedCount = 0;
  const warnings = [];
  const nextRows = currentRows.map((row) => ({ ...row }));

  importedRows.forEach((importedRow) => {
    const match = findBestItemMatch(importedRow.name, items);

    if (!match.item) {
      unmatchedCount += 1;
      warnings.push({
        id: buildId("unmatched"),
        message: `"${importedRow.name}" nao foi identificado. Vincule manualmente a um item cadastrado.`,
        name: importedRow.name,
        quantity: importedRow.quantity,
      });
      return;
    }

    const rowIndex = nextRows.findIndex((row) => row.itemId === match.item.id);

    if (rowIndex >= 0) {
      matchedCount += 1;
      nextRows[rowIndex] = {
        ...nextRows[rowIndex],
        quantity: importedRow.quantity,
        sourceName: importedRow.name,
      };
    }

    if (match.confidence !== "exact") {
      suggestedCount += 1;
      warnings.push({
        id: buildId("suggested"),
        itemId: match.item.id,
        message: `"${importedRow.name}" foi associado a "${match.item.name}". Revise antes de salvar.`,
        name: importedRow.name,
        quantity: importedRow.quantity,
      });
    }
  });

  return { matchedCount, rows: nextRows, suggestedCount, unmatchedCount, warnings };
}

export async function createImportedInventoryItems({ groupId, importedRows }) {
  if (!["supplies", "accessories"].includes(groupId)) {
    throw new Error("Cadastros automaticos pela contagem estao disponiveis apenas para insumos e acessorios.");
  }

  const currentRecords = await listEntity(groupId);
  const existingNames = new Set(currentRecords.map((record) => normalizeText(record.name)));
  const recordsToCreate = importedRows
    .filter((row) => row.name?.trim() && !existingNames.has(normalizeText(row.name)))
    .filter((row, index, rows) =>
      rows.findIndex((candidate) => normalizeText(candidate.name) === normalizeText(row.name)) === index
    )
    .map((row) => buildImportedCatalogRecord(groupId, row));

  if (!recordsToCreate.length) {
    return { createdRecords: [], records: currentRecords };
  }

  const records = await replaceEntityCollection(groupId, [...currentRecords, ...recordsToCreate]);

  return {
    createdRecords: recordsToCreate,
    records,
  };
}

function normalizeCountRows(rows = []) {
  return rows
    .map((row) => ({
      assets: Array.isArray(row.assets) ? row.assets : [],
      currentStatus: row.currentStatus,
      itemId: row.itemId,
      itemName: row.itemName,
      minStock: row.minStock,
      quantity: Math.max(0, asNumber(row.quantity)),
      sourceName: row.sourceName || row.itemName,
    }))
    .filter((row) => row.itemId);
}

function validateMachineAssets(rows, groupId) {
  if (groupId !== "machines") {
    return "";
  }

  const missingAsset = rows.some((row) => {
    const quantity = asNumber(row.quantity);
    const assets = Array.isArray(row.assets) ? row.assets : [];

    if (assets.length !== quantity) {
      return true;
    }

    return assets.some((asset) => !asset.serialNumber?.trim() || !asset.assetTag?.trim());
  });

  return missingAsset ? "Informe serie e patrimonio de todas as maquinas contadas." : "";
}

async function syncCatalogStockFromCount({ groupId, rows }) {
  const countedRows = new Map(rows.map((row) => [row.itemId, row]));
  const currentRecords = await listEntity(groupId);
  const nextRecords = currentRecords.map((record) => {
    const countedRow = countedRows.get(record.id);

    if (!countedRow) {
      return record;
    }

    return {
      ...record,
      inventoryAssets: countedRow.assets,
      stock: countedRow.quantity,
      status: resolveInventoryStatus(
        { minStock: countedRow.minStock, status: countedRow.currentStatus },
        countedRow.quantity
      ),
      updatedAt: new Date().toISOString(),
    };
  });

  await replaceEntityCollection(groupId, nextRecords);
}

export async function saveInventoryAuditCount({
  existingCountId = "",
  groupId,
  notes = "",
  pendingItems = [],
  rows,
  status = "finalizado",
  user,
}) {
  const normalizedRows = normalizeCountRows(rows);
  const unresolvedItems = pendingItems.filter((item) => !item.itemId);
  const storedPendingItems = status === "rascunho" ? pendingItems : [];
  const validationError = status === "finalizado" ? validateMachineAssets(normalizedRows, groupId) : "";

  if (!normalizedRows.length && !unresolvedItems.length) {
    throw new Error("A contagem esta vazia. Importe um arquivo ou informe ao menos um item.");
  }

  if (status === "finalizado" && unresolvedItems.length) {
    throw new Error(`Existem ${unresolvedItems.length} item(ns) sem vinculo. Vincule ou cadastre os itens antes de finalizar.`);
  }

  if (validationError) {
    throw new Error(validationError);
  }

  const countedAt = new Date().toISOString();
  const payload = {
    countedAt,
    countedBy: buildAuditActor(user),
    groupId,
    items: normalizedRows,
    notes,
    pendingItems: storedPendingItems,
    status,
    totalItems: normalizedRows.length + unresolvedItems.length,
    totalQuantity: normalizedRows.reduce((total, row) => total + row.quantity, 0),
  };
  const count = existingCountId
    ? await updateEntity("inventoryCounts", existingCountId, payload, {
      action: status === "finalizado" ? "Finalizou Rascunho" : "Atualizou Rascunho",
      details: `Contagem ${status} atualizada com ${normalizedRows.length} item(ns).`,
      module: "Estoque",
      title: `Contagem ${getInventoryGroup(groupId).label}`,
    })
    : await createEntity("inventoryCounts", payload);

  if (status === "finalizado") {
    await syncCatalogStockFromCount({ groupId, rows: normalizedRows });
  }

  return count;
}

export async function updateInventoryCountItem({ count, groupId, item, quantity, assets = [], user }) {
  const nextQuantity = Math.max(0, asNumber(quantity));
  const nextItems = (count.items || []).map((countItem) =>
    countItem.itemId === item.id
      ? { ...countItem, assets, itemName: item.name, quantity: nextQuantity }
      : countItem
  );

  const auditTrail = [
    {
      action: "Editou item contado",
      at: new Date().toISOString(),
      by: buildAuditActor(user),
      itemName: item.name,
      quantity: nextQuantity,
    },
    ...(count.auditTrail || []),
  ];

  const updatedCount = await updateEntity("inventoryCounts", count.id, {
    auditTrail,
    items: nextItems,
    totalQuantity: nextItems.reduce((total, row) => total + asNumber(row.quantity), 0),
  });

  if (count.status === "finalizado") {
    await updateEntity(
      groupId,
      item.id,
      {
        inventoryAssets: assets,
        stock: nextQuantity,
        status: resolveInventoryStatus(item, nextQuantity),
      },
      {
        action: "Corrigiu Contagem",
        details: `Quantidade corrigida para ${nextQuantity}.`,
        module: "Estoque",
        title: item.name,
      }
    );
  }

  return updatedCount;
}

export async function deleteInventoryCountItem({ count, groupId, item, user }) {
  const nextItems = (count.items || []).filter((countItem) => countItem.itemId !== item.id);
  const auditTrail = [
    {
      action: "Excluiu item contado",
      at: new Date().toISOString(),
      by: buildAuditActor(user),
      itemName: item.name,
    },
    ...(count.auditTrail || []),
  ];

  await updateEntity("inventoryCounts", count.id, {
    auditTrail,
    items: nextItems,
    totalQuantity: nextItems.reduce((total, row) => total + asNumber(row.quantity), 0),
  });

  if (count.status === "finalizado") {
    await updateEntity(
      groupId,
      item.id,
      {
        inventoryAssets: [],
        stock: 0,
        status: resolveInventoryStatus(item, 0),
      },
      {
        action: "Excluiu Item da Contagem",
        details: "Item removido da ultima contagem fisica consolidada.",
        module: "Estoque",
        title: item.name,
      }
    );
  }
}

export async function deleteInventoryCount(countId) {
  return deleteEntity("inventoryCounts", countId);
}

export function buildInventoryHistoryRows(snapshot, groupId, selectedDate) {
  const selectedCount = getInventoryCountForDate(snapshot, groupId, selectedDate);
  const itemMap = new Map(getGroupRecords(snapshot, groupId).map((item) => [item.id, item]));

  if (!selectedCount) {
    return [];
  }

  return (selectedCount.items || []).map((countItem) => {
    const item = itemMap.get(countItem.itemId) || {};

    return {
      ...countItem,
      assets: Array.isArray(countItem.assets) ? countItem.assets : [],
      countedAt: selectedCount.countedAt,
      countedBy: selectedCount.countedBy,
      currentStock: asNumber(item.stock),
      dateLabel: formatDateTime(selectedCount.countedAt),
      itemName: countItem.itemName || item.name || "-",
      quantity: asNumber(countItem.quantity),
    };
  });
}

export function buildInventoryHistoryDashboard(snapshot, groupId, selectedDate) {
  const rows = buildInventoryHistoryRows(snapshot, groupId, selectedDate);
  const movements = rows.map((row) => ({
    ...row,
    movement: Math.abs(asNumber(row.currentStock) - asNumber(row.quantity)),
  }));
  const sortedByMovement = [...movements].sort((first, second) => second.movement - first.movement);
  const divergences = movements.filter((row) => asNumber(row.currentStock) !== asNumber(row.quantity));

  return [
    {
      id: "highest-turnover",
      icon: "gauge",
      label: "Maior giro",
      value: sortedByMovement[0]?.itemName || "-",
      detail: sortedByMovement[0] ? `${sortedByMovement[0].movement} unidade(s)` : "sem dados",
      tone: "blue",
    },
    {
      id: "lowest-turnover",
      icon: "history",
      label: "Menor giro",
      value: [...movements].filter((row) => row.movement > 0).sort((first, second) => first.movement - second.movement)[0]?.itemName || "-",
      detail: "menor variacao apos contagem",
      tone: "green",
    },
    {
      id: "no-movement",
      icon: "checkSquare",
      label: "Sem movimentacao",
      value: movements.filter((row) => row.movement === 0).length,
      detail: "itens sem variacao",
      tone: "yellow",
    },
    {
      id: "divergences",
      icon: "bell",
      label: "Divergencias",
      value: divergences.length,
      detail: "fisico x tempo real",
      tone: divergences.length ? "red" : "green",
    },
  ];
}

export function exportInventoryRows({ groupId, rows, snapshot }) {
  const group = getInventoryGroup(groupId);

  exportRecordsToCsv({
    columns: INVENTORY_EXPORT_COLUMNS,
    filename: `estoque-${group.label}`,
    records: rows,
    snapshot,
  });
}
