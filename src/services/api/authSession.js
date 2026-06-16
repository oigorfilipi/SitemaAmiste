const API_AUTH_SESSION_KEY = "amiste_erp_api_auth_session_v1";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getApiAuthToken() {
  if (!canUseLocalStorage()) {
    return "";
  }

  try {
    return JSON.parse(window.localStorage.getItem(API_AUTH_SESSION_KEY) || "null")?.token || "";
  } catch {
    window.localStorage.removeItem(API_AUTH_SESSION_KEY);
    return "";
  }
}

export function saveApiAuthSession(token) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(API_AUTH_SESSION_KEY, JSON.stringify({
    createdAt: new Date().toISOString(),
    token,
  }));
}

export function clearApiAuthSession() {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(API_AUTH_SESSION_KEY);
  }
}

export function hasApiAuthSession() {
  return Boolean(getApiAuthToken());
}
