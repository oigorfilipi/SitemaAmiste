import { useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import EntityFormModal from "../../components/organisms/EntityFormModal.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import OptionGroupList from "../../components/organisms/OptionGroupList.jsx";
import OptionValuePanel from "../../components/organisms/OptionValuePanel.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import {
  buildOptionGroups,
  buildOptionMetrics,
  buildOptionPayload,
  exportOptions,
  filterOptionGroups,
  validateOptionPayload,
} from "../../services/optionCenterService.js";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function OpcoesPage({ accessLevel }) {
  const [activeGroup, setActiveGroup] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const config = moduleConfigs.options;
  const { records, createRecord, deleteRecord, updateRecord } = useCollection("options");
  const canMutate = accessLevel === "AC";
  const groups = useMemo(() => buildOptionGroups(records), [records]);
  const filteredGroups = useMemo(() => filterOptionGroups(groups, searchTerm), [groups, searchTerm]);
  const selectedGroup = groups.find((group) => group.id === activeGroup) || filteredGroups[0] || null;
  const metrics = useMemo(() => buildOptionMetrics(records), [records]);
  const formFields = useMemo(() => config.fields.map((field) =>
    field.name === "group" ? { ...field, defaultValue: activeGroup || selectedGroup?.id || "" } : field
  ), [activeGroup, config.fields, selectedGroup?.id]);

  useEffect(() => {
    if (!activeGroup && filteredGroups[0]) {
      setActiveGroup(filteredGroups[0].id);
    }
  }, [activeGroup, filteredGroups]);

  function openCreateModal(groupId = activeGroup) {
    if (!canMutate) {
      return;
    }

    setActiveGroup(groupId);
    setEditingRecord(null);
    setModalOpen(true);
  }

  function openEditModal(option) {
    if (!canMutate) {
      return;
    }

    setActiveGroup(option.group);
    setEditingRecord(option);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    const validationMessage = validateOptionPayload(payload, records, editingRecord);

    if (validationMessage) {
      throw new Error(validationMessage);
    }

    const nextPayload = buildOptionPayload(payload);

    if (editingRecord) {
      await updateRecord(editingRecord.id, nextPayload);
    } else {
      await createRecord(nextPayload);
    }

    setActiveGroup(nextPayload.group);
    setModalOpen(false);
    setEditingRecord(null);
  }

  async function handleDelete(option) {
    if (!canMutate) {
      return;
    }

    const confirmed = window.confirm(`Excluir "${option.name}"?`);

    if (confirmed) {
      await deleteRecord(option.id);
    }
  }

  function handleExport() {
    exportOptions(selectedGroup?.options || records, selectedGroup ? `opcoes-${selectedGroup.label}` : "opcoes-do-sistema");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="plus"
        actionLabel={canMutate ? config.actionLabel : ""}
        description={config.description}
        title={config.title}
        onAction={() => openCreateModal(activeGroup)}
      />

      {/* --- SECAO: INDICADORES DE OPCOES --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: BUSCA E EXPORTACAO --- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TextInput
          className="w-96"
          icon="search"
          placeholder="Buscar grupo, nome ou valor"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <Button icon="download" variant="secondary" onClick={handleExport}>
          Exportar
        </Button>
      </div>

      {/* --- SECAO: CENTRAL DE GRUPOS --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <OptionGroupList
          activeGroup={selectedGroup?.id}
          groups={filteredGroups}
          onSelectGroup={setActiveGroup}
        />
        <OptionValuePanel
          canMutate={canMutate}
          group={selectedGroup}
          onCreate={openCreateModal}
          onDelete={handleDelete}
          onEdit={openEditModal}
        />
      </div>

      <EntityFormModal
        description={config.formDescription}
        editingRecord={editingRecord}
        fields={formFields}
        open={modalOpen}
        snapshot={{}}
        title={config.formTitle}
        validate={(payload) => validateOptionPayload(payload, records, editingRecord)}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
