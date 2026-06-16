import { pbkdf2Sync, randomBytes } from "node:crypto";

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

const REQUIRED_CONFIRMATION = "APAGAR_DADOS_PRODUCAO_AMISTE";
const PASSWORD_ITERATIONS = 210_000;

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const confirmation = process.env.CLEAN_RESET_CONFIRM;
const temporaryPassword = process.env.DEV_INITIAL_PASSWORD || buildTemporaryPassword();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar a limpeza.");
  process.exit(1);
}

if (confirmation !== REQUIRED_CONFIRMATION) {
  console.error(`Operacao bloqueada. Defina CLEAN_RESET_CONFIRM=${REQUIRED_CONFIRMATION} para confirmar a limpeza.`);
  process.exit(1);
}

validatePasswordStrength(temporaryPassword);

const now = new Date().toISOString();
const devAccount = {
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
  passwordHash: hashPassword(temporaryPassword),
  phone: "34996845384",
  profilePhotoDataUrl: "",
  profilePhotoUrl: "",
  role: "DEV",
  status: "ativo",
  temporaryPassword,
  updatedAt: now,
};

/* --- SECAO: LIMPEZA CONTROLADA DAS COLECOES --- */
for (const collectionName of COLLECTION_NAMES) {
  await supabaseRequest(
    `/rest/v1/erp_records?collection_name=eq.${encodeURIComponent(collectionName)}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    }
  );
}

/* --- SECAO: CONTA DEV INICIAL --- */
await supabaseRequest("/rest/v1/erp_records", {
  method: "POST",
  headers: { Prefer: "return=minimal" },
  body: JSON.stringify({
    collection_name: "accounts",
    record_id: devAccount.id,
    payload: devAccount,
  }),
});

console.log("Base de producao limpa com sucesso.");
console.log("Conta DEV criada:");
console.log(`- E-mail: ${devAccount.email}`);
console.log(`- Senha provisoria: ${temporaryPassword}`);
console.log("Ao entrar pela primeira vez, o sistema vai exigir nova senha, nome de exibicao e foto.");

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha no Supabase (${response.status}): ${await response.text()}`);
  }
}

function buildTemporaryPassword() {
  return `Amiste${randomBytes(9).toString("base64url")}9`;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const digest = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 32, "sha256").toString("hex");

  return `pbkdf2_sha256$${PASSWORD_ITERATIONS}$${salt}$${digest}`;
}

function validatePasswordStrength(password) {
  const value = String(password || "");

  if (
    value.length < 8 ||
    !/[a-z]/.test(value) ||
    !/[A-Z]/.test(value) ||
    !/[0-9]/.test(value)
  ) {
    throw new Error("A senha provisoria precisa ter 8+ caracteres, letra maiuscula, minuscula e numero.");
  }
}
