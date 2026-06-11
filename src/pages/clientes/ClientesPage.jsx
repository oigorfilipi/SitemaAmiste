import { useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import ConfirmDialog from "../../components/molecules/ConfirmDialog.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import Client360Panel from "../../components/organisms/Client360Panel.jsx";
import ClientPortfolioTable from "../../components/organisms/ClientPortfolioTable.jsx";
import EntityFormModal from "../../components/organisms/EntityFormModal.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  buildClientMetrics,
  buildClientRows,
  exportClientRows,
  filterClientRows,
} from "../../services/clientService.js";
import { getRolePermissions } from "../../services/permissionService.js";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function ClientesPage({ accessLevel, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [pendingDeleteClient, setPendingDeleteClient] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const config = moduleConfigs.clients;
  const { records, createRecord, deleteRecord, updateRecord } = useCollection("clients");
  const { snapshot } = useErpSnapshot();
  const canMutate = accessLevel === "AC";
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canCreate = canMutate && rolePermissions["action:create"] === "AC";
  const canUpdate = canMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canDelete = canMutate && rolePermissions["action:delete"] === "AC";
  const canDownload = rolePermissions["action:download"] !== "OC";
  const rows = useMemo(() => buildClientRows(records, snapshot), [records, snapshot]);
  const filteredRows = useMemo(() => filterClientRows(rows, searchTerm), [rows, searchTerm]);
  const selectedClient = rows.find((client) => client.id === selectedClientId) || filteredRows[0] || null;
  const metrics = useMemo(() => buildClientMetrics(rows), [rows]);

  useEffect(() => {
    if (!selectedClientId && filteredRows[0]) {
      setSelectedClientId(filteredRows[0].id);
    }
  }, [filteredRows, selectedClientId]);

  function openCreateModal() {
    if (!canCreate) {
      return;
    }

    setEditingRecord(null);
    setErrorMessage("");
    setModalOpen(true);
  }

  function openEditModal(client) {
    if (!canUpdate) {
      return;
    }

    setEditingRecord(records.find((record) => record.id === client.id) || client);
    setErrorMessage("");
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    if ((editingRecord && !canUpdate) || (!editingRecord && !canCreate)) {
      setErrorMessage("Voce nao tem permissao para salvar este cliente.");
      return;
    }

    setErrorMessage("");

    if (editingRecord) {
      await updateRecord(editingRecord.id, payload);
    } else {
      const createdClient = await createRecord(payload);
      setSelectedClientId(createdClient.id);
    }

    setModalOpen(false);
    setEditingRecord(null);
  }

  async function handleDelete(client) {
    if (!canDelete) {
      return;
    }

    setPendingDeleteClient(client);
  }

  async function confirmDeleteClient() {
    if (!pendingDeleteClient) {
      return;
    }

    setErrorMessage("");

    try {
      await deleteRecord(pendingDeleteClient.id);
      setSelectedClientId("");
      setPendingDeleteClient(null);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function handleExport() {
    if (!canDownload) {
      return;
    }

    exportClientRows(filteredRows, snapshot);
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

      {/* --- SECAO: INDICADORES DO CLIENTE --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: FILTROS E EXPORTACAO --- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TextInput
          className="w-96"
          icon="search"
          placeholder="Buscar cliente, contrato, maquina ou pendencia"
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

      {/* --- SECAO: CARTEIRA E VISAO 360 --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ClientPortfolioTable
          canDelete={canDelete}
          canEdit={canUpdate}
          canMutate={canUpdate || canDelete}
          rows={filteredRows}
          selectedClientId={selectedClient?.id}
          onDelete={handleDelete}
          onEdit={openEditModal}
          onSelect={(client) => setSelectedClientId(client.id)}
        />
        <Client360Panel client={selectedClient} />
      </div>

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
      <ConfirmDialog
        confirmLabel="Excluir cliente"
        description={`Excluir "${pendingDeleteClient?.name || "cliente"}"? Os registros vinculados continuam no historico local.`}
        open={Boolean(pendingDeleteClient)}
        title="Excluir cliente"
        onCancel={() => setPendingDeleteClient(null)}
        onConfirm={confirmDeleteClient}
      />
    </div>
  );
}
