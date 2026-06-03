import { getNavigationLocal } from "./local/navigationLocalService.js";

/* --- SECAO: FACHADA DE NAVEGACAO ---
 * A sidebar e o header nao sabem se os itens vieram de mock local ou de banco remoto.
 */
export async function getNavigation() {
  return getNavigationLocal();
}
