import { useEffect, useMemo, useState } from "react";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
import CatalogHubPage from "../../components/templates/CatalogHubPage.jsx";
import { getRolePermissions } from "../../services/permissionService.js";
import { moduleConfigs } from "../config/moduleConfigs.js";
import ServiceOrdersPage from "../service-orders/ServiceOrdersPage.jsx";

const MACHINE_TABS = [
  { id: "catalog", label: "Maquinas", permissionId: "tab:machines.catalog" },
  { id: "repairs", label: "Consertos SLA", permissionId: "tab:machines.repairs" },
];

export default function MachinesPage({ accessLevel, user }) {
  const [activeTab, setActiveTab] = useState("catalog");
  const visibleTabs = useMemo(() => {
    const permissions = getRolePermissions(user?.role || "VEN");

    return MACHINE_TABS.filter((tab) => permissions[tab.permissionId] !== "OC");
  }, [user?.role]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || "catalog");
    }
  }, [activeTab, visibleTabs]);

  return (
    <div className="space-y-5">
      <EntityGroupTabs activeGroup={activeTab} groups={visibleTabs} onSelectGroup={setActiveTab} />
      {activeTab === "repairs" ? (
        <ServiceOrdersPage accessLevel={accessLevel} user={user} />
      ) : (
        <CatalogHubPage accessLevel={accessLevel} collectionName="machines" config={moduleConfigs.machines} user={user} />
      )}
    </div>
  );
}
