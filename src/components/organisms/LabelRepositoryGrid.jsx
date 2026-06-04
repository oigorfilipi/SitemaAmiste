import IconButton from "../atoms/IconButton.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";
import { cn } from "../../utils/cn.js";

export default function LabelRepositoryGrid({
  canDelete,
  canDownload = true,
  canMutate,
  canPrint = true,
  labels,
  selectedId,
  onDelete,
  onDownload,
  onPreview,
  onPrint,
}) {
  if (!labels.length) {
    return (
      <TableEmptyState
        description="Envie arquivos externos para montar o repositorio de etiquetas."
        icon="tags"
        title="Nenhum arquivo de etiqueta"
      />
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {labels.map((label) => (
        <article
          className={cn(
            "cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amiste-red hover:shadow-amiste",
            selectedId === label.id ? "border-amiste-red ring-2 ring-amiste-red/15" : "border-zinc-200"
          )}
          key={label.id}
          onClick={() => onPreview(label)}
        >
          {/* --- SECAO: IDENTIDADE DO ARQUIVO --- */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-black text-amiste-black">{label.name}</h2>
              <p className="mt-1 truncate text-sm font-semibold text-amiste-gray/65">{label.originalFileName}</p>
            </div>
            <StatusPill label={label.format} status={label.hasFile ? "ativo" : "pendente"} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md bg-zinc-50 p-2">
              <span className="block font-black uppercase text-amiste-gray/45">Categoria</span>
              <strong className="mt-1 block truncate text-amiste-black">{label.category || "-"}</strong>
            </div>
            <div className="rounded-md bg-zinc-50 p-2">
              <span className="block font-black uppercase text-amiste-gray/45">Tamanho</span>
              <strong className="mt-1 block text-amiste-black">{label.fileSizeLabel}</strong>
            </div>
            <div className="rounded-md bg-zinc-50 p-2">
              <span className="block font-black uppercase text-amiste-gray/45">Tipo</span>
              <strong className="mt-1 block text-amiste-black">{label.format}</strong>
            </div>
          </div>

          {label.description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-amiste-gray/75">{label.description}</p>
          ) : null}

          <footer className="mt-4 flex justify-end gap-2 border-t border-zinc-100 pt-4" onClick={(event) => event.stopPropagation()}>
            <IconButton icon="fileText" label={`Visualizar ${label.name}`} onClick={() => onPreview(label)} />
            <IconButton
              disabled={!canDownload || !label.hasFile}
              icon="download"
              label={`Baixar ${label.name}`}
              onClick={() => onDownload(label)}
            />
            <IconButton
              disabled={!canPrint || !label.canPrint}
              icon="printer"
              label={`Imprimir ${label.name}`}
              onClick={() => onPrint(label)}
            />
            {canDelete ? (
              <IconButton icon="trash" label={`Excluir ${label.name}`} onClick={() => onDelete(label)} />
            ) : null}
          </footer>
        </article>
      ))}
    </section>
  );
}
