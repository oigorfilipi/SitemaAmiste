import { API_BASE_URL } from "../dataSource.js";
import { getApiAuthToken } from "./authSession.js";

function normalizeBaseUrl(url = "") {
  return url.replace(/\/+$/, "");
}

function buildHeaders(headers = {}, options = {}) {
  const token = options.auth === false ? "" : getApiAuthToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const resolvedHeaders = isFormData
    ? { ...headers }
    : {
      "Content-Type": "application/json",
      ...headers,
    };

  if (token) {
    resolvedHeaders.Authorization = `Bearer ${token}`;
  }

  return resolvedHeaders;
}

async function readErrorMessage(response) {
  try {
    const payload = await response.json();
    return payload.detail || payload.message || `Erro HTTP ${response.status}.`;
  } catch {
    return `Erro HTTP ${response.status}.`;
  }
}

export async function apiRequest(path, options = {}) {
  const baseUrl = normalizeBaseUrl(API_BASE_URL);
  const { auth, ...requestOptions } = options;

  if (!baseUrl) {
    throw new Error("VITE_API_URL nao configurada para a fonte de dados API.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...requestOptions,
    headers: buildHeaders(options.headers, { auth, body: requestOptions.body }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
