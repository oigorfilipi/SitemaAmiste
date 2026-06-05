import { useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
import FormSection from "../../components/molecules/FormSection.jsx";
import Modal from "../../components/molecules/Modal.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import PricingAttentionPanel from "../../components/organisms/PricingAttentionPanel.jsx";
import PricingTable from "../../components/organisms/PricingTable.jsx";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  PRICING_GROUPS,
  buildPricingFormData,
  buildPricingMetrics,
  buildPricingRows,
  exportPricingRows,
  getPricingGroup,
  savePricingUpdate,
} from "../../services/pricingService.js";
import { getRolePermissions, getScopedCollectionAccess } from "../../services/permissionService.js";

export default function PrecosPage({ accessLevel = "OC", user }) {
  const [activeGroup, setActiveGroup] = useState("machines");
  const [editingItem, setEditingItem] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({});
  const { snapshot, refresh } = useErpSnapshot();
  const group = getPricingGroup(activeGroup);
  const records = useMemo(() => buildPricingRows(snapshot, activeGroup), [activeGroup, snapshot]);
  const metrics = useMemo(() => buildPricingMetrics(snapshot, activeGroup), [activeGroup, snapshot]);
  const activeGroupAccess = getScopedCollectionAccess(user?.role, "pricing", activeGroup);
  const canMutate = accessLevel === "AC" && activeGroupAccess === "AC";
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canUpdate = canMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canDownload = rolePermissions["action:download"] !== "OC";

  function openEdit(item) {
    if (!canUpdate) {
      return;
    }

    setEditingItem(item);
    setErrorMessage("");
    setFormData(buildPricingFormData(group, item));
  }

  function handleFieldChange(fieldKey, value) {
    setFormData((currentData) => ({
      ...currentData,
      [fieldKey]: Number(value || 0),
    }));
  }

  function handleExportPricing() {
    if (!canDownload) {
      return;
    }

    exportPricingRows({
      groupId: activeGroup,
      rows: records,
      snapshot,
    });
  }

  async function savePrice(event) {
    event.preventDefault();

    if (!canUpdate) {
      setErrorMessage("Voce nao tem permissao para alterar precos.");
      return;
    }

    setErrorMessage("");

    try {
      await savePricingUpdate({
        collectionName: activeGroup,
        formData,
        group,
        item: editingItem,
      });
      setEditingItem(null);
      await refresh();
    } catch (error) {
      setErrorMessage(error.message || "Nao foi possivel salvar a precificacao.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="download"
        actionLabel={canDownload ? "Exportar Tabela" : ""}
        description="Gestao de tabelas de precos, descontos e promocoes."
        title="Precificacao"
        onAction={handleExportPricing}
      />

      {/* --- SECAO: ABAS DE PRECIFICACAO --- */}
      <EntityGroupTabs activeGroup={activeGroup} groups={PRICING_GROUPS} onSelectGroup={setActiveGroup} />

      {/* --- SECAO: INDICADORES COMERCIAIS --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: TABELA E ALERTAS --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PricingTable canMutate={canUpdate} records={records} onEdit={openEdit} />
        <PricingAttentionPanel canMutate={canUpdate} records={records} onEdit={openEdit} />
      </div>

      <Modal
        description="Altere os valores base. Propostas, checklists e vendas ja criados preservam seus valores."
        open={Boolean(editingItem)}
        title={`Editar preco - ${editingItem?.name || ""}`}
        onClose={() => setEditingItem(null)}
      >
        <form className="space-y-4" onSubmit={savePrice}>
          <FormSection eyebrow="Precos" title="Valores base">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {group.fields.map((field) => (
                <label key={field.key}>
                  <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">{field.label}</span>
                  <TextInput
                    min="0"
                    step="0.01"
                    type="number"
                    value={formData[field.key] ?? ""}
                    onChange={(event) => handleFieldChange(field.key, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </FormSection>

          <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <span className="text-xs font-black uppercase text-amiste-gray/50">Resumo em tempo real</span>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {group.fields.map((field) => (
                <div className="rounded-md bg-white p-3" key={`summary-${field.key}`}>
                  <span className="text-xs font-black uppercase text-amiste-gray/50">{field.label}</span>
                  <strong className="mt-1 block text-sm font-black text-amiste-black">
                    {new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(Number(formData[field.key] || 0))}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          {errorMessage ? (
            <div className="rounded-md border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
              {errorMessage}
            </div>
          ) : null}

          <footer className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button icon="pencil" type="submit">
              Salvar Valor
            </Button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}
