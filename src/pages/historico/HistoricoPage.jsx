import { useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import SelectInput from "../../components/atoms/SelectInput.jsx";
import TextInput from "../../components/atoms/TextInput.jsx";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import AuditDetailPanel from "../../components/organisms/AuditDetailPanel.jsx";
import AuditTimeline from "../../components/organisms/AuditTimeline.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import {
  buildAuditMetrics,
  buildAuditModuleTabs,
  buildAuditRows,
  buildAuditSelectOptions,
  exportAuditRows,
  filterAuditRows,
} from "../../services/auditService.js";

export default function HistoricoPage() {
  const [activeModule, setActiveModule] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState("");
  const { records } = useCollection("history");
  const rows = useMemo(() => buildAuditRows(records), [records]);
  const moduleTabs = useMemo(() => buildAuditModuleTabs(rows), [rows]);
  const actionOptions = useMemo(() => buildAuditSelectOptions(rows, "action"), [rows]);
  const roleOptions = useMemo(() => buildAuditSelectOptions(rows, "role"), [rows]);
  const filteredRows = useMemo(() => filterAuditRows(rows, {
    actionId: actionFilter,
    moduleId: activeModule,
    roleId: roleFilter,
    searchTerm,
  }), [actionFilter, activeModule, roleFilter, rows, searchTerm]);
  const metrics = useMemo(() => buildAuditMetrics(rows), [rows]);
  const selectedEntry = filteredRows.find((entry) => entry.id === selectedEntryId) || filteredRows[0] || null;

  useEffect(() => {
    if (!selectedEntryId && filteredRows[0]) {
      setSelectedEntryId(filteredRows[0].id);
    }
  }, [filteredRows, selectedEntryId]);

  function handleExportLog() {
    exportAuditRows(filteredRows);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="download"
        actionLabel="Exportar Log"
        description="Log de atividades, edicao e auditoria do sistema."
        title="Historico Geral"
        onAction={handleExportLog}
      />

      {/* --- SECAO: INDICADORES DE AUDITORIA --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: FILTROS DO LOG --- */}
      <div className="space-y-4">
        <EntityGroupTabs activeGroup={activeModule} groups={moduleTabs} onSelectGroup={setActiveModule} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TextInput
            className="w-96"
            icon="search"
            placeholder="Buscar por registro, usuario ou detalhe"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div className="flex gap-2">
            <SelectInput className="w-44" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
            <SelectInput className="w-36" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
            <Button icon="download" variant="secondary" onClick={handleExportLog}>
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* --- SECAO: LINHA DO TEMPO E DETALHE --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <AuditTimeline
          rows={filteredRows}
          selectedId={selectedEntry?.id}
          onSelect={(entry) => setSelectedEntryId(entry.id)}
        />
        <AuditDetailPanel entry={selectedEntry} />
      </div>
    </div>
  );
}
