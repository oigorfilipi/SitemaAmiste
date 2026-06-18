import { useState } from "react";
import Button from "../atoms/Button.jsx";
import PasswordInput from "../atoms/PasswordInput.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import {
  canManageAdminPassword,
  revealAdminPassword,
  updateAdminPassword,
} from "../../services/adminSecurityService.js";

export default function AdminPasswordPanel({ user }) {
  const [adminPassword, setAdminPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [message, setMessage] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [revealLoading, setRevealLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const { records, createRecord, updateRecord } = useCollection("systemSettings");

  if (!canManageAdminPassword(user)) {
    return null;
  }

  async function handleReveal() {
    setMessage("");
    setRevealLoading(true);

    try {
      setAdminPassword(await revealAdminPassword({
        currentUser: user,
        loginPassword,
        settingsRecords: records,
      }));
      setMessage("Senha ADM revelada com sucesso.");
    } catch (error) {
      setMessage(error.message || "Nao foi possivel revelar a Senha ADM.");
    } finally {
      setRevealLoading(false);
    }
  }

  async function handleUpdate() {
    setMessage("");
    setUpdateLoading(true);

    try {
      const updatedPassword = await updateAdminPassword({
        createRecord,
        currentUser: user,
        loginPassword,
        newAdminPassword,
        settingsRecords: records,
        updateRecord,
      });
      setAdminPassword(updatedPassword);
      setNewAdminPassword("");
      setMessage("Senha ADM atualizada com sucesso.");
    } catch (error) {
      setMessage(error.message || "Nao foi possivel alterar a Senha ADM.");
    } finally {
      setUpdateLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <span className="text-xs font-black uppercase text-amiste-red">Seguranca administrativa</span>
        <h2 className="mt-1 font-display text-lg font-black text-amiste-black">Senha ADM</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-amiste-gray/65">
          Usada para confirmar criacao ou promocao de usuarios DON/DEV. Para visualizar ou alterar,
          confirme primeiro sua senha de login.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <label>
          <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">
            Senha ADM atual
          </span>
          <div className="flex gap-2">
            <input
              className="h-9 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-100 px-3 text-[13px] font-black tracking-widest text-amiste-black shadow-sm outline-none"
              readOnly
              value={adminPassword || "************"}
            />
            <Button className="w-28" icon="eye" loading={revealLoading} variant="secondary" onClick={handleReveal}>
              Ver
            </Button>
          </div>
        </label>

        <label>
          <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">
            Sua senha de login
          </span>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Confirme sua senha"
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
          />
        </label>

        <label>
          <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">
            Nova Senha ADM
          </span>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Digite a nova Senha ADM"
            value={newAdminPassword}
            onChange={(event) => setNewAdminPassword(event.target.value)}
          />
        </label>

        {message ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-amiste-gray">
            {message}
          </div>
        ) : null}

        <Button
          className="w-full"
          disabled={!loginPassword || !newAdminPassword}
          icon="shield"
          loading={updateLoading}
          onClick={handleUpdate}
        >
          Alterar Senha ADM
        </Button>
      </div>
    </section>
  );
}
