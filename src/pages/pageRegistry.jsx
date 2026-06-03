import AcessoriosPage from "./acessorios/AcessoriosPage.jsx";
import AccountsPage from "./accounts/AccountsPage.jsx";
import ChecklistsPage from "./checklists/ChecklistsPage.jsx";
import ClientesPage from "./clientes/ClientesPage.jsx";
import ConfiguracoesPage from "./configuracoes/ConfiguracoesPage.jsx";
import EstoquePage from "./estoque/EstoquePage.jsx";
import EtiquetasPage from "./etiquetas/EtiquetasPage.jsx";
import FinanceiroPage from "./financeiro/FinanceiroPage.jsx";
import HistoricoPage from "./historico/HistoricoPage.jsx";
import HomePage from "./home/HomePage.jsx";
import InsumosPage from "./insumos/InsumosPage.jsx";
import MachinesPage from "./machines/MachinesPage.jsx";
import OpcoesPage from "./opcoes/OpcoesPage.jsx";
import PerfilPage from "./perfil/PerfilPage.jsx";
import PortfoliosPage from "./portfolios/PortfoliosPage.jsx";
import PrecosPage from "./precos/PrecosPage.jsx";
import ServiceOrdersPage from "./service-orders/ServiceOrdersPage.jsx";
import VendasPage from "./vendas/VendasPage.jsx";

export const pageRegistry = {
  home: HomePage,
  checklists: ChecklistsPage,
  serviceOrders: ServiceOrdersPage,
  machines: MachinesPage,
  insumos: InsumosPage,
  acessorios: AcessoriosPage,
  portfolios: PortfoliosPage,
  vendas: VendasPage,
  financeiro: FinanceiroPage,
  historico: HistoricoPage,
  precos: PrecosPage,
  estoque: EstoquePage,
  clientes: ClientesPage,
  opcoes: OpcoesPage,
  etiquetas: EtiquetasPage,
  accounts: AccountsPage,
  configuracoes: ConfiguracoesPage,
  perfil: PerfilPage,
};
