import AppIcon from "../atoms/AppIcon.jsx";
import { cn } from "../../utils/cn.js";

export default function HeaderShortcut({ item, active, onSelect }) {
  return (
    <button
      className={cn(
        "group flex h-9 items-center gap-2 rounded-xl border px-3 text-[12px] font-black transition duration-200",
        active
          ? "border-amiste-red/25 bg-amiste-red/10 text-amiste-red shadow-sm"
          : "border-transparent text-amiste-gray hover:border-zinc-200 hover:bg-zinc-50 hover:text-amiste-red"
      )}
      type="button"
      onClick={() => onSelect(item.id)}
    >
      {item.icon ? (
        <AppIcon name={item.icon} size={15} className={active ? "text-amiste-red" : "text-amiste-gray/70 group-hover:text-amiste-red"} />
      ) : null}
      {item.label}
    </button>
  );
}
