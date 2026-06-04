import Button from "../atoms/Button.jsx";
import IconButton from "../atoms/IconButton.jsx";
import StatusPill from "../atoms/StatusPill.jsx";

function formatCurrency(value) {
  const numericValue = Number(value);

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function resolveValue(record, field, snapshot) {
  if (field.render) {
    return field.render(record, snapshot);
  }

  if (field.source) {
    const relatedRecord = snapshot[field.source]?.find((item) => item.id === record[field.key]);
    return relatedRecord?.[field.sourceLabel || "name"] || "-";
  }

  const value = record[field.key];

  return value === undefined || value === null || value === "" ? "-" : value;
}

export default function EntityCardsGrid({
  card,
  records,
  snapshot,
  actions = true,
  extraActions = [],
  onEdit,
  onDelete,
  onExtraAction,
  canDelete = actions,
  canEdit = actions,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {records.map((record) => {
        const statusValue = card.statusKey ? record[card.statusKey] : null;
        const titleValue = resolveValue(record, card.title, snapshot);

        return (
          <article
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-amiste-red/40 hover:shadow-amiste"
            key={record.id}
          >
            {/* --- SECAO: CONTEUDO DO CARD --- */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-lg font-black text-amiste-black">
                  {titleValue}
                </h3>
                {card.subtitle ? (
                  <p className="mt-1 truncate text-sm italic text-amiste-gray/65">
                    {resolveValue(record, card.subtitle, snapshot)}
                  </p>
                ) : null}
              </div>
              {statusValue ? <StatusPill status={statusValue} /> : null}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3">
              {card.meta.map((metaItem) => (
                <div className="rounded-md bg-zinc-50 p-3" key={metaItem.key}>
                  <dt className="text-[11px] font-black uppercase text-amiste-gray/50">{metaItem.label}</dt>
                  <dd className="mt-1 text-sm font-black text-amiste-black">
                    {metaItem.type === "currency"
                      ? formatCurrency(resolveValue(record, metaItem, snapshot))
                      : resolveValue(record, metaItem, snapshot)}
                  </dd>
                </div>
              ))}
            </dl>

            {/* --- SECAO: ACOES DO CARD --- */}
            {canEdit || canDelete || extraActions.length ? (
              <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                {extraActions.map((action) => (
                  <Button
                    aria-label={`${action.label} ${titleValue}`}
                    className="h-9 px-3 text-xs"
                    icon={action.icon}
                    key={action.id}
                    variant="secondary"
                    onClick={() => onExtraAction(action, record)}
                  >
                    {action.label}
                  </Button>
                ))}
                {canEdit ? <IconButton icon="pencil" label={`Editar ${titleValue}`} onClick={() => onEdit(record)} /> : null}
                {canDelete ? <IconButton icon="trash" label={`Excluir ${titleValue}`} onClick={() => onDelete(record)} /> : null}
              </div>
            ) : null}
          </article>
        );
      })}
      {!records.length ? (
        <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-zinc-300 bg-white md:col-span-2 xl:col-span-4">
          <Button icon="plus" variant="secondary">
            Nenhum registro encontrado
          </Button>
        </div>
      ) : null}
    </div>
  );
}
