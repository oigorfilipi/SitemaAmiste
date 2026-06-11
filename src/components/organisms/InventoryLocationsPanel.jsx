import AppIcon from "../atoms/AppIcon.jsx";
import Button from "../atoms/Button.jsx";
import IconButton from "../atoms/IconButton.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

export default function InventoryLocationsPanel({
  canCreate = false,
  canDelete = false,
  canEdit = false,
  locations,
  onCreate,
  onDelete,
  onEdit,
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Organizacao por local</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Estoques separados</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-amiste-gray/65">
            Cadastre estoques auxiliares para controlar produtos que ficam em outra cidade, cliente ou operacao sem alterar o estoque principal.
          </p>
        </div>
        {canCreate ? (
          <Button className="shrink-0" icon="plus" onClick={onCreate}>
            Novo estoque
          </Button>
        ) : null}
      </header>

      <div className="mt-4">
        {locations.length ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {locations.map((location) => (
              <article
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-amiste-red/30 hover:shadow-amiste-soft"
                key={location.id}
              >
                <div className="flex items-start justify-between gap-3 border-b border-zinc-200 bg-white p-4">
                  <div className="min-w-0">
                    <strong className="block truncate font-display text-base font-black text-amiste-black">
                      {location.name}
                    </strong>
                    <span className="mt-1 block truncate text-xs font-bold text-amiste-gray/60">
                      {location.machineQuantity} maquina(s) | {location.machineName}
                    </span>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amiste-red/10 text-amiste-red">
                    <AppIcon name="boxes" size={19} />
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <span className="block text-[10px] font-black uppercase text-amiste-gray/50">Produtos</span>
                      <strong className="mt-1 block text-lg font-black text-amiste-black">{location.productCount}</strong>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <span className="block text-[10px] font-black uppercase text-amiste-gray/50">Unidades</span>
                      <strong className="mt-1 block text-lg font-black text-amiste-black">{location.totalProductQuantity}</strong>
                    </div>
                  </div>

                  <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                    {location.products.map((product) => (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2" key={`${product.productCollection}-${product.productId}`}>
                        <span className="min-w-0">
                          <strong className="block truncate text-sm font-black text-amiste-black">{product.productName}</strong>
                          <span className="block text-xs font-semibold text-amiste-gray/55">{product.productType}</span>
                        </span>
                        <strong className="shrink-0 text-sm font-black text-amiste-red">{product.quantity}</strong>
                      </div>
                    ))}
                  </div>

                  {location.notes ? (
                    <p className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-amiste-gray/70">
                      {location.notes}
                    </p>
                  ) : null}

                  {canEdit || canDelete ? (
                    <footer className="flex justify-end gap-2 border-t border-zinc-200 pt-3">
                      {canEdit ? <IconButton icon="pencil" label={`Editar ${location.name}`} onClick={() => onEdit(location)} /> : null}
                      {canDelete ? <IconButton icon="trash" label={`Excluir ${location.name}`} onClick={() => onDelete(location)} /> : null}
                    </footer>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <TableEmptyState
            description="Use o botao Novo estoque para registrar uma operacao externa, outra cidade ou ponto de consumo separado."
            icon="boxes"
            title="Nenhum estoque separado cadastrado"
          />
        )}
      </div>
    </section>
  );
}
