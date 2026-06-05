import Button from "../atoms/Button.jsx";
import IconButton from "../atoms/IconButton.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

export default function ChecklistOperationsTable({
  canFinalize = false,
  canMutate,
  rows,
  onDetails,
  onEdit,
  onFinalize,
}) {
  if (!rows.length) {
    return (
      <TableEmptyState
        description="Nenhum checklist atende ao filtro selecionado."
        icon="checkSquare"
        title="Sem checklists"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[1080px]">
          <div className="grid grid-cols-[100px_1fr_1fr_130px_125px_150px_135px_145px] gap-4 border-b border-zinc-100 px-4 py-3 text-xs font-black uppercase text-amiste-gray/60">
            <span>N.</span>
            <span>Cliente</span>
            <span>Maquina</span>
            <span>Tecnico</span>
            <span>Data</span>
            <span>Compatibilidade</span>
            <span>Valor</span>
            <span className="text-right">Acoes</span>
          </div>

          {rows.map((row) => (
            <div
              className="grid grid-cols-[100px_1fr_1fr_130px_125px_150px_135px_145px] items-center gap-4 border-b border-zinc-100 px-4 py-4 last:border-b-0"
              key={row.id}
            >
              <div>
                <strong className="block text-sm font-black text-amiste-black">{row.code}</strong>
                <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">{row.serviceType}</span>
              </div>
              <span className="truncate text-sm font-black text-amiste-black">{row.clientName}</span>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-amiste-black">{row.machineName}</strong>
                <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">
                  {row.outletAmperage || 0}A | agua {row.waterOk || "-"}
                </span>
              </div>
              <span className="truncate text-sm text-amiste-gray">{row.technician || "-"}</span>
              <span className="text-sm font-bold text-amiste-black">{row.date}</span>
              <StatusPill
                label={row.compatibilityLabel}
                status={row.compatible ? "concluido" : "quebra"}
              />
              <span className="text-sm font-black text-amiste-green">{formatCurrency(row.value)}</span>
              <div className="flex justify-end gap-2">
                <IconButton icon="fileText" label={`Detalhes ${row.code}`} onClick={() => onDetails(row)} />
                {canMutate ? (
                  <IconButton icon="pencil" label={`Editar ${row.code}`} onClick={() => onEdit(row)} />
                ) : null}
                {canFinalize && row.status !== "finalizado" ? (
                  <Button
                    aria-label={`Finalizar ${row.code}`}
                    className="h-8 px-3 text-xs"
                    icon="checkSquare"
                    variant="success"
                    onClick={() => onFinalize(row)}
                  >
                    Finalizar
                  </Button>
                ) : (
                  <StatusPill status={row.status} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
