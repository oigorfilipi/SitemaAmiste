import AppIcon from "../atoms/AppIcon.jsx";

export default function CatalogHealthPanel({ alerts }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Saude do catalogo</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Alertas tecnicos</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-md bg-amiste-red/10 text-amiste-red">
          <AppIcon name="shield" size={20} />
        </span>
      </div>

      {alerts.length ? (
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {alerts.map((item) => (
            <article className="rounded-md border border-zinc-200 bg-zinc-50 p-3" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black text-amiste-black">{item.name}</strong>
                  <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/60">
                    {item.brand || item.category || item.catalogLabel}
                  </span>
                </div>
                <span className="rounded-md bg-amiste-yellow/40 px-2 py-1 text-xs font-black uppercase text-yellow-900">
                  {item.healthLabel}
                </span>
              </div>
              <ul className="mt-3 space-y-1">
                {item.issues.map((issue) => (
                  <li className="text-xs font-semibold text-amiste-gray/75" key={issue}>
                    {issue}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-md bg-zinc-50 px-4 py-5">
          <strong className="block text-sm font-black text-amiste-black">Catalogo saudavel</strong>
          <span className="mt-1 block text-sm text-amiste-gray/70">Nenhum alerta de estoque, status ou precificacao neste grupo.</span>
        </div>
      )}
    </section>
  );
}
