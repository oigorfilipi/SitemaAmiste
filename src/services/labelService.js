import { exportRecordsToCsv } from "./exportService.js";

const LABEL_EXPORT_COLUMNS = [
  { key: "name", label: "Arquivo" },
  { key: "category", label: "Categoria" },
  { key: "linkedTo", label: "Vinculo" },
  { key: "format", label: "Formato" },
  { key: "description", label: "Descricao" },
];

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeFilename(value) {
  return String(value || "etiqueta")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function downloadBlob(filename, content, type) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function resolveLinkedMachine(label, snapshot) {
  const linkedTo = String(label.linkedTo || "").toLowerCase();

  return (snapshot.machines || []).find((machine) =>
    [machine.id, machine.name, machine.brand, machine.category].some((value) =>
      String(value || "").toLowerCase() === linkedTo
    )
  );
}

export function buildLabelRows(records, snapshot) {
  return records.map((label) => {
    const linkedMachine = resolveLinkedMachine(label, snapshot);
    const category = label.category || "Universal";
    const format = label.format || "SVG";

    return {
      ...label,
      category,
      format,
      linkedName: linkedMachine?.name || label.linkedTo || "Generico",
      previewTone: category === "Maquinas" ? "machine" : "brand",
      specLine: linkedMachine
        ? `${linkedMachine.brand} | ${linkedMachine.voltage} | ${linkedMachine.hydraulic === "Sim" ? "Hidrica" : "Galao"}`
        : "Material institucional",
    };
  });
}

export function buildLabelMetrics(records) {
  const machineLabels = records.filter((label) => label.category === "Maquinas").length;
  const universalLabels = records.filter((label) => label.category === "Universal").length;
  const formats = new Set(records.map((label) => label.format).filter(Boolean));

  return [
    {
      id: "labels",
      icon: "tags",
      label: "Layouts ativos",
      value: records.length,
      detail: "arquivos no repositorio",
      tone: "blue",
    },
    {
      id: "machines",
      icon: "coffee",
      label: "Maquinas",
      value: machineLabels,
      detail: "layouts vinculados",
      tone: machineLabels ? "green" : "yellow",
    },
    {
      id: "universal",
      icon: "layoutGrid",
      label: "Universais",
      value: universalLabels,
      detail: "materiais de marca",
      tone: "yellow",
    },
    {
      id: "formats",
      icon: "download",
      label: "Formatos",
      value: formats.size,
      detail: Array.from(formats).join(", ") || "nenhum",
      tone: "green",
    },
  ];
}

export function buildLabelSvg(label) {
  const width = 720;
  const height = 320;
  const accent = label.previewTone === "machine" ? "#B91C1C" : "#0F766E";
  const linkedName = escapeXml(label.linkedName);
  const title = escapeXml(label.name);
  const category = escapeXml(label.category);
  const specLine = escapeXml(label.specLine);
  const description = escapeXml(label.description);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="24" fill="#111111"/>
  <rect x="28" y="28" width="664" height="264" rx="18" fill="#ffffff"/>
  <rect x="28" y="28" width="120" height="264" rx="18" fill="${accent}"/>
  <text x="88" y="96" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#ffffff">AMISTE</text>
  <text x="88" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff">CAFE</text>
  <text x="178" y="92" font-family="Arial, sans-serif" font-size="15" font-weight="800" fill="#777777">${category}</text>
  <text x="178" y="138" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="#111111">${title}</text>
  <text x="178" y="180" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="${accent}">${linkedName}</text>
  <text x="178" y="218" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#555555">${specLine}</text>
  <text x="178" y="252" font-family="Arial, sans-serif" font-size="14" fill="#777777">${description}</text>
</svg>`;
}

export function downloadLabelLayout(label) {
  const filename = `${sanitizeFilename(label.name)}-${new Date().toISOString().slice(0, 10)}.svg`;

  downloadBlob(filename, buildLabelSvg(label), "image/svg+xml;charset=utf-8");
}

export function exportLabels(records, snapshot) {
  exportRecordsToCsv({
    columns: LABEL_EXPORT_COLUMNS,
    filename: "etiquetas-identidade-visual",
    records,
    snapshot,
  });
}
