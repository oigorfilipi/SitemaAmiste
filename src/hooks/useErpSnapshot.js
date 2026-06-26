import { useCallback, useEffect, useRef, useState } from "react";
import {
  isSnapshotCacheFresh,
  readSnapshotCache,
  runCachedRequest,
  writeSnapshotCache,
} from "../services/dataCacheService.js";
import { getErpSnapshot } from "../services/erpService.js";

const EMPTY_SNAPSHOT = {
  accounts: [],
  machines: [],
  supplies: [],
  accessories: [],
  inventoryCounts: [],
  inventoryLocations: [],
  clients: [],
  checklists: [],
  machineConfigs: [],
  wikiSolutions: [],
  repairOrders: [],
  proposals: [],
  serviceSheets: [],
  sales: [],
  receivables: [],
  payables: [],
  recipes: [],
  labels: [],
  options: [],
  systemSettings: [],
  history: [],
};

export function useErpSnapshot() {
  const mountedRef = useRef(false);
  const [snapshot, setSnapshot] = useState(() => readSnapshotCache() || EMPTY_SNAPSHOT);
  const [isRefreshing, setIsRefreshing] = useState(() => !readSnapshotCache());

  const refresh = useCallback(async (options = {}) => {
    const { force = false, preferCache = false, silent = false } = options;
    const cachedSnapshot = readSnapshotCache();

    if (preferCache && !force && cachedSnapshot && isSnapshotCacheFresh()) {
      if (mountedRef.current) {
        setSnapshot(cachedSnapshot);
        setIsRefreshing(false);
      }

      return cachedSnapshot;
    }

    if (!silent && mountedRef.current) {
      setIsRefreshing(true);
    }

    try {
      const loadedSnapshot = await runCachedRequest("snapshot:erp", getErpSnapshot);
      const nextSnapshot = writeSnapshotCache(loadedSnapshot);

      if (mountedRef.current) {
        setSnapshot(nextSnapshot);
      }

      return nextSnapshot;
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const cachedSnapshot = readSnapshotCache();

    if (cachedSnapshot) {
      setSnapshot(cachedSnapshot);
      setIsRefreshing(false);
    }

    refresh({ preferCache: true, silent: Boolean(cachedSnapshot) });

    function refreshAfterDatabaseChange() {
      refresh({ force: true, silent: true });
    }

    window.addEventListener("amiste-db-change", refreshAfterDatabaseChange);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("amiste-db-change", refreshAfterDatabaseChange);
    };
  }, [refresh]);

  return { isRefreshing, snapshot, refresh };
}
