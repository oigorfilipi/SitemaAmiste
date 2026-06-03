import { useCallback, useEffect, useState } from "react";
import { createEntity, deleteEntity, listEntity, updateEntity } from "../services/erpService.js";

export function useCollection(collectionName) {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const loadedRecords = await listEntity(collectionName);
    setRecords(loadedRecords);
    setIsLoading(false);
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

  async function createRecord(payload) {
    const createdRecord = await createEntity(collectionName, payload);
    await refresh();
    return createdRecord;
  }

  async function updateRecord(id, payload, historyConfig) {
    const updatedRecord = await updateEntity(collectionName, id, payload, historyConfig);
    await refresh();
    return updatedRecord;
  }

  async function deleteRecord(id) {
    const deletedRecord = await deleteEntity(collectionName, id);
    await refresh();
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
