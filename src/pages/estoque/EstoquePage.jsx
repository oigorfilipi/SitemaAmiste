import { useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import TextArea from "../../components/atoms/TextArea.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
import Modal from "../../components/molecules/Modal.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import InventoryAuditTable from "../../components/organisms/InventoryAuditTable.jsx";
import InventoryRiskPanel from "../../components/organisms/InventoryRiskPanel.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  INVENTORY_GROUPS,
  buildInventoryMetrics,
  buildInventoryRows,
  exportInventoryRows,
  getInventoryGroup,
  saveInventoryCount,
} from "../../services/inventoryService.js";
import { getScopedCollectionAccess } from "../../services/permissionService.js";

export default function EstoquePage({ user }) {
  const [activeGroup, setActiveGroup] = useState("supplies");
  const [editingItem, setEditingItem] = useState(null);
  const [stockValue, setStockValue] = useState(0);
  const [countNotes, setCountNotes] = useState("");
  const { snapshot, refresh } = useErpSnapshot();
  const group = getInventoryGroup(activeGroup);
  const records = useMemo(() => buildInventoryRows(snapshot, activeGroup), [activeGroup, snapshot]);
  const metrics = useMemo(() => buildInventoryMetrics(snapshot, activeGroup), [activeGroup, snapshot]);
  const activeGroupAccess = getScopedCollectionAccess(user?.role, "inventory", activeGroup);
  const canMutate = activeGroupAccess === "AC";

  function openCount(item) {
    if (!canMutate) {
      return;
    }

    setEditingItem(item);
    setStockValue(item.stock || 0);
    setCountNotes("");
  }

  function handleExportInventory() {
    exportInventoryRows({
      groupId: activeGroup,
      rows: records,
      snapshot,
    });
  }

  async function saveCount(event) {
    event.preventDefault();
    await saveInventoryCount({
      collectionName: activeGroup,
      countedStock: stockValue,
      item: editingItem,
      notes: countNotes,
    });
    setEditingItem(null);
    setCountNotes("");
    await refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="download"
        actionLabel="Exportar Estoque"
        description="Auditoria fisica, atualizacao de quantidades e historico de inventario."
        title="Contagem de Estoque"
        onAction={handleExportInventory}
      />

      {/* --- SECAO: ABAS DE ESTOQUE --- */}
      <EntityGroupTabs activeGroup={activeGroup} groups={INVENTORY_GROUPS} onSelectGroup={setActiveGroup} />

      {/* --- SECAO: INDICADORES DE INVENTARIO --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: AUDITORIA E RISCO --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InventoryAuditTable
          canMutate={canMutate}
          records={records}
          unitLabel={group.unitLabel}
          onAdjust={openCount}
        />
        <InventoryRiskPanel canMutate={canMutate} records={records} onAdjust={openCount} />
      </div>

      <Modal
        description="A contagem redefine o estoque virtual e grava a movimentacao no historico geral."
        open={Boolean(editingItem)}
        title={`Ajustar estoque - ${editingItem?.name || ""}`}
        onClose={() => setEditingItem(null)}
      >
        <form className="space-y-4" onSubmit={saveCount}>
          <label>
            <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Quantidade contada</span>
            <TextInput type="number" value={stockValue} onChange={(event) => setStockValue(event.target.value)} />
          </label>
          <label>
            <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Observacao da contagem</span>
            <TextArea
              placeholder="Ex: divergencia fisica, entrada de fornecedor, baixa por avaria..."
              value={countNotes}
              onChange={(event) => setCountNotes(event.target.value)}
            />
          </label>
          <footer className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button icon="checkSquare" type="submit">
              Salvar Contagem
            </Button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}
