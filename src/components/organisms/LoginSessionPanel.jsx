import Button from "../atoms/Button.jsx";
import TextInput from "../atoms/TextInput.jsx";
import LoginAccountList from "./LoginAccountList.jsx";

export default function LoginSessionPanel({
  accounts,
  error,
  isLoading,
  pin,
  selectedId,
  onChangePin,
  onSelectAccount,
  onSubmit,
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-black/15">
      <div>
        <h1 className="font-display text-2xl font-black text-amiste-black">Acesso ao ERP</h1>
        <p className="mt-2 text-sm font-semibold text-amiste-gray/65">
          Sessao local de desenvolvimento para colaboradores ativos.
        </p>
      </div>

      <form className="mt-5 space-y-5" onSubmit={onSubmit}>
        {/* --- SECAO: COLABORADOR --- */}
        <LoginAccountList
          accounts={accounts}
          isLoading={isLoading}
          selectedId={selectedId}
          onSelect={onSelectAccount}
        />

        {/* --- SECAO: PIN LOCAL --- */}
        <div>
          <label className="mb-2 block text-xs font-black uppercase text-amiste-gray/60" htmlFor="login-pin">
            PIN
          </label>
          <TextInput
            autoComplete="current-password"
            id="login-pin"
            inputMode="numeric"
            placeholder="Digite o PIN"
            type="password"
            value={pin}
            onChange={(event) => onChangePin(event.target.value)}
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
            {error}
          </div>
        ) : null}

        <Button className="w-full" disabled={isLoading || !selectedId} icon="shield" type="submit">
          Entrar
        </Button>
      </form>
    </section>
  );
}
