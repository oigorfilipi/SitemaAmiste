import { useMemo, useState } from "react";
import EntityGroupTabs from "../../components/molecules/EntityGroupTabs.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import DocumentWorkflowPanel from "../../components/organisms/DocumentWorkflowPanel.jsx";
import MetricsGrid from "../../components/organisms/MetricsGrid.jsx";
import EntityCrudPage from "../../components/templates/EntityCrudPage.jsx";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import { buildDocumentMetrics } from "../../services/documentService.js";
import {
  buildDocumentWorkflow,
  completeProposalWorkflow,
  signServiceSheetWorkflow,
} from "../../services/documentWorkflowService.js";
import { moduleConfigs } from "../config/moduleConfigs.js";

const PORTFOLIO_TABS = [
  { id: "proposals", label: "Propostas Comerciais" },
  { id: "sheets", label: "Fichas de Instalacao e Retirada" },
];

export default function PortfoliosPage({ accessLevel }) {
  const [activeTab, setActiveTab] = useState("proposals");
  const [loadingId, setLoadingId] = useState("");
  const [workflowMessage, setWorkflowMessage] = useState("");
  const { snapshot, refresh } = useErpSnapshot();
  const activeConfig = activeTab === "proposals" ? moduleConfigs.proposals : moduleConfigs.serviceSheets;
  const metrics = useMemo(() => buildDocumentMetrics(snapshot), [snapshot]);
  const workflow = useMemo(() => buildDocumentWorkflow(snapshot), [snapshot]);
  const canMutate = accessLevel === "AC";

  async function handleCompleteProposal(proposal) {
    if (!canMutate) {
      return;
    }

    setLoadingId(proposal.id);
    setWorkflowMessage("");
    await completeProposalWorkflow(proposal, snapshot);
    await refresh();
    setWorkflowMessage("Proposta concluida, cobranca/ficha sincronizadas.");
    setLoadingId("");
  }

  async function handleSignSheet(sheet) {
    if (!canMutate) {
      return;
    }

    setLoadingId(sheet.id);
    setWorkflowMessage("");
    await signServiceSheetWorkflow(sheet, snapshot);
    await refresh();
    setWorkflowMessage("Ficha assinada e fluxo documental atualizado.");
    setLoadingId("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="briefcase"
        actionLabel=""
        description="Gerenciamento de propostas, negociacoes com clientes e documentos operacionais."
        title="Portfolios e Fichas"
      />

      {/* --- SECAO: INDICADORES DOCUMENTAIS --- */}
      <MetricsGrid metrics={metrics} />
      <DocumentWorkflowPanel
        canMutate={canMutate}
        loadingId={loadingId}
        message={workflowMessage}
        workflow={workflow}
        onCompleteProposal={handleCompleteProposal}
        onSignSheet={handleSignSheet}
      />

      {/* --- SECAO: ABAS INTERNAS --- */}
      <EntityGroupTabs activeGroup={activeTab} groups={PORTFOLIO_TABS} onSelectGroup={setActiveTab} />

      <EntityCrudPage accessLevel={accessLevel} config={activeConfig} showHeader={false} />
    </div>
  );
}
