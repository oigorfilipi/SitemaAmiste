export const SLA_LIMIT_DAYS = 3;

export const REPAIR_ORDER_STAGES = [
  { id: "triagem", label: "Triagem / Fila", shortLabel: "Triagem" },
  { id: "orcamento", label: "Orcamento / Aprovacao", shortLabel: "Orcamento" },
  { id: "manutencao", label: "Em Manutencao", shortLabel: "Manutencao" },
  { id: "pronto", label: "Pronto / Retirada", shortLabel: "Pronto" },
  { id: "entregue", label: "Entregue", shortLabel: "Entregue" },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function asDate(dateLike) {
  const date = new Date(dateLike);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function getStageById(stageId) {
  return REPAIR_ORDER_STAGES.find((stage) => stage.id === stageId) || REPAIR_ORDER_STAGES[0];
}

export function getElapsedDays(dateLike, now = new Date()) {
  const date = asDate(dateLike);

  if (!date) {
    return 0;
  }

  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / MS_PER_DAY));
}

export function getRepairOrderSla(order, now = new Date()) {
  const stageDays = getElapsedDays(order.stageStartedAt || order.openedAt, now);
  const totalDays = getElapsedDays(order.openedAt || order.createdAt, now);
  const isLate = order.status !== "entregue" && stageDays > SLA_LIMIT_DAYS;

  return {
    isLate,
    stageDays,
    totalDays,
    label: isLate ? "Atrasado" : "SLA OK",
    status: isLate ? "atrasado" : "ativo",
  };
}

export function getNextStageId(currentStageId) {
  const currentIndex = REPAIR_ORDER_STAGES.findIndex((stage) => stage.id === currentStageId);
  const nextStage = REPAIR_ORDER_STAGES[Math.min(REPAIR_ORDER_STAGES.length - 1, currentIndex + 1)];

  return nextStage?.id || currentStageId;
}

export function getPreviousStageId(currentStageId) {
  const currentIndex = REPAIR_ORDER_STAGES.findIndex((stage) => stage.id === currentStageId);
  const previousStage = REPAIR_ORDER_STAGES[Math.max(0, currentIndex - 1)];

  return previousStage?.id || currentStageId;
}

export function buildInitialRepairOrderPayload(payload, actorName, now = new Date()) {
  const createdAt = now.toISOString();
  const code = `OS-${String(now.getTime()).slice(-5)}`;

  /* --- SECAO: NORMALIZACAO DE ENTRADA ---
   * A tela envia apenas campos editaveis. O service completa status, datas e timeline
   * para manter a regra de O.S. fora do componente visual.
   */
  return {
    ...payload,
    code,
    status: "triagem",
    stageStartedAt: createdAt,
    openedAt: createdAt,
    closedAt: "",
    estimatedValue: 0,
    approvedByClient: false,
    timeline: [{ at: createdAt, label: "Entrada registrada", by: actorName }],
  };
}

export function buildStageMovePayload(order, direction, actorName, now = new Date()) {
  const targetStageId = direction === "back" ? getPreviousStageId(order.status) : getNextStageId(order.status);

  if (targetStageId === order.status) {
    return order;
  }

  const targetStage = getStageById(targetStageId);
  const movedAt = now.toISOString();
  const timeline = Array.isArray(order.timeline) ? order.timeline : [];

  return {
    ...order,
    status: targetStageId,
    stageStartedAt: movedAt,
    closedAt: targetStageId === "entregue" ? movedAt : "",
    timeline: [
      ...timeline,
      {
        at: movedAt,
        label: `Movido para ${targetStage.label}`,
        by: actorName,
      },
    ],
  };
}

export function summarizeRepairOrders(orders, now = new Date()) {
  const openOrders = orders.filter((order) => order.status !== "entregue");
  const lateOrders = openOrders.filter((order) => getRepairOrderSla(order, now).isLate);
  const maintenanceOrders = orders.filter((order) => order.status === "manutencao");
  const totalOpenDays = openOrders.reduce((total, order) => total + getRepairOrderSla(order, now).totalDays, 0);
  const averageOpenDays = openOrders.length ? Math.round(totalOpenDays / openOrders.length) : 0;

  return {
    openCount: openOrders.length,
    lateCount: lateOrders.length,
    maintenanceCount: maintenanceOrders.length,
    averageOpenDays,
  };
}
