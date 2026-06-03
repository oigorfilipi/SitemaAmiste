import StatusPill from "../atoms/StatusPill.jsx";
import DocumentInfoRow from "../molecules/DocumentInfoRow.jsx";

export default function ServiceSheetDocumentPreview({ model }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      {/* --- SECAO: CABECALHO DA FICHA --- */}
      <header className="flex items-center justify-between bg-amiste-black px-8 py-5 text-white">
        <div>
          <span className="text-xs font-black uppercase text-white/60">{model.badge}</span>
          <h3 className="mt-1 font-display text-2xl font-black">{model.documentTitle}</h3>
        </div>
        <StatusPill status={model.status} />
      </header>

      <section className="space-y-6 p-8">
        <div className="grid grid-cols-4 gap-4">
          {model.rows.slice(0, 8).map((row) => (
            <DocumentInfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {model.rows.slice(8, 12).map((row) => (
            <DocumentInfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>

        <div className="rounded-lg bg-zinc-50 p-4">
          <span className="block text-xs font-black uppercase text-amiste-gray/50">Produtos / Insumos</span>
          <p className="mt-2 text-sm font-semibold leading-6 text-amiste-black">{model.record.products}</p>
        </div>

        <div className="rounded-lg bg-zinc-50 p-4">
          <span className="block text-xs font-black uppercase text-amiste-gray/50">Observacoes</span>
          <p className="mt-2 text-sm font-semibold leading-6 text-amiste-black">{model.record.notes}</p>
        </div>

        <footer className="grid grid-cols-2 gap-8 pt-8 text-center text-xs font-black uppercase text-amiste-gray/60">
          <span className="border-t border-amiste-gray/40 pt-3">Assinatura Cliente</span>
          <span className="border-t border-amiste-gray/40 pt-3">Assinatura Tecnico</span>
        </footer>
      </section>
    </div>
  );
}
