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
import { getRolePermissions } from "../../services/permissionService.js";

function DeveloperSettingsContent({ user }) {
  const [backupText, setBackupText] = useState("");
  const [message, setMessage] = useState(null);
  const { snapshot, refresh } = useErpSnapshot();
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canDownload = rolePermissions["action:download"] !== "OC";
  const canRestore = ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canReset = rolePermissions["action:delete"] === "AC";
  const sourceCards = useMemo(() => buildDataSourceCards(), []);
  const metrics = useMemo(() => buildSettingsMetrics(snapshot), [snapshot]);
  const collectionRows = useMemo(() => buildCollectionRows(snapshot), [snapshot]);

  function handleDownloadBackup() {
    if (!canDownload) {
      return;
    }

    downloadBackup(snapshot);
    setMessage({ type: "success", text: "Backup JSON gerado com os dados locais atuais." });
  }

  async function handleRestoreBackup() {
    if (!canRestore) {
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
    if (!canReset) {
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
        actionLabel={canDownload ? "Baixar Backup" : ""}
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
        canBackup={canDownload}
        canReset={canReset}
        canRestore={canRestore}
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

export default function ConfiguracoesPage({ accessLevel, user }) {
  if (accessLevel !== "AC" || user?.role !== "DEV") {
    return (
      <TableEmptyState
        description="Configuracoes tecnicas, dados do sistema e informacoes administrativas sao exclusivas do perfil DEV."
        icon="shield"
        title="Acesso negado"
      />
    );
  }

  return <DeveloperSettingsContent user={user} />;
}
