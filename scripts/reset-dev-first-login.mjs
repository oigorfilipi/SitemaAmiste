import { pbkdf2Sync, randomBytes } from "node:crypto";

const PASSWORD_ITERATIONS = 210_000;
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const temporaryPassword = process.env.DEV_TEMPORARY_PASSWORD || buildTemporaryPassword();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de recriar a conta DEV.");
  process.exit(1);
}

validatePasswordStrength(temporaryPassword);

const now = new Date().toISOString();
const devAccount = {
  id: "usr_igor_filipi_dev",
  accessHistory: [
    {
      at: now,
      label: "Conta DEV recriada para teste de primeiro acesso",
    },
  ],
  activeSessions: [],
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

/* --- SECAO: REMOCAO DA CONTA DEV ATUAL --- */
const accountRows = await supabaseRequest("/rest/v1/erp_records?collection_name=eq.accounts&select=record_id,payload");
const matchingAccounts = accountRows.filter((row) =>
  row.record_id === devAccount.id ||
  String(row.payload?.email || "").trim().toLowerCase() === devAccount.email
);

for (const row of matchingAccounts) {
  await supabaseRequest(
    `/rest/v1/erp_records?collection_name=eq.accounts&record_id=eq.${encodeURIComponent(row.record_id)}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    }
  );
}

/* --- SECAO: RECRIACAO PARA PRIMEIRO ACESSO --- */
await supabaseRequest("/rest/v1/erp_records", {
  method: "POST",
  headers: { Prefer: "return=minimal" },
  body: JSON.stringify({
    collection_name: "accounts",
    record_id: devAccount.id,
    payload: devAccount,
  }),
});

console.log("Conta DEV recriada para teste de primeiro acesso.");
console.log(`E-mail: ${devAccount.email}`);
console.log(`Senha provisoria: ${temporaryPassword}`);
console.log("Ao entrar, o sistema deve abrir a tela de criar nova senha, nome e foto.");

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

  if (!response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }

  return response.json();
}

function buildTemporaryPassword() {
  return `TempAmiste${randomBytes(7).toString("base64url")}9`;
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
