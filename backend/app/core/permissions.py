ACCESS = {
    "AC": "AC",
    "VIS": "VIS",
    "UP": "UP",
    "OC": "OC",
}

ALL_PAGES = [
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
]

ACTION_RESOURCES = [
    "action:create",
    "action:update",
    "action:delete",
    "action:upload",
    "action:download",
    "action:print",
    "action:rbac.edit",
    "action:user.protectedEdit",
]

ALL_PERMISSION_RESOURCES = [
    *ALL_PAGES,
    "tab:machines.catalog",
    "tab:machines.repairs",
    "module:machines.configs",
    "module:machines.wiki",
    "module:insumos.recipes",
    "module:labels.files",
    "module:accounts.rbac",
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
    *ACTION_RESOURCES,
]

ROLE_PERMISSIONS = {
    "DEV": {resource: ACCESS["AC"] for resource in ALL_PERMISSION_RESOURCES},
    "DON": {
        **{resource: ACCESS["AC"] for resource in ALL_PERMISSION_RESOURCES},
        "configuracoes": ACCESS["OC"],
        "action:rbac.edit": ACCESS["VIS"],
    },
    "CEO": {
        **{resource: ACCESS["AC"] for resource in ALL_PERMISSION_RESOURCES},
        "configuracoes": ACCESS["OC"],
        "action:rbac.edit": ACCESS["VIS"],
    },
    "VEN": {
        "home": ACCESS["AC"], "checklists": ACCESS["AC"], "serviceOrders": ACCESS["OC"], "machines": ACCESS["AC"],
        "insumos": ACCESS["VIS"], "acessorios": ACCESS["VIS"], "portfolios": ACCESS["AC"], "vendas": ACCESS["AC"],
        "financeiro": ACCESS["VIS"], "solicitacoes": ACCESS["AC"], "historico": ACCESS["OC"], "configuracoes": ACCESS["OC"], "perfil": ACCESS["AC"],
        "precos": ACCESS["UP"], "estoque": ACCESS["UP"], "clientes": ACCESS["AC"], "opcoes": ACCESS["VIS"],
        "etiquetas": ACCESS["UP"], "accounts": ACCESS["OC"], "action:create": ACCESS["AC"], "action:update": ACCESS["AC"],
        "action:delete": ACCESS["UP"], "action:upload": ACCESS["UP"], "action:download": ACCESS["UP"],
        "action:print": ACCESS["UP"], "action:rbac.edit": ACCESS["OC"], "action:user.protectedEdit": ACCESS["OC"],
    },
    "ADM": {
        "home": ACCESS["AC"], "checklists": ACCESS["AC"], "serviceOrders": ACCESS["OC"], "machines": ACCESS["VIS"],
        "insumos": ACCESS["AC"], "acessorios": ACCESS["AC"], "portfolios": ACCESS["VIS"], "vendas": ACCESS["AC"],
        "financeiro": ACCESS["OC"], "solicitacoes": ACCESS["AC"], "historico": ACCESS["OC"], "configuracoes": ACCESS["OC"], "perfil": ACCESS["AC"],
        "precos": ACCESS["UP"], "estoque": ACCESS["UP"], "clientes": ACCESS["AC"], "opcoes": ACCESS["VIS"],
        "etiquetas": ACCESS["UP"], "accounts": ACCESS["OC"], "action:create": ACCESS["AC"], "action:update": ACCESS["AC"],
        "action:delete": ACCESS["UP"], "action:upload": ACCESS["UP"], "action:download": ACCESS["UP"],
        "action:print": ACCESS["UP"], "action:rbac.edit": ACCESS["OC"], "action:user.protectedEdit": ACCESS["OC"],
    },
    "TEC": {
        "home": ACCESS["AC"], "checklists": ACCESS["AC"], "serviceOrders": ACCESS["AC"], "machines": ACCESS["AC"],
        "insumos": ACCESS["VIS"], "acessorios": ACCESS["VIS"], "portfolios": ACCESS["OC"], "vendas": ACCESS["OC"],
        "financeiro": ACCESS["OC"], "solicitacoes": ACCESS["AC"], "historico": ACCESS["OC"], "configuracoes": ACCESS["OC"], "perfil": ACCESS["AC"],
        "precos": ACCESS["VIS"], "estoque": ACCESS["UP"], "clientes": ACCESS["VIS"], "opcoes": ACCESS["UP"],
        "etiquetas": ACCESS["UP"], "accounts": ACCESS["OC"], "action:create": ACCESS["AC"], "action:update": ACCESS["UP"],
        "action:delete": ACCESS["OC"], "action:upload": ACCESS["UP"], "action:download": ACCESS["UP"],
        "action:print": ACCESS["UP"], "action:rbac.edit": ACCESS["OC"], "action:user.protectedEdit": ACCESS["OC"],
    },
    "FIN": {
        "home": ACCESS["AC"], "checklists": ACCESS["VIS"], "serviceOrders": ACCESS["OC"], "machines": ACCESS["AC"],
        "insumos": ACCESS["AC"], "acessorios": ACCESS["AC"], "portfolios": ACCESS["OC"], "vendas": ACCESS["VIS"],
        "financeiro": ACCESS["AC"], "solicitacoes": ACCESS["AC"], "historico": ACCESS["AC"], "configuracoes": ACCESS["OC"], "perfil": ACCESS["AC"],
        "precos": ACCESS["AC"], "estoque": ACCESS["AC"], "clientes": ACCESS["AC"], "opcoes": ACCESS["UP"],
        "etiquetas": ACCESS["UP"], "accounts": ACCESS["OC"], "action:create": ACCESS["AC"], "action:update": ACCESS["AC"],
        "action:delete": ACCESS["UP"], "action:upload": ACCESS["UP"], "action:download": ACCESS["UP"],
        "action:print": ACCESS["UP"], "action:rbac.edit": ACCESS["OC"], "action:user.protectedEdit": ACCESS["OC"],
    },
}

COLLECTION_PAGE_MAP = {
    "accounts": "accounts",
    "accountRequests": "solicitacoes",
    "systemSettings": "accounts",
    "accessories": "acessorios",
    "checklists": "checklists",
    "clients": "clientes",
    "history": "historico",
    "inventoryCounts": "estoque",
    "inventoryLocations": "estoque",
    "labels": "etiquetas",
    "machineConfigs": "machines",
    "machines": "machines",
    "options": "opcoes",
    "payables": "financeiro",
    "proposals": "portfolios",
    "receivables": "financeiro",
    "recipes": "insumos",
    "repairOrders": "serviceOrders",
    "sales": "vendas",
    "serviceSheets": "portfolios",
    "supplies": "insumos",
    "wikiSolutions": "machines",
}


def get_role_permissions(role: str) -> dict[str, str]:
    return ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["VEN"])


def get_page_access(role: str, page_id: str) -> str:
    return get_role_permissions(role).get(page_id, ACCESS["OC"])


def can_access_page(role: str, page_id: str) -> bool:
    return get_page_access(role, page_id) != ACCESS["OC"]


def can_perform_action(role: str, action_id: str) -> bool:
    return get_role_permissions(role).get(action_id, ACCESS["OC"]) in {ACCESS["AC"], ACCESS["UP"]}


def get_collection_page(collection_name: str) -> str:
    return COLLECTION_PAGE_MAP.get(collection_name, "home")
