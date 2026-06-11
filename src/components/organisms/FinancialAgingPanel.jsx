import AppIcon from "../atoms/AppIcon.jsx";
import Button from "../atoms/Button.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

export default function FinancialAgingPanel({ canMutate, rows, onSettle }) {
  const queueRows = rows
    .filter((row) => row.status !== "pago")
    .filter((row) => row.isOverdue || row.daysToDue <= 7)
    .slice(0, 6);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition duration-300 hover:shadow-amiste-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Fila de caixa</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Vencimentos</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-amiste-blue/10 text-amiste-blue">
          <AppIcon name="fileClock" size={20} />
        </span>
      </div>

      {queueRows.length ? (
        <div className="mt-4 divide-y divide-zinc-100">
          {queueRows.map((row) => (
            <div className="py-3" key={`${row.collectionName}-${row.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black text-amiste-black">{row.description}</strong>
                  <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">
                    {row.typeLabel} | {row.agingLabel}
                  </span>
                </div>
                <span className={row.direction === "in" ? "text-sm font-black text-amiste-green" : "text-sm font-black text-amiste-red"}>
                  {formatCurrency(row.value)}
                </span>
              </div>
              {canMutate ? (
                <div className="mt-3 flex justify-end">
                  <Button className="h-8 w-[76px] px-3 text-xs" icon="checkSquare" variant="secondary" onClick={() => onSettle(row)}>
                    Baixar
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-5">
          <strong className="block text-sm font-black text-amiste-black">Sem pressao de caixa</strong>
          <span className="mt-1 block text-sm text-amiste-gray/70">Nao ha vencimentos pendentes nos proximos 7 dias.</span>
        </div>
      )}
    </section>
  );
}
