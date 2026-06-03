import { exportRecordsToCsv } from "./exportService.js";

const AUDIT_EXPORT_COLUMNS = [
  { key: "date", label: "Data" },
  { key: "module", label: "Modulo" },
  { key: "action", label: "Acao" },
  { key: "title", label: "Registro" },
  { key: "userName", label: "Usuario" },
  { key: "role", label: "Cargo" },
  { key: "details", label: "Detalhes" },
];

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      dateLabel: "-",
      timeLabel: "-",
    };
  }

  return {
    dateLabel: date.toLocaleDateString("pt-BR"),
    timeLabel: date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function uniqueValues(rows, key) {
  return Array.from(new Set(rows.map((row) => row[key]).filter(Boolean)))
    .sort((first, second) => String(first).localeCompare(String(second)));
}

export function buildAuditRows(records) {
  return records.map((record) => ({
    ...record,
    ...formatDateTime(record.date),
    searchable: [
      record.module,
      record.action,
      record.title,
      record.userName,
      record.role,
      record.details,
    ].join(" ").toLowerCase(),
  })).sort((first, second) => String(second.date).localeCompare(String(first.date)));
}

export function buildAuditModuleTabs(rows) {
  return [
    { id: "all", label: "Todos" },
    ...uniqueValues(rows, "module").map((module) => ({
      id: module,
      label: module,
    })),
  ];
}

export function buildAuditSelectOptions(rows, key) {
  return [
    { label: "Todos", value: "all" },
    ...uniqueValues(rows, key).map((value) => ({
      label: value,
      value,
    })),
  ];
}

export function filterAuditRows(rows, filters) {
  const searchTerm = String(filters.searchTerm || "").trim().toLowerCase();

  return rows.filter((row) => {
    const moduleMatches = filters.moduleId === "all" || row.module === filters.moduleId;
    const actionMatches = filters.actionId === "all" || row.action === filters.actionId;
    const roleMatches = filters.roleId === "all" || row.role === filters.roleId;
    const searchMatches = !searchTerm || row.searchable.includes(searchTerm);

    return moduleMatches && actionMatches && roleMatches && searchMatches;
  });
}

export function buildAuditMetrics(rows) {
  const modules = uniqueValues(rows, "module");
  const users = uniqueValues(rows, "userName");
  const criticalActions = rows.filter((row) =>
    ["Excluiu", "Baixa", "Finalizou", "Contagem", "Precificacao"].includes(row.action)
  );
  const lastEntry = rows[0];

  return [
    {
      id: "events",
      icon: "history",
      label: "Eventos",
      value: rows.length,
      detail: "ultimos registros locais",
      tone: "blue",
    },
    {
      id: "modules",
      icon: "layoutGrid",
      label: "Modulos",
      value: modules.length,
      detail: "com atividade",
      tone: "green",
    },
    {
      id: "users",
      icon: "users",
      label: "Usuarios",
      value: users.length,
      detail: "atores no log",
      tone: "yellow",
    },
    {
      id: "critical",
      icon: "shield",
      label: "Acoes sensiveis",
      value: criticalActions.length,
      detail: lastEntry ? `${lastEntry.action} em ${lastEntry.module}` : "sem eventos",
      tone: criticalActions.length ? "red" : "green",
    },
  ];
}

export function exportAuditRows(rows) {
  exportRecordsToCsv({
    columns: AUDIT_EXPORT_COLUMNS,
    filename: "historico-geral",
    records: rows,
    snapshot: {},
  });
}
