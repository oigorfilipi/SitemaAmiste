import AppIcon from "../atoms/AppIcon.jsx";
import TableEmptyState from "../molecules/TableEmptyState.jsx";
import { cn } from "../../utils/cn.js";

const ACTION_TONES = {
  Atualizou: "bg-amiste-blue/10 text-amiste-blue",
  Baixa: "bg-amiste-green/10 text-amiste-green",
  "Baixa Checklist": "bg-amiste-green/10 text-amiste-green",
  Contagem: "bg-amiste-yellow/45 text-yellow-900",
  Criou: "bg-amiste-green/10 text-amiste-green",
  Editou: "bg-amiste-blue/10 text-amiste-blue",
  Excluiu: "bg-amiste-red/10 text-amiste-red",
  Finalizou: "bg-amiste-green/10 text-amiste-green",
  Inicializou: "bg-zinc-100 text-zinc-600",
  Precificacao: "bg-amiste-yellow/45 text-yellow-900",
};

export default function AuditTimeline({ rows, selectedId, onSelect }) {
  if (!rows.length) {
    return (
      <TableEmptyState
        description="Nenhum evento atende aos filtros atuais."
        icon="history"
        title="Sem eventos de auditoria"
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <header className="border-b border-zinc-100 px-5 py-4">
        <p className="text-xs font-black uppercase text-amiste-gray/55">Linha do tempo</p>
        <h2 className="mt-1 font-display text-xl font-black text-amiste-black">Eventos recentes</h2>
      </header>

      <div className="max-h-[720px] divide-y divide-zinc-100 overflow-y-auto">
        {rows.map((entry) => (
          <button
            className={cn(
              "flex w-full cursor-pointer items-start gap-4 px-5 py-4 text-left transition hover:bg-amiste-red/5",
              selectedId === entry.id ? "bg-amiste-red/5" : ""
            )}
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry)}
          >
            <span className={cn("mt-1 grid size-10 shrink-0 place-items-center rounded-xl", ACTION_TONES[entry.action] || "bg-zinc-100 text-zinc-600")}>
              <AppIcon name="history" size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <strong className="truncate text-sm font-black text-amiste-black">{entry.displayTitle || entry.title}</strong>
                <span className="shrink-0 text-xs font-black text-amiste-gray/55">{entry.timeLabel}</span>
              </span>
              <span className="mt-1 block truncate text-sm font-semibold text-amiste-gray/70">
                {entry.module} | {entry.action}
              </span>
              <span className="mt-2 block truncate text-xs font-semibold text-amiste-gray/55">
                {entry.userName} ({entry.role}) | {entry.dateLabel}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
