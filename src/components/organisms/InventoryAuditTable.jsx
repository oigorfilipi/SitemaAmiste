import Button from "../atoms/Button.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

function formatStockGap(item) {
  if (!item.missingToMin) {
    return "OK";
  }

  return `Faltam ${item.missingToMin}`;
}

export default function InventoryAuditTable({ canMutate, records, unitLabel, onAdjust }) {
  if (!records.length) {
    return (
      <TableEmptyState
        description="Cadastre itens no catalogo para habilitar a contagem."
        icon="boxes"
        title="Nenhum item neste grupo"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[1.35fr_1fr_105px_105px_130px_145px_140px_120px] gap-4 border-b border-zinc-100 px-4 py-3 text-xs font-black uppercase text-amiste-gray/60">
            <span>Item</span>
            <span>Categoria</span>
            <span>Atual</span>
            <span>Minimo</span>
            <span>Gap</span>
            <span>Valor estoque</span>
            <span>Status</span>
            {canMutate ? <span className="text-right">Acao</span> : <span />}
          </div>

          {records.map((item) => (
            <div
              className="grid grid-cols-[1.35fr_1fr_105px_105px_130px_145px_140px_120px] items-center gap-4 border-b border-zinc-100 px-4 py-4 last:border-b-0"
              key={item.id}
            >
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-amiste-black">{item.name}</strong>
                <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/55">{item.brand || "Sem marca"}</span>
              </div>
              <span className="truncate text-sm text-amiste-gray">{item.category || "-"}</span>
              <span className="text-sm font-black">
                {item.stock} {unitLabel}
              </span>
              <span className="text-sm text-amiste-gray">{item.minStock}</span>
              <span className={item.missingToMin ? "text-sm font-black text-amiste-red" : "text-sm font-bold text-amiste-green"}>
                {formatStockGap(item)}
              </span>
              <span className="text-sm font-black text-amiste-black">{formatCurrency(item.stockValue)}</span>
              <StatusPill status={item.status} />
              {canMutate ? (
                <div className="text-right">
                  <Button className="h-8 px-3 text-xs" icon="pencil" variant="secondary" onClick={() => onAdjust(item)}>
                    Ajustar
                  </Button>
                </div>
              ) : (
                <span />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
