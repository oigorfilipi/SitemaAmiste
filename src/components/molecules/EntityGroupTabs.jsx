import { cn } from "../../utils/cn.js";

export default function EntityGroupTabs({ activeGroup, groups, onSelectGroup }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm">
      {groups.map((group) => (
        <button
          className={cn(
            "inline-flex h-8 items-center justify-center rounded-xl px-3 text-xs font-black transition duration-200",
            activeGroup === group.id
              ? "bg-amiste-red text-white shadow-sm"
              : "text-amiste-gray hover:bg-amiste-red/10 hover:text-amiste-red"
          )}
          key={group.id}
          type="button"
          onClick={() => onSelectGroup(group.id)}
        >
          {group.label}
        </button>
      ))}
    </div>
  );
}
