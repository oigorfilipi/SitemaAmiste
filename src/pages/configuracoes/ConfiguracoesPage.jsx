import { useMemo, useState } from "react";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import BackupRestorePanel from "../../components/organisms/BackupRestorePanel.jsx";
import CollectionHealthTable from "../../components/organisms/CollectionHealthTable.jsx";
import DataSourcePanel from "../../components/organisms/DataSourcePanel.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import TableEmptyState from "../../components/molecules/TableEmptyState.jsx";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  buildCollectionRows,
  buildDataSourceCards,
  buildSettingsMetrics,
  downloadBackup,
  resetSettingsDatabase,
  restoreBackupFromText,
} from "../../services/settingsService.js";

function DeveloperSettingsContent() {
  const [backupText, setBackupText] = useState("");
  const [message, setMessage] = useState(null);
  const { snapshot, refresh } = useErpSnapshot();
  const canMutate = true;
  const sourceCards = useMemo(() => buildDataSourceCards(), []);
  const metrics = useMemo(() => buildSettingsMetrics(snapshot), [snapshot]);
  const collectionRows = useMemo(() => buildCollectionRows(snapshot), [snapshot]);

  function handleDownloadBackup() {
    downloadBackup(snapshot);
    setMessage({ type: "success", text: "Backup JSON gerado com os dados locais atuais." });
  }

  async function handleRestoreBackup() {
    if (!canMutate) {
      return;
    }

    const result = await restoreBackupFromText(backupText);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }

    setBackupText("");
    setMessage({ type: "success", text: "Backup restaurado e snapshot local sincronizado." });
    await refresh();
  }

  async function handleResetDatabase() {
    if (!canMutate) {
      return;
    }

    const confirmed = window.confirm("Resetar a base local para os dados iniciais?");

    if (!confirmed) {
      return;
    }

    await resetSettingsDatabase();
    setBackupText("");
    setMessage({ type: "success", text: "Base local resetada para o seed inicial." });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="download"
        actionLabel="Baixar Backup"
        description="Central tecnica para fonte de dados, backup local e saude das colecoes."
        title="Configuracoes"
        onAction={handleDownloadBackup}
      />

      {/* --- SECAO: INDICADORES DA BASE --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: FONTE E BACKUP --- */}
      <DataSourcePanel sources={sourceCards} />
      <BackupRestorePanel
        backupText={backupText}
        canMutate={canMutate}
        message={message}
        onBackup={handleDownloadBackup}
        onChangeBackupText={setBackupText}
        onReset={handleResetDatabase}
        onRestore={handleRestoreBackup}
      />

      {/* --- SECAO: COLECOES VERSIONADAS --- */}
      <CollectionHealthTable rows={collectionRows} />
    </div>
  );
}

export default function ConfiguracoesPage({ accessLevel }) {
  if (accessLevel !== "AC") {
    return (
      <TableEmptyState
        description="Configuracoes tecnicas, dados do sistema e informacoes administrativas sao exclusivas do perfil DEV."
        icon="shield"
        title="Acesso negado"
      />
    );
  }

  return <DeveloperSettingsContent />;
}
