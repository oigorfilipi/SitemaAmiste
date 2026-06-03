import { exportRecordsToCsv } from "./exportService.js";

const CLIENT_EXPORT_COLUMNS = [
  { key: "name", label: "Cliente" },
  { key: "contact", label: "Contato" },
  { key: "phone", label: "Telefone" },
  { key: "email", label: "Email" },
  { key: "contractType", label: "Contrato" },
  { key: "machineName", label: "Maquina" },
  { key: "contractValue", label: "Valor Contrato", type: "currency" },
  { key: "openReceivablesValue", label: "A Receber", type: "currency" },
  { key: "openOperations", label: "Operacoes Abertas" },
  { key: "nextAction", label: "Proxima Acao" },
  { key: "status", label: "Status" },
];

function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(asNumber(value));
}

function findById(collection, id) {
  return collection?.find((record) => record.id === id) || null;
}

function isOpenStatus(status, closedStatuses = ["finalizado", "concluido", "pago", "assinado", "entregue"]) {
  return !closedStatuses.includes(String(status || "").toLowerCase());
}

function buildNextAction({ openChecklists, openReceivables, openRepairOrders, pendingProposals }) {
  if (openReceivables.length) {
    return "Cobrar financeiro";
  }

  if (openRepairOrders.length) {
    return "Acompanhar conserto";
  }

  if (openChecklists.length) {
    return "Finalizar checklist";
  }

  if (pendingProposals.length) {
    return "Retomar proposta";
  }

  return "Sem pendencia";
}

export function buildClientRows(clients, snapshot) {
  return clients.map((client) => {
    const machine = findById(snapshot.machines, client.machineId);
    const checklists = (snapshot.checklists || []).filter((record) => record.clientId === client.id);
    const repairOrders = (snapshot.repairOrders || []).filter((record) => record.clientId === client.id);
    const proposals = (snapshot.proposals || []).filter((record) => record.clientId === client.id);
    const serviceSheets = (snapshot.serviceSheets || []).filter((record) => record.clientId === client.id);
    const sales = (snapshot.sales || []).filter((record) => record.clientId === client.id);
    const receivables = (snapshot.receivables || []).filter((record) => record.clientId === client.id);
    const openChecklists = checklists.filter((record) => isOpenStatus(record.status, ["finalizado"]));
    const openRepairOrders = repairOrders.filter((record) => isOpenStatus(record.status, ["entregue"]));
    const pendingProposals = proposals.filter((record) => isOpenStatus(record.status, ["concluido"]));
    const openReceivables = receivables.filter((record) => record.status !== "pago");
    const openReceivablesValue = openReceivables.reduce((total, record) => total + asNumber(record.value), 0);
    const salesValue = sales.reduce((total, record) => total + asNumber(record.totalValue), 0);
    const openOperations = openChecklists.length + openRepairOrders.length + pendingProposals.length;

    return {
      ...client,
      checklists,
      checklistsCount: checklists.length,
      machine,
      machineName: machine?.name || "-",
      nextAction: buildNextAction({
        openChecklists,
        openReceivables,
        openRepairOrders,
        pendingProposals,
      }),
      openChecklists,
      openOperations,
      openReceivables,
      openReceivablesValue,
      openRepairOrders,
      pendingProposals,
      proposals,
      proposalsCount: proposals.length,
      receivables,
      repairOrders,
      sales,
      salesValue,
      serviceSheets,
      serviceSheetsCount: serviceSheets.length,
    };
  }).sort((first, second) => {
    if (first.openReceivablesValue !== second.openReceivablesValue) {
      return second.openReceivablesValue - first.openReceivablesValue;
    }

    if (first.openOperations !== second.openOperations) {
      return second.openOperations - first.openOperations;
    }

    return String(first.name).localeCompare(String(second.name));
  });
}

export function buildClientMetrics(rows) {
  const activeClients = rows.filter((client) => client.status === "concluido").length;
  const contractValue = rows.reduce((total, client) => total + asNumber(client.contractValue), 0);
  const openReceivablesValue = rows.reduce((total, client) => total + client.openReceivablesValue, 0);
  const linkedMachines = rows.filter((client) => client.machineId).length;

  return [
    {
      id: "active",
      icon: "users",
      label: "Clientes ativos",
      value: activeClients,
      detail: `${rows.length} cadastrados`,
      tone: "blue",
    },
    {
      id: "contracts",
      icon: "money",
      label: "Contratos",
      value: formatCurrency(contractValue),
      detail: "valor mensal/base",
      tone: "green",
    },
    {
      id: "receivables",
      icon: "fileClock",
      label: "A receber",
      value: formatCurrency(openReceivablesValue),
      detail: "pendente por cliente",
      tone: openReceivablesValue ? "yellow" : "green",
    },
    {
      id: "machines",
      icon: "coffee",
      label: "Parque instalado",
      value: linkedMachines,
      detail: "clientes com maquina",
      tone: "red",
    },
  ];
}

export function filterClientRows(rows, searchTerm) {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  if (!normalizedTerm) {
    return rows;
  }

  return rows.filter((client) =>
    [
      client.name,
      client.contact,
      client.phone,
      client.email,
      client.contractType,
      client.machineName,
      client.nextAction,
      client.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedTerm)
  );
}

export function buildClientTimeline(client) {
  return [
    ...client.checklists.map((record) => ({
      id: `checklist-${record.id}`,
      date: record.date,
      label: `Checklist ${record.code}`,
      meta: `${record.serviceType} | ${record.status}`,
      tone: record.status === "finalizado" ? "green" : "yellow",
    })),
    ...client.repairOrders.map((record) => ({
      id: `repair-${record.id}`,
      date: String(record.openedAt || "").slice(0, 10),
      label: record.code,
      meta: `${record.priority} | ${record.status}`,
      tone: record.status === "entregue" ? "green" : "red",
    })),
    ...client.proposals.map((record) => ({
      id: `proposal-${record.id}`,
      date: record.createdDate,
      label: `Proposta ${record.modality}`,
      meta: `${formatCurrency(record.totalValue)} | ${record.status}`,
      tone: record.status === "concluido" ? "green" : "blue",
    })),
    ...client.sales.map((record) => ({
      id: `sale-${record.id}`,
      date: record.date,
      label: "Venda rapida",
      meta: `${formatCurrency(record.totalValue)} | ${record.paymentStatus}`,
      tone: record.paymentStatus === "pago" ? "green" : "yellow",
    })),
    ...client.receivables.map((record) => ({
      id: `receivable-${record.id}`,
      date: record.dueDate,
      label: record.origin,
      meta: `${formatCurrency(record.value)} | ${record.status}`,
      tone: record.status === "pago" ? "green" : "red",
    })),
  ]
    .filter((item) => item.date)
    .sort((first, second) => String(second.date).localeCompare(String(first.date)))
    .slice(0, 8);
}

export function exportClientRows(rows, snapshot) {
  exportRecordsToCsv({
    columns: CLIENT_EXPORT_COLUMNS,
    filename: "clientes-360",
    records: rows,
    snapshot,
  });
}
