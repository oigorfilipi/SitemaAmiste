import AppIcon from "../atoms/AppIcon.jsx";
import StatusPill from "../atoms/StatusPill.jsx";

export default function GlobalSearchPanel({ isSearching, open, results, term, onClose, onSelectResult }) {
  if (!open) {
    return null;
  }

  const hasResults = results.length > 0;

  return (
    <section className="absolute right-0 top-12 z-50 w-[560px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl">
      {/* --- SECAO: CABECALHO DA BUSCA --- */}
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div>
          <strong className="block font-display text-sm font-black text-amiste-black">Busca global</strong>
          <span className="mt-1 block text-xs font-semibold text-amiste-gray/55">
            {isSearching ? "Buscando..." : `${results.length} resultados para "${term}"`}
          </span>
        </div>
        <button
          aria-label="Fechar busca"
          className="grid size-8 place-items-center rounded-md border border-zinc-200 text-amiste-gray transition hover:border-amiste-red hover:text-amiste-red"
          type="button"
          onClick={onClose}
        >
          <AppIcon name="x" size={16} />
        </button>
      </header>

      {/* --- SECAO: RESULTADOS --- */}
      <div className="max-h-[430px] overflow-y-auto p-2">
        {hasResults ? (
          results.map((result) => (
            <button
              className="grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 rounded-md p-3 text-left transition hover:bg-amiste-red/5"
              key={result.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelectResult(result)}
            >
              <span className="grid size-10 place-items-center rounded-md bg-amiste-red/10 text-amiste-red">
                <AppIcon name={result.icon} size={19} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-6 items-center rounded-full bg-zinc-100 px-2 text-[11px] font-black uppercase text-amiste-gray ring-1 ring-zinc-200">
                    {result.type}
                  </span>
                  <strong className="truncate text-sm font-black text-amiste-black">{result.title}</strong>
                </span>
                <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/65">
                  {result.subtitle}
                </span>
                <span className="mt-1 block truncate text-xs text-amiste-gray/55">{result.meta}</span>
              </span>
              <span className="flex items-center gap-2">
                {result.status ? <StatusPill className="h-6 px-2 text-[10px]" status={result.status} /> : null}
                <AppIcon name="chevronRight" size={17} className="text-amiste-gray/45" />
              </span>
            </button>
          ))
        ) : (
          <div className="grid min-h-36 place-items-center rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-4 text-center">
            <div>
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-white text-zinc-400 ring-1 ring-zinc-200">
                <AppIcon name="search" size={20} />
              </span>
              <strong className="mt-3 block text-sm font-black text-amiste-gray">Nenhum resultado encontrado</strong>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
