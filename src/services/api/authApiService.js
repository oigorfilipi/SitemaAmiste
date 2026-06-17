import { apiRequest } from "./apiClient.js";
import {
  clearApiAuthSession,
  hasApiAuthSession,
  saveApiAuthSession,
} from "./authSession.js";

function emitDatabaseChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("amiste-db-change"));
  }
}

function saveLoginResponse(response) {
  if (response?.token) {
    saveApiAuthSession(response.token);
  }

  return response?.user || null;
}

export async function getCurrentUserApi() {
  if (!hasApiAuthSession()) {
    return null;
  }

  try {
    const response = await apiRequest("/api/auth/me");
    return response.user || null;
  } catch (error) {
    clearApiAuthSession();
    return null;
  }
}

export async function getSidebarUsersApi() {
  if (!hasApiAuthSession()) {
    return [];
  }

  return apiRequest("/api/auth/sidebar-users");
}

export async function getLoginAccountsApi() {
  return [];
}

export async function loginWithUserApi(credentials) {
  const user = saveLoginResponse(await apiRequest("/api/auth/login", {
    auth: false,
    body: JSON.stringify(credentials),
    method: "POST",
  }));

  emitDatabaseChange();
  return user;
}

export async function completeFirstLoginApi(userId, payload) {
  const user = saveLoginResponse(await apiRequest("/api/auth/first-login", {
    body: JSON.stringify(payload),
    method: "POST",
  }));

  emitDatabaseChange();
  return user;
}

export async function changePasswordApi(payload) {
  return apiRequest("/api/auth/change-password", {
    auth: false,
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function requestAccountAccessApi(payload) {
  return apiRequest("/api/auth/request-account", {
    auth: false,
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function logoutCurrentUserApi() {
  clearApiAuthSession();
  emitDatabaseChange();
  return null;
}
