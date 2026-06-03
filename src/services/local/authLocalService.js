import { listRecords, updateRecord } from "./localDatabase.js";

const SESSION_KEY = "amiste_erp_auth_session_v1";
const LOCAL_AUTH_PIN = "1234";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readSession() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSession(userId) {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({
      createdAt: new Date().toISOString(),
      userId,
    }));
  }
}

function clearSession() {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

async function findActiveAccount(userId) {
  const accounts = await listRecords("accounts");
  return accounts.find((account) => account.id === userId && account.status === "ativo") || null;
}

export async function getCurrentUserLocal() {
  const session = readSession();

  if (!session?.userId) {
    return null;
  }

  const account = await findActiveAccount(session.userId);

  if (!account) {
    clearSession();
    return null;
  }

  return account;
}

export async function getSidebarUsersLocal() {
  const accounts = await listRecords("accounts");
  return accounts.filter((account) => account.status === "ativo");
}

export async function getLoginAccountsLocal() {
  return getSidebarUsersLocal();
}

export async function loginWithUserLocal({ pin, userId }) {
  if (pin !== LOCAL_AUTH_PIN) {
    throw new Error("PIN invalido para a sessao local.");
  }

  const account = await findActiveAccount(userId);

  if (!account) {
    throw new Error("Conta inativa ou nao encontrada.");
  }

  saveSession(account.id);

  /* --- SECAO: AUDITORIA DE SESSAO ---
   * A movimentacao de login fica isolada no servico local para manter componentes
   * sem acesso direto ao armazenamento da sessao.
   */
  return updateRecord(
    "accounts",
    account.id,
    { lastLogin: new Date().toISOString() },
    {
      action: "Login",
      details: "Entrada local no ERP.",
      module: "Sessao",
      title: account.displayName,
    }
  );
}

export async function logoutCurrentUserLocal() {
  const account = await getCurrentUserLocal();

  if (!account) {
    clearSession();
    return null;
  }

  await updateRecord(
    "accounts",
    account.id,
    {},
    {
      action: "Logout",
      details: "Saida local do ERP.",
      module: "Sessao",
      title: account.displayName,
    }
  );

  clearSession();
  return null;
}
