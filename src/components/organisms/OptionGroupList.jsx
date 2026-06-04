import AppIcon from "../atoms/AppIcon.jsx";
import { cn } from "../../utils/cn.js";

export default function OptionGroupList({ activeGroup, groups, onSelectGroup }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Listas do sistema</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Grupos</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-md bg-amiste-blue/10 text-amiste-blue">
          <AppIcon name="layoutGrid" size={20} />
        </span>
      </div>

      <div className="mt-4 max-h-[640px] space-y-2 overflow-y-auto pr-1">
        {groups.map((group) => (
          <button
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-3 text-left transition",
              activeGroup === group.id
                ? "border-amiste-red bg-amiste-red text-white"
                : "border-zinc-200 bg-zinc-50 text-amiste-black hover:border-amiste-red hover:bg-white"
            )}
            key={group.id}
            type="button"
            onClick={() => onSelectGroup(group.id)}
          >
            <span className="min-w-0">
              <strong className="block truncate text-sm font-black">{group.label}</strong>
              <span className={activeGroup === group.id ? "text-xs font-semibold text-white/70" : "text-xs font-semibold text-amiste-gray/60"}>
                {group.count} opcao(oes)
              </span>
              <span className={activeGroup === group.id ? "mt-1 line-clamp-2 text-xs font-semibold text-white/70" : "mt-1 line-clamp-2 text-xs font-semibold text-amiste-gray/55"}>
                {group.description}
              </span>
            </span>
            <span className={activeGroup === group.id ? "rounded-md bg-white/18 px-2 py-1 text-xs font-black" : "rounded-md bg-white px-2 py-1 text-xs font-black text-amiste-gray"}>
              {group.empty ? "Vazio" : group.count}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
