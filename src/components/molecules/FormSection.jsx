export default function FormSection({ children, eyebrow, title }) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4">
      {/* --- SECAO: TITULO DO BLOCO --- */}
      <header className="mb-4">
        {eyebrow ? <span className="text-xs font-black uppercase text-amiste-red">{eyebrow}</span> : null}
        <h3 className="mt-1 font-display text-lg font-black text-amiste-black">{title}</h3>
      </header>

      <div className="space-y-4">{children}</div>
    </section>
  );
}
