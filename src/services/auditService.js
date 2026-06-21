const MODULE_LABEL_OVERRIDES = {
  Contas: "Gestao de Contas",
  accounts: "Gestao de Contas",
  Home: "Dashboard",
  Sessao: "Acesso",
};

const MODULE_ENTITY_LABELS = {
  Acesso: "acesso",
  Acessorios: "acessorio",
  "Adicionar Opcoes": "opcao",
  Checklists: "checklist",
  Clientes: "cliente",
  Configuracoes: "configuracao",
  "Configuracoes de Seguranca": "configuracao de seguranca",
  "Contagem de Estoque": "estoque",
  Dashboard: "dashboard",
  Etiquetas: "etiqueta",
  Financeiro: "registro financeiro",
  "Gestao de Contas": "conta",
  "Historico Geral": "evento",
  Insumos: "insumo",
  Maquinas: "maquina",
  Perfil: "perfil",
  Portfolios: "portfolio",
  Precos: "preco",
  Receitas: "receita",
  Solicitacoes: "solicitacao",
  Vendas: "venda",
  Wiki: "wiki",
};

const FIELD_LABELS = {
  assigneeName: "Atendente",
  comments: "Comentarios",
  displayName: "Nome de exibicao",
  email: "E-mail",
  events: "Historico interno",
  fullName: "Nome completo",
  managerInboxHidden: "Caixa de entrada",
  role: "Cargo",
  status: "Status",
};

const VALUE_LABELS = {
  "aguardando-resposta": "Aguardando Resposta",
  analise: "Em Analise",
  atendendo: "Atendendo",
  concluido: "Concluido",
  desistido: "Desistido",
  encerrado: "Encerrado",
  false: "Nao",
  "nao-resolvido": "Nao resolvido",
  pendente: "Pendente",
  reativado: "Reativado",
  rejeitado: "Rejeitado",
  true: "Sim",
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

function looksLikeTechnicalRecordId(value) {
  return /^[a-z]+_\d{10,}_[a-z0-9]+$/i.test(String(value || "").trim()) ||
    /^[a-z]+_[a-z0-9]+_[a-z0-9]+$/i.test(String(value || "").trim());
}

function articleForEntity(entity) {
  const feminineEndings = ["a", "ao"];
  const normalizedEntity = String(entity || "").toLowerCase();

  return feminineEndings.some((ending) => normalizedEntity.endsWith(ending)) ? "uma" : "um";
}

function titleCaseAction(value = "") {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    || "Registrou";
}

function resolveHumanTitle(record, module) {
  const action = titleCaseAction(record.action);
  const entity = MODULE_ENTITY_LABELS[module] || "registro";
  const article = articleForEntity(entity);
  const title = String(record.title || "").trim();
  const details = String(record.details || "");
  const context = `${title} ${details}`.toLowerCase();

  if (context.includes("matriz") || context.includes("permiss")) return "Alterou Permissoes";
  if (action === "Login") return "Realizou login";
  if (action === "Logout") return "Realizou logout";
  if (action === "Primeiro Login") return "Concluiu primeiro acesso";
  if (action === "Alterou Senha") return "Alterou senha";
  if (action === "Restaurou") return "Restaurou backup";
  if (action === "Backup") return "Gerou backup";
  if (action === "Criou") return `Criou ${article} ${entity}`;
  if (action === "Editou") return `Editou ${article} ${entity}`;
  if (action === "Atualizou") return `Atualizou ${article} ${entity}`;
  if (action === "Excluiu") return `Excluiu ${article} ${entity}`;
  if (action === "Finalizou") return `Concluiu ${article} ${entity}`;

  if (!looksLikeTechnicalRecordId(title)) {
    return title || `${action} em ${module}`;
  }

  return `${action} em ${module}`;
}

function formatAuditValue(value = "") {
  const normalizedValue = String(value || "").trim();

  return VALUE_LABELS[normalizedValue] || normalizedValue || "-";
}

function parseItemCount(value = "") {
  return Number(String(value).match(/^(\d+)\s+item/)?.[1] || 0);
}

function humanizeChangeLine(line = "") {
  const match = String(line).match(/^([^:]+):\s*(.*?)\s*->\s*(.*)$/);

  if (!match) {
    return line;
  }

  const [, rawField, previousValue, nextValue] = match;
  const fieldName = rawField.trim();
  const label = FIELD_LABELS[fieldName] || fieldName;

  if (fieldName === "comments") {
    return parseItemCount(nextValue) > parseItemCount(previousValue)
      ? "Comentario adicionado."
      : "Comentarios atualizados.";
  }

  if (fieldName === "events") {
    return "Historico interno da solicitacao atualizado.";
  }

  if (fieldName === "status") {
    return `Status alterado de "${formatAuditValue(previousValue)}" para "${formatAuditValue(nextValue)}".`;
  }

  if (fieldName === "managerInboxHidden") {
    return "Solicitacao removida da caixa principal de finalizados.";
  }

  return `${label} alterado de "${formatAuditValue(previousValue)}" para "${formatAuditValue(nextValue)}".`;
}

function resolveHumanDetails(details = "") {
  const text = String(details || "").trim();

  if (!text) {
    return "Nenhum detalhe adicional foi registrado.";
  }

  if (/^Registro criado\.?\s*ID:/i.test(text)) {
    return "Registro criado com sucesso.";
  }

  if (/^Registro excluido\.?\s*ID:/i.test(text)) {
    return "Registro excluido do sistema.";
  }

  if (/^Registro salvo sem alteracoes/i.test(text)) {
    return "Registro salvo sem mudancas relevantes.";
  }

  return text
    .split("\n")
    .map(humanizeChangeLine)
    .join("\n");
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
      displayTitle: resolveHumanTitle(record, module),
      humanDetails: resolveHumanDetails(record.details),
      userName,
      ...formatDateTime(record.date),
      searchable: [
        module,
        record.action,
        record.title,
        resolveHumanTitle(record, module),
        userName,
        record.role,
        record.details,
        resolveHumanDetails(record.details),
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
      detail: "registros de auditoria",
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
