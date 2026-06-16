import { API_BASE_URL } from "../dataSource.js";
import { getApiAuthToken } from "./authSession.js";

function normalizeBaseUrl(url = "") {
  return url.replace(/\/+$/, "");
}

function authHeaders(headers = {}) {
  const token = getApiAuthToken();

  return token
    ? { ...headers, Authorization: `Bearer ${token}` }
    : headers;
}

async function readError(response) {
  try {
    const payload = await response.json();
    return payload.detail || payload.message || `Erro HTTP ${response.status}.`;
  } catch {
    return `Erro HTTP ${response.status}.`;
  }
}

async function assertOk(response) {
  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response;
}

export async function uploadApiFile(file, folder = "uploads") {
  const formData = new FormData();
  formData.append("file", file);

  const response = await assertOk(await fetch(`${normalizeBaseUrl(API_BASE_URL)}/api/files?folder=${encodeURIComponent(folder)}`, {
    body: formData,
    headers: authHeaders(),
    method: "POST",
  }));

  return response.json();
}

export async function getApiFileBlob(storageKey) {
  const signedResponse = await assertOk(await fetch(`${normalizeBaseUrl(API_BASE_URL)}/api/files/signed-url?storageKey=${encodeURIComponent(storageKey)}`, {
    headers: authHeaders(),
  }));
  const { url } = await signedResponse.json();

  if (!url) {
    return null;
  }

  const fileResponse = await assertOk(await fetch(url));
  return fileResponse.blob();
}

export async function deleteApiFile(storageKey) {
  await assertOk(await fetch(`${normalizeBaseUrl(API_BASE_URL)}/api/files?storageKey=${encodeURIComponent(storageKey)}`, {
    headers: authHeaders(),
    method: "DELETE",
  }));
}
