import { useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import EntityFormModal from "../../components/organisms/EntityFormModal.jsx";
import LabelPreviewModal from "../../components/organisms/LabelPreviewModal.jsx";
import LabelRepositoryGrid from "../../components/organisms/LabelRepositoryGrid.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  buildLabelMetrics,
  buildLabelRows,
  downloadLabelLayout,
  exportLabels,
} from "../../services/labelService.js";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function EtiquetasPage({ accessLevel }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [previewLabel, setPreviewLabel] = useState(null);
  const { records, createRecord, updateRecord, deleteRecord } = useCollection("labels");
  const { snapshot } = useErpSnapshot();
  const config = moduleConfigs.labels;
  const canMutate = accessLevel === "AC";

  const labels = useMemo(() => buildLabelRows(records, snapshot), [records, snapshot]);
  const filteredLabels = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return labels;
    }

    return labels.filter((label) =>
      [label.name, label.category, label.linkedTo, label.format, label.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedTerm)
    );
  }, [labels, searchTerm]);
  const metrics = useMemo(() => buildLabelMetrics(labels), [labels]);

  function openCreateModal() {
    if (!canMutate) {
      return;
    }

    setEditingRecord(null);
    setModalOpen(true);
  }

  function openEditModal(label) {
    if (!canMutate) {
      return;
    }

    setEditingRecord(records.find((record) => record.id === label.id) || label);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    if (editingRecord) {
      await updateRecord(editingRecord.id, payload);
    } else {
      await createRecord(payload);
    }

    setModalOpen(false);
    setEditingRecord(null);
  }

  async function handleDelete(label) {
    if (!canMutate) {
      return;
    }

    const confirmed = window.confirm(`Excluir "${label.name}"?`);

    if (confirmed) {
      await deleteRecord(label.id);
    }
  }

  function handleExport() {
    exportLabels(filteredLabels, snapshot);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="plus"
        actionLabel={canMutate ? config.actionLabel : ""}
        description={config.description}
        title={config.title}
        onAction={openCreateModal}
      />

      {/* --- SECAO: FILTROS E EXPORTACAO --- */}
      <div className="flex items-center justify-between gap-4">
        <TextInput
          className="w-96"
          icon="search"
          placeholder="Buscar por layout, categoria ou vinculo"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <Button icon="download" variant="secondary" onClick={handleExport}>
          Exportar
        </Button>
      </div>

      {/* --- SECAO: INDICADORES DE IDENTIDADE --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: REPOSITORIO VISUAL --- */}
      <LabelRepositoryGrid
        canMutate={canMutate}
        labels={filteredLabels}
        onDelete={handleDelete}
        onDownload={downloadLabelLayout}
        onEdit={openEditModal}
        onPreview={setPreviewLabel}
      />

      <EntityFormModal
        description={config.formDescription}
        editingRecord={editingRecord}
        fields={config.fields}
        open={modalOpen}
        snapshot={snapshot}
        title={config.formTitle}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <LabelPreviewModal
        label={previewLabel}
        open={Boolean(previewLabel)}
        onClose={() => setPreviewLabel(null)}
        onDownload={downloadLabelLayout}
      />
    </div>
  );
}
