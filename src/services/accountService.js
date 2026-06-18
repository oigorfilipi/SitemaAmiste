import {
  ALL_PERMISSION_RESOURCES,
  ALL_PAGES,
  ROLE_PERMISSIONS,
  getAccessLabel,
  getRolePermissions,
} from "./permissionService.js";
import { validatePasswordStrength } from "./passwordPolicyService.js";

export const ACCOUNT_TABS = [
  { id: "ativas", label: "Ativas" },
  { id: "desativadas", label: "Desativadas" },
  { id: "matriz", label: "Matriz RBAC" },
  { id: "granular", label: "Matriz Granular" },
];

export const ROLE_LABELS = {
  ADM: "Administrativo",
  CEO: "Dono",
  DON: "Dono",
  DEV: "Desenvolvedor",
  FIN: "Financeiro",
  TEC: "Tecnico",
  VEN: "Vendedor",
};

export const ROLE_OPTIONS = [
  { label: "Desenvolvedor", value: "DEV" },
  { label: "Dono", value: "DON" },
  { label: "Vendedor", value: "VEN" },
  { label: "Administrativo", value: "ADM" },
  { label: "Tecnico", value: "TEC" },
  { label: "Financeiro", value: "FIN" },
];

function normalizeRoleValue(value) {
  return String(value || "").trim().toUpperCase();
}

function roleOptionFromValue(value) {
  const role = normalizeRoleValue(value);

  if (!role) {
    return null;
  }

  return {
    label: ROLE_LABELS[role] || role,
    value: role,
  };
}

function dedupeRoleOptions(options) {
  const seen = new Set();

  return options.filter((option) => {
    const value = normalizeRoleValue(option?.value);

    if (!value || seen.has(value)) {
      return false;
    }

    seen.add(value);
    option.value = value;
    return true;
  });
}

export function buildRoleOptions(optionRecords = [], accounts = []) {
  const functionOptions = optionRecords
    .filter((option) => option.group === "Funcoes")
    .map((option) => ({
      label: option.name || option.value,
      value: option.value || option.name,
    }));
  const accountRoleOptions = accounts
    .map((account) => roleOptionFromValue(account.role))
    .filter(Boolean);
  const sourceOptions = functionOptions.length ? functionOptions : ROLE_OPTIONS;

  return dedupeRoleOptions([...sourceOptions, ...accountRoleOptions])
    .sort((first, second) => first.label.localeCompare(second.label));
}

function resolveRoleLabel(role, roleOptions = ROLE_OPTIONS) {
  const normalizedRole = normalizeRoleValue(role);
  const dynamicLabel = roleOptions.find((option) => option.value === normalizedRole)?.label;

  return dynamicLabel || ROLE_LABELS[normalizedRole] || normalizedRole;
}

export const ACCOUNT_FORM_FIELDS = [
  { name: "fullName", label: "Nome completo", required: true, section: { id: "personal", eyebrow: "Dados pessoais", title: "Identificacao do colaborador" } },
  { name: "displayName", label: "Nome de exibicao", required: true, section: { id: "personal", eyebrow: "Dados pessoais", title: "Identificacao do colaborador" } },
  { name: "email", label: "E-mail corporativo", type: "email", required: true, section: { id: "personal", eyebrow: "Dados pessoais", title: "Identificacao do colaborador" } },
  { name: "cpfDocument", label: "CPF ou RG", required: true, section: { id: "personal", eyebrow: "Dados pessoais", title: "Identificacao do colaborador" } },
  { name: "birthDate", label: "Data de nascimento", type: "date", section: { id: "personal", eyebrow: "Dados pessoais", title: "Identificacao do colaborador" } },
  { name: "phone", label: "Telefone", section: { id: "personal", eyebrow: "Dados pessoais", title: "Identificacao do colaborador" } },
  {
    name: "gender",
    label: "Genero",
    type: "select",
    options: [
      { label: "Nao informado", value: "Nao informado" },
      { label: "Feminino", value: "Feminino" },
      { label: "Masculino", value: "Masculino" },
      { label: "Outro", value: "Outro" },
    ],
    defaultValue: "Nao informado",
    section: { id: "personal", eyebrow: "Dados pessoais", title: "Identificacao do colaborador" },
  },
  { name: "temporaryPassword", label: "Senha provisoria", type: "password", section: { id: "system", eyebrow: "Sistema", title: "Acesso e permissoes" } },
  { name: "role", label: "Cargo", type: "select", options: ROLE_OPTIONS, required: true, section: { id: "system", eyebrow: "Sistema", title: "Acesso e permissoes" } },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Ativo", value: "ativo" },
      { label: "Desativado", value: "desativado" },
    ],
    defaultValue: "ativo",
    section: { id: "system", eyebrow: "Sistema", title: "Acesso e permissoes" },
  },
  { name: "profilePhotoUrl", label: "URL da foto de perfil", section: { id: "photo", eyebrow: "Foto", title: "Imagem do colaborador" } },
  { name: "profilePhotoDataUrl", label: "Upload de foto", type: "imageUpload", full: true, fallbackUrlField: "profilePhotoUrl", section: { id: "photo", eyebrow: "Foto", title: "Imagem do colaborador" } },
  { name: "avatarInitials", label: "Iniciais", maxLength: 3, section: { id: "photo", eyebrow: "Foto", title: "Imagem do colaborador" } },
  { name: "internalNotes", label: "Observacoes internas", type: "textarea", full: true, section: { id: "validation", eyebrow: "Validacoes", title: "Confirmacoes do cadastro" } },
];

export function buildAccountFormFields(roleOptions = ROLE_OPTIONS) {
  return ACCOUNT_FORM_FIELDS.map((field) =>
    field.name === "role" ? { ...field, options: roleOptions } : field
  );
}

export const PAGE_LABELS = {
  "action:create": "Acao: Criar registros",
  "action:delete": "Acao: Excluir registros",
  "action:download": "Acao: Baixar e exportar",
  "action:print": "Acao: Imprimir",
  "action:rbac.edit": "Acao: Editar Matriz RBAC",
  "action:update": "Acao: Editar registros",
  "action:upload": "Acao: Upload de arquivos",
  "action:user.protectedEdit": "Acao: Editar dados protegidos",
  accounts: "Gestao de Contas",
  acessorios: "Catalogo de Acessorios",
  checklists: "Checklists",
  clientes: "Clientes",
  configuracoes: "Configuracoes",
  estoque: "Contagem de Estoque",
  etiquetas: "Etiquetas",
  financeiro: "Financeiro",
  solicitacoes: "Solicitacoes",
  historico: "Historico Geral",
  home: "Home",
  insumos: "Catalogo de Insumos",
  machines: "Maquinas",
  opcoes: "Adicionar Opcoes",
  perfil: "Perfil",
  portfolios: "Portfolios",
  precos: "Precos",
  serviceOrders: "Consertos SLA",
  "module:accounts.rbac": "Modulo: Matriz RBAC",
  "module:insumos.recipes": "Modulo: Receitas",
  "module:labels.files": "Modulo: Arquivos de Etiquetas",
  "module:machines.configs": "Modulo: Configuracao de Maquina",
  "module:machines.wiki": "Modulo: Wiki Tecnica",
  "tab:machines.catalog": "Aba: Maquinas",
  "tab:machines.repairs": "Aba: Consertos em Maquinas",
  "section:insumos.cadastro": "Granular: Insumos / Cadastro",
  "section:insumos.precos": "Granular: Insumos / Precos",
  "section:insumos.estoque": "Granular: Insumos / Estoque",
  "section:insumos.impressao": "Granular: Insumos / Impressao",
  "section:solicitacoes.criacao": "Granular: Solicitacoes / Criacao",
  "section:solicitacoes.atendimento": "Granular: Solicitacoes / Atendimento",
  "section:solicitacoes.historico": "Granular: Solicitacoes / Historico",
  "section:solicitacoes.chat": "Granular: Solicitacoes / Chat",
  "field:insumos.custo": "Campo: Insumos / Custo",
  "field:insumos.margem": "Campo: Insumos / Margem",
  "field:accounts.permissoes": "Campo: Contas / Permissoes",
  "action:requests.attend": "Acao: Solicitações / Atender",
  "action:requests.reject": "Acao: Solicitações / Rejeitar",
  "action:requests.transfer": "Acao: Solicitações / Transferir",
  "action:requests.close": "Acao: Solicitações / Encerrar",
  vendas: "Vendas",
};

function buildInitials(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "US";
}

function countAccess(role, accessType) {
  const permissions = getRolePermissions(role);

  return ALL_PERMISSION_RESOURCES.filter((pageId) => permissions[pageId] === accessType).length;
}

export function buildAccountRows(accounts, roleOptions = ROLE_OPTIONS) {
  return accounts.map((account) => ({
    ...account,
    accessFullCount: countAccess(account.role, "AC"),
    accessHiddenCount: countAccess(account.role, "OC"),
    roleLabel: resolveRoleLabel(account.role, roleOptions),
  })).sort((first, second) => {
    if (first.status !== second.status) {
      return first.status === "ativo" ? -1 : 1;
    }

    return String(first.displayName).localeCompare(String(second.displayName));
  });
}

export function buildAccountMetrics(rows) {
  const activeRows = rows.filter((account) => account.status === "ativo");
  const inactiveRows = rows.filter((account) => account.status !== "ativo");
  const devRows = activeRows.filter((account) => ["DEV", "DON", "CEO"].includes(account.role));
  const fullAccessGrants = activeRows.reduce((total, account) => total + account.accessFullCount, 0);

  return [
    {
      id: "active",
      icon: "users",
      label: "Contas ativas",
      value: activeRows.length,
      detail: `${inactiveRows.length} desativadas`,
      tone: "blue",
    },
    {
      id: "admins",
      icon: "shield",
      label: "Admins totais",
      value: devRows.length,
      detail: "DEV/CEO ativos",
      tone: devRows.length > 2 ? "yellow" : "green",
    },
    {
      id: "grants",
      icon: "checkSquare",
      label: "Acessos completos",
      value: fullAccessGrants,
      detail: "soma por perfil ativo",
      tone: "green",
    },
    {
      id: "roles",
      icon: "layoutGrid",
      label: "Perfis usados",
      value: new Set(activeRows.map((account) => account.role)).size,
      detail: "cargos em operacao",
      tone: "red",
    },
  ];
}

export function filterAccountRows(rows, tabId, searchTerm = "") {
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const statusRows = tabId === "desativadas"
    ? rows.filter((account) => account.status !== "ativo")
    : rows.filter((account) => account.status === "ativo");

  if (!normalizedTerm) {
    return statusRows;
  }

  return statusRows.filter((account) =>
    [account.displayName, account.fullName, account.email, account.phone, account.role, account.roleLabel]
      .join(" ")
      .toLowerCase()
      .includes(normalizedTerm)
  );
}

export function buildRoleMatrix(roles = Object.keys(ROLE_PERMISSIONS), roleOptions = ROLE_OPTIONS) {
  return ALL_PERMISSION_RESOURCES.map((pageId) => ({
    pageId,
    pageLabel: PAGE_LABELS[pageId] || pageId,
    resourceType: pageId.includes(":") ? pageId.split(":")[0] : "pagina",
    permissions: roles.map((role) => {
      const rolePermissions = getRolePermissions(role);
      const access = rolePermissions[pageId] || "OC";

      return {
        access,
        accessLabel: getAccessLabel(access),
        role,
        roleLabel: resolveRoleLabel(role, roleOptions),
      };
    }),
  }));
}

export function buildRoleMatrixByScope(scope = "base", roles, roleOptions = ROLE_OPTIONS) {
  const granularPrefixes = ["section:", "field:", "action:requests."];
  const isGranularResource = (resourceId) => granularPrefixes.some((prefix) => resourceId.startsWith(prefix));

  return buildRoleMatrix(roles, roleOptions).filter((row) => scope === "granular"
    ? isGranularResource(row.pageId)
    : !isGranularResource(row.pageId)
  );
}

export function buildRoleSummary(role, roleOptions = ROLE_OPTIONS) {
  const permissions = getRolePermissions(role) || {};

  return {
    accessFullCount: countAccess(role, "AC"),
    accessHiddenCount: countAccess(role, "OC"),
    accessPartialCount: countAccess(role, "UP"),
    accessViewCount: countAccess(role, "VIS"),
    label: resolveRoleLabel(role, roleOptions),
    modules: ALL_PERMISSION_RESOURCES.map((pageId) => ({
      access: permissions[pageId] || "OC",
      accessLabel: getAccessLabel(permissions[pageId] || "OC"),
      pageId,
      pageLabel: PAGE_LABELS[pageId] || pageId,
    })),
    role,
  };
}

export function normalizeAccountPayload(payload, editingRecord) {
  const now = new Date().toISOString();
  const displayName = payload.displayName || payload.fullName || "Usuario";
  const passwordChanged = Boolean(payload.temporaryPassword) && payload.temporaryPassword !== editingRecord?.temporaryPassword;
  const normalizedPayload = {
    ...payload,
    avatarInitials: payload.avatarInitials || buildInitials(displayName),
    createdAt: editingRecord?.createdAt || now,
    firstLoginCompletedAt: passwordChanged ? "" : editingRecord?.firstLoginCompletedAt || "",
    inviteDispatches: [],
    lastLogin: editingRecord?.lastLogin || "",
    mustChangePassword: passwordChanged ? true : Boolean(editingRecord?.mustChangePassword),
    status: payload.status || "ativo",
    temporaryPassword: payload.temporaryPassword || editingRecord?.temporaryPassword || "",
  };

  if (payload.temporaryPassword) {
    normalizedPayload.password = payload.temporaryPassword;
  } else if (editingRecord?.password) {
    normalizedPayload.password = editingRecord.password;
  }

  return normalizedPayload;
}

export function validateAccountPayload(payload, snapshot, editingRecord) {
  if (!payload.fullName?.trim() || !payload.displayName?.trim()) {
    return "Informe nome completo e nome de exibicao.";
  }

  if (!payload.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Informe um e-mail corporativo valido.";
  }

  if (!editingRecord && !payload.temporaryPassword?.trim()) {
    return "Informe uma senha provisoria para o primeiro acesso.";
  }

  if (payload.temporaryPassword) {
    const passwordError = validatePasswordStrength(payload.temporaryPassword);

    if (passwordError) {
      return passwordError;
    }
  }

  if (!payload.cpfDocument?.trim()) {
    return "Informe CPF ou RG do colaborador.";
  }

  const duplicateEmail = (snapshot.accounts || []).some((account) =>
    account.id !== editingRecord?.id &&
    String(account.email || "").trim().toLowerCase() === payload.email.trim().toLowerCase()
  );

  if (duplicateEmail) {
    return "Ja existe uma conta com este e-mail.";
  }

  return "";
}
