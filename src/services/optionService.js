export const OPTION_GROUPS = [
  "Marcas de Maquinas",
  "Voltagens",
  "Rede Hidrica",
  "Status Catalogo",
  "Marcas de Insumos",
  "Categorias de Insumos",
  "Unidades de Produto",
  "Marcas de Acessorios",
  "Categorias de Acessorios",
  "Cores",
  "Tamanhos",
  "Tipos de Contrato",
  "Status Cliente",
  "Tipos de Servico",
  "Status Checklist",
  "Tecnicos",
  "Modalidades Comerciais",
  "Status Proposta",
  "Tipos de Ficha",
  "Status Ficha",
  "Meio de Atendimento",
  "Tipos de Cobranca",
  "Status Pagamento",
  "Categorias Wiki",
  "Dificuldade Wiki",
  "Status Wiki",
  "Prioridades de Conserto",
  "Ferramentas Necessarias",
  "Coisas Necessarias",
  "Bebidas da Maquina",
  "Tags de Insumos",
  "Funcoes",
];

export const FIXED_OPTION_GROUPS = [
  "Dificuldade Wiki",
  "Meio de Atendimento",
  "Modalidades Comerciais",
  "Prioridades de Conserto",
  "Rede Hidrica",
  "Status Catalogo",
  "Status Checklist",
  "Status Cliente",
  "Status Ficha",
  "Status Pagamento",
  "Status Proposta",
  "Status Wiki",
  "Tipos de Contrato",
  "Tipos de Ficha",
  "Voltagens",
];

export const CONFIGURABLE_OPTION_GROUPS = OPTION_GROUPS.filter((group) => !FIXED_OPTION_GROUPS.includes(group));

export const OPTION_GROUP_CHOICES = CONFIGURABLE_OPTION_GROUPS.map((group) => ({
  label: group,
  value: group,
}));

export function isFixedOptionGroup(groupName) {
  return FIXED_OPTION_GROUPS.includes(groupName);
}

function normalizeOption(option) {
  const value = option.value || option.name;

  return {
    label: option.name || value,
    value,
  };
}

function dedupeOptions(options) {
  const seen = new Set();

  return options.filter((option) => {
    if (!option.value || seen.has(option.value)) {
      return false;
    }

    seen.add(option.value);
    return true;
  });
}

export function buildSelectOptionsFromGroup(snapshot, groupName, fallbackOptions = []) {
  const dynamicOptions = (snapshot.options || [])
    .filter((option) => option.group === groupName)
    .sort((first, second) => String(first.name).localeCompare(String(second.name)))
    .map(normalizeOption);

  /* --- SECAO: FALLBACK DE PARAMETROS ---
   * Os dropdowns continuam operacionais mesmo quando o banco local antigo ainda
   * nao recebeu os novos seeds de opcoes.
   */
  return dedupeOptions([...dynamicOptions, ...fallbackOptions]);
}
