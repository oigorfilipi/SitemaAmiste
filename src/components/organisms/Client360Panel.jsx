import AppIcon from "../atoms/AppIcon.jsx";
import StatusPill from "../atoms/StatusPill.jsx";
import { buildClientTimeline } from "../../services/clientService.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

const TONE_STYLES = {
  blue: "bg-amiste-blue/10 text-amiste-blue",
  green: "bg-amiste-green/10 text-amiste-green",
  red: "bg-amiste-red/10 text-amiste-red",
  yellow: "bg-amiste-yellow/45 text-yellow-900",
};

function StatBlock({ label, value }) {
  return (
    <div className="rounded-md bg-zinc-50 p-3">
      <span className="text-xs font-black uppercase text-amiste-gray/55">{label}</span>
      <strong className="mt-1 block text-lg font-black text-amiste-black">{value}</strong>
    </div>
  );
}

export default function Client360Panel({ client }) {
  if (!client) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid min-h-80 place-items-center text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-md bg-zinc-100 text-zinc-400">
              <AppIcon name="users" size={22} />
            </span>
            <strong className="mt-4 block font-display text-lg font-black text-amiste-black">Selecione um cliente</strong>
            <p className="mt-2 text-sm text-amiste-gray/70">O painel 360 mostra contrato, maquina e relacoes operacionais.</p>
          </div>
        </div>
      </section>
    );
  }

  const timeline = buildClientTimeline(client);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-amiste-gray/55">Cliente 360</p>
          <h2 className="mt-1 truncate font-display text-2xl font-black text-amiste-black">{client.name}</h2>
          <span className="mt-1 block truncate text-sm font-semibold text-amiste-gray/65">{client.contact || "Sem contato"} | {client.phone || "Sem telefone"}</span>
        </div>
        <StatusPill status={client.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <StatBlock label="Contrato" value={client.contractType || "-"} />
        <StatBlock label="Valor" value={formatCurrency(client.contractValue)} />
        <StatBlock label="Maquina" value={client.machineName} />
        <StatBlock label="A receber" value={formatCurrency(client.openReceivablesValue)} />
      </div>

      <div className="mt-5 rounded-md border border-zinc-200 p-4">
        <span className="text-xs font-black uppercase text-amiste-gray/55">Proxima acao</span>
        <strong className="mt-2 block text-lg font-black text-amiste-black">{client.nextAction}</strong>
        <p className="mt-2 text-sm leading-6 text-amiste-gray/70">{client.address || "Endereco nao informado."}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatBlock label="Checklists" value={client.checklistsCount} />
        <StatBlock label="Propostas" value={client.proposalsCount} />
        <StatBlock label="Fichas" value={client.serviceSheetsCount} />
      </div>

      <div className="mt-5">
        <p className="text-xs font-black uppercase text-amiste-gray/55">Linha do tempo</p>
        {timeline.length ? (
          <div className="mt-3 divide-y divide-zinc-100">
            {timeline.map((item) => (
              <div className="flex items-start gap-3 py-3" key={item.id}>
                <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-md ${TONE_STYLES[item.tone] || TONE_STYLES.blue}`}>
                  <AppIcon name="fileClock" size={16} />
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black text-amiste-black">{item.label}</strong>
                  <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">{item.date} | {item.meta}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="mt-3 block text-sm text-amiste-gray/70">Nenhuma movimentacao ligada a este cliente.</span>
        )}
      </div>
    </section>
  );
}
