import Button from "../atoms/Button.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

function resolveAnalysisLabel(item) {
  return item.analysisMode === "payback" ? "Payback" : "Margem";
}

export default function PricingTable({ canMutate, records, onEdit }) {
  if (!records.length) {
    return (
      <TableEmptyState
        description="Cadastre itens no catalogo para liberar precificacao."
        icon="money"
        title="Nenhum item precificado"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[1040px]">
          <div className="grid grid-cols-[1.35fr_1fr_135px_135px_135px_115px_150px_110px_110px] gap-4 border-b border-zinc-100 px-4 py-3 text-xs font-black uppercase text-amiste-gray/60">
            <span>Item</span>
            <span>Categoria</span>
            <span>Principal</span>
            <span>Referencia</span>
            <span>Analise</span>
            <span>Estoque</span>
            <span>Potencial</span>
            <span>Status</span>
            {canMutate ? <span className="text-right">Acao</span> : <span />}
          </div>

          {records.map((item) => (
            <div
              className="grid grid-cols-[1.35fr_1fr_135px_135px_135px_115px_150px_110px_110px] items-center gap-4 border-b border-zinc-100 px-4 py-4 last:border-b-0"
              key={item.id}
            >
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-amiste-black">{item.name}</strong>
                <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/55">{item.brand || "Sem marca"}</span>
              </div>
              <span className="truncate text-sm text-amiste-gray">{item.category || "-"}</span>
              <div>
                <span className="block text-[11px] font-black uppercase text-amiste-gray/45">{item.primaryLabel}</span>
                <strong className="mt-1 block text-sm font-black text-amiste-black">{formatCurrency(item.primaryValue)}</strong>
              </div>
              <div>
                <span className="block text-[11px] font-black uppercase text-amiste-gray/45">{item.secondaryLabel}</span>
                <strong className="mt-1 block text-sm font-black text-amiste-black">{formatCurrency(item.secondaryValue)}</strong>
              </div>
              <div>
                <span className="block text-[11px] font-black uppercase text-amiste-gray/45">{resolveAnalysisLabel(item)}</span>
                <strong className={item.attention ? "mt-1 block text-sm font-black text-amiste-red" : "mt-1 block text-sm font-black text-amiste-green"}>
                  {item.analysisLabel}
                </strong>
              </div>
              <span className="text-sm font-black text-amiste-black">{item.stock}</span>
              <span className="text-sm font-black text-amiste-black">{formatCurrency(item.stockPotential)}</span>
              <StatusPill status={item.status} />
              {canMutate ? (
                <div className="text-right">
                  <Button
                    aria-label={`Editar ${item.name}`}
                    className="h-8 px-3 text-xs"
                    icon="pencil"
                    variant="secondary"
                    onClick={() => onEdit(item)}
                  >
                    Editar
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
