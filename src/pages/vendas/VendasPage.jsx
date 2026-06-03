import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import QuickSaleForm from "../../components/organisms/QuickSaleForm.jsx";
import SalesLedgerTable from "../../components/organisms/SalesLedgerTable.jsx";
import SalesStockPanel from "../../components/organisms/SalesStockPanel.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  buildInitialSaleForm,
  buildSalesMetrics,
  buildSalesRows,
  exportSalesRows,
  submitQuickSale,
} from "../../services/salesService.js";

export default function VendasPage({ accessLevel }) {
  const [formData, setFormData] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const { records, refresh } = useCollection("sales");
  const { snapshot, refresh: refreshSnapshot } = useErpSnapshot();
  const canMutate = accessLevel === "AC";
  const rows = useMemo(() => buildSalesRows(records, snapshot), [records, snapshot]);
  const metrics = useMemo(() => buildSalesMetrics(rows), [rows]);

  useEffect(() => {
    if (!formData.inventoryItem && snapshot.clients?.length) {
      setFormData(buildInitialSaleForm(snapshot));
    }
  }, [formData.inventoryItem, snapshot]);

  function handleExport() {
    exportSalesRows(rows, snapshot);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    try {
      await submitQuickSale(formData, snapshot);
      await Promise.all([refresh(), refreshSnapshot()]);
      setFormData((currentData) => ({
        ...currentData,
        generateCharge: currentData.paymentStatus !== "pago",
        quantity: 1,
      }));
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="download"
        actionLabel="Exportar Vendas"
        description="Registro de vendas avulsas, saida de insumos e faturamento direto."
        title="Vendas Rapidas"
        onAction={handleExport}
      />

      {/* --- SECAO: INDICADORES DE VENDAS --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: REGISTRO OPERACIONAL --- */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <QuickSaleForm
          canMutate={canMutate}
          errorMessage={errorMessage}
          formData={formData}
          snapshot={snapshot}
          onChange={setFormData}
          onSubmit={handleSubmit}
        />
        <SalesStockPanel snapshot={snapshot} />
      </div>

      {/* --- SECAO: HISTORICO DE VENDAS --- */}
      <SalesLedgerTable rows={rows} />
    </div>
  );
}
