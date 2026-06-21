import { useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import ConfirmDialog from "../../components/molecules/ConfirmDialog.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import TableEmptyState from "../../components/molecules/TableEmptyState.jsx";
import LabelFilePreviewPanel from "../../components/organisms/LabelFilePreviewPanel.jsx";
import LabelRepositoryGrid from "../../components/organisms/LabelRepositoryGrid.jsx";
import LabelUploadModal from "../../components/organisms/LabelUploadModal.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  buildLabelMetrics,
  buildLabelRows,
  buildUpdatedLabelPayload,
  buildUploadedLabelPayload,
  deleteStoredLabelFile,
  downloadLabelFile,
  exportLabels,
  printLabelFile,
} from "../../services/labelService.js";
import { getRolePermissions } from "../../services/permissionService.js";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function EtiquetasPage({ accessLevel, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [pendingDeleteLabel, setPendingDeleteLabel] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { records, createRecord, updateRecord, deleteRecord } = useCollection("labels");
  const { snapshot } = useErpSnapshot();
  const config = moduleConfigs.labels;
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const labelFilesAccess = rolePermissions["module:labels.files"] || accessLevel;
  const canUseLabelFiles = labelFilesAccess !== "OC";
  const canMutate = accessLevel === "AC" && labelFilesAccess === "AC";
  const canUpload = canMutate && ["AC", "UP"].includes(rolePermissions["action:upload"]);
  const canEdit = canMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canDelete = canMutate && rolePermissions["action:delete"] === "AC";
  const canDownload = canUseLabelFiles && rolePermissions["action:download"] !== "OC";
  const canPrint = canUseLabelFiles && rolePermissions["action:print"] !== "OC";

  const labels = useMemo(() => buildLabelRows(records), [records]);
  const filteredLabels = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return labels;
    }

    return labels.filter((label) =>
      [label.name, label.category, label.format, label.originalFileName, label.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedTerm)
    );
  }, [labels, searchTerm]);
  const selectedLabel = useMemo(
    () => filteredLabels.find((label) => label.id === selectedId) || filteredLabels[0] || null,
    [filteredLabels, selectedId]
  );
  const metrics = useMemo(() => buildLabelMetrics(labels), [labels]);

  useEffect(() => {
    if (!filteredLabels.length) {
      setSelectedId("");
      return;
    }

    if (!filteredLabels.some((label) => label.id === selectedId)) {
      setSelectedId(filteredLabels[0].id);
    }
  }, [filteredLabels, selectedId]);

  if (!canUseLabelFiles) {
    return (
      <TableEmptyState
        description="O modulo de arquivos de etiquetas esta oculto para este perfil."
        icon="shield"
        title="Acesso negado"
      />
    );
  }

  async function handleUpload(uploadData) {
    if (editingLabel) {
      if (!canEdit) {
        return;
      }

      setErrorMessage("");
      const payload = await buildUpdatedLabelPayload(uploadData, editingLabel);
      const updatedLabel = await updateRecord(editingLabel.id, payload);

      if (uploadData.file && payload.fileStorageKey && payload.fileStorageKey !== editingLabel.fileStorageKey) {
        await deleteStoredLabelFile(editingLabel);
      }

      setSelectedId(updatedLabel.id);
      setEditingLabel(null);
      setUploadOpen(false);
      return;
    }

    if (!canUpload) {
      return;
    }

    setErrorMessage("");
    const payload = await buildUploadedLabelPayload(uploadData);
    const createdLabel = await createRecord(payload);

    setSelectedId(createdLabel.id);
    setUploadOpen(false);
  }

  function openUploadModal() {
    setEditingLabel(null);
    setErrorMessage("");
    setUploadOpen(true);
  }

  function openEditModal(label) {
    if (!canEdit) {
      return;
    }

    setEditingLabel(label);
    setErrorMessage("");
    setUploadOpen(true);
  }

  function closeUploadModal() {
    setUploadOpen(false);
    setEditingLabel(null);
  }

  async function handleDelete(label) {
    if (!canDelete) {
      return;
    }

    setPendingDeleteLabel(label);
  }

  async function confirmDeleteLabel() {
    if (!pendingDeleteLabel) {
      return;
    }

    setErrorMessage("");

    try {
      await deleteRecord(pendingDeleteLabel.id);
      await deleteStoredLabelFile(pendingDeleteLabel);
      setPendingDeleteLabel(null);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function handleExport() {
    if (!canDownload) {
      return;
    }

    exportLabels(filteredLabels, snapshot);
  }

  function handlePreview(label) {
    setSelectedId(label.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="upload"
        actionLabel={canUpload ? config.actionLabel : ""}
        description={config.description}
        icon={config.icon}
        title={config.title}
        onAction={openUploadModal}
      />

      {/* --- SECAO: FILTROS E EXPORTACAO --- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TextInput
          className="w-full lg:w-80 xl:w-96"
          icon="search"
          placeholder="Buscar por nome, categoria ou formato"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <Button disabled={!canDownload} icon="download" variant="secondary" onClick={handleExport}>
          Exportar
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
          {errorMessage}
        </div>
      ) : null}

      {/* --- SECAO: INDICADORES DO REPOSITORIO --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: ARQUIVOS E PREVIEW --- */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_500px] 2xl:grid-cols-[minmax(0,1fr)_560px]">
        <LabelRepositoryGrid
          canDelete={canDelete}
          canDownload={canDownload}
          canEdit={canEdit}
          canPrint={canPrint}
          labels={filteredLabels}
          selectedId={selectedLabel?.id || ""}
          onDelete={handleDelete}
          onDownload={downloadLabelFile}
          onEdit={openEditModal}
          onPreview={handlePreview}
          onPrint={printLabelFile}
        />
        <LabelFilePreviewPanel
          canDownload={canDownload}
          canPrint={canPrint}
          label={selectedLabel}
          onDownload={downloadLabelFile}
          onPrint={printLabelFile}
        />
      </div>

      <LabelUploadModal
        editingLabel={editingLabel}
        existingLabels={labels}
        open={uploadOpen}
        snapshot={snapshot}
        onClose={closeUploadModal}
        onUpload={handleUpload}
      />
      <ConfirmDialog
        confirmLabel="Excluir arquivo"
        description={`Excluir "${pendingDeleteLabel?.name || "arquivo"}"? O arquivo salvo no repositorio local tambem sera removido.`}
        open={Boolean(pendingDeleteLabel)}
        title="Excluir etiqueta"
        onCancel={() => setPendingDeleteLabel(null)}
        onConfirm={confirmDeleteLabel}
      />
    </div>
  );
}
