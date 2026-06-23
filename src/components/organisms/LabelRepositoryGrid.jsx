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
  canEdit = false,
  canPrint = true,
  labels,
  selectedId,
  onDelete,
  onDownload,
  onEdit,
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
    <section className="flex flex-wrap items-start gap-3">
      {labels.map((label) => (
        <article
          className={cn(
            "h-fit w-full cursor-pointer rounded-2xl border bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-amiste-red/50 hover:shadow-amiste-soft sm:w-fit sm:min-w-[360px] sm:max-w-[540px]",
            selectedId === label.id ? "border-amiste-red ring-2 ring-amiste-red/15" : "border-zinc-200"
          )}
          key={label.id}
          onClick={() => onPreview(label)}
        >
          {/* --- SECAO: IDENTIDADE DO ARQUIVO --- */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-amiste-red/15 bg-amiste-red/10 text-amiste-red">
                <AppIcon name={resolveFormatIcon(label.format)} size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-display text-[15px] font-black text-amiste-black">{label.name}</h2>
                <p className="mt-1 truncate text-xs font-semibold text-amiste-gray/60">{label.originalFileName}</p>
              </div>
            </div>
            <StatusPill label={label.format} status={label.hasFile ? "ativo" : "pendente"} />
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-xs">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-1.5">
              <span className="block font-black uppercase text-amiste-gray/50">Categoria</span>
              <strong className="mt-1 block truncate text-amiste-black">{label.category || "-"}</strong>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-1.5">
              <span className="block font-black uppercase text-amiste-gray/50">Tamanho</span>
              <strong className="mt-1 block text-amiste-black">{label.fileSizeLabel}</strong>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-1.5">
              <span className="block font-black uppercase text-amiste-gray/50">Tipo</span>
              <strong className="mt-1 block text-amiste-black">{label.format}</strong>
            </div>
          </div>

          {label.description ? (
            <p className="mt-2 overflow-hidden whitespace-normal break-words text-xs font-semibold leading-5 text-amiste-gray/70 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
              {label.description}
            </p>
          ) : null}

          {label.hasFile && !label.canPrint ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] font-bold leading-4 text-amber-800">
              Impressao direta indisponivel. Baixe para imprimir no app adequado.
            </p>
          ) : null}

          <footer className="mt-2 flex min-h-8 justify-end gap-1.5 border-t border-zinc-100 pt-2" onClick={(event) => event.stopPropagation()}>
            {canEdit ? (
              <IconButton icon="pencil" label={`Editar ${label.name}`} onClick={() => onEdit(label)} />
            ) : null}
            <IconButton
              disabled={!canDownload || !label.hasFile}
              icon="download"
              label={`Baixar ${label.name}`}
              onClick={() => onDownload(label)}
            />
            <IconButton
              disabled={!canPrint || !label.canPrint}
              icon="printer"
              label={label.canPrint
                ? `Imprimir ${label.name}`
                : `Impressao direta indisponivel para ${label.format}. Baixe o arquivo para imprimir.`
              }
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
