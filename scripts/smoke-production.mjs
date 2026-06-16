const DEFAULT_API_URL = "https://amiste-erp-api.onrender.com";
const DEFAULT_WEB_URL = "https://sitema-interno-amiste.vercel.app";

const apiUrl = (process.env.SMOKE_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
const webUrl = (process.env.SMOKE_WEB_URL || DEFAULT_WEB_URL).replace(/\/+$/, "");
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function assertOk(response, label) {
  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(`${label} falhou: HTTP ${response.status} ${payload.detail || payload.message || ""}`.trim());
  }

  return payload;
}

async function checkPublicHealth() {
  const webResponse = await fetch(webUrl);
  assert(webResponse.ok, `Frontend indisponivel: HTTP ${webResponse.status}`);

  const health = await assertOk(await fetch(`${apiUrl}/api/health/database`), "Health database");
  assert(health.database === "ok", "Banco nao retornou status ok.");

  console.log("ok frontend e health/database");
}

async function checkAuthenticatedFlow() {
  if (!email || !password) {
    console.log("skip auth: defina SMOKE_EMAIL e SMOKE_PASSWORD para validar login.");
    return;
  }

  const login = await assertOk(await fetch(`${apiUrl}/api/auth/login`, {
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }), "Login");

  const token = login.token;
  const user = login.user || {};
  assert(token, "Login nao retornou token.");
  assert(user.id, "Login nao retornou usuario.");
  console.log(`ok login role=${user.role || "-"} firstLogin=${Boolean(user.mustChangePassword)}`);

  const authHeaders = { Authorization: `Bearer ${token}` };
  await assertOk(await fetch(`${apiUrl}/api/auth/me`, { headers: authHeaders }), "Auth me");
  console.log("ok auth/me");

  if (user.mustChangePassword) {
    const snapshotResponse = await fetch(`${apiUrl}/api/snapshot`, { headers: authHeaders });
    const snapshotPayload = await readJson(snapshotResponse);
    assert(snapshotResponse.status === 403, "Conta pendente de primeiro acesso deveria bloquear snapshot.");
    assert(String(snapshotPayload.detail || "").includes("primeiro acesso"), "Bloqueio de primeiro acesso retornou mensagem inesperada.");
    console.log("ok bloqueio operacional ate concluir primeiro acesso");
    return;
  }

  const snapshot = await assertOk(await fetch(`${apiUrl}/api/snapshot`, { headers: authHeaders }), "Snapshot");
  assert(Array.isArray(snapshot.accounts), "Snapshot nao retornou colecao accounts.");
  console.log(`ok snapshot collections=${Object.keys(snapshot).length}`);

  if (user.role === "DEV") {
    const backup = await assertOk(await fetch(`${apiUrl}/api/backup`, { headers: authHeaders }), "Backup");
    assert(Array.isArray(backup.accounts), "Backup DEV nao retornou accounts.");
    console.log("ok backup DEV");
  }

  const formData = new FormData();
  formData.append("file", new Blob(["Amiste smoke test"], { type: "text/plain" }), "amiste-smoke.txt");
  const upload = await assertOk(await fetch(`${apiUrl}/api/files?folder=smoke-tests`, {
    body: formData,
    headers: authHeaders,
    method: "POST",
  }), "Upload Storage");
  assert(upload.storageKey, "Upload nao retornou storageKey.");

  const signed = await assertOk(await fetch(`${apiUrl}/api/files/signed-url?storageKey=${encodeURIComponent(upload.storageKey)}`, {
    headers: authHeaders,
  }), "URL assinada");
  assert(signed.url, "URL assinada nao retornou url.");

  const fileResponse = await fetch(signed.url);
  assert(fileResponse.ok, `Download de arquivo falhou: HTTP ${fileResponse.status}`);
  await fileResponse.arrayBuffer();

  await assertOk(await fetch(`${apiUrl}/api/files?storageKey=${encodeURIComponent(upload.storageKey)}`, {
    headers: authHeaders,
    method: "DELETE",
  }), "Delete Storage");
  console.log("ok storage upload/signed-url/download/delete");
}

try {
  await checkPublicHealth();
  await checkAuthenticatedFlow();
  console.log("smoke production concluido");
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
}
