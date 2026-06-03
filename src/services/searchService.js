import { getDatabaseSnapshot } from "./local/localDatabase.js";
import { canAccessPage } from "./permissionService.js";

const SEARCH_LIMIT = 9;

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveName(collection, id, fallback = "-") {
  return collection.find((record) => record.id === id)?.name || fallback;
}

function compactText(parts) {
  return parts.filter(Boolean).join(" | ");
}

function scoreDocument(document, tokens) {
  const searchable = {
    title: normalize(document.title),
    subtitle: normalize(document.subtitle),
    meta: normalize(document.meta),
    keywords: normalize(document.keywords),
  };

  /* --- SECAO: RANQUEAMENTO LOCAL ---
   * Titulo e subtitulo recebem peso maior para que registros centrais aparecam
   * antes de ocorrencias soltas em observacoes, historico ou descricoes longas.
   */
  return tokens.reduce((score, token) => {
    if (searchable.title.includes(token)) {
      return score + 10;
    }

    if (searchable.subtitle.includes(token)) {
      return score + 6;
    }

    if (searchable.meta.includes(token)) {
      return score + 3;
    }

    if (searchable.keywords.includes(token)) {
      return score + 1;
    }

    return score;
  }, 0);
}

function buildSearchDocuments(database) {
  const machines = database.machines || [];
  const supplies = database.supplies || [];
  const accessories = database.accessories || [];
  const clients = database.clients || [];
  const checklists = database.checklists || [];

  return [
    ...machines.map((machine) => ({
      id: `machine_${machine.id}`,
      pageId: "machines",
      icon: "cog",
      type: "Maquina",
      title: machine.name,
      subtitle: compactText([machine.brand, machine.category]),
      meta: compactText([machine.status, `${machine.stock} em estoque`, machine.description]),
      status: machine.status,
      keywords: compactText([machine.voltage, machine.hydraulic, machine.amperage]),
    })),
    ...supplies.map((supply) => ({
      id: `supply_${supply.id}`,
      pageId: "insumos",
      icon: "packagePlus",
      type: "Insumo",
      title: supply.name,
      subtitle: compactText([supply.brand, supply.category]),
      meta: compactText([supply.status, `${supply.stock} ${supply.unit || "un."}`, supply.description]),
      status: supply.status,
      keywords: compactText([supply.price, supply.cost]),
    })),
    ...accessories.map((accessory) => ({
      id: `accessory_${accessory.id}`,
      pageId: "acessorios",
      icon: "boxes",
      type: "Acessorio",
      title: accessory.name,
      subtitle: compactText([accessory.brand, accessory.category]),
      meta: compactText([accessory.status, `${accessory.stock} em estoque`, accessory.description]),
      status: accessory.status,
      keywords: compactText([accessory.color, accessory.size]),
    })),
    ...clients.map((client) => ({
      id: `client_${client.id}`,
      pageId: "clientes",
      icon: "users",
      type: "Cliente",
      title: client.name,
      subtitle: compactText([client.contact, client.contractType]),
      meta: compactText([client.status, resolveName(machines, client.machineId, ""), client.address]),
      status: client.status,
      keywords: compactText([client.phone, client.email, client.contractValue]),
    })),
    ...checklists.map((checklist) => ({
      id: `checklist_${checklist.id}`,
      pageId: "checklists",
      icon: "checkSquare",
      type: "Checklist",
      title: checklist.code,
      subtitle: compactText([resolveName(clients, checklist.clientId), resolveName(machines, checklist.machineId)]),
      meta: compactText([checklist.serviceType, checklist.technician, checklist.date, checklist.notes]),
      status: checklist.status,
      keywords: compactText([checklist.value, checklist.waterOk, checklist.outletAmperage]),
    })),
    ...(database.repairOrders || []).map((order) => ({
      id: `repair_${order.id}`,
      pageId: "serviceOrders",
      icon: "wrench",
      type: "O.S.",
      title: order.code,
      subtitle: compactText([resolveName(clients, order.clientId), resolveName(machines, order.machineId)]),
      meta: compactText([order.issue, order.diagnosis, order.technician, order.notes]),
      status: order.status,
      keywords: compactText([order.priority, order.estimatedValue, order.approvedByClient ? "aprovado" : "pendente"]),
    })),
    ...(database.proposals || []).map((proposal) => ({
      id: `proposal_${proposal.id}`,
      pageId: "portfolios",
      icon: "briefcase",
      type: "Proposta",
      title: resolveName(clients, proposal.clientId),
      subtitle: compactText([proposal.modality, resolveName(machines, proposal.machineId)]),
      meta: compactText([proposal.status, proposal.createdDate, proposal.notes]),
      status: proposal.status,
      keywords: compactText([proposal.totalValue]),
    })),
    ...(database.serviceSheets || []).map((sheet) => ({
      id: `sheet_${sheet.id}`,
      pageId: "portfolios",
      icon: "fileText",
      type: "Ficha",
      title: `${sheet.sheetType} - ${resolveName(clients, sheet.clientId)}`,
      subtitle: compactText([resolveName(machines, sheet.machineId), sheet.technician]),
      meta: compactText([sheet.status, sheet.date, sheet.technicalTests, sheet.products, sheet.notes]),
      status: sheet.status,
      keywords: compactText([sheet.serviceMode, sheet.chargeType, sheet.machineReading]),
    })),
    ...(database.sales || []).map((sale) => ({
      id: `sale_${sale.id}`,
      pageId: "vendas",
      icon: "shoppingCart",
      type: "Venda",
      title: `Venda ${sale.id.slice(-5).toUpperCase()}`,
      subtitle: resolveName(clients, sale.clientId),
      meta: compactText([database[sale.productCollection]?.find((item) => item.id === sale.productId)?.name, sale.date]),
      status: sale.paymentStatus,
      keywords: compactText([sale.quantity, sale.totalValue, sale.unitValue]),
    })),
    ...(database.receivables || []).map((receivable) => ({
      id: `receivable_${receivable.id}`,
      pageId: "financeiro",
      icon: "money",
      type: "Receber",
      title: receivable.origin,
      subtitle: resolveName(clients, receivable.clientId),
      meta: compactText([receivable.status, receivable.dueDate, receivable.notes]),
      status: receivable.status,
      keywords: compactText([receivable.value]),
    })),
    ...(database.payables || []).map((payable) => ({
      id: `payable_${payable.id}`,
      pageId: "financeiro",
      icon: "money",
      type: "Pagar",
      title: payable.description,
      subtitle: payable.category,
      meta: compactText([payable.status, payable.dueDate, payable.notes]),
      status: payable.status,
      keywords: compactText([payable.value]),
    })),
    ...(database.labels || []).map((label) => ({
      id: `label_${label.id}`,
      pageId: "etiquetas",
      icon: "tags",
      type: "Etiqueta",
      title: label.name,
      subtitle: compactText([label.category, label.format]),
      meta: compactText([label.linkedTo, label.description]),
      status: "",
      keywords: "",
    })),
    ...(database.options || []).map((option) => ({
      id: `option_${option.id}`,
      pageId: "opcoes",
      icon: "layoutGrid",
      type: "Opcao",
      title: option.name,
      subtitle: option.group,
      meta: option.value,
      status: "",
      keywords: "",
    })),
    ...(database.history || []).map((entry) => ({
      id: `history_${entry.id}`,
      pageId: "historico",
      icon: "history",
      type: "Historico",
      title: entry.title,
      subtitle: compactText([entry.module, entry.action]),
      meta: compactText([entry.userName, entry.date, entry.details]),
      status: entry.role,
      keywords: "",
    })),
    ...(database.accounts || []).map((account) => ({
      id: `account_${account.id}`,
      pageId: "accounts",
      icon: "user",
      type: "Conta",
      title: account.fullName,
      subtitle: compactText([account.displayName, account.role]),
      meta: compactText([account.status, account.email, account.phone]),
      status: account.status,
      keywords: compactText([account.lastLogin]),
    })),
  ];
}

export async function searchGlobal(term, role = "VEN", limit = SEARCH_LIMIT) {
  const normalizedTerm = normalize(term);

  if (normalizedTerm.length < 2) {
    return [];
  }

  const tokens = normalizedTerm.split(/\s+/).filter(Boolean);
  const database = getDatabaseSnapshot();

  return buildSearchDocuments(database)
    .filter((document) => canAccessPage(role, document.pageId))
    .map((document) => ({
      ...document,
      score: scoreDocument(document, tokens),
    }))
    .filter((document) => document.score > 0)
    .sort((first, second) => second.score - first.score || first.title.localeCompare(second.title))
    .slice(0, limit);
}
