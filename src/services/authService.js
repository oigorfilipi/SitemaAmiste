import {
  getCurrentUserLocal,
  getLoginAccountsLocal,
  getSidebarUsersLocal,
  completeFirstLoginLocal,
  changePasswordLocal,
  loginWithUserLocal,
  logoutCurrentUserLocal,
  requestAccountAccessLocal,
} from "./local/authLocalService.js";
import {
  completeFirstLoginApi,
  changePasswordApi,
  getCurrentUserApi,
  getLoginAccountsApi,
  getSidebarUsersApi,
  loginWithUserApi,
  logoutCurrentUserApi,
  requestAccountAccessApi,
} from "./api/authApiService.js";
import { isApiDataSource } from "./dataSource.js";

/* --- SECAO: FACHADA DE AUTENTICACAO ---
 * A camada publica de auth fica isolada para manter hooks e componentes sem
 * dependencia direta da implementacao local.
 */
export async function getCurrentUser() {
  if (isApiDataSource()) {
    return getCurrentUserApi();
  }

  return getCurrentUserLocal();
}

export async function getSidebarUsers() {
  if (isApiDataSource()) {
    return getSidebarUsersApi();
  }

  return getSidebarUsersLocal();
}

export async function getLoginAccounts() {
  if (isApiDataSource()) {
    return getLoginAccountsApi();
  }

  return getLoginAccountsLocal();
}

export async function loginWithUser(credentials) {
  if (isApiDataSource()) {
    return loginWithUserApi(credentials);
  }

  return loginWithUserLocal(credentials);
}

export async function completeFirstLogin(userId, payload) {
  if (isApiDataSource()) {
    return completeFirstLoginApi(userId, payload);
  }

  return completeFirstLoginLocal(userId, payload);
}

export async function changePassword(payload) {
  if (isApiDataSource()) {
    return changePasswordApi(payload);
  }

  return changePasswordLocal(payload);
}

export async function requestAccountAccess(payload) {
  if (isApiDataSource()) {
    return requestAccountAccessApi(payload);
  }

  return requestAccountAccessLocal(payload);
}

export async function logoutCurrentUser() {
  if (isApiDataSource()) {
    return logoutCurrentUserApi();
  }

  return logoutCurrentUserLocal();
}
