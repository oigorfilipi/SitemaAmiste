import StatusPill from "../atoms/StatusPill.jsx";
import Modal from "../molecules/Modal.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

function resolveValue(record, field, snapshot) {
  if (!record) {
    return "-";
  }

  if (field.render) {
    return field.render(record, snapshot);
  }

  if (field.source) {
    const relatedRecord = snapshot[field.source]?.find((item) => item.id === record[field.key]);
    return relatedRecord?.[field.sourceLabel || "name"] || "-";
  }

  return record[field.key] || "-";
}

export default function RecordDetailModal({ open, record, config, snapshot, onClose }) {
  if (!record) {
    return null;
  }

  return (
    <Modal
      description={config.description}
      open={open}
      title={config.title(record, snapshot)}
      onClose={onClose}
    >
      <div className="space-y-5">
        {/* --- SECAO: DADOS AGRUPADOS --- */}
        <div className="grid grid-cols-2 gap-4">
          {config.fields.map((field) => {
            const value = resolveValue(record, field, snapshot);

            return (
              <div className={field.full ? "col-span-2" : ""} key={field.key}>
                <span className="block text-xs font-black uppercase text-amiste-gray/50">{field.label}</span>
                <div className="mt-2 rounded-md bg-zinc-50 p-3 text-sm font-semibold text-amiste-black">
                  {field.type === "status" ? (
                    <StatusPill status={value} />
                  ) : field.type === "currency" ? (
                    formatCurrency(value)
                  ) : (
                    value
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
