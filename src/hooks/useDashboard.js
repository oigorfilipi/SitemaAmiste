import { useCallback, useEffect, useState } from "react";
import { getDashboard } from "../services/dashboardService.js";
import { useAsyncResource } from "./useAsyncResource.js";

export function useDashboard(role = "VEN") {
  const [version, setVersion] = useState(0);
  const loadDashboard = useCallback(() => getDashboard(role), [role, version]);

  useEffect(() => {
    function refreshDashboard() {
      setVersion((currentVersion) => currentVersion + 1);
    }

    window.addEventListener("amiste-db-change", refreshDashboard);

    return () => {
      window.removeEventListener("amiste-db-change", refreshDashboard);
    };
  }, []);

  return useAsyncResource(loadDashboard, {
    metrics: [],
    alerts: [],
    latestChecklists: [],
    latestOperations: [],
  });
}
