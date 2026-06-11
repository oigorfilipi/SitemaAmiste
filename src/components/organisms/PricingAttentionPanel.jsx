import AppIcon from "../atoms/AppIcon.jsx";
import Button from "../atoms/Button.jsx";

function resolveAttentionText(item) {
  if (item.analysisMode === "payback") {
    return `Payback ${item.analysisLabel}`;
  }

  return `Margem ${item.analysisLabel}`;
}

export default function PricingAttentionPanel({ canMutate, records, onEdit }) {
  const attentionRows = records.filter((item) => item.attention).slice(0, 5);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition duration-300 hover:shadow-amiste-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Analise comercial</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Pontos de atencao</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-amiste-yellow/35 text-yellow-900">
          <AppIcon name="gauge" size={20} />
        </span>
      </div>

      {attentionRows.length ? (
        <div className="mt-4 divide-y divide-zinc-100">
          {attentionRows.map((item) => (
            <div className="flex items-center justify-between gap-4 py-3" key={item.id}>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-amiste-black">{item.name}</strong>
                <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">
                  {resolveAttentionText(item)}
                </span>
              </div>
              {canMutate ? (
                <Button
                  aria-label={`Editar ${item.name}`}
                  className="h-8 w-[76px] px-3 text-xs"
                  icon="pencil"
                  variant="secondary"
                  onClick={() => onEdit(item)}
                >
                  Editar
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-5">
          <strong className="block text-sm font-black text-amiste-black">Tabela sem alerta</strong>
          <span className="mt-1 block text-sm text-amiste-gray/70">Valores atuais estao dentro dos criterios comerciais.</span>
        </div>
      )}
    </section>
  );
}
