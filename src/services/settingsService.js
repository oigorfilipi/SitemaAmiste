import { DATA_SOURCE } from "./dataSource.js";
import {
  getDatabaseSnapshot,
  getLocalDatabaseInfo,
  replaceLocalDatabase,
  resetLocalDatabase,
} from "./local/localDatabase.js";
import {
  clearLabelFiles,
  getLabelFile,
  saveLabelFile,
} from "./labelFileStorageService.js";
import { clearNotificationReads } from "./notificationReadService.js";

const BACKUP_VERSION = "amiste-local-v1";

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function downloadJson(filename, payload) {
  if (typeof window === "undefined") {
    return;
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
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

function countRecords(snapshot, collectionName) {
  return Array.isArray(snapshot[collectionName]) ? snapshot[collectionName].length : 0;
}

function blobToDataUrl(blob) {
  if (!blob || typeof FileReader === "undefined") {
    return Promise.resolve("");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error("Nao foi possivel preparar arquivo de etiqueta para backup.")));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl = "", fallbackType = "application/octet-stream") {
  if (typeof window === "undefined" || !dataUrl.includes(",")) {
    return null;
  }

  const [header, encodedData] = dataUrl.split(",");
  const mimeType = header.match(/data:(.*?);base64/)?.[1] || fallbackType;
  const binary = window.atob(encodedData);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new Blob([bytes], { type: mimeType });
}

async function buildLabelFileBackups(snapshot) {
  const labels = Array.isArray(snapshot?.labels) ? snapshot.labels : [];
  const files = [];

  for (const label of labels) {
    if (!label.fileStorageKey) {
      continue;
    }

    const blob = await getLabelFile(label.fileStorageKey);
    const dataUrl = await blobToDataUrl(blob);

    if (dataUrl) {
      files.push({
        dataUrl,
        name: label.originalFileName || label.name || label.fileStorageKey,
        size: blob.size || label.fileSize || 0,
        storageKey: label.fileStorageKey,
        type: blob.type || label.mimeType || "application/octet-stream",
      });
    }
  }

  return files;
}

async function restoreLabelFileBackups(files = []) {
  if (!Array.isArray(files) || !files.length) {
    return 0;
  }

  let restoredFiles = 0;

  for (const file of files) {
    if (!file?.storageKey || !file?.dataUrl) {
      continue;
    }

    const blob = dataUrlToBlob(file.dataUrl, file.type);

    if (!blob) {
      continue;
    }

    try {
      await saveLabelFile(file.storageKey, new File([blob], file.name || file.storageKey, { type: blob.type }));
      restoredFiles += 1;
    } catch {
      try {
        await saveLabelFile(file.storageKey, blob);
        restoredFiles += 1;
      } catch {
        // Mantemos o restore do banco principal mesmo se um anexo local falhar.
      }
    }
  }

  return restoredFiles;
}

export function buildDataSourceCards() {
  return [
    {
      id: "local",
      title: "Dados locais",
      status: DATA_SOURCE === "local" ? "ativo" : "pendente",
      statusLabel: DATA_SOURCE === "local" ? "Ativo" : "Disponivel",
      detail: "Persistencia local em JSON com armazenamento no navegador.",
      items: ["CRUD modular", "Historico local", "Backup manual"],
    },
  ];
}

export function buildSettingsMetrics(snapshot) {
  const { collectionNames } = getLocalDatabaseInfo();
  const totalRecords = collectionNames.reduce((total, collectionName) => total + countRecords(snapshot, collectionName), 0);
  const configuredOptions = countRecords(snapshot, "options");
  const auditEvents = countRecords(snapshot, "history");
  const activeAccounts = (snapshot.accounts || []).filter((account) => account.status === "ativo").length;

  return [
    {
      id: "records",
      label: "Registros locais",
      value: totalRecords,
      detail: `${collectionNames.length} colecoes versionadas`,
      icon: "archive",
      tone: "blue",
    },
    {
      id: "options",
      label: "Opcoes do ERP",
      value: configuredOptions,
      detail: "dropdowns e parametros",
      icon: "layoutGrid",
      tone: "green",
    },
    {
      id: "audit",
      label: "Eventos de auditoria",
      value: auditEvents,
      detail: "ultimas movimentacoes",
      icon: "history",
      tone: "yellow",
    },
    {
      id: "accounts",
      label: "Usuarios ativos",
      value: activeAccounts,
      detail: "permissoes locais",
      icon: "users",
      tone: "red",
    },
  ];
}

export function buildCollectionRows(snapshot) {
  const { collectionNames } = getLocalDatabaseInfo();

  return collectionNames
    .map((collectionName) => ({
      id: collectionName,
      name: collectionName,
      count: countRecords(snapshot, collectionName),
      lastUpdate: (snapshot[collectionName] || []).reduce((latest, record) => {
        const updatedAt = new Date(record.updatedAt || record.createdAt || record.date || 0).getTime();
        return updatedAt > latest ? updatedAt : latest;
      }, 0),
    }))
    .sort((firstRow, secondRow) => secondRow.count - firstRow.count);
}

export function formatCollectionUpdate(timestamp) {
  return timestamp ? formatDateTime(new Date(timestamp)) : "-";
}

export async function buildBackupPayload(snapshot = getDatabaseSnapshot()) {
  const { storageKey } = getLocalDatabaseInfo();

  return {
    database: snapshot,
    generatedAt: new Date().toISOString(),
    labelFiles: await buildLabelFileBackups(snapshot),
    storageKey,
    version: BACKUP_VERSION,
  };
}

export async function downloadBackup(snapshot) {
  const dateLabel = new Date().toISOString().slice(0, 10);
  downloadJson(`amiste-erp-backup-${dateLabel}.json`, await buildBackupPayload(snapshot));
}

export function parseBackupText(text) {
  if (!text.trim()) {
    return { error: "Cole o JSON de backup antes de restaurar." };
  }

  try {
    const parsedPayload = JSON.parse(text);
    const database = parsedPayload.database || parsedPayload;
    const { collectionNames } = getLocalDatabaseInfo();

    if (!database || typeof database !== "object" || Array.isArray(database)) {
      return {
        error: "Backup invalido. O JSON precisa conter um objeto de dados.",
      };
    }

    const knownCollections = collectionNames.filter((collectionName) => Object.hasOwn(database, collectionName));
    const invalidCollections = knownCollections.filter((collectionName) => !Array.isArray(database[collectionName]));

    if (!knownCollections.length) {
      return {
        error: "Backup invalido. Nenhuma colecao conhecida foi encontrada.",
      };
    }

    if (invalidCollections.length) {
      return {
        error: `Backup invalido. Colecoes com formato incorreto: ${invalidCollections.slice(0, 4).join(", ")}.`,
      };
    }

    return {
      database,
      generatedAt: parsedPayload.generatedAt || "",
      labelFiles: Array.isArray(parsedPayload.labelFiles) ? parsedPayload.labelFiles : [],
    };
  } catch {
    return { error: "JSON invalido. Confira se o arquivo foi colado inteiro." };
  }
}

export async function restoreBackupFromText(text) {
  const parsedBackup = parseBackupText(text);

  if (parsedBackup.error) {
    return parsedBackup;
  }

  await clearLabelFiles();
  await replaceLocalDatabase(parsedBackup.database);
  const restoredLabelFiles = await restoreLabelFileBackups(parsedBackup.labelFiles);
  clearNotificationReads();

  return { ok: true, generatedAt: parsedBackup.generatedAt, restoredLabelFiles };
}

export async function resetSettingsDatabase() {
  await clearLabelFiles();
  await resetLocalDatabase();
  clearNotificationReads();
  return { ok: true };
}
