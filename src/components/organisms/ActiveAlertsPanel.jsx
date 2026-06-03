import AlertItem from "../molecules/AlertItem.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

export default function ActiveAlertsPanel({ alerts, onSelectPage }) {
  function handleSelectAlert(alert) {
    if (alert.pageId) {
      onSelectPage(alert.pageId);
    }
  }

  return (
    <aside className="min-w-0 space-y-3">
      <div>
        <h2 className="font-display text-lg font-black text-amiste-black">Painel de avaliacao ativa</h2>
        <p className="mt-1 text-sm italic text-amiste-gray/60">Alertas gerados a partir dos dados operacionais.</p>
      </div>
      {alerts.length ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertItem alert={alert} key={alert.id} onSelect={handleSelectAlert} />
          ))}
        </div>
      ) : (
        <TableEmptyState
          description="Nenhum risco operacional ou financeiro ativo."
          icon="checkSquare"
          title="Tudo em dia"
        />
      )}
    </aside>
  );
}
