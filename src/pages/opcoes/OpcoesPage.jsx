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
  buildOptionFeedbackMessage,
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
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
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
    setErrorMessage("");
    setFeedbackMessage("");
    setModalOpen(true);
  }

  function openEditModal(option) {
    if (!canMutate) {
      return;
    }

    setActiveGroup(option.group);
    setEditingRecord(option);
    setErrorMessage("");
    setFeedbackMessage("");
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    setErrorMessage("");
    const validationMessage = validateOptionPayload(payload, records, editingRecord);

    if (validationMessage) {
      throw new Error(validationMessage);
    }

    const nextPayload = buildOptionPayload(payload);
    const isEditing = Boolean(editingRecord);

    if (editingRecord) {
      await updateRecord(editingRecord.id, nextPayload);
    } else {
      await createRecord(nextPayload);
    }

    setActiveGroup(nextPayload.group);
    setFeedbackMessage(buildOptionFeedbackMessage(nextPayload.group, isEditing));
    setModalOpen(false);
    setEditingRecord(null);
  }

  async function handleDelete(option) {
    if (!canMutate) {
      return;
    }

    const confirmed = window.confirm(`Excluir "${option.name}"?`);

    if (confirmed) {
      setErrorMessage("");
      setFeedbackMessage("");

      try {
        await deleteRecord(option.id);
      } catch (error) {
        setErrorMessage(error.message);
      }
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

      {/* --- SECAO: ORIENTACAO DA PAGINA --- */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="text-xs font-black uppercase text-amiste-red">Central de opcoes reutilizaveis</span>
            <p className="mt-2 text-sm font-semibold leading-6 text-amiste-gray">
              Esta pagina permite cadastrar opcoes reutilizaveis no sistema, como marcas, ferramentas,
              bebidas, insumos, acessorios, status e parametros que aparecem em formularios e paginas relacionadas.
            </p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <strong className="block text-sm font-black text-amiste-black">O que esta pagina nao faz</strong>
            <p className="mt-2 text-sm font-semibold leading-6 text-amiste-gray">
              Ela nao cria novas paginas, modulos ou funcionalidades. Cada opcao cadastrada apenas alimenta
              listas e campos ja existentes no ERP.
            </p>
          </div>
        </div>
      </section>

      {feedbackMessage ? (
        <div className="rounded-md border border-amiste-green/25 bg-amiste-green/10 px-4 py-3 text-sm font-bold text-amiste-green">
          {feedbackMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
          {errorMessage}
        </div>
      ) : null}

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
