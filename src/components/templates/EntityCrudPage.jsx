import { useMemo, useState } from "react";
import Button from "../atoms/Button.jsx";
import TextInput from "../atoms/TextInput.jsx";
import PageHeader from "../molecules/PageHeader.jsx";
import DataTable from "../organisms/DataTable.jsx";
import DocumentPreviewModal from "../organisms/DocumentPreviewModal.jsx";
import EntityCardsGrid from "../organisms/EntityCardsGrid.jsx";
import EntityFormModal from "../organisms/EntityFormModal.jsx";
import ProposalEditorModal from "../organisms/ProposalEditorModal.jsx";
import RecordDetailModal from "../organisms/RecordDetailModal.jsx";
import RelatedRecordsHub from "../organisms/RelatedRecordsHub.jsx";
import ServiceSheetEditorModal from "../organisms/ServiceSheetEditorModal.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import { buildExportColumnsFromConfig, exportRecordsToCsv } from "../../services/exportService.js";
import { getRolePermissions } from "../../services/permissionService.js";

function recordMatchesSearch(record, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  return Object.values(record).join(" ").toLowerCase().includes(searchTerm.toLowerCase());
}

export default function EntityCrudPage({ config, accessLevel = "AC", showHeader = true, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [activeHub, setActiveHub] = useState(null);
  const [hubParentRecord, setHubParentRecord] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const { records, createRecord, updateRecord, deleteRecord } = useCollection(config.collection);
  const { snapshot } = useErpSnapshot();
  const canMutate = accessLevel === "AC";
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canCreate = canMutate && rolePermissions["action:create"] === "AC";
  const canUpdate = canMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canDelete = canMutate && rolePermissions["action:delete"] === "AC";
  const visibleExtraActions = useMemo(() => {
    return (config.extraActions || []).filter((action) => !action.permissionId || rolePermissions[action.permissionId] !== "OC");
  }, [config.extraActions, rolePermissions]);

  const filteredRecords = useMemo(
    () => records.filter((record) => recordMatchesSearch(record, searchTerm)),
    [records, searchTerm]
  );

  function openCreateModal() {
    if (!canCreate) {
      return;
    }

    setEditingRecord(null);
    setModalOpen(true);
  }

  function openEditModal(record) {
    if (!canUpdate) {
      return;
    }

    setEditingRecord(record);
    setModalOpen(true);
  }

  async function handleSubmit(payload, options = {}) {
    const targetId = options.targetId || editingRecord?.id;

    if (targetId) {
      await updateRecord(targetId, payload);
    } else {
      await createRecord(payload);
    }

    setModalOpen(false);
    setEditingRecord(null);
  }

  async function handleDelete(record) {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(`Excluir "${record.name || record.code || record.id}"?`);

    if (confirmed) {
      await deleteRecord(record.id);
    }
  }

  function handleExtraAction(action, record) {
    if (action.type === "detail") {
      setDetailRecord(record);
      return;
    }

    if (action.type === "hub") {
      setActiveHub(action.hub);
      setHubParentRecord(record);
      return;
    }

    if (action.type === "document") {
      setDocumentPreview({
        documentType: action.documentType,
        record,
      });
    }
  }

  function handleExport() {
    exportRecordsToCsv({
      columns: buildExportColumnsFromConfig(config),
      filename: config.title,
      records: filteredRecords,
      snapshot,
    });
  }

  return (
    <div className="space-y-6">
      {/* --- SECAO: CABECALHO E FILTROS --- */}
      {showHeader ? (
        <PageHeader
          actionIcon="plus"
          actionLabel={canCreate ? config.actionLabel : ""}
          description={config.description}
          title={config.title}
          onAction={openCreateModal}
        />
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <TextInput
          className="w-96"
          icon="search"
          placeholder={config.searchPlaceholder || "Buscar registros"}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <div className="flex gap-2">
          {!showHeader && canCreate ? (
            <Button icon="plus" onClick={openCreateModal}>
              {config.actionLabel}
            </Button>
          ) : null}
          <Button icon="download" variant="secondary" onClick={handleExport}>
            Exportar
          </Button>
        </div>
      </div>

      {/* --- SECAO: LISTAGEM PRINCIPAL --- */}
      {config.layout === "cards" ? (
        <EntityCardsGrid
          card={config.card}
          actions={canUpdate || canDelete}
          canDelete={canDelete}
          canEdit={canUpdate}
          extraActions={visibleExtraActions}
          records={filteredRecords}
          snapshot={snapshot}
          onDelete={handleDelete}
          onEdit={openEditModal}
          onExtraAction={handleExtraAction}
        />
      ) : (
        <DataTable
          columns={config.columns}
          actions={canUpdate || canDelete}
          canDelete={canDelete}
          canEdit={canUpdate}
          extraActions={visibleExtraActions}
          records={filteredRecords}
          snapshot={snapshot}
          onDelete={handleDelete}
          onEdit={openEditModal}
          onExtraAction={handleExtraAction}
        />
      )}

      {config.collection === "proposals" ? (
        <ProposalEditorModal
          editingRecord={editingRecord}
          open={modalOpen}
          snapshot={snapshot}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : config.collection === "serviceSheets" ? (
        <ServiceSheetEditorModal
          editingRecord={editingRecord}
          open={modalOpen}
          snapshot={snapshot}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : (
        <EntityFormModal
          description={config.formDescription}
          editingRecord={editingRecord}
          fields={config.fields}
          livePreviewDocumentType={config.livePreviewDocumentType}
          open={modalOpen}
          smartSummary={config.smartSummary}
          snapshot={snapshot}
          title={config.formTitle}
          validate={config.validate}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <RecordDetailModal
        config={config.detail}
        open={Boolean(detailRecord && config.detail)}
        record={detailRecord}
        snapshot={snapshot}
        onClose={() => setDetailRecord(null)}
      />

      {activeHub ? (
        <RelatedRecordsHub
          canCreate={canCreate}
          canDelete={canDelete}
          canMutate={canMutate}
          canUpdate={canUpdate}
          hub={activeHub}
          open={Boolean(hubParentRecord)}
          parentRecord={hubParentRecord}
          snapshot={snapshot}
          onClose={() => {
            setActiveHub(null);
            setHubParentRecord(null);
          }}
        />
      ) : null}

      <DocumentPreviewModal
        documentType={documentPreview?.documentType}
        open={Boolean(documentPreview)}
        record={documentPreview?.record}
        snapshot={snapshot}
        onClose={() => setDocumentPreview(null)}
      />
    </div>
  );
}
