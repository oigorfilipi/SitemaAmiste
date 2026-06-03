import Button from "../atoms/Button.jsx";
import TextInput from "../atoms/TextInput.jsx";
import { PROFILE_FORM_FIELDS } from "../../services/profileService.js";

export default function ProfileFormPanel({
  canMutate,
  formData,
  isDirty,
  message,
  onCancel,
  onChange,
  onSubmit,
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="font-display text-lg font-black text-amiste-black">Dados do perfil</h2>
        <p className="mt-1 text-sm font-semibold text-amiste-gray/60">
          Informacoes pessoais usadas no header, auditoria e operacoes internas.
        </p>
      </div>

      <form className="mt-5 space-y-5" onSubmit={onSubmit}>
        {/* --- SECAO: CAMPOS EDITAVEIS --- */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PROFILE_FORM_FIELDS.map((field) => (
            <div key={field.name}>
              <label
                className="mb-2 block text-xs font-black uppercase text-amiste-gray/60"
                htmlFor={`profile-${field.name}`}
              >
                {field.label}
                {field.required ? <span className="text-amiste-red"> *</span> : null}
              </label>
              <TextInput
                disabled={!canMutate}
                id={`profile-${field.name}`}
                maxLength={field.maxLength}
                required={field.required}
                value={formData[field.name] || ""}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            </div>
          ))}
        </div>

        {message ? (
          <div className="rounded-md border border-amiste-green/20 bg-amiste-green/10 px-4 py-3 text-sm font-bold text-amiste-green">
            {message}
          </div>
        ) : null}

        <footer className="flex flex-wrap justify-end gap-3 border-t border-zinc-100 pt-5">
          <Button disabled={!isDirty} variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={!canMutate || !isDirty} icon="pencil" type="submit">
            Salvar Perfil
          </Button>
        </footer>
      </form>
    </section>
  );
}
