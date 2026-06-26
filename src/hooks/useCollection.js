import { useCallback, useEffect, useRef, useState } from "react";
import {
  isCollectionCacheFresh,
  readCollectionCache,
  runCachedRequest,
  updateCollectionCache,
  writeCollectionCache,
} from "../services/dataCacheService.js";
import { createEntity, deleteEntity, listEntity, updateEntity } from "../services/erpService.js";

export function useCollection(collectionName) {
  const mountedRef = useRef(false);
  const [records, setRecords] = useState(() => readCollectionCache(collectionName) || []);
  const [isLoading, setIsLoading] = useState(() => !readCollectionCache(collectionName));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async (options = {}) => {
    const { force = false, preferCache = false, silent = false } = options;
    const cachedRecords = readCollectionCache(collectionName);

    if (preferCache && !force && cachedRecords && isCollectionCacheFresh(collectionName)) {
      if (mountedRef.current) {
        setRecords(cachedRecords);
        setIsLoading(false);
        setIsRefreshing(false);
      }

      return cachedRecords;
    }

    if (mountedRef.current) {
      if (silent || cachedRecords) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
    }

    try {
      const loadedRecords = await runCachedRequest(
        `collection:${collectionName}`,
        () => listEntity(collectionName)
      );
      const nextRecords = writeCollectionCache(collectionName, loadedRecords);

      if (mountedRef.current) {
        setRecords(nextRecords);
      }

      return nextRecords;
    } catch {
      return cachedRecords || [];
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [collectionName]);

  useEffect(() => {
    mountedRef.current = true;
    const cachedRecords = readCollectionCache(collectionName);

    if (cachedRecords) {
      setRecords(cachedRecords);
      setIsLoading(false);
    } else {
      setRecords([]);
      setIsLoading(true);
    }

    refresh({ preferCache: true, silent: Boolean(cachedRecords) });

    /* --- SECAO: SINCRONIZACAO LOCAL ---
     * Todas as paginas escutam o mesmo evento para refletir mudancas feitas em outro modulo.
     */
    function refreshAfterDatabaseChange() {
      refresh({ force: true, silent: true });
    }

    window.addEventListener("amiste-db-change", refreshAfterDatabaseChange);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("amiste-db-change", refreshAfterDatabaseChange);
    };
  }, [refresh]);

  function refreshInBackground() {
    refresh({ force: true, silent: true }).catch(() => {
      // A operacao principal ja retornou. A proxima sincronizacao global tenta novamente.
    });
  }

  async function createRecord(payload) {
    const createdRecord = await createEntity(collectionName, payload);

    const nextRecords = updateCollectionCache(collectionName, (currentRecords) => [
      createdRecord,
      ...currentRecords.filter((record) => record.id !== createdRecord.id),
    ]);

    setRecords(nextRecords);
    refreshInBackground();

    return createdRecord;
  }

  async function updateRecord(id, payload, historyConfig) {
    const updatedRecord = await updateEntity(collectionName, id, payload, historyConfig);

    const nextRecords = updateCollectionCache(collectionName, (currentRecords) =>
      currentRecords.map((record) => (record.id === id ? updatedRecord : record))
    );

    setRecords(nextRecords);
    refreshInBackground();

    return updatedRecord;
  }

  async function deleteRecord(id) {
    const deletedRecord = await deleteEntity(collectionName, id);

    const nextRecords = updateCollectionCache(collectionName, (currentRecords) =>
      currentRecords.filter((record) => record.id !== id)
    );

    setRecords(nextRecords);
    refreshInBackground();

    return deletedRecord;
  }

  return {
    records,
    isLoading,
    isRefreshing,
    refresh,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
