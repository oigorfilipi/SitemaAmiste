import { useMemo, useState } from "react";
import AppIcon from "../../components/atoms/AppIcon.jsx";
import Button from "../../components/atoms/Button.jsx";
import TextArea from "../../components/atoms/TextArea.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import Modal from "../../components/molecules/Modal.jsx";

const ACCOUNT_REQUEST_COOLDOWN_KEY = "amiste_erp_public_account_request_v1";
const HAS_ACCOUNT_HINT_KEY = "amiste_erp_has_account_hint_v1";
const REQUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const REQUEST_INITIAL_STATE = {
  description: "Necessitando de criacao de CONTA.",
  fullName: "",
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readAccountRequestState() {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNT_REQUEST_COOLDOWN_KEY) || "null");
  } catch {
    window.localStorage.removeItem(ACCOUNT_REQUEST_COOLDOWN_KEY);
    return null;
  }
}

function getOrCreateDeviceKey() {
  if (!canUseLocalStorage()) {
    return `device_${Date.now()}`;
  }

  const currentState = readAccountRequestState();

  if (currentState?.deviceKey) {
    return currentState.deviceKey;
  }

  const deviceKey = `device_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(ACCOUNT_REQUEST_COOLDOWN_KEY, JSON.stringify({ deviceKey }));

  return deviceKey;
}

function saveAccountRequestState(deviceKey) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(ACCOUNT_REQUEST_COOLDOWN_KEY, JSON.stringify({
    deviceKey,
    requestedAt: new Date().toISOString(),
  }));
}

function isRequestCooldownActive() {
  const currentState = readAccountRequestState();

  if (!currentState?.requestedAt) {
    return false;
  }

  const requestedAt = new Date(currentState.requestedAt);

  return !Number.isNaN(requestedAt.getTime()) && Date.now() - requestedAt.getTime() < REQUEST_COOLDOWN_MS;
}

function readHasAccountHint() {
  if (!canUseLocalStorage()) {
    return false;
  }

  return window.localStorage.getItem(HAS_ACCOUNT_HINT_KEY) === "true";
}

function saveHasAccountHint() {
  if (canUseLocalStorage()) {
    window.localStorage.setItem(HAS_ACCOUNT_HINT_KEY, "true");
  }
}

export default function LoginPage({ isLoading, onLogin, onRequestAccess }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [requestData, setRequestData] = useState(REQUEST_INITIAL_STATE);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(() => isRequestCooldownActive());
  const [loginUnlocked, setLoginUnlocked] = useState(() => readHasAccountHint() || isRequestCooldownActive());
  const deviceKey = useMemo(() => getOrCreateDeviceKey(), []);
  const isLoginLocked = !loginUnlocked;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await onLogin({ email, password });
      setPassword("");
    } catch (loginError) {
      setError(loginError.message || "Nao foi possivel iniciar a sessao.");
    }
  }

  async function handleRequestAccess(event) {
    event.preventDefault();
    setRequestMessage("");

    try {
      await onRequestAccess({
        description: requestData.description || REQUEST_INITIAL_STATE.description,
        deviceKey,
        fullName: requestData.fullName || "Novo Usuario",
      });
      saveAccountRequestState(deviceKey);
      setRequestSent(true);
      setLoginUnlocked(true);
      setRequestOpen(false);
      setRequestMessage("Pedido registrado. DONO e DEV receberam uma notificacao interna no sistema.");
      setRequestData(REQUEST_INITIAL_STATE);
    } catch (requestError) {
      setRequestMessage(requestError.message || "Nao foi possivel registrar o pedido.");
    }
  }

  function updateRequestField(fieldName, value) {
    setRequestData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));
    setRequestMessage("");
  }

  function handleHasAccount() {
    saveHasAccountHint();
    setLoginUnlocked(true);
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-amiste-white lg:grid-cols-2">
      {/* --- SECAO: LOGIN CORPORATIVO --- */}
      <section className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-amiste-red px-8 py-10 text-white">
        <div />
        <div className={`mx-auto w-full max-w-[480px] transition duration-300 ${isLoginLocked ? "pointer-events-none select-none opacity-45 blur-[2px]" : ""}`}>
          <div>
            <h1 className="font-display text-4xl font-black">Bem-vindo de Volta</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/75">
              Insira suas credenciais para acessar a plataforma
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">E-mail Corporativo</span>
              <TextInput
                autoComplete="email"
                className="[&_input]:border-white/35 [&_input]:bg-white [&_input]:text-amiste-black [&_input]:placeholder:text-amiste-gray/45"
                icon="user"
                placeholder="usuario@empresa.com"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">Senha</span>
              <TextInput
                autoComplete="current-password"
                className="[&_input]:border-white/35 [&_input]:bg-white [&_input]:text-amiste-black [&_input]:placeholder:text-amiste-gray/45"
                icon="shield"
                placeholder="Digite sua senha"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-bold text-white">
                {error}
              </div>
            ) : null}

            <Button className="mt-3 w-full border-white bg-white font-black text-amiste-red hover:border-white hover:bg-zinc-100 hover:text-red-900" disabled={isLoading} icon="shield" type="submit">
              Entrar no Sistema
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap justify-end gap-3 text-sm font-bold text-white/80">
            {requestSent ? (
              <span className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs">
                Pedido de conta enviado. O botao volta em ate 24h se voce ainda nao tiver acesso.
              </span>
            ) : (
              <button type="button" onClick={() => setRequestOpen(true)}>
                Pedido de Conta
              </button>
            )}
          </div>
        </div>

        {isLoginLocked ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-amiste-red/20 px-6 backdrop-blur-sm">
            <div className="w-full max-w-[360px] rounded-3xl border border-white/30 bg-white/15 p-6 text-center shadow-2xl">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-amiste-red shadow-sm">
                <AppIcon name="fileClock" size={24} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-black text-white">Acesso ao Sistema</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/75">
                Solicite uma conta para que DONO ou DEV liberem seu acesso.
              </p>
              {requestSent ? (
                <div className="mt-5 rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-xs font-bold text-white">
                  Pedido enviado. O login foi liberado neste dispositivo enquanto a solicitacao estiver ativa.
                </div>
              ) : (
                <Button
                  className="mt-5 w-full border-white bg-white text-amiste-red hover:border-white hover:bg-zinc-100 hover:text-red-900"
                  icon="fileClock"
                  onClick={() => setRequestOpen(true)}
                >
                  Pedido de Conta
                </Button>
              )}
              <button
                className="mt-3 text-xs font-black text-white/80 underline decoration-white/35 underline-offset-4 transition hover:text-white"
                type="button"
                onClick={handleHasAccount}
              >
                Ja tenho conta
              </button>
            </div>
          </div>
        ) : null}

        <footer className="text-xs font-semibold text-white/65">
          C 2026/27 Amiste Cafe. Todos os Direitos Reservados.
        </footer>

        <Modal
          description="O pedido vira uma solicitacao interna para DONO e DEV dentro do sistema."
          open={requestOpen}
          title="Pedido de Conta"
          onClose={() => setRequestOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleRequestAccess}>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Nome</span>
              <TextInput placeholder="Ex: Igor Filipi" value={requestData.fullName} onChange={(event) => updateRequestField("fullName", event.target.value)} />
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Descricao</span>
              <TextArea required placeholder="Descreva o acesso que precisa." value={requestData.description} onChange={(event) => updateRequestField("description", event.target.value)} />
            </label>
            {requestMessage ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-amiste-gray">
                {requestMessage}
              </div>
            ) : null}
            <footer className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
              <Button variant="secondary" onClick={() => setRequestOpen(false)}>
                Cancelar
              </Button>
              <Button icon="fileClock" type="submit">
                Enviar Pedido
              </Button>
            </footer>
          </form>
        </Modal>
      </section>

      {/* --- SECAO: IDENTIDADE INSTITUCIONAL --- */}
      <section className="hidden min-h-screen place-items-center bg-amiste-white px-8 py-10 lg:grid">
        <div className="max-w-[520px] text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl border border-zinc-200 bg-white text-amiste-red shadow-sm">
            <AppIcon name="coffee" size={42} />
          </div>
          <h2 className="mt-8 font-display text-6xl font-black tracking-normal text-amiste-black">
            AMISTE
          </h2>
          <p className="mt-4 text-lg font-black text-amiste-gray">Sistema de Gestao Integrado</p>
          <p className="mx-auto mt-5 max-w-[440px] text-sm font-semibold leading-6 text-amiste-gray/65">
            Gerencie maquinas, insumos, clientes e ordens de servico em um unico lugar.
          </p>
        </div>
      </section>
    </main>
  );
}
