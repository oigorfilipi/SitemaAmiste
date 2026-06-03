import { updateEntity } from "./erpService.js";
import { exportRecordsToCsv } from "./exportService.js";

export const FINANCIAL_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "receivables", label: "A Receber" },
  { id: "payables", label: "A Pagar" },
  { id: "overdue", label: "Atrasados" },
  { id: "pending", label: "Pendentes" },
  { id: "paid", label: "Pagos" },
];

const FINANCIAL_EXPORT_COLUMNS = [
  { key: "typeLabel", label: "Tipo" },
  { key: "description", label: "Descricao" },
  { key: "clientName", label: "Cliente" },
  { key: "category", label: "Categoria" },
  { key: "dueDate", label: "Vencimento" },
  { key: "agingLabel", label: "Aging" },
  { key: "value", label: "Valor", type: "currency" },
  { key: "displayStatus", label: "Status" },
  { key: "notes", label: "Observacoes" },
];

function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function todayAtStart() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseLocalDate(date) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function diffDays(date) {
  const parsedDate = parseLocalDate(date);

  if (!parsedDate) {
    return 0;
  }

  return Math.round((parsedDate.getTime() - todayAtStart().getTime()) / 86400000);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(asNumber(value));
}

function resolveClient(snapshot, clientId) {
  return snapshot.clients?.find((client) => client.id === clientId)?.name || "-";
}

function resolveAging(record) {
  if (record.status === "pago") {
    return {
      agingLabel: "Liquidado",
      displayStatus: "pago",
      dueBucket: "paid",
      dueTone: "green",
      isOverdue: false,
      daysToDue: diffDays(record.dueDate),
    };
  }

  const daysToDue = diffDays(record.dueDate);

  if (daysToDue < 0) {
    return {
      agingLabel: `${Math.abs(daysToDue)}d atrasado`,
      displayStatus: "atrasado",
      dueBucket: "overdue",
      dueTone: "red",
      isOverdue: true,
      daysToDue,
    };
  }

  if (daysToDue === 0) {
    return {
      agingLabel: "Vence hoje",
      displayStatus: "pendente",
      dueBucket: "today",
      dueTone: "yellow",
      isOverdue: false,
      daysToDue,
    };
  }

  if (daysToDue <= 7) {
    return {
      agingLabel: `Vence em ${daysToDue}d`,
      displayStatus: "pendente",
      dueBucket: "next7",
      dueTone: "yellow",
      isOverdue: false,
      daysToDue,
    };
  }

  return {
    agingLabel: `Vence em ${daysToDue}d`,
    displayStatus: "pendente",
    dueBucket: "open",
    dueTone: "blue",
    isOverdue: false,
    daysToDue,
  };
}

function buildReceivableRow(record, snapshot) {
  const aging = resolveAging(record);

  return {
    ...record,
    ...aging,
    category: record.category || "Receita",
    clientName: resolveClient(snapshot, record.clientId),
    collectionName: "receivables",
    description: record.origin,
    direction: "in",
    signedValue: asNumber(record.value),
    typeLabel: "Receber",
  };
}

function buildPayableRow(record) {
  const aging = resolveAging(record);

  return {
    ...record,
    ...aging,
    clientName: "-",
    collectionName: "payables",
    direction: "out",
    signedValue: -asNumber(record.value),
    typeLabel: "Pagar",
  };
}

export function buildFinancialRows({ payables = [], receivables = [], snapshot }) {
  return [
    ...receivables.map((record) => buildReceivableRow(record, snapshot)),
    ...payables.map((record) => buildPayableRow(record)),
  ].sort((first, second) => {
    if (first.status === "pago" && second.status !== "pago") {
      return 1;
    }

    if (first.status !== "pago" && second.status === "pago") {
      return -1;
    }

    return diffDays(first.dueDate) - diffDays(second.dueDate);
  });
}

export function filterFinancialRows(rows, filterId) {
  if (filterId === "receivables" || filterId === "payables") {
    return rows.filter((row) => row.collectionName === filterId);
  }

  if (filterId === "overdue") {
    return rows.filter((row) => row.isOverdue);
  }

  if (filterId === "pending") {
    return rows.filter((row) => row.status !== "pago");
  }

  if (filterId === "paid") {
    return rows.filter((row) => row.status === "pago");
  }

  return rows;
}

export function buildFinancialMetrics(rows) {
  const openRows = rows.filter((row) => row.status !== "pago");
  const paidRows = rows.filter((row) => row.status === "pago");
  const pendingReceivables = openRows
    .filter((row) => row.direction === "in")
    .reduce((total, row) => total + asNumber(row.value), 0);
  const pendingPayables = openRows
    .filter((row) => row.direction === "out")
    .reduce((total, row) => total + asNumber(row.value), 0);
  const realizedBalance = paidRows.reduce((total, row) => total + row.signedValue, 0);
  const next7Balance = openRows
    .filter((row) => row.daysToDue >= 0 && row.daysToDue <= 7)
    .reduce((total, row) => total + row.signedValue, 0);

  return [
    {
      id: "receber",
      icon: "money",
      label: "A receber",
      value: formatCurrency(pendingReceivables),
      detail: `${openRows.filter((row) => row.direction === "in").length} abertas`,
      tone: "green",
    },
    {
      id: "pagar",
      icon: "fileClock",
      label: "A pagar",
      value: formatCurrency(pendingPayables),
      detail: `${openRows.filter((row) => row.direction === "out").length} despesas`,
      tone: "red",
    },
    {
      id: "realizado",
      icon: "dashboard",
      label: "Saldo realizado",
      value: formatCurrency(realizedBalance),
      detail: "baixas confirmadas",
      tone: "blue",
    },
    {
      id: "seteDias",
      icon: "gauge",
      label: "Fluxo 7 dias",
      value: formatCurrency(next7Balance),
      detail: `${openRows.filter((row) => row.isOverdue).length} atrasados`,
      tone: next7Balance < 0 ? "yellow" : "green",
    },
  ];
}

export async function settleFinancialRow(row) {
  return updateEntity(
    row.collectionName,
    row.id,
    {
      status: "pago",
      paidAt: new Date().toISOString().slice(0, 10),
    },
    {
      action: "Baixa",
      details: `${row.typeLabel}: ${formatCurrency(row.value)} | Vencimento: ${row.dueDate}`,
      module: "Financeiro",
      title: row.description,
    }
  );
}

export function exportFinancialRows(rows, snapshot) {
  exportRecordsToCsv({
    columns: FINANCIAL_EXPORT_COLUMNS,
    filename: "relatorio-financeiro",
    records: rows,
    snapshot,
  });
}
