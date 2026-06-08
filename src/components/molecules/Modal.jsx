import IconButton from "../atoms/IconButton.jsx";
import { cn } from "../../utils/cn.js";

export default function Modal({
  title,
  description,
  open,
  children,
  bodyClassName = "",
  headerActions = null,
  size = "default",
  onClose,
}) {
  if (!open) {
    return null;
  }

  const maxWidth = {
    default: "max-w-3xl",
    fullscreen: "max-w-[min(1560px,96vw)]",
    wide: "max-w-6xl",
  }[size] || "max-w-3xl";
  const maxHeight = size === "fullscreen" ? "max-h-[94vh]" : "max-h-[88vh]";
  const bodyHeight = size === "fullscreen" ? "max-h-[calc(94vh-76px)]" : "max-h-[calc(88vh-76px)]";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-amiste-black/45 p-4 backdrop-blur-md">
      <section className={`${maxHeight} animate-amiste-in w-full ${maxWidth} overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl`}>
        {/* --- SECAO: CABECALHO DO MODAL --- */}
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 bg-white/95 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-black text-amiste-black">{title}</h2>
            {description ? <p className="mt-1 max-w-3xl text-xs font-semibold text-amiste-gray/60">{description}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            <IconButton icon="x" label="Fechar" onClick={onClose} />
          </div>
        </header>

        <div className={cn(`${bodyHeight} overflow-y-auto bg-zinc-50/55 p-5`, bodyClassName)}>{children}</div>
      </section>
    </div>
  );
}
