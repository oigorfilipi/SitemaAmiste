import { validateChecklistPayload } from "../../services/checklistService.js";
import {
  validateAccessoryPayload,
  validateClientPayload,
  validateMachinePayload,
  validateOptionPayload,
  validateSupplyPayload,
} from "../../services/formValidationService.js";
import { OPTION_GROUP_CHOICES } from "../../services/optionService.js";

const statusOptions = [
  { label: "Ativo", value: "ativo" },
  { label: "Pedir", value: "pedir" },
  { label: "Manutencao", value: "manutencao" },
  { label: "Cancelado", value: "cancelado" },
];

const checklistStatusOptions = [
  { label: "Pendente", value: "pendente" },
  { label: "Rascunho", value: "rascunho" },
  { label: "Finalizado", value: "finalizado" },
  { label: "Abandonado", value: "abandonado" },
];

const proposalStatusOptions = [
  { label: "Aguardando", value: "aguardando" },
  { label: "Concluido", value: "concluido" },
  { label: "Rascunho", value: "rascunho" },
  { label: "Cancelado", value: "cancelado" },
  { label: "Abandonado", value: "abandonado" },
];

const paymentStatusOptions = [
  { label: "Pago", value: "pago" },
  { label: "Pendente", value: "pendente" },
  { label: "Atrasado", value: "atrasado" },
];

const wikiStatusOptions = [
  { label: "Resolvido", value: "resolvido" },
  { label: "Em Andamento", value: "andamento" },
  { label: "Sem Solucao", value: "abandonado" },
];

function resolveName(snapshot, collection, id) {
  return snapshot[collection]?.find((record) => record.id === id)?.name || "-";
}

const sections = {
  commercial: { id: "commercial", eyebrow: "Comercial", title: "Precificacao e condicoes" },
  contact: { id: "contact", eyebrow: "Contato", title: "Contato e relacionamento" },
  contract: { id: "contract", eyebrow: "Contrato", title: "Contrato e vinculos" },
  identity: { id: "identity", eyebrow: "Identificacao", title: "Identificacao do cadastro" },
  inventory: { id: "inventory", eyebrow: "Estoque", title: "Estoque e reposicao" },
  operation: { id: "operation", eyebrow: "Operacao", title: "Uso operacional" },
  pricing: { id: "pricing", eyebrow: "Precos", title: "Custos e precificacao" },
  technical: { id: "technical", eyebrow: "Tecnico", title: "Caracteristicas tecnicas" },
};

function findMachine(snapshot, machineId) {
  return snapshot.machines?.find((machine) => machine.id === machineId) || {};
}

function resolveClientContractValue(formData, snapshot) {
  const machine = findMachine(snapshot, formData.machineId);

  if (formData.contractType === "Venda") {
    return machine.priceSale || "";
  }

  if (formData.contractType === "Aluguel" || formData.contractType === "Comodato") {
    return machine.priceRent || "";
  }

  return "";
}

function formatCurrencySummary(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value || 0));
}

function inventorySummary(record) {
  return `Estoque ${record.stock || 0} | minimo ${record.minStock || 0} | status ${record.status || "-"}.`;
}

export const moduleConfigs = {
  machines: {
    title: "Catalogo de Maquinas",
    description: "Gerencie os modelos e equipamentos disponiveis.",
    actionLabel: "Nova Maquina",
    collection: "machines",
    layout: "cards",
    searchPlaceholder: "Buscar por maquina, marca ou categoria",
    formTitle: "Cadastro de Maquina",
    formDescription: "Parametros tecnicos, estoque e precificacao base do equipamento.",
    validate: validateMachinePayload,
    smartSummary: (record) =>
      `${inventorySummary(record)} Aluguel ${formatCurrencySummary(record.priceRent)} | venda ${formatCurrencySummary(record.priceSale)}.`,
    card: {
      title: { key: "name" },
      subtitle: { key: "brand" },
      statusKey: "status",
      meta: [
        { key: "category", label: "Categoria" },
        { key: "stock", label: "Estoque" },
        { key: "priceRent", label: "Aluguel", type: "currency" },
        { key: "priceSale", label: "Venda", type: "currency" },
      ],
    },
    fields: [
      { name: "name", label: "Nome da maquina", required: true, section: sections.identity },
      { name: "brand", label: "Marca", type: "select", optionGroup: "Marcas de Maquinas", required: true, section: sections.identity },
      { name: "category", label: "Categoria", type: "select", optionGroup: "Categorias de Maquinas", required: true, section: sections.identity },
      { name: "status", label: "Status", type: "select", optionGroup: "Status Catalogo", options: statusOptions, defaultValue: "ativo", section: sections.identity },
      { name: "voltage", label: "Voltagem", type: "select", optionGroup: "Voltagens", options: [{ label: "110v", value: "110v" }, { label: "220v", value: "220v" }, { label: "Bivolt", value: "Bivolt" }], section: sections.technical },
      { name: "amperage", label: "Amperagem", type: "number", defaultValue: 10, min: 0, section: sections.technical },
      { name: "hydraulic", label: "Rede hidrica", type: "select", optionGroup: "Rede Hidrica", options: [{ label: "Sim", value: "Sim" }, { label: "Nao", value: "Nao" }], defaultValue: "Nao", section: sections.technical },
      { name: "sewer", label: "Esgoto", type: "select", optionGroup: "Rede Hidrica", options: [{ label: "Sim", value: "Sim" }, { label: "Nao", value: "Nao" }], defaultValue: "Nao", section: sections.technical },
      { name: "steam", label: "Vapor", type: "select", optionGroup: "Rede Hidrica", options: [{ label: "Sim", value: "Sim" }, { label: "Nao", value: "Nao" }], defaultValue: "Nao", section: sections.technical },
      { name: "paymentSystem", label: "Sistema de pagamento", type: "select", optionGroup: "Rede Hidrica", options: [{ label: "Sim", value: "Sim" }, { label: "Nao", value: "Nao" }], defaultValue: "Nao", section: sections.technical },
      { name: "paymentSystemName", label: "Qual sistema?", section: sections.technical, visibleWhen: (data) => data.paymentSystem === "Sim", helpText: "Este campo alimenta checklists e fichas quando a maquina exige sistema de pagamento." },
      { name: "stock", label: "Estoque atual", type: "number", defaultValue: 0, min: 0, section: sections.inventory },
      { name: "minStock", label: "Estoque minimo", type: "number", defaultValue: 1, min: 0, section: sections.inventory, warningWhen: (data) => Number(data.minStock || 0) > Number(data.stock || 0), warningText: () => "Estoque minimo acima do estoque atual: o sistema deve sinalizar reposicao." },
      { name: "priceRent", label: "Valor aluguel", type: "currency", min: 0, section: sections.pricing },
      { name: "priceSale", label: "Valor venda", type: "currency", min: 0, section: sections.pricing },
      { name: "acquisitionCost", label: "Custo aquisicao", type: "currency", min: 0, section: sections.pricing, helpText: "Usado como base futura para payback real da maquina." },
      { name: "imageUrl", label: "URL da foto", section: sections.operation },
      { name: "videoUrl", label: "Link de video", section: sections.operation },
      { name: "defaultProposalText", label: "Texto padrao de proposta", type: "textarea", full: true, section: sections.operation },
      { name: "description", label: "Descricao tecnica", type: "textarea", full: true, maxLength: 800, section: sections.operation },
    ],
    extraActions: [
      {
        id: "machineConfigs",
        label: "Config",
        icon: "settings",
        type: "hub",
        hub: {
          collection: "machineConfigs",
          parentKey: "machineId",
          title: (machine) => `Configuracoes - ${machine?.name || ""}`,
          description: () => "Gestao de configuracoes tecnicas e programacao de bebidas.",
          emptyTitle: "Configuracoes salvas",
          actionLabel: "Nova Configuracao",
          formTitle: "Configuracao da Maquina",
          formDescription: "Parametros tecnicos e mapeamento de bebidas do equipamento.",
          columns: [
            { key: "name", label: "Nome" },
            { key: "clientId", label: "Cliente", source: "clients" },
            { key: "drinks", label: "Bebidas" },
            { key: "temperature", label: "Temp." },
          ],
          fields: [
            { name: "name", label: "Nome da configuracao", required: true },
            { name: "clientId", label: "Cliente vinculado", source: "clients" },
            { name: "isDefault", label: "Configuracao padrao", type: "checkbox" },
            { name: "reservoirs", label: "Reservatorios", type: "textarea", full: true },
            { name: "drinks", label: "Bebidas / ML", type: "textarea", full: true },
            { name: "temperature", label: "Temperatura" },
            { name: "grind", label: "Moagem" },
            { name: "notes", label: "Observacoes", type: "textarea", full: true },
          ],
        },
      },
      {
        id: "wikiSolutions",
        label: "Wiki",
        icon: "wrench",
        type: "hub",
        hub: {
          collection: "wikiSolutions",
          parentKey: "machineId",
          title: (machine) => `Wiki - ${machine?.name || ""}`,
          description: () => "Base de conhecimento tecnico e troubleshooting.",
          emptyTitle: "Solucoes catalogadas",
          actionLabel: "Nova Solucao",
          formTitle: "Solucao da Wiki",
          formDescription: "Documente sintomas, evidencias e passo a passo de manutencao.",
          columns: [
            { key: "problem", label: "Problema" },
            { key: "category", label: "Categoria" },
            { key: "difficulty", label: "Dificuldade" },
            { key: "status", label: "Status", type: "status" },
          ],
          fields: [
            { name: "problem", label: "Nome do problema", required: true },
            { name: "category", label: "Categoria", type: "select", optionGroup: "Categorias Wiki", options: [{ label: "Mecanica", value: "Mecanica" }, { label: "Eletrica", value: "Eletrica" }, { label: "Hidraulica", value: "Hidraulica" }, { label: "Configuracao", value: "Configuracao" }] },
            { name: "status", label: "Status", type: "select", optionGroup: "Status Wiki", options: wikiStatusOptions, defaultValue: "andamento" },
            { name: "difficulty", label: "Dificuldade", type: "select", optionGroup: "Dificuldade Wiki", options: [{ label: "Simples", value: "Simples" }, { label: "Media", value: "Media" }, { label: "Dificil", value: "Dificil" }] },
            { name: "tags", label: "Tags de busca" },
            { name: "evidence", label: "Midias e evidencias", type: "textarea", full: true },
            { name: "solution", label: "Passo a passo da solucao", type: "textarea", full: true },
          ],
        },
      },
    ],
  },
  supplies: {
    title: "Catalogo de Insumos",
    description: "Gerenciamento de produtos consumiveis e ingredientes.",
    actionLabel: "Novo Insumo",
    collection: "supplies",
    layout: "cards",
    searchPlaceholder: "Buscar por insumo, marca ou categoria",
    formTitle: "Cadastro de Insumo",
    formDescription: "Dados comerciais, estoque minimo e rendimento para operacao.",
    validate: validateSupplyPayload,
    smartSummary: (record) =>
      `${inventorySummary(record)} Preco ${formatCurrencySummary(record.price)} | custo ${formatCurrencySummary(record.cost)}.`,
    card: {
      title: { key: "name" },
      subtitle: { key: "brand" },
      statusKey: "status",
      meta: [
        { key: "category", label: "Categoria" },
        { key: "stock", label: "Estoque" },
        { key: "price", label: "Preco", type: "currency" },
        { key: "cost", label: "Custo", type: "currency" },
      ],
    },
    fields: [
      { name: "name", label: "Nome do produto", required: true, section: sections.identity },
      { name: "sku", label: "SKU / codigo interno", section: sections.identity },
      { name: "brand", label: "Marca", type: "select", optionGroup: "Marcas de Insumos", section: sections.identity },
      { name: "category", label: "Categoria", type: "select", optionGroup: "Categorias de Insumos", section: sections.identity },
      { name: "tag", label: "Tag operacional", type: "select", optionGroup: "Tags de Insumos", section: sections.identity },
      { name: "unit", label: "Tamanho / medida", type: "select", optionGroup: "Unidades de Produto", section: sections.inventory },
      { name: "stock", label: "Estoque", type: "number", defaultValue: 0, min: 0, section: sections.inventory },
      { name: "minStock", label: "Estoque minimo", type: "number", defaultValue: 1, min: 0, section: sections.inventory, warningWhen: (data) => Number(data.minStock || 0) > Number(data.stock || 0), warningText: () => "Este insumo deve aparecer como ponto de reposicao." },
      { name: "supplier", label: "Fornecedor principal", section: sections.inventory },
      { name: "leadTimeDays", label: "Prazo reposicao (dias)", type: "number", min: 0, section: sections.inventory },
      { name: "price", label: "Preco venda", type: "currency", min: 0, section: sections.pricing },
      { name: "cost", label: "Custo", type: "currency", min: 0, section: sections.pricing },
      { name: "status", label: "Status", type: "select", optionGroup: "Status Catalogo", options: statusOptions, defaultValue: "ativo", section: sections.pricing },
      { name: "compatibleMachines", label: "Maquinas compativeis", type: "textarea", full: true, section: sections.operation, helpText: "Use este campo quando o insumo for exclusivo de modelos especificos." },
      { name: "description", label: "Descricao", type: "textarea", full: true, maxLength: 800, section: sections.operation },
    ],
    extraActions: [
      {
        id: "recipes",
        label: "Receitas",
        icon: "receipt",
        type: "hub",
        hub: {
          collection: "recipes",
          parentKey: "supplyId",
          title: (supply) => `Receitas - ${supply?.name || ""}`,
          description: () => "Fichas tecnicas de preparos vinculadas ao insumo.",
          emptyTitle: "Receitas cadastradas",
          actionLabel: "Nova Receita",
          formTitle: "Ficha Tecnica",
          formDescription: "Ingredientes, preparo, alergenicos e custo estimado.",
          columns: [
            { key: "name", label: "Receita" },
            { key: "yield", label: "Rendimento" },
            { key: "allergens", label: "Alergenicos" },
            { key: "cost", label: "Custo", type: "currency" },
          ],
          fields: [
            { name: "name", label: "Nome da receita", required: true },
            { name: "yield", label: "Rendimento" },
            { name: "allergens", label: "Alergenicos / dieta" },
            { name: "ingredients", label: "Ingredientes", type: "textarea", full: true },
            { name: "preparation", label: "Modo de preparo", type: "textarea", full: true },
            { name: "cost", label: "Custo estimado", type: "currency" },
            { name: "notes", label: "Observacoes", type: "textarea", full: true },
          ],
        },
      },
    ],
  },
  accessories: {
    title: "Catalogo de Acessorios",
    description: "Gerenciamento de pecas, moveis e acessorios perifericos.",
    actionLabel: "Novo Acessorio",
    collection: "accessories",
    layout: "cards",
    formTitle: "Cadastro de Acessorio",
    formDescription: "Dados de compatibilidade, estoque e precificacao do acessorio.",
    validate: validateAccessoryPayload,
    smartSummary: (record) =>
      `${inventorySummary(record)} Preco ${formatCurrencySummary(record.price)} | custo ${formatCurrencySummary(record.cost)}.`,
    card: {
      title: { key: "name" },
      subtitle: { key: "brand" },
      statusKey: "status",
      meta: [
        { key: "category", label: "Categoria" },
        { key: "stock", label: "Estoque" },
        { key: "price", label: "Preco", type: "currency" },
        { key: "color", label: "Cor" },
      ],
    },
    fields: [
      { name: "name", label: "Nome do acessorio", required: true, section: sections.identity },
      { name: "sku", label: "SKU / codigo interno", section: sections.identity },
      { name: "brand", label: "Marca", type: "select", optionGroup: "Marcas de Acessorios", section: sections.identity },
      { name: "category", label: "Categoria", type: "select", optionGroup: "Categorias de Acessorios", section: sections.identity },
      { name: "color", label: "Cor", type: "select", optionGroup: "Cores", section: sections.identity },
      { name: "size", label: "Tamanho", type: "select", optionGroup: "Tamanhos", section: sections.identity },
      { name: "stock", label: "Estoque", type: "number", defaultValue: 0, min: 0, section: sections.inventory },
      { name: "minStock", label: "Estoque minimo", type: "number", defaultValue: 1, min: 0, section: sections.inventory, warningWhen: (data) => Number(data.minStock || 0) > Number(data.stock || 0), warningText: () => "Este acessorio deve aparecer como ponto de reposicao." },
      { name: "supplier", label: "Fornecedor principal", section: sections.inventory },
      { name: "price", label: "Preco", type: "currency", min: 0, section: sections.pricing },
      { name: "cost", label: "Custo", type: "currency", min: 0, section: sections.pricing },
      { name: "status", label: "Status", type: "select", optionGroup: "Status Catalogo", options: statusOptions, defaultValue: "ativo", section: sections.pricing },
      { name: "compatibleMachines", label: "Maquinas compativeis", type: "textarea", full: true, section: sections.operation },
      { name: "description", label: "Descricao", type: "textarea", full: true, maxLength: 800, section: sections.operation },
    ],
  },
  clients: {
    title: "Clientes",
    description: "Gestao do parque de maquinas, contratos e informacoes operacionais.",
    actionLabel: "Novo Cliente",
    collection: "clients",
    layout: "table",
    formTitle: "Cadastro de Cliente",
    formDescription: "Dados de contato, contrato e maquina vinculada.",
    validate: validateClientPayload,
    smartSummary: (record) =>
      `${record.name || "Cliente"} | contrato ${record.contractType || "-"} | valor ${formatCurrencySummary(record.contractValue)}.`,
    columns: [
      { key: "name", label: "Cliente" },
      { key: "contact", label: "Contato" },
      { key: "contractType", label: "Contrato" },
      { key: "machineId", label: "Maquina", source: "machines" },
      { key: "contractValue", label: "Valor", type: "currency" },
      { key: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "name", label: "Nome / empresa", required: true, section: sections.identity },
      { name: "companyDocument", label: "CNPJ / CPF", section: sections.identity },
      { name: "status", label: "Status", type: "select", optionGroup: "Status Cliente", options: [{ label: "Concluido", value: "concluido" }, { label: "Cancelado", value: "cancelado" }, { label: "Quebra", value: "quebra" }], defaultValue: "concluido", section: sections.identity },
      { name: "contact", label: "Pessoa de contato", section: sections.contact },
      { name: "phone", label: "Telefone", section: sections.contact },
      { name: "email", label: "Email", type: "email", section: sections.contact },
      { name: "billingContact", label: "Contato financeiro", section: sections.contact },
      { name: "contractType", label: "Tipo de contrato", type: "select", optionGroup: "Tipos de Contrato", options: [{ label: "Aluguel", value: "Aluguel" }, { label: "Venda", value: "Venda" }, { label: "Comodato", value: "Comodato" }, { label: "Comprador de Insumos", value: "Comprador de Insumos" }], defaultValue: "Aluguel", section: sections.contract },
      { name: "contractNumber", label: "Numero do contrato", section: sections.contract },
      { name: "machineId", label: "Maquina vinculada", source: "machines", section: sections.contract, visibleWhen: (data) => data.contractType !== "Comprador de Insumos" },
      { name: "contractValue", label: "Valor contrato", type: "currency", min: 0, section: sections.contract, autoFill: resolveClientContractValue, autoFillDependencies: ["contractType", "machineId"], helpText: "Quando a maquina e o tipo de contrato sao escolhidos, o valor base vem da pagina de precos." },
      { name: "startDate", label: "Inicio contrato", type: "date", section: sections.contract },
      { name: "outletAmperage", label: "Tomada local", type: "number", min: 0, section: sections.technical, autoFill: (data, snapshot) => findMachine(snapshot, data.machineId).amperage || 10, autoFillDependencies: ["machineId"] },
      { name: "waterAvailable", label: "Agua disponivel", type: "select", optionGroup: "Rede Hidrica", options: [{ label: "Sim", value: "Sim" }, { label: "Nao", value: "Nao" }], defaultValue: "Nao", section: sections.technical, autoFill: (data, snapshot) => findMachine(snapshot, data.machineId).hydraulic || "Nao", autoFillDependencies: ["machineId"] },
      { name: "sewerAvailable", label: "Esgoto disponivel", type: "select", optionGroup: "Rede Hidrica", options: [{ label: "Sim", value: "Sim" }, { label: "Nao", value: "Nao" }], defaultValue: "Nao", section: sections.technical, autoFill: (data, snapshot) => findMachine(snapshot, data.machineId).sewer || "Nao", autoFillDependencies: ["machineId"] },
      { name: "address", label: "Endereco", type: "textarea", full: true, section: sections.operation },
      { name: "installNotes", label: "Observacoes de instalacao", type: "textarea", full: true, section: sections.operation },
    ],
  },
  checklists: {
    title: "Checklists",
    description: "Gerencie ordens de servico e instalacoes.",
    actionLabel: "Novo Checklist",
    collection: "checklists",
    layout: "table",
    formTitle: "Novo Checklist",
    formDescription: "Preencha os dados principais da ordem de servico.",
    validate: validateChecklistPayload,
    columns: [
      { key: "code", label: "N." },
      { key: "clientId", label: "Cliente", source: "clients" },
      { key: "machineId", label: "Maquina", source: "machines" },
      { key: "technician", label: "Tecnico" },
      { key: "date", label: "Data" },
      { key: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "code", label: "Numero", required: true, placeholder: "#1043" },
      { name: "clientId", label: "Cliente", source: "clients", required: true },
      { name: "machineId", label: "Maquina", source: "machines", required: true },
      { name: "serviceType", label: "Tipo de servico", type: "select", optionGroup: "Tipos de Servico", options: [{ label: "Instalacao", value: "Instalacao" }, { label: "Retirada", value: "Retirada" }, { label: "Preventiva", value: "Preventiva" }, { label: "Manutencao", value: "Manutencao" }] },
      { name: "technician", label: "Tecnico responsavel", type: "select", optionGroup: "Tecnicos" },
      { name: "date", label: "Data", type: "date" },
      { name: "status", label: "Status", type: "select", optionGroup: "Status Checklist", options: checklistStatusOptions, defaultValue: "rascunho" },
      { name: "quantity", label: "Qtd maquinas", type: "number", defaultValue: 1 },
      { name: "outletAmperage", label: "Tomada do local (A)", type: "number", defaultValue: 10 },
      { name: "waterOk", label: "Rede hidrica ok", type: "select", optionGroup: "Rede Hidrica", options: [{ label: "Sim", value: "Sim" }, { label: "Nao", value: "Nao" }] },
      { name: "value", label: "Valor total", type: "currency" },
      { name: "notes", label: "Observacoes", type: "textarea", full: true, maxLength: 500 },
    ],
    extraActions: [
      {
        id: "details",
        label: "Detalhes",
        icon: "fileText",
        type: "detail",
      },
    ],
    detail: {
      title: (checklist) => `Checklist ${checklist?.code || ""}`,
      description: "Hub de leitura detalhada da ordem de servico.",
      fields: [
        { key: "code", label: "Numero" },
        { key: "status", label: "Status", type: "status" },
        { key: "clientId", label: "Cliente", source: "clients" },
        { key: "machineId", label: "Maquina", source: "machines" },
        { key: "serviceType", label: "Servico" },
        { key: "technician", label: "Tecnico" },
        { key: "date", label: "Data" },
        { key: "quantity", label: "Quantidade" },
        { key: "outletAmperage", label: "Tomada local" },
        { key: "waterOk", label: "Rede hidrica" },
        { key: "value", label: "Valor total", type: "currency" },
        { key: "notes", label: "Observacoes", full: true },
        {
          key: "compatibility",
          label: "Leitura de compatibilidade",
          full: true,
          render: (record, snapshot) => {
            const machine = snapshot.machines.find((item) => item.id === record.machineId);
            if (!machine) {
              return "-";
            }

            const amperageOk = Number(record.outletAmperage || 0) >= Number(machine.amperage || 0);
            const waterOk = machine.hydraulic !== "Sim" || record.waterOk === "Sim";
            return amperageOk && waterOk
              ? "Estrutura compativel com os requisitos da maquina."
              : "Falsa equivalencia detectada: revisar eletrica/hidrica antes de finalizar.";
          },
        },
      ],
    },
  },
  proposals: {
    title: "Portfolios e Fichas",
    description: "Gerenciamento de propostas, negociacoes com clientes e documentos operacionais.",
    actionLabel: "Nova Proposta",
    collection: "proposals",
    layout: "table",
    formTitle: "Editor de Proposta",
    formDescription: "Proposta comercial com preview de documento e integracao ao financeiro.",
    livePreviewDocumentType: "proposal",
    columns: [
      { key: "clientId", label: "Cliente", source: "clients" },
      { key: "machineId", label: "Maquina", source: "machines" },
      { key: "modality", label: "Modalidade" },
      { key: "totalValue", label: "Valor", type: "currency" },
      { key: "createdDate", label: "Criacao" },
      { key: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "clientId", label: "Cliente", source: "clients", required: true },
      { name: "machineId", label: "Maquina", source: "machines", required: true },
      { name: "modality", label: "Modalidade", type: "select", optionGroup: "Modalidades Comerciais", options: [{ label: "Venda", value: "Venda" }, { label: "Aluguel", value: "Aluguel" }, { label: "Comodato", value: "Comodato" }] },
      { name: "status", label: "Status", type: "select", optionGroup: "Status Proposta", options: proposalStatusOptions, defaultValue: "rascunho" },
      { name: "totalValue", label: "Valor final", type: "currency" },
      { name: "createdDate", label: "Data", type: "date" },
      { name: "notes", label: "Observacoes", type: "textarea", full: true },
    ],
    extraActions: [
      {
        id: "proposalPreview",
        label: "Preview",
        icon: "fileText",
        type: "document",
        documentType: "proposal",
      },
    ],
  },
  serviceSheets: {
    title: "Fichas de Instalacao e Retirada",
    description: "Documentos operacionais vinculados a clientes, maquinas e checklists.",
    actionLabel: "Nova Ficha",
    collection: "serviceSheets",
    layout: "table",
    formTitle: "Gerador de Ficha",
    formDescription: "Ficha operacional com assinatura, preview e download de documento.",
    livePreviewDocumentType: "serviceSheet",
    columns: [
      { key: "sheetType", label: "Tipo" },
      { key: "clientId", label: "Cliente", source: "clients" },
      { key: "machineId", label: "Maquina", source: "machines" },
      { key: "checklistId", label: "Checklist", source: "checklists", sourceLabel: "code" },
      { key: "date", label: "Data" },
      { key: "status", label: "Status", type: "status" },
    ],
    fields: [
      { name: "sheetType", label: "Tipo de ficha", type: "select", optionGroup: "Tipos de Ficha", options: [{ label: "Instalacao", value: "Instalacao" }, { label: "Retirada", value: "Retirada" }] },
      { name: "clientId", label: "Cliente", source: "clients", required: true },
      { name: "machineId", label: "Maquina", source: "machines", required: true },
      { name: "checklistId", label: "Checklist vinculado", source: "checklists", sourceLabel: "code" },
      { name: "date", label: "Data", type: "date" },
      { name: "time", label: "Horario" },
      { name: "status", label: "Status", type: "select", optionGroup: "Status Ficha", options: [{ label: "Rascunho", value: "rascunho" }, { label: "Assinado", value: "assinado" }, { label: "Cancelado", value: "cancelado" }], defaultValue: "rascunho" },
      { name: "technician", label: "Tecnico", type: "select", optionGroup: "Tecnicos" },
      { name: "serviceMode", label: "Meio", type: "select", optionGroup: "Meio de Atendimento", options: [{ label: "Hidrica", value: "Hidrica" }, { label: "Galao", value: "Galao" }] },
      { name: "rentalValue", label: "Valor locacao", type: "currency" },
      { name: "chargeType", label: "Tipo cobranca", type: "select", optionGroup: "Tipos de Cobranca" },
      { name: "machineReading", label: "Leitura maquina" },
      { name: "technicalTests", label: "Checklist tecnico", type: "textarea", full: true },
      { name: "products", label: "Produtos / insumos", type: "textarea", full: true },
      { name: "notes", label: "Observacoes", type: "textarea", full: true },
    ],
    extraActions: [
      {
        id: "sheetPreview",
        label: "Preview",
        icon: "fileText",
        type: "document",
        documentType: "serviceSheet",
      },
    ],
  },
  sales: {
    title: "Vendas Rapidas",
    description: "Registro de vendas avulsas, saida de insumos e faturamento direto.",
    actionLabel: "Nova Venda",
    collection: "sales",
    layout: "table",
    formTitle: "Nova Venda",
    formDescription: "Ao salvar, o estoque virtual do item vendido e baixado automaticamente.",
    columns: [
      { key: "date", label: "Data" },
      { key: "clientId", label: "Cliente", source: "clients" },
      {
        key: "productId",
        label: "Produto",
        render: (record, snapshot) => snapshot[record.productCollection]?.find((item) => item.id === record.productId)?.name || "-",
      },
      { key: "quantity", label: "Qtd" },
      { key: "totalValue", label: "Valor", type: "currency" },
      { key: "paymentStatus", label: "Status", type: "status" },
    ],
    fields: [
      { name: "date", label: "Data", type: "date", required: true },
      { name: "clientId", label: "Cliente", source: "clients", required: true },
      { name: "inventoryItem", label: "Produto", type: "inventoryItem", required: true },
      { name: "quantity", label: "Quantidade", type: "number", defaultValue: 1 },
      { name: "unitValue", label: "Valor unitario", type: "currency" },
      { name: "paymentStatus", label: "Pagamento", type: "select", optionGroup: "Status Pagamento", options: paymentStatusOptions, defaultValue: "pendente" },
      { name: "generateCharge", label: "Lancar no contas a receber", type: "checkbox", defaultValue: false },
    ],
  },
  labels: {
    title: "Etiquetas",
    description: "Repositorio de arquivos externos de etiquetas, com preview, download e impressao.",
    actionLabel: "Enviar Arquivo",
    collection: "labels",
  },
  options: {
    title: "Adicionar Opcoes",
    description: "Gerenciamento de listas, categorias, parametros tecnicos e itens de checklist.",
    actionLabel: "Adicionar",
    collection: "options",
    layout: "table",
    formTitle: "Nova Opcao",
    formDescription: "Parametro usado por dropdowns e cadastros do sistema.",
    validate: validateOptionPayload,
    smartSummary: (record) => `${record.group || "Grupo"} | ${record.name || "Opcao"} = ${record.value || "-"}.`,
    columns: [
      { key: "group", label: "Grupo" },
      { key: "name", label: "Nome" },
      { key: "value", label: "Valor" },
    ],
    fields: [
      { name: "group", label: "Grupo", type: "select", options: OPTION_GROUP_CHOICES, required: true, section: sections.identity },
      { name: "name", label: "Nome visivel", required: true, section: sections.identity },
      { name: "value", label: "Valor interno", required: true, section: sections.identity, helpText: "Use valores padronizados para evitar duplicidade nos cadastros." },
      { name: "description", label: "Descricao de uso", type: "textarea", full: true, section: sections.operation },
      { name: "requiredQuantity", label: "Quantidade padrao", type: "number", min: 0, section: sections.operation, visibleWhen: (data) => ["Ferramentas Necessarias", "Coisas Necessarias"].includes(data.group) },
      { name: "defaultMl", label: "ML padrao", type: "number", min: 0, section: sections.operation, visibleWhen: (data) => data.group === "Bebidas da Maquina" },
    ],
  },
};
