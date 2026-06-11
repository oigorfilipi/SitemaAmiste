import { useMemo, useState } from "react";
import Button from "../atoms/Button.jsx";
import TextInput from "../atoms/TextInput.jsx";
import ConfirmDialog from "../molecules/ConfirmDialog.jsx";
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
  const [pendingDeleteRecord, setPendingDeleteRecord] = useState(null);
  const [activeHub, setActiveHub] = useState(null);
  const [hubParentRecord, setHubParentRecord] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { records, createRecord, updateRecord, deleteRecord } = useCollection(config.collection);
  const { snapshot } = useErpSnapshot();
  const canMutate = accessLevel === "AC";
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canCreate = canMutate && rolePermissions["action:create"] === "AC";
  const canUpdate = canMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canDelete = canMutate && rolePermissions["action:delete"] === "AC";
  const canDownload = rolePermissions["action:download"] !== "OC";
  const canUpload = rolePermissions["action:upload"] !== "OC";
  const canPrint = rolePermissions["action:print"] !== "OC";
  const visibleExtraActions = useMemo(() => {
    return (config.extraActions || [])
      .map((action) => ({
        ...action,
        accessLevel: action.permissionId ? rolePermissions[action.permissionId] || "OC" : "AC",
      }))
      .filter((action) => action.accessLevel !== "OC");
  }, [config.extraActions, rolePermissions]);
  const activeHubAccessLevel = activeHub?.accessLevel || "AC";
  const hubCanMutate = canMutate && activeHubAccessLevel === "AC";
  const hubCanCreate = hubCanMutate && rolePermissions["action:create"] === "AC";
  const hubCanUpdate = hubCanMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const hubCanDelete = hubCanMutate && rolePermissions["action:delete"] === "AC";

  const filteredRecords = useMemo(
    () => records.filter((record) => recordMatchesSearch(record, searchTerm)),
    [records, searchTerm]
  );

  function openCreateModal() {
    if (!canCreate) {
      return;
    }

    setErrorMessage("");
    setEditingRecord(null);
    setModalOpen(true);
  }

  function openEditModal(record) {
    if (!canUpdate) {
      return;
    }

    setErrorMessage("");
    setEditingRecord(record);
    setModalOpen(true);
  }

  async function handleSubmit(payload, options = {}) {
    setErrorMessage("");
    const targetId = options.targetId || editingRecord?.id;

    if (targetId && !canUpdate) {
      const error = new Error("Voce nao tem permissao para alterar este registro.");
      setErrorMessage(error.message);
      throw error;
    }

    if (!targetId && !canCreate) {
      const error = new Error("Voce nao tem permissao para criar este registro.");
      setErrorMessage(error.message);
      throw error;
    }

    try {
      if (targetId) {
        await updateRecord(targetId, payload);
      } else {
        await createRecord(payload);
      }

      setModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel salvar o registro.");
      throw error;
    }
  }

  async function handleDelete(record) {
    if (!canDelete) {
      return;
    }

    setPendingDeleteRecord(record);
  }

  async function confirmDeleteRecord() {
    if (!pendingDeleteRecord) {
      return;
    }

    setErrorMessage("");
    try {
      await deleteRecord(pendingDeleteRecord.id);
      setPendingDeleteRecord(null);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function handleExtraAction(action, record) {
    if (action.type === "detail") {
      setDetailRecord(record);
      return;
    }

    if (action.type === "hub") {
      setActiveHub({
        ...action.hub,
        accessLevel: action.accessLevel,
      });
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
    if (!canDownload) {
      return;
    }

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
          icon={config.icon}
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
          <Button disabled={!canDownload} icon="download" variant="secondary" onClick={handleExport}>
            Exportar
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
          {errorMessage}
        </div>
      ) : null}

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
          canDownload={canDownload}
          canPrint={canPrint}
          editingRecord={editingRecord}
          open={modalOpen}
          snapshot={snapshot}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : config.collection === "serviceSheets" ? (
        <ServiceSheetEditorModal
          canDownload={canDownload}
          canPrint={canPrint}
          editingRecord={editingRecord}
          open={modalOpen}
          snapshot={snapshot}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : (
        <EntityFormModal
          canUpload={canUpload}
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
          canCreate={hubCanCreate}
          canDelete={hubCanDelete}
          canMutate={hubCanMutate}
          canUpdate={hubCanUpdate}
          canUpload={canUpload}
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
        canDownload={canDownload}
        canPrint={canPrint}
        documentType={documentPreview?.documentType}
        open={Boolean(documentPreview)}
        record={documentPreview?.record}
        snapshot={snapshot}
        onClose={() => setDocumentPreview(null)}
      />

      <ConfirmDialog
        confirmLabel="Excluir"
        description={`Excluir "${pendingDeleteRecord?.name || pendingDeleteRecord?.code || pendingDeleteRecord?.id || "registro"}"? Esta acao remove o registro da base local.`}
        open={Boolean(pendingDeleteRecord)}
        title="Excluir registro"
        onCancel={() => setPendingDeleteRecord(null)}
        onConfirm={confirmDeleteRecord}
      />
    </div>
  );
}
