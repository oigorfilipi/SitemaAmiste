const DB_NAME = "amiste_erp_label_files_v1";
const STORE_NAME = "labelFiles";
const DB_VERSION = 1;

function canUseIndexedDb() {
  return typeof window !== "undefined" && Boolean(window.indexedDB);
}

function openDatabase() {
  if (!canUseIndexedDb()) {
    return Promise.reject(new Error("Armazenamento local de arquivos indisponivel neste navegador."));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener("upgradeneeded", () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    });

    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(new Error("Nao foi possivel abrir o repositorio local de arquivos.")));
  });
}

function runStoreAction(mode, action) {
  return openDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = action(store);

        request.addEventListener("success", () => resolve(request.result));
        request.addEventListener("error", () => reject(new Error("Falha ao acessar o arquivo salvo localmente.")));
        transaction.addEventListener("complete", () => database.close());
        transaction.addEventListener("abort", () => {
          database.close();
          reject(new Error("Operacao de arquivo local interrompida."));
        });
      })
  );
}

export function buildLabelFileStorageKey(labelId) {
  return `label_file_${labelId}`;
}

export async function saveLabelFile(storageKey, file) {
  const record = {
    blob: file,
    id: storageKey,
    name: file.name || storageKey,
    savedAt: new Date().toISOString(),
    size: file.size,
    type: file.type || "application/octet-stream",
  };

  await runStoreAction("readwrite", (store) => store.put(record));
}

export async function getLabelFile(storageKey) {
  if (!storageKey) {
    return null;
  }

  try {
    const record = await runStoreAction("readonly", (store) => store.get(storageKey));
    return record?.blob || null;
  } catch {
    return null;
  }
}

export async function deleteLabelFile(storageKey) {
  if (!storageKey) {
    return;
  }

  await runStoreAction("readwrite", (store) => store.delete(storageKey));
}

export async function clearLabelFiles() {
  try {
    await runStoreAction("readwrite", (store) => store.clear());
    return true;
  } catch {
    return false;
  }
}
