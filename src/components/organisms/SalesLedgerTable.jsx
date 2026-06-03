import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

export default function SalesLedgerTable({ rows }) {
  if (!rows.length) {
    return (
      <TableEmptyState
        description="Registre a primeira venda para movimentar estoque e financeiro."
        icon="shoppingCart"
        title="Nenhuma venda registrada"
      />
    );
  }

  return (
    <section aria-label="Historico de vendas" className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <header className="border-b border-zinc-100 px-4 py-4">
        <h2 className="font-display text-lg font-black text-amiste-black">Historico de vendas</h2>
        <p className="mt-1 text-sm font-semibold text-amiste-gray/60">Saidas registradas com estoque e financeiro integrados.</p>
      </header>
      <div className="overflow-x-auto">
        <div className="min-w-[940px]">
          <div className="grid grid-cols-[110px_1fr_1.15fr_90px_130px_130px_125px] gap-4 border-b border-zinc-100 px-4 py-3 text-xs font-black uppercase text-amiste-gray/60">
            <span>Data</span>
            <span>Cliente</span>
            <span>Produto</span>
            <span>Qtd</span>
            <span>Unitario</span>
            <span>Total</span>
            <span>Status</span>
          </div>

          {rows.map((sale) => (
            <div
              className="grid grid-cols-[110px_1fr_1.15fr_90px_130px_130px_125px] items-center gap-4 border-b border-zinc-100 px-4 py-4 last:border-b-0"
              key={sale.id}
            >
              <span className="text-sm font-bold text-amiste-black">{sale.date}</span>
              <span className="truncate text-sm font-black text-amiste-black">{sale.clientName}</span>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-amiste-black">{sale.productName}</strong>
                <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">
                  {sale.productType} | estoque atual {sale.productStock}
                </span>
              </div>
              <span className="text-sm font-black text-amiste-black">{sale.quantity}</span>
              <span className="text-sm font-bold text-amiste-gray">{formatCurrency(sale.unitValue)}</span>
              <span className="text-sm font-black text-amiste-green">{formatCurrency(sale.totalValue)}</span>
              <StatusPill status={sale.paymentStatus} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
