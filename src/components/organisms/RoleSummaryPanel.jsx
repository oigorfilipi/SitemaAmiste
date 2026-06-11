import AppIcon from "../atoms/AppIcon.jsx";
import StatusPill from "../atoms/StatusPill.jsx";

function accessStatus(access) {
  const statusByAccess = {
    AC: "concluido",
    OC: "cancelado",
    UP: "rascunho",
    VIS: "pendente",
  };

  return statusByAccess[access] || "automatico";
}

export default function RoleSummaryPanel({ summary }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition duration-300 hover:shadow-amiste-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amiste-gray/55">Perfil selecionado</p>
          <h2 className="mt-1 font-display text-xl font-black text-amiste-black">{summary.label}</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-amiste-blue/10 text-amiste-blue">
          <AppIcon name="shield" size={20} />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
          <span className="text-xs font-black uppercase text-amiste-gray/55">Completo</span>
          <strong className="mt-1 block text-xl font-black text-amiste-black">{summary.accessFullCount}</strong>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
          <span className="text-xs font-black uppercase text-amiste-gray/55">Oculto</span>
          <strong className="mt-1 block text-xl font-black text-amiste-black">{summary.accessHiddenCount}</strong>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
          <span className="text-xs font-black uppercase text-amiste-gray/55">Visualizacao</span>
          <strong className="mt-1 block text-xl font-black text-amiste-black">{summary.accessViewCount}</strong>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
          <span className="text-xs font-black uppercase text-amiste-gray/55">Parcial</span>
          <strong className="mt-1 block text-xl font-black text-amiste-black">{summary.accessPartialCount}</strong>
        </div>
      </div>

      <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
        {summary.modules.map((module) => (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2" key={module.pageId}>
            <span className="truncate text-sm font-bold text-amiste-black">{module.pageLabel}</span>
            <StatusPill
              className="h-6 px-2 text-[10px]"
              label={module.access}
              status={accessStatus(module.access)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
