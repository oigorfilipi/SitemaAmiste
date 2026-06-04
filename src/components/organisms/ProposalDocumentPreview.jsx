import DocumentInfoRow from "../molecules/DocumentInfoRow.jsx";

export default function ProposalDocumentPreview({ model }) {
  return (
    <article className="mx-auto flex aspect-[210/297] w-full max-w-[794px] flex-col overflow-hidden border border-zinc-300 bg-white text-amiste-black shadow-xl">
      {/* --- SECAO: CABECALHO A4 --- */}
      <header className="flex items-center justify-between bg-[#A82020] px-[4%] py-[3%] text-[#FAFAFA]">
        <div>
          <span className="text-[10px] font-black uppercase text-white/75">{model.badge} | {model.documentCode}</span>
          <h3 className="mt-1 font-display text-2xl font-black">Amiste Cafe</h3>
        </div>
        <strong className="max-w-[42%] text-right text-sm font-black">{model.machineModelName}</strong>
      </header>

      <section className="flex flex-1 flex-col gap-[3%] p-[4%]">
        <div className="grid grid-cols-[0.92fr_1.08fr] gap-[4%]">
          <div className="grid aspect-square place-items-center overflow-hidden border border-zinc-300 bg-zinc-100 text-center">
            {model.machineImageUrl ? (
              <img alt={model.documentTitle} className="h-full w-full object-cover" src={model.machineImageUrl} />
            ) : (
              <div className="px-4">
                <strong className="block font-display text-2xl font-black text-amiste-black">
                  {model.documentTitle}
                </strong>
                <span className="mt-2 block text-xs font-black uppercase text-amiste-gray/60">
                  {model.machine.brand || "Maquina"}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <span className="text-xs font-black uppercase text-[#A82020]">Proposta para</span>
            <h4 className="mt-1 font-display text-3xl font-black leading-tight text-amiste-black">
              {model.clientName}
            </h4>
            <p className="mt-3 line-clamp-[9] text-sm font-semibold leading-6 text-amiste-gray">
              {model.proposalText || model.summary || "Texto da proposta sera exibido aqui."}
            </p>
            <p className="mt-3 truncate text-xs font-black text-amiste-gray/70">
              Video: {model.videoUrl || "nao informado"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {model.rows.slice(0, 6).map((row) => (
            <DocumentInfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>

        <section className="min-h-24 border border-zinc-300 p-3">
          <span className="text-xs font-black uppercase text-[#A82020]">Observacoes gerais</span>
          <p className="mt-2 line-clamp-[6] text-sm font-semibold leading-6 text-amiste-gray">
            {model.record.generalNotes || model.record.notes || "Sem observacoes adicionais."}
          </p>
        </section>
      </section>

      {/* --- SECAO: RODAPE A4 --- */}
      <footer className="flex items-center justify-between bg-[#A82020] px-[4%] py-[3%] text-[#FAFAFA]">
        <div>
          <span className="text-xs font-black uppercase text-white/75">Valor total da negociacao</span>
          <strong className="mt-1 block font-display text-4xl font-black">{model.primaryValue}</strong>
        </div>
        <p className="max-w-[42%] text-right text-lg font-black">{model.secondaryValue}</p>
      </footer>
    </article>
  );
}
