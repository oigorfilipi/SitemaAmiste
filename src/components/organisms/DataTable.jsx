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

function resolveValue(record, column, snapshot) {
  if (column.render) {
    return column.render(record, snapshot);
  }

  if (column.source) {
    const relatedRecord = snapshot[column.source]?.find((item) => item.id === record[column.key]);
    return relatedRecord?.[column.sourceLabel || "name"] || "-";
  }

  const value = record[column.key];

  return value === undefined || value === null || value === "" ? "-" : value;
}

function renderCell(record, column, snapshot) {
  const value = resolveValue(record, column, snapshot);

  if (column.type === "currency") {
    return formatCurrency(value);
  }

  if (column.type === "status") {
    return <StatusPill status={value} />;
  }

  return value;
}

function resolveActionContext(record) {
  return record.name || record.code || record.origin || record.description || record.sheetType || record.id;
}

export default function DataTable({
  columns,
  records,
  snapshot,
  onEdit,
  onDelete,
  onExtraAction,
  actions = true,
  extraActions = [],
}) {
  const hasActionColumn = actions || extraActions.length > 0;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead className="bg-zinc-50 text-xs font-black uppercase text-amiste-black">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3" key={column.key}>
                {column.label}
              </th>
            ))}
            {hasActionColumn ? <th className="w-40 px-4 py-3 text-right">Acoes</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-sm">
          {records.map((record) => (
            <tr className="transition hover:bg-amiste-red/5" key={record.id}>
              {columns.map((column) => (
                <td className="px-4 py-4 font-medium text-amiste-gray" key={column.key}>
                  {renderCell(record, column, snapshot)}
                </td>
              ))}
              {hasActionColumn ? (
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    {extraActions.map((action) => (
                      <IconButton
                        icon={action.icon}
                        key={action.id}
                        label={`${action.label} ${resolveActionContext(record)}`}
                        onClick={() => onExtraAction(action, record)}
                      />
                    ))}
                    {actions ? (
                      <>
                        <IconButton icon="pencil" label="Editar" onClick={() => onEdit(record)} />
                        <IconButton icon="trash" label="Excluir" onClick={() => onDelete(record)} />
                      </>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {!records.length ? (
        <div className="grid min-h-40 place-items-center border-t border-zinc-100">
          <Button icon="plus" variant="secondary">
            Nenhum registro encontrado
          </Button>
        </div>
      ) : null}
    </div>
  );
}
