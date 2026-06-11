import AppIcon from "../atoms/AppIcon.jsx";
import Button from "../atoms/Button.jsx";

export default function InventoryRiskPanel({ canMutate, records, onAdjust }) {
  const riskRows = records.filter((item) => item.isLowStock).slice(0, 5);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition duration-300 hover:shadow-amiste-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Fila critica</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Reposicao e ruptura</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-amiste-red/10 text-amiste-red">
          <AppIcon name="packagePlus" size={20} />
        </span>
      </div>

      {riskRows.length ? (
        <div className="mt-4 divide-y divide-zinc-100">
          {riskRows.map((item) => (
            <div className="flex items-center justify-between gap-4 py-3" key={item.id}>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-amiste-black">{item.name}</strong>
                <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">
                  Atual {item.stock} / minimo {item.minStock}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-xl bg-amiste-yellow/35 px-2.5 py-1 text-xs font-black text-yellow-900">
                  {item.isOutOfStock ? "Zerado" : `Faltam ${item.missingToMin}`}
                </span>
                {canMutate ? (
                  <Button className="h-8 w-[86px] px-3 text-xs" icon="pencil" variant="secondary" onClick={() => onAdjust(item)}>
                    Ajustar
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-5">
          <strong className="block text-sm font-black text-amiste-black">Nenhuma ruptura ativa</strong>
          <span className="mt-1 block text-sm text-amiste-gray/70">Todos os itens deste grupo estao acima do minimo.</span>
        </div>
      )}
    </section>
  );
}
