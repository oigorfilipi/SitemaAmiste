import AppIcon from "../atoms/AppIcon.jsx";
import { cn } from "../../utils/cn.js";

export default function OptionGroupList({ activeGroup, areaLabel, groups, onSelectGroup }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Listas da area</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">{areaLabel || "Grupos"}</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-amiste-blue/10 text-amiste-blue">
          <AppIcon name="layoutGrid" size={20} />
        </span>
      </div>

      <div className="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1">
        {groups.length ? groups.map((group) => (
          <button
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition duration-200",
              activeGroup === group.id
                ? "border-amiste-red bg-amiste-red text-white"
                : "border-zinc-200 bg-zinc-50 text-amiste-black hover:-translate-y-px hover:border-amiste-red/40 hover:bg-white"
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
            <span className={activeGroup === group.id ? "rounded-xl bg-white/20 px-2 py-1 text-xs font-black" : "rounded-xl bg-white px-2 py-1 text-xs font-black text-amiste-gray"}>
              {group.empty ? "Vazio" : group.count}
            </span>
          </button>
        )) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-5 text-sm font-bold text-amiste-gray/60">
            Nenhum grupo encontrado nesta area.
          </div>
        )}
      </div>
    </section>
  );
}
