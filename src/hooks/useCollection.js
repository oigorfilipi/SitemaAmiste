import { useCallback, useEffect, useState } from "react";
import { createEntity, deleteEntity, listEntity, updateEntity } from "../services/erpService.js";

export function useCollection(collectionName) {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedRecords = await listEntity(collectionName);
      setRecords(loadedRecords);
      return loadedRecords;
    } catch {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    refresh();

    /* --- SECAO: SINCRONIZACAO LOCAL ---
     * Todas as paginas escutam o mesmo evento para refletir mudancas feitas em outro modulo.
     */
    window.addEventListener("amiste-db-change", refresh);

    return () => {
      window.removeEventListener("amiste-db-change", refresh);
    };
  }, [refresh]);

  function refreshInBackground() {
    refresh().catch(() => {
      // A operacao principal ja retornou. A proxima sincronizacao global tenta novamente.
    });
  }

  async function createRecord(payload) {
    const createdRecord = await createEntity(collectionName, payload);

    setRecords((currentRecords) => [
      createdRecord,
      ...currentRecords.filter((record) => record.id !== createdRecord.id),
    ]);
    refreshInBackground();

    return createdRecord;
  }

  async function updateRecord(id, payload, historyConfig) {
    const updatedRecord = await updateEntity(collectionName, id, payload, historyConfig);

    setRecords((currentRecords) =>
      currentRecords.map((record) => (record.id === id ? updatedRecord : record))
    );
    refreshInBackground();

    return updatedRecord;
  }

  async function deleteRecord(id) {
    const deletedRecord = await deleteEntity(collectionName, id);

    setRecords((currentRecords) => currentRecords.filter((record) => record.id !== id));
    refreshInBackground();

    return deletedRecord;
  }

  return {
    records,
    isLoading,
    refresh,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
