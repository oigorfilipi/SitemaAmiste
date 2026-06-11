import TableEmptyState from "../molecules/TableEmptyState.jsx";
import { formatCollectionUpdate } from "../../services/settingsService.js";

export default function CollectionHealthTable({ rows }) {
  if (!rows.length) {
    return (
      <TableEmptyState
        description="Nenhuma colecao foi encontrada no snapshot local."
        icon="archive"
        title="Base local vazia"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-black text-amiste-black">Colecoes locais</h2>
          <p className="mt-1 text-sm font-semibold text-amiste-gray/60">
            Leitura tecnica do snapshot persistido.
          </p>
        </div>
      </header>

      {/* --- SECAO: TABELA DE COLECOES --- */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-zinc-50/80 text-xs uppercase text-amiste-gray/50">
            <tr>
              <th className="px-5 py-3 font-black">Colecao</th>
              <th className="px-5 py-3 font-black">Registros</th>
              <th className="px-5 py-3 font-black">Ultima alteracao</th>
              <th className="px-5 py-3 font-black">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr className="transition hover:bg-amiste-red/5" key={row.id}>
                <td className="px-5 py-3">
                  <strong className="font-black text-amiste-black">{row.name}</strong>
                </td>
                <td className="px-5 py-3 font-bold text-amiste-gray">{row.count}</td>
                <td className="px-5 py-3 font-semibold text-amiste-gray/70">
                  {formatCollectionUpdate(row.lastUpdate)}
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black uppercase text-amiste-gray">
                    {row.count ? "Sincronizada" : "Sem registros"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
