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
  const bodyHeight = size === "fullscreen" ? "max-h-[calc(94vh-88px)]" : "max-h-[calc(88vh-88px)]";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-amiste-black/40 p-6 backdrop-blur-sm">
      <section className={`${maxHeight} w-full ${maxWidth} overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl`}>
        {/* --- SECAO: CABECALHO DO MODAL --- */}
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-black text-amiste-black">{title}</h2>
            {description ? <p className="mt-1 text-sm italic text-amiste-gray/65">{description}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            <IconButton icon="x" label="Fechar" onClick={onClose} />
          </div>
        </header>

        <div className={cn(`${bodyHeight} overflow-y-auto p-6`, bodyClassName)}>{children}</div>
      </section>
    </div>
  );
}
