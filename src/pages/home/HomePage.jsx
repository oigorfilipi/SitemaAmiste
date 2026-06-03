import Button from "../../components/atoms/Button.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import ActiveAlertsPanel from "../../components/organisms/ActiveAlertsPanel.jsx";
import LatestOperationsTable from "../../components/organisms/LatestOperationsTable.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import QuickAccessGrid from "../../components/organisms/QuickAccessGrid.jsx";
import { useDashboard } from "../../hooks/useDashboard.js";

export default function HomePage({ user, quickAccess, onSelectPage }) {
  const { data: dashboard } = useDashboard(user?.role || "VEN");

  return (
    <div className="space-y-6">
      {/* --- SECAO: BOAS-VINDAS --- */}
      <PageHeader
        actionIcon="plus"
        actionLabel="Novo Checklist"
        description="Bem-vindo ao painel de controle operacional."
        title={`Ola, ${user?.displayName || "usuario"}!`}
        onAction={() => onSelectPage("checklists")}
      />

      {/* --- SECAO: INDICADORES --- */}
      <MetricsGrid metrics={dashboard.metrics} />

      {/* --- SECAO: ATALHOS OPERACIONAIS --- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-black text-amiste-black">Acesso rapido</h2>
          <p className="mt-1 text-sm italic text-amiste-gray/60">Centrais e rotas usadas no dia a dia.</p>
        </div>
        <Button icon="settings" variant="secondary" onClick={() => onSelectPage("opcoes")}>
          Ajustar opcoes
        </Button>
      </div>
      <QuickAccessGrid items={quickAccess} onSelectPage={onSelectPage} />

      {/* --- SECAO: OPERACAO E ALERTAS --- */}
      <div className="grid grid-cols-[1fr_360px] gap-6">
        <LatestOperationsTable operations={dashboard.latestOperations} onSelectPage={onSelectPage} />
        <ActiveAlertsPanel alerts={dashboard.alerts} onSelectPage={onSelectPage} />
      </div>
    </div>
  );
}
