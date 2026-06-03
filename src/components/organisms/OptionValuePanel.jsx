import Button from "../atoms/Button.jsx";
import IconButton from "../atoms/IconButton.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

export default function OptionValuePanel({
  canMutate,
  group,
  onCreate,
  onDelete,
  onEdit,
}) {
  if (!group) {
    return (
      <TableEmptyState
        description="Selecione um grupo para visualizar as opcoes."
        icon="layoutGrid"
        title="Nenhum grupo selecionado"
      />
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Grupo selecionado</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">{group.label}</h2>
          <span className="mt-1 block text-sm font-semibold text-amiste-gray/60">
            {group.count} valor(es) disponiveis para dropdowns.
          </span>
        </div>
        {canMutate ? (
          <Button aria-label={`Adicionar opcao em ${group.label}`} icon="plus" onClick={() => onCreate(group.id)}>
            Adicionar
          </Button>
        ) : null}
      </header>

      {group.options.length ? (
        <div className="divide-y divide-zinc-100">
          {group.options.map((option) => (
            <div className="grid grid-cols-[1fr_1fr_110px] items-center gap-4 px-5 py-4" key={option.id}>
              <div className="min-w-0">
                <span className="text-xs font-black uppercase text-amiste-gray/55">Nome</span>
                <strong className="mt-1 block truncate text-sm font-black text-amiste-black">{option.name}</strong>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black uppercase text-amiste-gray/55">Valor</span>
                <strong className="mt-1 block truncate text-sm font-bold text-amiste-gray">{option.value}</strong>
              </div>
              <div className="flex justify-end gap-2">
                {canMutate ? (
                  <>
                    <IconButton icon="pencil" label={`Editar ${option.name}`} onClick={() => onEdit(option)} />
                    <IconButton icon="trash" label={`Excluir ${option.name}`} onClick={() => onDelete(option)} />
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5">
          <TableEmptyState
            description="Cadastre valores para que este grupo apareca nos formularios."
            icon="plus"
            title="Grupo sem opcoes"
          />
        </div>
      )}
    </section>
  );
}
