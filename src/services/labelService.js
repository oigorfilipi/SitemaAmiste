import { exportRecordsToCsv } from "./exportService.js";

export const LABEL_FILE_ACCEPT = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".html",
].join(",");

const LABEL_FILE_SIZE_LIMIT = 6 * 1024 * 1024;

const LABEL_EXPORT_COLUMNS = [
  { key: "name", label: "Nome" },
  { key: "category", label: "Categoria" },
  { key: "format", label: "Tipo" },
  { key: "fileSizeLabel", label: "Tamanho" },
  { key: "originalFileName", label: "Arquivo Original" },
  { key: "uploadedAt", label: "Enviado Em" },
];

function sanitizeFilename(value) {
  return String(value || "etiqueta")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getExtension(filename = "") {
  return String(filename).split(".").pop()?.toLowerCase() || "";
}

export function formatFileSize(bytes = 0) {
  const size = Number(bytes || 0);

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}

export function resolveFileFormat(fileLike = {}) {
  const extension = getExtension(fileLike.name || fileLike.originalFileName);
  const mimeType = String(fileLike.type || fileLike.mimeType || "").toLowerCase();

  if (mimeType.includes("pdf") || extension === "pdf") return "PDF";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || ["xls", "xlsx"].includes(extension)) return "Excel";
  if (mimeType.includes("word") || ["doc", "docx"].includes(extension)) return "Word";
  if (mimeType.includes("png") || extension === "png") return "PNG";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg") || ["jpg", "jpeg"].includes(extension)) return "JPG";
  if (mimeType.includes("webp") || extension === "webp") return "WEBP";
  if (mimeType.includes("svg") || extension === "svg") return "SVG";
  if (mimeType.includes("csv") || extension === "csv") return "CSV";
  if (mimeType.includes("text") || ["txt", "html"].includes(extension)) return extension.toUpperCase() || "Texto";

  return extension ? extension.toUpperCase() : "Arquivo";
}

function resolvePreviewKind(label = {}) {
  const mimeType = String(label.mimeType || "").toLowerCase();
  const format = String(label.format || "").toLowerCase();

  if (mimeType.includes("pdf") || format === "pdf") {
    return "pdf";
  }

  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "svg"].includes(format)) {
    return "image";
  }

  if (mimeType.startsWith("text/") || ["csv", "txt", "html"].includes(format)) {
    return "text";
  }

  return "unsupported";
}

function downloadDataUrl(filename, dataUrl) {
  if (typeof window === "undefined" || !dataUrl) {
    return;
  }

  const link = document.createElement("a");

  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Nao foi possivel ler o arquivo selecionado.")));
    reader.readAsDataURL(file);
  });
}

export function buildLabelCategoryOptions(snapshot) {
  const fixedOptions = [
    { label: "Categoria: Maquinas", value: "Maquinas" },
    { label: "Categoria: Insumos", value: "Insumos" },
    { label: "Categoria: Acessorios", value: "Acessorios" },
    { label: "Categoria: Institucional", value: "Institucional" },
  ];
  const machineOptions = (snapshot.machines || []).map((machine) => ({
    label: `Maquina: ${machine.name}`,
    value: `Maquina: ${machine.name}`,
  }));
  const supplyOptions = (snapshot.supplies || []).map((supply) => ({
    label: `Produto: ${supply.name}`,
    value: `Produto: ${supply.name}`,
  }));
  const accessoryOptions = (snapshot.accessories || []).map((accessory) => ({
    label: `Acessorio: ${accessory.name}`,
    value: `Acessorio: ${accessory.name}`,
  }));

  return [...fixedOptions, ...machineOptions, ...supplyOptions, ...accessoryOptions];
}

export async function buildUploadedLabelPayload({ category, description = "", file, name }) {
  if (!name?.trim()) {
    throw new Error("Informe o nome do arquivo/etiqueta.");
  }

  if (!category?.trim()) {
    throw new Error("Selecione uma categoria ou vinculo.");
  }

  if (!file) {
    throw new Error("Selecione o arquivo da etiqueta.");
  }

  if (file.size > LABEL_FILE_SIZE_LIMIT) {
    throw new Error(`Arquivo muito grande. Limite atual: ${formatFileSize(LABEL_FILE_SIZE_LIMIT)}.`);
  }

  const fileDataUrl = await readFileAsDataUrl(file);

  return {
    category,
    description,
    fileDataUrl,
    fileSize: file.size,
    format: resolveFileFormat(file),
    mimeType: file.type || "application/octet-stream",
    name: name.trim(),
    originalFileName: file.name,
    uploadedAt: new Date().toISOString(),
  };
}

export function buildLabelRows(records) {
  return records
    .map((label) => {
      const previewKind = resolvePreviewKind(label);
      const hasFile = Boolean(label.fileDataUrl);

      return {
        ...label,
        canPreview: hasFile,
        canPrint: hasFile && ["pdf", "image", "text"].includes(previewKind),
        fileSizeLabel: label.fileSize ? formatFileSize(label.fileSize) : "Sem arquivo",
        format: label.format || resolveFileFormat(label),
        hasFile,
        originalFileName: label.originalFileName || "Arquivo nao anexado",
        previewKind,
      };
    })
    .sort((first, second) => {
      const firstDate = new Date(first.uploadedAt || first.createdAt || 0).getTime();
      const secondDate = new Date(second.uploadedAt || second.createdAt || 0).getTime();

      return secondDate - firstDate;
    });
}

export function buildLabelMetrics(records) {
  const totalSize = records.reduce((total, label) => total + Number(label.fileSize || 0), 0);
  const formats = new Set(records.map((label) => label.format).filter(Boolean));
  const categories = new Set(records.map((label) => label.category).filter(Boolean));
  const printable = records.filter((label) => label.canPrint).length;

  return [
    {
      id: "labels",
      icon: "tags",
      label: "Arquivos enviados",
      value: records.length,
      detail: "repositorio de etiquetas",
      tone: "blue",
    },
    {
      id: "formats",
      icon: "fileText",
      label: "Tipos",
      value: formats.size,
      detail: Array.from(formats).join(", ") || "nenhum",
      tone: "green",
    },
    {
      id: "categories",
      icon: "layoutGrid",
      label: "Categorias",
      value: categories.size,
      detail: "vinculos cadastrados",
      tone: "yellow",
    },
    {
      id: "printable",
      icon: "printer",
      label: "Imprimiveis",
      value: printable,
      detail: `total ${formatFileSize(totalSize)}`,
      tone: printable ? "green" : "red",
    },
  ];
}

export function downloadLabelFile(label) {
  if (!label?.fileDataUrl) {
    return;
  }

  const extension = getExtension(label.originalFileName);
  const filename = `${sanitizeFilename(label.name)}${extension ? `.${extension}` : ""}`;

  downloadDataUrl(filename, label.fileDataUrl);
}

export function printLabelFile(label) {
  if (typeof window === "undefined" || !label?.canPrint || !label.fileDataUrl) {
    return;
  }

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    return;
  }

  const content = label.previewKind === "image"
    ? `<img src="${label.fileDataUrl}" alt="${label.name}" />`
    : `<iframe src="${label.fileDataUrl}" title="${label.name}"></iframe>`;

  printWindow.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${label.name}</title>
  <style>
    html, body { height: 100%; margin: 0; }
    body { align-items: center; background: #fff; display: flex; justify-content: center; }
    img { max-height: 100vh; max-width: 100vw; object-fit: contain; }
    iframe { border: 0; height: 100vh; width: 100vw; }
  </style>
</head>
<body>${content}</body>
</html>`);
  printWindow.document.close();
  printWindow.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 450);
}

export function exportLabels(records, snapshot) {
  exportRecordsToCsv({
    columns: LABEL_EXPORT_COLUMNS,
    filename: "etiquetas-arquivos",
    records,
    snapshot,
  });
}
