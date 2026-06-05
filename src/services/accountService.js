import {
  ALL_PERMISSION_RESOURCES,
  ALL_PAGES,
  ROLE_PERMISSIONS,
  getAccessLabel,
  getRolePermissions,
} from "./permissionService.js";

export const ACCOUNT_TABS = [
  { id: "ativas", label: "Ativas" },
  { id: "desativadas", label: "Desativadas" },
  { id: "matriz", label: "Matriz RBAC" },
];

export const ROLE_LABELS = {
  ADM: "Administrativo",
  CEO: "Dono",
  DEV: "Desenvolvedor",
  FIN: "Financeiro",
  TEC: "Tecnico",
  VEN: "Vendedor",
};

export const ROLE_OPTIONS = [
  { label: "Desenvolvedor", value: "DEV" },
  { label: "Dono", value: "CEO" },
  { label: "Vendedor", value: "VEN" },
  { label: "Administrativo", value: "ADM" },
  { label: "Tecnico", value: "TEC" },
  { label: "Financeiro", value: "FIN" },
];

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
  { name: "requestedByCollaborator", label: "Solicitado pelo colaborador?", type: "checkbox", defaultValue: false, section: { id: "validation", eyebrow: "Validacoes", title: "Confirmacoes do cadastro" } },
  { name: "termsAccepted", label: "Concordo com os termos de criacao", type: "checkbox", defaultValue: false, section: { id: "validation", eyebrow: "Validacoes", title: "Confirmacoes do cadastro" } },
  { name: "captchaAccepted", label: "Nao sou robo", type: "checkbox", defaultValue: false, section: { id: "validation", eyebrow: "Validacoes", title: "Confirmacoes do cadastro" } },
];

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

export function buildAccountRows(accounts) {
  return accounts.map((account) => ({
    ...account,
    accessFullCount: countAccess(account.role, "AC"),
    accessHiddenCount: countAccess(account.role, "OC"),
    roleLabel: ROLE_LABELS[account.role] || account.role,
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
  const devRows = activeRows.filter((account) => account.role === "DEV" || account.role === "CEO");
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

export function buildRoleMatrix() {
  const roles = Object.keys(ROLE_PERMISSIONS);

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
        roleLabel: ROLE_LABELS[role] || role,
      };
    }),
  }));
}

export function buildRoleSummary(role) {
  const permissions = getRolePermissions(role) || {};

  return {
    accessFullCount: countAccess(role, "AC"),
    accessHiddenCount: countAccess(role, "OC"),
    accessPartialCount: countAccess(role, "UP"),
    accessViewCount: countAccess(role, "VIS"),
    label: ROLE_LABELS[role] || role,
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
  const inviteDispatches = payload.requestedByCollaborator
    ? [
      { channel: "email", status: "simulado", target: payload.email || "" },
      { channel: "whatsapp", status: "simulado", target: payload.phone || "" },
    ]
    : editingRecord?.inviteDispatches || [];

  return {
    ...payload,
    avatarInitials: payload.avatarInitials || buildInitials(displayName),
    createdAt: editingRecord?.createdAt || now,
    firstLoginCompletedAt: passwordChanged ? "" : editingRecord?.firstLoginCompletedAt || "",
    inviteDispatches,
    lastLogin: editingRecord?.lastLogin || "",
    mustChangePassword: passwordChanged ? true : Boolean(editingRecord?.mustChangePassword),
    password: payload.temporaryPassword || editingRecord?.password || "1234",
    status: payload.status || "ativo",
    temporaryPassword: payload.temporaryPassword || editingRecord?.temporaryPassword || "",
  };
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

  if (!editingRecord && (!payload.termsAccepted || !payload.captchaAccepted)) {
    return "Confirme os termos de criacao e a validacao de seguranca.";
  }

  return "";
}
