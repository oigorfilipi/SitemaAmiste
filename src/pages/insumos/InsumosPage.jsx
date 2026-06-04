import CatalogHubPage from "../../components/templates/CatalogHubPage.jsx";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function InsumosPage({ accessLevel, user }) {
  return <CatalogHubPage accessLevel={accessLevel} collectionName="supplies" config={moduleConfigs.supplies} user={user} />;
}
