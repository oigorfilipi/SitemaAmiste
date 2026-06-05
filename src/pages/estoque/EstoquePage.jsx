import { useMemo, useState } from "react";
import readXlsxFile from "read-excel-file/browser";
import Button from "../../components/atoms/Button.jsx";
import SelectInput from "../../components/atoms/SelectInput.jsx";
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
  buildInventoryHistoryDashboard,
  buildInventoryHistoryRows,
  buildInventoryMetrics,
  buildManualCountRows,
  buildPhysicalInventoryRows,
  buildRealtimeInventoryRows,
  deleteInventoryCountItem,
  exportInventoryRows,
  getInventoryCountForDate,
  getLatestDraftInventoryCount,
  getInventoryGroup,
  getLatestInventoryCount,
  mergeImportedCountRows,
  parseInventoryText,
  saveInventoryAuditCount,
  updateInventoryCountItem,
} from "../../services/inventoryService.js";
import { getRolePermissions, getScopedCollectionAccess } from "../../services/permissionService.js";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function spreadsheetRowsToInventoryRows(rows = []) {
  const normalizedRows = rows
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some(Boolean));
  const firstRow = normalizedRows[0] || [];
  const hasHeader = firstRow.join(" ").toLowerCase().includes("nome") && firstRow.join(" ").toLowerCase().includes("quant");
  const dataRows = hasHeader ? normalizedRows.slice(1) : normalizedRows;

  return dataRows
    .map((row) => ({
      name: row[0] || "",
      quantity: Number(String(row[1] || "0").replace(",", ".")),
    }))
    .filter((row) => row.name);
}

function syncMachineAssets(row, quantity) {
  const count = Math.max(0, Number(quantity || 0));
  const currentAssets = Array.isArray(row.assets) ? row.assets : [];

  return Array.from({ length: count }, (_, index) => ({
    assetTag: currentAssets[index]?.assetTag || "",
    serialNumber: currentAssets[index]?.serialNumber || "",
  }));
}

function CountRowsEditor({ groupId, rows, onChangeAsset, onChangeQuantity }) {
  const isMachines = groupId === "machines";

  return (
    <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
      {rows.map((row, index) => (
        <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4" key={row.itemId}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <div className="min-w-0">
              <strong className="block truncate text-sm font-black text-amiste-black">{row.itemName}</strong>
              {row.sourceName && row.sourceName !== row.itemName ? (
                <span className="mt-1 block text-xs font-bold text-amiste-gray/55">Importado como: {row.sourceName}</span>
              ) : null}
            </div>
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Quantidade contada</span>
              <TextInput
                min="0"
                type="number"
                value={row.quantity}
                onChange={(event) => onChangeQuantity(index, event.target.value)}
              />
            </label>
          </div>

          {isMachines && Number(row.quantity || 0) > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {row.assets.map((asset, assetIndex) => (
                <div className="rounded-md border border-zinc-200 bg-white p-3" key={`${row.itemId}_${assetIndex}`}>
                  <span className="mb-3 block text-xs font-black uppercase text-amiste-gray/50">
                    Patrimonio/Serie {assetIndex + 1}
                  </span>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <TextInput
                      placeholder="Numero de serie"
                      value={asset.serialNumber}
                      onChange={(event) => onChangeAsset(index, assetIndex, "serialNumber", event.target.value)}
                    />
                    <TextInput
                      placeholder="Numero de patrimonio"
                      value={asset.assetTag}
                      onChange={(event) => onChangeAsset(index, assetIndex, "assetTag", event.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function InventoryHistoryModal({ groupId, open, selectedDate, snapshot, onChangeDate, onClose }) {
  const [expandedId, setExpandedId] = useState("");
  const group = getInventoryGroup(groupId);
  const selectedCount = getInventoryCountForDate(snapshot, groupId, selectedDate);
  const rows = buildInventoryHistoryRows(snapshot, groupId, selectedDate);
  const metrics = buildInventoryHistoryDashboard(snapshot, groupId, selectedDate);
  const isMachines = groupId === "machines";

  return (
    <Modal
      description="Consulta temporal das contagens fisicas registradas e auditoria vinculada."
      open={open}
      size="wide"
      title={`Historico de Contagem - ${group.label}`}
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <label className="w-64">
            <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Data da consulta</span>
            <TextInput type="date" value={selectedDate} onChange={(event) => onChangeDate(event.target.value)} />
          </label>
          <div className="text-right">
            <span className="block text-xs font-black uppercase text-amiste-gray/50">Contagem localizada</span>
            <strong className="mt-1 block text-sm font-black text-amiste-black">
              {selectedCount ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(selectedCount.countedAt)) : "Nenhuma contagem anterior"}
            </strong>
            <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">
              {selectedCount?.countedBy || "Sem responsavel"}
            </span>
          </div>
        </div>

        <MetricsGrid metrics={metrics} />

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[1.4fr_120px_180px_170px_120px] gap-4 border-b border-zinc-100 px-4 py-3 text-xs font-black uppercase text-amiste-gray/60">
                <span>Produto</span>
                <span>Quantidade</span>
                <span>Responsavel</span>
                <span>Data/Hora</span>
                <span className="text-right">Detalhes</span>
              </div>

              {rows.length ? rows.map((row) => {
                const expanded = expandedId === row.itemId;

                return (
                  <div className="border-b border-zinc-100 last:border-b-0" key={row.itemId}>
                    <div className="grid grid-cols-[1.4fr_120px_180px_170px_120px] items-center gap-4 px-4 py-4">
                      <strong className="truncate text-sm font-black text-amiste-black">{row.itemName}</strong>
                      <span className="text-sm font-black text-amiste-black">{row.quantity}</span>
                      <span className="truncate text-sm font-semibold text-amiste-gray">{row.countedBy}</span>
                      <span className="text-sm font-semibold text-amiste-gray">{row.dateLabel}</span>
                      <div className="text-right">
                        {isMachines ? (
                          <Button className="h-8 px-3 text-xs" variant="secondary" onClick={() => setExpandedId(expanded ? "" : row.itemId)}>
                            {expanded ? "Ocultar" : "Ver"}
                          </Button>
                        ) : (
                          <span className="text-xs font-bold text-amiste-gray/45">-</span>
                        )}
                      </div>
                    </div>
                    {isMachines && expanded ? (
                      <div className="grid grid-cols-1 gap-2 px-4 pb-4 md:grid-cols-2">
                        {row.assets.map((asset, index) => (
                          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3" key={`${row.itemId}_${index}`}>
                            <span className="block text-[11px] font-black uppercase text-amiste-gray/45">Unidade {index + 1}</span>
                            <strong className="mt-1 block text-xs text-amiste-black">Serie: {asset.serialNumber || "-"}</strong>
                            <strong className="mt-1 block text-xs text-amiste-black">Patrimonio: {asset.assetTag || "-"}</strong>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }) : (
                <div className="grid min-h-32 place-items-center border-t border-zinc-100 text-sm font-bold text-amiste-gray/55">
                  Nenhuma contagem encontrada para esta data ou anterior.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}

export default function EstoquePage({ user }) {
  const [activeGroup, setActiveGroup] = useState("supplies");
  const [countRows, setCountRows] = useState([]);
  const [countNotes, setCountNotes] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editAssets, setEditAssets] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importWarnings, setImportWarnings] = useState([]);
  const [modalError, setModalError] = useState("");
  const [newCountOpen, setNewCountOpen] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(todayInputValue());
  const { snapshot, refresh } = useErpSnapshot();
  const group = getInventoryGroup(activeGroup);
  const physicalRecords = useMemo(() => buildPhysicalInventoryRows(snapshot, activeGroup), [activeGroup, snapshot]);
  const realtimeRecords = useMemo(() => buildRealtimeInventoryRows(snapshot, activeGroup), [activeGroup, snapshot]);
  const metrics = useMemo(() => buildInventoryMetrics(snapshot, activeGroup), [activeGroup, snapshot]);
  const latestCount = useMemo(() => getLatestInventoryCount(snapshot, activeGroup), [activeGroup, snapshot]);
  const activeGroupAccess = getScopedCollectionAccess(user?.role, "inventory", activeGroup);
  const canMutate = activeGroupAccess === "AC";
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canCreate = canMutate && rolePermissions["action:create"] === "AC";
  const canUpdate = canMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canDelete = canMutate && rolePermissions["action:delete"] === "AC";
  const canDownload = rolePermissions["action:download"] !== "OC";

  function resetCountModal() {
    setCountNotes("");
    setCountRows([]);
    setImportText("");
    setImportWarnings([]);
    setModalError("");
    setNewCountOpen(false);
  }

  function openNewCount() {
    if (!canCreate) {
      return;
    }

    const draftCount = getLatestDraftInventoryCount(snapshot, activeGroup);
    const manualRows = buildManualCountRows(snapshot, activeGroup);

    setCountRows(draftCount
      ? manualRows.map((row) => {
        const draftItem = draftCount.items?.find((item) => item.itemId === row.itemId);

        return draftItem ? { ...row, ...draftItem } : row;
      })
      : manualRows);
    setCountNotes("");
    setImportText("");
    setImportWarnings([]);
    setModalError("");
    setNewCountOpen(true);
  }

  function openEditPhysicalItem(item) {
    if (!canUpdate) {
      return;
    }

    if (!latestCount) {
      setModalError("Crie uma nova contagem fisica antes de editar o consolidado.");
      return;
    }

    setEditingItem(item);
    setEditQuantity(item.physicalQuantity);
    setEditAssets(item.assets || []);
  }

  function updateCountQuantity(index, value) {
    setCountRows((currentRows) => currentRows.map((row, rowIndex) => {
      if (rowIndex !== index) {
        return row;
      }

      return {
        ...row,
        assets: activeGroup === "machines" ? syncMachineAssets(row, value) : row.assets,
        quantity: value,
      };
    }));
  }

  function updateCountAsset(rowIndex, assetIndex, fieldName, value) {
    setCountRows((currentRows) => currentRows.map((row, currentRowIndex) => {
      if (currentRowIndex !== rowIndex) {
        return row;
      }

      return {
        ...row,
        assets: row.assets.map((asset, currentAssetIndex) =>
          currentAssetIndex === assetIndex ? { ...asset, [fieldName]: value } : asset
        ),
      };
    }));
  }

  function updateEditAsset(assetIndex, fieldName, value) {
    setEditAssets((currentAssets) => currentAssets.map((asset, currentIndex) =>
      currentIndex === assetIndex ? { ...asset, [fieldName]: value } : asset
    ));
  }

  function handleEditQuantityChange(value) {
    setEditQuantity(value);
    setEditAssets((currentAssets) => syncMachineAssets({ assets: currentAssets }, value));
  }

  function handleExportInventory() {
    if (!canDownload) {
      return;
    }

    exportInventoryRows({
      groupId: activeGroup,
      rows: realtimeRecords,
      snapshot,
    });
  }

  function applyImportedRows(importedRows) {
    const result = mergeImportedCountRows({
      currentRows: countRows,
      groupId: activeGroup,
      importedRows,
      snapshot,
    });

    setCountRows(result.rows);
    setImportWarnings(result.warnings);
  }

  async function handleFileImport(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (/\.xlsx$/i.test(file.name)) {
      applyImportedRows(spreadsheetRowsToInventoryRows(await readXlsxFile(file)));
      return;
    }

    applyImportedRows(parseInventoryText(await file.text()));
  }

  function handleTextImport() {
    applyImportedRows(parseInventoryText(importText));
  }

  function handleManualLink(warningId, itemId) {
    const warning = importWarnings.find((item) => item.id === warningId);
    const targetRow = countRows.find((row) => row.itemId === itemId);

    if (!warning || !targetRow) {
      return;
    }

    setCountRows((currentRows) => currentRows.map((row) =>
      row.itemId === itemId ? { ...row, quantity: warning.quantity, sourceName: warning.name } : row
    ));
    setImportWarnings((currentWarnings) => currentWarnings.filter((item) => item.id !== warningId));
  }

  async function submitCount(status) {
    if (!canCreate) {
      setModalError("Voce nao tem permissao para salvar contagens.");
      return;
    }

    setModalError("");

    try {
      await saveInventoryAuditCount({
        groupId: activeGroup,
        notes: countNotes,
        rows: countRows,
        status,
        user,
      });
      resetCountModal();
      await refresh();
    } catch (error) {
      setModalError(error.message || "Nao foi possivel salvar a contagem.");
    }
  }

  async function savePhysicalCorrection(event) {
    event.preventDefault();

    if (!canUpdate || !latestCount || !editingItem) {
      return;
    }

    await updateInventoryCountItem({
      assets: activeGroup === "machines" ? editAssets : [],
      count: latestCount,
      groupId: activeGroup,
      item: editingItem,
      quantity: editQuantity,
      user,
    });
    setEditingItem(null);
    await refresh();
  }

  async function deletePhysicalItem(item) {
    if (!canDelete || !latestCount) {
      return;
    }

    const confirmed = window.confirm(`Excluir "${item.name}" da ultima contagem fisica?`);

    if (!confirmed) {
      return;
    }

    await deleteInventoryCountItem({
      count: latestCount,
      groupId: activeGroup,
      item,
      user,
    });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="download"
        actionLabel={canDownload ? "Exportar Estoque" : ""}
        description="Auditoria fisica, atualizacao de quantidades e historico de inventario."
        title="Contagem de Estoque"
        onAction={handleExportInventory}
      />

      {/* --- SECAO: ABAS DE ESTOQUE --- */}
      <EntityGroupTabs activeGroup={activeGroup} groups={INVENTORY_GROUPS} onSelectGroup={setActiveGroup} />

      {/* --- SECAO: ACOES DE AUDITORIA --- */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button icon="history" variant="secondary" onClick={() => setHistoryOpen(true)}>
          Historico de Contagem
        </Button>
        {canCreate ? (
          <Button icon="checkSquare" onClick={openNewCount}>
            Nova Contagem
          </Button>
        ) : null}
      </div>

      {/* --- SECAO: INDICADORES DE INVENTARIO --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: ESTOQUE FISICO E VIRTUAL --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-black text-amiste-black">Estoque Fisico Consolidado</h2>
            <p className="mt-1 text-sm italic text-amiste-gray/60">Ultima contagem oficial, sem alteracao automatica.</p>
          </div>
          <InventoryAuditTable
            canAdjust={canUpdate}
            canDelete={canDelete}
            canMutate={canUpdate || canDelete}
            groupId={activeGroup}
            mode="physical"
            records={physicalRecords}
            unitLabel={group.unitLabel}
            onAdjust={openEditPhysicalItem}
            onDelete={deletePhysicalItem}
          />

          <div>
            <h2 className="font-display text-lg font-black text-amiste-black">Estoque em Tempo Real</h2>
            <p className="mt-1 text-sm italic text-amiste-gray/60">Estoque virtual atualizado por vendas, checklists e movimentacoes.</p>
          </div>
          <InventoryAuditTable
            canMutate={false}
            groupId={activeGroup}
            mode="realtime"
            records={realtimeRecords}
            unitLabel={group.unitLabel}
          />
        </div>
        <InventoryRiskPanel canMutate={false} records={realtimeRecords} onAdjust={() => {}} />
      </div>

      <Modal
        description="Importe dados, cole uma lista ou preencha manualmente uma contagem cega."
        open={newCountOpen}
        size="wide"
        title={`Nova Contagem - ${group.label}`}
        onClose={resetCountModal}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="font-display text-base font-black text-amiste-black">Importacao por Excel/CSV</h3>
              <p className="mt-1 text-sm font-semibold text-amiste-gray/60">Campos esperados: Nome do Item, Quantidade.</p>
              <input
                accept=".csv,.xlsx"
                className="mt-4 block h-11 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-amiste-gray file:mr-4 file:rounded-md file:border-0 file:bg-amiste-black file:px-3 file:py-1.5 file:text-xs file:font-black file:text-white"
                type="file"
                onChange={handleFileImport}
              />
            </section>
            <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="font-display text-base font-black text-amiste-black">Importacao por Texto</h3>
              <TextArea
                className="mt-4 min-h-24"
                placeholder={"Cafe: 20\nChocolate: 15\nAcucar: 30"}
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
              />
              <Button className="mt-3 h-9 px-3 text-xs" icon="upload" variant="secondary" onClick={handleTextImport}>
                Processar Texto
              </Button>
            </section>
          </div>

          {importWarnings.length ? (
            <section className="rounded-md border border-amiste-yellow/60 bg-amiste-yellow/20 p-4">
              <h3 className="font-display text-base font-black text-amiste-black">Vinculos para revisao</h3>
              <div className="mt-3 space-y-2">
                {importWarnings.map((warning) => (
                  <div className="grid grid-cols-1 items-center gap-3 rounded-md bg-white p-3 md:grid-cols-[minmax(0,1fr)_260px]" key={warning.id}>
                    <span className="text-sm font-bold text-amiste-gray">{warning.message}</span>
                    {warning.name ? (
                      <SelectInput defaultValue="" onChange={(event) => handleManualLink(warning.id, event.target.value)}>
                        <option value="">Vincular manualmente</option>
                        {countRows.map((row) => (
                          <option key={row.itemId} value={row.itemId}>
                            {row.itemName}
                          </option>
                        ))}
                      </SelectInput>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <CountRowsEditor
            groupId={activeGroup}
            rows={countRows}
            onChangeAsset={updateCountAsset}
            onChangeQuantity={updateCountQuantity}
          />

          <label>
            <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Observacao da contagem</span>
            <TextArea
              placeholder="Divergencias, responsavel local, sala, lote, avarias ou observacoes de auditoria."
              value={countNotes}
              onChange={(event) => setCountNotes(event.target.value)}
            />
          </label>

          {modalError ? (
            <div className="rounded-md border border-amiste-red/20 bg-amiste-red/10 px-4 py-3 text-sm font-bold text-amiste-red">
              {modalError}
            </div>
          ) : null}

          <footer className="flex flex-wrap justify-end gap-3 border-t border-zinc-100 pt-5">
            <Button variant="secondary" onClick={resetCountModal}>
              Cancelar
            </Button>
            <Button icon="archive" variant="secondary" onClick={() => submitCount("rascunho")}>
              Salvar Rascunho
            </Button>
            <Button icon="checkSquare" onClick={() => submitCount("finalizado")}>
              Salvar Contagem
            </Button>
          </footer>
        </div>
      </Modal>

      <Modal
        description="Correcoes permanecem registradas no historico geral e na trilha da contagem."
        open={Boolean(editingItem)}
        title={`Editar contagem - ${editingItem?.name || ""}`}
        onClose={() => setEditingItem(null)}
      >
        <form className="space-y-4" onSubmit={savePhysicalCorrection}>
          <label>
            <span className="mb-2 block text-xs font-black uppercase text-amiste-gray/60">Quantidade corrigida</span>
            <TextInput min="0" type="number" value={editQuantity} onChange={(event) => handleEditQuantityChange(event.target.value)} />
          </label>

          {activeGroup === "machines" && Number(editQuantity || 0) > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {editAssets.map((asset, index) => (
                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3" key={`edit_asset_${index}`}>
                  <span className="mb-3 block text-xs font-black uppercase text-amiste-gray/50">Patrimonio/Serie {index + 1}</span>
                  <TextInput
                    className="mb-2"
                    placeholder="Numero de serie"
                    value={asset.serialNumber}
                    onChange={(event) => updateEditAsset(index, "serialNumber", event.target.value)}
                  />
                  <TextInput
                    placeholder="Numero de patrimonio"
                    value={asset.assetTag}
                    onChange={(event) => updateEditAsset(index, "assetTag", event.target.value)}
                  />
                </div>
              ))}
            </div>
          ) : null}

          <footer className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button icon="checkSquare" type="submit">
              Salvar Correcao
            </Button>
          </footer>
        </form>
      </Modal>

      <InventoryHistoryModal
        groupId={activeGroup}
        open={historyOpen}
        selectedDate={selectedHistoryDate}
        snapshot={snapshot}
        onChangeDate={setSelectedHistoryDate}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
