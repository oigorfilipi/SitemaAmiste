import AppIcon from "../atoms/AppIcon.jsx";

export default function FormSection({ children, eyebrow, icon = "layoutGrid", title }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* --- SECAO: TITULO DO BLOCO --- */}
      <header className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-amiste-red/15 bg-amiste-red/7 text-amiste-red">
          <AppIcon name={icon} size={16} />
        </span>
        <div className="min-w-0">
          {eyebrow ? <span className="block text-[10px] font-black uppercase tracking-wide text-amiste-red">{eyebrow}</span> : null}
          <h3 className="truncate font-display text-sm font-black text-amiste-black">{title}</h3>
        </div>
      </header>

      <div className="space-y-3 p-4">{children}</div>
    </section>
  );
}
