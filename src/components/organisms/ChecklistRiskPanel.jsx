import AppIcon from "../atoms/AppIcon.jsx";
import Button from "../atoms/Button.jsx";

export default function ChecklistRiskPanel({ canMutate, rows, onFinalize }) {
  const riskRows = rows.filter((row) => !row.compatible).slice(0, 4);
  const readyRows = rows
    .filter((row) => row.compatible && row.status !== "finalizado")
    .slice(0, 4);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Compatibilidade</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Risco tecnico</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-md bg-amiste-red/10 text-amiste-red">
          <AppIcon name="shield" size={20} />
        </span>
      </div>

      {riskRows.length ? (
        <div className="mt-4 divide-y divide-zinc-100">
          {riskRows.map((row) => (
            <div className="py-3" key={row.id}>
              <strong className="block truncate text-sm font-black text-amiste-black">{row.code} | {row.machineName}</strong>
              <span className="mt-1 block text-xs font-semibold text-amiste-red">
                {row.issues.join(" ")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-md bg-zinc-50 px-4 py-5">
          <strong className="block text-sm font-black text-amiste-black">Sem falsa equivalencia</strong>
          <span className="mt-1 block text-sm text-amiste-gray/70">Checklists atuais estao compativeis com os requisitos tecnicos.</span>
        </div>
      )}

      <div className="mt-5 border-t border-zinc-100 pt-4">
        <p className="text-xs font-black uppercase text-amiste-gray/55">Prontos para finalizar</p>
        {readyRows.length ? (
          <div className="mt-3 space-y-3">
            {readyRows.map((row) => (
              <div className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 p-3" key={row.id}>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black text-amiste-black">{row.code}</strong>
                  <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">{row.clientName}</span>
                </div>
                {canMutate ? (
                  <Button className="h-8 px-3 text-xs" icon="checkSquare" variant="secondary" onClick={() => onFinalize(row)}>
                    Finalizar
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <span className="mt-3 block text-sm text-amiste-gray/70">Nenhum checklist pendente compativel.</span>
        )}
      </div>
    </section>
  );
}
