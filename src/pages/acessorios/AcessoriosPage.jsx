import CatalogHubPage from "../../components/templates/CatalogHubPage.jsx";
import { moduleConfigs } from "../config/moduleConfigs.js";

export default function AcessoriosPage({ accessLevel, user }) {
  return <CatalogHubPage accessLevel={accessLevel} collectionName="accessories" config={moduleConfigs.accessories} user={user} />;
}
