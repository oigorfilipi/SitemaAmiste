import { lazy } from "react";

const AcessoriosPage = lazy(() => import("./acessorios/AcessoriosPage.jsx"));
const AccountsPage = lazy(() => import("./accounts/AccountsPage.jsx"));
const ChecklistsPage = lazy(() => import("./checklists/ChecklistsPage.jsx"));
const ClientesPage = lazy(() => import("./clientes/ClientesPage.jsx"));
const ConfiguracoesPage = lazy(() => import("./configuracoes/ConfiguracoesPage.jsx"));
const EstoquePage = lazy(() => import("./estoque/EstoquePage.jsx"));
const EtiquetasPage = lazy(() => import("./etiquetas/EtiquetasPage.jsx"));
const FinanceiroPage = lazy(() => import("./financeiro/FinanceiroPage.jsx"));
const HistoricoPage = lazy(() => import("./historico/HistoricoPage.jsx"));
const HomePage = lazy(() => import("./home/HomePage.jsx"));
const InsumosPage = lazy(() => import("./insumos/InsumosPage.jsx"));
const MachinesPage = lazy(() => import("./machines/MachinesPage.jsx"));
const OpcoesPage = lazy(() => import("./opcoes/OpcoesPage.jsx"));
const PerfilPage = lazy(() => import("./perfil/PerfilPage.jsx"));
const PortfoliosPage = lazy(() => import("./portfolios/PortfoliosPage.jsx"));
const PrecosPage = lazy(() => import("./precos/PrecosPage.jsx"));
const ServiceOrdersPage = lazy(() => import("./service-orders/ServiceOrdersPage.jsx"));
const SolicitacoesPage = lazy(() => import("./solicitacoes/SolicitacoesPage.jsx"));
const VendasPage = lazy(() => import("./vendas/VendasPage.jsx"));

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
  solicitacoes: SolicitacoesPage,
  configuracoes: ConfiguracoesPage,
  perfil: PerfilPage,
};
