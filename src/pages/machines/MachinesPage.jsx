import CatalogHubPage from "../../components/templates/CatalogHubPage.jsx";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function MachinesPage({ accessLevel }) {
  return <CatalogHubPage accessLevel={accessLevel} collectionName="machines" config={moduleConfigs.machines} />;
}
