const ACCESS = {
  AC: "AC",
  VIS: "VIS",
  UP: "UP",
  OC: "OC",
};

const ALL_PAGES = [
  "home",
  "checklists",
  "serviceOrders",
  "machines",
  "insumos",
  "acessorios",
  "portfolios",
  "vendas",
  "financeiro",
  "solicitacoes",
  "historico",
  "configuracoes",
  "perfil",
  "precos",
  "estoque",
  "clientes",
  "opcoes",
  "etiquetas",
  "accounts",
];

const INTERNAL_MODULES = [
  "tab:machines.catalog",
  "tab:machines.repairs",
  "module:machines.configs",
  "module:machines.wiki",
  "module:insumos.recipes",
  "module:labels.files",
  "module:accounts.rbac",
];

const GRANULAR_RESOURCES = [
  "section:insumos.cadastro",
  "section:insumos.precos",
  "section:insumos.estoque",
  "section:insumos.impressao",
  "section:solicitacoes.criacao",
  "section:solicitacoes.atendimento",
  "section:solicitacoes.historico",
  "section:solicitacoes.chat",
  "field:insumos.custo",
  "field:insumos.margem",
  "field:accounts.permissoes",
  "action:requests.attend",
  "action:requests.reject",
  "action:requests.transfer",
  "action:requests.close",
];

const ACTION_RESOURCES = [
  "action:create",
  "action:update",
  "action:delete",
  "action:upload",
  "action:download",
  "action:print",
  "action:rbac.edit",
  "action:user.protectedEdit",
];

const ALL_PERMISSION_RESOURCES = [...ALL_PAGES, ...INTERNAL_MODULES, ...GRANULAR_RESOURCES, ...ACTION_RESOURCES];
const PERMISSION_OVERRIDE_KEY = "amiste_erp_permission_overrides_v1";

const ROLE_PERMISSIONS = {
  DEV: ALL_PERMISSION_RESOURCES.reduce((permissions, pageId) => ({ ...permissions, [pageId]: ACCESS.AC }), {}),
  CEO: {
    ...ALL_PERMISSION_RESOURCES.reduce((permissions, pageId) => ({ ...permissions, [pageId]: ACCESS.AC }), {}),
    configuracoes: ACCESS.OC,
    "action:rbac.edit": ACCESS.VIS,
  },
  VEN: {
    home: ACCESS.AC,
    checklists: ACCESS.AC,
    serviceOrders: ACCESS.OC,
    machines: ACCESS.AC,
    insumos: ACCESS.VIS,
    acessorios: ACCESS.VIS,
    portfolios: ACCESS.AC,
    vendas: ACCESS.AC,
    financeiro: ACCESS.VIS,
    solicitacoes: ACCESS.AC,
    historico: ACCESS.OC,
    configuracoes: ACCESS.OC,
    perfil: ACCESS.AC,
    precos: ACCESS.UP,
    estoque: ACCESS.UP,
    clientes: ACCESS.AC,
    opcoes: ACCESS.VIS,
    etiquetas: ACCESS.UP,
    accounts: ACCESS.OC,
    "action:create": ACCESS.AC,
    "action:update": ACCESS.AC,
    "action:delete": ACCESS.UP,
    "action:upload": ACCESS.UP,
    "action:download": ACCESS.UP,
    "action:print": ACCESS.UP,
    "action:rbac.edit": ACCESS.OC,
    "action:user.protectedEdit": ACCESS.OC,
  },
  ADM: {
    home: ACCESS.AC,
    checklists: ACCESS.AC,
    serviceOrders: ACCESS.OC,
    machines: ACCESS.VIS,
    insumos: ACCESS.AC,
    acessorios: ACCESS.AC,
    portfolios: ACCESS.VIS,
    vendas: ACCESS.AC,
    financeiro: ACCESS.OC,
    solicitacoes: ACCESS.AC,
    historico: ACCESS.OC,
    configuracoes: ACCESS.OC,
    perfil: ACCESS.AC,
    precos: ACCESS.UP,
    estoque: ACCESS.UP,
    clientes: ACCESS.AC,
    opcoes: ACCESS.VIS,
    etiquetas: ACCESS.UP,
    accounts: ACCESS.OC,
    "action:create": ACCESS.AC,
    "action:update": ACCESS.AC,
    "action:delete": ACCESS.UP,
    "action:upload": ACCESS.UP,
    "action:download": ACCESS.UP,
    "action:print": ACCESS.UP,
    "action:rbac.edit": ACCESS.OC,
    "action:user.protectedEdit": ACCESS.OC,
  },
  TEC: {
    home: ACCESS.AC,
    checklists: ACCESS.AC,
    serviceOrders: ACCESS.AC,
    machines: ACCESS.AC,
    insumos: ACCESS.VIS,
    acessorios: ACCESS.VIS,
    portfolios: ACCESS.OC,
    vendas: ACCESS.OC,
    financeiro: ACCESS.OC,
    solicitacoes: ACCESS.AC,
    historico: ACCESS.OC,
    configuracoes: ACCESS.OC,
    perfil: ACCESS.AC,
    precos: ACCESS.VIS,
    estoque: ACCESS.UP,
    clientes: ACCESS.VIS,
    opcoes: ACCESS.UP,
    etiquetas: ACCESS.UP,
    accounts: ACCESS.OC,
    "action:create": ACCESS.AC,
    "action:update": ACCESS.UP,
    "action:delete": ACCESS.OC,
    "action:upload": ACCESS.UP,
    "action:download": ACCESS.UP,
    "action:print": ACCESS.UP,
    "action:rbac.edit": ACCESS.OC,
    "action:user.protectedEdit": ACCESS.OC,
  },
  FIN: {
    home: ACCESS.AC,
    checklists: ACCESS.VIS,
    serviceOrders: ACCESS.OC,
    machines: ACCESS.AC,
    insumos: ACCESS.AC,
    acessorios: ACCESS.AC,
    portfolios: ACCESS.OC,
    vendas: ACCESS.VIS,
    financeiro: ACCESS.AC,
    solicitacoes: ACCESS.AC,
    historico: ACCESS.AC,
    configuracoes: ACCESS.OC,
    perfil: ACCESS.AC,
    precos: ACCESS.AC,
    estoque: ACCESS.AC,
    clientes: ACCESS.AC,
    opcoes: ACCESS.UP,
    etiquetas: ACCESS.UP,
    accounts: ACCESS.OC,
    "action:create": ACCESS.AC,
    "action:update": ACCESS.AC,
    "action:delete": ACCESS.UP,
    "action:upload": ACCESS.UP,
    "action:download": ACCESS.UP,
    "action:print": ACCESS.UP,
    "action:rbac.edit": ACCESS.OC,
    "action:user.protectedEdit": ACCESS.OC,
  },
};

const SCOPED_COLLECTION_PERMISSIONS = {
  inventory: {
    DEV: { machines: ACCESS.AC, supplies: ACCESS.AC, accessories: ACCESS.AC },
    CEO: { machines: ACCESS.AC, supplies: ACCESS.AC, accessories: ACCESS.AC },
    VEN: { machines: ACCESS.AC, supplies: ACCESS.VIS, accessories: ACCESS.VIS },
    ADM: { machines: ACCESS.VIS, supplies: ACCESS.AC, accessories: ACCESS.AC },
    TEC: { machines: ACCESS.AC, supplies: ACCESS.VIS, accessories: ACCESS.VIS },
    FIN: { machines: ACCESS.AC, supplies: ACCESS.AC, accessories: ACCESS.AC },
  },
  pricing: {
    DEV: { machines: ACCESS.AC, supplies: ACCESS.AC, accessories: ACCESS.AC },
    CEO: { machines: ACCESS.AC, supplies: ACCESS.AC, accessories: ACCESS.AC },
    VEN: { machines: ACCESS.AC, supplies: ACCESS.VIS, accessories: ACCESS.VIS },
    ADM: { machines: ACCESS.VIS, supplies: ACCESS.AC, accessories: ACCESS.AC },
    TEC: { machines: ACCESS.VIS, supplies: ACCESS.VIS, accessories: ACCESS.VIS },
    FIN: { machines: ACCESS.AC, supplies: ACCESS.AC, accessories: ACCESS.AC },
  },
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readPermissionOverrides() {
  if (!canUseLocalStorage()) {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(PERMISSION_OVERRIDE_KEY) || "{}");
  } catch {
    window.localStorage.removeItem(PERMISSION_OVERRIDE_KEY);
    return {};
  }
}

function emitPermissionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("amiste-permissions-change"));
  }
}

function resolveFallbackAccess(role, resourceId, permissions) {
  if (resourceId.startsWith("tab:machines") || resourceId.startsWith("module:machines")) {
    return permissions.machines || ACCESS.OC;
  }

  if (resourceId.startsWith("module:insumos")) {
    return permissions.insumos || ACCESS.OC;
  }

  if (resourceId.startsWith("module:labels")) {
    return permissions.etiquetas || ACCESS.OC;
  }

  if (resourceId.startsWith("module:accounts")) {
    return permissions.accounts || ACCESS.OC;
  }

  if (resourceId.startsWith("section:solicitacoes") || resourceId.startsWith("action:requests")) {
    return permissions.solicitacoes || ACCESS.OC;
  }

  if (resourceId.startsWith("section:insumos") || resourceId.startsWith("field:insumos")) {
    return permissions.insumos || ACCESS.OC;
  }

  if (resourceId.startsWith("field:accounts")) {
    return permissions.accounts || ACCESS.OC;
  }

  if (resourceId === "action:rbac.edit") {
    return role === "DEV" ? ACCESS.AC : ACCESS.OC;
  }

  if (resourceId === "action:user.protectedEdit") {
    return role === "DEV" || role === "CEO" ? ACCESS.AC : ACCESS.OC;
  }

  if (resourceId.startsWith("action:")) {
    return role === "DEV" || role === "CEO" ? ACCESS.AC : ACCESS.UP;
  }

  return ACCESS.OC;
}

function normalizeRolePermissions(role, permissions = {}) {
  return ALL_PERMISSION_RESOURCES.reduce((normalized, resourceId) => {
    normalized[resourceId] = permissions[resourceId] || resolveFallbackAccess(role, resourceId, permissions);
    return normalized;
  }, {});
}

export function getRolePermissions(role) {
  const normalizedRole = ROLE_PERMISSIONS[role] ? role : "VEN";
  const basePermissions = normalizeRolePermissions(normalizedRole, ROLE_PERMISSIONS[normalizedRole]);
  const overrides = readPermissionOverrides()[normalizedRole] || {};

  return normalizeRolePermissions(normalizedRole, {
    ...basePermissions,
    ...overrides,
  });
}

export function getPageAccess(role, pageId) {
  return getRolePermissions(role)[pageId] || ACCESS.OC;
}

export function canAccessPage(role, pageId) {
  return getPageAccess(role, pageId) !== ACCESS.OC;
}

export function canMutatePage(role, pageId) {
  return getPageAccess(role, pageId) === ACCESS.AC;
}

export function getScopedCollectionAccess(role, scope, collectionName) {
  const rolePermissions = SCOPED_COLLECTION_PERMISSIONS[scope]?.[role] || SCOPED_COLLECTION_PERMISSIONS[scope]?.VEN;
  return rolePermissions?.[collectionName] || ACCESS.OC;
}

export function updateRolePermission(role, resourceId, access) {
  if (!ROLE_PERMISSIONS[role] || !ALL_PERMISSION_RESOURCES.includes(resourceId) || !ACCESS[access]) {
    return getRolePermissions(role);
  }

  if (!canUseLocalStorage()) {
    return getRolePermissions(role);
  }

  const overrides = readPermissionOverrides();
  const nextOverrides = {
    ...overrides,
    [role]: {
      ...(overrides[role] || {}),
      [resourceId]: access,
    },
  };

  window.localStorage.setItem(PERMISSION_OVERRIDE_KEY, JSON.stringify(nextOverrides));
  emitPermissionChange();

  return getRolePermissions(role);
}

export function resetRolePermissionOverrides() {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(PERMISSION_OVERRIDE_KEY);
    emitPermissionChange();
  }
}

export function filterNavigationByRole(items, role) {
  return items.filter((item) => canAccessPage(role, item.id));
}

export function filterQuickAccessByRole(items, role) {
  return items.filter((item) => canAccessPage(role, item.pageId));
}

export function getAccessLabel(access) {
  const labels = {
    AC: "Acesso completo",
    VIS: "Visualizacao",
    UP: "Uso parcial",
    OC: "Oculto",
  };

  return labels[access] || labels.OC;
}

export { ACCESS, ALL_PAGES, ALL_PERMISSION_RESOURCES, ROLE_PERMISSIONS };
