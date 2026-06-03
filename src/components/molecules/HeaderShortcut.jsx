import { cn } from "../../utils/cn.js";

export default function HeaderShortcut({ item, active, onSelect }) {
  return (
    <button
      className={cn(
        "relative h-14 px-2 text-sm font-bold transition hover:text-amiste-red",
        active ? "text-amiste-red" : "text-amiste-gray"
      )}
      type="button"
      onClick={() => onSelect(item.id)}
    >
      {item.label}
      {active ? <span className="absolute bottom-0 left-2 right-2 h-1 rounded-t bg-amiste-red" /> : null}
    </button>
  );
}
