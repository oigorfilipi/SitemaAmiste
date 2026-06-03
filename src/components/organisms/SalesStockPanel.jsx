import AppIcon from "../atoms/AppIcon.jsx";

export default function SalesStockPanel({ snapshot }) {
  const stockRows = [
    ...(snapshot.supplies || []).map((item) => ({ ...item, productType: "Insumo" })),
    ...(snapshot.accessories || []).map((item) => ({ ...item, productType: "Acessorio" })),
  ]
    .filter((item) => Number(item.stock || 0) <= Number(item.minStock || 0))
    .slice(0, 6);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Alerta comercial</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Estoque baixo</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-md bg-amiste-yellow/35 text-yellow-900">
          <AppIcon name="packagePlus" size={20} />
        </span>
      </div>

      {stockRows.length ? (
        <div className="mt-4 divide-y divide-zinc-100">
          {stockRows.map((item) => (
            <div className="flex items-center justify-between gap-4 py-3" key={`${item.productType}-${item.id}`}>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-amiste-black">{item.name}</strong>
                <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">{item.productType}</span>
              </div>
              <span className="rounded-md bg-amiste-yellow/35 px-2 py-1 text-xs font-black text-yellow-900">
                {item.stock}/{item.minStock}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-md bg-zinc-50 px-4 py-5">
          <strong className="block text-sm font-black text-amiste-black">Produtos liberados</strong>
          <span className="mt-1 block text-sm text-amiste-gray/70">Nenhum item vendavel esta abaixo do minimo.</span>
        </div>
      )}
    </section>
  );
}
