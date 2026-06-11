import AppIcon from "../atoms/AppIcon.jsx";
import StatusPill from "../atoms/StatusPill.jsx";

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
      <span className="text-xs font-black uppercase text-amiste-gray/55">{label}</span>
      <strong className="mt-1 block break-words text-sm font-black text-amiste-black">{value || "-"}</strong>
    </div>
  );
}

function actionStatus(action) {
  const statusByAction = {
    Criou: "concluido",
    Editou: "rascunho",
    Excluiu: "cancelado",
    Baixa: "pago",
    Finalizou: "finalizado",
    Contagem: "pendente",
    Precificacao: "pendente",
  };

  return statusByAction[action] || "automatico";
}

export default function AuditDetailPanel({ entry }) {
  if (!entry) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid min-h-80 place-items-center text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-400">
              <AppIcon name="history" size={22} />
            </span>
            <strong className="mt-4 block font-display text-lg font-black text-amiste-black">Selecione um evento</strong>
            <p className="mt-2 text-sm text-amiste-gray/70">O detalhe mostra modulo, acao, ator e observacoes gravadas.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-amiste-gray/55">Evento selecionado</p>
          <h2 className="mt-1 break-words font-display text-2xl font-black text-amiste-black">{entry.title}</h2>
        </div>
        <StatusPill label={entry.action} status={actionStatus(entry.action)} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailRow label="Modulo" value={entry.module} />
        <DetailRow label="Cargo" value={entry.role} />
        <DetailRow label="Usuario" value={entry.userName} />
        <DetailRow label="Data" value={`${entry.dateLabel} ${entry.timeLabel}`} />
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
        <span className="text-xs font-black uppercase text-amiste-gray/55">Detalhes</span>
        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-amiste-black">
          {entry.details || "Nenhum detalhe adicional foi gravado para este evento."}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-200 p-4">
        <span className="text-xs font-black uppercase text-amiste-gray/55">ID do evento</span>
        <code className="mt-2 block break-all rounded-xl bg-amiste-black px-3 py-2 text-xs font-bold text-white">
          {entry.id}
        </code>
      </div>
    </section>
  );
}
