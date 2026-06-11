import Button from "../atoms/Button.jsx";
import IconButton from "../atoms/IconButton.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";
import { cn } from "../../utils/cn.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

export default function ClientPortfolioTable({
  canDelete = false,
  canEdit = false,
  canMutate,
  rows,
  selectedClientId,
  onDelete,
  onEdit,
  onSelect,
}) {
  if (!rows.length) {
    return (
      <TableEmptyState
        description="Nenhum cliente atende ao filtro atual."
        icon="users"
        title="Sem clientes"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[1060px]">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_145px_150px_155px_120px] gap-4 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 text-xs font-black uppercase text-amiste-gray/60">
            <span>Cliente</span>
            <span>Contato</span>
            <span>Contrato</span>
            <span>Maquina</span>
            <span>A receber</span>
            <span>Proxima acao</span>
            <span className="text-right">Acoes</span>
          </div>

          {rows.map((client) => (
            <div
              className={cn(
                "grid w-full cursor-pointer grid-cols-[1.3fr_1fr_1fr_145px_150px_155px_120px] items-center gap-4 border-b border-zinc-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-amiste-red/5",
                selectedClientId === client.id ? "bg-amiste-red/5" : ""
              )}
              key={client.id}
              onClick={() => onSelect(client)}
            >
              <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-amiste-black">{client.name}</strong>
                <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/55">{client.email || "Sem email"}</span>
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-sm font-bold text-amiste-black">{client.contact || "-"}</strong>
                <span className="mt-1 block truncate text-xs font-semibold text-amiste-gray/55">{client.phone || "-"}</span>
              </div>
              <div>
                <span className="block text-sm font-black text-amiste-black">{client.contractType || "-"}</span>
                <span className="mt-1 block text-xs font-semibold text-amiste-gray/55">{formatCurrency(client.contractValue)}</span>
              </div>
              <span className="truncate text-sm font-bold text-amiste-gray">{client.machineName}</span>
              <span className={client.openReceivablesValue ? "text-sm font-black text-amiste-red" : "text-sm font-black text-amiste-green"}>
                {formatCurrency(client.openReceivablesValue)}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <StatusPill
                  className="max-w-full truncate"
                  label={client.nextAction}
                  status={client.nextAction === "Sem pendencia" ? "concluido" : "pendente"}
                />
              </div>
              <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                <Button className="h-8 w-[58px] px-3 text-xs" icon="fileText" variant="secondary" onClick={() => onSelect(client)}>
                  360
                </Button>
                {canMutate ? (
                  <>
                    {canEdit ? (
                      <IconButton icon="pencil" label={`Editar ${client.name}`} onClick={() => onEdit(client)} />
                    ) : null}
                    {canDelete ? (
                      <IconButton icon="trash" label={`Excluir ${client.name}`} onClick={() => onDelete(client)} />
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
