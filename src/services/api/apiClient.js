import { API_BASE_URL } from "../dataSource.js";

function normalizeBaseUrl(url = "") {
  return url.replace(/\/+$/, "");
}

function buildHeaders(headers = {}) {
  return {
    "Content-Type": "application/json",
    ...headers,
  };
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

  if (!baseUrl) {
    throw new Error("VITE_API_URL nao configurada para a fonte de dados API.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
