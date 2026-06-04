import { erpSeed } from "../../mocks/erpSeed.mock.js";

const STORAGE_KEY = "amiste_erp_local_database_v1";
const AUTH_SESSION_KEY = "amiste_erp_auth_session_v1";

const COLLECTION_LABELS = {
  accounts: "Contas",
  accountRequests: "Solicitacoes de Conta",
  inventoryCounts: "Historico de Contagem",
  machines: "Maquinas",
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
  history: "Historico",
};

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

export function getDatabaseSnapshot() {
  if (!canUseLocalStorage()) {
    return clone(erpSeed);
  }

  const storedDatabase = window.localStorage.getItem(STORAGE_KEY);

  if (!storedDatabase) {
    const seededDatabase = clone(erpSeed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seededDatabase));
    return seededDatabase;
  }

  try {
    const parsedDatabase = JSON.parse(storedDatabase);
    const normalizedDatabase = normalizeDatabase(parsedDatabase);

    if (hasInlineLabelFiles(parsedDatabase)) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedDatabase));
      } catch {
        return normalizedDatabase;
      }
    }

    return normalizedDatabase;
  } catch {
    const seededDatabase = clone(erpSeed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seededDatabase));
    return seededDatabase;
  }
}

export function getLocalDatabaseInfo() {
  return {
    collectionNames: Object.keys(erpSeed),
    storageKey: STORAGE_KEY,
  };
}

function saveDatabase(database) {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeDatabase(database)));
    emitDatabaseChange();
  }
}

function buildId(collectionName) {
  return `${collectionName}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
  addHistoryEntry(database, collectionName, "Criou", record.name || record.code || record.description || record.origin || record.id);
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
    historyConfig.details || "",
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
  addHistoryEntry(database, collectionName, "Excluiu", deletedRecord?.name || deletedRecord?.code || id);
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seededDatabase));
    emitDatabaseChange();
  }

  return seededDatabase;
}
