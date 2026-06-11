import { getErpSnapshot } from "./erpService.js";
import { buildDashboardFromDatabase } from "./local/dashboardLocalService.js";

/* --- SECAO: FACHADA DO DASHBOARD ---
 * O dashboard trabalha sobre o snapshot atual, seja localStorage ou API.
 */
export async function getDashboard(role) {
  return buildDashboardFromDatabase(await getErpSnapshot(), role);
}
