import StatusPill from "../atoms/StatusPill.jsx";
import AppIcon from "../atoms/AppIcon.jsx";

export default function DataSourcePanel({ sources }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-black text-amiste-black">Fonte de dados</h2>
        <p className="mt-1 text-sm font-semibold text-amiste-gray/60">
          Camada atual, persistencia local e rotinas de backup.
        </p>
      </div>

      {/* --- SECAO: FONTES DISPONIVEIS --- */}
      <div className="grid grid-cols-1 gap-4">
        {sources.map((source) => (
          <article className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm" key={source.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-md bg-zinc-100 text-amiste-gray">
                    <AppIcon name={source.id === "local" ? "archive" : "database"} size={19} />
                  </span>
                  <h3 className="font-display text-base font-black text-amiste-black">{source.title}</h3>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-amiste-gray/70">{source.detail}</p>
              </div>
              <StatusPill label={source.statusLabel} status={source.status} />
            </div>
            <ul className="mt-4 grid gap-2">
              {source.items.map((item) => (
                <li className="flex items-center gap-2 text-sm font-bold text-amiste-gray" key={item}>
                  <span className="size-1.5 rounded-full bg-amiste-red" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
