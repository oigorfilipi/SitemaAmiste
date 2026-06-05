import { erpSeed } from "../../mocks/erpSeed.mock.js";

const STORAGE_KEY = "amiste_erp_local_database_v1";
const AUTH_SESSION_KEY = "amiste_erp_auth_session_v1";
const STORAGE_COMPACT_HISTORY_LIMIT = 40;

const COLLECTION_LABELS = {
  accounts: "Contas",
  accountRequests: "Solicitacoes de Conta",
  inventoryCounts: "Historico de Contagem",
  machineConfigs: "Configuracoes de Maquina",
  machines: "Maquinas",
  recipes: "Receitas",
  supplies: "Insumos",
  accessories: "Acessorios",
  clients: "Clientes",
  checklists: "Checklists",
  repairOrders: "Ordens de Servico",
  proposals: "Portfolios",
  serviceSheets: "Fichas Operacionais",
  sales: "Vendas",
  receivables: "Contas a Receber",
  payables: "Contas a Pagar",
  labels: "Etiquetas",
  options: "Adicionar Opcoes",
  wikiSolutions: "Wiki",
  history: "Historico",
};

const AUDIT_IGNORED_FIELDS = new Set([
  "createdAt",
  "fileDataUrl",
  "imageDataUrl",
  "photoDataUrl",
  "profilePhotoDataUrl",
  "updatedAt",
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function emitDatabaseChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("amiste-db-change"));
  }
}

function readAuthSession() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(AUTH_SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function mergeSeedOptions(options = []) {
  const currentIds = new Set(options.map((option) => option.id));
  const missingSeedOptions = erpSeed.options.filter((option) => !currentIds.has(option.id));

  return [...options, ...clone(missingSeedOptions)];
}

function normalizeLabels(labels = []) {
  return labels.map((label) => {
    const { fileDataUrl, ...metadata } = label;

    /* --- SECAO: COMPACTACAO DE ETIQUETAS ---
     * Arquivos de etiquetas nao podem ficar dentro do banco principal em
     * localStorage. Mantemos apenas metadados para evitar erro de quota.
     */
    return fileDataUrl && !metadata.fileStorageKey
      ? { ...metadata, storageStatus: "arquivo-legado-nao-migrado" }
      : metadata;
  });
}

function hasInlineLabelFiles(database) {
  return (database?.labels || []).some((label) => Boolean(label.fileDataUrl));
}

function estimateTextBytes(text = "") {
  if (typeof Blob !== "undefined") {
    return new Blob([text]).size;
  }

  return String(text).length * 2;
}

function isStorageQuotaError(error) {
  const errorName = String(error?.name || "").toLowerCase();
  const errorMessage = String(error?.message || "").toLowerCase();

  return error?.code === 22 ||
    error?.code === 1014 ||
    errorName.includes("quota") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("exceeded");
}

function buildStorageError(error) {
  if (!isStorageQuotaError(error)) {
    return error;
  }

  return new Error("Armazenamento local cheio. Gere um backup, remova imagens/arquivos pesados ou limpe registros antigos antes de salvar novamente.");
}

function normalizeDatabase(database) {
  return Object.keys(erpSeed).reduce((normalized, collectionName) => {
    const records = Array.isArray(database?.[collectionName])
      ? database[collectionName]
      : clone(erpSeed[collectionName]);

    if (collectionName === "options") {
      normalized[collectionName] = mergeSeedOptions(records);
      return normalized;
    }

    normalized[collectionName] = collectionName === "labels" ? normalizeLabels(records) : records;

    return normalized;
  }, {});
}

function compactDatabaseForStorage(database) {
  const compactedDatabase = normalizeDatabase(database);

  /* --- SECAO: COMPACTACAO DE EMERGENCIA ---
   * Em caso de quota, preservamos os dados operacionais e reduzimos apenas o
   * historico antigo. Assim evitamos perda de cadastros enquanto mantemos
   * rastreabilidade recente.
   */
  compactedDatabase.history = (compactedDatabase.history || []).slice(0, STORAGE_COMPACT_HISTORY_LIMIT);

  return compactedDatabase;
}

function writeLocalDatabase(database, options = {}) {
  const { allowCompact = true, emitChange = false } = options;
  const normalizedDatabase = normalizeDatabase(database);
  const encodedDatabase = JSON.stringify(normalizedDatabase);

  try {
    window.localStorage.setItem(STORAGE_KEY, encodedDatabase);

    if (emitChange) {
      emitDatabaseChange();
    }

    return normalizedDatabase;
  } catch (error) {
    if (!allowCompact || !isStorageQuotaError(error)) {
      throw buildStorageError(error);
    }
  }

  const compactedDatabase = compactDatabaseForStorage(normalizedDatabase);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compactedDatabase));

    if (emitChange) {
      emitDatabaseChange();
    }

    return compactedDatabase;
  } catch (error) {
    throw buildStorageError(error);
  }
}

export function getDatabaseSnapshot() {
  if (!canUseLocalStorage()) {
    return clone(erpSeed);
  }

  const storedDatabase = window.localStorage.getItem(STORAGE_KEY);

  if (!storedDatabase) {
    const seededDatabase = clone(erpSeed);

    try {
      writeLocalDatabase(seededDatabase, { allowCompact: false });
    } catch {
      return seededDatabase;
    }

    return seededDatabase;
  }

  try {
    const parsedDatabase = JSON.parse(storedDatabase);
    const normalizedDatabase = normalizeDatabase(parsedDatabase);

    if (hasInlineLabelFiles(parsedDatabase)) {
      try {
        writeLocalDatabase(normalizedDatabase);
      } catch {
        return normalizedDatabase;
      }
    }

    return normalizedDatabase;
  } catch {
    const seededDatabase = clone(erpSeed);

    try {
      writeLocalDatabase(seededDatabase, { allowCompact: false });
    } catch {
      return seededDatabase;
    }

    return seededDatabase;
  }
}

export function getLocalDatabaseInfo() {
  const storedDatabase = canUseLocalStorage() ? window.localStorage.getItem(STORAGE_KEY) || "" : "";

  return {
    collectionNames: Object.keys(erpSeed),
    storageBytes: estimateTextBytes(storedDatabase),
    storageCompactHistoryLimit: STORAGE_COMPACT_HISTORY_LIMIT,
    storageKey: STORAGE_KEY,
  };
}

function saveDatabase(database) {
  if (canUseLocalStorage()) {
    writeLocalDatabase(database, { emitChange: true });
  }
}

function buildId(collectionName) {
  return `${collectionName}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function summarizeAuditValue(value) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Nao";
  }

  if (Array.isArray(value)) {
    return `${value.length} item(ns)`;
  }

  if (typeof value === "object") {
    return `${Object.keys(value).length} campo(s)`;
  }

  const text = String(value);

  return text.length > 90 ? `${text.slice(0, 87)}...` : text;
}

function valuesAreEqual(firstValue, secondValue) {
  return JSON.stringify(firstValue ?? "") === JSON.stringify(secondValue ?? "");
}

function buildRecordSnapshotDetails(record = {}) {
  const priorityFields = [
    "name",
    "code",
    "status",
    "clientId",
    "machineId",
    "category",
    "value",
    "totalValue",
    "date",
  ];
  const fields = priorityFields
    .filter((fieldName) => record[fieldName] !== undefined && record[fieldName] !== "")
    .map((fieldName) => `${fieldName}: ${summarizeAuditValue(record[fieldName])}`);

  return fields.length ? fields.join(" | ") : `ID: ${record.id || "-"}`;
}

function buildChangeDetails(previousRecord = {}, nextRecord = {}) {
  const fieldNames = Array.from(new Set([
    ...Object.keys(previousRecord),
    ...Object.keys(nextRecord),
  ])).filter((fieldName) => !AUDIT_IGNORED_FIELDS.has(fieldName));
  const changes = fieldNames
    .filter((fieldName) => !valuesAreEqual(previousRecord[fieldName], nextRecord[fieldName]))
    .map((fieldName) => `${fieldName}: ${summarizeAuditValue(previousRecord[fieldName])} -> ${summarizeAuditValue(nextRecord[fieldName])}`);

  if (!changes.length) {
    return "Registro salvo sem alteracoes relevantes nos campos auditaveis.";
  }

  return changes.slice(0, 12).join("\n");
}

function resolveHistoryActor(database, overrides = {}) {
  const session = readAuthSession();
  const account = (database.accounts || []).find((record) => record.id === session?.userId);

  /* --- SECAO: ATOR DA AUDITORIA ---
   * O historico usa a sessao local atual para evitar que acoes de qualquer perfil
   * sejam registradas como DEV. Overrides continuam disponiveis para eventos de sistema.
   */
  return {
    userName: overrides.userName || account?.displayName || account?.name || "Sistema Local",
    role: overrides.role || account?.role || "SYS",
  };
}

function addHistoryEntry(database, collectionName, action, title, details = "", overrides = {}) {
  if (collectionName === "history") {
    return;
  }

  const actor = resolveHistoryActor(database, overrides);
  const entry = {
    id: buildId("history"),
    date: new Date().toISOString(),
    module: overrides.module || COLLECTION_LABELS[collectionName] || collectionName,
    action,
    title,
    userName: actor.userName,
    role: actor.role,
    details,
  };

  database.history = [entry, ...(database.history || [])].slice(0, 120);
}

export async function listRecords(collectionName) {
  const database = getDatabaseSnapshot();
  return clone(database[collectionName] || []);
}

export async function createRecord(collectionName, payload) {
  const database = getDatabaseSnapshot();
  const now = new Date().toISOString();
  const record = {
    ...payload,
    id: payload.id || buildId(collectionName),
    createdAt: now,
    updatedAt: now,
  };

  database[collectionName] = [record, ...(database[collectionName] || [])];
  addHistoryEntry(
    database,
    collectionName,
    "Criou",
    record.name || record.code || record.description || record.origin || record.id,
    `Registro criado. ${buildRecordSnapshotDetails(record)}`
  );
  saveDatabase(database);

  return clone(record);
}

export async function updateRecord(collectionName, id, payload, historyConfig = {}) {
  const database = getDatabaseSnapshot();
  const records = database[collectionName] || [];
  const existingRecord = records.find((record) => record.id === id);

  if (!existingRecord) {
    throw new Error(`Registro nao encontrado em ${COLLECTION_LABELS[collectionName] || collectionName}.`);
  }

  const updatedRecord = {
    ...existingRecord,
    ...payload,
    id,
    updatedAt: new Date().toISOString(),
  };

  database[collectionName] = records.map((record) => (record.id === id ? updatedRecord : record));
  addHistoryEntry(
    database,
    collectionName,
    historyConfig.action || "Editou",
    historyConfig.title || updatedRecord.name || updatedRecord.code || updatedRecord.description || id,
    historyConfig.details || buildChangeDetails(existingRecord, updatedRecord),
    historyConfig
  );
  saveDatabase(database);

  return clone(updatedRecord);
}

export async function deleteRecord(collectionName, id) {
  const database = getDatabaseSnapshot();
  const records = database[collectionName] || [];
  const deletedRecord = records.find((record) => record.id === id);

  if (!deletedRecord) {
    throw new Error(`Registro nao encontrado em ${COLLECTION_LABELS[collectionName] || collectionName}.`);
  }

  database[collectionName] = records.filter((record) => record.id !== id);
  addHistoryEntry(
    database,
    collectionName,
    "Excluiu",
    deletedRecord?.name || deletedRecord?.code || id,
    `Registro excluido. ${buildRecordSnapshotDetails(deletedRecord)}`
  );
  saveDatabase(database);

  return clone(deletedRecord);
}

export async function setCollection(collectionName, records) {
  const database = getDatabaseSnapshot();
  database[collectionName] = records;
  addHistoryEntry(database, collectionName, "Atualizou", `Colecao ${COLLECTION_LABELS[collectionName] || collectionName}`);
  saveDatabase(database);

  return clone(records);
}

export async function replaceLocalDatabase(database) {
  const normalizedDatabase = normalizeDatabase(database);

  /* --- SECAO: RESTAURACAO LOCAL ---
   * A normalizacao preserva o contrato de colecoes do seed atual. Isso impede que
   * backups antigos quebrem telas novas quando o schema local evoluir.
   */
  saveDatabase(normalizedDatabase);

  return clone(normalizedDatabase);
}

export async function resetLocalDatabase() {
  const seededDatabase = clone(erpSeed);

  if (canUseLocalStorage()) {
    writeLocalDatabase(seededDatabase, {
      allowCompact: false,
      emitChange: true,
    });
  }

  return seededDatabase;
}
