import {
  getCurrentUserLocal,
  getLoginAccountsLocal,
  getSidebarUsersLocal,
  loginWithUserLocal,
  logoutCurrentUserLocal,
} from "./local/authLocalService.js";

/* --- SECAO: FACHADA DE AUTENTICACAO ---
 * A camada publica de auth fica isolada para manter hooks e componentes sem
 * dependencia direta da implementacao local.
 */
export async function getCurrentUser() {
  return getCurrentUserLocal();
}

export async function getSidebarUsers() {
  return getSidebarUsersLocal();
}

export async function getLoginAccounts() {
  return getLoginAccountsLocal();
}

export async function loginWithUser(credentials) {
  return loginWithUserLocal(credentials);
}

export async function logoutCurrentUser() {
  return logoutCurrentUserLocal();
}
