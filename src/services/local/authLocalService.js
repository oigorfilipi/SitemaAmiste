import { createRecord, listRecords, updateRecord } from "./localDatabase.js";
import { validatePasswordStrength } from "../passwordPolicyService.js";

const SESSION_KEY = "amiste_erp_auth_session_v1";
const LOCAL_DEFAULT_PASSWORD = "1234";

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

async function findActiveAccountByEmail(email) {
  const accounts = await listRecords("accounts");
  const normalizedEmail = String(email || "").trim().toLowerCase();

  return accounts.find((account) =>
    account.status === "ativo" &&
    String(account.email || "").trim().toLowerCase() === normalizedEmail
  ) || null;
}

function buildAccessHistory(account, label) {
  const history = Array.isArray(account.accessHistory) ? account.accessHistory : [];

  return [
    {
      at: new Date().toISOString(),
      label,
    },
    ...history,
  ].slice(0, 20);
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
  const accounts = await getSidebarUsersLocal();

  return accounts.map(({ password, temporaryPassword, ...account }) => account);
}

export async function loginWithUserLocal({ email, password }) {
  const account = await findActiveAccountByEmail(email);

  if (!account) {
    throw new Error("E-mail ou senha invalidos.");
  }

  const expectedPassword = account.password || account.temporaryPassword || LOCAL_DEFAULT_PASSWORD;

  if (String(password || "") !== String(expectedPassword)) {
    throw new Error("E-mail ou senha invalidos.");
  }

  saveSession(account.id);

  /* --- SECAO: AUDITORIA DE SESSAO ---
   * A movimentacao de login fica isolada no servico local para manter componentes
   * sem acesso direto ao armazenamento da sessao.
   */
  return updateRecord(
    "accounts",
    account.id,
    {
      accessHistory: buildAccessHistory(account, "Login corporativo local"),
      activeSessions: [
        {
          createdAt: new Date().toISOString(),
          device: "Navegador local",
          id: `session_${Date.now()}`,
        },
        ...(account.activeSessions || []),
      ].slice(0, 5),
      lastLogin: new Date().toISOString(),
    },
    {
      action: "Login",
      details: "Entrada local no ERP.",
      module: "Sessao",
      title: account.displayName,
    }
  );
}

export async function completeFirstLoginLocal(userId, payload) {
  const account = await findActiveAccount(userId);

  if (!account) {
    throw new Error("Conta ativa nao encontrada para concluir o primeiro acesso.");
  }

  if (!payload.password?.trim()) {
    throw new Error("Informe a nova senha.");
  }

  const passwordError = validatePasswordStrength(payload.password);

  if (passwordError) {
    throw new Error(passwordError);
  }

  if (!payload.displayName?.trim()) {
    throw new Error("Informe o nome de exibicao.");
  }

  if (!payload.profilePhotoDataUrl && !payload.profilePhotoUrl) {
    throw new Error("Adicione uma foto de perfil para continuar.");
  }

  return updateRecord(
    "accounts",
    userId,
    {
      accessHistory: buildAccessHistory(account, "Primeiro acesso concluido"),
      displayName: payload.displayName.trim(),
      firstLoginCompletedAt: new Date().toISOString(),
      fullName: account.fullName || payload.displayName.trim(),
      mustChangePassword: false,
      password: payload.password,
      profilePhotoDataUrl: payload.profilePhotoDataUrl || account.profilePhotoDataUrl || "",
      profilePhotoUrl: payload.profilePhotoUrl || account.profilePhotoUrl || "",
      temporaryPassword: "",
    },
    {
      action: "Primeiro Login",
      details: "Usuario concluiu senha, nome de exibicao e foto obrigatoria.",
      module: "Sessao",
      title: payload.displayName,
    }
  );
}

export async function requestAccountAccessLocal(payload) {
  const accounts = await listRecords("accounts");
  const requestType = payload.requestType || "accountAccess";
  const relatedAccount = accounts.find((account) =>
    account.status === "ativo" &&
    String(account.email || "").trim().toLowerCase() === String(payload.email || "").trim().toLowerCase()
  );
  const recipients = accounts
    .filter((account) => account.role === "DEV" || account.role === "CEO")
    .map((account) => ({
      email: account.email,
      name: account.displayName,
      phone: account.phone,
      role: account.role,
    }));

  return createRecord("accountRequests", {
    ...payload,
    dispatches: recipients.flatMap((recipient) => [
      { channel: "email", recipient: recipient.email, status: "simulado" },
      { channel: "whatsapp", recipient: recipient.phone, status: "simulado" },
    ]),
    fullName: payload.fullName || relatedAccount?.fullName || "",
    relatedAccountId: relatedAccount?.id || "",
    requestTitle: requestType === "passwordReset" ? "Redefinicao de senha" : "Solicitacao de conta",
    requestType,
    recipients,
    requestedAt: new Date().toISOString(),
    status: "pendente",
  });
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
    {
      activeSessions: [],
      accessHistory: buildAccessHistory(account, "Logout local"),
    },
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
