import { useMemo } from "react";
import PageHeader from "../molecules/PageHeader.jsx";
import CatalogHealthPanel from "../organisms/CatalogHealthPanel.jsx";
import MetricsGrid from "../organisms/MetricsGrid.jsx";
import EntityCrudPage from "./EntityCrudPage.jsx";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  buildCatalogAlerts,
  buildCatalogMetrics,
} from "../../services/catalogService.js";

export default function CatalogHubPage({ accessLevel, collectionName, config, user }) {
  const { snapshot } = useErpSnapshot();
  const metrics = useMemo(() => buildCatalogMetrics(collectionName, snapshot), [collectionName, snapshot]);
  const alerts = useMemo(() => buildCatalogAlerts(collectionName, snapshot), [collectionName, snapshot]);

  return (
    <div className="space-y-6">
      <PageHeader
        description={config.description}
        icon={config.icon}
        title={config.title}
      />

      {/* --- SECAO: INDICADORES DO CATALOGO --- */}
      <MetricsGrid metrics={metrics} />

      {/* --- SECAO: SAUDE OPERACIONAL --- */}
      <CatalogHealthPanel alerts={alerts} />

      {/* --- SECAO: CRUD E HUBS DO CATALOGO --- */}
      <EntityCrudPage accessLevel={accessLevel} config={config} showHeader={false} user={user} />
    </div>
  );
}
