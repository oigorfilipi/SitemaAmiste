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

const ROLE_PERMISSIONS = {
  DEV: ALL_PAGES.reduce((permissions, pageId) => ({ ...permissions, [pageId]: ACCESS.AC }), {}),
  CEO: {
    ...ALL_PAGES.reduce((permissions, pageId) => ({ ...permissions, [pageId]: ACCESS.AC }), {}),
    configuracoes: ACCESS.OC,
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
    historico: ACCESS.OC,
    configuracoes: ACCESS.OC,
    perfil: ACCESS.AC,
    precos: ACCESS.UP,
    estoque: ACCESS.UP,
    clientes: ACCESS.AC,
    opcoes: ACCESS.VIS,
    etiquetas: ACCESS.UP,
    accounts: ACCESS.OC,
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
    historico: ACCESS.OC,
    configuracoes: ACCESS.OC,
    perfil: ACCESS.AC,
    precos: ACCESS.UP,
    estoque: ACCESS.UP,
    clientes: ACCESS.AC,
    opcoes: ACCESS.VIS,
    etiquetas: ACCESS.UP,
    accounts: ACCESS.OC,
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
    historico: ACCESS.OC,
    configuracoes: ACCESS.OC,
    perfil: ACCESS.AC,
    precos: ACCESS.VIS,
    estoque: ACCESS.UP,
    clientes: ACCESS.VIS,
    opcoes: ACCESS.UP,
    etiquetas: ACCESS.UP,
    accounts: ACCESS.OC,
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
    historico: ACCESS.AC,
    configuracoes: ACCESS.OC,
    perfil: ACCESS.AC,
    precos: ACCESS.AC,
    estoque: ACCESS.AC,
    clientes: ACCESS.AC,
    opcoes: ACCESS.UP,
    etiquetas: ACCESS.UP,
    accounts: ACCESS.OC,
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

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.VEN;
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

export { ACCESS, ALL_PAGES, ROLE_PERMISSIONS };
