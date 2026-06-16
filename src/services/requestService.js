import { canAccessPage } from "./permissionService.js";

export const REQUEST_STATUSES = {
  ANALYSIS: "analise",
  ANSWER_WAIT: "aguardando-resposta",
  ATTENDING: "atendendo",
  CLOSED: "encerrado",
  COMPLETED: "concluido",
  GIVE_UP: "desistido",
  OPEN: "pendente",
  REACTIVATED: "reativado",
  REJECTED: "rejeitado",
  TRANSFERRED: "transferido",
  UNRESOLVED: "nao-resolvido",
};

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUSES.ANALYSIS]: "Em Analise",
  [REQUEST_STATUSES.ANSWER_WAIT]: "Aguardando Resposta",
  [REQUEST_STATUSES.ATTENDING]: "Atendendo",
  [REQUEST_STATUSES.CLOSED]: "Encerrado",
  [REQUEST_STATUSES.COMPLETED]: "Concluido",
  [REQUEST_STATUSES.GIVE_UP]: "Desistido",
  [REQUEST_STATUSES.OPEN]: "Pendente",
  [REQUEST_STATUSES.REACTIVATED]: "Reativado",
  [REQUEST_STATUSES.REJECTED]: "Rejeitado",
  [REQUEST_STATUSES.TRANSFERRED]: "Pendente",
  [REQUEST_STATUSES.UNRESOLVED]: "Nao resolvido",
};

export const REQUEST_STATUS_STYLES = {
  [REQUEST_STATUSES.ANALYSIS]: "border-blue-200 bg-blue-50 text-blue-900",
  [REQUEST_STATUSES.ANSWER_WAIT]: "border-purple-200 bg-purple-50 text-purple-900",
  [REQUEST_STATUSES.ATTENDING]: "border-violet-200 bg-violet-50 text-violet-950",
  [REQUEST_STATUSES.CLOSED]: "border-orange-200 bg-orange-50 text-orange-900",
  [REQUEST_STATUSES.COMPLETED]: "border-green-200 bg-green-50 text-green-900",
  [REQUEST_STATUSES.GIVE_UP]: "border-zinc-200 bg-zinc-50 text-zinc-700",
  [REQUEST_STATUSES.OPEN]: "border-zinc-200 bg-zinc-100 text-zinc-800",
  [REQUEST_STATUSES.REACTIVATED]: "border-yellow-200 bg-yellow-50 text-yellow-900",
  [REQUEST_STATUSES.REJECTED]: "border-red-200 bg-red-50 text-red-900",
  [REQUEST_STATUSES.TRANSFERRED]: "border-zinc-200 bg-zinc-100 text-zinc-800",
  [REQUEST_STATUSES.UNRESOLVED]: "border-zinc-200 bg-white text-zinc-900",
};

export const REQUEST_CATEGORIES = ["Manutencao", "Correcao", "Erro", "Conta", "Permissao", "Melhoria", "Outro"];
export const REQUEST_PRIORITIES = ["Baixa", "Media", "Alta", "Critica"];
export const REQUEST_PROBLEM_TYPES = ["Geral", "Cadastro", "Tela", "Impressao", "Acesso", "Criacao de Conta", "Deletar Conta", "Outro"];

const ACTIVE_STATUSES = new Set([
  REQUEST_STATUSES.ANALYSIS,
  REQUEST_STATUSES.ANSWER_WAIT,
  REQUEST_STATUSES.ATTENDING,
  REQUEST_STATUSES.OPEN,
  REQUEST_STATUSES.REACTIVATED,
  REQUEST_STATUSES.TRANSFERRED,
]);

const MANAGER_ROLES = new Set(["DEV", "CEO", "DON"]);

export function isRequestManager(user) {
  return MANAGER_ROLES.has(user?.role);
}

export function isRequestFinal(status) {
  return !ACTIVE_STATUSES.has(status);
}

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildRequestSimilarityKey(request = {}) {
  const descriptionKey = normalizeText(request.description).split(" ").slice(0, 10).join(" ");

  return [
    request.pageId || "sem-pagina",
    normalizeText(request.category || "geral"),
    normalizeText(request.problemType || request.title || "solicitacao"),
    descriptionKey,
  ].join("|");
}

export function getRequestDeadlineDays(request = {}) {
  return ["Alta", "Critica"].includes(request.priority) ? 15 : 7;
}

export function getRequestAgeDays(request = {}, now = new Date()) {
  const createdAt = new Date(request.createdAt || request.requestedAt || now);

  if (Number.isNaN(createdAt.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 86400000));
}

export function resolveRequestStatus(request = {}, now = new Date()) {
  if (ACTIVE_STATUSES.has(request.status) && getRequestAgeDays(request, now) > getRequestDeadlineDays(request)) {
    return REQUEST_STATUSES.CLOSED;
  }

  return request.status || REQUEST_STATUSES.OPEN;
}

export function buildRequestEvent(action, user, details = "") {
  return {
    action,
    at: new Date().toISOString(),
    details,
    role: user?.role || "SYS",
    userId: user?.id || "",
    userName: user?.displayName || user?.fullName || "Sistema",
  };
}

export function buildRequestPayload(formData, user) {
  const now = new Date().toISOString();
  const isGeneral = Boolean(formData.isGeneral);

  return {
    assigneeId: "",
    assigneeName: "",
    assigneeRole: "",
    attachments: formData.attachmentDataUrl ? [{
      dataUrl: formData.attachmentDataUrl,
      name: formData.attachmentName || "print.png",
      type: formData.attachmentType || "image/png",
      uploadedAt: now,
      uploadedBy: user?.displayName || user?.fullName || "Usuario",
    }] : [],
    category: formData.category || "Erro",
    comments: [],
    description: formData.description || "",
    events: [buildRequestEvent("Criou", user, "Solicitacao aberta.")],
    isGeneral,
    occurrenceCount: 1,
    pageId: formData.pageId || "home",
    priority: formData.priority || "Media",
    problemType: formData.problemType || (isGeneral ? "Geral" : "Tela"),
    publicComments: [],
    reactivatedAt: "",
    requestedAt: now,
    requesterId: user?.id || "",
    requesterName: user?.displayName || user?.fullName || "Novo Usuario",
    similarityKey: "",
    status: REQUEST_STATUSES.OPEN,
    title: formData.title || "Solicitacao",
  };
}

export function buildAccountRequestPayload(formData = {}) {
  const now = new Date().toISOString();

  return {
    category: "Conta",
    description: formData.description || "Necessitando de criacao de CONTA.",
    deviceKey: formData.deviceKey || "",
    events: [buildRequestEvent("Criou", null, "Pedido de conta aberto pela tela de login.")],
    isGeneral: false,
    occurrenceCount: 1,
    pageId: "accounts",
    priority: "Media",
    problemType: "Criacao de Conta",
    publicComments: [],
    requestedAt: now,
    requesterId: "",
    requesterName: formData.fullName || "Novo Usuario",
    requestType: "accountCreation",
    status: REQUEST_STATUSES.OPEN,
    title: "Criacao de Conta",
  };
}

export function requestBelongsToUser(request, user) {
  if (!user) {
    return false;
  }

  return request.requesterId === user.id || request.isGeneral;
}

export function filterRequestsForUser(requests, user) {
  if (isRequestManager(user)) {
    return requests;
  }

  return requests.filter((request) => requestBelongsToUser(request, user));
}

export function groupSimilarRequests(requests = []) {
  const grouped = new Map();

  requests.forEach((request) => {
    const key = request.similarityKey || buildRequestSimilarityKey(request);
    const currentGroup = grouped.get(key) || { key, items: [] };

    currentGroup.items.push(request);
    grouped.set(key, currentGroup);
  });

  return Array.from(grouped.values()).map((group) => ({
    ...group,
    count: group.items.reduce((total, item) => total + Number(item.occurrenceCount || 1), 0),
    latest: group.items.sort((first, second) =>
      String(second.updatedAt || second.requestedAt || "").localeCompare(String(first.updatedAt || first.requestedAt || ""))
    )[0],
  }));
}

export function buildAccessiblePageOptions(navigation, role) {
  const allItems = [
    ...(navigation?.primary || []),
    ...(navigation?.header || []),
    ...(navigation?.quickAccess || []).map((item) => ({ ...item, id: item.pageId })),
  ];
  const seen = new Set();

  return allItems
    .filter((item) => item.id && !seen.has(item.id) && canAccessPage(role, item.id))
    .map((item) => {
      seen.add(item.id);
      return { label: item.label, value: item.id };
    });
}

export function formatRequestDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function getRequestDurationLabel(startAt, endAt = new Date().toISOString()) {
  if (!startAt) {
    return "-";
  }

  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  const hours = Math.max(0, Math.round((end.getTime() - start.getTime()) / 3600000));

  if (hours < 24) {
    return `${hours}h`;
  }

  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}
