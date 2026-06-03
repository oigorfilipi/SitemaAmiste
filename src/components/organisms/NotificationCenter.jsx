import AlertItem from "../molecules/AlertItem.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";
import AppIcon from "../atoms/AppIcon.jsx";

export default function NotificationCenter({ alerts, open, onClose, onSelectAlert }) {
  if (!open) {
    return null;
  }

  return (
    <section className="absolute right-0 top-12 z-50 w-[420px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl">
      {/* --- SECAO: CABECALHO DA CENTRAL --- */}
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div>
          <strong className="block font-display text-sm font-black text-amiste-black">Central de alertas</strong>
          <span className="mt-1 block text-xs font-semibold text-amiste-gray/55">
            {alerts.length ? `${alerts.length} alertas ativos` : "Sem pendencias ativas"}
          </span>
        </div>
        <button
          aria-label="Fechar alertas"
          className="grid size-8 place-items-center rounded-md border border-zinc-200 text-amiste-gray transition hover:border-amiste-red hover:text-amiste-red"
          type="button"
          onClick={onClose}
        >
          <AppIcon name="x" size={16} />
        </button>
      </header>

      {/* --- SECAO: LISTA DE ALERTAS --- */}
      <div className="max-h-[470px] overflow-y-auto p-3">
        {alerts.length ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertItem alert={alert} key={alert.id} onSelect={onSelectAlert} />
            ))}
          </div>
        ) : (
          <TableEmptyState
            description="Nenhum risco operacional ou financeiro ativo para este perfil."
            icon="checkSquare"
            title="Tudo em dia"
          />
        )}
      </div>
    </section>
  );
}
