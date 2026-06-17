import { useState } from "react";
import AppIcon from "../../components/atoms/AppIcon.jsx";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import { assertInlineImageFile } from "../../services/imageUploadValidationService.js";
import { validatePasswordStrength } from "../../services/passwordPolicyService.js";

const AUTH_INPUT_CLASS = "[&_input]:!border-white/35 [&_input]:!bg-white [&_input]:!text-amiste-black [&_input]:placeholder:!text-amiste-gray/70";

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
  const [profilePhotoFileName, setProfilePhotoFileName] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.profilePhotoUrl || "");

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setProfilePhotoDataUrl(await readFileAsDataUrl(file));
      setProfilePhotoFileName(file.name);
      setError("");
    } catch (photoError) {
      setError(photoError.message || "Nao foi possivel carregar a foto.");
      setProfilePhotoFileName("");
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
              <TextInput className={AUTH_INPUT_CLASS} required placeholder="Digite a nova senha" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">Confirmar Senha</span>
              <TextInput className={AUTH_INPUT_CLASS} required placeholder="Repita a nova senha" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">Nome de Exibicao</span>
              <TextInput className={AUTH_INPUT_CLASS} required placeholder="Ex: Igor" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">URL da Foto</span>
              <TextInput className={AUTH_INPUT_CLASS} placeholder="https://..." value={profilePhotoUrl} onChange={(event) => setProfilePhotoUrl(event.target.value)} />
            </label>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-white/70">Foto de Perfil</span>
              <span className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-white/15">
                <span className="flex min-w-0 items-center gap-2">
                  <AppIcon name="upload" size={17} />
                  <span className="truncate">{profilePhotoFileName || "Escolher foto de perfil"}</span>
                </span>
                <span className="shrink-0 rounded-xl !bg-white px-3 py-1 text-xs font-black !text-amiste-black">
                  Procurar
                </span>
              </span>
              <input
                accept="image/*"
                className="sr-only"
                type="file"
                onChange={handlePhotoChange}
              />
            </label>

            {previewPhoto ? (
              <img alt={displayName || "Foto de perfil"} className="h-28 w-28 rounded-2xl border border-white/30 !bg-white object-cover" src={previewPhoto} />
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-white/30 bg-white/15 px-4 py-3 text-sm font-bold text-white">
                {error}
              </div>
            ) : null}

            <div className="pt-3">
              <Button
                className="w-full border-white !bg-white font-black !text-amiste-black hover:border-white hover:!bg-zinc-100 hover:!text-amiste-black [&_span]:!text-amiste-black [&_svg]:!text-amiste-black"
                disabled={isLoading}
                icon="shield"
                type="submit"
              >
                Concluir Acesso
              </Button>
            </div>
            <Button
              className="w-full border-white/40 !bg-transparent !text-white hover:!bg-white/10 hover:!text-white [&_span]:!text-white [&_svg]:!text-white"
              disabled={isLoading}
              variant="secondary"
              onClick={onLogout}
            >
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
