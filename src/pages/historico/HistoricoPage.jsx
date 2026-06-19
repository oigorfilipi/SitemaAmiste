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
  AUDIT_EVENT_CATALOG,
  buildAuditMetrics,
  buildAuditModuleTabs,
  buildAuditRows,
  buildAuditSelectOptions,
  exportAuditRows,
  filterAuditRows,
} from "../../services/auditService.js";
import { getRolePermissions } from "../../services/permissionService.js";

export default function HistoricoPage({ user }) {
  const [activeModule, setActiveModule] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState("");
  const { records } = useCollection("history");
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canReadAccounts = rolePermissions.accounts !== "OC";
  const { records: accountRecords } = useCollection(canReadAccounts ? "accounts" : "history");
  const canDownload = rolePermissions["action:download"] !== "OC";
  const rows = useMemo(
    () => buildAuditRows(records, canReadAccounts ? accountRecords : []),
    [accountRecords, canReadAccounts, records]
  );
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
    if (!canDownload) {
      return;
    }

    exportAuditRows(filteredRows);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="download"
        actionLabel={canDownload ? "Exportar Log" : ""}
        description="Log de atividades, edicao e auditoria do sistema."
        icon="history"
        title="Historico Geral"
        onAction={handleExportLog}
      />

      {/* --- SECAO: INDICADORES DE AUDITORIA --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: EVENTOS AUDITADOS --- */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="text-xs font-black uppercase text-amiste-red">Politica de auditoria</span>
            <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Eventos registrados no Historico Geral</h2>
          </div>
          <p className="max-w-2xl text-sm font-semibold leading-6 text-amiste-gray/70">
            O log mostra quem executou a acao, cargo, modulo, data, registro afetado e detalhes
            do que mudou. Dados sensiveis como senhas e imagens nao sao exibidos nos detalhes.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
          {AUDIT_EVENT_CATALOG.map((group) => (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4" key={group.id}>
              <strong className="block text-sm font-black text-amiste-black">{group.title}</strong>
              <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-amiste-gray/70">
                {group.events.map((eventName) => (
                  <li className="flex gap-2" key={eventName}>
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amiste-red" />
                    <span>{eventName}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

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
            <Button disabled={!canDownload} icon="download" variant="secondary" onClick={handleExportLog}>
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
