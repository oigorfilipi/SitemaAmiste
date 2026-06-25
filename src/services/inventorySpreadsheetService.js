function normalizeSpreadsheetCell(cell) {
  return String(cell ?? "").trim();
}

function normalizeSpreadsheetRow(row) {
  if (Array.isArray(row)) {
    return row.map(normalizeSpreadsheetCell);
  }

  if (row && typeof row === "object") {
    return Object.values(row).map(normalizeSpreadsheetCell);
  }

  return [normalizeSpreadsheetCell(row)];
}

function parseSpreadsheetQuantity(value) {
  const normalizedValue = String(value || "")
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
  const numericValue = Number(normalizedValue);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

/* --- SECAO: NORMALIZACAO DO LEITOR XLSX ---
 * Algumas versoes do leitor retornam as linhas diretamente. Outras retornam
 * uma lista de planilhas no formato { sheet, data }. Ambos devem ser aceitos.
 */
function unwrapSpreadsheetRows(source) {
  if (Array.isArray(source)) {
    const wrappedRows = source.flatMap((entry) =>
      entry && !Array.isArray(entry) && Array.isArray(entry.data) ? entry.data : []
    );

    return wrappedRows.length ? wrappedRows : source;
  }

  if (source && typeof source === "object") {
    if (Array.isArray(source.data)) {
      return source.data;
    }

    return Object.values(source).flatMap(unwrapSpreadsheetRows);
  }

  return [];
}

export function spreadsheetRowsToInventoryRows(source = []) {
  const normalizedRows = unwrapSpreadsheetRows(source)
    .map(normalizeSpreadsheetRow)
    .filter((row) => row.some(Boolean));
  const firstRow = normalizedRows[0] || [];
  const normalizedHeader = firstRow.map((cell) =>
    cell.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  );
  const nameColumnIndex = normalizedHeader.findIndex((cell) =>
    ["nome", "nome do item", "item", "produto", "insumo", "maquina", "acessorio", "descricao"].some((label) =>
      cell.includes(label)
    )
  );
  const quantityColumnIndex = normalizedHeader.findIndex((cell) =>
    ["quant", "qtd", "quantidade", "estoque", "saldo"].some((label) => cell.includes(label))
  );
  const hasHeader = nameColumnIndex >= 0 && quantityColumnIndex >= 0;
  const resolvedNameIndex = hasHeader ? nameColumnIndex : 0;
  const resolvedQuantityIndex = hasHeader ? quantityColumnIndex : 1;
  const dataRows = hasHeader ? normalizedRows.slice(1) : normalizedRows;

  return dataRows
    .map((row) => ({
      name: row[resolvedNameIndex] || "",
      quantity: parseSpreadsheetQuantity(row[resolvedQuantityIndex]),
    }))
    .filter((row) => row.name);
}
