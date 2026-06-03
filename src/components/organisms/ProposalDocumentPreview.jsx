import StatusPill from "../atoms/StatusPill.jsx";
import DocumentInfoRow from "../molecules/DocumentInfoRow.jsx";

export default function ProposalDocumentPreview({ model }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      {/* --- SECAO: CABECALHO DA PROPOSTA --- */}
      <header className="bg-amiste-red px-8 py-6 text-white">
        <span className="text-xs font-black uppercase tracking-normal text-white/70">{model.badge}</span>
        <h3 className="mt-2 font-display text-3xl font-black">Amiste Cafe</h3>
        <p className="mt-1 text-sm font-semibold text-white/75">{model.documentCode}</p>
      </header>

      <section className="grid grid-cols-[1.2fr_0.8fr] gap-8 p-8">
        <div>
          <h4 className="font-display text-2xl font-black text-amiste-black">{model.documentTitle}</h4>
          <p className="mt-2 text-sm leading-6 text-amiste-gray">{model.summary}</p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            {model.rows.slice(0, 4).map((row) => (
              <DocumentInfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>

        <aside className="rounded-lg bg-zinc-50 p-5">
          <span className="text-xs font-black uppercase text-amiste-gray/50">Valor Final</span>
          <strong className="mt-2 block font-display text-3xl font-black text-amiste-black">
            {model.primaryValue}
          </strong>
          <div className="mt-4">
            <StatusPill status={model.status} />
          </div>
          <p className="mt-5 text-sm leading-6 text-amiste-gray">{model.record.notes}</p>
        </aside>
      </section>
    </div>
  );
}
