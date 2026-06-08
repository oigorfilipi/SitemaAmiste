import { useState } from "react";
import AppIcon from "../../components/atoms/AppIcon.jsx";
import Button from "../../components/atoms/Button.jsx";
import TextArea from "../../components/atoms/TextArea.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import Modal from "../../components/molecules/Modal.jsx";

const REQUEST_INITIAL_STATE = {
  document: "",
  email: "",
  fullName: "",
  phone: "",
  reason: "",
};

export default function LoginPage({ isLoading, onLogin, onRequestAccess }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [requestData, setRequestData] = useState(REQUEST_INITIAL_STATE);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);

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

    if (!requestData.fullName || !requestData.email || !requestData.document || !requestData.phone) {
      setRequestMessage("Preencha nome, e-mail, CPF/RG e telefone.");
      return;
    }

    await onRequestAccess(requestData);
    setRequestMessage("Solicitacao registrada. Os avisos para DONO e DEV foram simulados no ambiente local.");
    setRequestData(REQUEST_INITIAL_STATE);
  }

  function updateRequestField(fieldName, value) {
    setRequestData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));
    setRequestMessage("");
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-amiste-white lg:grid-cols-2">
      {/* --- SECAO: LOGIN CORPORATIVO --- */}
      <section className="flex min-h-screen flex-col justify-between bg-amiste-red px-8 py-10 text-white">
        <div />
        <div className="mx-auto w-full max-w-[480px]">
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
                icon="user"
                placeholder="usuario@amistecafe.local"
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

            <Button className="w-full border-white bg-white font-black text-amiste-red hover:border-white hover:bg-zinc-100 hover:text-red-900" disabled={isLoading} icon="shield" type="submit">
              Entrar no Sistema
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm font-bold text-white/80">
            <button type="button">Esqueci minha senha</button>
            <button type="button" onClick={() => setRequestOpen(true)}>
              Nao Tenho Acesso? Solicitar Conta
            </button>
          </div>
        </div>
        <footer className="text-xs font-semibold text-white/65">
          C 2026/27 Amiste Cafe. Todos os Direitos Reservados.
        </footer>

        <Modal
          description="A solicitacao fica registrada no ERP local e os disparos sao simulados para DONO e DEV."
          open={requestOpen}
          title="Solicitar Conta"
          onClose={() => setRequestOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleRequestAccess}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Nome completo</span>
                <TextInput required placeholder="Ex: Igor Filipi" value={requestData.fullName} onChange={(event) => updateRequestField("fullName", event.target.value)} />
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">E-mail</span>
                <TextInput required placeholder="nome@empresa.com" type="email" value={requestData.email} onChange={(event) => updateRequestField("email", event.target.value)} />
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">CPF ou RG</span>
                <TextInput required placeholder="000.000.000-00" value={requestData.document} onChange={(event) => updateRequestField("document", event.target.value)} />
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Telefone</span>
                <TextInput required placeholder="(11) 99999-9999" value={requestData.phone} onChange={(event) => updateRequestField("phone", event.target.value)} />
              </label>
            </div>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Motivo da solicitacao</span>
              <TextArea placeholder="Explique por que precisa de acesso ao sistema." value={requestData.reason} onChange={(event) => updateRequestField("reason", event.target.value)} />
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
              <Button icon="userPlus" type="submit">
                Enviar Solicitacao
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
