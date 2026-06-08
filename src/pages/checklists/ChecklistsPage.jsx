import { useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import ChecklistEditorModal from "../../components/organisms/ChecklistEditorModal.jsx";
import ChecklistOperationsTable from "../../components/organisms/ChecklistOperationsTable.jsx";
import ChecklistRiskPanel from "../../components/organisms/ChecklistRiskPanel.jsx";
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
import { getRolePermissions } from "../../services/permissionService.js";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function ChecklistsPage({ accessLevel, user }) {
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
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canCreate = canMutate && rolePermissions["action:create"] === "AC";
  const canUpdate = canMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canDownload = rolePermissions["action:download"] !== "OC";
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
    if (!canCreate) {
      return;
    }

    setEditingRecord(null);
    setErrorMessage("");
    setModalOpen(true);
  }

  function openEditModal(row) {
    if (!canUpdate) {
      return;
    }

    setEditingRecord(records.find((record) => record.id === row.id) || row);
    setErrorMessage("");
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    if ((editingRecord && !canUpdate) || (!editingRecord && !canCreate)) {
      setErrorMessage("Voce nao tem permissao para salvar este checklist.");
      return;
    }

    const wantsFinalize = payload.status === "finalizado";

    if (editingRecord) {
      if (wantsFinalize && editingRecord.status !== "finalizado") {
        const draftStatus = editingRecord.status || "rascunho";

        await updateRecord(editingRecord.id, { ...payload, status: draftStatus });
        await finalizeChecklist({ ...editingRecord, ...payload, status: draftStatus }, snapshot);
      } else {
        await updateRecord(editingRecord.id, payload);
      }
    } else {
      const createdRecord = await createRecord(wantsFinalize ? { ...payload, status: "rascunho" } : payload);

      if (wantsFinalize) {
        await finalizeChecklist({ ...createdRecord, ...payload, status: "rascunho" }, snapshot);
      }
    }

    setModalOpen(false);
    setEditingRecord(null);
    await Promise.all([refresh(), refreshSnapshot()]);
  }

  async function handleFinalize(row) {
    if (!canUpdate) {
      setErrorMessage("Voce nao tem permissao para finalizar este checklist.");
      return;
    }

    setErrorMessage("");

    try {
      await finalizeChecklist(row, snapshot);
      await Promise.all([refresh(), refreshSnapshot()]);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function handleExport() {
    if (!canDownload) {
      return;
    }

    exportChecklistRows(filteredRows, snapshot);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="plus"
        actionLabel={canCreate ? config.actionLabel : ""}
        description={config.description}
        icon={config.icon}
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
          <Button disabled={!canDownload} icon="download" variant="secondary" onClick={handleExport}>
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
          canFinalize={canUpdate}
          canMutate={canUpdate}
          rows={filteredRows}
          onDetails={setDetailRecord}
          onEdit={openEditModal}
          onFinalize={handleFinalize}
        />
        <ChecklistRiskPanel canMutate={canUpdate} rows={rows} onFinalize={handleFinalize} />
      </div>

      <ChecklistEditorModal
        editingRecord={editingRecord}
        open={modalOpen}
        snapshot={snapshot}
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
