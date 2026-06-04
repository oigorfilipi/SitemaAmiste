import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import ProfileAccessPanel from "../../components/organisms/ProfileAccessPanel.jsx";
import ProfileFormPanel from "../../components/organisms/ProfileFormPanel.jsx";
import ProfileIdentityPanel from "../../components/organisms/ProfileIdentityPanel.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import {
  buildProfileAccessRows,
  buildProfileFormData,
  buildProfileMetrics,
  normalizeProfilePayload,
} from "../../services/profileService.js";

export default function PerfilPage({ accessLevel, previewUser, user }) {
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const { records, updateRecord } = useCollection("accounts");
  const profile = records.find((account) => account.id === user?.id) || user;
  const isPreviewing = Boolean(previewUser);
  const canMutate = accessLevel === "AC" && !isPreviewing && Boolean(profile?.id);
  const initialFormData = useMemo(() => buildProfileFormData(profile), [profile]);
  const metrics = useMemo(() => buildProfileMetrics(profile), [profile]);
  const accessRows = useMemo(() => buildProfileAccessRows(profile), [profile]);
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  useEffect(() => {
    setFormData(initialFormData);
    setMessage("");
    setErrorMessage("");
  }, [initialFormData]);

  function handleChange(fieldName, value) {
    setFormData((currentData) => ({
      ...currentData,
      [fieldName]: value,
    }));
    setMessage("");
    setErrorMessage("");
  }

  function handleCancel() {
    setFormData(initialFormData);
    setMessage("");
    setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canMutate || !isDirty) {
      return;
    }

    if (formData.securityNewPassword && formData.securityNewPassword !== formData.securityConfirmPassword) {
      setErrorMessage("As senhas nao conferem.");
      return;
    }

    const payload = normalizeProfilePayload(formData, profile);

    await updateRecord(profile.id, payload, {
      action: "Editou",
      details: "Dados pessoais atualizados pela tela de perfil.",
      module: "Perfil",
      title: payload.displayName,
    });
    setMessage("Perfil atualizado com sucesso.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Area pessoal do colaborador, com dados de contato e leitura das permissoes aplicadas."
        title="Perfil"
      />

      {/* --- SECAO: INDICADORES DO PERFIL --- */}
      <MetricsGrid metrics={metrics} />

      {isPreviewing ? (
        <div className="rounded-md border border-amiste-yellow/60 bg-amiste-yellow/20 px-4 py-3 text-sm font-bold text-amiste-black">
          Modo visualizacao ativo. Edicao do perfil desabilitada para preservar a simulacao de permissao.
        </div>
      ) : null}

      {/* --- SECAO: PERFIL E PERMISSOES --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <ProfileIdentityPanel profile={profile} />
          <ProfileFormPanel
            canMutate={canMutate}
            errorMessage={errorMessage}
            formData={formData}
            isDirty={isDirty}
            message={message}
            profile={profile}
            onCancel={handleCancel}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </div>
        <ProfileAccessPanel rows={accessRows} />
      </div>
    </div>
  );
}
