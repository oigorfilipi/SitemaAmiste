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

const MODULE_LABEL_OVERRIDES = {
  Contas: "Gestao de Contas",
  accounts: "Gestao de Contas",
};

export const AUDIT_EVENT_CATALOG = [
  {
    id: "auth",
    title: "Acesso e seguranca",
    events: [
      "Login e logout",
      "Primeiro acesso concluido",
      "Alteracao de senha",
      "Alteracao da Senha ADM",
    ],
  },
  {
    id: "accounts",
    title: "Equipe e permissoes",
    events: [
      "Criacao, edicao e desativacao de colaboradores",
      "Alteracoes na Matriz RBAC",
      "Alteracoes na Matriz Granular",
      "Criacao e edicao de cargos/funcoes",
    ],
  },
  {
    id: "operations",
    title: "Operacao do ERP",
    events: [
      "Criacao, edicao e exclusao de cadastros",
      "Movimentacoes de estoque e contagens",
      "Finalizacao de checklists e consertos",
      "Uploads, downloads, impressoes e exports relevantes",
    ],
  },
  {
    id: "system",
    title: "Sistema",
    events: [
      "Backups e restauracoes",
      "Alteracoes de configuracoes globais",
      "Acoes automaticas com impacto em dados",
    ],
  },
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

function normalizeModuleLabel(moduleName) {
  return MODULE_LABEL_OVERRIDES[moduleName] || moduleName;
}

function looksLikeTechnicalUserId(value) {
  return /^usr[_-]/i.test(String(value || "").trim());
}

function resolveAuditUserName(record, accounts = []) {
  const candidateIds = [record.userId, record.userName]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const account = accounts.find((currentAccount) => candidateIds.includes(currentAccount.id));

  if (account?.displayName || account?.fullName) {
    return account.displayName || account.fullName;
  }

  if (looksLikeTechnicalUserId(record.userName)) {
    return "Usuario do sistema";
  }

  return record.userName || "Sistema";
}

export function buildAuditRows(records, accounts = []) {
  return records.map((record) => {
    const module = normalizeModuleLabel(record.module);
    const userName = resolveAuditUserName(record, accounts);

    return {
      ...record,
      module,
      userName,
      ...formatDateTime(record.date),
      searchable: [
        module,
        record.action,
        record.title,
        userName,
        record.role,
        record.details,
      ].join(" ").toLowerCase(),
    };
  }).sort((first, second) => String(second.date).localeCompare(String(first.date)));
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
