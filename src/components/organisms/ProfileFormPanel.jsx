import { useState } from "react";
import Button from "../atoms/Button.jsx";
import PasswordInput from "../atoms/PasswordInput.jsx";
import TextInput from "../atoms/TextInput.jsx";
import PasswordStrengthMeter from "../molecules/PasswordStrengthMeter.jsx";
import { assertInlineImageFile } from "../../services/imageUploadValidationService.js";
import { PROFILE_FORM_FIELDS } from "../../services/profileService.js";

function readFileAsDataUrl(file) {
  assertInlineImageFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Nao foi possivel ler a foto.")));
    reader.readAsDataURL(file);
  });
}

function getFieldsBySection(sectionId) {
  return PROFILE_FORM_FIELDS.filter((field) => field.section === sectionId);
}

function resolveProfilePlaceholder(fieldName) {
  const placeholders = {
    avatarInitials: "Ex: IF",
    displayName: "Ex: Igor",
    fullName: "Ex: Igor Filipi",
    phone: "(11) 99999-9999",
  };

  return placeholders[fieldName] || "";
}

export default function ProfileFormPanel({
  canMutate,
  canUpload = true,
  errorMessage,
  formData,
  isDirty,
  isSaving = false,
  message,
  profile,
  onCancel,
  onChange,
  onSubmit,
}) {
  const [photoError, setPhotoError] = useState("");

  async function handlePhotoChange(event) {
    if (!canUpload) {
      return;
    }

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      onChange("profilePhotoDataUrl", await readFileAsDataUrl(file));
      setPhotoError("");
    } catch (error) {
      setPhotoError(error.message || "Nao foi possivel carregar a foto.");
      event.target.value = "";
    }
  }

  const activeSessions = formData.activeSessions || profile?.activeSessions || [];
  const accessHistory = profile?.accessHistory || [];
  const previewPhoto = formData.profilePhotoDataUrl || formData.profilePhotoUrl;
  const passwordMismatch = Boolean(
    formData.securityNewPassword &&
    formData.securityConfirmPassword &&
    formData.securityNewPassword !== formData.securityConfirmPassword
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="font-display text-lg font-black text-amiste-black">Dados do perfil</h2>
        <p className="mt-1 text-sm font-semibold text-amiste-gray/60">
          Informacoes pessoais usadas no header, auditoria e operacoes internas.
        </p>
      </div>

      <form className="mt-5 space-y-5" onSubmit={onSubmit}>
        {/* --- SECAO: CAMPOS EDITAVEIS --- */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {getFieldsBySection("editable").map((field) => (
            <div key={field.name}>
              <label
                className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60"
                htmlFor={`profile-${field.name}`}
              >
                {field.label}
                {field.required ? <span className="text-amiste-red"> *</span> : null}
              </label>
              <TextInput
                disabled={!canMutate}
                id={`profile-${field.name}`}
                maxLength={field.maxLength}
                placeholder={resolveProfilePlaceholder(field.name)}
                required={field.required}
                value={formData[field.name] || ""}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            </div>
          ))}
        </div>

        {/* --- SECAO: FOTO DE PERFIL --- */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="font-display text-base font-black text-amiste-black">Foto de perfil</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
            <div className="grid size-28 place-items-center overflow-hidden rounded-3xl border border-zinc-200 bg-white">
              {previewPhoto ? (
                <img alt="Foto de perfil" className="h-full w-full object-cover" src={previewPhoto} />
              ) : (
                <span className="text-xs font-black uppercase text-amiste-gray/45">Sem foto</span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">URL da foto</span>
                <TextInput
                  disabled={!canMutate}
                  placeholder="https://..."
                  value={formData.profilePhotoUrl || ""}
                  onChange={(event) => onChange("profilePhotoUrl", event.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Upload de foto</span>
                <input
                  accept="image/*"
                  className="block h-9 w-full rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[13px] font-semibold text-amiste-gray file:mr-4 file:rounded-xl file:border-0 file:bg-amiste-black file:px-3 file:py-1 file:text-xs file:font-black file:text-white disabled:opacity-50"
                  disabled={!canMutate || !canUpload}
                  type="file"
                  onChange={handlePhotoChange}
                />
              </label>
              {photoError ? (
                <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-3 py-2 text-xs font-bold text-amiste-red md:col-span-2">
                  {photoError}
                </div>
              ) : null}
              {getFieldsBySection("photo").filter((field) => !["profilePhotoUrl", "profilePhotoDataUrl"].includes(field.name)).map((field) => (
                <label key={field.name}>
                  <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">{field.label}</span>
                  <TextInput
                    disabled={!canMutate}
                    maxLength={field.maxLength}
                    value={formData[field.name] || ""}
                    onChange={(event) => onChange(field.name, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* --- SECAO: INFORMACOES BLOQUEADAS --- */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="font-display text-base font-black text-amiste-black">Informacoes bloqueadas</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {getFieldsBySection("locked").map((field) => (
              <label key={field.name}>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">{field.label}</span>
                <TextInput disabled type={field.type || "text"} value={formData[field.name] || ""} />
              </label>
            ))}
          </div>
        </div>

        {/* --- SECAO: SEGURANCA --- */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="font-display text-base font-black text-amiste-black">Seguranca</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Alterar senha</span>
              <PasswordInput
                disabled={!canMutate}
                placeholder="Digite a nova senha"
                value={formData.securityNewPassword || ""}
                onChange={(event) => onChange("securityNewPassword", event.target.value)}
              />
              {formData.securityNewPassword ? <PasswordStrengthMeter password={formData.securityNewPassword} /> : null}
            </label>
            <label>
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">Confirmar senha</span>
              <PasswordInput
                disabled={!canMutate}
                placeholder="Repita a nova senha"
                value={formData.securityConfirmPassword || ""}
                onChange={(event) => onChange("securityConfirmPassword", event.target.value)}
              />
              {passwordMismatch ? (
                <span className="mt-2 block text-xs font-bold text-amiste-red">
                  As senhas nao conferem.
                </span>
              ) : null}
            </label>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm font-black text-amiste-black">Sessoes ativas</strong>
                <button
                  className="text-xs font-black text-amiste-red disabled:opacity-45"
                  disabled={!canMutate || !activeSessions.length}
                  type="button"
                  onClick={() => onChange("activeSessions", [])}
                >
                  Encerrar sessoes
                </button>
              </div>
              <div className="mt-3 max-h-28 space-y-2 overflow-y-auto pr-1">
                {activeSessions.length ? activeSessions.map((session) => (
                  <div className="rounded-xl bg-zinc-50 px-3 py-2 text-xs font-bold text-amiste-gray" key={session.id || session.createdAt}>
                    {session.device || "Sessao local"} | {session.createdAt || "-"}
                  </div>
                )) : (
                  <span className="text-xs font-bold text-amiste-gray/55">Nenhuma sessao ativa registrada.</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-3">
              <strong className="text-sm font-black text-amiste-black">Historico de acessos</strong>
              <div className="mt-3 max-h-28 space-y-2 overflow-y-auto pr-1">
                {accessHistory.length ? accessHistory.map((entry) => (
                  <div className="rounded-xl bg-zinc-50 px-3 py-2 text-xs font-bold text-amiste-gray" key={`${entry.at}_${entry.label}`}>
                    {entry.label} | {entry.at}
                  </div>
                )) : (
                  <span className="text-xs font-bold text-amiste-gray/55">Nenhum acesso registrado.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-amiste-green/20 bg-amiste-green/10 px-4 py-3 text-sm font-bold text-amiste-green">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
            {errorMessage}
          </div>
        ) : null}

        <footer className="flex flex-wrap justify-end gap-3 border-t border-zinc-100 pt-5">
          <Button disabled={!isDirty || isSaving} variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={!canMutate || !isDirty || isSaving} icon="pencil" loading={isSaving} type="submit">
            Salvar Perfil
          </Button>
        </footer>
      </form>
    </section>
  );
}
