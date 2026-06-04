import { useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import LabelFilePreviewPanel from "../../components/organisms/LabelFilePreviewPanel.jsx";
import LabelRepositoryGrid from "../../components/organisms/LabelRepositoryGrid.jsx";
import LabelUploadModal from "../../components/organisms/LabelUploadModal.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  buildLabelMetrics,
  buildLabelRows,
  buildUploadedLabelPayload,
  deleteStoredLabelFile,
  downloadLabelFile,
  exportLabels,
  printLabelFile,
} from "../../services/labelService.js";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function EtiquetasPage({ accessLevel }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const { records, createRecord, deleteRecord } = useCollection("labels");
  const { snapshot } = useErpSnapshot();
  const config = moduleConfigs.labels;
  const canMutate = accessLevel === "AC";

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

  async function handleUpload(uploadData) {
    if (!canMutate) {
      return;
    }

    const payload = await buildUploadedLabelPayload(uploadData);
    const createdLabel = await createRecord(payload);

    setSelectedId(createdLabel.id);
    setUploadOpen(false);
  }

  async function handleDelete(label) {
    if (!canMutate) {
      return;
    }

    const confirmed = window.confirm(`Excluir "${label.name}"?`);

    if (confirmed) {
      await deleteStoredLabelFile(label);
      await deleteRecord(label.id);
    }
  }

  function handleExport() {
    exportLabels(filteredLabels, snapshot);
  }

  function handlePreview(label) {
    setSelectedId(label.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="upload"
        actionLabel={canMutate ? config.actionLabel : ""}
        description={config.description}
        title={config.title}
        onAction={() => setUploadOpen(true)}
      />

      {/* --- SECAO: FILTROS E EXPORTACAO --- */}
      <div className="flex items-center justify-between gap-4">
        <TextInput
          className="w-96"
          icon="search"
          placeholder="Buscar por nome, categoria ou formato"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <Button icon="download" variant="secondary" onClick={handleExport}>
          Exportar
        </Button>
      </div>

      {/* --- SECAO: INDICADORES DO REPOSITORIO --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: ARQUIVOS E PREVIEW --- */}
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_560px]">
        <LabelRepositoryGrid
          canMutate={canMutate}
          labels={filteredLabels}
          selectedId={selectedLabel?.id || ""}
          onDelete={handleDelete}
          onDownload={downloadLabelFile}
          onPreview={handlePreview}
          onPrint={printLabelFile}
        />
        <LabelFilePreviewPanel
          label={selectedLabel}
          onDownload={downloadLabelFile}
          onPrint={printLabelFile}
        />
      </div>

      <LabelUploadModal
        existingLabels={labels}
        open={uploadOpen}
        snapshot={snapshot}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
