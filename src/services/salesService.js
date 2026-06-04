import { createEntity } from "./erpService.js";
import { exportRecordsToCsv } from "./exportService.js";

const SALE_EXPORT_COLUMNS = [
  { key: "date", label: "Data" },
  { key: "clientName", label: "Cliente" },
  { key: "productName", label: "Produto" },
  { key: "productType", label: "Tipo" },
  { key: "quantity", label: "Qtd" },
  { key: "unitValue", label: "Valor Unitario", type: "currency" },
  { key: "totalValue", label: "Valor Total", type: "currency" },
  { key: "paymentStatus", label: "Pagamento" },
  { key: "generateCharge", label: "Cobranca Gerada" },
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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function resolveClient(snapshot, clientId) {
  return snapshot.clients?.find((client) => client.id === clientId)?.name || "-";
}

function findClient(snapshot, clientId) {
  return snapshot.clients?.find((client) => client.id === clientId) || null;
}

function resolveProduct(snapshot, collectionName, productId) {
  return snapshot[collectionName]?.find((item) => item.id === productId) || null;
}

export function buildSaleProductOptions(snapshot) {
  return [
    ...(snapshot.supplies || []).map((item) => ({
      collectionName: "supplies",
      id: item.id,
      label: `Insumo: ${item.name}`,
      productType: "Insumo",
      value: `supplies:${item.id}`,
      item,
    })),
    ...(snapshot.accessories || []).map((item) => ({
      collectionName: "accessories",
      id: item.id,
      label: `Acessorio: ${item.name}`,
      productType: "Acessorio",
      value: `accessories:${item.id}`,
      item,
    })),
  ];
}

export function buildInitialSaleForm(snapshot) {
  const firstClient = snapshot.clients?.[0];
  const firstProduct = buildSaleProductOptions(snapshot)[0];

  return {
    clientId: firstClient?.id || "",
    date: todayIsoDate(),
    generateCharge: true,
    inventoryItem: firstProduct?.value || "",
    paymentStatus: "pendente",
    quantity: 1,
    unitValue: asNumber(firstProduct?.item?.price),
  };
}

export function enrichSaleForm(formData, snapshot) {
  const [collectionName, productId] = String(formData.inventoryItem || "").split(":");
  const product = resolveProduct(snapshot, collectionName, productId);
  const quantity = Math.max(1, asNumber(formData.quantity || 1));
  const unitValue = asNumber(formData.unitValue || product?.price);
  const totalValue = quantity * unitValue;
  const stock = asNumber(product?.stock);
  const remainingStock = Math.max(0, stock - quantity);
  const willBreakStock = Boolean(product && quantity > stock);

  return {
    collectionName,
    product,
    productId,
    quantity,
    remainingStock,
    stock,
    totalLabel: formatCurrency(totalValue),
    totalValue,
    unitValue,
    willBreakStock,
  };
}

export function validateSaleForm(formData, snapshot) {
  const sale = enrichSaleForm(formData, snapshot);

  if (!formData.clientId) {
    return "Selecione o cliente da venda.";
  }

  if (!findClient(snapshot, formData.clientId)) {
    return "Cliente selecionado nao encontrado. Selecione um cliente valido.";
  }

  if (!formData.date) {
    return "Informe a data da venda.";
  }

  if (!["supplies", "accessories"].includes(sale.collectionName)) {
    return "Selecione um item de estoque valido.";
  }

  if (!sale.product) {
    return "Selecione um produto valido.";
  }

  if (sale.quantity <= 0) {
    return "Informe uma quantidade maior que zero.";
  }

  if (sale.willBreakStock) {
    return `Estoque insuficiente: ${sale.product.name} possui ${sale.stock} unidade(s) disponiveis.`;
  }

  if (sale.unitValue <= 0) {
    return "Informe um valor unitario maior que zero.";
  }

  return "";
}

export async function submitQuickSale(formData, snapshot) {
  const validationMessage = validateSaleForm(formData, snapshot);
  const sale = enrichSaleForm(formData, snapshot);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  return createEntity("sales", {
    clientId: formData.clientId,
    date: formData.date || todayIsoDate(),
    generateCharge: Boolean(formData.generateCharge),
    inventoryItem: formData.inventoryItem,
    paymentStatus: formData.paymentStatus || "pendente",
    quantity: sale.quantity,
    unitValue: sale.unitValue,
  });
}

export function buildSalesRows(records, snapshot) {
  return records.map((sale) => {
    const product = resolveProduct(snapshot, sale.productCollection, sale.productId);

    return {
      ...sale,
      clientName: resolveClient(snapshot, sale.clientId),
      productName: product?.name || "-",
      productStock: asNumber(product?.stock),
      productType: sale.productCollection === "accessories" ? "Acessorio" : "Insumo",
    };
  });
}

export function buildSalesMetrics(rows) {
  const totalRevenue = rows.reduce((total, sale) => total + asNumber(sale.totalValue), 0);
  const paidRevenue = rows
    .filter((sale) => sale.paymentStatus === "pago")
    .reduce((total, sale) => total + asNumber(sale.totalValue), 0);
  const pendingRevenue = rows
    .filter((sale) => sale.paymentStatus !== "pago")
    .reduce((total, sale) => total + asNumber(sale.totalValue), 0);
  const totalItems = rows.reduce((total, sale) => total + asNumber(sale.quantity), 0);

  return [
    {
      id: "sales",
      icon: "shoppingCart",
      label: "Vendas registradas",
      value: rows.length,
      detail: `${totalItems} itens vendidos`,
      tone: "blue",
    },
    {
      id: "revenue",
      icon: "money",
      label: "Faturamento total",
      value: formatCurrency(totalRevenue),
      detail: "base local",
      tone: "green",
    },
    {
      id: "paid",
      icon: "checkSquare",
      label: "Recebido",
      value: formatCurrency(paidRevenue),
      detail: "pagamento pago",
      tone: "green",
    },
    {
      id: "pending",
      icon: "fileClock",
      label: "Pendente",
      value: formatCurrency(pendingRevenue),
      detail: "gera cobranca quando marcado",
      tone: pendingRevenue ? "yellow" : "green",
    },
  ];
}

export function exportSalesRows(rows, snapshot) {
  exportRecordsToCsv({
    columns: SALE_EXPORT_COLUMNS,
    filename: "vendas-rapidas",
    records: rows,
    snapshot,
  });
}
