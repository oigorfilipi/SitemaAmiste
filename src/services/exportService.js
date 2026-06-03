function sanitizeFilename(value) {
  return String(value || "exportacao")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function formatCurrency(value) {
  const numericValue = Number(value);

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatCsvCell(value) {
  const normalizedValue = value === undefined || value === null ? "" : String(value);
  const escapedValue = normalizedValue.replace(/"/g, '""');

  return `"${escapedValue}"`;
}

function resolveRawValue(record, field, snapshot) {
  if (field.render) {
    return field.render(record, snapshot);
  }

  if (field.source) {
    const relatedRecord = snapshot[field.source]?.find((item) => item.id === record[field.key]);
    return relatedRecord?.[field.sourceLabel || "name"] || "";
  }

  const value = record[field.key];

  return value === undefined || value === null || value === "" ? "" : value;
}

function resolveExportValue(record, field, snapshot) {
  const value = resolveRawValue(record, field, snapshot);

  if (field.type === "currency") {
    return formatCurrency(value);
  }

  return value;
}

function buildRows(records, columns, snapshot) {
  const header = columns.map((column) => formatCsvCell(column.label));
  const body = records.map((record) =>
    columns.map((column) => formatCsvCell(resolveExportValue(record, column, snapshot)))
  );

  return [header, ...body].map((row) => row.join(";")).join("\r\n");
}

function downloadCsv(filename, csvContent) {
  if (typeof window === "undefined") {
    return;
  }

  /* --- SECAO: DOWNLOAD CSV ---
   * O BOM melhora a abertura direta no Excel com caracteres acentuados.
   */
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function buildExportColumnsFromConfig(config) {
  if (config.exportColumns) {
    return config.exportColumns;
  }

  if (config.columns) {
    return config.columns.filter((column) => !column.skipExport);
  }

  if (config.card) {
    return [
      { ...config.card.title, label: "Titulo" },
      config.card.subtitle ? { ...config.card.subtitle, label: "Subtitulo" } : null,
      config.card.statusKey ? { key: config.card.statusKey, label: "Status" } : null,
      ...(config.card.meta || []),
    ].filter(Boolean);
  }

  return [];
}

export function exportRecordsToCsv({ columns, filename, records, snapshot }) {
  const csvContent = buildRows(records, columns, snapshot);
  const datedFilename = `${sanitizeFilename(filename)}-${new Date().toISOString().slice(0, 10)}.csv`;

  downloadCsv(datedFilename, csvContent);
}
