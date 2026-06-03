import { updateEntity } from "./erpService.js";
import { exportRecordsToCsv } from "./exportService.js";

export const INVENTORY_GROUPS = [
  { id: "supplies", label: "Insumos", unitLabel: "un.", valueKey: "cost" },
  { id: "machines", label: "Maquinas", unitLabel: "equip.", valueKey: "priceSale" },
  { id: "accessories", label: "Acessorios", unitLabel: "un.", valueKey: "cost" },
];

const INVENTORY_EXPORT_COLUMNS = [
  { key: "name", label: "Item" },
  { key: "category", label: "Categoria" },
  { key: "brand", label: "Marca" },
  { key: "stock", label: "Atual" },
  { key: "minStock", label: "Minimo" },
  { key: "missingToMin", label: "Gap Minimo" },
  { key: "unitValue", label: "Valor Unitario", type: "currency" },
  { key: "stockValue", label: "Valor Estoque", type: "currency" },
  { key: "status", label: "Status" },
];

function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(asNumber(value));
}

export function getInventoryGroup(groupId) {
  return INVENTORY_GROUPS.find((group) => group.id === groupId) || INVENTORY_GROUPS[0];
}

export function resolveInventoryStatus(item, countedStock) {
  const nextStock = asNumber(countedStock);
  const minStock = asNumber(item.minStock);

  /* --- SECAO: STATUS OPERACIONAL ---
   * Contagem baixa forca alerta de compra. Ao recuperar estoque, apenas itens
   * que estavam em "pedir" voltam para "ativo"; manutencao/cancelado seguem preservados.
   */
  if (nextStock <= minStock) {
    return "pedir";
  }

  if (item.status === "pedir") {
    return "ativo";
  }

  return item.status || "ativo";
}

export function buildInventoryRows(snapshot, groupId) {
  const group = getInventoryGroup(groupId);
  const records = snapshot[group.id] || [];

  return records
    .map((item) => {
      const stock = asNumber(item.stock);
      const minStock = asNumber(item.minStock);
      const unitValue = asNumber(item[group.valueKey] || item.price || item.cost || item.priceSale);
      const missingToMin = Math.max(0, minStock - stock);

      return {
        ...item,
        stock,
        minStock,
        unitValue,
        stockValue: stock * unitValue,
        missingToMin,
        isLowStock: stock <= minStock,
        isOutOfStock: stock <= 0,
      };
    })
    .sort((first, second) => {
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
  const rows = buildInventoryRows(snapshot, groupId);
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

export async function saveInventoryCount({ collectionName, item, countedStock, notes = "" }) {
  const previousStock = asNumber(item.stock);
  const nextStock = Math.max(0, asNumber(countedStock));
  const stockDelta = nextStock - previousStock;
  const nextStatus = resolveInventoryStatus(item, nextStock);
  const deltaLabel = stockDelta > 0 ? `+${stockDelta}` : String(stockDelta);
  const details = [
    `Estoque anterior: ${previousStock}`,
    `Estoque contado: ${nextStock}`,
    `Variacao: ${deltaLabel}`,
    `Status: ${nextStatus}`,
    notes ? `Observacao: ${notes}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return updateEntity(
    collectionName,
    item.id,
    {
      stock: nextStock,
      status: nextStatus,
    },
    {
      action: "Contagem",
      details,
      module: "Estoque",
      title: item.name,
    }
  );
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
