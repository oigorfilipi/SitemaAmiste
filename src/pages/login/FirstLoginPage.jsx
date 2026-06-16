import { useState } from "react";
import AppIcon from "../../components/atoms/AppIcon.jsx";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import { assertInlineImageFile } from "../../services/imageUploadValidationService.js";
import { validatePasswordStrength } from "../../services/passwordPolicyService.js";

function readFileAsDataUrl(file) {
  assertInlineImageFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Nao foi possivel ler a foto.")));
    reader.readAsDataURL(file);
  });
}

export default function FirstLoginPage({ isLoading, user, onComplete, onLogout }) {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [profilePhotoDataUrl, setProfilePhotoDataUrl] = useState(user?.profilePhotoDataUrl || "");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.profilePhotoUrl || "");

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setProfilePhotoDataUrl(await readFileAsDataUrl(file));
      setError("");
    } catch (photoError) {
      setError(photoError.message || "Nao foi possivel carregar a foto.");
      event.target.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    const passwordError = validatePasswordStrength(password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      await onComplete({
        displayName,
        password,
        profilePhotoDataUrl,
        profilePhotoUrl,
      });
    } catch (completionError) {
      setError(completionError.message || "Nao foi possivel concluir o primeiro acesso.");
    }
  }

  const previewPhoto = profilePhotoDataUrl || profilePhotoUrl;

  return (
    <main className="grid min-h-screen grid-cols-1 bg-amiste-white lg:grid-cols-2">
      {/* --- SECAO: PRIMEIRO ACESSO --- */}
      <section className="flex min-h-screen flex-col justify-between bg-amiste-red px-8 py-10 text-white">
        <div />
        <div className="mx-auto w-full max-w-[520px]">
          <h1 className="font-display text-4xl font-black">Primeiro Login</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/75">
            Defina sua senha definitiva, nome de exibicao e foto antes de acessar o sistema.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">Nova Senha</span>
              <TextInput required placeholder="Digite a nova senha" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">Confirmar Senha</span>
              <TextInput required placeholder="Repita a nova senha" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">Nome de Exibicao</span>
              <TextInput required placeholder="Ex: Igor" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">URL da Foto</span>
              <TextInput placeholder="https://..." value={profilePhotoUrl} onChange={(event) => setProfilePhotoUrl(event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">Foto de Perfil</span>
              <input
                accept="image/*"
                className="block h-9 w-full rounded-xl border border-white/25 bg-white px-3 py-1.5 text-[13px] font-semibold text-amiste-gray file:mr-4 file:rounded-xl file:border-0 file:bg-amiste-black file:px-3 file:py-1 file:text-xs file:font-black file:text-white"
                type="file"
                onChange={handlePhotoChange}
              />
            </label>

            {previewPhoto ? (
              <img alt={displayName || "Foto de perfil"} className="h-28 w-28 rounded-2xl border border-white/30 bg-white object-cover" src={previewPhoto} />
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-bold text-white">
                {error}
              </div>
            ) : null}

            <Button className="w-full border-white bg-white font-black text-amiste-red hover:border-white hover:bg-zinc-100 hover:text-red-900" disabled={isLoading} icon="shield" type="submit">
              Concluir Acesso
            </Button>
            <Button className="w-full border-white/40 bg-transparent text-white hover:bg-white/10" disabled={isLoading} variant="secondary" onClick={onLogout}>
              Sair
            </Button>
          </form>
        </div>
        <footer className="text-xs font-semibold text-white/65">
          C 2026/27 Amiste Cafe. Todos os Direitos Reservados.
        </footer>
      </section>

      {/* --- SECAO: IDENTIDADE INSTITUCIONAL --- */}
      <section className="hidden min-h-screen place-items-center bg-amiste-white px-8 py-10 lg:grid">
        <div className="max-w-[520px] text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl border border-zinc-200 bg-white text-amiste-red shadow-sm">
            <AppIcon name="coffee" size={42} />
          </div>
          <h2 className="mt-8 font-display text-6xl font-black tracking-normal text-amiste-black">AMISTE</h2>
          <p className="mt-4 text-lg font-black text-amiste-gray">Sistema de Gestao Integrado</p>
          <p className="mx-auto mt-5 max-w-[440px] text-sm font-semibold leading-6 text-amiste-gray/65">
            Seu primeiro acesso protege os dados e confirma a identidade da conta.
          </p>
        </div>
      </section>
    </main>
  );
}
