import AppIcon from "../atoms/AppIcon.jsx";

export default function QuickAccessCard({ item, onSelect }) {
  return (
    <button
      className="group flex aspect-square flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-amiste-red hover:bg-amiste-red hover:text-white hover:shadow-amiste"
      type="button"
      onClick={() => onSelect(item.pageId)}
    >
      <span className="grid size-11 place-items-center rounded-md bg-amiste-red/10 text-amiste-red transition group-hover:bg-white/15 group-hover:text-white">
        <AppIcon name={item.icon} size={21} />
      </span>
      <span className="flex items-center justify-between gap-3">
        <strong className="text-sm font-black">{item.label}</strong>
        <AppIcon
          name="chevronRight"
          size={18}
          className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
        />
      </span>
    </button>
  );
}
