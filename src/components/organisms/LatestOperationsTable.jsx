import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

function getFallbackCode(operation) {
  return operation.code || operation.sourceId || "-";
}

export default function LatestOperationsTable({ operations, onSelectPage }) {
  if (!operations.length) {
    return (
      <section className="min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-black text-amiste-black">Movimentacoes recentes</h2>
            <p className="mt-1 text-sm italic text-amiste-gray/60">Checklists, consertos, vendas e financeiro em uma fila unica.</p>
          </div>
        </div>
        <TableEmptyState
          description="As movimentacoes aparecem aqui conforme os modulos forem usados."
          icon="history"
          title="Nenhuma movimentacao recente"
        />
      </section>
    );
  }

  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-black text-amiste-black">Movimentacoes recentes</h2>
          <p className="mt-1 text-sm italic text-amiste-gray/60">Checklists, consertos, vendas e financeiro em uma fila unica.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="bg-zinc-50/80 text-xs font-black uppercase text-amiste-black">
            <tr>
              <th className="w-28 px-4 py-3">Tipo</th>
              <th className="w-28 px-4 py-3">Ref.</th>
              <th className="w-32 px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Resumo</th>
              <th className="w-28 px-4 py-3">Data</th>
              <th className="w-32 px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-sm">
            {operations.map((operation) => (
              <tr
                className="cursor-pointer transition hover:bg-amiste-red/5"
                key={operation.id}
                onClick={() => onSelectPage(operation.pageId)}
              >
                <td className="px-4 py-4">
                  <span className="inline-flex h-7 items-center rounded-full bg-zinc-100 px-3 text-xs font-black uppercase text-amiste-gray ring-1 ring-zinc-200">
                    {operation.kind}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-black text-amiste-red">{getFallbackCode(operation)}</td>
                <td className="px-4 py-4 font-semibold text-amiste-black">{operation.client}</td>
                <td className="min-w-0 px-4 py-4">
                  <strong className="block truncate text-amiste-black">{operation.title}</strong>
                  <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/60">
                    {operation.machine}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-amiste-gray">{operation.date}</td>
                <td className="px-4 py-4">
                  <StatusPill status={operation.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
