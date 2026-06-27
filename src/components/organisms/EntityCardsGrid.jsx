import AppIcon from "../atoms/AppIcon.jsx";
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

function resolveCardImage(record, card) {
  const imageKey = card.imageKey;

  return (
    (imageKey ? record[imageKey] : "") ||
    record.imageDataUrl ||
    record.photoDataUrl ||
    record.imageUrl ||
    record.photoUrl ||
    ""
  );
}

function resolveRelatedName(snapshot, collection, id, fallbackKey = "name") {
  return snapshot[collection]?.find((item) => item.id === id)?.[fallbackKey] || "-";
}

function DocumentCardPreview({ card, record, snapshot }) {
  if (card.previewType === "proposal") {
    const clientName = resolveRelatedName(snapshot, "clients", record.clientId);
    const machine = snapshot.machines?.find((item) => item.id === record.machineId) || {};
    const totalValue = formatCurrency(record.totalValue);

    return (
      <div className="bg-zinc-100 p-3">
        <div className="mx-auto aspect-[1.414/1] max-h-36 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between bg-amiste-red px-3 py-2 text-white">
              <strong className="font-display text-[11px] font-black uppercase">Proposta</strong>
              <span className="text-[8px] font-black uppercase opacity-80">Amiste Cafe</span>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-[74px_1fr] gap-2 p-2">
              <div className="grid place-items-center overflow-hidden rounded-xl bg-zinc-100">
                {machine.imageDataUrl || machine.imageUrl ? (
                  <img alt={machine.name || "Maquina"} className="h-full w-full object-cover" src={machine.imageDataUrl || machine.imageUrl} />
                ) : (
                  <AppIcon className="text-amiste-red" name="cog" size={22} />
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="h-2.5 w-3/4 rounded-full bg-zinc-200" />
                <strong className="block truncate text-[10px] font-black text-amiste-black">{clientName}</strong>
                <p className="truncate text-[9px] font-bold text-amiste-gray">{machine.name || "Maquina nao vinculada"}</p>
                <div className="mt-2 rounded-xl bg-amiste-black px-2 py-1 text-[10px] font-black text-amiste-green">
                  {totalValue}
                </div>
              </div>
            </div>
            <div className="h-3 bg-amiste-red" />
          </div>
        </div>
      </div>
    );
  }

  if (card.previewType === "serviceSheet") {
    const clientName = resolveRelatedName(snapshot, "clients", record.clientId);
    const machineName = resolveRelatedName(snapshot, "machines", record.machineId);

    return (
      <div className="bg-zinc-100 p-3">
        <div className="mx-auto aspect-[1.414/1] max-h-36 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex h-full flex-col p-2">
            <div className="flex items-center justify-between border-b-2 border-amiste-black pb-1">
              <strong className="font-display text-[10px] font-black uppercase text-amiste-black">{record.sheetType || "Ficha"}</strong>
              <span className="text-[8px] font-black uppercase text-amiste-red">Tecnico</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[8px] font-black text-amiste-gray">
              <span className="truncate rounded-xl bg-zinc-100 px-2 py-1">{clientName}</span>
              <span className="truncate rounded-xl bg-zinc-100 px-2 py-1">{machineName}</span>
              <span className="rounded-xl bg-zinc-100 px-2 py-1">Data: {record.date || "-"}</span>
              <span className="rounded-xl bg-zinc-100 px-2 py-1">Hora: {record.time || "-"}</span>
            </div>
            <div className="mt-2 grid flex-1 grid-cols-3 gap-1.5">
              {Array.from({ length: 9 }).map((_, index) => (
                <span className="rounded border border-zinc-200 bg-zinc-50" key={`sheet-line-${index + 1}`} />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-zinc-200 pt-2">
              <span className="h-2 rounded-full bg-zinc-200" />
              <span className="h-2 rounded-full bg-zinc-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
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
  const compactSideImage = card.imageLayout === "side";

  return (
    <div className={compactSideImage ? "grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3" : "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"}>
      {records.map((record) => {
        const statusValue = card.statusKey ? record[card.statusKey] : null;
        const titleValue = resolveValue(record, card.title, snapshot);
        const imageSource = resolveCardImage(record, card);

        return (
          <article
            className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-amiste-red/35 hover:shadow-amiste-soft"
            key={record.id}
          >
            {card.previewType ? (
              <DocumentCardPreview card={card} record={record} snapshot={snapshot} />
            ) : compactSideImage ? (
              <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-0">
                <div className="grid min-h-full place-items-center overflow-hidden bg-zinc-50 p-2">
                  {imageSource ? (
                    <img
                      alt={String(titleValue)}
                      className="max-h-24 w-full rounded-xl object-contain"
                      src={imageSource}
                    />
                  ) : (
                    <div className="grid size-20 place-items-center rounded-2xl border border-amiste-red/15 bg-white text-amiste-red shadow-sm">
                      <AppIcon name={card.icon || "layoutGrid"} size={24} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 p-3">
                  {/* --- SECAO: CONTEUDO COMPACTO DO CARD --- */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-sm font-black text-amiste-black">
                        {titleValue}
                      </h3>
                      {card.subtitle ? (
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-amiste-gray/60">
                          {resolveValue(record, card.subtitle, snapshot)}
                        </p>
                      ) : null}
                    </div>
                    {statusValue ? <StatusPill status={statusValue} /> : null}
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    {card.meta.map((metaItem) => (
                      <div className="min-w-0 rounded-xl border border-zinc-100 bg-zinc-50/80 px-2 py-1.5" key={metaItem.key}>
                        <dt className="text-[9px] font-black uppercase text-amiste-gray/50">{metaItem.label}</dt>
                        <dd className="mt-0.5 truncate text-[12px] font-black text-amiste-black">
                          {metaItem.type === "currency"
                            ? formatCurrency(resolveValue(record, metaItem, snapshot))
                            : resolveValue(record, metaItem, snapshot)}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {canEdit || canDelete || extraActions.length ? (
                    <div className="mt-3 flex min-h-8 flex-wrap items-center justify-end gap-1.5">
                      {extraActions.map((action) => (
                        <Button
                          aria-label={`${action.label} ${titleValue}`}
                          className="h-8 px-2.5 text-[11px]"
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
                </div>
              </div>
            ) : card.showImage === false ? null : (
              <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                {imageSource ? (
                  <img
                    alt={String(titleValue)}
                    className="h-full w-full object-contain transition duration-500 hover:scale-[1.03]"
                    src={imageSource}
                  />
                ) : (
                  <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_top_left,rgba(168,32,32,.13),transparent_34%),linear-gradient(135deg,#f8fafc,#f1f5f9)] text-amiste-red">
                    <span className="grid size-12 place-items-center rounded-2xl border border-amiste-red/15 bg-white/80 shadow-sm">
                      <AppIcon name={card.icon || "layoutGrid"} size={24} />
                    </span>
                  </div>
                )}
              </div>
            )}

            {!compactSideImage ? (
            <div className="p-4">
            {/* --- SECAO: CONTEUDO DO CARD --- */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-base font-black text-amiste-black">
                  {titleValue}
                </h3>
                {card.subtitle ? (
                  <p className="mt-1 truncate text-xs font-semibold text-amiste-gray/60">
                    {resolveValue(record, card.subtitle, snapshot)}
                  </p>
                ) : null}
              </div>
              {statusValue ? <StatusPill status={statusValue} /> : null}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2.5">
              {card.meta.map((metaItem) => (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-2.5" key={metaItem.key}>
                  <dt className="text-[10px] font-black uppercase text-amiste-gray/50">{metaItem.label}</dt>
                  <dd className="mt-1 truncate text-[13px] font-black text-amiste-black">
                    {metaItem.type === "currency"
                      ? formatCurrency(resolveValue(record, metaItem, snapshot))
                      : resolveValue(record, metaItem, snapshot)}
                  </dd>
                </div>
              ))}
            </dl>

            {/* --- SECAO: ACOES DO CARD --- */}
            {canEdit || canDelete || extraActions.length ? (
              <div className="mt-4 flex min-h-9 flex-wrap items-center justify-end gap-2">
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
            </div>
            ) : null}
          </article>
        );
      })}
      {!records.length ? (
        <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white md:col-span-2 xl:col-span-4">
          <Button icon="plus" variant="secondary">
            Nenhum registro encontrado
          </Button>
        </div>
      ) : null}
    </div>
  );
}
