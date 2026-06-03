import { useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
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
import { getScopedCollectionAccess } from "../../services/permissionService.js";

export default function PrecosPage({ user }) {
  const [activeGroup, setActiveGroup] = useState("machines");
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const { snapshot, refresh } = useErpSnapshot();
  const group = getPricingGroup(activeGroup);
  const records = useMemo(() => buildPricingRows(snapshot, activeGroup), [activeGroup, snapshot]);
  const metrics = useMemo(() => buildPricingMetrics(snapshot, activeGroup), [activeGroup, snapshot]);
  const activeGroupAccess = getScopedCollectionAccess(user?.role, "pricing", activeGroup);
  const canMutate = activeGroupAccess === "AC";

  function openEdit(item) {
    if (!canMutate) {
      return;
    }

    setEditingItem(item);
    setFormData(buildPricingFormData(group, item));
  }

  function handleFieldChange(fieldKey, value) {
    setFormData((currentData) => ({
      ...currentData,
      [fieldKey]: Number(value || 0),
    }));
  }

  function handleExportPricing() {
    exportPricingRows({
      groupId: activeGroup,
      rows: records,
      snapshot,
    });
  }

  async function savePrice(event) {
    event.preventDefault();
    await savePricingUpdate({
      collectionName: activeGroup,
      formData,
      group,
      item: editingItem,
    });
    setEditingItem(null);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="download"
        actionLabel="Exportar Tabela"
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
        <PricingTable canMutate={canMutate} records={records} onEdit={openEdit} />
        <PricingAttentionPanel canMutate={canMutate} records={records} onEdit={openEdit} />
      </div>

      <Modal
        description="Altere os valores base. Propostas, checklists e vendas ja criados preservam seus valores."
        open={Boolean(editingItem)}
        title={`Editar preco - ${editingItem?.name || ""}`}
        onClose={() => setEditingItem(null)}
      >
        <form className="space-y-4" onSubmit={savePrice}>
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
