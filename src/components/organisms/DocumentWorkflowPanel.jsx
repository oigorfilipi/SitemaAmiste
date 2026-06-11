import Button from "../atoms/Button.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

function DocumentWorkflowRow({ actionLabel, canMutate, item, loading, onAction }) {
  return (
    <div
      className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 md:grid-cols-[1fr_150px_150px]"
      data-workflow-row={item.id}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <strong className="truncate text-sm font-black text-amiste-black">{item.documentCode}</strong>
          <StatusPill className="h-6 px-2 text-[10px]" status={item.status} />
        </div>
        <span className="mt-1 block truncate text-xs font-bold text-amiste-gray/60">
          {item.clientName} - {item.machineName}
        </span>
      </div>
      <span className="text-xs font-black uppercase text-amiste-gray/50">
        {item.hasReceivable ? "Financeiro ok" : "Sem cobranca"}
      </span>
      <Button
        className="h-8 w-[96px] px-3 text-xs"
        disabled={!canMutate || loading}
        icon="checkSquare"
        variant="secondary"
        aria-label={`${actionLabel} ${item.documentCode}`}
        onClick={() => onAction(item)}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

export default function DocumentWorkflowPanel({
  canMutate,
  loadingId,
  message,
  workflow,
  onCompleteProposal,
  onSignSheet,
}) {
  const hasPendingItems = workflow.actionableProposals.length || workflow.unsignedSheets.length;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-black text-amiste-black">Fluxo documental</h2>
          <p className="mt-1 text-sm font-semibold text-amiste-gray/60">
            Conclusao de propostas, geracao de cobrancas e assinatura de fichas.
          </p>
        </div>
        <StatusPill
          label={workflow.pendingCount ? `${workflow.pendingCount} pendencias` : "Em dia"}
          status={workflow.pendingCount ? "pendente" : "concluido"}
        />
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-amiste-green/20 bg-amiste-green/10 px-4 py-3 text-sm font-bold text-amiste-green">
          {message}
        </div>
      ) : null}

      {/* --- SECAO: PENDENCIAS OPERACIONAIS --- */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-xs font-black uppercase text-amiste-gray/55">Propostas abertas</h3>
          <div className="space-y-2">
            {workflow.actionableProposals.length ? (
              workflow.actionableProposals.map((proposal) => (
                <DocumentWorkflowRow
                  actionLabel="Concluir"
                  canMutate={canMutate}
                  item={proposal}
                  key={proposal.id}
                  loading={loadingId === proposal.id}
                  onAction={onCompleteProposal}
                />
              ))
            ) : (
              <TableEmptyState
                description="Nenhuma proposta aguardando conclusao."
                icon="briefcase"
                title="Propostas em dia"
              />
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-black uppercase text-amiste-gray/55">Fichas em rascunho</h3>
          <div className="space-y-2">
            {workflow.unsignedSheets.length ? (
              workflow.unsignedSheets.map((sheet) => (
                <DocumentWorkflowRow
                  actionLabel="Assinar"
                  canMutate={canMutate}
                  item={sheet}
                  key={sheet.id}
                  loading={loadingId === sheet.id}
                  onAction={onSignSheet}
                />
              ))
            ) : (
              <TableEmptyState
                description="Nenhuma ficha aguardando assinatura."
                icon="fileText"
                title="Fichas em dia"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
