import { useEffect, useState } from "react";
import BrandMark from "../../components/atoms/BrandMark.jsx";
import LoginSessionPanel from "../../components/organisms/LoginSessionPanel.jsx";

export default function LoginPage({ accounts, isLoading, onLogin }) {
  const [selectedId, setSelectedId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedId && accounts[0]) {
      setSelectedId(accounts[0].id);
    }
  }, [accounts, selectedId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await onLogin({ pin, userId: selectedId });
      setPin("");
    } catch (loginError) {
      setError(loginError.message || "Nao foi possivel iniciar a sessao.");
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-[420px_minmax(0,1fr)] bg-zinc-100">
      {/* --- SECAO: IDENTIDADE DA SESSAO --- */}
      <aside className="flex min-h-screen flex-col justify-between bg-amiste-black p-8">
        <BrandMark />
        <div>
          <p className="text-xs font-black uppercase text-white/45">Fonte atual</p>
          <h2 className="mt-2 font-display text-3xl font-black text-white">Sessao local</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/62">
            Ambiente interno para colaboradores ativos da operacao.
          </p>
        </div>
        <span className="text-xs font-bold text-white/35">Amiste Cafe ERP</span>
      </aside>

      {/* --- SECAO: ENTRADA --- */}
      <section className="grid place-items-center px-8 py-10">
        <div className="w-full max-w-[560px]">
          <LoginSessionPanel
            accounts={accounts}
            error={error}
            isLoading={isLoading}
            pin={pin}
            selectedId={selectedId}
            onChangePin={setPin}
            onSelectAccount={(accountId) => {
              setSelectedId(accountId);
              setError("");
            }}
            onSubmit={handleSubmit}
          />
        </div>
      </section>
    </main>
  );
}
