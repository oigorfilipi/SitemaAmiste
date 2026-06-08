import AppIcon from "../atoms/AppIcon.jsx";

const TONE_STYLES = {
  clientes: {
    card: "border-cyan-200/80 bg-cyan-50/70 text-cyan-900 hover:border-cyan-500 hover:bg-cyan-600 hover:text-white",
    icon: "bg-cyan-100 text-cyan-700 group-hover:bg-white/20 group-hover:text-white",
  },
  configuracoes: {
    card: "border-zinc-200 bg-zinc-50/80 text-zinc-900 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white",
    icon: "bg-zinc-200/80 text-zinc-700 group-hover:bg-white/20 group-hover:text-white",
  },
  etiquetas: {
    card: "border-amber-200/80 bg-amber-50/70 text-amber-950 hover:border-amber-500 hover:bg-amber-500 hover:text-white",
    icon: "bg-amber-100 text-amber-700 group-hover:bg-white/20 group-hover:text-white",
  },
  financeiro: {
    card: "border-emerald-200/80 bg-emerald-50/70 text-emerald-950 hover:border-emerald-500 hover:bg-emerald-600 hover:text-white",
    icon: "bg-emerald-100 text-emerald-700 group-hover:bg-white/20 group-hover:text-white",
  },
  opcoes: {
    card: "border-indigo-200/80 bg-indigo-50/70 text-indigo-950 hover:border-indigo-500 hover:bg-indigo-600 hover:text-white",
    icon: "bg-indigo-100 text-indigo-700 group-hover:bg-white/20 group-hover:text-white",
  },
  receitas: {
    card: "border-lime-200/80 bg-lime-50/70 text-lime-950 hover:border-lime-500 hover:bg-lime-600 hover:text-white",
    icon: "bg-lime-100 text-lime-700 group-hover:bg-white/20 group-hover:text-white",
  },
  wiki: {
    card: "border-violet-200/80 bg-violet-50/70 text-violet-950 hover:border-violet-500 hover:bg-violet-600 hover:text-white",
    icon: "bg-violet-100 text-violet-700 group-hover:bg-white/20 group-hover:text-white",
  },
};

const DEFAULT_TONE = {
  card: "border-red-200/80 bg-red-50/70 text-red-950 hover:border-amiste-red hover:bg-amiste-red hover:text-white",
  icon: "bg-red-100 text-amiste-red group-hover:bg-white/20 group-hover:text-white",
};

export default function QuickAccessCard({ item, onSelect }) {
  const tone = TONE_STYLES[item.id] || TONE_STYLES[item.pageId] || DEFAULT_TONE;

  return (
    <button
      className={`group flex min-h-[8.25rem] flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-amiste-soft active:translate-y-0 ${tone.card}`}
      type="button"
      onClick={() => onSelect(item.pageId)}
    >
      <span className={`grid size-10 place-items-center rounded-xl transition ${tone.icon}`}>
        <AppIcon name={item.icon} size={21} />
      </span>
      <span className="flex items-center justify-between gap-3">
        <strong className="font-display text-[13px] font-black leading-tight">{item.label}</strong>
        <AppIcon
          name="chevronRight"
          size={17}
          className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
        />
      </span>
    </button>
  );
}
