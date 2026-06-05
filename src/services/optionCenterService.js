import { OPTION_GROUPS } from "./optionService.js";
import { exportRecordsToCsv } from "./exportService.js";

const OPTION_EXPORT_COLUMNS = [
  { key: "group", label: "Grupo" },
  { key: "name", label: "Nome" },
  { key: "value", label: "Valor" },
];

const DEFAULT_GROUP_GUIDANCE = {
  description: "Lista reutilizavel para campos de selecao e organizacao interna do ERP.",
  usage: "Aparece apenas nos formularios que usam este grupo como fonte de opcoes.",
};
const HIDDEN_OPTION_GROUPS = new Set(["Categorias de Maquinas"]);

const OPTION_GROUP_GUIDANCE = {
  "Bebidas da Maquina": {
    description: "Bebidas que podem ser usadas na configuracao e preparacao das maquinas.",
    usage: "Aparece em Configuracao de Maquina e na secao Bebidas Habilitadas do Checklist.",
  },
  "Categorias de Acessorios": {
    description: "Categorias para organizar acessorios cadastrados.",
    usage: "Aparece no cadastro de Acessorios, Estoque, Precos e Checklist quando acessorios sao selecionados.",
  },
  "Categorias de Insumos": {
    description: "Categorias para separar insumos por tipo, linha ou uso.",
    usage: "Aparece no cadastro de Insumos, Estoque, Precos e Checklist.",
  },
  "Categorias de Maquinas": {
    description: "Grupo legado. As categorias principais de maquinas sao fixas no sistema.",
    usage: "Nao cria novas categorias da pagina Maquinas. Use apenas se algum cadastro legado ainda exigir este grupo.",
  },
  "Categorias Wiki": {
    description: "Categorias para classificar artigos, problemas e solucoes tecnicas.",
    usage: "Aparece na Wiki tecnica dentro da pagina Maquinas.",
  },
  "Coisas Necessarias": {
    description: "Itens operacionais que podem ser necessarios antes de uma instalacao.",
    usage: "Aparece na secao Preparacao e Testes do Checklist.",
  },
  Cores: {
    description: "Cores usadas em cadastros de acessorios ou itens fisicos.",
    usage: "Aparece no cadastro de Acessorios.",
  },
  "Dificuldade Wiki": {
    description: "Niveis de dificuldade para diagnosticos e solucoes tecnicas.",
    usage: "Aparece na Wiki tecnica dentro da pagina Maquinas.",
  },
  "Ferramentas e Itens": {
    description: "Lista auxiliar para ferramentas, itens de apoio e organizacao operacional.",
    usage: "Aparece em formularios que consomem listas operacionais auxiliares.",
  },
  "Ferramentas Necessarias": {
    description: "Ferramentas exigidas para instalacao, retirada, teste ou manutencao.",
    usage: "Aparece na secao Preparacao e Testes do Checklist.",
  },
  "Grupos de Opcoes": {
    description: "Referencia para organizar grupos de opcoes existentes.",
    usage: "Ajuda na administracao da propria pagina Adicionar Opcoes.",
  },
  "Marcas de Acessorios": {
    description: "Marcas disponiveis para acessorios cadastrados.",
    usage: "Aparece no cadastro de Acessorios.",
  },
  "Marcas de Insumos": {
    description: "Marcas disponiveis para insumos cadastrados.",
    usage: "Aparece no cadastro de Insumos.",
  },
  "Marcas de Maquinas": {
    description: "Marcas usadas para identificar modelos de maquinas.",
    usage: "Aparece no cadastro de Maquinas.",
  },
  "Meio de Atendimento": {
    description: "Formas de atendimento ou instalacao, como hidrica ou galao.",
    usage: "Aparece em Fichas Operacionais e fluxos derivados do Checklist.",
  },
  "Modalidades Comerciais": {
    description: "Tipos comerciais usados em propostas e contratos.",
    usage: "Aparece em Portfolios, Clientes e regras financeiras relacionadas.",
  },
  "Prioridades de Conserto": {
    description: "Niveis de prioridade para ordens de conserto.",
    usage: "Aparece em Consertos SLA dentro da pagina Maquinas.",
  },
  "Rede Hidrica": {
    description: "Valores de sim/nao para recursos hidricos, esgoto, vapor e compatibilidade.",
    usage: "Aparece em Maquinas, Clientes, Checklist e Fichas Operacionais.",
  },
  "Status Catalogo": {
    description: "Status operacional para itens cadastrados em catalogos.",
    usage: "Aparece em Maquinas, Insumos e Acessorios.",
  },
  "Status Checklist": {
    description: "Status usados para controlar o andamento dos checklists.",
    usage: "Aparece na pagina Checklist.",
  },
  "Status Cliente": {
    description: "Status usados para classificar clientes e contratos.",
    usage: "Aparece no cadastro de Clientes.",
  },
  "Status Ficha": {
    description: "Status das fichas de instalacao e retirada.",
    usage: "Aparece em Portfolios e Fichas Operacionais.",
  },
  "Status Pagamento": {
    description: "Status financeiro para pagamentos e recebimentos.",
    usage: "Aparece em Vendas e Financeiro.",
  },
  "Status Proposta": {
    description: "Status da negociacao comercial.",
    usage: "Aparece no Editor de Proposta em Portfolios.",
  },
  "Status Wiki": {
    description: "Status de andamento dos registros da Wiki.",
    usage: "Aparece na Wiki tecnica dentro da pagina Maquinas.",
  },
  Tamanhos: {
    description: "Tamanhos usados em acessorios e itens fisicos.",
    usage: "Aparece no cadastro de Acessorios.",
  },
  "Tags de Insumos": {
    description: "Tags usadas para agrupar insumos por familia operacional.",
    usage: "Aparece em Insumos, Checklist, Precos e Estoque.",
  },
  Tecnicos: {
    description: "Nomes de tecnicos responsaveis por atendimentos.",
    usage: "Aparece em Checklists, Fichas Operacionais e Consertos SLA.",
  },
  "Tipos de Cobranca": {
    description: "Tipos de cobranca aplicados em fichas e contratos.",
    usage: "Aparece em Fichas Operacionais e Financeiro.",
  },
  "Tipos de Contrato": {
    description: "Modelos de contrato vinculados ao cliente.",
    usage: "Aparece no cadastro de Clientes e alimenta propostas/fichas.",
  },
  "Tipos de Ficha": {
    description: "Tipos de documento operacional, como instalacao e retirada.",
    usage: "Aparece em Fichas Operacionais.",
  },
  "Tipos de Servico": {
    description: "Tipos de servico usados na operacao.",
    usage: "Aparece em Checklists e Ordens de Servico.",
  },
  "Unidades de Produto": {
    description: "Unidades de medida para produtos e insumos.",
    usage: "Aparece no cadastro de Insumos, Estoque, Precos e Vendas.",
  },
  Voltagens: {
    description: "Voltagens aceitas pelos equipamentos.",
    usage: "Aparece no cadastro de Maquinas, Checklist e Fichas Operacionais.",
  },
};

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function getOptionGroupGuidance(group) {
  return OPTION_GROUP_GUIDANCE[group] || DEFAULT_GROUP_GUIDANCE;
}

export function buildOptionFeedbackMessage(group, editing = false) {
  const guidance = getOptionGroupGuidance(group);
  const action = editing ? "atualizada" : "cadastrada";

  return `Opcao ${action} com sucesso. Ela agora ficara disponivel em: ${guidance.usage}`;
}

function uniqueGroups(options) {
  return Array.from(new Set([
    ...OPTION_GROUPS,
    ...options.map((option) => option.group).filter(Boolean),
  ])).filter((group) => !HIDDEN_OPTION_GROUPS.has(group));
}

export function buildOptionGroups(options) {
  return uniqueGroups(options)
    .map((group) => {
      const groupOptions = options
        .filter((option) => option.group === group)
        .sort((first, second) => String(first.name).localeCompare(String(second.name)));

      return {
        id: group,
        label: group,
        count: groupOptions.length,
        description: getOptionGroupGuidance(group).description,
        empty: groupOptions.length === 0,
        options: groupOptions,
        usage: getOptionGroupGuidance(group).usage,
      };
    })
    .sort((first, second) => {
      if (first.empty !== second.empty) {
        return first.empty ? 1 : -1;
      }

      return first.label.localeCompare(second.label);
    });
}

export function buildOptionMetrics(options) {
  const groups = buildOptionGroups(options);
  const emptyGroups = groups.filter((group) => group.empty);
  const largestGroup = groups.reduce((currentLargest, group) =>
    group.count > currentLargest.count ? group : currentLargest,
  { count: 0, label: "-" });

  return [
    {
      id: "groups",
      icon: "layoutGrid",
      label: "Grupos",
      value: groups.length,
      detail: "listas disponiveis",
      tone: "blue",
    },
    {
      id: "options",
      icon: "plus",
      label: "Opcoes",
      value: options.length,
      detail: "valores cadastrados",
      tone: "green",
    },
    {
      id: "empty",
      icon: "archive",
      label: "Grupos vazios",
      value: emptyGroups.length,
      detail: "sem valores locais",
      tone: emptyGroups.length ? "yellow" : "green",
    },
    {
      id: "largest",
      icon: "gauge",
      label: "Maior grupo",
      value: largestGroup.count,
      detail: largestGroup.label,
      tone: "red",
    },
  ];
}

export function filterOptionGroups(groups, searchTerm) {
  const normalizedTerm = normalizeText(searchTerm);

  if (!normalizedTerm) {
    return groups;
  }

  return groups.filter((group) =>
    [group.label, ...group.options.map((option) => `${option.name} ${option.value}`)]
      .join(" ")
      .toLowerCase()
      .includes(normalizedTerm)
  );
}

export function validateOptionPayload(payload, options, editingRecord) {
  const group = String(payload.group || "").trim();
  const value = String(payload.value || "").trim();

  if (!group || !value) {
    return "Grupo e valor sao obrigatorios.";
  }

  const duplicated = options.some((option) =>
    option.id !== editingRecord?.id &&
    normalizeText(option.group) === normalizeText(group) &&
    normalizeText(option.value) === normalizeText(value)
  );

  if (duplicated) {
    return `Opcao duplicada no grupo ${group}.`;
  }

  return "";
}

export function buildOptionPayload(payload) {
  return {
    ...payload,
    name: String(payload.name || payload.value || "").trim(),
    value: String(payload.value || payload.name || "").trim(),
  };
}

export function exportOptions(options, filename = "opcoes-do-sistema") {
  exportRecordsToCsv({
    columns: OPTION_EXPORT_COLUMNS,
    filename,
    records: options,
    snapshot: {},
  });
}
