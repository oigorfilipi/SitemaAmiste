import { DATA_SOURCE } from "./dataSource.js";
import {
  getDatabaseSnapshot,
  getLocalDatabaseInfo,
  replaceLocalDatabase,
  resetLocalDatabase,
} from "./local/localDatabase.js";
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

export function buildDataSourceCards() {
  return [
    {
      id: "local",
      title: "Dados locais",
      status: DATA_SOURCE === "local" ? "ativo" : "pendente",
      statusLabel: DATA_SOURCE === "local" ? "Ativo" : "Disponivel",
      detail: "JSON e arrays mockados com persistencia em localStorage.",
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

export function buildBackupPayload(snapshot = getDatabaseSnapshot()) {
  const { storageKey } = getLocalDatabaseInfo();

  return {
    version: BACKUP_VERSION,
    generatedAt: new Date().toISOString(),
    storageKey,
    database: snapshot,
  };
}

export function downloadBackup(snapshot) {
  const dateLabel = new Date().toISOString().slice(0, 10);
  downloadJson(`amiste-erp-backup-${dateLabel}.json`, buildBackupPayload(snapshot));
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

    return { database, generatedAt: parsedPayload.generatedAt || "" };
  } catch {
    return { error: "JSON invalido. Confira se o arquivo foi colado inteiro." };
  }
}

export async function restoreBackupFromText(text) {
  const parsedBackup = parseBackupText(text);

  if (parsedBackup.error) {
    return parsedBackup;
  }

  await replaceLocalDatabase(parsedBackup.database);
  clearNotificationReads();
  return { ok: true, generatedAt: parsedBackup.generatedAt };
}

export async function resetSettingsDatabase() {
  await resetLocalDatabase();
  clearNotificationReads();
  return { ok: true };
}
