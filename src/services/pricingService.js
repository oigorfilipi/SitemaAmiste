import { updateEntity } from "./erpService.js";
import { exportRecordsToCsv } from "./exportService.js";

export const PRICING_GROUPS = [
  {
    id: "machines",
    label: "Maquinas",
    analysisMode: "payback",
    primaryKey: "priceRent",
    primaryLabel: "Aluguel",
    secondaryKey: "priceSale",
    secondaryLabel: "Venda",
    fields: [
      { key: "priceRent", label: "Valor aluguel" },
      { key: "priceSale", label: "Valor venda" },
    ],
  },
  {
    id: "supplies",
    label: "Insumos",
    analysisMode: "margin",
    primaryKey: "price",
    primaryLabel: "Preco venda",
    secondaryKey: "cost",
    secondaryLabel: "Custo",
    fields: [
      { key: "price", label: "Preco venda" },
      { key: "cost", label: "Custo" },
    ],
  },
  {
    id: "accessories",
    label: "Acessorios",
    analysisMode: "margin",
    primaryKey: "price",
    primaryLabel: "Preco venda",
    secondaryKey: "cost",
    secondaryLabel: "Custo",
    fields: [
      { key: "price", label: "Preco venda" },
      { key: "cost", label: "Custo" },
    ],
  },
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

function formatPercent(value) {
  return `${Math.round(asNumber(value))}%`;
}

function average(values) {
  const validValues = values.filter((value) => Number.isFinite(value));

  if (!validValues.length) {
    return 0;
  }

  return validValues.reduce((total, value) => total + value, 0) / validValues.length;
}

export function getPricingGroup(groupId) {
  return PRICING_GROUPS.find((group) => group.id === groupId) || PRICING_GROUPS[0];
}

export function buildPricingRows(snapshot, groupId) {
  const group = getPricingGroup(groupId);
  const records = snapshot[group.id] || [];

  return records
    .map((item) => {
      const stock = asNumber(item.stock);
      const primaryValue = asNumber(item[group.primaryKey]);
      const secondaryValue = asNumber(item[group.secondaryKey]);
      const contributionValue = primaryValue - secondaryValue;
      const marginPercent = primaryValue > 0 ? (contributionValue / primaryValue) * 100 : 0;

      /* --- SECAO: PAYBACK DE MAQUINAS ---
       * Como o mock inicial ainda nao possui custo de aquisicao do equipamento,
       * usamos o valor de venda como proxy para acompanhar retorno mensal do aluguel.
       */
      const paybackMonths = primaryValue > 0 ? secondaryValue / primaryValue : 0;
      const stockPotential = stock * (group.analysisMode === "payback" ? secondaryValue : primaryValue);
      const attention = group.analysisMode === "payback"
        ? !primaryValue || paybackMonths > 12
        : primaryValue <= secondaryValue || marginPercent < 30;

      return {
        ...item,
        analysisLabel: group.analysisMode === "payback"
          ? `${paybackMonths.toFixed(1)} meses`
          : formatPercent(marginPercent),
        analysisMode: group.analysisMode,
        attention,
        contributionValue,
        marginPercent,
        paybackMonths,
        primaryLabel: group.primaryLabel,
        primaryValue,
        secondaryLabel: group.secondaryLabel,
        secondaryValue,
        stock,
        stockPotential,
      };
    })
    .sort((first, second) => {
      if (first.attention !== second.attention) {
        return first.attention ? -1 : 1;
      }

      return String(first.name).localeCompare(String(second.name));
    });
}

export function buildPricingMetrics(snapshot, groupId) {
  const group = getPricingGroup(groupId);
  const rows = buildPricingRows(snapshot, groupId);
  const attentionRows = rows.filter((item) => item.attention);
  const stockPotential = rows.reduce((total, item) => total + item.stockPotential, 0);
  const averagePrimary = average(rows.map((item) => item.primaryValue));
  const averageAnalysis = group.analysisMode === "payback"
    ? average(rows.map((item) => item.paybackMonths))
    : average(rows.map((item) => item.marginPercent));

  return [
    {
      id: "items",
      icon: "calculator",
      label: "Itens precificados",
      value: rows.length,
      detail: `${group.label} na tabela`,
      tone: "blue",
    },
    {
      id: "average",
      icon: "money",
      label: `Media ${group.primaryLabel}`,
      value: formatCurrency(averagePrimary),
      detail: "valor base do grupo",
      tone: "green",
    },
    {
      id: "analysis",
      icon: "gauge",
      label: group.analysisMode === "payback" ? "Payback medio" : "Margem media",
      value: group.analysisMode === "payback" ? `${averageAnalysis.toFixed(1)}m` : formatPercent(averageAnalysis),
      detail: group.analysisMode === "payback" ? "proxy venda/aluguel" : "preco contra custo",
      tone: attentionRows.length ? "yellow" : "green",
    },
    {
      id: "potential",
      icon: "shoppingCart",
      label: "Potencial em estoque",
      value: formatCurrency(stockPotential),
      detail: `${attentionRows.length} pontos de atencao`,
      tone: attentionRows.length ? "red" : "green",
    },
  ];
}

export function buildPricingFormData(group, item) {
  return group.fields.reduce((formData, field) => ({
    ...formData,
    [field.key]: asNumber(item[field.key]),
  }), {});
}

export async function savePricingUpdate({ collectionName, formData, group, item }) {
  const payload = group.fields.reduce((values, field) => ({
    ...values,
    [field.key]: asNumber(formData[field.key]),
  }), {});
  const details = group.fields
    .map((field) => `${field.label}: ${formatCurrency(item[field.key])} -> ${formatCurrency(payload[field.key])}`)
    .join(" | ");

  return updateEntity(collectionName, item.id, payload, {
    action: "Precificacao",
    details,
    module: "Precos",
    title: item.name,
  });
}

export function exportPricingRows({ groupId, rows, snapshot }) {
  const group = getPricingGroup(groupId);

  exportRecordsToCsv({
    columns: [
      { key: "name", label: "Item" },
      { key: "category", label: "Categoria" },
      { key: "brand", label: "Marca" },
      { key: "primaryValue", label: group.primaryLabel, type: "currency" },
      { key: "secondaryValue", label: group.secondaryLabel, type: "currency" },
      { key: "analysisLabel", label: group.analysisMode === "payback" ? "Payback" : "Margem" },
      { key: "stock", label: "Estoque" },
      { key: "stockPotential", label: "Potencial Estoque", type: "currency" },
      { key: "status", label: "Status" },
    ],
    filename: `precos-${group.label}`,
    records: rows,
    snapshot,
  });
}
