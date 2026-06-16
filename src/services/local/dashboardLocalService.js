import { getDatabaseSnapshot } from "./localDatabase.js";
import { SLA_LIMIT_DAYS, getRepairOrderSla } from "../repairOrderService.js";
import { canAccessPage } from "../permissionService.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getTime(value) {
  const date = new Date(value || 0);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function resolveName(collection, id, fallback = "-") {
  return collection.find((record) => record.id === id)?.name || fallback;
}

function isPastDate(value, now) {
  if (!value) {
    return false;
  }

  const dueDate = new Date(`${value}T23:59:59`);

  return !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now.getTime();
}

function getContractReviewClients(clients, now) {
  return clients.filter((client) => {
    if (!client.startDate || client.status !== "concluido") {
      return false;
    }

    const startDate = new Date(client.startDate);

    if (Number.isNaN(startDate.getTime())) {
      return false;
    }

    return startDate.getMonth() === now.getMonth();
  });
}

function canSeeStock(role) {
  return ["estoque", "machines", "insumos", "acessorios"].some((pageId) => canAccessPage(role, pageId));
}

function isRequestManagerRole(role) {
  return ["DEV", "CEO", "DON"].includes(role);
}

function buildDashboardAlerts(database, now, role) {
  const lowStockItems = [...database.machines, ...database.supplies, ...database.accessories].filter(
    (item) => Number(item.stock || 0) <= Number(item.minStock || 0)
  );
  const lateRepairOrders = (database.repairOrders || []).filter((order) => getRepairOrderSla(order, now).isLate);
  const pendingApprovalOrders = (database.repairOrders || []).filter(
    (order) => order.status === "orcamento" && !order.approvedByClient
  );
  const overdueReceivables = database.receivables.filter(
    (receivable) => receivable.status !== "pago" && isPastDate(receivable.dueDate, now)
  );
  const contractReviewClients = getContractReviewClients(database.clients, now);
  const activeRequests = (database.accountRequests || []).filter((request) =>
    ["pendente", "reativado", "atendendo", "analise", "aguardando-resposta", "transferido"].includes(request.status)
  );
  const visibleRequests = isRequestManagerRole(role)
    ? activeRequests
    : activeRequests.filter((request) => request.isGeneral);

  /* --- SECAO: PRIORIZACAO DOS ALERTAS ---
   * O painel privilegia risco operacional real: SLA vencido, dinheiro vencido,
   * estoque no limite e aprovacoes paradas.
   */
  return [
    ...(canAccessPage(role, "solicitacoes") ? visibleRequests.slice(0, 3).map((request) => ({
      id: `request_${request.id}_${request.status}`,
      title: request.title || "Solicitacao interna",
      description: `${request.requesterName || "Usuario"} | ${request.category || "-"} | ${request.priority || "-"}`,
      type: "requests",
      icon: "fileClock",
      pageId: "solicitacoes",
    })) : []),
    ...(canAccessPage(role, "serviceOrders") ? lateRepairOrders.slice(0, 3).map((order) => {
      const sla = getRepairOrderSla(order, now);
      const clientName = resolveName(database.clients, order.clientId, "Cliente nao informado");

      return {
        id: `sla_${order.id}`,
        title: `${order.code} acima do SLA`,
        description: `${clientName} esta ha ${sla.stageDays} dias na etapa atual.`,
        type: "maintenance",
        icon: "wrench",
        pageId: "serviceOrders",
      };
    }) : []),
    ...(canAccessPage(role, "financeiro") ? overdueReceivables.slice(0, 2).map((receivable) => ({
      id: `receivable_${receivable.id}`,
      title: `${receivable.origin} vencido`,
      description: `${resolveName(database.clients, receivable.clientId, "Cliente")} deve ${formatCurrency(receivable.value)} desde ${formatDate(receivable.dueDate)}.`,
      type: "finance",
      icon: "money",
      pageId: "financeiro",
    })) : []),
    ...(canSeeStock(role) ? lowStockItems.slice(0, 3).map((item) => ({
      id: `stock_${item.id}`,
      title: `${item.name} no limite`,
      description: `Estoque atual: ${item.stock}. Minimo configurado: ${item.minStock}.`,
      type: "stock",
      icon: "boxes",
      pageId: "estoque",
    })) : []),
    ...(canAccessPage(role, "serviceOrders") ? pendingApprovalOrders.slice(0, 2).map((order) => ({
      id: `approval_${order.id}`,
      title: `${order.code} aguardando aprovacao`,
      description: `${resolveName(database.clients, order.clientId, "Cliente")} tem orcamento pendente de retorno.`,
      type: "commercial",
      icon: "bell",
      pageId: "serviceOrders",
    })) : []),
    ...(canAccessPage(role, "clientes") ? contractReviewClients.slice(0, 2).map((client) => ({
      id: `contract_${client.id}`,
      title: `${client.name} em janela comercial`,
      description: `Contrato iniciado em ${formatDate(client.startDate)}. Revise condicoes e oportunidades.`,
      type: "commercial",
      icon: "bell",
      pageId: "clientes",
    })) : []),
  ].slice(0, 7);
}

function buildLatestOperations(database, role) {
  const checklistOperations = database.checklists.map((checklist) => ({
    id: `checklist_${checklist.id}`,
    sourceId: checklist.id,
    kind: "Checklist",
    code: checklist.code,
    title: checklist.serviceType || "Atendimento",
    client: resolveName(database.clients, checklist.clientId),
    machine: resolveName(database.machines, checklist.machineId),
    date: formatDate(checklist.date),
    sortDate: checklist.date,
    status: checklist.status,
    pageId: "checklists",
  }));
  const repairOperations = (database.repairOrders || []).map((order) => ({
    id: `repair_${order.id}`,
    sourceId: order.id,
    kind: "O.S.",
    code: order.code,
    title: order.issue,
    client: resolveName(database.clients, order.clientId),
    machine: resolveName(database.machines, order.machineId),
    date: formatDate(order.updatedAt || order.stageStartedAt || order.openedAt),
    sortDate: order.updatedAt || order.stageStartedAt || order.openedAt,
    status: order.status,
    pageId: "serviceOrders",
  }));
  const saleOperations = database.sales.map((sale) => {
    const product = database[sale.productCollection]?.find((item) => item.id === sale.productId);

    return {
      id: `sale_${sale.id}`,
      sourceId: sale.id,
      kind: "Venda",
      code: sale.id.slice(-5).toUpperCase(),
      title: product?.name || "Produto vendido",
      client: resolveName(database.clients, sale.clientId),
      machine: `${sale.quantity} un. - ${formatCurrency(sale.totalValue)}`,
      date: formatDate(sale.date),
      sortDate: sale.date,
      status: sale.paymentStatus,
      pageId: "vendas",
    };
  });
  const financeOperations = database.receivables.map((receivable) => ({
    id: `receivable_op_${receivable.id}`,
    sourceId: receivable.id,
    kind: "Receber",
    code: receivable.id.slice(-5).toUpperCase(),
    title: receivable.origin,
    client: resolveName(database.clients, receivable.clientId),
    machine: formatCurrency(receivable.value),
    date: formatDate(receivable.dueDate),
    sortDate: receivable.dueDate,
    status: receivable.status,
    pageId: "financeiro",
  }));

  return [...checklistOperations, ...repairOperations, ...saleOperations, ...financeOperations]
    .filter((operation) => canAccessPage(role, operation.pageId))
    .sort((first, second) => getTime(second.sortDate) - getTime(first.sortDate))
    .slice(0, 8);
}

export function buildDashboardFromDatabase(database, role = "VEN") {
  const now = new Date();
  const activeChecklists = database.checklists.filter((checklist) => checklist.status !== "finalizado");
  const openRepairOrders = (database.repairOrders || []).filter((order) => order.status !== "entregue");
  const lateRepairOrders = openRepairOrders.filter((order) => getRepairOrderSla(order, now).isLate);
  const lowStockItems = [...database.machines, ...database.supplies, ...database.accessories].filter(
    (item) => Number(item.stock || 0) <= Number(item.minStock || 0)
  );
  const receivableValue = database.receivables
    .filter((receivable) => receivable.status !== "pago")
    .reduce((total, receivable) => total + Number(receivable.value || 0), 0);
  const activeClients = database.clients.filter((client) => client.status === "concluido");
  const metrics = [
    canAccessPage(role, "checklists")
      ? {
          id: "checklists",
          label: "Checklists ativos",
          value: String(activeChecklists.length),
          detail: `${database.checklists.length} registros totais`,
          icon: "checkSquare",
          tone: "red",
        }
      : null,
    canAccessPage(role, "serviceOrders")
      ? {
          id: "serviceOrders",
          label: "O.S. abertas",
          value: String(openRepairOrders.length),
          detail: `${lateRepairOrders.length} acima do SLA de ${SLA_LIMIT_DAYS} dias`,
          icon: "wrench",
          tone: "blue",
        }
      : null,
    canSeeStock(role)
      ? {
          id: "estoque",
          label: "Alertas de estoque",
          value: String(lowStockItems.length),
          detail: `${lowStockItems.filter((item) => Number(item.stock || 0) === 0).length} itens zerados`,
          icon: "boxes",
          tone: "yellow",
        }
      : null,
    canAccessPage(role, "financeiro")
      ? {
          id: "financeiro",
          label: "A receber",
          value: formatCurrency(receivableValue),
          detail: "pendente no financeiro",
          icon: "money",
          tone: "green",
        }
      : null,
  ].filter(Boolean);

  return {
    metrics,
    alerts: buildDashboardAlerts(database, now, role),
    latestChecklists: database.checklists.slice(0, 6).map((checklist) => ({
      ...checklist,
      client: resolveName(database.clients, checklist.clientId),
      machine: resolveName(database.machines, checklist.machineId),
    })),
    latestOperations: buildLatestOperations(database, role),
    activeClientsCount: activeClients.length,
  };
}

export async function getDashboardLocal(role = "VEN") {
  return buildDashboardFromDatabase(getDatabaseSnapshot(), role);
}
