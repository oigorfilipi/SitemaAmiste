import { randomUUID } from "node:crypto";

const DEFAULT_API_URL = "https://amiste-erp-api.onrender.com";
const REQUIRED_CONFIRMATION = "APAGAR_DADOS_PRODUCAO_AMISTE";
const COLLECTION_NAMES = [
  "accounts",
  "accountRequests",
  "inventoryCounts",
  "inventoryLocations",
  "machineConfigs",
  "machines",
  "recipes",
  "supplies",
  "accessories",
  "clients",
  "checklists",
  "repairOrders",
  "proposals",
  "serviceSheets",
  "sales",
  "receivables",
  "payables",
  "labels",
  "options",
  "wikiSolutions",
  "history",
];

const ONE_PIXEL_PROFILE_PHOTO = [
  "data:image/png;base64",
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
].join(",");

const apiUrl = (process.env.BOOTSTRAP_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
const confirmation = process.env.CLEAN_RESET_CONFIRM;
const bootstrapEmail = process.env.BOOTSTRAP_EMAIL || "igor@amistecafe.local";
const bootstrapPassword = process.env.BOOTSTRAP_PASSWORD || "1234";
const shouldFinalizeDevAccount = process.env.FINALIZE_DEV_ACCOUNT !== "false";
const devTemporaryPassword = process.env.DEV_INITIAL_PASSWORD || buildPassword("Tmp");
const devFinalPassword = process.env.DEV_FINAL_PASSWORD || buildPassword("Dev");

if (confirmation !== REQUIRED_CONFIRMATION) {
  console.error(`Operacao bloqueada. Defina CLEAN_RESET_CONFIRM=${REQUIRED_CONFIRMATION} para confirmar a limpeza.`);
  process.exit(1);
}

validatePasswordStrength(devTemporaryPassword);
validatePasswordStrength(devFinalPassword);

/* --- SECAO: TOKEN OPERACIONAL TEMPORARIO --- */
const bootstrapLogin = await postJson("/api/auth/login", {
  email: bootstrapEmail,
  password: bootstrapPassword,
});

let operationalToken = bootstrapLogin.token;
let operationalUser = bootstrapLogin.user || {};

if (operationalUser.mustChangePassword) {
  const completed = await postJson(
    "/api/auth/first-login",
    {
      displayName: operationalUser.displayName || "Igor Filipi",
      password: buildPassword("Ops"),
      profilePhotoDataUrl: ONE_PIXEL_PROFILE_PHOTO,
    },
    operationalToken
  );
  operationalToken = completed.token;
  operationalUser = completed.user || {};
}

if (operationalUser.role !== "DEV") {
  throw new Error("A conta de bootstrap precisa ser DEV para restaurar o snapshot completo.");
}

/* --- SECAO: SNAPSHOT COMERCIAL LIMPO --- */
const cleanSnapshot = Object.fromEntries(COLLECTION_NAMES.map((collectionName) => [collectionName, []]));
const now = new Date().toISOString();

cleanSnapshot.accounts = [
  {
    id: "usr_igor_filipi_dev",
    activeSessions: [],
    accessHistory: [],
    avatarInitials: "IF",
    createdAt: now,
    displayName: "Igor Filipi",
    email: "igoreheitior@outlook.com",
    firstLoginCompletedAt: "",
    fullName: "Igor Filipi",
    lastLogin: "",
    mustChangePassword: true,
    password: "",
    phone: "34996845384",
    profilePhotoDataUrl: "",
    profilePhotoUrl: "",
    role: "DEV",
    status: "ativo",
    temporaryPassword: devTemporaryPassword,
    updatedAt: now,
  },
];

await putJson("/api/snapshot", cleanSnapshot, operationalToken);

/* --- SECAO: ATIVACAO OPCIONAL DA CONTA DEV FINAL --- */
let finalToken = "";
let finalUser = null;

if (shouldFinalizeDevAccount) {
  const login = await postJson("/api/auth/login", {
    email: "igoreheitior@outlook.com",
    password: devTemporaryPassword,
  });

  const completed = await postJson(
    "/api/auth/first-login",
    {
      displayName: "Igor Filipi",
      password: devFinalPassword,
      profilePhotoDataUrl: ONE_PIXEL_PROFILE_PHOTO,
    },
    login.token
  );

  finalToken = completed.token;
  finalUser = completed.user || {};
}

if (finalToken) {
  const snapshot = await getJson("/api/snapshot", finalToken);

  if (!Array.isArray(snapshot.accounts) || snapshot.accounts.length !== 1) {
    throw new Error("Validacao falhou: o snapshot final nao retornou exatamente uma conta.");
  }
}

console.log("Base de producao inicializada para uso comercial.");
console.log("Conta DEV principal:");
console.log("- E-mail: igoreheitior@outlook.com");
console.log(`- Senha ${shouldFinalizeDevAccount ? "final" : "provisoria"}: ${shouldFinalizeDevAccount ? devFinalPassword : devTemporaryPassword}`);
console.log(`- Primeiro acesso pendente: ${shouldFinalizeDevAccount ? "Nao" : "Sim"}`);
console.log(`- Role: ${finalUser?.role || "DEV"}`);

async function getJson(path, token) {
  return readJson(await fetch(`${apiUrl}${path}`, { headers: authHeaders(token) }), `GET ${path}`);
}

async function postJson(path, body, token = "") {
  return readJson(await fetch(`${apiUrl}${path}`, {
    body: JSON.stringify(body),
    headers: authHeaders(token),
    method: "POST",
  }), `POST ${path}`);
}

async function putJson(path, body, token) {
  return readJson(await fetch(`${apiUrl}${path}`, {
    body: JSON.stringify(body),
    headers: authHeaders(token),
    method: "PUT",
  }), `PUT ${path}`);
}

async function readJson(response, label) {
  let payload = {};

  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(`${label} falhou: HTTP ${response.status} ${payload.detail || payload.message || ""}`.trim());
  }

  return payload;
}

function authHeaders(token = "") {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildPassword(prefix) {
  return `${prefix}Amiste${randomUUID().replace(/-/g, "").slice(0, 12)}9`;
}

function validatePasswordStrength(password) {
  const value = String(password || "");

  if (
    value.length < 8 ||
    !/[a-z]/.test(value) ||
    !/[A-Z]/.test(value) ||
    !/[0-9]/.test(value)
  ) {
    throw new Error("A senha precisa ter 8+ caracteres, letra maiuscula, minuscula e numero.");
  }
}
