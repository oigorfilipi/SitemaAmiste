import AppIcon from "../atoms/AppIcon.jsx";
import IconButton from "../atoms/IconButton.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";
import { cn } from "../../utils/cn.js";

function resolveFormatIcon(format) {
  const normalizedFormat = String(format || "").toLowerCase();

  if (normalizedFormat.includes("excel") || normalizedFormat.includes("csv")) return "fileSpreadsheet";
  if (["png", "jpg", "jpeg", "webp", "svg"].includes(normalizedFormat)) return "fileImage";

  return "fileText";
}

export default function LabelRepositoryGrid({
  canDelete,
  canDownload = true,
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
    <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {labels.map((label) => (
        <article
          className={cn(
            "cursor-pointer rounded-2xl border bg-white p-3.5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-amiste-red/50 hover:shadow-amiste-soft",
            selectedId === label.id ? "border-amiste-red ring-2 ring-amiste-red/15" : "border-zinc-200"
          )}
          key={label.id}
          onClick={() => onPreview(label)}
        >
          {/* --- SECAO: IDENTIDADE DO ARQUIVO --- */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-amiste-red/15 bg-amiste-red/10 text-amiste-red">
                <AppIcon name={resolveFormatIcon(label.format)} size={19} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-display text-[15px] font-black text-amiste-black">{label.name}</h2>
                <p className="mt-1 truncate text-xs font-semibold text-amiste-gray/60">{label.originalFileName}</p>
              </div>
            </div>
            <StatusPill label={label.format} status={label.hasFile ? "ativo" : "pendente"} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-2">
              <span className="block font-black uppercase text-amiste-gray/50">Categoria</span>
              <strong className="mt-1 block truncate text-amiste-black">{label.category || "-"}</strong>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-2">
              <span className="block font-black uppercase text-amiste-gray/50">Tamanho</span>
              <strong className="mt-1 block text-amiste-black">{label.fileSizeLabel}</strong>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-2">
              <span className="block font-black uppercase text-amiste-gray/50">Tipo</span>
              <strong className="mt-1 block text-amiste-black">{label.format}</strong>
            </div>
          </div>

          {label.description ? (
            <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-amiste-gray/70">{label.description}</p>
          ) : null}

          <footer className="mt-3 flex min-h-9 justify-end gap-2 border-t border-zinc-100 pt-3" onClick={(event) => event.stopPropagation()}>
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
