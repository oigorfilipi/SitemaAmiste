import { useEffect, useMemo, useState } from "react";
import AppIcon from "../../components/atoms/AppIcon.jsx";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import ConfirmDialog from "../../components/molecules/ConfirmDialog.jsx";
import Modal from "../../components/molecules/Modal.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import EntityFormModal from "../../components/organisms/EntityFormModal.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import OptionGroupList from "../../components/organisms/OptionGroupList.jsx";
import OptionValuePanel from "../../components/organisms/OptionValuePanel.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import {
  buildOptionAreaTabs,
  buildOptionGroups,
  buildOptionFeedbackMessage,
  buildOptionMetrics,
  buildOptionPayload,
  exportOptions,
  filterOptionGroupsByArea,
  filterOptionGroups,
  getOptionGroupArea,
  resolveOptionInternalValue,
  shouldShowOptionInternalValue,
  validateOptionPayload,
} from "../../services/optionCenterService.js";
import { getRolePermissions } from "../../services/permissionService.js";
import { cn } from "../../utils/cn.js";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function OpcoesPage({ accessLevel, user }) {
  const [activeArea, setActiveArea] = useState("");
  const [activeGroup, setActiveGroup] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [pendingDeleteOption, setPendingDeleteOption] = useState(null);
  const [valueEditOption, setValueEditOption] = useState(null);
  const [valueEditDraft, setValueEditDraft] = useState("");
  const [valueEditError, setValueEditError] = useState("");
  const [valueEditLoading, setValueEditLoading] = useState(false);
  const config = moduleConfigs.options;
  const { records, createRecord, deleteRecord, updateRecord } = useCollection("options");
  const canMutate = accessLevel === "AC";
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canCreate = canMutate && rolePermissions["action:create"] === "AC";
  const canUpdate = canMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canDelete = canMutate && rolePermissions["action:delete"] === "AC";
  const canDownload = rolePermissions["action:download"] !== "OC";
  const groups = useMemo(() => buildOptionGroups(records), [records]);
  const areaTabs = useMemo(() => buildOptionAreaTabs(groups), [groups]);
  const selectedArea = areaTabs.find((area) => area.id === activeArea) || areaTabs[0] || null;
  const areaGroups = useMemo(() =>
    selectedArea ? filterOptionGroupsByArea(groups, selectedArea.id) : [],
  [groups, selectedArea]);
  const filteredGroups = useMemo(() => filterOptionGroups(areaGroups, searchTerm), [areaGroups, searchTerm]);
  const selectedGroup = filteredGroups.find((group) => group.id === activeGroup) || filteredGroups[0] || null;
  const metrics = useMemo(() => buildOptionMetrics(records), [records]);
  const formFields = useMemo(() => config.fields.map((field) => {
    if (field.name === "group") {
      return { ...field, defaultValue: activeGroup || selectedGroup?.id || "" };
    }

    if (field.name === "value") {
      return {
        ...field,
        autoFill: (data, _snapshot, currentRecord) => resolveOptionInternalValue(data, currentRecord),
        autoFillDependencies: ["group", "name"],
        clearWhenHidden: false,
        helpText: "Campo tecnico usado apenas em status e cargos. Nos demais grupos, o sistema preenche automaticamente.",
        label: "Codigo tecnico",
        placeholder: "Ex: aguardando_aprovacao",
        visibleWhen: (data) => shouldShowOptionInternalValue(data.group),
      };
    }

    return field;
  }), [activeGroup, config.fields, selectedGroup?.id]);

  useEffect(() => {
    if (!areaTabs.length) {
      return;
    }

    if (!activeArea || !areaTabs.some((area) => area.id === activeArea)) {
      setActiveArea(areaTabs[0].id);
    }
  }, [activeArea, areaTabs]);

  useEffect(() => {
    if (selectedGroup && activeGroup !== selectedGroup.id) {
      setActiveGroup(selectedGroup.id);
      return;
    }

    if (!selectedGroup && activeGroup) {
      setActiveGroup("");
    }
  }, [activeGroup, selectedGroup]);

  function handleSelectArea(areaId) {
    setActiveArea(areaId);
    setActiveGroup("");
  }

  function openCreateModal(groupId = activeGroup || selectedGroup?.id) {
    if (!canCreate) {
      return;
    }

    if (!groupId) {
      return;
    }

    setActiveGroup(groupId);
    setEditingRecord(null);
    setErrorMessage("");
    setFeedbackMessage("");
    setModalOpen(true);
  }

  function openEditModal(option) {
    if (!canUpdate) {
      return;
    }

    setActiveGroup(option.group);
    setEditingRecord(option);
    setErrorMessage("");
    setFeedbackMessage("");
    setModalOpen(true);
  }

  function normalizeOptionText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function openEditValueModal(option) {
    if (!canUpdate) {
      return;
    }

    setValueEditOption(option);
    setValueEditDraft(option.value || "");
    setValueEditError("");
    setFeedbackMessage("");
    setErrorMessage("");
  }

  function closeEditValueModal(force = false) {
    if (valueEditLoading && !force) {
      return;
    }

    setValueEditOption(null);
    setValueEditDraft("");
    setValueEditError("");
  }

  async function handleSubmitValueEdit(event) {
    event.preventDefault();

    if (!valueEditOption || !canUpdate) {
      return;
    }

    const nextValue = String(valueEditDraft || "").trim();

    if (!nextValue) {
      setValueEditError("Informe o valor interno desta opcao.");
      return;
    }

    const duplicated = records.some((option) =>
      option.id !== valueEditOption.id &&
      normalizeOptionText(option.group) === normalizeOptionText(valueEditOption.group) &&
      normalizeOptionText(option.value) === normalizeOptionText(nextValue)
    );

    if (duplicated) {
      setValueEditError(`Ja existe outra opcao em ${valueEditOption.group} usando este valor interno.`);
      return;
    }

    setValueEditLoading(true);
    setValueEditError("");

    try {
      await updateRecord(valueEditOption.id, {
        ...valueEditOption,
        value: nextValue,
      });
      setFeedbackMessage(`Valor interno de "${valueEditOption.name}" atualizado com sucesso.`);
      closeEditValueModal(true);
    } catch (error) {
      setValueEditError(error.message || "Nao foi possivel atualizar o valor interno.");
    } finally {
      setValueEditLoading(false);
    }
  }

  async function handleSubmit(payload) {
    if ((editingRecord && !canUpdate) || (!editingRecord && !canCreate)) {
      setErrorMessage("Voce nao tem permissao para salvar esta opcao.");
      return;
    }

    setErrorMessage("");
    const validationMessage = validateOptionPayload(payload, records, editingRecord);

    if (validationMessage) {
      throw new Error(validationMessage);
    }

    const nextPayload = buildOptionPayload(payload, editingRecord);
    const isEditing = Boolean(editingRecord);

    if (editingRecord) {
      await updateRecord(editingRecord.id, nextPayload);
    } else {
      await createRecord(nextPayload);
    }

    setActiveGroup(nextPayload.group);
    setActiveArea(getOptionGroupArea(nextPayload.group).id);
    setFeedbackMessage(buildOptionFeedbackMessage(nextPayload.group, isEditing));
    setModalOpen(false);
    setEditingRecord(null);
  }

  async function handleDelete(option) {
    if (!canDelete) {
      return;
    }

    setPendingDeleteOption(option);
  }

  async function confirmDeleteOption() {
    if (!pendingDeleteOption) {
      return;
    }

    setErrorMessage("");
    setFeedbackMessage("");

    try {
      await deleteRecord(pendingDeleteOption.id);
      setPendingDeleteOption(null);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function handleExport() {
    if (!canDownload) {
      return;
    }

    const exportedRecords = selectedGroup?.options || areaGroups.flatMap((group) => group.options);
    const filenameSuffix = selectedGroup?.label || selectedArea?.label || "opcoes-do-sistema";

    exportOptions(exportedRecords, `opcoes-${filenameSuffix}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="plus"
        actionLabel={canCreate ? config.actionLabel : ""}
        description={config.description}
        icon={config.icon}
        title={config.title}
        onAction={() => openCreateModal(activeGroup)}
      />

      {/* --- SECAO: ORIENTACAO DA PAGINA --- */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="text-xs font-black uppercase text-amiste-red">Central de opcoes reutilizaveis</span>
            <p className="mt-2 text-sm font-semibold leading-6 text-amiste-gray">
              Esta pagina permite cadastrar opcoes reutilizaveis no sistema, como marcas, ferramentas,
              bebidas, insumos, acessorios, status e parametros que aparecem em formularios e paginas relacionadas.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
            <strong className="block text-sm font-black text-amiste-black">O que esta pagina nao faz</strong>
            <p className="mt-2 text-sm font-semibold leading-6 text-amiste-gray">
              Ela nao cria novas paginas, modulos ou funcionalidades. Cada opcao cadastrada apenas alimenta
              listas e campos ja existentes no ERP.
            </p>
          </div>
        </div>
      </section>

      {feedbackMessage ? (
        <div className="rounded-2xl border border-amiste-green/25 bg-amiste-green/10 px-4 py-3 text-sm font-bold text-amiste-green">
          {feedbackMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
          {errorMessage}
        </div>
      ) : null}

      {/* --- SECAO: INDICADORES DE OPCOES --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: BUSCA E EXPORTACAO --- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TextInput
          className="w-full sm:w-96"
          icon="search"
          placeholder={selectedArea ? `Buscar em ${selectedArea.label}` : "Buscar grupo, nome ou valor"}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <Button disabled={!canDownload} icon="download" variant="secondary" onClick={handleExport}>
          Exportar
        </Button>
      </div>

      {/* --- SECAO: ABAS POR AREA --- */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-1">
          <h2 className="font-display text-base font-black text-amiste-black">Areas das opcoes</h2>
          <p className="text-xs font-semibold text-amiste-gray/60">
            Escolha uma area para ver apenas os grupos usados naquele fluxo do sistema.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {areaTabs.map((area) => (
            <button
              className={cn(
                "flex min-h-24 items-start gap-3 rounded-2xl border p-3 text-left transition duration-200",
                selectedArea?.id === area.id
                  ? "border-amiste-red bg-amiste-red/10 text-amiste-red shadow-sm"
                  : "border-zinc-200 bg-zinc-50 text-amiste-black hover:-translate-y-px hover:border-amiste-red/30 hover:bg-white"
              )}
              key={area.id}
              type="button"
              onClick={() => handleSelectArea(area.id)}
            >
              <span className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl",
                selectedArea?.id === area.id ? "bg-amiste-red text-white" : "bg-white text-amiste-gray"
              )}>
                <AppIcon name={area.icon} size={18} />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm font-black">{area.label}</strong>
                <span className="mt-1 block text-xs font-bold text-amiste-gray/65">
                  {area.count} grupo(s) | {area.optionCount} opcao(oes)
                </span>
                <span className="mt-1 line-clamp-2 block text-xs font-semibold text-amiste-gray/55">
                  {area.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* --- SECAO: CENTRAL DE GRUPOS --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <OptionGroupList
          activeGroup={selectedGroup?.id}
          areaLabel={selectedArea?.label}
          groups={filteredGroups}
          onSelectGroup={setActiveGroup}
        />
        <OptionValuePanel
          canCreate={canCreate}
          canDelete={canDelete}
          canEdit={canUpdate}
          canMutate={canUpdate || canDelete}
          group={selectedGroup}
          onCreate={openCreateModal}
          onDelete={handleDelete}
          onEdit={openEditModal}
          onEditValue={openEditValueModal}
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
      <ConfirmDialog
        confirmLabel="Excluir opcao"
        description={`Excluir "${pendingDeleteOption?.name || "opcao"}"? Ela deixara de aparecer nos formularios que usam este grupo.`}
        open={Boolean(pendingDeleteOption)}
        title="Excluir opcao reutilizavel"
        onCancel={() => setPendingDeleteOption(null)}
        onConfirm={confirmDeleteOption}
      />
      <Modal
        description="Use este ajuste apenas para corrigir codigos/valores internos duplicados ou gravados errado."
        open={Boolean(valueEditOption)}
        title="Editar valor interno"
        onClose={closeEditValueModal}
      >
        <form className="space-y-4" onSubmit={handleSubmitValueEdit}>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <span className="text-xs font-black uppercase text-amiste-gray/55">Opcao selecionada</span>
            <strong className="mt-1 block font-display text-lg font-black text-amiste-black">
              {valueEditOption?.name || "-"}
            </strong>
            <p className="mt-1 text-sm font-semibold text-amiste-gray/65">
              Grupo: {valueEditOption?.group || "-"}
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-amiste-gray/60">
              Valor interno
            </span>
            <TextInput
              autoFocus
              placeholder="Ex: cafe_gourmet_01"
              value={valueEditDraft}
              onChange={(event) => setValueEditDraft(event.target.value)}
            />
          </label>

          {valueEditError ? (
            <div className="rounded-2xl border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
              {valueEditError}
            </div>
          ) : null}

          <footer className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
            <Button disabled={valueEditLoading} variant="secondary" onClick={closeEditValueModal}>
              Cancelar
            </Button>
            <Button icon="database" loading={valueEditLoading} type="submit">
              Salvar valor
            </Button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}
