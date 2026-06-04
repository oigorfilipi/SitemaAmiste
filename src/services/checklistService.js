import { updateEntity } from "./erpService.js";
import { exportRecordsToCsv } from "./exportService.js";

export const CHECKLIST_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "open", label: "Abertos" },
  { id: "finalizado", label: "Finalizados" },
  { id: "risk", label: "Risco" },
];

const CHECKLIST_EXPORT_COLUMNS = [
  { key: "code", label: "Numero" },
  { key: "clientName", label: "Cliente" },
  { key: "machineName", label: "Maquina" },
  { key: "serviceType", label: "Servico" },
  { key: "technician", label: "Tecnico" },
  { key: "date", label: "Data" },
  { key: "compatibilityLabel", label: "Compatibilidade" },
  { key: "value", label: "Valor", type: "currency" },
  { key: "status", label: "Status" },
];

function asNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(asNumber(value));
}

function resolveName(snapshot, collection, id) {
  return snapshot[collection]?.find((record) => record.id === id)?.name || "-";
}

function resolveMachine(snapshot, machineId) {
  return snapshot.machines?.find((machine) => machine.id === machineId) || null;
}

function resolveRecord(snapshot, collectionName, id) {
  return snapshot[collectionName]?.find((record) => record.id === id) || null;
}

function getSelectedQuantity(selection) {
  if (!selection?.selected) {
    return 0;
  }

  return Math.max(1, asNumber(selection.quantity) || 1);
}

function validateSelectedInventory(selectionMap = {}, snapshot, collectionName, label, shouldCheckStock) {
  for (const [recordId, selection] of Object.entries(selectionMap)) {
    const quantity = getSelectedQuantity(selection);

    if (!quantity) {
      continue;
    }

    const record = resolveRecord(snapshot, collectionName, recordId);

    if (!record) {
      return `${label} selecionado nao existe mais no cadastro. Revise a selecao.`;
    }

    if (shouldCheckStock && quantity > asNumber(record.stock)) {
      return `Estoque insuficiente: ${record.name} possui ${asNumber(record.stock)} unidade(s) disponiveis.`;
    }
  }

  return "";
}

export function evaluateChecklistCompatibility(record, snapshot) {
  const machine = resolveMachine(snapshot, record.machineId);

  if (!machine) {
    return {
      amperageOk: false,
      compatible: false,
      compatibilityLabel: "Maquina nao encontrada",
      issues: ["Maquina nao encontrada no catalogo."],
      waterOk: false,
    };
  }

  const technical = record.machineTechnical || {};
  const requiredAmperage = asNumber(technical.amperage || machine.amperage);
  const requiredWater = technical.hydraulic || machine.hydraulic;
  const requiredSewer = technical.sewer || machine.sewer || "Nao";
  const amperageOk = asNumber(record.outletAmperage) >= requiredAmperage;
  const waterOk = requiredWater !== "Sim" || (record.localWaterOk || record.waterOk) === "Sim";
  const sewerOk = requiredSewer !== "Sim" || record.localSewerOk === "Sim";
  const issues = [
    amperageOk ? "" : `${machine.name} exige ${requiredAmperage}A, local informou ${record.outletAmperage || 0}A.`,
    waterOk ? "" : `${machine.name} exige rede hidrica marcada como disponivel.`,
    sewerOk ? "" : `${machine.name} exige esgoto marcado como disponivel.`,
  ].filter(Boolean);

  return {
    amperageOk,
    compatible: !issues.length,
    compatibilityLabel: issues.length ? "Falsa equivalencia" : "Compativel",
    issues,
    machine,
    sewerOk,
    waterOk,
  };
}

export function validateChecklistPayload(payload, snapshot) {
  const requestedQuantity = asNumber(payload.quantity ?? payload.machineQuantity ?? 1);
  const machineQuantity = Math.max(1, requestedQuantity);
  const isFinalized = payload.status === "finalizado";

  if (!payload.clientId && payload.serviceScope !== "Evento") {
    return "Selecione o cliente do checklist.";
  }

  if (payload.clientId && !resolveRecord(snapshot, "clients", payload.clientId)) {
    return "Cliente selecionado nao encontrado. Selecione um cliente valido.";
  }

  if (!payload.machineId) {
    return "Selecione a maquina do checklist.";
  }

  const machine = resolveMachine(snapshot, payload.machineId);

  if (!machine) {
    return "Maquina selecionada nao encontrada. Selecione uma maquina valida.";
  }

  if (requestedQuantity <= 0) {
    return "Informe uma quantidade de maquinas maior que zero.";
  }

  if (isFinalized && machineQuantity > asNumber(machine.stock)) {
    return `Estoque insuficiente: ${machine.name} possui ${asNumber(machine.stock)} unidade(s) disponiveis.`;
  }

  if (asNumber(payload.value) < 0) {
    return "Valor total do checklist nao pode ser negativo.";
  }

  const suppliesError = validateSelectedInventory(payload.supplies, snapshot, "supplies", "Insumo", isFinalized);

  if (suppliesError) {
    return suppliesError;
  }

  const accessoriesError = validateSelectedInventory(payload.accessories, snapshot, "accessories", "Acessorio", isFinalized);

  if (accessoriesError) {
    return accessoriesError;
  }

  const compatibility = evaluateChecklistCompatibility(payload, snapshot);

  if (isFinalized && !compatibility.compatible) {
    return `Falsa equivalencia: ${compatibility.issues.join(" ")}`;
  }

  return "";
}

export function buildChecklistRows(records, snapshot) {
  return records.map((record) => {
    const compatibility = evaluateChecklistCompatibility(record, snapshot);

    return {
      ...record,
      ...compatibility,
      clientName: record.clientId ? resolveName(snapshot, "clients", record.clientId) : record.eventCompanyName || record.eventName || "-",
      machineName: resolveName(snapshot, "machines", record.machineId),
      open: record.status !== "finalizado",
    };
  });
}

export function filterChecklistRows(rows, filterId) {
  if (filterId === "open") {
    return rows.filter((row) => row.status !== "finalizado");
  }

  if (filterId === "finalizado") {
    return rows.filter((row) => row.status === "finalizado");
  }

  if (filterId === "risk") {
    return rows.filter((row) => !row.compatible);
  }

  return rows;
}

export function buildChecklistMetrics(rows) {
  const openRows = rows.filter((row) => row.status !== "finalizado");
  const riskRows = rows.filter((row) => !row.compatible);
  const finalizedValue = rows
    .filter((row) => row.status === "finalizado")
    .reduce((total, row) => total + asNumber(row.value), 0);

  return [
    {
      id: "total",
      icon: "checkSquare",
      label: "Checklists",
      value: rows.length,
      detail: `${openRows.length} abertos`,
      tone: "blue",
    },
    {
      id: "risk",
      icon: "shield",
      label: "Falsa equivalencia",
      value: riskRows.length,
      detail: "bloqueios tecnicos",
      tone: riskRows.length ? "red" : "green",
    },
    {
      id: "finalized",
      icon: "gauge",
      label: "Finalizados",
      value: rows.filter((row) => row.status === "finalizado").length,
      detail: "integrados a operacao",
      tone: "green",
    },
    {
      id: "value",
      icon: "money",
      label: "Valor finalizado",
      value: formatCurrency(finalizedValue),
      detail: "base faturavel",
      tone: "yellow",
    },
  ];
}

export async function finalizeChecklist(row, snapshot) {
  const validationMessage = validateChecklistPayload({ ...row, status: "finalizado" }, snapshot);

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  if (row.status === "finalizado") {
    return row;
  }

  return updateEntity(
    "checklists",
    row.id,
    {
      ...row,
      status: "finalizado",
    },
    {
      action: "Finalizou",
      details: `Checklist integrado: estoque e financeiro avaliados | Valor: ${formatCurrency(row.value)}`,
      module: "Checklists",
      title: row.code,
    }
  );
}

export function exportChecklistRows(rows, snapshot) {
  exportRecordsToCsv({
    columns: CHECKLIST_EXPORT_COLUMNS,
    filename: "checklists-operacionais",
    records: rows,
    snapshot,
  });
}
