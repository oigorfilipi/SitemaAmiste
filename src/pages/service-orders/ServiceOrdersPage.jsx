import { useMemo, useState } from "react";
import Button from "../../components/atoms/Button.jsx";
import StatusPill from "../../components/atoms/StatusPill.jsx";
import EntityFormModal from "../../components/organisms/EntityFormModal.jsx";
import MetricCard from "../../components/molecules/MetricCard.jsx";
import Modal from "../../components/molecules/Modal.jsx";
import PageHeader from "../../components/molecules/PageHeader.jsx";
import { useCollection } from "../../hooks/useCollection.js";
import { useErpSnapshot } from "../../hooks/useErpSnapshot.js";
import {
  REPAIR_ORDER_STAGES,
  SLA_LIMIT_DAYS,
  buildInitialRepairOrderPayload,
  buildStageMovePayload,
  getRepairOrderSla,
  summarizeRepairOrders,
} from "../../services/repairOrderService.js";
import { getRolePermissions } from "../../services/permissionService.js";
import { cn } from "../../utils/cn.js";

const PRIORITY_LABELS = {
  baixa: "Baixa",
  media: "Media",
  alta: "Alta",
  critica: "Critica",
};

const PRIORITY_STYLES = {
  baixa: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  media: "bg-amiste-blue/10 text-amiste-blue ring-amiste-blue/20",
  alta: "bg-amiste-yellow/45 text-yellow-900 ring-amiste-yellow/60",
  critica: "bg-amiste-red/10 text-amiste-red ring-amiste-red/20",
};

const PRIORITY_ORDER = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

const ORDER_FIELDS = [
  { name: "clientId", label: "Cliente", source: "clients", required: true },
  { name: "machineId", label: "Maquina", source: "machines", required: true },
  {
    name: "technician",
    label: "Tecnico",
    type: "select",
    optionGroup: "Tecnicos",
    required: true,
    options: [
      { label: "Rafael", value: "Rafael" },
      { label: "Andre", value: "Andre" },
      { label: "Tecnico de Campo", value: "Tecnico de Campo" },
      { label: "Igor Filipi", value: "Igor Filipi" },
    ],
  },
  {
    name: "priority",
    label: "Prioridade",
    type: "select",
    required: true,
    defaultValue: "media",
    options: [
      { label: "Baixa", value: "baixa" },
      { label: "Media", value: "media" },
      { label: "Alta", value: "alta" },
      { label: "Critica", value: "critica" },
    ],
  },
  {
    name: "issue",
    label: "Problema relatado",
    type: "textarea",
    full: true,
    required: true,
    placeholder: "Ex: cafe saindo frio, vazamento, erro no display...",
  },
  {
    name: "diagnosis",
    label: "Diagnostico inicial",
    type: "textarea",
    full: true,
    placeholder: "Observacoes da primeira analise tecnica.",
  },
  {
    name: "notes",
    label: "Notas internas",
    type: "textarea",
    full: true,
    placeholder: "Combinados com cliente, risco de atraso, maquina reserva...",
  },
];

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

function formatDays(days) {
  return `${days} ${days === 1 ? "dia" : "dias"}`;
}

function resolveRecord(records, id, fallback = "-") {
  return records.find((record) => record.id === id) || { name: fallback };
}

function getActorName(user) {
  return user?.displayName || user?.fullName || "Igor Filipi";
}

function validateOrder(payload) {
  if (!payload.clientId || !payload.machineId || !payload.technician || !payload.priority || !payload.issue) {
    return "Preencha cliente, maquina, tecnico, prioridade e problema relatado.";
  }

  return "";
}

function buildMetrics(summary) {
  return [
    {
      id: "open",
      label: "O.S. abertas",
      value: summary.openCount,
      detail: "em fluxo tecnico",
      icon: "fileClock",
      tone: "blue",
    },
    {
      id: "late",
      label: "Alertas SLA",
      value: summary.lateCount,
      detail: `mais de ${SLA_LIMIT_DAYS} dias na etapa`,
      icon: "bell",
      tone: "red",
    },
    {
      id: "maintenance",
      label: "Em manutencao",
      value: summary.maintenanceCount,
      detail: "bancada tecnica",
      icon: "wrench",
      tone: "yellow",
    },
    {
      id: "average",
      label: "Media aberta",
      value: formatDays(summary.averageOpenDays),
      detail: "entrada ate hoje",
      icon: "gauge",
      tone: "green",
    },
  ];
}

function RepairOrderCard({ canMutate, order, snapshot, onMove, onOpenDetails }) {
  const sla = getRepairOrderSla(order);
  const client = resolveRecord(snapshot.clients || [], order.clientId, "Cliente nao informado");
  const machine = resolveRecord(snapshot.machines || [], order.machineId, "Maquina nao informada");
  const isFirstStage = order.status === REPAIR_ORDER_STAGES[0].id;
  const isLastStage = order.status === REPAIR_ORDER_STAGES[REPAIR_ORDER_STAGES.length - 1].id;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-amiste-soft",
        sla.isLate ? "border-amiste-red/35" : "border-zinc-200"
      )}
    >
      {/* --- SECAO: IDENTIDADE DA O.S. --- */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate font-display text-base font-black text-amiste-black">
            {order.code}
          </strong>
          <span className="mt-1 block text-xs font-bold text-amiste-gray/60">
            {client.name} - {machine.name}
          </span>
        </div>
        <StatusPill label={sla.label} status={sla.status} />
      </div>

      <p className="mt-4 line-clamp-3 text-sm font-semibold leading-6 text-amiste-gray">
        {order.issue}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-2">
          <span className="block font-black uppercase text-amiste-gray/45">Tecnico</span>
          <strong className="mt-1 block truncate text-amiste-black">{order.technician || "-"}</strong>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-2">
          <span className="block font-black uppercase text-amiste-gray/45">Na etapa</span>
          <strong className={cn("mt-1 block", sla.isLate ? "text-amiste-red" : "text-amiste-black")}>
            {formatDays(sla.stageDays)}
          </strong>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-fit items-center rounded-full px-3 text-xs font-bold uppercase ring-1",
            PRIORITY_STYLES[order.priority] || PRIORITY_STYLES.media
          )}
        >
          {PRIORITY_LABELS[order.priority] || "Media"}
        </span>
        <Button
          className="h-8 w-full px-2 text-xs"
          icon="fileText"
          variant="secondary"
          onClick={() => onOpenDetails(order)}
        >
          Detalhes
        </Button>
      </div>

      {canMutate ? (
        <footer className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-4">
          <Button
            className="h-8 px-2 text-xs disabled:opacity-45 disabled:hover:translate-y-0"
            disabled={isFirstStage}
            icon="chevronLeft"
            variant="secondary"
            onClick={() => onMove(order, "back")}
          >
            Voltar
          </Button>
          <Button
            className="h-8 px-2 text-xs disabled:opacity-45 disabled:hover:translate-y-0"
            disabled={isLastStage}
            icon="chevronRight"
            variant={order.status === "pronto" ? "success" : "primary"}
            onClick={() => onMove(order, "next")}
          >
            Avancar
          </Button>
        </footer>
      ) : null}
    </article>
  );
}

function RepairOrderDetailsModal({ order, snapshot, open, onClose }) {
  if (!order) {
    return null;
  }

  const sla = getRepairOrderSla(order);
  const client = resolveRecord(snapshot.clients || [], order.clientId, "Cliente nao informado");
  const machine = resolveRecord(snapshot.machines || [], order.machineId, "Maquina nao informada");
  const timeline = Array.isArray(order.timeline) ? order.timeline : [];

  return (
    <Modal
      description={`${client.name} - ${machine.name}`}
      open={open}
      title={`${order.code} | Detalhes da O.S.`}
      onClose={onClose}
    >
      <div className="space-y-6">
        {/* --- SECAO: RESUMO OPERACIONAL --- */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3">
            <span className="block text-xs font-black uppercase text-amiste-gray/50">Status SLA</span>
            <StatusPill className="mt-2" label={sla.label} status={sla.status} />
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3">
            <span className="block text-xs font-black uppercase text-amiste-gray/50">Na etapa</span>
            <strong className="mt-2 block text-sm text-amiste-black">{formatDays(sla.stageDays)}</strong>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3">
            <span className="block text-xs font-black uppercase text-amiste-gray/50">Total aberto</span>
            <strong className="mt-2 block text-sm text-amiste-black">{formatDays(sla.totalDays)}</strong>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3">
            <span className="block text-xs font-black uppercase text-amiste-gray/50">Orcamento</span>
            <strong className="mt-2 block text-sm text-amiste-black">{formatMoney(order.estimatedValue)}</strong>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <h3 className="font-display text-base font-black text-amiste-black">Problema e diagnostico</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs font-black uppercase text-amiste-gray/50">Relato</dt>
                <dd className="mt-1 text-sm leading-6 text-amiste-gray">{order.issue || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase text-amiste-gray/50">Diagnostico</dt>
                <dd className="mt-1 text-sm leading-6 text-amiste-gray">{order.diagnosis || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase text-amiste-gray/50">Notas internas</dt>
                <dd className="mt-1 text-sm leading-6 text-amiste-gray">{order.notes || "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <h3 className="font-display text-base font-black text-amiste-black">Dados do atendimento</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-amiste-gray/55">Tecnico</dt>
                <dd className="font-black text-amiste-black">{order.technician || "-"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-amiste-gray/55">Prioridade</dt>
                <dd className="font-black text-amiste-black">{PRIORITY_LABELS[order.priority] || "-"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-amiste-gray/55">Entrada</dt>
                <dd className="font-black text-amiste-black">{formatDateTime(order.openedAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-amiste-gray/55">Inicio etapa</dt>
                <dd className="font-black text-amiste-black">{formatDateTime(order.stageStartedAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-amiste-gray/55">Aprovado</dt>
                <dd className="font-black text-amiste-black">{order.approvedByClient ? "Sim" : "Nao"}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* --- SECAO: TIMELINE ---
         * A timeline guarda cada mudanca de etapa dentro da propria ordem para
         * manter a leitura tecnica e auditoria da O.S. no mesmo registro local.
         */}
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
          <h3 className="font-display text-base font-black text-amiste-black">Timeline da O.S.</h3>
          <ol className="mt-4 space-y-3">
            {timeline.map((event) => (
              <li className="flex gap-3 rounded-2xl border border-zinc-100 bg-white p-3" key={`${event.at}-${event.label}`}>
                <span className="mt-1 size-2 rounded-full bg-amiste-red" />
                <div>
                  <strong className="block text-sm font-black text-amiste-black">{event.label}</strong>
                  <span className="mt-1 block text-xs font-semibold text-amiste-gray/60">
                    {formatDateTime(event.at)} - {event.by}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Modal>
  );
}

export default function ServiceOrdersPage({ accessLevel, user }) {
  const [formOpen, setFormOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const { records, createRecord, updateRecord } = useCollection("repairOrders");
  const { snapshot } = useErpSnapshot();
  const canMutate = accessLevel === "AC";
  const rolePermissions = useMemo(() => getRolePermissions(user?.role || "VEN"), [user?.role]);
  const canCreate = canMutate && rolePermissions["action:create"] === "AC";
  const canUpdate = canMutate && ["AC", "UP"].includes(rolePermissions["action:update"]);

  const summary = useMemo(() => summarizeRepairOrders(records), [records]);
  const metrics = useMemo(() => buildMetrics(summary), [summary]);
  const ordersByStage = useMemo(() => {
    return REPAIR_ORDER_STAGES.reduce((columns, stage) => {
      columns[stage.id] = records
        .filter((order) => order.status === stage.id)
        .sort((firstOrder, secondOrder) => {
          const priorityDelta =
            (PRIORITY_ORDER[firstOrder.priority] ?? 9) - (PRIORITY_ORDER[secondOrder.priority] ?? 9);

          if (priorityDelta !== 0) {
            return priorityDelta;
          }

          return new Date(firstOrder.stageStartedAt).getTime() - new Date(secondOrder.stageStartedAt).getTime();
        });

      return columns;
    }, {});
  }, [records]);

  async function handleCreateOrder(payload) {
    if (!canCreate) {
      return;
    }

    await createRecord(buildInitialRepairOrderPayload(payload, getActorName(user)));
    setFormOpen(false);
  }

  async function handleMoveOrder(order, direction) {
    if (!canUpdate) {
      return;
    }

    await updateRecord(order.id, buildStageMovePayload(order, direction, getActorName(user)));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actionIcon="plus"
        actionLabel={canCreate ? "Nova Entrada" : ""}
        description="Fila tecnica de consertos com controle de etapa, SLA de 3 dias e historico de movimentacoes."
        icon="fileClock"
        title="Consertos SLA"
        onAction={() => {
          if (canCreate) {
            setFormOpen(true);
          }
        }}
      />

      {/* --- SECAO: INDICADORES DE SLA --- */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      {/* --- SECAO: QUADRO KANBAN --- */}
      <section className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white/60 p-2 shadow-sm">
        <div className="grid min-h-[620px] min-w-[1180px] grid-cols-5 gap-3">
          {REPAIR_ORDER_STAGES.map((stage) => {
            const stageOrders = ordersByStage[stage.id] || [];

            return (
              <div className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-zinc-100/70" key={stage.id}>
                <header className="flex h-16 items-center justify-between gap-3 border-b border-zinc-200 px-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-base font-black text-amiste-black">{stage.shortLabel}</h2>
                    <span className="mt-1 block text-xs font-bold text-amiste-gray/55">{stage.label}</span>
                  </div>
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-sm font-black text-amiste-black ring-1 ring-zinc-200">
                    {stageOrders.length}
                  </span>
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  {stageOrders.length ? (
                    stageOrders.map((order) => (
                      <RepairOrderCard
                        canMutate={canUpdate}
                        key={order.id}
                        order={order}
                        snapshot={snapshot}
                        onMove={handleMoveOrder}
                        onOpenDetails={setDetailOrder}
                      />
                    ))
                  ) : (
                    <div className="grid h-32 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white/70 px-4 text-center text-sm font-bold text-amiste-gray/45">
                      Sem O.S. nesta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <EntityFormModal
        description="Registre a chegada da maquina para iniciar a triagem e o controle de SLA."
        fields={ORDER_FIELDS}
        open={formOpen}
        snapshot={snapshot}
        title="Nova entrada de conserto"
        validate={validateOrder}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateOrder}
      />

      <RepairOrderDetailsModal
        open={Boolean(detailOrder)}
        order={detailOrder}
        snapshot={snapshot}
        onClose={() => setDetailOrder(null)}
      />
    </div>
  );
}
