import { apiRequest } from "./api/apiClient.js";
import { isApiDataSource } from "./dataSource.js";

export const ADMIN_PASSWORD_SETTING_ID = "system_admin_password";
export const DEFAULT_ADMIN_PASSWORD = "AmisteADM2026";
export const ADMIN_AUTHORIZED_ROLES = ["DEV", "DON", "CEO"];
export const CRITICAL_ACCOUNT_ROLES = ["DEV", "DON", "CEO"];

export function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

export function canManageAdminPassword(user) {
  return ADMIN_AUTHORIZED_ROLES.includes(normalizeRole(user?.role));
}

export function isCriticalAccountRole(role) {
  return CRITICAL_ACCOUNT_ROLES.includes(normalizeRole(role));
}

export function getAdminPasswordSetting(records = []) {
  return records.find((record) => record.id === ADMIN_PASSWORD_SETTING_ID || record.key === "adminPassword") || null;
}

export function getAdminPasswordValue(records = []) {
  return getAdminPasswordSetting(records)?.value || DEFAULT_ADMIN_PASSWORD;
}

function verifyLocalLoginPassword(currentUser, loginPassword) {
  const expectedPassword = currentUser?.password || currentUser?.temporaryPassword || "";

  if (!expectedPassword || String(loginPassword || "") !== String(expectedPassword)) {
    throw new Error("Senha de login invalida.");
  }
}

export async function revealAdminPassword({ currentUser, loginPassword, settingsRecords = [] }) {
  if (!canManageAdminPassword(currentUser)) {
    throw new Error("Somente DONO e DEV podem visualizar a Senha ADM.");
  }

  if (isApiDataSource()) {
    const response = await apiRequest("/api/auth/admin-password/reveal", {
      body: JSON.stringify({ loginPassword }),
      method: "POST",
    });

    return response.adminPassword;
  }

  verifyLocalLoginPassword(currentUser, loginPassword);
  return getAdminPasswordValue(settingsRecords);
}

export async function updateAdminPassword({
  createRecord,
  currentUser,
  loginPassword,
  newAdminPassword,
  settingsRecords = [],
  updateRecord,
}) {
  if (!canManageAdminPassword(currentUser)) {
    throw new Error("Somente DONO e DEV podem alterar a Senha ADM.");
  }

  if (!String(newAdminPassword || "").trim()) {
    throw new Error("Informe a nova Senha ADM.");
  }

  if (isApiDataSource()) {
    const response = await apiRequest("/api/auth/admin-password/update", {
      body: JSON.stringify({ loginPassword, newAdminPassword }),
      method: "POST",
    });

    return response.adminPassword;
  }

  verifyLocalLoginPassword(currentUser, loginPassword);

  const setting = getAdminPasswordSetting(settingsRecords);
  const payload = {
    description: "Senha exigida para criar ou promover usuarios DON/DEV.",
    key: "adminPassword",
    name: "Senha ADM",
    value: String(newAdminPassword).trim(),
  };

  if (setting) {
    const updatedSetting = await updateRecord(setting.id, payload, {
      action: "Alterou Senha ADM",
      details: "Senha ADM atualizada por usuario autorizado.",
      module: "Seguranca",
      title: "Senha ADM",
    });

    return updatedSetting.value;
  }

  const createdSetting = await createRecord({
    ...payload,
    id: ADMIN_PASSWORD_SETTING_ID,
  });

  return createdSetting.value;
}

export async function verifyAdminPassword({ adminPassword, currentUser, settingsRecords = [] }) {
  if (!canManageAdminPassword(currentUser)) {
    throw new Error("Somente DONO e DEV podem confirmar a Senha ADM.");
  }

  if (!String(adminPassword || "").trim()) {
    throw new Error("Informe a Senha ADM.");
  }

  if (isApiDataSource()) {
    await apiRequest("/api/auth/admin-password/verify", {
      body: JSON.stringify({ adminPassword }),
      method: "POST",
    });

    return true;
  }

  if (String(adminPassword).trim() !== getAdminPasswordValue(settingsRecords)) {
    throw new Error("Senha ADM invalida.");
  }

  return true;
}
