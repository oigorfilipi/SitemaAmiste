import IconButton from "../atoms/IconButton.jsx";

export default function Modal({ title, description, open, children, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-amiste-black/40 p-6 backdrop-blur-sm">
      <section className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl">
        {/* --- SECAO: CABECALHO DO MODAL --- */}
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-black text-amiste-black">{title}</h2>
            {description ? <p className="mt-1 text-sm italic text-amiste-gray/65">{description}</p> : null}
          </div>
          <IconButton icon="x" label="Fechar" onClick={onClose} />
        </header>

        <div className="max-h-[calc(88vh-88px)] overflow-y-auto p-6">{children}</div>
      </section>
    </div>
  );
}
