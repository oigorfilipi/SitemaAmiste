import { useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import ChecklistOperationsTable from "../../components/organisms/ChecklistOperationsTable.jsx";
import ChecklistRiskPanel from "../../components/organisms/ChecklistRiskPanel.jsx";
import EntityFormModal from "../../components/organisms/EntityFormModal.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import RecordDetailModal from "../../components/organisms/RecordDetailModal.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  CHECKLIST_FILTERS,
  buildChecklistMetrics,
  buildChecklistRows,
  exportChecklistRows,
  filterChecklistRows,
  finalizeChecklist,
} from "../../services/checklistService.js";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function ChecklistsPage({ accessLevel }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const config = moduleConfigs.checklists;
  const { records, createRecord, updateRecord, refresh } = useCollection("checklists");
  const { snapshot, refresh: refreshSnapshot } = useErpSnapshot();
  const canMutate = accessLevel === "AC";
  const rows = useMemo(() => buildChecklistRows(records, snapshot), [records, snapshot]);
  const filteredRows = useMemo(() => {
    const filteredByStatus = filterChecklistRows(rows, activeFilter);
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return filteredByStatus;
    }

    return filteredByStatus.filter((row) =>
      [row.code, row.clientName, row.machineName, row.technician, row.serviceType, row.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedTerm)
    );
  }, [activeFilter, rows, searchTerm]);
  const metrics = useMemo(() => buildChecklistMetrics(rows), [rows]);

  function openCreateModal() {
    if (!canMutate) {
      return;
    }

    setEditingRecord(null);
    setErrorMessage("");
    setModalOpen(true);
  }

  function openEditModal(row) {
    if (!canMutate) {
      return;
    }

    setEditingRecord(records.find((record) => record.id === row.id) || row);
    setErrorMessage("");
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    if (editingRecord) {
      if (payload.status === "finalizado" && editingRecord.status !== "finalizado") {
        await updateRecord(editingRecord.id, { ...payload, status: editingRecord.status });
        await finalizeChecklist({ ...editingRecord, ...payload, status: editingRecord.status }, snapshot);
      } else {
        await updateRecord(editingRecord.id, payload);
      }
    } else {
      await createRecord(payload);
    }

    setModalOpen(false);
    setEditingRecord(null);
    await Promise.all([refresh(), refreshSnapshot()]);
  }

  async function handleFinalize(row) {
    setErrorMessage("");

    try {
      await finalizeChecklist(row, snapshot);
      await Promise.all([refresh(), refreshSnapshot()]);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function handleExport() {
    exportChecklistRows(filteredRows, snapshot);
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

      {/* --- SECAO: INDICADORES OPERACIONAIS --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: FILTROS E EXPORTACAO --- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <EntityGroupTabs activeGroup={activeFilter} groups={CHECKLIST_FILTERS} onSelectGroup={setActiveFilter} />
        <div className="flex gap-2">
          <TextInput
            className="w-80"
            icon="search"
            placeholder="Buscar checklist"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Button icon="download" variant="secondary" onClick={handleExport}>
            Exportar
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
          {errorMessage}
        </div>
      ) : null}

      {/* --- SECAO: TABELA E RISCOS --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ChecklistOperationsTable
          canMutate={canMutate}
          rows={filteredRows}
          onDetails={setDetailRecord}
          onEdit={openEditModal}
          onFinalize={handleFinalize}
        />
        <ChecklistRiskPanel canMutate={canMutate} rows={rows} onFinalize={handleFinalize} />
      </div>

      <EntityFormModal
        description={config.formDescription}
        editingRecord={editingRecord}
        fields={config.fields}
        open={modalOpen}
        snapshot={snapshot}
        title={config.formTitle}
        validate={config.validate}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <RecordDetailModal
        config={config.detail}
        open={Boolean(detailRecord)}
        record={detailRecord}
        snapshot={snapshot}
        onClose={() => setDetailRecord(null)}
      />
    </div>
  );
}
