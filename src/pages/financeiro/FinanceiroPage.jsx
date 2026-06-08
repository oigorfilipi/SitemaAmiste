import { useMemo, useState } from "react";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import FinancialAgingPanel from "../../components/organisms/FinancialAgingPanel.jsx";
import FinancialLedgerTable from "../../components/organisms/FinancialLedgerTable.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  FINANCIAL_FILTERS,
  buildFinancialMetrics,
  buildFinancialRows,
  exportFinancialRows,
  filterFinancialRows,
  settleFinancialRow,
} from "../../services/financialService.js";
import { getRolePermissions } from "../../services/permissionService.js";

export default function FinanceiroPage({ accessLevel, user }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const { snapshot } = useErpSnapshot();
  const receivables = useCollection("receivables");
  const payables = useCollection("payables");
  const canMutate = accessLevel === "AC";
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canSettle = canMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);
  const canDownload = rolePermissions["action:download"] !== "OC";
  const rows = useMemo(
    () => buildFinancialRows({
      payables: payables.records,
      receivables: receivables.records,
      snapshot,
    }),
    [payables.records, receivables.records, snapshot]
  );
  const filteredRows = useMemo(() => filterFinancialRows(rows, activeFilter), [activeFilter, rows]);
  const metrics = useMemo(() => buildFinancialMetrics(rows), [rows]);

  async function handleSettle(row) {
    if (!canSettle) {
      return;
    }

    await settleFinancialRow(row);
    await Promise.all([receivables.refresh(), payables.refresh()]);
  }

  function handleExportReport() {
    if (!canDownload) {
      return;
    }

    exportFinancialRows(filteredRows, snapshot);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="download"
        actionLabel={canDownload ? "Gerar Relatorio" : ""}
        description="Gestao de fluxo de caixa, receitas recorrentes, despesas e relatorios avancados."
        icon="money"
        title="Financeiro"
        onAction={handleExportReport}
      />

      {/* --- SECAO: DASHBOARD FINANCEIRO --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: FILTROS DO RAZAO --- */}
      <EntityGroupTabs activeGroup={activeFilter} groups={FINANCIAL_FILTERS} onSelectGroup={setActiveFilter} />

      {/* --- SECAO: CONTAS A RECEBER E PAGAR --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <FinancialLedgerTable canMutate={canSettle} rows={filteredRows} onSettle={handleSettle} />
        <FinancialAgingPanel canMutate={canSettle} rows={rows} onSettle={handleSettle} />
      </div>
    </div>
  );
}
