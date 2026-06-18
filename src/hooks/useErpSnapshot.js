import { useCallback, useEffect, useState } from "react";
import { getErpSnapshot } from "../services/erpService.js";

export function useErpSnapshot() {
  const [snapshot, setSnapshot] = useState(() => ({
    accounts: [],
    machines: [],
    supplies: [],
    accessories: [],
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
  }));

  const refresh = useCallback(async () => {
    setSnapshot(await getErpSnapshot());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("amiste-db-change", refresh);

    return () => {
      window.removeEventListener("amiste-db-change", refresh);
    };
  }, [refresh]);

  return { snapshot, refresh };
}
