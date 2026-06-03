import IconButton from "../atoms/IconButton.jsx";
import LabelArtwork from "../molecules/LabelArtwork.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";

export default function LabelRepositoryGrid({
  canMutate,
  labels,
  onDelete,
  onDownload,
  onEdit,
  onPreview,
}) {
  if (!labels.length) {
    return (
      <TableEmptyState
        description="Cadastre layouts para liberar preview e download."
        icon="tags"
        title="Nenhuma etiqueta cadastrada"
      />
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {labels.map((label) => (
        <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" key={label.id}>
          <LabelArtwork compact label={label} />

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-black text-amiste-black">{label.name}</h2>
              <p className="mt-1 truncate text-sm font-semibold text-amiste-gray/65">
                {label.category} | {label.format} | {label.linkedName}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <IconButton icon="fileText" label={`Visualizar ${label.name}`} onClick={() => onPreview(label)} />
              <IconButton icon="download" label={`Baixar ${label.name}`} onClick={() => onDownload(label)} />
              {canMutate ? (
                <>
                  <IconButton icon="pencil" label={`Editar ${label.name}`} onClick={() => onEdit(label)} />
                  <IconButton icon="trash" label={`Excluir ${label.name}`} onClick={() => onDelete(label)} />
                </>
              ) : null}
            </div>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-amiste-gray/75">{label.description}</p>
        </article>
      ))}
    </section>
  );
}
