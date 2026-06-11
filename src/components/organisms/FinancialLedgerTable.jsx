import Button from "../atoms/Button.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

const DUE_STYLES = {
  blue: "bg-amiste-blue/10 text-amiste-blue",
  green: "bg-amiste-green/10 text-amiste-green",
  red: "bg-amiste-red/10 text-amiste-red",
  yellow: "bg-amiste-yellow/45 text-yellow-900",
};

export default function FinancialLedgerTable({ canMutate, rows, onSettle }) {
  if (!rows.length) {
    return (
      <TableEmptyState
        description="Nenhum lancamento atende ao filtro selecionado."
        icon="fileClock"
        title="Sem lancamentos financeiros"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[1040px]">
          <div className="grid grid-cols-[100px_1.35fr_1fr_125px_140px_145px_120px_120px] gap-4 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 text-xs font-black uppercase text-amiste-gray/60">
            <span>Tipo</span>
            <span>Descricao</span>
            <span>Cliente/Categoria</span>
            <span>Vencimento</span>
            <span>Aging</span>
            <span>Valor</span>
            <span>Status</span>
            {canMutate ? <span className="text-right">Acao</span> : <span />}
          </div>

          {rows.map((row) => (
            <div
              className="grid grid-cols-[100px_1.35fr_1fr_125px_140px_145px_120px_120px] items-center gap-4 border-b border-zinc-100 px-4 py-4 transition hover:bg-amiste-red/5 last:border-b-0"
              key={`${row.collectionName}-${row.id}`}
            >
              <span className={row.direction === "in" ? "text-sm font-black text-amiste-green" : "text-sm font-black text-amiste-red"}>
                {row.typeLabel}
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-amiste-black">{row.description}</strong>
                <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/55">{row.notes || "Sem observacao"}</span>
              </div>
              <span className="truncate text-sm text-amiste-gray">
                {row.direction === "in" ? row.clientName : row.category}
              </span>
              <span className="text-sm font-bold text-amiste-black">{row.dueDate}</span>
              <span className={`inline-flex h-7 w-fit items-center rounded-full px-3 text-xs font-black uppercase ${DUE_STYLES[row.dueTone] || DUE_STYLES.blue}`}>
                {row.agingLabel}
              </span>
              <span className={row.direction === "in" ? "text-sm font-black text-amiste-green" : "text-sm font-black text-amiste-red"}>
                {row.direction === "in" ? "+" : "-"} {formatCurrency(row.value)}
              </span>
              <StatusPill label={row.displayStatus} status={row.displayStatus} />
              {canMutate && row.status !== "pago" ? (
                <div className="text-right">
                  <Button
                    aria-label={`Baixa ${row.description}`}
                    className="h-8 w-[72px] px-3 text-xs"
                    icon="checkSquare"
                    variant="success"
                    onClick={() => onSettle(row)}
                  >
                    Baixa
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
