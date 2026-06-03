import { getDashboardLocal } from "./local/dashboardLocalService.js";

/* --- SECAO: FACHADA DO DASHBOARD ---
 * Os cards e tabelas usam o servico local e preservam um contrato unico para a UI.
 */
export async function getDashboard(role) {
  return getDashboardLocal(role);
}
