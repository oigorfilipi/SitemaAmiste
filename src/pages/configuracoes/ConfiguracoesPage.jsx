import { useMemo, useState } from "react";
import ConfirmDialog from "../../components/molecules/ConfirmDialog.jsx";
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
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const { snapshot, refresh } = useErpSnapshot();
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canDownload = rolePermissions["action:download"] !== "OC";
  const canRestore = ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canReset = rolePermissions["action:delete"] === "AC";
  const sourceCards = useMemo(() => buildDataSourceCards(), []);
  const metrics = useMemo(() => buildSettingsMetrics(snapshot), [snapshot]);
  const collectionRows = useMemo(() => buildCollectionRows(snapshot), [snapshot]);

  async function handleDownloadBackup() {
    if (!canDownload) {
      return;
    }

    try {
      await downloadBackup(snapshot);
      setMessage({ type: "success", text: "Backup JSON gerado com dados locais e arquivos de etiquetas disponiveis." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Nao foi possivel gerar o backup local." });
    }
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
    setMessage({
      type: "success",
      text: result.restoredLabelFiles
        ? `Backup restaurado com ${result.restoredLabelFiles} arquivo(s) de etiqueta.`
        : "Backup restaurado e snapshot local sincronizado.",
    });
    await refresh();
  }

  async function handleResetDatabase() {
    if (!canReset) {
      return;
    }

    setResetConfirmOpen(true);
  }

  async function confirmResetDatabase() {
    await resetSettingsDatabase();
    setBackupText("");
    setMessage({ type: "success", text: "Base local resetada para o seed inicial." });
    setResetConfirmOpen(false);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="download"
        actionLabel={canDownload ? "Baixar Backup" : ""}
        description="Central tecnica para fonte de dados, backup local e saude das colecoes."
        icon="settings"
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
      <ConfirmDialog
        confirmLabel="Resetar base"
        description="Resetar a base local para os dados iniciais? Essa acao substitui os dados locais atuais pelo seed do sistema."
        icon="archive"
        open={resetConfirmOpen}
        title="Resetar base local"
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={confirmResetDatabase}
      />
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
