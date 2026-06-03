export const OPTION_GROUPS = [
  "Marcas de Maquinas",
  "Categorias de Maquinas",
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
  "Categorias de Etiquetas",
  "Formatos de Arquivo",
  "Categorias Wiki",
  "Dificuldade Wiki",
  "Status Wiki",
  "Prioridades de Conserto",
  "Ferramentas e Itens",
  "Grupos de Opcoes",
];

export const OPTION_GROUP_CHOICES = OPTION_GROUPS.map((group) => ({
  label: group,
  value: group,
}));

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
