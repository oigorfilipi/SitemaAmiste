const CATALOG_DEFINITIONS = {
  accessories: {
    label: "Acessorios",
    primaryValueKey: "price",
    secondaryValueKey: "cost",
    valueLabel: "Preco",
    mode: "margin",
  },
  machines: {
    label: "Maquinas",
    primaryValueKey: "priceSale",
    secondaryValueKey: "priceRent",
    valueLabel: "Venda",
    mode: "payback",
  },
  supplies: {
    label: "Insumos",
    primaryValueKey: "price",
    secondaryValueKey: "cost",
    valueLabel: "Preco",
    mode: "margin",
  },
};

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

function getDefinition(collectionName) {
  return CATALOG_DEFINITIONS[collectionName] || CATALOG_DEFINITIONS.supplies;
}

function buildPricingRead(record, definition) {
  const primaryValue = asNumber(record[definition.primaryValueKey]);
  const secondaryValue = asNumber(record[definition.secondaryValueKey]);

  if (definition.mode === "payback") {
    const paybackMonths = secondaryValue > 0 ? primaryValue / secondaryValue : 0;

    return {
      pricingLabel: paybackMonths ? `${paybackMonths.toFixed(1)} meses` : "Sem aluguel",
      pricingRisk: !primaryValue || !secondaryValue || paybackMonths > 14,
      primaryValue,
      secondaryValue,
    };
  }

  const marginPercent = primaryValue > 0 ? ((primaryValue - secondaryValue) / primaryValue) * 100 : 0;

  return {
    pricingLabel: primaryValue ? formatPercent(marginPercent) : "Sem preco",
    pricingRisk: !primaryValue || primaryValue <= secondaryValue || marginPercent < 30,
    primaryValue,
    secondaryValue,
  };
}

function resolveCatalogIssues(row, definition) {
  return [
    row.stock <= row.minStock ? `Estoque ${row.stock}/${row.minStock}` : "",
    row.status === "manutencao" ? "Item em manutencao" : "",
    row.status === "cancelado" ? "Item cancelado" : "",
    row.pricingRisk ? (definition.mode === "payback" ? "Payback alto ou preco incompleto" : "Margem baixa ou preco incompleto") : "",
  ].filter(Boolean);
}

export function buildCatalogRows(collectionName, snapshot) {
  const definition = getDefinition(collectionName);

  return (snapshot[collectionName] || []).map((record) => {
    const stock = asNumber(record.stock);
    const minStock = asNumber(record.minStock);
    const pricing = buildPricingRead(record, definition);
    const row = {
      ...record,
      ...pricing,
      catalogLabel: definition.label,
      stock,
      minStock,
      stockValue: stock * pricing.primaryValue,
    };

    const issues = resolveCatalogIssues(row, definition);

    return {
      ...row,
      healthLabel: issues.length ? "Atencao" : "Saudavel",
      healthTone: issues.length ? "red" : "green",
      issues,
    };
  }).sort((first, second) => {
    if (first.issues.length !== second.issues.length) {
      return second.issues.length - first.issues.length;
    }

    return String(first.name).localeCompare(String(second.name));
  });
}

export function buildCatalogMetrics(collectionName, snapshot) {
  const rows = buildCatalogRows(collectionName, snapshot);
  const definition = getDefinition(collectionName);
  const lowStockRows = rows.filter((row) => row.stock <= row.minStock);
  const pricingRiskRows = rows.filter((row) => row.pricingRisk);
  const stockValue = rows.reduce((total, row) => total + row.stockValue, 0);

  return [
    {
      id: "items",
      icon: "boxes",
      label: definition.label,
      value: rows.length,
      detail: "itens cadastrados",
      tone: "blue",
    },
    {
      id: "stock",
      icon: "packagePlus",
      label: "Estoque baixo",
      value: lowStockRows.length,
      detail: `${rows.filter((row) => row.stock === 0).length} zerados`,
      tone: lowStockRows.length ? "yellow" : "green",
    },
    {
      id: "pricing",
      icon: "calculator",
      label: definition.mode === "payback" ? "Payback/preco" : "Margem/preco",
      value: pricingRiskRows.length,
      detail: "pontos de atencao",
      tone: pricingRiskRows.length ? "red" : "green",
    },
    {
      id: "value",
      icon: "money",
      label: "Potencial estoque",
      value: formatCurrency(stockValue),
      detail: `base ${definition.valueLabel.toLowerCase()}`,
      tone: "green",
    },
  ];
}

export function buildCatalogAlerts(collectionName, snapshot) {
  const rows = buildCatalogRows(collectionName, snapshot);

  return rows.filter((row) => row.issues.length).slice(0, 6);
}
